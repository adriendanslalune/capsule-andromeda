import { describe, expect, it } from 'vitest'
import { position } from '../src/moteur/corps'
import { Mission, planifier } from '../src/moteur/mission'

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
