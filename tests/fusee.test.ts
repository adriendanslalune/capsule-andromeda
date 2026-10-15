import { describe, expect, it } from 'vitest'
import { rayonCorps } from '../src/astro/corps'
import { UA_KM } from '../src/astro/temps'
import {
  annulerDestination,
  basculerMoteur,
  rampeVitesse,
  avancerFusee,
  choisirDestination,
  choisirDestinationAvecFenetre,
  creerFusee,
  direction,
  distance,
  distanceRestante,
  ecartAngle,
  enAttenteDeFenetre,
  optionsDeDepart,
  planDeVol,
  positionAstre,
  repereDuTrajet,
  seuilArrivee,
  systemeDeLaFusee,
  tempsRestant,
  tempsRestantAVitesse,
  vitesse,
  vitesseAffichee,
  type Destination,
  type EtatFusee,
  type FacteursVitesse,
} from '../src/moteur/fusee'
import { creerPartie } from '../src/moteur/etat'
import { mulberry32 } from '../src/moteur/hasard'

const T0 = Date.UTC(2026, 9, 13, 12)
const NORMAL: FacteursVitesse = { ameliorations: 0, levierAAbaisse: false, avarie: false }

/** Simule le voyage pas à pas ; renvoie l'état et la durée (s) quand la destination est atteinte. */
function voyager(fusee: EtatFusee, dest: Destination, v: number, pas: number, maxSecondes: number) {
  let f = choisirDestination(fusee, dest)
  for (let s = pas; s <= maxSecondes; s += pas) {
    const r = avancerFusee(f, T0 + s * 1000, pas, v)
    f = r.fusee
    if (r.arrivee) return { fusee: f, duree: s }
  }
  return { fusee: f, duree: Infinity }
}

describe('vitesse', () => {
  it('30 km/s pour une fusée neuve', () => {
    expect(vitesse(NORMAL)).toBe(30)
  })

  it('× 1,1 par amélioration', () => {
    expect(vitesse({ ...NORMAL, ameliorations: 1 })).toBeCloseTo(33, 10)
    expect(vitesse({ ...NORMAL, ameliorations: 10 })).toBeCloseTo(30 * 1.1 ** 10, 10)
  })

  it('× 0,2 levier L-A abaissé, × 0,45 en avarie', () => {
    expect(vitesse({ ...NORMAL, levierAAbaisse: true })).toBeCloseTo(6, 10)
    expect(vitesse({ ...NORMAL, avarie: true })).toBeCloseTo(13.5, 10)
    expect(vitesse({ ameliorations: 2, levierAAbaisse: true, avarie: true })).toBeCloseTo(30 * 1.21 * 0.2 * 0.45, 10)
  })

  it('vitesse affichée nulle sans destination', () => {
    const f = creerFusee(T0)
    expect(vitesseAffichee(f, NORMAL)).toBe(0)
    expect(vitesseAffichee(choisirDestination(f, { type: 'astre', astre: 'Mars' }), NORMAL)).toBe(30)
  })
})

describe('départ', () => {
  it('une nouvelle partie commence en orbite autour de la Terre, à trois rayons, côté Soleil, cap vers l’ISS', () => {
    const etat = creerPartie(T0, mulberry32(1))
    expect(etat.fusee.orbite).toBe('Terre')
    expect(systemeDeLaFusee(etat.fusee, T0)).toBe('Terre')
    expect(etat.fusee.destination).toBeNull()
    expect(etat.fusee.position).toEqual(positionAstre('Terre', T0))
    const o = etat.fusee.ecartOrbite!
    expect(Math.hypot(o.x, o.y, o.z) * UA_KM).toBeCloseTo(3 * rayonCorps('Terre')!, 3)
    // Du côté du Soleil (le jour).
    const terre = positionAstre('Terre', T0)
    expect(o.x * terre.x + o.y * terre.y).toBeLessThan(0)
    expect(etat.fusee.cap).toBeCloseTo(direction(positionAstre('Terre', T0), positionAstre('ISS', T0)), 10)
  })

  it('en orbite sans destination, la fusée suit la Terre et le compteur ne tourne pas', () => {
    const f = creerFusee(T0)
    const un_jour = T0 + 86_400_000
    const r = avancerFusee(f, un_jour, 86_400, 17.4)
    expect(r.fusee.position).toEqual(positionAstre('Terre', un_jour))
    expect(r.fusee.distanceParcourue).toBe(0)
    expect(r.arrivee).toBeNull()
  })

  it("à l'arrêt sans destination, la fusée ne bouge pas", () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 3, y: 1 } }
    expect(avancerFusee(f, T0 + 1000, 1, 17.4).fusee.position).toEqual({ x: 3, y: 1 })
  })
})

