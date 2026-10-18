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
  { nom: 'Eau', prix: 8 },
  { nom: 'Hélium 3', prix: 300 },
]

/** Capacité de la soute (tonnes ; la maquette validée le 18/10/2026 montre 20). */
export const CAPACITE_SOUTE = 20
/** Écart entre le prix d'achat et le prix de vente, autour du cours (le marché garde sa marge). */
export const MARGE = 0.12
