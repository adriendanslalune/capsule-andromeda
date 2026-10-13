// État complet d'une partie.
// Tout ce qui doit être sauvegardé est ici, sous forme de données simples (sérialisables en JSON).
// Les autres parties de l'état (modules, pannes, chasse…) seront ajoutées étape par étape.

import type { NomCorps } from '../astro/corps'
import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../donnees/fusee'
import { creerFusee, type EtatFusee } from './fusee'
import type { Hasard } from './hasard'
import { creerModules, type EtatModules } from './modules'
import { genererSerie } from './serie'

/** Version du format de sauvegarde. À augmenter à chaque changement de structure, avec une migration. */
export const VERSION_FORMAT = 1

/** Un contrat proposé par l'Office. */
export interface OffreContrat {
  /** Identifiant : « AAAA-MM-JJ-n » (date du lundi) pour les contrats de la semaine, « tutoriel-n » pour le tutoriel. */
  id: string
  type: string
  texte: string
  destination: NomCorps
}

/** Un contrat accepté, avec sa prime figée à l'acceptation. */
export interface ContratEnCours extends OffreContrat {
  prime: number
}

/** Une ligne du journal des crédits. */
export interface EntreeJournal {
  /** Instant (ms UTC). */
  t: number
  raison: string
  /** Montant (CR) : positif pour un gain, négatif pour une dépense. */
  montant: number
}

export interface Statistiques {
  /** Pannes réparées. */
  pannes: number
  /** Contrats remplis. */
  contrats: number
  /** Plus grande distance au Soleil atteinte (UA). */
  distanceMaxSoleil: number
}

export interface EtatPartie {
  /** Version du format, pour migrer les anciennes sauvegardes. */
  version: number
  /** Instant de création de la partie (ms UTC). */
  creeLe: number
  /** Dernier instant simulé (ms UTC), pour le rattrapage après une absence. */
  vu: number
  /** Numéro de série de la fusée (LLC-CCL). */
  serie: string
  /** Interrupteurs S-1 à S-4. */
  interrupteurs: Interrupteurs
  /** Crédits (CR). */
  credits: number
  /** Nombre d'améliorations du moteur achetées. */
  ameliorations: number
  /** Modules et instruments achetés à l'Office (en plus des modules de base), dans l'ordre d'achat. */
  modulesInstalles: string[]
  /** Position, cap et destination de la fusée. */
  fusee: EtatFusee
  /** État des modules de bord (commandes, aiguilles, avaries). */
  modules: EtatModules
  /** Contrats acceptés et pas encore remplis (3 au plus). */
  contrats: ContratEnCours[]
  /** Contrats déjà remplis (ceux de la semaine et ceux du tutoriel), pour ne pas les proposer à nouveau. */
  contratsFaits: string[]
  /** Journal des crédits, le plus récent en premier. */
  journal: EntreeJournal[]
  /** Trophées obtenus (identifiants), dans l'ordre d'obtention. */
  trophees: string[]
  stats: Statistiques
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
    modulesInstalles: [],
    fusee: creerFusee(t),
    modules: creerModules(hasard),
    contrats: [],
    contratsFaits: [],
    journal: [],
    trophees: [],
    stats: { pannes: 0, contrats: 0, distanceMaxSoleil: 0 },
  }
}
