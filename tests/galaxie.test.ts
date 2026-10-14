import { describe, expect, it } from 'vitest'
import { galactiqueVersEcliptique, versGalactique } from '../src/astro/galaxie'

describe('la Voie lactée', () => {
  it('le centre de la Galaxie est dans le Sagittaire (longitude écliptique 266,8°, latitude −5,5°)', () => {
    const c = galactiqueVersEcliptique(0, 0)
    expect(c.lon).toBeCloseTo(266.84, 1)
    expect(c.lat).toBeCloseTo(-5.54, 1)
  })

  it('le pôle nord galactique est à la latitude écliptique +29,8°, longitude 180°', () => {
    const p = galactiqueVersEcliptique(0, 90)
    expect(p.lat).toBeCloseTo(29.81, 1)
    expect(p.lon).toBeCloseTo(180.02, 0)
  })

  it('aller et retour : la conversion est cohérente', () => {
    const e = galactiqueVersEcliptique(123, 45)
    const r = Math.PI / 180
    const g = versGalactique({ x: Math.cos(e.lat * r) * Math.cos(e.lon * r), y: Math.cos(e.lat * r) * Math.sin(e.lon * r), z: Math.sin(e.lat * r) })
    expect(Math.atan2(g.y, g.x) / r).toBeCloseTo(123, 6)
    expect(Math.asin(g.z) / r).toBeCloseTo(45, 6)
  })
})
