import { describe, expect, it } from 'vitest'
import { NOMS_ENGINS } from '../src/astro/engins'
import { LISTE_SATELLITES } from '../src/astro/satellites'
import { NOMS_PLANETES } from '../src/donnees/planetes'
import { traiterArrivee, verifierTrophees } from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { mulberry32 } from '../src/moteur/hasard'
import { envoyerTelegramme } from '../src/moteur/telegrammes'
import { CATALOGUE_TROPHEES } from '../src/moteur/trophees'

const T0 = Date.UTC(2026, 9, 14, 12)
const neuve = () => creerPartie(T0, mulberry32(1))
const ids = new Set(CATALOGUE_TROPHEES.map((t) => t.id))

describe('trophées', () => {
  it('un trophée pour chaque astre (Soleil, planètes, Lune, chaque satellite) et chaque engin, sans doublon', () => {
    expect(ids.size).toBe(CATALOGUE_TROPHEES.length)
    for (const n of ['Soleil', ...NOMS_PLANETES, 'Lune', ...LISTE_SATELLITES.map((s) => s.nom)]) expect(ids.has(`astre:${n}`), n).toBe(true)
    for (const n of ['ISS', ...NOMS_ENGINS]) expect(ids.has(`engin:${n}`), n).toBe(true)
    expect(CATALOGUE_TROPHEES.length).toBeGreaterThan(500)
  })

  it('s’amarrer à l’ISS : l’ISS et la Terre ; un engin : son trophée', () => {
    let e = traiterArrivee(neuve(), { type: 'astre', astre: 'ISS' }, T0)
    expect(e.trophees).toEqual(expect.arrayContaining(['engin:ISS', 'astre:Terre']))
    e = traiterArrivee(e, { type: 'astre', astre: 'Voyager 1' }, T0)
    expect(e.trophees).toContain('engin:Voyager 1')
  })

  it('les trophées des premières versions sont repris', () => {
    const e = verifierTrophees({ ...neuve(), trophees: ['mars', 'kuiper'] })
    expect(e.trophees).toContain('astre:Mars')
    expect(e.trophees).toContain('kuiper')
    expect(e.trophees).not.toContain('mars')
  })

  it('paliers : route, avaries, contrats, moteur, vitesse, caisse, jours de service, télégrammes', () => {
    const e0 = neuve()
    const e: EtatPartie = {
      ...e0, credits: 1500, ameliorations: 25, vu: T0 + 8 * 86_400_000,
      fusee: { ...e0.fusee, distanceParcourue: 2e7 },
      stats: { ...e0.stats, pannes: 30, contrats: 12 },
    }
    const t = verifierTrophees(e).trophees
    for (const id of ['route:100000', 'route:1000000', 'route:10000000', 'avaries:1', 'avaries:25', 'premier', 'contrats:10', 'moteur:20', 'vitesse:100', 'credits:1000', 'service:7']) {
      expect(t, id).toContain(id)
    }
    for (const id of ['route:100000000', 'avaries:50', 'contrats:25', 'moteur:35', 'vitesse:1000', 'credits:10000', 'service:30', 'telegrammes:1']) {
      expect(t, id).not.toContain(id)
    }
    const f = envoyerTelegramme(e0, 'BON VOL', { type: 'tout' }, T0)!
    expect(verifierTrophees(f).trophees).toContain('telegrammes:1')
  })

  it('collections : le Grand Tour, le système de Mars, les visites', () => {
    let e = neuve()
    for (const p of NOMS_PLANETES) e = traiterArrivee(e, { type: 'astre', astre: p === 'Terre' ? 'ISS' : p }, T0)
    expect(e.trophees).toContain('grand-tour')
    expect(e.trophees).toContain('visites:5')
    expect(e.trophees).not.toContain('systeme:Mars')
    for (const s of ['Phobos', 'Deimos']) e = traiterArrivee(e, { type: 'astre', astre: s }, T0)
    expect(e.trophees).toContain('systeme:Mars')
  })

  it('proximité du Soleil : record gardé', () => {
    const e0 = neuve()
    const pres = { ...e0, fusee: { ...e0.fusee, orbite: null, position: { x: 0.04, y: 0 }, ecartOrbite: undefined } }
    const e = verifierTrophees(pres)
    expect(e.stats.distanceMinSoleil).toBeCloseTo(0.04)
    expect(e.trophees).toEqual(expect.arrayContaining(['interieur', 'icare']))
  })
})
