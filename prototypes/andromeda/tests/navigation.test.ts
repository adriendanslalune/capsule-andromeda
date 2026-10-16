import { describe, expect, it } from 'vitest'
import { distanceDepuisCapsule, texteDistance } from '../src/moteur/navigation'
import { UA_KM } from '../src/moteur/temps'

const t = Date.UTC(2026, 9, 16, 12)

describe('distance à la destination', () => {
  it('la capsule est à 400 km au-dessus de la Terre, à environ 384 000 km de la Lune', () => {
    expect(distanceDepuisCapsule('Terre', t)).toBeCloseTo(6771, 0)
    const lune = distanceDepuisCapsule('Lune', t)
    expect(lune).toBeGreaterThan(350_000)
    expect(lune).toBeLessThan(410_000)
  })
  it('Mars est entre 0,37 et 2,7 UA', () => {
    const d = distanceDepuisCapsule('Mars', t) / UA_KM
    expect(d).toBeGreaterThan(0.37)
    expect(d).toBeLessThan(2.7)
  })
  it('écrit les distances en français', () => {
    expect(texteDistance(0.045)).toBe('45 m')
    expect(texteDistance(384_400)).toBe('384\u202f000 km') // espace fine insécable, à la française
    expect(texteDistance(7_820_000)).toBe('7,82 millions de km')
    expect(texteDistance(4.2 * UA_KM)).toBe('4,2 UA')
  })
})
