// L'escorte (ESCORTER, Mercenaires) : l'embuscade sur la dernière ligne droite. Des missiles partent des bords vers
// les cargos du convoi ; on les intercepte en les touchant (une courte recharge entre deux tirs). Un missile qui passe
// abîme son cargo ; les trois cargos hors d'usage, le convoi se replie et la vague recommence (pas d'échec définitif).

import {
  CARGOS, ECART_LANCERS, HAUTEUR, LARGEUR, MISSILES_BASE, MISSILES_PAR_DOUBLEMENT, RAYON_INTERCEPTION, RECHARGE_TIR,
  RESISTANCE, VOL_MISSILE,
} from '../donnees/escorte'
import { hasard } from './contrats'

export interface MissileEscorte { id: number; depart: { x: number; y: number }; cargo: number; lance: number; duree: number }

export interface EtatEscorte {
  temps: number
  /** Missiles en vol ; lancers à venir (instant, bord de départ, cargo visé). */
  missiles: MissileEscorte[]
  aVenir: { lance: number; depart: { x: number; y: number }; cargo: number }[]
  /** Coups reçus par chaque cargo. */
  degats: number[]
  /** Coups reçus en tout (pour la prime), missiles interceptés, replis. */
  coups: number
  interceptes: number
  replis: number
  recharge: number
  /** Explosions à montrer (où, quand). */
  explosions: { x: number; y: number; t: number; touche: boolean }[]
  fini: boolean
  graine: number
  niveau: number
}

/** Le nombre de missiles d'une embuscade, selon la zone du système (1 pour la Terre … 60 pour Pluton). */
export function nombreDeMissiles(zone: number): number {
  return MISSILES_BASE + Math.round(MISSILES_PAR_DOUBLEMENT * Math.log2(Math.max(1, zone)))
}

function vague(e: EtatEscorte): void {
  let g = e.graine
  const x = () => { const h = hasard(g); g = h.graine; return h.x }
  const n = nombreDeMissiles(e.niveau)
  const serre = 1 / (1 + 0.08 * Math.log2(Math.max(1, e.niveau)))
  e.aVenir = []
  let t = e.temps + 1.5
  for (let k = 0; k < n; k++) {
    const bord = x()
    const depart = bord < 0.4 ? { x: -4, y: 10 + 90 * x() } : bord < 0.8 ? { x: LARGEUR + 4, y: 10 + 90 * x() } : { x: 10 + 80 * x(), y: -4 }
    e.aVenir.push({ lance: t, depart, cargo: Math.floor(x() * CARGOS.length) })
    t += ECART_LANCERS * serre * (0.5 + x())
  }
  e.graine = g
  e.degats = CARGOS.map(() => 0)
}

export function nouvelleEscorte(graine: number, zone = 1): EtatEscorte {
  const e: EtatEscorte = {
    temps: 0, missiles: [], aVenir: [], degats: [], coups: 0, interceptes: 0, replis: 0, recharge: 0, explosions: [],
    fini: false, graine, niveau: zone,
  }
  vague(e)
  return e
}

/** Position d'un missile en vol. */
export function positionMissile(m: MissileEscorte, t: number): { x: number; y: number } {
  const c = CARGOS[m.cargo], f = Math.min(1, (t - m.lance) / m.duree)
  return { x: m.depart.x + (c.x - m.depart.x) * f, y: m.depart.y + (c.y - m.depart.y) * f }
}

/** Tire un intercepteur là où le doigt touche (unités du terrain) ; renvoie le nombre de missiles détruits, ou null (en recharge). */
export function tirer(e: EtatEscorte, x: number, y: number): number | null {
  if (e.fini || e.recharge > 0) return null
  e.recharge = RECHARGE_TIR
  const avant = e.missiles.length
  e.missiles = e.missiles.filter((m) => { const p = positionMissile(m, e.temps); return Math.hypot(p.x - x, p.y - y) > RAYON_INTERCEPTION })
  const detruits = avant - e.missiles.length
  e.interceptes += detruits
  e.explosions.push({ x, y, t: e.temps, touche: false })
  return detruits
}

/** Fait avancer de dt secondes ; renvoie ce qui vient d'arriver. */
export function avancerEscorte(e: EtatEscorte, dt: number): 'coup' | 'repli' | 'arrive' | null {
  if (e.fini) return null
  e.temps += dt
  e.recharge = Math.max(0, e.recharge - dt)
  e.explosions = e.explosions.filter((x) => e.temps - x.t < 0.6)
  const serre = 1 / (1 + 0.08 * Math.log2(Math.max(1, e.niveau)))
  while (e.aVenir.length && e.aVenir[0].lance <= e.temps) {
    const l = e.aVenir.shift()!
    e.missiles.push({ id: Math.round(l.lance * 1000), depart: l.depart, cargo: l.cargo, lance: l.lance, duree: VOL_MISSILE * serre })
  }
  let r: 'coup' | 'repli' | 'arrive' | null = null
  for (const m of [...e.missiles]) {
    if (e.temps - m.lance < m.duree) continue
    e.missiles = e.missiles.filter((x) => x !== m)
    e.degats[m.cargo]++
    e.coups++
    const c = CARGOS[m.cargo]
    e.explosions.push({ x: c.x, y: c.y, t: e.temps, touche: true })
    r = 'coup'
  }
  if (e.degats.every((d) => d >= RESISTANCE)) {
    // Le convoi se replie : on recommence la vague.
    e.replis++
    e.missiles = []
    vague(e)
    return 'repli'
  }
  if (!e.aVenir.length && !e.missiles.length) { e.fini = true; return 'arrive' }
  return r
}

export { HAUTEUR, LARGEUR }
