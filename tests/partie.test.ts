import { describe, expect, it } from 'vitest'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { mulberry32 } from '../src/moteur/hasard'
import { modulesEnPanne } from '../src/moteur/modules'
import { panneAL1 } from '../src/moteur/modules/al1'
import { basculerLevierA, panneCH1Imposee, panneTU1 } from '../src/moteur/modules/propulsion'
import { avancerPartie, vitesseActuelle } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 13, 12)
const neuve = () => creerPartie(T0, mulberry32(1))

describe('partie : modules et vitesse', () => {
  it('fusée neuve : modules de base en ordre de marche, 30 km/s', () => {
    const e = neuve()
    expect(modulesEnPanne(e.modules)).toEqual([])
    expect(vitesseActuelle(e)).toBe(30)
  })

  it('levier L-A abaissé : vitesse × 0,2', () => {
    const e = neuve()
    const abaisse: EtatPartie = { ...e, modules: { ...e.modules, propulsion: basculerLevierA(e.modules.propulsion, T0).etat } }
    expect(vitesseActuelle(abaisse)).toBeCloseTo(6, 10)
  })

  it('au moins une avarie : vitesse × 0,45, quel que soit le nombre de modules en panne', () => {
    const e = neuve()
    const h = mulberry32(2)
    const une: EtatPartie = { ...e, modules: { ...e.modules, al1: panneAL1(e.modules.al1, h) } }
    expect(modulesEnPanne(une.modules)).toEqual(['AL-1'])
    expect(vitesseActuelle(une)).toBeCloseTo(13.5, 10)
    const trois: EtatPartie = {
      ...une, modules: { ...une.modules, propulsion: panneCH1Imposee(panneTU1(e.modules.propulsion), 'sur') },
    }
    expect(modulesEnPanne(trois.modules)).toEqual(['CH-1', 'TU-1', 'AL-1'])
    expect(vitesseActuelle(trois)).toBeCloseTo(13.5, 10)
  })

  it('les aiguilles évoluent pendant la partie, et une faute de pilotage remonte jusqu’à la partie', () => {
    let e = neuve()
    e = { ...e, modules: { ...e.modules, propulsion: { ...e.modules.propulsion, molette: 9 } } } // pression vers 98
    const evenements = []
    for (let s = 1; s <= 20; s++) {
      const r = avancerPartie(e, T0 + s * 1000, 1)
      e = r.etat
      evenements.push(...r.evenements)
    }
    expect(e.modules.propulsion.pression).toBeGreaterThan(90)
    expect(evenements).toEqual([{ type: 'faute', module: 'CH-1' }])
    expect(modulesEnPanne(e.modules)).toEqual(['CH-1'])
  })

  it('l’état complet de la partie passe par JSON sans rien perdre (sauvegarde)', () => {
    const e = neuve()
    expect(JSON.parse(JSON.stringify(e))).toEqual(e)
  })
})
