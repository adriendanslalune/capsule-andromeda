// Sondes et télescopes lointains : trajectoires pré-calculées par JPL Horizons (données du jeu, 2026 → 2029),
// interpolées entre les points (courbe de Catmull-Rom). Seul le centre (Soleil, Terre, Jupiter) est recalculé ici,
// avec les planètes du prototype.

import { TRAJECTOIRES, type Trajectoire } from '../donnees/engins-jpl'
import { MS_PAR_JOUR, UA_KM } from './temps'
import type { Vecteur3 } from './vecteur'

export { TRAJECTOIRES }

function point(tr: Trajectoire, n: number): Vecteur3 {
  const k = Math.max(0, Math.min(tr.points.length / 3 - 1, n)) * 3
  return { x: tr.points[k], y: tr.points[k + 1], z: tr.points[k + 2] }
}

function catmullRom(a: Vecteur3, b: Vecteur3, c: Vecteur3, d: Vecteur3, u: number): Vecteur3 {
  const f = (p0: number, p1: number, p2: number, p3: number) =>
    0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u)
  return { x: f(a.x, b.x, c.x, d.x), y: f(a.y, b.y, c.y, d.y), z: f(a.z, b.z, c.z, d.z) }
}

/**
 * Position de la sonde vue de son centre (km). Avant le premier point, on garde le premier ; après le dernier, on
 * prolonge en ligne droite (le prototype ne sert que sur la période couverte).
 */
export function positionSondeRelative(tr: Trajectoire, t: number): Vecteur3 {
  const f = (t - tr.debut) / (tr.pasJours * MS_PAR_JOUR)
  const dernier = tr.points.length / 3 - 1
  let p: Vecteur3
  if (f > dernier) {
    const a = point(tr, dernier - 1), b = point(tr, dernier), k = f - dernier
    p = { x: b.x + (b.x - a.x) * k, y: b.y + (b.y - a.y) * k, z: b.z + (b.z - a.z) * k }
  } else {
    const n = Math.max(0, Math.floor(f))
    p = catmullRom(point(tr, n - 1), point(tr, n), point(tr, n + 1), point(tr, n + 2), Math.max(0, f - n))
  }
  return { x: p.x * UA_KM, y: p.y * UA_KM, z: p.z * UA_KM }
}
