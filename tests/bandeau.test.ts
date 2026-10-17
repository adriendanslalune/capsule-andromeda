import { describe, expect, it } from 'vitest'
import { lignesDuBandeau } from '../src/moteur/bandeau'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 17, 12)

describe('bandeau d’alertes', () => {
  it('au départ : l’état calme, en orbite basse autour de la Terre', () => {
    const [l] = lignesDuBandeau(new Jeu(), t0)
    expect(l.genre).toBe('orbite')
    if (l.genre !== 'orbite') return
    expect(l.centre).toBe('Terre')
    expect(l.altitude).toBeCloseTo(400, 0)
    expect(l.tour! / 60).toBeCloseTo(92.4, 0)
  })

  it('en route : la destination, l’heure d’arrivée et le temps restant ; puis en orbite à l’arrivée', () => {
    const jeu = new Jeu()
    const m = jeu.mission
    const p = planifier(m.etatHeliocentrique(t0), 'Lune', t0, 30)
    if (!p.possible) throw new Error('impossible')
    m.partir(p.plan)
    const t = t0 + 3_600_000
    expect(lignesDuBandeau(jeu, t)).toEqual([{ genre: 'trajet', cible: 'Lune', arrivee: p.plan.arrivee, reste: p.plan.arrivee - t }])
    const [apres] = lignesDuBandeau(jeu, p.plan.arrivee + 60_000)
    expect(apres.genre === 'orbite' && apres.centre).toBe('Lune')
  })

  it('à côté d’un engin : la distance à lui, sans durée de tour', () => {
    const jeu = new Jeu()
    const m = jeu.mission
    const p = planifier(m.etatHeliocentrique(t0), 'ISS', t0, 30)
    if (!p.possible) throw new Error('impossible')
    m.partir(p.plan)
    const [l] = lignesDuBandeau(jeu, p.plan.arrivee + 60_000)
    expect(l).toMatchObject({ genre: 'orbite', centre: 'ISS', engin: true, tour: null })
  })

  it('une mission acceptée : aller sur le lieu, puis sur place, puis action en cours', () => {
    const jeu = new Jeu()
    jeu.proposes = [{ id: 7, genre: 'depanner', etapes: [{ lieu: 'Hubble', action: 'reparer' }], recompense: 60 }]
    jeu.accepter(7, t0)
    expect(lignesDuBandeau(jeu, t0).map((l) => l.genre)).toEqual(['contrat', 'orbite'])
    expect(lignesDuBandeau(jeu, t0)[0]).toMatchObject({ situation: 'aller', etape: { lieu: 'Hubble' } })
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Hubble', t0, 30)
    if (!p.possible) throw new Error('impossible')
    jeu.mission.partir(p.plan)
    expect(lignesDuBandeau(jeu, t0 + 1000).map((l) => l.genre)).toEqual(['trajet', 'contrat'])
    const t = p.plan.arrivee + 1000
    expect(lignesDuBandeau(jeu, t)[0]).toMatchObject({ genre: 'contrat', situation: 'sur-place' })
    jeu.agir(t)
    expect(lignesDuBandeau(jeu, t + 1000)[0]).toMatchObject({ genre: 'contrat', situation: 'action', finAction: t + 120_000 })
  })
})
