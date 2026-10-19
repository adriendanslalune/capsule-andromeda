// Le combat au tour par tour (ABATTRE ; décisions d'Adrien du 19/10/2026). Sans hasard sur les coups : l'ennemi
// annonce son prochain coup (son « intention »), le joueur y répond. Un tour :
//   1. le joueur choisit son arme (aucune, laser, torpille), l'esquive, un intercepteur (contre un missile), et la
//      cible (un module ennemi) ; les crans qui restent vont au bouclier ;
//   2. les deux camps tirent en même temps ;
//   3. l'ennemi annonce son coup suivant.
// Seule l'intention suivante est tirée au hasard (d'un hasard à graine, reproductible), parmi celles que ses modules
// encore debout lui permettent.

import {
  ARMES, BOUCLIER_ENNEMI, BOUCLIER_ENNEMI_EN_PLUS, COQUE_ENNEMI_MAX, MALUS_MISSILE, NIVEAU_RAFALE, PV_MODULES_EN_PLUS, COQUE_ENNEMI_MIN, COQUE_MAX, COUT_ESQUIVE, ENERGIE_TOTALE,
  INTERCEPTEURS, LASER_ENNEMI_MAX, TORPILLES, TOURS_REPARATION, LASER_ENNEMI_MIN, MODULES_ENNEMI, RENFORT_BOUCLIER, type Arme, type NomModuleEnnemi,
} from '../donnees/combat'
import { hasard } from './contrats'

/** Ce que l'ennemi annonce pour le tour qui vient. */
export type Intention =
  | { genre: 'laser'; degats: number }
  | { genre: 'missile'; degats: number }
  /** Un laser et un missile dans le même tour. */
  | { genre: 'rafale'; laser: number; missile: number }
  | { genre: 'bouclier' }
  | { genre: 'defense' }
  | { genre: 'charge' }

export interface EtatCombat {
  graine: number
  /** Niveau de l'ennemi, de 0 (près de la Terre) à 1 (Pluton). */
  niveau: number
  coque: number
  intercepteurs: number
  torpilles: number
  coqueEnnemi: number
  coqueEnnemiMax: number
  /** Les modules ennemis ; détruit, un module est réparé au tour `reparation`. */
  modules: { nom: NomModuleEnnemi; pv: number; pvMax: number; reparation: number | null }[]
  intention: Intention
  /** L'ennemi a chargé : son prochain tir fera le double. */
  charge: boolean
  tour: number
  degatsRecus: number
  fin: null | 'victoire' | 'retraite'
}

/** Ce que le joueur décide pour ce tour. */
export interface Ordres { arme: Arme | null; esquive: boolean; intercepteur: boolean; cible: NomModuleEnnemi }

/** Ce qui s'est passé pendant un tour (pour le raconter). */
export interface Bilan {
  notreTir: null | { arme: Arme; cible: NomModuleEnnemi; brut: number; arrete: number; degats: number; interceptee: boolean; detruit: boolean }
  sonCoup: Intention
  recus: number
  bouclier: number
  esquive: boolean
  intercepte: boolean
  doublé: boolean
  chargeAnnulee: boolean
  /** Modules ennemis réparés à la fin du tour. */
  repares: NomModuleEnnemi[]
}

/** Niveau d'un ennemi selon la zone de son système (1 pour la Terre … 60 pour Pluton). */
export function niveauDeZone(zone: number): number {
  return Math.min(1, Math.log2(Math.max(1, zone)) / Math.log2(60))
}

export function laserEnnemi(niveau: number): number {
  return Math.round(LASER_ENNEMI_MIN + (LASER_ENNEMI_MAX - LASER_ENNEMI_MIN) * niveau)
}

const enVie = (e: EtatCombat, n: NomModuleEnnemi) => e.modules.find((m) => m.nom === n)!.pv > 0

function tirage(e: EtatCombat): number {
  const h = hasard(e.graine)
  e.graine = h.graine
  return h.x
}

