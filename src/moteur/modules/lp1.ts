// LP-1 Lampes à vide : six lampes L-1 à L-6. En service, leur filament brille orange ; une lampe défectueuse est
// éteinte, bleue ou verte. Procédure : ventilateur VT en marche, remplacer les lampes défectueuses (les toucher) dans
// l'ordre, arrêter VT. Ordre : d'abord les éteintes, puis les bleues, puis les vertes ; à couleur égale, numéro
// croissant (dernier chiffre du n° de série pair) ou décroissant (impair). Toucher une lampe ventilateur arrêté :
// brûlure ; hors de son tour : refus.

import { ETATS_LAMPE_DEFECTUEUSE, LAMPES } from '../../donnees/modules'
import { choisirAuHasard, entierAuHasard, type Hasard } from '../hasard'
import { dernierChiffrePair } from '../serie'
import { sansEvenement, type Contexte, type Effet } from './commun'

export type EtatLampe = 'orange' | (typeof ETATS_LAMPE_DEFECTUEUSE)[number]

export interface EtatLP1 {
  lampes: EtatLampe[]
  ventilateur: boolean
  /** Avarie en cours (elle ne cesse qu'une fois VT arrêté, toutes les lampes orange). */
  avarie: boolean
}

export function creerLP1(): EtatLP1 {
  return { lampes: Array.from({ length: LAMPES.nombre }, () => 'orange' as EtatLampe), ventilateur: false, avarie: false }
}

export function lp1EnPanne(e: EtatLP1): boolean {
  return e.avarie
}

/** Avarie : 1 + aléa × min(3, 1 + améliorations ÷ 10) lampes deviennent éteintes, bleues ou vertes. */
export function panneLP1(e: EtatLP1, hasard: Hasard, ameliorations: number): EtatLP1 {
  const max = Math.min(LAMPES.maximumParAvarie, 1 + Math.floor(ameliorations / LAMPES.ameliorationsParLampe))
  const n = 1 + entierAuHasard(hasard, max)
  // Tirage de n lampes différentes (mélange de Fisher-Yates).
  const indices = [0, 1, 2, 3, 4, 5]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = entierAuHasard(hasard, i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const choisies = new Set(indices.slice(0, n))
  const lampes = e.lampes.map((l, i) => (choisies.has(i) ? choisirAuHasard(hasard, ETATS_LAMPE_DEFECTUEUSE) : l))
  return { ...e, lampes, avarie: true }
}

/** Ordre de remplacement des lampes défectueuses (numéros 0 à 5). */
export function ordreLampes(e: EtatLP1, serie: string): number[] {
  const rang: Record<string, number> = { eteinte: 0, bleue: 1, verte: 2 }
  const pair = dernierChiffrePair(serie)
  return e.lampes
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => l !== 'orange')
    .sort((x, y) => rang[x.l] - rang[y.l] || (pair ? x.i - y.i : y.i - x.i))
    .map(({ i }) => i)
}

/** Touche (remplace) la lampe i. */
export function toucherLampe(e: EtatLP1, i: number, ctx: Contexte): Effet<EtatLP1> {
  if (e.lampes[i] === 'orange') return sansEvenement(e)
  if (!e.ventilateur) return { etat: e, evenements: [{ type: 'erreur', module: 'LP-1', nature: 'brûlure' }] }
  if (ordreLampes(e, ctx.serie)[0] !== i) return { etat: e, evenements: [{ type: 'erreur', module: 'LP-1', nature: 'hors de son tour' }] }
  return sansEvenement({ ...e, lampes: e.lampes.map((l, k) => (k === i ? 'orange' : l)) })
}

/** Met en marche ou arrête le ventilateur VT. L'arrêter, toutes les lampes orange, répare LP-1. */
export function basculerVentilateur(e: EtatLP1): Effet<EtatLP1> {
  const ventilateur = !e.ventilateur
  if (!ventilateur && e.avarie && e.lampes.every((l) => l === 'orange')) {
    return { etat: { ...e, ventilateur, avarie: false }, evenements: [{ type: 'reparation', module: 'LP-1' }] }
  }
  return sansEvenement({ ...e, ventilateur })
}
