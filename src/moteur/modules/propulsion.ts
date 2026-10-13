// Bloc propulsion : CH-1 Chambre de combustion et TU-1 Tuyère (modules de base).
// Les deux modules partagent leurs commandes et leurs aiguilles : presser P pendant une surchauffe de la tuyère
// provoque un emballement ; c'est pourquoi ils sont décrits ensemble.
//
// Commandes : levier L-A (tuyère), levier L-B (chambre, « ne jamais manœuvrer en vol »), molette R (0 à 9),
// bouton P. Aiguilles : pression P (M-1) et température T (T-2).

import { PROPULSION as R } from '../../donnees/modules'
import type { Hasard } from '../hasard'
import { sansEvenement, type Effet, type Evenement } from './commun'

export interface EtatPropulsion {
  /** Levier L-A relevé (position normale). L'abaisser coupe l'injection : la tuyère refroidit, la fusée ralentit. */
  levierAHaut: boolean
  /** Levier L-B relevé (position normale). */
  levierBHaut: boolean
  /** Molette R, de 0 à 9. */
  molette: number
  /** Pression de la chambre (0 à 100). */
  pression: number
  /** Température de la tuyère. */
  temperature: number
  /** Avarie de TU-1 : surchauffe. */
  surchauffe: boolean
  /** Avarie de CH-1 : surpression, sous-pression, ou aucune. */
  avariePression: 'sur' | 'sous' | null
  /** Rechute prévue de la surchauffe après un faux réparé (ms UTC), ou null. */
  rechute: number | null
  /** Durée (s) pendant laquelle la pression est restée au-dessus de 90, ou sous 15 (fautes de pilotage). */
  dureeHaute: number
  dureeBasse: number
}

export function creerPropulsion(): EtatPropulsion {
  return {
    levierAHaut: true, levierBHaut: true, molette: R.moletteDepart,
    pression: R.pressionNominale, temperature: R.temperatureNominale,
    surchauffe: false, avariePression: null, rechute: null, dureeHaute: 0, dureeBasse: 0,
  }
}

/** CH-1 en avarie. */
export function ch1EnPanne(e: EtatPropulsion): boolean {
  return e.avariePression !== null
}

/** TU-1 en avarie (pendant le délai d'un faux réparé, la tuyère semble réparée). */
export function tu1EnPanne(e: EtatPropulsion): boolean {
  return e.surchauffe
}

// ---------------------------------------------------------------------------------------------------------------
// Avaries déclenchées par le jeu

/** Avarie de CH-1 : surpression ou sous-pression, au hasard. */
export function panneCH1(e: EtatPropulsion, hasard: Hasard): EtatPropulsion {
  return { ...e, avariePression: hasard() < 0.5 ? 'sur' : 'sous' }
}

/** Avarie de CH-1 imposée (tutoriel). */
export function panneCH1Imposee(e: EtatPropulsion, type: 'sur' | 'sous'): EtatPropulsion {
  return { ...e, avariePression: type }
}

/** Avarie de TU-1 : surchauffe. */
export function panneTU1(e: EtatPropulsion): EtatPropulsion {
  return { ...e, surchauffe: true, rechute: null }
}

// ---------------------------------------------------------------------------------------------------------------
// Évolution continue

/** Rapproche une valeur de sa cible, à une vitesse donnée (par seconde). */
function vers(valeur: number, cible: number, vitesse: number, dt: number): number {
  return valeur + Math.sign(cible - valeur) * Math.min(Math.abs(cible - valeur), vitesse * dt)
}

/** Pression visée par la chambre selon les avaries et les commandes. */
export function pressionCible(e: EtatPropulsion): number {
  if (e.avariePression === 'sur') return R.pressionSurpression
  if (e.avariePression === 'sous') return R.pressionSousPression
  const p = R.pressionNominale + (e.molette - 5) * R.pressionParCran + (e.levierBHaut ? 0 : R.pressionLevierB)
  return Math.max(0, Math.min(100, p))
}

/** Température visée par la tuyère. */
export function temperatureCible(e: EtatPropulsion): number {
  if (!e.levierAHaut) return R.temperatureLevierA
  return e.surchauffe ? R.temperatureSurchauffe : R.temperatureNominale
}

/**
 * Fait évoluer les aiguilles pendant dt secondes, jusqu'à l'instant t. Une pression laissée au-dessus de 90 (ou
 * sous 15) plus de 2 secondes provoque une avarie de CH-1 : faute de pilotage.
 */
