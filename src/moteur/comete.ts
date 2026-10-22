// La comète de Halley (demande d'Adrien du 22/10/2026), à sa vraie place : son orbite képlérienne, d'après les
// éléments du passage de 1986 (JPL, écliptique J2000). Elle revient tous les 75 ans environ ; passée au plus loin du
// Soleil fin 2023 (35 UA, au-delà de Neptune), elle repasse au plus près le 28 juillet 2061 (ici
// en juin : l'orbite seule, sans les poussées des planètes, avance de deux mois).

import { GM_SOLEIL } from './orbite'
import { UA_KM } from './temps'
import type { Vecteur3 } from './vecteur'

export const HALLEY = 'Comète de Halley'
/** Rayon moyen du noyau (km) : une patate de 15 km sur 8. */
export const RAYON_HALLEY = 5.5

const RAD = Math.PI / 180
const E = 0.96714
const Q = 0.58598 * UA_KM
const A = Q / (1 - E)
const I = 162.262 * RAD
const NOEUD = 58.42 * RAD
const PERIHELIE = 111.332 * RAD
/** Passage au périhélie : 9 février 1986, 11 h TU. */
const PASSAGE = Date.UTC(1986, 1, 9, 11)
/** Mouvement moyen (rad/s). */
const N = Math.sqrt(GM_SOLEIL / A ** 3)

/** Position de la comète dans le plan de son orbite, pour l'anomalie excentrique u. */
function versEcliptique(xo: number, yo: number): Vecteur3 {
  const cw = Math.cos(PERIHELIE), sw = Math.sin(PERIHELIE), cO = Math.cos(NOEUD), sO = Math.sin(NOEUD), ci = Math.cos(I), si = Math.sin(I)
  const x1 = cw * xo - sw * yo, y1 = sw * xo + cw * yo
  return { x: cO * x1 - sO * ci * y1, y: sO * x1 + cO * ci * y1, z: si * y1 }
}

function pointOrbite(u: number): Vecteur3 {
  return versEcliptique(A * (Math.cos(u) - E), A * Math.sqrt(1 - E * E) * Math.sin(u))
}

/** Position héliocentrique de la comète de Halley à l'instant t (km). */
export function positionHalley(t: number): Vecteur3 {
  const m = (((N * (t - PASSAGE)) / 1000) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  // Équation de Kepler (très excentrique) : Newton, en partant de π pour converger partout.
  let u = Math.PI
  for (let k = 0; k < 50; k++) {
    const d = (u - E * Math.sin(u) - m) / (1 - E * Math.cos(u))
    u -= d
    if (Math.abs(d) < 1e-12) break
  }
  return pointOrbite(u)
}

/** L'orbite entière (pour le calque des orbites), en n points. */
export function orbiteHalley(n = 256): Vecteur3[] {
  // Des points serrés près du Soleil (là où elle tourne vite), espacés au loin.
  return Array.from({ length: n + 1 }, (_, k) => pointOrbite((2 * Math.PI * k) / n))
}
