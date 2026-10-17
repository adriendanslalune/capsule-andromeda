import { describe, expect, it } from 'vitest'
import { directionEtoile, ecartVisee } from '../src/astro/etoiles'
import { delaiLumiere } from '../src/astro/lumiere'
import { positionLune, positionLuneGeocentrique } from '../src/astro/lune'
import { positionPlanete } from '../src/astro/planetes'
import { jourJulien, joursDepuisJ2000, UA_KM } from '../src/astro/temps'
import { angleEntre, norme, resoudreKepler, soustraire, type Vecteur3 } from '../src/astro/vecteur'
import { ETOILES } from '../src/donnees/etoiles'
import { NOMS_PLANETES, PLANETES } from '../src/donnees/planetes'
import refLune from './references/horizons-lune.json'
import refPlanetes from './references/horizons-planetes.json'

type Ref = { jd: number; x: number; y: number; z: number }
const instant = (jd: number) => (jd - 2440587.5) * 86_400_000
const enUA = (r: Ref): Vecteur3 => ({ x: r.x / UA_KM, y: r.y / UA_KM, z: r.z / UA_KM })

describe('temps', () => {
  it('J2000 = 1er janvier 2000 à 12 h', () => {
    expect(jourJulien(Date.UTC(2000, 0, 1, 12))).toBe(2451545)
    expect(joursDepuisJ2000(Date.UTC(2000, 0, 2, 12))).toBe(1)
  })
})

describe('équation de Kepler', () => {
  it('E − e·sin E = M, même pour une orbite très allongée', () => {
    for (const e of [0, 0.0167, 0.2056, 0.75]) {
      for (const M of [0.1, 1, 2, 3, -2.5]) {
        const E = resoudreKepler(M, e, 12)
        expect(E - e * Math.sin(E)).toBeCloseTo(M, 10)
      }
    }
  })
})

describe('planètes', () => {
  // Copie exacte de la fonction `pos` du prototype v0.1, pour vérifier que le portage est identique.
  function posPrototype(i: number, ms: number) {
    const R = Math.PI / 180
    const e = PLANETES[i], T = (ms / 86400000 + 2440587.5 - 2451545) / 36525, k: number[] = []
    for (let j = 0; j < 6; j++) k[j] = e.elements[j] + e.parSiecle[j] * T
    const a = k[0], ec = k[1], I = k[2] * R, L = k[3], w = k[4], O = k[5]
    const M = ((L - w) % 360 + 540) % 360 - 180, om = (w - O) * R, On = O * R, m = M * R
    let E = m + ec * Math.sin(m)
    for (let n = 0; n < 6; n++) E = E - (E - ec * Math.sin(E) - m) / (1 - ec * Math.cos(E))
    const xp = a * (Math.cos(E) - ec), yp = a * Math.sqrt(1 - ec * ec) * Math.sin(E)
    const co = Math.cos(om), so = Math.sin(om), cO = Math.cos(On), sO = Math.sin(On), cI = Math.cos(I)
    return { x: (co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp,
      y: (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp }
  }

  it('donnent exactement les mêmes x, y que le prototype', () => {
    for (const t of [Date.UTC(2000, 0, 1), Date.UTC(2026, 9, 13, 12), Date.UTC(2049, 5, 30)]) {
      NOMS_PLANETES.forEach((nom, i) => {
        const p = positionPlanete(nom, t), q = posPrototype(i, t)
        expect(p.x).toBe(q.x)
        expect(p.y).toBe(q.y)
      })
    }
  })

  it('sont à leur vraie place (JPL Horizons) à moins de 0,2° vues du Soleil, de 2000 à 2050', () => {
    NOMS_PLANETES.forEach((nom, i) => {
      for (const r of (refPlanetes.positions as Record<string, Ref[]>)[String(100 * i + 199)]) {
        const p = positionPlanete(nom, instant(r.jd))
        expect(angleEntre(p, enUA(r)), `${nom} au jour julien ${r.jd}`).toBeLessThan(0.2)
        expect(Math.abs(norme(p) - norme(enUA(r))) / norme(enUA(r))).toBeLessThan(0.003)
      }
    })
  })

  it('la Terre est à 1 UA du Soleil et Neptune à 30 UA', () => {
    const t = Date.UTC(2026, 9, 13)
    expect(norme(positionPlanete('Terre', t))).toBeCloseTo(1, 1)
    expect(norme(positionPlanete('Neptune', t))).toBeGreaterThan(29.7)
    expect(norme(positionPlanete('Neptune', t))).toBeLessThan(30.4)
  })
})

describe('Lune', () => {
  it('est à sa vraie place (JPL Horizons) à moins de 0,05° et 100 km, de 2000 à 2050', () => {
    for (const r of refLune.positions['301']) {
      const p = positionLuneGeocentrique(instant(r.jd))
      expect(angleEntre(p, r), `jour julien ${r.jd}`).toBeLessThan(0.05)
      expect(Math.abs(norme(p) - norme(r))).toBeLessThan(100)
    }
  })

  it('reste entre 356 000 et 407 000 km de la Terre sur tout un mois', () => {
    const debut = Date.UTC(2026, 9, 1)
    for (let h = 0; h < 30 * 24; h += 6) {
      const d = norme(positionLuneGeocentrique(debut + h * 3_600_000))
      expect(d).toBeGreaterThan(356_000)
      expect(d).toBeLessThan(407_000)
    }
  })

  it('suit la Terre autour du Soleil', () => {
    const t = Date.UTC(2026, 9, 13)
    const ecart = norme(soustraire(positionLune(t), positionPlanete('Terre', t))) * UA_KM
    expect(ecart).toBeCloseTo(norme(positionLuneGeocentrique(t)), 3)
  })
})

describe('étoiles du sextant', () => {
  it('12 étoiles, directions unitaires', () => {
    expect(ETOILES).toHaveLength(12)
    for (const e of ETOILES) expect(norme(directionEtoile(e))).toBeCloseTo(1, 12)
  })

  it("l'écart de visée tient compte de la hauteur (écart d'azimut × cos(hauteur))", () => {
    const vega = ETOILES[1] // hauteur 62°
    expect(ecartVisee(vega.azimut, vega.hauteur, vega)).toBe(0)
    expect(ecartVisee(vega.azimut + 3, vega.hauteur, vega)).toBeCloseTo(3 * Math.cos(62 * Math.PI / 180), 10)
    expect(ecartVisee(359, 0, { nom: 'essai', azimut: 1, hauteur: 0 })).toBeCloseTo(2, 10)
  })
})

describe('lumière', () => {
  it('met 499 secondes pour parcourir 1 UA', () => {
    expect(delaiLumiere(1)).toBe(499.0048)
    expect(delaiLumiere(0)).toBe(0)
  })
})
