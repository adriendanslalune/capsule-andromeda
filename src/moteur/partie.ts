// Déroulement d'une partie : fait avancer tout l'état d'un pas de temps.
// Les modules et les pannes s'ajouteront ici ; pour l'instant : la fusée, les arrivées, les contrats, les trophées.

import { traiterArrivee, verifierTrophees } from './economie'
import type { EtatPartie } from './etat'
import { avancerFusee, vitesse, type Destination } from './fusee'

/** État des commandes qui influencent la vitesse (fournies par les modules, plus tard). */
export interface ConditionsDeVol {
  levierAAbaisse: boolean
  avarie: boolean
}

export const CONDITIONS_NORMALES: ConditionsDeVol = { levierAAbaisse: false, avarie: false }

/** Vitesse actuelle de la fusée (km/s). */
export function vitesseActuelle(etat: EtatPartie, conditions: ConditionsDeVol = CONDITIONS_NORMALES): number {
  return vitesse({ ameliorations: etat.ameliorations, ...conditions })
}

export interface ResultatPasPartie {
  etat: EtatPartie
  /** Destination atteinte pendant ce pas, s'il y en a une (pour le téléscripteur et les sons). */
  arrivee: Destination | null
}

/** Fait avancer la partie de dt secondes, jusqu'à l'instant t (ms UTC). */
export function avancerPartie(etat: EtatPartie, t: number, dt: number,
  conditions: ConditionsDeVol = CONDITIONS_NORMALES): ResultatPasPartie {
  const r = avancerFusee(etat.fusee, t, dt, vitesseActuelle(etat, conditions))
  let e: EtatPartie = { ...etat, fusee: r.fusee, vu: t }
  e = r.arrivee ? traiterArrivee(e, r.arrivee, t) : verifierTrophees(e)
  return { etat: e, arrivee: r.arrivee }
}
