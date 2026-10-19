// Les modules du panneau (« appareils », voir src/donnees/blocs.ts) : comment commencer la réparation de chacun et
// à quel geste il répond. Le jeu passe par ici sans connaître le détail de chaque module.

import type { NomAppareil } from '../donnees/blocs'
import {
  appuyer, emettre, nouveauChiffreur, nouveauTelegraphe, nouvelleAntenne, reglerFrequence, tournerAntenne, verrouiller,
} from './communications'
import { brancherAccu, coupler, nouveauxAccumulateurs, nouveauxFusibles, remplacer } from './energie'
import {
  amorcer, basculerLevier, couperInjecteur, enclencher, nouveauxInjecteurs, nouveauxLeviers, nouvelleSoupape, purger,
} from './propulsion'
import {
  basculerInterrupteur, freiner, nouveauCalculateur, nouveauGyroscope, nouvelleConstellation, pointer, reglerCap, taperAstre,
} from './guidage'
import { basculerIsoler, couperCable, nouvelleReparation, type EtatReparation, type Resultat } from './reparation'

/** Un geste du joueur sur les commandes d'un module. */
export type Geste =
  | { genre: 'couper'; cable: number } | { genre: 'isoler' }
  | { genre: 'regler'; pas: number } | { genre: 'emettre' }
  | { genre: 'tourner'; degres: number } | { genre: 'verrouiller' }
  | { genre: 'appuyer'; touche: number }
  | { genre: 'remplacer'; rechange: number }
  | { genre: 'brancher'; accu: number } | { genre: 'coupler' }
  | { genre: 'basculer'; levier: number } | { genre: 'enclencher' }
  | { genre: 'purger'; tenir: boolean }
  | { genre: 'injecteur'; injecteur: number } | { genre: 'amorcer' }
  | { genre: 'cap'; cadran: 'azimut' | 'hauteur'; pas: 1 | -1 } | { genre: 'pointer' }
  | { genre: 'freiner'; anneau: number }
  | { genre: 'interrupteur'; interrupteur: number } | { genre: 'astre'; astre: number }

/** Commence la réparation d'un module raccordé. */
export function commencer(a: NomAppareil, graine: number): EtatReparation {
  switch (a) {
    case 'telegraphe': return nouveauTelegraphe(graine)
    case 'antenne': return nouvelleAntenne(graine)
    case 'chiffreur': return nouveauChiffreur(graine)
    case 'fusibles': return nouveauxFusibles(graine)
    case 'accumulateurs': return nouveauxAccumulateurs(graine)
    case 'leviers': return nouveauxLeviers(graine)
    case 'soupape': return nouvelleSoupape(graine)
    case 'injecteurs': return nouveauxInjecteurs(graine)
    case 'constellation': return nouvelleConstellation(graine)
    case 'gyroscope': return nouveauGyroscope(graine)
    case 'calculateur': return nouveauCalculateur(graine)
    default: return nouvelleReparation(graine)
  }
}

/**
 * Applique un geste à un module ; un geste qui ne va pas avec ce module ne fait rien. pressionRouge : l'aiguille de la
 * soupape forcée dans le rouge (soupape en défaut), que lit le bornier.
 */
export function jouer(a: NomAppareil, r: EtatReparation, g: Geste, numeroSerie: string, t: number, pressionRouge?: boolean): Resultat {
  if (a === 'bornier' && g.genre === 'couper') return couperCable(r, g.cable, numeroSerie, t, pressionRouge)
  if (a === 'bornier' && g.genre === 'isoler') return basculerIsoler(r, numeroSerie, t, pressionRouge)
  if (a === 'telegraphe' && g.genre === 'regler') return reglerFrequence(r, g.pas, t)
  if (a === 'telegraphe' && g.genre === 'emettre') return emettre(r, t)
  if (a === 'antenne' && g.genre === 'tourner') return tournerAntenne(r, g.degres, t)
  if (a === 'antenne' && g.genre === 'verrouiller') return verrouiller(r, t)
  if (a === 'chiffreur' && g.genre === 'appuyer') return appuyer(r, g.touche, t)
  if (a === 'fusibles' && g.genre === 'remplacer') return remplacer(r, g.rechange, t)
  if (a === 'accumulateurs' && g.genre === 'brancher') return brancherAccu(r, g.accu, t)
  if (a === 'accumulateurs' && g.genre === 'coupler') return coupler(r, t)
  if (a === 'leviers' && g.genre === 'basculer') return basculerLevier(r, g.levier, t)
  if (a === 'leviers' && g.genre === 'enclencher') return enclencher(r, t)
  if (a === 'soupape' && g.genre === 'purger') return purger(r, g.tenir, t)
  if (a === 'injecteurs' && g.genre === 'injecteur') return couperInjecteur(r, g.injecteur, t)
  if (a === 'injecteurs' && g.genre === 'amorcer') return amorcer(r, t)
  if (a === 'constellation' && g.genre === 'cap') return reglerCap(r, g.cadran, g.pas, t)
  if (a === 'constellation' && g.genre === 'pointer') return pointer(r, t)
  if (a === 'gyroscope' && g.genre === 'freiner') return freiner(r, g.anneau, numeroSerie, t)
  if (a === 'calculateur' && g.genre === 'interrupteur') return basculerInterrupteur(r, g.interrupteur, t)
  if (a === 'calculateur' && g.genre === 'astre') return taperAstre(r, g.astre, t)
  return 'ok'
}
