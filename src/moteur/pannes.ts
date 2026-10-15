// Gestion des pannes : déclenchement (en voyage seulement : tutoriel, puis environ une par voyage), cascades et leur
// ordre de réparation, fautes de pilotage. Les réparations ne rapportent plus rien (décision d'Adrien du 15/10/2026) :
// une avarie ralentit la fusée, c'est un obstacle ; elle compte pour le classement.

import { PANNES } from '../donnees/reglages'
import { contratsTutorielFaits, estInstalle } from './economie'
import type { EtatPartie } from './etat'
import { entierAuHasard, type Hasard } from './hasard'
import type { Contexte, Evenement } from './modules/commun'
import { an1PeutTomberEnPanne, panneAN1 } from './modules/an1'
import { panneAL1 } from './modules/al1'
import { panneCO1 } from './modules/co1'
import { panneCR1 } from './modules/cr1'
import { panneHY1 } from './modules/hy1'
import { modulesEnPanne, type EtatModules } from './modules'
import { panneLP1 } from './modules/lp1'
import { panneMO1 } from './modules/mo1'
import { pannePB1 } from './modules/pb1'
import { panneCH1, panneCH1Imposee, panneTU1 } from './modules/propulsion'
import { panneSX1 } from './modules/sx1'
import { dernierChiffrePair } from './serie'

export interface Cascade {
  /** Modules tombés en panne ensemble. */
  modules: string[]
  /** Modules déjà réparés, dans l'ordre. */
  faits: string[]
  /** Somme des primes des modules déjà réparés. */
  total: number
}

export interface EtatPannes {
  /** Nombre de pannes du tutoriel déjà déclenchées (0 à 4). */
  tutoriel: number
  /** Instant de la prochaine avarie (ms UTC), ou null : elle sera programmée quand tout sera réparé. */
  prochaine: number | null
  cascade: Cascade | null
  /** Modules en avarie par faute de pilotage. */
  fautes: string[]
  /** Instants des dernières avaries (hors tutoriel), pour n'en avoir que 3 par 24 h ; absent des anciennes parties. */
  recentes?: number[]
}

/** Nombre de pannes scénarisées du tutoriel. */
export const PANNES_TUTORIEL = 4

export function creerPannes(t: number): EtatPannes {
  return { tutoriel: 0, prochaine: t + PANNES.delaiTutoriel * 1000, cascade: null, fautes: [] }
}

/** Modules qui peuvent tomber en panne au hasard (RE-1 s'use tout seul et ne participe jamais aux cascades). */
const MODULES_A_PANNE = ['CH-1', 'TU-1', 'AL-1', 'CO-1', 'PB-1', 'LP-1', 'HY-1', 'MO-1', 'CR-1', 'AN-1', 'SX-1']

/** Contexte des modules pour cette partie, à l'instant t. */
export function contexte(etat: EtatPartie, t: number): Contexte {
  return { serie: etat.serie, interrupteurs: etat.interrupteurs, t }
}

/** Met un module en panne (avarie « au hasard » propre à chaque module). */
function mettreEnPanne(m: EtatModules, code: string, etat: EtatPartie, hasard: Hasard, ctx: Contexte): EtatModules {
  switch (code) {
    case 'CH-1': return { ...m, propulsion: panneCH1(m.propulsion, hasard) }
    case 'TU-1': return { ...m, propulsion: panneTU1(m.propulsion) }
    case 'AL-1': return { ...m, al1: panneAL1(m.al1, hasard) }
    case 'CO-1': return { ...m, co1: panneCO1(m.co1, hasard) }
    case 'PB-1': return { ...m, pb1: pannePB1(m.pb1, hasard, ctx) }
    case 'LP-1': return { ...m, lp1: panneLP1(m.lp1, hasard, etat.ameliorations) }
    case 'HY-1': return { ...m, hy1: panneHY1(m.hy1, hasard, ctx) }
    case 'MO-1': return { ...m, mo1: panneMO1(m.mo1, hasard) }
    case 'CR-1': return { ...m, cr1: panneCR1(m.cr1, hasard) }
    case 'AN-1': return { ...m, an1: panneAN1(m.an1) }
    case 'SX-1': return { ...m, sx1: panneSX1(m.sx1, hasard) }
    default: throw new Error(`Pas de panne pour ${code}`)
  }
}

