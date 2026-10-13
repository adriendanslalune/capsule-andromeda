import { describe, expect, it } from 'vitest'
import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../src/donnees/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import type { Contexte, Evenement } from '../src/moteur/modules/commun'
import {
  cheminVers,
  creerHY1,
  hy1EnPanne,
  ouvrirVanne,
  panneHY1,
  reservoirAttendu,
  reservoirsAtteints,
  tournerTuyau,
  type EtatHY1,
} from '../src/moteur/modules/hy1'
import { basculerVentilateur, creerLP1, lp1EnPanne, panneLP1, toucherLampe, type EtatLP1 } from '../src/moteur/modules/lp1'
import { basculerVanne, creerRE1, evoluerRE1, pomper, re1EnPanne, type EtatRE1 } from '../src/moteur/modules/re1'

const T0 = Date.UTC(2026, 9, 13, 12)
const ctx = (serie: string, inters: Interrupteurs = INTERRUPTEURS_DEPART): Contexte => ({ serie, interrupteurs: inters, t: T0 })

// ---------------------------------------------------------------------------------------------------------------
// LP-1

/** Ordre du manuel (page XI), écrit indépendamment : éteintes, bleues, vertes ; à égalité, n° croissant si pair. */
function ordreSelonManuel(lampes: string[], serie: string): number[] {
  const chiffres = serie.match(/[0-9]/g)!
  const pair = Number(chiffres[chiffres.length - 1]) % 2 === 0
  const res: number[] = []
  for (const couleur of ['eteinte', 'bleue', 'verte']) {
    const n = lampes.map((l, i) => (l === couleur ? i : -1)).filter((i) => i >= 0)
    res.push(...(pair ? n : n.reverse()))
  }
  return res
}

/** Procédure du manuel : VT en marche, remplacer les lampes dans l'ordre, arrêter VT. */
function procedureLP1(e0: EtatLP1, c: Contexte) {
  const ev: Evenement[] = []
  let e = basculerVentilateur(e0).etat
  for (const i of ordreSelonManuel(e.lampes, c.serie)) { const r = toucherLampe(e, i, c); e = r.etat; ev.push(...r.evenements) }
  const r = basculerVentilateur(e)
  ev.push(...r.evenements)
  return { etat: r.etat, evenements: ev }
}

