import { describe, expect, it } from 'vitest'
import { NOMS_ENGINS, positionEngin } from '../src/astro/engins'
import { positionPlanete } from '../src/astro/planetes'
import { UA_KM } from '../src/astro/temps'
import { APPROCHE_ENGIN_KM } from '../src/donnees/engins'
import { TRAJECTOIRES } from '../src/donnees/engins-jpl'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { choisirDestination, positionAstre } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 14, 12)
const JOUR = 86_400_000
type V = { x: number; y: number; z: number }
const km = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * UA_KM
const ua = (a: V) => Math.hypot(a.x, a.y, a.z)

describe('engins humains, à leur position réelle', () => {
  it('Hubble à environ 470 km d’altitude, Tiangong à environ 390 km', () => {
    for (let m = 0; m < 200; m += 13) {
      const t = T0 + m * 60_000
      const h = km(positionEngin('Hubble', t), positionPlanete('Terre', t)) - 6378
      const g = km(positionEngin('Tiangong', t), positionPlanete('Terre', t)) - 6378
      expect(h).toBeGreaterThan(440)
      expect(h).toBeLessThan(500)
      expect(g).toBeGreaterThan(340)
      expect(g).toBeLessThan(420)
    }
  })

  it('Voyager 1 : la position de JPL Horizons le 14 octobre 2026 à 0 h', () => {
    // Horizons (vecteurs héliocentriques, écliptique J2000) : -32,17856, -136,92679, 99,06905 UA.
    const p = positionEngin('Voyager 1', Date.UTC(2026, 9, 14))
    expect(km(p, { x: -32.17856338, y: -136.92679367, z: 99.06905157 })).toBeLessThan(2000)
    expect(ua(p)).toBeGreaterThan(171)
    expect(ua(p)).toBeLessThan(173)
  })

  it('aux instants des données, l’interpolation redonne exactement les points de JPL', () => {
    for (const tr of TRAJECTOIRES) {
      const n = Math.floor(tr.points.length / 3 / 2)
      const t = tr.debut + n * tr.pasJours * JOUR
      const c = tr.centre === 'Soleil' ? { x: 0, y: 0, z: 0 } : positionPlanete(tr.centre, t)
      const p = positionEngin(tr.nom, t)
      expect(km(p, { x: c.x + tr.points[3 * n], y: c.y + tr.points[3 * n + 1], z: c.z + tr.points[3 * n + 2] }), tr.nom).toBeLessThan(1)
    }
  })

  it('chacun est où il doit être', () => {
    const terre = positionPlanete('Terre', T0)
    for (const n of ['James Webb']) {
      const d = km(positionEngin(n, T0), terre)
      expect(d, n).toBeGreaterThan(1_000_000)
      expect(d, n).toBeLessThan(2_000_000)
    }
    // Gaia, retraité, s'éloigne peu à peu de la Terre en tournant autour du Soleil.
    expect(ua(positionEngin('Gaia', T0))).toBeGreaterThan(0.9)
    expect(km(positionEngin('Juno', T0), positionPlanete('Jupiter', T0))).toBeLessThan(10_000_000)
    const parker = ua(positionEngin('Parker Solar Probe', T0))
    expect(parker).toBeGreaterThan(0.04)
    expect(parker).toBeLessThan(0.9)
    // Après la fin des données (avril 2027), BepiColombo reste auprès de Mercure.
    const t = Date.UTC(2028, 0, 1)
    expect(km(positionEngin('BepiColombo', t), positionPlanete('Mercure', t))).toBeLessThan(100_000)
  })

  it('des positions partout, de 2026 à 2030, sans saut', () => {
    for (const n of NOMS_ENGINS) {
      let avant = positionEngin(n, Date.UTC(2026, 0, 1))
      for (let t = Date.UTC(2026, 0, 1) + 3_600_000; t < Date.UTC(2030, 0, 1); t += 37 * JOUR) {
        const p = positionEngin(n, t)
        expect(Number.isFinite(p.x + p.y + p.z), n).toBe(true)
        avant = p
      }
      expect(avant).toBeDefined()
    }
  })

  it('on peut aller jusqu’à Hubble et s’en approcher à 100 m', () => {
    let e: EtatPartie = { ...creerPartie(T0, mulberry32(1)), ameliorations: 10 }
    e = { ...e, fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Hubble' }) }
    let t = T0
    let arrive = false
    for (let s = 1; s <= 6 * 3600 && !arrive; s += 1) {
      t = T0 + s * 1000
      const r = avancerPartie(e, t, 1, mulberry32(s))
      e = r.etat
      arrive = r.arrivee !== null
    }
    expect(arrive).toBe(true)
    expect(e.fusee.orbite).toBe('Hubble')
    const o = e.fusee.ecartOrbite!
    expect(Math.hypot(o.x, o.y, o.z) * UA_KM).toBeCloseTo(APPROCHE_ENGIN_KM, 6)
    // Elle le suit ensuite.
    const r = avancerPartie(e, t + 60_000, 60, mulberry32(1))
    expect(km({ ...r.etat.fusee.position, z: 0 }, { ...positionAstre('Hubble', t + 60_000), z: 0 })).toBeLessThan(1)
  })
})
