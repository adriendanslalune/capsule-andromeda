import { describe, expect, it } from 'vitest'
import { corpsDuSysteme, corpsExiste, planeteDe } from '../src/astro/corps'
import { NOMS_PLANETES } from '../src/donnees/planetes'
import {
  accepterContrat,
  acheterAmelioration,
  annulerDestinationEtContrat,
  changerDestination,
  contratsDuJour,
  contratsProposes,
  contratsTutorielFaits,
  coutAmelioration,
  crediter,
  estInstalle,
  installer,
  jourUTC,
  primeContrat,
  prochainModule,
  traiterArrivee,
  verifierTrophees,
} from '../src/moteur/economie'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { distance, positionAstre } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { avancerPartie } from '../src/moteur/partie'

const T0 = Date.UTC(2026, 9, 13, 12)
const neuve = () => creerPartie(T0, mulberry32(1))
const riche = (cr: number) => ({ ...neuve(), credits: cr })
/** Partie dont le tutoriel des contrats est terminé. */
const apresTutoriel = (): EtatPartie => ({ ...neuve(), contratsFaits: ['tutoriel-1', 'tutoriel-2'] })

/** Fait voyager la partie jusqu'à l'arrivée (pas de 60 s), ou pendant au plus maxSecondes. */
function voyager(etat: EtatPartie, maxSecondes: number) {
  let e = etat
  for (let s = 60; s <= maxSecondes; s += 60) {
    const r = avancerPartie(e, T0 + s * 1000, 60)
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

  it('le voyage vers la Lune remplit le contrat ; puis Lune → ISS ; puis les contrats du jour', () => {
    const acc = accepterContrat(neuve(), 'tutoriel-1', T0, 17.4)
    expect(acc.refus).toBeNull()
    const prime = acc.etat.contrat!.prime
    expect(acc.etat.fusee.destination).toEqual({ type: 'astre', astre: 'Lune' })
    const { etat } = voyager(acc.etat, 2 * 86_400)
    expect(etat.fusee.orbite).toBe('Lune')
    expect(etat.contrat).toBeNull()
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

describe('contrats du jour', () => {
  it('6 contrats, mêmes pour tous les joueurs ce jour-là, destinations toutes différentes et existantes', () => {
    const a = contratsDuJour('2026-10-13')
    expect(a).toHaveLength(6)
    expect(contratsDuJour('2026-10-13')).toEqual(a)
    expect(new Set(a.map((c) => c.destination)).size).toBe(6)
    for (const c of a) {
      expect(corpsExiste(c.destination), c.destination).toBe(true)
      expect(c.id.startsWith('2026-10-13-')).toBe(true)
      expect(c.texte).not.toMatch(/\{[od]\}/)
    }
    expect(contratsDuJour('2026-10-14')).not.toEqual(a)
  })

  it('chaque système sort environ une fois sur 8, quel que soit son nombre de satellites', () => {
    const compte: Record<string, number> = {}
    let total = 0
    for (let j = 0; j < 365; j++) {
      for (const c of contratsDuJour(jourUTC(T0 + j * 86_400_000))) {
        compte[planeteDe(c.destination)] = (compte[planeteDe(c.destination)] ?? 0) + 1
        total++
      }
    }
    for (const p of NOMS_PLANETES) {
      // Mercure et Vénus n'ont qu'un corps : le refus des doublons d'une même journée les rend un peu plus rares.
      expect(compte[p] / total, p).toBeGreaterThan(0.08)
      expect(compte[p] / total, p).toBeLessThan(0.17)
    }
  })

  it('les satellites sortent aussi, pas seulement les planètes', () => {
    const dests = new Set<string>()
    for (let j = 0; j < 60; j++) for (const c of contratsDuJour(jourUTC(T0 + j * 86_400_000))) dests.add(c.destination)
    const satellites = [...dests].filter((d) => !(NOMS_PLANETES as readonly string[]).includes(d))
    expect(satellites.length).toBeGreaterThan(50)
    expect(corpsDuSysteme('Terre')).toEqual(['Terre', 'Lune', 'ISS'])
  })

  it('prime : max(6, arrondi(8 + 30 × √distance)), figée à l’acceptation', () => {
    const e = apresTutoriel()
    const offre = contratsProposes(e, T0)[0]
    const d = distance(e.fusee.position, positionAstre(offre.destination, T0))
    expect(primeContrat(e, offre, T0)).toBe(Math.max(6, Math.round(8 + 30 * Math.sqrt(d))))
    const acc = accepterContrat(e, offre.id, T0, 17.4)
    expect(acc.etat.contrat!.prime).toBe(primeContrat(e, offre, T0))
  })

  it('le cours des contrats (fourni plus tard par le serveur) multiplie la prime', () => {
    const e = apresTutoriel()
    const offre = contratsProposes(e, T0)[0]
    const d = distance(e.fusee.position, positionAstre(offre.destination, T0))
    expect(primeContrat(e, offre, T0, 1)).toBe(primeContrat(e, offre, T0))
    expect(primeContrat(e, offre, T0, 2)).toBe(Math.max(6, Math.round((8 + 30 * Math.sqrt(d)) * 2)))
    expect(primeContrat(e, offre, T0, 0.01)).toBe(6) // jamais sous le minimum
    expect(accepterContrat(e, offre.id, T0, 17.4, 'maintenant', 1.5).etat.contrat!.prime)
      .toBe(primeContrat(e, offre, T0, 1.5))
  })

  it('un contrat à la fois ; contrat inconnu refusé', () => {
    const e = apresTutoriel()
    const [c1, c2] = contratsProposes(e, T0)
    const acc = accepterContrat(e, c1.id, T0, 17.4)
    expect(accepterContrat(acc.etat, c2.id, T0, 17.4).refus).toBe('Un contrat est déjà en cours.')
    expect(accepterContrat(e, '1999-01-01-0', T0, 17.4).refus).toBe("Ce contrat n'est pas proposé.")
  })

  it('pendant un contrat, changer de destination est refusé ; annuler abandonne le contrat', () => {
    const e = apresTutoriel()
    const acc = accepterContrat(e, contratsProposes(e, T0)[0].id, T0, 17.4).etat
    expect(changerDestination(acc, { type: 'astre', astre: 'Mars' }, T0, 17.4).refus)
      .toBe('Contrat en cours : annulez-le avant de changer de cap.')
    const annule = annulerDestinationEtContrat(acc)
    expect(annule.contrat).toBeNull()
    expect(annule.fusee.destination).toBeNull()
    expect(changerDestination(annule, { type: 'astre', astre: 'Mars' }, T0, 17.4).refus).toBeNull()
  })

  it('un contrat rempli n’est plus proposé ce jour-là', () => {
    const e = apresTutoriel()
    const offre = contratsProposes(e, T0)[0]
    let acc = accepterContrat(e, offre.id, T0, 17.4).etat
    acc = traiterArrivee(acc, { type: 'astre', astre: offre.destination }, T0)
    expect(acc.contratsFaits).toContain(offre.id)
    expect(contratsProposes(acc, T0).map((c) => c.id)).not.toContain(offre.id)
    expect(contratsProposes(acc, T0)).toHaveLength(5)
    expect(contratsProposes(acc, T0 + 86_400_000)).toHaveLength(6) // le lendemain
  })

  it('arriver ailleurs que la destination du contrat ne le remplit pas', () => {
    const e = apresTutoriel()
    const offre = contratsProposes(e, T0).find((c) => c.destination !== 'Mars')!
    const acc = accepterContrat(e, offre.id, T0, 17.4).etat
    const apres = traiterArrivee(acc, { type: 'astre', astre: 'Mars' }, T0)
    expect(apres.contrat).not.toBeNull()
  })

  it('départ à la fenêtre de tir possible pour un contrat', () => {
    // On cherche un jour où un contrat part vers Mars.
    let jour = T0
    let offre = null
    for (let j = 0; j < 400 && !offre; j++) {
      jour = T0 + j * 86_400_000
      offre = contratsDuJour(jourUTC(jour)).find((c) => c.destination === 'Mars') ?? null
    }
    expect(offre).not.toBeNull()
    const e = apresTutoriel()
    const acc = accepterContrat(e, offre!.id, jour, 17.4, 'fenetre')
    expect(acc.refus).toBeNull()
    expect(acc.etat.fusee.destination).toEqual({ type: 'astre', astre: 'Mars' })
  })
})

describe('contrat vers l’astre où l’on est déjà en orbite', () => {
  it('accepté et rempli aussitôt, prime divisée par 10 (au moins 1 CR)', () => {
    const base = apresTutoriel()
    const offre = contratsProposes(base, T0)[0]
    const surPlace: EtatPartie = {
      ...base,
      fusee: { ...base.fusee, orbite: offre.destination, position: positionAstre(offre.destination, T0) },
    }
    expect(primeContrat(surPlace, offre, T0)).toBe(1) // max(6, 8) / 10 → 1
    const r = accepterContrat(surPlace, offre.id, T0, 17.4)
    expect(r.refus).toBeNull()
    expect(r.etat.contrat).toBeNull()
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
