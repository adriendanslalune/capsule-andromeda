import { describe, expect, it } from 'vitest'
import { MAISONS, maisonDuContrat, type Maison } from '../src/donnees/maisons'
import { Jeu } from '../src/moteur/jeu'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'
import { tirerContrat } from '../src/moteur/contrats'

describe('les missions et leur Maison', () => {
  it('chaque genre de mission appartient à une Maison, et toutes les Maisons ont des missions', () => {
    const vues = new Set<string>()
    let graine = 7
    for (let k = 1; k <= 60; k++) {
      const r = tirerContrat(k, graine, Date.UTC(2026, 9, 18), [])
      graine = r.graine
      vues.add(maisonDuContrat(r.contrat))
    }
    expect([...vues].sort()).toEqual(MAISONS.map((m) => m.maison).sort())
  })

  const compter = (jeu: Jeu) => {
    const n: Record<string, number> = { nettoyeurs: 0, commercants: 0, mercenaires: 0 }
    for (const c of jeu.proposes) n[maisonDuContrat(c)]++
    return n
  }
  const t0 = Date.UTC(2026, 9, 18, 12)

  it('joueur neutre : 6 missions, 2 par Maison', () => {
    const jeu = new Jeu()
    jeu.avancer(t0)
    expect(jeu.proposes).toHaveLength(6)
    expect(compter(jeu)).toEqual({ nettoyeurs: 2, commercants: 2, mercenaires: 2 })
  })

  it('joueur d’une Maison : 4 de sa Maison, 1 de chacune des autres ; une mission prise est remplacée par la même Maison', () => {
    const jeu = new Jeu()
    jeu.maison = 'mercenaires'
    jeu.avancer(t0)
    expect(compter(jeu)).toEqual({ nettoyeurs: 1, commercants: 1, mercenaires: 4 })
    const n = jeu.proposes.find((c) => maisonDuContrat(c) === 'nettoyeurs')!
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
