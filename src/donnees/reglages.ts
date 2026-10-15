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

/**
 * Durée (s) pour passer de l'arrêt à la vitesse de croisière, ou de la croisière à l'arrêt : la vitesse change
 * linéairement (décision d'Adrien du 14/10/2026).
 */
export const DUREE_ACCELERATION = 20

/**
 * Départ d'une nouvelle partie (demande d'Adrien du 15/10/2026 : la première mission à moins de 5 minutes) : en orbite
 * autour de la Terre, à cette distance au-dessus de l'ISS (km), et qui la suit tant que la fusée n'est pas partie.
 */
export const DEPART_AU_DESSUS_ISS_KM = 1500

/**
 * Altitude de sécurité (km) au-dessus de certains astres : la fusée ne descend jamais plus bas, sauf pour rejoindre
 * une destination plus basse (décision d'Adrien du 15/10/2026 : jamais à moins de 400 km de la Terre).
 */
export const ALTITUDE_SECURITE_KM: Readonly<Record<string, number>> = { Terre: 400 }

/** Vitesse de virage de la fusée (degrés par seconde). */
export const TAUX_VIRAGE = 4

/**
 * Manœuvre de départ d'une orbite (demande d'Adrien du 15/10/2026) : la fusée recule lentement, tourne vers sa
 * destination, puis accélère en douceur (vitesse = croisière × (temps / durée)², on voit le lieu quitté s'éloigner).
 * En rattrapage hors ligne (pas longs), le départ se fait sans manœuvre.
 */
export const MANOEUVRE_DEPART = {
  /** Recul : durée (s) et vitesse (km/s). */
  reculS: 5,
  reculKmS: 0.02,
  /** Virage : au plus cette durée (s), puis l'accélération commence quoi qu'il arrive. */
  virageMaxS: 40,
  /** Accélération douce jusqu’à la croisière (s). */
  accelerationS: 45,
  /** Estimation du virage, pour le temps restant (s). */
  virageEstimeS: 10,
} as const

/** Vitesse de virage pendant la manœuvre de départ (degrés par seconde). */
export const TAUX_VIRAGE_DEPART = 8

/**
 * Distance d'arrivée et d'orbite d'une planète, de la Lune ou d'un satellite : trois rayons de l'astre, depuis son
 * centre (décision d'Adrien du 14/10/2026 : on était beaucoup trop loin, 300 000 km pour toutes les planètes). Le
 * Soleil garde 0,02 UA ; l'ISS et les engins, leur approche.
 */
export const ORBITE_RAYONS = 3
/** Rayon supposé (km) d'un petit satellite dont le rayon n'est pas publié. */
export const RAYON_INCONNU_KM = 5
/** Ancienne distance d'arrivée (UA) des planètes, gardée pour mémoire (prototype v0.1). */
export const SEUIL_ARRIVEE = 0.002
/** Distance d'arrivée (km) : point libre (décision d'Adrien du 14/10/2026). */
export const SEUIL_ARRIVEE_POINT_KM = 1000
/**
 * Distance d'arrivée (UA) : Soleil, destination comme une autre (décision d'Adrien du 14/10/2026) : environ
 * 3 millions de km du centre, quatre rayons solaires.
 */
export const SEUIL_ARRIVEE_SOLEIL = 0.02
/** Distance d'arrivée (km) : engin humain (on s'en approche ensuite à 100 m). */
export const SEUIL_ARRIVEE_ENGIN_KM = 1
/** Distance d'arrivée (UA) : Lune. */
export const SEUIL_ARRIVEE_LUNE = 0.0002

/** Pannes. */
export const PANNES = {
  /**
   * Les avaries ne surviennent qu'en voyage (décision d'Adrien du 15/10/2026) : jamais en orbite, à l'arrêt, moteur
   * coupé ou en attente d'une fenêtre de tir. Tutoriel : une panne scénarisée par voyage du tutoriel, 18 s après le
   * départ.
   */
  delaiTutoriel: 18,
  /**
   * Ensuite, une avarie tous les X km parcourus (demande d'Adrien du 15/10/2026) : la prochaine survient après une
   * distance tirée entre ces bornes (km), comptée depuis la dernière réparation. Valeurs proposées par Claude.
   */
  kmMin: 1_500_000,
  kmMax: 4_500_000,
  /** Au plus 3 avaries par 24 heures glissantes (hors tutoriel). */
  maxParJour: 3,
  /** Taille maximale d'une cascade selon les améliorations : < 8 → 1 ; < 20 → 2 ; < 35 → 3 ; sinon 4. */
  paliersCascade: [8, 20, 35] as readonly number[],
  /** Prime de cascade = somme des primes × (1 + 0,5 × (n − 1)). */
  majorationParModule: 0.5,
} as const

/** Rattrapage après une absence (application fermée). */
export const ABSENCE = {
  /** En dessous de cette durée (s), rien à rattraper. */
  dureeMinimale: 5,
  /** Pas de la simulation (s). */
  pas: 600,
  /** Nombre maximal de messages gardés dans le rapport de vol. */
  messagesGardes: 30,
} as const

/**
 * Télégrammes entre commissionnaires (décisions d'Adrien du 14/10/2026) : texte libre ou phrase toute faite,
 * 3 envois gratuits par 24 heures, adressés à son système, à un joueur, ou à tout le système solaire ; chacun les
 * reçoit au vrai délai de la lumière depuis le point d'émission.
 */
export const TELEGRAMMES = {
  /** Envois permis sur 24 heures glissantes. */
  parJour: 3,
  /** Longueur maximale d'un télégramme (caractères). */
  longueur: 140,
  /** Télégrammes reçus gardés à l'écran (jours). */
  gardesJours: 3,
} as const
