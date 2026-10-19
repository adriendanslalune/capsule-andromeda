// Données du manuel de maintenance, section 5 (bloc Coque ; mécaniques validées par Adrien le 19/10/2026) : les
// vannes (crans selon la pression du manomètre de la brèche), la brèche (ordre des rivets selon la forme de la
// fissure), le sas (l'interrupteur de chaque message). Le panneau et le manuel lisent les mêmes données : ce qui est
// écrit dans le manuel est exactement ce que le jeu attend, le même pour tous les joueurs.

/** Les trois vannes, de gauche à droite. */
export const VANNES: readonly { lettre: string; teinte: string }[] = [
  { lettre: 'A', teinte: '#d9694f' }, { lettre: 'B', teinte: '#3f63c4' }, { lettre: 'C', teinte: '#8fcf98' },
]
/** Une vanne a huit crans (45° chacun). */
export const CRANS_VANNE = 8

/**
 * TABLEAU 5-1 : de combien de crans tourner chaque vanne (A, B, C), selon la pression lue sur le manomètre BAR du
 * module 5B (de 1 à 9). Positif : sens des aiguilles d'une montre (↻) ; négatif : sens inverse (↺).
 */
export const CRANS_PAR_PRESSION: readonly (readonly number[])[] = [
  [1, 0, -2], [2, -1, 0], [0, 3, -1], [-2, 1, 1], [3, 0, 2], [-1, -2, 0], [0, 2, 3], [1, -3, -1], [-3, 1, 0],
]

/** Les quatre rivets de la plaque de la brèche : haut gauche, haut droite, bas gauche, bas droite. */
export const RIVETS: readonly string[] = ['HG', 'HD', 'BG', 'BD']

/** Une forme de fissure : son tracé (de 0 à 1 dans la plaque) et l'ordre de frappe des rivets. */
export interface Fissure { nom: string; trace: readonly (readonly [number, number])[]; ordre: readonly number[] }

/** TABLEAU 5-2 : les six formes de fissure et l'ordre de frappe des rivets. */
export const FISSURES: readonly Fissure[] = [
  { nom: 'L\'éclair', trace: [[0.25, 0.1], [0.65, 0.4], [0.35, 0.55], [0.75, 0.9]], ordre: [0, 3, 1, 2] },
  { nom: 'La fourche', trace: [[0.5, 0.9], [0.5, 0.5], [0.2, 0.15], [0.5, 0.5], [0.8, 0.15]], ordre: [2, 3, 0, 1] },
  { nom: 'La vague', trace: [[0.1, 0.5], [0.3, 0.35], [0.5, 0.6], [0.7, 0.35], [0.9, 0.55]], ordre: [1, 0, 3, 2] },
  { nom: 'La croix', trace: [[0.2, 0.2], [0.5, 0.5], [0.8, 0.2], [0.5, 0.5], [0.2, 0.8], [0.5, 0.5], [0.8, 0.8]], ordre: [3, 0, 2, 1] },
  { nom: 'La diagonale', trace: [[0.15, 0.85], [0.45, 0.55], [0.55, 0.45], [0.85, 0.15]], ordre: [2, 1, 0, 3] },
  { nom: 'Le crochet', trace: [[0.3, 0.1], [0.3, 0.7], [0.55, 0.85], [0.75, 0.65]], ordre: [0, 2, 3, 1] },
]

/** TABLEAU 5-3 : les messages de l'écran du sas, et l'interrupteur (1 à 8) à basculer pour chacun. */
export const MESSAGES_SAS: readonly { message: string; interrupteur: number }[] = [
  { message: 'SAS FERMÉ', interrupteur: 3 }, { message: 'JOINT SEC', interrupteur: 7 }, { message: 'P 1.01', interrupteur: 1 },
  { message: 'P 0.82', interrupteur: 5 }, { message: 'VIDE PARTIEL', interrupteur: 8 }, { message: 'PURGE N2', interrupteur: 2 },
  { message: 'HUBLOT TIÈDE', interrupteur: 6 }, { message: 'VERROU 2', interrupteur: 4 }, { message: 'ÉQUILIBRE', interrupteur: 1 },
  { message: 'FUITE LENTE', interrupteur: 7 }, { message: 'O2 BAS', interrupteur: 5 }, { message: 'CYCLE PRÊT', interrupteur: 3 },
]
