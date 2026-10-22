import { describe, expect, it } from 'vitest'
import { pasDeGrille } from '../src/carte/carte'
import { UA_KM } from '../src/moteur/temps'

describe('la grille de la carte (demande d’Adrien du 22/10/2026)', () => {
  it('un pas rond (1, 2 ou 5 fois une puissance de dix) d’environ 110 pixels, qui suit le zoom', () => {
    for (const k of [20, 137, 2000, 4.5e4, 9e5, 3e7]) {
      const pas = pasDeGrille(k)
      // Rond en km, ou en UA au-delà de 0,1 UA.
      const unite = pas >= 0.1 * UA_KM ? pas / UA_KM : pas
      const tete = unite / 10 ** Math.floor(Math.log10(unite))
      expect([1, 2, 5]).toContain(Math.round(tete))
      expect(pas / k).toBeGreaterThan(50)
      expect(pas / k).toBeLessThan(250)
    }
    expect(pasDeGrille(20)).toBe(2000)
    expect(pasDeGrille(3e7) / UA_KM).toBeCloseTo(20, 6)
  })
})
