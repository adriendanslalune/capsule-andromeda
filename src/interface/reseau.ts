// Présence des autres commissionnaires. Le serveur viendra en phase 4 : d'ici là, on ne connaît que soi-même.
// L'interface affiche donc « 1 » et le signale (« hors réseau ») ; seul ce fichier changera quand le serveur existera.

import { planeteDe } from '../astro/corps'
import type { EtatPartie } from '../moteur/etat'
import { systemeDeLaFusee } from '../moteur/fusee'

export interface Presence {
  /** Commissionnaires connectés dans tout le système solaire. */
  total: number
  /** Commissionnaires dans le même système planétaire que la fusée (null hors de tout système). */
  ici: number | null
  /** Planète du système où se trouve la fusée, ou null (en route entre les planètes). */
  systeme: string | null
  /** Vrai tant que le serveur n'existe pas : les chiffres ne comptent que le joueur. */
  horsReseau: boolean
}

export function presence(etat: EtatPartie, t: number): Presence {
  const systeme = etat.fusee.orbite ? planeteDe(etat.fusee.orbite) : systemeDeLaFusee(etat.fusee, t)
  return { total: 1, ici: systeme ? 1 : null, systeme, horsReseau: true }
}
