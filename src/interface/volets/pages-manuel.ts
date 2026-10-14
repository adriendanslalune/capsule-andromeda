// Pages du manuel (les PDF de manuel/pdf), dans l'ordre de lecture, et page de chaque chapitre.
// La page « carnet du grand-père » est écartée : le grand-père a été retiré du jeu (le PDF sera régénéré).

import manuelBase from '../../../manuel/pdf/01-manuel-de-base.pdf?url'
import modulesALCOPB from '../../../manuel/pdf/02-modules-AL-CO-PB.pdf?url'
import modulesLPHYREMO from '../../../manuel/pdf/03-modules-LP-HY-RE-MO-cascades.pdf?url'
import modulesCRSXAN from '../../../manuel/pdf/04-modules-CR-SX-AN.pdf?url'
import visiteurs from '../../../manuel/pdf/05-recherche-des-visiteurs.pdf?url'

export interface PageManuel {
  /** Fichier PDF et numéro de la page dans ce fichier (à partir de 1). */
  fichier: string
  page: number
  /** Chapitre qui commence sur cette page, s'il y en a un. */
  chapitre?: string
}

export const PAGES_MANUEL: PageManuel[] = [
  { fichier: manuelBase, page: 1 },
  { fichier: manuelBase, page: 2, chapitre: 'I' },
  { fichier: manuelBase, page: 3, chapitre: 'II' },
  { fichier: manuelBase, page: 4, chapitre: 'III' },
  { fichier: manuelBase, page: 5, chapitre: 'IV' },
  { fichier: manuelBase, page: 7 },
  { fichier: modulesALCOPB, page: 1, chapitre: 'VI' },
  { fichier: modulesALCOPB, page: 2, chapitre: 'VII' },
  { fichier: modulesALCOPB, page: 3, chapitre: 'VIII' },
  { fichier: modulesALCOPB, page: 4, chapitre: 'IX' },
  { fichier: modulesLPHYREMO, page: 1, chapitre: 'X' },
  { fichier: modulesLPHYREMO, page: 2, chapitre: 'XI' },
  { fichier: modulesLPHYREMO, page: 3, chapitre: 'XII' },
  { fichier: modulesLPHYREMO, page: 4, chapitre: 'XIII' },
  { fichier: modulesLPHYREMO, page: 5, chapitre: 'XIV' },
  { fichier: modulesCRSXAN, page: 1, chapitre: 'XV' },
  { fichier: modulesCRSXAN, page: 2, chapitre: 'XVI' },
  { fichier: modulesCRSXAN, page: 3, chapitre: 'XVII' },
  { fichier: visiteurs, page: 1, chapitre: 'XVIII' },
  { fichier: visiteurs, page: 2 },
]

/** Numéro (à partir de 0) de la page où commence un chapitre. */
export function pageDuChapitre(chapitre: string): number {
  return Math.max(0, PAGES_MANUEL.findIndex((p) => p.chapitre === chapitre))
}
