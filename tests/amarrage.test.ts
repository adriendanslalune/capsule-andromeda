import { describe, expect, it } from 'vitest'
import { DISTANCE_DEPART } from '../src/donnees/amarrage'
import { AUCUNE, avancerAmarrage, contactBon, nouvelAmarrage, type EtatAmarrage, type Poussees } from '../src/moteur/amarrage'
import { Jeu } from '../src/moteur/jeu'
import type { Contrat } from '../src/moteur/contrats'
import { planifier } from '../src/moteur/mission'

/** Un pilote automatique simple : il centre, aligne, puis avance doucement (pour vérifier qu'on peut s'amarrer). */
function piloter(e: EtatAmarrage): Poussees {
  const tourner = e.angle > 1 + e.rotation * -2 ? -1 : e.angle < -1 - e.rotation * 2 ? 1 : (Math.abs(e.rotation) > 0.5 ? (e.rotation > 0 ? -1 : 1) : 0)
  const glisseVoulue = -0.3 * e.ecart
  const cote = e.glisse > glisseVoulue + 0.02 ? -1 : e.glisse < glisseVoulue - 0.02 ? 1 : 0
  const pret = Math.abs(e.ecart) < 0.2 && Math.abs(e.angle) < 3
  const approcheVoulue = pret ? Math.min(0.5, 0.04 + 0.05 * e.distance) : 0
  const avant = e.approche < approcheVoulue - 0.01 ? 1 : e.approche > approcheVoulue + 0.01 ? -1 : 0
  return { avant, cote, tourner } as Poussees
}

describe('l’amarrage (AMARRER, décision d’Adrien du 18/10/2026)', () => {
  it('départ : loin du port, décalé et tourné (il faut corriger)', () => {
    const e = nouvelAmarrage(42)
    expect(e.distance).toBe(DISTANCE_DEPART)
    expect(Math.abs(e.ecart)).toBeGreaterThan(0.5)
    expect(Math.abs(e.angle)).toBeGreaterThan(5)
    expect(contactBon(e).centre).toBe(false)
  })

  it('arriver trop vite : rebond (on recommence), pas d’échec définitif', () => {
    const e = nouvelAmarrage(1)
    e.ecart = 0; e.angle = 0; e.distance = 0.5; e.approche = 0.8
    let r = null
    for (let k = 0; k < 100 && !r; k++) r = avancerAmarrage(e, AUCUNE, 0.05)
    expect(r).toBe('rebond')
    expect(e.rebonds).toBe(1)
    expect(e.approche).toBeLessThan(0)
    expect(e.amarre).toBe(false)
  })

  it('arriver lentement, centré, aligné : amarré', () => {
    const e = nouvelAmarrage(1)
    e.ecart = 0.1; e.angle = 1; e.distance = 0.2; e.approche = 0.05; e.derive = 0
    let r = null
    for (let k = 0; k < 200 && !r; k++) r = avancerAmarrage(e, AUCUNE, 0.05)
    expect(r).toBe('amarre')
    expect(e.amarre).toBe(true)
  })

  it('un pilote soigneux s’amarre en moins de 3 minutes, sans rebond', () => {
    for (const graine of [1, 2, 3, 7, 99]) {
      const e = nouvelAmarrage(graine)
      let r = null, temps = 0
      while (!r && temps < 180) { r = avancerAmarrage(e, piloter(e), 0.05); temps += 0.05 }
      expect(r, `graine ${graine}`).toBe('amarre')
      expect(e.rebonds).toBe(0)
    }
  })

  it('le jeu : amarré sans rebond, la livraison paie 10 % de plus', () => {
    const t0 = Date.UTC(2026, 9, 18, 12)
    const contrat: Contrat = { id: 1, genre: 'livrer', etapes: [{ lieu: 'ISS', action: 'livrer' }], recompense: 100, tableau: 'Terre' }
    const jeu = new Jeu()
    jeu.usureJusqua = Number.MAX_SAFE_INTEGER
    jeu.proposes = [contrat]
    jeu.accepter(1, t0)
    expect(jeu.etapeDAmarrage()).toBe(true)
    expect(jeu.amarrer(0, t0)).toBeNull() // pas sur place
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'ISS', t0, jeu.vitesse())
    if (!p.possible) throw new Error('ISS')
    jeu.mission.partir(p.plan)
    const t = p.plan.arrivee + 1000
    const credits = jeu.credits
    const ev = jeu.amarrer(0, t)
    expect(ev?.some((x) => x.genre === 'contrat-fini')).toBe(true)
    expect(jeu.credits - credits).toBe(110)
  })
})
