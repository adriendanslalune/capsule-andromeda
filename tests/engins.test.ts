import { describe, expect, it } from 'vitest'
import { engin, positionEngin } from '../src/astro/engins'
import { positionPlanete } from '../src/astro/planetes'
import { UA_KM } from '../src/astro/temps'

const T0 = Date.UTC(2026, 9, 14, 12)
const kmDe = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * UA_KM

describe('engins humains', () => {
  it('Hubble tourne à 515 km d’altitude, en 95 minutes', () => {
    const h = engin('Hubble')!
    const d = kmDe(positionEngin(h, T0), positionPlanete('Terre', T0))
    expect(d).toBeGreaterThan(6378 + 500)
    expect(d).toBeLessThan(6378 + 530)
    // Un tour plus tard, il est revenu au même point autour de la Terre.
    const p0 = positionEngin(h, T0), t1 = T0 + 95.4 * 60_000
    const rel = (p: typeof p0, t: number) => { const e = positionPlanete('Terre', t); return { x: p.x - e.x, y: p.y - e.y, z: p.z - e.z } }
    expect(kmDe(rel(positionEngin(h, t1), t1), rel(p0, T0))).toBeLessThan(1)
  })

  it('James Webb reste autour de L2, à environ 1,5 million de km de la Terre, côté nuit', () => {
    const w = engin('James Webb')!
    for (let j = 0; j < 365; j += 30) {
      const t = T0 + j * 86_400_000
      const p = positionEngin(w, t), e = positionPlanete('Terre', t)
      const d = kmDe(p, e)
      expect(d).toBeGreaterThan(1_400_000)
      expect(d).toBeLessThan(1_800_000)
      expect(Math.hypot(p.x, p.y)).toBeGreaterThan(Math.hypot(e.x, e.y)) // plus loin du Soleil que la Terre
    }
  })

  it('Voyager 1 est à environ 171 UA en octobre 2026, et s’éloigne de 3,6 UA par an', () => {
    const v = engin('Voyager 1')!
    const r = (t: number) => { const p = positionEngin(v, t); return Math.hypot(p.x, p.y, p.z) }
    expect(r(T0)).toBeGreaterThan(170)
    expect(r(T0)).toBeLessThan(173)
    expect(r(T0 + 365.25 * 86_400_000) - r(T0)).toBeCloseTo(3.57, 2)
  })
})
