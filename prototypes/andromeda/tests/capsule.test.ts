import { describe, expect, it } from 'vitest'
import { ORBITE_DEPART, etatCapsule, etatRelatif, periode } from '../src/moteur/capsule'
import { position } from '../src/moteur/corps'

const t = Date.UTC(2026, 9, 16, 12)

describe('capsule au départ', () => {
  it('tourne à 400 km au-dessus de la Terre, en 92 minutes, à 7,7 km/s', () => {
    const { r, v } = etatRelatif(ORBITE_DEPART, t)
    expect(Math.hypot(r.x, r.y, r.z) - 6371).toBeCloseTo(400, 6)
    expect(periode(ORBITE_DEPART) / 60).toBeCloseTo(92.4, 0)
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(7.67, 1)
  })

  it('la vitesse est la dérivée de la position, et le cap pointe dans le sens de la marche', () => {
    const a = etatRelatif(ORBITE_DEPART, t), b = etatRelatif(ORBITE_DEPART, t + 1000)
    expect((b.r.x - a.r.x)).toBeCloseTo(a.v.x, 1)
    expect((b.r.y - a.r.y)).toBeCloseTo(a.v.y, 1)
    const e = etatCapsule(t)
    expect(Math.hypot(e.cap.x, e.cap.y, e.cap.z)).toBeCloseTo(1, 12)
    expect(e.cap.x * a.v.x + e.cap.y * a.v.y + e.cap.z * a.v.z).toBeGreaterThan(7.6)
  })

  it("l'orbite est inclinée de 51,6° sur l'équateur (donc entre 28° et 75° sur l'écliptique)", () => {
    const a = etatRelatif(ORBITE_DEPART, t), b = etatRelatif(ORBITE_DEPART, t + 60_000)
    const n = { x: a.r.y * b.r.z - a.r.z * b.r.y, y: a.r.z * b.r.x - a.r.x * b.r.z, z: a.r.x * b.r.y - a.r.y * b.r.x }
    const i = Math.acos(n.z / Math.hypot(n.x, n.y, n.z)) * (180 / Math.PI)
    expect(i).toBeGreaterThan(28)
    expect(i).toBeLessThan(75)
    const terre = position('Terre', t)
    expect(Math.hypot(etatCapsule(t).position.x - terre.x, etatCapsule(t).position.y - terre.y)).toBeLessThan(6772)
  })
})