describe('virage', () => {
  it('tourne vers la destination à 4° par seconde, pas plus', () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 0, y: 1 }, cap: 0 }
    // Destination plein nord (90°) : 90° d'écart.
    const d = choisirDestination(f, { type: 'point', x: 0, y: 5 })
    const r1 = avancerFusee(d, T0 + 1000, 1, 17.4)
    expect(r1.fusee.cap).toBeCloseTo(4, 10)
    expect(r1.fusee.virage).toBeCloseTo(4, 10)
    const r10 = avancerFusee(d, T0 + 10_000, 10, 17.4)
    expect(r10.fusee.cap).toBeCloseTo(40, 10)
  })

  it('prend le chemin le plus court (vers la droite si la cible est à droite)', () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 0, y: 1 }, cap: 10 }
    const d = choisirDestination(f, { type: 'point', x: 5, y: 1 - Math.tan(30 * Math.PI / 180) * 5 }) // −30°
    const r = avancerFusee(d, T0 + 1000, 1, 17.4)
    expect(r.fusee.cap).toBeCloseTo(6, 10)
    expect(r.fusee.virage).toBeCloseTo(-4, 10)
  })

  it("s'aligne exactement quand l'écart est inférieur à un pas de virage", () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 0, y: 0 }, cap: 1 }
    const r = avancerFusee(choisirDestination(f, { type: 'point', x: 5, y: 0 }), T0 + 1000, 1, 17.4)
    expect(r.fusee.cap).toBeCloseTo(0, 10)
  })

  it('les angles sont pris modulo 360°', () => {
    expect(ecartAngle(350, 10)).toBe(20)
    expect(ecartAngle(10, 350)).toBe(-20)
    expect(ecartAngle(0, 180)).toBe(-180)
  })
})

