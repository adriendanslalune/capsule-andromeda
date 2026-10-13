// Position réelle de la Lune.
// Théorie lunaire de J. Meeus (« Astronomical Algorithms », chapitre 47), réduite à ses termes principaux :
// précision de l'ordre de 0,05° en direction et de 100 km en distance, largement suffisante pour le jeu.

import { positionPlanete } from './planetes'
import { sieclesDepuisJ2000, UA_KM } from './temps'
import { ajouter, multiplier, RAD, type Vecteur3 } from './vecteur'

// Termes en longitude (10⁻⁶ degré) et distance (10⁻³ km). Arguments : D, M, M′, F.
const TERMES_LONGITUDE_DISTANCE: readonly (readonly [number, number, number, number, number, number])[] = [
  [0, 0, 1, 0, 6288774, -20905355],
  [2, 0, -1, 0, 1274027, -3699111],
  [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925],
  [0, 1, 0, 0, -185116, 48888],
  [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158],
  [2, -1, -1, 0, 57066, -152138],
  [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586],
  [0, 1, -1, 0, -40923, -129620],
  [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755],
  [2, 0, 0, -2, 15327, 10321],
  [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661],
  [4, 0, -1, 0, 10675, -34782],
  [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636],
  [2, 1, -1, 0, -7888, 24208],
  [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379],
  [1, 1, 0, 0, 4987, -16675],
  [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445],
  [4, 0, 0, 0, 3861, -11650],
  [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003],
  [2, 0, -1, 2, -2602, 0],
  [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322],
  [2, -2, 0, 0, 2236, -9884],
]

// Termes en latitude (10⁻⁶ degré). Arguments : D, M, M′, F.
const TERMES_LATITUDE: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
  [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065],
  [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828],
  [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749],
  [0, 1, -1, 1, -1565],
  [1, 0, 0, 1, -1491],
  [0, 1, 1, 1, -1475],
  [0, 1, 1, -1, -1410],
  [0, 1, 0, -1, -1344],
  [1, 0, 0, -1, -1335],
]

/** Précession générale en longitude (degrés par siècle), pour revenir à l'équinoxe J2000. */
const PRECESSION_PAR_SIECLE = 1.3969713

/** Position de la Lune vue du centre de la Terre (écliptique J2000, en km). */
export function positionLuneGeocentrique(t: number): Vecteur3 {
  const T = sieclesDepuisJ2000(t)
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T
  // Arguments fondamentaux (degrés).
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000
  const A1 = 119.75 + 131.849 * T
  const A2 = 53.09 + 479264.29 * T
  const A3 = 313.45 + 481266.484 * T
  // Correction due à l'excentricité décroissante de l'orbite terrestre.
  const E = 1 - 0.002516 * T - 0.0000074 * T2
  const facteurE = (m: number) => (m === 0 ? 1 : Math.abs(m) === 1 ? E : E * E)

  let sl = 0, sr = 0, sb = 0
  for (const [d, m, mp, f, l, r] of TERMES_LONGITUDE_DISTANCE) {
    const arg = (d * D + m * M + mp * Mp + f * F) * RAD
    sl += l * facteurE(m) * Math.sin(arg)
    sr += r * facteurE(m) * Math.cos(arg)
  }
  for (const [d, m, mp, f, b] of TERMES_LATITUDE) {
    sb += b * facteurE(m) * Math.sin((d * D + m * M + mp * Mp + f * F) * RAD)
  }
  sl += 3958 * Math.sin(A1 * RAD) + 1962 * Math.sin((Lp - F) * RAD) + 318 * Math.sin(A2 * RAD)
  sb += -2235 * Math.sin(Lp * RAD) + 382 * Math.sin(A3 * RAD) + 175 * Math.sin((A1 - F) * RAD)
    + 175 * Math.sin((A1 + F) * RAD) + 127 * Math.sin((Lp - Mp) * RAD) - 115 * Math.sin((Lp + Mp) * RAD)

  const longitude = (Lp + sl / 1e6 - PRECESSION_PAR_SIECLE * T) * RAD
  const latitude = (sb / 1e6) * RAD
  const distance = 385000.56 + sr / 1000
  return {
    x: distance * Math.cos(latitude) * Math.cos(longitude),
    y: distance * Math.cos(latitude) * Math.sin(longitude),
    z: distance * Math.sin(latitude),
  }
}

/** Position héliocentrique de la Lune (écliptique J2000, en UA). */
export function positionLune(t: number): Vecteur3 {
  return ajouter(positionPlanete('Terre', t), multiplier(positionLuneGeocentrique(t), 1 / UA_KM))
}
