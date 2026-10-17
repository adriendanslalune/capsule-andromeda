// La mission de la capsule : en orbite autour d'un astre, puis un trajet vers une destination, puis de nouveau en
// orbite autour de la destination.
//
// Le trajet est un arc de conique, solution du problème de Lambert entre la position de la capsule au départ et la
// position FUTURE de la destination à l'arrivée (le point de rendez-vous). Autour du Soleil pour aller d'un système
// à l'autre ; autour de la planète quand on reste dans son système (de l'ISS à Hubble, de la Terre à la Lune) : le
// trajet fait alors le tour de la planète comme une vraie orbite, au lieu d'une ligne droite qui la traverserait.
// La durée découle de la puissance des moteurs : le budget de delta-v (km/s). On prend le trajet le plus rapide dont
// le coût — changement de vitesse au départ, plus changement de vitesse à l'arrivée pour rester avec la
// destination — tient dans le budget, et qui ne traverse aucun astre (règle d'or d'Adrien, 17/10/2026).

import { etatSurOrbite, GM_TERRE, ORBITE_DEPART, type EtatCapsule, type OrbiteCirculaire } from './capsule'
import { astreDominant, corps, enfants, position, RAPPORT_MASSE_SOLEIL_ASTRES } from './corps'
import { propager } from './kepler'
import { lambert } from './lambert'
import { GM_SOLEIL } from './orbite'
import type { Vecteur3 } from './vecteur'

const moins = (a: Vecteur3, b: Vecteur3) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const norme = (a: Vecteur3) => Math.hypot(a.x, a.y, a.z)

/** Vitesse héliocentrique d'un astre (km/s), par différence de positions à ± 30 s. */
export function vitesseAstre(nom: string, t: number): Vecteur3 {
  const a = position(nom, t - 30_000), b = position(nom, t + 30_000)
  return { x: (b.x - a.x) / 60, y: (b.y - a.y) / 60, z: (b.z - a.z) / 60 }
}

export interface Plan {
  cible: string
  /** Astre autour duquel se fait le trajet : le Soleil, ou la planète quand on reste dans son système. */
  centre: string
  /** Instants de départ et d'arrivée (ms UTC). */
  depart: number
  arrivee: number
  /** Position et vitesse au départ, sur le trajet, par rapport au centre du trajet (km, km/s). */
  r1: Vecteur3
  v1: Vecteur3
  /** Point de rendez-vous : où sera la destination à l'arrivée (héliocentrique, km). */
  rendezVous: Vecteur3
  /** Coûts (km/s). */
  dvDepart: number
  dvArrivee: number
}

export type Planification = { possible: true; plan: Plan } | { possible: false; dvMinimum: number }

const ORIGINE: Vecteur3 = { x: 0, y: 0, z: 0 }
/** Position et vitesse d'un centre de trajet (le Soleil est à l'origine). */
const positionCentre = (centre: string, t: number) => (centre === 'Soleil' ? ORIGINE : position(centre, t))
const vitesseCentre = (centre: string, t: number) => (centre === 'Soleil' ? ORIGINE : vitesseAstre(centre, t))

/** Coût et trajet pour une durée de vol donnée (s), autour du centre donné. Positions relatives au centre. */
function essai(r1: Vecteur3, vDepart: Vecteur3, cible: string, t0: number, duree: number, centre: string) {
  const t1 = t0 + duree * 1000
  const r2 = moins(position(cible, t1), positionCentre(centre, t1))
  const s = lambert(r1, r2, duree, gmAstre(centre))
  if (!s) return null
  const dvDepart = norme(moins(s.v1, vDepart))
  const dvArrivee = norme(moins(s.v2, moins(vitesseAstre(cible, t1), vitesseCentre(centre, t1))))
  if (!Number.isFinite(dvDepart + dvArrivee)) return null
  return { t1, r2, v1: s.v1, dvDepart, dvArrivee, dv: dvDepart + dvArrivee }
}

/** Planète du système d'un astre (lui-même pour une planète, sa planète pour une lune ou un satellite). */
function systemeDe(nom: string, t: number): string {
  const c = corps(nom)
  if (!c) return 'Soleil'
  if (c.type === 'planete' || c.type === 'naine') return nom
  if (c.parent) return c.parent
  return astreDominant(position(nom, t), t)
}

/** Centre du trajet : la planète si l'on reste dans son système (sans aller sur la planète elle-même), sinon le Soleil. */
export function centreDuTrajet(r1: Vecteur3, cible: string, t0: number): string {
  const ici = astreDominant(r1, t0)
  return ici !== 'Soleil' && ici !== cible && systemeDe(cible, t0) === ici ? ici : 'Soleil'
}

/** Position et vitesse (héliocentriques) sur un trajet, à l'instant t. */
export function etatSurTrajet(p: Plan, t: number): { r: Vecteur3; v: Vecteur3 } {
  const { r, v } = propager(p.r1, p.v1, (t - p.depart) / 1000, gmAstre(p.centre))
  const c = positionCentre(p.centre, t), vc = vitesseCentre(p.centre, t)
  return { r: { x: r.x + c.x, y: r.y + c.y, z: r.z + c.z }, v: { x: v.x + vc.x, y: v.y + vc.y, z: v.z + vc.z } }
}

