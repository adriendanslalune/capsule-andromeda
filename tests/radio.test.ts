import { describe, expect, it } from 'vitest'
import { STATIONS_MORSE } from '../src/donnees/modules'
import { FREQUENCES_RESERVEES, FREQUENCES_VISITEUR, RADIO, STATIONS_RADIO } from '../src/donnees/radio'
import { reglerRadioSur } from '../src/moteur/chasse'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { distance, positionAstre } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { capter, frequenceVisiteur, retardTerre } from '../src/moteur/radio'

const T0 = Date.UTC(2026, 9, 13, 12)
const partie = (): EtatPartie => creerPartie(T0, mulberry32(1), 'La Pie voleuse')
const sur = (f: number) => reglerRadioSur(partie(), f)

describe('poste radio', () => {
  it('toutes les fréquences sont distinctes : deux stations ne se brouillent jamais', () => {
    const toutes = [...Object.values(STATIONS_RADIO), ...Object.values(STATIONS_MORSE), ...Object.values(FREQUENCES_RESERVEES), ...FREQUENCES_VISITEUR]
    for (let i = 0; i < toutes.length; i++) {
      expect(toutes[i]).toBeGreaterThanOrEqual(RADIO.min)
      expect(toutes[i]).toBeLessThanOrEqual(RADIO.max)
      for (let j = i + 1; j < toutes.length; j++) expect(Math.abs(toutes[i] - toutes[j]), `${toutes[i]} / ${toutes[j]}`).toBeGreaterThan(RADIO.tolerance * 2)
    }
  })

  it('réglage au centième, borné de 0 à 12', () => {
    expect(sur(3.456).chasse.frequenceRadio).toBe(3.46)
    expect(sur(15).chasse.frequenceRadio).toBe(12)
    expect(sur(-1).chasse.frequenceRadio).toBe(0)
  })

  it('net à ± 0,05, brouillé jusqu’à ± 0,30, souffle au-delà', () => {
    const f = STATIONS_RADIO.observatoire
    expect(capter(sur(f + 0.05), T0).nettete).toBe(1)
    const b = capter(sur(f + 0.15), T0)
    expect(b.emission?.sorte).toBe('observatoire')
    expect(b.nettete).toBeGreaterThan(0)
    expect(b.nettete).toBeLessThan(1)
    expect(capter(sur(f + 0.31), T0).emission).toBeNull()
  })

  it('les 10 stations morse émettent leur indicatif sur leur fréquence du manuel', () => {
    for (const [indicatif, f] of Object.entries(STATIONS_MORSE)) {
      expect(capter(sur(f), T0).emission).toEqual({ sorte: 'morse', indicatif })
    }
  })

  it('le visiteur ne s’entend pas : sur sa fréquence, rien que du souffle', () => {
    expect(capter(sur(frequenceVisiteur(T0)), T0).emission).toBeNull()
  })

  it('Radio-Terre : le top horaire arrive avec le retard de la lumière depuis la Terre', () => {
    const e = { ...sur(STATIONS_RADIO.radioTerre), fusee: { ...partie().fusee, orbite: null, position: positionAstre('Mars', T0) } }
    const r = capter(e, T0).emission
    expect(r?.sorte).toBe('radio-terre')
    if (r?.sorte !== 'radio-terre') return
    const attendu = distance(positionAstre('Mars', T0), positionAstre('Terre', T0)) * 499.0048
    expect(r.retard).toBeCloseTo(attendu, 6)
    expect(retardTerre(e, T0)).toBeCloseTo(attendu, 6)
    expect(T0 - r.topHoraire).toBeCloseTo(attendu * 1000, 3)
    expect(r.texte.length).toBeGreaterThan(10)
  })
})
