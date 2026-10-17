// La capsule du joueur au début du jeu, et les niveaux de son moteur.
// Niveau 1 : 30 km/s, sans limite de portée pour l'instant (décision d'Adrien du 17/10/2026) ; les niveaux suivants
// et leur prix viendront avec le tutoriel (étape 3).

export interface NiveauMoteur {
  niveau: number
  /** Vitesse de croisière (km/s). */
  vitesse: number
}

export const NIVEAUX_MOTEUR: readonly NiveauMoteur[] = [
  { niveau: 1, vitesse: 30 },
]

/** Crédits au début du jeu. */
export const CREDITS_DEPART = 0
