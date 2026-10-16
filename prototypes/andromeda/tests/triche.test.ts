import { describe, expect, it } from 'vitest'
import { positionAffichee, rabattement } from '../src/commun/triche'
import { positionRelative } from '../src/moteur/corps'

const t = Date.UTC(2026, 9, 16, 12)
const R = 6371

describe("triche d'affichage de l'ISS", () => {
  const r = rabattement(positionRelative('ISS', t), positionRelative('ISS', t + 10_000))

  it('vue de loin, elle est dessinée au-dessus du bord de la Terre, dans le plan de la carte', () => {
    for (const echelle of [100, 3000, 50_000]) {
      for (let k = 0; k < 10; k++) {
        const p = positionAffichee(positionRelative('ISS', t + k * 600_000), r, R, echelle)
        const altitudePx = (Math.hypot(p.x, p.y) - R) / echelle
        expect(altitudePx).toBeGreaterThan(20)
        expect(altitudePx).toBeLessThan(30)
        expect(Math.abs(p.z)).toBe(0)
      }
    }
  })

  it('elle garde sa vraie vitesse : un tour en une période (≈ 92 min)', () => {
    const angle = (dt: number) => {
      const p = positionAffichee(positionRelative('ISS', t + dt), r, R, 3000)
      return Math.atan2(p.y, p.x)
    }
    // Angle parcouru en 1 minute ≈ 360° / 92,9 min (orbite quasi circulaire, rabattue sans déformation).
    let d = angle(60_000) - angle(0)
    if (d < -Math.PI) d += 2 * Math.PI
    expect(Math.abs(d) * (180 / Math.PI)).toBeCloseTo(360 / 92.9, 0)
  })

  it('de près, elle est à sa vraie place', () => {
    const vraie = positionRelative('ISS', t)
    const p = positionAffichee(vraie, r, R, 2)
    expect(p).toEqual(vraie)
  })
})
