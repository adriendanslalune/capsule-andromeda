import { describe, expect, it } from 'vitest'
import { lignesDuBandeau } from '../src/moteur/bandeau'
import { Mission, planifier } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 17, 12)

describe('bandeau d’alertes', () => {
  it('au départ : l’état calme, en orbite basse autour de la Terre', () => {
    const [l] = lignesDuBandeau(new Mission(), t0)
    expect(l.genre).toBe('orbite')
    if (l.genre !== 'orbite') return
    expect(l.centre).toBe('Terre')
    expect(l.altitude).toBeCloseTo(400, 0)
    expect(l.tour! / 60).toBeCloseTo(92.4, 0)
  })

  it('en route : la destination, l’heure d’arrivée et le temps restant ; puis en orbite à l’arrivée', () => {
    const m = new Mission()
    const p = planifier(m.etatHeliocentrique(t0), 'Lune', t0, 30)
    if (!p.possible) throw new Error('impossible')
    m.partir(p.plan)
    const t = t0 + 3_600_000
    expect(lignesDuBandeau(m, t)).toEqual([{ genre: 'trajet', cible: 'Lune', arrivee: p.plan.arrivee, reste: p.plan.arrivee - t }])
    const [apres] = lignesDuBandeau(m, p.plan.arrivee + 60_000)
    expect(apres.genre === 'orbite' && apres.centre).toBe('Lune')
  })

  it('à côté d’un engin : la distance à lui, sans durée de tour', () => {
    const m = new Mission()
    const p = planifier(m.etatHeliocentrique(t0), 'ISS', t0, 30)
    if (!p.possible) throw new Error('impossible')
    m.partir(p.plan)
    const [l] = lignesDuBandeau(m, p.plan.arrivee + 60_000)
    expect(l).toMatchObject({ genre: 'orbite', centre: 'ISS', engin: true, tour: null })
  })
})
