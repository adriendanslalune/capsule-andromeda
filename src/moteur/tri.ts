// Le tri des matériaux d'une épave (étape 5, mini-jeu des Nettoyeurs ; prototype). Les objets sortent un par un
// (suite reproductible, jamais deux fois le même de suite) ; chaque objet bien trié donne TONNES_PAR_OBJET × la série en
// cours de sa matière (rien pour le rebut) ; une erreur remet la série à 1. Le tri dure DUREE_TRI.

import { BACS, DUREE_TRI, OBJETS_EPAVE, SERIE_MAX, TONNES_PAR_OBJET, type Bac } from '../donnees/tri'
import { hasard } from './contrats'

export interface EtatTri {
  graine: number
  debut: number
  /** Numéro (dans OBJETS_EPAVE) de l'objet à trier. */
  objet: number
  serie: number
  /** Matériaux récupérés : marchandise → tonnes. */
  materiaux: Record<string, number>
  /** Objets bien triés, par bac ; erreurs. */
  tries: Record<Bac, number>
  erreurs: number
  /** Objets ratés de suite, et la pire série (pour un trophée). */
  ratesDeSuite?: number
  pireSerieRatee?: number
}

function suivant(e: EtatTri): number {
  for (;;) {
    const h = hasard(e.graine)
    e.graine = h.graine
    const k = Math.floor(h.x * OBJETS_EPAVE.length)
    if (k !== e.objet) return k
  }
}

export function nouveauTri(graine: number, t: number): EtatTri {
  const e: EtatTri = {
    graine, debut: t, objet: -1, serie: 1, materiaux: {}, erreurs: 0,
    tries: Object.fromEntries(BACS.map((b) => [b.bac, 0])) as Record<Bac, number>,
  }
  e.objet = suivant(e)
  return e
}

/** Temps restant (ms) à l'instant t. */
export function resteTri(e: EtatTri, t: number): number {
  return Math.max(0, e.debut + DUREE_TRI - t)
}

/** Jeter l'objet dans un bac : 'juste', 'faux', ou 'fini' si le temps est écoulé. */
export function trier(e: EtatTri, bac: Bac, t: number): 'juste' | 'faux' | 'fini' {
  if (resteTri(e, t) === 0) return 'fini'
  const o = OBJETS_EPAVE[e.objet]
  const juste = o.bac === bac
  if (juste) {
    if (o.matiere) e.materiaux[o.matiere] = Math.round(((e.materiaux[o.matiere] ?? 0) + TONNES_PAR_OBJET * e.serie) * 100) / 100
    e.tries[bac]++
    e.serie = Math.min(SERIE_MAX, e.serie + 1)
    e.ratesDeSuite = 0
  } else {
    e.serie = 1
    e.erreurs++
    e.ratesDeSuite = (e.ratesDeSuite ?? 0) + 1
    e.pireSerieRatee = Math.max(e.pireSerieRatee ?? 0, e.ratesDeSuite)
  }
  e.objet = suivant(e)
  return juste ? 'juste' : 'faux'
}

/** Tonnes récupérées en tout. */
export function tonnesTriees(e: EtatTri): number {
  return Math.round(Object.values(e.materiaux).reduce((a, b) => a + b, 0) * 100) / 100
}

/** Objets bien triés en tout. */
export function objetsTries(e: EtatTri): number {
  return Object.values(e.tries).reduce((a, b) => a + b, 0)
}
