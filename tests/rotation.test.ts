import { describe, expect, it } from 'vitest'
import { pointSubsolaire } from '../src/moteur/rotation'

describe('la Terre qui tourne : le point subsolaire (demande d’Adrien du 21/10/2026)', () => {
  it('à midi UTC, le Soleil est au zénith près du méridien de Greenwich ; à minuit UTC, de l’autre côté', () => {
    expect(Math.abs(pointSubsolaire(Date.UTC(2026, 9, 21, 12)).lon)).toBeLessThan(5)
    expect(Math.abs(pointSubsolaire(Date.UTC(2026, 9, 21, 0)).lon)).toBeGreaterThan(175)
    // Une heure plus tard, 15 degrés plus à l'ouest.
    const a = pointSubsolaire(Date.UTC(2026, 9, 21, 12)).lon, b = pointSubsolaire(Date.UTC(2026, 9, 21, 13)).lon
    expect(a - b).toBeCloseTo(15, 1)
  })

  it('la déclinaison : 0 aux équinoxes, ±23,4° aux solstices ; l’équation du temps (16 min début novembre)', () => {
    expect(Math.abs(pointSubsolaire(Date.UTC(2026, 2, 20, 14, 46)).lat)).toBeLessThan(0.3)
    expect(pointSubsolaire(Date.UTC(2026, 5, 21, 8, 24)).lat).toBeCloseTo(23.44, 1)
    expect(pointSubsolaire(Date.UTC(2026, 11, 21, 20, 50)).lat).toBeCloseTo(-23.44, 1)
    // Le 3 novembre, le Soleil passe au méridien de Greenwich vers 11 h 44 UTC (16 minutes d'avance).
    expect(Math.abs(pointSubsolaire(Date.UTC(2026, 10, 3, 11, 44)).lon)).toBeLessThan(0.3)
  })
})

describe('les autres astres qui tournent (demande d’Adrien du 21/10/2026)', () => {
  it('Jupiter fait un tour en moins de 10 h ; Vénus (ses nuages) tourne à l’envers ; un astre sans rotation : null', async () => {
    const { orientation } = await import('../src/moteur/rotation')
    const t = Date.UTC(2026, 9, 21, 12)
    const a = orientation('Jupiter', t)!.lon, b = orientation('Jupiter', t + 3_600_000)!.lon
    expect(((a - b) % 360 + 360) % 360).toBeCloseTo(36.27, 1)
    const v1 = orientation('Vénus', t)!.lon, v2 = orientation('Vénus', t + 3_600_000)!.lon
    expect(((v2 - v1) % 360 + 360) % 360).toBeCloseTo(3.75, 1)
    expect(orientation('Io', t)).toBeNull()
    expect(orientation('Terre', t)).toEqual(pointSubsolaire(t))
  })

  it('les saisons : en 2026, le pôle nord d’Uranus et celui de Pluton sont au soleil ; Mercure, jamais incliné', async () => {
    const { orientation } = await import('../src/moteur/rotation')
    const t = Date.UTC(2026, 9, 21, 12)
    expect(orientation('Uranus', t)!.lat).toBeGreaterThan(50)
    expect(orientation('Pluton', t)!.lat).toBeGreaterThan(40)
    expect(orientation('Mercure', t)!.lat).toBeCloseTo(0, 9)
  })
})

describe('la Lune qui tourne (demande d’Adrien du 21/10/2026)', () => {
  it('pleine lune : sa face visible au soleil ; nouvelle lune : sa face cachée', async () => {
    const { orientation } = await import('../src/moteur/rotation')
    // Pleine lune du 26 octobre 2026 (4 h 12 UTC), nouvelle lune du 10 octobre 2026 (15 h 50 UTC).
    expect(Math.abs(orientation('Lune', Date.UTC(2026, 9, 26, 4, 12))!.lon)).toBeLessThan(10)
    expect(Math.abs(orientation('Lune', Date.UTC(2026, 9, 10, 15, 50))!.lon)).toBeGreaterThan(170)
  })
})
