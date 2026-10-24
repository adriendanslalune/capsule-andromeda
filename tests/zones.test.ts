import { describe, expect, it } from 'vitest'
import { ALIENS } from '../src/donnees/espace'
import { MARCHES } from '../src/donnees/marche'
import { QUETES } from '../src/donnees/quetes'
import { ZONES_A_LIBERER } from '../src/donnees/zones'
import { chef, nouveauCombat } from '../src/moteur/combat'
import { corps, position } from '../src/moteur/corps'
import { alienLa } from '../src/moteur/espace'
import { Jeu } from '../src/moteur/jeu'
import { accepter, avancerQuetes, disponibles, liberation, objectif, quete } from '../src/moteur/quetes'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'
import { ajouterPoints, estLibre, jauge, zoneDuLieu, zoneProche } from '../src/moteur/zones'

const t0 = Date.UTC(2026, 9, 21, 12)

describe('la libération des zones (décisions d’Adrien du 21/10/2026)', () => {
  it('27 zones : chaque planète et chaque grande lune ; la Terre libre dès le départ ; une planète plus dure qu’une lune', () => {
    expect(ZONES_A_LIBERER).toHaveLength(27)
    for (const z of ZONES_A_LIBERER) expect(corps(z.nom), z.nom).toBeDefined()
    const lune = ZONES_A_LIBERER.find((z) => z.nom === 'Io')!, planete = ZONES_A_LIBERER.find((z) => z.nom === 'Jupiter')!
    expect(planete.seuil).toBeGreaterThan(lune.seuil)
    const jeu = new Jeu()
    expect(estLibre(jeu.zones, 'Terre')).toBe(true)
    expect(estLibre(jeu.zones, 'ISS')).toBe(true)
    expect(estLibre(jeu.zones, 'Lune')).toBe(false)
    expect(zoneDuLieu('Station Arès')).toBe('Mars')
    expect(zoneDuLieu('Hubble')).toBe('Terre')
  })

  it('la jauge monte de 0 à 100 % et annonce ses paliers ; l’activité va à la zone pas encore libre la plus proche', () => {
    const jeu = new Jeu()
    expect(jauge(jeu.zones, 'Lune')).toBe(0)
    expect(ajouterPoints(jeu.zones, 'Lune', 30)).toEqual(['Résistance de la Lune : 25 %'])
    expect(ajouterPoints(jeu.zones, 'Lune', 500)[0]).toContain('100 %')
    expect(jauge(jeu.zones, 'Lune')).toBe(100)
    // Près de la Terre, la seule zone à libérer est la Lune ; près de Jupiter, Io est plus proche que Callisto.
    expect(zoneProche(jeu.zones, position('ISS', t0), t0)).toBe('Lune')
    expect(zoneProche(jeu.zones, position('Io', t0), t0)).toBe('Io')
    jeu.libererZone('Lune')
    expect(zoneProche(jeu.zones, position('ISS', t0), t0)).toBeNull()
  })

  it('un contrat fini et un chasseur abattu font monter la résistance', () => {
    const jeu = new Jeu()
    const alien = ALIENS.find((a) => a.parent === 'Terre')!.nom
    jeu.vaincreChasseur(alien, t0)
    expect(jeu.zones.points.Lune).toBe(6)
    jeu.voixEnregistree(t0)
    expect(jeu.zones.points.Lune).toBe(8)
  })

  it('le comptoir n’existe que si la planète du système est libre ; les chasseurs d’une planète libérée ne reviennent plus', () => {
    const jeu = new Jeu()
    expect(MARCHES.filter((m) => estLibre(jeu.zones, m.lieu)).map((m) => m.nom)).toEqual(['Terre'])
    const martien = ALIENS.find((a) => a.parent === 'Mars')!.nom
    expect(alienLa(jeu.espace, martien, t0)).toBe(true)
    jeu.libererZone('Mars')
    expect(estLibre(jeu.zones, 'Mars')).toBe(true)
    expect(alienLa(jeu.espace, martien, t0)).toBe(false)
    // Et c'est sauvegardé (l'espace le sait aussi après relecture).
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.zones.liberees).toEqual(['Mars'])
    expect(alienLa(copie.espace, martien, t0)).toBe(false)
  })

  it('les zones visitées : la Terre au départ, puis celles où la capsule se met en orbite (elle ou ce qui tourne autour)', () => {
    const jeu = new Jeu() as Jeu & { ici: string | null }
    expect(jeu.visites).toEqual(['Terre'])
    jeu.ici = 'Station Arès'
    jeu.lieuEnOrbite = () => jeu.ici
    jeu.avancer(t0)
    expect(jeu.visites).toEqual(['Terre', 'Mars'])
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.visites).toEqual(['Terre', 'Mars'])
  })

  it('les quêtes secondaires d’un PNJ ne s’ouvrent qu’une fois sa zone libérée', () => {
    const jeu = new Jeu()
    jeu.quetes.q1 = { etape: 9, compte: 0, debut: t0, fin: t0 }
    // Rosa (Tiangong) et le Veilleur (Hubble) sont dans le système de la Terre, libre.
    expect(disponibles(jeu).filter((q) => q.type === 'secondaire').map((q) => q.id).sort()).toEqual(['rosa', 'veilleur'])
  })

  it('la campagne : chaque zone a sa quête de libération (jauge, assaut, retour au PNJ) ; l’ordre des systèmes', () => {
    for (const z of ZONES_A_LIBERER) {
      const q = QUETES.find((x) => x.libere === z.nom)
      expect(q, z.nom).toBeDefined()
      expect(q!.type).toBe('principale')
      // La jauge, puis l'assaut (les arcs écrits à la main : à la fin ; les autres : suivis du retour au PNJ).
      const g = q!.etapes.map((e) => e.genre)
      expect(g.indexOf('assaut')).toBe(g.indexOf('jauge') + 1)
    }
    // Les planètes intérieures s'ouvrent ensemble après la Lune, dans l'ordre qu'on veut ; Jupiter après elles.
    for (const n of ['mars', 'venus', 'mercure']) expect(quete(`liberer-${n}`).conditions).toEqual(['l3'])
    expect(quete('liberer-io').conditions).toEqual(['interieures'])
    expect(quete('interieures').etapes[0]).toMatchObject({ genre: 'liberer', zones: ['Mars', 'Vénus', 'Mercure'] })
    const jeu = new Jeu()
    jeu.quetes.l3 = { etape: 9, compte: 0, debut: t0, fin: t0 }
    accepter(jeu, 'interieures', t0)
    expect(objectif(jeu, quete('interieures'))?.compte).toBe('0/3')
    for (const z of ['Mercure', 'Mars', 'Vénus']) jeu.gagnerAssaut(z, t0)
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes.interieures.etape).toBe(1)
  })

  it('le vaisseau amiral : bien plus de points de vie qu’un chasseur, une planète plus qu’une lune', () => {
    const chasseur = chef(nouveauCombat(1, 12))!.pvMax
    const lune = chef(nouveauCombat(1, 12, { planete: false }))!.pvMax
    const planete = chef(nouveauCombat(1, 12, { planete: true }))!.pvMax
    expect(lune).toBeGreaterThan(2 * chasseur)
    expect(planete).toBeGreaterThan(lune)
  })

  it('une zone libérée : sa fenêtre (le PNJ de la Résistance, ce qui s’ouvre) et 2 minutes de feu d’artifice', () => {
    const jeu = new Jeu()
    jeu.gagnerAssaut('Lune', t0)
    expect(jeu.liberationsAAnnoncer).toEqual(['Lune'])
    expect(jeu.feuxEnCours(t0 + 60_000)).toEqual([{ zone: 'Lune', age: 60_000 }])
    expect(jeu.feuxEnCours(t0 + 121_000)).toEqual([])
    expect(jeu.feux).toEqual([])
    jeu.gagnerAssaut('Lune', t0 + 1000) // déjà libre : ni fenêtre ni feu de plus
    expect(jeu.liberationsAAnnoncer).toHaveLength(1)
    const l = liberation('Lune')
    expect(l.texte.join(' ')).toContain('Tycho')
    expect(l.ouvre).toContain('La cotation de la Compagnie Lunaire de Tycho')
    const mars = liberation('Mars')
    expect(mars.ouvre).toContain('Le comptoir de Mars')
    expect(mars.ouvre).toContain('Plus de chasseurs autour de Mars')
    for (const z of ZONES_A_LIBERER) expect(liberation(z.nom).pnj, z.nom).toBeDefined()
  })
})
