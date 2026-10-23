import { describe, expect, it } from 'vitest'
import { MARCHANDISES } from '../src/donnees/marche'
import { PNJS, QUETES } from '../src/donnees/quetes'
import type { Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { accepter, avancerQuetes, cheminVersAssaut, ecouterSignal, liberation, principalesAPrendre, radioALire, rattraperSuivi, signalDeQuete, suiteDeLHistoire, objectif, parler, quete, signePnj } from '../src/moteur/quetes'
import { jauge } from '../src/moteur/zones'
import { position } from '../src/moteur/corps'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 20, 12)

/** Une partie où l'on décide soi-même où la capsule est en orbite. */
function partie(): Jeu & { ici: string | null } {
  const jeu = new Jeu() as Jeu & { ici: string | null }
  jeu.ici = 'Terre'
  jeu.lieuEnOrbite = () => jeu.ici
  return jeu
}
const contrat = (genre: string, tableau: string) => ({ id: 1, genre, etapes: [], recompense: 0, tableau }) as unknown as Contrat

const finies = (jeu: Jeu, ids: string[]) => { for (const id of ids) jeu.quetes[id] = { etape: 99, compte: 0, debut: t0, fin: t0 } }
const TUTO = ['t1', 't2', 't3', 't4', 't5', 't6', 't7']

describe('les PNJ et les quêtes : les données', () => {
  it('chaque PNJ est à un lieu de la carte ; chaque quête a un donneur, des conditions et des étapes valables', () => {
    for (const p of PNJS) expect(corps(p.lieu), p.lieu).toBeDefined()
    for (const q of QUETES) {
      expect(PNJS.some((p) => p.id === q.donneur)).toBe(true)
      for (const c of q.conditions) expect(QUETES.some((x) => x.id === c)).toBe(true)
      for (const e of q.etapes) {
        if (e.genre === 'parler') expect(PNJS.some((p) => p.id === e.pnj)).toBe(true)
        if (e.radio) expect(PNJS.some((p) => p.id === e.radio!.pnj)).toBe(true)
        if (e.genre === 'aller' || e.genre === 'livrer') expect(corps(e.lieu)).toBeDefined()
        // On livre des matériaux du Comptoir, ou le colis que la quête a mis dans la soute.
        if (e.genre === 'livrer') for (const m of Object.keys(e.marchandises)) expect(MARCHANDISES.some((x) => x.nom === m) || !!q.don?.[m]).toBe(true)
      }
    }
  })

  it('jamais deux « parle à » de suite (décisions d’Adrien du 22/10/2026)', () => {
    for (const q of QUETES) for (let k = 1; k < q.etapes.length; k++) expect(q.etapes[k - 1].genre === 'parler' && q.etapes[k].genre === 'parler', q.id).toBe(false)
  })
})

