// Le tri des matériaux d'une épave (étape 5, mini-jeu des Nettoyeurs ; prototype). Les objets sortent un par un
// (suite reproductible, jamais deux fois le même de suite) ; chaque objet bien trié rapporte GAIN_PAR_OBJET × la série
// en cours ; une erreur remet la série à 1. Le tri dure DUREE_TRI.

import { BACS, DUREE_TRI, GAIN_PAR_OBJET, OBJETS_EPAVE, SERIE_MAX, type Bac } from '../donnees/tri'
import { hasard } from './contrats'

export interface EtatTri {
  graine: number
  debut: number
  /** Numéro (dans OBJETS_EPAVE) de l'objet à trier. */
  objet: number
  serie: number
  gain: number
  /** Objets bien triés, par bac ; erreurs. */
  tries: Record<Bac, number>
  erreurs: number
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
    graine, debut: t, objet: -1, serie: 1, gain: 0, erreurs: 0,
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
  const juste = OBJETS_EPAVE[e.objet].bac === bac
  if (juste) {
    e.gain += GAIN_PAR_OBJET * e.serie
    e.tries[bac]++
    e.serie = Math.min(SERIE_MAX, e.serie + 1)
  } else {
    e.serie = 1
    e.erreurs++
  }
  e.objet = suivant(e)
  return juste ? 'juste' : 'faux'
}
