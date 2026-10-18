// Les trois Maisons (voir CLAUDE.md) et les missions de chacune : le nettoyage d'épaves aux Nettoyeurs, la livraison
// aux Commerçants, le dépannage et la chasse aux Mercenaires. Le volet Missions s'en sert pour son filtre par Maison
// (demande d'Adrien du 18/10/2026) ; le jeu propose 2 missions de chaque Maison sur chaque planète, ou 4 de la Maison
// du joueur et 1 de chacune des autres quand il en a choisi une (sur une lune, 4 missions). L'appartenance (proposée
// selon l'affinité, jamais définitive) viendra à l'étape 8.

import type { Contrat, GenreContrat } from '../moteur/contrats'
import { PAR_AUTRE_MAISON, PAR_MAISON_CHOISIE, PAR_MAISON_NEUTRE } from './contrats'

export type Maison = 'nettoyeurs' | 'commercants' | 'mercenaires'

export const MAISONS: readonly { maison: Maison; titre: string }[] = [
  { maison: 'nettoyeurs', titre: 'NETTOYEURS' },
  { maison: 'commercants', titre: 'COMMERÇANTS' },
  { maison: 'mercenaires', titre: 'MERCENAIRES' },
]

export const MAISON_DU_GENRE: Readonly<Record<GenreContrat, Maison>> = {
  nettoyer: 'nettoyeurs', livrer: 'commercants', depanner: 'mercenaires', chasser: 'mercenaires',
}

/**
 * Combien de missions de chaque Maison sur un tableau de `nombre` missions, selon la Maison du joueur (null : neutre).
 * Planète (6) : 2 de chaque, ou 4 de la sienne et 1 des autres. Lune (4) : 1 de chaque, plus 1 de la sienne (neutre : la
 * Maison « en plus » est tirée d'après le nom du lieu, toujours la même).
 */
export function missionsParMaison(maisonDuJoueur: Maison | null, nombre = 6, lieu = ''): Record<Maison, number> {
  if (nombre >= 6) {
    const n = (m: Maison) => (maisonDuJoueur === null ? PAR_MAISON_NEUTRE : m === maisonDuJoueur ? PAR_MAISON_CHOISIE : PAR_AUTRE_MAISON)
    return { nettoyeurs: n('nettoyeurs'), commercants: n('commercants'), mercenaires: n('mercenaires') }
  }
  const enPlus = maisonDuJoueur ?? MAISONS[[...lieu].reduce((s, c) => s + c.charCodeAt(0), 0) % 3].maison
  const r = { nettoyeurs: 1, commercants: 1, mercenaires: 1 }
  r[enPlus] += nombre - 3
  return r
}

export function maisonDuContrat(c: Contrat): Maison {
  return MAISON_DU_GENRE[c.genre]
}

export function titreMaison(m: Maison): string {
  return MAISONS.find((f) => f.maison === m)!.titre
}
