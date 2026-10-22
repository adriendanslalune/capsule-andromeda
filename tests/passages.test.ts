import { describe, expect, it } from 'vitest'
import { bavardsIci, phraseDePassage } from '../src/moteur/passages'
import { ouEstLeBot } from '../src/moteur/corps'
import { BOTS_BAVARDS } from '../src/donnees/messages'
import { PHRASES_DE_PASSAGE } from '../src/donnees/passages'

const t0 = Date.UTC(2026, 9, 22, 12)

describe('les bavards croisés en route (Adrien, 22/10/2026)', () => {
  it('un bavard à son escale est trouvé à ce lieu ; sa phrase est la même toute la journée, pour tous', () => {
    const b = BOTS_BAVARDS.map((x) => ({ x, o: ouEstLeBot(x.pseudo, t0) })).find(({ o }) => !o.enRoute)!
    const lieu = (b.o as { lieu: string }).lieu
    expect(bavardsIci(lieu, t0)).toContain(b.x.pseudo)
    const p = phraseDePassage(b.x.pseudo, lieu, t0)
    expect(PHRASES_DE_PASSAGE).toContain(p)
    expect(phraseDePassage(b.x.pseudo, lieu, t0 + 3_600_000)).toBe(p)
  })
})
