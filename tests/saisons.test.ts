import { describe, expect, it } from 'vitest'
import { SAISONS } from '../src/donnees/saisons'
import { BLEU_NUIT, KRAFT, breveDuMois, fondDuMois, melanger, saison } from '../src/moteur/saisons'

describe('le fond de la carte change chaque mois (calendrier validé par Adrien le 24/10/2026)', () => {
  it('douze mois, chacun sa teinte et sa brève', () => {
    expect(SAISONS.length).toBe(12)
    for (const s of SAISONS) { expect(s.teinte).toMatch(/^#[0-9a-f]{6}$/); expect(s.breve.length).toBeGreaterThan(20) }
    expect(saison(new Date(2026, 11, 15).getTime()).mois).toBe('Décembre')
    expect(saison(new Date(2026, 9, 31).getTime()).mois).toBe('Octobre')
  })

  it('une teinte légère : le fond reste proche du kraft ; la nuit garde son bleu nuit', () => {
    const ecart = (a: string, b: string) => Math.max(...[1, 3, 5].map((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16))))
    for (let m = 0; m < 12; m++) {
      const t = new Date(2026, m, 15).getTime()
      expect(ecart(fondDuMois(t, false), KRAFT)).toBeLessThan(20)
      expect(fondDuMois(t, true)).toBe(BLEU_NUIT)
      expect(fondDuMois(t, false)).not.toBe(KRAFT)
    }
    expect(melanger('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('la brève du mois, les trois premiers jours seulement', () => {
    expect(breveDuMois(new Date(2026, 11, 2).getTime())).toContain('Noël')
    expect(breveDuMois(new Date(2026, 11, 10).getTime())).toBeNull()
  })
})
