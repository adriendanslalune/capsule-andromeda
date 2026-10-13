// Positions réelles des planètes (héliocentriques, écliptique J2000, en UA).
// Même calcul que le prototype : éléments de Standish, 6 itérations de Newton pour Kepler.

import { PLANETES, type NomPlanete, type Planete } from '../donnees/planetes'
import { sieclesDepuisJ2000 } from './temps'
import { positionOrbitale, type Vecteur3 } from './vecteur'

const PAR_NOM = new Map<NomPlanete, Planete>(PLANETES.map((p) => [p.nom, p]))

export function planete(nom: NomPlanete): Planete {
  return PAR_NOM.get(nom)!
}

/** Position héliocentrique de la planète à l'instant t (ms UTC), en UA. */
export function positionPlanete(nom: NomPlanete, t: number): Vecteur3 {
  const { elements, parSiecle } = planete(nom)
  const T = sieclesDepuisJ2000(t)
  const [a, e, I, L, varpi, noeud] = elements.map((v, j) => v + parSiecle[j] * T)
  // Anomalie moyenne ramenée entre −180° et 180°, comme dans le prototype.
  const M = (((L - varpi) % 360) + 540) % 360 - 180
  return positionOrbitale(a, e, M, varpi - noeud, noeud, I)
}
