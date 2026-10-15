// État complet d'une partie.
// Tout ce qui doit être sauvegardé est ici, sous forme de données simples (sérialisables en JSON).
// Les autres parties de l'état (modules, pannes, chasse…) seront ajoutées étape par étape.

import type { NomCorps } from '../astro/corps'
import { CHASSE } from '../donnees/chasse'
import { INTERRUPTEURS_DEPART, type Interrupteurs } from '../donnees/fusee'
import { creerChasse, type EtatChasse } from './chasse'
import { creerFusee, type EtatFusee } from './fusee'
import type { Hasard } from './hasard'
import { creerModules, type EtatModules } from './modules'
import { creerPannes, type EtatPannes } from './pannes'
import { genererSerie } from './serie'
import type { EtatTelegrammes } from './telegrammes'
import type { Compteurs } from './classement'

/** Version du format de sauvegarde. À augmenter à chaque changement de structure, avec une migration. */
export const VERSION_FORMAT = 1

/** Un contrat proposé par l'Office. */
export interface OffreContrat {
  /** Identifiant : « AAAA-MM-JJ-n » (date du lundi) pour les contrats de la semaine, « tutoriel-n » pour le tutoriel. */
  id: string
  type: string
  texte: string
  destination: NomCorps
  /** Prime fixe (contrats du tutoriel) ; sinon calculée à l'acceptation. */
  prime?: number
}

/** Un contrat accepté, avec sa prime figée à l'acceptation. */
export interface ContratEnCours extends OffreContrat {
  prime: number
}

/** Un contrat accompli : le contrat, et l'instant où il a été rempli. */
export interface ContratAccompli extends ContratEnCours {
  t: number
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
  /** Plus petite distance au Soleil atteinte (UA) ; absente des anciennes sauvegardes. */
  distanceMinSoleil?: number
  /** Télégrammes envoyés ; absent des anciennes sauvegardes. */
  telegrammes?: number
}

export interface EtatPartie {
  /** Version du format, pour migrer les anciennes sauvegardes. */
  version: number
  /** Instant de création de la partie (ms UTC). */
  creeLe: number
  /** Dernier instant simulé (ms UTC), pour le rattrapage après une absence. */
  vu: number
  /** Nom de la fusée, choisi par le joueur (affiché dans les annonces de trouvaille). */
  nom: string
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
  /** Programmation des avaries, cascade en cours, fautes de pilotage. */
  pannes: EtatPannes
  /** Chasse au visiteur : radio, télescope, indices, contacts. */
  chasse: EtatChasse
  /** Contrats acceptés et pas encore remplis (3 au plus). */
  contrats: ContratEnCours[]
  /** Contrats déjà remplis (ceux de la semaine et ceux du tutoriel), pour ne pas les proposer à nouveau. */
  contratsFaits: string[]
  /** Historique des contrats accomplis (le plus récent en premier, 50 au plus) ; absent des anciennes sauvegardes. */
  contratsAccomplis?: ContratAccompli[]
  /** Journal des crédits, le plus récent en premier. */
  journal: EntreeJournal[]
  /** Trophées obtenus (identifiants), dans l'ordre d'obtention. */
  trophees: string[]
  /** Instant d'obtention de chaque trophée ; absent des anciennes sauvegardes. */
  tropheesQuand?: Record<string, number>
  /** Relevés quotidiens des compteurs (jour UTC → compteurs), pour les points de la semaine et du mois. */
  releves?: Record<string, Compteurs>
  stats: Statistiques
  /** Télégrammes envoyés et lecture des reçus ; absent des anciennes sauvegardes. */
  telegrammes?: EtatTelegrammes
}

/** Crée une nouvelle partie à l'instant t. */
export function creerPartie(t: number, hasard: Hasard, nom = ''): EtatPartie {
  return {
    version: VERSION_FORMAT,
    creeLe: t,
    vu: t,
    nom: nom.trim().slice(0, CHASSE.longueurNomFusee),
    serie: genererSerie(hasard),
    interrupteurs: INTERRUPTEURS_DEPART,
    credits: 0,
    ameliorations: 0,
    modulesInstalles: [],
    fusee: creerFusee(t),
    modules: creerModules(hasard),
    pannes: creerPannes(t),
    chasse: creerChasse(t),
    contrats: [],
    contratsFaits: [],
    journal: [],
    trophees: [],
    stats: { pannes: 0, contrats: 0, distanceMaxSoleil: 0 },
  }
}

/** Baptise la fusée (24 caractères au plus) ; refusé si le nom est vide. */
export function baptiserFusee(etat: EtatPartie, nom: string): EtatPartie | null {
  const propre = nom.trim().replace(/\s+/g, ' ')
  if (!propre) return null
  return { ...etat, nom: propre.slice(0, CHASSE.longueurNomFusee) }
}
