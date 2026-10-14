import { describe, expect, it } from 'vitest'
import { corpsExiste, planeteDe } from '../src/astro/corps'
import { UA_KM } from '../src/astro/temps'
import { NOMS_PLANETES } from '../src/donnees/planetes'
import {
  approcherVisiteur,
  boucleSaison,
  debutSaison,
  distanceVisiteurKm,
  dureeEcho,
  escaleDuJour,
  evoluerChasse,
  finSaison,
  numeroSaison,
  photographierVisiteur,
  ping,
  positionVisiteur,
  reglerRadio,
  viserTelescope,
  visiteurAPortee,
  visiteurDetecte,
} from '../src/moteur/chasse'
import { baptiserFusee, creerPartie, type EtatPartie } from '../src/moteur/etat'
import { direction, distance, positionAstre, type Point2 } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 13, 12)
const H = 3_600_000
const JOUR = 24 * H
const partie = (t = T0, modules: string[] = []): EtatPartie =>
  ({ ...creerPartie(t, mulberry32(1), 'La Pie voleuse'), modulesInstalles: modules })
const placer = (e: EtatPartie, p: Point2): EtatPartie => ({ ...e, fusee: { ...e.fusee, orbite: null, position: p } })
/** Partie en orbite autour de l'astre de l'escale du jour, à l'instant t. */
const surEscale = (t: number): EtatPartie => {
  const astre = escaleDuJour(t)
  const e = partie(t)
  return { ...e, fusee: { ...e.fusee, orbite: astre, position: positionAstre(astre, t) } }
}

describe('saisons', () => {
  it('une saison par mois, du 1er à 00:00 UTC ; janvier 2026 = saison 0', () => {
    expect(numeroSaison(Date.UTC(2026, 0, 1))).toBe(0)
    expect(numeroSaison(Date.UTC(2026, 0, 31, 23, 59, 59))).toBe(0)
    expect(numeroSaison(Date.UTC(2026, 1, 1))).toBe(1)
    expect(numeroSaison(T0)).toBe(9) // octobre 2026
    expect(numeroSaison(Date.UTC(2027, 0, 1))).toBe(12)
    expect(debutSaison(9)).toBe(Date.UTC(2026, 9, 1))
    expect(finSaison(9)).toBe(Date.UTC(2026, 10, 1))
  })
})

describe('le visiteur', () => {
  it('chaque saison : une boucle de 3 ou 4 escales différentes, les mêmes pour tous les joueurs', () => {
    const tailles = new Set<number>()
    for (let n = 0; n < 48; n++) {
      const b = boucleSaison(n)
      tailles.add(b.length)
      expect(new Set(b).size).toBe(b.length)
      for (const astre of b) expect(corpsExiste(astre), astre).toBe(true)
      expect(boucleSaison(n)).toEqual(b)
    }
    expect(tailles).toEqual(new Set([3, 4]))
  })

  it('il change d’escale chaque jour à 00:00 UTC, en suivant la boucle', () => {
    const b = boucleSaison(9)
    for (let j = 0; j < 31; j++) {
      const jour = debutSaison(9) + j * JOUR
      expect(escaleDuJour(jour + 1)).toBe(b[j % b.length])
      expect(escaleDuJour(jour + JOUR - 1)).toBe(b[j % b.length])
    }
  })

  it('il se tient à côté de son astre, entre 30 000 et 150 000 km, à une place qui change chaque jour', () => {
    const places = new Set<string>()
    for (let j = 0; j < 20; j++) {
      const t = debutSaison(9) + j * JOUR + 7 * H // après son arrivée de 06:00
      const v = positionVisiteur(t)
      const a = positionAstre(v.astre, t)
      const km = distance(v, a) * UA_KM
      expect(km).toBeGreaterThanOrEqual(30_000 - 1)
      expect(km).toBeLessThanOrEqual(150_000 + 1)
      expect(km).toBeCloseTo(v.distanceAstreKm, 0)
      places.add(v.distanceAstreKm.toFixed(0))
    }
    expect(places.size).toBe(20)
  })

  it('de 06:00 à minuit, il reste à son escale en suivant son astre', () => {
    const t = debutSaison(9) + 2 * JOUR + 7 * H
    const v1 = positionVisiteur(t), v2 = positionVisiteur(t + 6 * H)
    const a1 = positionAstre(v1.astre, t), a2 = positionAstre(v2.astre, t + 6 * H)
    expect(v1.astre).toBe(v2.astre)
    expect(v2.x - a2.x).toBeCloseTo(v1.x - a1.x, 12)
    expect(v2.y - a2.y).toBeCloseTo(v1.y - a1.y, 12)
  })

  it('les escales sont tirées système puis astre : on y trouve des planètes et des satellites', () => {
    const astres = new Set<string>()
    for (let n = 0; n < 60; n++) for (const a of boucleSaison(n)) astres.add(a)
    const planetes = [...astres].filter((a) => (NOMS_PLANETES as readonly string[]).includes(a))
    expect(planetes.length).toBeGreaterThan(3)
    expect(astres.size - planetes.length).toBeGreaterThan(40)
  })
})