describe('le tutoriel autour de la Terre (décisions d’Adrien du 23/10/2026)', () => {
  it('une capsule neuve n’a rien d’installé ; une partie commencée avant la règle a tout', () => {
    const neuve = new Jeu()
    neuve.nouvellePartie(42)
    expect(neuve.installes).toEqual([])
    expect(new Jeu().installe('radar')).toBe(true)
    // Une sauvegarde d'avant la règle (sans la liste) : tout est installé.
    const s = sauvegarder(new Jeu(), t0) as unknown as Record<string, unknown>
    delete s.installes
    expect(restaurer(JSON.parse(JSON.stringify(s)))!.installes.length).toBe(10)
  })

  it('une partie d’avant le tutoriel le compte comme fait ; ses quêtes de la Lune reprennent à l’étape équivalente', () => {
    const s = sauvegarder(new Jeu(), t0) as unknown as Record<string, unknown>
    delete s.installes
    s.quetes = { 'lune-1': { etape: 3, compte: 0, debut: t0, fin: t0 }, 'lune-3': { etape: 1, compte: 0, debut: t0, fin: null } }
    const jeu = restaurer(JSON.parse(JSON.stringify(s)))!
    for (const id of ['t1', 't7', 't8']) expect(jeu.quetes[id]?.fin, id).toBe(t0)
    expect(jeu.quetes.l1).toBeUndefined()
  })

  it('T1 : on parle à Elsa à l’ISS ; elle installe les communications, et envoie T2 par radio avec le colis', () => {
    const jeu = partie()
    jeu.installes = []
    expect(principalesAPrendre(jeu).map((q) => q.id)).toEqual(['t1'])
    expect(objectif(jeu, quete('t1'))).toMatchObject({ lieu: 'ISS' })
    expect(signePnj(jeu, 'elsa')).toEqual({ signe: '!', principale: true })
    jeu.ici = 'ISS'
    const d = parler(jeu, 'elsa', t0)
    expect(d.proposition?.id).toBe('t1')
    const avant = jeu.credits
    accepter(jeu, 't1', t0)
    expect(jeu.quetes.t1.fin).toBe(t0)
    expect(jeu.credits).toBe(avant + 50)
    expect(jeu.installes).toEqual(['communications'])
    // T2 arrive par radio, prise d'office : le colis est dans la soute, la quête suivie.
    expect(jeu.quetes.t2?.fin).toBeNull()
    expect(jeu.soute['Pièces détachées']).toBe(1)
    expect(jeu.queteSuivie).toBe('t2')
    expect(radioALire(jeu, t0 + 1000)?.pnj).toBe('elsa')
  })

  it('T2 puis T3 : la livraison à Tiangong, la réponse radio de Wei Lan, les contrats VIDER, la ferraille', () => {
    const jeu = partie()
    finies(jeu, ['t1'])
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    jeu.ici = 'Tiangong'
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 1)
    expect(jeu.quetes.t2.fin).not.toBeNull()
    expect(jeu.soute['Pièces détachées']).toBeUndefined()
    expect(jeu.radioPnj.map((r) => r.pnj)).toEqual(['elsa', 'weilan', 'weilan'])
    expect(jeu.quetes.t3.fin).toBeNull()
    avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('chasser', 'Terre') }, t0)
    for (let k = 0; k < 3; k++) avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('nettoyer', 'Terre') }, t0 + 2)
    expect(jeu.quetes.t3.etape).toBe(1)
    jeu.soute = { Ferraille: 2.5 }
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 3)
    expect(jeu.quetes.t3.fin).not.toBeNull()
    expect(jeu.soute).toEqual({ Ferraille: 1.5 })
    // T4 se prend chez Joe, près de GOES-19.
    expect(principalesAPrendre(jeu).map((q) => q.id)).toEqual(['t4'])
  })

  it('T4 à T7 : le moteur, la panne voulue, le radar et les chasseurs, le PING', () => {
    const jeu = partie()
    finies(jeu, ['t1', 't2', 't3'])
    jeu.installes = ['communications', 'contrats']
    jeu.ici = 'GOES-19'
    accepter(jeu, 't4', t0)
    expect(jeu.installe('marche')).toBe(true)
    jeu.niveauMoteur = 2
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 1)
    expect(jeu.quetes.t4.fin).not.toBeNull()
    // T5 : l'Énergie coupée à distance ; réparée, l'étape est faite.
    expect(jeu.enPanne('energie')).toBe(true)
    expect(jeu.installe('reparation')).toBe(true)
    jeu.reparer('energie')
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 2)
    expect(jeu.quetes.t5.fin).not.toBeNull()
    // T6 : un chasseur repéré au radar (après le début de l'étape), puis deux abattus près de la Terre.
    expect(jeu.installe('radar') && jeu.installe('armement')).toBe(true)
    jeu.espace.reperes = { vieux: t0 - 10 }
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 3)
    expect(jeu.quetes.t6.etape).toBe(0)
    jeu.espace.reperes = { vieux: t0 - 10, chasseur: t0 + 4 }
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 4)
    expect(jeu.quetes.t6.etape).toBe(1)
    avancerQuetes(jeu, { genre: 'chasseur', systeme: 'Mars' }, t0 + 5)
    avancerQuetes(jeu, { genre: 'chasseur', systeme: 'Terre' }, t0 + 5)
    expect(objectif(jeu, quete('t6'))?.compte).toBe('1/2')
    avancerQuetes(jeu, { genre: 'chasseur', systeme: 'Terre' }, t0 + 6)
    expect(jeu.quetes.t6.fin).not.toBeNull()
    // Sa part de la jauge de la Lune : 15 %.
    expect(jauge(jeu.zones, 'Lune')).toBe(15)
    // T7 chez le Veilleur : le PING, un écho revenu.
    jeu.ici = 'Hubble'
    accepter(jeu, 't7', t0 + 7)
    expect(jeu.installe('ping') && jeu.installe('collections')).toBe(true)
    jeu.monolithes.echos.push({ monolithe: 1, centre: { x: 0, y: 0 }, rayon: 1, envoye: t0 + 8, retour: t0 + 20 })
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 10)
    expect(jeu.quetes.t7.fin).toBeNull()
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 21)
    expect(jeu.quetes.t7.fin).not.toBeNull()
  })

  it('T8 : le signal de Tycho à la radio, calé net 10 s dans le système de la Terre', () => {
    const jeu = partie()
    finies(jeu, TUTO)
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.installe('radio')).toBe(true)
    expect(signalDeQuete(jeu, 'Mars')).toBeNull()
    expect(ecouterSignal(jeu, 'Terre', 6, t0)).toBeNull()
    expect(ecouterSignal(jeu, 'Terre', 4.75, t0)?.nettete).toBeLessThan(0.95)
    ecouterSignal(jeu, 'Terre', 4.712, t0)
    expect(ecouterSignal(jeu, 'Terre', 4.712, t0 + 5000)?.capte).toBe(false)
    expect(ecouterSignal(jeu, 'Terre', 4.712, t0 + 10_000)?.capte).toBe(true)
    expect(jeu.quetes.t8.etape).toBe(1)
    expect(jauge(jeu.zones, 'Lune')).toBe(20)
    jeu.niveauMoteur = 4
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 11_000)
    expect(objectif(jeu, quete('t8'))?.lieu).toBe('Lune')
    jeu.ici = 'Lune'
    parler(jeu, 'keita', t0 + 12_000)
    expect(jeu.quetes.t8.fin).not.toBeNull()
    // La suite arrive par radio : Okafor.
    expect(jeu.quetes.l1?.fin).toBeNull()
  })
})

