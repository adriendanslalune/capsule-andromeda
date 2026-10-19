import { describe, expect, it } from 'vitest'
import { COMBINAISONS, PRESSION_DEPART, VITESSE_PURGE } from '../src/donnees/manuel-moteur'
import { Jeu } from '../src/moteur/jeu'
import {
  injecteursACouper, positionsLeviers, pressionSoupape, tourInjecteurs, tourLeviers, tourSoupape, zonePurge,
} from '../src/moteur/propulsion'
import { BLOCAGE_ERREUR, solution, tourEnergie } from '../src/moteur/reparation'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 19, 12)

/** Une partie où ces modules du bloc Moteur sont en défaut. */
function enDefaut(...a: ('leviers' | 'soupape' | 'injecteurs')[]): Jeu {
  const jeu = new Jeu()
  jeu.graine = 11
  jeu.casser('moteur')
  jeu.defauts.moteur = a
  return jeu
}

/** Combien de temps tenir PURGER pour arriver au milieu de la zone du manuel (ms). */
function dureePurge(temperature: number): number {
  const z = zonePurge(temperature)
  return ((PRESSION_DEPART - (z.bas + z.haut) / 2) / VITESSE_PURGE) * 1000
}

describe('module 3A · leviers', () => {
  it('six combinaisons différentes dans le TABLEAU 3-1 ; les leviers ne commencent jamais dans la bonne', () => {
    expect(new Set(COMBINAISONS.map((c) => c.join())).size).toBe(COMBINAISONS.length)
    for (let g = 1; g < 200; g++) {
      const t = tourLeviers(g, 0)
      expect(t.depart.some((h, i) => h !== COMBINAISONS[t.symbole][i])).toBe(true)
    }
  })

  it('basculer les bons leviers puis ENCLENCHER, deux fois ; une mauvaise combinaison bloque 30 s', () => {
    const jeu = enDefaut('leviers')
    const r = jeu.reparation('leviers')!
    expect(jeu.geste('leviers', { genre: 'enclencher' }, t0)).toBe('erreur')
    const t = t0 + BLOCAGE_ERREUR
    let res = ''
    for (let k = 0; k < 2; k++) {
      const voulu = COMBINAISONS[tourLeviers(r.graine, r.tour).symbole]
      positionsLeviers(r).forEach((h, i) => { if (h !== voulu[i]) jeu.geste('leviers', { genre: 'basculer', levier: i }, t) })
      expect(positionsLeviers(r)).toEqual(voulu)
      res = jeu.geste('leviers', { genre: 'enclencher' }, t)
    }
    expect(res).toBe('repare')
    expect(jeu.enPanne('moteur')).toBe(false)
  })
})

