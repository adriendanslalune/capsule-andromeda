// État complet d'une partie.
// Tout ce qui doit être sauvegardé est ici, sous forme de données simples (sérialisables en JSON).
// Les autres parties de l'état (fusée, modules, pannes, chasse…) seront ajoutées étape par étape.

import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../donnees/fusee'
import type { Hasard } from './hasard'
import { genererSerie } from './serie'

/** Version du format de sauvegarde. À augmenter à chaque changement de structure, avec une migration. */
export const VERSION_FORMAT = 1

export interface EtatPartie {
  /** Version du format, pour migrer les anciennes sauvegardes. */
  version: number
  /** Instant de création de la partie (ms UTC). */
  creeLe: number
  /** Dernier instant simulé (ms UTC), pour le rattrapage hors ligne. */
  vu: number
  /** Numéro de série de la fusée (LLC-CCL). */
  serie: string
  /** Interrupteurs S-1 à S-4. */
  interrupteurs: Interrupteurs
  /** Crédits (CR). */
  credits: number
  /** Nombre d'améliorations du moteur achetées. */
  ameliorations: number
}

/** Crée une nouvelle partie à l'instant t. */
export function creerPartie(t: number, hasard: Hasard): EtatPartie {
  return {
    version: VERSION_FORMAT,
    creeLe: t,
    vu: t,
    serie: genererSerie(hasard),
    interrupteurs: INTERRUPTEURS_DEPART,
    credits: 0,
    ameliorations: 0,
  }
}
