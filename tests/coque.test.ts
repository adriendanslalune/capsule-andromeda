import { describe, expect, it } from 'vitest'
import { CRANS_PAR_PRESSION, FISSURES, MESSAGES_SAS } from '../src/donnees/manuel-coque'
import { cransVannes, interrupteursSas, tourBreche, tournees, tourSas, tourVannes } from '../src/moteur/coque'
import { Jeu } from '../src/moteur/jeu'
import { BLOCAGE_ERREUR } from '../src/moteur/reparation'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 19, 12)

function enDefaut(...a: ('vannes' | 'breche' | 'sas')[]): Jeu {
  const jeu = new Jeu()
  jeu.graine = 3
  jeu.casser('coque')
  jeu.defauts.coque = a
  return jeu
}

describe('module 5A · vannes', () => {
  it('le TABLEAU 5-1 a une ligne par pression (1 à 9) ; jamais rien à faire sur les trois vannes à la fois', () => {
    expect(CRANS_PAR_PRESSION).toHaveLength(9)
    for (const l of CRANS_PAR_PRESSION) expect(l.some((x) => x !== 0)).toBe(true)
  })

  it('tourner chaque vanne du nombre de crans du manuel, dans le bon sens, puis ÉTANCHER, deux fois', () => {
    const jeu = enDefaut('vannes')
    const r = jeu.reparation('vannes')!
    expect(jeu.geste('vannes', { genre: 'etancher' }, t0)).toBe('erreur')
    const t = t0 + BLOCAGE_ERREUR
    let res = ''
    for (let k = 0; k < 2; k++) {
      const voulu = CRANS_PAR_PRESSION[tourVannes(r.graine, r.tour).pression - 1]
      voulu.forEach((n, i) => { for (let j = 0; j < Math.abs(n); j++) jeu.geste('vannes', { genre: 'vanne', vanne: i, pas: n > 0 ? 1 : -1 }, t) })
      expect(tournees(r)).toEqual([...voulu])
      res = jeu.geste('vannes', { genre: 'etancher' }, t)
    }
    expect(res).toBe('repare')
  })

  it('le cran fait le tour (7 + 1 = 0) ; tourner dans le mauvais sens est une erreur même si la vanne finit au même cran', () => {
    const jeu = enDefaut('vannes')
    const r = jeu.reparation('vannes')!
    const avant = cransVannes(r)[0]
    for (let j = 0; j < 8; j++) jeu.geste('vannes', { genre: 'vanne', vanne: 0, pas: 1 }, t0)
    expect(tournees(r)[0]).toBe(7)
    expect(cransVannes(r)[0]).toBe((avant + 7) % 8)
  })
})

describe('module 5B · brèche', () => {
  it('six fissures, chacune un ordre complet des quatre rivets', () => {
    expect(FISSURES).toHaveLength(6)
    for (const f of FISSURES) expect([...f.ordre].sort()).toEqual([0, 1, 2, 3])
  })

  it('frapper les rivets dans l’ordre puis SOUDER, deux fois ; un rivet hors de son tour, ou SOUDER trop tôt : erreur', () => {
    const jeu = enDefaut('breche')
    const r = jeu.reparation('breche')!
    const ordre = FISSURES[tourBreche(r.graine, 0).fissure].ordre
    expect(jeu.geste('breche', { genre: 'rivet', rivet: ordre[1] }, t0)).toBe('erreur')
    const t = t0 + BLOCAGE_ERREUR
    let res = ''
    expect(jeu.geste('breche', { genre: 'souder' }, t)).toBe('erreur') // SOUDER avant d'avoir frappé les rivets
    const t2 = t + 2 * BLOCAGE_ERREUR
    for (let k = 0; k < 2; k++) {
      for (const i of FISSURES[tourBreche(r.graine, r.tour).fissure].ordre) jeu.geste('breche', { genre: 'rivet', rivet: i }, t2)
      res = jeu.geste('breche', { genre: 'souder' }, t2)
    }
    expect(res).toBe('repare')
  })
})

describe('module 5C · sas', () => {
  it('douze messages différents, chacun avec son interrupteur de 1 à 8 ; trois messages différents par procédure', () => {
    expect(new Set(MESSAGES_SAS.map((m) => m.message)).size).toBe(12)
    for (const m of MESSAGES_SAS) expect(m.interrupteur >= 1 && m.interrupteur <= 8).toBe(true)
    for (let g = 1; g < 100; g++) expect(new Set(tourSas(g, 0).messages).size).toBe(3)
  })

  it('trois étapes, un interrupteur chacune ; une erreur fait tout recommencer', () => {
    const jeu = enDefaut('sas')
    const r = jeu.reparation('sas')!
    const msgs = tourSas(r.graine, 0).messages.map((m) => MESSAGES_SAS[m].interrupteur - 1)
    expect(jeu.geste('sas', { genre: 'sas', interrupteur: msgs[0] }, t0)).toBe('ok')
    expect(interrupteursSas(r)[msgs[0]]).toBe(true)
    expect(jeu.geste('sas', { genre: 'sas', interrupteur: (msgs[1] + 1) % 8 }, t0)).toBe('erreur')
    expect(r.coupes).toEqual([])
    let res = ''
    for (const i of msgs) res = jeu.geste('sas', { genre: 'sas', interrupteur: i }, t0 + BLOCAGE_ERREUR)
    expect(res).toBe('repare')
    expect(jeu.enPanne('coque')).toBe(false)
  })

  it('les réparations en cours du bloc Coque sont sauvegardées', () => {
    const jeu = enDefaut('vannes', 'breche')
    jeu.geste('vannes', { genre: 'vanne', vanne: 1, pas: -1 }, t0)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.reparations.vannes).toEqual(jeu.reparations.vannes)
    expect(tournees(copie.reparations.vannes!)).toEqual([0, -1, 0])
  })
})
