import { describe, expect, it } from 'vitest'
import { ROTATION_MAX, ROTATION_MIN, TOLERANCE } from '../src/donnees/remorquage'
import { avancerRemorquage, ecartAnneau, lancer, nouveauRemorquage } from '../src/moteur/remorquage'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'
import type { Contrat } from '../src/moteur/contrats'

const PAS = 0.01

describe('le remorquage (REMORQUER, décision d’Adrien du 18/10/2026)', () => {
  it('l’épave tourne sur elle-même, dans un sens ou dans l’autre', () => {
    const sens = new Set<number>()
    for (let g = 1; g < 20; g++) {
      const e = nouveauRemorquage(g)
      expect(Math.abs(e.base)).toBeGreaterThanOrEqual(ROTATION_MIN)
      expect(Math.abs(e.base)).toBeLessThanOrEqual(ROTATION_MAX)
      sens.add(Math.sign(e.base))
    }
    expect(sens.size).toBe(2)
  })

  it('tirer au mauvais moment : le grappin ricoche, il faut le retirer', () => {
    const e = nouveauRemorquage(5)
    // Tirer quand l'anneau arrivera dos à la capsule.
    let r = null
    while (true) {
      const futur = { ...e }
      for (let k = 0; k < 80; k++) avancerRemorquage(futur, PAS)
      if (ecartAnneau(futur) > 120) break
      avancerRemorquage(e, PAS)
    }
    expect(lancer(e)).toBe(true)
    expect(lancer(e)).toBe(false) // déjà en vol
    for (let k = 0; k < 200 && !r; k++) r = avancerRemorquage(e, PAS)
    expect(r).toBe('rate')
    expect(e.rates).toBe(1)
    expect(lancer(e)).toBe(false) // on enroule le câble
  })

  it('en anticipant (tirer quand l’anneau sera face à la capsule à l’arrivée du grappin), il accroche', () => {
    const e = nouveauRemorquage(9)
    while (true) {
      const futur = { ...e }
      for (let k = 0; k < 80; k++) avancerRemorquage(futur, PAS)
      if (ecartAnneau(futur) < TOLERANCE / 2) break
      avancerRemorquage(e, PAS)
    }
    lancer(e)
    let r = null
    for (let k = 0; k < 200 && !r; k++) r = avancerRemorquage(e, PAS)
    expect(r).toBe('accroche')
    expect(e.phase).toBe('stabiliser')
  })

  it('stabiliser : freiner la rotation jusqu’à l’arrêt ; pousser dans le mauvais sens l’accélère', () => {
    const e = nouveauRemorquage(3)
    e.phase = 'stabiliser'
    const v0 = Math.abs(e.rotation)
    for (let k = 0; k < 50; k++) avancerRemorquage(e, PAS, Math.sign(e.rotation) as 1 | -1)
    expect(Math.abs(e.rotation)).toBeGreaterThan(v0)
    let r = null
    for (let k = 0; k < 3000 && !r; k++) {
      const freiner = Math.abs(e.rotation) < 1 ? 0 : (-Math.sign(e.rotation) as 1 | -1)
      r = avancerRemorquage(e, PAS, freiner)
    }
    expect(r).toBe('stabilisee')
    expect(e.phase).toBe('fini')
  })

  it('le jeu : harponnée du premier coup, +10 % ; l’épave est en remorque jusqu’à la station', () => {
    const t0 = Date.UTC(2026, 9, 18, 12)
    const contrat: Contrat = { id: 1, genre: 'remorquer', etapes: [{ lieu: 'ISS', action: 'harponner' }, { lieu: 'Tiangong', action: 'larguer' }], recompense: 100, tableau: 'Terre' }
    const jeu = new Jeu()
    jeu.usureJusqua = Number.MAX_SAFE_INTEGER
    jeu.proposes = [contrat]
    jeu.accepter(1, t0)
    expect(jeu.etapeDeHarponnage()).toBe(true)
    expect(jeu.remorque()).toBeNull()
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'ISS', t0, jeu.vitesse())
    if (!p.possible) throw new Error('ISS')
    jeu.mission.partir(p.plan)
    expect(jeu.harponner(0, p.plan.arrivee + 1000)).not.toBeNull()
    expect(jeu.enCours!.contrat.recompense).toBe(110)
    expect(jeu.remorque()).toEqual({ epave: 'ISS', pour: 'Tiangong' })
  })
})

describe('stabiliser l’épave harponnée (plus dur le 21/10/2026)', () => {
  it('déséquilibrée, elle se remet à tourner toute seule si on ne fait rien', () => {
    const e = nouveauRemorquage(12)
    e.phase = 'stabiliser'
    e.rotation = 0
    let max = 0
    for (let k = 0; k < 100; k++) { avancerRemorquage(e, PAS); max = Math.max(max, Math.abs(e.rotation)) }
    expect(max).toBeGreaterThan(0.5)
  })
})
