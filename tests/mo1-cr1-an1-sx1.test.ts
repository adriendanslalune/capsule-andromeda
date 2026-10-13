import { describe, expect, it } from 'vitest'
import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../src/donnees/fusee'
import { positionAstre, type Point2 } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { an1EnPanne, an1PeutTomberEnPanne, creerAN1, panneAN1, tournerAntenne, verrouiller } from '../src/moteur/modules/an1'
import type { Contexte } from '../src/moteur/modules/commun'
import { cr1EnPanne, creerCR1, heureAffichee, panneCR1, recaler, reglerChronometre } from '../src/moteur/modules/cr1'
import { creerMO1, emettreMorse, mo1EnPanne, panneMO1, reglerFrequence, sequenceMorse, type EtatMO1 } from '../src/moteur/modules/mo1'
import { creerSX1, panneSX1, releve, reglerSextant, sx1EnPanne, type EtatSX1 } from '../src/moteur/modules/sx1'

const T0 = Date.UTC(2026, 9, 13, 14, 20, 30)
const ctx = (serie: string, inters: Interrupteurs = INTERRUPTEURS_DEPART, t = T0): Contexte => ({ serie, interrupteurs: inters, t })

// ---------------------------------------------------------------------------------------------------------------
// MO-1

/** Annuaire du manuel (page XIV), recopié indépendamment. */
const ANNUAIRE: Record<string, number> = {
  VEGA: 3.47, ARES: 5.12, IRIS: 8.06, NOVA: 2.89, LUNA: 6.64, ECHO: 9.31, ZETA: 1.75, OMEGA: 10.42, SOL: 4.58, ATLAS: 7.93,
}
const CODE: Record<string, string> = {
  A: '.-', E: '.', G: '--.', H: '....', I: '..', C: '-.-.', L: '.-..', M: '--', N: '-.', O: '---', R: '.-.', S: '...',
  T: '-', U: '..-', V: '...-', Z: '--..',
}

/** Le joueur déchiffre la séquence lumineuse (points et traits) pour retrouver l'indicatif. */
function dechiffrer(seq: [boolean, number][]): string {
  const lettres: string[] = []
  let lettre = ''
  for (const [allume, duree] of seq) {
    if (allume) lettre += duree < 0.4 ? '.' : '-'
    else if (duree > 0.4) { lettres.push(Object.keys(CODE).find((k) => CODE[k] === lettre)!); lettre = '' }
  }
  return lettres.join('')
}

/** Procédure du manuel : déchiffrer, trouver la station, régler la fréquence (+1,00 si S-1 bas), ÉMETTRE. */
function procedureMO1(e0: EtatMO1, c: Contexte) {
  const indicatif = dechiffrer(sequenceMorse(e0.indicatif!))
  const cible = ANNUAIRE[indicatif] + (c.interrupteurs[0] === 'bas' ? 1 : 0)
  let e = e0
  // Réglage au centième, comme avec les boutons de l'interface.
  let n = 0
  while (Math.abs(e.frequence - cible) > 0.0001 && n++ < 2000) {
    const ecart = cible - e.frequence
    const pas = Math.abs(ecart) >= 1 ? 1 : Math.abs(ecart) >= 0.1 ? 0.1 : 0.01
    e = reglerFrequence(e, Math.sign(ecart) * pas).etat
  }
  return emettreMorse(e, c)
}

describe('MO-1 — morse', () => {
  it('réparé en suivant le manuel : 10 stations × S-1 haut ou bas', () => {
    for (const station of Object.keys(ANNUAIRE)) {
      for (const s1 of ['haut', 'bas'] as const) {
        const e = { ...creerMO1(), indicatif: station }
        const r = procedureMO1(e, ctx('KE4-70B', [s1, 'haut', 'bas', 'haut']))
        expect(r.evenements, `${station} S-1 ${s1}`).toEqual([{ type: 'reparation', module: 'MO-1' }])
        expect(mo1EnPanne(r.etat)).toBe(false)
      }
    }
  })

  it('séquence : point 0,22 s, trait 0,66 s ; SOL = ... --- .-..', () => {
    const seq = sequenceMorse('SOL')
    expect(seq.filter(([a]) => a).map(([, d]) => (d < 0.4 ? '.' : '-')).join('')).toBe('...---.-..')
    expect(seq[0]).toEqual([true, 0.22])
    expect(seq[seq.length - 1][1]).toBeCloseTo(1.76, 10)
    expect(dechiffrer(seq)).toBe('SOL')
  })

  it('mauvaise fréquence : erreur ; réglage borné entre 0 et 12, au centième', () => {
    const e = { ...creerMO1(), indicatif: 'VEGA' }
    expect(emettreMorse(e, ctx('KE4-70B')).evenements[0]).toMatchObject({ nature: 'mauvaise fréquence' })
    expect(reglerFrequence(creerMO1(), 20).etat.frequence).toBe(12)
    expect(reglerFrequence(creerMO1(), -20).etat.frequence).toBe(0)
    let f = creerMO1()
    for (let i = 0; i < 3; i++) f = reglerFrequence(f, 0.01).etat
    expect(f.frequence).toBe(5.03)
  })

  it('les avaries tirent les stations de l’annuaire', () => {
    const h = mulberry32(4)
    const vus = new Set<string>()
    for (let i = 0; i < 100; i++) vus.add(panneMO1(creerMO1(), h).indicatif!)
    expect(vus.size).toBe(10)
  })
})

