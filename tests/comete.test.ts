import { describe, expect, it } from 'vitest'
import { position } from '../src/moteur/corps'
import { activiteComete, HALLEY, orbitePetitCorps, petitCorps, positionPetitCorps } from '../src/moteur/petits-corps'
import { UA_KM } from '../src/moteur/temps'

const dist = (p: { x: number; y: number; z: number }) => Math.hypot(p.x, p.y, p.z) / UA_KM
const ou = (nom: string, t: number) => dist(positionPetitCorps(petitCorps(nom)!, t))

describe('la comète de Halley', () => {
  it('au plus près du Soleil le 9 février 1986, à 0,59 UA', () => {
    expect(ou(HALLEY, Date.UTC(1986, 1, 9, 11))).toBeCloseTo(0.586, 2)
  })
  it('au plus loin fin 2023, à 35 UA, et encore au-delà de Neptune en 2026', () => {
    expect(ou(HALLEY, Date.UTC(2023, 11, 9))).toBeGreaterThan(35)
    const d = ou(HALLEY, Date.UTC(2026, 9, 22))
    expect(d).toBeGreaterThan(33.5)
    expect(d).toBeLessThan(35.2)
  })
  it('revient tous les 75 ans environ (prochain passage en 2061 ; sans les planètes, deux mois trop tôt)', () => {
    expect(ou(HALLEY, Date.UTC(2061, 5, 1))).toBeLessThan(0.7)
  })
  it('son orbite va de 0,59 à 35 UA ; sa traînée ne s\'éteint jamais', () => {
    const o = orbitePetitCorps(petitCorps(HALLEY)!, 512).map(dist)
    expect(Math.min(...o)).toBeCloseTo(0.586, 2)
    expect(Math.max(...o)).toBeGreaterThan(35)
    expect(activiteComete(petitCorps(HALLEY)!, Date.UTC(2026, 9, 22))).toBe(1)
  })
})

describe('les autres petits corps célèbres', () => {
  it('Hale-Bopp au plus près le 1er avril 1997, aujourd\'hui à plus de 50 UA, sans traînée', () => {
    expect(ou('Comète Hale-Bopp', Date.UTC(1997, 3, 1, 15))).toBeCloseTo(0.914, 1)
    expect(ou('Comète Hale-Bopp', Date.UTC(2026, 9, 22))).toBeGreaterThan(50)
    expect(activiteComete(petitCorps('Comète Hale-Bopp')!, Date.UTC(2026, 9, 22))).toBe(0)
  })
  it('Cérès reste dans la ceinture d\'astéroïdes', () => {
    for (let a = 2026; a < 2032; a++) { const d = ou('Cérès', Date.UTC(a, 0, 1)); expect(d).toBeGreaterThan(2.5); expect(d).toBeLessThan(3) }
  })
  it('Apophis frôle la Terre le 13 avril 2029', () => {
    const t = Date.UTC(2029, 3, 13, 21, 46)
    const a = positionPetitCorps(petitCorps('Apophis')!, t), terre = position('Terre', t)
    // Sans l'attraction de la Terre, le frôlement est juste à quelques centaines de milliers de km près.
    expect(Math.hypot(a.x - terre.x, a.y - terre.y, a.z - terre.z)).toBeLessThan(1_000_000)
  })
  it('ʻOumuamua est passé au plus près le 9 septembre 2017 et repart pour toujours', () => {
    expect(ou('ʻOumuamua', Date.UTC(2017, 8, 9))).toBeCloseTo(0.256, 2)
    const d2026 = ou('ʻOumuamua', Date.UTC(2026, 9, 22)), d2030 = ou('ʻOumuamua', Date.UTC(2030, 0, 1))
    expect(d2026).toBeGreaterThan(30)
    expect(d2030).toBeGreaterThan(d2026)
  })
  it('Sedna, au plus près du Soleil vers 2076, à 76 UA', () => {
    expect(ou('Sedna', Date.UTC(2076, 0, 1))).toBeCloseTo(76.2, 0)
  })
})
