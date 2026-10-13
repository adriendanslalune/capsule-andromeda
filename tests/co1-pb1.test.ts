import { describe, expect, it } from 'vitest'
import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../src/donnees/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { codeAttendu, co1EnPanne, composer, creerCO1, effacer, emettre, panneCO1, type EtatCO1 } from '../src/moteur/modules/co1'
import type { Contexte, Evenement } from '../src/moteur/modules/commun'
import { brassageAttendu, creerPB1, pannePB1, pb1EnPanne, toucherPrise, type EtatPB1 } from '../src/moteur/modules/pb1'

const T0 = Date.UTC(2026, 9, 13, 12)
const ctx = (serie: string, inters: Interrupteurs = INTERRUPTEURS_DEPART): Contexte => ({ serie, interrupteurs: inters, t: T0 })
const SERIES = ['KE4-70B', 'KE4-71B', 'AB2-38Z', 'EZ9-05A', 'UB0-12C', 'YT7-33K']

// ---------------------------------------------------------------------------------------------------------------
// CO-1

/** Table de la page VIII du manuel, recopiée telle quelle (indépendamment du moteur). */
const TABLE_MANUEL: Record<string, string> = {
  ORION: '4721', VESTA: '3058', ATLAS: '1946', CERES: '8203', TITAN: '6390', ARGOS: '2584', DELTA: '7162',
  HYDRE: '9035', CYGNE: '1478', PERSE: '5609', ALGOL: '3317', RIGEL: '8842', SIRIUS: '2205', ALTAIR: '6671',
  DENEB: '4096', MIRA: '7350', CASTOR: '1189', POLLUX: '9512', ANTARES: '3724', CAPELLA: '5863',
}

/** Corrections du manuel, dans l'ordre : 1. voyelle → inverser ; 2. S-3 bas → +1 au dernier chiffre. */
function codeSelonManuel(mot: string, serie: string, s3Bas: boolean): string {
  let chiffres = TABLE_MANUEL[mot].split('')
  if ('AEIOUY'.includes(serie[0])) chiffres = chiffres.reverse()
  if (s3Bas) chiffres[3] = String((Number(chiffres[3]) + 1) % 10)
  return chiffres.join('')
}

