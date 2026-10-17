// Sauvegarde de la partie (étape 2 de la feuille de route) : l'état du jeu mis en données simples (JSON), et l'inverse.
// Le moteur ne touche pas au téléphone : c'est la page qui range ces données dans la mémoire du navigateur.
// Le jeu est en temps réel : on enregistre le trajet lui-même (départ, arrivée, points), pas une position ; un trajet
// continue donc pendant que l'application est fermée, et la capsule est arrivée si l'heure d'arrivée est passée.

import type { OrbiteCirculaire } from './capsule'
import type { Contrat } from './contrats'
import { corps } from './corps'
import { Jeu, type ContratEnCours } from './jeu'
import type { Plan } from './mission'

/**
 * Version du format. 2 : les missions (étape 3). Une sauvegarde de version 1 (sans missions) est encore lue ; une
 * version inconnue est ignorée.
 */
export const VERSION_SAUVEGARDE = 2

export interface Sauvegarde {
  version: number
  /** Instant de l'enregistrement (ms UTC). */
  enregistreLe: number
  credits: number
  niveauMoteur: number
  orbite: OrbiteCirculaire
  plan: Plan | null
  /** Missions : graine du tirage, numéro de la prochaine, missions proposées, mission acceptée. */
  graine: number
  prochainId: number
  proposes: Contrat[]
  enCours: ContratEnCours | null
}

export function sauvegarder(jeu: Jeu, t: number): Sauvegarde {
  return {
    version: VERSION_SAUVEGARDE, enregistreLe: t, credits: jeu.credits, niveauMoteur: jeu.niveauMoteur,
    orbite: jeu.mission.orbite, plan: jeu.mission.plan,
    graine: jeu.graine, prochainId: jeu.prochainId, proposes: jeu.proposes, enCours: jeu.enCours,
  }
}

const nombre = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const astre = (x: unknown): x is string => typeof x === 'string' && (x === 'Soleil' || !!corps(x))

function orbiteValide(o: unknown): o is OrbiteCirculaire {
  const v = o as OrbiteCirculaire
  return !!v && astre(v.centre) && [v.mu, v.rayon, v.inclinaison, v.noeud, v.epoque, v.phase].every(nombre)
}

function planValide(p: unknown): p is Plan {
  const v = p as Plan
  const point = (q: { ancre: unknown; rel: { x: unknown; y: unknown; z: unknown } }) =>
    !!q && astre(q.ancre) && !!q.rel && [q.rel.x, q.rel.y, q.rel.z].every(nombre)
  return !!v && astre(v.cible) && [v.depart, v.arrivee, v.vitesse].every(nombre) && v.arrivee > v.depart
    && Array.isArray(v.cles) && v.cles.length >= 2 && v.cles.every(point)
    && Array.isArray(v.points) && v.points.length >= 2 && v.points.every(point)
}

const ACTIONS = ['nettoyer', 'charger', 'livrer', 'reparer']
function contratValide(c: unknown): c is Contrat {
  const v = c as Contrat
  return !!v && nombre(v.id) && ['nettoyer', 'livrer', 'depanner'].includes(v.genre) && nombre(v.recompense)
    && Array.isArray(v.etapes) && v.etapes.length >= 1 && v.etapes.every((e) => !!e && astre(e.lieu) && ACTIONS.includes(e.action))
}
function enCoursValide(e: unknown): e is ContratEnCours {
  const v = e as ContratEnCours
  return !!v && contratValide(v.contrat) && Number.isInteger(v.etape) && v.etape >= 0 && v.etape < v.contrat.etapes.length
    && (v.debutAction === null || nombre(v.debutAction))
}

/** Reconstruit le jeu à partir d'une sauvegarde ; null si elle est illisible ou d'un autre format. */
export function restaurer(s: unknown): Jeu | null {
  const v = s as Sauvegarde
  if (!v || (v.version !== 1 && v.version !== VERSION_SAUVEGARDE) || !nombre(v.credits) || !nombre(v.niveauMoteur)) return null
  if (!orbiteValide(v.orbite) || (v.plan !== null && !planValide(v.plan))) return null
  const avecMissions = v.version >= 2
  if (avecMissions && (!nombre(v.graine) || !nombre(v.prochainId) || !Array.isArray(v.proposes) || !v.proposes.every(contratValide)
    || (v.enCours !== null && !enCoursValide(v.enCours)))) return null
  const jeu = new Jeu()
  jeu.credits = v.credits
  jeu.niveauMoteur = v.niveauMoteur
  jeu.mission.orbite = v.orbite
  jeu.mission.plan = v.plan
  if (avecMissions) {
    jeu.graine = v.graine
    jeu.prochainId = v.prochainId
    jeu.proposes = v.proposes
    jeu.enCours = v.enCours
  }
  return jeu
}
