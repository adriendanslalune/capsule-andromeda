// PB-1 Tableau de brassage : prises A-1 à A-5 (en haut) et B-1 à B-5 (en bas), trois câbles rouge, bleu et jaune.
// Avarie : un câble est défectueux (son témoin clignote) et doit être rebranché selon le tableau du manuel
// (dernier chiffre du n° de série pair ou impair). Prise indiquée occupée → prise suivante libre de la même rangée
// (après 5, revenir à 1). On débranche un câble en touchant une de ses fiches ; on le rebranche en touchant une
// prise A, puis une prise B.

import { BRASSAGE_CIBLE, BRASSAGE_DEPART, COULEURS_CABLES, type CouleurCable } from '../../donnees/modules'
import { choisirAuHasard, type Hasard } from '../hasard'
import { dernierChiffrePair } from '../serie'
import { sansEvenement, type Contexte, type Effet } from './commun'

export interface Cable {
  couleur: CouleurCable
  a: number
  b: number
}

export interface EtatPB1 {
  /** Câbles branchés. */
  cables: Cable[]
  /** Câble débranché, tenu en main : sa fiche A est déjà placée (a) ou pas encore (null). */
  enMain: { couleur: CouleurCable; a: number | null } | null
  /** Couleur du câble défectueux, ou null. */
  panne: CouleurCable | null
}

export function creerPB1(): EtatPB1 {
  return {
    cables: COULEURS_CABLES.map((couleur) => ({ couleur, a: BRASSAGE_DEPART[couleur][0], b: BRASSAGE_DEPART[couleur][1] })),
    enMain: null,
    panne: null,
  }
}

export function pb1EnPanne(e: EtatPB1): boolean {
  return e.panne !== null
}

function occupee(cables: Cable[], rang: 'a' | 'b', n: number): boolean {
  return cables.some((c) => c[rang] === n)
}

/** Branchement du tableau du manuel, avant la règle des prises occupées. */
export function brassageDuTableau(couleur: CouleurCable, serie: string): readonly [number, number] {
  return BRASSAGE_CIBLE[couleur][dernierChiffrePair(serie) ? 0 : 1]
}

/** Branchement attendu, compte tenu des prises occupées par les autres câbles branchés. */
export function brassageAttendu(couleur: CouleurCable, serie: string, autres: Cable[]): [number, number] {
  let [a, b] = brassageDuTableau(couleur, serie)
  for (let k = 0; k < 5 && occupee(autres, 'a', a); k++) a = (a % 5) + 1
  for (let k = 0; k < 5 && occupee(autres, 'b', b); k++) b = (b % 5) + 1
  return [a, b]
}

/**
 * Avarie : un câble au hasard devient défectueux. S'il se trouve déjà sur son branchement du tableau, sa fiche A est
 * déplacée sur la première prise A libre, pour qu'il y ait quelque chose à faire.
 */
export function pannePB1(e: EtatPB1, hasard: Hasard, ctx: Contexte): EtatPB1 {
  const couleur = choisirAuHasard(hasard, COULEURS_CABLES)
  const [ta, tb] = brassageDuTableau(couleur, ctx.serie)
  const cables = e.cables.map((c) => {
    if (c.couleur !== couleur || c.a !== ta || c.b !== tb) return c
    const autres = e.cables.filter((x) => x.couleur !== couleur)
    const libre = [1, 2, 3, 4, 5].find((n) => n !== ta && !occupee(autres, 'a', n))!
    return { ...c, a: libre }
  })
  return { ...e, cables, panne: couleur }
}

const refus = (e: EtatPB1): Effet<EtatPB1> => ({ etat: e, evenements: [{ type: 'erreur', module: 'PB-1', nature: 'prise refusée' }] })

/** Touche une prise (rang A ou B, numéro 1 à 5). */
export function toucherPrise(e: EtatPB1, rang: 'a' | 'b', n: number, ctx: Contexte): Effet<EtatPB1> {
  if (!e.enMain) {
    // Main libre : toucher une fiche débranche son câble.
    const cable = e.cables.find((c) => c[rang] === n)
    if (!cable) return sansEvenement(e)
    return sansEvenement({ ...e, cables: e.cables.filter((c) => c !== cable), enMain: { couleur: cable.couleur, a: null } })
  }
  if (e.enMain.a === null) {
    // D'abord une prise A libre.
    if (rang !== 'a' || occupee(e.cables, 'a', n)) return refus(e)
    return sansEvenement({ ...e, enMain: { ...e.enMain, a: n } })
  }
  // Puis une prise B libre : le câble est branché.
  if (rang !== 'b' || occupee(e.cables, 'b', n)) return refus(e)
  const cable: Cable = { couleur: e.enMain.couleur, a: e.enMain.a, b: n }
  const cables = [...e.cables, cable]
  if (e.panne !== cable.couleur) return sansEvenement({ ...e, cables, enMain: null })
  const [aa, bb] = brassageAttendu(cable.couleur, ctx.serie, e.cables)
  if (cable.a === aa && cable.b === bb) {
    return { etat: { cables, enMain: null, panne: null }, evenements: [{ type: 'reparation', module: 'PB-1' }] }
  }
  return { etat: { ...e, cables, enMain: null }, evenements: [{ type: 'erreur', module: 'PB-1', nature: 'mauvais branchement' }] }
}
