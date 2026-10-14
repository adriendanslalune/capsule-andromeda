import { describe, expect, it } from 'vitest'
import { positionCorps, rayonCorps } from '../src/astro/corps'
import { UA_KM } from '../src/astro/temps'
import {
  avancementTrajet,
  avancerFusee,
  capDeContournement,
  choisirDestination,
  creerFusee,
  direction,
  type EtatFusee,
  type Point2,
} from '../src/moteur/fusee'

const T0 = Date.UTC(2026, 9, 13, 12)
const RAYON_TERRE = rayonCorps('Terre')!

/** Distance (km) du point p au segment [a, b], dans le plan. */
function distanceAuSegment(p: Point2, a: Point2, b: Point2): number {
  const ab = { x: b.x - a.x, y: b.y - a.y }
  const k = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / (ab.x ** 2 + ab.y ** 2)))
  return Math.hypot(a.x + ab.x * k - p.x, a.y + ab.y * k - p.y) * UA_KM
}

/** Premier instant (après T0) où la ligne droite ISS → Lune passe à travers la Terre. */
function lunerDerriereLaTerre(): number {
  for (let t = T0; t < T0 + 30 * 86_400_000; t += 600_000) {
    const terre = positionCorps('Terre', t)
    if (distanceAuSegment(terre, positionCorps('ISS', t), positionCorps('Lune', t)) < RAYON_TERRE * 0.5) return t
  }
  throw new Error('aucune configuration trouvée')
}

/** Vole jusqu'à l'arrivée et renvoie la plus petite distance (km, en 3D) au centre de la Terre. */
function voler(f: EtatFusee, t: number, dt: number, v = 30): { approche: number; arrivee: boolean } {
  let approche = Infinity
  for (let n = 0; n < 200_000; n++) {
    t += dt * 1000
    const r = avancerFusee(f, t, dt, v)
    f = r.fusee
    if (!f.orbite) {
      const terre = positionCorps('Terre', t)
      const d = Math.hypot((f.position.x - terre.x) * UA_KM, (f.position.y - terre.y) * UA_KM, ((f.z ?? 0) - terre.z) * UA_KM)
      approche = Math.min(approche, d)
    }
    if (r.arrivee) return { approche, arrivee: true }
  }
  return { approche, arrivee: false }
}

describe('Contournement des astres', () => {
  it('cap : tout droit si la route est libre, tangente à l’astre sinon', () => {
    const astre = { nom: 'X', centre: { x: 5, y: 0 }, rayon: 1 }
    expect(capDeContournement({ x: 0, y: 0 }, { x: 10, y: 10 }, [astre])).toBeCloseTo(45, 6)
    const cap = capDeContournement({ x: 0, y: 0 }, { x: 10, y: 0.1 }, [astre])
    expect(cap).toBeCloseTo((Math.asin(1 / 5) * 180) / Math.PI, 6) // tangente, du côté de la cible
    // Cible avant l'astre : rien à contourner.
    expect(capDeContournement({ x: 0, y: 0 }, { x: 2, y: 0 }, [astre])).toBeCloseTo(0, 6)
    // Dans la marge : jamais vers le centre.
    const dedans = capDeContournement({ x: 4.5, y: 0 }, { x: 10, y: 0.1 }, [astre])
    expect(Math.abs(((dedans - direction({ x: 4.5, y: 0 }, astre.centre) + 540) % 360) - 180)).toBeGreaterThanOrEqual(90 - 1e-6)
  })

  it('de l’ISS vers la Lune cachée derrière la Terre : la fusée contourne la Terre', () => {
    const t = lunerDerriereLaTerre()
    const f = choisirDestination({ ...creerFusee(t), position: { ...creerFusee(t).position } }, { type: 'astre', astre: 'Lune' })
    const r = voler(f, t, 1)
    expect(r.arrivee).toBe(true)
    expect(r.approche).toBeGreaterThan(RAYON_TERRE)
  }, 60_000)

  it('même chose en rattrapage hors ligne (pas de 10 min)', () => {
    const t = lunerDerriereLaTerre()
    const r = voler(choisirDestination(creerFusee(t), { type: 'astre', astre: 'Lune' }), t, 600)
    expect(r.arrivee).toBe(true)
    expect(r.approche).toBeGreaterThan(RAYON_TERRE)
  })

  it('au départ de la Lune vers l’ISS, la fusée ne traverse ni la Lune ni la Terre', () => {
    const t = lunerDerriereLaTerre()
    const lune = positionCorps('Lune', t)
    const f: EtatFusee = { ...creerFusee(t), position: { x: lune.x, y: lune.y }, orbite: 'Lune', destination: { type: 'astre', astre: 'ISS' } }
    let g = f
    let tt = t
    let approcheLune = Infinity
    for (let n = 0; n < 200; n++) {
      tt += 1000
      g = avancerFusee(g, tt, 1, 30).fusee
      const l = positionCorps('Lune', tt)
      approcheLune = Math.min(approcheLune, Math.hypot(g.position.x - l.x, g.position.y - l.y) * UA_KM)
    }
    expect(approcheLune).toBeGreaterThan(rayonCorps('Lune')!)
    expect(voler(f, t, 5).approche).toBeGreaterThan(RAYON_TERRE)
  }, 60_000)
})

