// Directions des étoiles du sextant.
// Les étoiles sont si lointaines que leur direction est la même partout dans le système solaire.

import type { Etoile } from '../donnees/etoiles'
import { RAD, type Vecteur3 } from './vecteur'

/** Direction de l'étoile (vecteur unitaire, écliptique J2000). */
export function directionEtoile(e: Etoile): Vecteur3 {
  const lon = e.azimut * RAD, lat = e.hauteur * RAD
  return { x: Math.cos(lat) * Math.cos(lon), y: Math.cos(lat) * Math.sin(lon), z: Math.sin(lat) }
}

/** Écart de visée (degrés) entre deux directions données en azimut et hauteur : écart d'azimut × cos(hauteur). */
export function ecartVisee(azimut: number, hauteur: number, cible: Etoile): number {
  const dAz = ((azimut - cible.azimut) % 360 + 540) % 360 - 180
  return Math.hypot(dAz * Math.cos(cible.hauteur * RAD), hauteur - cible.hauteur)
}
