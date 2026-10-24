import { describe, expect, it } from 'vitest'
import { MARCHANDISES } from '../src/donnees/marche'
import { PNJS, QUETES } from '../src/donnees/quetes'
import type { Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { accepter, avancerQuetes, cheminVersAssaut, ecouterSignal, liberation, radioALire, rattraperSuivi, suiteDeLHistoire, objectif, parler, quete } from '../src/moteur/quetes'
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

describe('le début (Adrien, 24/10/2026 : une quête pour le moteur, puis la Lune)', () => {
  it('tout est installé dès le départ', () => {
    const neuve = new Jeu()
    neuve.nouvellePartie(42, t0)
    expect(neuve.installes.length).toBe(10)
    expect(neuve.presentation).toBe(true)
  })

  it('Elsa appelle par radio : améliorer le moteur ; le niveau 2 ne demande presque pas de ferraille', () => {
    const jeu = partie()
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes.q1?.fin).toBeNull()
    expect(radioALire(jeu, t0 + 1000)?.quete).toBe('q1')
    expect(objectif(jeu, quete('q1'))?.texte).toMatch(/moteur de niveau 2/)
    expect(jeu.moteurSuivant()!.materiaux).toEqual({ Ferraille: 0.5 })
    jeu.niveauMoteur = 2
    avancerQuetes(jeu, { genre: 'instant' }, t0 + 2000)
    expect(jeu.quetes.q1.fin).not.toBeNull()
    // Elsa explique la suite (contrats, moteur, le Comptoir), puis envoie la Lune.
    expect(jeu.radioPnj.some((r) => r.texte.join(' ').includes('Comptoir'))).toBe(true)
    expect(jeu.quetes.q2?.fin).toBeNull()
    expect(objectif(jeu, quete('q2'))).toMatchObject({ lieu: 'Lune' })
  })

  it('sur la Lune, Keïta : la jauge de la Lune monte, Okafor appelle', () => {
    const jeu = partie()
    finies(jeu, ['q1'])
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    jeu.ici = 'Lune'
    parler(jeu, 'keita', t0 + 1)
    expect(jeu.quetes.q2.fin).not.toBeNull()
    expect(jauge(jeu.zones, 'Lune')).toBe(25)
    expect(jeu.quetes.l1?.fin).toBeNull()
  })

  it('une ancienne partie reprend à l’étape équivalente (avant le tutoriel, ou en plein tutoriel du 23/10)', () => {
    const vieille = sauvegarder(new Jeu(), t0) as unknown as Record<string, unknown>
    vieille.quetes = { 'lune-1': { etape: 3, compte: 0, debut: t0, fin: t0 }, 'lune-3': { etape: 1, compte: 0, debut: t0, fin: null } }
    const a = restaurer(JSON.parse(JSON.stringify(vieille)))!
    expect(a.quetes.q1?.fin).toBe(t0)
    expect(a.quetes.q2?.fin).toBe(t0)
    expect(a.quetes.l1).toBeUndefined()
    const tuto = sauvegarder(new Jeu(), t0) as unknown as Record<string, unknown>
    tuto.quetes = { t1: { etape: 1, compte: 0, debut: t0, fin: t0 }, t2: { etape: 0, compte: 0, debut: t0, fin: null } }
    tuto.installes = ['communications']
    const b = restaurer(JSON.parse(JSON.stringify(tuto)))!
    expect(b.quetes.q1).toBeUndefined()
    expect(b.installes.length).toBe(10)
  })
})

describe('la Lune, de bout en bout', () => {
  it('livrer à la Station Tycho : il faut tout avoir en soute, au bon endroit ; les marchandises quittent la soute', () => {
    const jeu = partie()
    finies(jeu, ['q1', 'q2'])
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
    finies(jeu, ['q1', 'q2', 'l1'])
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
    expect(copie.queteSuivie).toBe('interieures')
  })
})

describe('le chemin vers l’assaut d’une zone (Adrien, 22/10/2026 : la Lune à 100 % restait occupée sans explication)', () => {
  it('dit, à chaque moment, ce qu’il reste à faire pour lancer l’assaut', () => {
    const jeu = new Jeu(), t = Date.UTC(2026, 9, 22, 12)
    jeu.quetes.q1 = { etape: 0, compte: 0, debut: t, fin: null }
    expect(cheminVersAssaut(jeu, 'Lune')).toMatch(/« Le cœur de la capsule » : installe le moteur de niveau 2/)
    jeu.quetes.l3 = { etape: 1, compte: 0, debut: t, fin: null }
    expect(cheminVersAssaut(jeu, 'Lune')).toMatch(/orbite autour de la Lune et lance l'ASSAUT/)
    expect(cheminVersAssaut(jeu, 'Terre')).toBeNull()
  })
})

describe('les principales à prendre sont des quêtes comme les autres (Adrien, 22/10/2026)', () => {
  it('le tableau de bord montre toujours la suite de l’histoire ; une secondaire suivie lui cède la place au chargement', () => {
    const jeu = new Jeu(), t = Date.UTC(2026, 9, 22, 12)
    jeu.quetes.q1 = { etape: 1, compte: 0, debut: t, fin: t }
    jeu.quetes.rosa = { etape: 0, compte: 0, debut: t, fin: null }
    jeu.queteSuivie = 'rosa'
    jeu.presentation = false
    expect(suiteDeLHistoire(jeu)).toBeNull()
    jeu.presentation = true
    expect(suiteDeLHistoire(jeu)?.id).toBe('q2')
    rattraperSuivi(jeu)
    expect(jeu.queteSuivie).toBe('q2')
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
    finies(jeu, ['q1', 'q2', 'l1', 'l2', 'l3'])
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
