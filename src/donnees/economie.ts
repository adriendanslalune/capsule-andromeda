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

/** Modules à installer, dans l'ordre obligatoire, avec leur prix (CR). */
export const MODULES_A_INSTALLER: readonly { code: string; nom: string; prix: number }[] = [
  { code: 'CO-1', nom: 'Codeur', prix: 40 },
  { code: 'PB-1', nom: 'Tableau de brassage', prix: 70 },
  { code: 'LP-1', nom: 'Lampes à vide', prix: 110 },
  { code: 'HY-1', nom: 'Circuit hydraulique', prix: 160 },
  { code: 'RE-1', nom: "Recycleur d'air", prix: 230 },
  { code: 'MO-1', nom: 'Morse', prix: 320 },
  { code: 'CR-1', nom: 'Chronomètre de bord', prix: 420 },
  { code: 'AN-1', nom: 'Antenne orientable', prix: 540 },
  { code: 'SX-1', nom: 'Sextant', prix: 680 },
]

/** Instruments de chasse : DET exige TEL. */
export const INSTRUMENTS: readonly { code: string; nom: string; prix: number; exige: string | null }[] = [
  { code: 'TEL', nom: 'Télescope', prix: 250, exige: null },
  { code: 'DET', nom: 'Détecteur de visiteurs', prix: 1200, exige: 'TEL' },
]

/** Nombre maximal de lignes gardées dans le journal des crédits. */
export const TAILLE_JOURNAL = 40

/** Contrats (décisions d'Adrien du 13/10/2026). */
export const CONTRATS = {
  /** Contrats proposés chaque semaine (après le tutoriel), renouvelés le lundi à 00:00 UTC. */
  parSemaine: 6,
  /** Nombre maximal de contrats en cours en même temps. */
  maxEnCours: 3,
  /** Prime = arrondi(base × cours + bonusParUA × distance en UA), figée à l'acceptation. */
  primeBase: 10,
  /** Bonus selon la distance entre le joueur et la destination, au moment où il accepte (CR par UA). */
  bonusParUA: 10,
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

/** Contrats du tutoriel, proposés seuls et dans l'ordre avant les contrats du jour (décision d'Adrien, 13/10/2026). */
export const CONTRATS_TUTORIEL: readonly { id: string; type: string; texte: string; destination: string }[] = [
  { id: 'tutoriel-1', type: 'LIVRAISON', texte: 'Livrer des pièces détachées au relais de la Lune.', destination: 'Lune' },
  { id: 'tutoriel-2', type: 'COURRIER', texte: 'Rapporter le courrier de la Lune jusqu’à l’ISS.', destination: 'ISS' },
]

/** Trophées. Le trophée « contact » est attribué par la chasse au visiteur. */
export const TROPHEES: readonly { id: string; nom: string; description: string }[] = [
  { id: 'premier', nom: 'Premier contrat', description: 'Accomplir un contrat' },
  { id: 'mars', nom: 'Mars', description: 'Atteindre Mars' },
  { id: 'jupiter', nom: 'Jupiter', description: 'Atteindre Jupiter' },
  { id: 'neptune', nom: 'Neptune', description: 'Atteindre Neptune' },
  { id: 'kuiper', nom: 'Ceinture de Kuiper', description: 'S’éloigner à 40 UA du Soleil' },
  { id: 'helio', nom: 'Héliopause', description: 'S’éloigner à 120 UA' },
  { id: 'voyager', nom: 'Plus loin que Voyager 1', description: 'Dépasser 170 UA' },
  { id: 'contact', nom: 'Premier contact', description: 'Intercepter un visiteur' },
]

/** Trophées d'arrivée : astre atteint → trophée. */
export const TROPHEES_ARRIVEE: Readonly<Record<string, string>> = { Mars: 'mars', Jupiter: 'jupiter', Neptune: 'neptune' }

/** Trophées de distance au Soleil (UA). */
export const TROPHEES_DISTANCE: readonly { ua: number; id: string }[] = [
  { ua: 40, id: 'kuiper' }, { ua: 120, id: 'helio' }, { ua: 170, id: 'voyager' },
]
