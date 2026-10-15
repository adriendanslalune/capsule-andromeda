// Économie : prix, primes, installations, contrats, trophées. Valeurs du prototype v0.1, sauf mention contraire
// (voir docs/regles.md). Ne pas modifier sans l'accord d'Adrien.

/** Coût de l'amélioration n (n commence à 0) : arrondi(20 × 1,07^n) jusqu'à n = 45, puis × 1,12 par niveau. */
export const AMELIORATION = { base: 20, facteur: 1.07, palier: 45, facteurApresPalier: 1.12 } as const

/** Prime de réparation de chaque module (CR). */
export const PRIMES_REPARATION: Readonly<Record<string, number>> = {
  'CH-1': 2, 'TU-1': 2, 'AL-1': 5, 'CO-1': 8, 'PB-1': 10, 'LP-1': 8, 'HY-1': 10, 'RE-1': 6, 'MO-1': 12,
  'CR-1': 8, 'AN-1': 10, 'SX-1': 12,
}

/** Modules présents sur une fusée neuve. */
export const MODULES_DE_BASE = ['CH-1', 'TU-1', 'AL-1'] as const

/**
 * Modules du tableau de bord, dans l'ordre. Ils ne s'achètent pas : chacun se débloque (et s'installe) quand le
 * moteur atteint son nombre d'améliorations, un toutes les 5 (décision d'Adrien du 15/10/2026 ; avant, ils
 * s'achetaient de 40 à 680 CR).
 */
export const MODULES_PAR_AMELIORATIONS = 5
export const MODULES_A_INSTALLER: readonly { code: string; nom: string; ameliorations: number }[] = [
  { code: 'CO-1', nom: 'Codeur' },
  { code: 'PB-1', nom: 'Tableau de brassage' },
  { code: 'LP-1', nom: 'Lampes à vide' },
  { code: 'HY-1', nom: 'Circuit hydraulique' },
  { code: 'RE-1', nom: 'Recycleur d’air' },
  { code: 'MO-1', nom: 'Morse' },
  { code: 'CR-1', nom: 'Chronomètre de bord' },
  { code: 'AN-1', nom: 'Antenne orientable' },
  { code: 'SX-1', nom: 'Sextant' },
].map((m, i) => ({ ...m, ameliorations: (i + 1) * MODULES_PAR_AMELIORATIONS }))

/** Instruments de chasse : DET exige TEL. */
export const INSTRUMENTS: readonly { code: string; nom: string; prix: number; exige: string | null }[] = [
  { code: 'TEL', nom: 'Télescope', prix: 250, exige: null },
  { code: 'DET', nom: 'Détecteur de visiteurs', prix: 1200, exige: 'TEL' },
]

/** Nombre maximal de lignes gardées dans le journal des crédits. */
export const TAILLE_JOURNAL = 40

/** Contrats (décisions d'Adrien du 13/10/2026). */
export const CONTRATS = {
  /** Contrats proposés chaque semaine (après le tutoriel), renouvelés le lundi à 00:00 UTC.
   * Renforcés à titre provisoire le 15/10/2026 (les pannes ne rapportent plus) : 12 au lieu de 6. */
  parSemaine: 12,
  /** Nombre maximal de contrats en cours en même temps. */
  maxEnCours: 3,
  /** Prime = arrondi(base × cours + bonusParUA × distance en UA), figée à l'acceptation (provisoire : 40 au lieu de 10). */
  primeBase: 40,
  /** Bonus selon la distance entre le joueur et la destination, au moment où il accepte (CR par UA ; provisoire : 20). */
  bonusParUA: 20,
  /** Contrat vers l'astre où la fusée est déjà en orbite : prime divisée par ce nombre (au moins 1 CR). */
  diviseurSurPlace: 10,
} as const

