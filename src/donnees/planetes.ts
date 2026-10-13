// Planètes du système solaire : éléments orbitaux képlériens J2000 et leurs dérivées séculaires.
// Source : E. M. Standish (JPL/NASA), « Keplerian Elements for Approximate Positions of the Major Planets »,
// table 1 (valable de 1800 à 2050). Valeurs identiques à celles du prototype v0.1 (tableau `EL`).

export const NOMS_PLANETES = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'] as const

export type NomPlanete = (typeof NOMS_PLANETES)[number]

/** Planètes qui ont des satellites naturels. */
export type PlaneteAvecSatellites = Exclude<NomPlanete, 'Mercure' | 'Vénus'>

/**
 * Six éléments, dans l'ordre : demi-grand axe a (UA), excentricité e, inclinaison I (°),
 * longitude moyenne L (°), longitude du périhélie ϖ (°), longitude du nœud ascendant Ω (°).
 */
export type ElementsKepler = readonly [a: number, e: number, I: number, L: number, varpi: number, noeud: number]

export interface Planete {
  nom: NomPlanete
  /** Rayon moyen (km). */
  rayon: number
  /** Éléments à J2000. */
  elements: ElementsKepler
  /** Variation des éléments par siècle julien. */
  parSiecle: ElementsKepler
}

export const PLANETES: readonly Planete[] = [
  { nom: 'Mercure', rayon: 2439,
    elements: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
    parSiecle: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
  { nom: 'Vénus', rayon: 6052,
    elements: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
    parSiecle: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418] },
  { nom: 'Terre', rayon: 6371,
    elements: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
    parSiecle: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0] },
  { nom: 'Mars', rayon: 3390,
    elements: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    parSiecle: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
  { nom: 'Jupiter', rayon: 69911,
    elements: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
    parSiecle: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
  { nom: 'Saturne', rayon: 58232,
    elements: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
    parSiecle: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] },
  { nom: 'Uranus', rayon: 25362,
    elements: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
    parSiecle: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589] },
  { nom: 'Neptune', rayon: 24622,
    elements: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
    parSiecle: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664] },
]

/** Rayon de la Lune (km). */
export const RAYON_LUNE = 1737.4

/**
 * Rapport de masse Soleil / planète (UAI 2015 ; pour la Terre, Terre + Lune).
 * Sert à calculer la sphère d'influence de chaque planète (rayon de Hill).
 */
export const RAPPORT_MASSE_SOLEIL: Readonly<Record<NomPlanete, number>> = {
  Mercure: 6023657.33, Vénus: 408523.72, Terre: 328900.56, Mars: 3098703.59,
  Jupiter: 1047.348644, Saturne: 3497.9018, Uranus: 22902.951, Neptune: 19412.26,
}
