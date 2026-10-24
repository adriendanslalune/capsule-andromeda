import { describe, expect, it } from 'vitest'
import { TROPHEES } from '../src/donnees/trophees'
import { CONDITIONS, suivreTrophees } from '../src/moteur/trophees'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 24, 12)
const JOUR = 86_400_000

describe('les trophées (liste validée par Adrien le 24/10/2026)', () => {
  it('150 trophées, numérotés de 1 à 150, un quart secrets, chacun avec sa condition', () => {
    expect(TROPHEES.length).toBe(150)
    expect(TROPHEES.map((x) => x.n)).toEqual(Array.from({ length: 150 }, (_, k) => k + 1))
    expect(TROPHEES.filter((x) => x.secret).length).toBe(38)
    for (const x of TROPHEES) expect(CONDITIONS[x.n], `trophée ${x.n}`).toBeTypeOf('function')
  })

  it('une partie neuve n’a aucun trophée (pas même l’anniversaire ou le nom de capitaine)', () => {
    const jeu = new Jeu()
    jeu.nouvellePartie(42, t0)
    expect(suivreTrophees(jeu, t0)).toEqual([])
  })

  it('un trophée se gagne une seule fois, avec sa date, et attend d’être annoncé', () => {
    const jeu = new Jeu()
    jeu.nouvellePartie(42, t0)
    suivreTrophees(jeu, t0)
    jeu.pseudo = 'Adrien'
    expect(suivreTrophees(jeu, t0 + 1000)).toEqual([140])
    expect(jeu.trophees[140]).toBe(t0 + 1000)
    expect(jeu.tropheesAAnnoncer).toEqual([140])
    expect(suivreTrophees(jeu, t0 + 2000)).toEqual([])
  })

  it('le premier trajet fini : « Premier tour de manège »', () => {
    const jeu = new Jeu()
    jeu.nouvellePartie(42, t0)
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'ISS', t0, jeu.vitesse())
    if (!p.possible) throw new Error('ISS impossible')
    jeu.mission.partir(p.plan)
    jeu.avancer(p.plan.arrivee + 1000)
    expect(jeu.stats.n.trajets).toBe(1)
    expect(1 in jeu.trophees).toBe(true)
  })

  it('les jours de suite : 7 jours d’affilée, pas un de plus si on saute un jour', () => {
    const jeu = new Jeu()
    jeu.nouvellePartie(42, t0)
    for (let k = 0; k < 7; k++) suivreTrophees(jeu, t0 + k * JOUR)
    expect(jeu.stats.jours.suite).toBe(7)
    expect(136 in jeu.trophees).toBe(true)
    suivreTrophees(jeu, t0 + 9 * JOUR)
    expect(jeu.stats.jours.suite).toBe(1)
  })

  it('l’anniversaire de la capsule : un an plus tard, le même jour', () => {
    const jeu = new Jeu()
    jeu.nouvellePartie(42, t0)
    suivreTrophees(jeu, t0)
    expect(138 in jeu.trophees).toBe(false)
    suivreTrophees(jeu, Date.UTC(2027, 9, 24, 12))
    expect(138 in jeu.trophees).toBe(true)
  })

  it('un combat gagné sans être touché, sur un fil, sans bombe', () => {
    const jeu = new Jeu()
    jeu.noterCombat('victoire', { degatsRecus: 0, coque: 1, bombes: 3, equipement: { bombes: 3 } })
    suivreTrophees(jeu, t0)
    expect([60, 63].every((n) => n in jeu.trophees)).toBe(true)
    expect(jeu.stats.n.victoiresSansBombe).toBe(1)
  })

  it('les trophées et leurs compteurs passent la sauvegarde', () => {
    const jeu = new Jeu()
    jeu.nouvellePartie(42, t0)
    jeu.noter('chasseurs', 5)
    jeu.ajouterStat('dossiers', 'Luna 2')
    suivreTrophees(jeu, t0)
    const relu = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(relu.trophees).toEqual(jeu.trophees)
    expect(relu.stats.n.chasseurs).toBe(5)
    expect(relu.stats.ens.dossiers).toEqual(['Luna 2'])
    expect(relu.stats.naissance).toBe(t0)
  })
})