/** Rayon de sécurité d'un astre (km) : on ne passe jamais à moins de 2 % de son rayon (au moins 100 km) de sa surface. */
function securite(nom: string): number {
  const r = corps(nom)?.rayon ?? 0
  return r + Math.max(0.02 * r, 100)
}

/**
 * Astres qu'un trajet risque de traverser : le Soleil, l'astre d'où l'on part et ses grandes lunes, l'astre autour
 * duquel tourne la destination (pas la destination elle-même : le trajet finit sur elle).
 */
export function astresAEviter(r1: Vecteur3, cible: string, t0: number): string[] {
  const noms = new Set(['Soleil'])
  const depart = astreDominant(r1, t0)
  if (depart !== 'Soleil') {
    noms.add(depart)
    for (const l of enfants(depart)) if (l.type === 'lune' && l.rayon >= 500) noms.add(l.nom)
  }
  const parent = corps(cible)?.parent
  if (parent) noms.add(parent)
  noms.delete(cible)
  return [...noms]
}

/**
 * Règle d'or : le trajet passe-t-il dans un astre ? Points plus serrés au début (on part souvent tout près d'une
 * planète), en comparant à la position de l'astre au même instant.
 */
export function traverseUnAstre(r1: Vecteur3, v1: Vecteur3, t0: number, duree: number, noms: string[], centre = 'Soleil'): boolean {
  const N = 80
  for (let k = 1; k < N; k++) {
    const dt = duree * (k / N) ** 2
    const rel = propager(r1, v1, dt, gmAstre(centre)).r
    const c = positionCentre(centre, t0 + dt * 1000)
    const r = { x: rel.x + c.x, y: rel.y + c.y, z: rel.z + c.z }
    for (const nom of noms) if (norme(moins(r, position(nom, t0 + dt * 1000))) < securite(nom)) return true
  }
  return false
}

/**
 * Trajet le plus rapide de la capsule (état héliocentrique r, v à l'instant t0) vers une destination, pour un budget
 * de delta-v donné (km/s). Si aucun trajet ne tient dans le budget, renvoie le coût minimal trouvé.
 */
export function planifier(depart: { r: Vecteur3; v: Vecteur3 }, cible: string, t0: number, budget: number): Planification {
  // Durées de vol essayées : de 10 minutes à 60 ans, en progression géométrique.
  const N = 140, dMin = 600, dMax = 60 * 365.25 * 86_400
  let precedente: number | null = null
  let dvMinimum = Infinity
  const eviter = astresAEviter(depart.r, cible, t0)
  const centre = centreDuTrajet(depart.r, cible, t0)
  const r1 = moins(depart.r, positionCentre(centre, t0))
  const vDepart = moins(depart.v, vitesseCentre(centre, t0))
  const libre = (e: { v1: Vecteur3 }, duree: number) => !traverseUnAstre(r1, e.v1, t0, duree, eviter, centre)
  for (let i = 0; i <= N; i++) {
    const duree = dMin * (dMax / dMin) ** (i / N)
    const e = essai(r1, vDepart, cible, t0, duree, centre)
    if (!e) continue
    if (!libre(e, duree)) { precedente = duree; continue }
    dvMinimum = Math.min(dvMinimum, e.dv)
    if (e.dv <= budget) {
      // Première durée qui tient dans le budget : on affine entre elle et la précédente (trop chère).
      let lent = duree, rapide = precedente ?? duree
      for (let k = 0; k < 40 && precedente !== null; k++) {
        const m = Math.sqrt(lent * rapide)
        const em = essai(r1, vDepart, cible, t0, m, centre)
        if (em && em.dv <= budget && libre(em, m)) lent = m
        else rapide = m
      }
      const f = essai(r1, vDepart, cible, t0, lent, centre)!
      const c1 = positionCentre(centre, f.t1)
      return {
        possible: true,
        plan: { cible, centre, depart: t0, arrivee: f.t1, r1, v1: f.v1, rendezVous: { x: f.r2.x + c1.x, y: f.r2.y + c1.y, z: f.r2.z + c1.z },
          dvDepart: f.dvDepart, dvArrivee: f.dvArrivee },
      }
    }
    precedente = duree
  }
  return { possible: false, dvMinimum }
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
  const c = corps(nom)
  const rayon = c?.tailleM ? 0.06 : nom === 'Soleil' ? 5 * c!.rayon : Math.max(1.3 * (c?.rayon || 1.5), (c?.rayon || 1.5) + 150)
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
    // L'orbite d'où l'on part devient celle d'arrivée du trajet précédent, s'il y en avait un.
    if (this.plan && plan.depart >= this.plan.arrivee && this.orbiteArrivee) this.orbite = this.orbiteArrivee
    this.plan = plan
    this.orbiteArrivee = null
  }

  /** Points du trajet (héliocentriques, km), pour le dessiner. */
  trace(n = 200): { t: number; r: Vecteur3 }[] {
    const p = this.plan
    if (!p) return []
    return traceTrajet(p, n)
  }
}

/** Points d'un trajet (héliocentriques, km) à intervalles réguliers. */
export function traceTrajet(p: Plan, n = 200): { t: number; r: Vecteur3 }[] {
  const points: { t: number; r: Vecteur3 }[] = []
  for (let k = 0; k <= n; k++) {
    const t = p.depart + ((p.arrivee - p.depart) * k) / n
    points.push({ t, r: etatSurTrajet(p, t).r })
  }
  return points
}
