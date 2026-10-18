import { describe, expect, it } from 'vitest'
import { ALIENS, EPAVES, INTERCEPTEURS_MAX, MISSILES_MAX, RECHARGE_INTERCEPTEUR, VOL_MISSILE, tirsParHeure } from '../src/donnees/espace'
import { corps, position, rayonInfluence } from '../src/moteur/corps'
import {
  aliensReperes, avancerEspace, intercepterMissile, nouvelEspace, porteeRadar, surLaCarte, tirDeLHeure, vaincre,
} from '../src/moteur/espace'
import { Jeu } from '../src/moteur/jeu'
import { maisonDuContrat } from '../src/donnees/maisons'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 18, 12)
const UA = 149_597_870.7
const norme = (v: { x: number; y: number; z: number }) => Math.hypot(v.x, v.y, v.z)
const ecart = (a: string, b: string, t: number) => { const p = position(a, t), c = position(b, t); return norme({ x: p.x - c.x, y: p.y - c.y, z: p.z - c.z }) }

describe('les épaves : partout, tout le temps (décision d’Adrien du 18/10/2026)', () => {
  it('dans chaque système, et en plein espace (entre les planètes, astéroïdes, Kuiper)', () => {
    expect(EPAVES.length).toBeGreaterThan(120)
    for (const p of ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton']) {
      expect(EPAVES.filter((e) => e.parent === p).length, p).toBeGreaterThanOrEqual(4)
    }
    const espace = EPAVES.filter((e) => e.parent === 'Soleil')
    expect(espace.some((e) => e.rayon > 2 * UA && e.rayon < 3.5 * UA)).toBe(true)
    expect(espace.some((e) => e.rayon > 30 * UA)).toBe(true)
    expect(new Set(EPAVES.map((e) => e.nom)).size).toBe(EPAVES.length)
  })

  it('autour d’une planète, une épave reste dans son système, bien au-dessus de la surface', () => {
    for (const e of EPAVES.filter((x) => x.parent !== 'Soleil')) {
      const d = ecart(e.nom, e.parent, t0)
      expect(d).toBeLessThan(rayonInfluence(e.parent))
      expect(d).toBeGreaterThan(corps(e.parent)!.rayon)
    }
  })

  it('sur la carte, seulement celles que vise une mission ; les nettoyages de la Terre sont autour de la Terre', () => {
    const e = nouvelEspace()
    expect(EPAVES.some((x) => surLaCarte(e, x.nom, t0))).toBe(false)
    expect(surLaCarte(e, EPAVES[3].nom, t0, [EPAVES[3].nom])).toBe(true)
    const jeu = new Jeu()
    jeu.avancer(t0)
    const nettoyages = jeu.proposes.filter((c) => c.tableau === 'Terre' && maisonDuContrat(c) === 'nettoyeurs')
    for (const c of nettoyages) expect(ecart(c.etapes[0].lieu, 'Terre', t0)).toBeLessThan(1_500_000) // autour de la Terre
  })
})

describe('les chasseurs : très nombreux, partout, imprévisibles', () => {
  it('des centaines, dans tous les systèmes et en plein espace ; très rares près de la Terre', () => {
    expect(ALIENS.length).toBeGreaterThan(300)
    for (const p of ['Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton']) expect(ALIENS.filter((a) => a.parent === p).length, p).toBeGreaterThanOrEqual(10)
    expect(ALIENS.filter((a) => a.parent === 'Soleil').length).toBeGreaterThan(100)
    expect(ALIENS.filter((a) => a.parent === 'Terre').length).toBeLessThanOrEqual(3)
    expect(tirsParHeure(ALIENS.find((a) => a.parent === 'Neptune')!)).toBeGreaterThan(5 * tirsParHeure(ALIENS.find((a) => a.parent === 'Terre')!))
  })

  it('ils errent : leur trajectoire n’est pas une orbite régulière', () => {
    const a = ALIENS.find((x) => x.parent === 'Jupiter')!
    const distances = Array.from({ length: 12 }, (_, k) => ecart(a.nom, 'Jupiter', t0 + k * 3_600_000))
    const min = Math.min(...distances), max = Math.max(...distances)
    expect(max - min).toBeGreaterThan(0.1 * a.rayon) // la distance à Jupiter change sans cesse
    for (const x of ALIENS.filter((y) => y.parent !== 'Soleil')) expect(ecart(x.nom, x.parent, t0)).toBeLessThan(rayonInfluence(x.parent))
  })

  it('au départ (orbite basse terrestre), le radar ne voit aucun chasseur', () => {
    const e = nouvelEspace()
    expect(porteeRadar(t0)).toBeGreaterThan(500_000)
    expect(aliensReperes(e, t0)).toEqual([])
    expect(surLaCarte(e, ALIENS[0].nom, t0)).toBe(false)
  })

  it('un chasseur vaincu disparaît avec ses missiles', () => {
    const e = nouvelEspace()
    e.missiles.push({ id: 1, alien: 'Chasseur Ψ-1', lance: t0, impact: t0 + VOL_MISSILE })
    vaincre(e, 'Chasseur Ψ-1', t0)
    expect(e.missiles).toEqual([])
    expect(e.aliensVaincus['Chasseur Ψ-1']).toBe(t0)
  })

  it('les tirs sont reproductibles, et à peu près à la fréquence voulue', () => {
    const a = ALIENS.find((x) => x.parent === 'Neptune')!
    let tirs = 0
    for (let k = 0; k < 4000; k++) if (tirDeLHeure(a.nom, 500_000 + k) !== null) tirs++
    expect(Math.abs(tirs / 4000 - tirsParHeure(a))).toBeLessThan(0.03)
    expect(tirDeLHeure(a.nom, 500_123)).toBe(tirDeLHeure(a.nom, 500_123))
    expect(MISSILES_MAX).toBeGreaterThanOrEqual(1)
  })

  it('intercepter : un intercepteur de moins, rechargé au bout d’un moment', () => {
    const e = nouvelEspace()
    expect(intercepterMissile(e, t0)).toBe(false)
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
    expect(jeu.avancer(t0 + VOL_MISSILE)).toContainEqual({ genre: 'impact', modules: ['moteur'] })
    expect(jeu.vitesse()).toBe(15)
    const autre = new Jeu()
    autre.casser('coque')
    autre.espace.missiles.push({ id: 8, alien: 'Chasseur Ψ-1', lance: t0, impact: t0 + VOL_MISSILE })
    autre.espace.tirsJusqua = t0 + VOL_MISSILE
    const impact = autre.avancer(t0 + VOL_MISSILE).find((x) => x.genre === 'impact')!
    expect(impact.genre === 'impact' && impact.modules.length).toBe(2)
  })

  it('l’espace est sauvegardé (et une ancienne sauvegarde avec des épaves vidées est encore lue)', () => {
    const jeu = new Jeu()
    jeu.espace.missiles.push({ id: 3, alien: ALIENS[10].nom, lance: t0, impact: t0 + VOL_MISSILE })
    const s = JSON.parse(JSON.stringify(sauvegarder(jeu, t0)))
    expect(restaurer(s)!.espace).toEqual(jeu.espace)
    s.espace.epavesVidees = { 'Kosmos 482': t0 }
    expect(restaurer(s)!.espace).toEqual(jeu.espace)
  })
})
