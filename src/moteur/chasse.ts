// Chasse au visiteur : chaque mois (saison), un visiteur extraterrestre parcourt le système solaire selon une
// trajectoire identique pour tous les joueurs. Indices : ping radio (écho après l'aller-retour de la lumière),
// bulletins de l'Observatoire, transmissions, télescope TEL, détecteur DET. Contact à moins de 0,01 UA.

import { delaiLumiere } from '../astro/lumiere'
import { positionPlanete } from '../astro/planetes'
import { AUTEURS_TRANSMISSIONS, CHASSE as C } from '../donnees/chasse'
import { NOMS_PLANETES } from '../donnees/planetes'
import { crediter, estInstalle } from './economie'
import type { EtatPartie } from './etat'
import { direction, distance, type Point2 } from './fusee'
import { choisirAuHasard, entierAuHasard, mulberry32, type Hasard } from './hasard'

const HEURE = 3_600_000

// ---------------------------------------------------------------------------------------------------------------
// Saisons

/** Numéro de la saison de l'instant t : nombre de mois écoulés depuis janvier 2026 (janvier 2026 = 0). */
export function numeroSaison(t: number): number {
  const d = new Date(t)
  return (d.getUTCFullYear() - C.anneeDepart) * 12 + d.getUTCMonth()
}

/** Début de la saison n (1er du mois, 00:00 UTC). */
export function debutSaison(n: number): number {
  return Date.UTC(C.anneeDepart, n, 1)
}

/** Fin de la saison n (1er du mois suivant, 00:00 UTC). */
export function finSaison(n: number): number {
  return debutSaison(n + 1)
}

// ---------------------------------------------------------------------------------------------------------------
// Trajectoire

type Segment =
  | { type: 'escale'; planete: number; t0: number; t1: number }
  | { type: 'voyage'; de: number; vers: number; t0: number; t1: number }

const position2D = (planete: number, t: number): Point2 => {
  const p = positionPlanete(NOMS_PLANETES[planete], t)
  return { x: p.x, y: p.y }
}

const trajets = new Map<number, Segment[]>()

/**
 * Trajectoire de la saison n (la même pour tous les joueurs, graine n × 7919 + 13) : première escale près d'une
 * planète tirée entre Mercure et Saturne ; escales de 16 à 30 heures ; voyage vers la planète la plus proche hors de
 * ses deux dernières escales, en ligne droite à 0,06 UA/h (6 heures au moins).
 */
export function trajetSaison(n: number): Segment[] {
  const deja = trajets.get(n)
  if (deja) return deja
  const r = mulberry32(n * C.graineMultiplicateur + C.graineDecalage)
  const fin = finSaison(n) + C.margeJours * 86_400_000
  const segments: Segment[] = []
  const historique: number[] = []
  let p = Math.floor(r() * C.planetesVisitees)
  let t = debutSaison(n)
  while (t < fin) {
    const escale = (C.escaleMinHeures + r() * (C.escaleMaxHeures - C.escaleMinHeures)) * HEURE
    segments.push({ type: 'escale', planete: p, t0: t, t1: t + escale })
    t += escale
    historique.push(p)
    const depart = position2D(p, t)
    let suivante = -1
    let meilleure = Infinity
    for (let i = 0; i < C.planetesVisitees; i++) {
      if (historique.slice(-2).includes(i)) continue
      const d = distance(depart, position2D(i, t))
      if (d < meilleure) { meilleure = d; suivante = i }
    }
    const duree = Math.max(C.voyageMinHeures, meilleure / C.vitesseUAParHeure) * HEURE
    segments.push({ type: 'voyage', de: p, vers: suivante, t0: t, t1: t + duree })
    t += duree
    p = suivante
  }
  trajets.set(n, segments)
  return segments
}

export interface PositionVisiteur extends Point2 {
  /** Planète de l'escale en cours (nom), ou null pendant un voyage. */
  escale: string | null
}

/** Position du visiteur à l'instant t (plan de l'écliptique, UA). */
export function positionVisiteur(t: number): PositionVisiteur {
  for (const g of trajetSaison(numeroSaison(t))) {
    if (t < g.t0 || t >= g.t1) continue
    if (g.type === 'escale') {
      const q = position2D(g.planete, t)
      const a = (t / HEURE / C.periodeEscaleHeures) * 2 * Math.PI
      return { x: q.x + C.rayonEscale * Math.cos(a), y: q.y + C.rayonEscale * Math.sin(a), escale: NOMS_PLANETES[g.planete] }
    }
    const A = position2D(g.de, g.t0)
    const B = position2D(g.vers, g.t1)
    const f = (t - g.t0) / (g.t1 - g.t0)
    return { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, escale: null }
  }
  const q = position2D(0, t)
  return { ...q, escale: NOMS_PLANETES[0] }
}

