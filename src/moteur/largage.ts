// Le largage (fin de REMORQUER, Nettoyeurs) : la capsule approche de la station, l'épave au bout du câble. On tient le
// frein pour ralentir, on lâche l'épave ; elle file sur son élan, freinée par le faisceau d'arrimage, et doit s'arrêter
// dans la zone de dépôt. Trop court, le faisceau la relâche ; trop long, elle cogne la station : on la reprend au câble
// et on recommence. Pas de chrono, pas d'échec définitif.

import {
  DISTANCE_DEPART, DISTANCE_SECURITE, FAISCEAU, FREINAGE, VITESSE_MAX, VITESSE_MIN, VITESSE_PLANCHER, ZONE_LOIN, ZONE_PROCHE,
} from '../donnees/largage'
import { hasard } from './contrats'

export interface EtatLargage {
  phase: 'approche' | 'lachee' | 'fini'
  /** Distance de l'épave à la station (m), et sa vitesse (m/s, vers la station). */
  distance: number
  vitesse: number
  /** Essais ratés (trop court, trop long, trop près sans lâcher). */
  rates: number
  graine: number
}

export type ResultatLargage = 'deposee' | 'court' | 'long' | 'trop-pres' | null

export function nouveauLargage(graine: number): EtatLargage {
  const e: EtatLargage = { phase: 'approche', distance: DISTANCE_DEPART, vitesse: 0, rates: 0, graine }
  recommencer(e)
  e.rates = 0
  return e
}

/** Nouvel essai : la capsule recule et revient, à une vitesse d'approche tirée au hasard. */
function recommencer(e: EtatLargage): void {
  const h = hasard(e.graine)
  e.graine = h.graine
  e.phase = 'approche'
  e.distance = DISTANCE_DEPART
  e.vitesse = VITESSE_MIN + (VITESSE_MAX - VITESSE_MIN) * h.x
  e.rates++
}

/** Où s'arrêtera l'épave si on la lâche maintenant (distance à la station, m ; négative : elle la cogne). */
export function arretSiLachee(e: EtatLargage): number {
  return e.distance - (e.vitesse * e.vitesse) / (2 * FAISCEAU)
}

/** Lâcher l'épave (pendant l'approche). */
export function lacher(e: EtatLargage): boolean {
  if (e.phase !== 'approche') return false
  e.phase = 'lachee'
  return true
}

/** Fait avancer de dt secondes ; `frein` : le frein tenu, pendant l'approche. Renvoie ce qui vient d'arriver. */
export function avancerLargage(e: EtatLargage, dt: number, frein = false): ResultatLargage {
  if (e.phase === 'fini') return null
  if (e.phase === 'approche') {
    if (frein) e.vitesse = Math.max(VITESSE_PLANCHER, e.vitesse - FREINAGE * dt)
    e.distance -= e.vitesse * dt
    if (e.distance <= DISTANCE_SECURITE) { recommencer(e); return 'trop-pres' }
    return null
  }
  // Lâchée : le faisceau la freine jusqu'à l'arrêt.
  const v = Math.max(0, e.vitesse - FAISCEAU * dt)
  e.distance -= ((e.vitesse + v) / 2) * dt
  e.vitesse = v
  if (e.distance <= 0) { recommencer(e); return 'long' }
  if (v > 0) return null
  if (e.distance > ZONE_LOIN) { recommencer(e); return 'court' }
  if (e.distance < ZONE_PROCHE) { recommencer(e); return 'long' }
  e.phase = 'fini'
  return 'deposee'
}
