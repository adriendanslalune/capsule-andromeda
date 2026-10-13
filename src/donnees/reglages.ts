// Réglages d'équilibrage du jeu. Valeurs du prototype v0.1 (voir docs/regles.md).
// Ne pas modifier sans l'accord d'Adrien.

/** Vitesse de base de la C-58 (km/s). */
export const VITESSE_BASE = 17.4
/** Chaque amélioration du moteur multiplie la vitesse par ce facteur. */
export const FACTEUR_AMELIORATION = 1.1
/** Multiplicateur de vitesse quand le levier L-A (TU-1) est abaissé. */
export const FACTEUR_LEVIER_A = 0.2
/** Multiplicateur de vitesse quand au moins un module est en avarie. */
export const FACTEUR_AVARIE = 0.45

/** Vitesse de virage de la fusée (degrés par seconde). */
export const TAUX_VIRAGE = 4

/** Distance d'arrivée (UA) : planète ou point libre. */
export const SEUIL_ARRIVEE = 0.002
/** Distance d'arrivée (UA) : Lune. */
export const SEUIL_ARRIVEE_LUNE = 0.0002
