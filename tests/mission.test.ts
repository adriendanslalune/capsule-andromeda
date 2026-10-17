import { describe, expect, it } from 'vitest'
import { corps, position } from '../src/moteur/corps'
import { avancement, etatSurTrajet, Mission, planifier, positionsDesPoints, securite, vitesseAstre, type Plan } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 17, 12)
const JOUR = 86_400_000
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

/** Plus petite marge (km) au-dessus du rayon de sécurité des astres donnés, le long du trajet de la capsule. */
function margeMinimale(p: Plan, astres: string[]): number {
  let mini = Infinity
  for (let k = 0; k <= 400; k++) {
    const t = p.depart + ((p.arrivee - p.depart) * k) / 400
    const r = etatSurTrajet(p, t).r
    for (const a of astres) mini = Math.min(mini, distance(r, position(a, t)) - securite(a))
  }
  return mini
}

describe('le trajet en ligne droite (choix d’Adrien, 17/10/2026)', () => {
  it('vers Mars : plus les moteurs sont puissants, plus le trajet est court', () => {
    const depart = new Mission().etatHeliocentrique(t0)
    let precedente = Infinity
    for (const vitesse of [20, 40, 80, 160]) {
      const p = planifier(depart, 'Mars', t0, vitesse)
      if (!p.possible) throw new Error(`${vitesse} km/s : impossible`)
      const duree = (p.plan.arrivee - p.plan.depart) / JOUR
      expect(duree).toBeLessThan(precedente)
      // De l'ordre de la distance du rendez-vous divisée par la vitesse : un peu plus (accélérer, freiner), ou un peu
      // moins (au départ, la capsule est emportée par la Terre dans sa course autour du Soleil).
      const direct = distance(depart.r, p.plan.rendezVous) / vitesse / 86_400
      expect(duree / direct).toBeGreaterThan(0.6)
      expect(duree / direct).toBeLessThan(1.3)
      precedente = duree
    }
  })

  it('vitesse constante en croisière, accélération au départ, freinage à l’arrivée', () => {
    const p = planifier(new Mission().etatHeliocentrique(t0), 'Lune', t0, 50)
    if (!p.possible) throw new Error('impossible')
    const relative = (f: number) => {
      const t = p.plan.depart + f * (p.plan.arrivee - p.plan.depart)
      const v = etatSurTrajet(p.plan, t).v, vt = vitesseAstre('Terre', t)
      return Math.hypot(v.x - vt.x, v.y - vt.y, v.z - vt.z)
    }
    for (const f of [0.2, 0.4, 0.6, 0.8]) expect(relative(f) / 50).toBeCloseTo(1, 1)
    expect(relative(0.02)).toBeLessThan(15)
    expect(relative(0.98)).toBeLessThan(15)
    expect(avancement(p.plan, p.plan.depart)).toBe(0)
    expect(avancement(p.plan, p.plan.arrivee)).toBe(1)
  })

  it('la capsule arrive bien sur la cible (Mars), puis tourne autour', () => {
    const m = new Mission()
    const p = planifier(m.etatHeliocentrique(t0), 'Mars', t0, 40)
    if (!p.possible) throw new Error('trajet impossible')
    m.partir(p.plan)
    expect(m.phase((p.plan.depart + p.plan.arrivee) / 2)).toBe('trajet')
    // Juste avant l'arrivée, la capsule est sur son orbite d'attente, autour de Mars au point de rendez-vous.
    const fin = p.plan.arrivee - 1
    expect(distance(m.etat(fin).position, position('Mars', fin))).toBeLessThan(5000)
    expect(distance(p.plan.rendezVous, position('Mars', p.plan.arrivee))).toBeLessThan(1)
    for (const apres of [3_600_000, 10 * JOUR]) {
      const t = p.plan.arrivee + apres
      expect(m.phase(t)).toBe('orbite')
      const d = distance(m.etat(t).position, position('Mars', t))
      expect(d).toBeGreaterThan(3390)
      expect(d).toBeLessThan(5000)
    }
  })

  it('avec des moteurs trop lents, une sonde qui s’enfuit est hors de portée', () => {
    expect(planifier(new Mission().etatHeliocentrique(t0), 'Voyager 1', t0, 5).possible).toBe(false)
    expect(planifier(new Mission().etatHeliocentrique(t0), 'Voyager 1', t0, 50).possible).toBe(true)
  })

  it('vers la Lune et vers l’ISS aussi (petits sauts)', () => {
    for (const cible of ['Lune', 'ISS']) {
      const m = new Mission()
      const p = planifier(m.etatHeliocentrique(t0), cible, t0, 40)
      if (!p.possible) throw new Error(`${cible} impossible`)
      m.partir(p.plan)
      const fin = p.plan.arrivee - 1
      expect(distance(m.etat(fin).position, position(cible, fin)), cible).toBeLessThan(3000)
    }
  })
})

