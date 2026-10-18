import { describe, expect, it } from 'vitest'
import { DUREE_ACTION } from '../src/donnees/contrats'
import { TABLEAUX } from '../src/donnees/tableaux'

const CONTRATS_PROPOSES = TABLEAUX.reduce((s, x) => s + x.nombre, 0)
import type { Contrat } from '../src/moteur/contrats'
import { Jeu } from '../src/moteur/jeu'
import { planifier, type Plan } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 18, 12)

function allerA(jeu: Jeu, lieu: string, t: number): number {
  const p = planifier(jeu.mission.etatHeliocentrique(t), lieu, t, jeu.vitesse())
  if (!p.possible) throw new Error(`${lieu} impossible`)
  jeu.mission.partir(p.plan)
  return p.plan.arrivee
}

describe('modules en panne et leurs effets (décisions d’Adrien du 18/10/2026)', () => {
  it('moteur : vitesse divisée par 2 ; réparé, elle revient', () => {
    const jeu = new Jeu()
    jeu.casser('moteur')
    expect(jeu.vitesse()).toBe(15)
    jeu.reparer('moteur')
    expect(jeu.vitesse()).toBe(30)
  })

  it('communications : plus de nouvelles missions (celles proposées restent)', () => {
    const jeu = new Jeu()
    jeu.avancer(t0)
    jeu.casser('communications')
    jeu.accepter(jeu.proposes[0].id, t0)
    expect(jeu.proposes).toHaveLength(CONTRATS_PROPOSES - 1)
    jeu.reparer('communications')
    jeu.avancer(t0)
    expect(jeu.proposes).toHaveLength(CONTRATS_PROPOSES)
  })

  it('énergie : une action sur place dure deux fois plus longtemps', () => {
    const c: Contrat = { id: 9, genre: 'depanner', etapes: [{ lieu: 'ISS', action: 'reparer' }], recompense: 50 }
    const jeu = new Jeu()
    jeu.proposes = [c]
    jeu.accepter(9, t0)
    const t = allerA(jeu, 'ISS', t0) + 1000
    jeu.casser('energie')
    jeu.agir(t)
    expect(jeu.finAction()).toBe(t + 2 * DUREE_ACTION)
    jeu.reparer('energie') // réparer pendant l'action ne la raccourcit pas
    expect(jeu.avancer(t + DUREE_ACTION + 1000, 30).map((e) => e.genre)).toEqual([])
    expect(jeu.avancer(t + 2 * DUREE_ACTION, 30).map((e) => e.genre)).toContain('contrat-fini')
  })

  it('navigation : les étapes ne s’enchaînent plus (la capsule reste sur place)', () => {
    const c: Contrat = { id: 8, genre: 'livrer', etapes: [{ lieu: 'ISS', action: 'charger' }, { lieu: 'Hubble', action: 'livrer' }], recompense: 70 }
    const jeu = new Jeu()
    jeu.proposes = [c]
    jeu.accepter(8, t0)
    const t = allerA(jeu, 'ISS', t0) + 1000
    jeu.agir(t)
    jeu.casser('navigation')
    expect(jeu.peutNaviguer()).toBe(false)
    expect(jeu.avancer(t + DUREE_ACTION, 30).map((e) => e.genre)).toEqual(['etape-finie'])
    expect(jeu.mission.plan?.cible).toBe('ISS')
  })
})

describe('usure', () => {
  /** Un trajet (factice) arrivé à l'instant a. */
  const trajetArriveA = (jeu: Jeu, a: number) => { jeu.mission.plan = { depart: a - 1000, arrivee: a, cible: 'ISS' } as Plan }

  it('environ une panne tous les 10 trajets, tirée une seule fois par trajet', () => {
    const jeu = new Jeu()
    let pannes = 0
    for (let k = 1; k <= 400; k++) {
      trajetArriveA(jeu, t0 + k * 60_000)
      const ev = [...jeu.avancer(t0 + k * 60_000), ...jeu.avancer(t0 + k * 60_000 + 5000)]
      const p = ev.filter((e) => e.genre === 'panne')
      expect(p.length).toBeLessThanOrEqual(1)
      pannes += p.length
      jeu.pannes = []
    }
    expect(pannes).toBeGreaterThan(20)
    expect(pannes).toBeLessThan(65)
  })

  it('pas de panne tant que le trajet n’est pas arrivé', () => {
    const jeu = new Jeu()
    for (let k = 1; k <= 100; k++) {
      trajetArriveA(jeu, t0 + 10 ** 9 + k)
      expect(jeu.avancer(t0).filter((e) => e.genre === 'panne')).toEqual([])
    }
  })
})
