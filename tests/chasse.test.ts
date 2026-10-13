import { describe, expect, it } from 'vitest'
import { positionPlanete } from '../src/astro/planetes'
import { NOMS_PLANETES } from '../src/donnees/planetes'
import {
  debutSaison,
  dureeEcho,
  evoluerChasse,
  finSaison,
  numeroSaison,
  ping,
  positionVisiteur,
  reglerRadio,
  trajetSaison,
  viserTelescope,
  visiteurDetecte,
} from '../src/moteur/chasse'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { direction, distance, positionAstre, type Point2 } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'

const T0 = Date.UTC(2026, 9, 13, 12)
const H = 3_600_000
const partie = (t = T0, modules: string[] = []): EtatPartie => ({ ...creerPartie(t, mulberry32(1)), modulesInstalles: modules })
const placer = (e: EtatPartie, p: Point2): EtatPartie => ({ ...e, fusee: { ...e.fusee, orbite: null, position: p } })

describe('saisons', () => {
  it('une saison par mois, du 1er à 00:00 UTC ; janvier 2026 = saison 0', () => {
    expect(numeroSaison(Date.UTC(2026, 0, 1))).toBe(0)
    expect(numeroSaison(Date.UTC(2026, 0, 31, 23, 59, 59))).toBe(0)
    expect(numeroSaison(Date.UTC(2026, 1, 1))).toBe(1)
    expect(numeroSaison(T0)).toBe(9) // octobre 2026
    expect(numeroSaison(Date.UTC(2027, 0, 1))).toBe(12)
    expect(debutSaison(9)).toBe(Date.UTC(2026, 9, 1))
    expect(finSaison(9)).toBe(Date.UTC(2026, 10, 1))
    expect(finSaison(1) - debutSaison(1)).toBe(28 * 86_400_000) // février 2026
  })
})

describe('trajectoire du visiteur', () => {
  it('la même pour tous les joueurs, et calculée jusqu’à 3 jours après la fin de la saison', () => {
    const a = trajetSaison(9)
    expect(trajetSaison(9)).toBe(a)
    expect(a[0].t0).toBe(debutSaison(9))
    expect(a[a.length - 1].t1).toBeGreaterThanOrEqual(finSaison(9) + 3 * 86_400_000)
    for (let i = 1; i < a.length; i++) expect(a[i].t0).toBe(a[i - 1].t1)
  })

  it('escales de 16 à 30 h près de Mercure à Saturne ; jamais vers une de ses deux dernières escales', () => {
    for (let n = 0; n < 24; n++) {
      const escales = trajetSaison(n).filter((g) => g.type === 'escale')
      for (const g of escales) {
        expect((g.t1 - g.t0) / H).toBeGreaterThanOrEqual(16)
        expect((g.t1 - g.t0) / H).toBeLessThanOrEqual(30)
        if (g.type === 'escale') expect(g.planete).toBeLessThan(6)
      }
      for (let i = 2; i < escales.length; i++) {
        const p = (k: number) => (escales[k].type === 'escale' ? escales[k].planete : -1)
        expect(p(i)).not.toBe(p(i - 1))
        expect(p(i)).not.toBe(p(i - 2))
      }
    }
  })

  it('voyages en ligne droite à 0,06 UA/h (6 h au moins) ; arrivée au centre de la planète suivante', () => {
    for (const g of trajetSaison(9)) {
      // Au-delà de la fin du mois, c'est la trajectoire de la saison suivante qui compte.
      if (g.type !== 'voyage' || g.t1 > finSaison(9)) continue
      const A = positionPlanete(NOMS_PLANETES[g.de], g.t0)
      const B = positionPlanete(NOMS_PLANETES[g.vers], g.t1)
      const heures = (g.t1 - g.t0) / H
      expect(heures).toBeGreaterThanOrEqual(6 - 1e-9)
      const d = Math.hypot(B.x - A.x, B.y - A.y)
      // Durée calculée sur la distance au départ ; la planète visée bouge un peu pendant le voyage.
      if (heures > 6.01) expect(d / heures).toBeLessThan(0.065)
      const fin = positionVisiteur(g.t1 - 1)
      expect(distance(fin, B)).toBeLessThan(1e-4)
    }
  })

  it('pendant une escale, il tourne à 0,004 UA de la planète', () => {
    const g = trajetSaison(9).find((x) => x.type === 'escale')!
    for (let k = 0; k < 10; k++) {
      const t = g.t0 + ((g.t1 - g.t0) * k) / 10
      const v = positionVisiteur(t)
      const p = positionPlanete(NOMS_PLANETES[g.type === 'escale' ? g.planete : 0], t)
      expect(Math.hypot(v.x - p.x, v.y - p.y)).toBeCloseTo(0.004, 9)
      expect(v.escale).toBe(NOMS_PLANETES[g.type === 'escale' ? g.planete : 0])
    }
  })

  it('chaque saison a sa propre trajectoire', () => {
    expect(positionVisiteur(Date.UTC(2026, 9, 1, 6))).not.toEqual(positionVisiteur(Date.UTC(2026, 10, 1, 6)))
  })
})

