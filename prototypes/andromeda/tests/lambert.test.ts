import { describe, expect, it } from 'vitest'
import { propager } from '../src/moteur/kepler'
import { lambert } from '../src/moteur/lambert'
import { GM_SOLEIL } from '../src/moteur/orbite'
import { UA_KM } from '../src/moteur/temps'

const JOUR = 86_400
const ecart = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

describe('propagation képlérienne', () => {
  it('une orbite circulaire à 1 UA fait un tour en 365,25 jours', () => {
    const v = Math.sqrt(GM_SOLEIL / UA_KM)
    const r0 = { x: UA_KM, y: 0, z: 0 }, v0 = { x: 0, y: v, z: 0 }
    const periode = 2 * Math.PI * Math.sqrt(UA_KM ** 3 / GM_SOLEIL)
    expect(periode / JOUR).toBeCloseTo(365.25, 0)
    const quart = propager(r0, v0, periode / 4, GM_SOLEIL)
    expect(quart.r.x / UA_KM).toBeCloseTo(0, 6)
    expect(quart.r.y / UA_KM).toBeCloseTo(1, 6)
    expect(ecart(propager(r0, v0, periode, GM_SOLEIL).r, r0)).toBeLessThan(10)
  })

  it('suit aussi une hyperbole (passage rapide)', () => {
    const r0 = { x: UA_KM, y: 0, z: 0 }, v0 = { x: 0, y: 80, z: 5 }
    const aller = propager(r0, v0, 30 * JOUR, GM_SOLEIL)
    const retour = propager(aller.r, aller.v, -30 * JOUR, GM_SOLEIL)
    expect(ecart(retour.r, r0)).toBeLessThan(1)
  })
})

describe('problème de Lambert', () => {
  it('transfert de Hohmann Terre → Mars : demi-ellipse de 1 à 1,524 UA en ≈ 259 jours', () => {
    const r1 = { x: UA_KM, y: 0, z: 0 }
    const a = (1 + 1.524) / 2 * UA_KM
    const duree = Math.PI * Math.sqrt(a ** 3 / GM_SOLEIL)
    expect(duree / JOUR).toBeCloseTo(259, 0)
    // Arrivée à 179,9° (à 180° pile, le plan du transfert est indéterminé).
    const ang = (179.9 * Math.PI) / 180
    const r2 = { x: 1.524 * UA_KM * Math.cos(ang), y: 1.524 * UA_KM * Math.sin(ang), z: 0 }
    const s = lambert(r1, r2, duree, GM_SOLEIL)!
    const v1 = Math.hypot(s.v1.x, s.v1.y, s.v1.z)
    // Vitesse au périhélie du transfert de Hohmann : √(µ (2/r1 − 1/a)) ≈ 32,73 km/s, tangente à l'orbite.
    expect(v1).toBeCloseTo(Math.sqrt(GM_SOLEIL * (2 / UA_KM - 1 / a)), 1)
    expect(Math.abs(s.v1.x)).toBeLessThan(0.1)
  })

  it('la trajectoire trouvée passe bien par le point d’arrivée, pour des vols lents ou très rapides', () => {
    const r1 = { x: UA_KM, y: 0.1 * UA_KM, z: 0 }
    const r2 = { x: -2 * UA_KM, y: 3 * UA_KM, z: 0.2 * UA_KM }
    for (const jours of [3, 30, 400, 1500]) {
      const s = lambert(r1, r2, jours * JOUR, GM_SOLEIL)!
      expect(ecart(propager(r1, s.v1, jours * JOUR, GM_SOLEIL).r, r2), `${jours} jours`).toBeLessThan(1)
    }
  })

  it('fonctionne pour un tout petit saut (Terre → Lune, angle vu du Soleil de 0,15°)', () => {
    const r1 = { x: UA_KM, y: 0, z: 0 }
    const r2 = { x: UA_KM + 100_000, y: 380_000, z: 20_000 }
    const s = lambert(r1, r2, 2 * JOUR, GM_SOLEIL)!
    expect(ecart(propager(r1, s.v1, 2 * JOUR, GM_SOLEIL).r, r2)).toBeLessThan(0.1)
  })
})
