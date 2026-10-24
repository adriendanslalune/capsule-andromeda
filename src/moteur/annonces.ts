// Les annonces générales (demande d'Adrien du 22/10/2026) : ce qui concerne tous les joueurs, qui défile en petit
// sous le tableau de bord. Les planètes au plus près de la Terre (le bon moment pour y aller, d'après les vraies
// positions) et les événements du jeu en cours. Les mêmes pour tous : rien ne dépend de la partie.

import { breveDuMois } from './saisons'
import { BREVES } from '../donnees/breves'
import { RECLAMES } from '../donnees/reclames'
import { EVENEMENTS, type Evenement } from '../donnees/evenements'
import { position } from './corps'

const JOUR = 86_400_000
/** Période synodique de chaque planète vue de la Terre (jours) : le temps entre deux passages au plus près. */
const SYNODIQUE: Readonly<Record<string, number>> = { Mercure: 116, Vénus: 584, Mars: 780, Jupiter: 399, Saturne: 378, Uranus: 370, Neptune: 367 }
/** Une planète est « proche » quand sa distance est dans le premier dixième de ce qu'elle peut être sur sa période. */
export const PART_PROCHE = 0.1
/** « Au plus près » : à moins de tant de jours de son passage au plus près. */
const JOURS_AU_PLUS_PRES = 3

const distance = (planete: string, t: number) => {
  const a = position(planete, t), b = position('Terre', t)
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Où en est une planète sur sa période : sa distance à la Terre, la plus courte et la plus longue, et quand elle passe au plus près. */
export function rapprochement(planete: string, t: number): { distance: number; min: number; max: number; auPlusPres: number } {
  const periode = SYNODIQUE[planete] * JOUR, pas = periode / 120
  let min = Infinity, max = 0, auPlusPres = t
  for (let k = -60; k <= 60; k++) {
    const tk = t + k * pas, d = distance(planete, tk)
    if (d < min) { min = d; auPlusPres = tk }
    if (d > max) max = d
  }
  return { distance: distance(planete, t), min, max, auPlusPres }
}

/** Un pas premier avec n (et au moins `depuis`) : en avançant de ce pas, on passe par tous les éléments avant d'en revoir un. */
function pasMelange(n: number, depuis: number): number {
  const pgcd = (a: number, b: number): number => (b ? pgcd(b, a % b) : a)
  let pas = depuis
  while (pgcd(pas, n) !== 1) pas++
  return pas
}

/**
 * La brève de Radio Résistance de l'heure (Adrien, 22/10/2026 : plus fun ; plus de quatre cents, pour qu'un joueur de
 * longue date ne s'en lasse pas) : une par heure, dans un ordre mélangé (toutes passent avant qu'une revienne : près de
 * trois semaines), la même pour tous.
 */
export function breve(t: number): string {
  const h = Math.floor(t / 3_600_000)
  return `Radio Résistance · ${BREVES[(h * pasMelange(BREVES.length, 37)) % BREVES.length]}`
}

/** La réclame d'époque de l'heure (proposition validée par Adrien le 22/10/2026), à son propre rythme. */
export function reclame(t: number): string {
  const h = Math.floor(t / 3_600_000)
  return `Réclame · ${RECLAMES[(h * pasMelange(RECLAMES.length, 11) + 5) % RECLAMES.length]}`
}

const millions = (km: number) => (km >= 1e9 ? `${(km / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} milliards de km`
  : `${Math.round(km / 1e6).toLocaleString('fr-FR')} millions de km`)

/** Les annonces du moment, de la plus utile à la moins utile. */
export function annonces(t: number, evenements: readonly Evenement[] = EVENEMENTS): string[] {
  const liste: string[] = []
  for (const e of evenements) if (t >= Date.parse(e.debut) && t < Date.parse(e.fin)) liste.push(e.texte)
  for (const planete of Object.keys(SYNODIQUE)) {
    const r = rapprochement(planete, t)
    if (r.distance > r.min + PART_PROCHE * (r.max - r.min)) continue
    const jours = Math.round((r.auPlusPres - t) / JOUR)
    if (Math.abs(jours) <= JOURS_AU_PLUS_PRES) liste.push(`${planete} au plus près de la Terre (${millions(r.distance)}) : c'est le moment d'y aller`)
    else if (jours > 0) liste.push(`${planete} se rapproche de la Terre : au plus près dans ${jours} jours, ${millions(r.min)}. Bon moment pour y aller`)
    else liste.push(`${planete} s'éloigne de la Terre après son passage au plus près : il est encore temps d'y aller`)
  }
  const duMois = breveDuMois(t)
  if (duMois) liste.push(duMois)
  liste.push(breve(t), reclame(t))
  return liste
}
