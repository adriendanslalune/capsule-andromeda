import { describe, expect, it } from 'vitest'
import { annonces, breve, rapprochement, reclame } from '../src/moteur/annonces'
import { RECLAMES } from '../src/donnees/reclames'
import { BREVES } from '../src/donnees/breves'

const t0 = Date.UTC(2026, 9, 22, 12)

describe('les annonces générales (demande d’Adrien du 22/10/2026)', () => {
  it('une planète au plus près de la Terre est annoncée ; au plus loin, elle ne l’est pas', () => {
    const r = rapprochement('Mars', t0)
    expect(r.min).toBeLessThan(r.max)
    expect(annonces(r.auPlusPres).some((a) => a.startsWith('Mars au plus près'))).toBe(true)
    // Une demi-période synodique plus tard (environ 390 jours), Mars est loin : pas d'annonce.
    expect(annonces(r.auPlusPres + 390 * 86_400_000).some((a) => a.startsWith('Mars'))).toBe(false)
  })

  it('les événements du jeu passent en tête, seulement pendant leur durée', () => {
    const e = [{ debut: '2026-12-20T00:00:00Z', fin: '2026-12-27T00:00:00Z', texte: 'À la recherche du père Noël' }]
    expect(annonces(Date.UTC(2026, 11, 24), e)[0]).toBe('À la recherche du père Noël')
    expect(annonces(Date.UTC(2026, 11, 28), e)).not.toContain('À la recherche du père Noël')
  })

  it('une brève de Radio Résistance ferme la ronde ; elle change toutes les heures, la même pour tous', () => {
    expect(annonces(t0).at(-2)).toBe(breve(t0))
    expect(annonces(t0).at(-1)).toBe(reclame(t0))
    expect(breve(t0 + 3_600_000)).not.toBe(breve(t0))
    expect(new Set(BREVES).size).toBe(BREVES.length)
    expect(BREVES.length).toBeGreaterThanOrEqual(250)
    expect(new Set(RECLAMES).size).toBe(RECLAMES.length)
    expect(new Set(Array.from({ length: RECLAMES.length }, (_, k) => reclame(t0 + k * 3_600_000))).size).toBe(RECLAMES.length)
    // Toutes passent avant qu'une revienne (une centaine d'heures, plus de quatre jours).
    const vues = new Set(Array.from({ length: BREVES.length }, (_, k) => breve(t0 + k * 3_600_000)))
    expect(vues.size).toBe(BREVES.length)
  })
})
