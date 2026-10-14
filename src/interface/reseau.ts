// Les autres commissionnaires. Le serveur viendra en phase 4 : d'ici là, la flotte des bots (src/donnees/flotte.ts)
// tient leur place. Seul ce fichier changera quand le serveur existera : il donnera alors les vraies fusées, avec les
// mêmes champs.

import { planeteDe } from '../astro/corps'
import type { Vecteur3 } from '../astro/vecteur'
import { BOTS_ACTIFS, FLOTTE } from '../donnees/flotte'
import type { EtatPartie } from '../moteur/etat'
import { botEnLigne, positionBot } from '../moteur/flotte'
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