// ---------------------------------------------------------------------------------------------------------------
// CR-1

describe('CR-1 — chronomètre de bord', () => {
  it('réparé en suivant le manuel : heure UTC + dernier chiffre, régler, RECALER', () => {
    for (const serie of ['KE4-70B', 'KE4-77B', 'AB2-39Z']) {
      for (let graine = 1; graine <= 40; graine++) {
        let e = panneCR1(creerCR1(), mulberry32(graine))
        // Le joueur lit sa montre (heure UTC, déjà convertie depuis l'heure locale avec le tableau du manuel).
        const d = new Date(T0)
        const chiffres = serie.match(/[0-9]/g)!
        const voulu = (d.getUTCHours() * 60 + d.getUTCMinutes() + Number(chiffres[chiffres.length - 1])) % 1440
        const aff = heureAffichee(e, T0, serie)
        let ecart = voulu - (aff.heures * 60 + aff.minutes)
        if (ecart > 720) ecart -= 1440
        if (ecart < -720) ecart += 1440
        while (Math.abs(ecart) >= 60) { e = reglerChronometre(e, Math.sign(ecart) * 60).etat; ecart -= Math.sign(ecart) * 60 }
        while (ecart !== 0) { e = reglerChronometre(e, Math.sign(ecart)).etat; ecart -= Math.sign(ecart) }
        const r = recaler(e)
        expect(r.evenements, `${serie} graine ${graine}`).toEqual([{ type: 'reparation', module: 'CR-1' }])
        expect(cr1EnPanne(r.etat)).toBe(false)
      }
    }
  })

  it('exemple du manuel : 14 h 20 UTC, n° de série terminé par 7 → régler 14 h 27', () => {
    const e = creerCR1()
    expect(heureAffichee(e, T0, 'KE4-77B')).toMatchObject({ heures: 14, minutes: 27 })
  })

  it('une minute d’écart est tolérée, deux non', () => {
    expect(recaler({ decalage: 1, avarie: true }).evenements[0].type).toBe('reparation')
    expect(recaler({ decalage: -1, avarie: true }).evenements[0].type).toBe('reparation')
    expect(recaler({ decalage: 1440, avarie: true }).evenements[0].type).toBe('reparation')
    expect(recaler({ decalage: 2, avarie: true }).evenements[0]).toMatchObject({ type: 'erreur', nature: 'heure fausse' })
    expect(recaler(creerCR1()).evenements).toEqual([])
  })

  it('dérive de 7 à 240 minutes, en avance ou en retard', () => {
    const h = mulberry32(8)
    let min = Infinity, max = 0, signes = new Set<number>()
    for (let i = 0; i < 3000; i++) {
      const d = panneCR1(creerCR1(), h).decalage
      min = Math.min(min, Math.abs(d)); max = Math.max(max, Math.abs(d)); signes.add(Math.sign(d))
    }
    expect(min).toBe(7)
    expect(max).toBe(240)
    expect(signes).toEqual(new Set([-1, 1]))
  })
})

// ---------------------------------------------------------------------------------------------------------------
// AN-1

