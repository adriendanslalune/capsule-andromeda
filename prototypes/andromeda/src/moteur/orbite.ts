// Orbites : tracé de l'orbite d'un astre, pour la dessiner sur la carte.
//  - planètes et lunes : on échantillonne leurs vraies positions sur une période (le tracé suit les éphémérides) ;
//  - Pluton : sa théorie ne vaut que de 1885 à 2099, plus court qu'une période (248 ans) : on trace son ellipse
//    képlérienne instantanée (orbite « osculatrice »), calculée à partir de sa position et de sa vitesse.

import { corps, position, positionRelative } from './corps'
import { satellite } from '../../../../src/astro/satellites'
import { MS_PAR_JOUR } from './temps'
import type { Vecteur3 } from './vecteur'

/** Constante de gravitation du Soleil, G·M (km³/s²). */
export const GM_SOLEIL = 1.32712440018e11

const PERIODES_JOURS: Record<string, number> = {
  Mercure: 87.969, Vénus: 224.701, Terre: 365.256, Mars: 686.98, Jupiter: 4332.59, Saturne: 10759.22,
  Uranus: 30688.5, Neptune: 60182, Lune: 27.3217,
}

/** Positions (km) le long d'une ellipse képlérienne définie par une position et une vitesse (km, km/s). */
export function ellipseOsculatrice(r: Vecteur3, v: Vecteur3, mu: number, n: number): Vecteur3[] {
  const rn = Math.hypot(r.x, r.y, r.z)
  const v2 = v.x * v.x + v.y * v.y + v.z * v.z
  const a = 1 / (2 / rn - v2 / mu)
  // Moment cinétique et vecteur excentricité.
  const h = { x: r.y * v.z - r.z * v.y, y: r.z * v.x - r.x * v.z, z: r.x * v.y - r.y * v.x }
  const rv = r.x * v.x + r.y * v.y + r.z * v.z
  const ev = {
    x: ((v2 - mu / rn) * r.x - rv * v.x) / mu,
    y: ((v2 - mu / rn) * r.y - rv * v.y) / mu,
    z: ((v2 - mu / rn) * r.z - rv * v.z) / mu,
  }
  const e = Math.hypot(ev.x, ev.y, ev.z)
  // Repère du plan de l'orbite : P vers le périhélie, Q à 90° dans le sens du mouvement.
  const hn = Math.hypot(h.x, h.y, h.z)
  const P = e > 1e-9 ? { x: ev.x / e, y: ev.y / e, z: ev.z / e } : { x: r.x / rn, y: r.y / rn, z: r.z / rn }
  const Q = { x: (h.y * P.z - h.z * P.y) / hn, y: (h.z * P.x - h.x * P.z) / hn, z: (h.x * P.y - h.y * P.x) / hn }
  const b = a * Math.sqrt(1 - e * e)
  const points: Vecteur3[] = []
  for (let k = 0; k <= n; k++) {
    const E = (2 * Math.PI * k) / n
    const x = a * (Math.cos(E) - e), y = b * Math.sin(E)
    points.push({ x: P.x * x + Q.x * y, y: P.y * x + Q.y * y, z: P.z * x + Q.z * y })
  }
  return points
}

/**
 * Tracé de l'orbite d'un astre à l'instant t : n + 1 points (km). Pour une planète ou Pluton, positions
 * héliocentriques ; pour une lune, positions relatives à sa planète (à ajouter à la position actuelle de la planète).
 * Renvoie null pour ce qui n'a pas d'orbite à tracer (Soleil, sondes, satellites artificiels).
 */
export function traceOrbite(nom: string, t: number, n = 256): Vecteur3[] | null {
  const c = corps(nom)
  if (!c) return null
  if (nom === 'Pluton') {
    // Vitesse par différence des positions à ± 50 jours (km/s).
    const ecart = 50 * MS_PAR_JOUR
    const a = position(nom, t - ecart), b = position(nom, t + ecart)
    const s = (2 * ecart) / 1000
    const v = { x: (b.x - a.x) / s, y: (b.y - a.y) / s, z: (b.z - a.z) / s }
    return ellipseOsculatrice(position(nom, t), v, GM_SOLEIL, n)
  }
  let periode: number | undefined = PERIODES_JOURS[nom]
  if (c.type === 'lune' && periode === undefined) periode = satellite(nom)?.periode
  if (!periode || (c.type !== 'planete' && c.type !== 'lune')) return null
  const points: Vecteur3[] = []
  for (let k = 0; k <= n; k++) {
    const tk = t + (k / n - 0.5) * periode * MS_PAR_JOUR
    points.push(c.type === 'planete' ? position(nom, tk) : positionRelative(nom, tk))
  }
  return points
}
