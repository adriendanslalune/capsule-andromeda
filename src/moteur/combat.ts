// Le combat en vue tactique (étape 6, prototype à tester dans un simulateur). La capsule contre un chasseur alien :
//   - le joueur répartit 6 crans d'énergie entre boucliers, armes et moteurs ;
//   - il vise un module ennemi et tire (recharge plus rapide avec plus d'armes) ; le bouclier ennemi arrête un tir
//     sur deux sur les autres modules tant qu'il tient ; détruire le réacteur, ou désarmer le chasseur, c'est gagner ;
//   - le canon ennemi tire régulièrement (les boucliers arrêtent, les moteurs font esquiver) ; ses missiles mettent
//     10 s à arriver (décompte) et s'interceptent ;
//   - on peut fuir (plus vite avec plus de moteurs). Pas de game over : coque à zéro, la capsule bat en retraite.
// Tout est réglé par l'heure passée en paramètre et un hasard à graine : reproductible.

import {
  COQUE_MAX, DEGATS_CANON_ENNEMI, DEGATS_MISSILE, DUREE_FUITE, ENERGIE_TOTALE, ESQUIVE_PAR_CRAN, INTERCEPTEURS,
  INTERVALLE_CANON_ENNEMI, INTERVALLE_MISSILES, MAX_PAR_SYSTEME, MODULES_ENNEMI, PART_BOUCLIER_PAR_CRAN, RECHARGE_CANON,
  VOL_MISSILE, type Energie, type NomModuleEnnemi, type SystemeEnergie,
} from '../donnees/combat'
import { hasard } from './contrats'

export interface EtatCombat {
  graine: number
  energie: Energie
  coque: number
  intercepteurs: number
  modules: { nom: NomModuleEnnemi; pv: number; pvMax: number }[]
  /** Missiles en vol : lancement et impact (ms). */
  missiles: { lance: number; impact: number }[]
  prochainTirEnnemi: number
  prochainMissile: number
  /** Le canon de la capsule est rechargé à partir de cet instant. */
  rechargeJusqua: number
  /** En fuite : la capsule sera partie à cet instant. */
  fuiteJusqua: number | null
  fin: null | 'victoire' | 'retraite' | 'fuite'
}

export type EvenementCombat =
  | { genre: 'missile-lance' } | { genre: 'impact-missile' } | { genre: 'tir-ennemi'; issue: 'touche' | 'arrete' | 'esquive' }
  | { genre: 'fin'; fin: 'victoire' | 'retraite' | 'fuite' }

export function nouveauCombat(graine: number, energie: Energie, t: number): EtatCombat {
  return {
    graine, energie: { ...energie }, coque: COQUE_MAX, intercepteurs: INTERCEPTEURS,
    modules: MODULES_ENNEMI.map((m) => ({ nom: m.nom, pv: m.pv, pvMax: m.pv })),
    missiles: [], prochainTirEnnemi: t + 3000, prochainMissile: t + 5000, rechargeJusqua: t, fuiteJusqua: null, fin: null,
  }
}

function tirage(e: EtatCombat): number {
  const h = hasard(e.graine)
  e.graine = h.graine
  return h.x
}

const enVie = (e: EtatCombat, n: NomModuleEnnemi) => e.modules.find((m) => m.nom === n)!.pv > 0

/** Total des crans répartis. */
export function crans(en: Energie): number {
  return en.boucliers + en.armes + en.moteurs
}

/** Ajoute ou retire un cran à un système (dans les limites). Renvoie vrai si c'est fait. */
export function repartir(en: Energie, s: SystemeEnergie, d: 1 | -1): boolean {
  const v = en[s] + d
  if (v < 0 || v > MAX_PAR_SYSTEME || (d > 0 && crans(en) >= ENERGIE_TOTALE)) return false
  en[s] = v
  return true
}

