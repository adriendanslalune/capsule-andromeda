// Couleurs des astres sur la carte : la couleur dominante de chaque astre, tirée de la palette du jeu.

import type { Corps } from '../moteur/corps'

/** Palette du jeu. */
export const PALETTE = {
  cerise: '#e04b37', moutarde: '#f2b53a', ciel: '#8fd0dc', menthe: '#8fcf98', rose: '#f3a08b',
  tole: '#3a2f28', papier: '#faf2dc', bleu: '#23476b', panneau: '#2f5f9e', or: '#d9a43a',
}

/** Couleur dominante des astres connus. */
const ASTRES: Record<string, string> = {
  Soleil: '#f2b53a', Mercure: '#a99d90', Vénus: '#e8c77a', Terre: '#3f7fc1', Mars: '#d0563a', Jupiter: '#d49a62',
  Saturne: '#e2c27d', Uranus: '#8fd0dc', Neptune: '#3f63c4', Pluton: '#d1ab8c', Lune: '#b9b2a6',
}

/** Aspect des satellites connus : couleur de fond, couleur des taches, densité de cratères. */
const ASPECTS_LUNES: Record<string, { fond: string; taches: string; crateres: number }> = {
  Io: { fond: '#e2cc55', taches: '#c0612a', crateres: 0 },
  Europe: { fond: '#e6dcc8', taches: '#a8683f', crateres: 0.1 },
  Ganymède: { fond: '#988c7d', taches: '#d2c9b8', crateres: 0.5 },
  Callisto: { fond: '#6a5d50', taches: '#b0a492', crateres: 1.6 },
  Titan: { fond: '#d9953c', taches: '#eab25a', crateres: 0 },
  Encelade: { fond: '#f4f4f0', taches: '#a9cfe0', crateres: 0.3 },
  Japet: { fond: '#ddd6c9', taches: '#4a3b30', crateres: 0.8 },
  Triton: { fond: '#e2c6b8', taches: '#b08f84', crateres: 0.2 },
  Mimas: { fond: '#c2bdb4', taches: '#857f78', crateres: 1.4 },
  Rhéa: { fond: '#cfcac1', taches: '#938e87', crateres: 1.2 },
  Dione: { fond: '#d5d1ca', taches: '#9d9891', crateres: 1 },
  Téthys: { fond: '#dcdad4', taches: '#a19e98', crateres: 1 },
  Phobos: { fond: '#7a6a5a', taches: '#4a3e34', crateres: 1.4 },
  Deimos: { fond: '#9a8670', taches: '#655748', crateres: 0.8 },
  Titania: { fond: '#b0a59a', taches: '#776e66', crateres: 1 },
  Obéron: { fond: '#9a8d80', taches: '#62584f', crateres: 1.2 },
  Miranda: { fond: '#b5b1aa', taches: '#76736d', crateres: 0.6 },
  Ariel: { fond: '#c0bab0', taches: '#827d74', crateres: 0.8 },
  Umbriel: { fond: '#6c655e', taches: '#433e3a', crateres: 1.2 },
}

function hachage(nom: string): number {
  return [...nom].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) & 0xffff, 7) / 0xffff
}

/** Couleur « #rrggbb » d'une teinte, saturation et luminosité (de 0 à 1). */
function hsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** L'aspect d'une lune (pour son planisphère) : connu, ou tiré de son nom (une couleur, des taches plus sombres). */
export function aspectLune(nom: string): { fond: string; taches: string; crateres: number } {
  const connu = ASPECTS_LUNES[nom]
  if (connu) return connu
  const g = hachage(nom), fond = couleurLune(nom)
  return { fond, taches: hsl(0.05 + 0.07 * g, 0.18 + 0.25 * ((g * 3) % 1), 0.3 + 0.2 * ((g * 7) % 1)), crateres: 0.6 + ((g * 13) % 1) }
}

/** Couleur d'une lune : connue, ou tirée de son nom (ocres, beiges, gris chauds, quelques roux). */
function couleurLune(nom: string): string {
  const connu = ASPECTS_LUNES[nom]
  if (connu) return connu.fond
  const g = hachage(nom)
  return hsl(0.05 + 0.07 * g, 0.18 + 0.25 * ((g * 3) % 1), 0.42 + 0.25 * ((g * 7) % 1))
}

/** Couleur propre d'un astre ou d'un engin (« #rrggbb »). */
export function couleurAstre(c: Corps): string {
  if (ASTRES[c.nom]) return ASTRES[c.nom]
  // Engins en bleu d'imprimerie : le rouge cerise est réservé à la capsule.
  if (c.type === 'satellite' || c.type === 'sonde') return PALETTE.bleu
  return couleurLune(c.nom)
}
