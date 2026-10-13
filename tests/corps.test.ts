import { describe, expect, it } from 'vitest'
import { corpsExiste, enUA, planeteDe, positionCorps, rayonInfluence, tousLesCorps } from '../src/astro/corps'
import { positionLune } from '../src/astro/lune'
import { LISTE_SATELLITES } from '../src/astro/satellites'
import { NOMS_PLANETES } from '../src/donnees/planetes'

describe('corps célestes', () => {
  it('chaque nom désigne un seul corps : planètes, Lune, ISS et satellites', () => {
    const noms = tousLesCorps()
    expect(new Set(noms).size).toBe(noms.length)
    expect(noms.length).toBe(8 + 2 + LISTE_SATELLITES.length)
    for (const nom of ['Mars', 'Lune', 'ISS', 'Titan', 'Phobos', 'Néréide']) expect(corpsExiste(nom), nom).toBe(true)
    expect(corpsExiste('Pluton')).toBe(false)
  })

  it('chaque corps appartient au système de sa planète', () => {
    expect(planeteDe('Mars')).toBe('Mars')
    expect(planeteDe('Lune')).toBe('Terre')
    expect(planeteDe('ISS')).toBe('Terre')
    expect(planeteDe('Titan')).toBe('Saturne')
    expect(planeteDe('Triton')).toBe('Neptune')
    expect(() => planeteDe('Pluton')).toThrow()
  })

  it('la position de la Lune est la même par les deux chemins', () => {
    const t = Date.UTC(2026, 9, 13)
    expect(positionCorps('Lune', t)).toEqual(positionLune(t))
  })

  it("sphères d'influence : Terre ≈ 0,010 UA, Jupiter ≈ 0,35 UA, Neptune ≈ 0,78 UA", () => {
    expect(rayonInfluence('Terre')).toBeCloseTo(0.01, 3)
    expect(rayonInfluence('Jupiter')).toBeCloseTo(0.355, 2)
    expect(rayonInfluence('Neptune')).toBeCloseTo(0.775, 2)
  })

  it("tous les satellites sont dans la sphère d'influence de leur planète", () => {
    for (const s of LISTE_SATELLITES) {
      expect(enUA(s.demiGrandAxe), s.nom).toBeLessThan(rayonInfluence(s.planete))
    }
    expect(enUA(384_400)).toBeLessThan(rayonInfluence('Terre'))
    expect(NOMS_PLANETES).toHaveLength(8)
  })
})