describe('arrivée', () => {
  it('sur un point libre : arrêt moteur, pas d’orbite', () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 2, y: 0 }, cap: 0 }
    const { fusee, duree } = voyager(f, { type: 'point', x: 2.01, y: 0 }, 17.4, 60, 1e6)
    // 0,01 UA − 1 000 km de seuil, à 17,4 km/s.
    const attendu = (0.01 * UA_KM - 1000) / 17.4
    expect(duree).toBeGreaterThanOrEqual(attendu)
    // L'arrivée est constatée au pas qui suit le franchissement du seuil : deux pas de 60 s au plus.
    expect(duree).toBeLessThan(attendu + 120)
    expect(fusee.position).toEqual({ x: 2.01, y: 0 })
    expect(fusee.orbite).toBeNull()
    expect(fusee.destination).toBeNull()
  })

  it('sur une planète : mise en orbite, puis la fusée suit la planète', () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null }
    const { fusee, duree } = voyager(f, { type: 'astre', astre: 'Mars' }, 17.4 * 1.1 ** 40, 600, 1e9)
    expect(duree).toBeLessThan(Infinity)
    expect(fusee.orbite).toBe('Mars')
    const plusTard = T0 + (duree + 86_400) * 1000
    expect(avancerFusee(fusee, plusTard, 86_400, 17.4).fusee.position).toEqual(positionAstre('Mars', plusTard))
  })

  it('on arrive à trois rayons de l’astre : la Lune à 5 212 km, Mars à 10 169 km', () => {
    const t = T0 + 1000
    const lune = positionAstre('Lune', t)
    const pres: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: lune.x + 0.001, y: lune.y } }
    expect(avancerFusee(choisirDestination(pres, { type: 'astre', astre: 'Lune' }), t, 1, 17.4).arrivee).toBeNull()
    expect(avancerFusee(choisirDestination(pres, { type: 'astre', astre: 'Mars' }), t, 1, 17.4).arrivee).toBeNull()
    // 22 000 km de la Lune : pas encore arrivée ; 4 500 km : arrivée.
    expect(avancerFusee(choisirDestination({ ...pres, position: { x: lune.x + 0.00015, y: lune.y } }, { type: 'astre', astre: 'Lune' }), t, 1, 17.4).arrivee).toBeNull()
    const tresPres: EtatFusee = { ...pres, position: { x: lune.x + 0.00003, y: lune.y } }
    const r = avancerFusee(choisirDestination(tresPres, { type: 'astre', astre: 'Lune' }), t, 1, 17.4)
    expect(r.arrivee).toEqual({ type: 'astre', astre: 'Lune' })
    expect(r.fusee.orbite).toBe('Lune')
  })

  it('un grand pas qui dépasse la cible compte comme une arrivée (rattrapage hors ligne)', () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 2, y: 0 }, cap: 0 }
    const r = avancerFusee(choisirDestination(f, { type: 'point', x: 2.05, y: 0 }), T0 + 600_000, 600, 50_000)
    expect(r.arrivee).not.toBeNull()
    expect(r.fusee.position).toEqual({ x: 2.05, y: 0 })
  })

  it('Terre → Lune en environ 6 heures à 17,4 km/s', () => {
    const { fusee, duree } = voyager(creerFusee(T0), { type: 'astre', astre: 'Lune' }, 17.4, 10, 86_400)
    expect(fusee.orbite).toBe('Lune')
    expect(duree / 3600).toBeGreaterThan(5)
    expect(duree / 3600).toBeLessThan(7)
  })
})

/** Voyage complet depuis l'orbite terrestre à la date t0 ; renvoie la durée annoncée au départ et la durée réelle (s). */
function voyageComplet(t0: number, astre: string, v: number, pasCroisiere = 1800) {
  let f = choisirDestination(creerFusee(t0), { type: 'astre', astre })
  const annonce = tempsRestant(f, t0, v)!
  for (let s = 0; s < 50 * 365.25 * 86_400;) {
    const pas = s < 120 ? 1 : pasCroisiere // pas fins pendant le virage, puis plus longs
    s += pas
    const r = avancerFusee(f, t0 + s * 1000, pas, v)
    f = r.fusee
    if (r.arrivee) return { annonce, duree: s, fusee: f }
  }
  return { annonce, duree: Infinity, fusee: f }
}

