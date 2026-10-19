// Le remorquage (REMORQUER, Nettoyeurs) : harponner une épave qui tourne sur elle-même, puis la stabiliser. Vue du
// dessus : l'épave en haut, la capsule en bas, le grappin qui part vers le haut. `angle` est l'orientation de l'anneau
// d'accroche (degrés) : 0 quand il fait face à la capsule. Pas de chrono, pas d'échec définitif : un grappin raté
// ricoche et l'on retire.

import {
  COUPLE, RECHARGE, ROTATION_MAX, ROTATION_MIN, SEUIL, TENUE, TOLERANCE, VARIATION, VOL_GRAPPIN,
} from '../donnees/remorquage'
import { hasard } from './contrats'

export interface EtatRemorquage {
  phase: 'viser' | 'stabiliser' | 'fini'
  /** Orientation de l'anneau d'accroche (degrés, de 0 à 360 ; 0 : face à la capsule). */
  angle: number
  /** Rotation de l'épave (degrés/s, signée) ; au harponnage, rotation de base (la variation s'y ajoute). */
  rotation: number
  base: number
  /** Temps écoulé (s), pour la variation de la rotation. */
  temps: number
  /** Grappin en vol : avancée de 0 à 1 ; ou en train d'être enroulé (recharge restante, s). */
  grappin: number | null
  recharge: number
  rates: number
  /** Temps passé sous le seuil de rotation, pendant la stabilisation (s). */
  calme: number
}

export function nouveauRemorquage(graine: number): EtatRemorquage {
  let g = graine
  const x = () => { const h = hasard(g); g = h.graine; return h.x }
  const base = (x() < 0.5 ? -1 : 1) * (ROTATION_MIN + (ROTATION_MAX - ROTATION_MIN) * x())
  return { phase: 'viser', angle: 360 * x(), rotation: base, base, temps: 0, grappin: null, recharge: 0, rates: 0, calme: 0 }
}

/** Écart (degrés, de 0 à 180) entre l'anneau d'accroche et la direction de la capsule. */
export function ecartAnneau(e: EtatRemorquage): number {
  const a = ((e.angle % 360) + 360) % 360
  return Math.min(a, 360 - a)
}

/** Lance le grappin (s'il est prêt). */
export function lancer(e: EtatRemorquage): boolean {
  if (e.phase !== 'viser' || e.grappin !== null || e.recharge > 0) return false
  e.grappin = 0
  return true
}

/**
 * Fait avancer de dt secondes. `poussee` : le propulseur de rotation tenu (−1, 0, 1), pendant la stabilisation.
 * Renvoie ce qui vient d'arriver : grappin accroché, raté, ou épave stabilisée.
 */
export function avancerRemorquage(e: EtatRemorquage, dt: number, poussee: -1 | 0 | 1 = 0): 'accroche' | 'rate' | 'stabilisee' | null {
  if (e.phase === 'fini') return null
  e.temps += dt
  if (e.phase === 'viser') {
    // La rotation varie un peu (on ne peut pas viser au métronome).
    e.rotation = e.base * (1 + VARIATION * Math.sin(1.3 * e.temps))
    e.angle = (e.angle + e.rotation * dt + 360) % 360
    if (e.recharge > 0) e.recharge = Math.max(0, e.recharge - dt)
    if (e.grappin !== null) {
      e.grappin += dt / VOL_GRAPPIN
      if (e.grappin >= 1) {
        e.grappin = null
        if (ecartAnneau(e) <= TOLERANCE) { e.phase = 'stabiliser'; return 'accroche' }
        e.rates++
        e.recharge = RECHARGE
        return 'rate'
      }
    }
    return null
  }
  // Stabiliser : le propulseur tenu change la rotation ; il faut l'amener (et la garder) près de zéro.
  e.rotation += COUPLE * poussee * dt
  e.angle = (e.angle + e.rotation * dt + 360) % 360
  e.calme = Math.abs(e.rotation) < SEUIL ? e.calme + dt : 0
  if (e.calme >= TENUE) { e.phase = 'fini'; e.rotation = 0; return 'stabilisee' }
  return null
}
