// CR-1 Chronomètre de bord : il doit indiquer l'heure de l'Office, c'est-à-dire l'heure UTC plus autant de minutes
// que le dernier chiffre du n° de série. Avarie : il dérive (de 7 à 240 minutes, en avance ou en retard).
// Procédure : prendre l'heure locale, la convertir en UTC, ajouter le dernier chiffre en minutes, régler avec
// H+ H− M+ M−, presser RECALER. Une minute d'écart est tolérée.

import { CHRONOMETRE as C } from '../../donnees/modules'
import { entierAuHasard, type Hasard } from '../hasard'
import { dernierChiffre } from '../serie'
import { sansEvenement, type Effet } from './commun'

export interface EtatCR1 {
  /** Écart (minutes) entre l'heure affichée et l'heure de l'Office. */
  decalage: number
  avarie: boolean
}

export function creerCR1(): EtatCR1 {
  return { decalage: 0, avarie: false }
}

export function cr1EnPanne(e: EtatCR1): boolean {
  return e.avarie
}

/** Avarie : le chronomètre dérive de ±7 à ±240 minutes. */
export function panneCR1(_e: EtatCR1, hasard: Hasard): EtatCR1 {
  const signe = hasard() < 0.5 ? -1 : 1
  return { decalage: signe * (C.deriveMin + entierAuHasard(hasard, C.deriveMax - C.deriveMin + 1)), avarie: true }
}

/** Heure de l'Office (minutes depuis minuit) à l'instant t : UTC + dernier chiffre du n° de série. */
export function heureOffice(t: number, serie: string): number {
  const d = new Date(t)
  return (d.getUTCHours() * 60 + d.getUTCMinutes() + dernierChiffre(serie)) % 1440
}

/** Heure affichée par le chronomètre : { heures, minutes, secondes }. */
export function heureAffichee(e: EtatCR1, t: number, serie: string): { heures: number; minutes: number; secondes: number } {
  const m = (((heureOffice(t, serie) + e.decalage) % 1440) + 1440) % 1440
  return { heures: Math.floor(m / 60), minutes: m % 60, secondes: new Date(t).getUTCSeconds() }
}

/** H+ H− M+ M− : décale l'heure affichée de ±60 ou ±1 minute. */
export function reglerChronometre(e: EtatCR1, minutes: number): Effet<EtatCR1> {
  return sansEvenement({ ...e, decalage: e.decalage + minutes })
}

/** RECALER : sans avarie, rien ; à une minute près de l'heure de l'Office → réparé ; sinon, erreur. */
export function recaler(e: EtatCR1): Effet<EtatCR1> {
  if (!e.avarie) return sansEvenement(e)
  const ecart = ((e.decalage % 1440) + 1440) % 1440
  if (ecart <= C.tolerance || ecart >= 1440 - C.tolerance) {
    return { etat: { decalage: 0, avarie: false }, evenements: [{ type: 'reparation', module: 'CR-1' }] }
  }
  return { etat: e, evenements: [{ type: 'erreur', module: 'CR-1', nature: 'heure fausse' }] }
}
