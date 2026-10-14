// Télégrammes entre commissionnaires (et de l'Office) : texte libre ou phrase toute faite, quota de 3 envois par
// 24 heures, portée (son système, un joueur, tout le système solaire), et réception au vrai délai de la lumière :
// chacun reçoit le télégramme quand la lumière partie du point d'émission l'atteint.

import { positionCorps } from '../astro/corps'
import { delaiLumiere } from '../astro/lumiere'
import type { Vecteur3 } from '../astro/vecteur'
import { TELEGRAMMES } from '../donnees/reglages'
import { OFFICE } from '../donnees/telegrammes'
import type { EtatPartie } from './etat'
import { systemeDeLaFusee } from './fusee'

/** À qui s'adresse un télégramme. */
export type Portee = { type: 'systeme'; systeme: string } | { type: 'joueur'; serie: string; nom: string } | { type: 'tout' }

/** Un télégramme, tel qu'il part : l'émetteur, sa position et son système au moment de l'envoi. */
export interface Telegramme {
  id: string
  /** Nom de la fusée émettrice (ou de l'Office). */
  de: string
  /** Numéro de série de l'émetteur (« ONVI » pour l'Office). */
  serie: string
  couleur?: string
  texte: string
  portee: Portee
  /** Instant d'émission (ms UTC). */
  envoye: number
  /** Point d'émission (UA, héliocentrique). */
  origine: Vecteur3
  /** Système de l'émetteur à l'envoi (null entre les planètes). */
  systeme: string | null
}

/** Un télégramme reçu : avec l'instant où il arrive au destinataire. */
export interface TelegrammeRecu extends Telegramme {
  arrivee: number
}

export interface EtatTelegrammes {
  /** Télégrammes envoyés par le joueur (le plus récent en premier, 30 au plus). */
  envoyes: Telegramme[]
  /** Instant jusqu'où les télégrammes reçus ont été lus (anciennes sauvegardes). */
  luJusqua: number
  /** Identifiants des télégrammes reçus déjà lus (les 100 derniers). L'heure d'arrivée bouge un peu avec la
   * fusée (le délai de la lumière dépend de sa position) : on retient donc les télégrammes eux-mêmes. */
  lus?: string[]
}

export const telegrammesDe = (etat: EtatPartie): EtatTelegrammes => etat.telegrammes ?? { envoyes: [], luJusqua: etat.creeLe - 1 }

/** Le télégramme reçu a-t-il été lu ? */
export function estLu(etat: EtatPartie, m: TelegrammeRecu): boolean {
  const tg = telegrammesDe(etat)
  return tg.lus ? tg.lus.includes(m.id) : m.arrivee <= tg.luJusqua
}

/** Marque des télégrammes reçus comme lus ; renvoie l'état inchangé s'ils l'étaient déjà. */
export function marquerLus(etat: EtatPartie, recus: readonly TelegrammeRecu[]): EtatPartie {
  const nouveaux = recus.filter((m) => !estLu(etat, m))
  if (!nouveaux.length) return etat
  const tg = telegrammesDe(etat)
  const anciens = tg.lus ?? recus.filter((m) => m.arrivee <= tg.luJusqua).map((m) => m.id)
  return { ...etat, telegrammes: { ...tg, lus: [...nouveaux.map((m) => m.id), ...anciens].slice(0, 100) } }
}

/** Envois encore permis (24 heures glissantes). */
export function envoisRestants(etat: EtatPartie, t: number): number {
  const recents = telegrammesDe(etat).envoyes.filter((m) => m.envoye > t - 86_400_000).length
  return Math.max(0, TELEGRAMMES.parJour - recents)
}

/** Instant où le prochain envoi redeviendra possible (quand le quota est épuisé), sinon null. */
export function prochainEnvoi(etat: EtatPartie, t: number): number | null {
  if (envoisRestants(etat, t) > 0) return null
  const recents = telegrammesDe(etat).envoyes.filter((m) => m.envoye > t - 86_400_000).map((m) => m.envoye)
  return Math.min(...recents) + 86_400_000
}

/** Système où se trouve la fusée du joueur. */
export function systemeDuJoueur(etat: EtatPartie, t: number): string | null {
  return systemeDeLaFusee(etat.fusee, t)
}

/** Envoie un télégramme ; null si le texte est vide ou trop long, le quota épuisé, ou la portée impossible. */
export function envoyerTelegramme(etat: EtatPartie, texte: string, portee: Portee, t: number): EtatPartie | null {
  const propre = texte.replace(/\s+/g, ' ').trim()
  if (!propre || propre.length > TELEGRAMMES.longueur) return null
  if (envoisRestants(etat, t) === 0) return null
  const systeme = systemeDuJoueur(etat, t)
  if (portee.type === 'systeme' && portee.systeme !== systeme) return null
  const m: Telegramme = {
    id: `${etat.serie}-${t}`, de: etat.nom || etat.serie, serie: etat.serie, texte: propre, portee, envoye: t,
    origine: { ...etat.fusee.position, z: etat.fusee.z ?? 0 }, systeme,
  }
  const avant = telegrammesDe(etat)
  return {
    ...etat,
    telegrammes: { ...avant, envoyes: [m, ...avant.envoyes].slice(0, 30) },
    stats: { ...etat.stats, telegrammes: (etat.stats.telegrammes ?? 0) + 1 },
  }
}

/** Le destinataire (sa série, son système) est-il visé par le télégramme ? On ne reçoit jamais les siens. */
export function estDestinataire(m: Telegramme, serie: string, systeme: string | null): boolean {
  if (m.serie === serie) return false
  if (m.portee.type === 'tout') return true
  if (m.portee.type === 'joueur') return m.portee.serie === serie
  return systeme !== null && m.portee.systeme === systeme
}

/** Instant d'arrivée du télégramme en un point (vrai délai de la lumière). */
export function arriveeEn(m: Telegramme, ou: Vecteur3): number {
  const d = Math.hypot(m.origine.x - ou.x, m.origine.y - ou.y, (m.origine.z ?? 0) - (ou.z ?? 0))
  return m.envoye + delaiLumiere(d) * 1000
}

/** Télégrammes de l'Office (émis depuis la Terre) : l'accueil, puis chaque lundi l'annonce des nouveaux contrats. */
export function telegrammesOffice(etat: EtatPartie, depuis: number, t: number): Telegramme[] {
  const depuisTerre = (id: string, texte: string, envoye: number): Telegramme => ({
    id, de: OFFICE.nom, serie: 'ONVI', texte, portee: { type: 'tout' }, envoye, origine: positionCorps('Terre', envoye), systeme: 'Terre',
  })
  const l: Telegramme[] = []
  if (etat.creeLe >= depuis) l.push(depuisTerre('onvi-bienvenue', OFFICE.bienvenue, etat.creeLe))
  // Lundis 00:00 UTC.
  const d = new Date(t)
  const joursDepuisLundi = (d.getUTCDay() + 6) % 7
  for (let lundi = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - joursDepuisLundi); lundi >= depuis; lundi -= 7 * 86_400_000) {
    if (lundi > etat.creeLe) l.push(depuisTerre(`onvi-contrats-${lundi}`, OFFICE.contrats, lundi))
  }
  return l
}
