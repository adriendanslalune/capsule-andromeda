// Le bandeau d'alertes en haut de l'écran : il affiche les lignes que le moteur lui donne (moteur/bandeau.ts).

import type { LigneBandeau } from '../moteur/bandeau'
import { texteDistance } from '../moteur/navigation'
import { autourDe, texteDateCourte, texteDuree } from './textes'

/** Titre et détail d'une ligne : « EN ROUTE VERS MARS », « arrivée demain à 07:10 · dans 19 h 20 min ». */
export function texteLigne(l: LigneBandeau, t: number): { titre: string; detail: string } {
  if (l.genre === 'trajet') {
    return { titre: `EN ROUTE VERS ${l.cible.toUpperCase()}`, detail: `arrivée ${texteDateCourte(l.arrivee, t)} · dans ${texteDuree(l.reste)}` }
  }
  const ou = l.engin ? `à ${texteDistance(l.altitude)}` : `altitude ${texteDistance(l.altitude)}`
  const tour = l.tour !== null ? ` · un tour en ${texteDuree(l.tour * 1000)}` : ''
  return { titre: `EN ORBITE ${autourDe(l.centre)}`, detail: `${ou}${tour}` }
}

/** L'état de la capsule, toujours visible au pied du bandeau (demande d'Adrien du 17/10/2026). */
export interface EtatCapsuleBandeau { credits: number; niveauMoteur: number; vitesse: number; vitesseForcee: boolean }

let dernier = ''

export function afficherBandeau(element: HTMLElement, lignes: LigneBandeau[], capsule: EtatCapsuleBandeau, t: number): void {
  const credits = `${capsule.credits.toLocaleString('fr-FR')} crédit${capsule.credits > 1 ? 's' : ''}`
  const moteur = capsule.vitesseForcee
    ? `vitesse forcée ${capsule.vitesse.toLocaleString('fr-FR')} km/s (essai)`
    : `moteur niv. ${capsule.niveauMoteur} · ${capsule.vitesse.toLocaleString('fr-FR')} km/s`
  const html = lignes.map((l) => {
    const { titre, detail } = texteLigne(l, t)
    return `<div class="ligne${l.genre === 'orbite' ? ' calme' : ''}"><b>${titre}</b><span>${detail}</span></div>`
  }).join('') + `<div class="etat"><span>${credits}</span><span>${moteur}</span></div>`
  if (html !== dernier) element.innerHTML = dernier = html
}
