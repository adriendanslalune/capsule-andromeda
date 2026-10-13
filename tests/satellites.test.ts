import { describe, expect, it } from 'vitest'
import {
  LISTE_SATELLITES,
  positionSatellite,
  positionSatellitePlanetocentrique,
  satellite,
  satellitesDe,
} from '../src/astro/satellites'
import { positionPlanete } from '../src/astro/planetes'
import { UA_KM } from '../src/astro/temps'
import { angleEntre, norme, soustraire } from '../src/astro/vecteur'
import { FIN_VALIDITE_SATELLITES } from '../src/donnees/satellites'
import refSatellites from './references/horizons-satellites.json'

type Ref = { jd: number; x: number; y: number; z: number }
const instant = (jd: number) => (jd - 2440587.5) * 86_400_000

describe('liste des satellites', () => {
  it('contient tous les satellites connus des planètes (plus de 400)', () => {
    expect(LISTE_SATELLITES.length).toBeGreaterThan(400)
  })

  it('aucun doublon de code', () => {
    expect(new Set(LISTE_SATELLITES.map((s) => s.code)).size).toBe(LISTE_SATELLITES.length)
  })

  it('les grands satellites sont présents, avec leurs noms français', () => {
    for (const nom of ['Phobos', 'Deimos', 'Io', 'Europe', 'Ganymède', 'Callisto', 'Titan', 'Japet', 'Encelade',
      'Titania', 'Obéron', 'Miranda', 'Triton', 'Néréide']) {
      expect(satellite(nom), nom).toBeDefined()
    }
    expect(satellite('Ganymède')!.rayon).toBeCloseTo(2631, 0)
  })

  it('chaque planète a ses satellites, sauf Mercure et Vénus', () => {
    expect(satellitesDe('Mercure')).toHaveLength(0)
    expect(satellitesDe('Vénus')).toHaveLength(0)
    expect(satellitesDe('Terre')).toHaveLength(0) // la Lune est calculée à part
    expect(satellitesDe('Mars')).toHaveLength(2)
    expect(satellitesDe('Jupiter').length).toBeGreaterThan(90)
    expect(satellitesDe('Saturne').length).toBeGreaterThan(250)
    expect(satellitesDe('Uranus').length).toBeGreaterThan(25)
    expect(satellitesDe('Neptune').length).toBeGreaterThan(14)
  })

  it('les orbites couvrent au moins jusqu’en 2030', () => {
    expect(FIN_VALIDITE_SATELLITES).toBeGreaterThanOrEqual(Date.UTC(2030, 11, 31))
  })
})

describe('positions réelles (comparées à JPL Horizons)', () => {
  const positions = refSatellites.positions as Record<string, Ref[]>

  it('chaque satellite de l’échantillon est à moins de 1,5° de sa vraie place, vu de sa planète', () => {
    for (const code in positions) {
      const s = LISTE_SATELLITES.find((x) => x.code === Number(code))!
      for (const r of positions[code]) {
        const p = positionSatellitePlanetocentrique(s, instant(r.jd))
        expect(angleEntre(p, r), `${s.nom} au jour julien ${r.jd}`).toBeLessThan(1.5)
        expect(Math.abs(norme(p) - norme(r)) / norme(r), `${s.nom} : distance`).toBeLessThan(0.05)
      }
    }
  })

  it('les grands satellites sont à moins de 0,5°', () => {
    for (const nom of ['Io', 'Europe', 'Ganymède', 'Callisto', 'Titan', 'Rhéa', 'Japet', 'Titania', 'Obéron', 'Triton']) {
      const s = satellite(nom)!
      for (const r of positions[String(s.code)]) {
        expect(angleEntre(positionSatellitePlanetocentrique(s, instant(r.jd)), r), nom).toBeLessThan(0.5)
      }
    }
  })
})

describe('mouvement', () => {
  it('Io fait le tour de Jupiter en 1,77 jour', () => {
    const io = satellite('Io')!
    const t = Date.UTC(2027, 2, 1)
    expect(io.periode).toBeCloseTo(1.769, 2)
    const avant = positionSatellitePlanetocentrique(io, t)
    expect(angleEntre(avant, positionSatellitePlanetocentrique(io, t + io.periode * 86_400_000))).toBeLessThan(0.5)
    expect(angleEntre(avant, positionSatellitePlanetocentrique(io, t + (io.periode / 2) * 86_400_000))).toBeGreaterThan(170)
  })

  it('la position héliocentrique = position de la planète + position autour de la planète', () => {
    const titan = satellite('Titan')!
    const t = Date.UTC(2026, 9, 13)
    const ecart = norme(soustraire(positionSatellite(titan, t), positionPlanete('Saturne', t))) * UA_KM
    expect(ecart).toBeCloseTo(norme(positionSatellitePlanetocentrique(titan, t)), 3)
  })

  it('toutes les positions sont des nombres valides, même hors de la période couverte', () => {
    for (const t of [Date.UTC(2020, 0, 1), Date.UTC(2026, 9, 13), Date.UTC(2035, 0, 1)]) {
      for (const s of LISTE_SATELLITES) {
        const p = positionSatellitePlanetocentrique(s, t)
        expect(Number.isFinite(p.x + p.y + p.z), s.nom).toBe(true)
      }
    }
  })
})
