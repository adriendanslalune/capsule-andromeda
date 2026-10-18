import { describe, expect, it } from 'vitest'
import { ALIENS, EPAVES, INTERCEPTEURS_MAX, RECHARGE_INTERCEPTEUR, RETOUR_EPAVE, TIRS_PAR_HEURE, VOL_MISSILE } from '../src/donnees/espace'
import { corps, position, rayonInfluence } from '../src/moteur/corps'
import {
  aliensReperes, avancerEspace, epaveLa, intercepterMissile, nouvelEspace, porteeRadar, surLaCarte, tirDeLHeure, vaincre,
} from '../src/moteur/espace'
import { Jeu } from '../src/moteur/jeu'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 18, 12)
const norme = (v: { x: number; y: number; z: number }) => Math.hypot(v.x, v.y, v.z)

describe('épaves et chasseurs dans l’espace', () => {
  it('chacun tourne autour de sa planète, dans sa sphère d’influence', () => {
    for (const o of [...EPAVES, ...ALIENS]) {
      expect(corps(o.nom)?.parent).toBe(o.parent)
      const p = position(o.nom, t0), c = position(o.parent, t0)
      const d = norme({ x: p.x - c.x, y: p.y - c.y, z: p.z - c.z })
      expect(d).toBeGreaterThan(o.rayon * 0.99)
      expect(d).toBeLessThan(rayonInfluence(o.parent))
    }
  })

  it('plus de chasseurs, et plus agressifs, loin du Soleil ; très rares près de la Terre', () => {
    const n = (p: string) => ALIENS.filter((a) => a.parent === p).length
    expect(n('Terre')).toBe(1)
    expect(n('Neptune')).toBeGreaterThan(n('Mars'))
    expect(TIRS_PAR_HEURE.Neptune).toBeGreaterThan(10 * TIRS_PAR_HEURE.Terre)
  })

  it('au départ (orbite basse terrestre), le radar ne voit aucun chasseur ; les épaves sont sur la carte', () => {
    const e = nouvelEspace()
    expect(porteeRadar(t0)).toBeGreaterThan(500_000)
    expect(aliensReperes(e, t0)).toEqual([])
    expect(surLaCarte(e, 'Chasseur Ξ-1', t0)).toBe(false)
    expect(surLaCarte(e, 'Kosmos 482', t0)).toBe(true)
  })

  it('une épave vidée revient plus tard ; un chasseur vaincu disparaît avec ses missiles', () => {
    const e = nouvelEspace()
    e.epavesVidees['Kosmos 482'] = t0
    expect(epaveLa(e, 'Kosmos 482', t0 + 1000)).toBe(false)
    expect(epaveLa(e, 'Kosmos 482', t0 + RETOUR_EPAVE)).toBe(true)
    e.missiles.push({ id: 1, alien: 'Chasseur Ψ-1', lance: t0, impact: t0 + VOL_MISSILE })
    vaincre(e, 'Chasseur Ψ-1', t0)
    expect(e.missiles).toEqual([])
  })

  it('les tirs sont reproductibles, et à peu près à la fréquence voulue', () => {
    let tirs = 0
    for (let k = 0; k < 2000; k++) if (tirDeLHeure('Chasseur Λ-1', 500_000 + k) !== null) tirs++
    expect(tirs / 2000).toBeGreaterThan(TIRS_PAR_HEURE.Neptune - 0.05)
    expect(tirs / 2000).toBeLessThan(TIRS_PAR_HEURE.Neptune + 0.05)
    expect(tirDeLHeure('Chasseur Λ-1', 500_123)).toBe(tirDeLHeure('Chasseur Λ-1', 500_123))
  })

  it('intercepter : un intercepteur de moins, rechargé au bout d’un moment', () => {
    const e = nouvelEspace()
    expect(intercepterMissile(e, t0)).toBe(false) // rien en vol
    e.missiles.push({ id: 1, alien: 'Chasseur Ψ-1', lance: t0, impact: t0 + VOL_MISSILE })
    expect(intercepterMissile(e, t0)).toBe(true)
    expect(e.intercepteurs).toBe(INTERCEPTEURS_MAX - 1)
    avancerEspace(e, t0 + RECHARGE_INTERCEPTEUR)
    expect(e.intercepteurs).toBe(INTERCEPTEURS_MAX)
  })
})

describe('un missile qui frappe la capsule', () => {
  it('le Moteur tombe en panne (vitesse divisée par 2) ; avec la Coque en panne, un bloc de plus', () => {
    const jeu = new Jeu()
    jeu.espace.missiles.push({ id: 7, alien: 'Chasseur Ψ-1', lance: t0, impact: t0 + VOL_MISSILE })
    jeu.espace.tirsJusqua = t0 + VOL_MISSILE
    const ev = jeu.avancer(t0 + VOL_MISSILE)
    expect(ev).toContainEqual({ genre: 'impact', modules: ['moteur'] })
    expect(jeu.vitesse()).toBe(15)
    const autre = new Jeu()
    autre.casser('coque')
    autre.espace.missiles.push({ id: 8, alien: 'Chasseur Ψ-1', lance: t0, impact: t0 + VOL_MISSILE })
    autre.espace.tirsJusqua = t0 + VOL_MISSILE
    const impact = autre.avancer(t0 + VOL_MISSILE).find((x) => x.genre === 'impact')!
    expect(impact.genre === 'impact' && impact.modules.length).toBe(2)
  })

  it('l’espace est sauvegardé', () => {
    const jeu = new Jeu()
    jeu.espace.epavesVidees['Telstar 1'] = t0
    jeu.espace.missiles.push({ id: 3, alien: 'Chasseur Ω-1', lance: t0, impact: t0 + VOL_MISSILE })
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.espace).toEqual(jeu.espace)
  })
})
