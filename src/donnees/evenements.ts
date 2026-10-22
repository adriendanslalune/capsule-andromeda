// Les événements du jeu (idée d'Adrien du 20/10/2026, à définir avec lui) : chaque mois, un événement pour tous (une
// chasse à quelque chose, une énorme station qui apparaît à l'autre bout du système…). Le bandeau des annonces les
// fait défiler tant qu'ils durent. Les mêmes pour tous les joueurs (des dates fixes, en temps universel).

export interface Evenement {
  /** Début et fin (ISO, temps universel). */
  debut: string
  fin: string
  /** Ce que dit le bandeau des annonces. */
  texte: string
}

/** Aucun pour l'instant : à écrire avec Adrien. */
export const EVENEMENTS: readonly Evenement[] = []