/** L'intention suivante de l'ennemi, parmi celles que ses modules permettent (après une charge : il attaque). */
function annoncer(e: EtatCombat): Intention {
  const l = laserEnnemi(e.niveau)
  const possibles: [Intention, number][] = []
  if (enVie(e, 'armes')) {
    const m = l - MALUS_MISSILE
    possibles.push([{ genre: 'laser', degats: l }, 4], [{ genre: 'missile', degats: m }, 2.5])
    if (e.niveau >= NIVEAU_RAFALE) possibles.push([{ genre: 'rafale', laser: l - 1, missile: m - 1 }, 1 + 2 * e.niveau])
    if (!e.charge) possibles.push([{ genre: 'charge' }, 1.2])
  }
  if (!e.charge) {
    if (enVie(e, 'bouclier')) possibles.push([{ genre: 'bouclier' }, 1.2])
    if (enVie(e, 'moteur')) possibles.push([{ genre: 'defense' }, 1.2])
  }
  if (!possibles.length) return { genre: 'defense' }
  const total = possibles.reduce((s, p) => s + p[1], 0)
  let r = tirage(e) * total
  for (const [i, poids] of possibles) if ((r -= poids) < 0) return i
  return possibles[possibles.length - 1][0]
}

export function nouveauCombat(graine: number, zone = 1): EtatCombat {
  const niveau = niveauDeZone(zone)
  const coqueEnnemiMax = Math.round(COQUE_ENNEMI_MIN + (COQUE_ENNEMI_MAX - COQUE_ENNEMI_MIN) * niveau)
  const e: EtatCombat = {
    graine, niveau, coque: COQUE_MAX, intercepteurs: INTERCEPTEURS, torpilles: TORPILLES, coqueEnnemi: coqueEnnemiMax, coqueEnnemiMax,
    modules: MODULES_ENNEMI.map((m) => { const pv = m.pv + Math.round(PV_MODULES_EN_PLUS * niveau); return { nom: m.nom, pv, pvMax: pv, reparation: null } }),
    intention: { genre: 'laser', degats: 0 }, charge: false, tour: 1, degatsRecus: 0, fin: null,
  }
  // Premier coup annoncé : jamais une charge (on découvre l'ennemi).
  do e.intention = annoncer(e)
  while (e.intention.genre === 'charge')
  return e
}

/** Crans d'énergie que coûtent ces ordres (arme et esquive) ; le reste va au bouclier. */
export function coutOrdres(o: Pick<Ordres, 'arme' | 'esquive'>): number {
  return (o.arme ? ARMES[o.arme].cout : 0) + (o.esquive ? COUT_ESQUIVE : 0)
}
export function bouclierDe(o: Pick<Ordres, 'arme' | 'esquive'>): number {
  return Math.max(0, ENERGIE_TOTALE - coutOrdres(o))
}
export function ordresPossibles(o: Pick<Ordres, 'arme' | 'esquive'>): boolean {
  return coutOrdres(o) <= ENERGIE_TOTALE
}

/** Bouclier de l'ennemi contre un laser, ce tour (0 si son module est détruit). */
export function bouclierEnnemi(e: EtatCombat): number {
  if (!enVie(e, 'bouclier')) return 0
  return BOUCLIER_ENNEMI + Math.round(BOUCLIER_ENNEMI_EN_PLUS * e.niveau) + (e.intention.genre === 'bouclier' ? RENFORT_BOUCLIER : 0)
}

