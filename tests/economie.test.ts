import { describe, expect, it } from 'vitest'
import { corpsDuSysteme, corpsExiste, planeteDe } from '../src/astro/corps'
import { NOMS_PLANETES } from '../src/donnees/planetes'
import {
  abandonnerContrat,
  accepterContrat,
  acheterAmelioration,
  contratsDeLaSemaine,
  contratsProposes,
  contratsTutorielFaits,
  coutAmelioration,
  crediter,
  destinationDuContrat,
  estInstalle,
  installer,
  primeContrat,
  prochainModule,
  semaineUTC,
  traiterArrivee,
  verifierTrophees,
} from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { choisirDestination, distance, positionAstre } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 13, 12) // mardi 13 octobre 2026
const SEMAINE = 7 * 86_400_000
const neuve = () => creerPartie(T0, mulberry32(1))
const riche = (cr: number) => ({ ...neuve(), credits: cr })
/** Partie dont le tutoriel des contrats est terminé. */
const apresTutoriel = (): EtatPartie => ({ ...neuve(), contratsFaits: ['tutoriel-1', 'tutoriel-2'] })
/** Contrats de la semaine qui ne sont pas « sur place » pour une fusée à côté de l'ISS (ni la Terre, ni l'ISS). */
const lointains = (e: EtatPartie, t = T0) => contratsProposes(e, t).filter((c) => c.destination !== 'Terre' && c.destination !== 'ISS')

/** Fait voyager la partie jusqu'à l'arrivée (pas de 60 s), ou pendant au plus maxSecondes. */
function voyager(etat: EtatPartie, maxSecondes: number) {
  let e = etat
  for (let s = 60; s <= maxSecondes; s += 60) {
    const r = avancerPartie(e, T0 + s * 1000, 60, mulberry32(s))
    e = r.etat
    if (r.arrivee) return { etat: e, t: T0 + s * 1000 }
  }
  return { etat: e, t: T0 + maxSecondes * 1000 }
}

describe('améliorations du moteur', () => {
  it('coût : arrondi(20 × 1,07^n), puis × 1,12 par niveau au-delà de 45', () => {
    expect(coutAmelioration(0)).toBe(20)
    expect(coutAmelioration(1)).toBe(21)
    expect(coutAmelioration(10)).toBe(39)
    expect(coutAmelioration(45)).toBe(420)
    expect(coutAmelioration(46)).toBe(470)
    expect(coutAmelioration(50)).toBe(Math.round(20 * 1.07 ** 45 * 1.12 ** 5))
  })

  it('achat une par une, dans l’ordre ; refusé si les crédits manquent', () => {
    const e = acheterAmelioration(riche(41), T0)
    expect(e.refus).toBeNull()
    expect(e.etat.ameliorations).toBe(1)
    expect(e.etat.credits).toBe(21)
    expect(e.etat.journal[0]).toEqual({ t: T0, raison: 'Amélioration n° 1', montant: -20 })
    const e2 = acheterAmelioration(e.etat, T0)
    expect(e2.etat.ameliorations).toBe(2)
    expect(e2.etat.credits).toBe(0)
    const e3 = acheterAmelioration(e2.etat, T0)
    expect(e3.refus).toBe('Il manque 23 CR.') // 3e amélioration : arrondi(20 × 1,07²) = 23
    expect(e3.etat).toBe(e2.etat)
  })
})

describe('journal des crédits', () => {
  it('garde les 40 dernières opérations, la plus récente en premier', () => {
    let e = neuve()
    for (let i = 1; i <= 50; i++) e = crediter(e, i, `Gain ${i}`, T0 + i)
    expect(e.credits).toBe((50 * 51) / 2)
    expect(e.journal).toHaveLength(40)
    expect(e.journal[0].raison).toBe('Gain 50')
  })
})

