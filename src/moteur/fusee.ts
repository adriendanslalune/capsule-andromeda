// La fusée C-58 : position, cap, virage, arrivée, mise en orbite, vitesse.
// La navigation se fait dans le plan de l'écliptique (x, y en UA), comme sur la carte.

import { positionLune } from '../astro/lune'
import { positionPlanete } from '../astro/planetes'
import { UA_KM } from '../astro/temps'
import { RAD } from '../astro/vecteur'
import type { NomPlanete } from '../donnees/planetes'
import {
  FACTEUR_AMELIORATION,
  FACTEUR_AVARIE,
  FACTEUR_LEVIER_A,
  GAIN_ACCELERATION,
  SEUIL_ARRIVEE,
  SEUIL_ARRIVEE_LUNE,
  TAUX_VIRAGE,
  VITESSE_BASE,
} from '../donnees/reglages'

export interface Point2 {
  x: number
  y: number
}

/** Astre où l'on peut se mettre en orbite. */
export type Astre = NomPlanete | 'Lune'

export type Destination = { type: 'astre'; astre: Astre } | { type: 'point'; x: number; y: number }

export interface EtatFusee {
  /** Position dans le plan de l'écliptique (UA). */
  position: Point2
  /** Cap (degrés) : 0° vers le point vernal (+x), sens trigonométrique. */
  cap: number
  /** Vitesse de virage du dernier pas (degrés par seconde, signée), pour l'animation. */
  virage: number
  destination: Destination | null
  /** Astre autour duquel la fusée est en orbite, ou null (en route ou à l'arrêt). */
  orbite: Astre | null
  /** Compteur de route (km) : il ne tourne que lorsqu'une destination est choisie. */
  distanceParcourue: number
}

/** Ce qui influence la vitesse (état des modules et de l'économie). */
export interface FacteursVitesse {
  ameliorations: number
  levierAAbaisse: boolean
  avarie: boolean
  accelerations: number
}

/** Vitesse de croisière (km/s). */
export function vitesse(f: FacteursVitesse): number {
  let v = VITESSE_BASE * FACTEUR_AMELIORATION ** f.ameliorations
  if (f.levierAAbaisse) v *= FACTEUR_LEVIER_A
  if (f.avarie) v *= FACTEUR_AVARIE
  return v * (1 + GAIN_ACCELERATION * f.accelerations)
}

/** Vitesse affichée (km/s) : nulle quand la fusée n'a pas de destination. */
export function vitesseAffichee(fusee: EtatFusee, f: FacteursVitesse): number {
  return fusee.destination ? vitesse(f) : 0
}

/** Position d'un astre dans le plan de l'écliptique (UA). */
export function positionAstre(astre: Astre, t: number): Point2 {
  const p = astre === 'Lune' ? positionLune(t) : positionPlanete(astre, t)
  return { x: p.x, y: p.y }
}

export function positionDestination(d: Destination, t: number): Point2 {
  return d.type === 'astre' ? positionAstre(d.astre, t) : { x: d.x, y: d.y }
}

