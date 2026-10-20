import { describe, expect, it } from 'vitest'
import { corps, enfants, position } from '../src/moteur/corps'

const t0 = Date.UTC(2026, 9, 20, 12)
const ecart = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

describe('Charon (ajoutée à la demande d’Adrien du 20/10/2026)', () => {
  it('lune de Pluton, à 19 591 km de lui, qui en fait le tour en 6,39 jours', () => {
    expect(corps('Charon')).toMatchObject({ type: 'lune', parent: 'Pluton' })
    expect(enfants('Pluton').map((c) => c.nom)).toContain('Charon')
    for (const t of [t0, t0 + 1e8, t0 + 3e8]) expect(ecart(position('Charon', t), position('Pluton', t))).toBeCloseTo(19_591, 0)
    const rel = (t: number) => { const a = position('Charon', t), b = position('Pluton', t); return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z } }
    expect(ecart(rel(t0), rel(t0 + 6.3872 * 86_400_000))).toBeLessThan(1)
    expect(ecart(rel(t0), rel(t0 + 3.1936 * 86_400_000))).toBeCloseTo(2 * 19_591, 0)
  })
})
