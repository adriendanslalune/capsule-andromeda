// Réglages des modules. Valeurs du prototype v0.1 (voir docs/regles.md, section 5). Ne pas modifier sans
// l'accord d'Adrien : le manuel décrit ces valeurs.

/** CH-1 Chambre de combustion et TU-1 Tuyère (bloc propulsion). */
export const PROPULSION = {
  /** Pression P (0 à 100) : cible en surpression, en sous-pression, sinon 50 + (R − 5) × 12 (+15 si L-B abaissé). */
  pressionSurpression: 96,
  pressionSousPression: 6,
  pressionNominale: 50,
  pressionParCran: 12,
  pressionLevierB: 15,
  /** Vitesse d'évolution de P (par seconde) : L-B relevé / abaissé. */
  vitessePression: 5,
  vitessePressionLevierB: 4,
  /** Surpression si P > 90 pendant 2 s ; sous-pression si P < 15 pendant 2 s. */
  seuilSurpression: 90,
  seuilSousPression: 15,
  dureeAvantFaute: 2,
  /** Réparation CH-1 : molette R sur 2 (surpression) ou 7 (sous-pression), puis presser P. */
  reglageSurpression: 2,
  reglageSousPression: 7,
  /** Presser P sans avarie : purge à vide, P − 20. */
  purgeAVide: 20,
  /** Température T : cible L-A abaissé, en surchauffe, sinon ; et vitesses d'évolution (par seconde). */
  temperatureLevierA: 18,
  temperatureSurchauffe: 96,
  temperatureNominale: 45,
  vitesseTemperatureLevierA: 3.5,
  vitesseTemperatureSurchauffe: 3,
  vitesseTemperature: 2,
  /** Réparation TU-1 : L-A relevé à T ≤ 40 → réparé ; entre 40 et 60 → faux réparé, rechute 6 s plus tard. */
  temperatureReparation: 40,
  temperatureFauxRepare: 60,
  delaiRechute: 6,
  /** Emballement : presser P pendant une surchauffe. */
  temperatureEmballement: 100,
  /** Position de départ de la molette R. */
  moletteDepart: 5,
} as const

/** AL-1 Fusibles. */
export const COULEURS_FUSIBLES = ['bleu', 'rouge', 'vert', 'jaune'] as const
export type CouleurFusible = (typeof COULEURS_FUSIBLES)[number]
export const NOMBRE_FUSIBLES = 8

/** CO-1 Codeur : mots de code et leurs 4 chiffres (table de la page VIII du manuel). */
export const MOTS_CODEUR: Readonly<Record<string, string>> = {
  ORION: '4721', VESTA: '3058', ATLAS: '1946', CERES: '8203', TITAN: '6390', ARGOS: '2584', DELTA: '7162',
  HYDRE: '9035', CYGNE: '1478', PERSE: '5609', ALGOL: '3317', RIGEL: '8842', SIRIUS: '2205', ALTAIR: '6671',
  DENEB: '4096', MIRA: '7350', CASTOR: '1189', POLLUX: '9512', ANTARES: '3724', CAPELLA: '5863',
}

/** PB-1 Tableau de brassage. */
export const COULEURS_CABLES = ['rouge', 'bleu', 'jaune'] as const
export type CouleurCable = (typeof COULEURS_CABLES)[number]
/** Branchement d'une fusée neuve : [prise A, prise B] de chaque câble. */
export const BRASSAGE_DEPART: Readonly<Record<CouleurCable, readonly [number, number]>> = {
  rouge: [2, 3], bleu: [4, 5], jaune: [1, 1],
}
/** Branchement à rétablir pour le câble défectueux : [dernier chiffre pair, impair], chacun [prise A, prise B]. */
export const BRASSAGE_CIBLE: Readonly<Record<CouleurCable, readonly [readonly [number, number], readonly [number, number]]>> = {
  rouge: [[1, 4], [2, 5]], bleu: [[3, 1], [5, 2]], jaune: [[4, 3], [1, 2]],
}

/** LP-1 Lampes à vide. */
export const LAMPES = {
  nombre: 6,
  /** Lampes défectueuses par avarie : 1 + aléa × min(3, 1 + améliorations ÷ 10) (partie entière). */
  maximumParAvarie: 3,
  ameliorationsParLampe: 10,
} as const
export const ETATS_LAMPE_DEFECTUEUSE = ['eteinte', 'bleue', 'verte'] as const

/** HY-1 Circuit hydraulique : grille de 4 colonnes × 3 rangées ; seuils du manomètre H pour R-1, R-2, R-3. */
export const HYDRAULIQUE = { colonnes: 4, rangees: 3, rangeeSource: 1, seuilR1: 35, seuilR3: 70 } as const

/** RE-1 Recycleur d'air. */
export const RECYCLEUR = {
  o2Depart: 80,
  co2Depart: 20,
  /** Usure : O2 −1 toutes les 90 s, CO2 +1 toutes les 100 s. */
  secondesParPointO2: 90,
  secondesParPointCO2: 100,
  /** Vanne de purge V-C ouverte : CO2 −4 par seconde, O2 −0,5 par seconde. */
  purgeCO2: 4,
  purgeO2: 0.5,
  /** Avarie si O2 < 25 ou CO2 > 75. */
  o2Minimum: 25,
  co2Maximum: 75,
  /** Réparé quand CO2 < 40, 60 ≤ O2 ≤ 90 et V-C fermée. */
  co2Repare: 40,
  o2ZoneVerteMin: 60,
  o2ZoneVerteMax: 90,
  /** POMPE : O2 +10 ; au-delà de 90, la soupape lâche et O2 retombe à 70. */
  pompe: 10,
  o2ApresSoupape: 70,
} as const

/** MO-1 Morse : annuaire des stations (indicatif → fréquence d'émission), page XIV du manuel. */
export const STATIONS_MORSE: Readonly<Record<string, number>> = {
  VEGA: 3.47, ARES: 5.12, IRIS: 8.06, NOVA: 2.89, LUNA: 6.64, ECHO: 9.31, ZETA: 1.75, OMEGA: 10.42, SOL: 4.58, ATLAS: 7.93,
}
export const MORSE = {
  /** Fréquence affichée au départ, bornes du réglage (le réglage se fait au centième). */
  frequenceDepart: 5,
  frequenceMin: 0,
  frequenceMax: 12,
  /** S-1 bas : ajouter 1,00 à la fréquence. */
  correctionS1: 1,
  /** Durée d'un point (s) ; un trait vaut 3 points ; 3 points entre deux lettres, 8 avant de recommencer. */
  point: 0.22,
} as const
/** Alphabet morse international. */
export const ALPHABET_MORSE: Readonly<Record<string, string>> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-',
  L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-',
  W: '.--', X: '-..-', Y: '-.--', Z: '--..',
}

/** CR-1 Chronomètre de bord : dérive de ±7 à ±240 minutes ; tolérance au recalage : 1 minute. */
export const CHRONOMETRE = { deriveMin: 7, deriveMax: 240, tolerance: 1 } as const

/** AN-1 Antenne : tolérance 5° ; jamais en avarie à moins de 0,02 UA (3 millions de km) de la Terre. */
export const ANTENNE = { tolerance: 5, distanceMinTerre: 0.02 } as const

/** SX-1 Sextant : tolérance 1,5°. */
export const SEXTANT = { tolerance: 1.5 } as const
