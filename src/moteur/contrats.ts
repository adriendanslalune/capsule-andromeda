// Les missions du joueur (étape 3), appelées « contrats » dans le code (« mission » y désigne le voyage de la capsule).
// Trois genres : nettoyer une épave, livrer une cargaison (charger à une station, puis livrer), dépanner un satellite.
// Une mission est une suite d'étapes : aller à un lieu, puis y faire une action qui dure DUREE_ACTION.
// Les missions sont tirées au hasard, d'un hasard reproductible (une graine, enregistrée avec la partie).

import { LIEUX_NETTOYAGE, RECOMPENSE_MAX, RECOMPENSE_MIN, SATELLITES, STATIONS } from '../donnees/contrats'
import { position } from './corps'

export type GenreContrat = 'nettoyer' | 'livrer' | 'depanner'
export type Action = 'nettoyer' | 'charger' | 'livrer' | 'reparer'

export interface Etape { lieu: string; action: Action }

export interface Contrat {
  id: number
  genre: GenreContrat
  etapes: Etape[]
  /** Crédits gagnés à la fin. */
  recompense: number
}

/** Tirage pseudo-aléatoire (mulberry32) : renvoie un nombre entre 0 et 1 et la graine suivante. */
export function hasard(graine: number): { x: number; graine: number } {
  const g = (graine + 0x6d2b79f5) >>> 0
  let t = g
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { x: ((t ^ (t >>> 14)) >>> 0) / 4294967296, graine: g }
}

/** Distance d'un lieu au centre de la Terre (km) à l'instant t. */
function distanceTerre(lieu: string, t: number): number {
  const a = position(lieu, t), b = position('Terre', t)
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/**
 * Récompense : de RECOMPENSE_MIN (orbite basse) à RECOMPENSE_MIN + 100 (vers la Lune), selon le lieu le plus éloigné
 * de la Terre ; une livraison (deux trajets) paie 40 % de plus ; jamais plus de RECOMPENSE_MAX ; arrondie à la dizaine.
 */
export function recompense(genre: GenreContrat, lieux: string[], t: number): number {
  const r = Math.max(...lieux.map((l) => distanceTerre(l, t)))
  const f = Math.min(1, Math.max(0, Math.log(r / 6800) / Math.log(400_000 / 6800)))
  const base = (RECOMPENSE_MIN + 100 * f) * (genre === 'livrer' ? 1.4 : 1)
  return Math.round(Math.min(RECOMPENSE_MAX, base) / 10) * 10
}

/**
 * Tire un nouveau contrat ; `exclus` : lieux déjà pris par les autres contrats (pour varier) ; `genreVoulu` : le genre
 * à tirer (sinon au hasard) ; `lieuxNettoyage` : les épaves parmi lesquelles choisir un nettoyage.
 */
export function tirerContrat(id: number, graine: number, t: number, exclus: string[] = [], genreVoulu?: GenreContrat,
  lieuxNettoyage: readonly string[] = LIEUX_NETTOYAGE): { contrat: Contrat; graine: number } {
  let g = graine
  const tirer = <T>(liste: readonly T[]): T => {
    const h = hasard(g)
    g = h.graine
    return liste[Math.floor(h.x * liste.length)]
  }
  const parmi = (liste: readonly string[]) => {
    const libres = liste.filter((l) => !exclus.includes(l))
    return tirer(libres.length ? libres : liste)
  }
  const genre = genreVoulu ?? tirer<GenreContrat>(['nettoyer', 'livrer', 'depanner'])
  let etapes: Etape[]
  if (genre === 'nettoyer') etapes = [{ lieu: parmi(lieuxNettoyage), action: 'nettoyer' }]
  else if (genre === 'depanner') etapes = [{ lieu: parmi(SATELLITES), action: 'reparer' }]
  else etapes = [{ lieu: tirer(STATIONS), action: 'charger' }, { lieu: parmi(SATELLITES), action: 'livrer' }]
  const contrat = { id, genre, etapes, recompense: recompense(genre, etapes.map((e) => e.lieu), t) }
  return { contrat, graine: g }
}
