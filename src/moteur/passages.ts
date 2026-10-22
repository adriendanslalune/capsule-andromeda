// Les capitaines bavards croisés en route (Adrien, 22/10/2026 : plus fun) : quand la capsule est en orbite au même
// endroit qu'un bavard à son escale, il lui lance une phrase. Toujours la même pour un bavard, un lieu et un jour
// (rien ne dépend du hasard de l'affichage).

import { BOTS_BAVARDS } from '../donnees/messages'
import { PHRASES_DE_PASSAGE } from '../donnees/passages'
import { ouEstLeBot } from './corps'

/** Les bavards en escale à ce lieu, à l'instant t. */
export function bavardsIci(lieu: string, t: number): string[] {
  return BOTS_BAVARDS.filter((b) => { const o = ouEstLeBot(b.pseudo, t); return !o.enRoute && o.lieu === lieu }).map((b) => b.pseudo)
}

/** Ce qu'un bavard dit en passant, ce jour-là, à ce lieu. */
export function phraseDePassage(pseudo: string, lieu: string, t: number): string {
  const cle = `${pseudo}/${lieu}/${Math.floor(t / 86_400_000)}`
  let h = 0
  for (const c of cle) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PHRASES_DE_PASSAGE[h % PHRASES_DE_PASSAGE.length]
}
