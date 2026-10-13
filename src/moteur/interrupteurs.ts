// Interrupteurs S-1 à S-4 du bloc AL-1.
// Ils servent d'indices dans plusieurs modules (AL-1, CO-1, HY-1, MO-1, AN-1…).

import type { Interrupteurs, PositionInterrupteur } from '../donnees/fusee'

/** Numéro d'interrupteur, comme écrit dans le manuel : S-1 à S-4. */
export type NumeroInterrupteur = 1 | 2 | 3 | 4

/** Position de l'interrupteur S-n. */
export function position(inters: Interrupteurs, n: NumeroInterrupteur): PositionInterrupteur {
  return inters[n - 1]
}

/** Vrai si l'interrupteur S-n est en position basse. */
export function estBas(inters: Interrupteurs, n: NumeroInterrupteur): boolean {
  return position(inters, n) === 'bas'
}

/** Bascule l'interrupteur S-n et renvoie les nouveaux interrupteurs (l'ancien tableau n'est pas modifié). */
export function basculer(inters: Interrupteurs, n: NumeroInterrupteur): Interrupteurs {
  const copie = [...inters] as PositionInterrupteur[]
  copie[n - 1] = copie[n - 1] === 'haut' ? 'bas' : 'haut'
  return copie as unknown as Interrupteurs
}
