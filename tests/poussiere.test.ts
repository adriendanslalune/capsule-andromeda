import { afterAll, describe, expect, it } from 'vitest'
import { positionTLEGeocentrique } from '../src/astro/iss'
import { twoline2satrec } from '../src/astro/sgp4'
import { projeterCorps, projeterPoussiere, rayonDessine } from '../src/carte/loupe'
import { ORBITE_ISS_SECOURS } from '../src/donnees/iss'
import { POUSSIERE, REFERENCE_POUSSIERE } from '../src/donnees/poussiere'
import { chargerPoussiere, elementsTLE, positionsPoussiere, viderPoussiere } from '../src/moteur/poussiere'

const { ligne1, ligne2 } = ORBITE_ISS_SECOURS
const REF = Date.UTC(2026, 9, 13)
/** Orbite géostationnaire fictive : i, Ω, e, ω, M, n. */
const GEO = [0.05, 80, 0.0002, 200, 10, 1.00274]

describe('poussière de satellites', () => {
  afterAll(viderPoussiere)

  it('rien tant que les données ne sont pas chargées', () => {
    viderPoussiere()
    expect(positionsPoussiere(REF)).toBeNull()
  })

  it("l'ISS en poussière suit la méthode officielle (SGP4) à quelques dizaines de km près", () => {
    chargerPoussiere(elementsTLE(ligne1, ligne2, REF).join(' '), REF)
    const sgp4 = twoline2satrec(ligne1, ligne2)
    for (const h of [0, 3, 12, 24]) {
      const t = REF + h * 3_600_000
      const p = positionsPoussiere(t)!
      const r = { x: p.positions[0], y: p.positions[1], z: p.positions[2] }
      const s = positionTLEGeocentrique(sgp4, t)
      expect(Math.hypot(r.x - s.x, r.y - s.y, r.z - s.z)).toBeLessThan(60)
    }
  })

  it('la normale est perpendiculaire à la position, dans le sens du mouvement', () => {
    chargerPoussiere(elementsTLE(ligne1, ligne2, REF).join(' '), REF)
    const a = positionsPoussiere(REF)!
    const r1 = [a.positions[0], a.positions[1], a.positions[2]]
    const n = [a.normales[0], a.normales[1], a.normales[2]]
    const b = positionsPoussiere(REF + 60_000)!
    const r2 = [b.positions[0], b.positions[1], b.positions[2]]
    const h = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]]
    const l = Math.hypot(...h), lr = Math.hypot(...r1)
    expect(Math.hypot(...n)).toBeCloseTo(1, 9)
    expect((n[0] * r1[0] + n[1] * r1[1] + n[2] * r1[2]) / lr).toBeCloseTo(0, 6)
    expect((n[0] * h[0] + n[1] * h[1] + n[2] * h[2]) / l).toBeGreaterThan(0.9999)
  })

  it('sur la carte : hors du disque de la Terre, la ceinture géostationnaire plus loin que l’orbite basse', () => {
    chargerPoussiere([...elementsTLE(ligne1, ligne2, REF), ...GEO].join(' '), REF)
    const p = positionsPoussiere(REF)!
    expect(Math.hypot(p.positions[3], p.positions[4], p.positions[5])).toBeCloseTo(42164, -2)
    const q = new Float64Array(4)
    projeterPoussiere('Terre', REF, p.nombre, p.positions, p.normales, q)
    const terre = projeterCorps('Terre', REF)
    const iss = Math.hypot(q[0] - terre.x, q[1] - terre.y), geo = Math.hypot(q[2] - terre.x, q[3] - terre.y)
    expect(iss).toBeGreaterThan(rayonDessine('Terre'))
    expect(geo).toBeGreaterThan(1.5 * iss)
  })

  it('les vraies données : des milliers de satellites, tous autour de la Terre', () => {
    chargerPoussiere(POUSSIERE, REFERENCE_POUSSIERE)
    const p = positionsPoussiere(REFERENCE_POUSSIERE + 30 * 86_400_000)!
    expect(p.nombre).toBeGreaterThan(10_000)
    for (let k = 0; k < p.nombre; k++) {
      const d = Math.hypot(p.positions[3 * k], p.positions[3 * k + 1], p.positions[3 * k + 2])
      expect(d).toBeGreaterThan(6378)
      expect(d).toBeLessThan(900_000)
    }
  })
})
