// Petits outils de géométrie.
// Repère commun du jeu : écliptique et équinoxe J2000. x vers le point vernal, y à 90° dans le sens
// trigonométrique, z vers le pôle nord de l'écliptique. Le moteur de jeu n'utilise que x et y (carte en 2D).

export interface Vecteur3 {
  x: number
  y: number
  z: number
}

export const RAD = Math.PI / 180

/** Obliquité de l'écliptique à J2000 (degrés). */
export const OBLIQUITE_J2000 = 23.4392911

export function ajouter(a: Vecteur3, b: Vecteur3): Vecteur3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function soustraire(a: Vecteur3, b: Vecteur3): Vecteur3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function multiplier(a: Vecteur3, k: number): Vecteur3 {
  return { x: a.x * k, y: a.y * k, z: a.z * k }
}

export function norme(a: Vecteur3): number {
  return Math.hypot(a.x, a.y, a.z)
}

/** Angle entre deux directions (degrés). */
export function angleEntre(a: Vecteur3, b: Vecteur3): number {
  const c = (a.x * b.x + a.y * b.y + a.z * b.z) / (norme(a) * norme(b))
  return Math.acos(Math.min(1, Math.max(-1, c))) / RAD
}

/** Passe d'un vecteur équatorial (ICRF) à l'écliptique J2000. */
export function equatorialVersEcliptique(v: Vecteur3): Vecteur3 {
  const c = Math.cos(OBLIQUITE_J2000 * RAD)
  const s = Math.sin(OBLIQUITE_J2000 * RAD)
  return { x: v.x, y: c * v.y + s * v.z, z: -s * v.y + c * v.z }
}

/** Résout l'équation de Kepler E − e·sin E = M (radians), par la méthode de Newton. */
export function resoudreKepler(M: number, e: number, iterations = 6): number {
  let E = M + e * Math.sin(M)
  for (let n = 0; n < iterations; n++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  return E
}

/**
 * Position sur une orbite képlérienne, dans le repère de son plan de référence.
 * Angles en degrés : M anomalie moyenne, omega argument du périastre, noeud longitude du nœud, i inclinaison.
 */
export function positionOrbitale(a: number, e: number, M: number, omega: number, noeud: number, i: number,
  iterations = 6): Vecteur3 {
  const E = resoudreKepler(M * RAD, e, iterations)
  const xp = a * (Math.cos(E) - e)
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
  const co = Math.cos(omega * RAD), so = Math.sin(omega * RAD)
  const cO = Math.cos(noeud * RAD), sO = Math.sin(noeud * RAD)
  const ci = Math.cos(i * RAD), si = Math.sin(i * RAD)
  return {
    x: (co * cO - so * sO * ci) * xp + (-so * cO - co * sO * ci) * yp,
    y: (co * sO + so * cO * ci) * xp + (-so * sO + co * cO * ci) * yp,
    z: so * si * xp + co * si * yp,
  }
}
