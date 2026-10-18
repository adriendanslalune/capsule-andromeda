import { describe, expect, it } from 'vitest'
import { MAISONS, maisonDuContrat } from '../src/donnees/maisons'
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
})
