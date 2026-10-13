// Chasse au visiteur : réglages. Valeurs du prototype v0.1, sauf la durée des saisons (voir docs/regles.md).
// Ne pas modifier sans l'accord d'Adrien.

export const CHASSE = {
  /** Saisons : une par mois, du 1er à 00:00 UTC au 1er du mois suivant ; saison n° 0 = janvier 2026. */
  anneeDepart: 2026,
  /** Graine de la trajectoire de la saison n : n × 7919 + 13 (la même pour tous les joueurs). */
  graineMultiplicateur: 7919,
  graineDecalage: 13,
  /** Le visiteur fait escale près d'une planète entre Mercure et Saturne (6 premières), de 16 à 30 heures. */
  planetesVisitees: 6,
  escaleMinHeures: 16,
  escaleMaxHeures: 30,
  /** Pendant l'escale, il tourne autour de la planète : cercle de 0,004 UA, un tour en 6 heures. */
  rayonEscale: 0.004,
  periodeEscaleHeures: 6,
  /** Entre deux escales : voyage en ligne droite vers la planète la plus proche (hors ses deux dernières escales),
   * à 0,06 UA par heure, en 6 heures au moins. */
  vitesseUAParHeure: 0.06,
  voyageMinHeures: 6,
  /** La trajectoire est calculée 3 jours au-delà de la fin de la saison. */
  margeJours: 3,

  /** Ping radio : sur 7,13 (± 0,05) ; écho après l'aller-retour de la lumière ; recharge 5 minutes. */
  frequencePing: 7.13,
  toleranceFrequence: 0.05,
  frequenceRadioDepart: 7.13,
  rechargePingMinutes: 5,

  /** Observatoire : un bulletin toutes les 6 heures, sur la position du visiteur 6 heures plus tôt. */
  bulletinHeures: 6,
  /** Transmissions : toutes les 8 heures (graine = index × 31 + 7) ; une fois sur deux la planète la plus proche du
   * visiteur, sinon une planète au hasard. */
  transmissionHeures: 8,
  transmissionMultiplicateur: 31,
  transmissionDecalage: 7,

  /** Télescope TEL : direction à ± 3° si le visiteur est à moins de 3 UA ; recharge 30 minutes. */
  porteeTelescope: 3,
  erreurTelescopeDegres: 3,
  rechargeTelescopeMinutes: 30,

  /** Détecteur DET : visiteur visible à moins de 1,5 UA. */
  porteeDetecteur: 1.5,

  /** Contact à moins de 0,01 UA : 250 CR et le trophée, une fois par saison. */
  distanceContact: 0.01,
  primeContact: 250,

  /** Nombre d'indices gardés. */
  indicesGardes: 12,
} as const

/** Auteurs possibles des transmissions. */
export const AUTEURS_TRANSMISSIONS = ['UN CARGO DE L’OFFICE', 'UNE SONDE MÉTÉO', 'UN COMMISSIONNAIRE ANONYME', 'LE RELAIS DE CÉRÈS'] as const
