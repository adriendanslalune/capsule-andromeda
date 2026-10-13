// HY-1 Circuit hydraulique : une grille de 4 × 3 tuyaux pivotants (droits ou coudés) relie la source (à gauche de
// la rangée du milieu) aux réservoirs R-1, R-2, R-3 (à droite). Toucher un tuyau le fait pivoter d'un quart de tour.
// Procédure : lire le manomètre H ; réservoir à alimenter : H < 35 → R-1, 35 à 70 → R-2, > 70 → R-3 ; S-2 bas →
// réservoir suivant (après R-3 : R-1) ; orienter les tuyaux pour relier la source à ce réservoir, et à lui seul ;
// ouvrir la VANNE. Si l'eau atteint un mauvais réservoir, ou n'arrive nulle part, l'ouverture est refusée.

import { HYDRAULIQUE as H } from '../../donnees/modules'
import type { Interrupteurs } from '../../donnees/fusee'
import { entierAuHasard, type Hasard } from '../hasard'
import { estBas } from '../interrupteurs'
import { sansEvenement, type Contexte, type Effet } from './commun'

/** Ouvertures d'un tuyau : nord, est, sud, ouest (masque de bits). */
const N = 1, E = 2, S = 4, O = 8
const DIRECTIONS = [
  { bit: N, dr: -1, dc: 0, oppose: S },
  { bit: E, dr: 0, dc: 1, oppose: O },
  { bit: S, dr: 1, dc: 0, oppose: N },
  { bit: O, dr: 0, dc: -1, oppose: E },
] as const

export interface Tuyau {
  forme: 'droit' | 'coude'
  /** Quarts de tour dans le sens des aiguilles d'une montre (0 à 3). */
  rotation: number
}

export interface EtatHY1 {
  /** Tuyaux, rangée par rangée (numéro = rangée × 4 + colonne). */
  tuyaux: Tuyau[]
  /** Manomètre H (0 à 100). */
  manometre: number
  avarie: boolean
}

const NB = H.colonnes * H.rangees
const SOURCE = H.rangeeSource * H.colonnes // tuyau de gauche de la rangée du milieu

/** Tourne un masque d'un quart de tour (N → E → S → O → N). */
function tourner(m: number): number {
  return ((m << 1) | (m >> 3)) & 15
}

/** Ouvertures actuelles d'un tuyau. */
export function ouvertures(t: Tuyau): number {
  let m = t.forme === 'droit' ? O | E : O | N
  for (let k = 0; k < t.rotation; k++) m = tourner(m)
  return m
}

/** Rotation qui donne exactement ces ouvertures à cette forme, ou null. */
function rotationPour(forme: Tuyau['forme'], masque: number): number | null {
  for (let r = 0; r < 4; r++) if (ouvertures({ forme, rotation: r }) === masque) return r
  return null
}

export function creerHY1(): EtatHY1 {
  const tuyaux = Array.from({ length: NB }, (_, i): Tuyau => ({ forme: i % 3 ? 'droit' : 'coude', rotation: i % 4 }))
  return { tuyaux, manometre: 50, avarie: false }
}

export function hy1EnPanne(e: EtatHY1): boolean {
  return e.avarie
}

/** Réservoir à alimenter (0 = R-1, 1 = R-2, 2 = R-3) selon le manomètre et S-2. */
export function reservoirAttendu(manometre: number, inters: Interrupteurs): number {
  let r = manometre < H.seuilR1 ? 0 : manometre <= H.seuilR3 ? 1 : 2
  if (estBas(inters, 2)) r = (r + 1) % 3
  return r
}

/** Réservoirs atteints par l'eau (rangées 0 à 2), en suivant les tuyaux depuis la source. */
export function reservoirsAtteints(tuyaux: Tuyau[]): number[] {
  if (!(ouvertures(tuyaux[SOURCE]) & O)) return []
  const vus = new Set([SOURCE])
  const file = [SOURCE]
  const sorties: number[] = []
  while (file.length) {
    const k = file.shift()!
    const r = Math.floor(k / H.colonnes), c = k % H.colonnes, m = ouvertures(tuyaux[k])
    if (c === H.colonnes - 1 && m & E && !sorties.includes(r)) sorties.push(r)
    for (const d of DIRECTIONS) {
      if (!(m & d.bit)) continue
      const r2 = r + d.dr, c2 = c + d.dc
      if (r2 < 0 || r2 >= H.rangees || c2 < 0 || c2 >= H.colonnes) continue
      const k2 = r2 * H.colonnes + c2
      if (!vus.has(k2) && ouvertures(tuyaux[k2]) & d.oppose) { vus.add(k2); file.push(k2) }
    }
  }
  return sorties
}

