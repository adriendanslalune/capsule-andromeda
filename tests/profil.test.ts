import { describe, expect, it } from 'vitest'
import { Jeu } from '../src/moteur/jeu'
import { affinites, maisonPreferee, pseudoValide } from '../src/moteur/profil'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

describe('le Profil', () => {
  it('l’affinité : la part de chaque Maison dans les missions finies', () => {
    const jeu = new Jeu()
    expect(affinites(jeu)).toEqual({ nettoyeurs: 0, ingenieurs: 0, mercenaires: 0 })
    expect(maisonPreferee(jeu)).toBeNull()
    jeu.carnet.missions = { nettoyeurs: 6, ingenieurs: 3, mercenaires: 1 }
    expect(affinites(jeu)).toEqual({ nettoyeurs: 0.6, ingenieurs: 0.3, mercenaires: 0.1 })
    expect(maisonPreferee(jeu)).toBe('nettoyeurs')
    jeu.carnet.missions = { nettoyeurs: 2, ingenieurs: 2, mercenaires: 1 }
    expect(maisonPreferee(jeu)).toBeNull() // égalité
  })

  it('le pseudo : 3 à 16 caractères simples ; sauvegardé ; une nouvelle partie en tire un', () => {
    expect(pseudoValide('Adrien')).toBe(true)
    expect(pseudoValide('Zoé_42')).toBe(true)
    expect(pseudoValide('ab')).toBe(false)
    expect(pseudoValide('avec espace')).toBe(false)
    const jeu = new Jeu()
    jeu.nouvellePartie(1234)
    expect(pseudoValide(jeu.pseudo)).toBe(true)
    jeu.pseudo = 'Adrien'
    expect(restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, 0))))!.pseudo).toBe('Adrien')
  })
})