/** Joue un tour avec les ordres du joueur ; renvoie son bilan (null si le combat est fini ou les ordres impossibles). */
export function jouerTour(e: EtatCombat, o: Ordres): Bilan | null {
  if (e.fin || !ordresPossibles(o) || (o.arme === 'torpille' && e.torpilles === 0)) return null
  const intention = e.intention
  const bilan: Bilan = { notreTir: null, sonCoup: intention, recus: 0, bouclier: bouclierDe(o), esquive: o.esquive, intercepte: false, doublé: false, chargeAnnulee: false, repares: [] }
  // 1. Notre tir.
  if (o.arme) {
    const a = ARMES[o.arme]
    if (o.arme === 'torpille') e.torpilles--
    const interceptee = o.arme === 'torpille' && intention.genre === 'defense'
    const arrete = o.arme === 'laser' ? Math.min(a.degats, bouclierEnnemi(e)) : 0
    const degats = interceptee ? 0 : a.degats - arrete
    const m = e.modules.find((x) => x.nom === o.cible)!
    const avant = m.pv
    m.pv = Math.max(0, m.pv - degats)
    e.coqueEnnemi = Math.max(0, e.coqueEnnemi - degats)
    bilan.notreTir = { arme: o.arme, cible: o.cible, brut: a.degats, arrete, degats, interceptee, detruit: avant > 0 && m.pv === 0 }
    if (bilan.notreTir.detruit) m.reparation = e.tour + TOURS_REPARATION
    // Ses armes touchées pendant qu'il charge : la charge est annulée.
    if (intention.genre === 'charge' && o.cible === 'armes' && degats > 0) bilan.chargeAnnulee = true
  }
  // 2. Son coup (s'il est encore là, et s'il a encore ses armes pour un tir).
  const tire = (intention.genre === 'laser' || intention.genre === 'missile' || intention.genre === 'rafale') && e.coqueEnnemi > 0 && enVie(e, 'armes')
  if (tire) {
    const facteur = e.charge ? 2 : 1
    bilan.doublé = e.charge
    e.charge = false
    const laser = intention.genre === 'laser' ? intention.degats : intention.genre === 'rafale' ? intention.laser : 0
    const missile = intention.genre === 'missile' ? intention.degats : intention.genre === 'rafale' ? intention.missile : 0
    // Le laser : arrêté cran par cran par le bouclier, ou raté grâce à l'esquive.
    if (laser) bilan.recus += Math.max(0, Math.ceil((laser * facteur) / (o.esquive ? 2 : 1)) - bilan.bouclier)
    // Le missile : guidé (ni bouclier ni esquive) ; seul un intercepteur l'arrête.
    if (missile) {
      if (o.intercepteur && e.intercepteurs > 0) { e.intercepteurs--; bilan.intercepte = true } else bilan.recus += missile * facteur
    }
    e.coque = Math.max(0, e.coque - bilan.recus)
    e.degatsRecus += bilan.recus
  }
  if (intention.genre === 'charge' && !bilan.chargeAnnulee && enVie(e, 'armes')) e.charge = true
  // 3. La fin, ou le coup suivant.
  if (e.coqueEnnemi <= 0) e.fin = 'victoire'
  else if (e.coque <= 0) e.fin = 'retraite'
  else {
    e.tour++
    // Ses modules détruits se réparent (1 point), deux tours plus tard.
    for (const m of e.modules) if (m.pv === 0 && m.reparation !== null && e.tour >= m.reparation) { m.pv = 1; m.reparation = null; bilan.repares.push(m.nom) }
    e.intention = annoncer(e)
  }
  return bilan
}

/**
 * Ce que donneraient ces ordres (sans rien jouer) : les dégâts que recevrait la capsule et ceux qu'elle infligerait.
 * Pour aider le joueur à choisir (l'ennemi a annoncé son coup : tout est connu).
 */
export function prevoir(e: EtatCombat, o: Ordres): { recus: number; inflige: number } | null {
  const copie: EtatCombat = { ...e, modules: e.modules.map((m) => ({ ...m })) }
  const b = jouerTour(copie, o)
  return b ? { recus: b.recus, inflige: b.notreTir?.degats ?? 0 } : null
}

/** Battre en retraite (la Coque de la capsule tombera en panne). */
export function retraite(e: EtatCombat): void {
  if (!e.fin) e.fin = 'retraite'
}
