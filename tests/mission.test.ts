import { describe, expect, it } from 'vitest'
import { position } from '../src/moteur/corps'
import { Mission, planifier, traceTrajet } from '../src/moteur/mission'
import { corps } from '../src/moteur/corps'

const t0 = Date.UTC(2026, 9, 17, 12)
const JOUR = 86_400_000
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

describe('planification du trajet', () => {
  it('vers Mars : plus les moteurs sont puissants, plus le trajet est court, et le coût tient dans le budget', () => {
    const m = new Mission()
    const depart = m.etatHeliocentrique(t0)
    let precedente = Infinity
    for (const budget of [20, 40, 80, 160]) {
      const p = planifier(depart, 'Mars', t0, budget)
      expect(p.possible, `budget ${budget}`).toBe(true)
      if (!p.possible) continue
      const duree = (p.plan.arrivee - p.plan.depart) / JOUR
      expect(duree).toBeLessThan(precedente)
      expect(p.plan.dvDepart + p.plan.dvArrivee).toBeLessThanOrEqual(budget * 1.0001)
      precedente = duree
    }
  })

  it('avec des moteurs trop faibles, le trajet est hors de portée et on dit combien il faudrait', () => {
    const p = planifier(new Mission().etatHeliocentrique(t0), 'Neptune', t0, 1)
    expect(p.possible).toBe(false)
    if (!p.possible) expect(p.dvMinimum).toBeGreaterThan(1)
  })
})

describe('règle d’or : rien ne traverse un astre (17/10/2026)', () => {
  it('vers Hubble, à toute heure : le trajet ne passe jamais dans la Terre', () => {
    const pires: string[] = []
    const rTerre = corps('Terre')!.rayon
    for (let h = 0; h < 24; h += 1.5) {
      const t = t0 + h * 3_600_000
      const p = planifier(new Mission().etatHeliocentrique(t), 'Hubble', t, 120)
      if (!p.possible) { pires.push(`${h} h : impossible`); continue }
      const mini = Math.min(...traceTrajet(p.plan, 400).map((q) => distance(q.r, position('Terre', q.t)) - rTerre))
      const minutes = (p.plan.arrivee - p.plan.depart) / 60_000
      if (mini < 100) pires.push(`${h} h : ${Math.round(mini)} km d’altitude`)
      // Un trajet autour de la Terre (sous sa gravité) : quelques dizaines de minutes, pas des jours.
      if (minutes > 120) pires.push(`${h} h : ${Math.round(minutes)} min de trajet`)
    }
    expect(pires).toEqual([])
  }, 60_000)
})

describe('le trajet', () => {
  it('la capsule arrive bien sur la cible (Mars), puis tourne autour', () => {
    const m = new Mission()
    const p = planifier(m.etatHeliocentrique(t0), 'Mars', t0, 40)
    if (!p.possible) throw new Error('trajet impossible')
    m.partir(p.plan)
    const milieu = (p.plan.depart + p.plan.arrivee) / 2
    expect(m.phase(milieu)).toBe('trajet')
    // Juste avant l'arrivée, la capsule est au point de rendez-vous, là où est Mars à cet instant.
    const fin = p.plan.arrivee - 1
    expect(distance(m.etat(fin).position, position('Mars', fin))).toBeLessThan(100)
    expect(distance(p.plan.rendezVous, position('Mars', p.plan.arrivee))).toBeLessThan(1)
    // Ensuite, en orbite basse autour de Mars, et elle y reste.
    for (const apres of [3_600_000, 10 * JOUR]) {
      const t = p.plan.arrivee + apres
      expect(m.phase(t)).toBe('orbite')
      const d = distance(m.etat(t).position, position('Mars', t))
      expect(d).toBeGreaterThan(3390)
      expect(d).toBeLessThan(5000)
    }
  })

  it('vers la Lune et vers l’ISS aussi (petits sauts)', () => {
    for (const cible of ['Lune', 'ISS']) {
      const m = new Mission()
      const p = planifier(m.etatHeliocentrique(t0), cible, t0, 40)
      if (!p.possible) throw new Error(`${cible} impossible`)
      m.partir(p.plan)
      const fin = p.plan.arrivee - 1
      expect(distance(m.etat(fin).position, position(cible, fin)), cible).toBeLessThan(5)
    }
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
    }
  })
})

describe('durées selon la puissance (pour choisir le réglage)', () => {
  it('tableau', () => {
    const m = new Mission()
    const depart = m.etatHeliocentrique(t0)
    const lignes: string[] = []
    for (const cible of ['Lune', 'Vénus', 'Mars', 'Jupiter', 'Saturne', 'Neptune', 'Pluton']) {
      const cases: string[] = []
      for (const budget of [6, 15, 30, 60, 120, 300]) {
        const p = planifier(depart, cible, t0, budget)
        if (!p.possible) { cases.push('—'); continue }
        const j = (p.plan.arrivee - p.plan.depart) / JOUR
        cases.push(j < 2 ? `${(j * 24).toFixed(1)} h` : j < 365 ? `${j.toFixed(0)} j` : `${(j / 365.25).toFixed(1)} ans`)
      }
      lignes.push(`${cible.padEnd(8)} ${cases.map((c) => c.padStart(9)).join('')}`)
    }
    console.log(`budget   ${[6, 15, 30, 60, 120, 300].map((b) => `${b} km/s`.padStart(9)).join('')}\n${lignes.join('\n')}`)
  }, 60_000)
})
