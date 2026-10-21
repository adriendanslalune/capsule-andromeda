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
