// Le bouton PING de la carte (décision d'Adrien du 18/10/2026 : sur la carte, à côté des Messages). Il dit ce que la
// radio sait, sans jamais dire quand l'écho reviendra : ça fait partie de l'inconnu. Rien n'est calculé ici : on
// demande au moteur.

import { ATTENTE_PING } from '../donnees/monolithes'
import type { Jeu } from '../moteur/jeu'
import { echoEnRoute, peutPinger } from '../moteur/monolithes'
import { texteRestant } from './textes'

export interface EtatBoutonPing {
  /** pret : on peut pinger ; attente : l'écho n'est pas revenu ; recharge : la radio se recharge (1 h entre deux PING). */
  etat: 'pret' | 'attente' | 'recharge'
  /** Recharge de la radio, de 0 à 1. */
  charge: number
  /** Ce qu'on dit au joueur s'il touche le bouton sans pouvoir pinger. */
  texte: string
}

export function etatBoutonPing(jeu: Jeu, t: number): EtatBoutonPing {
  const e = jeu.monolithes
  const charge = Math.min(1, Math.max(0, (t - e.dernierPing) / ATTENTE_PING))
  if (echoEnRoute(e, t)) return { etat: 'attente', charge, texte: 'PING envoyé : on attend l\'écho… (personne ne sait quand il reviendra)' }
  if (peutPinger(e, t)) return { etat: 'pret', charge: 1, texte: '' }
  return { etat: 'recharge', charge, texte: `La radio se recharge : prochain PING dans ${texteRestant(e.dernierPing + ATTENTE_PING - t)}` }
}
