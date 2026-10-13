import { afterEach, describe, expect, it } from 'vitest'
import { definirOrbiteISS, demiGrandAxeISS, epoqueOrbiteISS, orbiteISS, periodeISS, positionISSGeocentrique,
  positionISSSimulee } from '../src/astro/iss'
import { angleEntre, norme } from '../src/astro/vecteur'
import { ORBITE_ISS_SECOURS } from '../src/donnees/iss'
import refISS from './references/horizons-iss.json'

const instant = (jd: number) => (jd - 2440587.5) * 86_400_000

afterEach(() => definirOrbiteISS(ORBITE_ISS_SECOURS))

describe('ISS', () => {
  it('tourne à environ 400 km d’altitude, en 93 minutes', () => {
    const altitude = norme(positionISSGeocentrique(Date.UTC(2026, 9, 13, 12))) - 6371
    expect(altitude).toBeGreaterThan(380)
    expect(altitude).toBeLessThan(440)
    expect(periodeISS() * 1440).toBeCloseTo(93, 0)
    expect(demiGrandAxeISS()).toBeGreaterThan(6371 + 380)
  })

  it('est à sa vraie place (JPL Horizons) : à moins de 30 km près le jour même, 100 km trois jours après', () => {
    for (const r of refISS.positions) {
      const p = positionISSGeocentrique(instant(r.jd))
      const ecart = Math.hypot(p.x - r.x, p.y - r.y, p.z - r.z)
      const jours = (instant(r.jd) - epoqueOrbiteISS()) / 86_400_000
      expect(ecart, `${jours.toFixed(1)} j après la mesure`).toBeLessThan(jours < 1 ? 30 : 100)
      expect(angleEntre(p, r)).toBeLessThan(1)
    }
  })

  it('position réelle si l’orbite a moins de 3 jours, simulée au-delà', () => {
    const epoque = epoqueOrbiteISS()
    expect(new Date(epoque).toISOString().slice(0, 10)).toBe('2026-10-13')
    expect(positionISSSimulee(epoque + 2 * 86_400_000)).toBe(false)
    expect(positionISSSimulee(epoque + 4 * 86_400_000)).toBe(true)
  })

  it('accepte une nouvelle orbite et refuse une orbite invalide', () => {
    definirOrbiteISS({ ...ORBITE_ISS_SECOURS })
    expect(orbiteISS()).toEqual(ORBITE_ISS_SECOURS)
    expect(() => definirOrbiteISS({ ligne1: '1 n’importe quoi', ligne2: '2 vraiment' })).toThrow()
    expect(orbiteISS()).toEqual(ORBITE_ISS_SECOURS)
  })
})
