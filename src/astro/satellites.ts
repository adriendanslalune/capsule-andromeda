// Positions réelles des satellites naturels des planètes.
// Chaque orbite est une ellipse qui tourne lentement (nœud et périastre), ajustée sur les positions de précision
// de JPL Horizons ; les orbites très perturbées sont découpées en tranches de temps (voir outils/satellites-jpl.mjs).

import type { NomPlanete } from '../donnees/planetes'
import { SATELLITES, type TrancheOrbite } from '../donnees/satellites'
import { positionPlanete } from './planetes'
import { jourJulien, UA_KM } from './temps'
import { ajouter, multiplier, positionOrbitale, type Vecteur3 } from './vecteur'

export interface Satellite {
  nom: string
  /** Code JPL (par exemple 501 pour Io). */
  code: number
  planete: NomPlanete
  /** Rayon (km), ou null s'il n'est pas connu (petits satellites de quelques kilomètres). */
  rayon: number | null
  /** Demi-grand axe moyen de l'orbite (km). */
  demiGrandAxe: number
  /** Période orbitale moyenne (jours). */
  periode: number
  tranches: readonly TrancheOrbite[]
}

export const LISTE_SATELLITES: readonly Satellite[] = SATELLITES.map(([nom, code, planete, rayon, tranches]) => ({
  nom, code, planete, rayon, tranches,
  demiGrandAxe: tranches.reduce((s, t) => s + t[2], 0) / tranches.length,
  periode: 360 / Math.abs(tranches.reduce((s, t) => s + t[10], 0) / tranches.length),
}))

const PAR_NOM = new Map(LISTE_SATELLITES.map((s) => [s.nom, s]))

export function satellite(nom: string): Satellite | undefined {
  return PAR_NOM.get(nom)
}

/** Satellites d'une planète. */
export function satellitesDe(planete: NomPlanete): Satellite[] {
  return LISTE_SATELLITES.filter((s) => s.planete === planete)
}

/** Tranche d'orbite valable au jour julien jj (la première avant, la dernière après la période couverte). */
function trancheA(s: Satellite, jj: number): TrancheOrbite {
  let choisie = s.tranches[0]
  for (const t of s.tranches) if (t[0] <= jj) choisie = t
  return choisie
}

/** Position du satellite vue du centre de sa planète (écliptique J2000, en km). */
export function positionSatellitePlanetocentrique(s: Satellite, t: number): Vecteur3 {
  const jj = jourJulien(t)
  const [, epoque, a, e, i, noeud0, dNoeud, varpi0, dVarpi, lambda0, dLambda] = trancheA(s, jj)
  const dt = jj - epoque
  const noeud = noeud0 + dNoeud * dt
  const varpi = varpi0 + dVarpi * dt
  const lambda = lambda0 + dLambda * dt
  // Excentricités fortes (jusqu'à 0,75) : quelques itérations de plus pour Kepler.
  return positionOrbitale(a, e, (lambda - varpi) % 360, varpi - noeud, noeud, i, 12)
}

/** Position héliocentrique du satellite (écliptique J2000, en UA). */
export function positionSatellite(s: Satellite, t: number): Vecteur3 {
  return ajouter(positionPlanete(s.planete, t), multiplier(positionSatellitePlanetocentrique(s, t), 1 / UA_KM))
}
