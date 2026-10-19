import { describe, expect, it } from 'vitest'
import { COQUE_MAX, ENERGIE_TOTALE, INTERCEPTEURS } from '../src/donnees/combat'
import {
  bouclierDe, bouclierEnnemi, jouerTour, prevoir, laserEnnemi, niveauDeZone, nouveauCombat, ordresPossibles, retraite,
  type EtatCombat, type Ordres,
} from '../src/moteur/combat'

const ORDRES: Ordres = { arme: 'laser', esquive: false, intercepteur: false, cible: 'armes' }

describe('le combat au tour par tour (décisions d’Adrien du 19/10/2026)', () => {
  it('plus loin de la Terre, l’ennemi est plus solide et frappe plus fort', () => {
    const terre = nouveauCombat(1, 1), pluton = nouveauCombat(1, 60)
    expect(terre.coqueEnnemiMax).toBe(8)
    expect(pluton.coqueEnnemiMax).toBe(20)
    expect(laserEnnemi(niveauDeZone(1))).toBe(4)
    expect(laserEnnemi(niveauDeZone(60))).toBe(9)
    expect(terre.coque).toBe(COQUE_MAX)
    expect(terre.intercepteurs).toBe(INTERCEPTEURS)
    expect(terre.intention.genre).not.toBe('charge')
  })

  it('6 crans : l’arme et l’esquive coûtent, le reste va au bouclier', () => {
    expect(bouclierDe({ arme: null, esquive: false })).toBe(ENERGIE_TOTALE)
    expect(bouclierDe({ arme: 'laser', esquive: false })).toBe(4)
    expect(bouclierDe({ arme: 'torpille', esquive: true })).toBe(1)
    expect(ordresPossibles({ arme: 'torpille', esquive: true })).toBe(true)
  })

  it('le laser est freiné par le bouclier ennemi (renforcé si annoncé) ; la torpille le traverse', () => {
    const e = nouveauCombat(2, 1)
    e.intention = { genre: 'bouclier' }
    expect(bouclierEnnemi(e)).toBe(3)
    expect(bouclierEnnemi({ ...nouveauCombat(2, 60), intention: { genre: 'bouclier' } })).toBe(3)
    const b = jouerTour(e, { ...ORDRES, arme: 'laser', cible: 'moteur' })!
    expect(b.notreTir!.degats).toBe(0) // laser 3 − bouclier renforcé 3
    const f = nouveauCombat(2, 1)
    f.intention = { genre: 'bouclier' }
    const c = jouerTour(f, { ...ORDRES, arme: 'torpille', cible: 'moteur' })!
    expect(c.notreTir!.degats).toBe(3)
    expect(f.modules.find((m) => m.nom === 'moteur')!.pv).toBe(0)
    expect(f.coqueEnnemi).toBe(f.coqueEnnemiMax - 3)
  })

  it('un ennemi en DÉFENSE intercepte la torpille', () => {
    const e = nouveauCombat(3, 1)
    e.intention = { genre: 'defense' }
    const b = jouerTour(e, { ...ORDRES, arme: 'torpille' })!
    expect(b.notreTir!.interceptee).toBe(true)
    expect(e.coqueEnnemi).toBe(e.coqueEnnemiMax)
  })

  it('son laser : le bouclier l’arrête cran par cran, l’esquive le fait rater ; le missile s’intercepte', () => {
    const e = nouveauCombat(4, 1)
    e.intention = { genre: 'laser', degats: 3 }
    expect(jouerTour(e, { ...ORDRES, arme: 'torpille' })!.recus).toBe(0) // laser 3, bouclier 3
    const f = nouveauCombat(4, 60)
    f.intention = { genre: 'laser', degats: 6 }
    expect(jouerTour(f, { arme: 'torpille', esquive: true, intercepteur: false, cible: 'armes' })!.recus).toBe(2) // 6 / 2 − bouclier 1
    const g = nouveauCombat(4, 1)
    g.intention = { genre: 'missile', degats: 4 }
    expect(jouerTour(g, { arme: null, esquive: true, intercepteur: false, cible: 'armes' })!.recus).toBe(4) // guidé
    const h = nouveauCombat(4, 1)
    h.intention = { genre: 'missile', degats: 4 }
    const b = jouerTour(h, { ...ORDRES, intercepteur: true })!
    expect(b.intercepte).toBe(true)
    expect(b.recus).toBe(0)
    expect(h.intercepteurs).toBe(INTERCEPTEURS - 1)
  })

  it('la rafale (loin de la Terre) : un laser et un missile dans le même tour', () => {
    const e = nouveauCombat(4, 60)
    e.intention = { genre: 'rafale', laser: 4, missile: 3 }
    const b = jouerTour(e, { arme: 'laser', esquive: true, intercepteur: false, cible: 'armes' })!
    expect(b.recus).toBe(3) // le laser esquivé (4 / 2 − bouclier 2), le missile pas intercepté
  })

  it('la charge double le tir suivant, sauf si l’on touche ses armes pendant qu’il charge', () => {
    const e = nouveauCombat(5, 1)
    e.intention = { genre: 'charge' }
    jouerTour(e, { ...ORDRES, arme: null })
    expect(e.charge).toBe(true)
    e.intention = { genre: 'laser', degats: 2 }
    const b = jouerTour(e, { arme: null, esquive: false, intercepteur: false, cible: 'armes' })!
    expect(b.doublé).toBe(true)
    expect(b.recus).toBe(0) // 4 dégâts, bouclier 6
    const f = nouveauCombat(5, 1)
    f.intention = { genre: 'charge' }
    const c = jouerTour(f, { ...ORDRES, arme: 'torpille', cible: 'armes' })!
    expect(c.chargeAnnulee).toBe(true)
    expect(f.charge).toBe(false)
  })

  it('torpilles comptées ; un module détruit se répare deux tours plus tard', () => {
    const e = nouveauCombat(11, 1)
    e.intention = { genre: 'bouclier' }
    jouerTour(e, { ...ORDRES, arme: 'torpille', cible: 'moteur' })
    expect(e.torpilles).toBe(2)
    expect(e.modules.find((m) => m.nom === 'moteur')!.pv).toBe(0)
    e.intention = { genre: 'bouclier' }
    jouerTour(e, { ...ORDRES, arme: null })
    expect(e.modules.find((m) => m.nom === 'moteur')!.pv).toBe(1)
    e.torpilles = 0
    expect(jouerTour(e, { ...ORDRES, arme: 'torpille' })).toBeNull()
  })

  it('ses armes détruites, il ne peut plus tirer (le temps de les réparer)', () => {
    const e = nouveauCombat(6, 1)
    e.modules.find((m) => m.nom === 'armes')!.pv = 0
    for (let k = 0; k < 20; k++) {
      e.intention = { genre: 'laser', degats: 0 }
      const t: EtatCombat = { ...e, graine: e.graine + k, modules: e.modules.map((m) => ({ ...m, reparation: null })) }
      jouerTour(t, { ...ORDRES, arme: null })
      expect(['bouclier', 'defense']).toContain(t.intention.genre)
    }
  })

  it('prévoir : ce que donneraient des ordres, sans rien jouer', () => {
    const e = nouveauCombat(12, 1)
    e.intention = { genre: 'laser', degats: 5 }
    expect(prevoir(e, { arme: 'laser', esquive: false, intercepteur: false, cible: 'armes' })).toEqual({ recus: 1, inflige: 2 })
    expect(e.tour).toBe(1)
    expect(e.coque).toBe(COQUE_MAX)
  })

  it('un joueur réfléchi gagne près de la Terre, sans y laisser sa coque ; coque à 0 : retraite', () => {
    const e = nouveauCombat(7, 1)
    let tours = 0
    while (!e.fin && tours < 40) {
      const i = e.intention
      const o: Ordres = i.genre === 'missile' && e.intercepteurs > 0 ? { arme: 'torpille', esquive: false, intercepteur: true, cible: 'armes' }
        : i.genre === 'laser' ? { arme: 'laser', esquive: false, intercepteur: false, cible: 'armes' }
          : i.genre === 'defense' ? { arme: 'laser', esquive: false, intercepteur: false, cible: 'armes' }
            : { arme: 'torpille', esquive: false, intercepteur: false, cible: 'armes' }
      jouerTour(e, o)
      tours++
    }
    expect(e.fin).toBe('victoire')
    expect(tours).toBeLessThanOrEqual(12)
    const f = nouveauCombat(8, 60)
    while (!f.fin) jouerTour(f, { arme: 'torpille', esquive: true, intercepteur: false, cible: 'bouclier' })
    expect(['victoire', 'retraite']).toContain(f.fin)
    const g = nouveauCombat(9, 1)
    retraite(g)
    expect(g.fin).toBe('retraite')
  })
})
