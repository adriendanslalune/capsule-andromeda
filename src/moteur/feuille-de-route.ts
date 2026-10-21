// La feuille de route (demande d'Adrien du 21/10/2026) : une frise du départ à l'arrivée, avec les étapes du contrat
// qui suivent, et la capsule dessus en temps réel. Les points sont à égale distance sur la frise (à l'échelle, une
// étape courte serait collée au départ) ; la capsule avance au vrai pourcentage de son tronçon.

import type { Action, Contrat } from './contrats'
import { avancement, type Plan } from './mission'

export interface PointDeRoute {
  nom: string
  /** L'action du contrat qui s'y fait (harponner, livrer…), s'il y en a une. */
  action?: Action
  /** Départ ou arrivée prévue (ms UTC) ; absente pour les étapes d'après (leur heure dépend du trajet d'avant). */
  quand?: number
  /** Déjà passé (le départ, en vol). */
  passe: boolean
  /** La destination du trajet. */
  but: boolean
}

export interface FeuilleDeRoute {
  points: PointDeRoute[]
  /** Place de la capsule sur la frise, de 0 (départ) à 1 (dernier point). */
  position: number
}

/**
 * La feuille de route d'un trajet (en cours, ou prévu si enVol est faux). contrat : le contrat en cours et le numéro
 * de son étape actuelle ; si le trajet y mène, les étapes suivantes s'ajoutent au bout de la frise.
 */
export function feuilleDeRoute(plan: Plan, enVol: boolean, t: number, contrat?: { contrat: Contrat; etape: number } | null,
  ici?: string | null): FeuilleDeRoute {
  const etape = contrat?.contrat.etapes[contrat.etape]
  const versLEtape = !!etape && etape.lieu === plan.cible
  const points: PointDeRoute[] = [
    { nom: (enVol ? plan.origine : ici ?? plan.origine) ?? 'plein espace', quand: enVol ? plan.depart : undefined, passe: enVol, but: false },
    { nom: plan.cible, quand: plan.arrivee, passe: false, but: true, ...(versLEtape ? { action: etape!.action } : {}) },
  ]
  if (versLEtape) for (const e of contrat!.contrat.etapes.slice(contrat!.etape + 1)) points.push({ nom: e.lieu, action: e.action, passe: false, but: false })
  const position = enVol ? Math.min(1, Math.max(0, avancement(plan, t))) / (points.length - 1) : 0
  return { points, position }
}
