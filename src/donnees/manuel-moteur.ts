// Données du manuel de maintenance, section 3 (bloc Moteur ; mécaniques validées par Adrien le 19/10/2026) : les
// leviers (combinaisons selon le symbole de la soupape), la soupape (zone de purge selon la température), les
// injecteurs (lesquels couper selon les voyants orange). Le panneau et le manuel lisent les mêmes données : ce qui est
// écrit dans le manuel est exactement ce que le jeu attend, le même pour tous les joueurs.

/** Les cinq leviers, de gauche à droite : leur numéro et la couleur de leur pommeau. */
export const LEVIERS: readonly { numero: string; teinte: string }[] = [
  { numero: 'I', teinte: '#e04b37' }, { numero: 'II', teinte: '#8fb4e6' }, { numero: 'III', teinte: '#f2b53a' },
  { numero: 'IV', teinte: '#8fcf98' }, { numero: 'V', teinte: '#faf2dc' },
]

/** Les symboles de la plaque du module 3B SOUPAPE (le régime du moteur). */
export const SYMBOLES_SOUPAPE: readonly string[] = ['♃', '♄', '☿', '♀', '♂', '♅']

/** TABLEAU 3-1 : pour chaque symbole de la soupape, la position des cinq leviers (vrai : en haut). */
export const COMBINAISONS: readonly (readonly boolean[])[] = [
  [true, false, true, true, false],
  [false, true, true, false, true],
  [true, true, false, false, false],
  [false, false, true, false, true],
  [true, false, false, true, true],
  [false, true, false, true, false],
]

/** Pression de la soupape en défaut (graduations du cadran, de 0 à 10 ; zone rouge de 8 à 10). */
export const PRESSION_DEPART = 9.5
export const ZONE_ROUGE = 8
/** Baisse de la pression pendant qu'on tient PURGER (graduations par seconde). */
export const VITESSE_PURGE = 1.2

/** TABLEAU 3-2 : où relâcher PURGER, selon la température affichée (°C). */
export const ZONES_PURGE: readonly { jusqua: number; titre: string; bas: number; haut: number }[] = [
  { jusqua: 300, titre: 'moins de 300 °C', bas: 6, haut: 7 },
  { jusqua: 600, titre: 'de 300 à 600 °C', bas: 4, haut: 5 },
  { jusqua: Infinity, titre: 'plus de 600 °C', bas: 2, haut: 3 },
]

/** Les voyants des injecteurs. */
export type VoyantInjecteur = 'vert' | 'orange' | 'eteint'
export const TEINTES_INJECTEURS: Readonly<Record<VoyantInjecteur, string>> = { vert: '#5fb36a', orange: '#f08a2c', eteint: '#5a4e3a' }

/** TABLEAU 3-3 : les injecteurs à couper, selon le nombre de voyants orange. */
export const TEXTES_INJECTEURS: readonly { orange: string; couper: string }[] = [
  { orange: '1', couper: 'L\'injecteur au voyant orange, et lui seul.' },
  { orange: '2', couper: 'Les deux injecteurs aux voyants orange, et tous ceux au voyant éteint.' },
  { orange: '3 ou plus', couper: 'Tous les injecteurs au voyant VERT (et aucun autre).' },
]