describe('repères', () => {
  it('en orbite, la fusée est dans le système de son astre', () => {
    expect(systemeDeLaFusee(creerFusee(T0), T0)).toBe('Terre')
    expect(systemeDeLaFusee({ ...creerFusee(T0), orbite: 'Lune' }, T0)).toBe('Terre')
    expect(systemeDeLaFusee({ ...creerFusee(T0), orbite: 'Titan' }, T0)).toBe('Saturne')
  })

  it("en route, elle est dans le système de la planète dont elle est dans la sphère d'influence", () => {
    const jupiter = positionAstre('Jupiter', T0)
    const libre: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: jupiter.x + 0.3, y: jupiter.y } }
    expect(systemeDeLaFusee(libre, T0)).toBe('Jupiter') // 0,3 UA < 0,35 UA
    expect(systemeDeLaFusee({ ...libre, position: { x: jupiter.x + 0.4, y: jupiter.y } }, T0)).toBeNull()
    expect(systemeDeLaFusee({ ...libre, position: { x: 0, y: 0.1 } }, T0)).toBeNull()
  })

  it('même système : repère de la planète ; sinon : repère du Soleil', () => {
    const f = creerFusee(T0)
    expect(repereDuTrajet(f, { type: 'astre', astre: 'Lune' }, T0)).toBe('Terre')
    expect(repereDuTrajet(f, { type: 'astre', astre: 'Mars' }, T0)).toBeNull()
    expect(repereDuTrajet(f, { type: 'astre', astre: 'Phobos' }, T0)).toBeNull()
    expect(repereDuTrajet({ ...f, orbite: 'Io' }, { type: 'astre', astre: 'Europe' }, T0)).toBe('Jupiter')
    expect(repereDuTrajet({ ...f, orbite: 'Io' }, { type: 'astre', astre: 'Jupiter' }, T0)).toBe('Jupiter')
    expect(repereDuTrajet(f, { type: 'point', x: 1, y: 0 }, T0)).toBeNull()
  })
})

describe('trajectoire de rencontre', () => {
  it('vise le point où sera la cible, pas sa position actuelle', () => {
    const f = choisirDestination({ ...creerFusee(T0), orbite: null }, { type: 'astre', astre: 'Mars' })
    const plan = planDeVol(f, T0, 17.4)!
    const tard = positionAstre('Mars', T0 + plan.duree * 1000)
    expect(plan.repere).toBeNull()
    expect(distance(plan.point, tard)).toBeLessThan(1e-9)
    // La rencontre est atteignable en ligne droite à la vitesse de la fusée.
    expect(Math.abs(distance(f.position, plan.point) * UA_KM - 17.4 * plan.duree)).toBeLessThan(1000)
    expect(distance(plan.point, positionAstre('Mars', T0))).toBeGreaterThan(0.1)
  })

  it('Terre → Lune en environ 6 heures, avec une fusée neuve', () => {
    const { annonce, duree, fusee } = voyageComplet(T0, 'Lune', 17.4, 60)
    expect(fusee.orbite).toBe('Lune')
    expect(duree / 3600).toBeGreaterThan(5)
    expect(duree / 3600).toBeLessThan(7)
    expect(Math.abs(duree - annonce)).toBeLessThan(0.1 * annonce)
  })

  it('la durée annoncée au départ correspond à la durée réelle (à 1 % près)', () => {
    for (const [astre, v] of [['Mars', 17.4], ['Vénus', 17.4], ['Jupiter', 45], ['Io', 117], ['Phobos', 45],
      ['Titan', 117]] as const) {
      const { annonce, duree, fusee } = voyageComplet(T0, astre, v)
      expect(fusee.orbite, astre).toBe(astre)
      expect(Math.abs(duree - annonce) / annonce, astre).toBeLessThan(0.01)
    }
  }, 60_000) // six voyages complets simulés : plus long que la limite par défaut de 5 s

  it('la durée vers Mars dépend de la vraie position et du vrai mouvement de Mars', () => {
    const octobre2026 = tempsRestant(choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Mars' }), T0, 17.4)!
    const mai2027 = Date.UTC(2027, 4, 13, 12)
    const enMai = tempsRestant(choisirDestination(creerFusee(mai2027), { type: 'astre', astre: 'Mars' }), mai2027, 17.4)!
    expect(octobre2026 / 86_400).toBeGreaterThan(200)
    expect(enMai / 86_400).toBeLessThan(100)
  })

  it('vers un point libre, la rencontre est le point lui-même', () => {
    const f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 2, y: 0 } }
    const plan = planDeVol(choisirDestination(f, { type: 'point', x: 2.5, y: 0 }), T0, 17.4)!
    expect(distance(plan.point, { x: 2.5, y: 0 })).toBe(0)
    expect(plan.duree).toBeCloseTo((0.5 * UA_KM) / 17.4, 0)
  })

  it('sans destination, pas de temps restant', () => {
    expect(tempsRestant(creerFusee(T0), T0, 17.4)).toBeNull()
    expect(distanceRestante(creerFusee(T0), T0)).toBeNull()
    expect(planDeVol(creerFusee(T0), T0, 17.4)).toBeNull()
  })
})

