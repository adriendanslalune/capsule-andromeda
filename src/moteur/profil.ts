// Le Profil du joueur (étape 8, écrans d'abord) : son affinité avec chaque Maison, tirée de ce qu'il a fait (les
// missions finies de chaque Maison), pour la toile d'araignée ; son pseudo (pour les Messages).

import { MAISONS, SEUIL_MISSIONS, SEUIL_PART, type Maison } from '../donnees/maisons'
import type { Jeu } from './jeu'

/** Part de chaque Maison dans les missions finies (somme 1), ou 0 partout s'il n'y en a pas encore. */
export function affinites(jeu: Jeu): Record<Maison, number> {
  const total = MAISONS.reduce((s, m) => s + jeu.carnet.missions[m.maison], 0)
  return Object.fromEntries(MAISONS.map((m) => [m.maison, total ? jeu.carnet.missions[m.maison] / total : 0])) as Record<Maison, number>
}

/** La Maison avec laquelle le joueur a le plus d'affinité, ou null (aucune mission, ou égalité). */
export function maisonPreferee(jeu: Jeu): Maison | null {
  const a = affinites(jeu)
  const tri = MAISONS.map((m) => m.maison).sort((x, y) => a[y] - a[x])
  return a[tri[0]] > a[tri[1]] ? tri[0] : null
}

/**
 * Les Maisons que le joueur peut rejoindre (décision d'Adrien du 18/10/2026 : proposée selon l'affinité) : assez de
 * missions finies pour elle (SEUIL_MISSIONS), et une part suffisante de toutes ses missions (SEUIL_PART).
 */
export function maisonsOuvertes(jeu: Jeu): Maison[] {
  const a = affinites(jeu)
  return MAISONS.map((m) => m.maison).filter((m) => jeu.carnet.missions[m] >= SEUIL_MISSIONS && a[m] >= SEUIL_PART)
}

/** Un pseudo acceptable : 3 à 16 lettres, chiffres, tirets ou soulignés. */
export function pseudoValide(p: string): boolean {
  return /^[\p{L}\p{N}_-]{3,16}$/u.test(p)
}
