// Le bandeau d'alertes en haut de l'écran : il affiche les lignes que le moteur lui donne (moteur/bandeau.ts).

import { MODULES } from '../donnees/modules'
import type { LigneBandeau } from '../moteur/bandeau'
import { texteDistance } from '../moteur/navigation'
import { autourDe, texteDateCourte, texteDuree, texteRestant } from './textes'
import { GENRES_COURTS, NOMS_ACTIONS, SYMBOLES, VERBES, consigne, texteSecondes } from './textes-missions'

/** Titre et détail d'une ligne : « EN ROUTE VERS MARS », « arrivée demain à 07:10 · dans 19 h 20 min ». */
export function texteLigne(l: LigneBandeau, t: number): { titre: string; detail: string } {
  if (l.genre === 'missile') {
    const s = Math.ceil(l.reste / 1000)
    return {
      titre: `MISSILE EN APPROCHE · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
      detail: l.intercepteurs ? `touche ici pour l'intercepter (${l.intercepteurs} intercepteur${l.intercepteurs > 1 ? 's' : ''})` : 'plus d\'intercepteur : il va frapper !',
    }
  }
  if (l.genre === 'panne') {
    const fiches = l.modules.map((m) => MODULES.find((f) => f.nom === m)!)
    return {
      titre: `PANNE : ${fiches.map((f) => f.titre.toUpperCase()).join(', ')}`,
      detail: fiches.length === 1 ? `${fiches[0].effet} · à réparer (Capsule)` : 'à réparer (Capsule)',
    }
  }
  if (l.genre === 'trajet') {
    return { titre: `EN ROUTE VERS ${l.cible.toUpperCase()}`, detail: `arrivée ${texteDateCourte(l.arrivee, t)} · dans ${texteRestant(l.reste)}` }
  }
  if (l.genre === 'contrat') {
    const n = l.contrat.etapes.length > 1 ? ` (étape ${l.numero + 1}/${l.contrat.etapes.length})` : ''
    const detail = l.situation === 'action' ? `${NOMS_ACTIONS[l.etape.action]} en cours · ${texteSecondes(l.finAction! - t)}`
      : l.situation === 'sur-place' ? `sur place : touche ${VERBES[l.etape.action]}`
        : consigne(l.etape)
    // Titre court (une ligne) : le genre et le lieu final ; le détail dit quoi faire.
    const lieu = l.contrat.etapes[l.contrat.etapes.length - 1].lieu
    return { titre: `MISSION : ${GENRES_COURTS[l.contrat.genre]} · ${lieu.toUpperCase()}`, detail: `${detail}${n}` }
  }
  const ou = l.engin ? `à ${texteDistance(l.altitude)}` : `altitude ${texteDistance(l.altitude)}`
  const tour = l.tour !== null ? ` · un tour en ${texteDuree(l.tour * 1000)}` : ''
  return { titre: `EN ORBITE ${autourDe(l.centre)}`, detail: `${ou}${tour}` }
}

/** L'état de la capsule, toujours visible au pied du bandeau (demande d'Adrien du 17/10/2026). */
export interface EtatCapsuleBandeau { credits: number; soute: string; niveauMoteur: number; vitesse: number; vitesseForcee: boolean }

/** Forme du bandeau déjà affichée (lignes, genres, symboles) : si elle ne change pas, on ne change que les textes. */
let forme = ''

/** Panne : un petit triangle d'alerte qui palpite. */
const SYMBOLE_PANNE = '<svg class="symbole alerte" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z"/><path d="M8 6v4M8 11.8v.4"/></svg>'

export function afficherBandeau(element: HTMLElement, lignes: LigneBandeau[], capsule: EtatCapsuleBandeau, t: number): void {
  const credits = `${capsule.credits.toLocaleString('fr-FR')} crédit${capsule.credits > 1 ? 's' : ''} · soute ${capsule.soute}`
  const moteur = capsule.vitesseForcee
    ? `vitesse forcée ${capsule.vitesse.toLocaleString('fr-FR')} km/s (essai)`
    : `moteur niv. ${capsule.niveauMoteur} · ${capsule.vitesse.toLocaleString('fr-FR')} km/s`
  const textes: string[] = []
  const lignesHtml = lignes.map((l) => {
    const { titre, detail } = texteLigne(l, t)
    textes.push(titre, detail)
    // Mission : son symbole animé (plus vif pendant l'action sur place).
    const symbole = l.genre === 'contrat' ? SYMBOLES[l.contrat.genre] : l.genre === 'panne' || l.genre === 'missile' ? SYMBOLE_PANNE : ''
    const classe = l.genre === 'orbite' ? 'calme' : l.genre === 'contrat' && l.situation === 'action' ? 'contrat action' : l.genre
    // Toucher une ligne ouvre le volet qui va avec (demande d'Adrien du 18/10/2026 ; voir main.ts).
    return `<div class="ligne ${classe}" data-ligne="${l.genre}"><b>${symbole}<span data-texte></span></b><span data-texte></span></div>`
  })
  textes.push(credits, moteur)
  const html = lignesHtml.join('') + '<div class="etat" data-ligne="etat"><span data-texte></span><span data-texte></span></div>'
  // Réécrire le bandeau relancerait les animations (le compte à rebours change chaque seconde) : seulement si sa forme
  // change ; sinon, les textes seuls.
  if (html !== forme) element.innerHTML = forme = html
  element.querySelectorAll<HTMLElement>('[data-texte]').forEach((e, k) => { if (e.textContent !== textes[k]) e.textContent = textes[k] })
}
