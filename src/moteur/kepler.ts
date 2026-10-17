// Mouvement sur une conique autour d'un astre (ici le Soleil) : propagation d'un état (position, vitesse) dans le
// temps, par la méthode des variables universelles (H. D. Curtis, « Orbital Mechanics for Engineering Students »,
// algorithme 3.4). Valable pour les ellipses, paraboles et hyperboles. Unités : km, km/s, secondes.

import type { Vecteur3 } from './vecteur'

/** Fonctions de Stumpff C(z) et S(z). */
export function stumpffC(z: number): number {
  if (z > 1e-8) return (1 - Math.cos(Math.sqrt(z))) / z
  if (z < -1e-8) return (Math.cosh(Math.sqrt(-z)) - 1) / -z
  return 1 / 2 - z / 24 + (z * z) / 720
}
export function stumpffS(z: number): number {
  if (z > 1e-8) { const s = Math.sqrt(z); return (s - Math.sin(s)) / (s * s * s) }
  if (z < -1e-8) { const s = Math.sqrt(-z); return (Math.sinh(s) - s) / (s * s * s) }
  return 1 / 6 - z / 120 + (z * z) / 5040
}

const point = (a: Vecteur3, b: Vecteur3) => a.x * b.x + a.y * b.y + a.z * b.z
const norme = (a: Vecteur3) => Math.hypot(a.x, a.y, a.z)

/** État (position, vitesse) après un temps dt (s), partant de (r0, v0), sous l'attraction mu (km³/s²). */
export function propager(r0: Vecteur3, v0: Vecteur3, dt: number, mu: number): { r: Vecteur3; v: Vecteur3 } {
  if (dt === 0) return { r: { ...r0 }, v: { ...v0 } }
  const R0 = norme(r0)
  const vr0 = point(r0, v0) / R0
  const alpha = 2 / R0 - point(v0, v0) / mu // inverse du demi-grand axe
  const sm = Math.sqrt(mu)
  // Équation de Kepler universelle en χ : F(χ) est croissante (sa dérivée est la distance r > 0). On encadre la
  // racine (en doublant), puis Newton protégé par dichotomie : robuste même pour une hyperbole très rapide.
  const F = (x: number) => {
    const z = alpha * x * x
    return (R0 * vr0 / sm) * x * x * stumpffC(z) + (1 - alpha * R0) * x ** 3 * stumpffS(z) + R0 * x - sm * dt
  }
  const signe = dt > 0 ? 1 : -1
  let bas = 0, haut = signe * sm * Math.abs(dt) / R0
  for (let k = 0; k < 200 && Number.isFinite(F(haut)) && signe * F(haut) < 0; k++) { bas = haut; haut *= 2 }
  if (!Number.isFinite(F(haut))) {
    // Trop loin : on resserre par dichotomie jusqu'à une borne calculable.
    for (let k = 0; k < 200 && !Number.isFinite(F(haut)); k++) haut = (bas + haut) / 2
  }
  let chi = (bas + haut) / 2
  for (let k = 0; k < 200; k++) {
    const z = alpha * chi * chi
    const C = stumpffC(z), S = stumpffS(z)
    const valeur = F(chi)
    if (signe * valeur > 0) haut = chi
    else bas = chi
    const dF = (R0 * vr0 / sm) * chi * (1 - z * S) + (1 - alpha * R0) * chi * chi * C + R0
    let suivant = chi - valeur / dF
    // Newton sort de l'encadrement : dichotomie.
    if (!(suivant > Math.min(bas, haut) && suivant < Math.max(bas, haut))) suivant = (bas + haut) / 2
    if (Math.abs(suivant - chi) < 1e-13 * Math.max(1, Math.abs(chi))) { chi = suivant; break }
    chi = suivant
  }
  const z = alpha * chi * chi
  const C = stumpffC(z), S = stumpffS(z)
  const f = 1 - (chi * chi / R0) * C
  const g = dt - (chi ** 3 / sm) * S
  const r = { x: f * r0.x + g * v0.x, y: f * r0.y + g * v0.y, z: f * r0.z + g * v0.z }
  const R = norme(r)
  const df = (sm / (R * R0)) * (z * S - 1) * chi
  const dg = 1 - (chi * chi / R) * C
  return { r, v: { x: df * r0.x + dg * v0.x, y: df * r0.y + dg * v0.y, z: df * r0.z + dg * v0.z } }
}
