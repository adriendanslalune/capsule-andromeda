import { describe, expect, it } from 'vitest'
import { COMPAGNIES, FRAIS_BOURSE } from '../src/donnees/bourse'
import { corps } from '../src/moteur/corps'
import {
  avancerOrdres, coursAction, devisOrdre, evenementDuJour, historiqueAction, ORIGINE_BOURSE, ordresDesBots, passerOrdre, portefeuilleVide, rumeursEntre,
} from '../src/moteur/bourse'

const t0 = Date.UTC(2026, 9, 20, 12)
const JOUR = 86_400_000
const c = (id: string) => COMPAGNIES.find((x) => x.id === id)!

describe('la Bourse : les cours', () => {
  it('neuf compagnies, chacune avec un siège connu de la carte', () => {
    expect(COMPAGNIES).toHaveLength(9)
    for (const x of COMPAGNIES) expect(corps(x.siege), x.siege).toBeDefined()
  })

  it('reproductibles (les mêmes pour tous), continus, au cours de référence avant le début', () => {
    for (const x of COMPAGNIES) {
      expect(coursAction(x, t0)).toBe(coursAction(x, t0))
      expect(coursAction(x, ORIGINE_BOURSE - 1000)).toBe(x.prix)
      expect(Math.abs(coursAction(x, t0 + 1000) / coursAction(x, t0) - 1)).toBeLessThan(0.01)
    }
  })

  it('restent raisonnables sur six mois, et la compagnie spéculative bouge bien plus que la très stable', () => {
    const ecart = (id: string) => {
      const h = historiqueAction(c(id), t0, t0 + 180 * JOUR, 720).map((p) => Math.log(p.cours / c(id).prix))
      for (const x of h) expect(Math.abs(x), id).toBeLessThan(Math.log(4))
      const m = h.reduce((a, b) => a + b, 0) / h.length
      return Math.sqrt(h.reduce((a, b) => a + (b - m) ** 2, 0) / h.length)
    }
    expect(ecart('confins')).toBeGreaterThan(4 * ecart('vanguard'))
    expect(ecart('jovienne')).toBeGreaterThan(2 * ecart('phare'))
  })
})

describe('la Bourse : rumeurs et ordres des bots', () => {
  it('chaque gros mouvement est annoncé de 2 à 6 heures avant par une rumeur, juste trois fois sur quatre', () => {
    let justes = 0, n = 0
    for (let jour = 0; jour < 400; jour++) for (const x of COMPAGNIES) {
      const e = evenementDuJour(x, jour)
      if (!e) continue
      n++
      const avance = e.debut - e.rumeur.envoye
      expect(avance).toBeGreaterThanOrEqual(2 * 3_600_000)
      expect(avance).toBeLessThanOrEqual(6 * 3_600_000)
      if (e.rumeur.hausse === e.force > 0) justes++
      expect(e.rumeur.texte).toContain(x.nom)
    }
    expect(n).toBeGreaterThan(400)
    expect(justes / n).toBeGreaterThan(0.68)
    expect(justes / n).toBeLessThan(0.82)
  })

  it('un gros mouvement fait bien bouger le cours dans son sens', () => {
    const e = [...Array(60).keys()].map((j) => evenementDuJour(c('confins'), j)).find((x) => x && Math.abs(x.force) > 0.2)!
    const avant = coursAction(c('confins'), e.debut), apres = coursAction(c('confins'), e.debut + 3_600_000)
    expect(Math.sign(Math.log(apres / avant))).toBe(Math.sign(e.force))
  })

  it('les rumeurs d’une journée et les ordres des bots d’une heure', () => {
    const r = rumeursEntre(t0, t0 + JOUR)
    for (const e of r) expect(e.rumeur.envoye).toBeGreaterThan(t0)
    const o = ordresDesBots(c('ares'), t0 - 6 * 3_600_000, t0)
    expect(o.length).toBeGreaterThan(5)
    for (let k = 1; k < o.length; k++) expect(o[k].t).toBeLessThanOrEqual(o[k - 1].t)
    for (const x of o) expect(x.actions).toBeGreaterThan(0)
  })
})