describe('satellites comme destinations', () => {
  it("distance d'arrivée : trois rayons de l'astre (Mars, Lune, Titan, Phobos) ; le Soleil à 0,02 UA", () => {
    const km = (astre: string) => seuilArrivee({ type: 'astre', astre }) * UA_KM
    expect(km('Mars')).toBeCloseTo(3 * 3389.5, -1)
    expect(km('Lune')).toBeCloseTo(3 * 1737.4, -1)
    expect(km('Titan')).toBeCloseTo(3 * 2574.7, -1)
    expect(km('Phobos')).toBeCloseTo(3 * 11.08, 0)
    expect(seuilArrivee({ type: 'astre', astre: 'Soleil' })).toBe(0.02)
  })

  it('arrivée à Phobos : mise en orbite, puis la fusée suit Phobos', () => {
    const { fusee, duree } = voyageComplet(T0, 'Phobos', 45)
    expect(fusee.orbite).toBe('Phobos')
    const plusTard = T0 + (duree + 3600) * 1000
    expect(avancerFusee(fusee, plusTard, 3600, 45).fusee.position).toEqual(positionAstre('Phobos', plusTard))
  })

  it("d'un satellite à l'autre dans le même système (Io → Europe)", () => {
    const depart: EtatFusee = { ...creerFusee(T0), orbite: 'Io', position: positionAstre('Io', T0) }
    let f = choisirDestination(depart, { type: 'astre', astre: 'Europe' })
    const annonce = tempsRestant(f, T0, 17.4)!
    expect(annonce / 86_400).toBeLessThan(1) // entre 250 000 et 1 100 000 km à 17,4 km/s
    let arrivee = false
    for (let s = 10; s < 2 * 86_400 && !arrivee; s += 10) {
      const r = avancerFusee(f, T0 + s * 1000, 10, 17.4)
      f = r.fusee
      arrivee = r.arrivee !== null
    }
    expect(f.orbite).toBe('Europe')
  })
})