export function distance(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Direction (degrés, 0 à 360) pour aller de a vers b. */
export function direction(a: Point2, b: Point2): number {
  return ((Math.atan2(b.y - a.y, b.x - a.x) / RAD) + 360) % 360
}

/** Écart d'angle signé de a vers b, entre −180° et 180°. */
export function ecartAngle(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180
}

/** Fusée neuve : en orbite autour de la Terre, le nez tourné vers Jupiter. */
export function creerFusee(t: number): EtatFusee {
  const terre = positionAstre('Terre', t)
  return {
    position: terre,
    cap: direction(terre, positionAstre('Jupiter', t)),
    virage: 0,
    destination: null,
    orbite: 'Terre',
    distanceParcourue: 0,
  }
}

export function choisirDestination(fusee: EtatFusee, destination: Destination): EtatFusee {
  return { ...fusee, destination }
}

/** Annule la destination : moteur coupé, la fusée s'arrête (ou reste en orbite si elle n'était pas partie). */
export function annulerDestination(fusee: EtatFusee): EtatFusee {
  return { ...fusee, destination: null }
}

/** Distance restante jusqu'à la destination (UA), ou null sans destination. */
export function distanceRestante(fusee: EtatFusee, t: number): number | null {
  return fusee.destination ? distance(fusee.position, positionDestination(fusee.destination, t)) : null
}

/**
 * Temps restant avant l'arrivée (secondes), ou null sans destination ou à l'arrêt.
 * Exact une fois le virage terminé, puisque la vitesse est comptée par rapport à la destination.
 */
export function tempsRestant(fusee: EtatFusee, t: number, vitesseKmS: number): number | null {
  const d = distanceRestante(fusee, t)
  if (d === null || vitesseKmS <= 0) return null
  const seuil = fusee.destination?.type === 'astre' && fusee.destination.astre === 'Lune' ? SEUIL_ARRIVEE_LUNE : SEUIL_ARRIVEE
  return (Math.max(0, d - seuil) * UA_KM) / vitesseKmS
}

export interface ResultatPas {
  fusee: EtatFusee
  /** Destination atteinte pendant ce pas, s'il y en a une. */
  arrivee: Destination | null
}

/**
 * Fait avancer la fusée pendant dt secondes, jusqu'à l'instant t (ms UTC).
 * La vitesse de la fusée est comptée par rapport à sa destination : la fusée est d'abord entraînée par le
 * mouvement de sa cible pendant le pas, puis elle tourne vers elle (4°/s au plus) et avance tout droit selon
 * son cap. Ainsi, la distance restante diminue exactement à la vitesse de la fusée.
 * (Règle validée par Adrien le 13/10/2026 ; dans le prototype, la vitesse était comptée par rapport au Soleil,
 * et la fusée neuve ne pouvait pas rattraper la Lune, emportée par la Terre à 30 km/s.)
 */
export function avancerFusee(fusee: EtatFusee, t: number, dt: number, vitesseKmS: number): ResultatPas {
  const dest = fusee.destination
  if (!dest) {
    // À l'arrêt ou en orbite : en orbite, la fusée suit son astre.
    const position = fusee.orbite ? positionAstre(fusee.orbite, t) : fusee.position
    return { fusee: { ...fusee, position, virage: 0 }, arrivee: null }
  }

  const cible = positionDestination(dest, t)
  const cibleAvant = positionDestination(dest, t - dt * 1000)
  const entrainee = {
    x: fusee.position.x + (cible.x - cibleAvant.x),
    y: fusee.position.y + (cible.y - cibleAvant.y),
  }
  const ecart = ecartAngle(fusee.cap, direction(entrainee, cible))
  const rotation = Math.max(-TAUX_VIRAGE * dt, Math.min(TAUX_VIRAGE * dt, ecart))
  const cap = (fusee.cap + rotation + 360) % 360
  const virage = dt > 0 ? rotation / dt : 0
  const distanceParcourue = fusee.distanceParcourue + vitesseKmS * dt
  const pas = (vitesseKmS * dt) / UA_KM

  const seuil = dest.type === 'astre' && dest.astre === 'Lune' ? SEUIL_ARRIVEE_LUNE : SEUIL_ARRIVEE
  if (distance(entrainee, cible) <= Math.max(pas, seuil)) {
    const orbite = dest.type === 'astre' ? dest.astre : null
    return {
      fusee: { position: cible, cap, virage, destination: null, orbite, distanceParcourue },
      arrivee: dest,
    }
  }

  const position = { x: entrainee.x + Math.cos(cap * RAD) * pas, y: entrainee.y + Math.sin(cap * RAD) * pas }
  return { fusee: { position, cap, virage, destination: dest, orbite: null, distanceParcourue }, arrivee: null }
}
