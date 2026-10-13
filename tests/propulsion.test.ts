import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/moteur/hasard'
import type { Evenement } from '../src/moteur/modules/commun'
import {
  basculerLevierA,
  basculerLevierB,
  ch1EnPanne,
  creerPropulsion,
  evoluerPropulsion,
  panneCH1,
  panneCH1Imposee,
  panneTU1,
  presserP,
  tournerMolette,
  tu1EnPanne,
  type EtatPropulsion,
} from '../src/moteur/modules/propulsion'

const T0 = Date.UTC(2026, 9, 13, 12)

/** Petit banc d'essai : garde l'état, l'heure et tous les événements. */
class Banc {
  e: EtatPropulsion
  t = T0
  evenements: Evenement[] = []
  constructor(e: EtatPropulsion = creerPropulsion()) { this.e = e }
  private garder(r: { etat: EtatPropulsion; evenements: Evenement[] }) { this.e = r.etat; this.evenements.push(...r.evenements) }
  attendre(secondes: number, pas = 0.1) {
    for (let s = 0; s < secondes - 1e-9; s += pas) { this.t += pas * 1000; this.garder(evoluerPropulsion(this.e, this.t, pas)) }
  }
  levierA() { this.garder(basculerLevierA(this.e, this.t)) }
  levierB() { this.garder(basculerLevierB(this.e)) }
  molette() { this.garder(tournerMolette(this.e)) }
  P() { this.garder(presserP(this.e)) }
  mettreMoletteSur(n: number) { while (this.e.molette !== n) this.molette() }
  reparations() { return this.evenements.filter((x) => x.type === 'reparation').map((x) => x.module) }
  erreurs() { return this.evenements.filter((x) => x.type === 'erreur') }
  fautes() { return this.evenements.filter((x) => x.type === 'faute').map((x) => x.module) }
}

// ---------------------------------------------------------------------------------------------------------------
// Procédures du manuel, appliquées à la lettre (avec la règle TU-1 « sous 40 » devenue officielle).

/** Procédure 1 — surchauffe de tuyère : abaisser L-A, attendre T-2 sous 40, relever L-A. */
function procedure1(b: Banc) {
  b.levierA()
  while (b.e.temperature >= 40) b.attendre(0.5)
  b.levierA()
}

/**
 * Procédure 2 — pression de chambre : aiguille M-1 en zone rouge (haute) → surpression : R sur 2 ;
 * zone bleue (basse) → sous-pression : R sur 7. Presser P une fois. Replacer R sur 5.
 */
function procedure2(b: Banc) {
  b.mettreMoletteSur(b.e.pression > 50 ? 2 : 7)
  b.P()
  b.mettreMoletteSur(5)
}

describe('fusée neuve', () => {
  it('L-A et L-B relevés, R sur 5, P vers 50, T vers 45, aucun témoin', () => {
    const e = creerPropulsion()
    expect(e).toMatchObject({ levierAHaut: true, levierBHaut: true, molette: 5, pression: 50, temperature: 45 })
    expect(ch1EnPanne(e) || tu1EnPanne(e)).toBe(false)
  })

  it('au repos, les aiguilles restent stables et rien ne se passe', () => {
    const b = new Banc()
    b.attendre(600, 1)
    expect(b.e.pression).toBe(50)
    expect(b.e.temperature).toBe(45)
    expect(b.evenements).toEqual([])
  })
})

describe('aiguilles', () => {
  it('P va vers 50 + (R − 5) × 12 à 5 par seconde', () => {
    const b = new Banc()
    b.mettreMoletteSur(7) // cible 74
    b.attendre(2)
    expect(b.e.pression).toBeCloseTo(60, 6)
    b.attendre(10)
    expect(b.e.pression).toBeCloseTo(74, 6)
  })

  it('L-B abaissé : +15 de pression, et la pression évolue à 4 par seconde', () => {
    const b = new Banc()
    b.levierB()
    b.attendre(2)
    expect(b.e.pression).toBeCloseTo(58, 6)
    b.attendre(5)
    expect(b.e.pression).toBeCloseTo(65, 6)
  })

  it('surchauffe : T monte vers 96 à 3 par seconde ; L-A abaissé : T descend vers 18 à 3,5 par seconde', () => {
    const b = new Banc(panneTU1(creerPropulsion()))
    b.attendre(10)
    expect(b.e.temperature).toBeCloseTo(75, 6)
    b.levierA()
    b.attendre(10)
    expect(b.e.temperature).toBeCloseTo(40, 6)
  })
})

