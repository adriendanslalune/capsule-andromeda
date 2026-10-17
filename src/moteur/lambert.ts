// Problème de Lambert : quelle orbite autour du Soleil relie la position r1 à la position r2 en un temps donné ?
// Variables universelles (Curtis, algorithme 5.2), résolues par dichotomie (robuste) : le temps de vol croît avec z ;
// puis une correction par la méthode du tir, pour la précision des petits sauts.
// On prend le chemin court (angle de transfert inférieur à 180°) : tous les temps de vol sont alors possibles,
// même très courts. Unités : km, km/s, secondes.

import { propager, stumpffC, stumpffS } from './kepler'
import type { Vecteur3 } from './vecteur'

export interface SolutionLambert {
  /** Vitesses au départ et à l'arrivée (km/s). */
  v1: Vecteur3
  v2: Vecteur3
}

/** Solution de Lambert entre r1 et r2 en dt secondes, sous l'attraction mu ; null si elle n'existe pas. */
export function lambert(r1: Vecteur3, r2: Vecteur3, dt: number, mu: number): SolutionLambert | null {
  const R1 = Math.hypot(r1.x, r1.y, r1.z), R2 = Math.hypot(r2.x, r2.y, r2.z)
  const croix = { x: r1.y * r2.z - r1.z * r2.y, y: r1.z * r2.x - r1.x * r2.z, z: r1.x * r2.y - r1.y * r2.x }
  // Angle de transfert (chemin court), calculé par atan2 : précis même pour des angles minuscules (Terre → Lune).
  const theta = Math.atan2(Math.hypot(croix.x, croix.y, croix.z), r1.x * r2.x + r1.y * r2.y + r1.z * r2.z)
  if (theta < 1e-12 || dt <= 0) return null
  // A = sin θ · √(r1 r2 / (1 − cos θ)), avec 1 − cos θ = 2 sin²(θ/2).
  const A = Math.sin(theta) * Math.sqrt((R1 * R2) / (2 * Math.sin(theta / 2) ** 2))
  const y = (z: number) => R1 + R2 + (A * (z * stumpffS(z) - 1)) / Math.sqrt(stumpffC(z))
  const temps = (z: number) => {
    const yz = y(z)
    return ((yz / stumpffC(z)) ** 1.5 * stumpffS(z) + A * Math.sqrt(yz)) / Math.sqrt(mu)
  }
  // Borne basse : là où y s'annule (temps de vol nul) ; borne haute : juste sous 4π² (un tour complet).
  let bas = -1
  while (y(bas) > 0 && bas > -1e5) bas *= 2
  let haut = 0
  if (y(bas) <= 0) {
    // y(bas) ≤ 0 < y(0) : on resserre sur la racine de y.
    for (let k = 0; k < 200; k++) { const m = (bas + haut) / 2; if (y(m) > 0) haut = m; else bas = m }
    bas = haut
  }
  haut = 4 * Math.PI * Math.PI * (1 - 1e-9)
  if (temps(haut) < dt) return null // trop lent pour un seul demi-tour (cas sans intérêt pour le jeu)
  if (y(bas) > 0 && temps(bas) > dt) return null
  for (let k = 0; k < 300; k++) {
    const m = (bas + haut) / 2
    if (temps(m) < dt) bas = m
    else haut = m
    if (haut - bas < 1e-14 * Math.max(1, Math.abs(m))) break
  }
  const z = (bas + haut) / 2
  const yz = y(z)
  const f = 1 - yz / R1
  const g = A * Math.sqrt(yz / mu)
  const v1 = { x: (r2.x - f * r1.x) / g, y: (r2.y - f * r1.y) / g, z: (r2.z - f * r1.z) / g }
  return corriger(r1, r2, dt, mu, v1)
}

/**
 * Correction par la méthode du tir : on propage la trajectoire, on mesure l'écart au point d'arrivée, et on corrige
 * la vitesse de départ (matrice des sensibilités calculée par petites variations). Indispensable pour les petits
 * sauts (quelques milliers de km vus depuis 150 millions de km) où la formule perd sa précision.
 */
function corriger(r1: Vecteur3, r2: Vecteur3, dt: number, mu: number, v1: Vecteur3): SolutionLambert | null {
  const v = { ...v1 }
  const ecart = (w: Vecteur3) => {
    const r = propager(r1, w, dt, mu).r
    return [r2.x - r.x, r2.y - r.y, r2.z - r.z]
  }
  for (let iteration = 0; iteration < 6; iteration++) {
    const e = ecart(v)
    if (!e.every(Number.isFinite)) return null
    if (Math.hypot(e[0], e[1], e[2]) < 1e-4) break // 10 cm
    const h = 1e-6 * Math.max(1, Math.hypot(v.x, v.y, v.z))
    const J: number[][] = [[], [], []]
    for (const [k, cle] of (['x', 'y', 'z'] as const).entries()) {
      const w = { ...v, [cle]: v[cle] + h }
      const ew = ecart(w)
      for (let i = 0; i < 3; i++) J[i][k] = (e[i] - ew[i]) / h // dérivée de la position d'arrivée
    }
    const d = resoudre3(J, e)
    if (!d) break
    v.x += d[0]; v.y += d[1]; v.z += d[2]
  }
  const arrivee = propager(r1, v, dt, mu)
  return { v1: v, v2: arrivee.v }
}

/** Résout le système linéaire 3 × 3 M·x = b (règle de Cramer). */
function resoudre3(M: number[][], b: number[]): number[] | null {
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const D = det(M)
  if (!Number.isFinite(D) || D === 0) return null
  return [0, 1, 2].map((k) => det(M.map((ligne, i) => ligne.map((x, j) => (j === k ? b[i] : x)))) / D)
}
