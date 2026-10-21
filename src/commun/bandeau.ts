// Le bandeau d'alertes en haut de l'écran : il affiche les lignes que le moteur lui donne (moteur/bandeau.ts).

import { MODULES } from '../donnees/modules'
import type { LigneBandeau } from '../moteur/bandeau'
import { texteDistance } from '../moteur/navigation'
import { texteArrivee, texteDuree, texteRestant } from './textes'
import { picto, type NomSymbole } from './symboles'
import { GENRES_COURTS, NOMS_ACTIONS, SYMBOLES, VERBES, consigne, texteSecondes } from './textes-missions'

/**
 * Titre et détail d'une ligne : « PANNE : MOTEUR », « vitesse divisée par 2 · à réparer (Capsule) ». Les lignes calmes
 * (en orbite, en route) ont un symbole devant le titre et leurs valeurs en symboles (décision d'Adrien du 20/10/2026) :
 * « (orbite) TERRE », « (altitude) 400 km (tour) 1 h 32 min ».
 */
export function texteLigne(l: LigneBandeau, t: number): { titre: string; detail: string; symbole?: NomSymbole; valeurs?: [NomSymbole, string][] } {
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
  if (l.genre === 'echo') {
    // On ne sait pas quand l'écho reviendra (décision d'Adrien du 18/10/2026) : pas de décompte.
    return { titre: 'PING ENVOYÉ · ON ATTEND L\'ÉCHO…', detail: 'il reviendra à la vitesse de la lumière : bientôt, ou pas' }
  }
  if (l.genre === 'echo-recu') {
    return {
      titre: l.localise ? `MONOLITHE N° ${l.monolithe} LOCALISÉ !` : `ÉCHO REÇU · MONOLITHE N° ${l.monolithe}`,
      detail: l.localise ? 'touche ici pour le voir sur la carte' : `à ${texteDistance(l.distance)} · touche ici pour voir le cercle`,
    }
  }
  if (l.genre === 'chaleur') {
    return { titre: `TEMPÉRATURE COQUE · BOUCLIERS ${l.boucliers} %`, detail: l.boucliers > 50 ? 'la capsule fonce vers le Soleil' : 'ça chauffe… ça chauffe beaucoup trop…' }
  }
  if (l.genre === 'trajet') {
    return { titre: l.cible.toUpperCase(), detail: '', symbole: 'route', valeurs: [['arrivee', texteArrivee(l.arrivee, t)], ['duree', texteRestant(l.reste)]] }
  }
  if (l.genre === 'contrat') {
    const n = l.contrat.etapes.length > 1 ? ` (étape ${l.numero + 1}/${l.contrat.etapes.length})` : ''
    const detail = l.situation === 'action' ? `${NOMS_ACTIONS[l.etape.action]} en cours · ${texteSecondes(l.finAction! - t)}`
      : l.situation === 'sur-place' ? `sur place : touche ${VERBES[l.etape.action]}`
        : consigne(l.etape)
    // Titre court (une ligne) : le genre et le lieu final ; le détail dit quoi faire.
    const lieu = l.contrat.etapes[l.contrat.etapes.length - 1].lieu
    return { titre: `CONTRAT : ${GENRES_COURTS[l.contrat.genre]} · ${lieu.toUpperCase()}`, detail: `${detail}${n}` }
  }
  const valeurs: [NomSymbole, string][] = [[l.engin ? 'distance' : 'altitude', texteDistance(l.altitude)]]
  if (l.tour !== null) valeurs.push(['tour', texteDuree(l.tour * 1000)])
  return { titre: l.centre.toUpperCase(), detail: '', symbole: 'orbite', valeurs }
}

/** L'état de la capsule, toujours visible au pied du bandeau (demande d'Adrien du 17/10/2026). */
export interface EtatCapsuleBandeau { credits: number; soute: string; niveauMoteur: number; vitesse: number; vitesseForcee: boolean }

/** Forme du bandeau déjà affichée (lignes, genres, symboles) : si elle ne change pas, on ne change que les textes. */
let forme = ''

/** Panne : un petit triangle d'alerte qui palpite. */
const SYMBOLE_PANNE = '<svg class="symbole alerte" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z"/><path d="M8 6v4M8 11.8v.4"/></svg>'

export function afficherBandeau(element: HTMLElement, lignes: LigneBandeau[], capsule: EtatCapsuleBandeau, t: number): void {
  const nombre = (n: number) => n.toLocaleString('fr-FR')
  const textes: string[] = []
  // Une valeur : son symbole, puis son texte (seul le texte change d'une seconde à l'autre).
  const valeur = (nom: NomSymbole, texte: string) => { textes.push(texte); return `<span class="val">${picto(nom)}<span data-texte></span></span>` }
  const lignesHtml = lignes.map((l) => {
    const { titre, detail, symbole: nom, valeurs } = texteLigne(l, t)
    textes.push(titre)
    // Mission : son symbole animé (plus vif pendant l'action sur place).
    const symbole = nom ? picto(nom) + ' ' : l.genre === 'contrat' ? SYMBOLES[l.contrat.genre] : l.genre === 'panne' || l.genre === 'missile' ? SYMBOLE_PANNE : ''
    const classe = l.genre === 'orbite' ? 'calme' : l.genre === 'contrat' && l.situation === 'action' ? 'contrat action' : l.genre
    const bas = valeurs ? `<span class="vals">${valeurs.map(([n, v]) => valeur(n, v)).join('')}</span>` : (textes.push(detail), '<span data-texte></span>')
    // Toucher une ligne ouvre le volet qui va avec (demande d'Adrien du 18/10/2026 ; voir main.ts).
    return `<div class="ligne ${classe}" data-ligne="${l.genre}"><b>${symbole}<span data-texte></span></b>${bas}</div>`
  })
  // Le pied : crédits, soute, moteur et sa vitesse.
  const etat = valeur('credits', nombre(capsule.credits)) + valeur('soute', `${capsule.soute} t`)
    + (capsule.vitesseForcee ? valeur('vitesse', `${nombre(capsule.vitesse)} km/s (essai)`)
      : valeur('moteur', `niv. ${capsule.niveauMoteur}`) + valeur('vitesse', `${nombre(capsule.vitesse)} km/s`))
  const html = lignesHtml.join('') + `<div class="etat" data-ligne="etat">${etat}</div>`
  // Réécrire le bandeau relancerait les animations (le compte à rebours change chaque seconde) : seulement si sa forme
  // change ; sinon, les textes seuls.
  if (html !== forme) element.innerHTML = forme = html
  element.querySelectorAll<HTMLElement>('[data-texte]').forEach((e, k) => { if (e.textContent !== textes[k]) e.textContent = textes[k] })
}
