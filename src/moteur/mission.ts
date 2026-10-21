// La mission de la capsule : en orbite autour d'un astre, puis un trajet vers une destination, puis de nouveau en
// orbite autour de la destination.
//
// Le trajet (choix d'Adrien du 17/10/2026, qui remplace les vraies trajectoires orbitales, illisibles) : la capsule
// vise le point de rendez-vous — là où sera la destination à l'arrivée — et y va en ligne droite. Profil de vol
// (décision d'Adrien du 19/10/2026) : elle accélère à 20 g jusqu'à la vitesse maximale de son moteur, la garde, puis
// freine à 20 g pour s'arrêter à l'arrivée ; sur un trajet court, elle commence à freiner avant de l'avoir atteinte.
// Règle d'or (17/10/2026) : rien ne traverse un astre. Si la ligne droite passe trop près de l'astre autour duquel
// elle part ou arrive (ou du Soleil), la capsule le contourne par petits arcs.
//
// Les points du trajet sont accrochés à un astre (« ancre ») : ceux du départ suivent la planète de départ, ceux de
// l'arrivée la planète de la destination ; entre les systèmes, les points sont fixes par rapport au Soleil. Le point
// d'arrivée d'une planète est fixe par rapport au Soleil : c'est là où elle sera à l'arrivée.

import { ACCELERATION } from '../donnees/capsule'
import { etatSurOrbite, GM_TERRE, ORBITE_DEPART, type EtatCapsule, type OrbiteCirculaire } from './capsule'
import { astreDominant, corps, position, rayonInfluence, RAPPORT_MASSE_SOLEIL_ASTRES } from './corps'
import { GM_SOLEIL } from './orbite'
import type { Vecteur3 } from './vecteur'

const plus = (a: Vecteur3, b: Vecteur3) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
const moins = (a: Vecteur3, b: Vecteur3) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const fois = (a: Vecteur3, k: number) => ({ x: a.x * k, y: a.y * k, z: a.z * k })
const norme = (a: Vecteur3) => Math.hypot(a.x, a.y, a.z)
const unitaire = (a: Vecteur3) => fois(a, 1 / (norme(a) || 1))
const vectoriel = (a: Vecteur3, b: Vecteur3) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })
const scalaire = (a: Vecteur3, b: Vecteur3) => a.x * b.x + a.y * b.y + a.z * b.z

/** Pas des arcs de contournement (radians). */
const PAS_DETOUR = (10 * Math.PI) / 180

/** Vitesse héliocentrique d'un astre (km/s), par différence de positions à ± 30 s. */
export function vitesseAstre(nom: string, t: number): Vecteur3 {
  const a = position(nom, t - 30_000), b = position(nom, t + 30_000)
  return { x: (b.x - a.x) / 60, y: (b.y - a.y) / 60, z: (b.z - a.z) / 60 }
}

/** Un point du trajet, accroché à un astre (le Soleil : point fixe). */
export interface PointDePassage { ancre: string; rel: Vecteur3 }

export interface Plan {
  cible: string
  /** Instants de départ et d'arrivée (ms UTC). */
  depart: number
  arrivee: number
  /** Vitesse maximale du moteur (km/s) ; la capsule ne l'atteint que si le trajet est assez long. */
  vitesse: number
  /** Points clés (départ, sortie du système de départ, entrée dans celui d'arrivée, arrivée) : pour le dessin. */
  cles: PointDePassage[]
  /** Tous les points du trajet, avec les arcs de contournement. */
  points: PointDePassage[]
  /** Vitesse de la capsule au départ, par rapport à l'ancre du premier point (pour coucher son orbite sur la carte). */
  vitesseDepart: Vecteur3
  /** Point de rendez-vous : où sera la destination à l'arrivée (héliocentrique, km). */
  rendezVous: Vecteur3
}

export type Planification = { possible: true; plan: Plan } | { possible: false }

