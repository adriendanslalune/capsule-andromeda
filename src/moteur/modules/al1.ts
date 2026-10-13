// AL-1 Fusibles (module de base) : 8 fusibles F-1 à F-8, chacun avec une bague de couleur.
// Avarie : un fusible grille. Procédure : S-4 bas (couper l'alimentation), retirer le fusible grillé, insérer un
// fusible neuf de la bonne couleur, S-4 haut. Toute manipulation sous tension (S-4 haut) provoque une étincelle ;
// un fusible de mauvaise couleur grille aussitôt.

import { COULEURS_FUSIBLES, NOMBRE_FUSIBLES, type CouleurFusible } from '../../donnees/modules'
import type { Interrupteurs } from '../../donnees/fusee'
import { choisirAuHasard, entierAuHasard, type Hasard } from '../hasard'
import { estBas } from '../interrupteurs'
import { dernierChiffrePair } from '../serie'
import { sansEvenement, type Contexte, type Effet } from './commun'

export interface Fusible {
  couleur: CouleurFusible
  etat: 'bon' | 'grille' | 'vide'
}

export interface EtatAL1 {
  fusibles: Fusible[]
  /** Numéro (0 à 7) du fusible en avarie, ou null. */
  panne: number | null
  /** Couleur du fusible qui a grillé (pour la règle de remplacement). */
  couleurGrillee: CouleurFusible | null
}

/** Fusibles d'une fusée neuve : couleurs tirées au hasard, une fois pour toutes. */
export function creerAL1(hasard: Hasard): EtatAL1 {
  const fusibles = Array.from({ length: NOMBRE_FUSIBLES }, (): Fusible => ({
    couleur: choisirAuHasard(hasard, COULEURS_FUSIBLES), etat: 'bon',
  }))
  return { fusibles, panne: null, couleurGrillee: null }
}

export function al1EnPanne(e: EtatAL1): boolean {
  return e.panne !== null
}

/** Avarie : un fusible au hasard grille. */
export function panneAL1(e: EtatAL1, hasard: Hasard): EtatAL1 {
  const i = entierAuHasard(hasard, NOMBRE_FUSIBLES)
  return {
    fusibles: e.fusibles.map((f, k) => (k === i ? { ...f, etat: 'grille' } : f)),
    panne: i,
    couleurGrillee: e.fusibles[i].couleur,
  }
}

/**
 * Couleur du fusible neuf : S-1 bas → jaune ; sinon, dernier chiffre du n° de série pair → même couleur que le
 * fusible grillé ; impair → couleur suivante (bleu → rouge → vert → jaune → bleu).
 */
export function couleurAttendue(couleurGrillee: CouleurFusible, serie: string, inters: Interrupteurs): CouleurFusible {
  if (estBas(inters, 1)) return 'jaune'
  if (dernierChiffrePair(serie)) return couleurGrillee
  return COULEURS_FUSIBLES[(COULEURS_FUSIBLES.indexOf(couleurGrillee) + 1) % COULEURS_FUSIBLES.length]
}

const etincelle = (e: EtatAL1): Effet<EtatAL1> => ({ etat: e, evenements: [{ type: 'erreur', module: 'AL-1', nature: 'étincelle' }] })

/** Retire un fusible grillé (il faut S-4 bas). Un fusible en bon état ne se retire pas. */
export function retirerFusible(e: EtatAL1, i: number, ctx: Contexte): Effet<EtatAL1> {
  const f = e.fusibles[i]
  if (!f || f.etat !== 'grille') return sansEvenement(e)
  if (!estBas(ctx.interrupteurs, 4)) return etincelle(e)
  return sansEvenement({ ...e, fusibles: e.fusibles.map((g, k) => (k === i ? { ...g, etat: 'vide' } : g)) })
}

/**
 * Insère un fusible neuf dans un emplacement vide (il faut S-4 bas). De la bonne couleur, il tient ; de la
 * mauvaise couleur, il grille aussitôt.
 */
export function insererFusible(e: EtatAL1, i: number, couleur: CouleurFusible, ctx: Contexte): Effet<EtatAL1> {
  const f = e.fusibles[i]
  if (!f || f.etat !== 'vide') return sansEvenement(e)
  if (!estBas(ctx.interrupteurs, 4)) return etincelle(e)
  const bon = i !== e.panne || couleur === couleurAttendue(e.couleurGrillee!, ctx.serie, ctx.interrupteurs)
  const fusibles = e.fusibles.map((g, k): Fusible => (k === i ? { couleur, etat: bon ? 'bon' : 'grille' } : g))
  if (bon) return sansEvenement({ ...e, fusibles })
  // La règle part toujours de la couleur du PREMIER fusible grillé, même si un fusible de mauvaise couleur a grillé
  // à sa place depuis (décision d'Adrien du 13/10/2026 ; le manuel doit le préciser).
  return { etat: { ...e, fusibles }, evenements: [{ type: 'erreur', module: 'AL-1', nature: 'fusible regrillé' }] }
}

/**
 * À appeler après avoir basculé un interrupteur : quand S-4 revient en haut avec le bon fusible en place,
 * AL-1 est réparé.
 */
export function apresBasculeInterrupteur(e: EtatAL1, n: 1 | 2 | 3 | 4, ctx: Contexte): Effet<EtatAL1> {
  if (n !== 4 || estBas(ctx.interrupteurs, 4) || e.panne === null) return sansEvenement(e)
  if (e.fusibles[e.panne].etat !== 'bon') return sansEvenement(e)
  return { etat: { ...e, panne: null, couleurGrillee: null }, evenements: [{ type: 'reparation', module: 'AL-1' }] }
}