describe('CO-1 — codeur', () => {
  it('réparé en suivant le manuel : 20 mots × séries (voyelle ou non) × S-3 haut ou bas', () => {
    let essais = 0
    for (const mot of Object.keys(TABLE_MANUEL)) {
      for (const serie of SERIES) {
        for (const s3 of ['haut', 'bas'] as const) {
          const c = ctx(serie, ['haut', 'haut', s3, 'haut'])
          let e: EtatCO1 = { mot, saisie: '' }
          for (const ch of codeSelonManuel(mot, serie, s3 === 'bas')) e = composer(e, ch).etat
          const r = emettre(e, c)
          expect(r.evenements, `${mot} ${serie} S-3 ${s3}`).toEqual([{ type: 'reparation', module: 'CO-1' }])
          expect(co1EnPanne(r.etat)).toBe(false)
          expect(codeAttendu(mot, serie, c.interrupteurs)).toBe(codeSelonManuel(mot, serie, s3 === 'bas'))
          essais++
        }
      }
    }
    expect(essais).toBe(240)
  })

  it('exemple : ORION (4721), série commençant par une voyelle, S-3 bas → 1274 → 1275', () => {
    expect(codeAttendu('ORION', 'EZ9-05A', ['haut', 'haut', 'bas', 'haut'])).toBe('1275')
    expect(codeAttendu('DENEB', 'KE4-70B', ['haut', 'haut', 'bas', 'haut'])).toBe('4097')
    expect(codeAttendu('SIRIUS', 'KE4-70B', ['haut', 'haut', 'haut', 'haut'])).toBe('2205')
    expect(codeAttendu('MIRA', 'KE4-70B', ['haut', 'haut', 'bas', 'haut'])).toBe('7351')
    expect(codeAttendu('ANTARES', 'KE4-70B', ['haut', 'haut', 'bas', 'haut'])).toBe('3725')
    expect(codeAttendu('HYDRE', 'KE4-70B', ['haut', 'haut', 'bas', 'haut'])).toBe('9036')
    expect(codeAttendu('ALGOL', 'AB2-38Z', ['haut', 'haut', 'bas', 'haut'])).toBe('7134') // 7133 + 1
    expect(codeAttendu('PERSE', 'KE4-70B', ['haut', 'haut', 'bas', 'haut'])).toBe('5600') // 9 devient 0
  })

  it('code faux : refusé (erreur), la saisie est effacée, on peut recommencer', () => {
    const c = ctx('KE4-70B')
    let e: EtatCO1 = { mot: 'ORION', saisie: '' }
    for (const ch of '1111') e = composer(e, ch).etat
    const r = emettre(e, c)
    expect(r.evenements[0]).toMatchObject({ type: 'erreur', module: 'CO-1' })
    expect(r.etat.saisie).toBe('')
    expect(co1EnPanne(r.etat)).toBe(true)
  })

  it('EFFACER, 4 chiffres au plus, ÉMETTRE sans effet sans avarie ou avec moins de 4 chiffres', () => {
    let e: EtatCO1 = { mot: 'ORION', saisie: '' }
    for (const ch of '472199') e = composer(e, ch).etat
    expect(e.saisie).toBe('4721')
    expect(effacer(e).etat.saisie).toBe('')
    expect(emettre({ mot: 'ORION', saisie: '47' }, ctx('KE4-70B')).evenements).toEqual([])
    expect(emettre({ mot: null, saisie: '4721' }, ctx('KE4-70B')).evenements).toEqual([])
  })

  it('les avaries tirent des mots de la table', () => {
    const h = mulberry32(9)
    const vus = new Set<string>()
    for (let i = 0; i < 200; i++) vus.add(panneCO1(creerCO1(), h).mot!)
    expect(vus.size).toBe(20)
  })
})

// ---------------------------------------------------------------------------------------------------------------
// PB-1

/** Tableau du manuel (page IX), recopié indépendamment du moteur : [pair, impair]. */
const TABLEAU_MANUEL = { rouge: [[1, 4], [2, 5]], bleu: [[3, 1], [5, 2]], jaune: [[4, 3], [1, 2]] } as const

/** Procédure du manuel : débrancher le câble défectueux, puis toucher la prise A, puis la prise B indiquées. */
function procedurePB1(e0: EtatPB1, c: Contexte) {
  const evenements: Evenement[] = []
  let e = e0
  const couleur = e.panne!
  const cable = e.cables.find((x) => x.couleur === couleur)!
  const t1 = toucherPrise(e, 'a', cable.a, c) // débrancher (toucher une de ses fiches)
  e = t1.etat
  const chiffres = c.serie.match(/[0-9]/g)!
  const pair = Number(chiffres[chiffres.length - 1]) % 2 === 0
  let [a, b] = TABLEAU_MANUEL[couleur][pair ? 0 : 1]
  // EXCEPTION : si une prise indiquée est déjà occupée, prendre la suivante libre de la même rangée (après 5 : 1).
  while (e.cables.some((x) => x.a === a)) a = (a % 5) + 1
  while (e.cables.some((x) => x.b === b)) b = (b % 5) + 1
  const t2 = toucherPrise(e, 'a', a, c)
  const t3 = toucherPrise(t2.etat, 'b', b, c)
  evenements.push(...t1.evenements, ...t2.evenements, ...t3.evenements)
  return { etat: t3.etat, evenements }
}

