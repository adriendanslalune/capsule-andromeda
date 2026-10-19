import { describe, expect, it } from 'vitest'
import { CABLAGE, DISJONCTEURS, LES_BUS, VOYANTS } from '../src/donnees/depannage'
import {
  basculer, brancher, cablageAttendu, depannageFini, leviersAttendus, molettesAttendues, nouveauDepannage, tournerMolette, verifier,
  type EtatDepannage,
} from '../src/moteur/depannage'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'
import type { Contrat } from '../src/moteur/contrats'

/** Règle l'appareil comme le demande le Manuel. */
function regler(e: EtatDepannage): void {
  leviersAttendus(e).forEach((v, k) => { if (e.leviers[k] !== v) basculer(e, k) })
  cablageAttendu(e).forEach((p, k) => brancher(e, k, p))
  molettesAttendues(e).forEach((m, k) => { while (e.molettes[k] !== m) tournerMolette(e, k, 1) })
}

describe('le dépannage d’un engin (RÉPARER, décision d’Adrien du 18/10/2026)', () => {
  it('les tableaux du Manuel sont complets et cohérents (un exemplaire imprimé sert à tous)', () => {
    for (const v of VOYANTS) for (const b of LES_BUS) {
      const l = DISJONCTEURS[v.voyant][b]
      expect(l.length).toBeGreaterThan(0)
      expect(l.every((n) => n >= 1 && n <= 5)).toBe(true)
    }
    for (const b of LES_BUS) expect([...CABLAGE[b]].sort()).toEqual([1, 2, 3, 4])
  })

  it('deux appareils en défaut sur trois ; le boîtier change d’une mission à l’autre', () => {
    const vus = new Set<string>()
    for (let g = 1; g < 40; g++) {
      const e = nouveauDepannage(g)
      expect(e.enDefaut).toHaveLength(2)
      expect(new Set(e.symboles).size).toBe(3)
      // Jamais déjà réparé au départ.
      expect(leviersAttendus(e).every((v, k) => v === e.leviers[k])).toBe(false)
      expect(molettesAttendues(e).every((m, k) => m === e.molettes[k])).toBe(false)
      vus.add(`${e.bus}${e.voyant}${e.enDefaut.join()}`)
    }
    expect(vus.size).toBeGreaterThan(10)
  })

  it('le voyant BLEU échange les prises 1 et 4 (règle 6.2.3)', () => {
    const e = nouveauDepannage(3)
    e.bus = 'A'
    e.voyant = 'rouge'
    expect(cablageAttendu(e)).toEqual([2, 4, 1, 3])
    e.voyant = 'bleu'
    expect(cablageAttendu(e)).toEqual([2, 1, 4, 3])
  })

  it('une mauvaise vérification est une fausse manœuvre ; bien réglé, l’appareil est réparé', () => {
    const e = nouveauDepannage(7)
    const a = e.enDefaut[0]
    if (a === 'gyroscope') { e.molettes = molettesAttendues(e).map((m) => (m + 1) % 10) } else if (a === 'disjoncteurs') { e.leviers = leviersAttendus(e).map((v) => !v) }
    expect(verifier(e, a)).toBe(false)
    expect(e.erreurs).toBe(1)
    regler(e)
    expect(verifier(e, e.enDefaut[0])).toBe(true)
    expect(verifier(e, e.enDefaut[1])).toBe(true)
    expect(depannageFini(e)).toBe(true)
  })

  it('brancher un câble sur une prise occupée débranche l’autre', () => {
    const e = nouveauDepannage(1)
    brancher(e, 0, 2)
    brancher(e, 1, 2)
    expect(e.prises[0]).toBeNull()
    expect(e.prises[1]).toBe(2)
  })

  it('le jeu : réparé sans fausse manœuvre, la mission paie 10 % de plus', () => {
    const t0 = Date.UTC(2026, 9, 18, 12)
    const contrat: Contrat = { id: 1, genre: 'depanner', etapes: [{ lieu: 'ISS', action: 'reparer' }], recompense: 100, tableau: 'Terre' }
    const jeu = new Jeu()
    jeu.usureJusqua = Number.MAX_SAFE_INTEGER
    jeu.proposes = [contrat]
    jeu.accepter(1, t0)
    expect(jeu.etapeDeDepannage()).toBe(true)
    expect(jeu.depanner(0, t0)).toBeNull() // pas sur place
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'ISS', t0, jeu.vitesse())
    if (!p.possible) throw new Error('ISS')
    jeu.mission.partir(p.plan)
    const credits = jeu.credits
    expect(jeu.depanner(0, p.plan.arrivee + 1000)?.some((x) => x.genre === 'contrat-fini')).toBe(true)
    expect(jeu.credits - credits).toBe(110)
  })
})
