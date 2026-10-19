import { describe, expect, it } from 'vitest'
import { CODES_ENERGIE } from '../src/donnees/manuel-energie'
import { Jeu, numeroDeSerie } from '../src/moteur/jeu'
import { BLOCAGE_ERREUR, solution, tourEnergie, type TourEnergie } from '../src/moteur/reparation'

const t0 = Date.UTC(2026, 9, 18, 12)

/** Fait le bon geste du tour en cours (selon le manuel), comme un joueur attentif. */
function bienJouer(jeu: Jeu, t: number) {
  const r = jeu.reparation('bornier')!
  const s = solution(tourEnergie(r.graine, r.tour), jeu.numeroSerie)
  if ('isolerDeuxFois' in s) { jeu.geste('bornier', { genre: 'isoler' }, t); return jeu.geste('bornier', { genre: 'isoler' }, t) }
  jeu.geste('bornier', { genre: 'couper', cable: s.couper }, t)
  return jeu.geste('bornier', { genre: 'isoler' }, t)
}

describe('le manuel, section Énergie', () => {
  it('64 codes de diagnostic différents, chacun avec un circuit et une règle', () => {
    expect(CODES_ENERGIE).toHaveLength(64)
    expect(new Set(CODES_ENERGIE.map((c) => c.code)).size).toBe(64)
    for (const c of CODES_ENERGIE) expect(c.code).toMatch(/^E-[1-9][A-F][1-9]$/)
  })

  it('numéros de série au format AN-7Q3, différents d’une partie à l’autre', () => {
    const vus = new Set(Array.from({ length: 200 }, (_, k) => numeroDeSerie(k * 7919 + 1)))
    for (const n of vus) expect(n).toMatch(/^[A-Z]{2}-[1-9][A-Z][0-9]$/)
    expect(vus.size).toBeGreaterThan(190)
  })
})

describe('un tour de réparation', () => {
  it('le panneau est reproductible, et chaque tour a toujours une solution', () => {
    for (let g = 1; g < 400; g++) {
      for (let k = 0; k < 3; k++) {
        const a = tourEnergie(g * 7, k)
        expect(tourEnergie(g * 7, k)).toEqual(a)
        expect(a.cables.length).toBeGreaterThanOrEqual(5)
        expect(a.cables.filter((c) => c.circuit === a.diagnostic.circuit).length).toBeGreaterThanOrEqual(2)
        const s = solution(a, 'BX-2K8')
        if ('couper' in s) expect(a.cables[s.couper].circuit).toBe(a.diagnostic.circuit)
      }
    }
  })

  it('les règles du manuel (exemples)', () => {
    const tour = (regle: string, voyants: boolean[], cables: [string, string, number][], pressionRouge = false): TourEnergie => ({
      diagnostic: { code: 'E-3A7', circuit: 'β', regle: regle as TourEnergie['diagnostic']['regle'] },
      voyants: voyants as TourEnergie['voyants'], pressionRouge,
      cables: cables.map(([couleur, circuit, chiffre]) => ({ couleur, circuit, chiffre } as TourEnergie['cables'][number])),
    })
    const borne: [string, string, number][] = [['rouge', 'α', 1], ['rouge', 'β', 3], ['bleu', 'β', 4], ['blanc', 'γ', 5], ['rouge', 'β', 7], ['blanc', 'β', 2]]
    // L'exemple de la maquette : 2 voyants allumés, 2 câbles rouges dans β → le dernier rouge de β (n° 4).
    expect(solution(tour('R2', [true, false, true, false], borne), 'AN-7Q3')).toEqual({ couper: 4 })
    expect(solution(tour('R1', [false, false, false, false], borne), 'X')).toEqual({ couper: 5 })
    expect(solution(tour('R5', [false, true, false, true], borne), 'X')).toEqual({ isolerDeuxFois: true })
    expect(solution(tour('R5', [false, false, false, true], borne), 'X')).toEqual({ couper: 2 })
    expect(solution(tour('R6', [false, false, false, false], borne, true), 'X')).toEqual({ couper: 4 })
    expect(solution(tour('R6', [false, false, false, false], borne, false), 'X')).toEqual({ couper: 5 })
    // R4 : un seul blanc dans β (n° 5), quel que soit le numéro ; et l'exception des capsules AN-7.
    expect(solution(tour('R4', [false, false, false, false], borne), 'BX-2K8')).toEqual({ couper: 5 })
  })
})

describe('réparer l’Énergie sur le panneau', () => {
  it('en suivant le manuel, 2 ou 3 tours, puis l’Énergie marche de nouveau', () => {
    const jeu = new Jeu()
    jeu.casser('energie')
    jeu.defauts.energie = ['bornier']
    const tours = jeu.reparation('bornier')!.tours
    expect([2, 3]).toContain(tours)
    for (let k = 0; k < tours - 1; k++) expect(bienJouer(jeu, t0)).toBe('tour-suivant')
    expect(bienJouer(jeu, t0)).toBe('repare')
    expect(jeu.enPanne('energie')).toBe(false)
    expect(jeu.reparations.bornier).toBeUndefined()
  })

  it('une erreur bloque le module 30 secondes, sans rien casser de plus', () => {
    const jeu = new Jeu()
    jeu.casser('energie')
    jeu.defauts.energie = ['bornier']
    const r = jeu.reparation('bornier')!
    const s = solution(tourEnergie(r.graine, r.tour), jeu.numeroSerie)
    const mauvais = 'couper' in s ? (s.couper + 1) % tourEnergie(r.graine, 0).cables.length : 0
    expect(jeu.geste('bornier', { genre: 'couper', cable: mauvais }, t0)).toBe('erreur')
    expect(jeu.geste('bornier', { genre: 'couper', cable: 0 }, t0 + 1000)).toBe('bloque')
    expect(jeu.geste('bornier', { genre: 'isoler' }, t0 + BLOCAGE_ERREUR - 1)).toBe('bloque')
    expect(r.tour).toBe(0)
    expect(bienJouer(jeu, t0 + BLOCAGE_ERREUR)).not.toBe('erreur')
  })

  it('basculer ISOLER sans avoir coupé le bon câble est une erreur', () => {
    const jeu = new Jeu()
    jeu.casser('energie')
    jeu.defauts.energie = ['bornier']
    let r = jeu.reparation('bornier')!
    // Cherche une partie où le premier tour demande un câble (pas « ISOLER deux fois »).
    for (let g = 1; 'isolerDeuxFois' in solution(tourEnergie(r.graine, 0), jeu.numeroSerie); g++) {
      jeu.reparations = {}
      jeu.graine = g
      r = jeu.reparation('bornier')!
    }
    expect(jeu.geste('bornier', { genre: 'isoler' }, t0)).toBe('erreur')
  })

  it('chaque nouvelle panne de l’Énergie demande une réparation différente', () => {
    const jeu = new Jeu()
    const codes = new Set<string>()
    for (let k = 0; k < 20; k++) {
      jeu.casser('energie')
      jeu.defauts.energie = ['bornier']
      const r = jeu.reparation('bornier')!
      codes.add(tourEnergie(r.graine, 0).diagnostic.code)
      jeu.reparer('energie')
    }
    expect(codes.size).toBeGreaterThan(12)
  })
})
