import { describe, expect, it } from 'vitest'
import { ATTENTE_PING, MONOLITHES, NOMBRE_MONOLITHES } from '../src/donnees/monolithes'
import {
  croisement, palierSuivant, statut, echoEnRoute, echosNonVus, emplacement, marquerEchosVus, localise, nouveauxMonolithes, peutPinger, pinger, placesPossibles, prochainPing, ramasser,
} from '../src/moteur/monolithes'
import { corps, position } from '../src/moteur/corps'
import { C_KM_S } from '../src/moteur/navigation'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'
import { Jeu } from '../src/moteur/jeu'

const UA = 149_597_870.7
const t0 = Date.UTC(2026, 9, 18, 12)
const H = 3_600_000

describe('les monolithes (idée d’Adrien du 18/10/2026)', () => {
  it('1000, numérotés, partout de Mercure à la ceinture de Kuiper, fixes par rapport au Soleil', () => {
    expect(MONOLITHES.length).toBe(NOMBRE_MONOLITHES)
    expect(new Set(MONOLITHES.map((m) => m.numero)).size).toBe(1000)
    const r = MONOLITHES.map((m) => Math.hypot(m.x, m.y) / UA)
    expect(Math.min(...r)).toBeLessThan(0.4)
    expect(Math.max(...r)).toBeGreaterThan(40)
    expect(r.filter((x) => x > 0.92 && x < 1.08).length).toBeGreaterThanOrEqual(100)
    const m = MONOLITHES[0]
    expect(corps(m.nom)?.type).toBe('monolithe')
    expect(position(m.nom, t0)).toEqual(position(m.nom, t0 + 1e10))
    expect(position(m.nom, t0)).toEqual({ x: m.x, y: m.y, z: 0 })
  })

  it('le PING : le plus proche répond, son écho revient à la vitesse de la lumière ; un PING par heure', () => {
    const e = nouveauxMonolithes()
    const ici = { x: UA, y: 0 }
    const echo = pinger(e, ici, t0)!
    const plusProche = MONOLITHES.reduce((a, b) => (Math.hypot(b.x - ici.x, b.y - ici.y) < Math.hypot(a.x - ici.x, a.y - ici.y) ? b : a))
    expect(echo.monolithe).toBe(plusProche.numero)
    expect(echo.retour - t0).toBeCloseTo((2 * echo.rayon / C_KM_S) * 1000, 3)
    expect(echoEnRoute(e, t0 + 1)).toBe(echo)
    expect(echoEnRoute(e, echo.retour)).toBeNull()
    expect(pinger(e, ici, t0 + H - 1)).toBeNull()
    expect(peutPinger(e, t0 + ATTENTE_PING)).toBe(echo.retour <= t0 + ATTENTE_PING)
    expect(prochainPing(e)).toBe(Math.max(t0 + H, echo.retour))
  })

  it('deux cercles se croisent en deux places ; un troisième pris ailleurs tranche', () => {
    const m = { x: 3e6, y: 4e6 }
    const echo = (cx: number, cy: number) => ({ monolithe: 1, centre: { x: cx, y: cy }, rayon: Math.hypot(m.x - cx, m.y - cy), envoye: 0, retour: 0 })
    const places = croisement(echo(0, 0), echo(1e6, 0))
    expect(places.length).toBe(2)
    expect(places.some((p) => Math.hypot(p.x - m.x, p.y - m.y) < 1)).toBe(true)
    const e = nouveauxMonolithes()
    e.echos.push(echo(0, 0), echo(1e6, 0))
    expect(placesPossibles(e, 1, 1).length).toBe(2)
    // Un troisième sur la même ligne ne tranche pas (les deux places sont symétriques).
    e.echos.push(echo(2e6, 0))
    expect(placesPossibles(e, 1, 1).length).toBe(2)
    expect(localise(e, 1, 1)).toBe(false)
    // Pris de côté, il tranche : le monolithe est localisé, à sa vraie place.
    e.echos.push(echo(0, 1e6))
    const p = placesPossibles(e, 1, 1)
    expect(p.length).toBe(1)
    expect(Math.hypot(p[0].x - m.x, p[0].y - m.y)).toBeLessThan(1)
    expect(ramasser(e, 1, 1)).toBe(true)
    expect(e.trouves).toEqual([1])
    expect(e.echos.length).toBe(0)
  })

  it('l’emplacement d’un monolithe : distance au Soleil (UA) et longitude, les mêmes pour tous', () => {
    for (const m of MONOLITHES.slice(0, 50)) {
      const e = emplacement(m.numero)
      expect(e.ua * UA).toBeCloseTo(Math.hypot(m.x, m.y), 0)
      expect(e.longitude).toBeGreaterThanOrEqual(0)
      expect(e.longitude).toBeLessThan(360)
      const a = (e.longitude * Math.PI) / 180
      expect(e.ua * UA * Math.cos(a)).toBeCloseTo(m.x, -1)
    }
  })

  it('un écho revenu reste « non vu » (même l’application fermée) jusqu’à ce qu’on le regarde ou qu’on re-pingue', () => {
    const e = nouveauxMonolithes()
    const echo = pinger(e, { x: UA, y: 0 }, t0)!
    expect(echosNonVus(e, echo.retour - 1)).toEqual([])
    expect(echosNonVus(e, t0 + 5 * H)).toEqual([echo])
    const jeu = new Jeu()
    jeu.monolithes = e
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(echosNonVus(copie.monolithes, t0 + 5 * H).length).toBe(1)
    marquerEchosVus(e, t0 + 5 * H)
    expect(echosNonVus(e, t0 + 5 * H)).toEqual([])
    const e2 = nouveauxMonolithes()
    pinger(e2, { x: UA, y: 0 }, t0)
    pinger(e2, { x: UA, y: 1e6 }, t0 + 2 * H)
    expect(echosNonVus(e2, t0 + 5 * H).length).toBe(1)
  })

  it('les paliers : un statut selon le nombre de monolithes trouvés (validés par Adrien le 18/10/2026)', () => {
    expect(statut(0)).toBeNull()
    expect(statut(9)).toBeNull()
    expect(statut(10)).toBe('Écouteur')
    expect(statut(49)).toBe('Écouteur')
    expect(statut(50)).toBe('Sourcier')
    expect(statut(100)).toBe('Arpenteur')
    expect(statut(250)).toBe('Cartographe')
    expect(statut(500)).toBe('Gardien')
    expect(statut(1000)).toBe('Oracle')
    expect(palierSuivant(12)).toEqual({ seuil: 50, titre: 'Sourcier' })
    expect(palierSuivant(1000)).toBeNull()
  })

  it('un écho pas encore revenu ne compte pas', () => {
    const e = nouveauxMonolithes()
    e.echos.push({ monolithe: 2, centre: { x: 0, y: 0 }, rayon: 5, envoye: 0, retour: 10 }, { monolithe: 2, centre: { x: 3, y: 0 }, rayon: 4, envoye: 0, retour: 100 })
    expect(placesPossibles(e, 2, 50).length).toBe(0)
    expect(placesPossibles(e, 2, 100).length).toBe(2)
  })

  it('le jeu : PING depuis la capsule, ramassage seulement à côté du monolithe localisé ; enregistré avec la partie', () => {
    const jeu = new Jeu()
    jeu.usureJusqua = Number.MAX_SAFE_INTEGER
    const echo = jeu.pinger(t0)!
    expect(echo).not.toBeNull()
    expect(jeu.monolitheIci(t0)).toBeNull()
    expect(jeu.ramasserMonolithe(t0)).toBeNull()
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.monolithes).toEqual(jeu.monolithes)
  })
})
