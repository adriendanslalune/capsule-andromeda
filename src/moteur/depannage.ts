// Le dépannage d'un engin (RÉPARER, Ingénieurs) : l'état du boîtier technique et ce que le joueur y fait. Le boîtier
// montre la lettre de son bus et la couleur de son voyant ; deux de ses trois appareils (disjoncteurs, câblage,
// gyroscope) sont en défaut. Pour chacun, le joueur règle, puis appuie sur VÉRIFIER : juste, l'appareil est réparé ;
// faux, c'est une fausse manœuvre (comptée) et on corrige. Pas de chrono, pas d'échec définitif.

import {
  APPAREILS_ENGIN, CABLAGE, CABLES, CHIFFRES_GYRO, DISJONCTEURS, LES_BUS, SYMBOLES_GYRO, VOYANT_ECHANGE, VOYANTS,
  type AppareilEngin, type Bus, type Voyant,
} from '../donnees/depannage'
import { hasard } from './contrats'

export interface EtatDepannage {
  bus: Bus
  voyant: Voyant
  /** Les deux appareils en défaut, et ceux déjà réparés. */
  enDefaut: AppareilEngin[]
  repares: AppareilEngin[]
  /** Disjoncteurs : levés (vrai) ou baissés, de 1 à 5. */
  leviers: boolean[]
  /** Câblage : la prise (1 à 4) où est branché chaque câble (rouge, jaune, bleu, noir), ou null. */
  prises: (number | null)[]
  /** Gyroscope : les trois symboles affichés (indices dans SYMBOLES_GYRO) et les trois molettes (0 à 9). */
  symboles: number[]
  molettes: number[]
  erreurs: number
}

export function nouveauDepannage(graine: number): EtatDepannage {
  let g = graine
  const x = () => { const h = hasard(g); g = h.graine; return h.x }
  const tirer = <T>(l: readonly T[]) => l[Math.floor(x() * l.length)]
  const absent = tirer(APPAREILS_ENGIN).appareil
  const symboles: number[] = []
  while (symboles.length < 3) { const s = Math.floor(x() * SYMBOLES_GYRO.length); if (!symboles.includes(s)) symboles.push(s) }
  const e: EtatDepannage = {
    bus: tirer(LES_BUS), voyant: tirer(VOYANTS).voyant,
    enDefaut: APPAREILS_ENGIN.map((a) => a.appareil).filter((a) => a !== absent), repares: [],
    leviers: Array.from({ length: 5 }, () => x() < 0.5), prises: CABLES.map(() => null),
    symboles, molettes: [0, 0, 0], erreurs: 0,
  }
  // Un module en défaut n'est jamais déjà dans le bon état au départ.
  if (leviersAttendus(e).every((v, k) => v === e.leviers[k])) { const i = Math.floor(x() * 5); e.leviers[i] = !e.leviers[i] }
  if (molettesAttendues(e).every((m, k) => m === e.molettes[k])) e.molettes = [5, 5, 5]
  return e
}

/** Ce que le Manuel demande (les mêmes tableaux pour tous). */
export function leviersAttendus(e: EtatDepannage): boolean[] {
  const leves = DISJONCTEURS[e.voyant][e.bus]
  return [1, 2, 3, 4, 5].map((n) => leves.includes(n))
}
export function cablageAttendu(e: EtatDepannage): number[] {
  return CABLAGE[e.bus].map((p) => (e.voyant === VOYANT_ECHANGE ? (p === 1 ? 4 : p === 4 ? 1 : p) : p))
}
export function molettesAttendues(e: EtatDepannage): number[] {
  const colonne = e.bus === 'A' || e.bus === 'B' ? 'AB' : 'CD'
  return e.symboles.map((s) => CHIFFRES_GYRO[colonne][s])
}

export function basculer(e: EtatDepannage, levier: number): void {
  e.leviers[levier] = !e.leviers[levier]
}

/** Branche un câble sur une prise (le câble qui y était est débranché). */
export function brancher(e: EtatDepannage, cable: number, prise: number): void {
  for (let k = 0; k < e.prises.length; k++) if (e.prises[k] === prise) e.prises[k] = null
  e.prises[cable] = prise
}

export function tournerMolette(e: EtatDepannage, molette: number, pas: 1 | -1): void {
  e.molettes[molette] = (e.molettes[molette] + pas + 10) % 10
}

/** VÉRIFIER un appareil : juste, il est réparé ; faux, une fausse manœuvre de plus. */
export function verifier(e: EtatDepannage, a: AppareilEngin): boolean {
  if (!e.enDefaut.includes(a) || e.repares.includes(a)) return false
  const egal = (x: readonly unknown[], y: readonly unknown[]) => x.length === y.length && x.every((v, k) => v === y[k])
  const juste = a === 'disjoncteurs' ? egal(e.leviers, leviersAttendus(e))
    : a === 'cablage' ? egal(e.prises, cablageAttendu(e))
      : egal(e.molettes, molettesAttendues(e))
  if (juste) e.repares.push(a)
  else e.erreurs++
  return juste
}

export function depannageFini(e: EtatDepannage): boolean {
  return e.enDefaut.every((a) => e.repares.includes(a))
}
