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
import { PNJS, QUETES } from '../donnees/quetes'
import { rattraperInstruments } from './quetes'
import { COMPAGNIES } from '../donnees/bourse'
import { NOMBRE_VOIX } from '../donnees/radio'
import type { OrdreBourse, Portefeuille } from './bourse'
import { MAISONS, type Maison } from '../donnees/maisons'
import { MARCHANDISES } from '../donnees/marche'
import { pseudoValide } from './profil'
import { zone } from './zones'
import type { MessageEnvoye } from './messages'
import { appliquerGenerations, type EtatEspace } from './espace'
import { monolithe, type EtatMonolithes } from './monolithes'
import { ENERGIE_TOTALE, MAX_PAR_SYSTEME, NIVEAU_ARMEMENT_MAX, type Energie } from '../donnees/combat'
import { statsNeuves, type Stats } from './trophees'
import { TROPHEES } from '../donnees/trophees'

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
  /** Les Maisons qui ont déjà proposé de les rejoindre (absent : aucune). */
  invitations?: Maison[]
  /** Les messages des bots après un événement (absent : aucun). */
  lettres?: Jeu['lettres']
  /** Les Disparus : échos, sondes retrouvées, celle qu'on cherche (absent : rien). */
  disparus?: Jeu['disparus']
  quetes?: Jeu['quetes']
  queteSuivie?: string | null
  epinglees?: string[]
  /** Les messages radio des PNJ (absent : aucun). */
  radioPnj?: Jeu['radioPnj']
  /** La présentation du monde est vue (absent : une partie d'avant, qui n'en avait pas besoin). */
  presentation?: boolean
  /** Les bulles d'aide déjà vues (absent : aucune). */
  /** Les instruments installés (absent : une partie d'avant le 23/10/2026, qui les a tous). */
  installes?: Jeu['installes']
  /** Ancien format (avant le 21/10/2026) : les zones libérées seules. */
  zonesLiberees?: string[]
  /** L'expérience du capitaine, et le commerce du jour (absents : 0). */
  xp?: number
  commerce?: { jour: number; credits: number; xp: number }
  /** L'armement acheté (absent : tout au niveau 1). */
  armement?: Record<string, number>
  /** Les zones visitées (absent : la Terre seule). */
  visites?: string[]
  /** La libération des zones : points de résistance et zones libérées. */
  zones?: { points: Record<string, number>; liberees: string[] }
  /** Répartition de l'énergie (absente : celle du départ). */
  energie?: Energie
  /** La soute (absente : vide) et le carnet de bord (absent : vierge). */
  soute?: Record<string, number>
  carnet?: Jeu['carnet']
  /** Le pseudo (absent : celui du départ). */
  pseudo?: string
  /** Le titre secret Icare : date du premier rêve du Soleil (absent : pas encore). */
  icare?: number | null
  /** Les messages envoyés, et ce qui a été lu (absents : rien). */
  envoyes?: MessageEnvoye[]
  lus?: Record<string, number>
  /** L'espace : épaves vidées, chasseurs vaincus, missiles, intercepteurs (absent : tout neuf). */
  espace?: EtatEspace
  /** Les monolithes ramassés et les échos (absent : aucun). */
  monolithes?: EtatMonolithes
  /** La Bourse : actions et ordres (absente : rien). */
  bourse?: Portefeuille
  /** La radio : fréquence et voix enregistrées (absente : neuve). */
  radio?: { frequence: number; captees: number[]; captureesLe: Record<number, number> }
  /** Les trophées : leurs compteurs, ceux gagnés (numéro → date) (absents : rien). */
  stats?: Stats
  trophees?: Record<number, number>
}

