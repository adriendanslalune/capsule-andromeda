import { describe, expect, it } from 'vitest'
import { etatSurOrbite, orbiteDerriere } from '../src/moteur/capsule'
import { position } from '../src/moteur/corps'
import { planifier } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 23, 18)

describe('le départ (Adrien, 23/10/2026 : le premier trajet, jusqu’à l’ISS, en moins de 30 secondes)', () => {
  it('la capsule naît sur l’orbite de l’ISS, une quarantaine de kilomètres derrière elle', () => {
    const o = orbiteDerriere('ISS', t0, 40)
    const ecart = (t: number) => { const a = etatSurOrbite(o, t).position, b = position('ISS', t); return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) }
    expect(ecart(t0)).toBeGreaterThan(30)
    expect(ecart(t0)).toBeLessThan(50)
    // Une heure plus tard, elle est toujours tout près (même orbite).
    expect(ecart(t0 + 3_600_000)).toBeLessThan(150)
  })
})

describe('le premier trajet', () => {
  it('de la naissance de la capsule à l’ISS, au moteur 1 : moins de 30 secondes', async () => {
    const { Mission } = await import('../src/moteur/mission')
    const m = new Mission()
    m.orbite = orbiteDerriere('ISS', t0, 40)
    const p = planifier(m.etatHeliocentrique(t0 + 5000), 'ISS', t0 + 5000, 30)
    if (!p.possible) throw new Error('impossible')
    expect((p.plan.arrivee - p.plan.depart) / 1000).toBeLessThan(30)
  })
})
