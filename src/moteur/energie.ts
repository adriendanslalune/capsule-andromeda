// La réparation des modules 2B et 2C du bloc Énergie (le bornier, 2A, est dans reparation.ts), à la manière de « Keep
// Talking and Nobody Explodes » : le panneau montre des indices, le manuel (section 2) dit quoi faire.
//   - Fusibles : un fusible est grillé ; l'écran affiche la CHARGE et le voyant TÉMOIN a une couleur ; le manuel donne
//     le calibre à remettre ; on le choisit parmi les quatre fusibles de rechange du tiroir (1 ou 2 tours).
//   - Accumulateurs : trois accumulateurs déséquilibrés ; le manuel donne l'ordre de couplage selon le plus chargé et
//     la couleur de celui du milieu ; on les branche dans cet ordre, puis COUPLER (2 tours).
// Tout est reproductible (même graine, même tour, même panneau). Une erreur bloque le module 30 secondes.

import {
  CALIBRES, COULEURS_ACCUS, ORDRES_COUPLAGE, TEMOINS, type CouleurAccu, type Temoin,
} from '../donnees/manuel-energie'
import { bloque, erreur, nouvelleReparation, tirage, tirer, tourFini, type EtatReparation, type Resultat } from './reparation'

// --- Fusibles ---

export interface TourFusibles {
  /** Le fusible grillé (sa place dans le porte-fusibles, 0 à 7). */
  grille: number
  /** La CHARGE affichée (ampères ; jamais un multiple de 5). */
  charge: number
  temoin: Temoin
  /** Les calibres des quatre fusibles de rechange du tiroir, du plus petit au plus grand. */
  rechanges: number[]
}

/** Le calibre que demande le manuel (TABLEAU 2-3). */
export function calibreAttendu(tour: Omit<TourFusibles, 'rechanges'>): number {
  const auDessus = CALIBRES.findIndex((c) => c >= tour.charge)
  if (tour.temoin === 'rouge') return CALIBRES[tour.grille]
  return CALIBRES[tour.temoin === 'vert' ? auDessus : auDessus + 1]
}

export function tourFusibles(graine: number, k: number): TourFusibles {
  const t = tirage(graine, k)
  const grille = t(CALIBRES.length), temoin = TEMOINS[t(TEMOINS.length)]
  let charge = 8 + t(32)
  if (charge % 5 === 0) charge++
  const base = { grille, charge, temoin }
  const attendu = calibreAttendu(base)
  // Le tiroir : le bon calibre, et des pièges (le calibre grillé, ceux des autres témoins), complétés au hasard.
  const pieges = TEMOINS.map((temoin) => calibreAttendu({ ...base, temoin }))
  const rechanges = new Set([attendu, ...pieges.filter((c) => c !== attendu)])
  while (rechanges.size < 4) rechanges.add(CALIBRES[t(CALIBRES.length)])
  return { ...base, rechanges: [...rechanges].slice(0, 4).sort((a, b) => a - b) }
}

/** Commence la réparation des fusibles : un ou deux fusibles grillés (un par tour). */
export function nouveauxFusibles(graine: number): EtatReparation {
  const [n] = tirer(graine ^ 0x1b873593, 2)
  return nouvelleReparation(graine, 1 + n)
}

/** Remplacer le fusible grillé par le fusible de rechange n° i du tiroir. */
export function remplacer(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const tour = tourFusibles(r.graine, r.tour)
  return tour.rechanges[i] === calibreAttendu(tour) ? tourFini(r) : erreur(r, t)
}

// --- Accumulateurs ---

export interface TourAccumulateurs {
  /** Charge des trois accumulateurs (%, toutes différentes, d'au moins 15 points). */
  niveaux: [number, number, number]
  couleurs: [CouleurAccu, CouleurAccu, CouleurAccu]
}

export function tourAccumulateurs(graine: number, k: number): TourAccumulateurs {
  const t = tirage(graine, k)
  for (;;) {
    const niveaux = [0, 1, 2].map(() => 10 + 5 * t(18)) as TourAccumulateurs['niveaux']
    const tries = [...niveaux].sort((a, b) => a - b)
    if (tries[1] - tries[0] < 15 || tries[2] - tries[1] < 15) continue
    const couleurs = [0, 1, 2].map(() => COULEURS_ACCUS[t(COULEURS_ACCUS.length)]) as TourAccumulateurs['couleurs']
    return { niveaux, couleurs }
  }
}

/** L'ordre de couplage du manuel (TABLEAU 2-4) : numéros des accumulateurs (0 : +, 1 : ±, 2 : −). */
export function ordreCouplage(tour: TourAccumulateurs): readonly number[] {
  const plein = tour.niveaux.indexOf(Math.max(...tour.niveaux))
  return ORDRES_COUPLAGE[plein][COULEURS_ACCUS.indexOf(tour.couleurs[1])]
}

export function nouveauxAccumulateurs(graine: number): EtatReparation {
  return nouvelleReparation(graine, 2)
}

/** Brancher l'accumulateur n° i : il doit être le suivant dans l'ordre de couplage. */
export function brancherAccu(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  if (r.coupes.includes(i)) return 'ok'
  if (ordreCouplage(tourAccumulateurs(r.graine, r.tour))[r.coupes.length] !== i) return erreur(r, t)
  r.coupes.push(i)
  return 'ok'
}

/** COUPLER : tour réussi si les trois accumulateurs sont branchés (dans l'ordre). */
export function coupler(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  return r.coupes.length === 3 ? tourFini(r) : erreur(r, t)
}
