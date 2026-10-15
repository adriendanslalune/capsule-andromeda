// La fusée C-58 : position, cap, virage, trajectoire de rencontre, arrivée, mise en orbite, vitesse.
// La navigation se fait dans le plan de l'écliptique (x, y en UA), comme sur la carte.
//
// Règles de navigation (validées par Adrien le 13/10/2026) :
// - Le mouvement est compté dans un repère : celui de la planète quand la fusée et sa destination sont dans le
//   même système (Terre → Lune, Io → Europe…), celui du Soleil sinon (Terre → Mars…).
// - Dans ce repère, la fusée vole en ligne droite, à sa vitesse, vers le point de rencontre : l'endroit où sera
//   la cible au moment où la fusée l'atteindra. Ce point est recalculé à chaque pas (donc aussi quand la vitesse
//   change : amélioration, avarie…).
// - Depuis une orbite, la machine propose deux départs : maintenant, ou à la fenêtre de tir (le moment de départ
//   qui fait arriver le plus tôt, la fusée attendant en orbite). Le joueur choisit.

import { corpsDuSysteme, enUA, estPlanete, periodeOrbitale, planeteDe,
  positionCorps, rayonCorps, rayonInfluence, systemeDuCorps, type NomCorps } from '../astro/corps'
import { UA_KM } from '../astro/temps'
import { RAD, type Vecteur3 } from '../astro/vecteur'
import { CHASSE } from '../donnees/chasse'
import { NOMS_PLANETES, type NomPlanete } from '../donnees/planetes'
import {
  FACTEUR_AMELIORATION,
  FACTEUR_AVARIE,
  FACTEUR_LEVIER_A,
  DUREE_ACCELERATION,
  ORBITE_RAYONS,
  RAYON_INCONNU_KM,
  SEUIL_ARRIVEE_POINT_KM,
  SEUIL_ARRIVEE_SOLEIL,
  TAUX_VIRAGE,
  TAUX_VIRAGE_DEPART,
  ALTITUDE_SECURITE_KM,
  DEPART_AU_DESSUS_ISS_KM,
  MANOEUVRE_DEPART,
  VITESSE_BASE,
  SEUIL_ARRIVEE_ENGIN_KM,
} from '../donnees/reglages'
import { escaleDuJour, positionVisiteur } from './visiteur'
import { approcheEngin, estEngin } from '../astro/engins'
import { approcheEnginKm } from '../donnees/engins'

export interface Point2 {
  x: number
  y: number
}

/**
 * Destination : un astre, un point libre, ou le visiteur (approche finale, possible seulement à proximité ; on note
 * l'astre de son escale au moment où l'approche commence).
 */
export type Destination =
  | { type: 'astre'; astre: NomCorps }
  | { type: 'point'; x: number; y: number }
  | { type: 'visiteur'; astre: NomCorps }

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
  /** Compteur de route (km) : il ne tourne que lorsque la fusée vole vers une destination. */
  distanceParcourue: number
  /** Fenêtre de tir choisie : la fusée attend en orbite jusqu'au départ prévu ; null = départ immédiat. */
  fenetre: FenetreDeTir | null
  /** Fusée stationnée à côté du visiteur (en orbite autour de son astre, à environ 200 m de lui). */
  presDuVisiteur: boolean
  /**
   * Hauteur au-dessus du plan de l'écliptique (UA), en route : celle de l'astre quitté au départ, puis elle rejoint
   * peu à peu celle de la destination. Sert à la vue 3D ; absente des anciennes sauvegardes (0).
   */
  z?: number
  /** Trajet en cours (pour l'affichage) : d'où et quand la fusée est partie ; absent hors trajet. */
  trajet?: Trajet
  /** Moteur coupé par le joueur (bouton MOTEUR) : la fusée ralentit jusqu'à l'arrêt, sa destination est gardée. */
  moteurCoupe?: boolean
  /**
   * Vitesse du moment (km/s) : elle monte vers la vitesse de croisière, ou descend vers 0, linéairement, en
   * 20 s depuis l'arrêt ou depuis la croisière. Absente des anciennes sauvegardes (la fusée était à sa croisière).
   */
  vitesseCourante?: number
  /**
   * En orbite : où la fusée se tient par rapport au centre de son astre (UA, avec la hauteur), c'est-à-dire là où
   * elle est arrivée. Elle y reste, et repart de là. Absent au départ de la partie (à côté de l'ISS).
   */
  ecartOrbite?: { x: number; y: number; z: number }
  /** En orbite : l'engin qu'elle accompagne (au départ de la partie, l'ISS) ; son écart d'orbite le suit. */
  suit?: NomCorps
}

export interface Trajet {
  /** Destination du trajet (pour savoir s'il a changé). */
  vers: string
  /** Astre quitté, ou null si la fusée est partie d'un point libre ou a changé de cap en vol. */
  origine: NomCorps | null
  /** Instant du départ (ms UTC). */
  depart: number
  /** Compteur de route au départ (km). */
  kmAuDepart: number
  /** Manœuvre de départ : instant où la fusée s'est trouvée tournée vers sa destination (début de l'accélération). */
  aligne?: number
}

/** Phase de la manœuvre de départ : recul, virage, accélération douce, ou aucune (croisière, ou départ d'un point libre). */
export type PhaseDepart = 'recul' | 'virage' | 'acceleration' | null