describe('PB-1 — tableau de brassage', () => {
  it('fusée neuve : rouge A-2 → B-3, bleu A-4 → B-5, jaune A-1 → B-1', () => {
    expect(creerPB1().cables).toEqual([
      { couleur: 'rouge', a: 2, b: 3 }, { couleur: 'bleu', a: 4, b: 5 }, { couleur: 'jaune', a: 1, b: 1 },
    ])
  })

  it('réparé en suivant le manuel, pour chaque câble, série paire ou impaire, et des branchements variés', () => {
    let essais = 0
    for (const serie of SERIES) {
      const c = ctx(serie)
      for (let graine = 1; graine <= 30; graine++) {
        const h = mulberry32(graine)
        // Branchement de départ, puis quelques réparations successives pour varier les positions des câbles.
        let e = creerPB1()
        for (let n = 0; n < 1 + (graine % 4); n++) {
          e = pannePB1(e, h, c)
          const r = procedurePB1(e, c)
          expect(r.evenements, `${serie}, graine ${graine}, n° ${n}`).toEqual([{ type: 'reparation', module: 'PB-1' }])
          expect(pb1EnPanne(r.etat)).toBe(false)
          e = r.etat
          essais++
        }
      }
    }
    expect(essais).toBeGreaterThan(400)
  })

  it('le câble défectueux n’est jamais laissé déjà à sa place du tableau', () => {
    for (const serie of SERIES) {
      for (let graine = 1; graine <= 50; graine++) {
        const e = pannePB1(creerPB1(), mulberry32(graine), ctx(serie))
        const cable = e.cables.find((x) => x.couleur === e.panne)!
        const chiffres = serie.match(/[0-9]/g)!
        const [a, b] = TABLEAU_MANUEL[e.panne!][Number(chiffres[chiffres.length - 1]) % 2 === 0 ? 0 : 1]
        expect(cable.a === a && cable.b === b).toBe(false)
      }
    }
  })

  it('mauvais branchement : erreur, le câble reste branché là, l’avarie continue', () => {
    const c = ctx('KE4-70B')
    let e = pannePB1(creerPB1(), mulberry32(1), c)
    const cable = e.cables.find((x) => x.couleur === e.panne)!
    e = toucherPrise(e, 'a', cable.a, c).etat
    const [bonA] = brassageAttendu(cable.couleur, c.serie, e.cables)
    const libreA = [1, 2, 3, 4, 5].find((n) => n !== bonA && !e.cables.some((x) => x.a === n))!
    const libreB = [1, 2, 3, 4, 5].find((n) => !e.cables.some((x) => x.b === n))!
    e = toucherPrise(e, 'a', libreA, c).etat
    const r = toucherPrise(e, 'b', libreB, c)
    expect(r.evenements[0]).toMatchObject({ type: 'erreur', nature: 'mauvais branchement' })
    expect(pb1EnPanne(r.etat)).toBe(true)
    expect(r.etat.cables).toHaveLength(3)
  })

  it('câble en main : prise B d’abord, ou prise occupée → refusé', () => {
    const c = ctx('KE4-70B')
    let e = toucherPrise(creerPB1(), 'a', 2, c).etat // débranche le rouge
    expect(e.enMain).toEqual({ couleur: 'rouge', a: null })
    expect(toucherPrise(e, 'b', 2, c).evenements[0]).toMatchObject({ nature: 'prise refusée' })
    expect(toucherPrise(e, 'a', 4, c).evenements[0]).toMatchObject({ nature: 'prise refusée' }) // A-4 : bleu
    e = toucherPrise(e, 'a', 3, c).etat
    expect(toucherPrise(e, 'b', 5, c).evenements[0]).toMatchObject({ nature: 'prise refusée' }) // B-5 : bleu
    const fin = toucherPrise(e, 'b', 2, c)
    expect(fin.evenements).toEqual([]) // pas d'avarie : simple rebranchement
    expect(fin.etat.cables).toContainEqual({ couleur: 'rouge', a: 3, b: 2 })
  })

  it('les avaries touchent les trois câbles', () => {
    const vus = new Set<string>()
    const h = mulberry32(3)
    for (let i = 0; i < 60; i++) vus.add(pannePB1(creerPB1(), h, ctx('KE4-70B')).panne!)
    expect(vus).toEqual(new Set(['rouge', 'bleu', 'jaune']))
  })
})
