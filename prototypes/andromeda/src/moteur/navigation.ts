// Navigation : ce que le moteur sait dire de la destination choisie. (Le trajet viendra à l'étape 3.)

import { etatCapsule } from './capsule'
import { position } from './corps'
import { UA_KM } from './temps'

/** Vitesse de la lumière (km/s). */
export const C_KM_S = 299_792.458

/** Distance réelle (km) entre la capsule et un astre, à l'instant t. */
export function distanceDepuisCapsule(nom: string, t: number): number {
  const c = etatCapsule(t).position
  const p = position(nom, t)
  return Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z)
}

/** Distance lisible en français : mètres, km, millions de km, ou unités astronomiques. */
export function texteDistance(km: number): string {
  const rond = (x: number, chiffres = 3) => x.toLocaleString('fr', { maximumSignificantDigits: chiffres })
  if (km >= 0.1 * UA_KM) return `${rond(km / UA_KM)} UA`
  if (km >= 1e6) return `${rond(km / 1e6)} million${km >= 2e6 ? 's' : ''} de km`
  if (km < 1) return `${rond(km * 1000, 2)} m`
  return `${rond(km)} km`
}
