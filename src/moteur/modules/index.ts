// Ensemble des modules de la fusée : leur état, qui est en avarie, et leur évolution à chaque pas de temps.
// Les modules achetés à l'Office s'ajouteront ici au fil de leur écriture.

import type { Hasard } from '../hasard'
import { al1EnPanne, creerAL1, type EtatAL1 } from './al1'
import { co1EnPanne, creerCO1, type EtatCO1 } from './co1'
import type { Evenement } from './commun'
import { creerHY1, hy1EnPanne, type EtatHY1 } from './hy1'
import { creerLP1, lp1EnPanne, type EtatLP1 } from './lp1'
import { creerPB1, pb1EnPanne, type EtatPB1 } from './pb1'
import { ch1EnPanne, creerPropulsion, evoluerPropulsion, tu1EnPanne, type EtatPropulsion } from './propulsion'
import { creerRE1, evoluerRE1, re1EnPanne, type EtatRE1 } from './re1'

export interface EtatModules {
  /** CH-1 et TU-1. */
  propulsion: EtatPropulsion
  al1: EtatAL1
  co1: EtatCO1
  pb1: EtatPB1
  lp1: EtatLP1
  hy1: EtatHY1
  re1: EtatRE1
}

export function creerModules(hasard: Hasard): EtatModules {
  return {
    propulsion: creerPropulsion(), al1: creerAL1(hasard), co1: creerCO1(), pb1: creerPB1(),
    lp1: creerLP1(), hy1: creerHY1(), re1: creerRE1(),
  }
}

/** Codes des modules en avarie, dans l'ordre du tableau de voyants. */
export function modulesEnPanne(m: EtatModules): string[] {
  const liste: string[] = []
  if (ch1EnPanne(m.propulsion)) liste.push('CH-1')
  if (tu1EnPanne(m.propulsion)) liste.push('TU-1')
  if (al1EnPanne(m.al1)) liste.push('AL-1')
  if (co1EnPanne(m.co1)) liste.push('CO-1')
  if (pb1EnPanne(m.pb1)) liste.push('PB-1')
  if (lp1EnPanne(m.lp1)) liste.push('LP-1')
  if (hy1EnPanne(m.hy1)) liste.push('HY-1')
  if (re1EnPanne(m.re1)) liste.push('RE-1')
  return liste
}

/** Vrai si le levier L-A est abaissé (la fusée ralentit). */
export function levierAAbaisse(m: EtatModules): boolean {
  return !m.propulsion.levierAHaut
}

/**
 * Évolution continue des modules pendant dt secondes, jusqu'à l'instant t. Seuls les modules installés évoluent
 * (le recycleur RE-1 ne s'use que s'il est à bord).
 */
export function evoluerModules(m: EtatModules, t: number, dt: number, installes: (code: string) => boolean):
  { modules: EtatModules; evenements: Evenement[] } {
  const evenements: Evenement[] = []
  const p = evoluerPropulsion(m.propulsion, t, dt)
  evenements.push(...p.evenements)
  let re1 = m.re1
  if (installes('RE-1')) {
    const r = evoluerRE1(m.re1, dt)
    re1 = r.etat
    evenements.push(...r.evenements)
  }
  return { modules: { ...m, propulsion: p.etat, re1 }, evenements }
}
