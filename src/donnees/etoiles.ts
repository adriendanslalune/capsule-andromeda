// Les 12 étoiles du sextant (module SX-1), dans l'ordre du tableau du manuel.
// Coordonnées écliptiques arrondies au degré : azimut = longitude, hauteur = latitude.
// Valeurs identiques à celles du prototype v0.1 (tableau `ETOILES`).

export interface Etoile {
  nom: string
  /** Longitude écliptique (degrés). */
  azimut: number
  /** Latitude écliptique (degrés). */
  hauteur: number
}

export const ETOILES: readonly Etoile[] = [
  { nom: 'SIRIUS', azimut: 104, hauteur: -40 },
  { nom: 'VÉGA', azimut: 285, hauteur: 62 },
  { nom: 'BÉTELGEUSE', azimut: 89, hauteur: -16 },
  { nom: 'ARCTURUS', azimut: 204, hauteur: 31 },
  { nom: 'ANTARÈS', azimut: 250, hauteur: -5 },
  { nom: 'RÉGULUS', azimut: 150, hauteur: 0 },
  { nom: 'SPICA', azimut: 204, hauteur: -2 },
  { nom: 'ALDÉBARAN', azimut: 70, hauteur: -5 },
  { nom: 'ALTAÏR', azimut: 302, hauteur: 29 },
  { nom: 'POLLUX', azimut: 113, hauteur: 7 },
  { nom: 'DENEB', azimut: 335, hauteur: 60 },
  { nom: 'FOMALHAUT', azimut: 334, hauteur: -21 },
]
