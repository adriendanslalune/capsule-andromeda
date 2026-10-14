import { describe, expect, it } from 'vitest'
import { SEUIL_ARRIVEE_SOLEIL } from '../src/donnees/reglages'
import { contratsDeLaSemaine } from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { choisirDestination, distance, optionsDeDepart, systemeDeLaFusee } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie, vitesseActuelle } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 14, 12)

describe('le Soleil, destination', () => {
  it('on y va, on s’y met en orbite à 0,02 UA, hors de tout système', () => {
    let e: EtatPartie = { ...creerPartie(T0, mulberry32(1)), ameliorations: 60 }
    e = { ...e, fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Soleil' }) }
    expect(optionsDeDepart(e.fusee, { type: 'astre', astre: 'Soleil' }, T0, vitesseActuelle(e)).maintenant).not.toBeNull()
    let arrive = false
    for (let s = 60; s <= 2 * 86_400 && !arrive; s += 60) {
      const r = avancerPartie(e, T0 + s * 1000, 60, mulberry32(s))
      e = r.etat
      arrive = r.arrivee !== null
    }
    expect(arrive).toBe(true)
    expect(e.fusee.orbite).toBe('Soleil')
    const o = e.fusee.ecartOrbite!
    // Arrivée dès que la fusée passe sous la distance d'arrivée (au pas près).
    expect(Math.hypot(o.x, o.y, o.z)).toBeLessThanOrEqual(SEUIL_ARRIVEE_SOLEIL)
    expect(Math.hypot(o.x, o.y, o.z)).toBeGreaterThan(SEUIL_ARRIVEE_SOLEIL * 0.95)
    expect(distance(e.fusee.position, { x: 0, y: 0 })).toBe(0)
    expect(systemeDeLaFusee(e.fusee, T0)).toBeNull()
    // Et on en repart.
    const f = choisirDestination(e.fusee, { type: 'astre', astre: 'Mercure' })
    expect(optionsDeDepart(f, { type: 'astre', astre: 'Mercure' }, T0, vitesseActuelle(e)).maintenant).not.toBeNull()
  })

  it('des contrats visent le Soleil, au français correct', () => {
    const textes: string[] = []
    for (let s = 0; s < 60; s++) {
      const lundi = new Date(Date.UTC(2026, 0, 5) + s * 7 * 86_400_000).toISOString().slice(0, 10)
      for (const c of contratsDeLaSemaine(lundi)) if (c.destination === 'Soleil') textes.push(c.texte)
    }
    expect(textes.length).toBeGreaterThan(5)
    for (const x of textes) {
      expect(x).not.toMatch(/de le |à le /)
      expect(x).toMatch(/du Soleil|au Soleil/)
    }
  })
})