/**
 * Cherche une orientation des tuyaux qui relie la source au réservoir donné (en gardant les formes) :
 * renvoie les rotations à donner aux tuyaux du chemin, ou null s'il n'y a pas de chemin.
 */
export function cheminVers(tuyaux: Tuyau[], reservoir: number): Map<number, number> | null {
  const chemin = new Map<number, number>()
  const visite = (k: number, entree: number): boolean => {
    const r = Math.floor(k / H.colonnes), c = k % H.colonnes
    const forme = tuyaux[k].forme
    const sorties = DIRECTIONS.filter((d) => d.bit !== entree && (forme === 'droit' ? d.bit === tournerDemi(entree) : d.bit !== tournerDemi(entree)))
    for (const d of sorties) {
      const rotation = rotationPour(forme, entree | d.bit)
      if (rotation === null) continue
      if (d.bit === E && c === H.colonnes - 1) {
        if (r === reservoir) { chemin.set(k, rotation); return true }
        continue
      }
      const r2 = r + d.dr, c2 = c + d.dc
      if (r2 < 0 || r2 >= H.rangees || c2 < 0 || c2 >= H.colonnes) continue
      const k2 = r2 * H.colonnes + c2
      if (chemin.has(k2) || k2 === k) continue
      chemin.set(k, rotation)
      if (visite(k2, d.oppose)) return true
      chemin.delete(k)
    }
    return false
  }
  return visite(SOURCE, O) ? chemin : null
}

function tournerDemi(m: number): number {
  return tourner(tourner(m))
}

/**
 * Avarie : nouveau manomètre et nouvelle grille mélangée. La grille est choisie pour que la source puisse être reliée
 * à chacun des trois réservoirs (la panne reste réparable même si S-2 change), et pour ne pas être déjà réparée.
 * (Le prototype ne garantissait un chemin que vers un réservoir tiré au hasard, sans rapport avec le manomètre.)
 */
export function panneHY1(_e: EtatHY1, hasard: Hasard, ctx: Contexte): EtatHY1 {
  const manometre = Math.round(hasard() * 100)
  const attendu = reservoirAttendu(manometre, ctx.interrupteurs)
  for (;;) {
    const tuyaux = Array.from({ length: NB }, (): Tuyau => ({
      forme: hasard() < 0.5 ? 'droit' : 'coude', rotation: entierAuHasard(hasard, 4),
    }))
    const reliable = [0, 1, 2].every((r) => cheminVers(tuyaux, r) !== null)
    const dejaRepare = (() => { const s = reservoirsAtteints(tuyaux); return s.length === 1 && s[0] === attendu })()
    if (reliable && !dejaRepare) return { tuyaux, manometre, avarie: true }
  }
}

/** Fait pivoter le tuyau k d'un quart de tour. */
export function tournerTuyau(e: EtatHY1, k: number): Effet<EtatHY1> {
  return sansEvenement({ ...e, tuyaux: e.tuyaux.map((t, i) => (i === k ? { ...t, rotation: (t.rotation + 1) % 4 } : t)) })
}

/** Ouvre la VANNE : réparé si l'eau atteint le bon réservoir, et lui seul ; sinon, refus. */
export function ouvrirVanne(e: EtatHY1, ctx: Contexte): Effet<EtatHY1> {
  if (!e.avarie) return sansEvenement(e)
  const sorties = reservoirsAtteints(e.tuyaux)
  if (sorties.length === 1 && sorties[0] === reservoirAttendu(e.manometre, ctx.interrupteurs)) {
    return { etat: { ...e, avarie: false }, evenements: [{ type: 'reparation', module: 'HY-1' }] }
  }
  return { etat: e, evenements: [{ type: 'erreur', module: 'HY-1', nature: 'vanne refusée' }] }
}
