// Sauvegarde de la partie (étape 2 de la feuille de route) : l'état du jeu mis en données simples (JSON), et l'inverse.
// Le moteur ne touche pas au téléphone : c'est la page qui range ces données dans la mémoire du navigateur.
// Le jeu est en temps réel : on enregistre le trajet lui-même (départ, arrivée, points), pas une position ; un trajet
// continue donc pendant que l'application est fermée, et la capsule est arrivée si l'heure d'arrivée est passée.

import { TABLEAUX } from '../donnees/tableaux'
import type { OrbiteCirculaire } from './capsule'
import type { Contrat } from './contrats'
import { corps } from './corps'
import { Jeu, type ContratEnCours } from './jeu'
import type { Plan } from './mission'
import { MODULES, type NomModule } from '../donnees/modules'
import { numeroDeSerie } from './jeu'
import type { EtatReparation } from './reparation'
import { BLOCS, ficheBloc, type NomAppareil } from '../donnees/blocs'
import { MAISONS, type Maison } from '../donnees/maisons'
import { MARCHANDISES } from '../donnees/marche'
import { pseudoValide } from './profil'
import type { MessageEnvoye } from './messages'
import { appliquerGenerations, type EtatEspace } from './espace'
import { monolithe, type EtatMonolithes } from './monolithes'
import { ENERGIE_TOTALE, MAX_PAR_SYSTEME, type Energie } from '../donnees/combat'

/**
 * Version du format. 2 : les missions (étape 3) ; 3 : les pannes (étape 4) ; 4 : le numéro de série et les réparations
 * en cours sur le panneau ; 5 : les blocs et leurs modules en défaut. Les sauvegardes des versions précédentes sont encore lues ; une version inconnue est ignorée.
 */
export const VERSION_SAUVEGARDE = 5

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
  /** Pannes : modules en panne, arrivée du dernier trajet dont l'usure a été tirée. */
  pannes: NomModule[]
  usureJusqua: number
  /** Numéro de série de la capsule et réparations commencées sur le panneau. */
  numeroSerie: string
  reparations: Partial<Record<NomAppareil, EtatReparation>>
  /** Modules du panneau en défaut, pour chaque bloc en panne. */
  defauts: Partial<Record<NomModule, NomAppareil[]>>
  /** Maison du joueur (absente : neutre). */
  maison?: Maison | null
  /** Répartition de l'énergie (absente : celle du départ). */
  energie?: Energie
  /** La soute (absente : vide) et le carnet de bord (absent : vierge). */
  soute?: Record<string, number>
  carnet?: Jeu['carnet']
  /** Le pseudo (absent : celui du départ). */
  pseudo?: string
  /** Les messages envoyés, et ce qui a été lu (absents : rien). */
  envoyes?: MessageEnvoye[]
  lus?: Record<string, number>
  /** L'espace : épaves vidées, chasseurs vaincus, missiles, intercepteurs (absent : tout neuf). */
  espace?: EtatEspace
  /** Les monolithes ramassés et les échos (absent : aucun). */
  monolithes?: EtatMonolithes
}

