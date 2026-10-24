import { describe, expect, it } from 'vitest'
import { DUREE_ACTION, STATIONS } from '../src/donnees/contrats'
import { TABLEAUX, ZONES } from '../src/donnees/tableaux'
import { facteurEloignement, recompense, type Contrat } from '../src/moteur/contrats'
import { partDuSysteme } from '../src/moteur/tableaux'
import { corps, position } from '../src/moteur/corps'
import { EPAVES } from '../src/donnees/espace'
import { Jeu } from '../src/moteur/jeu'
import { maisonDuContrat } from '../src/donnees/maisons'
import { planifier } from '../src/moteur/mission'

/** Hors du tutoriel (« Le cœur de la capsule » finie) : le tableau de la Terre ordinaire. */
const horsTutoriel = (j: Jeu): Jeu => { j.quetes.q1 = { etape: 1, compte: 0, debut: 0, fin: 0 }; return j }

const t0 = Date.UTC(2026, 9, 17, 12)

/** Emmène la capsule à un lieu (départ à t) ; renvoie l'instant d'arrivée. */
function allerA(jeu: Jeu, lieu: string, t: number): number {
  const p = planifier(jeu.mission.etatHeliocentrique(t), lieu, t, jeu.vitesse())
  if (!p.possible) throw new Error(`${lieu} impossible`)
  jeu.mission.partir(p.plan)
  return p.plan.arrivee
}

/** Un jeu avec une mission choisie, déjà acceptée (sans usure : ces essais ne parlent pas des pannes). */
function avecContrat(contrat: Contrat): Jeu {
  const jeu = horsTutoriel(new Jeu())
  jeu.usureJusqua = Number.MAX_SAFE_INTEGER
  jeu.proposes = [contrat]
  jeu.accepter(contrat.id, t0)
  return jeu
}

/** Nombre de missions de tous les tableaux : 6 par système. */
const TOTAL = TABLEAUX.reduce((s, x) => s + x.nombre, 0)