export function sauvegarder(jeu: Jeu, t: number): Sauvegarde {
  return {
    version: VERSION_SAUVEGARDE, enregistreLe: t, credits: jeu.credits, niveauMoteur: jeu.niveauMoteur,
    orbite: jeu.mission.orbite, plan: jeu.mission.plan,
    graine: jeu.graine, prochainId: jeu.prochainId, proposes: jeu.proposes, enCours: jeu.enCours,
    pannes: jeu.pannes, usureJusqua: jeu.usureJusqua,
    numeroSerie: jeu.numeroSerie, reparations: jeu.reparations, defauts: jeu.defauts,
    maison: jeu.maison, invitations: jeu.invitations, lettres: jeu.lettres, disparus: jeu.disparus, quetes: jeu.quetes, epinglees: jeu.epinglees, radioPnj: jeu.radioPnj, installes: jeu.installes, presentation: jeu.presentation, zones: jeu.zones, visites: jeu.visites, armement: jeu.armement, xp: jeu.xp, commerce: jeu.commerce, energie: jeu.energie, soute: jeu.soute, carnet: jeu.carnet, pseudo: jeu.pseudo, icare: jeu.icare, envoyes: jeu.envoyes, lus: jeu.lus, espace: jeu.espace,
    monolithes: jeu.monolithes, bourse: jeu.bourse, radio: { frequence: jeu.radio.frequence, captees: jeu.radio.captees, captureesLe: jeu.radio.captureesLe },
    stats: jeu.stats, trophees: jeu.trophees,
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

const ACTIONS = ['nettoyer', 'harponner', 'larguer', 'abattre', 'rejoindre', 'escorter', 'reparer', 'charger', 'livrer']
function contratValide(c: unknown): c is Contrat {
  const v = c as Contrat
  return !!v && nombre(v.id) && ['nettoyer', 'remorquer', 'chasser', 'escorter', 'depanner', 'livrer'].includes(v.genre) && nombre(v.recompense)
    && Array.isArray(v.etapes) && v.etapes.length >= 1 && v.etapes.every((e) => !!e && astre(e.lieu) && ACTIONS.includes(e.action))
}
function enCoursValide(e: unknown): e is ContratEnCours {
  const v = e as ContratEnCours
  return !!v && contratValide(v.contrat) && Number.isInteger(v.etape) && v.etape >= 0 && v.etape < v.contrat.etapes.length
    && (v.debutAction === null || nombre(v.debutAction)) && (v.dureeAction === undefined || nombre(v.dureeAction))
}

/** Reconstruit le jeu à partir d'une sauvegarde ; null si elle est illisible ou d'un autre format. */
export function restaurer(s: unknown): Jeu | null {
  // Les lieux renommés le 23/10/2026 (validé par Adrien) : les contrats, trajets et orbites qui les visaient suivent.
  s = renommerLieux(s)
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
  // Les Commerçants sont devenus les Ingénieurs (décision d'Adrien du 18/10/2026).
  if ((v.maison as string | null | undefined) === 'commercants') v.maison = 'ingenieurs'
  const ancienCarnet = v.carnet?.missions as Record<string, number> | undefined
  if (ancienCarnet && 'commercants' in ancienCarnet) { ancienCarnet.ingenieurs = ancienCarnet.commercants; delete ancienCarnet.commercants }
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
  if (nombre(v.icare)) jeu.icare = v.icare
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
    // Les épaves à quai et recyclées (absentes d'une ancienne sauvegarde : aucune).
    if (es.aQuai && typeof es.aQuai === 'object') {
      jeu.espace.aQuai = Object.fromEntries(Object.entries(es.aQuai).filter(([nom, q]) => !!corps(nom) && !!q && typeof q.station === 'string' && !!corps(q.station) && nombre(q.depuis)).map(([nom, q]) => [nom, { station: q.station, depuis: q.depuis }]))
    }
    if (dates(es.generationsEpaves)) jeu.espace.generationsEpaves = { ...es.generationsEpaves }
    if (dates(es.reperes)) jeu.espace.reperes = { ...es.reperes }
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
  if (Array.isArray(v.lettres)) jeu.lettres = v.lettres.filter((x) => !!x && nombre(x.id) && typeof x.bot === 'string' && typeof x.texte === 'string' && nombre(x.envoye)).map((x) => ({ ...x }))
  const di = v.disparus
  if (di && typeof di === 'object') {
    const dates = (r: unknown) => (r && typeof r === 'object' ? Object.fromEntries(Object.entries(r as object).filter(([k, x]) => Number.isInteger(Number(k)) && nombre(x))) : {}) as Record<number, number>
    jeu.disparus = { echos: dates(di.echos), trouves: dates(di.trouves), suivi: Number.isInteger(di.suivi) ? di.suivi : null }
  }
  // Les quêtes : seulement celles qui existent encore (le premier jet de la Lune peut changer).
  if (v.quetes && typeof v.quetes === 'object') {
    for (const [id, e] of Object.entries(v.quetes)) {
      if (QUETES.some((q) => q.id === id) && e && nombre(e.etape) && nombre(e.compte) && nombre(e.debut) && (e.fin === null || nombre(e.fin))) {
        jeu.quetes[id] = { etape: e.etape, compte: e.compte, debut: e.debut, fin: e.fin, ...(nombre(e.depuis) ? { depuis: e.depuis } : {}) }
      }
    }
  }
  if (Array.isArray(v.radioPnj)) {
    jeu.radioPnj = v.radioPnj.filter((r) => !!r && nombre(r.id) && PNJS.some((p) => p.id === r.pnj) && Array.isArray(r.texte)
      && r.texte.every((x) => typeof x === 'string') && nombre(r.envoye) && nombre(r.arrivee)).map((r) => ({ id: r.id, pnj: r.pnj, texte: [...r.texte], envoye: r.envoye, arrivee: r.arrivee, lu: !!r.lu, ...(typeof r.quete === 'string' ? { quete: r.quete } : {}) }))
  }
  // Les instruments se déduisent des quêtes (les capteurs du Veilleur : Adrien, 24/10/2026) ; la liste sauvegardée n'est plus lue.
  if (v.presentation === false) jeu.presentation = false
  // La Bourse : seulement les compagnies qui existent, des nombres valides.
  if (v.bourse && typeof v.bourse === 'object') {
    const connue = (id: unknown) => COMPAGNIES.some((x) => x.id === id)
    const ordreValide = (o: OrdreBourse) => !!o && connue(o.compagnie) && (o.sens === 'acheter' || o.sens === 'vendre')
      && [o.id, o.credits, o.actions, o.cout, o.envoye, o.arrivee].every(nombre) && (o.prix === null || nombre(o.prix))
      && (o.confirme === null || nombre(o.confirme)) && (o.gain === null || nombre(o.gain))
    for (const [id, p] of Object.entries(v.bourse.positions ?? {})) {
      if (connue(id) && p && nombre(p.actions) && nombre(p.investi) && p.actions > 0) jeu.bourse.positions[id] = { actions: p.actions, investi: p.investi }
    }
    if (Array.isArray(v.bourse.ordres)) jeu.bourse.ordres = v.bourse.ordres.filter(ordreValide).map((o) => ({ ...o }))
    if (Array.isArray(v.bourse.journal)) jeu.bourse.journal = v.bourse.journal.filter(ordreValide).map((o) => ({ ...o })).slice(0, 20)
  }
  // La radio : seulement des voix qui existent.
  if (v.radio && typeof v.radio === 'object') {
    if (nombre(v.radio.frequence)) jeu.radio.frequence = v.radio.frequence
    if (Array.isArray(v.radio.captees)) jeu.radio.captees = v.radio.captees.filter((n) => nombre(n) && n >= 1 && n <= NOMBRE_VOIX)
    for (const n of jeu.radio.captees) if (nombre(v.radio.captureesLe?.[n])) jeu.radio.captureesLe[n] = v.radio.captureesLe[n]
  }
  // Les secondaires épinglées (revues au chargement, voir rattraperEpinglees). Une partie d'avant le 24/10/2026 : toutes
  // ses secondaires en cours étaient au tableau de bord, la suivie d'abord ; elles restent épinglées.
  if (Array.isArray(v.epinglees)) jeu.epinglees = v.epinglees.filter((x): x is string => typeof x === 'string')
  else {
    const enCours = QUETES.filter((q) => q.type === 'secondaire' && jeu.quetes[q.id] && jeu.quetes[q.id].fin == null).map((q) => q.id)
    jeu.epinglees = [...enCours.filter((id) => id === v.queteSuivie), ...enCours.filter((id) => id !== v.queteSuivie)]
  }
  // Les zones : seulement des zones qui existent, des points positifs.
  const liberees = Array.isArray(v.zones?.liberees) ? v.zones.liberees : Array.isArray(v.zonesLiberees) ? v.zonesLiberees : []
  jeu.zones.liberees = liberees.filter((z): z is string => typeof z === 'string' && !!zone(z))
  if (v.zones?.points && typeof v.zones.points === 'object') {
    for (const [z, p] of Object.entries(v.zones.points)) if (zone(z) && nombre(p) && p > 0) jeu.zones.points[z] = p
  }
  jeu.synchroniserZones()
  if (nombre(v.xp) && v.xp > 0) jeu.xp = Math.floor(v.xp)
  if (v.commerce && nombre(v.commerce.jour) && nombre(v.commerce.credits) && nombre(v.commerce.xp)) jeu.commerce = { jour: v.commerce.jour, credits: v.commerce.credits, xp: v.commerce.xp }
  if (v.armement && typeof v.armement === 'object') {
    for (const l of ['coque', 'canon', 'bombes', 'bouclier'] as const) {
      const n = v.armement[l]
      if (Number.isInteger(n) && n >= 1 && n <= NIVEAU_ARMEMENT_MAX) jeu.armement[l] = n
    }
  }
  if (Array.isArray(v.visites)) for (const z of v.visites) if (typeof z === 'string' && zone(z) && !jeu.visites.includes(z)) jeu.visites.push(z)
  if (Array.isArray(v.invitations)) jeu.invitations = MAISONS.map((m) => m.maison).filter((m) => v.invitations!.includes(m))
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
    // Un bloc en panne qui se réparait depuis ÉTAT (avant que ses modules soient raccordés) : on tire ses modules en défaut.
    for (const m of jeu.pannes) if (!jeu.defauts[m]?.length) jeu.tirerDefauts(m)
  } else {
    // Avant les blocs : on tire les modules en défaut des blocs en panne ; l'Énergie garde sa réparation en cours.
    for (const m of jeu.pannes) jeu.tirerDefauts(m)
    const energie = (v.reparations as Record<string, EtatReparation> | undefined)?.energie
    if (avecPanneau && energie && jeu.enPanne('energie')) {
      jeu.defauts.energie = ['bornier']
      jeu.reparations.bornier = energie
    }
  }
  if (v.quetes && Object.keys(v.quetes).some((id) => /^(lune-\d|t\d)$/.test(id))) reprendreAncienneCampagne(jeu, v.quetes, v.enregistreLe)
  restaurerTrophees(jeu, v)
  reprendreVeilleur(jeu, v.enregistreLe)
  rattraperInstruments(jeu)
  return jeu
}

/**
 * Les anciennes quêtes du début reprennent à l'étape équivalente : celles d'avant le 23/10/2026 (lune-1…5) et la
 * chaîne du tutoriel du 23/10/2026 (t1…t8), remplacées le 24/10/2026 par « Le cœur de la capsule » (q1) et « Cap sur
 * la Lune » (q2). Une partie d'avant le tutoriel compte la première comme faite.
 */
function reprendreAncienneCampagne(jeu: Jeu, anciennes: Record<string, { fin?: unknown } | undefined>, t: unknown): void {
  const quand = nombre(t) ? t : 0
  const faite = (id: string) => { if (!jeu.quetes[id]?.fin) jeu.quetes[id] = { etape: QUETES.find((q) => q.id === id)!.etapes.length, compte: 0, debut: quand, fin: quand } }
  const finie = (id: string) => nombre(anciennes[id]?.fin)
  const avantTutoriel = Object.keys(anciennes).some((id) => id.startsWith('lune-'))
  if (avantTutoriel || finie('t4') || jeu.niveauMoteur >= 2 && Object.keys(anciennes).some((id) => /^t\d$/.test(id))) faite('q1')
  const correspondances: [string, string][] = [['lune-1', 'q2'], ['t8', 'q2'], ['lune-3', 'l1'], ['lune-4', 'l2'], ['lune-5', 'l3']]
  for (const [ancienne, nouvelle] of correspondances) if (finie(ancienne)) { faite('q1'); faite(nouvelle) }
  if (jeu.zones.liberees.includes('Lune')) { faite('q1'); faite('q2'); faite('l3') }
  // Les planètes intérieures ont maintenant leur arc : une libération commencée sous l'ancienne forme recommence.
  for (const id of ['liberer-mars', 'liberer-venus', 'liberer-mercure']) if (anciennes[id] && !finie(id)) delete jeu.quetes[id]
}

/** Les lieux renommés (validé par Adrien le 23/10/2026, pour coller aux Voix perdues). */
const LIEUX_RENOMMES: [string, string][] = [['Aérostat Ishtar', 'Cythère'], ['Observatoire Messenger', 'Phare de Mercure']]

function renommerLieux(s: unknown): unknown {
  let texte = JSON.stringify(s ?? null)
  for (const [ancien, nouveau] of LIEUX_RENOMMES) texte = texte.replaceAll(JSON.stringify(ancien), JSON.stringify(nouveau))
  return JSON.parse(texte)
}

/** Les trophées : les compteurs lisibles, et les trophées qui existent (une sauvegarde d'avant : tout neuf). */
function restaurerTrophees(jeu: Jeu, v: Sauvegarde): void {
  if (v.trophees && typeof v.trophees === 'object') {
    for (const [n, d] of Object.entries(v.trophees)) if (TROPHEES.some((x) => x.n === Number(n)) && nombre(d)) jeu.trophees[Number(n)] = d
  }
  const st = v.stats
  if (!st || typeof st !== 'object') return
  const s = statsNeuves()
  if (st.n && typeof st.n === 'object') for (const [k, x] of Object.entries(st.n)) if (nombre(x)) s.n[k] = x
  if (st.ens && typeof st.ens === 'object') {
    for (const [k, l] of Object.entries(st.ens)) if (Array.isArray(l)) s.ens[k] = [...new Set(l.filter((x): x is string => typeof x === 'string'))]
  }
  if (st.ici && typeof st.ici.lieu === 'string' && nombre(st.ici.depuis)) s.ici = { lieu: st.ici.lieu, depuis: st.ici.depuis }
  if (st.jours && nombre(st.jours.dernier) && nombre(st.jours.suite)) s.jours = { dernier: st.jours.dernier, suite: st.jours.suite }
  const d = st.dernierTrajet
  if (d && typeof d.de === 'string' && typeof d.a === 'string' && nombre(d.depart)) s.dernierTrajet = { de: d.de, a: d.a, depart: d.depart }
  if (Array.isArray(st.impacts)) s.impacts = st.impacts.filter(nombre)
  if (st.passages && typeof st.passages === 'object') for (const [k, x] of Object.entries(st.passages)) if (nombre(x)) s.passages[k] = x
  if (nombre(st.terre)) s.terre = st.terre
  if (nombre(st.naissance)) s.naissance = st.naissance
  jeu.stats = s
}

/**
 * « L'oreille du Veilleur » ne demandait qu'un PING avant le 24/10/2026 ; elle en demande trois, puis le premier
 * monolithe (Adrien : le Veilleur enchaînait sur le radar après un seul PING). Une partie qui l'avait finie sous
 * l'ancienne forme reprend au deuxième PING ; ce qui avait suivi (radar, radio) recommence plus tard, à son tour.
 */
function reprendreVeilleur(jeu: Jeu, t: unknown): void {
  const e = jeu.quetes.veilleur, q = QUETES.find((x) => x.id === 'veilleur')
  if (!e || !q || e.fin == null || e.etape >= q.etapes.length) return
  jeu.quetes.veilleur = { etape: 1, compte: 0, debut: e.debut, fin: null, depuis: nombre(t) ? t : e.debut }
  const suites = ['veilleur-radar', 'veilleur-radio']
  for (const id of suites) delete jeu.quetes[id]
  jeu.radioPnj = jeu.radioPnj.filter((r) => !r.quete || !suites.includes(r.quete))
  jeu.epinglees = jeu.epinglees.filter((id) => !suites.includes(id))
  if (!jeu.epinglees.includes('veilleur') && jeu.epinglees.length < 3) jeu.epinglees.push('veilleur')
}
