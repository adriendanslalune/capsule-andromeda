// Le Marché (étape 7, écrans d'abord : décisions d'Adrien du 18/10/2026). Un marché par système : celui de chaque
// planète (et de Pluton) ; ses cours arrivent à la capsule avec le délai de la lumière depuis cette planète.
// Les marchandises ont un prix de base ; la formule du temps (provisoire) est dans src/moteur/marche.ts.

/** Un marché : le système (sa planète), pour la distance et le délai de la lumière. */
export interface FicheMarche { nom: string; lieu: string; /** Pastille du système. */ teinte: string }

export const MARCHES: readonly FicheMarche[] = [
  { nom: 'Mercure', lieu: 'Mercure', teinte: '#c9c2b0' },
  { nom: 'Vénus', lieu: 'Vénus', teinte: '#f5d38a' },
  { nom: 'Terre', lieu: 'Terre', teinte: '#8fc3e0' },
  { nom: 'Mars', lieu: 'Mars', teinte: '#e98a6f' },
  { nom: 'Jupiter', lieu: 'Jupiter', teinte: '#e8c9a0' },
  { nom: 'Saturne', lieu: 'Saturne', teinte: '#f6e3b8' },
  { nom: 'Uranus', lieu: 'Uranus', teinte: '#bfe0e8' },
  { nom: 'Neptune', lieu: 'Neptune', teinte: '#8fa8e0' },
  { nom: 'Pluton', lieu: 'Pluton', teinte: '#d7cdee' },
]

/** Une marchandise et son prix de base (crédits la tonne). */
export interface FicheMarchandise { nom: string; prix: number }

export const MARCHANDISES: readonly FicheMarchandise[] = [
  { nom: 'Ferraille', prix: 12 },
  { nom: 'Cuivre', prix: 50 },
  { nom: 'Titane', prix: 90 },
  { nom: 'Circuits anciens', prix: 110 },
  { nom: 'Verre', prix: 20 },
  { nom: 'Eau', prix: 8 },
  { nom: 'Hélium 3', prix: 300 },
]

/**
 * Les spécialités des marchés (proposition validée par Adrien le 20/10/2026) : une marchandise est moins chère là où
 * elle se produit, plus chère là où elle manque (de −30 % à +30 % autour du prix de base). C'est ce qui fait des routes
 * commerciales rentables : acheter l'Hélium 3 vers Jupiter, le revendre vers la Terre…
 */
export const SPECIALITES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  Mercure: { Cuivre: 0.7, Verre: 0.75, Eau: 1.3 },
  Vénus: { Cuivre: 0.8, Verre: 0.75, Eau: 1.3 },
  Terre: { Ferraille: 0.7, 'Circuits anciens': 0.7, Titane: 1.15, 'Hélium 3': 1.3 },
  Mars: { Titane: 0.7, Verre: 1.2, Eau: 1.2, 'Hélium 3': 1.2 },
  Jupiter: { 'Hélium 3': 0.7, Titane: 1.25, Verre: 1.2 },
  Saturne: { Eau: 0.7, 'Hélium 3': 0.75, Cuivre: 1.25, 'Circuits anciens': 1.2 },
  Uranus: { Eau: 0.75, Cuivre: 1.3 },
  Neptune: { Ferraille: 1.3, 'Circuits anciens': 1.3 },
  Pluton: { Eau: 0.7, Ferraille: 1.3, 'Circuits anciens': 1.3 },
}

/** Ce qu'on achète ou vend d'un coup (tonnes) ; « tout » vient en plus. */
export const LOTS: readonly number[] = [1, 5]

/** Capacité de la soute (tonnes ; la maquette validée le 18/10/2026 montre 20). */
export const CAPACITE_SOUTE = 20
/** Écart entre le prix d'achat et le prix de vente, autour du cours (le marché garde sa marge). */
export const MARGE = 0.12
