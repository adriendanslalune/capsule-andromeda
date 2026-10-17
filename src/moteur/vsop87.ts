// Positions des huit planètes par la théorie VSOP87B (séries tronquées, voir outils/vsop87.mjs).
// Écart avec JPL Horizons de 2000 à 2050 : moins de 300 km de Mercure à Mars, environ 2 000 km pour Jupiter et
// Saturne, quelques dizaines de milliers de km pour Uranus et Neptune (moins d'une demi-seconde d'arc).

import { VSOP87B, type SerieVSOP } from '../donnees/vsop87'
import { joursTTDepuisJ2000, UA_KM } from './temps'
import { depuisSpheriques, type Vecteur3 } from './vecteur'

function somme(serie: SerieVSOP, tau: number): number {
  let s = 0
  let puissance = 1
  for (const termes of serie) {
    let t = 0
    for (let k = 0; k < termes.length; k += 3) t += termes[k] * Math.cos(termes[k + 1] + termes[k + 2] * tau)
    s += t * puissance
    puissance *= tau
  }
  return s
}

/** Position héliocentrique de la planète (écliptique J2000, km) à l'instant t (ms UTC). */
export function positionVSOP(nom: string, t: number): Vecteur3 {
  const serie = VSOP87B[nom]
  if (!serie) throw new Error(`Planète inconnue : ${nom}`)
  const tau = joursTTDepuisJ2000(t) / 365250
  return depuisSpheriques(somme(serie.L, tau), somme(serie.B, tau), somme(serie.R, tau) * UA_KM)
}