/** Fait avancer le combat jusqu'à l'instant t (tirs ennemis, missiles, fuite), dans l'ordre où les choses arrivent. */
export function avancerCombat(e: EtatCombat, t: number): EvenementCombat[] {
  const ev: EvenementCombat[] = []
  while (!e.fin) {
    const prochains: [number, string][] = []
    if (enVie(e, 'canon')) prochains.push([e.prochainTirEnnemi, 'tir'])
    if (enVie(e, 'missiles')) prochains.push([e.prochainMissile, 'missile'])
    for (const m of e.missiles) prochains.push([m.impact, 'impact'])
    if (e.fuiteJusqua !== null) prochains.push([e.fuiteJusqua, 'fuite'])
    prochains.sort((a, b) => a[0] - b[0])
    const [quand, quoi] = prochains[0] ?? [Infinity, '']
    if (quand > t) break
    if (quoi === 'fuite') { e.fin = 'fuite'; ev.push({ genre: 'fin', fin: 'fuite' }); break }
    if (quoi === 'missile') {
      e.missiles.push({ lance: quand, impact: quand + VOL_MISSILE })
      e.prochainMissile = quand + INTERVALLE_MISSILES
      ev.push({ genre: 'missile-lance' })
    } else if (quoi === 'impact') {
      e.missiles = e.missiles.filter((m) => m.impact !== quand)
      e.coque = Math.max(0, e.coque - DEGATS_MISSILE)
      ev.push({ genre: 'impact-missile' })
    } else {
      e.prochainTirEnnemi = quand + INTERVALLE_CANON_ENNEMI
      const x = tirage(e)
      const issue = x < e.energie.moteurs * ESQUIVE_PAR_CRAN ? 'esquive'
        : x < e.energie.moteurs * ESQUIVE_PAR_CRAN + e.energie.boucliers * PART_BOUCLIER_PAR_CRAN ? 'arrete' : 'touche'
      if (issue === 'touche') e.coque = Math.max(0, e.coque - DEGATS_CANON_ENNEMI)
      ev.push({ genre: 'tir-ennemi', issue })
    }
    if (e.coque === 0) { e.fin = 'retraite'; ev.push({ genre: 'fin', fin: 'retraite' }) }
  }
  return ev
}

/** Le canon de la capsule est-il prêt à tirer ? */
export function pretATirer(e: EtatCombat, t: number): boolean {
  return !e.fin && e.energie.armes > 0 && t >= e.rechargeJusqua
}

/** Tirer sur un module ennemi. */
export function tirer(e: EtatCombat, cible: NomModuleEnnemi, t: number): 'impossible' | 'deja-detruit' | 'arrete' | 'touche' | 'detruit' {
  avancerCombat(e, t)
  if (!pretATirer(e, t)) return 'impossible'
  const m = e.modules.find((x) => x.nom === cible)!
  if (m.pv === 0) return 'deja-detruit'
  e.rechargeJusqua = t + RECHARGE_CANON / e.energie.armes
  if (cible !== 'bouclier' && enVie(e, 'bouclier') && tirage(e) < 0.5) return 'arrete'
  m.pv--
  if (!enVie(e, 'reacteur') || (!enVie(e, 'canon') && !enVie(e, 'missiles'))) { e.fin = 'victoire'; e.missiles = [] }
  return m.pv === 0 ? 'detruit' : 'touche'
}

/** Intercepter le missile le plus proche de l'impact. */
export function intercepter(e: EtatCombat, t: number): boolean {
  avancerCombat(e, t)
  if (e.fin || e.intercepteurs === 0 || !e.missiles.length) return false
  const premier = e.missiles.reduce((a, b) => (b.impact < a.impact ? b : a))
  e.missiles = e.missiles.filter((m) => m !== premier)
  e.intercepteurs--
  return true
}

/** Fuir : la capsule part au bout d'un moment (plus vite avec plus de moteurs ; impossible sans moteurs). */
export function fuir(e: EtatCombat, t: number): boolean {
  avancerCombat(e, t)
  if (e.fin || e.fuiteJusqua !== null || e.energie.moteurs === 0) return false
  e.fuiteJusqua = t + DUREE_FUITE / e.energie.moteurs
  return true
}
