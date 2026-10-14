import { describe, expect, it } from 'vitest'
import { BAREME } from '../src/donnees/classement'
import { compteurs, compteursDepuis, points, releverCompteurs } from '../src/moteur/classement'
import { verifierTrophees } from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { mulberry32 } from '../src/moteur/hasard'
import { debutPeriode } from '../src/moteur/trophees'

const JOUR = 86_400_000
const LUNDI = Date.UTC(2026, 9, 12)

describe('points de commissionnaire', () => {
  it('le barème : contrats, avaries, visites, trophées, millions de km, visiteurs', () => {
    const c = { contrats: 2, avaries: 5, visites: 3, trophees: 7, km: 2_500_000, trouvailles: 1 }
    expect(points(c)).toBe(2 * BAREME.contrat + 5 * BAREME.avarie + 3 * BAREME.visite + 7 * BAREME.trophee + 2 * BAREME.millionKm + BAREME.visiteur)
  })

  it('la semaine ne compte que ce qui a été fait depuis lundi', () => {
    // Partie créée deux semaines avant, déjà 4 contrats et 10 avaries.
    let e: EtatPartie = { ...creerPartie(LUNDI - 14 * JOUR, mulberry32(1)) }
    e = { ...e, stats: { ...e.stats, contrats: 4, pannes: 10 } }
    // Relevé du lundi (première ouverture de la semaine).
    e = releverCompteurs({ ...e, vu: LUNDI + 3_600_000 })
    // Pendant la semaine : 2 contrats et 3 avaries de plus.
    e = { ...e, vu: LUNDI + 2 * JOUR, stats: { ...e.stats, contrats: 6, pannes: 13 } }
    const semaine = compteursDepuis(e, debutPeriode('semaine', e.vu))
    expect(semaine.contrats).toBe(2)
    expect(semaine.avaries).toBe(3)
    expect(compteursDepuis(e, -Infinity).contrats).toBe(6)
  })

  it('un relevé par jour, gardé 40 jours ; posé à chaque pas par verifierTrophees', () => {
    let e = creerPartie(LUNDI, mulberry32(1))
    for (let j = 0; j < 50; j++) e = verifierTrophees({ ...e, vu: LUNDI + j * JOUR })
    expect(Object.keys(e.releves!).length).toBe(40)
    expect(compteurs(e).contrats).toBe(0)
  })
})
