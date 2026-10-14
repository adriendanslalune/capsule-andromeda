// Position des bots de la flotte à l'instant t, sans aucun état : le temps est découpé en cycles ; pendant le cycle n,
// le bot attend à son escale n, puis part vers l'escale n + 1 en ligne droite (vers la position de l'escale qui
// avance) et l'y attend jusqu'à la fin du cycle. Un trajet trop long pour tenir dans le cycle n'est pas entrepris.

import { planeteDe, positionCorps, rayonCorps } from '../astro/corps'
import { UA_KM } from '../astro/temps'
import type { Vecteur3 } from '../astro/vecteur'
import type { Bot } from '../donnees/flotte'
import { mulberry32 } from './hasard'

export interface PositionBot {
  /** Position héliocentrique (UA). */
  position: Vecteur3
  /** Escale où il se trouve, ou null en route. */
  escale: string | null
  /** Destination en route (ou escale suivante). */
  vers: string
  /** Planète du système où il se trouve (escale ou départ et arrivée dans le même système), ou null. */
  systeme: string | null
  /** Cap (degrés, 0 vers +x, sens inverse des aiguilles d'une montre). */
  cap: number
}

const JOUR = 86_400_000
/** Origine des cycles : 1er janvier 2026, 0 h UTC. */
const ORIGINE = Date.UTC(2026, 0, 1)

/** Graine propre au bot (tirée de son numéro de série). */
function graine(bot: Bot): number {
  let h = 2166136261
  for (const c of bot.serie) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
/** Nombre au hasard reproductible pour le bot et un entier n. */
function tirage(bot: Bot, n: number, k = 0): number {
  return mulberry32(graine(bot) ^ Math.imul(n + 1, 2654435761) ^ Math.imul(k + 1, 40503))()
}

/** Escale du bot au début du cycle n. */
export function escaleDuCycle(bot: Bot, n: number): string {
  return bot.escales[Math.floor(tirage(bot, n) * bot.escales.length)]
}

/** Position de stationnement autour d'une escale : en orbite, à une distance et un angle propres au bot (UA). */
function stationnement(bot: Bot, escale: string, t: number): Vecteur3 {
  const c = positionCorps(escale, t)
  const r = rayonCorps(escale) ?? 0
  const ecartKm = escale === 'ISS' ? 0.3 + tirage(bot, 0, 7) * 0.5 : r * (1.1 + tirage(bot, 0, 3) * 0.6) + 300
  // Une orbite d'environ 90 minutes autour d'une planète, plus lente autour de la Lune.
  const periode = escale === 'ISS' ? 1e12 : escale === 'Lune' ? 6 * 3_600_000 : 5_400_000
  const a = tirage(bot, 0, 5) * 2 * Math.PI + (2 * Math.PI * t) / periode
  const e = ecartKm / UA_KM
  return { x: c.x + Math.cos(a) * e, y: c.y + Math.sin(a) * e, z: c.z }
}

const distanceKm = (a: Vecteur3, b: Vecteur3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * UA_KM

export function positionBot(bot: Bot, t: number): PositionBot {
  const cycle = bot.cycleJours * JOUR
  const n = Math.floor((t - ORIGINE) / cycle)
  const debut = ORIGINE + n * cycle
  const a = escaleDuCycle(bot, n)
  const b = escaleDuCycle(bot, n + 1)
  const ici = (escale: string, vers: string): PositionBot => ({
    position: stationnement(bot, escale, t), escale, vers, systeme: planeteDe(escale), cap: tirage(bot, n, 9) * 360,
  })
  if (a === b) return ici(a, b)
  // Départ après une escale de 10 à 40 % du cycle.
  const depart = debut + (0.1 + 0.3 * tirage(bot, n, 1)) * cycle
  if (t < depart) return ici(a, b)
  const duree = (distanceKm(stationnement(bot, a, depart), stationnement(bot, b, depart)) / bot.vitesse) * 1000
  if (depart + duree > debut + cycle) return ici(a, b) // trop loin pour ce cycle : il reste à quai
  if (t >= depart + duree) return ici(b, b)
  const f = (t - depart) / duree
  const pa = stationnement(bot, a, t)
  const pb = stationnement(bot, b, t)
  const position = { x: pa.x + (pb.x - pa.x) * f, y: pa.y + (pb.y - pa.y) * f, z: pa.z + (pb.z - pa.z) * f }
  const systeme = planeteDe(a) === planeteDe(b) ? planeteDe(a) : null
  return { position, escale: null, vers: b, systeme, cap: (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI }
}

/** Le bot est-il connecté à l'heure de t ? (tiré heure par heure). */
export function botEnLigne(bot: Bot, t: number): boolean {
  return tirage(bot, Math.floor(t / 3_600_000), 11) < bot.enLigne
}
