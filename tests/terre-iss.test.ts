import { describe, expect, it } from 'vitest'
import { UA_KM } from '../src/astro/temps'
import { AMARRAGE_ISS_KM } from '../src/donnees/reglages'
import { contratsDeLaSemaine } from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { choisirDestination, choisirDestinationAvecFenetre } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 14, 12)

function voyager(etat: EtatPartie, depuis: number, maxSecondes: number) {
  let e = etat
  for (let s = 60; s <= maxSecondes; s += 60) {
    const r = avancerPartie(e, depuis + s * 1000, 60, mulberry32(s))
    e = r.etat
    if (r.arrivee) return { etat: e, t: depuis + s * 1000 }
  }
  return { etat: e, t: depuis + maxSecondes * 1000 }
}

describe('la Terre, c’est l’ISS', () => {
  it('choisir la Terre mène à l’ISS', () => {
    const f = creerPartie(T0, mulberry32(1)).fusee
    expect(choisirDestination(f, { type: 'astre', astre: 'Terre' }).destination).toEqual({ type: 'astre', astre: 'ISS' })
    expect(choisirDestinationAvecFenetre(f, { type: 'astre', astre: 'Terre' }, T0, 30).destination).toEqual({ type: 'astre', astre: 'ISS' })
    expect(choisirDestination(f, { type: 'astre', astre: 'Lune' }).destination).toEqual({ type: 'astre', astre: 'Lune' })
  })

  it('aucun contrat de la semaine ne vise « la Terre » : ils visent l’ISS', () => {
    for (let s = 0; s < 52; s++) {
      const lundi = new Date(Date.UTC(2026, 0, 5) + s * 7 * 86_400_000).toISOString().slice(0, 10)
      for (const c of contratsDeLaSemaine(lundi)) expect(c.destination).not.toBe('Terre')
    }
  })

  it('en revenant de la Lune, la fusée s’amarre à l’ISS et remplit un ancien contrat « Terre »', () => {
    let e = creerPartie(T0, mulberry32(1))
    e = { ...e, fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Lune' }), contratsFaits: ['tutoriel-1', 'tutoriel-2'] }
    const aller = voyager(e, T0, 3 * 86_400)
    expect(aller.etat.fusee.orbite).toBe('Lune')
    const contrat = { id: 'ancien', type: 'COURRIER', texte: 'x', destination: 'Terre', prime: 42 }
    const avant = { ...aller.etat, contrats: [contrat], fusee: choisirDestination(aller.etat.fusee, { type: 'astre', astre: 'Terre' }) }
    const retour = voyager(avant, aller.t, 3 * 86_400)
    expect(retour.etat.fusee.orbite).toBe('ISS')
    const ecart = retour.etat.fusee.ecartOrbite!
    expect(Math.hypot(ecart.x, ecart.y, ecart.z) * UA_KM).toBeCloseTo(AMARRAGE_ISS_KM, 6)
    expect(retour.etat.contrats).toHaveLength(0)
    expect(retour.etat.credits).toBe(avant.credits + 42)
  })
})
