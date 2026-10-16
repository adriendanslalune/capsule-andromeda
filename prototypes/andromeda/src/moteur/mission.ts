// La mission de la capsule : en orbite autour d'un astre, puis un trajet vers une destination, puis de nouveau en
// orbite autour de la destination.
//
// Le trajet est un arc de conique autour du Soleil, solution du problème de Lambert entre la position de la capsule
// au départ et la position FUTURE de la destination à l'arrivée (le point de rendez-vous). Seul le Soleil compte :
// on ignore la gravité des planètes au départ et à l'arrivée (règle du prototype).
// La durée découle de la puissance des moteurs : le budget de delta-v (km/s). On prend le trajet le plus rapide dont
// le coût — changement de vitesse au départ, plus changement de vitesse à l'arrivée pour rester avec la
// destination — tient dans le budget.

import { etatSurOrbite, GM_TERRE, ORBITE_DEPART, type EtatCapsule, type OrbiteCirculaire } from './capsule'
import { corps, position, RAPPORT_MASSE_SOLEIL_ASTRES } from './corps'
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
  /** Instants de départ et d'arrivée (ms UTC). */
  depart: number
  arrivee: number
  /** Position et vitesse héliocentriques au départ, sur le trajet (km, km/s). */
  r1: Vecteur3
  v1: Vecteur3
  /** Point de rendez-vous : où sera la destination à l'arrivée (héliocentrique, km). */
  rendezVous: Vecteur3
  /** Coûts (km/s). */
  dvDepart: number
  dvArrivee: number
}

export type Planification = { possible: true; plan: Plan } | { possible: false; dvMinimum: number }

/** Coût et trajet pour une durée de vol donnée (s). */
function essai(r1: Vecteur3, vDepart: Vecteur3, cible: string, t0: number, duree: number) {
  const t1 = t0 + duree * 1000
  const r2 = position(cible, t1)
  const s = lambert(r1, r2, duree, GM_SOLEIL)
  if (!s) return null
  const dvDepart = norme(moins(s.v1, vDepart))
  const dvArrivee = norme(moins(s.v2, vitesseAstre(cible, t1)))
  if (!Number.isFinite(dvDepart + dvArrivee)) return null
  return { t1, r2, v1: s.v1, dvDepart, dvArrivee, dv: dvDepart + dvArrivee }
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
  for (let i = 0; i <= N; i++) {
    const duree = dMin * (dMax / dMin) ** (i / N)
    const e = essai(depart.r, depart.v, cible, t0, duree)
    if (!e) continue
    dvMinimum = Math.min(dvMinimum, e.dv)
    if (e.dv <= budget) {
      // Première durée qui tient dans le budget : on affine entre elle et la précédente (trop chère).
      let lent = duree, rapide = precedente ?? duree
      for (let k = 0; k < 40 && precedente !== null; k++) {
        const m = Math.sqrt(lent * rapide)
        const em = essai(depart.r, depart.v, cible, t0, m)
        if (em && em.dv <= budget) lent = m
        else rapide = m
      }
      const f = essai(depart.r, depart.v, cible, t0, lent)!
      return {
        possible: true,
        plan: { cible, depart: t0, arrivee: f.t1, r1: { ...depart.r }, v1: f.v1, rendezVous: f.r2, dvDepart: f.dvDepart, dvArrivee: f.dvArrivee },
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
      const { r, v } = propager(p.r1, p.v1, (t - p.depart) / 1000, GM_SOLEIL)
      const l = norme(v)
      return { position: r, vitesse: v, cap: { x: v.x / l, y: v.y / l, z: v.z / l } }
    }
    if (p && t >= p.arrivee) {
      if (!this.orbiteArrivee) this.orbiteArrivee = orbiteAutour(p.cible, p.arrivee, propager(p.r1, p.v1, (p.arrivee - p.depart) / 1000 - 60, GM_SOLEIL).r)
      return etatSurOrbite(this.orbiteArrivee, t)
    }
    return etatSurOrbite(this.orbite, t)
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
    points.push({ t, r: propager(p.r1, p.v1, (t - p.depart) / 1000, GM_SOLEIL).r })
  }
  return points
}
