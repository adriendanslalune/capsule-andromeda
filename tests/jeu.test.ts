import { describe, expect, it } from 'vitest'
import { lignesDuBandeau } from '../src/moteur/bandeau'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 17, 12)

describe('état du jeu au départ (décision d’Adrien du 17/10/2026)', () => {
  it('0 crédit, moteur niveau 1 à 30 km/s, en orbite basse autour de la Terre', () => {
    const jeu = new Jeu()
    expect(jeu.credits).toBe(0)
    expect(jeu.niveauMoteur).toBe(1)
    expect(jeu.vitesse()).toBe(30)
    expect(lignesDuBandeau(jeu, t0)[0]).toMatchObject({ genre: 'orbite', centre: 'Terre' })
  })

  it('le moteur fixe la durée des trajets : la Lune en quelques heures', () => {
    const jeu = new Jeu()
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Lune', t0, jeu.vitesse())
    if (!p.possible) throw new Error('impossible')
    const heures = (p.plan.arrivee - p.plan.depart) / 3_600_000
    expect(heures).toBeGreaterThan(3)
    expect(heures).toBeLessThan(6)
  })
})
