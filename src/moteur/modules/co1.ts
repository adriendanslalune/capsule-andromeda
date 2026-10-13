// CO-1 Codeur : un mot de code s'affiche ; le pilote compose sa réponse (4 chiffres) au cadran, puis presse ÉMETTRE.
// Corrections, dans l'ordre : n° de série commençant par une voyelle → inverser les 4 chiffres ; puis S-3 bas →
// ajouter 1 au dernier chiffre (9 devient 0).

import { MOTS_CODEUR } from '../../donnees/modules'
import type { Interrupteurs } from '../../donnees/fusee'
import { choisirAuHasard, type Hasard } from '../hasard'
import { estBas } from '../interrupteurs'
import { commenceParVoyelle } from '../serie'
import { sansEvenement, type Contexte, type Effet } from './commun'

export interface EtatCO1 {
  /** Mot affiché sur la bande (avarie en cours), ou null. */
  mot: string | null
  /** Chiffres composés au cadran (4 au plus). */
  saisie: string
}

export function creerCO1(): EtatCO1 {
  return { mot: null, saisie: '' }
}

export function co1EnPanne(e: EtatCO1): boolean {
  return e.mot !== null
}

/** Avarie : un mot de la table s'affiche. */
export function panneCO1(_e: EtatCO1, hasard: Hasard): EtatCO1 {
  return { mot: choisirAuHasard(hasard, Object.keys(MOTS_CODEUR)), saisie: '' }
}

/** Code attendu pour un mot. */
export function codeAttendu(mot: string, serie: string, inters: Interrupteurs): string {
  let c = MOTS_CODEUR[mot].split('')
  if (commenceParVoyelle(serie)) c = c.reverse()
  if (estBas(inters, 3)) c[3] = String((Number(c[3]) + 1) % 10)
  return c.join('')
}

/** Compose un chiffre au cadran (sans effet au-delà de 4 chiffres). */
export function composer(e: EtatCO1, chiffre: string): Effet<EtatCO1> {
  if (!/^[0-9]$/.test(chiffre) || e.saisie.length >= 4) return sansEvenement(e)
  return sansEvenement({ ...e, saisie: e.saisie + chiffre })
}

/** EFFACER : remet la saisie à zéro. */
export function effacer(e: EtatCO1): Effet<EtatCO1> {
  return sansEvenement({ ...e, saisie: '' })
}

/**
 * ÉMETTRE : sans avarie ou avec moins de 4 chiffres, rien ne part. Code juste → réparé ; code faux → refusé
 * (erreur), la saisie est effacée.
 */
export function emettre(e: EtatCO1, ctx: Contexte): Effet<EtatCO1> {
  if (!e.mot || e.saisie.length < 4) return sansEvenement(e)
  if (e.saisie === codeAttendu(e.mot, ctx.serie, ctx.interrupteurs)) {
    return { etat: { mot: null, saisie: '' }, evenements: [{ type: 'reparation', module: 'CO-1' }] }
  }
  return { etat: { ...e, saisie: '' }, evenements: [{ type: 'erreur', module: 'CO-1', nature: 'code faux' }] }
}