const ORIGINE: Vecteur3 = { x: 0, y: 0, z: 0 }
const positionAncre = (ancre: string, t: number) => (ancre === 'Soleil' ? ORIGINE : position(ancre, t))
const vitesseAncre = (ancre: string, t: number) => (ancre === 'Soleil' ? ORIGINE : vitesseAstre(ancre, t))

/** Position héliocentrique d'un point de passage à l'instant t. */
export function positionDuPoint(p: PointDePassage, t: number): Vecteur3 {
  return plus(positionAncre(p.ancre, t), p.rel)
}

/** Rayon de sécurité d'un astre (km) : on ne passe jamais à moins de 2 % de son rayon (au moins 100 km) de sa surface. */
export function securite(nom: string): number {
  const r = corps(nom)?.rayon ?? 0
  return r + Math.max(0.02 * r, 100)
}

/** Distance (km) entre l'origine et le segment [a, b]. */
function distanceSegment(a: Vecteur3, b: Vecteur3): number {
  const ab = moins(b, a)
  const l2 = scalaire(ab, ab)
  const k = l2 > 0 ? Math.min(1, Math.max(0, -scalaire(a, ab) / l2)) : 0
  return norme(plus(a, fois(ab, k)))
}

/**
 * Contournement d'un astre (à l'origine) entre deux points a et b qui lui sont relatifs, par le plus court chemin
 * (demande d'Adrien du 19/10/2026) : rien si la ligne droite passe assez loin (rayon de sécurité r) ; sinon, la
 * tangente de a au cercle, un arc (pas de 10° au plus), puis la tangente du cercle vers b. Renvoie les points
 * intermédiaires (le point où l'on quitte la tangente de a, l'arc, le point où l'on prend celle de b).
 */
export function contourner(a: Vecteur3, b: Vecteur3, r: number): Vecteur3[] {
  if (distanceSegment(a, b) >= r) return []
  const la = norme(a), lb = norme(b)
  if (la === 0 || lb === 0) return []
  // Le plan de a et b (s'ils sont opposés, n'importe quel plan qui contient a).
  const e1 = fois(a, 1 / la)
  let axe = vectoriel(a, b)
  if (norme(axe) < 1e-9 * la * lb) axe = vectoriel(a, Math.abs(e1.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 })
  const e2 = unitaire(vectoriel(unitaire(axe), e1))
  const thetaB = Math.atan2(scalaire(b, e2), scalaire(b, e1))
  const R = Math.min(1.06 * r, la, lb)
  const t1 = Math.acos(Math.min(1, R / la)), t2 = thetaB - Math.acos(Math.min(1, R / lb))
  if (t2 <= t1) return []
  const n = Math.max(1, Math.ceil((t2 - t1) / PAS_DETOUR))
  return Array.from({ length: n + 1 }, (_, j) => {
    const th = t1 + ((t2 - t1) * j) / n
    return plus(fois(e1, R * Math.cos(th)), fois(e2, R * Math.sin(th)))
  })
}

/** Rayon de l'orbite d'attente autour d'une destination (km) : basse et circulaire ; à 60 m d'un engin. */
function rayonArrivee(nom: string): number {
  const c = corps(nom)
  if (c?.tailleM) return 0.06
  if (nom === 'Soleil') return 5 * c!.rayon
  return Math.max(1.3 * (c?.rayon || 1.5), (c?.rayon || 1.5) + 150)
}

/**
 * Astre auquel s'accroche l'arrivée : celui autour duquel tourne la destination (une lune, un satellite, une sonde
 * dans le système d'une planète) ; pour une planète ou le Soleil, le Soleil (le point d'arrivée est là où sera la
 * planète) ; l'astre de départ lui-même si c'est lui la destination.
 */
function ancreArrivee(cible: string, ancreDepart: string, t1: number): string {
  if (cible === ancreDepart) return cible
  const c = corps(cible)
  if (!c || c.type === 'etoile' || c.type === 'planete' || c.type === 'naine') return 'Soleil'
  if (c.parent) return c.parent
  return astreDominant(position(cible, t1), t1)
}

