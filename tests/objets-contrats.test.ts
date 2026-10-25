import { describe, expect, it } from 'vitest'
import { sorteEpave } from '../src/carte/objets-contrats'

describe('la sorte d\'une épave', () => {
  it('se lit dans son nom', () => {
    expect(sorteEpave('Satellite mort V-3')).toBe('satellite')
    expect(sorteEpave('Réservoir crevé V-1')).toBe('etage')
    expect(sorteEpave('Module habitable B-2')).toBe('station')
    expect(sorteEpave('Conteneur à la dérive V-2')).toBe('cargo')
  })
  it('une épave célèbre en a toujours une, la même', () => {
    expect(sorteEpave('Kosmos 482')).toBe(sorteEpave('Kosmos 482'))
    expect(['satellite', 'etage', 'station', 'cargo']).toContain(sorteEpave('Telstar 1'))
  })
})
