// Déroulement d'une partie : fait avancer tout l'état d'un pas de temps.
// Pour l'instant : les modules (aiguilles), la fusée, les arrivées, les contrats, les trophées.
// La gestion des pannes (déclenchement, cascades, primes) s'ajoutera ici.

import { traiterArrivee, verifierTrophees } from './economie'
import type { EtatPartie } from './etat'
import { avancerFusee, vitesse, type Destination } from './fusee'
import type { Evenement } from './modules/commun'
import { evoluerModules, levierAAbaisse, modulesEnPanne } from './modules'

/** Vitesse actuelle de la fusée (km/s) : améliorations, levier L-A, avaries. */
export function vitesseActuelle(etat: EtatPartie): number {
  return vitesse({
    ameliorations: etat.ameliorations,
    levierAAbaisse: levierAAbaisse(etat.modules),
    avarie: modulesEnPanne(etat.modules).length > 0,
  })
}

export interface ResultatPasPartie {
  etat: EtatPartie
  /** Destination atteinte pendant ce pas, s'il y en a une (pour le téléscripteur et les sons). */
  arrivee: Destination | null
  /** Ce qui s'est passé dans les modules pendant ce pas (fautes de pilotage…). */
  evenements: Evenement[]
}

/** Fait avancer la partie de dt secondes, jusqu'à l'instant t (ms UTC). */
export function avancerPartie(etat: EtatPartie, t: number, dt: number): ResultatPasPartie {
  const m = evoluerModules(etat.modules, t, dt)
  const avecModules: EtatPartie = { ...etat, modules: m.modules }
  const r = avancerFusee(etat.fusee, t, dt, vitesseActuelle(avecModules))
  let e: EtatPartie = { ...avecModules, fusee: r.fusee, vu: t }
  e = r.arrivee ? traiterArrivee(e, r.arrivee, t) : verifierTrophees(e)
  return { etat: e, arrivee: r.arrivee, evenements: m.evenements }
}