describe('Vers les engins qui frôlent la Terre', () => {
  it('de la Lune vers l’ISS, Hubble ou Tiangong, à toute heure : jamais à travers la Terre (en 3D)', () => {
    const pires: string[] = []
    for (let h = 0; h < 48; h += 9) {
      for (const cible of ['ISS', 'Hubble', 'Tiangong']) {
        const t0 = Date.UTC(2026, 9, 14) + h * 3_600_000
        const lune = positionCorps('Lune', t0)
        let f: EtatFusee = { ...creerFusee(t0), position: { x: lune.x, y: lune.y }, orbite: 'Lune', destination: { type: 'astre', astre: cible } }
        let t = t0, mini = Infinity, arrive = false
        for (let n = 0; n < 40000 && !arrive; n++) {
          t += 2000
          const r = avancerFusee(f, t, 2, 30)
          f = r.fusee
          arrive = r.arrivee !== null
          if (!f.orbite) {
            const e = positionCorps('Terre', t)
            mini = Math.min(mini, Math.hypot((f.position.x - e.x) * UA_KM, (f.position.y - e.y) * UA_KM, ((f.z ?? 0) - e.z) * UA_KM))
          }
        }
        if (mini < RAYON_TERRE || !arrive) pires.push(`${h} h, ${cible} : ${Math.round(mini)} km${arrive ? '' : ', pas arrivée'}`)
      }
    }
    expect(pires).toEqual([])
  }, 120_000)
})

describe('Trajet en cours (frise du cockpit)', () => {
  it('retient l’astre quitté et l’heure du départ ; l’avancement va de 0 à 1 ; effacé à l’arrivée', () => {
    let f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Lune' })
    let t = T0
    const avancements: number[] = []
    let arrivee = false
    for (let n = 0; n < 20_000 && !arrivee; n++) {
      t += 10_000
      const r = avancerFusee(f, t, 10, 30)
      f = r.fusee
      arrivee = r.arrivee !== null
      if (n === 0) {
        expect(f.trajet?.origine).toBe('ISS')
        expect(f.trajet?.depart).toBe(T0)
      }
      const a = avancementTrajet(f, t)
      if (a !== null) avancements.push(a)
    }
    expect(arrivee).toBe(true)
    expect(f.trajet).toBeUndefined()
    expect(avancements[0]).toBeLessThan(0.01)
    expect(avancements.at(-1)!).toBeGreaterThan(0.95)
    // Toujours croissant (à un pouième près : la Lune bouge).
    for (let i = 1; i < avancements.length; i++) expect(avancements[i]).toBeGreaterThanOrEqual(avancements[i - 1] - 0.002)
  })
})

describe('Orbite : la fusée reste là où elle est arrivée', () => {
  it('arrivée vers la Lune : elle garde sa distance (trois rayons, ≈ 5 200 km), et repart de là', () => {
    let f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Lune' })
    let t = T0
    let arrivee = false
    while (!arrivee) { t += 10_000; const r = avancerFusee(f, t, 10, 30); f = r.fusee; arrivee = r.arrivee !== null }
    expect(f.orbite).toBe('Lune')
    const ecartKm = Math.hypot(f.ecartOrbite!.x, f.ecartOrbite!.y) * UA_KM
    expect(ecartKm).toBeGreaterThan(4_500)
    expect(ecartKm).toBeLessThanOrEqual(3 * 1737.4 * 1.001)
    // Une heure plus tard, départ vers l'ISS : le premier pas part de cet endroit, pas du centre de la Lune.
    t += 3_600_000
    f = avancerFusee(f, t, 0.001, 30).fusee
    f = choisirDestination(f, { type: 'astre', astre: 'ISS' })
    const lune = positionCorps('Lune', t + 1000)
    const r = avancerFusee(f, t + 1000, 1, 30)
    const d = Math.hypot(r.fusee.position.x - lune.x, r.fusee.position.y - lune.y) * UA_KM
    expect(Math.abs(d - ecartKm)).toBeLessThan(100)
  }, 60_000)
})