/** Distance de sortie (ou d'entrée) d'un système : quatre fois plus loin que le point de départ, sans quitter le système. */
function rayonSortie(nom: string, r: number): number {
  return Math.max(r, Math.min(4 * r, 0.5 * rayonInfluence(nom)))
}

/** Points du trajet vers la destination, en arrivant à l'instant t1. */
function construire(depart: PointDePassage, t0: number, cible: string, t1: number): { cles: PointDePassage[]; points: PointDePassage[]; rendezVous: Vecteur3 } {
  const D = depart.ancre
  const R = ancreArrivee(cible, D, t1)
  const rendezVous = position(cible, t1)
  const relCible = moins(rendezVous, positionAncre(R, t1))
  /** Point d'arrivée : sur l'orbite d'attente, du côté d'où l'on vient. */
  const arrivee = (provenance: Vecteur3): PointDePassage =>
    ({ ancre: R, rel: plus(relCible, fois(unitaire(moins(provenance, relCible)), rayonArrivee(cible))) })
  if (R === D) {
    const E = arrivee(depart.rel)
    return { cles: [depart, E], points: [depart, ...contourner(depart.rel, E.rel, securite(D)).map((rel) => ({ ancre: D, rel })), E], rendezVous }
  }
  // Entre deux systèmes : contournement du Soleil entre le départ et l'arrivée, s'il le faut.
  const pa = positionAncre(D, t0), pb = R === 'Soleil' ? rendezVous : positionAncre(R, t1)
  const milieu = contourner(pa, pb, securite('Soleil')).map((rel): PointDePassage => ({ ancre: 'Soleil', rel }))
  const cles: PointDePassage[] = [depart]
  const points: PointDePassage[] = [depart]
  let precedent = pa
  if (D !== 'Soleil') {
    // Sortie du système de départ : on contourne l'astre de départ s'il est sur le chemin de la suite du trajet,
    // jusqu'à ce qu'il ne gêne plus, puis tout droit (le point de sortie est sur cette ligne droite).
    const suite = moins(milieu[0]?.rel ?? pb, pa)
    const tour = contourner(depart.rel, suite, securite(D))
    const dernier = tour[tour.length - 1] ?? depart.rel
    const u = unitaire(moins(suite, dernier)), R = rayonSortie(D, norme(depart.rel)), k = scalaire(dernier, u)
    const s = Math.max(1, -k + Math.sqrt(Math.max(0, k * k - scalaire(dernier, dernier) + R * R)))
    const X: PointDePassage = { ancre: D, rel: plus(dernier, fois(u, s)) }
    points.push(...tour.map((rel) => ({ ancre: D, rel })), X)
    cles.push(X)
    precedent = plus(pa, X.rel)
  }
  points.push(...milieu)
  if (milieu.length) precedent = milieu[milieu.length - 1].rel
  if (R === 'Soleil') {
    const E = arrivee(precedent)
    points.push(E)
    cles.push(E)
  } else {
    // Entrée dans le système d'arrivée, du côté d'où l'on vient, puis l'arrivée.
    const Y: PointDePassage = { ancre: R, rel: fois(unitaire(moins(precedent, pb)), rayonSortie(R, norme(relCible))) }
    const E = arrivee(Y.rel)
    points.push(Y, ...contourner(Y.rel, E.rel, securite(R)).map((rel) => ({ ancre: R, rel })), E)
    cles.push(Y, E)
  }
  return { cles, points, rendezVous }
}

/** Longueur (km) d'une ligne brisée. */
function longueur(q: Vecteur3[]): number {
  let l = 0
  for (let k = 1; k < q.length; k++) l += norme(moins(q[k], q[k - 1]))
  return l
}

/** Positions héliocentriques des points du trajet à l'instant t. */
export function positionsDesPoints(points: PointDePassage[], t: number): Vecteur3[] {
  return points.map((p) => positionDuPoint(p, t))
}

