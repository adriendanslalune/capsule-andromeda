import { describe, expect, it } from 'vitest'
import { INTERRUPTEURS_DEPART } from '../src/donnees/fusee'
import { creerPartie, VERSION_FORMAT } from '../src/moteur/etat'
import { mulberry32 } from '../src/moteur/hasard'
import { basculer, estBas, position } from '../src/moteur/interrupteurs'
import { estSerieValide } from '../src/moteur/serie'

const T0 = Date.UTC(2026, 9, 13, 12, 0, 0)

describe('interrupteurs S-1 à S-4', () => {
  it('au départ : haut, haut, bas, haut', () => {
    expect(INTERRUPTEURS_DEPART).toEqual(['haut', 'haut', 'bas', 'haut'])
    expect(estBas(INTERRUPTEURS_DEPART, 1)).toBe(false)
    expect(estBas(INTERRUPTEURS_DEPART, 3)).toBe(true)
  })

  it('basculer change seulement l’interrupteur visé, sans modifier l’original', () => {
    const apres = basculer(INTERRUPTEURS_DEPART, 1)
    expect(apres).toEqual(['bas', 'haut', 'bas', 'haut'])
    expect(INTERRUPTEURS_DEPART).toEqual(['haut', 'haut', 'bas', 'haut'])
    expect(position(basculer(apres, 1), 1)).toBe('haut')
  })
})

describe('nouvelle partie', () => {
  it('démarre avec les valeurs de départ', () => {
    const etat = creerPartie(T0, mulberry32(1))
    expect(etat.version).toBe(VERSION_FORMAT)
    expect(etat.creeLe).toBe(T0)
    expect(etat.vu).toBe(T0)
    expect(estSerieValide(etat.serie)).toBe(true)
    expect(etat.interrupteurs).toEqual(['haut', 'haut', 'bas', 'haut'])
    expect(etat.credits).toBe(0)
    expect(etat.ameliorations).toBe(0)
  })

  it('même graine, même partie', () => {
    expect(creerPartie(T0, mulberry32(9))).toEqual(creerPartie(T0, mulberry32(9)))
  })

  it("passe par JSON sans rien perdre (base de la sauvegarde)", () => {
    const etat = creerPartie(T0, mulberry32(4))
    expect(JSON.parse(JSON.stringify(etat))).toEqual(etat)
  })
})