describe('fenêtre de tir', () => {
  const MARS: Destination = { type: 'astre', astre: 'Mars' }
  const jour = (t: number) => new Date(t).toISOString().slice(0, 10)

  it('vers Mars le 13/10/2026 : partir maintenant arrive le 28/06/2027, la fenêtre (21/03/2027) le 31/05/2027', () => {
    const o = optionsDeDepart(creerFusee(T0), MARS, T0, 17.4)
    expect(jour(o.maintenant!.arrivee)).toBe('2027-06-28')
    expect(jour(o.fenetre!.depart)).toBe('2027-03-21')
    expect(jour(o.fenetre!.arrivee)).toBe('2027-05-31')
  })

  it('partir plus tard, à n’importe quelle date, ne fait jamais arriver avant la fenêtre de tir', () => {
    const fenetre = optionsDeDepart(creerFusee(T0), MARS, T0, 17.4).fenetre!
    for (let j = 0; j <= 260; j += 5) {
      const t = T0 + j * 86_400_000
      const arrivee = optionsDeDepart(creerFusee(t), MARS, t, 17.4).maintenant!.arrivee
      expect(arrivee, `départ le ${jour(t)}`).toBeGreaterThanOrEqual(fenetre.arrivee - 3_600_000)
    }
  })

  it('pas de fenêtre proposée quand partir maintenant est le plus rapide (Lune, Vénus)', () => {
    expect(optionsDeDepart(creerFusee(T0), { type: 'astre', astre: 'Lune' }, T0, 17.4).fenetre).toBeNull()
    expect(optionsDeDepart(creerFusee(T0), { type: 'astre', astre: 'Vénus' }, T0, 17.4).fenetre).toBeNull()
  })

  it('pas de fenêtre en plein vol : on ne peut pas attendre sans orbite', () => {
    const libre: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 1.2, y: 0.3 } }
    expect(optionsDeDepart(libre, MARS, T0, 17.4).fenetre).toBeNull()
  })

  it('en attente : la fusée reste en orbite, le compteur ne tourne pas, la vitesse affichée est nulle', () => {
    let f = choisirDestinationAvecFenetre(creerFusee(T0), MARS, T0, 17.4)
    expect(enAttenteDeFenetre(f)).toBe(true)
    const unMois = T0 + 30 * 86_400_000
    f = avancerFusee(f, unMois, 30 * 86_400, 17.4).fusee
    expect(f.position).toEqual(positionAstre('Terre', unMois))
    expect(f.distanceParcourue).toBe(0)
    expect(vitesseAffichee(f, NORMAL)).toBe(0)
    // Le temps restant compte l'attente et le vol.
    expect(jour(unMois + tempsRestant(f, unMois, 17.4)! * 1000)).toBe('2027-05-31')
    expect(planDeVol(f, unMois, 17.4)!.enAttente).toBe(true)
  })

  it('le voyage simulé avec la fenêtre arrive à la date annoncée', () => {
    let f = choisirDestinationAvecFenetre(creerFusee(T0), MARS, T0, 17.4)
    let arrivee = 0
    for (let s = 0; s < 400 * 86_400 && !arrivee;) {
      const pas = f.fenetre ? 3600 : 600
      s += pas
      const r = avancerFusee(f, T0 + s * 1000, pas, 17.4)
      f = r.fusee
      if (r.arrivee) arrivee = T0 + s * 1000
    }
    expect(f.orbite).toBe('Mars')
    expect(jour(arrivee)).toBe('2027-05-31')
  })
})

describe('changement de vitesse en route (amélioration, avarie)', () => {
  it('en vol, la trajectoire est recalculée : avec un moteur amélioré, on vise plus près et on arrive plus tôt', () => {
    let f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Jupiter' })
    for (let s = 1; s <= 120; s++) f = avancerFusee(f, T0 + s * 1000, 1, 17.4).fusee
    const t = T0 + 120_000
    const lent = planDeVol(f, t, 17.4)!
    const rapide = planDeVol(f, t, 17.4 * 1.1 ** 10)!
    expect(rapide.arrivee).toBeLessThan(lent.arrivee)
    expect(distance(rapide.point, lent.point)).toBeGreaterThan(0.1)
    // Au pas suivant, la fusée tourne vers le nouveau point de rencontre.
    const apres = avancerFusee(f, t + 1000, 1, 17.4 * 1.1 ** 10).fusee
    const versNouveau = Math.abs(ecartAngle(apres.cap, direction(apres.position, rapide.point)))
    const versAncien = Math.abs(ecartAngle(f.cap, direction(f.position, rapide.point)))
    expect(versNouveau).toBeLessThan(versAncien)
  })

  it("en attente de fenêtre, une amélioration recalcule la fenêtre (à 45 km/s, partir tout de suite vers Mars est le plus rapide)", () => {
    let f = choisirDestinationAvecFenetre(creerFusee(T0), { type: 'astre', astre: 'Mars' }, T0, 17.4)
    expect(f.fenetre).not.toBeNull()
    f = avancerFusee(f, T0 + 3_600_000, 3600, 45).fusee
    expect(f.fenetre).toBeNull()
    expect(f.orbite).toBeNull() // partie
    expect(f.distanceParcourue).toBeGreaterThan(0)
  })
})