// ---------------------------------------------------------------------------------------------------------------
// État de la chasse du joueur

export interface Indice {
  t: number
  texte: string
}

export interface EtatChasse {
  /** Fréquence de la radio (pour le ping). */
  frequenceRadio: number
  /** Échos attendus : instant de retour et durée de l'aller-retour (ms). */
  pings: { retour: number; duree: number }[]
  /** Radio disponible à partir de cet instant (ms UTC). */
  radioPrete: number
  /** Position de la fusée au dernier ping (pour tracer le cercle sur la carte). */
  dernierPing: Point2 | null
  /** Télescope disponible à partir de cet instant (ms UTC). */
  telescopePret: number
  /** Position de la fusée et direction lue à la dernière visée du télescope (pour tracer la droite). */
  derniereVisee: (Point2 & { direction: number | null }) | null
  /** Dernier bulletin de l'Observatoire et dernière transmission reçus (numéros de créneau). */
  bulletin: number
  transmission: number
  /** Saisons où le contact a été établi. */
  contacts: number[]
  /** Indices reçus, le plus récent en premier. */
  indices: Indice[]
}

export function creerChasse(t: number): EtatChasse {
  return {
    frequenceRadio: C.frequenceRadioDepart,
    pings: [],
    radioPrete: t,
    dernierPing: null,
    telescopePret: t,
    derniereVisee: null,
    // Pas de bulletin ni de transmission en retard au premier lancement.
    bulletin: Math.floor(t / (C.bulletinHeures * HEURE)),
    transmission: Math.floor(t / (C.transmissionHeures * HEURE)),
    contacts: [],
    indices: [],
  }
}

export interface ResultatChasse {
  etat: EtatPartie
  messages: string[]
}

const chiffre = (x: number, d: number) => x.toFixed(d).replace('.', ',')

function avecIndice(e: EtatPartie, t: number, texte: string): EtatPartie {
  const indices = [{ t, texte }, ...e.chasse.indices].slice(0, C.indicesGardes)
  return { ...e, chasse: { ...e.chasse, indices } }
}

/** Durée d'un écho, en clair : « 1 H 23 MIN 05 S ». */
export function dureeEcho(ms: number): string {
  const s = Math.round(ms / 1000)
  const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60
  return `${h ? `${h} H ` : ''}${mi} MIN ${String(se).padStart(2, '0')} S`
}

/** Règle la fréquence de la radio (au centième, de 0 à 12). */
export function reglerRadio(etat: EtatPartie, ecart: number): EtatPartie {
  const f = Math.max(0, Math.min(12, Math.round((etat.chasse.frequenceRadio + ecart) * 100) / 100))
  return { ...etat, chasse: { ...etat.chasse, frequenceRadio: f } }
}

/**
 * Ping radio. Recharge de 5 minutes. Sur 7,13 (± 0,05), un écho reviendra après l'aller-retour de la lumière entre la
 * fusée et le visiteur ; sur une autre fréquence, aucun écho.
 */
export function ping(etat: EtatPartie, t: number): ResultatChasse {
  const c = etat.chasse
  if (t < c.radioPrete) return { etat, messages: ['RADIO EN RECHARGE.'] }
  const f = chiffre(c.frequenceRadio, 2)
  let e: EtatPartie = {
    ...etat,
    chasse: { ...c, radioPrete: t + C.rechargePingMinutes * 60_000, dernierPing: { ...etat.fusee.position } },
  }
  if (Math.abs(c.frequenceRadio - C.frequencePing) > C.toleranceFrequence + 1e-9) {
    return { etat: e, messages: [`PING ÉMIS SUR ${f}.`, `AUCUN ÉCHO SUR ${f}.`] }
  }
  const d = distance(etat.fusee.position, positionVisiteur(t))
  const duree = 2 * delaiLumiere(d) * 1000
  e = { ...e, chasse: { ...e.chasse, pings: [...e.chasse.pings, { retour: t + duree, duree }] } }
  return { etat: e, messages: ['PING ÉMIS SUR 7,13. ÉCOUTE EN COURS…'] }
}

/**
 * Télescope TEL (s'il est installé). Recharge de 30 minutes. Si le visiteur est à moins de 3 UA : sa direction à
 * ± 3° près ; sinon, rien.
 */