/** Durée (s) d'un trajet de longueur L (km) avec un moteur de vitesse maximale v (km/s), à l'arrêt au départ et à l'arrivée. */
export function dureeTrajet(L: number, v: number): number {
  return L >= (v * v) / ACCELERATION ? L / v + v / ACCELERATION : 2 * Math.sqrt(L / ACCELERATION)
}

/** Vitesse de pointe (km/s) d'un trajet de durée T (s) : la vitesse maximale du moteur, ou moins si le trajet est court. */
export function vitesseDePointe(T: number, v: number): number {
  return Math.min(v, (ACCELERATION * T) / 2)
}

/** Part du trajet parcourue à l'instant t (0 au départ, 1 à l'arrivée) : accélération, croisière, freinage. */
export function avancement(p: Plan, t: number): number {
  const T = (p.arrivee - p.depart) / 1000
  const s = Math.min(T, Math.max(0, (t - p.depart) / 1000))
  if (T <= 0) return 1
  // Le profil des vitesses : un trapèze (ou un triangle) de pente ±ACCELERATION et de hauteur la vitesse de pointe.
  const v = vitesseDePointe(T, p.vitesse), ta = v / ACCELERATION, L = v * (T - ta)
  if (s < ta) return (ACCELERATION * s * s) / 2 / L
  if (s > T - ta) return 1 - (ACCELERATION * (T - s) * (T - s)) / 2 / L
  return (v * ta / 2 + v * (s - ta)) / L
}

/**
 * Vitesse de la capsule à l'instant t sur son trajet (km/s) et la phase du vol (demande d'Adrien du 20/10/2026 : un
 * cadran de vitesse sur la carte) : elle accélère à 20 g, garde sa vitesse de pointe, puis freine à 20 g.
 */
export function vitesseEnVol(p: Plan, t: number): { vitesse: number; pointe: number; phase: 'accelere' | 'croisiere' | 'freine' | 'arrivee' } {
  const T = (p.arrivee - p.depart) / 1000, s = (t - p.depart) / 1000
  const v = vitesseDePointe(Math.max(0, T), p.vitesse), ta = v / ACCELERATION
  if (T <= 0 || s >= T) return { vitesse: 0, pointe: v, phase: 'arrivee' }
  const x = Math.max(0, s)
  if (x < ta) return { vitesse: ACCELERATION * x, pointe: v, phase: 'accelere' }
  if (x > T - ta) return { vitesse: ACCELERATION * (T - x), pointe: v, phase: 'freine' }
  return { vitesse: v, pointe: v, phase: 'croisiere' }
}

/** Point situé à la part f (0 à 1) de la longueur d'une ligne brisée. */
export function pointSurLigne(q: Vecteur3[], f: number): Vecteur3 {
  let reste = f * longueur(q)
  for (let k = 1; k < q.length; k++) {
    const l = norme(moins(q[k], q[k - 1]))
    if (reste <= l && l > 0) return plus(q[k - 1], fois(moins(q[k], q[k - 1]), reste / l))
    reste -= l
  }
  return q[q.length - 1]
}

/** Position et vitesse (héliocentriques, km et km/s) sur un trajet, à l'instant t. */
export function etatSurTrajet(p: Plan, t: number): { r: Vecteur3; v: Vecteur3 } {
  const ici = (u: number) => pointSurLigne(positionsDesPoints(p.points, u), avancement(p, u))
  const r = ici(t)
  const dt = t + 1000 <= p.arrivee ? 1000 : -1000
  const r2 = ici(t + dt)
  return { r, v: fois(moins(r2, r), 1000 / dt) }
}

/**
 * Trajet de la capsule (état héliocentrique r, v à l'instant t0) vers une destination, avec un moteur de vitesse
 * maximale donnée (km/s). Impossible si la destination s'enfuit plus vite que la capsule.
 */