describe('missions proposées (décisions d’Adrien du 18/10/2026)', () => {
  it('9 systèmes, 6 missions chacun, et 4 autour de chaque grande lune, toutes différentes, sur des lieux qui existent', () => {
    expect(TABLEAUX.filter((x) => x.centre === x.systeme).map((x) => x.lieu)).toEqual(['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'])
    expect(TABLEAUX.filter((x) => x.centre !== x.systeme)).toHaveLength(19)
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    expect(jeu.proposes).toHaveLength(TOTAL)
    expect(new Set(jeu.proposes.map((c) => c.id)).size).toBe(TOTAL)
    for (const x of TABLEAUX) expect(jeu.proposes.filter((c) => c.tableau === x.lieu), x.lieu).toHaveLength(x.nombre)
    for (const c of jeu.proposes) {
      for (const e of c.etapes) expect(corps(e.lieu), e.lieu).toBeDefined()
      if (c.genre === 'livrer') expect(c.etapes.map((e) => e.action)).toEqual(['charger', 'livrer'])
      else if (c.genre === 'remorquer') expect(c.etapes.map((e) => e.action)).toEqual(['harponner', 'larguer'])
      else if (c.genre === 'escorter') expect(c.etapes.map((e) => e.action)).toEqual(['rejoindre', 'escorter'])
      else expect(c.etapes).toHaveLength(1)
      if (c.tableau === 'Terre' && c.genre === 'livrer') expect(STATIONS).toContain(c.etapes[0].lieu)
    }
  })

  it('dans chaque système, des missions proches et des lointaines (3 proches, 2 moyennes, 1 lointaine quand le système le permet)', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    const systemes = TABLEAUX.filter((x) => x.centre === x.systeme)
    for (const x of systemes) {
      const ici = jeu.proposes.filter((c) => c.tableau === x.lieu)
      expect(ici.every((c) => c.portee), x.lieu).toBe(true)
      expect(ici.some((c) => c.portee === 'proche'), x.lieu).toBe(true)
    }
    // (La Terre au moteur de départ : tout est proche, voir le début de partie.)
    for (const x of systemes.filter((x) => x.lieu !== 'Terre')) {
      const ici = jeu.proposes.filter((c) => c.tableau === x.lieu)
      expect(ici.some((c) => c.portee !== 'proche'), x.lieu).toBe(true)
      expect(ici.filter((c) => c.portee === 'lointaine').length, x.lieu).toBeLessThanOrEqual(2)
    }
    // Sur tous les systèmes : à peu près 3 proches, 2 moyennes, 1 lointaine (quand les lieux le permettent).
    const n = (p: string) => jeu.proposes.filter((c) => c.portee === p && systemes.some((x) => x.lieu === c.tableau)).length
    expect(n('proche')).toBeGreaterThan(n('moyenne'))
    expect(n('moyenne')).toBeGreaterThan(n('lointaine'))
    // (Tous les genres à chaque fois passent avant la portée, demande d'Adrien du 22/10/2026 : un peu moins de lointaines.)
    expect(n('lointaine')).toBeGreaterThanOrEqual(3)
  })

  it('début de partie (demande d’Adrien du 21/10/2026) : autour de la Terre, les contrats restent à 25 minutes de vol du moteur', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    const distance = (l: string) => { const p = position(l, t0), q = position('Terre', t0); return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) }
    const loin = (j: Jeu) => Math.max(...j.proposes.filter((c) => c.tableau === 'Terre').flatMap((c) => c.etapes.map((e) => distance(e.lieu))))
    expect(jeu.proposes.filter((c) => c.tableau === 'Terre')).toHaveLength(6)
    expect(loin(jeu)).toBeLessThanOrEqual(30 * 25 * 60)
    // Un contrat d'avant la règle, trop loin, est remplacé ; le cercle s'élargit avec le moteur.
    jeu.proposes.find((c) => c.tableau === 'Terre')!.etapes[0].lieu = 'Lune'
    jeu.proposer(t0)
    expect(loin(jeu)).toBeLessThanOrEqual(30 * 25 * 60)
    jeu.niveauMoteur = 4
    jeu.proposes = []
    jeu.proposer(t0)
    expect(loin(jeu)).toBeGreaterThan(30 * 25 * 60)
  })

  it('pas d’aberration : on ne remorque qu’une vraie épave, jusqu’à une autre station ; on ne livre jamais au point de départ', () => {
    for (let k = 0; k < 40; k++) {
      const jeu = horsTutoriel(new Jeu())
      jeu.graine = 1000 + k
      jeu.niveauMoteur = 1 + (k % 6)
      jeu.avancer(t0)
      for (const c of jeu.proposes) {
        if (c.genre === 'remorquer') {
          expect(EPAVES.some((e) => e.nom === c.etapes[0].lieu), c.etapes[0].lieu).toBe(true)
          expect(c.etapes[1].lieu).not.toBe(c.etapes[0].lieu)
        }
        if (c.etapes.length === 2) expect(c.etapes[1].lieu, `${c.genre} ${c.etapes[0].lieu}`).not.toBe(c.etapes[0].lieu)
        for (const e of c.etapes) expect(e.lieu, c.genre).toBeTruthy()
      }
    }
  })

  it('le prix monte avec l’éloignement dans le système, de ×1 à ×2 (la Lune paie environ 1,5 fois l’ISS)', () => {
    expect(facteurEloignement(0)).toBe(1)
    expect(facteurEloignement(1)).toBe(2)
    const lune = partDuSysteme('Lune', 'Terre', t0), iss = partDuSysteme('ISS', 'Terre', t0)
    expect(facteurEloignement(iss)).toBeLessThan(1.02)
    expect(facteurEloignement(lune)).toBeGreaterThan(1.4)
    expect(facteurEloignement(lune)).toBeLessThan(1.65)
  })

  it('chaque mission se passe dans le système de son lieu', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    for (const c of jeu.proposes) {
      const systeme = TABLEAUX.find((x) => x.lieu === c.tableau)!.centre
      for (const e of c.etapes) {
        const k = corps(e.lieu)!
        expect(e.lieu === systeme || k.parent === systeme || (k.parent === 'Terre' && systeme === 'Terre'), `${c.tableau} : ${e.lieu}`).toBe(true)
      }
    }
  })

  it('autour de chaque grande lune (demande d’Adrien du 21/10/2026) : des contrats sur place, payés comme la lune dans son système', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    const lune = jeu.proposes.filter((c) => c.tableau === 'Lune')
    expect(lune).toHaveLength(4)
    for (const c of lune) for (const e of c.etapes) expect(e.lieu === 'Lune' || corps(e.lieu)!.parent === 'Lune', e.lieu).toBe(true)
    // La Lune est à mi-distance dans le système de la Terre : ×1,5 environ, donc de 75 à 210 crédits selon le contrat.
    for (const c of lune) { expect(c.portee).toBe('moyenne'); expect(c.recompense).toBeGreaterThanOrEqual(70) }
    // Chaque grande lune a ses contrats, et ses Maisons y sont toutes.
    for (const x of TABLEAUX.filter((x) => x.centre !== x.systeme)) {
      const ici = jeu.proposes.filter((c) => c.tableau === x.lieu)
      expect(new Set(ici.map(maisonDuContrat)).size, x.lieu).toBe(3)
    }
  })

  it('le tirage est reproductible (même graine, mêmes missions)', () => {
    const a = horsTutoriel(new Jeu()), b = horsTutoriel(new Jeu())
    a.avancer(t0)
    b.avancer(t0)
    expect(a.proposes).toEqual(b.proposes)
  })

  it('les six types sortent, deux par Maison (décision d’Adrien du 18/10/2026)', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    expect([...new Set(jeu.proposes.map((c) => c.genre))].sort()).toEqual(['chasser', 'depanner', 'escorter', 'livrer', 'nettoyer', 'remorquer'])
    for (const c of jeu.proposes) expect(maisonDuContrat(c)).toBe({ nettoyer: 'nettoyeurs', remorquer: 'nettoyeurs', chasser: 'mercenaires', escorter: 'mercenaires', depanner: 'ingenieurs', livrer: 'ingenieurs' }[c.genre])
    for (const c of jeu.proposes.filter((x) => x.genre === 'chasser')) expect(corps(c.etapes[0].lieu)?.type).toBe('alien')
  })

  it('tous les genres possibles à chaque fois (demande d’Adrien du 22/10/2026) : dès le début, ABATTRE autour de la Terre', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    for (const systeme of ['Terre', 'Mars', 'Jupiter', 'Saturne']) {
      const genres = new Set(jeu.proposes.filter((c) => c.tableau === systeme).map((c) => c.genre))
      expect([...genres].sort(), systeme).toEqual(['chasser', 'depanner', 'escorter', 'livrer', 'nettoyer', 'remorquer'])
    }
    // Autour de la Lune (4 contrats), quatre genres différents.
    expect(new Set(jeu.proposes.filter((c) => c.tableau === 'Lune').map((c) => c.genre)).size).toBe(4)
    // Une partie plus ancienne, avec deux contrats du même genre pour une Maison : l'un est remplacé par l'autre genre.
    const vieux = jeu.proposes.filter((c) => c.tableau === 'Terre' && c.genre === 'escorter')[0]
    const chasse = jeu.proposes.find((c) => c.tableau === 'Terre' && c.genre === 'chasser')!
    jeu.proposes = jeu.proposes.map((c) => (c === chasse ? { ...vieux, id: 9999 } : c))
    jeu.proposer(t0 + 1000)
    expect(jeu.proposes.filter((c) => c.tableau === 'Terre' && c.genre === 'chasser')).toHaveLength(1)
    jeu.proposer(t0 + 2000)
    const ids = jeu.proposes.map((c) => c.id).join()
    jeu.proposer(t0 + 3000)
    expect(jeu.proposes.map((c) => c.id).join()).toBe(ids)
  })

  it('prix : fixé par la zone (loin et dangereux paie plus), jamais par la position de la capsule', () => {
    expect(recompense('depanner', 1, 0)).toBe(50)
    expect(recompense('depanner', 1, 1)).toBe(100)
    expect(recompense('livrer', 1, 0)).toBe(70)
    expect(recompense('chasser', 1, 0)).toBeGreaterThan(recompense('depanner', 1, 0))
    expect(recompense('depanner', ZONES.Neptune, 0.5)).toBe(3380) // 75 cr. × 45, à la dizaine
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    const moyenne = (lieu: string) => { const l = jeu.proposes.filter((c) => c.tableau === lieu); return l.reduce((s, c) => s + c.recompense, 0) / l.length }
    expect(moyenne('Neptune')).toBeGreaterThan(10 * moyenne('Terre'))
    expect(moyenne('Mercure')).toBeGreaterThan(moyenne('Vénus'))
  })
})

