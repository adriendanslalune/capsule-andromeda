import { describe, expect, it } from 'vitest'
import { FLOTTE } from '../src/donnees/flotte'
import { arriveesDesBots, positionBot, tropheesDuBot, trouvaillesDesBots } from '../src/moteur/flotte'
import { debutSaison, numeroSaison } from '../src/moteur/visiteur'

const T0 = Date.UTC(2026, 9, 14, 12)
const JOUR = 86_400_000

describe('vie sociale de la flotte', () => {
  it('chaque arrivée annoncée est vraie : juste après, le bot est bien à cette escale', () => {
    const l = arriveesDesBots(FLOTTE, T0 - 10 * JOUR, T0)
    expect(l.length).toBeGreaterThan(5)
    for (const a of l) {
      const bot = FLOTTE.find((b) => b.nom === a.de)!
      const p = positionBot(bot, a.t + 1000)
      expect(p.escale, a.texte).not.toBeNull()
      expect(a.texte).toContain(bot.nom)
    }
  })

  it('le visiteur est photographié par quelques bots chaque saison, jamais les trois premiers jours', () => {
    const s = numeroSaison(T0)
    const l = trouvaillesDesBots(FLOTTE, debutSaison(s), debutSaison(s + 1) - 1)
    for (const a of l) expect(a.t - debutSaison(s)).toBeGreaterThanOrEqual(3 * JOUR)
    expect(l.length).toBeLessThanOrEqual(8)
  })

  it('les trophées des bots croissent avec le temps', () => {
    for (const b of FLOTTE) expect(tropheesDuBot(b, T0 + 30 * JOUR)).toBeGreaterThanOrEqual(tropheesDuBot(b, T0))
  })
})
