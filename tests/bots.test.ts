import { describe, expect, it } from 'vitest'
import { BOTS } from '../src/donnees/messages'
import { corps, ouEstLeBot, position } from '../src/moteur/corps'

const t0 = Date.UTC(2026, 9, 19, 12)
const H = 3_600_000
const ecart = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

describe('les capsules des bots voyagent (décision d’Adrien du 19/10/2026)', () => {
  it('toutes leurs escales existent sur la carte ; leur port d’attache est la première', () => {
    for (const b of BOTS) {
      expect(b.escales[0]).toBe(b.lieu)
      expect(b.escales.length).toBeGreaterThan(1)
      for (const e of b.escales) expect(corps(e), e).toBeDefined()
    }
  })

  it('sur une semaine, chaque bot fait escale et voyage ; les mêmes trajets pour tous (déduits de l’heure)', () => {
    for (const b of BOTS) {
      // Toutes les 20 secondes : avec un bon moteur, un saut de puce de l'ISS à la Terre ne dure qu'une minute.
      const etats = Array.from({ length: 7 * 24 * 180 }, (_, k) => ouEstLeBot(b.pseudo, t0 + k * H / 180))
      expect(etats.some((e) => e.enRoute), b.pseudo).toBe(true)
      expect(etats.some((e) => !e.enRoute), b.pseudo).toBe(true)
      for (const e of etats) if (e.enRoute) { expect(e.part).toBeGreaterThanOrEqual(0); expect(e.part).toBeLessThan(1); expect(e.vers).not.toBe(e.de) }
    }
    expect(ouEstLeBot('VEGA', t0 + 50 * H)).toEqual(ouEstLeBot('VEGA', t0 + 50 * H))
  })

  it('pas de saut : au départ et à l’arrivée, la capsule passe en douceur de l’orbite au vol', () => {
    for (const b of BOTS.slice(0, 6)) {
      let avant = ouEstLeBot(b.pseudo, t0)
      for (let k = 1; k < 7 * 24 * 6; k++) {
        const t = t0 + k * 10 * 60_000
        const ici = ouEstLeBot(b.pseudo, t)
        if (ici.enRoute !== avant.enRoute) {
          // Le changement a eu lieu dans les dix dernières minutes : on le cerne à la seconde près.
          let a = t - 10 * 60_000, z = t
          while (z - a > 1000) { const m = (a + z) / 2; if (ouEstLeBot(b.pseudo, m).enRoute === avant.enRoute) a = m; else z = m }
          expect(ecart(position(b.pseudo, a), position(b.pseudo, z)), b.pseudo).toBeLessThan(500)
        }
        avant = ici
      }
    }
  })
})

describe('une centaine de bots (décision d’Adrien du 20/10/2026)', () => {
  it('100 bots aux pseudos uniques, dont une douzaine de bavards ; seuls les bavards parlent dans le chat', async () => {
    const { BOTS_BAVARDS } = await import('../src/donnees/messages')
    const { fil } = await import('../src/moteur/messages')
    const { Jeu } = await import('../src/moteur/jeu')
    expect(BOTS).toHaveLength(100)
    expect(new Set(BOTS.map((b) => b.pseudo)).size).toBe(100)
    expect(BOTS_BAVARDS).toHaveLength(12)
    for (const b of BOTS) expect(b.escales.length, b.pseudo).toBeGreaterThanOrEqual(2)
    const auteurs = new Set(fil(new Jeu(), 'general', t0).map((m) => m.auteur))
    for (const a of auteurs) expect(BOTS_BAVARDS.some((b) => b.pseudo === a), a).toBe(true)
  })
})
