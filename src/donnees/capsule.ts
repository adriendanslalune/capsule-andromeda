// La capsule du joueur au début du jeu, et les niveaux de son moteur.
// Décision d'Adrien du 19/10/2026 : la capsule accélère à 10 g jusqu'à sa vitesse maximale, la garde, puis freine à
// 10 g pour s'arrêter à l'arrivée ; sur un trajet court, elle n'a pas le temps d'atteindre sa vitesse maximale.
// Améliorer le moteur, c'est doubler sa vitesse maximale (30 km/s au niveau 1), jusqu'au niveau 10 ; prix ×2,5 par
// niveau (200, 600, 1 500 validés le 17/10/2026, puis la même progression).

export interface NiveauMoteur {
  niveau: number
  /** Vitesse de croisière (km/s). */
  vitesse: number
  /** Prix (crédits) pour passer à ce niveau. */
  prix: number
  /** Matériaux à fournir (tonnes, pris dans la soute) pour passer à ce niveau. */
  materiaux: Readonly<Record<string, number>>
}

/**
 * Décision d'Adrien du 20/10/2026 : chaque niveau demande aussi des matériaux (l'une des seules utilités des
 * matériaux), choisis pour que la progression tire vers l'extérieur : le cuivre vers Mercure et Vénus, le titane vers
 * Mars, l'Hélium 3 vers Jupiter. Tout tient dans la soute de 20 t.
 */
export const NIVEAUX_MOTEUR: readonly NiveauMoteur[] = [
  { niveau: 1, vitesse: 30, prix: 0, materiaux: {} },
  { niveau: 2, vitesse: 60, prix: 200, materiaux: { Ferraille: 3 } },
  { niveau: 3, vitesse: 120, prix: 600, materiaux: { Cuivre: 3 } },
  { niveau: 4, vitesse: 240, prix: 1_500, materiaux: { Cuivre: 5, Verre: 2 } },
  { niveau: 5, vitesse: 480, prix: 3_750, materiaux: { Titane: 4 } },
  { niveau: 6, vitesse: 960, prix: 9_400, materiaux: { Titane: 6, 'Circuits anciens': 3 } },
  { niveau: 7, vitesse: 1_920, prix: 23_500, materiaux: { 'Circuits anciens': 5, 'Hélium 3': 2 } },
  { niveau: 8, vitesse: 3_840, prix: 58_500, materiaux: { 'Hélium 3': 5 } },
  { niveau: 9, vitesse: 7_680, prix: 146_500, materiaux: { 'Hélium 3': 8, Titane: 5 } },
  { niveau: 10, vitesse: 15_360, prix: 366_000, materiaux: { 'Hélium 3': 12, 'Circuits anciens': 6 } },
]

/** Accélération (et freinage) de la capsule : 10 g, en km/s². */
export const ACCELERATION = (10 * 9.80665) / 1000

/** Crédits au début du jeu. */
export const CREDITS_DEPART = 0
