import { describe, expect, it } from 'vitest'
import { formaterHeureUTC, horlogeFixe } from '../src/moteur/horloge'

describe('horloge', () => {
  it('une horloge fixe renvoie toujours le même instant', () => {
    const horloge = horlogeFixe(1_000)
    expect(horloge()).toBe(1_000)
    expect(horloge()).toBe(1_000)
  })

  it("formate l'heure en UTC, sans dépendre du fuseau du téléphone", () => {
    // Début de la saison 0 de la chasse : 5 janvier 2026, 00:00 UTC
    expect(formaterHeureUTC(Date.UTC(2026, 0, 5, 0, 0, 0))).toBe('00:00:00 UTC')
    expect(formaterHeureUTC(Date.UTC(2026, 9, 13, 21, 7, 9))).toBe('21:07:09 UTC')
  })
})
