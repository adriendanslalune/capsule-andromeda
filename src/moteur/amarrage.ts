// L'amarrage (AMARRER, la livraison des Ingénieurs) : la manœuvre, vue du dessus. Le port de la station est en (0, 0) ;
// la capsule est à `distance` mètres devant lui (son nez vers le port), décalée de `ecart` mètres de côté, tournée de
// `angle` degrés. Les propulseurs poussent tant qu'on les tient. Au contact : trop vite, de travers ou décentrée, la
// capsule rebondit (on recommence l'approche, autant de fois qu'il faut) ; sinon elle est amarrée. Pas d'échec définitif.

import {
  ANGLE_CONTACT, ANGLE_DEPART, DERIVE, DISTANCE_DEPART, ECART_CONTACT, ECART_DEPART, GLISSE_CONTACT, POUSSEE,
  POUSSEE_ROTATION, VITESSE_CONTACT,
} from '../donnees/amarrage'
import { hasard } from './contrats'

export interface EtatAmarrage {
  /** Distance au port (m, le long de l'axe d'approche) et décalage de côté (m, positif vers la droite). */
  distance: number
  ecart: number
  /** Vitesse d'approche (m/s, positive quand on se rapproche) et de côté (m/s). */
  approche: number
  glisse: number
  /** Orientation (degrés, 0 : alignée) et vitesse de rotation (degrés/s). */
  angle: number
  rotation: number
  /** Sens de la dérive (−1 ou 1). */
  derive: number
  /** Rebonds sur le port avant de s'amarrer. */
  rebonds: number
  amarre: boolean
}

/** Ce que le pilote tient enfoncé : avancer (1) ou reculer (−1), à droite (1) ou à gauche (−1), tourner. */
export interface Poussees { avant: -1 | 0 | 1; cote: -1 | 0 | 1; tourner: -1 | 0 | 1 }
export const AUCUNE: Poussees = { avant: 0, cote: 0, tourner: 0 }

export function nouvelAmarrage(graine: number): EtatAmarrage {
  let g = graine
  const x = () => { const h = hasard(g); g = h.graine; return h.x }
  const signe = () => (x() < 0.5 ? -1 : 1)
  return {
    distance: DISTANCE_DEPART, ecart: signe() * ECART_DEPART * (0.4 + 0.6 * x()), approche: 0, glisse: 0,
    angle: signe() * ANGLE_DEPART * (0.4 + 0.6 * x()), rotation: 0, derive: signe(), rebonds: 0, amarre: false,
  }
}

/** Le contact serait-il bon, maintenant ? (pour l'afficher au pilote, et pour juger le contact) */
export function contactBon(e: EtatAmarrage): { vitesse: boolean; centre: boolean; aligne: boolean; glisse: boolean } {
  return {
    vitesse: e.approche <= VITESSE_CONTACT, centre: Math.abs(e.ecart) <= ECART_CONTACT,
    aligne: Math.abs(e.angle) <= ANGLE_CONTACT, glisse: Math.abs(e.glisse) <= GLISSE_CONTACT,
  }
}

/** Fait avancer la manœuvre de dt secondes ; renvoie ce qui s'est passé au contact (ou null). */
export function avancerAmarrage(e: EtatAmarrage, p: Poussees, dt: number): 'amarre' | 'rebond' | null {
  if (e.amarre) return null
  // Les propulseurs poussent dans l'axe de la capsule : tournée, une poussée vers l'avant fait aussi glisser de côté.
  const a = (e.angle * Math.PI) / 180
  e.approche += POUSSEE * p.avant * Math.cos(a) * dt - POUSSEE * p.cote * Math.sin(a) * dt
  e.glisse += POUSSEE * p.cote * Math.cos(a) * dt + POUSSEE * p.avant * Math.sin(a) * dt + DERIVE * e.derive * dt
  e.rotation += POUSSEE_ROTATION * p.tourner * dt
  e.distance -= e.approche * dt
  e.ecart += e.glisse * dt
  e.angle += e.rotation * dt
  // Trop loin : on ne s'éloigne pas au-delà du point de départ (la station guide la capsule).
  if (e.distance > DISTANCE_DEPART * 1.5) { e.distance = DISTANCE_DEPART * 1.5; e.approche = Math.max(0, e.approche) }
  if (e.distance > 0) return null
  // Le contact.
  const c = contactBon(e)
  if (c.vitesse && c.centre && c.aligne && c.glisse) {
    e.distance = 0
    e.amarre = true
    return 'amarre'
  }
  // Rebond : la capsule repart en arrière, un peu tournée.
  e.rebonds++
  e.distance = 0.05
  e.approche = -Math.max(0.15, 0.6 * e.approche)
  e.rotation += (e.ecart >= 0 ? 1 : -1) * 3
  return 'rebond'
}
