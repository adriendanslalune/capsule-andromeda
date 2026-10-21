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
// Refait le 21/10/2026 (Adrien : le combat était trop facile, même vers Pluton) : bien plus dur, et de plus en plus en
// s'éloignant du Soleil ; l'armement (plus bas) se paie pour suivre.
export const PV_CHASSEUR = [60, 300] as const
export const TIR_CHASSEUR = [1.4, 0.45] as const
/** Vitesse des balles ennemies (unités/s), de près de la Terre à Pluton. */
export const VITESSE_BALLES = [44, 90] as const
/** Les escorteurs : combien à la fois (1 près de la Terre … 10 à Pluton), leur coque, leur rythme de tir (s). */
export const ESCORTEURS = [1, 10] as const
export const PV_ESCORTEUR = [3, 8] as const
export const TIR_ESCORTEUR = [2.4, 1.2] as const
/** Les balles d'un tir en éventail (de près de la Terre à Pluton). */
export const BALLES_EVENTAIL = [7, 15] as const
/** Une nouvelle vague d'escorteurs toutes les tant de secondes (tant que le chasseur tient). */
export const VAGUE = 7

/** Victoire sans être touché : la récompense augmente de 10 % (comme les autres missions). */
export const BONUS_SANS_DEGAT = 1.1
/**
 * Le vaisseau amiral d'une zone (l'assaut final, décisions d'Adrien du 21/10/2026) : ses points de vie valent ceux
 * d'un chasseur de la zone multipliés par… (une planète est plus dure qu'une lune) ; sous la moitié de ses points de
 * vie, il enrage (il tire plus vite, et en spirale). PROVISOIRE.
 */
export const PV_AMIRAL = { lune: 4, planete: 7 } as const
/** Sous la moitié de ses points de vie, il enrage (tir plus rapide, en spirale) ; sous le quart, frénésie (rafales, vagues serrées). */
export const RAGE_AMIRAL = 0.65
export const FRENESIE_AMIRAL = 0.4
export const VAGUE_FRENESIE = 3

/**
 * L'armement de la capsule (décisions d'Adrien du 21/10/2026) : quatre lignes, six niveaux chacune, payés en crédits
 * et en matériaux de la soute. Un 7e niveau n'existe que par l'avantage d'une Maison (+1 niveau sur sa ligne).
 * PROVISOIRE (à équilibrer en jouant).
 */
export type LigneArmement = 'coque' | 'canon' | 'bombes' | 'bouclier'
export interface FicheArmement { ligne: LigneArmement; titre: string; effet: string; valeurs: readonly number[]; texte: (v: number) => string; materiaux: readonly Readonly<Record<string, number>>[] }
export const PRIX_ARMEMENT = [0, 300, 600, 1_200, 2_400, 4_800] as const
export const NIVEAU_ARMEMENT_MAX = 6
export const ARMEMENT: readonly FicheArmement[] = [
  {
    ligne: 'coque', titre: 'Coque', effet: 'coups encaissés avant la retraite', valeurs: [10, 12, 15, 18, 22, 26, 30], texte: (v) => `${v} coups`,
    materiaux: [{}, { Ferraille: 2 }, { Ferraille: 4 }, { Titane: 3 }, { Titane: 5 }, { Titane: 8 }],
  },
  {
    ligne: 'canon', titre: 'Canon', effet: 'dégâts de chaque tir (au niveau 4 : une troisième balle en éventail)', valeurs: [1, 1.4, 1.9, 2.5, 3.2, 4, 5], texte: (v) => `×${v.toLocaleString('fr-FR')}`,
    materiaux: [{}, { Cuivre: 2 }, { Cuivre: 4 }, { 'Circuits anciens': 3 }, { 'Circuits anciens': 5 }, { 'Circuits anciens': 8 }],
  },
  {
    ligne: 'bombes', titre: 'Bombes', effet: 'bombes par combat', valeurs: [3, 4, 5, 6, 7, 8, 9], texte: (v) => `${v}`,
    materiaux: [{}, { Verre: 2 }, { Verre: 4 }, { 'Hélium 3': 2 }, { 'Hélium 3': 4 }, { 'Hélium 3': 6 }],
  },
  {
    ligne: 'bouclier', titre: 'Bouclier', effet: 'encaisse un coup, puis se recharge en…', valeurs: [0, 20, 15, 11, 8, 6, 5], texte: (v) => (v ? `${v} s` : 'aucun'),
    materiaux: [{}, { 'Circuits anciens': 2 }, { 'Circuits anciens': 4 }, { 'Hélium 3': 2 }, { 'Hélium 3': 4 }, { 'Hélium 3': 6 }],
  },
]
/** Le niveau du canon à partir duquel il tire une troisième balle, en éventail. */
export const CANON_TROIS_BALLES = 4
/** L'avantage de chaque Maison : +1 niveau sur une ligne. */
export const LIGNE_DE_MAISON: Record<string, LigneArmement> = { mercenaires: 'canon', ingenieurs: 'bouclier', nettoyeurs: 'bombes' }

// Ancienne répartition de l'énergie (premier prototype) : gardée pour lire les parties enregistrées.
export interface Energie { boucliers: number; armes: number; moteurs: number }
export type SystemeEnergie = keyof Energie
export const ENERGIE_TOTALE = 6
export const MAX_PAR_SYSTEME = 4
export const ENERGIE_DEPART: Energie = { boucliers: 2, armes: 3, moteurs: 1 }
