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
export function feuilleDeRoute(plan: Plan, enVol: boolean, t: number,
  contrat?: { contrat: Contrat; etape: number } | null, ici?: string | null): FeuilleDeRoute {
  const etape = contrat?.contrat.etapes[contrat.etape]
  const versLEtape = !!etape && etape.lieu === plan.cible
  const points: PointDeRoute[] = []
  // Une étape d'un contrat après la première (demande d'Adrien du 22/10/2026) : toute la route du contrat, ses étapes
  // déjà faites en tête, pas seulement le tronçon en cours. Rien d'autre que le contrat (Adrien, 22/10/2026 : chaque
  // contrat a sa frise, chaque quête la sienne ; d'où l'on venait avant le contrat n'en fait pas partie).
  if (versLEtape && contrat!.etape > 0) {
    for (const e of contrat!.contrat.etapes.slice(0, contrat!.etape)) points.push({ nom: e.lieu, action: e.action, passe: true, but: false })
    // Le tronçon en cours part de la dernière étape faite (son heure de départ, en vol).
    if (enVol) points[points.length - 1].quand = plan.depart
    else points[points.length - 1].passe = true
  } else {
    points.push({ nom: (enVol ? plan.origine : ici ?? plan.origine) ?? 'plein espace', quand: enVol ? plan.depart : undefined, passe: enVol, but: false })
  }
  const debut = points.length - 1
  points.push({ nom: plan.cible, quand: plan.arrivee, passe: false, but: true, ...(versLEtape ? { action: etape!.action } : {}) })
  if (versLEtape) for (const e of contrat!.contrat.etapes.slice(contrat!.etape + 1)) points.push({ nom: e.lieu, action: e.action, passe: false, but: false })
  const f = enVol ? Math.min(1, Math.max(0, avancement(plan, t))) : 0
  return { points, position: (debut + f) / (points.length - 1) }
}