describe('le voyage du matin', () => {
  it('chaque jour, il part à 00:00 de sa place de la veille et arrive à 06:00 à sa place du jour', () => {
    for (let j = 1; j < 20; j++) {
      const minuit = debutSaison(9) + j * JOUR
      const veille = positionVisiteur(minuit - 1)
      const depart = positionVisiteur(minuit)
      const arrivee = positionVisiteur(minuit + 6 * H)
      expect(distance(depart, veille) * UA_KM).toBeLessThan(5) // il part bien d'où il était
      expect(depart.enVoyage).toBe(true)
      expect(veille.enVoyage).toBe(false)
      expect(arrivee.enVoyage).toBe(false)
      expect(arrivee.astre).toBe(escaleDuJour(minuit))
      const presque = positionVisiteur(minuit + 6 * H - 1)
      expect(distance(presque, arrivee) * UA_KM).toBeLessThan(2000) // il arrive bien à sa place
    }
  })

  it('il se déplace réellement, en ligne droite, d’une escale à l’autre (pas de saut)', () => {
    const minuit = debutSaison(9) + 3 * JOUR
    const A = positionVisiteur(minuit), B = positionVisiteur(minuit + 6 * H)
    let precedent = A
    for (let m = 10; m < 360; m += 10) {
      const p = positionVisiteur(minuit + m * 60_000)
      // Chaque tranche de 10 minutes : 1/36 du trajet environ, sur la droite de A à B.
      const pas = distance(p, precedent)
      expect(pas).toBeLessThan(distance(A, B) / 36 * 1.5 + 1e-6)
      const croix = (B.x - A.x) * (p.y - A.y) - (B.y - A.y) * (p.x - A.x)
      expect(Math.abs(croix) / distance(A, B)).toBeLessThan(0.01 * distance(A, B) + 1e-4)
      precedent = p
    }
  })

  it('sa vitesse dépend de la distance : le trajet dure toujours 6 heures', () => {
    const vitesses = new Set<number>()
    for (let j = 1; j < 25; j++) {
      const minuit = debutSaison(9) + j * JOUR
      const d = distance(positionVisiteur(minuit), positionVisiteur(minuit + 6 * H))
      vitesses.add(Math.round((d * UA_KM) / (6 * 3600)))
    }
    expect(vitesses.size).toBeGreaterThan(1)
  })

  it('pendant le voyage, on ne peut pas l’approcher', () => {
    const t = Date.UTC(2026, 9, 13, 3)
    const v = positionVisiteur(t)
    expect(v.enVoyage).toBe(true)
    const e = placer(partie(t), { x: v.x, y: v.y })
    expect(visiteurAPortee(e, t)).toBe(false)
    expect(approcherVisiteur(e, t).etat.fusee.destination).toBeNull()
  })
})

