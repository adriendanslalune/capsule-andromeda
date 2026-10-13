import { describe, expect, it } from 'vitest'
import { choisirAuHasard, entierAuHasard, mulberry32 } from '../src/moteur/hasard'

// Copie exacte de la fonction `rng` du prototype v0.1, pour vérifier que le portage est identique.
function rngPrototype(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let q = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q
    return ((q ^ (q >>> 14)) >>> 0) / 4294967296
  }
}

function tirages(hasard: () => number, n: number): number[] {
  return Array.from({ length: n }, () => hasard())
}

describe('mulberry32', () => {
  it('donne exactement les mêmes nombres que le prototype', () => {
    // Graines utilisées par le jeu : saison 0 et 1 du visiteur, contrats du 13 octobre 2026, transmissions.
    for (const graine of [13, 1 * 7919 + 13, 20261013, 7, 123456 * 31 + 7, 0, -5]) {
      expect(tirages(mulberry32(graine), 50)).toEqual(tirages(rngPrototype(graine), 50))
    }
  })

  it('la même graine redonne la même suite', () => {
    expect(tirages(mulberry32(42), 20)).toEqual(tirages(mulberry32(42), 20))
  })

  it('deux graines différentes donnent des suites différentes', () => {
    expect(tirages(mulberry32(1), 5)).not.toEqual(tirages(mulberry32(2), 5))
  })

  it('reste dans [0, 1[', () => {
    for (const x of tirages(mulberry32(99), 10_000)) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('tirages utilitaires', () => {
  it('entierAuHasard reste entre 0 et n − 1 et atteint chaque valeur', () => {
    const vus = new Set<number>()
    const hasard = mulberry32(3)
    for (let i = 0; i < 1000; i++) {
      const n = entierAuHasard(hasard, 6)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(6)
      vus.add(n)
    }
    expect(vus.size).toBe(6)
  })

  it('choisirAuHasard prend un élément de la liste', () => {
    const liste = ['bleu', 'rouge', 'vert', 'jaune']
    const hasard = mulberry32(8)
    for (let i = 0; i < 100; i++) expect(liste).toContain(choisirAuHasard(hasard, liste))
  })
})