describe('TU-1 — surchauffe', () => {
  it('réparée en suivant la procédure 1 du manuel', () => {
    const b = new Banc(panneTU1(creerPropulsion()))
    b.attendre(20)
    procedure1(b)
    expect(tu1EnPanne(b.e)).toBe(false)
    expect(b.reparations()).toEqual(['TU-1'])
    b.attendre(60)
    expect(tu1EnPanne(b.e)).toBe(false) // pas de rechute
  })

  it('relevé entre 40 et 60 : semble réparée, mais la surchauffe revient 6 s plus tard', () => {
    const b = new Banc(panneTU1(creerPropulsion()))
    b.levierA()
    while (b.e.temperature > 55) b.attendre(0.1)
    b.levierA()
    expect(tu1EnPanne(b.e)).toBe(false)
    expect(b.reparations()).toEqual([])
    b.attendre(5.9)
    expect(tu1EnPanne(b.e)).toBe(false)
    b.attendre(0.2)
    expect(tu1EnPanne(b.e)).toBe(true)
  })

  it('faux réparé rattrapé : rabaisser L-A, attendre sous 40, relever avant la rechute', () => {
    const b = new Banc(panneTU1(creerPropulsion()))
    b.levierA()
    while (b.e.temperature > 41) b.attendre(0.1)
    b.levierA() // à 41 : faux réparé
    b.levierA()
    b.attendre(1) // redescend sous 40
    b.levierA()
    expect(b.reparations()).toEqual(['TU-1'])
    b.attendre(10)
    expect(tu1EnPanne(b.e)).toBe(false)
  })

  it('relevé au-dessus de 60 : rien', () => {
    const b = new Banc(panneTU1(creerPropulsion()))
    b.attendre(20) // T ≈ 96
    b.levierA()
    b.attendre(1)
    b.levierA()
    expect(tu1EnPanne(b.e)).toBe(true)
    expect(b.reparations()).toEqual([])
  })
})

describe('CH-1 — pression', () => {
  it('surpression et sous-pression réparées en suivant la procédure 2 du manuel', () => {
    for (const type of ['sur', 'sous'] as const) {
      const b = new Banc(panneCH1Imposee(creerPropulsion(), type))
      b.attendre(20)
      procedure2(b)
      expect(ch1EnPanne(b.e), type).toBe(false)
      expect(b.reparations()).toEqual(['CH-1'])
      b.attendre(60)
      expect(ch1EnPanne(b.e), type).toBe(false)
      expect(b.fautes()).toEqual([])
    }
  })

  it('le tirage au hasard donne surpression et sous-pression', () => {
    const vus = new Set<string>()
    const h = mulberry32(3)
    for (let i = 0; i < 50; i++) vus.add(panneCH1(creerPropulsion(), h).avariePression!)
    expect(vus).toEqual(new Set(['sur', 'sous']))
  })

  it('presser P avec un mauvais réglage : erreur, pas de réparation', () => {
    const b = new Banc(panneCH1Imposee(creerPropulsion(), 'sur'))
    b.mettreMoletteSur(7)
    b.P()
    expect(ch1EnPanne(b.e)).toBe(true)
    expect(b.erreurs()[0]).toMatchObject({ module: 'CH-1', nature: 'mauvais réglage' })
  })

  it('oublier de replacer R sur 5 après une surpression fait tomber en sous-pression : faute de pilotage', () => {
    const b = new Banc(panneCH1Imposee(creerPropulsion(), 'sur'))
    b.attendre(20)
    b.mettreMoletteSur(2)
    b.P() // réparé, mais R reste sur 2 : P vise 14
    b.attendre(30)
    expect(b.e.avariePression).toBe('sous')
    expect(b.fautes()).toEqual(['CH-1'])
  })

  it('presser P sans avarie : purge à vide (P − 20), erreur', () => {
    const b = new Banc()
    b.P()
    expect(b.e.pression).toBe(30)
    expect(b.erreurs()[0]).toMatchObject({ nature: 'purge à vide' })
  })

  it('pression maintenue au-dessus de 90 plus de 2 s : surpression, faute de pilotage', () => {
    const b = new Banc()
    b.mettreMoletteSur(9) // cible 98
    b.attendre(9.6) // P passe 90 vers 8 s
    expect(b.fautes()).toEqual([])
    b.attendre(1)
    expect(b.e.avariePression).toBe('sur')
    expect(b.fautes()).toEqual(['CH-1'])
  })

  it('L-B abaissé avec R sur 8 : surpression, faute de pilotage (le levier interdit du manuel)', () => {
    const b = new Banc()
    b.levierB()
    b.mettreMoletteSur(8) // 50 + 36 + 15 = 101 → 100
    b.attendre(20)
    expect(b.fautes()).toEqual(['CH-1'])
  })

  it('une avarie déclenchée par le jeu n’est pas une faute', () => {
    const b = new Banc(panneCH1Imposee(creerPropulsion(), 'sur'))
    b.attendre(60)
    expect(b.fautes()).toEqual([])
  })
})

describe('défauts simultanés (procédure 3)', () => {
  it('procédure 1 puis procédure 2 : les deux sont réparés, dans cet ordre', () => {
    const b = new Banc(panneCH1Imposee(panneTU1(creerPropulsion()), 'sur'))
    b.attendre(20)
    procedure1(b)
    procedure2(b)
    expect(b.reparations()).toEqual(['TU-1', 'CH-1'])
    expect(ch1EnPanne(b.e) || tu1EnPanne(b.e)).toBe(false)
  })

  it('presser P pendant une surchauffe : emballement (T = 100), comme le dit le manuel', () => {
    const avec = new Banc(panneCH1Imposee(panneTU1(creerPropulsion()), 'sur'))
    avec.mettreMoletteSur(2)
    avec.P()
    expect(avec.e.temperature).toBe(100)
    expect(ch1EnPanne(avec.e)).toBe(true)
    expect(avec.erreurs()[0]).toMatchObject({ nature: 'emballement' })
    const sansPression = new Banc(panneTU1(creerPropulsion()))
    sansPression.P()
    expect(sansPression.e.temperature).toBe(100)
  })
})
