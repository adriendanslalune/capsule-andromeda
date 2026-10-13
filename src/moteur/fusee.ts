// La fusée C-58 : position, cap, virage, trajectoire de rencontre, arrivée, mise en orbite, vitesse.
// La navigation se fait dans le plan de l'écliptique (x, y en UA), comme sur la carte.
//
// Règles de navigation (validées par Adrien le 13/10/2026) :
// - Le mouvement est compté dans un repère : celui de la planète quand la fusée et sa destination sont dans le
//   même système (Terre → Lune, Io → Europe…), celui du Soleil sinon (Terre → Mars…).
// - Dans ce repère, la fusée vole en ligne droite, à sa vitesse, vers le point de rencontre : l'endroit où sera
//   la cible au moment où la fusée l'atteindra. Ce point est recalculé à chaque pas.

import { demiGrandAxeAutourDeLaPlanete, enUA, estPlanete, periodeOrbitale, planeteDe, positionCorps,
  rayonInfluence, type NomCorps } from '../astro/corps'
import { UA_KM } from '../astro/temps'
import { RAD } from '../astro/vecteur'
import { NOMS_PLANETES, type NomPlanete } from '../donnees/planetes'
import {
  FACTEUR_AMELIORATION,
  FACTEUR_AVARIE,
  FACTEUR_LEVIER_A,
  SEUIL_ARRIVEE,
  SEUIL_ARRIVEE_LUNE,
  TAUX_VIRAGE,
  VITESSE_BASE,
} from '../donnees/reglages'

export interface Point2 {
  x: number
  y: number
}

export type Destination = { type: 'astre'; astre: NomCorps } | { type: 'point'; x: number; y: number }

export interface EtatFusee {
  /** Position dans le plan de l'écliptique (UA). */
  position: Point2
  /** Cap (degrés) : 0° vers le point vernal (+x), sens trigonométrique. */
  cap: number
  /** Vitesse de virage du dernier pas (degrés par seconde, signée), pour l'animation. */
  virage: number
  destination: Destination | null
  /** Corps autour duquel la fusée est en orbite, ou null (en route ou à l'arrêt). */
  orbite: NomCorps | null
  /** Compteur de route (km) : il ne tourne que lorsqu'une destination est choisie. */
  distanceParcourue: number
}

/** Ce qui influence la vitesse (état des modules et de l'économie). */
export interface FacteursVitesse {
  ameliorations: number
  levierAAbaisse: boolean
  avarie: boolean
}

/** Vitesse de croisière (km/s). */
export function vitesse(f: FacteursVitesse): number {
  let v = VITESSE_BASE * FACTEUR_AMELIORATION ** f.ameliorations
  if (f.levierAAbaisse) v *= FACTEUR_LEVIER_A
  if (f.avarie) v *= FACTEUR_AVARIE
  return v
}

/** Vitesse affichée (km/s) : nulle quand la fusée n'a pas de destination. */
export function vitesseAffichee(fusee: EtatFusee, f: FacteursVitesse): number {
  return fusee.destination ? vitesse(f) : 0
}

// ---------------------------------------------------------------------------------------------------------------
// Géométrie plane

