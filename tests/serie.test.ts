import { describe, expect, it } from 'vitest'
import { LETTRES_SERIE } from '../src/donnees/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import {
  commenceParVoyelle,
  dernierChiffre,
  dernierChiffrePair,
  estSerieValide,
  genererSerie,
} from '../src/moteur/serie'

describe('numéro de série', () => {
  it('respecte toujours le format LLC-CCL', () => {
    const hasard = mulberry32(2026)
    for (let i = 0; i < 2000; i++) {
      const serie = genererSerie(hasard)
      expect(serie).toMatch(/^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/)
      expect(estSerieValide(serie)).toBe(true)
    }
  })

  it("n'utilise jamais I, O ni Q", () => {
    expect(LETTRES_SERIE).not.toMatch(/[IOQ]/)
    const hasard = mulberry32(7)
    for (let i = 0; i < 2000; i++) expect(genererSerie(hasard)).not.toMatch(/[IOQ]/)
  })

  it('est reproductible avec une graine', () => {
    expect(genererSerie(mulberry32(5))).toBe(genererSerie(mulberry32(5)))
  })

  it('reconnaît les formats invalides', () => {
    expect(estSerieValide('KE4-71B')).toBe(true)
    expect(estSerieValide('KE4-71')).toBe(false)
    expect(estSerieValide('KI4-71B')).toBe(false) // I interdit
    expect(estSerieValide('ke4-71b')).toBe(false)
    expect(estSerieValide('KE471B')).toBe(false)
  })
})

describe('indices tirés du numéro de série', () => {
  it("le dernier chiffre est celui juste avant la lettre finale (exemple du manuel : KE4-71B)", () => {
    expect(dernierChiffre('KE4-71B')).toBe(1)
    expect(dernierChiffre('AB0-36Z')).toBe(6)
    expect(dernierChiffre('ZZ9-00A')).toBe(0)
  })

  it('pair ou impair', () => {
    expect(dernierChiffrePair('KE4-71B')).toBe(false)
    expect(dernierChiffrePair('KE4-70B')).toBe(true)
    expect(dernierChiffrePair('KE4-78B')).toBe(true)
  })

  it('commence par une voyelle : A, E, I, O, U ou Y', () => {
    for (const v of ['A', 'E', 'U', 'Y']) expect(commenceParVoyelle(`${v}B1-23C`)).toBe(true)
    for (const c of ['B', 'K', 'W', 'Z']) expect(commenceParVoyelle(`${c}A1-23C`)).toBe(false)
  })

  it('tous les cas se présentent : pair, impair, voyelle, consonne', () => {
    const hasard = mulberry32(11)
    const cas = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      const s = genererSerie(hasard)
      cas.add(`${dernierChiffrePair(s)}-${commenceParVoyelle(s)}`)
    }
    expect(cas.size).toBe(4)
  })
})
