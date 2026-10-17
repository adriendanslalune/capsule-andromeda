// Positions réelles des planètes (héliocentriques, écliptique J2000, en UA).
// Théorie VSOP87B (séries tronquées, voir outils/vsop87.mjs) ; écart avec JPL Horizons de 2000 à 2050 :
// moins de 500 km de Mercure à Mars, quelques milliers de km pour Jupiter et Saturne, quelques dizaines de
// milliers de km pour Uranus et Neptune (moins d'une demi-seconde d'arc).
// Les éléments orbitaux de src/donnees/planetes.ts ne servent plus qu'aux tailles d'orbite et aux périodes.

import { PLANETES, type NomPlanete, type Planete } from '../donnees/planetes'
import { VSOP87B, type SerieVSOP } from '../donnees/vsop87'
import { joursTTDepuisJ2000 } from './temps'
import type { Vecteur3 } from './vecteur'

const PAR_NOM = new Map<NomPlanete, Planete>(PLANETES.map((p) => [p.nom, p]))

export function planete(nom: NomPlanete): Planete {
  return PAR_NOM.get(nom)!
}

/** Somme d'une série VSOP87 : Σ τ^n · Σ A·cos(B + C·τ). */
function somme(serie: SerieVSOP, tau: number): number {
  let s = 0
  let puissance = 1
  for (const termes of serie) {
    let t = 0
    for (let k = 0; k < termes.length; k += 3) t += termes[k] * Math.cos(termes[k + 1] + termes[k + 2] * tau)
    s += t * puissance
    puissance *= tau
  }
  return s
}

/** Position exacte selon les séries VSOP87 (environ 600 cosinus par planète : trop lent pour la simulation). */
function positionVSOP(nom: NomPlanete, t: number): Vecteur3 {
  const serie = VSOP87B[nom]
  const tau = joursTTDepuisJ2000(t) / 365250
  const L = somme(serie.L, tau), B = somme(serie.B, tau), R = somme(serie.R, tau)
  return { x: R * Math.cos(B) * Math.cos(L), y: R * Math.cos(B) * Math.sin(L), z: R * Math.sin(B) }
}

// Pour aller vite, les séries ne sont calculées qu'à des instants régulièrement espacés (200 par tour de la planète
// autour du Soleil, et au moins tous les 10 jours à cause des perturbations dues à Jupiter), gardés en mémoire ; entre deux, on interpole par un polynôme de degré 3 passant par les quatre
// instants voisins. Erreur ajoutée : une dizaine de km au plus, très petite devant l'écart de VSOP87 avec le JPL.
const POINTS_PAR_TOUR = 200
const MAX_POINTS_GARDES = 50_000
const PAS_MAX_MS = 10 * 86_400_000
const PAS_MS = new Map<NomPlanete, number>(
  PLANETES.map((p) => [p.nom, Math.min((p.elements[0] ** 1.5 * 365.25 * 86_400_000) / POINTS_PAR_TOUR, PAS_MAX_MS)]),
)
const POINTS = new Map<NomPlanete, Map<number, Vecteur3>>(PLANETES.map((p) => [p.nom, new Map()]))

function point(nom: NomPlanete, i: number): Vecteur3 {
  const points = POINTS.get(nom)!
  let p = points.get(i)
  if (!p) {
    if (points.size >= MAX_POINTS_GARDES) points.clear()
    p = positionVSOP(nom, i * PAS_MS.get(nom)!)
    points.set(i, p)
  }
  return p
}

/** Position héliocentrique de la planète à l'instant t (ms UTC), en UA. */
export function positionPlanete(nom: NomPlanete, t: number): Vecteur3 {
  const u0 = t / PAS_MS.get(nom)!
  const i = Math.floor(u0), u = u0 - i
  const a = point(nom, i - 1), b = point(nom, i), c = point(nom, i + 1), d = point(nom, i + 2)
  // Coefficients de Lagrange pour les instants −1, 0, 1, 2.
  const ka = (-u * (u - 1) * (u - 2)) / 6, kb = ((u + 1) * (u - 1) * (u - 2)) / 2
  const kc = (-(u + 1) * u * (u - 2)) / 2, kd = ((u + 1) * u * (u - 1)) / 6
  return {
    x: ka * a.x + kb * b.x + kc * c.x + kd * d.x,
    y: ka * a.y + kb * b.y + kc * c.y + kd * d.y,
    z: ka * a.z + kb * b.z + kc * c.z + kd * d.z,
  }
}

/** Pour les tests : la position exacte des séries, sans interpolation. */
export const positionPlaneteExacte = positionVSOP