export function sauvegarder(jeu: Jeu, t: number): Sauvegarde {
  return {
    version: VERSION_SAUVEGARDE, enregistreLe: t, credits: jeu.credits, niveauMoteur: jeu.niveauMoteur,
    orbite: jeu.mission.orbite, plan: jeu.mission.plan,
    graine: jeu.graine, prochainId: jeu.prochainId, proposes: jeu.proposes, enCours: jeu.enCours,
    pannes: jeu.pannes, usureJusqua: jeu.usureJusqua,
    numeroSerie: jeu.numeroSerie, reparations: jeu.reparations, defauts: jeu.defauts,
    maison: jeu.maison, energie: jeu.energie, soute: jeu.soute, carnet: jeu.carnet, pseudo: jeu.pseudo, envoyes: jeu.envoyes, lus: jeu.lus, espace: jeu.espace,
    monolithes: jeu.monolithes,
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

const ACTIONS = ['nettoyer', 'charger', 'livrer', 'reparer', 'abattre']
function contratValide(c: unknown): c is Contrat {
  const v = c as Contrat
  return !!v && nombre(v.id) && ['nettoyer', 'livrer', 'depanner', 'chasser'].includes(v.genre) && nombre(v.recompense)
    && Array.isArray(v.etapes) && v.etapes.length >= 1 && v.etapes.every((e) => !!e && astre(e.lieu) && ACTIONS.includes(e.action))
}
function enCoursValide(e: unknown): e is ContratEnCours {
  const v = e as ContratEnCours
  return !!v && contratValide(v.contrat) && Number.isInteger(v.etape) && v.etape >= 0 && v.etape < v.contrat.etapes.length
    && (v.debutAction === null || nombre(v.debutAction)) && (v.dureeAction === undefined || nombre(v.dureeAction))
}

/** Reconstruit le jeu à partir d'une sauvegarde ; null si elle est illisible ou d'un autre format. */
export function restaurer(s: unknown): Jeu | null {
  const v = s as Sauvegarde
  if (!v || ![1, 2, 3, 4, VERSION_SAUVEGARDE].includes(v.version) || !nombre(v.credits) || !nombre(v.niveauMoteur)) return null
  if (!orbiteValide(v.orbite) || (v.plan !== null && !planValide(v.plan))) return null
  const avecMissions = v.version >= 2
  if (avecMissions && (!nombre(v.graine) || !nombre(v.prochainId) || !Array.isArray(v.proposes) || !v.proposes.every(contratValide)
    || (v.enCours !== null && !enCoursValide(v.enCours)))) return null
  const avecPannes = v.version >= 3
  const avecPanneau = v.version >= 4
  const avecBlocs = v.version >= 5
  const reparationValide = (r: EtatReparation) => !!r && [r.graine, r.tour, r.tours, r.isoler, r.blocageJusqua].every(nombre)
    && Array.isArray(r.coupes) && r.coupes.every(nombre) && (r.reglage === undefined || nombre(r.reglage))
  // Version 4 : une seule réparation possible, celle de l'Énergie (devenue le bornier du bloc Énergie).
  const cles = avecBlocs ? BLOCS.flatMap((b) => b.appareils as readonly string[]) : ['energie']
  if (avecPanneau && (typeof v.numeroSerie !== 'string' || !/^[A-Z]{2}-[1-9][A-Z][0-9]$/.test(v.numeroSerie)
    || typeof v.reparations !== 'object' || v.reparations === null
    || !Object.entries(v.reparations).every(([m, r]) => cles.includes(m) && reparationValide(r as EtatReparation)))) return null
  if (avecBlocs && (typeof v.defauts !== 'object' || v.defauts === null || !Object.entries(v.defauts).every(([m, l]) =>
    MODULES.some((f) => f.nom === m) && Array.isArray(l) && l.every((a) => ficheBloc(m as NomModule).appareils.includes(a))))) return null
  if (avecPannes && (!Array.isArray(v.pannes) || !v.pannes.every((m) => MODULES.some((f) => f.nom === m)) || !nombre(v.usureJusqua))) return null
  if (v.maison != null && !MAISONS.some((m) => m.maison === v.maison)) return null
  const en = v.energie
  if (en !== undefined && (!en || ![en.boucliers, en.armes, en.moteurs].every((x) => Number.isInteger(x) && x >= 0 && x <= MAX_PAR_SYSTEME)
    || en.boucliers + en.armes + en.moteurs > ENERGIE_TOTALE)) return null
  const jeu = new Jeu()
  if (en) jeu.energie = { boucliers: en.boucliers, armes: en.armes, moteurs: en.moteurs }
  if (v.soute !== undefined) {
    if (!v.soute || typeof v.soute !== 'object' || !Object.entries(v.soute).every(([m, q]) => MARCHANDISES.some((f) => f.nom === m) && nombre(q) && q >= 0)) return null
    jeu.soute = { ...v.soute }
  }
  if (v.pseudo !== undefined) {
    if (typeof v.pseudo !== 'string' || !pseudoValide(v.pseudo)) return null
    jeu.pseudo = v.pseudo
  }
  if (v.envoyes !== undefined) {
    if (!Array.isArray(v.envoyes) || !v.envoyes.every((m) => !!m && nombre(m.id) && nombre(m.envoye) && typeof m.canal === 'string' && typeof m.texte === 'string')) return null
    jeu.envoyes = v.envoyes.map((m) => ({ id: m.id, canal: m.canal, texte: m.texte.slice(0, 200), envoye: m.envoye }))
  }
  if (v.lus !== undefined) {
    if (!v.lus || typeof v.lus !== 'object' || !Object.values(v.lus).every(nombre)) return null
    jeu.lus = { ...v.lus }
  }
  const es = v.espace
  if (es !== undefined) {
    const dates = (r: unknown) => !!r && typeof r === 'object' && Object.values(r as object).every(nombre)
    if (!es || !dates(es.aliensVaincus) || !Array.isArray(es.missiles)
      || !es.missiles.every((m) => !!m && [m.id, m.lance, m.impact].every(nombre) && typeof m.alien === 'string' && !!corps(m.alien))
      || ![es.intercepteurs, es.rechargeDepuis, es.tirsJusqua].every(nombre)) return null
    jeu.espace = { aliensVaincus: { ...es.aliensVaincus }, generations: dates(es.generations) ? { ...es.generations } : {},
      missiles: es.missiles.map((m) => ({ ...m })), intercepteurs: es.intercepteurs, rechargeDepuis: es.rechargeDepuis, tirsJusqua: es.tirsJusqua }
    appliquerGenerations(jeu.espace)
  }
  const mo = v.monolithes
  if (mo !== undefined) {
    const point = (p: unknown) => !!p && nombre((p as { x: unknown }).x) && nombre((p as { y: unknown }).y)
    if (!mo || !nombre(mo.dernierPing) || !Array.isArray(mo.trouves) || !mo.trouves.every((n) => nombre(n) && !!monolithe(n))
      || !Array.isArray(mo.echos) || !mo.echos.every((x) => !!x && !!monolithe(x.monolithe) && point(x.centre) && [x.rayon, x.envoye, x.retour].every(nombre))) return null
    const dates = mo.ramassesLe && typeof mo.ramassesLe === 'object' ? mo.ramassesLe : {}
    const ramassesLe = Object.fromEntries(Object.entries(dates).filter(([n, d]) => !!monolithe(Number(n)) && nombre(d)).map(([n, d]) => [Number(n), d as number]))
    jeu.monolithes = { trouves: [...new Set(mo.trouves)], ramassesLe, dernierPing: mo.dernierPing,
      echos: mo.echos.map((x) => ({ monolithe: x.monolithe, centre: { x: x.centre.x, y: x.centre.y }, rayon: x.rayon, envoye: x.envoye, retour: x.retour, ...(x.vu === true ? { vu: true } : {}) })) }
  }
  const c = v.carnet
  if (c !== undefined) {
    if (!c || !nombre(c.credits) || !nombre(c.objetsTries) || !c.missions || !MAISONS.every((m) => nombre(c.missions[m.maison]))) return null
    jeu.carnet = { missions: { ...c.missions }, credits: c.credits, objetsTries: c.objetsTries }
  }
  jeu.maison = v.maison ?? null
  jeu.credits = v.credits
  jeu.niveauMoteur = v.niveauMoteur
  jeu.mission.orbite = v.orbite
  jeu.mission.plan = v.plan
  if (avecMissions) {
    jeu.graine = v.graine
    jeu.prochainId = v.prochainId
    // Les missions d'avant les tableaux par système (sans système, ou d'une lune) sont oubliées : ils se remplissent à neuf.
    jeu.proposes = v.proposes.filter((c) => typeof c.tableau === 'string' && TABLEAUX.some((x) => x.lieu === c.tableau))
    jeu.enCours = v.enCours
  }
  if (avecPannes) {
    jeu.pannes = [...v.pannes]
    jeu.usureJusqua = v.usureJusqua
  } else jeu.usureJusqua = v.plan?.arrivee ?? 0 // pas de panne rétroactive sur le dernier trajet d'une vieille partie
  if (avecPanneau) jeu.numeroSerie = v.numeroSerie
  else jeu.numeroSerie = numeroDeSerie(jeu.graine)
  if (avecBlocs) {
    jeu.reparations = v.reparations
    jeu.defauts = v.defauts
  } else {
    // Avant les blocs : on tire les modules en défaut des blocs en panne ; l'Énergie garde sa réparation en cours.
    for (const m of jeu.pannes) jeu.tirerDefauts(m)
    const energie = (v.reparations as Record<string, EtatReparation> | undefined)?.energie
    if (avecPanneau && energie && jeu.enPanne('energie')) {
      jeu.defauts.energie = ['bornier']
      jeu.reparations.bornier = energie
    }
  }
  return jeu
}