describe('AN-1 — antenne orientable', () => {
  /** Procédure du manuel : direction de la Terre sur la carte (comme le cap), +180° si S-3 bas, VERROUILLER. */
  function procedureAN1(position: Point2, c: Contexte) {
    const terre = positionAstre('Terre', c.t)
    let voulu = (Math.atan2(terre.y - position.y, terre.x - position.x) * 180 / Math.PI + 360) % 360
    if (c.interrupteurs[2] === 'bas') voulu = (voulu + 180) % 360
    let e = panneAN1(creerAN1())
    e = tournerAntenne(e, Math.round(voulu)).etat // la molette se règle au degré
    return verrouiller(e, position, c)
  }

  it('réparé en suivant le manuel, depuis plusieurs positions, S-3 haut ou bas', () => {
    for (const position of [{ x: 1.5, y: 0.3 }, { x: -5, y: 2 }, { x: 0.2, y: -0.7 }, { x: 30, y: -10 }]) {
      for (const s3 of ['haut', 'bas'] as const) {
        const r = procedureAN1(position, ctx('KE4-70B', ['haut', 'haut', s3, 'haut']))
        expect(r.evenements, `${JSON.stringify(position)} S-3 ${s3}`).toEqual([{ type: 'reparation', module: 'AN-1' }])
        expect(an1EnPanne(r.etat)).toBe(false)
      }
    }
  })

  it('tolérance de 5° ; au-delà, erreur', () => {
    const position = { x: 3, y: 0 }
    const c = ctx('KE4-70B', ['haut', 'haut', 'haut', 'haut'])
    const terre = positionAstre('Terre', T0)
    const voulu = (Math.atan2(terre.y - position.y, terre.x - position.x) * 180 / Math.PI + 360) % 360
    const essai = (ecart: number) => verrouiller({ orientation: (voulu + ecart + 360) % 360, avarie: true }, position, c).evenements[0].type
    expect(essai(4.9)).toBe('reparation')
    expect(essai(-4.9)).toBe('reparation')
    expect(essai(5.5)).toBe('erreur')
  })

  it('jamais en avarie à moins de 0,02 UA (3 millions de km) de la Terre', () => {
    const terre = positionAstre('Terre', T0)
    expect(an1PeutTomberEnPanne(terre, T0)).toBe(false)
    expect(an1PeutTomberEnPanne({ x: terre.x + 0.019, y: terre.y }, T0)).toBe(false)
    expect(an1PeutTomberEnPanne({ x: terre.x + 0.021, y: terre.y }, T0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
// SX-1

/** Tableau du manuel (page XVI), recopié indépendamment : nom, azimut, hauteur. */
const TABLEAU_ETOILES: [string, number, number][] = [
  ['SIRIUS', 104, -40], ['VÉGA', 285, 62], ['BÉTELGEUSE', 89, -16], ['ARCTURUS', 204, 31], ['ANTARÈS', 250, -5],
  ['RÉGULUS', 150, 0], ['SPICA', 204, -2], ['ALDÉBARAN', 70, -5], ['ALTAÏR', 302, 29], ['POLLUX', 113, 7],
  ['DENEB', 335, 60], ['FOMALHAUT', 334, -21],
]

describe('SX-1 — sextant', () => {
  it('réparé en suivant le manuel : 12 étoiles × série paire ou impaire (étoile suivante)', () => {
    for (let k = 0; k < 12; k++) {
      for (const serie of ['KE4-70B', 'KE4-71B']) {
        const impair = serie === 'KE4-71B'
        const [, az, ht] = TABLEAU_ETOILES[impair ? (k + 1) % 12 : k]
        let e: EtatSX1 = { ...creerSX1(), etoile: TABLEAU_ETOILES[k][0] }
        e = reglerSextant(e, az - e.azimut, ht - e.hauteur).etat
        const r = releve(e, ctx(serie))
        expect(r.evenements, `${TABLEAU_ETOILES[k][0]} ${serie}`).toEqual([{ type: 'reparation', module: 'SX-1' }])
        expect(sx1EnPanne(r.etat)).toBe(false)
      }
    }
  })

  it('après FOMALHAUT vient SIRIUS ; viser l’étoile affichée avec un n° impair : erreur', () => {
    let e: EtatSX1 = { ...creerSX1(), etoile: 'FOMALHAUT' }
    e = reglerSextant(e, 104, -40).etat
    expect(releve(e, ctx('KE4-71B')).evenements[0].type).toBe('reparation')
    let f: EtatSX1 = { ...creerSX1(), etoile: 'FOMALHAUT' }
    f = reglerSextant(f, 334, -21).etat
    expect(releve(f, ctx('KE4-71B')).evenements[0]).toMatchObject({ type: 'erreur', nature: 'mauvaise visée' })
  })

  it('tolérance 1,5° ; la hauteur reste entre −90 et +90', () => {
    let e: EtatSX1 = { ...creerSX1(), etoile: 'VÉGA' }
    e = reglerSextant(e, 285 + 3, 62).etat // 3° d'azimut × cos 62° ≈ 1,4°
    expect(releve(e, ctx('KE4-70B')).evenements[0].type).toBe('reparation')
    expect(reglerSextant(creerSX1(), 0, 200).etat.hauteur).toBe(90)
    expect(reglerSextant(creerSX1(), -10, 0).etat.azimut).toBe(350)
  })

  it('les avaries tirent les 12 étoiles', () => {
    const h = mulberry32(6)
    const vus = new Set<string>()
    for (let i = 0; i < 200; i++) vus.add(panneSX1(creerSX1(), h).etoile!)
    expect(vus.size).toBe(12)
  })
})
