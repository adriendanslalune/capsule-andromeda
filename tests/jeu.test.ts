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

describe('acheter un meilleur moteur (barème validé le 17/10/2026)', () => {
  it('niveau 2 à 60 km/s pour 200 crédits, puis 3 (120 km/s, 1 500) et 4 (250 km/s, 4 000)', () => {
    const jeu = new Jeu()
    expect(jeu.moteurSuivant()).toMatchObject({ niveau: 2, vitesse: 60, prix: 200 })
    jeu.credits = 199
    expect(jeu.acheterMoteur()).toBe(false)
    expect(jeu.niveauMoteur).toBe(1)
    jeu.credits = 300
    expect(jeu.acheterMoteur()).toBe(true)
    expect(jeu.credits).toBe(100)
    expect(jeu.vitesse()).toBe(60)
    jeu.credits = 10_000
    expect(jeu.acheterMoteur() && jeu.acheterMoteur()).toBe(true)
    expect(jeu.vitesse()).toBe(250)
    expect(jeu.credits).toBe(10_000 - 1500 - 4000)
    expect(jeu.moteurSuivant()).toBeNull()
    expect(jeu.acheterMoteur()).toBe(false)
  })

  it('un meilleur moteur raccourcit les trajets', () => {
    const jeu = new Jeu()
    const duree = () => {
      const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Lune', t0, jeu.vitesse())
      if (!p.possible) throw new Error('impossible')
      return p.plan.arrivee - p.plan.depart
    }
    const avant = duree()
    jeu.credits = 200
    jeu.acheterMoteur()
    expect(duree()).toBeLessThan(avant * 0.6)
  })
})
