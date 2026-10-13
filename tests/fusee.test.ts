import { describe, expect, it } from 'vitest'
import { UA_KM } from '../src/astro/temps'
import {
  annulerDestination,
  avancerFusee,
  choisirDestination,
  creerFusee,
  direction,
  distance,
  distanceRestante,
  ecartAngle,
  positionAstre,
  tempsRestant,
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
  it('17,4 km/s pour une fusée neuve', () => {
    expect(vitesse(NORMAL)).toBe(17.4)
  })

  it('× 1,1 par amélioration', () => {
    expect(vitesse({ ...NORMAL, ameliorations: 1 })).toBeCloseTo(19.14, 10)
    expect(vitesse({ ...NORMAL, ameliorations: 10 })).toBeCloseTo(17.4 * 1.1 ** 10, 10)
  })

  it('× 0,2 levier L-A abaissé, × 0,45 en avarie', () => {
    expect(vitesse({ ...NORMAL, levierAAbaisse: true })).toBeCloseTo(3.48, 10)
    expect(vitesse({ ...NORMAL, avarie: true })).toBeCloseTo(7.83, 10)
    expect(vitesse({ ameliorations: 2, levierAAbaisse: true, avarie: true })).toBeCloseTo(17.4 * 1.21 * 0.2 * 0.45, 10)
  })

  it('vitesse affichée nulle sans destination', () => {
    const f = creerFusee(T0)
    expect(vitesseAffichee(f, NORMAL)).toBe(0)
    expect(vitesseAffichee(choisirDestination(f, { type: 'astre', astre: 'Mars' }), NORMAL)).toBe(17.4)
  })
})

describe('départ', () => {
  it('une nouvelle partie commence en orbite autour de la Terre, cap vers Jupiter', () => {
    const etat = creerPartie(T0, mulberry32(1))
    expect(etat.fusee.orbite).toBe('Terre')
    expect(etat.fusee.destination).toBeNull()
    expect(etat.fusee.position).toEqual(positionAstre('Terre', T0))
    expect(etat.fusee.cap).toBeCloseTo(direction(positionAstre('Terre', T0), positionAstre('Jupiter', T0)), 10)
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
    // 0,01 UA − 0,002 UA de seuil, à 17,4 km/s.
    const attendu = (0.008 * UA_KM) / 17.4
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

  it('la Lune demande de venir plus près (0,0002 UA au lieu de 0,002)', () => {
    const t = T0 + 1000
    const lune = positionAstre('Lune', t)
    const pres: EtatFusee = { ...creerFusee(T0), orbite: null, position: { x: lune.x + 0.001, y: lune.y } }
    expect(avancerFusee(choisirDestination(pres, { type: 'astre', astre: 'Lune' }), t, 1, 17.4).arrivee).toBeNull()
    expect(avancerFusee(choisirDestination(pres, { type: 'astre', astre: 'Mars' }), t, 1, 17.4).arrivee).toBeNull()
    const tresPres: EtatFusee = { ...pres, position: { x: lune.x + 0.00015, y: lune.y } }
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

describe('vitesse comptée par rapport à la destination', () => {
  it('une fois alignée, la distance restante diminue exactement à la vitesse de la fusée', () => {
    for (const astre of ['Lune', 'Vénus', 'Mars', 'Jupiter'] as const) {
      let f = choisirDestination(creerFusee(T0), { type: 'astre', astre })
      // Laisse la fusée finir son virage (180° au plus : 45 s).
      for (let s = 1; s <= 60; s++) f = avancerFusee(f, T0 + s * 1000, 1, 17.4).fusee
      const avant = distanceRestante(f, T0 + 60_000)!
      f = avancerFusee(f, T0 + 3_660_000, 3600, 17.4).fusee
      const apres = distanceRestante(f, T0 + 3_660_000)!
      expect((avant - apres) * UA_KM, astre).toBeCloseTo(17.4 * 3600, -1)
    }
  })

  it('la durée réelle du voyage correspond au temps restant annoncé', () => {
    for (const [astre, v] of [['Lune', 17.4], ['Vénus', 17.4], ['Mars', 17.4], ['Jupiter', 17.4 * 1.1 ** 20]] as const) {
      let f = choisirDestination(creerFusee(T0), { type: 'astre', astre })
      for (let s = 1; s <= 60; s++) f = avancerFusee(f, T0 + s * 1000, 1, v).fusee
      const annonce = tempsRestant(f, T0 + 60_000, v)!
      let duree = Infinity
      for (let s = 60; s < 3e8; s += 60) {
        const r = avancerFusee(f, T0 + (s + 60) * 1000, 60, v)
        f = r.fusee
        if (r.arrivee) { duree = s; break } // secondes écoulées depuis l’annonce (faite à T0 + 60 s)
      }
      expect(duree - annonce, astre).toBeGreaterThanOrEqual(0)
      expect(duree - annonce, astre).toBeLessThanOrEqual(120) // deux pas de 60 s
      expect(f.orbite).toBe(astre)
    }
  })

  it('sans destination, pas de temps restant', () => {
    expect(tempsRestant(creerFusee(T0), T0, 17.4)).toBeNull()
    expect(distanceRestante(creerFusee(T0), T0)).toBeNull()
  })
})

describe('compteur de route', () => {
  it('tourne à la vitesse de la fusée tant qu’une destination est choisie', () => {
    const f = choisirDestination(creerFusee(T0), { type: 'astre', astre: 'Neptune' })
    const r = avancerFusee(f, T0 + 100_000, 100, 17.4)
    expect(r.fusee.distanceParcourue).toBeCloseTo(1740, 10)
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
    if (reste <= Math.max(pas, S.dest.astre === 'Lune' ? 0.0002 : 0.002)) {
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
