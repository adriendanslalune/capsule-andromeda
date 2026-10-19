import { describe, expect, it } from 'vitest'
import { BOMBES, COQUE_MAX, DECALAGE_DOIGT, DEGATS_BOMBE, ESCORTEURS_MAX } from '../src/donnees/combat'
import { avancerCombat, bombe, chef, escorteursMax, niveauDeZone, nouveauCombat, retraite } from '../src/moteur/combat'

const PAS = 1 / 60

describe('le combat en temps réel (décision d’Adrien du 19/10/2026)', () => {
  it('plus loin de la Terre, plus d’aliens : aucun escorteur près de la Terre, six vers Pluton', () => {
    expect(escorteursMax(niveauDeZone(1))).toBe(0)
    expect(escorteursMax(niveauDeZone(12))).toBeGreaterThan(2)
    expect(escorteursMax(niveauDeZone(60))).toBe(ESCORTEURS_MAX)
    expect(chef(nouveauCombat(1, 60))!.pvMax).toBeGreaterThan(chef(nouveauCombat(1, 1))!.pvMax)
  })

  it('la capsule suit le doigt, un peu au-dessus de lui, à vitesse limitée', () => {
    const e = nouveauCombat(1)
    const avant = { ...e.capsule }
    avancerCombat(e, PAS, { x: 10, y: 150 })
    expect(Math.hypot(e.capsule.x - avant.x, e.capsule.y - avant.y)).toBeLessThan(3)
    for (let k = 0; k < 120; k++) avancerCombat(e, PAS, { x: 10, y: 150 })
    expect(e.capsule.x).toBeCloseTo(10, 1)
    expect(e.capsule.y).toBeCloseTo(150 - DECALAGE_DOIGT, 1)
  })

  it('touchée : la coque perd un point, puis un instant d’invulnérabilité', () => {
    const e = nouveauCombat(1)
    e.balles.push({ x: e.capsule.x, y: e.capsule.y, vx: 0, vy: 0 })
    expect(avancerCombat(e, PAS, null)).toContain('touche')
    expect(e.coque).toBe(COQUE_MAX - 1)
    e.balles.push({ x: e.capsule.x, y: e.capsule.y, vx: 0, vy: 0 })
    expect(avancerCombat(e, PAS, null)).not.toContain('touche')
    e.coque = 1
    e.invulnerableJusqua = 0
    e.balles.push({ x: e.capsule.x, y: e.capsule.y, vx: 0, vy: 0 })
    expect(avancerCombat(e, PAS, null)).toContain('retraite')
    expect(e.fin).toBe('retraite')
  })

  it('la bombe efface les balles et abîme tous les aliens ; il y en a trois', () => {
    const e = nouveauCombat(1)
    e.balles.push({ x: 50, y: 50, vx: 0, vy: 10 })
    const pv = chef(e)!.pv
    expect(bombe(e)).toBe(true)
    expect(e.balles).toHaveLength(0)
    expect(chef(e)!.pv).toBe(pv - DEGATS_BOMBE)
    expect(e.bombes).toBe(BOMBES - 1)
    e.bombes = 0
    expect(bombe(e)).toBe(false)
  })

  it('en restant sous le chasseur (sans se faire toucher), on l’abat : vite près de la Terre, plus long vers Pluton', () => {
    const duree = (zone: number) => {
      const e = nouveauCombat(5, zone)
      while (!e.fin && e.temps < 600) {
        e.invulnerableJusqua = Infinity
        const c = chef(e)
        avancerCombat(e, PAS, c ? { x: c.x, y: 150 } : null)
      }
      expect(e.fin).toBe('victoire')
      return e.temps
    }
    const terre = duree(1), pluton = duree(60)
    expect(terre).toBeLessThan(40)
    expect(pluton).toBeGreaterThan(terre)
    expect(pluton).toBeLessThan(180)
  })

  it('vers Pluton, des escorteurs arrivent par vagues ; on peut battre en retraite', () => {
    const e = nouveauCombat(9, 60)
    for (let k = 0; k < 6 * 60; k++) avancerCombat(e, PAS, { x: 50, y: 150 })
    expect(e.aliens.filter((a) => !a.chef).length).toBeGreaterThan(0)
    retraite(e)
    expect(e.fin).not.toBeNull()
  })
})
