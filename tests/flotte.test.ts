import { describe, expect, it } from 'vitest'
import { positionCorps } from '../src/astro/corps'
import { UA_KM } from '../src/astro/temps'
import { FLOTTE } from '../src/donnees/flotte'
import { botEnLigne, positionBot } from '../src/moteur/flotte'

const T0 = Date.UTC(2026, 9, 14, 12)
const km = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * UA_KM

describe('flotte des bots', () => {
  it('la même heure donne la même position (tous les joueurs voient la même chose)', () => {
    for (const bot of FLOTTE) expect(positionBot(bot, T0)).toEqual(positionBot(bot, T0))
  })

  it('à son escale, un bot est en orbite tout près de l’astre', () => {
    for (const bot of FLOTTE) {
      for (let h = 0; h < 24 * 30; h += 5) {
        const t = T0 + h * 3_600_000
        const p = positionBot(bot, t)
        if (p.escale) expect(km(p.position, positionCorps(p.escale, t))).toBeLessThan(150_000)
      }
    }
  })

  it('un bot ne se téléporte pas : d’une minute à l’autre, il ne va jamais plus vite que sa vitesse (et l’astre)', () => {
    for (const bot of FLOTTE) {
      let avant = positionBot(bot, T0)
      for (let m = 1; m < 60 * 24 * 10; m += 7) {
        const t = T0 + m * 60_000
        const apres = positionBot(bot, t)
        const prec = T0 + (m - 7) * 60_000
        // Marge : la vitesse propre de l'astre (au plus ~50 km/s pour Mercure) et le stationnement en orbite.
        expect(km(apres.position, avant.position) / ((t - prec) / 1000)).toBeLessThan(bot.vitesse + 120)
        avant = apres
      }
    }
  })

  it('les bots voyagent : chacun change d’escale en quelques cycles', () => {
    for (const bot of FLOTTE) {
      const vues = new Set<string>()
      for (let j = 0; j < Math.max(365, bot.cycleJours * 6); j++) {
        const p = positionBot(bot, T0 + j * 86_400_000)
        if (p.escale) vues.add(p.escale)
      }
      expect(vues.size).toBeGreaterThan(1)
    }
  })

  it('chacun est connecté à peu près la part de temps prévue', () => {
    for (const bot of FLOTTE) {
      let n = 0
      for (let h = 0; h < 2000; h++) if (botEnLigne(bot, T0 + h * 3_600_000)) n++
      expect(n / 2000).toBeGreaterThan(bot.enLigne - 0.08)
      expect(n / 2000).toBeLessThan(bot.enLigne + 0.08)
    }
  })
})
