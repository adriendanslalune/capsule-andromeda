import { describe, expect, it } from 'vitest'
import { CALIBRES, ORDRES_COUPLAGE } from '../src/donnees/manuel-energie'
import {
  calibreAttendu, ordreCouplage, tourAccumulateurs, tourFusibles,
} from '../src/moteur/energie'
import { Jeu } from '../src/moteur/jeu'
import { BLOCAGE_ERREUR } from '../src/moteur/reparation'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 19, 12)

/** Une partie où le module (2B ou 2C) est en défaut. */
function enDefaut(a: 'fusibles' | 'accumulateurs', graine = 7): Jeu {
  const jeu = new Jeu()
  jeu.graine = graine
  jeu.casser('energie')
  jeu.defauts.energie = [a]
  return jeu
}

describe('module 2B · fusibles', () => {
  it('le manuel (TABLEAU 2-3) : vert, le calibre juste au-dessus de la charge ; jaune, une marche de plus ; rouge, celui du grillé', () => {
    expect(calibreAttendu({ grille: 0, charge: 27, temoin: 'vert' })).toBe(30)
    expect(calibreAttendu({ grille: 0, charge: 27, temoin: 'jaune' })).toBe(35)
    expect(calibreAttendu({ grille: 6, charge: 27, temoin: 'rouge' })).toBe(40)
    expect(calibreAttendu({ grille: 0, charge: 39, temoin: 'jaune' })).toBe(45)
  })

  it('le tiroir contient toujours le bon calibre, parmi quatre calibres différents ; la charge n’est jamais un multiple de 5', () => {
    for (let g = 1; g < 300; g++) {
      const tour = tourFusibles(g, 0)
      expect(tour.rechanges).toHaveLength(4)
      expect(new Set(tour.rechanges).size).toBe(4)
      expect(tour.rechanges).toContain(calibreAttendu(tour))
      expect(tour.rechanges.every((c) => CALIBRES.includes(c))).toBe(true)
      expect(tour.charge % 5).not.toBe(0)
    }
  })

  it('en suivant le manuel, 1 ou 2 fusibles, puis l’Énergie remarche ; un mauvais fusible bloque 30 s', () => {
    const jeu = enDefaut('fusibles')
    const r = jeu.reparation('fusibles')!
    expect([1, 2]).toContain(r.tours)
    const tour = tourFusibles(r.graine, 0)
    const mauvais = tour.rechanges.findIndex((c) => c !== calibreAttendu(tour))
    expect(jeu.geste('fusibles', { genre: 'remplacer', rechange: mauvais }, t0)).toBe('erreur')
    expect(jeu.geste('fusibles', { genre: 'remplacer', rechange: 0 }, t0 + 1000)).toBe('bloque')
    let res = ''
    for (let k = 0; k < r.tours; k++) {
      const t = tourFusibles(r.graine, r.tour)
      res = jeu.geste('fusibles', { genre: 'remplacer', rechange: t.rechanges.indexOf(calibreAttendu(t)) }, t0 + BLOCAGE_ERREUR)
    }
    expect(res).toBe('repare')
    expect(jeu.enPanne('energie')).toBe(false)
  })
})

describe('module 2C · accumulateurs', () => {
  it('le TABLEAU 2-4 ne donne que des ordres complets (les trois accumulateurs, une fois chacun)', () => {
    for (const ligne of ORDRES_COUPLAGE) for (const ordre of ligne) expect([...ordre].sort()).toEqual([0, 1, 2])
  })

  it('trois charges bien distinctes (15 points au moins) : le plus chargé ne fait pas de doute', () => {
    for (let g = 1; g < 300; g++) {
      const n = [...tourAccumulateurs(g, 0).niveaux].sort((a, b) => a - b)
      expect(n[1] - n[0]).toBeGreaterThanOrEqual(15)
      expect(n[2] - n[1]).toBeGreaterThanOrEqual(15)
    }
  })

  it('l’ordre dépend du plus chargé et de la couleur du milieu', () => {
    expect(ordreCouplage({ niveaux: [90, 40, 10], couleurs: ['bleu', 'vert', 'jaune'] })).toEqual([0, 2, 1])
    expect(ordreCouplage({ niveaux: [20, 40, 80], couleurs: ['vert', 'bleu', 'vert'] })).toEqual([2, 0, 1])
  })

  it('brancher dans l’ordre puis COUPLER, deux fois ; dans le désordre ou COUPLER trop tôt : erreur', () => {
    const jeu = enDefaut('accumulateurs')
    const r = jeu.reparation('accumulateurs')!
    expect(jeu.geste('accumulateurs', { genre: 'coupler' }, t0)).toBe('erreur')
    let t = t0 + BLOCAGE_ERREUR
    const ordre = ordreCouplage(tourAccumulateurs(r.graine, 0))
    expect(jeu.geste('accumulateurs', { genre: 'brancher', accu: ordre[1] }, t)).toBe('erreur')
    expect(r.coupes).toEqual([])
    t += BLOCAGE_ERREUR
    let res = ''
    for (let k = 0; k < 2; k++) {
      for (const i of ordreCouplage(tourAccumulateurs(r.graine, r.tour))) expect(jeu.geste('accumulateurs', { genre: 'brancher', accu: i }, t)).toBe('ok')
      res = jeu.geste('accumulateurs', { genre: 'coupler' }, t)
    }
    expect(res).toBe('repare')
    expect(jeu.enPanne('energie')).toBe(false)
  })

  it('la réparation en cours est sauvegardée', () => {
    const jeu = enDefaut('accumulateurs')
    const r = jeu.reparation('accumulateurs')!
    jeu.geste('accumulateurs', { genre: 'brancher', accu: ordreCouplage(tourAccumulateurs(r.graine, 0))[0] }, t0)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.defauts.energie).toEqual(['accumulateurs'])
    expect(copie.reparations.accumulateurs).toEqual(r)
  })
})