describe('ping radio', () => {
  it('écho après l’aller-retour de la lumière : 2 × distance × 499 s ; recharge de 5 minutes', () => {
    const e = partie()
    const v = positionVisiteur(T0)
    const d = distance(e.fusee.position, v)
    const r = ping(e, T0)
    expect(r.messages).toEqual(['PING ÉMIS SUR 7,13. ÉCOUTE EN COURS…'])
    const attendu = 2 * d * 499.0048 * 1000
    expect(r.etat.chasse.pings[0].duree).toBeCloseTo(attendu, 3)
    expect(ping(r.etat, T0 + 60_000).messages).toEqual(['RADIO EN RECHARGE.'])
    expect(evoluerChasse(r.etat, T0 + attendu - 1000).messages.filter((m) => m.startsWith('ÉCHO'))).toEqual([])
    const retour = evoluerChasse(r.etat, T0 + attendu + 1)
    expect(retour.messages).toContain(`ÉCHO REÇU APRÈS ${dureeEcho(attendu)}.`)
    expect(retour.etat.chasse.pings).toEqual([])
    expect(retour.etat.chasse.indices[0].texte).toMatch(/^ÉCHO REÇU APRÈS/)
  })

  it('hors de 7,13 ± 0,05 : aucun écho', () => {
    const e = reglerRadio(partie(), 0.06)
    expect(e.chasse.frequenceRadio).toBe(7.19)
    const r = ping(e, T0)
    expect(r.messages).toEqual(['PING ÉMIS SUR 7,19.', 'AUCUN ÉCHO SUR 7,19.'])
    expect(r.etat.chasse.pings).toEqual([])
    const juste = ping(reglerRadio(partie(), 0.05), T0)
    expect(juste.etat.chasse.pings).toHaveLength(1)
  })

  it('le dernier ping garde la position de la fusée (pour tracer le cercle sur la carte)', () => {
    const e = placer(partie(), { x: 2, y: -1 })
    expect(ping(e, T0).etat.chasse.dernierPing).toEqual({ x: 2, y: -1 })
  })

  it('durée en clair', () => {
    expect(dureeEcho(65_000)).toBe('1 MIN 05 S')
    expect(dureeEcho((3600 + 23 * 60 + 5) * 1000)).toBe('1 H 23 MIN 05 S')
  })
})

