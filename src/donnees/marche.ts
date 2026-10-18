// Le Marché (étape 7, écrans posés d'abord : décision d'Adrien du 18/10/2026). Les marchés du système solaire, les
// marchandises, et la soute de la capsule. Les cours sont pour l'instant des cours d'essai (fixes) : la formule du
// temps viendra avec la mécanique du commerce.

/** Un marché : son nom, et l'astre ou l'engin où il se trouve (pour la distance et le délai de la lumière). */
export interface FicheMarche { nom: string; lieu: string; region: string }

export const MARCHES: readonly FicheMarche[] = [
  { nom: 'Tiangong', lieu: 'Tiangong', region: 'Terre' },
  { nom: 'ISS', lieu: 'ISS', region: 'Terre' },
  { nom: 'Base Artémis', lieu: 'Lune', region: 'Lune' },
  { nom: 'Base Phobos', lieu: 'Phobos', region: 'Mars' },
  { nom: 'Callisto', lieu: 'Callisto', region: 'Jupiter' },
  { nom: 'Titan', lieu: 'Titan', region: 'Saturne' },
]

/** Une marchandise et son cours d'essai (crédits la tonne). */
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
/** Écart entre le prix d'achat et le prix de vente (le marché garde sa marge). */
export const MARGE = 0.12
