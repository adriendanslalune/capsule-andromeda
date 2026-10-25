// Les blasons des Maisons, dessinés par ChatGPT (Adrien, 25/10/2026 ; docs/fenetres-prompts.md) : des écussons brodés
// d'équipage, un par Maison. Ils remplacent les emojis de la lettre d'invitation et marquent la Maison d'un capitaine
// dans le Profil, sa fiche et les Messages.

import type { Maison } from '../donnees/maisons'

/** La balise d'un blason (sa taille vient de la classe, dans le CSS). */
export function blason(m: Maison, classe = 'blason'): string {
  return `<img class="${classe}" src="blasons/${m}.webp" alt="" aria-hidden="true">`
}
