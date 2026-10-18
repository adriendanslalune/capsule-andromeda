// La réparation des trois modules du bloc Communications (étape 4), à la manière de « Keep Talking and Nobody
// Explodes » : le panneau montre des indices, le manuel (section 1) dit quoi faire.
//   - Télégraphe : une lampe clignote un mot en morse ; le manuel donne la fréquence de ce mot ; on tourne le cadran
//     jusqu'à cette fréquence et on appuie sur ÉMETTRE.
//   - Antenne : une plaque montre le symbole d'une station et un écran la bande ; le manuel donne l'angle ; on tourne
//     l'antenne jusqu'à cet angle et on VERROUILLE (deux tours).
//   - Chiffreur : quatre touches à symboles étranges ; elles sont toutes dans une seule colonne du manuel ; on les
//     enfonce dans l'ordre de cette colonne, de haut en bas.
// Tout est reproductible (même graine, même tour, même panneau). Une erreur bloque le module 30 secondes.

import {
  ANGLES_ANTENNE, BANDES, COLONNES_CHIFFREUR, FREQUENCES, MORSE, MOTS_TELEGRAPHE, PAS_ANTENNE, STATIONS, type Bande,
} from '../donnees/manuel-communications'
import { bloque, erreur, nouvelleReparation, tirage, tirer, tourFini, type EtatReparation, type Resultat } from './reparation'

// --- Télégraphe ---

export interface TourTelegraphe { mot: string; /** Fréquence attendue (MHz × 1000). */ frequence: number }

export function tourTelegraphe(graine: number, k: number): TourTelegraphe {
  return MOTS_TELEGRAPHE[tirage(graine, k)(MOTS_TELEGRAPHE.length)]
}

/** Commence la réparation du télégraphe : un tour, le cadran sur une fréquence au hasard (jamais la bonne). */
export function nouveauTelegraphe(graine: number): EtatReparation {
  const r = nouvelleReparation(graine, 1)
  const [n] = tirer(graine ^ 0x5bd1e995, FREQUENCES.length - 1)
  const attendu = FREQUENCES.indexOf(tourTelegraphe(graine, 0).frequence)
  r.reglage = (attendu + 1 + n) % FREQUENCES.length
  return r
}

/** Tourne le cadran des fréquences de quelques crans (sans dépasser les bords). */
export function reglerFrequence(r: EtatReparation, pas: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  r.reglage = Math.max(0, Math.min(FREQUENCES.length - 1, (r.reglage ?? 0) + pas))
  return 'ok'
}

/** Fréquence affichée par le cadran (MHz × 1000). */
export function frequenceReglee(r: EtatReparation): number {
  return FREQUENCES[r.reglage ?? 0]
}

/** ÉMETTRE : réparé si le cadran est sur la fréquence du mot. */
export function emettre(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  return frequenceReglee(r) === tourTelegraphe(r.graine, r.tour).frequence ? tourFini(r) : erreur(r, t)
}

/** Durée d'un point de morse (ms). Un trait vaut trois points ; entre deux lettres, trois ; à la fin du mot, sept. */
export const POINT_MORSE = 280

/** Ce que fait la lampe du télégraphe pour un mot, en boucle : une suite de [allumée ?, durée (ms)]. */
export function sequenceMorse(mot: string): [boolean, number][] {
  const s: [boolean, number][] = []
  ;[...mot].forEach((lettre, i) => {
    if (i > 0) s.push([false, 3 * POINT_MORSE])
    ;[...MORSE[lettre]].forEach((signe, j) => {
      if (j > 0) s.push([false, POINT_MORSE])
      s.push([true, (signe === '-' ? 3 : 1) * POINT_MORSE])
    })
  })
  s.push([false, 7 * POINT_MORSE])
  return s
}

// --- Antenne ---

export interface TourAntenne { /** Numéro de la station (dans STATIONS). */ station: number; bande: Bande }

export function tourAntenne(graine: number, k: number): TourAntenne {
  const t = tirage(graine, k)
  return { station: t(STATIONS.length), bande: BANDES[t(BANDES.length)] }
}

/** Angle attendu par le manuel (TABLEAU 1-3). */
export function angleAttendu(tour: TourAntenne): number {
  return ANGLES_ANTENNE[tour.station][BANDES.indexOf(tour.bande)]
}

/** Commence la réparation de l'antenne : deux tours, l'antenne tournée au hasard (jamais sur le bon angle). */
export function nouvelleAntenne(graine: number): EtatReparation {
  const r = nouvelleReparation(graine, 2)
  const crans = 360 / PAS_ANTENNE
  const [n] = tirer(graine ^ 0x27d4eb2f, crans - 1)
  r.reglage = (angleAttendu(tourAntenne(graine, 0)) + (1 + n) * PAS_ANTENNE) % 360
  return r
}

/** Tourne l'antenne (degrés, multiple du pas ; positif : sens des aiguilles d'une montre). */
export function tournerAntenne(r: EtatReparation, degres: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  r.reglage = ((((r.reglage ?? 0) + degres) % 360) + 360) % 360
  return 'ok'
}

/** VERROUILLER : tour réussi si l'antenne est sur l'angle du manuel. */
export function verrouiller(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  return r.reglage === angleAttendu(tourAntenne(r.graine, r.tour)) ? tourFini(r) : erreur(r, t)
}

// --- Chiffreur ---

export interface TourChiffreur {
  /** La colonne du manuel où sont les quatre symboles. */
  colonne: number
  /** Les symboles des quatre touches, de gauche à droite. */
  touches: [string, string, string, string]
}

export function tourChiffreur(graine: number, k: number): TourChiffreur {
  const t = tirage(graine, k)
  for (;;) {
    const colonne = t(COLONNES_CHIFFREUR.length)
    const reste = [...COLONNES_CHIFFREUR[colonne]]
    const touches: string[] = []
    while (touches.length < 4) touches.push(reste.splice(t(reste.length), 1)[0])
    // Une seule colonne doit contenir les quatre symboles (sinon le manuel serait ambigu) : on tire de nouveau.
    const colonnes = COLONNES_CHIFFREUR.filter((c) => touches.every((s) => c.includes(s)))
    if (colonnes.length === 1) return { colonne, touches: touches as TourChiffreur['touches'] }
  }
}

/** L'ordre dans lequel enfoncer les touches (leurs numéros, de gauche à droite : 0 à 3). */
export function ordreChiffreur(tour: TourChiffreur): number[] {
  const c = COLONNES_CHIFFREUR[tour.colonne]
  return [0, 1, 2, 3].sort((a, b) => c.indexOf(tour.touches[a]) - c.indexOf(tour.touches[b]))
}

export function nouveauChiffreur(graine: number): EtatReparation {
  return nouvelleReparation(graine, 1)
}

/** Enfoncer la touche n° i : elle doit être la suivante dans l'ordre de la colonne. */
export function appuyer(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  if (r.coupes.includes(i)) return 'ok'
  const ordre = ordreChiffreur(tourChiffreur(r.graine, r.tour))
  if (ordre[r.coupes.length] !== i) return erreur(r, t)
  r.coupes.push(i)
  return r.coupes.length === 4 ? tourFini(r) : 'ok'
}
