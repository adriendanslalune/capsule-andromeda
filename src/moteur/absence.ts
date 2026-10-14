// Retour après une absence : le temps est réel, et le jeu a continué pendant que l'application était fermée.
// On simule ce qui s'est passé par pas de 10 minutes (vol, usure, avaries, contrats, trophées), puis on met la chasse
// à jour une seule fois, et on écrit le rapport de vol.

import { ABSENCE } from '../donnees/reglages'
import { evoluerChasse } from './chasse'
import { verifierTrophees } from './economie'
import type { EtatPartie } from './etat'
import type { Destination } from './fusee'
import type { Hasard } from './hasard'
import { modulesEnPanne } from './modules'
import { ajouterPanneSimple } from './pannes'
import { avancerPartie, vitesseActuelle } from './partie'

export interface RapportDeVol {
  /** Début et fin de l'absence (ms UTC). */
  depuis: number
  jusqua: number
  /** Distance parcourue pendant l'absence (km). */
  distanceKm: number
  /** Vitesse au retour (km/s). */
  vitesse: number
  /** Avaries survenues : instant et modules touchés. */
  avaries: { t: number; modules: string[] }[]
  /** Destinations atteintes. */
  arrivees: { t: number; destination: Destination }[]
  contratsRemplis: number
  /** Crédits gagnés (ou dépensés) pendant l'absence. */
  credits: number
  trophees: string[]
  /** Messages du téléscripteur reçus pendant l'absence (les plus récents). */
  messages: string[]
  /** Modules en avarie au retour. */
  enPanne: string[]
}

export interface ResultatRattrapage {
  etat: EtatPartie
  /** null si l'absence est trop courte pour un rapport. */
  rapport: RapportDeVol | null
}

/** Rattrape le temps écoulé depuis le dernier instant simulé (etat.vu) jusqu'à maintenant. */
export function rattraper(etat: EtatPartie, maintenant: number, hasard: Hasard): ResultatRattrapage {
  const depuis = etat.vu
  const total = (maintenant - depuis) / 1000
  if (total < ABSENCE.dureeMinimale) return { etat, rapport: null }

  let e = etat
  const avaries: RapportDeVol['avaries'] = []
  const arrivees: RapportDeVol['arrivees'] = []
  const messages: string[] = []
  let avant = new Set(modulesEnPanne(e.modules))
  let evenementsDePanne = 0
  let panneSimple = false

  let ecoule = 0
  while (ecoule < total) {
    const pas = Math.min(ABSENCE.pas, total - ecoule)
    ecoule += pas
    const t = depuis + ecoule * 1000
    const r = avancerPartie(e, t, pas, hasard, { chasse: false })
    e = r.etat
    messages.push(...r.messages)
    if (r.arrivee) arrivees.push({ t, destination: r.arrivee })
    const apres = modulesEnPanne(e.modules)
    const nouvelles = apres.filter((c) => !avant.has(c))
    if (nouvelles.length) {
      avaries.push({ t, modules: nouvelles })
      if (!nouvelles.every((c) => c === 'RE-1')) {
        evenementsDePanne++
        panneSimple = nouvelles.length === 1 && !e.pannes.cascade
      }
    }
    avant = new Set(apres)
  }

  // Au plus deux avaries pendant l'absence : après une longue absence, une seconde panne simple peut s'ajouter.
  if (total > ABSENCE.dureeSecondeAvarieHeures * 3600 && evenementsDePanne === 1 && panneSimple
    && hasard() < ABSENCE.probabiliteSecondeAvarie) {
    const r = ajouterPanneSimple(e, maintenant, hasard)
    e = r.etat
    if (r.module) avaries.push({ t: maintenant, modules: [r.module] })
  }

  const chasse = evoluerChasse({ ...e, vu: maintenant }, maintenant)
  e = verifierTrophees(chasse.etat)
  messages.push(...chasse.messages)

  return {
    etat: e,
    rapport: {
      depuis,
      jusqua: maintenant,
      distanceKm: e.fusee.distanceParcourue - etat.fusee.distanceParcourue,
      vitesse: e.fusee.destination ? vitesseActuelle(e) : 0,
      avaries,
      arrivees,
      contratsRemplis: e.stats.contrats - etat.stats.contrats,
      credits: e.credits - etat.credits,
      trophees: e.trophees.filter((x) => !etat.trophees.includes(x)),
      messages: messages.slice(-ABSENCE.messagesGardes),
      enPanne: modulesEnPanne(e.modules),
    },
  }
}