describe('installation des modules', () => {
  it('fusée neuve : CH-1, TU-1 et AL-1 seulement', () => {
    const e = neuve()
    for (const m of ['CH-1', 'TU-1', 'AL-1']) expect(estInstalle(e, m)).toBe(true)
    for (const m of ['CO-1', 'SX-1', 'TEL', 'DET']) expect(estInstalle(e, m)).toBe(false)
    expect(prochainModule(e)).toEqual({ code: 'CO-1', nom: 'Codeur', prix: 40 })
  })

  it('dans l’ordre : CO-1 40, PB-1 70, LP-1 110, HY-1 160, RE-1 230, MO-1 320, CR-1 420, AN-1 540, SX-1 680', () => {
    let e = riche(10_000)
    expect(installer(e, 'PB-1', T0).refus).toBe("Il faut d'abord installer CO-1.")
    const ordre = [['CO-1', 40], ['PB-1', 70], ['LP-1', 110], ['HY-1', 160], ['RE-1', 230], ['MO-1', 320],
      ['CR-1', 420], ['AN-1', 540], ['SX-1', 680]] as const
    for (const [code, prix] of ordre) {
      const avant = e.credits
      const r = installer(e, code, T0)
      expect(r.refus, code).toBeNull()
      expect(avant - r.etat.credits).toBe(prix)
      e = r.etat
    }
    expect(prochainModule(e)).toBeNull()
    expect(installer(e, 'SX-1', T0).refus).toBe('SX-1 est déjà installé.')
  })

  it('instruments de chasse : TEL 250, puis DET 1 200 (DET exige TEL)', () => {
    const e = riche(2000)
    expect(installer(e, 'DET', T0).refus).toBe("Il faut d'abord installer TEL.")
    const tel = installer(e, 'TEL', T0)
    expect(tel.etat.credits).toBe(1750)
    const det = installer(tel.etat, 'DET', T0)
    expect(det.refus).toBeNull()
    expect(det.etat.credits).toBe(550)
    expect(estInstalle(det.etat, 'DET')).toBe(true)
  })

  it('refusé si les crédits manquent', () => {
    expect(installer(riche(39), 'CO-1', T0).refus).toBe('Il manque 1 CR.')
    expect(installer(riche(39), 'XX-9', T0).refus).toBe("XX-9 n'existe pas.")
  })
})

describe('contrats du tutoriel', () => {
  it("d'abord ISS → Lune, seul contrat proposé", () => {
    const offres = contratsProposes(neuve(), T0)
    expect(offres).toHaveLength(1)
    expect(offres[0].id).toBe('tutoriel-1')
    expect(offres[0].destination).toBe('Lune')
  })

  it('le voyage vers la Lune remplit le contrat ; puis Lune → ISS ; puis les contrats de la semaine', () => {
    const acc = accepterContrat(neuve(), 'tutoriel-1', T0)
    expect(acc.refus).toBeNull()
    expect(acc.etat.fusee.destination).toBeNull() // accepter ne change pas la destination
    expect(contratsProposes(acc.etat, T0)).toEqual([]) // déjà accepté
    const prime = acc.etat.contrats[0].prime
    const enRoute = { ...acc.etat, fusee: choisirDestination(acc.etat.fusee, destinationDuContrat(acc.etat.contrats[0])) }
    const { etat } = voyager(enRoute, 2 * 86_400)
    expect(etat.fusee.orbite).toBe('Lune')
    expect(etat.contrats).toEqual([])
    expect(etat.credits).toBe(prime)
    expect(etat.stats.contrats).toBe(1)
    expect(etat.trophees).toContain('premier')
    expect(contratsTutorielFaits(etat)).toBe(1)
    const suivant = contratsProposes(etat, T0)
    expect(suivant.map((c) => c.id)).toEqual(['tutoriel-2'])
    expect(suivant[0].destination).toBe('ISS')
    const fini = { ...etat, contratsFaits: [...etat.contratsFaits, 'tutoriel-2'] }
    expect(contratsProposes(fini, T0)).toHaveLength(6)
  })
})

describe('contrats de la semaine', () => {
  it('la semaine commence le lundi à 00:00 UTC', () => {
    expect(semaineUTC(T0)).toBe('2026-10-12')
    expect(semaineUTC(Date.UTC(2026, 9, 12, 0, 0, 0))).toBe('2026-10-12')
    expect(semaineUTC(Date.UTC(2026, 9, 11, 23, 59, 59))).toBe('2026-10-05')
    expect(semaineUTC(Date.UTC(2026, 9, 18, 23, 59))).toBe('2026-10-12')
    expect(semaineUTC(Date.UTC(2026, 0, 5))).toBe('2026-01-05') // départ des saisons de la chasse
  })

  it('6 contrats, mêmes toute la semaine et pour tous, destinations toutes différentes et existantes', () => {
    const a = contratsDeLaSemaine('2026-10-12')
    expect(a).toHaveLength(6)
    expect(contratsDeLaSemaine('2026-10-12')).toEqual(a)
    expect(contratsProposes(apresTutoriel(), T0)).toEqual(contratsProposes(apresTutoriel(), T0 + 4 * 86_400_000))
    expect(new Set(a.map((c) => c.destination)).size).toBe(6)
    for (const c of a) {
      expect(corpsExiste(c.destination), c.destination).toBe(true)
      expect(c.id.startsWith('2026-10-12-')).toBe(true)
      expect(c.texte).not.toMatch(/\{[od]\}/)
    }
    expect(contratsDeLaSemaine('2026-10-19')).not.toEqual(a)
  })

  it('chaque système (et le Soleil) sort environ une fois sur 9, quel que soit son nombre de satellites', () => {
    const compte: Record<string, number> = {}
    let total = 0
    for (let s = 0; s < 300; s++) {
      for (const c of contratsDeLaSemaine(semaineUTC(T0 + s * SEMAINE))) {
        const systeme = c.destination === 'Soleil' ? 'Soleil' : planeteDe(c.destination)
        compte[systeme] = (compte[systeme] ?? 0) + 1
        total++
      }
    }
    for (const p of [...NOMS_PLANETES, 'Soleil']) {
      // Mercure, Vénus et le Soleil n'ont qu'un corps : le refus des doublons d'une même semaine les rend un peu plus rares.
      expect(compte[p] / total, p).toBeGreaterThan(0.07)
      expect(compte[p] / total, p).toBeLessThan(0.16)
    }
  })

  it('les satellites sortent aussi, pas seulement les planètes', () => {
    const dests = new Set<string>()
    for (let s = 0; s < 60; s++) for (const c of contratsDeLaSemaine(semaineUTC(T0 + s * SEMAINE))) dests.add(c.destination)
    const satellites = [...dests].filter((d) => !(NOMS_PLANETES as readonly string[]).includes(d))
    expect(satellites.length).toBeGreaterThan(50)
    expect(corpsDuSysteme('Terre')).toEqual(['Terre', 'Lune', 'ISS'])
  })
})