describe('LP-1 — lampes à vide', () => {
  it('réparé en suivant le manuel (séries paires et impaires, 1 à 3 lampes)', () => {
    let essais = 0
    for (const serie of ['KE4-70B', 'KE4-71B']) {
      for (let graine = 1; graine <= 60; graine++) {
        const e = panneLP1(creerLP1(), mulberry32(graine), 30)
        const r = procedureLP1(e, ctx(serie))
        expect(r.evenements, `${serie} ${e.lampes.join(',')}`).toEqual([{ type: 'reparation', module: 'LP-1' }])
        expect(lp1EnPanne(r.etat)).toBe(false)
        essais++
      }
    }
    expect(essais).toBe(120)
  })

  it('nombre de lampes défectueuses : 1 seule avant 10 améliorations, jusqu’à 3 ensuite', () => {
    const compte = (amel: number) => {
      const h = mulberry32(5)
      const vus = new Set<number>()
      for (let i = 0; i < 200; i++) vus.add(panneLP1(creerLP1(), h, amel).lampes.filter((l) => l !== 'orange').length)
      return vus
    }
    expect(compte(0)).toEqual(new Set([1]))
    expect(compte(10)).toEqual(new Set([1, 2]))
    expect(compte(25)).toEqual(new Set([1, 2, 3]))
    expect(compte(90)).toEqual(new Set([1, 2, 3]))
  })

  it('toucher une lampe ventilateur arrêté : brûlure ; hors de son tour : refus', () => {
    const c = ctx('KE4-70B')
    const e: EtatLP1 = { lampes: ['verte', 'orange', 'eteinte', 'orange', 'orange', 'bleue'], ventilateur: false, avarie: true }
    expect(toucherLampe(e, 2, c).evenements[0]).toMatchObject({ nature: 'brûlure' })
    const vt = basculerVentilateur(e).etat
    expect(toucherLampe(vt, 0, c).evenements[0]).toMatchObject({ nature: 'hors de son tour' })
    expect(toucherLampe(vt, 2, c).etat.lampes[2]).toBe('orange')
  })

  it('arrêter VT avec des lampes encore défectueuses ne répare pas', () => {
    const e = panneLP1(creerLP1(), mulberry32(2), 0)
    const r = basculerVentilateur(basculerVentilateur(e).etat)
    expect(r.evenements).toEqual([])
    expect(lp1EnPanne(r.etat)).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
// HY-1

/** Réservoir selon le manuel (page XII) : H < 35 → R-1 ; 35 à 70 → R-2 ; > 70 → R-3 ; S-2 bas → suivant. */
function reservoirSelonManuel(h: number, s2Bas: boolean): number {
  const r = h < 35 ? 0 : h <= 70 ? 1 : 2
  return s2Bas ? (r + 1) % 3 : r
}

/** Le joueur oriente les tuyaux (en les touchant) pour relier la source au réservoir voulu, puis ouvre la vanne. */
function procedureHY1(e0: EtatHY1, c: Contexte) {
  let e = e0
  const r = reservoirSelonManuel(e.manometre, c.interrupteurs[1] === 'bas')
  const chemin = cheminVers(e.tuyaux, r)!
  for (const [k, rotation] of chemin) while (e.tuyaux[k].rotation !== rotation) e = tournerTuyau(e, k).etat
  return ouvrirVanne(e, c)
}

describe('HY-1 — circuit hydraulique', () => {
  it('réparé en suivant le manuel, S-2 haut ou bas, 200 grilles', () => {
    for (const s2 of ['haut', 'bas'] as const) {
      const c = ctx('KE4-70B', ['haut', s2, 'bas', 'haut'])
      for (let graine = 1; graine <= 100; graine++) {
        const e = panneHY1(creerHY1(), mulberry32(graine), c)
        const r = procedureHY1(e, c)
        expect(r.evenements, `S-2 ${s2}, graine ${graine}`).toEqual([{ type: 'reparation', module: 'HY-1' }])
        expect(hy1EnPanne(r.etat)).toBe(false)
      }
    }
  })

  it('toute grille en avarie peut être reliée aux trois réservoirs (réparable même si S-2 change)', () => {
    for (let graine = 1; graine <= 100; graine++) {
      const e = panneHY1(creerHY1(), mulberry32(graine), ctx('KE4-70B'))
      for (const r of [0, 1, 2]) expect(cheminVers(e.tuyaux, r), `graine ${graine}, R-${r + 1}`).not.toBeNull()
    }
  })

  it('basculer S-2 après l’avarie : on suit le manuel avec la nouvelle position, et ça marche', () => {
    const avant = ctx('KE4-70B', ['haut', 'haut', 'bas', 'haut'])
    const apres = ctx('KE4-70B', ['haut', 'bas', 'bas', 'haut'])
    for (let graine = 1; graine <= 30; graine++) {
      const e = panneHY1(creerHY1(), mulberry32(graine), avant)
      expect(procedureHY1(e, apres).evenements).toEqual([{ type: 'reparation', module: 'HY-1' }])
    }
  })

  it('la grille n’est jamais déjà réparée au moment de l’avarie', () => {
    for (let graine = 1; graine <= 100; graine++) {
      const c = ctx('KE4-70B')
      const e = panneHY1(creerHY1(), mulberry32(graine), c)
      const s = reservoirsAtteints(e.tuyaux)
      expect(s.length === 1 && s[0] === reservoirAttendu(e.manometre, c.interrupteurs)).toBe(false)
    }
  })

  it('mauvais réservoir : vanne refusée ; sans avarie : rien', () => {
    const c = ctx('KE4-70B')
    let e = panneHY1(creerHY1(), mulberry32(7), c)
    const mauvais = (reservoirAttendu(e.manometre, c.interrupteurs) + 1) % 3
    for (const [k, rot] of cheminVers(e.tuyaux, mauvais)!) while (e.tuyaux[k].rotation !== rot) e = tournerTuyau(e, k).etat
    expect(reservoirsAtteints(e.tuyaux)).toEqual([mauvais])
    expect(ouvrirVanne(e, c).evenements[0]).toMatchObject({ type: 'erreur', nature: 'vanne refusée' })
    expect(ouvrirVanne(creerHY1(), c).evenements).toEqual([])
  })

  it('seuils du manomètre : 34 → R-1, 35 et 70 → R-2, 71 → R-3', () => {
    const haut = INTERRUPTEURS_DEPART
    expect([34, 35, 70, 71].map((h) => reservoirAttendu(h, haut))).toEqual([0, 1, 1, 2])
    expect(reservoirAttendu(80, ['haut', 'bas', 'bas', 'haut'])).toBe(0) // après R-3 : R-1
  })
})

// ---------------------------------------------------------------------------------------------------------------
// RE-1

/** Laisse passer du temps (pas de 1 s) ; renvoie l'état et les événements. */
function attendre(e0: EtatRE1, secondes: number) {
  let e = e0
  const ev: Evenement[] = []
  for (let s = 0; s < secondes; s++) { const r = evoluerRE1(e, 1); e = r.etat; ev.push(...r.evenements) }
  return { etat: e, evenements: ev }
}

/**
 * Procédure du manuel (page XIII) : ouvrir V-C, attendre CO2 < 40, refermer, pomper jusqu'à la zone verte.
 * Le joueur purge un peu sous 40 (ici 38) : refermé à 39,9, le CO2 repasserait 40 pendant qu'on pompe.
 */
function procedureRE1(e0: EtatRE1) {
  const ev: Evenement[] = []
  let e = basculerVanne(e0).etat
  while (e.co2 >= 38) { const r = evoluerRE1(e, 0.5); e = r.etat; ev.push(...r.evenements) }
  e = basculerVanne(e).etat
  while (e.o2 < 60) { const r = pomper(e); e = r.etat; ev.push(...r.evenements) }
  const r = attendre(e, 1)
  ev.push(...r.evenements)
  return { etat: r.etat, evenements: ev }
}

describe('RE-1 — recycleur d’air', () => {
  it('usure : O2 −1 toutes les 90 s, CO2 +1 toutes les 100 s', () => {
    const r = attendre(creerRE1(), 900)
    expect(r.etat.o2).toBeCloseTo(70, 6)
    expect(r.etat.co2).toBeCloseTo(29, 6)
  })

  it('avarie quand O2 passe sous 25 (au bout d’environ 82 minutes)', () => {
    const r = attendre(creerRE1(), 82 * 60 + 40)
    expect(re1EnPanne(r.etat)).toBe(true)
    expect(r.evenements).toEqual([]) // usure normale : pas une faute
  })

  it('réparé en suivant le manuel, que l’avarie vienne de O2 ou de CO2', () => {
    const parO2 = attendre(creerRE1(), 5000).etat
    expect(re1EnPanne(parO2)).toBe(true)
    const r1 = procedureRE1(parO2)
    expect(r1.evenements).toEqual([{ type: 'reparation', module: 'RE-1' }])
    expect(re1EnPanne(r1.etat)).toBe(false)
    const parCO2: EtatRE1 = { o2: 80, co2: 76, vanneOuverte: false, avarie: true }
    const r2 = procedureRE1(parCO2)
    expect(r2.evenements).toEqual([{ type: 'reparation', module: 'RE-1' }])
  })

  it('purge trop longue : O2 tombe sous 25 vanne ouverte → faute de pilotage', () => {
    let e = basculerVanne(creerRE1()).etat
    const r = attendre(e, 120)
    e = r.etat
    expect(re1EnPanne(e)).toBe(true)
    expect(r.evenements).toEqual([{ type: 'faute', module: 'RE-1' }])
  })

  it('pomper vanne ouverte : erreur ; au-delà de 90 : soupape, O2 retombe à 70', () => {
    const ouvert = basculerVanne(creerRE1()).etat
    expect(pomper(ouvert).evenements[0]).toMatchObject({ nature: 'pompe vanne ouverte' })
    const r = pomper(creerRE1()) // 80 → 90 : encore dans la zone
    expect(r.etat.o2).toBe(90)
    const r2 = pomper(r.etat)
    expect(r2.etat.o2).toBe(70)
    expect(r2.evenements[0]).toMatchObject({ nature: 'soupape' })
  })

  it('entretien régulier : pomper et purger avant l’avarie l’évite (sans prime)', () => {
    let e = attendre(creerRE1(), 3000).etat // O2 ≈ 46.7, CO2 = 50
    e = pomper(pomper(e).etat).etat
    e = basculerVanne(e).etat
    e = attendre(e, 3).etat
    e = basculerVanne(e).etat
    const r = attendre(e, 600)
    expect(re1EnPanne(r.etat)).toBe(false)
    expect(r.evenements).toEqual([])
  })
})
