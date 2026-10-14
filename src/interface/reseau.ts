// Les autres commissionnaires. Le serveur viendra en phase 4 : d'ici là, la flotte des bots (src/donnees/flotte.ts)
// tient leur place. Seul ce fichier changera quand le serveur existera : il donnera alors les vraies fusées, avec les
// mêmes champs.

import { planeteDe } from '../astro/corps'
import type { Vecteur3 } from '../astro/vecteur'
import { BOTS_ACTIFS, FLOTTE } from '../donnees/flotte'
import type { EtatPartie } from '../moteur/etat'
import { TELEGRAMMES } from '../donnees/reglages'
import { botEnLigne, positionBot, reponsesDesBots, telegrammesDesBots } from '../moteur/flotte'
import { arriveeEn, estDestinataire, estLu, systemeDuJoueur, telegrammesDe, telegrammesOffice, type TelegrammeRecu } from '../moteur/telegrammes'
import { systemeDeLaFusee } from '../moteur/fusee'

/** Une autre fusée, telle qu'on la voit sur la carte et par le hublot. */
export interface AutreFusee {
  nom: string
  serie: string
  couleur: string
  /** Position héliocentrique (UA). */
  position: Vecteur3
  cap: number
  escale: string | null
  systeme: string | null
  enLigne: boolean
}

export function autresFusees(t: number): AutreFusee[] {
  if (!BOTS_ACTIFS) return []
  return FLOTTE.map((bot) => {
    const p = positionBot(bot, t)
    return { nom: bot.nom, serie: bot.serie, couleur: bot.couleur, position: p.position, cap: p.cap, escale: p.escale, systeme: p.systeme, enLigne: botEnLigne(bot, t) }
  })
}

export interface Presence {
  /** Commissionnaires connectés dans tout le système solaire (soi compris). */
  total: number
  /** Commissionnaires connectés dans le même système planétaire que la fusée (null hors de tout système). */
  ici: number | null
  /** Planète du système où se trouve la fusée, ou null (en route entre les planètes). */
  systeme: string | null
  /** Vrai tant que le serveur n'existe pas : les autres sont des bots. */
  horsReseau: boolean
}

export function presence(etat: EtatPartie, t: number): Presence {
  const systeme = etat.fusee.orbite ? planeteDe(etat.fusee.orbite) : systemeDeLaFusee(etat.fusee, t)
  const connectes = autresFusees(t).filter((f) => f.enLigne)
  return {
    total: 1 + connectes.length,
    ici: systeme ? 1 + connectes.filter((f) => f.systeme === systeme).length : null,
    systeme,
    horsReseau: true,
  }
}

/**
 * Télégrammes reçus par le joueur et déjà arrivés (vrai délai de la lumière depuis le point d'émission), le plus
 * récent en premier : ceux de l'Office et, en attendant le serveur, ceux de la flotte et ses réponses.
 */
export function telegrammesRecus(etat: EtatPartie, t: number): TelegrammeRecu[] {
  const depuis = t - TELEGRAMMES.gardesJours * 86_400_000
  const avance = depuis - 3_600_000 // émis un peu avant, arrivés dans la fenêtre
  const ici = { ...etat.fusee.position, z: etat.fusee.z ?? 0 }
  const systeme = systemeDuJoueur(etat, t)
  const emis = [
    ...telegrammesOffice(etat, avance, t),
    ...(BOTS_ACTIFS ? telegrammesDesBots(FLOTTE, avance, t) : []),
    ...(BOTS_ACTIFS ? reponsesDesBots(FLOTTE, telegrammesDe(etat).envoyes.filter((m) => m.envoye > avance), { serie: etat.serie, nom: etat.nom }) : []),
  ]
  return emis
    .filter((m) => m.serie === 'ONVI' || estDestinataire(m, etat.serie, systeme))
    .map((m) => ({ ...m, arrivee: arriveeEn(m, ici) }))
    .filter((m) => m.arrivee <= t && m.arrivee >= depuis)
    .sort((a, b) => b.arrivee - a.arrivee)
}

/** Télégrammes arrivés depuis la dernière lecture. */
export function nonLus(etat: EtatPartie, recus: TelegrammeRecu[]): number {
  return recus.filter((m) => !estLu(etat, m)).length
}
