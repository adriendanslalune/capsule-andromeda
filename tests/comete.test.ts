import { describe, expect, it } from 'vitest'
import { orbiteHalley, positionHalley } from '../src/moteur/comete'
import { UA_KM } from '../src/moteur/temps'

const dist = (p: { x: number; y: number; z: number }) => Math.hypot(p.x, p.y, p.z) / UA_KM

describe('la comète de Halley', () => {
  it('au plus près du Soleil le 9 février 1986, à 0,59 UA', () => {
    expect(dist(positionHalley(Date.UTC(1986, 1, 9, 11)))).toBeCloseTo(0.586, 2)
  })
  it('au plus loin fin 2023, à 35 UA, et encore au-delà de Neptune en 2026', () => {
    expect(dist(positionHalley(Date.UTC(2023, 11, 9)))).toBeGreaterThan(35)
    const d = dist(positionHalley(Date.UTC(2026, 9, 22)))
    expect(d).toBeGreaterThan(33.5)
    expect(d).toBeLessThan(35.2)
  })
  it('revient tous les 75 ans environ (prochain passage en 2061 ; sans les planètes, deux mois trop tôt)', () => {
    expect(dist(positionHalley(Date.UTC(2061, 5, 1)))).toBeLessThan(0.7)
  })
  it('son orbite tourne à l\'envers (inclinaison de 162°) et va de 0,59 à 35 UA', () => {
    const o = orbiteHalley(512).map(dist)
    expect(Math.min(...o)).toBeCloseTo(0.586, 2)
    expect(Math.max(...o)).toBeGreaterThan(35)
  })
})
