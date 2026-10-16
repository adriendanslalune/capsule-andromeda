// Triche d'affichage pour les satellites artificiels (ISS, Hubble…) : vus de loin, ils tournent si près de la Terre
// qu'ils disparaissent derrière son disque. Tant que c'est le cas, on dessine leur orbite :
//  - « rabattue » dans le plan de la carte (rotation autour de la ligne des nœuds) : l'orbite, presque circulaire,
//    devient un cercle, parcouru à la vraie vitesse (la période est respectée) ;
//  - écartée de la planète : un peu au-dessus de son bord à l'écran, dans l'ordre réel des altitudes.
// Dès que le vrai rayon de l'orbite est assez grand à l'écran, on revient progressivement à la vraie position.
// Ce n'est que de l'affichage : le moteur (et plus tard la navigation) garde les vraies positions.

import type { Vecteur3 } from '../moteur/vecteur'

/** Écart à l'écran entre le bord de la planète et l'orbite trichée (pixels), selon l'altitude réelle (km). */
function ecartPixels(altitudeKm: number): number {
  return 10 + 14 * Math.sqrt(Math.max(0, altitudeKm) / 400)
}

/** Rotation de Rodrigues du vecteur v autour de l'axe unitaire k, d'un angle (cos c, sin s). */
function tourner(v: Vecteur3, k: Vecteur3, c: number, s: number): Vecteur3 {
  const kv = k.x * v.x + k.y * v.y + k.z * v.z
  const cx = k.y * v.z - k.z * v.y, cy = k.z * v.x - k.x * v.z, cz = k.x * v.y - k.y * v.x
  return {
    x: v.x * c + cx * s + k.x * kv * (1 - c),
    y: v.y * c + cy * s + k.y * kv * (1 - c),
    z: v.z * c + cz * s + k.z * kv * (1 - c),
  }
}

export interface Rabattement {
  /** Axe de rotation (ligne des nœuds) et angle (cosinus, sinus) qui amènent le plan de l'orbite sur la carte. */
  axe: Vecteur3
  c: number
  s: number
}

/** Rabattement d'une orbite, à partir de deux positions proches (le sens de parcours est conservé). */
export function rabattement(r1: Vecteur3, r2: Vecteur3): Rabattement {
  let n = { x: r1.y * r2.z - r1.z * r2.y, y: r1.z * r2.x - r1.x * r2.z, z: r1.x * r2.y - r1.y * r2.x }
  const l = Math.hypot(n.x, n.y, n.z) || 1
  n = { x: n.x / l, y: n.y / l, z: n.z / l }
  // Orbite rétrograde (normale vers le bas) : on la rabat sur le pôle sud, pour garder le sens à l'écran.
  const cible = n.z >= 0 ? 1 : -1
  const c = n.z * cible
  // Axe = n × cible·z, normalisé ; orbite déjà dans le plan : aucune rotation.
  const ax = n.y * cible, ay = -n.x * cible
  const s = Math.hypot(ax, ay)
  if (s < 1e-9) return { axe: { x: 1, y: 0, z: 0 }, c: 1, s: 0 }
  return { axe: { x: ax / s, y: ay / s, z: 0 }, c, s }
}

/**
 * Position affichée (relative à la planète, km) d'un satellite dont la vraie position relative est `rel`.
 * rayonPlanete en km, echelle en km par pixel.
 */
export function positionAffichee(rel: Vecteur3, r: Rabattement, rayonPlanete: number, echelle: number): Vecteur3 {
  const d = Math.hypot(rel.x, rel.y, rel.z)
  if (d === 0) return rel
  const altitude = d - rayonPlanete
  const ecart = ecartPixels(altitude)
  const triche = rayonPlanete + ecart * echelle
  // Poids du vrai : 0 tant que la vraie altitude à l'écran est plus petite que l'écart triché, 1 au double.
  const q = Math.min(1, Math.max(0, altitude / echelle / ecart - 1))
  const w = q * q * (3 - 2 * q)
  if (w === 1) return rel
  const plat = tourner(rel, r.axe, r.c, r.s)
  const k = triche / Math.hypot(plat.x, plat.y)
  return {
    x: plat.x * k * (1 - w) + rel.x * w,
    y: plat.y * k * (1 - w) + rel.y * w,
    z: rel.z * w,
  }
}
