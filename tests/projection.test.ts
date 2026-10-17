import { describe, expect, it } from 'vitest'
import { distanceReelle, projeter, rayonEcran, type Echelle } from '../src/carte/projection'

const UA = 149_597_870.7
const SYSTEME_SOLAIRE: Echelle = { dMin: 0.15 * UA, d0: 0.25 * UA, dMax: 50 * UA, r0: 14, rMax: 178 }

describe('projection logarithmique de la carte', () => {
  it('Neptune et Pluton tiennent dans un écran de téléphone, Mercure reste loin du Soleil', () => {
    expect(rayonEcran(50 * UA, SYSTEME_SOLAIRE)).toBeCloseTo(178, 6)
    expect(rayonEcran(30 * UA, SYSTEME_SOLAIRE)).toBeLessThan(178)
    expect(rayonEcran(0.39 * UA, SYSTEME_SOLAIRE)).toBeGreaterThan(22)
  })

  it("garde l'ordre des distances, et écarte assez Vénus, la Terre et Mars pour les distinguer", () => {
    const r = [0.39, 0.72, 1, 1.52, 5.2, 9.5, 19.2, 30].map((a) => rayonEcran(a * UA, SYSTEME_SOLAIRE))
    for (let i = 1; i < r.length; i++) expect(r[i] - r[i - 1]).toBeGreaterThan(7)
  })

  it('est continue au bord du centre et réversible', () => {
    expect(rayonEcran(0.15 * UA, SYSTEME_SOLAIRE)).toBeCloseTo(14, 9)
    expect(rayonEcran(0.15 * UA * (1 - 1e-9), SYSTEME_SOLAIRE)).toBeCloseTo(14, 6)
    for (const a of [0.05, 0.3, 1, 7, 42]) expect(distanceReelle(rayonEcran(a * UA, SYSTEME_SOLAIRE), SYSTEME_SOLAIRE) / UA).toBeCloseTo(a, 9)
  })

  it('garde la vraie direction', () => {
    const p = projeter(-3 * UA, 4 * UA, SYSTEME_SOLAIRE)
    expect(Math.atan2(p.y, p.x)).toBeCloseTo(Math.atan2(4, -3), 12)
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(rayonEcran(5 * UA, SYSTEME_SOLAIRE), 9)
  })
})
