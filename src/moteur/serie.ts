// Numéro de série de la fusée, au format LLC-CCL (L = lettre, C = chiffre), par exemple KE4-71B.
// Il est tiré une seule fois, à la création de la fusée, et sert d'indice dans plusieurs modules.

import { CHIFFRES_SERIE, LETTRES_SERIE, VOYELLES } from '../donnees/fusee'
import { choisirAuHasard, type Hasard } from './hasard'

const FORMAT_SERIE = new RegExp(`^[${LETTRES_SERIE}]{2}[0-9]-[0-9]{2}[${LETTRES_SERIE}]$`)

/** Tire un nouveau numéro de série. */
export function genererSerie(hasard: Hasard): string {
  const lettre = () => choisirAuHasard(hasard, [...LETTRES_SERIE])
  const chiffre = () => choisirAuHasard(hasard, [...CHIFFRES_SERIE])
  // Même ordre de tirage que le prototype : L, L, C, puis C, C, L.
  const debut = lettre() + lettre() + chiffre()
  const fin = chiffre() + chiffre() + lettre()
  return `${debut}-${fin}`
}

/** Vrai si le texte respecte le format LLC-CCL. */
export function estSerieValide(serie: string): boolean {
  return FORMAT_SERIE.test(serie)
}

/** Le dernier chiffre lu dans le numéro (KE4-71B → 1). */
export function dernierChiffre(serie: string): number {
  const chiffres = serie.match(/[0-9]/g)
  if (!chiffres) throw new Error(`Numéro de série sans chiffre : ${serie}`)
  return Number(chiffres[chiffres.length - 1])
}

/** Vrai si le dernier chiffre du numéro est pair. */
export function dernierChiffrePair(serie: string): boolean {
  return dernierChiffre(serie) % 2 === 0
}

/** Vrai si le numéro commence par une voyelle (A, E, I, O, U ou Y). */
export function commenceParVoyelle(serie: string): boolean {
  return VOYELLES.includes(serie.charAt(0))
}