describe('module 3B · soupape', () => {
  it('la température n’est jamais tout près d’une limite du TABLEAU 3-2', () => {
    for (let g = 1; g < 300; g++) {
      const { temperature } = tourSoupape(g, 0)
      expect([300, 600].every((l) => Math.abs(temperature - l) >= 30)).toBe(true)
    }
  })

  it('l’aiguille descend pendant la purge ; relâcher dans la zone, deux fois, répare', () => {
    const jeu = enDefaut('soupape')
    const r = jeu.reparation('soupape')!
    expect(pressionSoupape(r, t0)).toBe(PRESSION_DEPART)
    let t = t0, res = ''
    for (let k = 0; k < 2; k++) {
      jeu.geste('soupape', { genre: 'purger', tenir: true }, t)
      expect(pressionSoupape(r, t + 1000)).toBeCloseTo(PRESSION_DEPART - VITESSE_PURGE)
      t += dureePurge(tourSoupape(r.graine, r.tour).temperature)
      res = jeu.geste('soupape', { genre: 'purger', tenir: false }, t)
      t += 1000
    }
    expect(res).toBe('repare')
  })

  it('relâcher trop tôt est une erreur : 30 s de blocage, l’aiguille remonte', () => {
    const jeu = enDefaut('soupape')
    const r = jeu.reparation('soupape')!
    jeu.geste('soupape', { genre: 'purger', tenir: true }, t0)
    expect(jeu.geste('soupape', { genre: 'purger', tenir: false }, t0 + 200)).toBe('erreur')
    expect(pressionSoupape(r, t0 + 1000)).toBe(PRESSION_DEPART)
    expect(jeu.geste('soupape', { genre: 'purger', tenir: true }, t0 + 1000)).toBe('bloque')
  })

  it('la soupape en défaut met l’aiguille de pression dans le rouge : c’est elle que lit la règle R6 du bornier', () => {
    const jeu = new Jeu()
    jeu.casser('energie')
    jeu.defauts.energie = ['bornier']
    jeu.casser('moteur')
    jeu.defauts.moteur = ['soupape']
    expect(jeu.pressionForcee()).toBe(true)
    // Un tour R6 où le bornier seul dirait « pas dans le rouge » : la réponse change avec la soupape en défaut.
    let r = jeu.reparation('bornier')!
    for (let g = 1; tourEnergie(r.graine, 0).diagnostic.regle !== 'R6' || tourEnergie(r.graine, 0).pressionRouge; g++) {
      jeu.reparations = {}
      jeu.graine = g
      r = jeu.reparation('bornier')!
    }
    const tour = tourEnergie(r.graine, 0)
    const s = solution({ ...tour, pressionRouge: true }, jeu.numeroSerie)
    expect(s).not.toEqual(solution(tour, jeu.numeroSerie))
    if ('couper' in s) expect(jeu.geste('bornier', { genre: 'couper', cable: s.couper }, t0)).toBe('ok')
  })
})

describe('module 3C · injecteurs', () => {
  it('le TABLEAU 3-3 : 1 orange, lui seul ; 2 orange, eux et les éteints ; 3, les verts', () => {
    expect(injecteursACouper({ voyants: ['vert', 'orange', 'eteint', 'vert', 'vert', 'vert'] })).toEqual([1])
    expect(injecteursACouper({ voyants: ['orange', 'vert', 'eteint', 'orange', 'vert', 'eteint'] })).toEqual([0, 2, 3, 5])
    expect(injecteursACouper({ voyants: ['orange', 'vert', 'orange', 'orange', 'vert', 'eteint'] })).toEqual([1, 4])
    for (let g = 1; g < 200; g++) expect(injecteursACouper(tourInjecteurs(g, 0)).length).toBeGreaterThan(0)
  })

  it('couper les bons injecteurs puis AMORCER, deux fois ; un de trop : erreur', () => {
    const jeu = enDefaut('injecteurs')
    const r = jeu.reparation('injecteurs')!
    const premiers = injecteursACouper(tourInjecteurs(r.graine, 0))
    const intrus = [0, 1, 2, 3, 4, 5].find((i) => !premiers.includes(i))!
    for (const i of [...premiers, intrus]) jeu.geste('injecteurs', { genre: 'injecteur', injecteur: i }, t0)
    expect(jeu.geste('injecteurs', { genre: 'amorcer' }, t0)).toBe('erreur')
    const t = t0 + BLOCAGE_ERREUR
    let res = ''
    for (let k = 0; k < 2; k++) {
      for (const i of injecteursACouper(tourInjecteurs(r.graine, r.tour))) jeu.geste('injecteurs', { genre: 'injecteur', injecteur: i }, t)
      res = jeu.geste('injecteurs', { genre: 'amorcer' }, t)
    }
    expect(res).toBe('repare')
    expect(jeu.enPanne('moteur')).toBe(false)
  })

  it('les réparations en cours du bloc Moteur sont sauvegardées', () => {
    const jeu = enDefaut('leviers', 'soupape')
    jeu.geste('leviers', { genre: 'basculer', levier: 2 }, t0)
    jeu.geste('soupape', { genre: 'purger', tenir: true }, t0)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.defauts.moteur).toEqual(['leviers', 'soupape'])
    expect(copie.reparations.leviers).toEqual(jeu.reparations.leviers)
    expect(copie.reparations.soupape).toEqual(jeu.reparations.soupape)
  })
})