/** Phase de la manœuvre de départ à l'instant t, et le temps écoulé dans cette phase (s). */
export function phaseDepart(fusee: EtatFusee, t: number): { phase: PhaseDepart; duree: number } {
  const M = MANOEUVRE_DEPART
  if (!fusee.destination || fusee.moteurCoupe) return { phase: null, duree: 0 }
  // Encore en orbite : la manœuvre commence (ou commencera à la fenêtre de tir).
  if (fusee.orbite) return { phase: 'recul', duree: 0 }
  const tr = fusee.trajet
  if (!tr || tr.origine === null) return { phase: null, duree: 0 }
  const tau = (t - tr.depart) / 1000
  if (tr.aligne === undefined) return tau < M.reculS ? { phase: 'recul', duree: tau } : { phase: 'virage', duree: tau - M.reculS }
  const ta = (t - tr.aligne) / 1000
  return ta < M.accelerationS ? { phase: 'acceleration', duree: Math.max(0, ta) } : { phase: null, duree: 0 }
}

/** Distance parcourue (en secondes de croisière) après ta secondes d'accélération douce. */
function parcoursAcceleration(ta: number): number {
  const T = MANOEUVRE_DEPART.accelerationS
  return ta < T ? ta ** 3 / (3 * T * T) : T / 3 + (ta - T)
}

/** Avancement du trajet en cours (0 au départ, 1 à l'arrivée), d'après la route faite et la distance restante. */
export function avancementTrajet(fusee: EtatFusee, t: number): number | null {
  if (!fusee.destination || !fusee.trajet || enAttenteDeFenetre(fusee)) return null
  const fait = fusee.distanceParcourue - fusee.trajet.kmAuDepart
  const reste = Math.max(0, (distanceRestante(fusee, t) ?? 0) * UA_KM - seuilArrivee(fusee.destination) * UA_KM)
  return fait + reste > 0 ? Math.min(1, fait / (fait + reste)) : 0
}