describe('la Lune, de bout en bout', () => {
  it('livrer à la Station Tycho : il faut tout avoir en soute, au bon endroit ; les marchandises quittent la soute', () => {
    const jeu = partie()
    finies(jeu, [...TUTO, 't8'])
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    jeu.soute = { Eau: 5, Titane: 1 }
    jeu.ici = 'Station Tycho'
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes.l1.etape).toBe(0)
    jeu.soute = { Eau: 6, Titane: 2 }
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 1)
    expect(jeu.quetes.l1.fin).not.toBeNull()
    expect(jeu.soute).toEqual({ Eau: 1 })
  })

  it('le relais, le Séléné repéré au radar près de la Lune, la jauge, l’assaut : la Lune libérée, la Bourse installée', async () => {
    const { ajouterPoints } = await import('../src/moteur/zones')
    const { assautIci } = await import('../src/moteur/quetes')
    const jeu = partie()
    finies(jeu, [...TUTO, 't8', 'l1'])
    jeu.installes = jeu.installes.filter((i) => i !== 'bourse')
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('depanner', 'Terre') }, t0)
    expect(jeu.quetes.l2.etape).toBe(1)
    // Le radar allumé loin de la Lune ne trouve rien.
    jeu.radar.actif = true
    jeu.mission.etat = () => ({ position: position('Terre', t0) }) as ReturnType<typeof jeu.mission.etat>
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 1)
    expect(jeu.quetes.l2.etape).toBe(1)
    jeu.mission.etat = (t: number) => ({ position: position('Lune', t) }) as ReturnType<typeof jeu.mission.etat>
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 2)
    expect(jeu.quetes.l2.fin).not.toBeNull()
    expect(objectif(jeu, quete('l3'))).toMatchObject({ lieu: 'Lune' })
    ajouterPoints(jeu.zones, 'Lune', 100)
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 3)
    expect(jeu.quetes.l3.etape).toBe(1)
    jeu.ici = 'Lune'
    expect(assautIci(jeu, t0)).toBe('Lune')
    jeu.gagnerAssaut('Lune', t0 + 4)
    expect(jeu.zones.liberees).toEqual(['Lune'])
    expect(jeu.quetes.l3.fin).not.toBeNull()
    expect(jeu.installe('bourse')).toBe(true)
    expect(liberation('Lune').pnj.id).toBe('okafor')
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.quetes).toEqual(jeu.quetes)
    expect(copie.radioPnj).toEqual(jeu.radioPnj)
    expect(copie.installes).toEqual(jeu.installes)
    expect(copie.queteSuivie).toBe('interieures')
  })
})

