import { describe, expect, it } from 'vitest'
import { angleRadar, avancerRadar, basculerRadar, DUREE_RADAR, echoRadar, jaugeRadar, PERIODE_RADAR, radarEteint } from '../src/moteur/radar'

const t0 = Date.UTC(2026, 9, 20, 12)

describe('le radar (décisions d’Adrien du 20/10/2026)', () => {
  it('la jauge monte en 30 s pendant qu’il tourne ; pleine, il s’arrête ; éteint, elle redescend au même rythme', () => {
    const r = radarEteint()
    expect(basculerRadar(r, t0)).toBe(true)
    expect(jaugeRadar(r, t0 + 15_000)).toBeCloseTo(0.5, 6)
    avancerRadar(r, t0 + 40_000)
    expect(r.actif).toBe(false)
    expect(r.fin).toBe(t0 + DUREE_RADAR)
    expect(jaugeRadar(r, t0 + 40_000)).toBeCloseTo(1 - 10 / 30, 6)
    // Tant que la jauge n'est pas pleine, on peut le rallumer.
    expect(basculerRadar(r, t0 + 40_000)).toBe(true)
    expect(basculerRadar(r, t0 + 45_000)).toBe(false)
    expect(jaugeRadar(r, t0 + 45_000)).toBeCloseTo(1 - 10 / 30 + 5 / 30, 6)
    expect(jaugeRadar(r, t0 + 10 * 60_000)).toBe(0)
  })

  it('jauge pleine : il ne s’allume pas', () => {
    const r = radarEteint()
    basculerRadar(r, t0)
    avancerRadar(r, t0 + DUREE_RADAR)
    expect(basculerRadar(r, t0 + DUREE_RADAR)).toBe(false)
    expect(basculerRadar(r, t0 + DUREE_RADAR + 1000)).toBe(true)
  })

  it('un objet apparaît au passage du balayage sur sa direction, puis s’efface ; plus rien une fois le radar éteint', () => {
    const r = radarEteint()
    expect(echoRadar(r, 1, t0)).toBe(0)
    basculerRadar(r, t0)
    const angle = Math.PI / 2 // le balayage y passe un quart de tour après l'allumage
    expect(echoRadar(r, angle, t0 + 0.2 * PERIODE_RADAR)).toBe(0)
    expect(echoRadar(r, angle, t0 + 0.26 * PERIODE_RADAR)).toBeGreaterThan(0.95)
    expect(echoRadar(r, angle, t0 + 0.9 * PERIODE_RADAR)).toBeGreaterThan(0.3)
    expect(angleRadar(r, t0 + PERIODE_RADAR)).toBeCloseTo(2 * Math.PI, 6)
    basculerRadar(r, t0 + 3 * PERIODE_RADAR)
    expect(echoRadar(r, angle, t0 + 3.1 * PERIODE_RADAR)).toBeGreaterThan(0)
    expect(echoRadar(r, angle, t0 + 5 * PERIODE_RADAR)).toBe(0)
  })
})
