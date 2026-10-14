import { describe, expect, it } from 'vitest'
import { angleRotationTerre } from '../src/astro/rotation'

const deg = (r: number) => (r * 180) / Math.PI

describe('rotation de la Terre', () => {
  it('temps sidéral de Greenwich au 1er janvier 2000 à midi : 280,46°', () => {
    expect(deg(angleRotationTerre(Date.UTC(2000, 0, 1, 12)))).toBeCloseTo(280.46, 1)
  })
  it('un tour en un jour sidéral (23 h 56 min 4 s)', () => {
    const t = Date.UTC(2026, 9, 14)
    const d = deg(angleRotationTerre(t + 86_164_090.5)) - deg(angleRotationTerre(t))
    expect(Math.abs(((d + 540) % 360) - 180)).toBeLessThan(0.01)
  })
})
