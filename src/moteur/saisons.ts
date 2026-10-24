// Le fond de la carte du mois (calendrier validé par Adrien le 24/10/2026 ; donnees/saisons.ts) : le kraft, ou le bleu
// nuit du thème sombre, légèrement teinté de la couleur pastel du mois (une teinte légère : le kraft reste reconnaissable).

import { SAISONS, type Saison } from '../donnees/saisons'

/** Le kraft et le bleu nuit d'origine. */
export const KRAFT = '#e7dcc4', BLEU_NUIT = '#141826'
/** La part de la teinte du mois dans le fond, le jour, et de la teinte assombrie, la nuit. */
const PART_JOUR = 0.2, PART_NUIT = 0.45

/** La saison d'un instant (le mois du téléphone). */
export function saison(t: number): Saison {
  return SAISONS[new Date(t).getMonth()]
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

/** Mélange deux couleurs (#rrggbb) : part de la seconde. */
export function melanger(a: string, b: string, part: number): string {
  const x = hex(a), y = hex(b)
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * part).toString(16).padStart(2, '0')).join('')
}

/** Le fond de la carte à l'instant t, de jour ou de nuit. */
export function fondDuMois(t: number, nuit: boolean): string {
  // La nuit, la teinte assombrie (mêlée telle quelle au bleu nuit, une couleur chaude le grisait).
  return nuit ? melanger(BLEU_NUIT, melanger('#000000', saison(t).teinte, 0.3), PART_NUIT) : melanger(KRAFT, saison(t).teinte, PART_JOUR)
}

/** La brève du mois, les trois premiers jours (la ronde des annonces). */
export function breveDuMois(t: number): string | null {
  return new Date(t).getDate() <= 3 ? saison(t).breve : null
}
