// Vecteurs. Repère du moteur : écliptique et équinoxe J2000, x vers le point vernal, z vers le pôle nord de
// l'écliptique. La carte est la vue du dessus : elle n'utilise que x et y.

export interface Vecteur3 {
  x: number
  y: number
  z: number
}

export const RAD = Math.PI / 180

export function ajouter(a: Vecteur3, b: Vecteur3): Vecteur3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function distance(a: Vecteur3, b: Vecteur3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Vecteur à partir de coordonnées sphériques (longitude, latitude en radians ; rayon). */
export function depuisSpheriques(lon: number, lat: number, r: number): Vecteur3 {
  const c = Math.cos(lat)
  return { x: r * c * Math.cos(lon), y: r * c * Math.sin(lon), z: r * Math.sin(lat) }
}
