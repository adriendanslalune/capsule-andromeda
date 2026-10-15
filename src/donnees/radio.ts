// Poste radio (décisions d'Adrien du 15/10/2026) : une seule radio, réglée au doigt de 0,00 à 12,00. Selon la
// fréquence, on écoute une station ou on émet le ping de chasse. Le jeu ne nomme jamais ce qu'il capte : la table
// des fréquences est dans le manuel. Valeurs des fréquences provisoires (à valider par Adrien).
// Ne pas modifier sans l'accord d'Adrien.

export const RADIO = {
  /** Plage du réglage. */
  min: 0,
  max: 12,
  /** Fréquence affichée au départ d'une nouvelle partie (sur aucune station). */
  depart: 6,
  /** Réception nette à ± 0,05 d'une station ; le signal se devine (brouillé) jusqu'à ± 0,30. */
  tolerance: 0.05,
  approche: 0.3,
} as const

/**
 * Fréquence du visiteur, mois par mois (janvier d'abord) : il ne répond au ping que sur celle de la saison en cours.
 * Elle ne s'entend pas : seul le manuel la donne.
 */
export const FREQUENCES_VISITEUR: readonly number[] = [7.13, 4.02, 9.74, 2.31, 6.27, 10.88, 1.46, 8.55, 3.12, 11.05, 5.71, 0.97]

/** Stations à l'écoute (en plus des 10 stations morse du MO-1, `STATIONS_MORSE`). */
export const STATIONS_RADIO = {
  /** Radio-Terre, la station de l'Office : nouvelles et top horaire, reçus avec le retard de la lumière. */
  radioTerre: 0.3,
  /** Observatoire (Terre) : le dernier bulletin de la chasse, répété en boucle. */
  observatoire: 0.62,
  /** Transmissions : le dernier signalement d'une lueur, répété en boucle. */
  transmissions: 11.68,
  /** Canal de détresse de l'Office : pour l'instant, aucun appel (les sauvetages viendront plus tard). */
  detresse: 5,
  /** Signal des monolithes : impulsions en nombres premiers, venues d'on ne sait où (usage à définir). */
  monolithe: 7.5,
} as const

/** Radio-Terre : une nouvelle toutes les 20 minutes, tirée de cette liste (la même pour tous). */
export const RADIO_TERRE = {
  minutesParNouvelle: 20,
  nouvelles: [
    'L’OFFICE RAPPELLE QUE LES CASQUES NE SE PORTENT PAS À L’ENVERS.',
    'MÉTÉO DE L’ORBITE BASSE : CIEL DÉGAGÉ, DÉBRIS ÉPARS.',
    'LE CONCOURS DE LA PLUS BELLE FUSÉE EST REPORTÉ FAUTE DE JURY.',
    'UN COMMISSIONNAIRE A RETROUVÉ SON TOURNEVIS SUR MARS. LE VOICI RÉCOMPENSÉ.',
    'RAPPEL : LE MANUEL N’EST PAS UN DESSOUS-DE-PLAT.',
    'LA CANTINE DE L’OFFICE SERT CETTE SEMAINE DU POTAGE LYOPHILISÉ AUX ÉTOILES.',
    'LES CRÉDITS DE L’OFFICE RESTENT LA MONNAIE LA PLUS SÛRE DU SYSTÈME SOLAIRE.',
    'AVIS AUX PILOTES : LES ANNEAUX DE SATURNE NE SONT PAS UN RACCOURCI.',
    'L’ORCHESTRE DE L’OFFICE JOUE CE SOIR « LA VALSE DES COMÈTES ».',
    'IL EST RAPPELÉ QUE LA LUNE N’EST PAS À VENDRE.',
    'PERDU : UN GANT DE SCAPHANDRE, TAILLE 9, PRÈS DE L’ISS. RÉCOMPENSE.',
    'L’OFFICE VOUS SOUHAITE UN BON VOL ET DES RÉPARATIONS SANS HISTOIRE.',
  ],
} as const