describe('trouvaille', () => {
  it('à côté de l’astre de l’escale : la soucoupe est à portée (moins de 300 000 km), pas depuis une autre planète', () => {
    const t = T0 // 12:00 : à son escale
    expect(visiteurAPortee(surEscale(t), t)).toBe(true)
    expect(visiteurAPortee(placer(partie(t), { x: 30, y: 0 }), t)).toBe(false)
    expect(approcherVisiteur(placer(partie(t), { x: 30, y: 0 }), t).etat.fusee.destination).toBeNull()
  })

  it('approcher, s’arrêter à environ 200 m, photographier : trouvaille, 250 CR et le trophée', () => {
    const t = Date.UTC(2026, 9, 13, 7) // arrivé à son escale depuis 06:00 : le temps d'approcher
    let e = approcherVisiteur(surEscale(t), t).etat
    expect(e.fusee.destination).toEqual({ type: 'visiteur', astre: escaleDuJour(t) })
    let s = 0
    while (e.fusee.destination && s < 20 * 3600) {
      s += 10
      e = avancerPartie(e, t + s * 1000, 10, mulberry32(s)).etat
    }
    const tFin = t + s * 1000
    expect(e.fusee.presDuVisiteur).toBe(true)
    expect(distanceVisiteurKm(e, tFin)).toBeLessThan(0.3)
    // Elle reste à côté de lui tant qu'il est à cette escale.
    e = avancerPartie(e, tFin + 60_000, 60, mulberry32(1)).etat
    expect(distanceVisiteurKm(e, tFin + 60_000)).toBeLessThan(0.3)
    const avant = e.credits
    const r = photographierVisiteur(e, tFin + 60_000)
    expect(r.trouvaille).toMatchObject({ saison: 9, nomFusee: 'La Pie voleuse', serie: e.serie, astre: escaleDuJour(t) })
    expect(r.etat.credits).toBe(avant + 250)
    expect(r.etat.trophees).toContain('contact')
    expect(r.messages[0]).toMatch(/^VISITEUR PHOTOGRAPHIÉ PRÈS DE/)
  })

  it('photo trop loin (plus de 300 m) : rien sur le cliché', () => {
    const t = T0
    const r = photographierVisiteur(surEscale(t), t)
    expect(r.trouvaille).toBeNull()
    expect(r.messages).toEqual(['PHOTO PRISE. RIEN DE NOTABLE SUR LE CLICHÉ.'])
  })

  it('une trouvaille par saison et par joueur ; de nouveau possible la saison suivante', () => {
    const prendre = (t: number, e0?: EtatPartie) => {
      const v = positionVisiteur(t)
      const base = e0 ?? partie(t)
      const e = { ...base, fusee: { ...base.fusee, orbite: v.astre, presDuVisiteur: true, position: { x: v.x, y: v.y } } }
      return photographierVisiteur(e, t)
    }
    const r1 = prendre(T0)
    expect(r1.trouvaille).not.toBeNull()
    const r2 = prendre(T0 + H, r1.etat)
    expect(r2.trouvaille).toBeNull()
    expect(r2.messages).toEqual(['PHOTO PRISE. VISITEUR DÉJÀ SIGNALÉ CETTE SAISON.'])
    const r3 = prendre(Date.UTC(2026, 10, 5, 12), r1.etat)
    expect(r3.trouvaille!.saison).toBe(10)
    expect(r3.etat.credits).toBe(500)
  })

  it('à minuit le visiteur change d’escale : stationnée, la fusée reste en orbite simple autour de l’astre', () => {
    const t = Date.UTC(2026, 9, 13, 23, 59)
    const v = positionVisiteur(t)
    const base = partie(t)
    let e: EtatPartie = { ...base, fusee: { ...base.fusee, orbite: v.astre, presDuVisiteur: true, position: { x: v.x, y: v.y } } }
    e = avancerPartie(e, t + 2 * 60_000, 120, mulberry32(1)).etat
    expect(e.fusee.presDuVisiteur).toBe(false)
    expect(e.fusee.orbite).toBe(v.astre)
  })
})

describe('le nom de la fusée', () => {
  it('choisi par le joueur, nettoyé, 24 caractères au plus ; jamais vide', () => {
    expect(partie().nom).toBe('La Pie voleuse')
    expect(baptiserFusee(partie(), '  Le   Grand   Bleu ')!.nom).toBe('Le Grand Bleu')
    expect(baptiserFusee(partie(), 'x'.repeat(40))!.nom).toHaveLength(24)
    expect(baptiserFusee(partie(), '   ')).toBeNull()
  })
})

describe('ping radio', () => {
  it('écho après l’aller-retour de la lumière : 2 × distance × 499 s ; recharge de 5 minutes', () => {
    const e = partie()
    const d = distance(e.fusee.position, positionVisiteur(T0))
    const r = ping(e, T0)
    expect(r.messages).toEqual(['PING ÉMIS SUR 7,13. ÉCOUTE EN COURS…'])
    const attendu = 2 * d * 499.0048 * 1000
    expect(r.etat.chasse.pings[0].duree).toBeCloseTo(attendu, 3)
    expect(ping(r.etat, T0 + 60_000).messages).toEqual(['RADIO EN RECHARGE.'])
    const retour = evoluerChasse(r.etat, T0 + attendu + 1)
    expect(retour.messages).toContain(`ÉCHO REÇU APRÈS ${dureeEcho(attendu)}.`)
    expect(retour.etat.chasse.pings).toEqual([])
  })

  it('hors de 7,13 ± 0,05 : aucun écho', () => {
    const e = reglerRadio(partie(), 0.06)
    expect(ping(e, T0).messages).toEqual(['PING ÉMIS SUR 7,19.', 'AUCUN ÉCHO SUR 7,19.'])
    expect(ping(reglerRadio(partie(), 0.05), T0).etat.chasse.pings).toHaveLength(1)
  })

  it('le dernier ping garde la position de la fusée ; durée en clair', () => {
    expect(ping(placer(partie(), { x: 2, y: -1 }), T0).etat.chasse.dernierPing).toEqual({ x: 2, y: -1 })
    expect(dureeEcho((3600 + 23 * 60 + 5) * 1000)).toBe('1 H 23 MIN 05 S')
  })
})

