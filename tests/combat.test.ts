import { describe, expect, it } from 'vitest'
import { COQUE_MAX, DEGATS_MISSILE, ENERGIE_DEPART, INTERCEPTEURS, RECHARGE_CANON, VOL_MISSILE } from '../src/donnees/combat'
import { Jeu } from '../src/moteur/jeu'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'
import { avancerCombat, crans, fuir, intercepter, nouveauCombat, pretATirer, repartir, tirer } from '../src/moteur/combat'

const t0 = 1_000_000

describe('énergie', () => {
  it('6 crans au plus, 4 au plus par système, jamais négatif', () => {
    const en = { ...ENERGIE_DEPART }
    expect(crans(en)).toBe(6)
    expect(repartir(en, 'armes', 1)).toBe(false) // plus de cran libre
    expect(repartir(en, 'moteurs', -1)).toBe(true)
    expect(repartir(en, 'moteurs', -1)).toBe(false)
    expect(repartir(en, 'armes', 1)).toBe(true)
    expect(repartir(en, 'armes', 1)).toBe(false) // déjà 4
  })
})

describe('combat contre un chasseur', () => {
  it('le canon se recharge plus vite avec plus de crans d’armes', () => {
    const e = nouveauCombat(1, { boucliers: 0, armes: 3, moteurs: 3 }, t0)
    tirer(e, 'bouclier', t0)
    expect(pretATirer(e, t0 + RECHARGE_CANON / 3 - 1)).toBe(false)
    expect(pretATirer(e, t0 + RECHARGE_CANON / 3)).toBe(true)
    const sansArmes = nouveauCombat(1, { boucliers: 3, armes: 0, moteurs: 3 }, t0)
    expect(tirer(sansArmes, 'reacteur', t0)).toBe('impossible')
  })

  it('un missile met 10 s à arriver, et fait des dégâts ; intercepté, il ne fait rien', () => {
    const e = nouveauCombat(2, { boucliers: 4, armes: 0, moteurs: 2 }, t0)
    avancerCombat(e, t0 + 5000)
    expect(e.missiles).toHaveLength(1)
    expect(e.missiles[0].impact).toBe(t0 + 5000 + VOL_MISSILE)
    expect(intercepter(e, t0 + 6000)).toBe(true)
    expect(e.intercepteurs).toBe(INTERCEPTEURS - 1)
    // 4 crans de boucliers et 2 de moteurs : tous les tirs du canon sont arrêtés ou esquivés ; et pas d'impact.
    avancerCombat(e, t0 + 19_999)
    expect(e.coque).toBe(COQUE_MAX)
    avancerCombat(e, t0 + 20_000) // second missile lancé à 20 s
    expect(intercepter(e, t0 + 20_001)).toBe(true)
  })

  it('sans boucliers ni moteurs, chaque tir ennemi touche ; un missile enlève 3 points de coque', () => {
    const e = nouveauCombat(3, { boucliers: 0, armes: 4, moteurs: 0 }, t0)
    const ev = avancerCombat(e, t0 + 15_000)
    expect(ev.filter((x) => x.genre === 'tir-ennemi').every((x) => x.genre === 'tir-ennemi' && x.issue === 'touche')).toBe(true)
    expect(ev.some((x) => x.genre === 'impact-missile')).toBe(true)
    const tirs = ev.filter((x) => x.genre === 'tir-ennemi').length
    expect(e.coque).toBe(COQUE_MAX - tirs - DEGATS_MISSILE)
  })

  it('pas de game over : coque à zéro, la capsule bat en retraite', () => {
    const e = nouveauCombat(4, { boucliers: 0, armes: 4, moteurs: 0 }, t0)
    const ev = avancerCombat(e, t0 + 120_000)
    expect(e.fin).toBe('retraite')
    expect(e.coque).toBe(0)
    expect(ev[ev.length - 1]).toEqual({ genre: 'fin', fin: 'retraite' })
  })

  it('détruire le réacteur, c’est gagner (le bouclier ennemi arrête des tirs tant qu’il tient)', () => {
    const e = nouveauCombat(5, { boucliers: 2, armes: 4, moteurs: 0 }, t0)
    let t = t0
    while (e.modules.find((m) => m.nom === 'bouclier')!.pv > 0) { tirer(e, 'bouclier', t); t += RECHARGE_CANON / 4 }
    let tirs = 0
    while (!e.fin) { expect(tirer(e, 'reacteur', t)).not.toBe('arrete'); t += RECHARGE_CANON / 4; tirs++ }
    expect(e.fin).toBe('victoire')
    expect(tirs).toBe(4)
  })

  it('fuir : impossible sans moteurs ; plus de moteurs, fuite plus rapide', () => {
    expect(fuir(nouveauCombat(6, { boucliers: 3, armes: 3, moteurs: 0 }, t0), t0)).toBe(false)
    const e = nouveauCombat(6, { boucliers: 4, armes: 0, moteurs: 2 }, t0)
    expect(fuir(e, t0)).toBe(true)
    avancerCombat(e, t0 + 6000)
    expect(e.fin).toBe('fuite')
  })

  it('reproductible : même graine, mêmes tirs', () => {
    const a = nouveauCombat(9, ENERGIE_DEPART, t0), b = nouveauCombat(9, ENERGIE_DEPART, t0)
    expect(avancerCombat(a, t0 + 60_000)).toEqual(avancerCombat(b, t0 + 60_000))
  })
})

describe('la répartition de l’énergie est sauvegardée', () => {
  it('aller-retour, et une répartition impossible est refusée', () => {
    const jeu = new Jeu()
    jeu.energie = { boucliers: 4, armes: 1, moteurs: 1 }
    expect(restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!.energie).toEqual({ boucliers: 4, armes: 1, moteurs: 1 })
    const s = JSON.parse(JSON.stringify(sauvegarder(jeu, t0)))
    s.energie = { boucliers: 4, armes: 4, moteurs: 4 }
    expect(restaurer(s)).toBeNull()
  })
})