/** Taille maximale d'une cascade selon les améliorations : < 8 → 1 ; < 20 → 2 ; < 35 → 3 ; sinon 4. */
export function tailleMaxCascade(ameliorations: number): number {
  const i = PANNES.paliersCascade.findIndex((p) => ameliorations < p)
  return i === -1 ? PANNES.paliersCascade.length + 1 : i + 1
}

/**
 * Ordre de réparation d'une cascade : ordre alphabétique des codes ; inversé si le dernier chiffre du n° de série est
 * impair ; une surchauffe (TU-1) se traite toujours en premier.
 */
export function ordreCascade(modules: string[], serie: string): string[] {
  const l = [...modules].sort()
  if (!dernierChiffrePair(serie)) l.reverse()
  const i = l.indexOf('TU-1')
  if (i > 0) { l.splice(i, 1); l.unshift('TU-1') }
  return l
}

/**
 * Déclenche la prochaine avarie : les 4 pannes du tutoriel (TU-1 ; CH-1 ; TU-1 et CH-1 en surpression ; AL-1),
 * puis 1 à n modules au hasard parmi ceux installés, en état de marche et pouvant tomber en panne
 * (AN-1 jamais près de la Terre). Plusieurs modules à la fois forment une cascade.
 */
export function declencherPanne(etat: EtatPartie, t: number, hasard: Hasard): EtatPartie {
  const ctx = contexte(etat, t)
  const p = etat.pannes
  let m = etat.modules
  if (p.tutoriel < PANNES_TUTORIEL) {
    if (p.tutoriel === 0) m = { ...m, propulsion: panneTU1(m.propulsion) }
    else if (p.tutoriel === 1) m = { ...m, propulsion: panneCH1(m.propulsion, hasard) }
    else if (p.tutoriel === 2) m = { ...m, propulsion: panneCH1Imposee(panneTU1(m.propulsion), 'sur') }
    else m = { ...m, al1: panneAL1(m.al1, hasard) }
    return { ...etat, modules: m, pannes: { ...p, tutoriel: p.tutoriel + 1, prochaine: null } }
  }
  const libres = modulesLibres(etat, t)
  if (libres.length === 0) return { ...etat, pannes: { ...p, prochaine: null } }
  const n = Math.min(libres.length, 1 + entierAuHasard(hasard, tailleMaxCascade(etat.ameliorations)))
  for (let i = libres.length - 1; i > 0; i--) {
    const j = entierAuHasard(hasard, i + 1)
    ;[libres[i], libres[j]] = [libres[j], libres[i]]
  }
  const choisis = libres.slice(0, n)
  for (const c of choisis) m = mettreEnPanne(m, c, etat, hasard, ctx)
  return {
    ...etat,
    modules: m,
    pannes: {
      ...p,
      prochaine: null,
      recentes: [...(p.recentes ?? []).filter((x) => x > t - 86_400_000), t],
      cascade: n > 1 ? { modules: choisis, faits: [], total: 0 } : null,
      fautes: p.fautes.filter((c) => !choisis.includes(c)),
    },
  }
}

/** Modules installés, en état de marche, qui peuvent tomber en panne maintenant (AN-1 jamais près de la Terre). */
function modulesLibres(etat: EtatPartie, t: number): string[] {
  const enPanne = modulesEnPanne(etat.modules)
  return MODULES_A_PANNE.filter((c) => estInstalle(etat, c) && !enPanne.includes(c)
    && (c !== 'AN-1' || an1PeutTomberEnPanne(etat.fusee.position, t)))
}

/**
 * Ajoute une panne simple (un seul module, hors cascade) parmi les modules libres. Sert au rattrapage d'une longue
 * absence (seconde avarie). Sans effet pendant une cascade ou s'il n'y a pas de module libre.
 */
export function ajouterPanneSimple(etat: EtatPartie, t: number, hasard: Hasard): { etat: EtatPartie; module: string | null } {
  const libres = modulesLibres(etat, t)
  if (etat.pannes.cascade || libres.length === 0) return { etat, module: null }
  const code = libres[entierAuHasard(hasard, libres.length)]
  return { etat: { ...etat, modules: mettreEnPanne(etat.modules, code, etat, hasard, contexte(etat, t)) }, module: code }
}

/** Vrai si une rechute de la tuyère (faux réparé) est en attente : pas de nouvelle avarie d'ici là. */
function rechuteEnAttente(etat: EtatPartie): boolean {
  return etat.modules.propulsion.rechute !== null
}

