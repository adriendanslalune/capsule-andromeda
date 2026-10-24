// Les médailles et coupes des trophées (Adrien, 24/10/2026 : dessinées par Claude, façon pulp) : un ruban à la couleur
// de la catégorie, un disque de bronze ou d'argent frappé du symbole de la catégorie ; les plus rares sont des coupes
// d'or. Pas encore gagné : grisé (un « ? » pour un secret).

import type { CategorieTrophee, RareteTrophee } from '../donnees/trophees'

const ENCRE = '#2b2138'

/** Le ruban de chaque catégorie (les teintes pastel du jeu). */
const RUBANS: Record<CategorieTrophee, string> = {
  voyage: '#8fc3e0', contrats: '#f2d27a', combat: '#f3a08b', argent: '#a8d5a0', collections: '#c9b8ee', monde: '#9fd6cf', capitaine: '#e98a6f',
}

/** Le métal : clair, foncé. */
const METAUX: Record<RareteTrophee, [string, string]> = {
  bronze: ['#dc9a5e', '#9a5b2c'], argent: ['#e3e6ea', '#8e959e'], or: ['#f5c94e', '#b8862a'],
}
const GRIS: [string, string] = ['#d8d2c6', '#a59e91']

/** Le symbole de chaque catégorie, centré en (0, 0), dans un carré d'environ 18 de côté. */
const SYMBOLES: Record<CategorieTrophee, string> = {
  // Une fusée.
  voyage: '<path d="M0,-8 C4,-4 4,1 3,5 L-3,5 C-4,1 -4,-4 0,-8 Z M-3,1 L-6,6 L-3,5 Z M3,1 L6,6 L3,5 Z"/><path d="M-1.5,5 L0,8.5 L1.5,5" fill="#f2b53a"/><circle cx="0" cy="-2" r="1.4" fill="#faf2dc"/>',
  // Un bloc-notes coché.
  contrats: '<rect x="-5" y="-7" width="10" height="14" rx="1"/><path d="M-3,0 L-1,3 L3.5,-3" fill="none" stroke="#faf2dc" stroke-width="1.8"/>',
  // Un éclat de BD.
  combat: '<path d="M0,-8 L2,-3 L7,-5 L4,-1 L8,2 L3,2 L3,7 L0,3 L-3,7 L-3,2 L-8,2 L-4,-1 L-7,-5 L-2,-3 Z"/>',
  // Une pièce.
  argent: '<circle r="6.5"/><path d="M2.4,-2.6 A3.4,3.4 0 1 0 2.4,2.6" fill="none" stroke="#faf2dc" stroke-width="1.8"/>',
  // Un monolithe.
  collections: '<path d="M-3,-8 L3,-8 L3,8 L-3,8 Z"/><path d="M-1,-5 L1,-5" stroke="#faf2dc" stroke-width="1"/>',
  // Une planète à anneau.
  monde: '<circle r="4.6"/><ellipse rx="9" ry="2.6" transform="rotate(-20)" fill="none" stroke-width="1.6"/>',
  // Une étoile.
  capitaine: '<path d="M0,-8 L2.4,-2.5 L8,-2.4 L3.6,1.2 L5,7 L0,3.8 L-5,7 L-3.6,1.2 L-8,-2.4 L-2.4,-2.5 Z"/>',
}

/** La médaille (ou la coupe) d'un trophée, en SVG (60 × 72). */
export function medaille(categorie: CategorieTrophee, rarete: RareteTrophee, gagne: boolean, secret = false): string {
  const [clair, fonce] = gagne ? METAUX[rarete] : GRIS
  const ruban = gagne ? RUBANS[categorie] : '#e6e0d4'
  const symbole = !gagne && secret
    ? `<text y="5" text-anchor="middle" font-size="15" font-weight="bold" fill="${fonce}" stroke="none">?</text>`
    : `<g fill="${gagne ? ENCRE : fonce}" stroke="${gagne ? ENCRE : fonce}" stroke-width="0.6" stroke-linejoin="round">${SYMBOLES[categorie]}</g>`
  const trait = `stroke="${ENCRE}" stroke-width="1.6" stroke-linejoin="round"`
  if (rarete === 'or') {
    // La coupe : deux anses, un pied, le symbole frappé sur la panse.
    return `<svg viewBox="0 0 60 72" class="medaille${gagne ? '' : ' pas-encore'}" aria-hidden="true">`
      + `<path d="M17,14 C6,14 6,30 18,32 M43,14 C54,14 54,30 42,32" fill="none" ${trait} stroke-width="3" stroke="${fonce}"/>`
      + `<path d="M16,10 L44,10 L42,30 C40,40 34,44 30,44 C26,44 20,40 18,30 Z" fill="${clair}" ${trait}/>`
      + `<path d="M21,13 L23,30" stroke="#fff8e0" stroke-width="2" opacity="0.7"/>`
      + `<path d="M27,44 L33,44 L34,54 L26,54 Z" fill="${fonce}" ${trait}/>`
      + `<rect x="18" y="54" width="24" height="8" rx="1.5" fill="${ruban}" ${trait}/>`
      + `<g transform="translate(30,26) scale(0.85)">${symbole}</g></svg>`
  }
  // La médaille : le ruban en V, le disque cranté, le symbole.
  return `<svg viewBox="0 0 60 72" class="medaille${gagne ? '' : ' pas-encore'}" aria-hidden="true">`
    + `<path d="M16,4 L28,4 L33,30 L24,30 Z" fill="${ruban}" ${trait}/><path d="M44,4 L32,4 L27,30 L36,30 Z" fill="${ruban}" ${trait}/>`
    + `<circle cx="30" cy="46" r="19" fill="${fonce}" ${trait}/>`
    + `<circle cx="30" cy="46" r="15" fill="${clair}" stroke="${fonce}" stroke-width="1.2"/>`
    + `<path d="M19,40 A12,12 0 0 1 27,34" fill="none" stroke="#fff8e0" stroke-width="2" opacity="0.7"/>`
    + `<g transform="translate(30,46)">${symbole}</g></svg>`
}