export function planifier(depart: { r: Vecteur3; v: Vecteur3 }, cible: string, t0: number, vitesse: number): Planification {
  const D = astreDominant(depart.r, t0)
  const premier: PointDePassage = { ancre: D, rel: moins(depart.r, positionAncre(D, t0)) }
  /** Durée nécessaire (s) pour un trajet qui arrive après une durée T (s) : la longueur dépend du rendez-vous. */
  const essai = (T: number) => {
    const t1 = t0 + T * 1000
    const c = construire(premier, t0, cible, t1)
    const L = (longueur(positionsDesPoints(c.points, t0)) + longueur(positionsDesPoints(c.points, t1))) / 2
    return { t1, c, besoin: dureeTrajet(L, vitesse) }
  }
  // Durées essayées : de 1 seconde à 300 ans, en progression géométrique ; la première assez longue, puis on affine.
  const N = 200, dMin = 1, dMax = 300 * 365.25 * 86_400
  let precedente = 0
  for (let i = 0; i <= N; i++) {
    const T = dMin * (dMax / dMin) ** (i / N)
    if (essai(T).besoin > T) { precedente = T; continue }
    let court = precedente, long = T
    for (let k = 0; k < 50; k++) {
      const m = (court + long) / 2
      if (essai(m).besoin > m) court = m
      else long = m
    }
    const { t1, c } = essai(long)
    return {
      possible: true,
      plan: { cible, depart: t0, arrivee: t1, vitesse, cles: c.cles, points: c.points,
        vitesseDepart: moins(depart.v, vitesseAncre(D, t0)), rendezVous: c.rendezVous },
    }
  }
  return { possible: false }
}

/** Constante de gravitation d'un astre (km³/s²) ; pour une lune inconnue, d'après sa taille (densité 2 g/cm³). */
export function gmAstre(nom: string): number {
  if (nom === 'Soleil') return GM_SOLEIL
  if (nom === 'Terre') return GM_TERRE
  if (nom === 'Lune') return 4902.8
  if (nom === 'Pluton') return 869.6
  const rapport = RAPPORT_MASSE_SOLEIL_ASTRES[nom]
  if (rapport) return GM_SOLEIL / rapport
  const c = corps(nom)
  if (c?.tailleM) return 1e-9 // un engin : on reste simplement à côté
  const r = c?.rayon || 1.5
  return 5.59e-7 * r ** 3
}

/** Orbite d'attente autour d'une destination, à l'arrivée : basse et circulaire ; à 60 m d'un engin. */
export function orbiteAutour(nom: string, t: number, arrivee: Vecteur3): OrbiteCirculaire {
  const rayon = rayonArrivee(nom)
  // Phase : on se place du côté d'où l'on arrive (direction de la capsule vue de la destination juste avant).
  const o: OrbiteCirculaire = { centre: nom, mu: gmAstre(nom), rayon, inclinaison: 0, noeud: 0, epoque: t, phase: 0 }
  const rel = moins(arrivee, position(nom, t))
  if (norme(rel) > 0) {
    // Dans le repère de l'orbite (équateur terrestre incliné, voir capsule.ts) : angle de la direction d'arrivée.
    const ob = 23.4392911 * (Math.PI / 180)
    const yEq = Math.cos(ob) * rel.y - Math.sin(ob) * rel.z
    o.phase = Math.atan2(yEq, rel.x)
  }
  return o
}

/** Orbite autour d'un astre qui passe par une position (héliocentrique, km) : à cette distance, de ce côté-là. */
export function orbiteParLa(nom: string, t: number, ici: Vecteur3): OrbiteCirculaire {
  const rel = moins(ici, position(nom, t))
  // Dans le repère des orbites (équatorial, voir capsule.ts) ; l'orbite est choisie pour passer exactement par là :
  // son nœud dans la direction de la capsule, inclinée à 90° si elle est hors du plan de l'équateur.
  const ob = 23.4392911 * (Math.PI / 180)
  const x = rel.x, y = Math.cos(ob) * rel.y - Math.sin(ob) * rel.z, z = Math.sin(ob) * rel.y + Math.cos(ob) * rel.z
  const h = Math.hypot(x, y), rayon = Math.max(rayonArrivee(nom), norme(rel))
  const plat = Math.abs(z) < 1e-6 * (h + 1)
  return { centre: nom, mu: gmAstre(nom), rayon, inclinaison: plat ? 0 : Math.PI / 2, noeud: plat ? 0 : Math.atan2(y, x), epoque: t, phase: plat ? Math.atan2(y, x) : Math.atan2(z, h) }
}

