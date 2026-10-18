// Les trois Maisons (voir CLAUDE.md) et les missions de chacune : le nettoyage d'épaves aux Nettoyeurs, la livraison
// aux Commerçants, le dépannage aux Mercenaires. Le volet Missions s'en sert pour son filtre par Maison (demande
// d'Adrien du 18/10/2026) ; le jeu propose 2 missions de chaque Maison, ou 4 de la Maison du joueur et 1 de chacune
// des autres quand il en a choisi une. L'appartenance (proposée selon l'affinité, jamais définitive) viendra à
// l'étape 8.

import type { Contrat, GenreContrat } from '../moteur/contrats'
import { PAR_AUTRE_MAISON, PAR_MAISON_CHOISIE, PAR_MAISON_NEUTRE } from './contrats'

export type Maison = 'nettoyeurs' | 'commercants' | 'mercenaires'

export const MAISONS: readonly { maison: Maison; titre: string }[] = [
  { maison: 'nettoyeurs', titre: 'NETTOYEURS' },
  { maison: 'commercants', titre: 'COMMERÇANTS' },
  { maison: 'mercenaires', titre: 'MERCENAIRES' },
]

export const MAISON_DU_GENRE: Readonly<Record<GenreContrat, Maison>> = {
  nettoyer: 'nettoyeurs', livrer: 'commercants', depanner: 'mercenaires',
}

/** Le genre des missions d'une Maison. */
export function genreDeMaison(m: Maison): GenreContrat {
  return (Object.keys(MAISON_DU_GENRE) as GenreContrat[]).find((g) => MAISON_DU_GENRE[g] === m)!
}

/** Combien de missions proposer pour chaque Maison, selon la Maison du joueur (null : neutre). */
export function missionsParMaison(maisonDuJoueur: Maison | null): Record<Maison, number> {
  const n = (m: Maison) => (maisonDuJoueur === null ? PAR_MAISON_NEUTRE : m === maisonDuJoueur ? PAR_MAISON_CHOISIE : PAR_AUTRE_MAISON)
  return { nettoyeurs: n('nettoyeurs'), commercants: n('commercants'), mercenaires: n('mercenaires') }
}

export function maisonDuContrat(c: Contrat): Maison {
  return MAISON_DU_GENRE[c.genre]
}

export function titreMaison(m: Maison): string {
  return MAISONS.find((f) => f.maison === m)!.titre
}
