import { describe, expect, it } from 'vitest'
import { lignesDuBandeau } from '../src/moteur/bandeau'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 17, 12)
const JOUR = 86_400_000
/** Comme sur le téléphone : la sauvegarde passe par du texte. */
const allerRetour = (jeu: Jeu, t: number) => restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t))))

function enRouteVers(cible: string): Jeu {
  const jeu = new Jeu()
  const p = planifier(jeu.mission.etatHeliocentrique(t0), cible, t0, jeu.vitesse())
  if (!p.possible) throw new Error('impossible')
  jeu.mission.partir(p.plan)
  return jeu
}

describe('sauvegarde de la partie', () => {
  it('on retrouve exactement la même capsule, en route puis à l’arrivée', () => {
    const jeu = enRouteVers('Mars')
    jeu.credits = 1234
    const copie = allerRetour(jeu, t0 + JOUR)!
    expect(copie.credits).toBe(1234)
    expect(copie.niveauMoteur).toBe(1)
    for (const t of [t0 + JOUR, t0 + 40 * JOUR, jeu.mission.plan!.arrivee + JOUR]) {
      expect(copie.mission.etat(t).position).toEqual(jeu.mission.etat(t).position)
      expect(copie.mission.phase(t)).toBe(jeu.mission.phase(t))
    }
  })

  it('un trajet continue pendant que l’application est fermée : à la réouverture, la capsule est arrivée', () => {
    const jeu = enRouteVers('Lune')
    const copie = allerRetour(jeu, t0 + 60_000)!
    const plusTard = jeu.mission.plan!.arrivee + 2 * JOUR
    expect(lignesDuBandeau(copie.mission, plusTard)[0]).toMatchObject({ genre: 'orbite', centre: 'Lune' })
  })

  it('après la réouverture, le trajet suivant part bien de là où la capsule est arrivée', () => {
    const jeu = enRouteVers('Lune')
    const copie = allerRetour(jeu, t0)!
    const t = jeu.mission.plan!.arrivee + JOUR
    const p = planifier(copie.mission.etatHeliocentrique(t), 'ISS', t, copie.vitesse())
    if (!p.possible) throw new Error('impossible')
    copie.mission.partir(p.plan)
    expect(copie.mission.orbite.centre).toBe('Lune')
  })

  it('une partie neuve se sauvegarde aussi', () => {
    const copie = allerRetour(new Jeu(), t0)!
    expect(copie.mission.plan).toBeNull()
    expect(lignesDuBandeau(copie.mission, t0)[0]).toMatchObject({ genre: 'orbite', centre: 'Terre' })
  })

  it('une sauvegarde illisible ou d’un autre format est ignorée', () => {
    const bonne = JSON.parse(JSON.stringify(sauvegarder(enRouteVers('Mars'), t0)))
    for (const mauvaise of [null, undefined, 42, 'texte', {}, { ...bonne, version: 99 }, { ...bonne, credits: 'beaucoup' },
      { ...bonne, orbite: { ...bonne.orbite, centre: 'Atlantide' } }, { ...bonne, plan: { ...bonne.plan, points: [] } }]) {
      expect(restaurer(mauvaise)).toBeNull()
    }
  })
})
