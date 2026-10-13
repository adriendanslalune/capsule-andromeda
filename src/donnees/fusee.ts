// Données fixes de la fusée C-58.

/** Lettres utilisées dans les numéros de série (sans I, O ni Q, pour éviter les confusions avec 1 et 0). */
export const LETTRES_SERIE = 'ABCDEFGHJKLMNPRSTUVWXYZ'

/** Chiffres utilisés dans les numéros de série. */
export const CHIFFRES_SERIE = '0123456789'

/** Lettres comptées comme voyelles pour la règle « le numéro de série commence par une voyelle ». */
export const VOYELLES = 'AEIOUY'

/** Position d'un interrupteur du bloc AL-1. */
export type PositionInterrupteur = 'haut' | 'bas'

/** Interrupteurs S-1 à S-4, dans l'ordre. */
export type Interrupteurs = readonly [
  PositionInterrupteur,
  PositionInterrupteur,
  PositionInterrupteur,
  PositionInterrupteur,
]

/** Position des interrupteurs S-1 à S-4 sur une fusée neuve. */
export const INTERRUPTEURS_DEPART: Interrupteurs = ['haut', 'haut', 'bas', 'haut']
