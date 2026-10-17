// Le bandeau d'alertes, en haut de l'écran, toujours visible (étape 2 de la feuille de route) : ce que le moteur dit
// de la situation de la capsule à l'instant t. Pour l'instant : le trajet en cours, ou, quand il ne se passe rien,
// l'état calme (en orbite autour d'un astre). Les missiles, pannes et ralentissements viendront à l'étape 4.

import { periode } from './capsule'
import { corps } from './corps'
import type { Mission } from './mission'

export type LigneBandeau =
  /** En route : destination, instant d'arrivée (ms UTC) et temps restant (ms). */
  | { genre: 'trajet'; cible: string; arrivee: number; reste: number }
  /** En orbite : autour de quoi, à quelle altitude (km ; pour un engin, la distance à lui) et en combien de temps (s). */
  | { genre: 'orbite'; centre: string; engin: boolean; altitude: number; tour: number | null }

/** Lignes du bandeau à l'instant t (ms UTC), de la plus urgente à la plus calme. */
export function lignesDuBandeau(m: Mission, t: number): LigneBandeau[] {
  if (m.phase(t) === 'trajet' && m.plan) return [{ genre: 'trajet', cible: m.plan.cible, arrivee: m.plan.arrivee, reste: m.plan.arrivee - t }]
  const o = m.orbiteActuelle(t)
  if (!o) return []
  const c = corps(o.centre)
  const engin = !!c?.tailleM
  return [{ genre: 'orbite', centre: o.centre, engin, altitude: engin ? o.rayon : o.rayon - (c?.rayon ?? 0), tour: engin ? null : periode(o) }]
}
