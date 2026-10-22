import { describe, expect, it } from 'vitest'
import { DISPARUS, ECHO_PROCHE, NOMBRE_DISPARUS, ZONE_RECHERCHE, disparu } from '../src/donnees/disparus'
import { corps, position, zoneDuDisparu } from '../src/moteur/corps'
import { detecter, identifier, nouveauxDisparus, ouChercher } from '../src/moteur/disparus'
import { Jeu } from '../src/moteur/jeu'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'
import { PORTEE_RADAR } from '../src/moteur/radar'
import { DOSSIERS } from '../src/donnees/dossiers-disparus'

const t0 = Date.UTC(2026, 9, 21, 12)
const ecart = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

describe('les Disparus (idée validée par Adrien le 21/10/2026)', () => {
  it('quarante vraies sondes, chacune à sa place : posées sur leur astre, ou perdues autour du Soleil, ou aux confins', () => {
    expect(NOMBRE_DISPARUS).toBe(40)
    expect(new Set(DISPARUS.map((d) => d.nom)).size).toBe(40)
    for (const d of DISPARUS) {
      expect(corps(d.nom), d.nom).toBeDefined()
      const p = position(d.nom, t0)
      expect(Number.isFinite(p.x + p.y + p.z), d.nom).toBe(true)
      if (d.lieu.genre === 'sol') expect(ecart(p, position(d.lieu.astre, t0)) / corps(d.lieu.astre)!.rayon, d.nom).toBeCloseTo(1.002, 3)
    }
    // Pioneer 10 : sur sa vraie trajectoire, à plus de 130 UA.
    expect(ecart(position('Pioneer 10', t0), { x: 0, y: 0, z: 0 }) / 149_597_870.7).toBeGreaterThan(130)
  })

  it('posée sur la Lune : son écho n’arrive que si on passe au-dessus d’elle, de près', () => {
    const d = disparu('Luna 9')!
    const p = position(d.nom, t0), c = position('Lune', t0)
    const dessus = { x: c.x + (p.x - c.x) * 1.5, y: c.y + (p.y - c.y) * 1.5, z: c.z + (p.z - c.z) * 1.5 }
    const dessous = { x: c.x - (p.x - c.x) * 1.5, y: c.y - (p.y - c.y) * 1.5, z: c.z - (p.z - c.z) * 1.5 }
    const loin = { x: p.x + ECHO_PROCHE * 2, y: p.y, z: p.z }
    expect(detecter(nouveauxDisparus(), dessous, t0).some((x) => x.nom === d.nom)).toBe(false)
    expect(detecter(nouveauxDisparus(), loin, t0).some((x) => x.nom === d.nom)).toBe(false)
    const e = nouveauxDisparus()
    expect(detecter(e, dessus, t0).some((x) => x.nom === d.nom)).toBe(true)
    expect(detecter(e, dessus, t0)).toEqual([]) // une seule fois
  })

  it('perdue autour du Soleil : la zone de recherche est près d’elle, sans être dessus ; le radar la capte à sa portée', () => {
    const d = disparu('Mars Observer')!
    const p = position(d.nom, t0), z = position(zoneDuDisparu(d.nom), t0)
    expect(ecart(p, z)).toBeGreaterThan(PORTEE_RADAR) // au centre de la zone, il faut encore chercher
    expect(ecart(p, z)).toBeLessThan(ZONE_RECHERCHE)
    expect(ouChercher(d)).toEqual({ lieu: zoneDuDisparu(d.nom), zone: true })
    expect(ouChercher(disparu('Beagle 2')!)).toEqual({ lieu: 'Mars', zone: false })
    expect(detecter(nouveauxDisparus(), { x: p.x + 0.8 * PORTEE_RADAR, y: p.y, z: p.z }, t0).some((x) => x.nom === d.nom)).toBe(true)
  })

  it('rejointe, la sonde est identifiée (une fois), rapporte de l’XP ; c’est sauvegardé', () => {
    const e = nouveauxDisparus()
    e.suivi = 3
    expect(identifier(e, 'Luna 9', t0)?.numero).toBe(3)
    expect(identifier(e, 'Luna 9', t0)).toBeNull()
    expect(e.suivi).toBeNull()
    const jeu = new Jeu()
    jeu.disparus.trouves = { 3: t0 }
    jeu.disparus.echos = { 7: t0 }
    jeu.disparus.suivi = 12
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.disparus).toEqual(jeu.disparus)
  })

  it('chaque sonde a son dossier : le voyage, le jour de la perte et pourquoi (demande d\'Adrien du 22/10/2026)', () => {
    expect(Object.keys(DOSSIERS).length).toBe(NOMBRE_DISPARUS)
    for (const d of DISPARUS) {
      const dossier = DOSSIERS[d.numero]
      expect(dossier, d.nom).toBeDefined()
      expect(dossier.voyage.length, d.nom).toBeGreaterThan(40)
      expect(dossier.cause.length, d.nom).toBeGreaterThan(40)
      expect(dossier.perte, d.nom).toMatch(/^(1er|\d{1,2}) [a-zéû]+ (19|20)\d\d$/)
    }
  })
})