describe('la Bourse : les ordres du joueur', () => {
  it('un achat part avec ses crédits, s’exécute à l’arrivée au siège, se confirme au retour de la lumière', () => {
    const p = portefeuilleVide(), cr = { valeur: 1000 }
    const o = passerOrdre(p, cr, 'jovienne', 'acheter', 500, t0, 40 * 60_000)!
    expect(cr.valeur).toBe(500)
    expect(avancerOrdres(p, cr, t0 + 39 * 60_000, () => 40 * 60_000)).toHaveLength(0)
    expect(o.prix).toBeNull()
    avancerOrdres(p, cr, t0 + 41 * 60_000, () => 40 * 60_000)
    expect(o.prix).toBeCloseTo(coursAction(c('jovienne'), t0 + 40 * 60_000), 6)
    expect(p.positions.jovienne).toBeUndefined()
    expect(avancerOrdres(p, cr, t0 + 81 * 60_000, () => 40 * 60_000)).toEqual([o])
    expect(p.positions.jovienne.actions).toBeCloseTo((500 * (1 - FRAIS_BOURSE)) / o.prix!, 6)
    expect(p.positions.jovienne.investi).toBe(500)
    // La date de la position (demande d'Adrien du 22/10/2026) : quand le premier achat s'est exécuté au siège.
    expect(p.positions.jovienne.depuis).toBe(t0 + 40 * 60_000)
    expect(p.ordres).toHaveLength(0)
    expect(p.journal[0]).toBe(o)
  })

  it('une vente envoie ses actions, rapporte au cours de l’arrivée moins les frais, et compte le gain', () => {
    const p = portefeuilleVide(), cr = { valeur: 0 }
    p.positions.ares = { actions: 10, investi: 1500 }
    const o = passerOrdre(p, cr, 'ares', 'vendre', 4, t0, 1000)!
    expect(p.positions.ares).toEqual({ actions: 6, investi: 900 })
    avancerOrdres(p, cr, t0 + 5000, () => 1000)
    const recu = Math.floor(4 * coursAction(c('ares'), t0 + 1000) * (1 - FRAIS_BOURSE))
    expect(cr.valeur).toBe(recu)
    expect(o.gain).toBe(recu - 600)
    // Tout vendre efface la position.
    passerOrdre(p, cr, 'ares', 'vendre', 99, t0, 0)
    expect(p.positions.ares).toBeUndefined()
  })

  it('impossible sans crédits, sans actions, ou pour une compagnie inconnue', () => {
    const p = portefeuilleVide()
    expect(passerOrdre(p, { valeur: 0 }, 'phare', 'acheter', 100, t0, 0)).toBeNull()
    expect(passerOrdre(p, { valeur: 100 }, 'phare', 'vendre', 1, t0, 0)).toBeNull()
    expect(passerOrdre(p, { valeur: 100 }, 'inconnue', 'acheter', 100, t0, 0)).toBeNull()
    // MAX : tout ce qu'on a.
    const cr = { valeur: 250 }
    expect(passerOrdre(p, cr, 'phare', 'acheter', Infinity, t0, 0)!.credits).toBe(250)
  })
})

describe('la Bourse dans la partie', () => {
  it('un ordre part de la capsule (près de la Terre) : quelques secondes jusqu’à la Lune, des dizaines de minutes jusqu’à Jupiter', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const jeu = new Jeu()
    jeu.credits = 1000
    // Une compagnie n'est cotée qu'une fois la zone de son siège libérée (décision d'Adrien du 21/10/2026).
    expect(jeu.ordreBourse('tycho', 'acheter', 300, t0)).toBeNull()
    jeu.libererZone('Lune')
    jeu.libererZone('Jupiter')
    const lune = jeu.ordreBourse('tycho', 'acheter', 300, t0)!
    const jup = jeu.ordreBourse('jovienne', 'acheter', 300, t0)!
    expect(jeu.credits).toBe(400)
    expect(lune.arrivee - t0).toBeLessThan(5000)
    expect(jup.arrivee - t0).toBeGreaterThan(30 * 60_000)
    jeu.avancerBourse(t0 + 60_000)
    expect(Object.keys(jeu.bourse.positions)).toEqual(['tycho'])
    expect(jeu.annoncesBourse).toEqual([lune])
    jeu.avancerBourse(t0 + 3 * 3_600_000)
    expect(jeu.bourse.positions.jovienne.actions).toBeGreaterThan(0)
  })

  it('le portefeuille et les ordres en route sont sauvegardés', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const { restaurer, sauvegarder } = await import('../src/moteur/sauvegarde')
    const jeu = new Jeu()
    jeu.credits = 1000
    jeu.bourse.positions.ares = { actions: 3.5, investi: 520 }
    jeu.libererZone('Pluton')
    jeu.ordreBourse('confins', 'acheter', 200, t0)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.bourse.positions).toEqual(jeu.bourse.positions)
    expect(copie.bourse.ordres).toEqual(jeu.bourse.ordres)
    expect(copie.credits).toBe(800)
  })
})

describe('les rumeurs dans les Messages', () => {
  it('une rumeur arrive dans le canal général, écrite par son bot, avant le mouvement qu’elle annonce', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const { fil } = await import('../src/moteur/messages')
    const e = rumeursEntre(t0, t0 + 3 * JOUR)[0]
    const t = e.rumeur.envoye + 3_600_000
    const m = fil(new Jeu(), 'general', t).find((x) => x.texte === e.rumeur.texte)!
    expect(m.auteur).toBe(e.rumeur.bot)
    expect(m.recu).toBeLessThan(e.debut)
  })
})

describe('le devis d’un ordre (avant confirmation)', () => {
  it('montre ce qui part, les frais et l’estimation au cours connu, sans rien changer', () => {
    const p = portefeuilleVide()
    const d = devisOrdre(p, 20, 'phare', 'acheter', Infinity, t0)!
    expect(d.quantite).toBe(20)
    expect(d.frais).toBe(5) // au moins 5 crédits (option A d'Adrien)
    expect(d.estime).toBeCloseTo(15 / d.cours, 6)
    expect(devisOrdre(p, 900, 'phare', 'acheter', 900, t0)!.frais).toBeCloseTo(9, 6)
    expect(devisOrdre(p, 5, 'phare', 'acheter', 5, t0)).toBeNull()
    expect(p.ordres).toHaveLength(0)
    expect(devisOrdre(p, 0, 'phare', 'acheter', 100, t0)).toBeNull()
    p.positions.phare = { actions: 2, investi: 80 }
    const v = devisOrdre(p, 0, 'phare', 'vendre', 5, t0)!
    expect(v.quantite).toBe(2)
    expect(v.estime).toBeCloseTo(2 * v.cours - 5, 6)
    expect(p.positions.phare.actions).toBe(2)
  })
})
