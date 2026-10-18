// Les trois Maisons (voir CLAUDE.md) et les missions de chacune : le nettoyage d'épaves aux Nettoyeurs, la livraison
// aux Commerçants, le dépannage aux Mercenaires. Le volet Missions s'en sert pour son filtre par Maison (demande
// d'Adrien du 18/10/2026) ; l'appartenance du joueur à une Maison viendra à l'étape 8.

import type { Contrat, GenreContrat } from '../moteur/contrats'

export type Maison = 'nettoyeurs' | 'commercants' | 'mercenaires'

export const MAISONS: readonly { maison: Maison; titre: string }[] = [
  { maison: 'nettoyeurs', titre: 'NETTOYEURS' },
  { maison: 'commercants', titre: 'COMMERÇANTS' },
  { maison: 'mercenaires', titre: 'MERCENAIRES' },
]

export const MAISON_DU_GENRE: Readonly<Record<GenreContrat, Maison>> = {
  nettoyer: 'nettoyeurs', livrer: 'commercants', depanner: 'mercenaires',
}

export function maisonDuContrat(c: Contrat): Maison {
  return MAISON_DU_GENRE[c.genre]
}

export function titreMaison(m: Maison): string {
  return MAISONS.find((f) => f.maison === m)!.titre
}
