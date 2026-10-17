// Le bandeau d'alertes en haut de l'écran : il affiche les lignes que le moteur lui donne (moteur/bandeau.ts).

import type { LigneBandeau } from '../moteur/bandeau'
import { texteDistance } from '../moteur/navigation'
import { autourDe, texteDateCourte, texteDuree } from './textes'

export function afficherBandeau(element: HTMLElement, lignes: LigneBandeau[], t: number): void {
  const html = lignes.map((l) => {
    if (l.genre === 'trajet') {
      return `<div class="ligne"><b>EN ROUTE VERS ${l.cible.toUpperCase()}</b>`
        + `<span>arrivée ${texteDateCourte(l.arrivee, t)} · dans ${texteDuree(l.reste)}</span></div>`
    }
    const ou = l.engin ? `à ${texteDistance(l.altitude)}` : `altitude ${texteDistance(l.altitude)}`
    const tour = l.tour !== null ? ` · un tour en ${texteDuree(l.tour * 1000)}` : ''
    return `<div class="ligne calme"><b>EN ORBITE ${autourDe(l.centre)}</b><span>${ou}${tour}</span></div>`
  }).join('')
  if (element.innerHTML !== html) element.innerHTML = html
}