describe('compteur de route', () => {
  it('tourne à la vitesse de la fusée tant qu’une destination est choisie', () => {
    const f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Neptune' })
    const r = avancerFusee(f, T0 + 100_000, 100, 17.4)
    // Au départ de l'orbite, 20 s d'accélération linéaire (10 s « à pleine vitesse »), puis 80 s de croisière.
    expect(r.fusee.distanceParcourue).toBeCloseTo(17.4 * 90, 8)
  })

  it('annuler la destination coupe le moteur : la fusée reste sur place', () => {
    let f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Neptune' })
    f = avancerFusee(f, T0 + 1000, 1, 17.4).fusee
    f = annulerDestination(f)
    const ici = f.position
    const r = avancerFusee(f, T0 + 3_600_000, 3599, 17.4)
    expect(r.fusee.position).toEqual(ici)
    expect(r.fusee.orbite).toBeNull()
    expect(vitesseAffichee(r.fusee, NORMAL)).toBe(0)
  })
})

describe('identique au prototype', () => {
  // Copie de la fonction `avancer` du prototype v0.1. Depuis que la vitesse est comptée par rapport à la
  // destination, les deux ne coïncident plus que vers un point libre (qui ne bouge pas).
  function avancerPrototype(S: any, dt: number, t: number) {
    const R = Math.PI / 180, TAUX_VIRAGE = 4, UA = 1.495978707e8
    const destPos = () => (S.dest ? (S.dest.p === -1 ? { x: S.dest.x, y: S.dest.y } : positionAstre(S.dest.astre, t)) : null)
    const d = destPos()
    if (!d) { S.virage = 0; if (S.orbite !== null) { S.pos = positionAstre(S.orbite, t) } return }
    const vise = (Math.atan2(d.y - S.pos.y, d.x - S.pos.x) / R + 360) % 360, ecart = ((vise - S.cap + 540) % 360) - 180
    const pasA = Math.max(-TAUX_VIRAGE * dt, Math.min(TAUX_VIRAGE * dt, ecart))
    S.cap = (S.cap + pasA + 360) % 360; S.virage = dt > 0 ? pasA / dt : 0; S.orbite = null
    const pas = S.v * dt / UA
    const reste = Math.hypot(S.pos.x - d.x, S.pos.y - d.y)
    // Point libre : 1 000 km (décision d'Adrien du 14/10/2026 ; 0,002 UA dans le prototype).
    if (reste <= Math.max(pas, S.dest.p < 0 ? 1000 / UA : S.dest.astre === 'Lune' ? 0.0002 : 0.002)) {
      S.pos = { x: d.x, y: d.y }; S.orbite = S.dest.p >= 0 ? S.dest.astre : null; S.dest = null; return
    }
    S.pos.x += Math.cos(S.cap * R) * pas; S.pos.y += Math.sin(S.cap * R) * pas
  }

  it('vers un point libre : même trajectoire, même arrivée, même après un changement de destination', () => {
    const v = 17.4 * 1.1 ** 30
    const depart: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 0.3, y: 0.9 }, cap: 200 }
    let f = choisirDestination(depart, { type: 'point', x: -2, y: 0.5 })
    const S: any = { pos: { ...f.position }, cap: f.cap, virage: 0, orbite: null, v, dest: { p: -1, x: -2, y: 0.5 } }
    let etape = 0
    for (let s = 1; s < 3e7; s += 30, etape++) {
      const t = T0 + s * 1000
      if (etape === 200) {
        // En route, changement de destination vers un point libre.
        f = choisirDestination(f, { type: 'point', x: 1.2, y: -0.4 })
        S.dest = { p: -1, x: 1.2, y: -0.4 }
      }
      f = avancerFusee(f, t, 30, v).fusee
      avancerPrototype(S, 30, t)
      expect(f.position.x).toBe(S.pos.x)
      expect(f.position.y).toBe(S.pos.y)
      expect(f.cap).toBe(S.cap)
      expect(f.orbite).toBe(S.orbite)
      if (!f.destination) break
    }
    expect(f.destination).toBeNull()
    expect(distance(f.position, { x: 1.2, y: -0.4 })).toBe(0)
  })
})

