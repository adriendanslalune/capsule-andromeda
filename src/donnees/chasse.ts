// Chasse au visiteur : réglages (décisions d'Adrien du 13/10/2026, voir docs/regles.md).
// Ne pas modifier sans l'accord d'Adrien.

export const CHASSE = {
  /** Saisons : une par mois, du 1er à 00:00 UTC au 1er du mois suivant ; saison n° 0 = janvier 2026. */
  anneeDepart: 2026,
  /** Graine de la saison n : n × 7919 + 13 (la même pour tous les joueurs). */
  graineMultiplicateur: 7919,
  graineDecalage: 13,
  /** Chaque saison, le visiteur fait une boucle de 3 ou 4 escales ; il change d'escale chaque jour à 00:00 UTC. */
  escalesMin: 3,
  escalesMax: 4,
  /** Chaque jour, il se tient à côté de son astre, à une distance tirée entre ces bornes (km). Valeurs provisoires. */
  distanceAstreMinKm: 30_000,
  distanceAstreMaxKm: 150_000,

  /** On ne peut toucher la soucoupe dans la vue 3D (et lancer l'approche) qu'à moins de cette distance (km).
   * Valeur provisoire. */
  distanceReperageKm: 300_000,
  /** L'approche s'arrête à cette distance du visiteur (km). Valeur provisoire. */
  distanceApprocheKm: 0.2,
  /** La photo n'est valable qu'à moins de cette distance (km). */
  distancePhotoKm: 0.3,
  /** Prime d'une trouvaille (une par saison et par joueur). */
  primeTrouvaille: 250,

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

  /** Détecteur DET : visiteur signalé à moins de 1,5 UA (dans la vue 3D, la soucoupe clignote). */
  porteeDetecteur: 1.5,

  /** Nombre d'indices gardés. */
  indicesGardes: 12,

  /** Nom de la fusée choisi par le joueur : longueur maximale. */
  longueurNomFusee: 24,
} as const

/** Auteurs possibles des transmissions. */
export const AUTEURS_TRANSMISSIONS = ['UN CARGO DE L’OFFICE', 'UNE SONDE MÉTÉO', 'UN COMMISSIONNAIRE ANONYME', 'LE RELAIS DE CÉRÈS'] as const