describe('prime', () => {
  it('base de 10 CR + 10 CR par UA entre le joueur et la destination, figée à l’acceptation', () => {
    const e = apresTutoriel()
    const offre = lointains(e)[0]
    const d = distance(e.fusee.position, positionAstre(offre.destination, T0))
    expect(primeContrat(e, offre, T0)).toBe(Math.round(10 + 10 * d))
    const acc = accepterContrat(e, offre.id, T0)
    expect(acc.etat.contrats[0].prime).toBe(primeContrat(e, offre, T0))
  })

  it('chaque joueur voit un bonus différent selon sa position', () => {
    const e = apresTutoriel()
    const offre = lointains(e)[0]
    const loin: EtatPartie = { ...e, fusee: { ...e.fusee, orbite: null, position: { x: 40, y: 0 } } }
    const d2 = distance(loin.fusee.position, positionAstre(offre.destination, T0))
    expect(primeContrat(loin, offre, T0)).toBe(Math.round(10 + 10 * d2))
    expect(primeContrat(loin, offre, T0)).not.toBe(primeContrat(e, offre, T0))
  })

  it('le cours des contrats (fourni plus tard par le serveur) ne multiplie que la base', () => {
    const e = apresTutoriel()
    const offre = lointains(e)[0]
    const d = distance(e.fusee.position, positionAstre(offre.destination, T0))
    expect(primeContrat(e, offre, T0, 1)).toBe(primeContrat(e, offre, T0))
    expect(primeContrat(e, offre, T0, 2)).toBe(Math.round(20 + 10 * d))
    expect(primeContrat(e, offre, T0, 0)).toBe(Math.round(10 * d))
    expect(accepterContrat(e, offre.id, T0, 1.5).etat.contrats[0].prime).toBe(primeContrat(e, offre, T0, 1.5))
  })
})

