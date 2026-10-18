// Ce qui rôde autour de la capsule (étapes 4 et 5, écrans d'abord) : les épaves (toujours là ; on les vide en
// mission), les chasseurs aliens (visibles seulement au radar ; vaincus, remplacés au bout d'un moment) et leurs
// missiles. Les tirs sont tirés au hasard reproductible (même heure, même chasseur, même tir) ; on ne compte pas les
// tirs pendant que l'application était fermée (pas de mauvaise surprise au retour).

import {
  ALIENS, EPAVES, INTERCEPTEURS_MAX, MISSILES_MAX, PART_RADAR, RADAR_ESPACE, RECHARGE_INTERCEPTEUR, RETOUR_ALIEN,
  tirsParHeure, VOL_MISSILE,
} from '../donnees/espace'
import { corps, astreDominant, GENERATIONS_ALIENS, rayonInfluence } from './corps'
import { etatCapsule } from './capsule'
import { distanceDepuisCapsule } from './navigation'

const HEURE = 3_600_000

/** Un missile alien en vol vers la capsule. */
export interface Missile { id: number; alien: string; lance: number; impact: number }

/** Ce que le jeu retient de l'espace (enregistré avec la partie). */
export interface EtatEspace {
  /** Chasseurs abattus : quand (leur renfort arrive RETOUR_ALIEN plus tard) ; combien de fois (la génération du renfort). */
  aliensVaincus: Record<string, number>
  generations: Record<string, number>
  missiles: Missile[]
  intercepteurs: number
  /** Dernière recharge d'intercepteur, et dernier instant où les tirs ont été regardés. */
  rechargeDepuis: number
  tirsJusqua: number
}

export function nouvelEspace(): EtatEspace {
  return { aliensVaincus: {}, generations: {}, missiles: [], intercepteurs: INTERCEPTEURS_MAX, rechargeDepuis: 0, tirsJusqua: 0 }
}

/** Portée du radar à l'instant t (km) : une part de la sphère d'influence du système où est la capsule. */
export function porteeRadar(t: number): number {
  const systeme = astreDominant(etatCapsule(t).position, t)
  return systeme === 'Soleil' ? RADAR_ESPACE : PART_RADAR * rayonInfluence(systeme)
}

export function alienLa(e: EtatEspace, nom: string, t: number): boolean {
  const v = e.aliensVaincus[nom]
  return v === undefined || t - v >= RETOUR_ALIEN
}

/**
 * Les chasseurs repérés au radar à l'instant t. Il y en a des centaines : le résultat est gardé une seconde (la carte
 * le demande à chaque image).
 */
let memoireRadar: { seconde: number; vaincus: string; noms: string[] } | null = null
export function aliensReperes(e: EtatEspace, t: number): string[] {
  const seconde = Math.floor(t / 1000), vaincus = Object.keys(e.aliensVaincus).join('|')
  if (memoireRadar?.seconde === seconde && memoireRadar.vaincus === vaincus) return memoireRadar.noms
  const portee = porteeRadar(t)
  const noms = ALIENS.filter((a) => alienLa(e, a.nom, t) && distanceDepuisCapsule(a.nom, t) <= portee).map((a) => a.nom)
  memoireRadar = { seconde, vaincus, noms }
  return noms
}

/**
 * Un astre ou un engin est-il sur la carte ? Les épaves et les chasseurs : seulement ceux que vise une mission (en
 * cours, regardée ou choisie) — la chasse passe par les missions des Mercenaires, et sinon la carte serait encombrée
 * (décisions d'Adrien du 18/10/2026) ; et le chasseur qui nous tire dessus (le radar sert à prévenir du danger).
 */
export function surLaCarte(e: EtatEspace, nom: string, t: number, visees: readonly string[] = []): boolean {
  const type = corps(nom)?.type
  if (type === 'alien') return alienLa(e, nom, t) && (visees.includes(nom) || e.missiles.some((m) => m.alien === nom))
  if (type === 'epave') return visees.includes(nom)
  return true
}

/** Les chasseurs présents d'une région (pas abattus, ou déjà remplacés). */
export function aliensDe(e: EtatEspace, parent: string, t: number): string[] {
  return ALIENS.filter((a) => a.parent === parent && alienLa(e, a.nom, t)).map((a) => a.nom)
}

