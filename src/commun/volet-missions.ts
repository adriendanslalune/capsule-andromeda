// Le volet Missions : la mission en cours (ses étapes, Y ALLER, l'action sur place, abandonner) et les missions
// proposées (ACCEPTER). Il ne décide rien : il affiche l'état du jeu et transmet les choix du joueur.

import type { Jeu } from '../moteur/jeu'
import { distanceDepuisCapsule, texteDistance } from '../moteur/navigation'
import type { Contrat } from '../moteur/contrats'
import { texteDuree } from './textes'
import { GENRES_COURTS, NOMS_ACTIONS, VERBES, consigne, texteSecondes, titreContrat } from './textes-missions'

export interface ChoixMissions {
  accepter(id: number): void
  voir(id: number): void
  allerA(lieu: string): void
  agir(): void
  abandonner(): void
}

/** Temps de trajet d'une mission recalculé au plus toutes les 20 secondes (le calcul est long, et l'ordre de la liste
 *  ne doit pas sauter sans arrêt). */
const RAFRAICHIR_DUREES = 20_000

export class VoletMissions {
  private dernier = ''
  private durees = new Map<number, { calcule: number; duree: number | null }>()

  /** Temps de trajet d'une mission (ms), depuis là où est la capsule, ou null si hors de portée. */
  duree(jeu: Jeu, c: Contrat, t: number, vitesse: number, maintenant: number): number | null {
    const d = this.durees.get(c.id)
    if (d && maintenant - d.calcule < RAFRAICHIR_DUREES) return d.duree
    const duree = jeu.dureeTrajets(c, t, vitesse)
    this.durees.set(c.id, { calcule: maintenant, duree })
    return duree
  }

  /** À appeler quand la capsule part ou change de vitesse : les temps de trajet sont à recalculer. */
  oublierDurees(): void {
    this.durees.clear()
  }

  constructor(private element: HTMLElement, choix: ChoixMissions) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix]')
      if (!b || b.disabled) return
      if (b.dataset.choix === 'accepter') choix.accepter(Number(b.dataset.id))
      else if (b.dataset.choix === 'voir') choix.voir(Number(b.dataset.id))
      else if (b.dataset.choix === 'aller') choix.allerA(b.dataset.lieu!)
      else if (b.dataset.choix === 'agir') choix.agir()
      else if (b.dataset.choix === 'abandonner') choix.abandonner()
    })
  }

  afficher(jeu: Jeu, t: number, vitesse: number, maintenant: number): void {
    let html = ''
    const ec = jeu.enCours
    if (ec) {
      const fin = jeu.finAction()
      const etapes = ec.contrat.etapes.map((e, i) => {
        const etat = i < ec.etape ? 'faite' : i === ec.etape ? 'actuelle' : ''
        return `<li class="${etat}">${i < ec.etape ? '✓ ' : ''}${VERBES[e.action].charAt(0)}${VERBES[e.action].slice(1).toLowerCase()} — ${e.lieu}</li>`
      }).join('')
      const e = jeu.etapeActuelle()!
      const bouton = fin !== null
        ? `<div class="action-en-cours">${NOMS_ACTIONS[e.action]} en cours · ${texteSecondes(fin - t)}</div>`
        : jeu.surPlace(t)
          ? `<button type="button" class="principal" data-choix="agir">${VERBES[e.action]}</button>`
          : `<button type="button" class="principal" data-choix="aller" data-lieu="${e.lieu}">Y ALLER</button><span class="consigne">${consigne(e)} · ${texteDistance(distanceDepuisCapsule(e.lieu, t))}</span>`
      html += `<h3>Mission en cours</h3><div class="contrat en-cours"><div class="titre"><b>${titreContrat(ec.contrat)}</b><span class="prix">${ec.contrat.recompense} cr.</span></div>`
        + `<ol>${etapes}</ol><div class="actions">${bouton}</div>`
        + `<button type="button" class="abandon" data-choix="abandonner">Abandonner la mission</button></div>`
    }
    // Missions proposées : de la plus proche à la plus lointaine en temps de trajet (demande d'Adrien, 17/10/2026).
    html += '<h3>Missions proposées</h3>'
    const triees = jeu.proposes.map((c) => ({ c, d: this.duree(jeu, c, t, vitesse, maintenant) }))
      .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity))
    for (const { c, d } of triees) {
      const trajet = d === null ? 'hors de portée' : d === 0 ? 'sur place' : `trajet ${texteDuree(d)}`
      html += `<div class="contrat"><div class="titre"><span class="genre">${GENRES_COURTS[c.genre]}</span><span class="prix">${c.recompense} cr.</span></div>`
        + `<b>${titreContrat(c)}</b><div class="pied"><span><b>${trajet}</b><br>à ${texteDistance(distanceDepuisCapsule(c.etapes[0].lieu, t))}</span>`
        + `<span class="boutons"><button type="button" data-choix="voir" data-id="${c.id}">VOIR</button>`
        + `<button type="button" data-choix="accepter" data-id="${c.id}"${ec ? ' disabled' : ''}>ACCEPTER</button></span></div></div>`
    }
    if (ec) html += '<p class="note">Une seule mission à la fois : termine ou abandonne celle en cours.</p>'
    if (html !== this.dernier) this.element.innerHTML = this.dernier = html
  }
}
