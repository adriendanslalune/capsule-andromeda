// Charon, la grande lune de Pluton (ajoutée à la demande d'Adrien du 20/10/2026 ; absente des données JPL générées des
// satellites des planètes). Orbite circulaire dans le plan de l'équateur de Pluton : demi-grand axe 19 591 km, période
// 6,387 2 jours, pôle de l'orbite (équatorial J2000, UAI) α = 132,993°, δ = −6,163°. La phase est approchée : la
// position de Charon sur son orbite n'est pas celle du ciel réel, à quelques jours près.

import type { Vecteur3 } from '../moteur/vecteur'

export const RAYON_CHARON = 606
const DEMI_GRAND_AXE = 19_591
const PERIODE = 6.3872 * 86_400_000
const J2000 = Date.UTC(2000, 0, 1, 12)
const OBLIQUITE = (23.439291 * Math.PI) / 180

/** Les deux axes du plan de l'orbite, dans l'écliptique J2000 (calculés une fois). */
const [U, V] = (() => {
  const a = (132.993 * Math.PI) / 180, d = (-6.163 * Math.PI) / 180
  const pe = { x: Math.cos(d) * Math.cos(a), y: Math.cos(d) * Math.sin(a), z: Math.sin(d) }
  // Du repère équatorial au repère écliptique.
  const p = { x: pe.x, y: pe.y * Math.cos(OBLIQUITE) + pe.z * Math.sin(OBLIQUITE), z: -pe.y * Math.sin(OBLIQUITE) + pe.z * Math.cos(OBLIQUITE) }
  // u : vers le nœud ascendant (axe z de l'écliptique × pôle) ; v = pôle × u.
  const n = Math.hypot(p.x, p.y)
  const u = { x: -p.y / n, y: p.x / n, z: 0 }
  const v = { x: p.y * u.z - p.z * u.y, y: p.z * u.x - p.x * u.z, z: p.x * u.y - p.y * u.x }
  return [u, v]
})()

/** Position de Charon vue du centre de Pluton (écliptique J2000, km). */
export function positionCharon(t: number): Vecteur3 {
  const th = (2 * Math.PI * (t - J2000)) / PERIODE
  const c = Math.cos(th) * DEMI_GRAND_AXE, s = Math.sin(th) * DEMI_GRAND_AXE
  return { x: c * U.x + s * V.x, y: c * U.y + s * V.y, z: c * U.z + s * V.z }
}