describe('faire une mission', () => {
  const reparerGoes: Contrat = { id: 99, genre: 'depanner', etapes: [{ lieu: 'GOES-19', action: 'reparer' }], recompense: 120 }

  it('aller sur place, réparer pendant 2 minutes, toucher la récompense ; une nouvelle mission est proposée', () => {
    const jeu = avecContrat(reparerGoes)
    expect(jeu.peutAgir(t0)).toBe(false) // pas encore sur place
    const arrivee = allerA(jeu, 'GOES-19', t0)
    const t = arrivee + 1000
    expect(jeu.surPlace(t)).toBe(true)
    expect(jeu.agir(t)).toBe(true)
    expect(jeu.agir(t)).toBe(false) // déjà en cours
    expect(jeu.avancer(t + DUREE_ACTION - 1000)).toEqual([])
    expect(jeu.credits).toBe(0)
    const ev = jeu.avancer(t + DUREE_ACTION)
    expect(ev.map((e) => e.genre)).toEqual(['etape-finie', 'contrat-fini'])
    expect(jeu.credits).toBe(120)
    expect(jeu.enCours).toBeNull()
    expect(jeu.proposes.filter((c) => c.tableau)).toHaveLength(TOTAL)
  })

  it('une livraison : charger à la station, puis livrer', () => {
    const livraison: Contrat = { id: 98, genre: 'livrer', etapes: [{ lieu: 'ISS', action: 'charger' }, { lieu: 'Hubble', action: 'livrer' }], recompense: 70 }
    const jeu = avecContrat(livraison)
    let t = allerA(jeu, 'ISS', t0) + 1000
    expect(jeu.etapeActuelle()?.action).toBe('charger')
    jeu.agir(t)
    t += DUREE_ACTION
    expect(jeu.avancer(t).map((e) => e.genre)).toEqual(['etape-finie'])
    expect(jeu.etapeActuelle()).toEqual({ lieu: 'Hubble', action: 'livrer' })
    expect(jeu.peutAgir(t)).toBe(false) // pas encore à Hubble
    t = allerA(jeu, 'Hubble', t) + 1000
    jeu.agir(t)
    jeu.avancer(t + DUREE_ACTION)
    expect(jeu.credits).toBe(70)
  })

  it('partir pendant l’action l’interrompt (même si on ne regarde qu’après)', () => {
    const jeu = avecContrat(reparerGoes)
    const t = allerA(jeu, 'GOES-19', t0) + 1000
    jeu.agir(t)
    allerA(jeu, 'ISS', t + 30_000)
    const ev = jeu.avancer(t + 10 * DUREE_ACTION)
    expect(ev.map((e) => e.genre)).toEqual(['action-interrompue'])
    expect(jeu.credits).toBe(0)
    expect(jeu.enCours?.etape).toBe(0)
  })

  it('une seule mission à la fois ; abandonner libère la place', () => {
    const jeu = horsTutoriel(new Jeu())
    jeu.avancer(t0)
    const [a, b] = jeu.proposes
    expect(jeu.accepter(a.id, t0)).toBe(true)
    expect(jeu.accepter(b.id, t0)).toBe(false)
    expect(jeu.proposes).toHaveLength(TOTAL)
    jeu.abandonner()
    expect(jeu.accepter(b.id, t0)).toBe(true)
  })

  it('temps de trajet d’une mission : un trajet pour un dépannage, deux pour une livraison (le second part de la station)', () => {
    const jeu = horsTutoriel(new Jeu())
    const reparer: Contrat = { id: 1, genre: 'depanner', etapes: [{ lieu: 'GOES-19', action: 'reparer' }], recompense: 100 }
    const livrer: Contrat = { id: 2, genre: 'livrer', etapes: [{ lieu: 'ISS', action: 'charger' }, { lieu: 'GOES-19', action: 'livrer' }], recompense: 100 }
    const [p] = jeu.trajetsContrat(reparer, t0, 30)!
    expect(p.cible).toBe('GOES-19')
    const deux = jeu.trajetsContrat(livrer, t0, 30)!
    expect(deux.map((q) => q.cible)).toEqual(['ISS', 'GOES-19'])
    expect(deux[1].depart).toBe(deux[0].arrivee + DUREE_ACTION)
    expect(jeu.dureeTrajets(livrer, t0, 30)).toBe(deux.reduce((s, q) => s + q.arrivee - q.depart, 0))
    // Plus rapide avec un meilleur moteur.
    expect(jeu.dureeTrajets(reparer, t0, 60)!).toBeLessThan(jeu.dureeTrajets(reparer, t0, 30)!)
  })

  it('déjà sur le lieu de l’étape : pas de trajet pour elle', () => {
    const jeu = avecContrat(reparerGoes)
    const t = allerA(jeu, 'GOES-19', t0) + 1000
    expect(jeu.trajetsContrat(reparerGoes, t, 30)).toEqual([])
    expect(jeu.dureeTrajets(reparerGoes, t, 30)).toBe(0)
  })

  it('une livraison s’enchaîne : la cargaison chargée, la capsule part d’elle-même vers le satellite', () => {
    const livraison: Contrat = { id: 97, genre: 'livrer', etapes: [{ lieu: 'ISS', action: 'charger' }, { lieu: 'GOES-19', action: 'livrer' }], recompense: 100 }
    const jeu = avecContrat(livraison)
    const t = allerA(jeu, 'ISS', t0) + 1000
    jeu.agir(t)
    // On ne regarde que bien plus tard (application fermée) : le départ a eu lieu à la fin du chargement.
    const ev = jeu.avancer(t + DUREE_ACTION + 60_000, 30)
    expect(ev.map((e) => e.genre)).toEqual(['etape-finie', 'depart-auto'])
    expect(jeu.mission.plan?.cible).toBe('GOES-19')
    expect(jeu.mission.plan?.depart).toBe(t + DUREE_ACTION)
    const arrivee = jeu.mission.plan!.arrivee
    expect(jeu.peutAgir(arrivee + 1000)).toBe(true)
  })
})
