// La réparation des trois modules du bloc Moteur (étape 4 ; mécaniques validées par Adrien le 19/10/2026), à la
// manière de « Keep Talking and Nobody Explodes » : le panneau montre des indices, le manuel (section 3) dit quoi faire.
//   - Leviers : la plaque de la soupape montre un symbole ; le manuel donne la position des cinq leviers ; on les
//     bascule, puis ENCLENCHER (2 tours).
//   - Soupape : la pression est dans le rouge ; on tient PURGER, l'aiguille descend ; on relâche dans la zone que le
//     manuel donne selon la température (2 tours).
//   - Injecteurs : six voyants verts, orange ou éteints ; le manuel dit lesquels couper selon le nombre d'orange ;
//     on les coupe, puis AMORCER (2 tours).
// Tout est reproductible (même graine, même tour, même panneau). Une erreur bloque le module 30 secondes.

import {
  COMBINAISONS, LEVIERS, PRESSION_DEPART, SYMBOLES_SOUPAPE, VITESSE_PURGE, ZONES_PURGE, type VoyantInjecteur,
} from '../donnees/manuel-moteur'
import { bloque, erreur, nouvelleReparation, tirage, tourFini, type EtatReparation, type Resultat } from './reparation'

// --- Leviers ---

export interface TourLeviers {
  /** Le symbole de la plaque de la soupape (numéro dans SYMBOLES_SOUPAPE). */
  symbole: number
  /** Position des leviers au début du tour (vrai : en haut), jamais la bonne. */
  depart: boolean[]
}

export function tourLeviers(graine: number, k: number): TourLeviers {
  const t = tirage(graine, k)
  const symbole = t(SYMBOLES_SOUPAPE.length)
  for (;;) {
    const depart = LEVIERS.map(() => t(2) === 1)
    if (depart.some((h, i) => h !== COMBINAISONS[symbole][i])) return { symbole, depart }
  }
}

/** Position actuelle des leviers : ceux basculés (r.coupes) sont inversés par rapport au départ. */
export function positionsLeviers(r: EtatReparation): boolean[] {
  return tourLeviers(r.graine, r.tour).depart.map((h, i) => h !== r.coupes.includes(i))
}

export function nouveauxLeviers(graine: number): EtatReparation {
  return nouvelleReparation(graine, 2)
}

/** Basculer le levier n° i (haut ↔ bas). */
export function basculerLevier(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  r.coupes = r.coupes.includes(i) ? r.coupes.filter((k) => k !== i) : [...r.coupes, i]
  return 'ok'
}

/** ENCLENCHER : tour réussi si les leviers sont dans la position du manuel. */
export function enclencher(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const voulu = COMBINAISONS[tourLeviers(r.graine, r.tour).symbole]
  return positionsLeviers(r).every((h, i) => h === voulu[i]) ? tourFini(r) : erreur(r, t)
}

/** Le symbole de la plaque de la soupape quand les leviers sont en état : propre à chaque capsule. */
export function symboleAuRepos(numeroSerie: string): number {
  return [...numeroSerie].reduce((s, c) => s + c.charCodeAt(0), 0) % SYMBOLES_SOUPAPE.length
}

// --- Soupape ---

export interface TourSoupape { /** Température affichée (°C), jamais tout près d'une limite du manuel. */ temperature: number }

export function tourSoupape(graine: number, k: number): TourSoupape {
  const t = tirage(graine, k)
  for (;;) {
    const temperature = 120 + 10 * t(77)
    if (ZONES_PURGE.every((z) => Math.abs(temperature - z.jusqua) >= 30)) return { temperature }
  }
}

/** La zone du manuel (TABLEAU 3-2) pour une température. */
export function zonePurge(temperature: number): { bas: number; haut: number } {
  return ZONES_PURGE.find((z) => temperature < z.jusqua)!
}

export function nouvelleSoupape(graine: number): EtatReparation {
  return nouvelleReparation(graine, 2)
}

/** Pression de la soupape en défaut à l'instant t (graduations) ; elle baisse pendant la purge (r.reglage : son début). */
export function pressionSoupape(r: EtatReparation, t: number): number {
  if (r.reglage === undefined || bloque(r, t)) return PRESSION_DEPART
  return Math.max(0, PRESSION_DEPART - VITESSE_PURGE * Math.max(0, t - r.reglage) / 1000)
}

/** Tenir PURGER (tenir : vrai) ou le relâcher (faux) : au relâcher, tour réussi si l'aiguille est dans la zone. */
export function purger(r: EtatReparation, tenir: boolean, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  if (tenir) { r.reglage = t; return 'ok' }
  if (r.reglage === undefined) return 'ok'
  const p = pressionSoupape(r, t), z = zonePurge(tourSoupape(r.graine, r.tour).temperature)
  r.reglage = undefined
  return p >= z.bas && p <= z.haut ? tourFini(r) : erreur(r, t)
}

// --- Injecteurs ---

export interface TourInjecteurs { voyants: VoyantInjecteur[] }

export function tourInjecteurs(graine: number, k: number): TourInjecteurs {
  const t = tirage(graine, k)
  const orange = 1 + t(3), eteints = t(3)
  const voyants: VoyantInjecteur[] = Array.from({ length: 6 }, (_, i) => (i < orange ? 'orange' : i < orange + eteints ? 'eteint' : 'vert'))
  for (let i = voyants.length - 1; i > 0; i--) { const j = t(i + 1); [voyants[i], voyants[j]] = [voyants[j], voyants[i]] }
  return { voyants }
}

/** Les injecteurs à couper selon le manuel (TABLEAU 3-3), numéros de 0 à 5. */
export function injecteursACouper(tour: TourInjecteurs): number[] {
  const n = tour.voyants.filter((v) => v === 'orange').length
  const garder = n === 1 ? ['orange'] : n === 2 ? ['orange', 'eteint'] : ['vert']
  return tour.voyants.flatMap((v, i) => (garder.includes(v) ? [i] : []))
}

export function nouveauxInjecteurs(graine: number): EtatReparation {
  return nouvelleReparation(graine, 2)
}

/** Couper l'injecteur n° i (ou le rétablir s'il est déjà coupé). */
export function couperInjecteur(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  r.coupes = r.coupes.includes(i) ? r.coupes.filter((k) => k !== i) : [...r.coupes, i]
  return 'ok'
}

/** AMORCER : tour réussi si exactement les bons injecteurs sont coupés. */
export function amorcer(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const voulus = injecteursACouper(tourInjecteurs(r.graine, r.tour))
  return voulus.length === r.coupes.length && voulus.every((i) => r.coupes.includes(i)) ? tourFini(r) : erreur(r, t)
}
