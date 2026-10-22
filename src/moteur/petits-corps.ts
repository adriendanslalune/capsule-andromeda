// Les petits corps célèbres (donnees/petits-corps.ts) sur leur vraie orbite : ellipse (Kepler) ou, pour ʻOumuamua venu
// d'une autre étoile, hyperbole (il ne repassera jamais). Positions héliocentriques, écliptique J2000, en km.

import { HALLEY, PETITS_CORPS, type PetitCorps } from '../donnees/petits-corps'
import { GM_SOLEIL } from './orbite'
import { UA_KM } from './temps'
import type { Vecteur3 } from './vecteur'

export { HALLEY }

const RAD = Math.PI / 180
const PAR_NOM = new Map(PETITS_CORPS.map((p) => [p.nom, p]))

export function petitCorps(nom: string): PetitCorps | undefined {
  return PAR_NOM.get(nom)
}

/** Du plan de l'orbite à l'écliptique. */
function versEcliptique(p: PetitCorps, xo: number, yo: number): Vecteur3 {
  const w = p.perihelie * RAD, O = p.noeud * RAD, i = p.i * RAD
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i)
  const x1 = cw * xo - sw * yo, y1 = sw * xo + cw * yo
  return { x: cO * x1 - sO * ci * y1, y: sO * x1 + cO * ci * y1, z: si * y1 }
}

/** Demi-grand axe (km ; négatif pour une hyperbole). */
const demiGrandAxe = (p: PetitCorps) => (p.q * UA_KM) / (1 - p.e)

/** Point de l'orbite pour l'anomalie excentrique (ellipse) ou hyperbolique (hyperbole) u. */
function pointOrbite(p: PetitCorps, u: number): Vecteur3 {
  const a = demiGrandAxe(p)
  if (p.e < 1) return versEcliptique(p, a * (Math.cos(u) - p.e), a * Math.sqrt(1 - p.e * p.e) * Math.sin(u))
  return versEcliptique(p, a * (Math.cosh(u) - p.e), -a * Math.sqrt(p.e * p.e - 1) * Math.sinh(u))
}

/** Position héliocentrique du petit corps à l'instant t (km). */
export function positionPetitCorps(p: PetitCorps, t: number): Vecteur3 {
  const a = demiGrandAxe(p)
  const n = Math.sqrt(GM_SOLEIL / Math.abs(a) ** 3)
  const dt = (t - (p.passage - 2440587.5) * 86_400_000) / 1000
  if (p.e < 1) {
    const m = (((n * dt) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    // Équation de Kepler, même très excentrique (Hale-Bopp, 0,995) : Newton, en partant de π.
    let u = Math.PI
    for (let k = 0; k < 60; k++) {
      const d = (u - p.e * Math.sin(u) - m) / (1 - p.e * Math.cos(u))
      u -= d
      if (Math.abs(d) < 1e-12) break
    }
    return pointOrbite(p, u)
  }
  // Hyperbole : e sinh H − H = M.
  const m = n * dt
  let h = Math.asinh(m / p.e)
  for (let k = 0; k < 60; k++) {
    const d = (p.e * Math.sinh(h) - h - m) / (p.e * Math.cosh(h) - 1)
    h -= d
    if (Math.abs(d) < 1e-12) break
  }
  return pointOrbite(p, h)
}

/** L'orbite entière en n points (pour une hyperbole : le morceau parcouru de 1900 à 2100). */
export function orbitePetitCorps(p: PetitCorps, n = 256): Vecteur3[] {
  if (p.e < 1) return Array.from({ length: n + 1 }, (_, k) => pointOrbite(p, (2 * Math.PI * k) / n))
  return Array.from({ length: n + 1 }, (_, k) => pointOrbite(p, -4 + (8 * k) / n))
}

/**
 * Activité d'une comète (0 à 1) : sa traînée s'allume en approchant du Soleil (sous 5 UA) et s'éteint en s'éloignant.
 * Halley (demande d'Adrien du 22/10/2026) garde la sienne toujours ; les autres corps n'en ont pas.
 */
export function activiteComete(p: PetitCorps, t: number): number {
  if (p.genre !== 'comete') return 0
  if (p.nom === HALLEY) return 1
  const pos = positionPetitCorps(p, t), r = Math.hypot(pos.x, pos.y, pos.z) / UA_KM
  return Math.max(0, Math.min(1, (5 - r) / 3.5))
}
