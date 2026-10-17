// Position des bots de la flotte à l'instant t, sans aucun état : le temps est découpé en cycles ; pendant le cycle n,
// le bot attend à son escale n, puis part vers l'escale n + 1 en ligne droite (vers la position de l'escale qui
// avance) et l'y attend jusqu'à la fin du cycle. Un trajet trop long pour tenir dans le cycle n'est pas entrepris.

import { planeteDe, positionPlate, rayonCorps } from '../astro/corps'
import { UA_KM } from '../astro/temps'
import type { Vecteur3 } from '../astro/vecteur'
import type { Bot } from '../donnees/flotte'
import { PHRASES_BOTS, REPONSES_BOTS } from '../donnees/telegrammes'
import { mulberry32 } from './hasard'
import { debutSaison, numeroSaison } from './visiteur'
import { arriveeEn, estDestinataire, type Portee, type Telegramme } from './telegrammes'

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
  const c = positionPlate(escale, t)
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

// Télégrammes des bots : chacun en envoie de temps en temps (une phrase toute faite, sans indice de chasse), à tout le
// système solaire ou à son système ; il répond parfois aux télégrammes du joueur qui lui parviennent.

/** Télégrammes émis par les bots entre depuis et t. */
export function telegrammesDesBots(flotte: readonly Bot[], depuis: number, t: number): Telegramme[] {
  const l: Telegramme[] = []
  for (const bot of flotte) {
    // Un créneau toutes les 12 à 36 heures ; un sur deux seulement donne un télégramme.
    const periode = (12 + 24 * tirage(bot, 0, 13)) * 3_600_000
    for (let k = Math.floor((depuis - ORIGINE) / periode) - 1; ORIGINE + k * periode <= t; k++) {
      if (tirage(bot, k, 15) > 0.5) continue
      const envoye = ORIGINE + (k + tirage(bot, k, 14)) * periode
      if (envoye < depuis || envoye > t) continue
      const p = positionBot(bot, envoye)
      const portee: Portee = tirage(bot, k, 16) < 0.3 && p.systeme ? { type: 'systeme', systeme: p.systeme } : { type: 'tout' }
      l.push({
        id: `${bot.serie}-${k}`, de: bot.nom, serie: bot.serie, couleur: bot.couleur, envoye, portee, origine: p.position, systeme: p.systeme,
        texte: PHRASES_BOTS[Math.floor(tirage(bot, k, 17) * PHRASES_BOTS.length)],
      })
    }
  }
  return l
}

/** Nombre au hasard reproductible tiré d'un texte (identifiant de télégramme). */
function tirageTexte(s: string, k: number): number {
  let h = 2166136261 ^ k
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return mulberry32(h)()
}

/** Réponses des bots aux télégrammes du joueur : un bot qui l'a reçu répond, quelques minutes après l'avoir reçu. */
export function reponsesDesBots(flotte: readonly Bot[], envoyes: readonly Telegramme[], joueur: { serie: string; nom: string }): Telegramme[] {
  const l: Telegramme[] = []
  for (const m of envoyes) {
    const candidats = flotte.filter((b) => estDestinataire(m, b.serie, positionBot(b, m.envoye).systeme))
    if (!candidats.length) continue
    // Un télégramme adressé à un bot reçoit toujours sa réponse ; un télégramme collectif, une fois sur deux.
    if (m.portee.type !== 'joueur' && tirageTexte(m.id, 1) > 0.5) continue
    const bot = candidats[Math.floor(tirageTexte(m.id, 2) * candidats.length)]
    const recu = arriveeEn(m, positionBot(bot, m.envoye).position)
    const envoye = recu + (2 + 18 * tirageTexte(m.id, 3)) * 60_000
    const p = positionBot(bot, envoye)
    l.push({
      id: `re-${m.id}`, de: bot.nom, serie: bot.serie, couleur: bot.couleur, envoye, origine: p.position, systeme: p.systeme,
      portee: { type: 'joueur', serie: joueur.serie, nom: joueur.nom },
      texte: REPONSES_BOTS[Math.floor(tirageTexte(m.id, 4) * REPONSES_BOTS.length)],
    })
  }
  return l
}