export interface FenetreDeTir {
  /** Instant du départ prévu (ms UTC). */
  depart: number
  /** Vitesse (km/s) pour laquelle la fenêtre a été calculée ; si la vitesse change, on la recalcule. */
  vitesse: number
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

/** Vitesse affichée (km/s) : nulle quand la fusée n'a pas de destination ou attend sa fenêtre de tir. */
export function vitesseAffichee(fusee: EtatFusee, f: FacteursVitesse): number {
  return fusee.destination && !enAttenteDeFenetre(fusee) ? vitesse(f) : 0
}

/** Allume ou coupe le moteur. */
export function basculerMoteur(fusee: EtatFusee): EtatFusee {
  return { ...fusee, moteurCoupe: !fusee.moteurCoupe }
}

/** Vitesse du moment (km/s) : 0 sans destination, en orbite ou en attente ; sinon celle de la rampe. */
export function vitesseDuMoment(fusee: EtatFusee, croisiere: number): number {
  if (!fusee.destination || fusee.orbite) return 0
  return fusee.vitesseCourante ?? croisiere
}

/**
 * Fait évoluer la vitesse pendant dt secondes, de v0 vers la cible, linéairement : il faut 20 s pour aller de
 * l'arrêt à la croisière (ou l'inverse). Renvoie la vitesse à la fin du pas et la vitesse moyenne pendant le pas.
 */
export function rampeVitesse(v0: number, cible: number, croisiere: number, dt: number): { fin: number; moyenne: number } {
  const taux = Math.max(croisiere, v0) / DUREE_ACCELERATION
  if (taux <= 0 || dt <= 0 || v0 === cible) return { fin: cible, moyenne: dt > 0 ? (v0 + cible) / 2 : cible }
  const duree = Math.abs(cible - v0) / taux
  if (duree >= dt) {
    const fin = v0 + Math.sign(cible - v0) * taux * dt
    return { fin, moyenne: (v0 + fin) / 2 }
  }
  return { fin: cible, moyenne: (((v0 + cible) / 2) * duree + cible * (dt - duree)) / dt }
}

/** Vrai si la fusée attend en orbite sa fenêtre de tir. */
export function enAttenteDeFenetre(fusee: EtatFusee): boolean {
  return fusee.destination !== null && fusee.fenetre !== null
}

// ---------------------------------------------------------------------------------------------------------------
// Géométrie plane

/** Position d'un corps dans le plan de l'écliptique (UA). */
export function positionAstre(nom: NomCorps, t: number): Point2 {
  const p = positionCorps(nom, t)
  return { x: p.x, y: p.y }
}

export function positionDestination(d: Destination, t: number): Point2 {
  if (d.type === 'astre') return positionAstre(d.astre, t)
  if (d.type === 'visiteur') { const v = positionVisiteur(t); return { x: v.x, y: v.y } }
  return { x: d.x, y: d.y }
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
 * Distance d'arrivée (UA) : 0,002 UA pour une planète, 1 000 km pour un point libre ; 0,0002 UA (≈ 30 000 km) pour la Lune et
 * les satellites, sans jamais dépasser le quart de la distance entre le satellite et sa planète
 * (Phobos ≈ 2 300 km).
 */
export function seuilArrivee(d: Destination): number {
  if (d.type === 'visiteur') return enUA(CHASSE.distanceApprocheKm)
  if (d.type === 'point') return enUA(SEUIL_ARRIVEE_POINT_KM)
  if (d.astre === 'Soleil') return SEUIL_ARRIVEE_SOLEIL
  if (estEngin(d.astre)) return enUA(SEUIL_ARRIVEE_ENGIN_KM)
  // L'ISS : comme un engin ; les autres astres : orbite à trois rayons.
  if (d.astre === 'ISS') return enUA(SEUIL_ARRIVEE_ENGIN_KM)
  return enUA(ORBITE_RAYONS * (rayonCorps(d.astre) ?? RAYON_INCONNU_KM))
}

// ---------------------------------------------------------------------------------------------------------------
// Repères

/** Système planétaire où se trouve la fusée (en orbite autour d'un de ses corps, ou dans sa sphère d'influence). */
export function systemeDeLaFusee(fusee: EtatFusee, t: number): NomPlanete | null {
  // Autour du Soleil, on n'est dans aucun système planétaire ; auprès d'un engin, on est là où il se trouve.
  if (fusee.orbite && !estEngin(fusee.orbite)) return fusee.orbite === 'Soleil' ? null : planeteDe(fusee.orbite)
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
  if (dest.type === 'point' || dest.astre === 'Soleil') return null
  const systeme = systemeDeLaFusee(fusee, t)
  return systeme !== null && systeme === systemeDuCorps(dest.astre, t) ? systeme : null
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
  if (dest.type !== 'point' && dest.astre !== 'Soleil') {
    // Un engin vu de loin bouge comme sa planète (Hubble autour de la Terre) ; de près, à son propre rythme.
    const lui = estEngin(dest.astre) ? (repere ? dest.astre : systemeDuCorps(dest.astre, t) ?? dest.astre)
      : repere || estPlanete(dest.astre) ? dest.astre : planeteDe(dest.astre)
    periode = periodeOrbitale(lui) * 86_400
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

/** Rencontre si la fusée, en orbite, quitte son astre à l'instant td. */
function rencontreDepuisOrbite(fusee: EtatFusee, dest: Destination, td: number, vitesseKmS: number): Rencontre | null {
  const auDepart: EtatFusee = { ...fusee, position: positionAstre(fusee.orbite!, td) }
  return calculerRencontre(auDepart.position, dest, repereDuTrajet(auDepart, dest, td), td, vitesseKmS)
}

export interface PlanDeVol extends Rencontre {
  /** Instant du départ (ms UTC) : maintenant, ou la fenêtre de tir. */
  depart: number
  /** Instant prévu de la rencontre (ms UTC). */
  arrivee: number
  /** Vrai si la fusée attend encore en orbite. Le point visé est alors exprimé à l'instant du départ. */
  enAttente: boolean
}

/** Plan de vol actuel : départ, rencontre prévue et point visé ; null sans destination. */
export function planDeVol(fusee: EtatFusee, t: number, vitesseKmS: number): PlanDeVol | null {
  const dest = fusee.destination
  if (!dest) return null
  if (enAttenteDeFenetre(fusee) && fusee.orbite) {
    const td = Math.max(t, fusee.fenetre!.depart)
    const r = rencontreDepuisOrbite(fusee, dest, td, vitesseKmS)
    return r ? { ...r, depart: td, arrivee: td + r.duree * 1000, enAttente: true } : null
  }
  const r = calculerRencontre(fusee.position, dest, repereDuTrajet(fusee, dest, t), t, vitesseKmS)
  return r ? { ...r, depart: t, arrivee: t + r.duree * 1000, enAttente: false } : null
}

// ---------------------------------------------------------------------------------------------------------------
// Fenêtre de tir

export interface OptionDepart {
  /** Instant du départ (ms UTC). */
  depart: number
  /** Instant prévu de l'arrivée (ms UTC). */
  arrivee: number
}

/** Une fenêtre de tir n'est proposée que si elle fait arriver au moins 1 heure et 1 % plus tôt. */
const GAIN_MIN_SECONDES = 3600
const GAIN_MIN_PROPORTION = 0.01
/** Nombre de départs essayés pour trouver la fenêtre de tir, avant affinage. */
const ESSAIS_FENETRE = 120

/**
 * Meilleur moment pour quitter l'orbite : celui qui fait arriver le plus tôt, la fusée attendant en orbite
 * d'ici là. Renvoie null si la fusée n'est pas en orbite, ou si partir maintenant est presque aussi rapide.
 */
export function fenetreDeTir(fusee: EtatFusee, dest: Destination, t: number, vitesseKmS: number): OptionDepart | null {
  if (!fusee.orbite || vitesseKmS <= 0) return null
  const arriveeSi = (delai: number): number => {
    const r = rencontreDepuisOrbite(fusee, dest, t + delai * 1000, vitesseKmS)
    return r ? delai + r.duree : Infinity
  }
  const immediate = arriveeSi(0)
  if (!Number.isFinite(immediate)) return null
  // Attendre plus longtemps que la durée du vol direct ne peut pas faire arriver plus tôt.
  const pas = immediate / ESSAIS_FENETRE
  let meilleur = 0
  let meilleureArrivee = immediate
  for (let k = 1; k < ESSAIS_FENETRE; k++) {
    const a = arriveeSi(k * pas)
    if (a < meilleureArrivee) { meilleur = k * pas; meilleureArrivee = a }
  }
  // Affinage autour du meilleur essai (section dorée).
  let g = Math.max(0, meilleur - pas)
  let d = meilleur + pas
  const nombreDor = (Math.sqrt(5) - 1) / 2
  for (let n = 0; n < 40; n++) {
    const m1 = d - nombreDor * (d - g)
    const m2 = g + nombreDor * (d - g)
    if (arriveeSi(m1) < arriveeSi(m2)) d = m2
    else g = m1
  }
  const affine = (g + d) / 2
  const arriveeAffinee = arriveeSi(affine)
  if (arriveeAffinee < meilleureArrivee) { meilleur = affine; meilleureArrivee = arriveeAffinee }
  const gain = immediate - meilleureArrivee
  if (gain < GAIN_MIN_SECONDES || gain < GAIN_MIN_PROPORTION * immediate) return null
  return { depart: t + meilleur * 1000, arrivee: t + meilleureArrivee * 1000 }
}

/** Les deux départs proposés au joueur : maintenant, et la fenêtre de tir s'il y en a une meilleure. */
export function optionsDeDepart(fusee: EtatFusee, dest: Destination, t: number, vitesseKmS: number):
  { maintenant: OptionDepart | null; fenetre: OptionDepart | null } {
  const r = fusee.orbite
    ? rencontreDepuisOrbite(fusee, dest, t, vitesseKmS)
    : calculerRencontre(fusee.position, dest, repereDuTrajet(fusee, dest, t), t, vitesseKmS)
  return {
    maintenant: r ? { depart: t, arrivee: t + r.duree * 1000 } : null,
    fenetre: fenetreDeTir(fusee, dest, t, vitesseKmS),
  }
}

/** Distance actuelle jusqu'à la destination (UA), ou null sans destination. */
export function distanceRestante(fusee: EtatFusee, t: number): number | null {
  return fusee.destination ? distance(fusee.position, positionDestination(fusee.destination, t)) : null
}

/**
 * Temps restant avant l'arrivée (s), attente de la fenêtre de tir et accélération comprises ; null sans destination,
 * à vitesse nulle ou moteur coupé.
 */
export function tempsRestant(fusee: EtatFusee, t: number, vitesseKmS: number): number | null {
  if (!fusee.destination || vitesseKmS <= 0 || fusee.moteurCoupe) return null
  const r = planDeVol(fusee, t, vitesseKmS)
  if (!r) return null
  // L'accélération restante fait perdre du temps : partir de v0 au lieu de la croisière coûte
  // (durée d'accélération) / 2 × (1 − v0 / croisière)² (20 s de rampe depuis l'arrêt : 10 s de plus).
  const v0 = r.enAttente ? 0 : vitesseDuMoment(fusee, vitesseKmS)
  let retard = (DUREE_ACCELERATION / 2) * Math.max(0, 1 - v0 / vitesseKmS) ** 2
  // Manœuvre de départ : recul et virage, puis l'accélération douce fait perdre 2/3 de sa durée.
  const M = MANOEUVRE_DEPART
  const T = M.accelerationS
  // Temps encore perdu par l'accélération douce, après ta secondes : intégrale de (1 − (τ/T)²) de ta à T.
  const perteAcceleration = (ta: number) => (ta >= T ? 0 : T - ta - (T ** 3 - ta ** 3) / (3 * T * T))
  const ph = phaseDepart(fusee, t)
  if (ph.phase === 'recul') retard = M.reculS - ph.duree + M.virageEstimeS + (M.accelerationS * 2) / 3
  else if (ph.phase === 'virage') retard = Math.max(0, M.virageEstimeS - ph.duree) + (M.accelerationS * 2) / 3
  else if (ph.phase === 'acceleration') retard = Math.max(0, perteAcceleration(ph.duree))
  return Math.max(0, (r.arrivee - t) / 1000 - (seuilArrivee(fusee.destination) * UA_KM) / vitesseKmS + retard)
}

/**
 * Temps restant si la fusée gardait la vitesse donnée (s), par défaut sa vitesse du moment : c'est le compteur du
 * cockpit, qui grimpe ou fond en direct pendant une accélération ou un freinage. null à l'arrêt ou sans destination.
 */
export function tempsRestantAVitesse(fusee: EtatFusee, t: number, croisiere: number,
  vitesseKmS = vitesseDuMoment(fusee, croisiere)): number | null {
  if (!fusee.destination || croisiere <= 0 || vitesseKmS <= 0) return null
  const r = planDeVol(fusee, t, croisiere)
  if (!r) return null
  const aCroisiere = (r.arrivee - t) / 1000 - (seuilArrivee(fusee.destination) * UA_KM) / croisiere
  return Math.max(0, (aCroisiere * croisiere) / vitesseKmS)
}

// ---------------------------------------------------------------------------------------------------------------
// Création et commandes

/**
 * Fusée neuve : en orbite autour de la Terre à 400 km d'altitude, à côté de l'ISS (elle la suit), le nez tourné
 * vers Jupiter.
 */
/**
 * Écart d'orbite (UA, autour de la Terre) qui accompagne l'ISS : à la verticale de la station, 1 500 km plus haut.
 */
export function ecartAuDessusISS(t: number): { x: number; y: number; z: number } {
  const terre = positionCorps('Terre', t)
  const iss = positionCorps('ISS', t)
  const rel = { x: iss.x - terre.x, y: iss.y - terre.y, z: iss.z - terre.z }
  const d = Math.hypot(rel.x, rel.y, rel.z) || 1e-12
  const k = 1 + enUA(DEPART_AU_DESSUS_ISS_KM) / d
  return { x: rel.x * k, y: rel.y * k, z: rel.z * k }
}

export function creerFusee(t: number): EtatFusee {
  // Départ en orbite autour de la Terre, 1 500 km au-dessus de l'ISS, en la suivant (15/10/2026) : la première mission
  // (l'ISS) prend moins de 5 minutes.
  const depart = positionAstre('Terre', t)
  const ecart = ecartAuDessusISS(t)
  const ici = { x: depart.x + ecart.x, y: depart.y + ecart.y }
  return {
    position: depart,
    cap: direction(ici, positionAstre('ISS', t)),
    ecartOrbite: ecart,
    suit: 'ISS',
    virage: 0,
    destination: null,
    orbite: 'Terre',
    distanceParcourue: 0,
    fenetre: null,
    presDuVisiteur: false,
  }
}

/** Choisit une destination, avec départ immédiat. */
export function choisirDestination(fusee: EtatFusee, destination: Destination): EtatFusee {
  return { ...fusee, destination, fenetre: null, presDuVisiteur: false }
}

/**
 * Choisit une destination, avec départ à la fenêtre de tir : la fusée attend en orbite le meilleur moment.
 * S'il n'y a pas de meilleure fenêtre, le départ est immédiat.
 */
export function choisirDestinationAvecFenetre(fusee: EtatFusee, destination: Destination, t: number,
  vitesseKmS: number): EtatFusee {
  const f = fenetreDeTir(fusee, destination, t, vitesseKmS)
  return { ...fusee, destination, fenetre: f ? { depart: f.depart, vitesse: vitesseKmS } : null, presDuVisiteur: false }
}

/** Annule la destination : moteur coupé, la fusée s'arrête (ou reste en orbite si elle n'était pas partie). */
export function annulerDestination(fusee: EtatFusee): EtatFusee {
  return { ...fusee, destination: null, fenetre: null }
}

// ---------------------------------------------------------------------------------------------------------------
// Contournement des astres

/**
 * Marge de contournement : en route, la fusée ne passe jamais à moins de 1,1 rayon du centre d'un astre (Soleil,
 * planètes, satellites du système où elle se trouve). Seule sa destination est exclue : elle s'y met en orbite
 * bien avant d'en toucher la surface.
 */
export const MARGE_ASTRE = 1.1

export interface Obstacle {
  nom: NomCorps
  centre: Point2
  /** Rayon de sécurité (UA) : le rayon de l'astre multiplié par la marge. */
  rayon: number
}

/** Marge de sécurité en 3D : la route droite ne doit pas passer à moins de 1,02 rayon du centre d'un astre. */
export const MARGE_ASTRE_3D = 1.02

/** La route droite (en 3D) de a à b passe-t-elle dans la sphère de centre c et de rayon r ? */
function routeTraverse(a: Vecteur3, b: Vecteur3, c: Vecteur3, r: number): boolean {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
  const l2 = ab.x ** 2 + ab.y ** 2 + ab.z ** 2
  const k = l2 > 0 ? Math.max(0, Math.min(1, ((c.x - a.x) * ab.x + (c.y - a.y) * ab.y + (c.z - a.z) * ab.z) / l2)) : 0
  return Math.hypot(a.x + ab.x * k - c.x, a.y + ab.y * k - c.y, a.z + ab.z * k - c.z) < r
}

/** Hauteur corrigée pour que le point (p, z) reste hors de la sphère de sécurité de chaque astre proche. */
/**
 * Rayon de sécurité d'un astre (UA) : 2 % de plus que son rayon, ou son altitude de sécurité (400 km pour la Terre),
 * abaissé à 5 km sous la destination si elle vole plus bas (Tiangong, sous les 400 km).
 */
function rayonSecurite(nom: NomCorps, r: number, dest: Destination, t: number): number {
  const base = enUA(Math.max(r * MARGE_ASTRE_3D, r + (ALTITUDE_SECURITE_KM[nom] ?? 0)))
  if (dest.type !== 'astre') return base
  const c = positionCorps(nom, t)
  const d = positionCorps(dest.astre, t)
  const dDest = Math.hypot(d.x - c.x, d.y - c.y, d.z - c.z)
  return dDest < base ? Math.max(enUA(r * MARGE_ASTRE_3D), dDest - enUA(5)) : base
}

function horsDesAstres(p: Point2, z: number, dest: Destination, t: number): number {
  const noms: NomCorps[] = ['Soleil', ...NOMS_PLANETES]
  const systeme = systemeDeLaFusee({ position: p, orbite: null } as EtatFusee, t)
  if (systeme) noms.push(...corpsDuSysteme(systeme).filter((n) => !estPlanete(n)))
  for (const nom of noms) {
    if (dest.type === 'astre' && nom === dest.astre) continue
    const r = rayonCorps(nom)
    if (!r) continue
    const r3 = rayonSecurite(nom, r, dest, t)
    const c = positionCorps(nom, t)
    const d2 = Math.hypot(p.x - c.x, p.y - c.y)
    if (d2 >= r3) continue
    const h = Math.sqrt(r3 * r3 - d2 * d2)
    if (Math.abs(z - c.z) < h) z = c.z + (z >= c.z ? h : -h)
  }
  return z
}

/**
 * Astres à contourner, à l'instant t, pour une fusée en position p qui vise le point `vise`. Avec les hauteurs
 * (z de la fusée et de la cible), un astre ne gêne que si la route droite en 3D le traverse : la fusée le contourne
 * alors dans le plan, en rejoignant peu à peu la hauteur de sa cible, jusqu'à ce que la route se dégage. C'est ainsi
 * qu'elle rejoint l'ISS ou Hubble, qui tournent tout près de la Terre, sans jamais la traverser.
 */
export function obstacles(p: Point2, dest: Destination, vise: Point2, t: number, hauteurs?: { z: number; zVise: number }): Obstacle[] {
  const noms: NomCorps[] = ['Soleil', ...NOMS_PLANETES]
  const systeme = systemeDeLaFusee({ position: p, orbite: null } as EtatFusee, t)
  if (systeme) noms.push(...corpsDuSysteme(systeme).filter((n) => !estPlanete(n)))
  const liste: Obstacle[] = []
  for (const nom of noms) {
    if (dest.type === 'astre' && nom === dest.astre) continue
    const r = rayonCorps(nom)
    if (!r) continue
    const c3 = positionCorps(nom, t)
    const centre = { x: c3.x, y: c3.y }
    const rayon = enUA(r) * MARGE_ASTRE
    if (hauteurs) {
      const r3 = rayonSecurite(nom, r, dest, t)
      const b = { x: vise.x, y: vise.y, z: hauteurs.zVise }
      // Cible dans l'astre lui-même (point libre) : on ne peut que s'en approcher.
      if (Math.hypot(b.x - c3.x, b.y - c3.y, b.z - c3.z) < r3) continue
      if (!routeTraverse({ x: p.x, y: p.y, z: hauteurs.z }, b, c3, r3)) continue
      // Cible tout près de l'astre (l'ISS au-dessus de la Terre) : on ne s'interdit que le nécessaire.
      liste.push({ nom, centre, rayon: Math.max(r3, Math.min(rayon, distance(vise, centre) * 0.99)) })
      continue
    }
    // Un point libre choisi à l'intérieur d'un astre : on ne peut que s'en approcher.
    if (distance(vise, centre) < rayon) continue
    liste.push({ nom, centre, rayon })
  }
  return liste
}

/**
 * Cap à suivre pour aller vers `vise` sans traverser d'astre : tout droit si la route est libre ; sinon, la
 * tangente à l'astre gênant, du côté le plus proche de la route directe. Dans la marge d'un astre, la fusée ne
 * s'en rapproche pas : elle file le long de lui.
 */
export function capDeContournement(p: Point2, vise: Point2, liste: Obstacle[]): number {
  let cap = direction(p, vise)
  const portee = distance(p, vise)
  for (let essai = 0; essai < 3; essai++) {
    let change = false
    for (const o of liste) {
      const d = distance(p, o.centre)
      if (d < 1e-12 || d - o.rayon > portee) continue
      const versCentre = direction(p, o.centre)
      const ecart = ecartAngle(versCentre, cap)
      if (d <= o.rayon) {
        if (Math.abs(ecart) < 90 - 1e-9) { cap = (versCentre + (ecart >= 0 ? 90 : -90) + 360) % 360; change = true }
        continue
      }
      const demiAngle = Math.asin(o.rayon / d) / RAD
      if (Math.abs(ecart) >= demiAngle - 1e-9) continue
      // La route coupe l'astre ; si la cible est avant lui, rien à faire.
      const lateral = d * Math.sin(ecart * RAD)
      const entree = d * Math.cos(ecart * RAD) - Math.sqrt(Math.max(0, o.rayon ** 2 - lateral ** 2))
      if (entree > portee) continue
      cap = (versCentre + (ecart >= 0 ? demiAngle : -demiAngle) + 360) % 360
      change = true
    }
    if (!change) break
  }
  return cap
}

// ---------------------------------------------------------------------------------------------------------------
// Avance

export interface ResultatPas {
  fusee: EtatFusee
  /** Destination atteinte pendant ce pas, s'il y en a une. */
  arrivee: Destination | null
}

/** Hauteur au-dessus du plan de l'écliptique (UA) d'une destination. */
function hauteurDestination(d: Destination, t: number, actuelle: number): number {
  if (d.type === 'point') return actuelle
  if (d.type === 'visiteur') return positionVisiteur(t).z
  return positionCorps(d.astre, t).z
}

/** Plus grand nombre de sous-pas d'un pas (rattrapage hors ligne près d'un astre). */
const SOUS_PAS_MAX = 200

/**
 * Fait avancer la fusée pendant dt secondes, jusqu'à l'instant t (ms UTC) : la fusée est entraînée par son
 * repère (la planète du système, ou rien pour le Soleil), tourne vers le point de rencontre (4°/s au plus) en
 * contournant les astres, puis avance tout droit selon son cap. Si elle attend sa fenêtre de tir, elle reste en
 * orbite. Un long pas qui passe près d'un astre est découpé, pour ne jamais le traverser.
 */
export function avancerFusee(fusee: EtatFusee, t: number, dt: number, vitesseKmS: number): ResultatPas {
  const dest = fusee.destination
  if (!dest || fusee.orbite || dt <= 0) return avancerAvecRampe(fusee, t, dt, vitesseKmS)
  const longueur = (Math.max(vitesseKmS, vitesseDuMoment(fusee, vitesseKmS)) * dt) / UA_KM
  const proches = obstacles(fusee.position, dest, positionDestination(dest, t), t)
    .filter((o) => distance(fusee.position, o.centre) - o.rayon < longueur * 1.5)
  if (!proches.length) return avancerAvecRampe(fusee, t, dt, vitesseKmS)
  const plusPetit = Math.min(...proches.map((o) => o.rayon))
  const n = Math.min(SOUS_PAS_MAX, Math.max(1, Math.ceil(longueur / (0.2 * plusPetit))))
  if (n === 1) return avancerAvecRampe(fusee, t, dt, vitesseKmS)
  let r: ResultatPas = { fusee, arrivee: null }
  const debut = t - dt * 1000
  for (let i = 1; i <= n; i++) {
    r = avancerAvecRampe(r.fusee, debut + (i * dt * 1000) / n, dt / n, vitesseKmS)
    if (r.arrivee || !r.fusee.destination) {
      // Arrivée (ou approche abandonnée) en cours de pas : le reste du pas se passe en orbite ou à l'arrêt.
      if (i < n) r = { ...avancerAvecRampe(r.fusee, t, ((n - i) * dt) / n, vitesseKmS), arrivee: r.arrivee }
      break
    }
  }
  return r
}

/**
 * Un pas, avec la rampe de vitesse : la vitesse du moment va vers la croisière (moteur allumé, en route) ou vers 0
 * (moteur coupé). En orbite et sans destination, elle est nulle.
 */
function avancerAvecRampe(fusee: EtatFusee, t: number, dt: number, croisiere: number): ResultatPas {
  const M = MANOEUVRE_DEPART
  const debut = t - dt * 1000
  const ph = enAttenteDeFenetre(fusee) && fusee.orbite ? { phase: null, duree: 0 } : phaseDepart(fusee, debut)
  if (ph.phase && dt > 5) {
    // Rattrapage hors ligne : départ sans manœuvre, la fusée est aussitôt tournée et lancée.
    const r = avancerUnPas(fusee, t, dt, croisiere, croisiere, null)
    const tr = r.fusee.trajet
    const trajet = tr && tr.aligne === undefined ? { ...tr, aligne: debut - M.accelerationS * 1000 } : tr
    const enRoute = r.fusee.destination !== null && r.fusee.orbite === null
    return { ...r, fusee: { ...r.fusee, trajet, moteurCoupe: fusee.moteurCoupe, vitesseCourante: enRoute ? croisiere : 0 } }
  }
  if (ph.phase) {
    let moyenne = 0
    let fin = 0
    if (ph.phase === 'recul') moyenne = -M.reculKmS
    else if (ph.phase === 'acceleration') {
      moyenne = (croisiere * (parcoursAcceleration(ph.duree + dt) - parcoursAcceleration(ph.duree))) / dt
      fin = croisiere * Math.min(1, ((ph.duree + dt) / M.accelerationS) ** 2)
    }
    // Pendant toute la manœuvre (recul, virage, accélération), la fusée reste entraînée par le lieu quitté : on le
    // voit s'éloigner peu à peu (l'ISS file à 7,7 km/s autour de la Terre). Ensuite, seul compte le repère.
    const lien = 1
    const r = avancerUnPas(fusee, t, dt, croisiere, moyenne, ph.phase, lien)
    const enRoute = r.fusee.destination !== null && r.fusee.orbite === null
    return { ...r, fusee: { ...r.fusee, moteurCoupe: fusee.moteurCoupe, vitesseCourante: enRoute ? fin : 0 } }
  }
  const v0 = vitesseDuMoment(fusee, croisiere)
  const cible = fusee.destination && !fusee.moteurCoupe ? croisiere : 0
  const rampe = rampeVitesse(v0, cible, croisiere, dt)
  const r = avancerUnPas(fusee, t, dt, croisiere, rampe.moyenne)
  const enRoute = r.fusee.destination !== null && r.fusee.orbite === null
  // Le bouton MOTEUR garde sa position (le pas reconstruit l'état de la fusée).
  return { ...r, fusee: { ...r.fusee, moteurCoupe: fusee.moteurCoupe, vitesseCourante: enRoute ? rampe.fin : 0 } }
}

/**
 * Un pas : vitesseKmS est la vitesse de croisière (pour viser et pour la fenêtre de tir), vitesseMoyenne celle
 * à laquelle la fusée avance pendant ce pas (rampe d'accélération ou de freinage).
 */
function avancerUnPas(fusee: EtatFusee, t: number, dt: number, vitesseKmS: number, vitesseMoyenne = vitesseKmS,
  phase: PhaseDepart = null, lienOrigine = 0): ResultatPas {
  const dest = fusee.destination
  if (!dest) {
    // Stationnée à côté du visiteur : elle le suit tant qu'il reste à cette escale, puis revient en orbite simple.
    if (fusee.presDuVisiteur && fusee.orbite) {
      const v = positionVisiteur(t)
      if (!v.enVoyage && v.astre === fusee.orbite) {
        return { fusee: { ...fusee, position: { x: v.x, y: v.y }, virage: 0 }, arrivee: null }
      }
      return { fusee: { ...fusee, position: positionAstre(fusee.orbite, t), virage: 0, presDuVisiteur: false }, arrivee: null }
    }
    // À l'arrêt ou en orbite : en orbite, la fusée suit son astre (et l'ISS, au départ de la partie).
    const position = fusee.orbite ? positionAstre(fusee.orbite, t) : fusee.position
    if (fusee.orbite === 'Terre' && fusee.suit === 'ISS') {
      return { fusee: { ...fusee, position, virage: 0, ecartOrbite: ecartAuDessusISS(t), cap: direction(
        { x: position.x + ecartAuDessusISS(t).x, y: position.y + ecartAuDessusISS(t).y }, positionAstre('ISS', t)) }, arrivee: null }
    }
    return { fusee: { ...fusee, position, virage: 0 }, arrivee: null }
  }

  if (dest.type === 'visiteur' && (escaleDuJour(t) !== dest.astre || positionVisiteur(t).enVoyage)) {
    // Le visiteur a changé d'escale pendant l'approche : elle est abandonnée, la fusée reste où elle est.
    return { fusee: { ...fusee, destination: null, orbite: null, virage: 0, presDuVisiteur: false }, arrivee: null }
  }

  if (fusee.fenetre && fusee.orbite) {
    let fenetre: FenetreDeTir | null = fusee.fenetre
    if (fenetre.vitesse !== vitesseKmS) {
      // La vitesse a changé (amélioration, avarie…) : la fenêtre de tir est recalculée.
      const f = fenetreDeTir(fusee, dest, t, vitesseKmS)
      fenetre = f ? { depart: f.depart, vitesse: vitesseKmS } : null
    }
    if (fenetre && t < fenetre.depart) {
      return { fusee: { ...fusee, fenetre, position: positionAstre(fusee.orbite, t), virage: 0 }, arrivee: null }
    }
    fusee = { ...fusee, fenetre: null }
  }

  const repere = repereDuTrajet(fusee, dest, t - dt * 1000)
  const c = centre(repere, t)
  const cAvant = centre(repere, t - dt * 1000)
  let entrainee = { x: fusee.position.x + (c.x - cAvant.x), y: fusee.position.y + (c.y - cAvant.y) }
  const distanceParcourue = fusee.distanceParcourue + Math.abs(vitesseMoyenne) * dt
  const pas = (vitesseMoyenne * dt) / UA_KM
  // Au départ d'une orbite, la fusée part de son orbite (hors de l'astre), à la hauteur de l'astre quitté.
  const quitte = fusee.orbite
  let z = quitte ? positionCorps(quitte, t).z + (fusee.ecartOrbite?.z ?? 0) : (fusee.z ?? 0)
  if (quitte && fusee.ecartOrbite) {
    const o = positionAstre(quitte, t)
    entrainee = { x: o.x + fusee.ecartOrbite.x, y: o.y + fusee.ecartOrbite.y }
  } else if (lienOrigine > 0 && fusee.trajet?.origine) {
    // Manœuvre de départ : la fusée suit encore le mouvement du lieu quitté (au lieu de celui du repère).
    const o = fusee.trajet.origine
    const a = positionAstre(o, t - dt * 1000), b = positionAstre(o, t)
    entrainee = {
      x: entrainee.x + lienOrigine * (b.x - a.x - (c.x - cAvant.x)),
      y: entrainee.y + lienOrigine * (b.y - a.y - (c.y - cAvant.y)),
    }
  }
  // Nouveau trajet : au départ d'une orbite, ou quand la destination change en vol.
  const vers = JSON.stringify(dest)
  let trajet: Trajet = quitte || fusee.trajet?.vers !== vers
    ? { vers, origine: quitte, depart: t - dt * 1000, kmAuDepart: fusee.distanceParcourue }
    : fusee.trajet!

  const cible = positionDestination(dest, t)
  const arrive = distance(entrainee, cible) <= Math.max(pas, seuilArrivee(dest))
  // À l'arrivée, la fusée finit de tourner vers la cible elle-même ; sinon, vers le point de rencontre.
  const rencontre = arrive ? null : calculerRencontre(entrainee, dest, repere, t, vitesseKmS)
  const vise = rencontre ? rencontre.point : cible
  if (quitte && !arrive) {
    const r = rayonCorps(quitte)
    const o = positionAstre(quitte, t)
    const marge = r ? enUA(r) * MARGE_ASTRE * 1.001 : 0
    if (distance(entrainee, o) < marge) {
      const a = direction(o, vise) * RAD
      entrainee = { x: o.x + Math.cos(a) * marge, y: o.y + Math.sin(a) * marge }
    }
  }
  const liste = arrive ? [] : obstacles(entrainee, dest, vise, t, { z, zVise: hauteurDestination(dest, t, z) })
  const voulu = arrive ? direction(entrainee, vise) : capDeContournement(entrainee, vise, liste)
  const ecart = ecartAngle(fusee.cap, voulu)
  // Dans la marge d'un astre, la fusée s'oriente aussitôt (manœuvre de dégagement). Manœuvre de départ : pas de
  // virage pendant le recul, puis 8° par seconde ; ensuite, 4° par seconde.
  const degagement = liste.some((o) => distance(entrainee, o.centre) <= o.rayon)
  const taux = phase === 'recul' ? 0 : phase ? TAUX_VIRAGE_DEPART : TAUX_VIRAGE
  const rotation = degagement ? ecart : Math.max(-taux * dt, Math.min(taux * dt, ecart))
  // Fin du virage de départ : tournée vers sa destination (ou virage trop long), la fusée commence à accélérer.
  if (phase === 'virage' && trajet.aligne === undefined
    && (Math.abs(ecart - rotation) < 1 || (t - trajet.depart) / 1000 > MANOEUVRE_DEPART.reculS + MANOEUVRE_DEPART.virageMaxS)) {
    trajet = { ...trajet, aligne: t }
  }
  const cap = (fusee.cap + rotation + 360) % 360
  const virage = dt > 0 && !degagement ? rotation / dt : 0
  if (arrive) {
    const orbite = dest.type === 'point' ? null : dest.astre
    const presDuVisiteur = dest.type === 'visiteur'
    let ecartOrbite: EtatFusee['ecartOrbite']
    if (dest.type === 'astre') {
      const dx = entrainee.x - cible.x, dy = entrainee.y - cible.y
      const d = Math.hypot(dx, dy)
      // Auprès d'un engin (l'ISS comprise) : tout près de lui ; ailleurs, en orbite à la distance d'arrivée.
      const dz = z - hauteurDestination(dest, t, z)
      const tout = dest.astre === 'ISS' ? approcheEnginKm(109) : estEngin(dest.astre) ? approcheEngin(dest.astre) : null
      const k = tout !== null ? enUA(tout) / Math.max(Math.hypot(dx, dy, dz), 1e-12) : d > seuilArrivee(dest) ? seuilArrivee(dest) / d : 1
      ecartOrbite = { x: dx * k, y: dy * k, z: dz * k }
    }
    return {
      fusee: { position: cible, cap, virage, destination: null, orbite, distanceParcourue, fenetre: null, presDuVisiteur,
        z: hauteurDestination(dest, t, z), trajet: undefined, ecartOrbite },
      arrivee: dest,
    }
  }
  const position = { x: entrainee.x + Math.cos(cap * RAD) * pas, y: entrainee.y + Math.sin(cap * RAD) * pas }
  // La hauteur rejoint peu à peu celle de la destination, pour y arriver en même temps.
  const reste = distance(position, cible)
  z += (hauteurDestination(dest, t, z) - z) * Math.min(1, pas / Math.max(reste, pas))
  // Garde : jamais sous la surface de sécurité d'un astre (la cible bouge pendant l'approche) ; la fusée passe
  // alors au-dessus (ou au-dessous), du côté où elle se trouve.
  z = horsDesAstres(position, z, dest, t)
  return {
    fusee: { position, cap, virage, destination: dest, orbite: null, distanceParcourue, fenetre: null, presDuVisiteur: false, z, trajet },
    arrivee: null,
  }
}
