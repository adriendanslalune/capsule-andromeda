// Le combat au tour par tour (ABATTRE, mission des Mercenaires ; décisions d'Adrien du 19/10/2026) : aucun hasard sur
// les coups, l'ennemi annonce son prochain coup ; à chaque tour, on répartit 6 crans d'énergie entre l'arme, la
// manœuvre et le bouclier, on vise un module ennemi, puis les deux camps tirent en même temps. Coque à 0 : retraite
// forcée (la Coque de la capsule tombe en panne), pas de game over. Toutes ces valeurs sont PROVISOIRES.

/** Les crans d'énergie de la capsule, à chaque tour (plus tard : un 7ᵉ cran à acheter). */
export const ENERGIE_TOTALE = 6
/** Les armes : coût en crans, dégâts. Le laser est arrêté par le bouclier ennemi ; la torpille le traverse, mais un
 *  ennemi en DÉFENSE l'intercepte. */
export const ARMES = {
  laser: { titre: 'LASER', cout: 2, degats: 3 },
  torpille: { titre: 'TORPILLE', cout: 3, degats: 3 },
} as const
export type Arme = keyof typeof ARMES
/** L'esquive (moteurs) : son coût ; elle divise par deux le laser ennemi (pas le missile, qui est guidé). */
export const COUT_ESQUIVE = 2
/** Torpilles à bord, par combat (plus tard : à acheter, comme les améliorations de l'armement). */
export const TORPILLES = 3

/** La capsule. */
export const COQUE_MAX = 10
export const INTERCEPTEURS = 3

/** L'ennemi : ses trois modules (un coup abîme le module visé ET la coque). */
export type NomModuleEnnemi = 'armes' | 'bouclier' | 'moteur'
export const MODULES_ENNEMI: readonly { nom: NomModuleEnnemi; titre: string; pv: number; role: string }[] = [
  { nom: 'armes', titre: 'ARMES', pv: 3, role: 'détruites : il ne peut plus tirer' },
  { nom: 'bouclier', titre: 'BOUCLIER', pv: 2, role: 'détruit : tes lasers passent en entier' },
  { nom: 'moteur', titre: 'MOTEUR', pv: 2, role: 'détruit : il ne peut plus se mettre en défense' },
]
/** Un module ennemi détruit est réparé (avec 1 point) au bout de tant de tours : le désarmer ne dure qu'un temps. */
export const TOURS_REPARATION = 2
/** Les modules sont plus solides loin de la Terre : jusqu'à tant de points en plus (à Pluton). */
export const PV_MODULES_EN_PLUS = 2
/** Le bouclier ennemi arrête tant de dégâts de laser par tour (RENFORCÉ : +2 ; détruit, plus rien). */
export const BOUCLIER_ENNEMI = 1
export const BOUCLIER_ENNEMI_EN_PLUS = 0
export const RENFORT_BOUCLIER = 2

/**
 * Selon la zone du système (1 pour la Terre … 60 pour Pluton) : la coque de l'ennemi (8 → 20) et ses dégâts (laser
 * 4 → 9 ; missile, que le bouclier n'arrête pas : 1 de moins). Voir moteur/combat.ts.
 */
export const COQUE_ENNEMI_MIN = 8
export const COQUE_ENNEMI_MAX = 20
export const LASER_ENNEMI_MIN = 4
export const LASER_ENNEMI_MAX = 9
export const MALUS_MISSILE = 1
/** La RAFALE (un laser et un missile dans le même tour) apparaît à partir de ce niveau (0 : Terre, 1 : Pluton). */
export const NIVEAU_RAFALE = 0.25

/** Victoire sans perdre un point de coque : la récompense augmente de 10 % (comme les autres missions). */
export const BONUS_SANS_DEGAT = 1.1

// Ancienne répartition de l'énergie (prototype temps réel) : gardée pour lire les parties enregistrées.
export interface Energie { boucliers: number; armes: number; moteurs: number }
export type SystemeEnergie = keyof Energie
export const MAX_PAR_SYSTEME = 4
export const ENERGIE_DEPART: Energie = { boucliers: 2, armes: 3, moteurs: 1 }
