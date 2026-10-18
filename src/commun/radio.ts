// La radio des monolithes, en tête du volet Navigation (décision d'Adrien du 18/10/2026) : le bouton PING, et ce que
// la radio sait (écho attendu, prochain PING, monolithes trouvés). Elle ne calcule rien : elle demande au moteur.

import { NOMBRE_MONOLITHES } from '../donnees/monolithes'
import type { Jeu } from '../moteur/jeu'
import { echoEnRoute, peutPinger, prochainPing } from '../moteur/monolithes'
import { texteRestant } from './textes'

const minutes = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 3600 ? texteRestant(ms) : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function htmlRadio(jeu: Jeu, t: number): string {
  const e = jeu.monolithes
  const echo = echoEnRoute(e, t)
  const pret = peutPinger(e, t)
  const etat = echo ? `écho attendu dans ${minutes(echo.retour - t)}`
    : pret ? 'prête : le monolithe le plus proche répondra'
      : `prochain PING dans ${minutes(prochainPing(e) - t)}`
  return `<div class="radio"><button type="button" data-ping${pret ? '' : ' disabled'}>PING</button>`
    + `<span><b>RADIO · MONOLITHES</b><small>${etat}</small><small>${e.trouves.length} / ${NOMBRE_MONOLITHES} trouvés</small></span></div>`
}
