import { describe, expect, it } from 'vitest'
import { position } from '../src/moteur/corps'
import { projeter, projeterCorps, rayonDessine, zoneDessinee } from '../src/carte/loupe'

const T = Date.UTC(2026, 9, 17, 12)
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('loupe de la carte', () => {
  it('hors des systèmes, les vraies distances (vue du dessus)', () => {
    const p = { x: 2.7e8, y: 1.1e8, z: 3e6 }
    expect(projeter({ p, t: T })).toEqual({ x: p.x, y: p.y })
    for (const n of ['Terre', 'Mars', 'Jupiter']) {
      const q = position(n, T)
      expect(projeterCorps(n, T)).toEqual({ x: q.x, y: q.y })
    }
  })

  it('tailles proportionnées : Soleil énorme, Saturne grosse, Mercure petite', () => {
    expect(rayonDessine('Soleil')).toBeGreaterThan(rayonDessine('Jupiter'))
    expect(rayonDessine('Saturne')).toBeGreaterThan(rayonDessine('Terre'))
    expect(rayonDessine('Terre')).toBeGreaterThan(rayonDessine('Mercure'))
  })

  it('autour de la Terre : ISS, Hubble, Lune, James Webb dans le bon ordre, tous hors du disque dessiné', () => {
    for (let h = 0; h < 24; h += 3) {
      const t = T + h * 3_600_000
      const terre = projeterCorps('Terre', t)
      const d = (n: string) => dist(projeterCorps(n, t), terre)
      expect(d('ISS')).toBeGreaterThan(rayonDessine('Terre'))
      expect(d('Hubble')).toBeGreaterThan(d('ISS'))
      expect(d('Lune')).toBeGreaterThan(d('Hubble') + rayonDessine('Lune'))
      expect(d('James Webb')).toBeGreaterThan(d('Lune'))
      expect(d('James Webb')).toBeLessThan(zoneDessinee('Terre') * 1.2)
    }
  })

  it('une lune d’Uranus (planète couchée) tourne en douceur, sans sauter d’un bord à l’autre', () => {
    let avant = projeterCorps('Miranda', T)
    for (let m = 10; m < 36 * 60; m += 10) {
      const t = T + m * 60_000
      const ici = projeterCorps('Miranda', t)
      expect(dist(ici, avant)).toBeLessThan(zoneDessinee('Uranus') * 0.05)
      avant = ici
    }
  })

  it('les lunes de Jupiter restent dans l’ordre et hors du disque de Jupiter', () => {
    const j = projeterCorps('Jupiter', T)
    const d = ['Io', 'Europe', 'Ganymède', 'Callisto'].map((n) => dist(projeterCorps(n, T), j))
    expect(d[0]).toBeGreaterThan(rayonDessine('Jupiter'))
    for (let i = 1; i < 4; i++) expect(d[i]).toBeGreaterThan(d[i - 1])
  })

  it('pas de saut au bord de la zone de la Terre', () => {
    const terre = position('Terre', T)
    const zone = zoneDessinee('Terre')
    const a = projeter({ p: { x: terre.x + zone * 0.999, y: terre.y, z: terre.z }, t: T })
    const b = projeter({ p: { x: terre.x + zone * 1.001, y: terre.y, z: terre.z }, t: T })
    expect(dist(a, b)).toBeLessThan(zone * 0.01)
  })
})