describe('plusieurs contrats', () => {
  it('3 contrats au plus en même temps', () => {
    let e = apresTutoriel()
    const offres = lointains(e)
    for (const o of offres.slice(0, 3)) {
      const r = accepterContrat(e, o.id, T0)
      expect(r.refus).toBeNull()
      e = r.etat
    }
    expect(e.contrats).toHaveLength(3)
    expect(contratsProposes(e, T0)).toHaveLength(3) // les 3 autres
    expect(accepterContrat(e, offres[3].id, T0).refus).toBe('3 contrats au plus en même temps.')
    expect(accepterContrat(e, '1999-01-04-0', T0).refus).toBe("Ce contrat n'est pas proposé.")
    expect(accepterContrat(e, offres[0].id, T0).refus).toBe("Ce contrat n'est pas proposé.") // déjà accepté
  })

  it('la destination reste libre ; chaque contrat est rempli en arrivant à sa destination', () => {
    let e = apresTutoriel()
    const [a, b] = lointains(e)
    e = accepterContrat(e, a.id, T0).etat
    e = accepterContrat(e, b.id, T0).etat
    const primeB = e.contrats[1].prime
    const ailleurs = [a.destination, b.destination].includes('Mercure') ? 'Vénus' : 'Mercure'
    e = traiterArrivee(e, { type: 'astre', astre: ailleurs }, T0)
    expect(e.contrats).toHaveLength(2) // ailleurs : rien
    e = traiterArrivee(e, { type: 'astre', astre: b.destination }, T0)
    expect(e.contrats.map((c) => c.id)).toEqual([a.id])
    expect(e.credits).toBe(primeB)
    expect(e.contratsFaits).toContain(b.id)
    expect(contratsProposes(e, T0).map((c) => c.id)).not.toContain(b.id)
  })

  it('abandonner un contrat le libère, sans pénalité ; il est de nouveau proposé', () => {
    let e = apresTutoriel()
    const offre = lointains(e)[0]
    e = accepterContrat(e, offre.id, T0).etat
    const r = abandonnerContrat(e, offre.id)
    expect(r.refus).toBeNull()
    expect(r.etat.contrats).toEqual([])
    expect(r.etat.credits).toBe(0)
    expect(contratsProposes(r.etat, T0).map((c) => c.id)).toContain(offre.id)
    expect(abandonnerContrat(r.etat, offre.id).refus).toBe("Ce contrat n'est pas en cours.")
  })

  it('un contrat accepté reste valable après la fin de la semaine', () => {
    let e = apresTutoriel()
    const offre = lointains(e)[0]
    e = accepterContrat(e, offre.id, T0).etat
    const plusTard = T0 + 3 * SEMAINE
    expect(contratsProposes(e, plusTard).map((c) => c.id)).not.toContain(offre.id) // nouvelle semaine
    e = traiterArrivee(e, { type: 'astre', astre: offre.destination }, plusTard)
    expect(e.contrats).toEqual([])
    expect(e.stats.contrats).toBe(1)
  })
})

describe('contrat vers l’astre où l’on est déjà en orbite', () => {
  it('accepté et rempli aussitôt, prime divisée par 10 (au moins 1 CR)', () => {
    const base = apresTutoriel()
    const offre = lointains(base)[0]
    const surPlace: EtatPartie = {
      ...base,
      fusee: { ...base.fusee, orbite: offre.destination, position: positionAstre(offre.destination, T0) },
    }
    expect(primeContrat(surPlace, offre, T0)).toBe(1) // 10 / 10
    const r = accepterContrat(surPlace, offre.id, T0)
    expect(r.refus).toBeNull()
    expect(r.etat.contrats).toEqual([])
    expect(r.etat.credits).toBe(1)
    expect(r.etat.contratsFaits).toContain(offre.id)
    expect(r.etat.stats.contrats).toBe(1)
  })
})

describe('trophées', () => {
  it('arrivées : Mars, Jupiter, Neptune', () => {
    let e = neuve()
    for (const astre of ['Mars', 'Lune', 'Jupiter', 'Neptune']) e = traiterArrivee(e, { type: 'astre', astre }, T0)
    expect(e.trophees).toEqual(['mars', 'jupiter', 'neptune'])
    expect(traiterArrivee(e, { type: 'astre', astre: 'Mars' }, T0).trophees).toEqual(e.trophees) // pas en double
  })

  it('distance au Soleil : 40 UA (Kuiper), 120 UA (héliopause), 170 UA (Voyager 1)', () => {
    const loin = (ua: number): EtatPartie => {
      const e = neuve()
      return { ...e, fusee: { ...e.fusee, orbite: null, position: { x: ua, y: 0 } } }
    }
    expect(verifierTrophees(loin(39.9)).trophees).toEqual([])
    expect(verifierTrophees(loin(40)).trophees).toEqual(['kuiper'])
    expect(verifierTrophees(loin(120)).trophees).toEqual(['kuiper', 'helio'])
    expect(verifierTrophees(loin(170)).trophees).toEqual(['kuiper', 'helio', 'voyager'])
    expect(verifierTrophees(loin(55)).stats.distanceMaxSoleil).toBe(55)
  })
})

describe('textes et cas particuliers des contrats', () => {
  it('textes corrects : « près de la Terre », « près d’Obéron »', () => {
    const textes: string[] = []
    for (let s = 0; s < 200; s++) for (const c of contratsDeLaSemaine(semaineUTC(T0 + s * SEMAINE))) textes.push(c.texte)
    for (const t of textes) {
      expect(t).not.toMatch(/\bde [AEIOUYÉ]/)
      expect(t).not.toMatch(/\b(de|à) Terre\b/)
    }
    expect(textes.some((t) => t.includes('d’'))).toBe(true)
  })

  it('à côté de l’ISS, un contrat vers la Terre compte comme « sur place »', () => {
    const e = apresTutoriel() // en orbite à côté de l'ISS
    const versTerre = { id: 'essai', type: 'RELEVÉ', texte: 'essai', destination: 'Terre' }
    expect(primeContrat(e, versTerre, T0)).toBe(1)
  })
})
