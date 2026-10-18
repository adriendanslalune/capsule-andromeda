import { describe, expect, it } from 'vitest'
import { BACS, DUREE_TRI, OBJETS_EPAVE, SERIE_MAX, TONNES_PAR_OBJET } from '../src/donnees/tri'
import { MARCHANDISES } from '../src/donnees/marche'
import { nouveauTri, objetsTries, resteTri, tonnesTriees, trier } from '../src/moteur/tri'

const t0 = 5_000_000

describe('le tri des matériaux d’une épave', () => {
  it('une trentaine d’objets, tous différents ; chaque bac en a ; chaque matière se vend au Marché (sauf le rebut)', () => {
    expect(OBJETS_EPAVE.length).toBe(30)
    expect(new Set(OBJETS_EPAVE.map((o) => o.nom)).size).toBe(30)
    for (const b of BACS) expect(OBJETS_EPAVE.filter((o) => o.bac === b.bac).length).toBeGreaterThanOrEqual(7)
    for (const o of OBJETS_EPAVE) {
      if (o.bac === 'rebut') expect(o.matiere).toBeNull()
      else expect(MARCHANDISES.map((m) => m.nom)).toContain(o.matiere)
    }
  })

  it('les objets se suivent sans jamais se répéter deux fois de suite ; même graine, même suite', () => {
    const a = nouveauTri(7, t0), b = nouveauTri(7, t0)
    for (let k = 0; k < 100; k++) {
      const avant = a.objet
      expect(a.objet).toBe(b.objet)
      trier(a, 'rebut', t0); trier(b, 'rebut', t0)
      expect(a.objet).not.toBe(avant)
    }
  })

  it('bien trier fait monter la série (jusqu’à ×5) et les tonnes récupérées ; une erreur remet la série à 1', () => {
    const e = nouveauTri(3, t0)
    let attendu = 0
    for (let k = 1; k <= 7; k++) {
      if (OBJETS_EPAVE[e.objet].matiere) attendu += TONNES_PAR_OBJET * Math.min(k, SERIE_MAX)
      expect(trier(e, OBJETS_EPAVE[e.objet].bac, t0 + k)).toBe('juste')
    }
    expect(tonnesTriees(e)).toBeCloseTo(attendu, 5)
    expect(objetsTries(e)).toBe(7)
    expect(e.serie).toBe(SERIE_MAX)
    const faux = BACS.find((b) => b.bac !== OBJETS_EPAVE[e.objet].bac)!.bac
    expect(trier(e, faux, t0 + 10)).toBe('faux')
    expect(e.serie).toBe(1)
    expect(e.erreurs).toBe(1)
    expect(Object.values(e.tries).reduce((a, b) => a + b, 0)).toBe(7)
  })

  it('le temps est compté', () => {
    const e = nouveauTri(1, t0)
    expect(resteTri(e, t0 + 1000)).toBe(DUREE_TRI - 1000)
    expect(trier(e, 'metal', t0 + DUREE_TRI)).toBe('fini')
  })
})

/** Une vraie date (les positions des satellites ne se calculent pas en 1970). */
const T = Date.UTC(2026, 9, 18, 12)

describe('nettoyer une épave en mission (décision d’Adrien du 18/10/2026)', () => {
  it('le tri fait l’étape : matériaux en soute, récompense, carnet de bord', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const { planifier } = await import('../src/moteur/mission')
    const jeu = new Jeu()
    jeu.usureJusqua = Number.MAX_SAFE_INTEGER
    jeu.proposes = [{ id: 1, genre: 'nettoyer', etapes: [{ lieu: 'ISS', action: 'nettoyer' }], recompense: 50 }]
    jeu.accepter(1, T)
    expect(jeu.nettoyer({ Titane: 1 }, 3, T)).toBeNull() // pas sur place
    const p = planifier(jeu.mission.etatHeliocentrique(T), 'ISS', T, jeu.vitesse())
    if (!p.possible) throw new Error('ISS')
    jeu.mission.partir(p.plan)
    const t = p.plan.arrivee + 1000
    expect(jeu.etapeDeTri()).toBe(true)
    const r = jeu.nettoyer({ Titane: 1.5, Verre: 0.4 }, 9, t)!
    expect(r.evenements.map((e) => e.genre)).toEqual(['etape-finie', 'contrat-fini'])
    expect(r.perdu).toBe(0)
    expect(jeu.soute).toEqual({ Titane: 1.5, Verre: 0.4 })
    expect(jeu.chargeSoute()).toBeCloseTo(1.9)
    expect(jeu.credits).toBe(50)
    expect(jeu.carnet).toEqual({ missions: { nettoyeurs: 1, ingenieurs: 0, mercenaires: 0 }, credits: 50, objetsTries: 9 })
  })

  it('la soute a une capacité : ce qui ne tient pas est perdu', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const jeu = new Jeu()
    expect(jeu.charger({ Ferraille: 18 })).toBe(0)
    expect(jeu.charger({ Cuivre: 3.5 })).toBe(1.5)
    expect(jeu.chargeSoute()).toBe(20)
  })
})
