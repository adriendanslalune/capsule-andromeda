// AN-1 Antenne orientable : elle maintient la liaison avec la Terre. Avarie : la liaison décroche ; il faut
// réorienter l'antenne vers la Terre (direction lue sur la carte, comptée comme le cap), +180° si S-3 est bas
// (antenne montée à l'envers), puis presser VERROUILLER. Tolérance : 5°. Jamais en avarie près de la Terre
// (moins de 0,02 UA, soit 3 millions de km).

import { ANTENNE } from '../../donnees/modules'
import type { Interrupteurs } from '../../donnees/fusee'
import { estBas } from '../interrupteurs'
import { direction, distance, ecartAngle, positionAstre, type Point2 } from '../fusee'
import { sansEvenement, type Contexte, type Effet } from './commun'

export interface EtatAN1 {
  /** Orientation de l'antenne (degrés, 0 à 359). */
  orientation: number
  avarie: boolean
}

export function creerAN1(): EtatAN1 {
  return { orientation: 0, avarie: false }
}

export function an1EnPanne(e: EtatAN1): boolean {
  return e.avarie
}

/** L'antenne ne peut pas décrocher à moins de 0,02 UA de la Terre. */
export function an1PeutTomberEnPanne(position: Point2, t: number): boolean {
  return distance(position, positionAstre('Terre', t)) > ANTENNE.distanceMinTerre
}

export function panneAN1(e: EtatAN1): EtatAN1 {
  return { ...e, avarie: true }
}

/** Orientation attendue : direction de la Terre vue de la fusée, +180° si S-3 est bas. */
export function orientationAttendue(position: Point2, t: number, inters: Interrupteurs): number {
  return (direction(position, positionAstre('Terre', t)) + (estBas(inters, 3) ? 180 : 0)) % 360
}

/** Tourne l'antenne de quelques degrés (positifs ou négatifs). */
export function tournerAntenne(e: EtatAN1, degres: number): Effet<EtatAN1> {
  return sansEvenement({ ...e, orientation: (((e.orientation + degres) % 360) + 360) % 360 })
}

/** VERROUILLER : sans avarie, rien ; à 5° près de l'orientation attendue → réparé ; sinon, erreur. */
export function verrouiller(e: EtatAN1, position: Point2, ctx: Contexte): Effet<EtatAN1> {
  if (!e.avarie) return sansEvenement(e)
  const ecart = Math.abs(ecartAngle(e.orientation, orientationAttendue(position, ctx.t, ctx.interrupteurs)))
  if (ecart <= ANTENNE.tolerance) return { etat: { ...e, avarie: false }, evenements: [{ type: 'reparation', module: 'AN-1' }] }
  return { etat: e, evenements: [{ type: 'erreur', module: 'AN-1', nature: 'liaison non rétablie' }] }
}
