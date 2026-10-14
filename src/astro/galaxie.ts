// Coordonnées galactiques (la Voie lactée) : passage du repère écliptique J2000 du jeu au repère galactique
// (longitude l, latitude b ; l = 0 vers le centre de la Galaxie, dans le Sagittaire ; b = 0 dans le plan de la
// Voie lactée). Matrice équatorial J2000 → galactique de l'IAU (Hipparcos), précédée de la rotation de l'obliquité.

import { OBLIQUITE_J2000, type Vecteur3 } from './vecteur'

const RAD = Math.PI / 180

/** Équatorial J2000 → galactique (lignes de la matrice). */
const EQ_VERS_GAL = [
  [-0.0548755604162154, -0.8734370902348850, -0.4838350155487132],
  [0.4941094278755837, -0.4448296299600112, 0.7469822444972189],
  [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669],
]

/** Écliptique J2000 → galactique : rotation de l'obliquité, puis la matrice de l'IAU. */
export const ECL_VERS_GAL: number[][] = (() => {
  const c = Math.cos(OBLIQUITE_J2000 * RAD), s = Math.sin(OBLIQUITE_J2000 * RAD)
  // équatorial = Rx(ε) · écliptique
  const r = [[1, 0, 0], [0, c, -s], [0, s, c]]
  return EQ_VERS_GAL.map((ligne) => [0, 1, 2].map((j) => ligne[0] * r[0][j] + ligne[1] * r[1][j] + ligne[2] * r[2][j]))
})()

/** Direction écliptique (vecteur) → direction galactique. */
export function versGalactique(v: Vecteur3): Vecteur3 {
  const m = ECL_VERS_GAL
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  }
}

/** Coordonnées galactiques (degrés) → longitude et latitude écliptiques (degrés). */
export function galactiqueVersEcliptique(l: number, b: number): { lon: number; lat: number } {
  const g = { x: Math.cos(b * RAD) * Math.cos(l * RAD), y: Math.cos(b * RAD) * Math.sin(l * RAD), z: Math.sin(b * RAD) }
  // La matrice est orthogonale : son inverse est sa transposée.
  const m = ECL_VERS_GAL
  const x = m[0][0] * g.x + m[1][0] * g.y + m[2][0] * g.z
  const y = m[0][1] * g.x + m[1][1] * g.y + m[2][1] * g.z
  const z = m[0][2] * g.x + m[1][2] * g.y + m[2][2] * g.z
  return { lon: ((Math.atan2(y, x) / RAD) + 360) % 360, lat: Math.asin(Math.max(-1, Math.min(1, z))) / RAD }
}