// Vie sociale de la flotte (en attendant le serveur) : annonces (arrivées des bots, visiteur photographié) et
// classement (trophées). Tout se déduit de l'heure : les mêmes annonces et le même classement pour tous.

export interface Annonce {
  t: number
  /** Fusée concernée (nom peint), et sa couleur. */
  de: string
  couleur: string
  texte: string
  /** Annonce marquante (trouvaille du visiteur) : mise en avant. */
  majeure?: boolean
}

const nomLieu = (n: string) => (n === 'Terre' ? 'la Terre' : n === 'Lune' ? 'la Lune' : n === 'ISS' ? 'l’ISS' : n)

/** Arrivées des bots entre depuis et t (fin de chaque trajet réellement accompli). */
export function arriveesDesBots(flotte: readonly Bot[], depuis: number, t: number): Annonce[] {
  const l: Annonce[] = []
  for (const bot of flotte) {
    const cycle = bot.cycleJours * JOUR
    for (let n = Math.floor((depuis - ORIGINE) / cycle) - 1; ORIGINE + n * cycle <= t; n++) {
      const debut = ORIGINE + n * cycle
      const a = escaleDuCycle(bot, n), b = escaleDuCycle(bot, n + 1)
      if (a === b) continue
      const depart = debut + (0.1 + 0.3 * tirage(bot, n, 1)) * cycle
      const duree = (distanceKm(stationnement(bot, a, depart), stationnement(bot, b, depart)) / bot.vitesse) * 1000
      const arrivee = depart + duree
      if (arrivee > debut + cycle || arrivee < depuis || arrivee > t) continue
      const verbe = b === 'ISS' ? 'est arrivée auprès de l’ISS' : b === 'Terre' ? 'est revenue autour de la Terre' : `est arrivée à ${nomLieu(b)}`
      l.push({ t: arrivee, de: bot.nom, couleur: bot.couleur, texte: `${bot.nom} ${verbe}.` })
    }
  }
  return l
}

/** Trouvailles du visiteur par les bots : chaque saison (un mois), deux ou trois bots le photographient, après le 3e jour. */
export function trouvaillesDesBots(flotte: readonly Bot[], depuis: number, t: number): Annonce[] {
  const l: Annonce[] = []
  for (let s = numeroSaison(depuis); s <= numeroSaison(t); s++) {
    for (const bot of flotte) {
      if (tirage(bot, s, 21) > 0.22) continue
      const quand = debutSaison(s) + (3 + 20 * tirage(bot, s, 22)) * JOUR
      if (quand < depuis || quand > t) continue
      l.push({ t: quand, de: bot.nom, couleur: bot.couleur, texte: `${bot.nom} a photographié le visiteur de la saison !`, majeure: true })
    }
  }
  return l
}

/** Nombre de trophées d'un bot à l'instant t (il en gagne régulièrement, à son rythme). */
export function tropheesDuBot(bot: Bot, t: number): number {
  // Mises en service étalées sur 2026 : certains commissionnaires sont des anciens, d'autres des nouveaux venus.
  const jours = Math.max(0, (t - ORIGINE) / JOUR - 290 * tirage(bot, 0, 24))
  const rythme = 0.05 + bot.vitesse / 400 + 0.25 * tirage(bot, 0, 23)
  return Math.min(555, Math.floor(2 + jours * rythme))
}

/** Points de commissionnaire d'un bot à l'instant t (il en gagne chaque jour, à son rythme). */
export function pointsDuBot(bot: Bot, t: number): number {
  const jours = Math.max(0, (t - ORIGINE) / JOUR - 290 * tirage(bot, 0, 24))
  const rythme = 4 + bot.vitesse / 8 + 14 * tirage(bot, 0, 25)
  return Math.floor(jours * rythme)
}
