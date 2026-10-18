// Les modules du panneau (« appareils », voir src/donnees/blocs.ts) : comment commencer la réparation de chacun et
// à quel geste il répond. Le jeu passe par ici sans connaître le détail de chaque module.

import type { NomAppareil } from '../donnees/blocs'
import {
  appuyer, emettre, nouveauChiffreur, nouveauTelegraphe, nouvelleAntenne, reglerFrequence, tournerAntenne, verrouiller,
} from './communications'
import { basculerIsoler, couperCable, nouvelleReparation, type EtatReparation, type Resultat } from './reparation'

/** Un geste du joueur sur les commandes d'un module. */
export type Geste =
  | { genre: 'couper'; cable: number } | { genre: 'isoler' }
  | { genre: 'regler'; pas: number } | { genre: 'emettre' }
  | { genre: 'tourner'; degres: number } | { genre: 'verrouiller' }
  | { genre: 'appuyer'; touche: number }

/** Commence la réparation d'un module raccordé. */
export function commencer(a: NomAppareil, graine: number): EtatReparation {
  switch (a) {
    case 'telegraphe': return nouveauTelegraphe(graine)
    case 'antenne': return nouvelleAntenne(graine)
    case 'chiffreur': return nouveauChiffreur(graine)
    default: return nouvelleReparation(graine)
  }
}

/** Applique un geste à un module ; un geste qui ne va pas avec ce module ne fait rien. */
export function jouer(a: NomAppareil, r: EtatReparation, g: Geste, numeroSerie: string, t: number): Resultat {
  if (a === 'bornier' && g.genre === 'couper') return couperCable(r, g.cable, numeroSerie, t)
  if (a === 'bornier' && g.genre === 'isoler') return basculerIsoler(r, numeroSerie, t)
  if (a === 'telegraphe' && g.genre === 'regler') return reglerFrequence(r, g.pas, t)
  if (a === 'telegraphe' && g.genre === 'emettre') return emettre(r, t)
  if (a === 'antenne' && g.genre === 'tourner') return tournerAntenne(r, g.degres, t)
  if (a === 'antenne' && g.genre === 'verrouiller') return verrouiller(r, t)
  if (a === 'chiffreur' && g.genre === 'appuyer') return appuyer(r, g.touche, t)
  return 'ok'
}
