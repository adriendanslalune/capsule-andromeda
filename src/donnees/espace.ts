// Ce qui peuple l'espace autour des planètes, en plus des vrais astres et engins (étapes 4 et 5 ; écrans d'abord) :
//   - des épaves, partout dans le système solaire (un Nettoyeur doit toujours en trouver, décision d'Adrien du
//     17/10/2026) ; vidée, une épave revient (d'autres débris) au bout d'un moment ;
//   - des chasseurs aliens d'Andromède : très rares près de la Terre, de plus en plus nombreux et agressifs loin du
//     Soleil ; on ne les voit qu'au radar, quand on s'en approche ; ils tirent des missiles.
// Chacun tourne autour d'une planète (ou de Pluton) sur une orbite circulaire. Valeurs PROVISOIRES.

/** Une orbite simple : autour de quel astre, à quelle distance (km), légèrement inclinée, avec sa phase de départ. */
export interface ObjetEnOrbite { nom: string; parent: string; rayon: number; phase: number; inclinaison: number }

/** Paramètre gravitationnel des planètes (km³/s²), pour la période des orbites. */
export const GM: Readonly<Record<string, number>> = {
  Mercure: 22_032, Vénus: 324_859, Terre: 398_600, Mars: 42_828, Jupiter: 126_686_534, Saturne: 37_931_187,
  Uranus: 5_793_939, Neptune: 6_836_529, Pluton: 869.6,
}

/** Période d'une orbite circulaire (ms). */
export function periodeOrbite(o: ObjetEnOrbite): number {
  return 2 * Math.PI * Math.sqrt(o.rayon ** 3 / GM[o.parent]) * 1000
}

const o = (nom: string, parent: string, rayon: number, phase: number, inclinaison = 0.15): ObjetEnOrbite => ({ nom, parent, rayon, phase, inclinaison })

/** Les épaves libres (en plus des débris des missions de nettoyage). */
export const EPAVES: readonly ObjetEnOrbite[] = [
  o('Kosmos 482', 'Terre', 21_000, 0.1), o('Telstar 1', 'Terre', 9_500, 0.55), o('Vanguard 2', 'Terre', 12_000, 0.8),
  o('Étage d\'Ariane', 'Terre', 36_000, 0.3), o('Débris de Fengyun', 'Terre', 7_400, 0.65), o('Snoopy (Apollo 10)', 'Terre', 260_000, 0.2),
  o('Mars 3', 'Mars', 18_000, 0.4), o('Phobos-Grunt', 'Mars', 45_000, 0.75), o('Beagle 2', 'Mars', 120_000, 0.1),
  o('Venera 7', 'Vénus', 40_000, 0.6), o('Mariner 2', 'Vénus', 160_000, 0.2),
  o('Débris de Messenger', 'Mercure', 12_000, 0.35),
  o('Débris de Galileo', 'Jupiter', 2_500_000, 0.15), o('Juno (morceau)', 'Jupiter', 6_000_000, 0.7),
  o('Débris de Cassini', 'Saturne', 1_800_000, 0.45), o('Épave sans nom', 'Saturne', 5_000_000, 0.9),
  o('Épave d\'Uranus', 'Uranus', 900_000, 0.3), o('Épave de Neptune', 'Neptune', 1_200_000, 0.6),
  o('Débris de New Horizons', 'Pluton', 40_000, 0.5),
]

/** Les chasseurs aliens (plus nombreux loin du Soleil). */
export const ALIENS: readonly ObjetEnOrbite[] = [
  o('Chasseur Ξ-1', 'Terre', 1_420_000, 0.4, 0.3),
  o('Chasseur Ξ-2', 'Vénus', 700_000, 0.2, 0.3),
  o('Chasseur Ψ-1', 'Mars', 300_000, 0.1, 0.3), o('Chasseur Ψ-2', 'Mars', 700_000, 0.6, 0.3),
  o('Chasseur Ω-1', 'Jupiter', 3_000_000, 0.3, 0.3), o('Chasseur Ω-2', 'Jupiter', 8_000_000, 0.7, 0.3), o('Chasseur Ω-3', 'Jupiter', 15_000_000, 0.95, 0.3),
  o('Chasseur Σ-1', 'Saturne', 2_000_000, 0.15, 0.3), o('Chasseur Σ-2', 'Saturne', 6_000_000, 0.5, 0.3), o('Chasseur Σ-3', 'Saturne', 12_000_000, 0.85, 0.3),
  o('Chasseur Φ-1', 'Uranus', 1_000_000, 0.25, 0.3), o('Chasseur Φ-2', 'Uranus', 3_000_000, 0.55, 0.3), o('Chasseur Φ-3', 'Uranus', 6_000_000, 0.8, 0.3), o('Chasseur Φ-4', 'Uranus', 10_000_000, 0.05, 0.3),
  o('Chasseur Λ-1', 'Neptune', 1_000_000, 0.35, 0.3), o('Chasseur Λ-2', 'Neptune', 3_000_000, 0.65, 0.3), o('Chasseur Λ-3', 'Neptune', 8_000_000, 0.9, 0.3), o('Chasseur Λ-4', 'Neptune', 15_000_000, 0.15, 0.3),
  o('Chasseur Δ-1', 'Pluton', 100_000, 0.4, 0.3), o('Chasseur Δ-2', 'Pluton', 1_000_000, 0.75, 0.3),
]

/** Chance qu'un chasseur repéré tire un missile, par heure, selon son système (rare près de la Terre). */
export const TIRS_PAR_HEURE: Readonly<Record<string, number>> = {
  Mercure: 0.05, Vénus: 0.05, Terre: 0.03, Mars: 0.2, Jupiter: 0.35, Saturne: 0.45, Uranus: 0.55, Neptune: 0.6, Pluton: 0.6,
}

/** Portée du radar : une part de la sphère d'influence du système où est la capsule (en plein espace : 2 millions de km). */
export const PART_RADAR = 0.6
export const RADAR_ESPACE = 2_000_000
/** Durée de vol d'un missile (ms) : le décompte. */
export const VOL_MISSILE = 90_000
/** Une épave vidée revient (d'autres débris) au bout de ce temps ; un chasseur vaincu est remplacé au bout de celui-ci. */
export const RETOUR_EPAVE = 24 * 3_600_000
export const RETOUR_ALIEN = 12 * 3_600_000
/** Intercepteurs : au plus 3 ; un nouveau toutes les 30 minutes. */
export const INTERCEPTEURS_MAX = 3
export const RECHARGE_INTERCEPTEUR = 30 * 60_000
