// Le gris d'une zone pas encore visitée (décisions d'Adrien du 21/10/2026, assombri le 24/10/2026 : trop clair, on
// croyait à un bug graphique, et la Lune, déjà grise, ne changeait pas) : la clarté de la couleur, nettement assombrie.

/** Le niveau de gris (0 à 255) d'une couleur r, v, b. */
export const niveauDeGris = (r: number, v: number, b: number): number => Math.round(24 + 0.4 * (0.3 * r + 0.59 * v + 0.11 * b))