/**
 * Programme et déclenche les avaries, en voyage seulement. `reste` : temps de trajet restant (s), ou null si la
 * fusée ne voyage pas (en orbite, à l'arrêt, moteur coupé, en attente d'une fenêtre) : alors aucune avarie, et celle
 * qui était programmée est oubliée. En voyage, quand tout est réparé : pendant le tutoriel, la panne scénarisée du
 * voyage 18 s plus tard (une par contrat du tutoriel) ; ensuite, entre 25 % et 85 % du trajet restant (24 h au plus),
 * au moins 60 s plus tard, et pas plus de 3 par 24 h.
 */
export function planifierPannes(etat: EtatPartie, t: number, hasard: Hasard, reste: number | null): EtatPartie {
  if (modulesEnPanne(etat.modules).length > 0 || rechuteEnAttente(etat)) return etat
  const p = etat.pannes
  if (reste === null) return p.prochaine === null ? etat : { ...etat, pannes: { ...p, prochaine: null } }
  if (p.prochaine === null) {
    if (p.tutoriel < PANNES_TUTORIEL) {
      // Une panne du tutoriel par voyage : la n-ième pendant le voyage du n-ième contrat du tutoriel.
      if (p.tutoriel > contratsTutorielFaits(etat)) return etat
      return { ...etat, pannes: { ...p, prochaine: t + PANNES.delaiTutoriel * 1000 } }
    }
    let delai = Math.max(PANNES.delaiMin, (PANNES.fractionMin + hasard() * (PANNES.fractionMax - PANNES.fractionMin))
      * Math.min(reste, PANNES.horizonHeures * 3600))
    const recentes = (p.recentes ?? []).filter((x) => x > t - 86_400_000)
    if (recentes.length >= PANNES.maxParJour) delai = Math.max(delai, (recentes[0] + 86_400_000 - t) / 1000)
    return { ...etat, pannes: { ...p, prochaine: t + delai * 1000 } }
  }
  return t >= p.prochaine ? declencherPanne(etat, t, hasard) : etat
}

/** Résultat du traitement des événements : messages pour le téléscripteur. */
export interface ResultatEvenements {
  etat: EtatPartie
  messages: string[]
}

/**
 * Traite les événements des modules : une faute de pilotage est notée ; une réparation est comptée (classement) ;
 * dans une cascade, un module réparé hors de son tour retombe aussitôt en panne. Les réparations ne rapportent rien.
 */
export function traiterEvenements(etat: EtatPartie, evenements: Evenement[], t: number, hasard: Hasard): ResultatEvenements {
  let e = etat
  const messages: string[] = []
  for (const ev of evenements) {
    if (ev.type === 'faute') {
      e = { ...e, pannes: { ...e.pannes, fautes: [...new Set([...e.pannes.fautes, ev.module])] } }
      messages.push(`FAUTE DE PILOTAGE : AVARIE ${ev.module} PROVOQUÉE.`)
      continue
    }
    if (ev.type !== 'reparation') continue
    const code = ev.module
    const stats = (n: number) => ({ ...e.stats, pannes: e.stats.pannes + n })
    if (e.pannes.fautes.includes(code)) {
      e = { ...e, stats: stats(1), pannes: { ...e.pannes, fautes: e.pannes.fautes.filter((c) => c !== code) } }
      messages.push(`${code} RÉPARÉ.`)
      continue
    }
    const cascade = e.pannes.cascade
    if (cascade && cascade.modules.includes(code) && !cascade.faits.includes(code)) {
      const attendu = ordreCascade(cascade.modules, e.serie).find((c) => !cascade.faits.includes(c))
      if (code !== attendu) {
        e = { ...e, modules: mettreEnPanne(e.modules, code, e, hasard, contexte(e, t)) }
        messages.push(`ORDRE INCORRECT : ${code} RETOMBE EN PANNE.`)
        continue
      }
      const suite: Cascade = { ...cascade, faits: [...cascade.faits, code], total: 0 }
      if (suite.faits.length < suite.modules.length) {
        e = { ...e, pannes: { ...e.pannes, cascade: suite } }
        continue
      }
      const n = suite.modules.length
      e = { ...e, stats: stats(n), pannes: { ...e.pannes, cascade: null } }
      messages.push('CASCADE RÉSOLUE.')
      continue
    }
    e = { ...e, stats: stats(1) }
  }
  return { etat: e, messages }
}
