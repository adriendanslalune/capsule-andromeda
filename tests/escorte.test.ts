import { describe, expect, it } from 'vitest'
import { CARGOS, RESISTANCE } from '../src/donnees/escorte'
import { avancerEscorte, nombreDeMissiles, nouvelleEscorte, positionMissile, tirer } from '../src/moteur/escorte'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'
import type { Contrat } from '../src/moteur/contrats'

const PAS = 0.02

describe('l’escorte (ESCORTER, décision d’Adrien du 18/10/2026)', () => {
  it('plus le système est loin, plus l’embuscade compte de missiles', () => {
    expect(nombreDeMissiles(1)).toBe(10)
    expect(nombreDeMissiles(12)).toBeGreaterThan(nombreDeMissiles(4))
    expect(nombreDeMissiles(60)).toBeGreaterThanOrEqual(20)
  })

  it('un tireur parfait intercepte tout : le convoi arrive sans un coup', () => {
    const e = nouvelleEscorte(7, 12)
    let r = null
    for (let k = 0; k < 20000 && r !== 'arrive'; k++) {
      // Viser le premier missile en vol, à mi-course.
      const m = e.missiles.find((x) => e.temps - x.lance > x.duree * 0.4)
      if (m) { const p = positionMissile(m, e.temps); tirer(e, p.x, p.y) }
      r = avancerEscorte(e, PAS)
    }
    expect(r).toBe('arrive')
    expect(e.coups).toBe(0)
    expect(e.interceptes).toBe(nombreDeMissiles(12))
  })

  it('sans tirer : les cargos sont touchés ; tous hors d’usage, le convoi se replie et la vague recommence', () => {
    const e = nouvelleEscorte(3, 60)
    let repli = false
    for (let k = 0; k < 20000 && !repli; k++) repli = avancerEscorte(e, PAS) === 'repli'
    expect(repli).toBe(true)
    expect(e.coups).toBeGreaterThanOrEqual(CARGOS.length * RESISTANCE)
    expect(e.degats.every((d) => d === 0)).toBe(true)
    expect(e.aVenir.length).toBeGreaterThan(0)
  })

  it('une courte recharge entre deux tirs', () => {
    const e = nouvelleEscorte(1)
    expect(tirer(e, 50, 50)).toBe(0)
    expect(tirer(e, 50, 50)).toBeNull()
    avancerEscorte(e, 0.5)
    expect(tirer(e, 50, 50)).not.toBeNull()
  })

  it('le jeu : escorté sans un coup, +10 %', () => {
    const t0 = Date.UTC(2026, 9, 18, 12)
    const contrat: Contrat = { id: 1, genre: 'escorter', etapes: [{ lieu: 'ISS', action: 'escorter' }], recompense: 100, tableau: 'Terre' }
    const jeu = new Jeu()
    jeu.usureJusqua = Number.MAX_SAFE_INTEGER
    jeu.proposes = [contrat]
    jeu.accepter(1, t0)
    expect(jeu.etapeDEscorte()).toBe(true)
    expect(jeu.zoneEnCours()).toBe(1)
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'ISS', t0, jeu.vitesse())
    if (!p.possible) throw new Error('ISS')
    jeu.mission.partir(p.plan)
    const credits = jeu.credits
    expect(jeu.escorter(0, p.plan.arrivee + 1000)?.some((x) => x.genre === 'contrat-fini')).toBe(true)
    expect(jeu.credits - credits).toBe(110)
  })
})
