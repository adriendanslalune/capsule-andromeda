import { describe, expect, it } from 'vitest'
import { Jeu } from '../src/moteur/jeu'
import { avancerQuetes } from '../src/moteur/quetes'
import { orbiteAutour } from '../src/moteur/mission'
import { position } from '../src/moteur/corps'

// Signalé par Adrien le 24/10/2026 (la quête de Rosa validée avec 2,5 t de circuits anciens au lieu de 3).
describe('une livraison de quête', () => {
  const t = Date.UTC(2026, 9, 24, 12)
  const enOrbiteATiangong = (tonnes: number) => {
    const j = new Jeu()
    j.quetes.q1 = { etape: 9, compte: 0, debut: 0, fin: 0 }
    j.quetes.rosa = { etape: 0, compte: 0, debut: t, fin: null }
    const p = position('Tiangong', t)
    j.mission.orbite = orbiteAutour('Tiangong', t, { x: p.x + 0.05, y: p.y, z: p.z })
    expect(j.lieuEnOrbite(t)).toBe('Tiangong')
    j.soute = { 'Circuits anciens': tonnes }
    return j
  }
  it('2,5 t ne suffisent pas pour 3 t : rien n’est pris', () => {
    const j = enOrbiteATiangong(2.5)
    avancerQuetes(j, { genre: 'instant' }, t)
    expect(j.quetes.rosa.etape).toBe(0)
    expect(j.soute['Circuits anciens']).toBe(2.5)
  })
  it('5,5 t : les 3 t sont prises, il en reste 2,5', () => {
    const j = enOrbiteATiangong(5.5)
    avancerQuetes(j, { genre: 'instant' }, t)
    expect(j.quetes.rosa.etape).toBe(1)
    expect(j.soute['Circuits anciens']).toBe(2.5)
  })
})