export function evoluerPropulsion(e: EtatPropulsion, t: number, dt: number): Effet<EtatPropulsion> {
  const evenements: Evenement[] = []
  const pression = vers(e.pression, pressionCible(e), e.levierBHaut ? R.vitessePression : R.vitessePressionLevierB, dt)
  const vitesseT = !e.levierAHaut ? R.vitesseTemperatureLevierA
    : e.surchauffe ? R.vitesseTemperatureSurchauffe : R.vitesseTemperature
  const temperature = vers(e.temperature, temperatureCible(e), vitesseT, dt)
  let suivant: EtatPropulsion = { ...e, pression, temperature }

  if (suivant.rechute !== null && t >= suivant.rechute) suivant = { ...suivant, surchauffe: true, rechute: null }

  if (suivant.avariePression === null) {
    const dureeHaute = pression > R.seuilSurpression ? e.dureeHaute + dt : 0
    const dureeBasse = pression < R.seuilSousPression ? e.dureeBasse + dt : 0
    suivant = { ...suivant, dureeHaute, dureeBasse }
    if (dureeHaute > R.dureeAvantFaute) {
      suivant = { ...suivant, avariePression: 'sur', dureeHaute: 0 }
      evenements.push({ type: 'faute', module: 'CH-1' })
    } else if (dureeBasse > R.dureeAvantFaute) {
      suivant = { ...suivant, avariePression: 'sous', dureeBasse: 0 }
      evenements.push({ type: 'faute', module: 'CH-1' })
    }
  }
  return { etat: suivant, evenements }
}

// ---------------------------------------------------------------------------------------------------------------
// Commandes

/**
 * Bascule le levier L-A. Le relever pendant une surchauffe : à T ≤ 40, TU-1 est réparé ; entre 40 et 60, la tuyère
 * semble réparée mais la surchauffe revient 6 s plus tard ; au-dessus de 60, rien.
 */
export function basculerLevierA(e: EtatPropulsion, t: number): Effet<EtatPropulsion> {
  const levierAHaut = !e.levierAHaut
  const suivant = { ...e, levierAHaut }
  if (!levierAHaut) return sansEvenement(suivant)
  const reparation: Evenement = { type: 'reparation', module: 'TU-1' }
  if (e.surchauffe) {
    if (e.temperature <= R.temperatureReparation) return { etat: { ...suivant, surchauffe: false }, evenements: [reparation] }
    if (e.temperature <= R.temperatureFauxRepare) {
      return sansEvenement({ ...suivant, surchauffe: false, rechute: t + R.delaiRechute * 1000 })
    }
    return sansEvenement(suivant)
  }
  if (e.rechute !== null && e.temperature <= R.temperatureReparation) {
    // Faux réparé rattrapé : on a rabaissé puis relevé L-A assez tôt, la tuyère est vraiment réparée.
    return { etat: { ...suivant, rechute: null }, evenements: [reparation] }
  }
  return sansEvenement(suivant)
}

/** Bascule le levier L-B (le manuel interdit d'y toucher en vol : il fait monter la pression). */
export function basculerLevierB(e: EtatPropulsion): Effet<EtatPropulsion> {
  return sansEvenement({ ...e, levierBHaut: !e.levierBHaut })
}

/** Tourne la molette R d'un cran (après 9 vient 0). */
export function tournerMolette(e: EtatPropulsion): Effet<EtatPropulsion> {
  return sansEvenement({ ...e, molette: (e.molette + 1) % 10 })
}

/**
 * Presse le bouton P. Pendant une surchauffe (V-1 allumé) : emballement (T = 100), comme le dit le manuel.
 * En avarie de pression : avec R sur 2 (surpression) ou 7 (sous-pression), CH-1 est réparé ; sinon, erreur.
 * Sans avarie de pression : purge à vide (P − 20).
 * (Le prototype ne provoquait l'emballement que s'il y avait aussi une avarie de pression : écart signalé à Adrien.)
 */
export function presserP(e: EtatPropulsion): Effet<EtatPropulsion> {
  if (e.surchauffe) {
    return { etat: { ...e, temperature: R.temperatureEmballement }, evenements: [{ type: 'erreur', module: 'CH-1', nature: 'emballement' }] }
  }
  if (e.avariePression) {
    const bonReglage = (e.avariePression === 'sur' && e.molette === R.reglageSurpression)
      || (e.avariePression === 'sous' && e.molette === R.reglageSousPression)
    if (bonReglage) {
      return { etat: { ...e, avariePression: null, dureeHaute: 0, dureeBasse: 0 }, evenements: [{ type: 'reparation', module: 'CH-1' }] }
    }
    return { etat: e, evenements: [{ type: 'erreur', module: 'CH-1', nature: 'mauvais réglage' }] }
  }
  return {
    etat: { ...e, pression: Math.max(0, e.pression - R.purgeAVide) },
    evenements: [{ type: 'erreur', module: 'CH-1', nature: 'purge à vide' }],
  }
}
