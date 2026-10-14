import { describe, expect, it } from 'vitest'
import { rayonCorps } from '../src/astro/corps'
import { UA_KM } from '../src/astro/temps'
import { approcheEnginKm } from '../src/donnees/engins'
import { contratsDeLaSemaine } from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { choisirDestination } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 14, 12)

function voyager(etat: EtatPartie, depuis: number, maxSecondes: number, pas = 60) {
  let e = etat
  for (let s = pas; s <= maxSecondes; s += pas) {
    const r = avancerPartie(e, depuis + s * 1000, pas, mulberry32(s))
    e = r.etat
    if (r.arrivee) return { etat: e, t: depuis + s * 1000 }
  }
  return { etat: e, t: depuis + maxSecondes * 1000 }
}

describe('la Terre et l’ISS, deux destinations', () => {
  it('choisir la Terre mène à la Terre, l’ISS à l’ISS', () => {
    const f = creerPartie(T0, mulberry32(1)).fusee
    expect(choisirDestination(f, { type: 'astre', astre: 'Terre' }).destination).toEqual({ type: 'astre', astre: 'Terre' })
    expect(choisirDestination(f, { type: 'astre', astre: 'ISS' }).destination).toEqual({ type: 'astre', astre: 'ISS' })
  })

  it('des contrats de la semaine visent la Terre', () => {
    const d = new Set<string>()
    for (let s = 0; s < 52; s++) {
      const lundi = new Date(Date.UTC(2026, 0, 5) + s * 7 * 86_400_000).toISOString().slice(0, 10)
      for (const c of contratsDeLaSemaine(lundi)) d.add(c.destination)
    }
    expect(d.has('Terre')).toBe(true)
  })

  it('en revenant de la Lune, la fusée se met en orbite autour de la Terre, à trois rayons', () => {
    let e = creerPartie(T0, mulberry32(1))
    e = { ...e, fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Lune' }), contratsFaits: ['tutoriel-1', 'tutoriel-2'] }
    const aller = voyager(e, T0, 3 * 86_400)
    expect(aller.etat.fusee.orbite).toBe('Lune')
    const retour = voyager({ ...aller.etat, fusee: choisirDestination(aller.etat.fusee, { type: 'astre', astre: 'Terre' }) }, aller.t, 3 * 86_400)
    expect(retour.etat.fusee.orbite).toBe('Terre')
    const o = retour.etat.fusee.ecartOrbite!
    expect(Math.hypot(o.x, o.y) * UA_KM).toBeLessThanOrEqual(3 * rayonCorps('Terre')! * 1.001)
    expect(retour.etat.trophees).toContain('astre:Terre')
  })

  it('l’ISS se visite comme un engin : approche à 100 m, sans amarrage', () => {
    let e: EtatPartie = { ...creerPartie(T0, mulberry32(1)), ameliorations: 10 }
    e = { ...e, fusee: { ...choisirDestination(e.fusee, { type: 'astre', astre: 'Lune' }) } }
    const aller = voyager(e, T0, 3 * 86_400)
    const r = voyager({ ...aller.etat, fusee: choisirDestination(aller.etat.fusee, { type: 'astre', astre: 'ISS' }) }, aller.t, 3 * 86_400, 1)
    expect(r.etat.fusee.orbite).toBe('ISS')
    const o = r.etat.fusee.ecartOrbite!
    expect(Math.hypot(o.x, o.y, o.z) * UA_KM).toBeCloseTo(approcheEnginKm(109), 6)
    expect(r.etat.trophees).toContain('engin:ISS')
  }, 60_000)
})
