// La réparation des trois modules du bloc Coque (étape 4 ; mécaniques validées par Adrien le 19/10/2026), à la
// manière de « Keep Talking and Nobody Explodes » : le panneau montre des indices, le manuel (section 5) dit quoi faire.
//   - Vannes : le manomètre BAR du module 5B montre une pression ; le manuel donne de combien de crans tourner chaque
//     vanne, et dans quel sens ; on les tourne, puis ÉTANCHER (2 tours).
//   - Brèche : la plaque a une fissure d'une des six formes du manuel, qui donne l'ordre de frappe des quatre rivets ;
//     on les frappe dans l'ordre, puis SOUDER (2 tours).
//   - Sas : une procédure en trois étapes ; à chaque étape, l'écran affiche un message ; le manuel donne
//     l'interrupteur à basculer (1 tour, trois étapes).
// Tout est reproductible (même graine, même tour, même panneau). Une erreur bloque le module 30 secondes.

import { CRANS_PAR_PRESSION, CRANS_VANNE, FISSURES, MESSAGES_SAS, VANNES } from '../donnees/manuel-coque'
import { bloque, erreur, nouvelleReparation, tirage, tourFini, type EtatReparation, type Resultat } from './reparation'

// --- Vannes ---

export interface TourVannes {
  /** La pression du manomètre BAR (de 1 à 9). */
  pression: number
  /** Cran de chaque vanne au début du tour (0 à 7). */
  depart: number[]
}

export function tourVannes(graine: number, k: number): TourVannes {
  const t = tirage(graine, k)
  return { pression: 1 + t(9), depart: VANNES.map(() => t(CRANS_VANNE)) }
}

/** De combien de crans chaque vanne a été tournée depuis le début du tour (r.reglage : trois nombres de −7 à 7). */
export function tournees(r: EtatReparation): number[] {
  const v = r.reglage ?? 0
  return VANNES.map((_, i) => (Math.floor(v / 16 ** i) % 16) - 8)
}

/** Le cran actuel de chaque vanne (0 à 7). */
export function cransVannes(r: EtatReparation): number[] {
  const d = tournees(r)
  return tourVannes(r.graine, r.tour).depart.map((c, i) => (((c + d[i]) % CRANS_VANNE) + CRANS_VANNE) % CRANS_VANNE)
}

const encoder = (d: number[]) => d.reduce((s, x, i) => s + (x + 8) * 16 ** i, 0)

export function nouvellesVannes(graine: number): EtatReparation {
  return { ...nouvelleReparation(graine, 2), reglage: encoder([0, 0, 0]) }
}

/** Tourner la vanne i d'un cran (1 : ↻, −1 : ↺), sans dépasser sept crans dans un sens. */
export function tournerVanne(r: EtatReparation, i: number, pas: 1 | -1, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const d = tournees(r)
  d[i] = Math.max(-7, Math.min(7, d[i] + pas))
  r.reglage = encoder(d)
  return 'ok'
}

/** ÉTANCHER : tour réussi si chaque vanne a été tournée du nombre de crans du manuel, dans le bon sens. */
export function etancher(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const voulu = CRANS_PAR_PRESSION[tourVannes(r.graine, r.tour).pression - 1]
  const res = tournees(r).every((d, i) => d === voulu[i]) ? tourFini(r) : erreur(r, t)
  r.reglage = encoder([0, 0, 0])
  return res
}

// --- Brèche ---

export interface TourBreche { /** La forme de la fissure (numéro dans FISSURES). */ fissure: number }

export function tourBreche(graine: number, k: number): TourBreche {
  return { fissure: tirage(graine, k)(FISSURES.length) }
}

export function nouvelleBreche(graine: number): EtatReparation {
  return nouvelleReparation(graine, 2)
}

/** Frapper le rivet i : il doit être le suivant dans l'ordre du manuel. */
export function frapper(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  if (r.coupes.includes(i)) return 'ok'
  if (FISSURES[tourBreche(r.graine, r.tour).fissure].ordre[r.coupes.length] !== i) return erreur(r, t)
  r.coupes.push(i)
  return 'ok'
}

/** SOUDER : tour réussi si les quatre rivets sont frappés. */
export function souder(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  return r.coupes.length === 4 ? tourFini(r) : erreur(r, t)
}

// --- Sas ---

export interface TourSas { /** Les messages des trois étapes (numéros dans MESSAGES_SAS), jamais deux fois le même. */ messages: number[] }

export function tourSas(graine: number, k: number): TourSas {
  const t = tirage(graine, k), messages: number[] = []
  while (messages.length < 3) { const m = t(MESSAGES_SAS.length); if (!messages.includes(m)) messages.push(m) }
  return { messages }
}

export function nouveauSas(graine: number): EtatReparation {
  return nouvelleReparation(graine, 1)
}

/** Position des huit interrupteurs (vrai : basculé) : chaque bascule réussie inverse le sien. */
export function interrupteursSas(r: EtatReparation): boolean[] {
  return Array.from({ length: 8 }, (_, i) => r.coupes.filter((c) => c === i).length % 2 === 1)
}

/** Basculer l'interrupteur i (0 à 7) : celui que le manuel donne pour le message de l'étape en cours. */
export function basculerSas(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const m = MESSAGES_SAS[tourSas(r.graine, r.tour).messages[r.coupes.length]]
  if (m.interrupteur - 1 !== i) return erreur(r, t)
  r.coupes.push(i)
  return r.coupes.length === 3 ? tourFini(r) : 'ok'
}