/** Donne aux chasseurs la génération de leurs renforts (leur place change ; à appeler après une sauvegarde lue). */
export function appliquerGenerations(e: EtatEspace): void {
  GENERATIONS_ALIENS.clear()
  for (const [nom, g] of Object.entries(e.generations)) GENERATIONS_ALIENS.set(nom, g)
}

/** Toutes les épaves (elles ne disparaissent jamais ; on les vide en mission). */
export function toutesLesEpaves(): string[] {
  return EPAVES.map((x) => x.nom)
}

/** Petit hachage, entre 0 et 1. */
function h(s: string): number {
  let x = 2166136261
  for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619)
  x ^= x >>> 13
  x = Math.imul(x, 0x5bd1e995)
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296
}

/** Le tir d'un chasseur pendant l'heure k (instant du tir), ou null. */
export function tirDeLHeure(alien: string, k: number): number | null {
  const a = ALIENS.find((x) => x.nom === alien)!
  if (h(`${alien}/${k}`) >= tirsParHeure(a)) return null
  return k * HEURE + Math.floor(h(`${alien}/${k}/quand`) * HEURE)
}

/** Ce qui arrive dans l'espace jusqu'à t : nouveaux missiles, impacts, recharge des intercepteurs. */
export function avancerEspace(e: EtatEspace, t: number): { lances: Missile[]; impacts: Missile[] } {
  // Recharge des intercepteurs.
  if (e.intercepteurs >= INTERCEPTEURS_MAX) e.rechargeDepuis = t
  else {
    const n = Math.floor((t - e.rechargeDepuis) / RECHARGE_INTERCEPTEUR)
    if (n > 0) {
      e.intercepteurs = Math.min(INTERCEPTEURS_MAX, e.intercepteurs + n)
      e.rechargeDepuis += n * RECHARGE_INTERCEPTEUR
    }
  }
  // Tirs des chasseurs repérés, depuis la dernière fois (au plus les 5 dernières minutes).
  const lances: Missile[] = []
  const depuis = Math.max(e.tirsJusqua, t - 5 * 60_000)
  if (t > depuis) {
    for (const nom of aliensReperes(e, t)) {
      for (let k = Math.floor(depuis / HEURE); k <= Math.floor(t / HEURE); k++) {
        const quand = tirDeLHeure(nom, k)
        if (quand === null || quand <= depuis || quand > t || e.missiles.some((m) => m.alien === nom) || e.missiles.length >= MISSILES_MAX) continue
        const m = { id: quand, alien: nom, lance: quand, impact: quand + VOL_MISSILE }
        e.missiles.push(m)
        lances.push(m)
      }
    }
  }
  e.tirsJusqua = t
  // Impacts.
  const impacts = e.missiles.filter((m) => m.impact <= t)
  e.missiles = e.missiles.filter((m) => m.impact > t)
  return { lances, impacts }
}

/** Intercepter le missile le plus proche de l'impact (s'il reste un intercepteur). */
export function intercepterMissile(e: EtatEspace, t: number): boolean {
  if (!e.missiles.length || e.intercepteurs === 0) return false
  const premier = e.missiles.reduce((a, b) => (b.impact < a.impact ? b : a))
  e.missiles = e.missiles.filter((m) => m !== premier)
  if (e.intercepteurs === INTERCEPTEURS_MAX) e.rechargeDepuis = t
  e.intercepteurs--
  return true
}

/**
 * Un chasseur abattu : il disparaît pour de bon (et ses missiles avec lui) ; un renfort d'Andromède prendra sa place
 * dans la flotte, ailleurs, au bout de RETOUR_ALIEN (décision d'Adrien du 18/10/2026 : les chasseurs ne s'épuisent pas).
 */
export function vaincre(e: EtatEspace, nom: string, t: number): void {
  e.aliensVaincus[nom] = t
  e.generations[nom] = (e.generations[nom] ?? 0) + 1
  GENERATIONS_ALIENS.set(nom, e.generations[nom])
  e.missiles = e.missiles.filter((m) => m.alien !== nom)
}
