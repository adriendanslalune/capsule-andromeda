import { describe, expect, it } from 'vitest'
import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../src/donnees/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { basculer } from '../src/moteur/interrupteurs'
import {
  al1EnPanne,
  apresBasculeInterrupteur,
  couleurAttendue,
  creerAL1,
  insererFusible,
  panneAL1,
  retirerFusible,
  type EtatAL1,
} from '../src/moteur/modules/al1'
import type { Contexte, Evenement } from '../src/moteur/modules/commun'

const T0 = Date.UTC(2026, 9, 13, 12)

class Banc {
  e: EtatAL1
  ctx: Contexte
  evenements: Evenement[] = []
  constructor(e: EtatAL1, serie: string, inters: Interrupteurs = INTERRUPTEURS_DEPART) {
    this.e = e
    this.ctx = { serie, interrupteurs: inters, t: T0 }
  }
  private garder(r: { etat: EtatAL1; evenements: Evenement[] }) { this.e = r.etat; this.evenements.push(...r.evenements) }
  interrupteur(n: 1 | 2 | 3 | 4) {
    this.ctx = { ...this.ctx, interrupteurs: basculer(this.ctx.interrupteurs, n) }
    this.garder(apresBasculeInterrupteur(this.e, n, this.ctx))
  }
  retirer(i: number) { this.garder(retirerFusible(this.e, i, this.ctx)) }
  inserer(i: number, c: 'bleu' | 'rouge' | 'vert' | 'jaune') { this.garder(insererFusible(this.e, i, c, this.ctx)) }
  types(t: Evenement['type']) { return this.evenements.filter((x) => x.type === t) }
}

/** Règle du manuel (page VII), écrite indépendamment du moteur. */
function couleurSelonManuel(grillee: string, serie: string, s1Bas: boolean): 'bleu' | 'rouge' | 'vert' | 'jaune' {
  if (s1Bas) return 'jaune' // EXCEPTION : si S-1 est en position basse, le fusible neuf est TOUJOURS JAUNE.
  const chiffres = serie.match(/[0-9]/g)!
  const pair = Number(chiffres[chiffres.length - 1]) % 2 === 0
  const ordre = ['bleu', 'rouge', 'vert', 'jaune'] as const
  const k = ordre.indexOf(grillee as (typeof ordre)[number])
  return pair ? ordre[k] : ordre[(k + 1) % 4]
}

/** Procédure du manuel : S-4 bas, retirer le grillé, insérer le neuf de la bonne couleur, S-4 haut. */
function procedureAL1(b: Banc) {
  const i = b.e.fusibles.findIndex((f) => f.etat === 'grille')
  const grillee = b.e.fusibles[i].couleur
  if (b.ctx.interrupteurs[3] === 'haut') b.interrupteur(4)
  b.retirer(i)
  b.inserer(i, couleurSelonManuel(grillee, b.ctx.serie, b.ctx.interrupteurs[0] === 'bas'))
  b.interrupteur(4)
}

describe('AL-1 — fusibles', () => {
  it('fusée neuve : 8 fusibles en bon état, couleurs au hasard, aucune avarie', () => {
    const e = creerAL1(mulberry32(1))
    expect(e.fusibles).toHaveLength(8)
    expect(e.fusibles.every((f) => f.etat === 'bon')).toBe(true)
    expect(al1EnPanne(e)).toBe(false)
  })

  it('réparé en suivant le manuel, pour toutes les combinaisons : série paire ou impaire, S-1 haut ou bas', () => {
    let essais = 0
    for (const serie of ['KE4-70B', 'KE4-71B', 'AB2-38Z', 'ZZ9-05A']) {
      for (const s1 of ['haut', 'bas'] as const) {
        for (let graine = 1; graine <= 12; graine++) {
          const h = mulberry32(graine)
          const inters: Interrupteurs = [s1, 'haut', 'bas', 'haut']
          const b = new Banc(panneAL1(creerAL1(h), h), serie, inters)
          procedureAL1(b)
          expect(al1EnPanne(b.e), `${serie}, S-1 ${s1}, graine ${graine}`).toBe(false)
          expect(b.types('reparation')).toEqual([{ type: 'reparation', module: 'AL-1' }])
          expect(b.types('erreur')).toEqual([])
          essais++
        }
      }
    }
    expect(essais).toBe(96)
  })

  it('la règle du moteur est celle du manuel', () => {
    for (const c of ['bleu', 'rouge', 'vert', 'jaune'] as const) {
      for (const serie of ['KE4-70B', 'KE4-71B']) {
        for (const s1 of ['haut', 'bas'] as const) {
          expect(couleurAttendue(c, serie, [s1, 'haut', 'bas', 'haut'])).toBe(couleurSelonManuel(c, serie, s1 === 'bas'))
        }
      }
    }
  })

  it('manipuler sous tension (S-4 haut) : étincelle, rien ne bouge', () => {
    const h = mulberry32(2)
    const b = new Banc(panneAL1(creerAL1(h), h), 'KE4-70B')
    const i = b.e.panne!
    b.retirer(i)
    expect(b.e.fusibles[i].etat).toBe('grille')
    expect(b.types('erreur')[0]).toMatchObject({ module: 'AL-1', nature: 'étincelle' })
  })

  it('insérer sous tension : étincelle', () => {
    const h = mulberry32(2)
    const b = new Banc(panneAL1(creerAL1(h), h), 'KE4-70B')
    const i = b.e.panne!
    b.interrupteur(4)
    b.retirer(i)
    b.interrupteur(4) // S-4 remonte, emplacement vide : pas de réparation
    expect(al1EnPanne(b.e)).toBe(true)
    b.inserer(i, b.e.couleurGrillee!)
    expect(b.e.fusibles[i].etat).toBe('vide')
    expect(b.types('erreur')).toHaveLength(1)
  })

  it('un fusible de mauvaise couleur grille aussitôt', () => {
    const h = mulberry32(4)
    const b = new Banc(panneAL1(creerAL1(h), h), 'KE4-70B') // pair : même couleur
    const i = b.e.panne!
    const mauvaise = b.e.couleurGrillee === 'bleu' ? 'rouge' : 'bleu'
    b.interrupteur(4)
    b.retirer(i)
    b.inserer(i, mauvaise)
    expect(b.e.fusibles[i].etat).toBe('grille')
    expect(b.types('erreur')[0]).toMatchObject({ nature: 'fusible regrillé' })
    b.interrupteur(4)
    expect(al1EnPanne(b.e)).toBe(true)
    // On peut recommencer : S-4 bas, retirer, bonne couleur, S-4 haut.
    procedureAL1(b)
    expect(al1EnPanne(b.e)).toBe(false)
  })

  it('le bon fusible en place ne suffit pas : il faut remettre S-4 en haut', () => {
    const h = mulberry32(5)
    const b = new Banc(panneAL1(creerAL1(h), h), 'KE4-70B')
    const i = b.e.panne!
    b.interrupteur(4)
    b.retirer(i)
    b.inserer(i, b.e.couleurGrillee!)
    expect(al1EnPanne(b.e)).toBe(true)
    b.interrupteur(4)
    expect(al1EnPanne(b.e)).toBe(false)
  })

  it('un fusible en bon état ne se retire pas', () => {
    const h = mulberry32(6)
    const b = new Banc(panneAL1(creerAL1(h), h), 'KE4-70B')
    const autre = (b.e.panne! + 1) % 8
    b.interrupteur(4)
    b.retirer(autre)
    expect(b.e.fusibles[autre].etat).toBe('bon')
  })
})
