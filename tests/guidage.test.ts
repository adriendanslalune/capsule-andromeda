import { describe, expect, it } from 'vitest'
import { ANNEAUX, AZIMUTS, CODES_CALCUL, CONSTELLATIONS, HAUTEURS } from '../src/donnees/manuel-navigation'
import {
  angleAnneau, cadransConstellation, interrupteursCalcul, ordreGyro, phasesGyro, tourCalculateur, tourConstellation,
} from '../src/moteur/guidage'
import { Jeu } from '../src/moteur/jeu'
import { BLOCAGE_ERREUR, type EtatReparation } from '../src/moteur/reparation'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 19, 12)

function enDefaut(...a: ('constellation' | 'gyroscope' | 'calculateur')[]): Jeu {
  const jeu = new Jeu()
  jeu.graine = 5
  jeu.casser('navigation')
  jeu.defauts.navigation = a
  return jeu
}

/** Le premier instant après t où le repère de l'anneau i passe devant l'index. */
function passage(r: EtatReparation, i: number, t: number): number {
  const a = angleAnneau(r, i, t)
  return t + Math.ceil(((360 - a) % 360) / ANNEAUX[i].vitesse * 1000)
}

describe('module 4A · constellation', () => {
  it('douze constellations aux noms différents ; tous les caps sont sur les crans des cadrans', () => {
    expect(new Set(CONSTELLATIONS.map((c) => c.nom)).size).toBe(12)
    for (const c of CONSTELLATIONS) {
      expect(AZIMUTS).toContain(c.azimut)
      expect(HAUTEURS).toContain(c.hauteur)
      for (const [a, b] of c.traits) expect(a !== b && a < c.etoiles.length && b < c.etoiles.length).toBe(true)
    }
  })

  it('régler l’azimut (tout le tour) et la hauteur (jusqu’aux butées), puis POINTER, deux fois', () => {
    const jeu = enDefaut('constellation')
    const r = jeu.reparation('constellation')!
    expect(jeu.geste('constellation', { genre: 'pointer' }, t0)).toBe('erreur')
    const t = t0 + BLOCAGE_ERREUR
    for (let k = 0; k < 6; k++) jeu.geste('constellation', { genre: 'cap', cadran: 'hauteur', pas: 1 }, t)
    expect(cadransConstellation(r).hauteur).toBe(HAUTEURS.length - 1)
    let res = ''
    for (let k = 0; k < 2; k++) {
      const c = CONSTELLATIONS[tourConstellation(r.graine, r.tour).constellation]
      while (AZIMUTS[cadransConstellation(r).azimut] !== c.azimut) jeu.geste('constellation', { genre: 'cap', cadran: 'azimut', pas: -1 }, t)
      while (HAUTEURS[cadransConstellation(r).hauteur] !== c.hauteur) jeu.geste('constellation', { genre: 'cap', cadran: 'hauteur', pas: -1 }, t)
      res = jeu.geste('constellation', { genre: 'pointer' }, t)
    }
    expect(res).toBe('repare')
  })
})

describe('module 4B · gyroscope', () => {
  it('l’ordre dépend du dernier chiffre du numéro de série', () => {
    expect(ordreGyro('AN-7K2')).toEqual([0, 1, 2])
    expect(ordreGyro('BX-2K5')).toEqual([2, 0, 1])
    expect(ordreGyro('BX-2K9')).toEqual([1, 2, 0])
  })

  it('les anneaux tournent ; freiner chacun devant l’index, dans l’ordre, répare', () => {
    const jeu = enDefaut('gyroscope')
    const r = jeu.reparation('gyroscope')!
    expect(angleAnneau(r, 0, t0 + 1000)).not.toBe(angleAnneau(r, 0, t0))
    let t = t0, res = ''
    for (const i of ordreGyro(jeu.numeroSerie)) {
      t = passage(r, i, t)
      res = jeu.geste('gyroscope', { genre: 'freiner', anneau: i }, t)
      expect(angleAnneau(r, i, t + 5000) === 0 || res === 'repare').toBe(true)
    }
    expect(res).toBe('repare')
    expect(phasesGyro(r.graine)).toHaveLength(3)
  })

  it('freiner loin de l’index, ou le mauvais anneau, est une erreur : tous les anneaux repartent', () => {
    const jeu = enDefaut('gyroscope')
    const r = jeu.reparation('gyroscope')!
    const [premier, second] = ordreGyro(jeu.numeroSerie)
    let t = passage(r, premier, t0)
    expect(jeu.geste('gyroscope', { genre: 'freiner', anneau: premier }, t)).toBe('ok')
    t = passage(r, premier === 0 ? 2 : 0, t) // un anneau qui n'est pas le suivant
    const intrus = [0, 1, 2].find((i) => i !== premier && i !== second)!
    expect(jeu.geste('gyroscope', { genre: 'freiner', anneau: intrus }, passage(r, intrus, t))).toBe('erreur')
    expect(r.coupes).toEqual([])
    t += BLOCAGE_ERREUR + 1000
    const loin = passage(r, premier, t) + (180 / ANNEAUX[premier].vitesse) * 1000
    expect(jeu.geste('gyroscope', { genre: 'freiner', anneau: premier }, loin)).toBe('erreur')
  })
})

describe('module 4C · calculateur', () => {
  it('seize codes différents, trois astres différents chacun', () => {
    expect(new Set(CODES_CALCUL.map((c) => c.code)).size).toBe(16)
    for (const c of CODES_CALCUL) expect(new Set(c.astres).size).toBe(3)
  })

  it('régler les interrupteurs puis taper les astres dans l’ordre, deux fois ; un astre trop tôt : erreur', () => {
    const jeu = enDefaut('calculateur')
    const r = jeu.reparation('calculateur')!
    const c0 = CODES_CALCUL[tourCalculateur(r.graine, 0).code]
    // Interrupteurs pas encore réglés : même le bon astre est une erreur.
    expect(jeu.geste('calculateur', { genre: 'astre', astre: c0.astres[0] }, t0)).toBe('erreur')
    const t = t0 + BLOCAGE_ERREUR
    let res = ''
    for (let k = 0; k < 2; k++) {
      const c = CODES_CALCUL[tourCalculateur(r.graine, r.tour).code]
      interrupteursCalcul(r).forEach((h, i) => { if (h !== c.interrupteurs[i]) jeu.geste('calculateur', { genre: 'interrupteur', interrupteur: i }, t) })
      expect(interrupteursCalcul(r)).toEqual(c.interrupteurs)
      for (const a of c.astres) res = jeu.geste('calculateur', { genre: 'astre', astre: a }, t)
    }
    expect(res).toBe('repare')
    expect(jeu.enPanne('navigation')).toBe(false)
  })

  it('les réparations en cours du bloc Navigation sont sauvegardées', () => {
    const jeu = enDefaut('constellation', 'calculateur')
    jeu.geste('constellation', { genre: 'cap', cadran: 'azimut', pas: 1 }, t0)
    jeu.geste('calculateur', { genre: 'interrupteur', interrupteur: 3 }, t0)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.reparations.constellation).toEqual(jeu.reparations.constellation)
    expect(copie.reparations.calculateur).toEqual(jeu.reparations.calculateur)
  })
})
