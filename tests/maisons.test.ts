import { describe, expect, it } from 'vitest'
import { MAISONS, maisonDuContrat, type Maison } from '../src/donnees/maisons'
import { Jeu } from '../src/moteur/jeu'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

describe('les missions et leur Maison', () => {
  it('chaque genre de mission appartient à une Maison, et toutes les Maisons ont des missions', () => {
    const jeu = new Jeu()
    jeu.avancer(Date.UTC(2026, 9, 18, 12))
    expect([...new Set(jeu.proposes.map(maisonDuContrat))].sort()).toEqual(MAISONS.map((m) => m.maison).sort())
  })

  /** Les missions de chaque Maison sur un tableau (par défaut, celui de la Terre). */
  const compter = (jeu: Jeu, lieu = 'Terre') => {
    const n: Record<string, number> = { nettoyeurs: 0, commercants: 0, mercenaires: 0 }
    for (const c of jeu.proposes.filter((x) => x.tableau === lieu)) n[maisonDuContrat(c)]++
    return n
  }
  const t0 = Date.UTC(2026, 9, 18, 12)

  it('joueur neutre : sur une planète 6 missions, 2 par Maison ; sur une lune 4, une par Maison et une de plus', () => {
    const jeu = new Jeu()
    jeu.avancer(t0)
    expect(compter(jeu)).toEqual({ nettoyeurs: 2, commercants: 2, mercenaires: 2 })
    expect(Object.values(compter(jeu, 'Titan')).sort()).toEqual([1, 1, 2])
  })

  it('joueur d’une Maison : 4 de sa Maison, 1 de chacune des autres ; une mission prise est remplacée par la même Maison', () => {
    const jeu = new Jeu()
    jeu.maison = 'mercenaires'
    jeu.avancer(t0)
    expect(compter(jeu)).toEqual({ nettoyeurs: 1, commercants: 1, mercenaires: 4 })
    expect(compter(jeu, 'Titan')).toEqual({ nettoyeurs: 1, commercants: 1, mercenaires: 2 })
    const n = jeu.proposes.find((c) => c.tableau === 'Terre' && maisonDuContrat(c) === 'nettoyeurs')!
    jeu.accepter(n.id, t0)
    expect(compter(jeu)).toEqual({ nettoyeurs: 1, commercants: 1, mercenaires: 4 })
  })

  it('changer de Maison (ou redevenir neutre) : les missions se complètent au fil des missions prises', () => {
    const jeu = new Jeu()
    jeu.avancer(t0)
    jeu.maison = 'nettoyeurs'
    jeu.avancer(t0)
    expect(compter(jeu).nettoyeurs).toBe(4)
  })

  it('la Maison du joueur est sauvegardée', () => {
    const jeu = new Jeu()
    jeu.maison = 'commercants' as Maison
    expect(restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!.maison).toBe('commercants')
    const mauvaise = JSON.parse(JSON.stringify(sauvegarder(jeu, t0)))
    mauvaise.maison = 'pirates'
    expect(restaurer(mauvaise)).toBeNull()
  })
})