describe('le chemin vers l’assaut d’une zone (Adrien, 22/10/2026 : la Lune à 100 % restait occupée sans explication)', () => {
  it('dit, à chaque moment, ce qu’il reste à faire pour lancer l’assaut', () => {
    const jeu = new Jeu(), t = Date.UTC(2026, 9, 22, 12)
    finies(jeu, ['t1', 't2', 't3'])
    // T4 à prendre chez Joe.
    expect(cheminVersAssaut(jeu, 'Lune')).toMatch(/avance d'abord dans la quête « Le garage de Joe » : Joe Hennessy t'attend \(GOES-19\)/)
    jeu.quetes.t4 = { etape: 0, compte: 0, debut: t, fin: null }
    expect(cheminVersAssaut(jeu, 'Lune')).toMatch(/« Le garage de Joe » : installe le moteur de niveau 2/)
    jeu.quetes.l3 = { etape: 1, compte: 0, debut: t, fin: null }
    expect(cheminVersAssaut(jeu, 'Lune')).toMatch(/orbite autour de la Lune et lance l'ASSAUT/)
    expect(cheminVersAssaut(jeu, 'Terre')).toBeNull()
  })
})

describe('les principales à prendre sont des quêtes comme les autres (Adrien, 22/10/2026)', () => {
  it('leur objectif : parler à celui qui les donne ; on les suit ; une secondaire suivie leur cède la place au chargement', () => {
    const jeu = new Jeu(), t = Date.UTC(2026, 9, 22, 12)
    finies(jeu, ['t1', 't2', 't3'])
    jeu.quetes.rosa = { etape: 0, compte: 0, debut: t, fin: null }
    jeu.queteSuivie = 'rosa'
    expect(principalesAPrendre(jeu).map((q) => q.id)).toEqual(['t4'])
    expect(objectif(jeu, quete('t4'))!.texte).toMatch(/Joe Hennessy/)
    rattraperSuivi(jeu)
    expect(jeu.queteSuivie).toBe('t4')
    jeu.queteSuivie = 'rosa'
    expect(suiteDeLHistoire(jeu)?.id).toBe('t4')
  })
})

describe('les planètes intérieures (docs/campagne-detail.md, validé par Adrien le 23/10/2026)', () => {
  it('chaque arc remplit 80 % de sa jauge par ses étapes, puis la jauge et l’assaut ; ses PNJ sont ceux des Voix perdues', () => {
    for (const [id, zone, pnj] of [['liberer-mars', 'Mars', 'helene'], ['liberer-venus', 'Vénus', 'odile'], ['liberer-mercure', 'Mercure', 'aurelio']]) {
      const q = quete(id)
      expect(q.donneur).toBe(pnj)
      expect(q.etapes.reduce((s, e) => s + (e.jauge?.zone === zone ? e.jauge.part : 0), 0)).toBe(80)
      expect(q.etapes.slice(-2).map((e) => e.genre)).toEqual(['jauge', 'assaut'])
      expect(liberation(zone).pnj.id).toBe(pnj)
    }
  })

  it('Mars : le convoi, le chasseur, la balise à la radio, Beagle 2 ; Hélène répond à chaque fois', () => {
    const jeu = partie()
    finies(jeu, [...TUTO, 't8', 'l1', 'l2', 'l3'])
    jeu.ici = 'Mars'
    accepter(jeu, 'liberer-mars', t0)
    avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('escorter', 'Mars') }, t0 + 1)
    avancerQuetes(jeu, { genre: 'chasseur', systeme: 'Mars' }, t0 + 2)
    expect(jeu.quetes['liberer-mars'].etape).toBe(2)
    ecouterSignal(jeu, 'Mars', 6.12, t0 + 3)
    ecouterSignal(jeu, 'Mars', 6.12, t0 + 13_003)
    expect(jeu.quetes['liberer-mars'].etape).toBe(3)
    const beagle = 17
    jeu.disparus.trouves[beagle] = t0 + 14_000
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 15_000)
    expect(jeu.quetes['liberer-mars'].etape).toBe(4)
    expect(jauge(jeu.zones, 'Mars')).toBe(80)
    expect(jeu.radioPnj.filter((r) => r.pnj === 'helene')).toHaveLength(4)
  })

  it('les lieux renommés (Cythère, le Phare de Mercure) : une vieille sauvegarde suit', () => {
    const jeu = new Jeu()
    const s = JSON.parse(JSON.stringify(sauvegarder(jeu, t0)))
    s.proposes = [{ id: 7, genre: 'livrer', etapes: [{ lieu: 'Aérostat Ishtar', action: 'charger' }, { lieu: 'Observatoire Messenger', action: 'livrer' }], recompense: 100, tableau: 'Vénus' }]
    const copie = restaurer(s)!
    expect(JSON.stringify(copie.proposes)).not.toMatch(/Ishtar|Observatoire/)
    expect(JSON.stringify(copie.proposes)).toMatch(/Cythère.*Phare de Mercure/)
    expect(corps('Cythère')).toBeDefined()
    expect(corps('Phare de Mercure')).toBeDefined()
  })
})
