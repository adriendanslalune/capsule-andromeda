// Position des engins humains (héliocentrique, écliptique J2000, UA) : SGP4 pour ceux qui tournent autour de la
// Terre à basse altitude, interpolation des trajectoires de JPL Horizons pour les autres.

import { approcheEnginKm, ENGINS, type FicheEngin } from '../donnees/engins'
import { TRAJECTOIRES, type Trajectoire } from '../donnees/engins-jpl'
import type { NomPlanete } from '../donnees/planetes'
import { positionTLEGeocentrique } from './iss'
import { positionPlanete } from './planetes'
import { twoline2satrec, type SatRec } from './sgp4'
import { MS_PAR_JOUR, UA_KM } from './temps'
import type { Vecteur3 } from './vecteur'

const FICHES = new Map(ENGINS.map((e) => [e.nom, e]))
const TRAJETS = new Map(TRAJECTOIRES.map((t) => [t.nom, t]))
const ORBITES = new Map<string, SatRec>()
for (const e of ENGINS) if (e.tle) ORBITES.set(e.nom, twoline2satrec(e.tle.ligne1, e.tle.ligne2))

export function estEngin(nom: string): boolean {
  return FICHES.has(nom)
}

export function ficheEngin(nom: string): FicheEngin | undefined {
  return FICHES.get(nom)
}

/** Distance d'approche d'un engin (km). */
export function approcheEngin(nom: string): number {
  return approcheEnginKm(FICHES.get(nom)?.tailleM ?? 30)
}

/** Planète autour de laquelle tourne l'engin (Hubble, Tiangong : la Terre ; Juno : Jupiter), ou null. */
export function planeteDeLEngin(nom: string): NomPlanete | null {
  if (ORBITES.has(nom)) return 'Terre'
  const tr = TRAJETS.get(nom)
  return tr && tr.centre !== 'Soleil' ? tr.centre : null
}

/** Noms de tous les engins (hors ISS). */
export const NOMS_ENGINS: readonly string[] = ENGINS.map((e) => e.nom)

/** Point n de la trajectoire (vu de son centre). */
function point(tr: Trajectoire, n: number): Vecteur3 {
  const k = Math.max(0, Math.min(tr.points.length / 3 - 1, n)) * 3
  return { x: tr.points[k], y: tr.points[k + 1], z: tr.points[k + 2] }
}

/** Interpolation de Catmull-Rom entre les points n et n + 1 (u de 0 à 1). */
function catmullRom(a: Vecteur3, b: Vecteur3, c: Vecteur3, d: Vecteur3, u: number): Vecteur3 {
  const f = (p0: number, p1: number, p2: number, p3: number) =>
    0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u)
  return { x: f(a.x, b.x, c.x, d.x), y: f(a.y, b.y, c.y, d.y), z: f(a.z, b.z, c.z, d.z) }
}

function centre(tr: Trajectoire, t: number): Vecteur3 {
  return tr.centre === 'Soleil' ? { x: 0, y: 0, z: 0 } : positionPlanete(tr.centre, t)
}

/** Position d'après la trajectoire de JPL ; après le dernier point, auprès de sa planète ou en ligne droite. */
function positionTrajectoire(tr: Trajectoire, t: number): Vecteur3 {
  const pas = tr.pasJours * MS_PAR_JOUR
  const dernier = tr.points.length / 3 - 1
  const f = (t - tr.debut) / pas
  if (f > dernier) {
    const fin = tr.debut + dernier * pas
    const p = point(tr, dernier)
    if (tr.apres) {
      // L'engin reste auprès de sa planète, au même écart qu'à la fin des données.
      const planete = tr.apres as NomPlanete
      const c = centre(tr, fin), q = positionPlanete(planete, fin), ici = positionPlanete(planete, t)
      return { x: ici.x + p.x + c.x - q.x, y: ici.y + p.y + c.y - q.y, z: ici.z + p.z + c.z - q.z }
    }
    const avant = point(tr, dernier - 1)
    const k = f - dernier
    const c = centre(tr, t)
    return { x: c.x + p.x + (p.x - avant.x) * k, y: c.y + p.y + (p.y - avant.y) * k, z: c.z + p.z + (p.z - avant.z) * k }
  }
  const n = Math.max(0, Math.floor(f))
  const u = Math.max(0, f - n)
  const p = catmullRom(point(tr, n - 1), point(tr, n), point(tr, n + 1), point(tr, n + 2), u)
  const c = centre(tr, t)
  return { x: c.x + p.x, y: c.y + p.y, z: c.z + p.z }
}

/** Position héliocentrique d'un engin (UA). */
export function positionEngin(nom: string, t: number): Vecteur3 {
  const orbite = ORBITES.get(nom)
  if (orbite) {
    // Loin de la date de l'orbite publiée, SGP4 finit par échouer (freinage par l'atmosphère) : on rejoue alors
    // la dernière année calculable (position simulée).
    let g: Vecteur3
    try {
      g = positionTLEGeocentrique(orbite, t)
    } catch {
      const epoque = (orbite.jdsatepoch - 2440587.5) * MS_PAR_JOUR
      g = positionTLEGeocentrique(orbite, epoque + (((t - epoque) % (365 * MS_PAR_JOUR)) + 365 * MS_PAR_JOUR) % (365 * MS_PAR_JOUR))
    }
    const terre = positionPlanete('Terre', t)
    return { x: terre.x + g.x / UA_KM, y: terre.y + g.y / UA_KM, z: terre.z + g.z / UA_KM }
  }
  const tr = TRAJETS.get(nom)
  if (!tr) throw new Error(`Engin inconnu : ${nom}`)
  return positionTrajectoire(tr, t)
}

/** Tous les engins à l'instant t. */
export function positionsEngins(t: number): { nom: string; position: Vecteur3; fiche: FicheEngin }[] {
  return ENGINS.map((fiche) => ({ nom: fiche.nom, position: positionEngin(fiche.nom, t), fiche }))
}
