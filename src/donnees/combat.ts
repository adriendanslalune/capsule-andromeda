// Le combat (ABATTRE, mission des Mercenaires ; décision d'Adrien du 19/10/2026 : temps réel, comme les premiers jeux
// sur Game Boy). Vue du dessus : la capsule en bas, qu'on déplace du doigt, tire toute seule ; les aliens arrivent
// d'en haut et tirent des balles qu'il faut esquiver. Plus il y a d'aliens (loin de la Terre), plus c'est dur. Coque à
// 0 : retraite (la Coque de la capsule tombe en panne), pas de game over. Toutes ces valeurs sont PROVISOIRES.

/** Le terrain : 100 unités de large, 160 de haut (y vers le bas). */
export const LARGEUR = 100
export const HAUTEUR = 160

/** La capsule : sa coque, la taille de son point d'impact (petit, comme dans les jeux de tir), sa vitesse maximale. */
export const COQUE_MAX = 10
export const RAYON_CAPSULE = 2.4
export const VITESSE_CAPSULE = 140
/** Touchée : invulnérable un instant (s), le temps de se dégager. */
export const INVULNERABLE = 1.2
/** Le doigt est sous la capsule : elle se place tant d'unités au-dessus de lui (le pouce ne la cache pas). */
export const DECALAGE_DOIGT = 18
/** Tir automatique : intervalle (s), vitesse des projectiles (unités/s), dégâts. */
export const CADENCE = 0.16
export const VITESSE_TIR = 150
export const DEGATS_TIR = 1
/** Les bombes (les anciens intercepteurs) : effacent toutes les balles et abîment tous les aliens. */
export const BOMBES = 3
export const DEGATS_BOMBE = 4

/** Le chasseur visé par la mission (le « boss ») : points de coque et rythme de tir, de près de la Terre à Pluton. */
export const PV_CHASSEUR = [30, 80] as const
export const TIR_CHASSEUR = [1.5, 0.7] as const
/** Vitesse des balles ennemies (unités/s), de près de la Terre à Pluton. */
export const VITESSE_BALLES = [36, 56] as const
/** Les escorteurs : combien à la fois (0 près de la Terre … 6 à Pluton), leur coque, leur rythme de tir (s). */
export const ESCORTEURS_MAX = 6
export const PV_ESCORTEUR = 3
export const TIR_ESCORTEUR = 2.4
/** Une nouvelle vague d'escorteurs toutes les tant de secondes (tant que le chasseur tient). */
export const VAGUE = 7

/** Victoire sans être touché : la récompense augmente de 10 % (comme les autres missions). */
export const BONUS_SANS_DEGAT = 1.1

// Ancienne répartition de l'énergie (premier prototype) : gardée pour lire les parties enregistrées.
export interface Energie { boucliers: number; armes: number; moteurs: number }
export type SystemeEnergie = keyof Energie
export const ENERGIE_TOTALE = 6
export const MAX_PAR_SYSTEME = 4
export const ENERGIE_DEPART: Energie = { boucliers: 2, armes: 3, moteurs: 1 }
