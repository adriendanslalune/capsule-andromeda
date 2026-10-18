import { describe, expect, it } from 'vitest'
import { CONTRATS_PROPOSES, DUREE_ACTION, STATIONS } from '../src/donnees/contrats'
import { recompense, type Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'

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
  const jeu = new Jeu()
  jeu.usureJusqua = Number.MAX_SAFE_INTEGER
  jeu.proposes = [contrat]
  jeu.accepter(contrat.id, t0)
  return jeu
}

describe('missions proposées', () => {
  it('six missions, toutes différentes, sur des lieux qui existent, de 50 à 200 crédits', () => {
    const jeu = new Jeu()
    jeu.avancer(t0)
    expect(jeu.proposes).toHaveLength(CONTRATS_PROPOSES)
    expect(new Set(jeu.proposes.map((c) => c.id)).size).toBe(CONTRATS_PROPOSES)
    for (const c of jeu.proposes) {
      for (const e of c.etapes) expect(corps(e.lieu), e.lieu).toBeDefined()
      expect(c.recompense).toBeGreaterThanOrEqual(50)
      expect(c.recompense).toBeLessThanOrEqual(200)
      if (c.genre === 'livrer') {
        expect(c.etapes.map((e) => e.action)).toEqual(['charger', 'livrer'])
        expect(STATIONS).toContain(c.etapes[0].lieu)
      } else expect(c.etapes).toHaveLength(1)
    }
  })

  it('le tirage est reproductible (même graine, mêmes missions)', () => {
    const a = new Jeu(), b = new Jeu()
    a.avancer(t0)
    b.avancer(t0)
    expect(a.proposes).toEqual(b.proposes)
  })

  it('les trois genres finissent par sortir', () => {
    const jeu = new Jeu()
    const genres = new Set<string>()
    for (let k = 0; k < 30; k++) {
      jeu.proposes = []
      jeu.proposer(t0)
      for (const c of jeu.proposes) genres.add(c.genre)
    }
    expect([...genres].sort()).toEqual(['depanner', 'livrer', 'nettoyer'])
  })

  it('récompense : plus loin paie plus, une livraison paie plus', () => {
    expect(recompense('depanner', ['ISS'], t0)).toBe(50)
    expect(recompense('depanner', ['GOES-19'], t0)).toBeGreaterThan(recompense('depanner', ['Hubble'], t0))
    expect(recompense('livrer', ['ISS', 'GOES-19'], t0)).toBeGreaterThan(recompense('depanner', ['GOES-19'], t0))
    expect(recompense('livrer', ['ISS', 'TESS'], t0)).toBeGreaterThanOrEqual(150)
    expect(recompense('livrer', ['ISS', 'TESS'], t0)).toBeLessThanOrEqual(200)
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
    expect(jeu.proposes).toHaveLength(CONTRATS_PROPOSES)
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
    const jeu = new Jeu()
    jeu.avancer(t0)
    const [a, b] = jeu.proposes
    expect(jeu.accepter(a.id, t0)).toBe(true)
    expect(jeu.accepter(b.id, t0)).toBe(false)
    expect(jeu.proposes).toHaveLength(CONTRATS_PROPOSES)
    jeu.abandonner()
    expect(jeu.accepter(b.id, t0)).toBe(true)
  })

  it('temps de trajet d’une mission : un trajet pour un dépannage, deux pour une livraison (le second part de la station)', () => {
    const jeu = new Jeu()
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
