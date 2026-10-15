import { describe, expect, it } from 'vitest'
import { CONTRATS_TUTORIEL, MODULES_A_INSTALLER } from '../src/donnees/economie'
import { choisirDestination } from '../src/moteur/fusee'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { mulberry32 } from '../src/moteur/hasard'
import { modulesEnPanne } from '../src/moteur/modules'
import { panneCO1 } from '../src/moteur/modules/co1'
import { panneAL1 } from '../src/moteur/modules/al1'
import { tournerMolette } from '../src/moteur/modules/propulsion'
import { declencherPanne, ordreCascade, PANNES_TUTORIEL, tailleMaxCascade } from '../src/moteur/pannes'
import { agir } from '../src/moteur/partie'
import { ordreSelonManuel, Pilote } from './outils/pilote'

const T0 = Date.UTC(2026, 9, 13, 12)
const TOUS = MODULES_A_INSTALLER.map((m) => m.code)
const partie = (serie = 'KE4-70B', modules: string[] = [], ameliorations = 0): EtatPartie =>
  ({ ...creerPartie(T0, mulberry32(1)), serie, modulesInstalles: modules, ameliorations })
/** Partie dont le tutoriel des pannes est fini. */
const apresTutoriel = (serie = 'KE4-70B', modules: string[] = TOUS, ameliorations = 0): EtatPartie => {
  const e = partie(serie, modules, ameliorations)
  return { ...e, pannes: { ...e.pannes, tutoriel: PANNES_TUTORIEL, prochaine: null } }
}
/** La même, en route vers Jupiter (un très long voyage). */
const enVoyage = (e: EtatPartie): EtatPartie => ({ ...e, fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Jupiter' }) })
/** Contrats du tutoriel déjà remplis (les n premiers). */
const tutorielFait = (e: EtatPartie, n: number): EtatPartie => ({ ...e, contratsFaits: CONTRATS_TUTORIEL.slice(0, n).map((c) => c.id) })

describe('tutoriel des pannes', () => {
  it('jamais d’avarie en orbite ; la première 18 s après le premier départ : surchauffe de TU-1', () => {
    const p = new Pilote(partie(), T0)
    p.attendre(600, 10)
    expect(modulesEnPanne(p.m)).toEqual([])
    const q = new Pilote(enVoyage(partie()), T0)
    q.attendre(17)
    expect(modulesEnPanne(q.m)).toEqual([])
    q.attendre(1)
    expect(modulesEnPanne(q.m)).toEqual(['TU-1'])
  })

  it('les 4 pannes du tutoriel, une par voyage du tutoriel : TU-1 ; CH-1 ; TU-1 + CH-1 en surpression ; AL-1', () => {
    const vues: string[][] = []
    let e = enVoyage(partie())
    for (let n = 0; n < 4; n++) {
      const p = new Pilote(tutorielFait(e, n), T0 + n * 3_600_000)
      while (modulesEnPanne(p.m).length === 0) p.attendre(1)
      vues.push(modulesEnPanne(p.m))
      if (n === 2) expect(p.m.propulsion.avariePression).toBe('sur')
      p.toutReparer()
      // Le même voyage ne donne pas d'autre panne du tutoriel.
      p.attendre(400, 5)
      expect(modulesEnPanne(p.m), `voyage ${n + 1}`).toEqual([])
      e = p.etat
    }
    expect(vues).toEqual([['TU-1'], ['CH-1'], ['CH-1', 'TU-1'], ['AL-1']])
    expect(e.credits).toBe(0) // les réparations ne rapportent rien
    expect(e.stats.pannes).toBe(5)
  })

  it('après le tutoriel : une avarie tous les 1,5 à 4,5 millions de km parcourus', () => {
    const ecarts: number[] = []
    for (let graine = 1; graine <= 20; graine++) {
      const p = new Pilote(enVoyage(apresTutoriel('KE4-70B', [])), T0, graine)
      p.attendre(1) // tire la distance de la prochaine avarie
      ecarts.push(p.etat.pannes.prochaineKm! - p.etat.fusee.distanceParcourue)
    }
    expect(Math.min(...ecarts)).toBeGreaterThanOrEqual(1_500_000 - 100)
    expect(Math.max(...ecarts)).toBeLessThanOrEqual(4_500_000)
    expect(Math.max(...ecarts) - Math.min(...ecarts)).toBeGreaterThan(1_000_000)
    // Elle survient quand le compteur l'atteint.
    const p = new Pilote(enVoyage(apresTutoriel('KE4-70B', [])), T0, 1)
    p.attendre(1)
    const vise = p.etat.pannes.prochaineKm!
    const juste = new Pilote({ ...p.etat, fusee: { ...p.etat.fusee, distanceParcourue: vise - 0.05 } }, p.t) // 50 m avant (la fusée recule à 20 m/s)
    juste.attendre(1)
    expect(modulesEnPanne(juste.m)).toEqual([])
    juste.attendre(10)
    expect(modulesEnPanne(juste.m).length).toBeGreaterThan(0)
  })

  it('en orbite : aucune avarie, même si le compteur a dépassé la distance prévue', () => {
    const e = apresTutoriel('KE4-70B', [])
    const p = new Pilote({ ...e, pannes: { ...e.pannes, prochaineKm: 0 } }, T0)
    p.attendre(600, 10)
    expect(modulesEnPanne(p.m)).toEqual([])
  })

  it('pas plus de 3 avaries par 24 heures', () => {
    const p = new Pilote(enVoyage(apresTutoriel('KE4-70B', [])), T0, 3)
    const instants: number[] = []
    const fin = T0 + 6 * 86_400_000
    while (p.t < fin) {
      p.attendre(600, 60)
      if (modulesEnPanne(p.m).length) { instants.push(p.t); p.toutReparer() }
    }
    expect(instants.length).toBeGreaterThan(3)
    for (const x of instants) expect(instants.filter((y) => y >= x && y < x + 86_400_000).length).toBeLessThanOrEqual(3)
  }, 120_000)
})

describe('déclenchement au hasard', () => {
  it('seulement parmi les modules installés ; jamais RE-1', () => {
    const vus = new Set<string>()
    for (let graine = 1; graine <= 300; graine++) {
      const e = declencherPanne(apresTutoriel('KE4-70B', ['CO-1', 'PB-1', 'LP-1', 'HY-1', 'RE-1']), T0, mulberry32(graine))
      for (const c of modulesEnPanne(e.modules)) vus.add(c)
    }
    expect([...vus].sort()).toEqual(['AL-1', 'CH-1', 'CO-1', 'HY-1', 'LP-1', 'PB-1', 'TU-1'])
  })

  it('AN-1 ne tombe jamais en panne près de la Terre', () => {
    for (let graine = 1; graine <= 300; graine++) {
      const e = declencherPanne(apresTutoriel('KE4-70B', TOUS, 50), T0, mulberry32(graine))
      expect(modulesEnPanne(e.modules)).not.toContain('AN-1')
    }
    let loin = apresTutoriel('KE4-70B', TOUS, 50)
    loin = { ...loin, fusee: { ...loin.fusee, orbite: null, position: { x: 5, y: 0 } } }
    const vus = new Set<string>()
    for (let graine = 1; graine <= 300; graine++) for (const c of modulesEnPanne(declencherPanne(loin, T0, mulberry32(graine)).modules)) vus.add(c)
    expect(vus).toContain('AN-1')
  })

  it('taille des cascades : 1 module avant 8 améliorations, puis 2, 3, et 4 à partir de 35', () => {
    expect([0, 7, 8, 19, 20, 34, 35, 90].map(tailleMaxCascade)).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
    const tailles = (amel: number) => {
      const s = new Set<number>()
      for (let g = 1; g <= 200; g++) s.add(modulesEnPanne(declencherPanne(apresTutoriel('KE4-70B', TOUS, amel), T0, mulberry32(g)).modules).length)
      return s
    }
    expect(tailles(0)).toEqual(new Set([1]))
    expect(tailles(10)).toEqual(new Set([1, 2]))
    expect(tailles(40)).toEqual(new Set([1, 2, 3, 4]))
  })

  it('pas de nouvelle avarie tant qu’une autre n’est pas réparée', () => {
    const p = new Pilote(apresTutoriel(), T0)
    while (modulesEnPanne(p.m).length === 0) p.attendre(1)
    const premiere = modulesEnPanne(p.m)
    p.attendre(3600)
    expect(modulesEnPanne(p.m).filter((c) => c !== 'RE-1')).toEqual(premiere.filter((c) => c !== 'RE-1'))
  })
})

describe('cascades', () => {
  it('ordre : alphabétique ; inversé si impair ; TU-1 toujours en premier', () => {
    expect(ordreCascade(['PB-1', 'AL-1', 'CO-1'], 'KE4-70B')).toEqual(['AL-1', 'CO-1', 'PB-1'])
    expect(ordreCascade(['PB-1', 'AL-1', 'CO-1'], 'KE4-71B')).toEqual(['PB-1', 'CO-1', 'AL-1'])
    expect(ordreCascade(['PB-1', 'TU-1', 'AL-1'], 'KE4-70B')).toEqual(['TU-1', 'AL-1', 'PB-1'])
    expect(ordreCascade(['PB-1', 'TU-1', 'AL-1'], 'KE4-71B')).toEqual(['TU-1', 'PB-1', 'AL-1'])
    for (const serie of ['KE4-70B', 'KE4-71B']) {
      expect(ordreCascade(['SX-1', 'AN-1', 'CR-1', 'HY-1', 'TU-1', 'MO-1'], serie))
        .toEqual(ordreSelonManuel(['SX-1', 'AN-1', 'CR-1', 'HY-1', 'TU-1', 'MO-1'], serie))
    }
  })

  /** Partie avec une cascade AL-1 + CO-1 en cours. */
  function cascadeAlCo(serie: string): EtatPartie {
    const e = apresTutoriel(serie)
    const h = mulberry32(3)
    return {
      ...e,
      modules: { ...e.modules, al1: panneAL1(e.modules.al1, h), co1: panneCO1(e.modules.co1, h) },
      pannes: { ...e.pannes, cascade: { modules: ['CO-1', 'AL-1'], faits: [], total: 0 } },
    }
  }

  it('dans l’ordre : la cascade est résolue (sans prime)', () => {
    const p = new Pilote(cascadeAlCo('KE4-70B'), T0)
    p.reparer('AL-1')
    expect(p.etat.pannes.cascade!.faits).toEqual(['AL-1'])
    p.reparer('CO-1')
    expect(p.etat.credits).toBe(0)
    expect(p.etat.pannes.cascade).toBeNull()
    expect(p.etat.stats.pannes).toBe(2)
    expect(p.messages).toContain('CASCADE RÉSOLUE.')
  })

  it('hors de son tour : le bloc retombe aussitôt en panne', () => {
    const p = new Pilote(cascadeAlCo('KE4-70B'), T0)
    const motAvant = p.m.co1.mot
    p.reparer('CO-1') // il fallait d'abord AL-1
    expect(modulesEnPanne(p.m)).toContain('CO-1')
    expect(p.messages).toContain('ORDRE INCORRECT : CO-1 RETOMBE EN PANNE.')
    expect(p.etat.credits).toBe(0)
    void motAvant
    p.toutReparer()
    expect(p.etat.pannes.cascade).toBeNull()
  })

  it('n° de série impair : l’ordre est inversé (CO-1 avant AL-1)', () => {
    const p = new Pilote(cascadeAlCo('KE4-71B'), T0)
    p.toutReparer()
    expect(p.messages.filter((m) => m.startsWith('ORDRE INCORRECT'))).toEqual([])
    expect(p.etat.pannes.cascade).toBeNull()
  })
})

describe('fautes de pilotage', () => {
  it('une avarie provoquée par le joueur doit être réparée', () => {
    const p = new Pilote(apresTutoriel('KE4-70B', []), T0)
    // Molette sur 9 : la pression monte au-dessus de 90 → surpression provoquée.
    for (let i = 0; i < 4; i++) {
      p.geste((m) => { const r = tournerMolette(m.propulsion); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })
    }
    p.attendre(15)
    expect(modulesEnPanne(p.m)).toEqual(['CH-1'])
    expect(p.etat.pannes.fautes).toEqual(['CH-1'])
    p.toutReparer()
    expect(p.etat.credits).toBe(0)
    expect(p.etat.stats.pannes).toBe(1)
    expect(p.etat.pannes.fautes).toEqual([])
    expect(p.messages.some((m) => m.includes('FAUTE DE PILOTAGE'))).toBe(true)
  })

  it('une réparation ne rapporte rien, mais compte (classement)', () => {
    const e = apresTutoriel('KE4-70B', ['CO-1'])
    const avecPanne = { ...e, modules: { ...e.modules, co1: panneCO1(e.modules.co1, mulberry32(1)) } }
    const p = new Pilote(avecPanne, T0)
    p.toutReparer()
    expect(p.etat.credits).toBe(0)
    expect(p.etat.stats.pannes).toBe(1)
  })
})

describe('long vol : tous les modules installés, cascades jusqu’à 4', () => {
  for (const serie of ['KE4-70B', 'EZ9-05A']) {
    it(`8 jours de vol (${serie}) : le pilote qui suit le manuel répare tout, sans erreur d'ordre ni faute`, () => {
      const p = new Pilote(enVoyage(apresTutoriel(serie, TOUS, 40)), T0, serie.length)
      const fin = T0 + 8 * 86_400_000
      while (p.t < fin) {
        p.attendre(600, 60)
        p.toutReparer()
      }
      expect(p.etat.stats.pannes).toBeGreaterThan(12)
      expect(p.messages.filter((m) => m.startsWith('ORDRE INCORRECT'))).toEqual([])
      expect(p.evenements.filter((x) => x.type === 'faute')).toEqual([])
      const erreurs = p.evenements.filter((x) => x.type === 'erreur')
      expect(erreurs, JSON.stringify(erreurs.slice(0, 3))).toEqual([])
    }, 120_000)
  }
})

describe('agir', () => {
  it('une action sans effet ne change rien', () => {
    const base = enVoyage(apresTutoriel())
    const e = { ...base, pannes: { ...base.pannes, prochaineKm: 1e12 } } // avarie déjà programmée
    const r = agir(e, T0, mulberry32(1), (m) => ({ modules: m, evenements: [] }))
    expect(r.etat).toEqual(e)
  })

  it('un geste qui répare tout tire aussitôt la distance de la prochaine avarie', () => {
    const r = agir(enVoyage(apresTutoriel()), T0, mulberry32(1), (m) => ({ modules: m, evenements: [] }))
    expect(r.etat.pannes.prochaineKm).toBeGreaterThanOrEqual(1_500_000)
  })
})
