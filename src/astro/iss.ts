// Position de la Station spatiale internationale (ISS), par la méthode officielle de suivi des satellites (SGP4),
// à partir de son orbite publiée (TLE). Le moteur ne télécharge rien : l'orbite lui est fournie (definirOrbiteISS).

import { propagate, twoline2satrec, type SatRec } from 'satellite.js'
import { AGE_MAX_ORBITE_ISS, ORBITE_ISS_SECOURS, type OrbiteTLE } from '../donnees/iss'
import { MS_PAR_JOUR, sieclesDepuisJ2000 } from './temps'
import { equatorialVersEcliptique, RAD, type Vecteur3 } from './vecteur'

/** Précession générale en longitude (degrés par siècle), pour revenir à l'équinoxe J2000. */
const PRECESSION_PAR_SIECLE = 1.3969713

/** Une orbite TLE : deux lignes de 69 caractères, commençant par « 1 » et « 2 », avec leurs sommes de contrôle. */
function estTLEValide(o: OrbiteTLE): boolean {
  const controle = (ligne: string) => {
    let somme = 0
    for (const c of ligne.slice(0, 68)) somme += c === '-' ? 1 : /[0-9]/.test(c) ? Number(c) : 0
    return somme % 10 === Number(ligne[68])
  }
  return [o.ligne1, o.ligne2].every((l, k) => l.length === 69 && l.startsWith(`${k + 1} `) && controle(l))
}

let orbite: OrbiteTLE = ORBITE_ISS_SECOURS
let satrec: SatRec = twoline2satrec(orbite.ligne1, orbite.ligne2)

/** Remplace l'orbite de l'ISS (par exemple après un téléchargement). */
export function definirOrbiteISS(nouvelle: OrbiteTLE): void {
  const essai = estTLEValide(nouvelle) ? twoline2satrec(nouvelle.ligne1, nouvelle.ligne2) : null
  if (!essai || essai.error) throw new Error("Orbite de l'ISS invalide")
  orbite = nouvelle
  satrec = essai
}

/** Orbite de l'ISS actuellement utilisée. */
export function orbiteISS(): OrbiteTLE {
  return orbite
}

/** Date de la mesure de l'orbite (ms UTC). */
export function epoqueOrbiteISS(): number {
  return (satrec.jdsatepoch - 2440587.5) * MS_PAR_JOUR
}

/**
 * Vrai si la position de l'ISS à l'instant t est une simulation (orbite trop ancienne ou trop en avance) :
 * l'interface doit alors le signaler au joueur.
 */
export function positionISSSimulee(t: number): boolean {
  return Math.abs(t - epoqueOrbiteISS()) > AGE_MAX_ORBITE_ISS * MS_PAR_JOUR
}

/**
 * Position de l'ISS vue du centre de la Terre (écliptique J2000, en km).
 * SGP4 donne la position dans le repère équatorial du jour (TEME) : on passe à l'écliptique, puis on retire la
 * précession depuis l'an 2000 (environ 0,37° en 2026, soit plus de 40 km à l'altitude de l'ISS).
 */
export function positionISSGeocentrique(t: number): Vecteur3 {
  const r = propagate(satrec, new Date(t))
  if (!r) throw new Error("Calcul de la position de l'ISS impossible")
  const e = equatorialVersEcliptique(r.position)
  const a = -PRECESSION_PAR_SIECLE * sieclesDepuisJ2000(t) * RAD
  return { x: e.x * Math.cos(a) - e.y * Math.sin(a), y: e.x * Math.sin(a) + e.y * Math.cos(a), z: e.z }
}

/** Demi-grand axe moyen de l'orbite (km), d'après le mouvement moyen de la TLE. */
export function demiGrandAxeISS(): number {
  const n = (satrec.no / 60) // rad/s
  const GM_TERRE = 398600.4418
  return Math.cbrt(GM_TERRE / (n * n))
}

/** Période orbitale de l'ISS (jours). */
export function periodeISS(): number {
  return (2 * Math.PI) / satrec.no / 1440
}
