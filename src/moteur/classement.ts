// Points de commissionnaire. On relève chaque jour (UTC) les compteurs de la partie ; les points d'une période sont
// ceux d'aujourd'hui moins ceux du relevé du début de la période.

import { BAREME, JOURS_DE_RELEVES } from '../donnees/classement'
import type { EtatPartie } from './etat'

export interface Compteurs {
  contrats: number
  avaries: number
  visites: number
  trophees: number
  km: number
  trouvailles: number
}

export const AUCUN: Compteurs = { contrats: 0, avaries: 0, visites: 0, trophees: 0, km: 0, trouvailles: 0 }

/** Compteurs actuels de la partie. */
export function compteurs(etat: EtatPartie): Compteurs {
  return {
    contrats: etat.stats.contrats,
    avaries: etat.stats.pannes,
    visites: etat.trophees.filter((id) => id.startsWith('astre:') || id.startsWith('engin:')).length,
    trophees: etat.trophees.length,
    km: etat.fusee.distanceParcourue,
    trouvailles: etat.chasse.trouvailles.length,
  }
}

/** Détail des points : nombre et points de chaque ligne du barème. */
export function detailPoints(c: Compteurs): { cle: keyof typeof BAREME; nombre: number; points: number }[] {
  const millions = Math.floor(c.km / 1e6)
  return [
    { cle: 'contrat', nombre: c.contrats, points: c.contrats * BAREME.contrat },
    { cle: 'avarie', nombre: c.avaries, points: c.avaries * BAREME.avarie },
    { cle: 'visite', nombre: c.visites, points: c.visites * BAREME.visite },
    { cle: 'trophee', nombre: c.trophees, points: c.trophees * BAREME.trophee },
    { cle: 'millionKm', nombre: millions, points: millions * BAREME.millionKm },
    { cle: 'visiteur', nombre: c.trouvailles, points: c.trouvailles * BAREME.visiteur },
  ]
}

export function points(c: Compteurs): number {
  return detailPoints(c).reduce((s, l) => s + l.points, 0)
}

const jour = (t: number) => new Date(t).toISOString().slice(0, 10)

/** Relevé du jour : la première fois qu'on passe un jour donné, on note les compteurs (40 jours gardés). */
export function releverCompteurs(etat: EtatPartie): EtatPartie {
  const cle = jour(etat.vu)
  if (etat.releves?.[cle]) return etat
  const gardes = Object.entries(etat.releves ?? {}).sort(([a], [b]) => a.localeCompare(b)).slice(-(JOURS_DE_RELEVES - 1))
  return { ...etat, releves: { ...Object.fromEntries(gardes), [cle]: compteurs(etat) } }
}

/** Compteurs gagnés depuis l'instant debut (début de semaine ou de mois ; -Infinity pour le total). */
export function compteursDepuis(etat: EtatPartie, debut: number): Compteurs {
  const maintenant = compteurs(etat)
  if (!Number.isFinite(debut) || etat.creeLe >= debut) return maintenant
  // Le premier relevé du début de la période (ou juste après, si la partie n'était pas ouverte ce jour-là).
  const depart = jour(debut)
  const base = Object.entries(etat.releves ?? {}).filter(([j]) => j >= depart).sort(([a], [b]) => a.localeCompare(b))[0]?.[1] ?? maintenant
  const k = Object.keys(AUCUN) as (keyof Compteurs)[]
  return Object.fromEntries(k.map((n) => [n, Math.max(0, maintenant[n] - base[n])])) as unknown as Compteurs
}