describe('moteur : accélération en 20 s, bouton MOTEUR', () => {
  const croisiere = 30
  it('au départ, la vitesse monte linéairement jusqu’à la croisière en 20 s', () => {
    let f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Mars' })
    const vitesses: number[] = []
    for (let s = 1; s <= 25; s++) {
      f = avancerFusee(f, T0 + s * 1000, 1, croisiere).fusee
      vitesses.push(f.vitesseCourante!)
    }
    expect(vitesses[0]).toBeCloseTo(1.5, 8)
    expect(vitesses[9]).toBeCloseTo(15, 8)
    expect(vitesses[19]).toBeCloseTo(30, 8)
    expect(vitesses[24]).toBe(30)
  })

  it('moteur coupé : la fusée ralentit en 20 s, s’arrête, garde sa destination ; rallumé, elle repart', () => {
    let f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 3, y: 0 }, cap: 0 }
    f = choisirDestination(f, { type: 'point', x: 4, y: 0 })
    f = avancerFusee(f, T0 + 1000, 1, croisiere).fusee
    expect(f.vitesseCourante).toBe(croisiere)
    f = basculerMoteur(f)
    let t = T0 + 1000
    for (let s = 1; s <= 10; s++) f = avancerFusee(f, (t += 1000), 1, croisiere).fusee
    expect(f.vitesseCourante).toBeCloseTo(15, 8)
    for (let s = 1; s <= 10; s++) f = avancerFusee(f, (t += 1000), 1, croisiere).fusee
    expect(f.vitesseCourante).toBe(0)
    const ici = { ...f.position }
    f = avancerFusee(f, (t += 3_600_000), 3600, croisiere).fusee
    expect(f.position).toEqual(ici)
    expect(f.destination).toEqual({ type: 'point', x: 4, y: 0 })
    f = basculerMoteur(f)
    f = avancerFusee(f, (t += 5000), 5, croisiere).fusee
    expect(f.vitesseCourante).toBeCloseTo(7.5, 8)
  })

  it('un long pas (absence) intègre la rampe : 20 s de montée puis la croisière', () => {
    const r = rampeVitesse(0, 30, 30, 600)
    expect(r.fin).toBe(30)
    expect(r.moyenne * 600).toBeCloseTo(30 * 590, 6)
  })
})

describe('temps restant pendant l’accélération', () => {
  it('compte à rebours régulier : une seconde de moins par seconde, accélération comprise', () => {
    let f: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: 3, y: 0 }, cap: 0, vitesseCourante: 0 }
    f = choisirDestination(f, { type: 'point', x: 3.02, y: 0 })
    let avant = tempsRestant(f, T0, 30)!
    for (let s = 1; s <= 30; s++) {
      f = avancerFusee(f, T0 + s * 1000, 1, 30).fusee
      const maintenant = tempsRestant(f, T0 + s * 1000, 30)!
      expect(avant - maintenant).toBeCloseTo(1, 3)
      avant = maintenant
    }
  })
  it('moteur coupé : pas de temps restant', () => {
    const f = basculerMoteur(choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Lune' }))
    expect(tempsRestant(f, T0, 30)).toBeNull()
  })
})

describe('compteur du cockpit : temps restant à la vitesse du moment', () => {
  it('à mi-vitesse, il faut deux fois plus de temps ; à l’arrêt, pas de temps restant', () => {
    const f = choisirDestination({ ...creerFusee(T0), orbite: null, position: { x: 3, y: 0 } }, { type: 'point', x: 3.02, y: 0 })
    const plein = tempsRestantAVitesse(f, T0, 30, 30)!
    expect(tempsRestantAVitesse(f, T0, 30, 15)! / plein).toBeCloseTo(2, 8)
    expect(tempsRestantAVitesse({ ...f, vitesseCourante: 0 }, T0, 30)).toBeNull()
  })
})
