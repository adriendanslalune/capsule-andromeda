import { describe, expect, it } from 'vitest'
import { feuilleDeRoute } from '../src/moteur/feuille-de-route'
import { Mission, planifier, type Plan } from '../src/moteur/mission'
import type { Contrat } from '../src/moteur/contrats'

const t0 = Date.UTC(2026, 9, 21, 20)

function plan(cible: string): Plan {
  const m = new Mission()
  const p = planifier(m.etatHeliocentrique(t0), cible, t0, 30)
  if (!p.possible) throw new Error('trajet impossible')
  m.partir(p.plan)
  return p.plan
}

describe('la feuille de route (demande d’Adrien du 21/10/2026)', () => {
  it('le départ retient d’où l’on part', () => {
    expect(plan('Lune').origine).toBe('Terre')
  })

  it('un trajet simple : départ et arrivée, la capsule au vrai pourcentage du trajet', () => {
    const p = plan('Lune')
    const avant = feuilleDeRoute(p, false, t0, null, 'Terre')
    expect(avant.points.map((x) => x.nom)).toEqual(['Terre', 'Lune'])
    expect(avant.points[1]).toMatchObject({ but: true, quand: p.arrivee })
    expect(avant.position).toBe(0)
    const milieu = feuilleDeRoute(p, true, (p.depart + p.arrivee) / 2)
    expect(milieu.points[0]).toMatchObject({ passe: true, quand: p.depart })
    expect(milieu.position).toBeCloseTo(0.5, 1)
    expect(feuilleDeRoute(p, true, p.arrivee + 1000).position).toBe(1)
  })

  it('un contrat : les étapes qui suivent s’ajoutent au bout ; la capsule avance sur le premier tronçon', () => {
    const p = plan('Lune')
    const contrat: Contrat = { id: 1, genre: 'livrer', recompense: 100, etapes: [{ lieu: 'Lune', action: 'charger' }, { lieu: 'ISS', action: 'livrer' }] }
    const f = feuilleDeRoute(p, true, (p.depart + p.arrivee) / 2, { contrat, etape: 0 })
    expect(f.points.map((x) => [x.nom, x.action])).toEqual([['Terre', undefined], ['Lune', 'charger'], ['ISS', 'livrer']])
    expect(f.position).toBeCloseTo(0.25, 1)
    // La deuxième étape (demande d'Adrien du 22/10/2026) : toute la route du contrat, la première étape faite.
    const p2 = plan('Lune')
    const suite = feuilleDeRoute(p2, true, (p2.depart + p2.arrivee) / 2, { contrat: { ...contrat, etapes: [{ lieu: 'ISS', action: 'harponner' }, { lieu: 'Lune', action: 'larguer' }] }, etape: 1 })
    // Rien que le contrat (Adrien, 22/10/2026) : pas d'où l'on venait avant lui.
    expect(suite.points.map((x) => [x.nom, x.passe])).toEqual([['ISS', true], ['Lune', false]])
    expect(suite.points[0].quand).toBe(p2.depart)
    expect(suite.position).toBeCloseTo(0.5, 1)
    // Un trajet qui ne mène pas à l'étape du contrat : seulement le départ et l'arrivée.
    expect(feuilleDeRoute(p, true, t0, { contrat: { ...contrat, etapes: [{ lieu: 'ISS', action: 'livrer' }] }, etape: 0 }).points).toHaveLength(2)
  })
})