/** Position d'un corps dans le plan de l'écliptique (UA). */
export function positionAstre(nom: NomCorps, t: number): Point2 {
  const p = positionCorps(nom, t)
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

// ---------------------------------------------------------------------------------------------------------------
// Arrivée

/**
 * Distance d'arrivée (UA) : 0,002 UA pour une planète ou un point libre ; 0,0002 UA (≈ 30 000 km) pour la Lune et
 * les satellites, sans jamais dépasser le quart de la distance entre le satellite et sa planète
 * (Phobos ≈ 2 300 km).
 */
export function seuilArrivee(d: Destination): number {
  if (d.type === 'point' || estPlanete(d.astre)) return SEUIL_ARRIVEE
  return Math.min(SEUIL_ARRIVEE_LUNE, enUA(demiGrandAxeAutourDeLaPlanete(d.astre)! / 4))
}

// ---------------------------------------------------------------------------------------------------------------
// Repères

/** Système planétaire où se trouve la fusée (en orbite autour d'un de ses corps, ou dans sa sphère d'influence). */
export function systemeDeLaFusee(fusee: EtatFusee, t: number): NomPlanete | null {
  if (fusee.orbite) return planeteDe(fusee.orbite)
  let meilleure: NomPlanete | null = null
  let meilleurRapport = 1
  for (const p of NOMS_PLANETES) {
    const rapport = distance(fusee.position, positionAstre(p, t)) / rayonInfluence(p)
    if (rapport < meilleurRapport) { meilleure = p; meilleurRapport = rapport }
  }
  return meilleure
}

/** Repère du trajet : la planète si la fusée et la destination sont dans son système, sinon null (Soleil). */
export function repereDuTrajet(fusee: EtatFusee, dest: Destination, t: number): NomPlanete | null {
  if (dest.type === 'point') return null
  const systeme = systemeDeLaFusee(fusee, t)
  return systeme !== null && systeme === planeteDe(dest.astre) ? systeme : null
}

function centre(repere: NomPlanete | null, t: number): Point2 {
  return repere ? positionAstre(repere, t) : { x: 0, y: 0 }
}

// ---------------------------------------------------------------------------------------------------------------
// Trajectoire de rencontre

export interface Rencontre {
  /** Repère du trajet (planète), ou null pour le Soleil. */
  repere: NomPlanete | null
  /** Durée avant la rencontre (s), en ligne droite à la vitesse de la fusée. */
  duree: number
  /** Point visé, exprimé à l'instant présent (UA) : là où sera la cible, déplacé avec le repère. */
  point: Point2
}

/** Durée maximale cherchée pour une rencontre (s) : 300 ans. */
const HORIZON_MAX = 300 * 365.25 * 86_400

/**
 * Calcule la rencontre : la plus petite durée τ telle que la cible, à l'instant t + τ, soit à moins de v·τ de la
 * fusée (dans le repère du trajet). Renvoie null si aucune rencontre n'est possible (vitesse nulle).
 */
export function calculerRencontre(position: Point2, dest: Destination, repere: NomPlanete | null, t: number,
  vitesseKmS: number): Rencontre | null {
  const v = vitesseKmS / UA_KM // UA par seconde
  const c0 = centre(repere, t)
  const r = { x: position.x - c0.x, y: position.y - c0.y }
  const cibleRelative = (tau: number): Point2 => {
    const p = positionDestination(dest, t + tau * 1000)
    const c = centre(repere, t + tau * 1000)
    return { x: p.x - c.x, y: p.y - c.y }
  }
  const ecart = (tau: number) => distance(cibleRelative(tau), r) - v * tau

  const d0 = distance(cibleRelative(0), r)
  if (d0 === 0) return { repere, duree: 0, point: position }
  if (v <= 0) return null

  // Pas de recherche : assez fin pour suivre le mouvement de la cible dans le repère.
  let periode = Infinity
  if (dest.type === 'astre') {
    periode = periodeOrbitale(repere || estPlanete(dest.astre) ? dest.astre : planeteDe(dest.astre)) * 86_400
  }
  const directe = d0 / v
  const pas = Math.max(1, Math.min(directe / 50, periode / 72))
  let a = 0
  let b = 0
  let trouve = false
  for (let tau = pas; tau <= HORIZON_MAX; tau += pas) {
    if (ecart(tau) <= 0) { a = tau - pas; b = tau; trouve = true; break }
  }
  if (!trouve) return null
  for (let n = 0; n < 50; n++) {
    const m = (a + b) / 2
    if (ecart(m) <= 0) b = m
    else a = m
  }
  const p = cibleRelative(b)
  return { repere, duree: b, point: { x: p.x + c0.x, y: p.y + c0.y } }
}

/** Plan de vol actuel : la rencontre prévue avec la destination, ou null sans destination. */
export function planDeVol(fusee: EtatFusee, t: number, vitesseKmS: number): Rencontre | null {
  const dest = fusee.destination
  if (!dest) return null
  return calculerRencontre(fusee.position, dest, repereDuTrajet(fusee, dest, t), t, vitesseKmS)
}

/** Distance actuelle jusqu'à la destination (UA), ou null sans destination. */
export function distanceRestante(fusee: EtatFusee, t: number): number | null {
  return fusee.destination ? distance(fusee.position, positionDestination(fusee.destination, t)) : null
}

/** Temps restant avant l'arrivée (s), selon la trajectoire de rencontre ; null sans destination ou à vitesse nulle. */
export function tempsRestant(fusee: EtatFusee, t: number, vitesseKmS: number): number | null {
  if (!fusee.destination || vitesseKmS <= 0) return null
  const r = planDeVol(fusee, t, vitesseKmS)
  if (!r) return null
  return Math.max(0, r.duree - (seuilArrivee(fusee.destination) * UA_KM) / vitesseKmS)
}

// ---------------------------------------------------------------------------------------------------------------
// Création et commandes

/**
 * Fusée neuve : en orbite autour de la Terre à 400 km d'altitude, à côté de l'ISS (elle la suit), le nez tourné
 * vers Jupiter.
 */
export function creerFusee(t: number): EtatFusee {
  const depart = positionAstre('ISS', t)
  return {
    position: depart,
    cap: direction(depart, positionAstre('Jupiter', t)),
    virage: 0,
    destination: null,
    orbite: 'ISS',
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

// ---------------------------------------------------------------------------------------------------------------
// Avance

export interface ResultatPas {
  fusee: EtatFusee
  /** Destination atteinte pendant ce pas, s'il y en a une. */
  arrivee: Destination | null
}

/**
 * Fait avancer la fusée pendant dt secondes, jusqu'à l'instant t (ms UTC) : la fusée est entraînée par son
 * repère (la planète du système, ou rien pour le Soleil), tourne vers le point de rencontre (4°/s au plus),
 * puis avance tout droit selon son cap.
 */
export function avancerFusee(fusee: EtatFusee, t: number, dt: number, vitesseKmS: number): ResultatPas {
  const dest = fusee.destination
  if (!dest) {
    // À l'arrêt ou en orbite : en orbite, la fusée suit son astre.
    const position = fusee.orbite ? positionAstre(fusee.orbite, t) : fusee.position
    return { fusee: { ...fusee, position, virage: 0 }, arrivee: null }
  }

  const repere = repereDuTrajet(fusee, dest, t - dt * 1000)
  const c = centre(repere, t)
  const cAvant = centre(repere, t - dt * 1000)
  const entrainee = { x: fusee.position.x + (c.x - cAvant.x), y: fusee.position.y + (c.y - cAvant.y) }
  const distanceParcourue = fusee.distanceParcourue + vitesseKmS * dt
  const pas = (vitesseKmS * dt) / UA_KM

  const cible = positionDestination(dest, t)
  const arrive = distance(entrainee, cible) <= Math.max(pas, seuilArrivee(dest))
  // À l'arrivée, la fusée finit de tourner vers la cible elle-même ; sinon, vers le point de rencontre.
  const rencontre = arrive ? null : calculerRencontre(entrainee, dest, repere, t, vitesseKmS)
  const vise = rencontre ? rencontre.point : cible
  const ecart = ecartAngle(fusee.cap, direction(entrainee, vise))
  const rotation = Math.max(-TAUX_VIRAGE * dt, Math.min(TAUX_VIRAGE * dt, ecart))
  const cap = (fusee.cap + rotation + 360) % 360
  const virage = dt > 0 ? rotation / dt : 0
  if (arrive) {
    const orbite = dest.type === 'astre' ? dest.astre : null
    return { fusee: { position: cible, cap, virage, destination: null, orbite, distanceParcourue }, arrivee: dest }
  }
  const position = { x: entrainee.x + Math.cos(cap * RAD) * pas, y: entrainee.y + Math.sin(cap * RAD) * pas }
  return { fusee: { position, cap, virage, destination: dest, orbite: null, distanceParcourue }, arrivee: null }
}
