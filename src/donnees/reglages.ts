// Réglages d'équilibrage du jeu. Valeurs du prototype v0.1 (voir docs/regles.md).
// Ne pas modifier sans l'accord d'Adrien.

/** Vitesse de base de la C-58 (km/s). Proposée par Adrien le 13/10/2026 (17,4 km/s dans le prototype). */
export const VITESSE_BASE = 30
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

/** Pannes. */
export const PANNES = {
  /** Première panne : 18 s après le début ; pendant le tutoriel, la suivante 18 s après la réparation. */
  delaiTutoriel: 18,
  /** Ensuite : une nouvelle avarie entre 120 et 300 s après que tout est réparé. */
  delaiMin: 120,
  delaiMax: 300,
  /** Taille maximale d'une cascade selon les améliorations : < 8 → 1 ; < 20 → 2 ; < 35 → 3 ; sinon 4. */
  paliersCascade: [8, 20, 35] as readonly number[],
  /** Prime de cascade = somme des primes × (1 + 0,5 × (n − 1)). */
  majorationParModule: 0.5,
} as const
