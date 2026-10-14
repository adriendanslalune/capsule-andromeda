// Points de commissionnaire, pour les classements (proposition du 14/10/2026, à ajuster avec Adrien) : tout ce qui
// fait un bon commissionnaire rapporte des points. Les points ne s'échangent pas : ils ne servent qu'au classement.

export const BAREME = {
  /** Par contrat rempli. */
  contrat: 10,
  /** Par avarie réparée. */
  avarie: 2,
  /** Par astre ou engin visité pour la première fois. */
  visite: 5,
  /** Par trophée obtenu. */
  trophee: 3,
  /** Par million de kilomètres parcourus. */
  millionKm: 1,
  /** Par visiteur photographié. */
  visiteur: 50,
} as const

/** Libellés du barème, dans l'ordre d'affichage. */
export const LIGNES_BAREME: readonly { cle: keyof typeof BAREME; nom: string }[] = [
  { cle: 'contrat', nom: 'Contrat rempli' },
  { cle: 'avarie', nom: 'Avarie réparée' },
  { cle: 'visite', nom: 'Nouvel astre ou engin visité' },
  { cle: 'trophee', nom: 'Trophée obtenu' },
  { cle: 'millionKm', nom: 'Million de km parcourus' },
  { cle: 'visiteur', nom: 'Visiteur photographié' },
]

/** Relevés quotidiens gardés (jours) : assez pour le classement du mois. */
export const JOURS_DE_RELEVES = 40
