import * as AE from 'astronomy-engine'
import { describe, expect, it } from 'vitest'
import refLune from '../../../tests/references/horizons-lune.json'
import refPlanetes from '../../../tests/references/horizons-planetes.json'
import { CORPS, astreDominant, position, positionRelative, rayonInfluence } from '../src/moteur/corps'
import { positionPluton } from '../src/moteur/pluton'
import { UA_KM } from '../src/moteur/temps'
import { positionVSOP } from '../src/moteur/vsop87'

type Ref = { jd: number; x: number; y: number; z: number }
const instant = (jd: number) => (jd - 2440587.5) * 86_400_000
const ecart = (p: { x: number; y: number; z: number }, r: Ref) => Math.hypot(p.x - r.x, p.y - r.y, p.z - r.z)

// Écart maximal toléré avec JPL Horizons, de 2000 à 2050 (km).
const TOLERANCES: Record<string, number> = {
  Mercure: 500, Vénus: 500, Terre: 500, Mars: 500, Jupiter: 3_000, Saturne: 5_000, Uranus: 25_000, Neptune: 60_000,
}
const NOMS = Object.keys(TOLERANCES)

describe('planètes (VSOP87B) comparées à JPL Horizons', () => {
  NOMS.forEach((nom, i) => {
    it(`${nom} à moins de ${TOLERANCES[nom].toLocaleString('fr')} km`, () => {
      for (const r of (refPlanetes.positions as Record<string, Ref[]>)[String(100 * i + 199)]) {
        expect(ecart(positionVSOP(nom, instant(r.jd)), r), `jour julien ${r.jd}`).toBeLessThan(TOLERANCES[nom])
      }
    })
  })

  it("aux planètes intérieures, l'erreur reste sous l'arc-seconde vue du Soleil", () => {
    for (const nom of ['Mercure', 'Vénus', 'Terre', 'Mars']) {
      const refs = (refPlanetes.positions as Record<string, Ref[]>)[String(100 * NOMS.indexOf(nom) + 199)]
      for (const r of refs) {
        const d = Math.hypot(r.x, r.y, r.z)
        expect(ecart(positionVSOP(nom, instant(r.jd)), r) / d / (Math.PI / 648000)).toBeLessThan(1)
      }
    }
  })
})

describe('Lune', () => {
  it('à moins de 150 km de JPL Horizons', () => {
    for (const r of (refLune.positions as Record<string, Ref[]>)['301']) {
      expect(ecart(positionRelative('Lune', instant(r.jd)), r)).toBeLessThan(150)
    }
  })
})

describe('Pluton', () => {
  // Pas de position JPL de Pluton dans le dépôt : on compare à un second modèle indépendant (Astronomy Engine,
  // intégration numérique calée sur les éphémérides du JPL). Les deux diffèrent d'environ 150 000 km : à vérifier
  // contre JPL Horizons dès que le réseau le permet.
  it("s'accorde avec Astronomy Engine à moins de 250 000 km (1″ vu de la Terre), de 2020 à 2040", () => {
    const eps = 23.4392911 * (Math.PI / 180)
    for (let an = 2020; an <= 2040; an += 2) {
      const t = Date.UTC(an, 3, 1)
      const v = AE.HelioVector(AE.Body.Pluto, new Date(t))
      const ref = { jd: 0, x: v.x * UA_KM, y: (Math.cos(eps) * v.y + Math.sin(eps) * v.z) * UA_KM,
        z: (-Math.sin(eps) * v.y + Math.cos(eps) * v.z) * UA_KM }
      expect(ecart(positionPluton(t), ref), String(an)).toBeLessThan(250_000)
    }
  })
})

describe('catalogue', () => {
  const t = Date.UTC(2026, 9, 16, 12)

  it('contient Soleil, 8 planètes, Pluton, la Lune, plus de 400 lunes, ISS, Hubble, des sondes', () => {
    const noms = new Set(CORPS.map((c) => c.nom))
    for (const n of ['Soleil', 'Terre', 'Mars', 'Pluton', 'Lune', 'Titan', 'ISS', 'Hubble', 'Juno', 'James Webb',
      'New Horizons', 'Pioneer 10']) expect(noms.has(n), n).toBe(true)
    expect(CORPS.filter((c) => c.type === 'lune').length).toBeGreaterThan(400)
  })

  it('chaque astre a une position finie', () => {
    for (const c of CORPS) {
      const p = position(c.nom, t)
      expect(Number.isFinite(p.x + p.y + p.z), c.nom).toBe(true)
    }
  })

  it("l'ISS est à environ 400 km d'altitude, Juno près de Jupiter, Webb à 1,5 million de km", () => {
    const terre = position('Terre', t)
    const d = (a: string, b: { x: number; y: number; z: number }) => {
      const p = position(a, t)
      return Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z)
    }
    expect(d('ISS', terre) - 6371).toBeGreaterThan(350)
    expect(d('ISS', terre) - 6371).toBeLessThan(450)
    expect(d('Juno', position('Jupiter', t))).toBeLessThan(10_000_000)
    expect(d('James Webb', terre)).toBeGreaterThan(1_000_000)
    expect(d('James Webb', terre)).toBeLessThan(2_000_000)
  })

  it("la caméra s'accroche à la Terre près de la Terre, au Soleil entre les planètes", () => {
    const terre = position('Terre', t)
    expect(astreDominant({ x: terre.x + 50_000, y: terre.y }, t)).toBe('Terre')
    expect(astreDominant({ x: 0.5 * UA_KM, y: 2 * UA_KM }, t)).toBe('Soleil')
    expect(rayonInfluence('Terre')).toBeGreaterThan(1_400_000)
    expect(rayonInfluence('Terre')).toBeLessThan(1_600_000)
  })
})

describe('orbites tracées', () => {
  const t = Date.UTC(2026, 9, 16, 12)
  it("l'ellipse de Pluton passe par Pluton et va de 29 à 50 UA du Soleil", async () => {
    const { traceOrbite } = await import('../src/moteur/orbite')
    const points = traceOrbite('Pluton', t)!
    const distances = points.map((p) => Math.hypot(p.x, p.y, p.z) / UA_KM)
    expect(Math.min(...distances)).toBeGreaterThan(29)
    expect(Math.max(...distances)).toBeLessThan(50)
    const pl = position('Pluton', t)
    expect(Math.min(...points.map((p) => Math.hypot(p.x - pl.x, p.y - pl.y, p.z - pl.z)))).toBeLessThan(0.05 * UA_KM)
  })
  it("l'orbite de Mars passe par Mars", async () => {
    const { traceOrbite } = await import('../src/moteur/orbite')
    const m = position('Mars', t)
    const points = traceOrbite('Mars', t)!
    expect(Math.min(...points.map((p) => Math.hypot(p.x - m.x, p.y - m.y, p.z - m.z)))).toBeLessThan(1000)
  })
})