describe('règle d’or : rien ne traverse un astre (17/10/2026)', () => {
  it('depuis l’orbite basse, à toute heure, vers Hubble, la Lune, GOES-19, Mars et Jupiter', () => {
    const pires: string[] = []
    for (let h = 0; h < 24; h += 1.5) {
      const t = t0 + h * 3_600_000
      for (const cible of ['Hubble', 'Lune', 'GOES-19', 'Mars', 'Jupiter']) {
        const p = planifier(new Mission().etatHeliocentrique(t), cible, t, 120)
        if (!p.possible) { pires.push(`${h} h, ${cible} : impossible`); continue }
        const marge = margeMinimale(p.plan, ['Soleil', 'Terre'])
        if (marge < 0) pires.push(`${h} h, ${cible} : ${Math.round(marge)} km`)
      }
    }
    expect(pires).toEqual([])
  }, 60_000)

  it('de l’autre côté du Soleil, on le contourne', () => {
    // Saturne, presque à l'opposé de la Terre par rapport au Soleil en octobre 2026.
    const p = planifier(new Mission().etatHeliocentrique(t0), 'Saturne', t0, 120)
    if (!p.possible) throw new Error('impossible')
    expect(margeMinimale(p.plan, ['Soleil'])).toBeGreaterThan(0)
    expect(positionsDesPoints(p.plan.points, t0).length).toBeGreaterThanOrEqual(3)
  })
})

describe('la sélection de satellites de la Terre', () => {
  const SELECTION = ['Chandra', 'Fermi', 'Swift', 'TESS', 'Terra', 'Landsat 9', 'Sentinel-2B', 'GOES-19', 'Meteosat-12',
    'Himawari-9', 'GPS III-1', 'Galileo 101', 'Vanguard 1', 'Envisat']

  it('chacun est une destination atteignable, et la capsule arrive bien dessus', () => {
    for (const cible of SELECTION) {
      expect(corps(cible)?.type, cible).toBe('satellite')
      const m = new Mission()
      const p = planifier(m.etatHeliocentrique(t0), cible, t0, 120)
      if (!p.possible) throw new Error(`${cible} impossible`)
      m.partir(p.plan)
      const fin = p.plan.arrivee - 1
      expect(distance(m.etat(fin).position, position(cible, fin)), cible).toBeLessThan(5)
      expect(margeMinimale(p.plan, ['Terre']), cible).toBeGreaterThan(0)
    }
  })
})

describe('durées selon la puissance (pour choisir le réglage)', () => {
  it('tableau', () => {
    const depart = new Mission().etatHeliocentrique(t0)
    const vitesses = [6, 15, 30, 60, 120, 300]
    const lignes: string[] = []
    for (const cible of ['ISS', 'GOES-19', 'Lune', 'Vénus', 'Mars', 'Jupiter', 'Saturne', 'Neptune', 'Pluton']) {
      const cases: string[] = []
      for (const vitesse of vitesses) {
        const p = planifier(depart, cible, t0, vitesse)
        if (!p.possible) { cases.push('—'); continue }
        const j = (p.plan.arrivee - p.plan.depart) / JOUR
        cases.push(j < 1 / 24 ? `${(j * 1440).toFixed(0)} min` : j < 2 ? `${(j * 24).toFixed(1)} h` : j < 365 ? `${j.toFixed(0)} j` : `${(j / 365.25).toFixed(1)} ans`)
      }
      lignes.push(`${cible.padEnd(8)} ${cases.map((c) => c.padStart(9)).join('')}`)
    }
    console.log(`vitesse  ${vitesses.map((b) => `${b} km/s`.padStart(9)).join('')}\n${lignes.join('\n')}`)
  }, 60_000)
})
