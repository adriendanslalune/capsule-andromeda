// Ensemble des modules de la fusée : leur état, qui est en avarie, et leur évolution à chaque pas de temps.
// Les modules achetés à l'Office s'ajouteront ici au fil de leur écriture.

import type { Hasard } from '../hasard'
import { al1EnPanne, creerAL1, type EtatAL1 } from './al1'
import type { Evenement } from './commun'
import { ch1EnPanne, creerPropulsion, evoluerPropulsion, tu1EnPanne, type EtatPropulsion } from './propulsion'

export interface EtatModules {
  /** CH-1 et TU-1. */
  propulsion: EtatPropulsion
  al1: EtatAL1
}

export function creerModules(hasard: Hasard): EtatModules {
  return { propulsion: creerPropulsion(), al1: creerAL1(hasard) }
}

/** Codes des modules en avarie, dans l'ordre du tableau de voyants. */
export function modulesEnPanne(m: EtatModules): string[] {
  const liste: string[] = []
  if (ch1EnPanne(m.propulsion)) liste.push('CH-1')
  if (tu1EnPanne(m.propulsion)) liste.push('TU-1')
  if (al1EnPanne(m.al1)) liste.push('AL-1')
  return liste
}

/** Vrai si le levier L-A est abaissé (la fusée ralentit). */
export function levierAAbaisse(m: EtatModules): boolean {
  return !m.propulsion.levierAHaut
}

/** Évolution continue des modules pendant dt secondes, jusqu'à l'instant t. */
export function evoluerModules(m: EtatModules, t: number, dt: number): { modules: EtatModules; evenements: Evenement[] } {
  const p = evoluerPropulsion(m.propulsion, t, dt)
  return { modules: { ...m, propulsion: p.etat }, evenements: p.evenements }
}
