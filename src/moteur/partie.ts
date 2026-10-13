// Déroulement d'une partie : fait avancer tout l'état d'un pas de temps, et applique les actions du joueur.
// Un pas : évolution des modules (aiguilles, usure), traitement de leurs événements (primes, fautes, cascades),
// avance de la fusée (arrivées, contrats, trophées), puis programmation des avaries.

import { evoluerChasse } from './chasse'
import { estInstalle, traiterArrivee, verifierTrophees } from './economie'
import type { EtatPartie } from './etat'
import { avancerFusee, vitesse, type Destination } from './fusee'
import type { Hasard } from './hasard'
import { basculer, type NumeroInterrupteur } from './interrupteurs'
import { apresBasculeInterrupteur } from './modules/al1'
import type { Contexte, Evenement } from './modules/commun'
import { evoluerModules, levierAAbaisse, modulesEnPanne, type EtatModules } from './modules'
import { contexte, planifierPannes, traiterEvenements } from './pannes'

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
  /** Ce qui s'est passé dans les modules pendant ce pas. */
  evenements: Evenement[]
  /** Messages pour le téléscripteur. */
  messages: string[]
}

/** Fait avancer la partie de dt secondes, jusqu'à l'instant t (ms UTC). */
export function avancerPartie(etat: EtatPartie, t: number, dt: number, hasard: Hasard): ResultatPasPartie {
  const m = evoluerModules(etat.modules, t, dt, (code) => estInstalle(etat, code))
  const traites = traiterEvenements({ ...etat, modules: m.modules }, m.evenements, t, hasard)
  let e = traites.etat
  const r = avancerFusee(e.fusee, t, dt, vitesseActuelle(e))
  e = { ...e, fusee: r.fusee, vu: t }
  e = r.arrivee ? traiterArrivee(e, r.arrivee, t) : verifierTrophees(e)
  e = planifierPannes(e, t, hasard)
  const chasse = evoluerChasse(e, t)
  return { etat: chasse.etat, arrivee: r.arrivee, evenements: m.evenements, messages: [...traites.messages, ...chasse.messages] }
}

export interface ResultatAction {
  etat: EtatPartie
  evenements: Evenement[]
  messages: string[]
}

/**
 * Applique une action du joueur sur les modules (presser un bouton, toucher une prise…), puis traite ses
 * événements (prime, ordre de cascade…).
 */
export function agir(etat: EtatPartie, t: number, hasard: Hasard,
  action: (modules: EtatModules, ctx: Contexte) => { modules: EtatModules; evenements: Evenement[] }): ResultatAction {
  const r = action(etat.modules, contexte(etat, t))
  const traites = traiterEvenements({ ...etat, modules: r.modules }, r.evenements, t, hasard)
  // Si ce geste a tout réparé, la prochaine avarie est programmée dès maintenant.
  return { etat: planifierPannes(traites.etat, t, hasard), evenements: r.evenements, messages: traites.messages }
}

/** Bascule l'interrupteur S-n (bloc AL-1). Remettre S-4 en haut avec le bon fusible répare AL-1. */
export function basculerInterrupteur(etat: EtatPartie, n: NumeroInterrupteur, t: number, hasard: Hasard): ResultatAction {
  const avecInterrupteur = { ...etat, interrupteurs: basculer(etat.interrupteurs, n) }
  return agir(avecInterrupteur, t, hasard, (m, ctx) => {
    const r = apresBasculeInterrupteur(m.al1, n, ctx)
    return { modules: { ...m, al1: r.etat }, evenements: r.evenements }
  })
}