export type Phase = 'orbite' | 'trajet'

export class Mission {
  /** Orbite actuelle (avant le départ, ou après l'arrivée). */
  orbite: OrbiteCirculaire = ORBITE_DEPART
  /** Trajet en cours (ou terminé : on est alors sur l'orbite d'arrivée). */
  plan: Plan | null = null
  private orbiteArrivee: OrbiteCirculaire | null = null

  phase(t: number): Phase {
    return this.plan && t >= this.plan.depart && t < this.plan.arrivee ? 'trajet' : 'orbite'
  }

  /** Astre autour duquel la capsule tourne (ou vers lequel elle va). */
  centre(t: number): string {
    if (this.plan && t >= this.plan.depart) return this.plan.cible
    return this.orbite.centre
  }

  etat(t: number): EtatCapsule {
    const p = this.plan
    if (p && t >= p.depart && t < p.arrivee) {
      const { r, v } = etatSurTrajet(p, t)
      const l = norme(v)
      return { position: r, vitesse: v, cap: { x: v.x / l, y: v.y / l, z: v.z / l } }
    }
    if (p && t >= p.arrivee) {
      if (!this.orbiteArrivee) this.orbiteArrivee = orbiteAutour(p.cible, p.arrivee, etatSurTrajet(p, p.arrivee - 60_000).r)
      return etatSurOrbite(this.orbiteArrivee, t)
    }
    return etatSurOrbite(this.orbite, t)
  }

  /** Orbite sur laquelle tourne la capsule à l'instant t (null pendant un trajet). */
  orbiteActuelle(t: number): OrbiteCirculaire | null {
    if (this.phase(t) === 'trajet') return null
    if (this.plan && t >= this.plan.arrivee) {
      this.etat(t) // calcule l'orbite d'arrivée si besoin
      return this.orbiteArrivee
    }
    return this.orbite
  }

  /** État héliocentrique (position, vitesse) à l'instant t, pour planifier un trajet. */
  etatHeliocentrique(t: number): { r: Vecteur3; v: Vecteur3 } {
    const e = this.etat(t)
    if (this.phase(t) === 'trajet') return { r: e.position, v: e.vitesse }
    const c = this.centre(t)
    const vc = vitesseAstre(c, t)
    return { r: e.position, v: { x: vc.x + e.vitesse.x, y: vc.y + e.vitesse.y, z: vc.z + e.vitesse.z } }
  }

  /** Part pour le trajet prévu (depuis l'orbite actuelle, ou en cours de route). */
  partir(plan: Plan): void {
    // L'orbite d'où l'on part devient celle d'arrivée du trajet précédent, s'il y en avait un (calculée au besoin :
    // après une sauvegarde, elle ne l'a peut-être jamais été).
    if (this.plan && plan.depart >= this.plan.arrivee) {
      this.orbiteActuelle(plan.depart)
      if (this.orbiteArrivee) this.orbite = this.orbiteArrivee
    }
    this.plan = plan
    this.orbiteArrivee = null
  }

  /**
   * Décroche la capsule de l'objet autour duquel elle tourne (un chasseur abattu, que son renfort remplace ailleurs) :
   * elle reste où elle est, en orbite autour de `centre` (sa planète). Sans quoi elle sauterait avec lui.
   */
  decrocher(t: number, centre: string): void {
    if (this.phase(t) !== 'orbite') return
    const ici = this.etat(t).position
    this.orbite = orbiteParLa(centre, t, ici)
    this.plan = null
    this.orbiteArrivee = null
  }

}
