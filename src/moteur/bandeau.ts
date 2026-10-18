// Le bandeau d'alertes, en haut de l'écran, toujours visible (étape 2 de la feuille de route) : ce que le moteur dit
// de la situation de la capsule à l'instant t. Dans l'ordre : les missiles en approche, les pannes (étape 4), le trajet en cours, la mission
// acceptée (étape 3), et l'état calme (en orbite autour d'un astre) quand il n'y a pas de trajet. Les missiles
// viendront plus tard (étape 4).

import { periode } from './capsule'
import type { Contrat, Etape } from './contrats'
import { corps } from './corps'
import type { Jeu } from './jeu'
import type { NomModule } from '../donnees/modules'

export type LigneBandeau =
  /** Un missile alien en approche : temps avant l'impact (ms), intercepteurs qui restent. */
  | { genre: 'missile'; alien: string; reste: number; intercepteurs: number }
  /** Modules en panne (au moins un). */
  | { genre: 'panne'; modules: NomModule[] }
  /** En route : destination, instant d'arrivée (ms UTC) et temps restant (ms). */
  | { genre: 'trajet'; cible: string; arrivee: number; reste: number }
  /**
   * Mission acceptée : son étape actuelle, et où on en est — aller sur le lieu, y être (l'action peut commencer), ou
   * action en cours (fin à l'instant finAction).
   */
  | { genre: 'contrat'; contrat: Contrat; etape: Etape; numero: number; situation: 'aller' | 'sur-place' | 'action'; finAction: number | null }
  /** En orbite : autour de quoi, à quelle altitude (km ; pour un engin, la distance à lui) et en combien de temps (s). */
  | { genre: 'orbite'; centre: string; engin: boolean; altitude: number; tour: number | null }

/** Lignes du bandeau à l'instant t (ms UTC), de la plus urgente à la plus calme. */
export function lignesDuBandeau(jeu: Jeu, t: number): LigneBandeau[] {
  const m = jeu.mission
  const lignes: LigneBandeau[] = []
  // Les missiles d'abord : c'est le plus urgent (décompte).
  for (const mi of [...jeu.espace.missiles].sort((a, b) => a.impact - b.impact)) {
    lignes.push({ genre: 'missile', alien: mi.alien, reste: Math.max(0, mi.impact - t), intercepteurs: jeu.espace.intercepteurs })
  }
  if (jeu.pannes.length) lignes.push({ genre: 'panne', modules: [...jeu.pannes] })
  const enRoute = m.phase(t) === 'trajet' && m.plan
  if (enRoute) lignes.push({ genre: 'trajet', cible: m.plan!.cible, arrivee: m.plan!.arrivee, reste: m.plan!.arrivee - t })
  const etape = jeu.etapeActuelle()
  if (jeu.enCours && etape) {
    const fin = jeu.finAction()
    lignes.push({
      genre: 'contrat', contrat: jeu.enCours.contrat, etape, numero: jeu.enCours.etape,
      situation: fin !== null ? 'action' : jeu.surPlace(t) ? 'sur-place' : 'aller', finAction: fin,
    })
  }
  if (enRoute) return lignes
  const o = m.orbiteActuelle(t)
  if (!o) return lignes
  const c = corps(o.centre)
  const engin = !!c?.tailleM
  lignes.push({ genre: 'orbite', centre: o.centre, engin, altitude: engin ? o.rayon : o.rayon - (c?.rayon ?? 0), tour: engin ? null : periode(o) })
  return lignes
}