describe('Observatoire et transmissions', () => {
  it('bulletin toutes les 6 h : le système où se trouvait le visiteur 6 h plus tôt', () => {
    const creneau = Math.floor(T0 / (6 * H))
    const t = (creneau + 1) * 6 * H + 1000
    const r = evoluerChasse(partie(), t)
    const v = positionVisiteur((creneau + 1) * 6 * H - 6 * H)
    expect(r.messages).toContain(`OBSERVATOIRE : PERTURBATIONS DANS LE SYSTÈME DE ${planeteDe(v.astre).toUpperCase()}.`)
    expect(evoluerChasse(r.etat, t + 1000).messages.filter((m) => m.startsWith('OBSERVATOIRE'))).toEqual([])
  })

  it('après une longue absence : un seul bulletin et une seule transmission, les plus récents', () => {
    const r = evoluerChasse(partie(), T0 + 3 * JOUR)
    expect(r.messages.filter((m) => m.startsWith('OBSERVATOIRE'))).toHaveLength(1)
    expect(r.messages.filter((m) => m.includes('SIGNALE UNE LUEUR'))).toHaveLength(1)
  })

  it('transmissions toutes les 8 h ; plus d’une fois sur deux la planète la plus proche du visiteur', () => {
    const e = partie()
    let proches = 0, total = 0
    for (let k = 1; k <= 600; k++) {
      const creneau = Math.floor(T0 / (8 * H)) + k
      const t = creneau * 8 * H + 1000
      if (positionVisiteur(t).enVoyage) continue // créneau de minuit : il vient de partir
      const avant = { ...e, chasse: { ...e.chasse, transmission: creneau - 1, bulletin: Infinity } }
      const m = evoluerChasse(avant, t).messages.find((x) => x.includes('LUEUR'))!
      const v = positionVisiteur(t)
      const plusProche = NOMS_PLANETES.reduce((a, b) => (distance(v, positionAstre(a, t)) <= distance(v, positionAstre(b, t)) ? a : b))
      if (m.endsWith(`${plusProche.toUpperCase()}.`)) proches++
      total++
    }
    expect(proches / total).toBeGreaterThan(0.5)
  })
})

describe('télescope TEL et détecteur DET', () => {
  it('TEL : direction à ± 3° si le visiteur est à moins de 3 UA ; recharge 30 minutes ; il faut l’avoir installé', () => {
    const v = positionVisiteur(T0)
    const pres = placer(partie(T0, ['TEL']), { x: v.x + 1, y: v.y })
    expect(viserTelescope(placer(partie(), { x: v.x + 1, y: v.y }), T0, mulberry32(1)).messages).toEqual([])
    for (let g = 1; g <= 20; g++) {
      const r = viserTelescope(pres, T0, mulberry32(g))
      const lu = r.etat.chasse.derniereVisee!.direction!
      expect(Math.abs(((lu - direction(pres.fusee.position, v) + 540) % 360) - 180)).toBeLessThanOrEqual(3.5)
    }
    const r = viserTelescope(pres, T0, mulberry32(1))
    expect(viserTelescope(r.etat, T0 + 29 * 60_000, mulberry32(1)).messages).toEqual(['TÉLESCOPE EN RECHARGE.'])
    const loin = placer(partie(T0, ['TEL']), { x: v.x + 3.5, y: v.y })
    expect(viserTelescope(loin, T0, mulberry32(1)).messages).toEqual(['TÉLESCOPE : RIEN DANS LA PORTÉE.'])
  })

  it('DET : visiteur signalé à moins de 1,5 UA, s’il est installé', () => {
    const v = positionVisiteur(T0)
    expect(visiteurDetecte(placer(partie(T0, ['TEL', 'DET']), { x: v.x + 1.4, y: v.y }), T0)).toBeCloseTo(1.4, 6)
    expect(visiteurDetecte(placer(partie(T0, ['TEL', 'DET']), { x: v.x + 1.6, y: v.y }), T0)).toBeNull()
    expect(visiteurDetecte(placer(partie(T0, ['TEL']), { x: v.x + 1.4, y: v.y }), T0)).toBeNull()
  })
})

describe('calculateur de l’écho', () => {
  it('distance = moitié de l’aller-retour de la lumière : 16,6 min d’écho pour 1 UA', async () => {
    const { distanceEcho } = await import('../src/moteur/chasse')
    expect(distanceEcho(2 * 499.0048 * 1000)).toBeCloseTo(1, 6)
    expect(distanceEcho((24 * 60 + 54) * 1000)).toBeCloseTo(1.497, 3)
  })
})
