// Le volet Missions : la mission en cours (ses étapes, Y ALLER, l'action sur place, abandonner) et les missions
// proposées (ACCEPTER). Il ne décide rien : il affiche l'état du jeu et transmet les choix du joueur.

import type { Jeu } from '../moteur/jeu'
import { distanceDepuisCapsule, texteDistance } from '../moteur/navigation'
import { GENRES_COURTS, NOMS_ACTIONS, VERBES, consigne, texteSecondes, titreContrat } from './textes-missions'

export interface ChoixMissions {
  accepter(id: number): void
  allerA(lieu: string): void
  agir(): void
  abandonner(): void
}

export class VoletMissions {
  private dernier = ''

  constructor(private element: HTMLElement, choix: ChoixMissions) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix]')
      if (!b || b.disabled) return
      if (b.dataset.choix === 'accepter') choix.accepter(Number(b.dataset.id))
      else if (b.dataset.choix === 'aller') choix.allerA(b.dataset.lieu!)
      else if (b.dataset.choix === 'agir') choix.agir()
      else if (b.dataset.choix === 'abandonner') choix.abandonner()
    })
  }

  afficher(jeu: Jeu, t: number): void {
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
    html += '<h3>Missions proposées</h3>'
    for (const c of jeu.proposes) {
      const premier = c.etapes[0].lieu
      html += `<div class="contrat"><div class="titre"><span class="genre">${GENRES_COURTS[c.genre]}</span><span class="prix">${c.recompense} cr.</span></div>`
        + `<b>${titreContrat(c)}</b><div class="pied"><span>à ${texteDistance(distanceDepuisCapsule(premier, t))}</span>`
        + `<button type="button" data-choix="accepter" data-id="${c.id}"${ec ? ' disabled' : ''}>ACCEPTER</button></div></div>`
    }
    if (ec) html += '<p class="note">Une seule mission à la fois : termine ou abandonne celle en cours.</p>'
    if (html !== this.dernier) this.element.innerHTML = this.dernier = html
  }
}
