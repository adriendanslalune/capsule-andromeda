// Éléments communs à tous les modules.
// Chaque module a son propre état (données simples, sauvegardables), des commandes (ce que le joueur manipule),
// et renvoie des événements : réparation, erreur de manipulation, faute de pilotage.

import type { Interrupteurs } from '../../donnees/fusee'

/** Ce que les modules ont besoin de savoir sur le reste de la fusée. */
export interface Contexte {
  /** Numéro de série de la fusée. */
  serie: string
  /** Interrupteurs S-1 à S-4. */
  interrupteurs: Interrupteurs
  /** Instant présent (ms UTC). */
  t: number
}

export type Evenement =
  /** Le module est réparé (la prime sera versée par la gestion des pannes, sauf faute de pilotage). */
  | { type: 'reparation'; module: string }
  /** Fausse manœuvre sans conséquence durable (étincelle, purge à vide, mauvais code…). */
  | { type: 'erreur'; module: string; nature: string }
  /** Avarie provoquée par le joueur : à réparer, mais sans prime. */
  | { type: 'faute'; module: string }

/** Résultat d'une commande ou d'une évolution : le nouvel état du module et ce qui s'est passé. */
export interface Effet<E> {
  etat: E
  evenements: Evenement[]
}

export const sansEvenement = <E>(etat: E): Effet<E> => ({ etat, evenements: [] })