export function viserTelescope(etat: EtatPartie, t: number, hasard: Hasard): ResultatChasse {
  if (!estInstalle(etat, 'TEL')) return { etat, messages: [] }
  const c = etat.chasse
  if (t < c.telescopePret) return { etat, messages: ['TÉLESCOPE EN RECHARGE.'] }
  const v = positionVisiteur(t)
  const pos = etat.fusee.position
  const base = { ...c, telescopePret: t + C.rechargeTelescopeMinutes * 60_000 }
  if (distance(pos, v) > C.porteeTelescope) {
    const e = avecIndice({ ...etat, chasse: { ...base, derniereVisee: { ...pos, direction: null } } }, t, 'TÉLESCOPE : RIEN À MOINS DE 3 UA.')
    return { etat: e, messages: ['TÉLESCOPE : RIEN DANS LA PORTÉE.'] }
  }
  const a = Math.round((direction(pos, v) + (hasard() * 2 - 1) * C.erreurTelescopeDegres + 360) % 360) % 360
  const e = avecIndice({ ...etat, chasse: { ...base, derniereVisee: { ...pos, direction: a } } }, t, `VISÉE : ${a}°.`)
  return { etat: e, messages: [`TÉLESCOPE : OBJET VISÉ À ${a}°.`] }
}

/** Distance du visiteur si le détecteur DET est installé et qu'il est à moins de 1,5 UA ; sinon null. */
export function visiteurDetecte(etat: EtatPartie, t: number): number | null {
  if (!estInstalle(etat, 'DET')) return null
  const d = distance(etat.fusee.position, positionVisiteur(t))
  return d <= C.porteeDetecteur ? d : null
}

/** Planète la plus proche d'un point (parmi les 8). */
function planeteLaPlusProche(p: Point2, t: number): string {
  let meilleure = 0
  let dMin = Infinity
  NOMS_PLANETES.forEach((_, i) => {
    const d = distance(p, position2D(i, t))
    if (d < dMin) { dMin = d; meilleure = i }
  })
  return NOMS_PLANETES[meilleure]
}

/**
 * Fait vivre la chasse à l'instant t : échos qui reviennent, bulletin de l'Observatoire (toutes les 6 h, sur la
 * position du visiteur 6 h plus tôt), transmissions (toutes les 8 h), contact (moins de 0,01 UA, une fois par saison).
 * Après une longue absence, un seul bulletin et une seule transmission : les plus récents.
 */
export function evoluerChasse(etat: EtatPartie, t: number): ResultatChasse {
  let e = etat
  const messages: string[] = []

  // Échos.
  const revenus = e.chasse.pings.filter((p) => t >= p.retour)
  if (revenus.length) {
    e = { ...e, chasse: { ...e.chasse, pings: e.chasse.pings.filter((p) => t < p.retour) } }
    for (const p of revenus) {
      const m = `ÉCHO REÇU APRÈS ${dureeEcho(p.duree)}.`
      messages.push(m)
      e = avecIndice(e, t, m)
    }
  }

  // Bulletin de l'Observatoire.
  const b = Math.floor(t / (C.bulletinHeures * HEURE))
  if (b > e.chasse.bulletin) {
    const v = positionVisiteur(b * C.bulletinHeures * HEURE - C.bulletinHeures * HEURE)
    const m = v.escale
      ? `OBSERVATOIRE : LES LUNES DE ${v.escale.toUpperCase()} SONT PERTURBÉES.`
      : 'OBSERVATOIRE : AUCUNE PERTURBATION NOTABLE.'
    e = avecIndice({ ...e, chasse: { ...e.chasse, bulletin: b } }, t, m)
    messages.push(m)
  }

  // Transmissions.
  const tr = Math.floor(t / (C.transmissionHeures * HEURE))
  if (tr > e.chasse.transmission) {
    const r = mulberry32(tr * C.transmissionMultiplicateur + C.transmissionDecalage)
    const v = positionVisiteur(t)
    const planete = r() < 0.5 ? planeteLaPlusProche(v, t) : NOMS_PLANETES[entierAuHasard(r, NOMS_PLANETES.length)]
    const qui = choisirAuHasard(r, AUTEURS_TRANSMISSIONS)
    const m = `${qui} SIGNALE UNE LUEUR PRÈS DE ${planete.toUpperCase()}.`
    e = avecIndice({ ...e, chasse: { ...e.chasse, transmission: tr } }, t, m)
    messages.push(m)
  }

  // Contact.
  const n = numeroSaison(t)
  if (!e.chasse.contacts.includes(n) && distance(e.fusee.position, positionVisiteur(t)) < C.distanceContact) {
    e = crediter({ ...e, chasse: { ...e.chasse, contacts: [...e.chasse.contacts, n] } }, C.primeContact, `Contact, saison ${n}`, t)
    if (!e.trophees.includes('contact')) e = { ...e, trophees: [...e.trophees, 'contact'] }
    const m = `CONTACT ÉTABLI AVEC LE VISITEUR DE LA SAISON ${n} !`
    e = avecIndice(e, t, 'CONTACT ÉTABLI.')
    messages.push(m)
  }
  return { etat: e, messages }
}
