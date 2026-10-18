// Le Marché vu depuis la capsule (étape 7, écrans d'abord) : les cours de chaque marché, et le délai de la lumière.
// Les cours arrivent à la vitesse de la lumière : ceux d'un marché lointain sont vieux de plusieurs minutes. Pour
// l'instant, cours d'essai fixes, un peu différents d'un marché à l'autre ; la formule du temps viendra ensuite.

import { MARCHANDISES, MARGE, type FicheMarche } from '../donnees/marche'
import { C_KM_S, distanceDepuisCapsule } from './navigation'

/** Délai de la lumière (ms) entre un lieu et la capsule, à l'instant t. */
export function delaiLumiere(lieu: string, t: number): number {
  return (distanceDepuisCapsule(lieu, t) / C_KM_S) * 1000
}

export interface Cours { marchandise: string; achat: number; vente: number; /** Tendance : -1, 0 ou 1. */ tendance: number }

/** Petit hachage d'un texte (pour varier les cours d'essai d'un marché à l'autre, toujours de la même façon). */
function hachage(s: string): number {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0) / 4294967296
}

/** Les cours d'essai d'un marché : le prix de base de chaque marchandise, à ±25 % selon le marché. */
export function coursDuMarche(m: FicheMarche): Cours[] {
  return MARCHANDISES.map((f) => {
    const h = hachage(`${m.nom}/${f.nom}`)
    const achat = Math.max(1, Math.round(f.prix * (0.75 + 0.5 * h)))
    return { marchandise: f.nom, achat, vente: Math.max(1, Math.round(achat * (1 - MARGE))), tendance: h < 0.33 ? -1 : h > 0.66 ? 1 : 0 }
  })
}
