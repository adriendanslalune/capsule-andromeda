import { describe, expect, it } from 'vitest'
import { positionAstre } from '../src/moteur/fusee'
import { deprojeter, projeter, rayonDessine } from '../src/interface/carte/projection'

const T = Date.UTC(2026, 9, 17)
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('projection de la carte', () => {
  it('hors des systèmes, les distances sont vraies', () => {
    const p = { x: 1.6, y: 0.4 }
    const mars = positionAstre('Mars', T)
    if (dist(p, mars) > 0.01) expect(projeter(p, T)).toEqual(p)
    for (const n of ['Terre', 'Mars', 'Jupiter']) expect(dist(projeter(positionAstre(n, T), T), positionAstre(n, T))).toBeLessThan(1e-12)
  })

  it('tailles proportionnées : Soleil énorme, Saturne grosse, Mercure petite', () => {
    expect(rayonDessine('Soleil')).toBeGreaterThan(rayonDessine('Jupiter'))
    expect(rayonDessine('Saturne')).toBeGreaterThan(rayonDessine('Terre'))
    expect(rayonDessine('Terre')).toBeGreaterThan(rayonDessine('Mercure'))
  })

  it('autour de la Terre : ISS, Hubble, Lune, James Webb dans le bon ordre, tous hors du disque dessiné', () => {
    const terre = projeter(positionAstre('Terre', T), T)
    const d = (n: string) => dist(projeter(positionAstre(n, T), T), terre)
    expect(d('ISS')).toBeGreaterThan(rayonDessine('Terre'))
    expect(d('Hubble')).toBeGreaterThan(d('ISS'))
    expect(d('Lune')).toBeGreaterThan(d('Hubble') + rayonDessine('Lune'))
    expect(d('James Webb')).toBeGreaterThan(d('Lune'))
  })

  it('continue au bord des zones, et réversible', () => {
    const terre = positionAstre('Terre', T)
    for (const f of [0.0099, 0.01001, 0.003, 0.0005]) {
      const p = { x: terre.x + f, y: terre.y }
      const q = { x: terre.x + f * 1.0001, y: terre.y }
      expect(dist(projeter(p, T), projeter(q, T))).toBeLessThan(0.002)
      expect(dist(deprojeter(projeter(p, T), T), p)).toBeLessThan(1e-9)
    }
  })

  it('les lunes de Jupiter restent dans l’ordre et hors du disque de Jupiter', () => {
    const j = projeter(positionAstre('Jupiter', T), T)
    const d = ['Io', 'Europe', 'Ganymède', 'Callisto'].map((n) => dist(projeter(positionAstre(n, T), T), j))
    expect(d[0]).toBeGreaterThan(rayonDessine('Jupiter'))
    for (let i = 1; i < 4; i++) expect(d[i]).toBeGreaterThan(d[i - 1])
  })
})
