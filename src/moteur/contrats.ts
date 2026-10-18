// Les missions du joueur (étape 3), appelées « contrats » dans le code (« mission » y désigne le voyage de la capsule).
// Quatre genres : nettoyer une épave (Nettoyeurs), livrer une cargaison (Commerçants : charger à une station, puis
// livrer), dépanner un engin ou abattre un chasseur alien (Mercenaires). Chaque mission appartient au tableau d'un lieu.
// Une mission est une suite d'étapes : aller à un lieu, puis y faire une action qui dure DUREE_ACTION.
// Les missions sont tirées au hasard, d'un hasard reproductible (une graine, enregistrée avec la partie).

import { FACTEUR_CHASSE, FACTEUR_LIVRAISON, PRIX_ECART, PRIX_MIN, ZONES, type Tableau } from '../donnees/tableaux'
import type { Maison } from '../donnees/maisons'

export type GenreContrat = 'nettoyer' | 'livrer' | 'depanner' | 'chasser'
export type Action = 'nettoyer' | 'charger' | 'livrer' | 'reparer' | 'abattre'

export interface Etape { lieu: string; action: Action }

export interface Contrat {
  id: number
  genre: GenreContrat
  etapes: Etape[]
  /** Crédits gagnés à la fin. */
  recompense: number
  /** Le lieu dont c'est une mission (son tableau). */
  tableau?: string
}

/** Tirage pseudo-aléatoire (mulberry32) : renvoie un nombre entre 0 et 1 et la graine suivante. */
export function hasard(graine: number): { x: number; graine: number } {
  const g = (graine + 0x6d2b79f5) >>> 0
  let t = g
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { x: ((t ^ (t >>> 14)) >>> 0) / 4294967296, graine: g }
}

/**
 * Récompense d'une mission, fixée une fois pour toutes à sa création (décision d'Adrien du 18/10/2026) : de PRIX_MIN à
 * PRIX_MIN + PRIX_ECART selon la mission, plus pour une livraison ou une chasse, multipliée par le facteur de sa zone
 * (ZONES : loin de la Terre et dangereux, ça paie plus) ; arrondie à la dizaine.
 */
export function recompense(genre: GenreContrat, zone: number, x: number): number {
  const facteur = genre === 'livrer' ? FACTEUR_LIVRAISON : genre === 'chasser' ? FACTEUR_CHASSE : 1
  return Math.round(((PRIX_MIN + PRIX_ECART * x) * facteur * zone) / 10) * 10
}

/** De quoi faire les missions d'un tableau : les lieux de son système (voir moteur/tableaux.ts). */
export interface ContexteTableau {
  tableau: Tableau
  /** Épaves à vider, débris à nettoyer. */
  epaves: readonly string[]
  /** Où charger une cargaison, et où la livrer. */
  departs: readonly string[]
  arrivees: readonly string[]
  /** Engins à dépanner ; chasseurs à abattre. */
  depannages: readonly string[]
  aliens: readonly string[]
}

/**
 * Tire une nouvelle mission d'une Maison sur un tableau : un nettoyage pour les Nettoyeurs, une livraison pour les
 * Commerçants, une chasse ou un dépannage pour les Mercenaires. `exclus` : lieux déjà pris (pour varier).
 */
export function tirerContrat(id: number, graine: number, ctx: ContexteTableau, maison: Maison, exclus: string[] = []): { contrat: Contrat; graine: number } {
  let g = graine
  const x = () => { const h = hasard(g); g = h.graine; return h.x }
  const tirer = <T>(liste: readonly T[]): T => liste[Math.floor(x() * liste.length)]
  const parmi = (liste: readonly string[]) => {
    const libres = liste.filter((l) => !exclus.includes(l))
    return tirer(libres.length ? libres : liste)
  }
  let genre: GenreContrat = maison === 'nettoyeurs' ? 'nettoyer' : maison === 'commercants' ? 'livrer' : 'chasser'
  if (genre === 'chasser' && (!ctx.aliens.length || (ctx.depannages.length && x() < 0.4))) genre = 'depanner'
  let etapes: Etape[]
  if (genre === 'nettoyer') etapes = [{ lieu: parmi(ctx.epaves), action: 'nettoyer' }]
  else if (genre === 'depanner') etapes = [{ lieu: parmi(ctx.depannages), action: 'reparer' }]
  else if (genre === 'chasser') etapes = [{ lieu: parmi(ctx.aliens), action: 'abattre' }]
  else {
    const depart = tirer(ctx.departs)
    etapes = [{ lieu: depart, action: 'charger' }, { lieu: parmi(ctx.arrivees.filter((a) => a !== depart)), action: 'livrer' }]
  }
  const contrat: Contrat = { id, genre, etapes, recompense: recompense(genre, ZONES[ctx.tableau.lieu], x()), tableau: ctx.tableau.lieu }
  return { contrat, graine: g }
}