describe('Observatoire et transmissions', () => {
  it('bulletin toutes les 6 h, sur la position du visiteur 6 h plus tôt', () => {
    const e = partie()
    const creneau = Math.floor(T0 / (6 * H))
    const t = (creneau + 1) * 6 * H + 1000
    const r = evoluerChasse(e, t)
    const v = positionVisiteur((creneau + 1) * 6 * H - 6 * H)
    const attendu = v.escale ? `OBSERVATOIRE : LES LUNES DE ${v.escale.toUpperCase()} SONT PERTURBÉES.` : 'OBSERVATOIRE : AUCUNE PERTURBATION NOTABLE.'
    expect(r.messages).toContain(attendu)
    expect(evoluerChasse(r.etat, t + 1000).messages.filter((m) => m.startsWith('OBSERVATOIRE'))).toEqual([])
  })

  it('après une longue absence : un seul bulletin et une seule transmission, les plus récents', () => {
    const r = evoluerChasse(partie(), T0 + 3 * 86_400_000)
    expect(r.messages.filter((m) => m.startsWith('OBSERVATOIRE'))).toHaveLength(1)
    expect(r.messages.filter((m) => m.includes('SIGNALE UNE LUEUR'))).toHaveLength(1)
  })

  it('transmissions toutes les 8 h, les mêmes pour tous ; une fois sur deux au moins la planète la plus proche', () => {
    const e = partie()
    let proches = 0, total = 0
    for (let k = 1; k <= 200; k++) {
      const creneau = Math.floor(T0 / (8 * H)) + k
      const t = creneau * 8 * H + 1000
      const avant = { ...e, chasse: { ...e.chasse, transmission: creneau - 1, bulletin: Infinity } }
      const m = evoluerChasse(avant, t).messages.find((x) => x.includes('LUEUR'))!
      expect(evoluerChasse(avant, t).messages).toContain(m)
      const v = positionVisiteur(t)
      const plusProche = NOMS_PLANETES.reduce((a, b) =>
        distance(v, positionAstre(a, t)) <= distance(v, positionAstre(b, t)) ? a : b)
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
      const vrai = direction(pres.fusee.position, v)
      expect(Math.abs(((lu - vrai + 540) % 360) - 180)).toBeLessThanOrEqual(3.5)
      expect(r.messages[0]).toBe(`TÉLESCOPE : OBJET VISÉ À ${lu}°.`)
    }
    const r = viserTelescope(pres, T0, mulberry32(1))
    expect(viserTelescope(r.etat, T0 + 29 * 60_000, mulberry32(1)).messages).toEqual(['TÉLESCOPE EN RECHARGE.'])
    expect(viserTelescope(r.etat, T0 + 30 * 60_000, mulberry32(1)).messages[0]).toMatch(/^TÉLESCOPE : OBJET VISÉ/)
    const loin = placer(partie(T0, ['TEL']), { x: v.x + 3.5, y: v.y })
    expect(viserTelescope(loin, T0, mulberry32(1)).messages).toEqual(['TÉLESCOPE : RIEN DANS LA PORTÉE.'])
  })

  it('DET : visiteur visible à moins de 1,5 UA, s’il est installé', () => {
    const v = positionVisiteur(T0)
    expect(visiteurDetecte(placer(partie(T0, ['TEL', 'DET']), { x: v.x + 1.4, y: v.y }), T0)).toBeCloseTo(1.4, 6)
    expect(visiteurDetecte(placer(partie(T0, ['TEL', 'DET']), { x: v.x + 1.6, y: v.y }), T0)).toBeNull()
    expect(visiteurDetecte(placer(partie(T0, ['TEL']), { x: v.x + 1.4, y: v.y }), T0)).toBeNull()
  })
})

describe('contact', () => {
  /** Un instant d'escale du visiteur pendant la saison n, et la planète. */
  function uneEscale(n: number) {
    const g = trajetSaison(n).find((x) => x.type === 'escale' && x.t0 >= debutSaison(n))!
    return { t: (g.t0 + g.t1) / 2, planete: NOMS_PLANETES[g.type === 'escale' ? g.planete : 0] }
  }

  it('en orbite autour de la planète de son escale (à 0,004 UA) : contact, 250 CR et le trophée', () => {
    const { t, planete } = uneEscale(9)
    const e = { ...partie(t), fusee: { ...partie(t).fusee, orbite: planete, position: positionAstre(planete, t) } }
    const r = evoluerChasse(e, t)
    expect(r.messages).toContain('CONTACT ÉTABLI AVEC LE VISITEUR DE LA SAISON 9 !')
    expect(r.etat.credits).toBe(250)
    expect(r.etat.trophees).toContain('contact')
    expect(r.etat.chasse.contacts).toEqual([9])
  })

  it('une fois par saison seulement ; possible de nouveau la saison suivante', () => {
    const { t, planete } = uneEscale(9)
    let e: EtatPartie = { ...partie(t), fusee: { ...partie(t).fusee, orbite: planete, position: positionAstre(planete, t) } }
    e = evoluerChasse(e, t).etat
    expect(evoluerChasse(e, t + 60_000).etat.credits).toBe(250)
    const suivante = uneEscale(10)
    const ailleurs = { ...e, fusee: { ...e.fusee, orbite: suivante.planete, position: positionAstre(suivante.planete, suivante.t) } }
    const r = evoluerChasse(ailleurs, suivante.t)
    expect(r.etat.credits).toBe(500)
    expect(r.etat.chasse.contacts).toEqual([9, 10])
  })

  it('loin du visiteur : pas de contact', () => {
    const r = evoluerChasse(placer(partie(), { x: 100, y: 100 }), T0)
    expect(r.etat.chasse.contacts).toEqual([])
  })
})
