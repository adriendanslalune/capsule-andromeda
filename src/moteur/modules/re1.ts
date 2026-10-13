// RE-1 Recycleur d'air (entretien continu) : l'oxygène (O2) baisse et le gaz carbonique (CO2) monte en permanence,
// même pendant l'absence du joueur. Avarie quand O2 < 25 ou CO2 > 75. Procédure : ouvrir la vanne de purge V-C
// (CO2 baisse, un peu d'O2 s'échappe), attendre CO2 < 40, refermer V-C, pomper l'O2 jusqu'à la zone verte
// (60 à 90). Ne jamais pomper vanne ouverte ; au-delà de 90, la soupape lâche (O2 retombe à 70).
// RE-1 ne participe jamais aux cascades.

import { RECYCLEUR as R } from '../../donnees/modules'
import { sansEvenement, type Effet, type Evenement } from './commun'

export interface EtatRE1 {
  o2: number
  co2: number
  /** Vanne de purge V-C ouverte. */
  vanneOuverte: boolean
  avarie: boolean
}

export function creerRE1(): EtatRE1 {
  return { o2: R.o2Depart, co2: R.co2Depart, vanneOuverte: false, avarie: false }
}

export function re1EnPanne(e: EtatRE1): boolean {
  return e.avarie
}

/**
 * Usure pendant dt secondes. L'avarie survient quand O2 < 25 ou CO2 > 75 (faute de pilotage si la vanne est ouverte
 * à ce moment) ; elle cesse d'elle-même quand CO2 < 40, 60 ≤ O2 ≤ 90 et V-C fermée.
 */
export function evoluerRE1(e: EtatRE1, dt: number): Effet<EtatRE1> {
  const evenements: Evenement[] = []
  let { o2, co2 } = e
  if (e.vanneOuverte) {
    co2 = Math.max(0, co2 - R.purgeCO2 * dt)
    o2 = Math.max(0, o2 - R.purgeO2 * dt)
  } else {
    o2 = Math.max(0, o2 - dt / R.secondesParPointO2)
    co2 = Math.min(100, co2 + dt / R.secondesParPointCO2)
  }
  let avarie = e.avarie
  if (!avarie && (o2 < R.o2Minimum || co2 > R.co2Maximum)) {
    avarie = true
    if (e.vanneOuverte) evenements.push({ type: 'faute', module: 'RE-1' })
  }
  if (avarie && !e.vanneOuverte && co2 < R.co2Repare && o2 >= R.o2ZoneVerteMin && o2 <= R.o2ZoneVerteMax) {
    avarie = false
    evenements.push({ type: 'reparation', module: 'RE-1' })
  }
  return { etat: { ...e, o2, co2, avarie }, evenements }
}

/** Ouvre ou ferme la vanne de purge V-C. */
export function basculerVanne(e: EtatRE1): Effet<EtatRE1> {
  return sansEvenement({ ...e, vanneOuverte: !e.vanneOuverte })
}

/** POMPE : O2 +10 ; vanne ouverte → erreur ; au-delà de 90 → la soupape lâche, O2 = 70, erreur. */
export function pomper(e: EtatRE1): Effet<EtatRE1> {
  if (e.vanneOuverte) return { etat: e, evenements: [{ type: 'erreur', module: 'RE-1', nature: 'pompe vanne ouverte' }] }
  const o2 = e.o2 + R.pompe
  if (o2 > R.o2ZoneVerteMax) {
    return { etat: { ...e, o2: R.o2ApresSoupape }, evenements: [{ type: 'erreur', module: 'RE-1', nature: 'soupape' }] }
  }
  return sansEvenement({ ...e, o2 })
}
