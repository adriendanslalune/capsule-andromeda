// La capsule du joueur au début du jeu, et les niveaux de son moteur.
// Niveau 1 : 30 km/s, sans limite de portée pour l'instant ; niveaux suivants achetés avec les crédits (barème validé
// par Adrien le 17/10/2026, prix lissés après essai : 200, 600, 1 500 ; à compléter plus tard).

export interface NiveauMoteur {
  niveau: number
  /** Vitesse de croisière (km/s). */
  vitesse: number
  /** Prix (crédits) pour passer à ce niveau. */
  prix: number
}

export const NIVEAUX_MOTEUR: readonly NiveauMoteur[] = [
  { niveau: 1, vitesse: 30, prix: 0 },
  { niveau: 2, vitesse: 60, prix: 200 },
  { niveau: 3, vitesse: 120, prix: 600 },
  { niveau: 4, vitesse: 250, prix: 1500 },
]

/** Crédits au début du jeu. */
export const CREDITS_DEPART = 0