/** Types de contrats et leurs textes ({o} = objet, {d} = lieu). */
export const TYPES_CONTRATS: readonly { type: string; texte: string; objets: readonly string[] }[] = [
  { type: 'LIVRAISON', texte: 'Livrer {o} au relais de {d}.',
    objets: ['un injecteur', 'une sonde météo', 'des vivres', 'un sac de courrier', 'un compas gyroscopique',
      'des pièces détachées'] },
  { type: 'RELEVÉ', texte: 'Relever {o} près de {d}.',
    objets: ['la température', 'le champ magnétique', 'la poussière', 'les rayons cosmiques'] },
  { type: 'REMORQUAGE', texte: 'Ramener {o} en panne près de {d}.',
    objets: ['une sonde', 'une balise', 'un cargo léger', 'une capsule'] },
  { type: 'COURRIER', texte: 'Porter {o} jusqu’à {d}.',
    objets: ['un pli scellé', 'des lettres', 'un colis de l’Office'] },
]

/**
 * Contrats du tutoriel, proposés seuls et dans l'ordre avant les contrats de la semaine (décision d'Adrien du
 * 15/10/2026, remplace le tutoriel Terre-Lune) : trois courtes missions autour de la Terre pour apprendre, puis le
 * premier grand voyage, vers la Lune, annoncé solennellement. Primes fixes.
 */
export const CONTRATS_TUTORIEL: readonly { id: string; type: string; texte: string; destination: string; prime: number; grandVoyage?: boolean }[] = [
  { id: 'tutoriel-iss', type: 'COURRIER', texte: 'Porter le premier pli de l’Office à l’ISS.', destination: 'ISS', prime: 30 },
  { id: 'tutoriel-hubble', type: 'LIVRAISON', texte: 'Livrer un gyroscope de rechange au télescope Hubble.', destination: 'Hubble', prime: 40 },
  { id: 'tutoriel-tiangong', type: 'LIVRAISON', texte: 'Livrer des pièces détachées à la station Tiangong. En route, écoutez Radio-Terre.', destination: 'Tiangong', prime: 50 },
  { id: 'tutoriel-lune', type: 'COURRIER', texte: 'Le premier grand voyage : porter le courrier de l’Office au relais de la Lune.', destination: 'Lune', prime: 120, grandVoyage: true },
]

/** Ancien tutoriel (Terre-Lune) : une partie qui l'a fini a fini le tutoriel. */
export const FIN_ANCIEN_TUTORIEL = 'tutoriel-2'

/**
 * Ce que l'atelier dit de chaque module et instrument, pour donner envie de l'acheter (textes du jeu).
 * Les procédures de réparation restent dans le manuel : ici, seulement à quoi sert la pièce.
 */
export const DESCRIPTIONS_ATELIER: Readonly<Record<string, string>> = {
  'CO-1': 'Machine à chiffrer les rapports de l’Office. Un rapport chiffré, c’est un rapport mieux payé.',
  'PB-1': 'Distribue le courant entre les circuits de bord. Un câble de travers, et c’est la cafetière qui pilote.',
  'LP-1': 'Six lampes à vide pour amplifier la radio de bord. Elles chauffent, grésillent et claquent sans prévenir.',
  'HY-1': 'Achemine le liquide de refroidissement jusqu’aux trois réservoirs. Les tuyaux se tournent à la main.',
  'RE-1': 'Rend l’air de la cabine respirable. Recommandé par l’Office pour tout voyage de plus de cinq minutes.',
  'MO-1': 'Récepteur des stations de balisage. Pour les amateurs de points, de traits et de longues nuits.',
  'CR-1': 'L’heure exacte de bord, indispensable aux manœuvres. Il retarde quand on le regarde de travers.',
  'AN-1': 'Garde la liaison avec la Terre, à condition de la pointer dans la bonne direction.',
  'SX-1': 'Le point par les étoiles, comme les navigateurs d’autrefois. Rien de plus fiable, quand il marche.',
  TEL: 'Donne la direction du visiteur depuis la fusée, à 3° près, s’il est à moins de 3 UA. Une visée toutes les 30 minutes.',
  DET: 'Prévient quand le visiteur passe à moins de 1,5 UA de la fusée : le radar du cockpit donne sa distance.',
}
