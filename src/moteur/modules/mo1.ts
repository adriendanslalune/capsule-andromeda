// MO-1 Morse : un indicatif est répété en morse (lampe et son). Procédure : le déchiffrer, trouver la station dans
// l'annuaire, régler la fréquence d'émission (S-1 bas : ajouter 1,00), puis presser ÉMETTRE.

import { ALPHABET_MORSE, MORSE, STATIONS_MORSE } from '../../donnees/modules'
import type { Interrupteurs } from '../../donnees/fusee'
import { choisirAuHasard, type Hasard } from '../hasard'
import { estBas } from '../interrupteurs'
import { sansEvenement, type Contexte, type Effet } from './commun'

export interface EtatMO1 {
  /** Indicatif capté (avarie en cours), ou null. */
  indicatif: string | null
  /** Fréquence d'émission réglée (au centième). */
  frequence: number
}

export function creerMO1(): EtatMO1 {
  return { indicatif: null, frequence: MORSE.frequenceDepart }
}

export function mo1EnPanne(e: EtatMO1): boolean {
  return e.indicatif !== null
}

/** Avarie : une station de l'annuaire se met à émettre son indicatif. */
export function panneMO1(e: EtatMO1, hasard: Hasard): EtatMO1 {
  return { ...e, indicatif: choisirAuHasard(hasard, Object.keys(STATIONS_MORSE)) }
}

/**
 * Séquence lumineuse de l'indicatif, pour l'interface : suite de [allumé, durée en secondes].
 * Point 0,22 s, trait 0,66 s, 0,22 s entre deux signes, 0,66 s entre deux lettres, 1,76 s avant de recommencer.
 */
export function sequenceMorse(indicatif: string): [boolean, number][] {
  const u = MORSE.point
  const q: [boolean, number][] = []
  for (const lettre of indicatif) {
    for (const signe of ALPHABET_MORSE[lettre]) {
      q.push([true, signe === '.' ? u : 3 * u])
      q.push([false, u])
    }
    q[q.length - 1][1] = 3 * u
  }
  q[q.length - 1][1] = 8 * u
  return q
}

/** Fréquence attendue pour une station (S-1 bas : +1,00). */
export function frequenceAttendue(indicatif: string, inters: Interrupteurs): number {
  return Math.round((STATIONS_MORSE[indicatif] + (estBas(inters, 1) ? MORSE.correctionS1 : 0)) * 100) / 100
}

/** Change la fréquence (par exemple de ±1, ±0,1 ou ±0,01), entre 0 et 12, arrondie au centième. */
export function reglerFrequence(e: EtatMO1, ecart: number): Effet<EtatMO1> {
  const f = Math.round((e.frequence + ecart) * 100) / 100
  return sansEvenement({ ...e, frequence: Math.max(MORSE.frequenceMin, Math.min(MORSE.frequenceMax, f)) })
}

/** ÉMETTRE : sans avarie, rien ; bonne fréquence → réparé ; sinon, erreur. */
export function emettreMorse(e: EtatMO1, ctx: Contexte): Effet<EtatMO1> {
  if (!e.indicatif) return sansEvenement(e)
  if (Math.abs(e.frequence - frequenceAttendue(e.indicatif, ctx.interrupteurs)) < 0.001) {
    return { etat: { ...e, indicatif: null }, evenements: [{ type: 'reparation', module: 'MO-1' }] }
  }
  return { etat: e, evenements: [{ type: 'erreur', module: 'MO-1', nature: 'mauvaise fréquence' }] }
}
