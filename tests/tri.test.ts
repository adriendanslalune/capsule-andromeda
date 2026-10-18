import { describe, expect, it } from 'vitest'
import { BACS, DUREE_TRI, GAIN_PAR_OBJET, OBJETS_EPAVE, SERIE_MAX } from '../src/donnees/tri'
import { nouveauTri, resteTri, trier } from '../src/moteur/tri'

const t0 = 5_000_000

describe('le tri des matériaux d’une épave', () => {
  it('chaque bac a des objets, et chaque objet un bac qui existe', () => {
    for (const b of BACS) expect(OBJETS_EPAVE.filter((o) => o.bac === b.bac).length).toBeGreaterThanOrEqual(3)
  })

  it('les objets se suivent sans jamais se répéter deux fois de suite ; même graine, même suite', () => {
    const a = nouveauTri(7, t0), b = nouveauTri(7, t0)
    for (let k = 0; k < 100; k++) {
      const avant = a.objet
      expect(a.objet).toBe(b.objet)
      trier(a, 'rebut', t0); trier(b, 'rebut', t0)
      expect(a.objet).not.toBe(avant)
    }
  })

  it('bien trier fait monter la série (jusqu’à ×5) et le gain ; une erreur remet la série à 1', () => {
    const e = nouveauTri(3, t0)
    let attendu = 0
    for (let k = 1; k <= 7; k++) {
      attendu += GAIN_PAR_OBJET * Math.min(k, SERIE_MAX)
      expect(trier(e, OBJETS_EPAVE[e.objet].bac, t0 + k)).toBe('juste')
    }
    expect(e.gain).toBe(attendu)
    expect(e.serie).toBe(SERIE_MAX)
    const faux = BACS.find((b) => b.bac !== OBJETS_EPAVE[e.objet].bac)!.bac
    expect(trier(e, faux, t0 + 10)).toBe('faux')
    expect(e.serie).toBe(1)
    expect(e.erreurs).toBe(1)
    expect(Object.values(e.tries).reduce((a, b) => a + b, 0)).toBe(7)
  })

  it('le temps est compté', () => {
    const e = nouveauTri(1, t0)
    expect(resteTri(e, t0 + 1000)).toBe(DUREE_TRI - 1000)
    expect(trier(e, 'metal', t0 + DUREE_TRI)).toBe('fini')
  })
})
