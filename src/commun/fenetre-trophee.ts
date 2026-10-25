// La petite fenêtre « TROPHÉE ! » (cadre validé par Adrien le 24/10/2026) : elle glisse sous la console, montre la
// médaille, le nom, la phrase et ce qui l'a valu, et se referme seule (la toucher la referme plus tôt). Plusieurs d'un coup (une partie
// qui découvre les trophées, par exemple) : une seule fenêtre, qui les montre en rang.

import type { Trophee } from '../donnees/trophees'
import { medaille } from './medailles'

const DUREE = 5000, DUREE_PLUSIEURS = 8000

export class FenetreTrophee {
  private element: HTMLDivElement
  private minuterie = 0

  constructor() {
    this.element = document.createElement('div')
    this.element.id = 'trophee-gagne'
    this.element.hidden = true
    this.element.setAttribute('role', 'status')
    this.element.addEventListener('click', () => this.fermer())
    document.body.append(this.element)
  }

  get ouverte(): boolean {
    return !this.element.hidden
  }

  /** haut : où poser la fenêtre (px), juste sous la console. */
  montrer(trophees: Trophee[], haut?: number): void {
    if (!trophees.length) return
    if (haut !== undefined) this.element.style.top = `${Math.round(haut)}px`
    const seul = trophees.length === 1 ? trophees[0] : null
    this.element.innerHTML = seul
      ? `${medaille(seul.categorie, seul.rarete, true)}<div><span class="etoile-trophee">TROPHÉE !</span><b>${seul.nom}</b><small>« ${seul.phrase} »</small><small class="indice-trophee">${seul.indice}</small></div>`
      : `<div class="plusieurs"><span class="etoile-trophee">${trophees.length} TROPHÉES !</span>`
        + `<div class="rang-medailles">${trophees.slice(0, 6).map((x) => `<span title="${x.nom}">${medaille(x.categorie, x.rarete, true)}</span>`).join('')}</div>`
        + `<small>${trophees.slice(0, 3).map((x) => x.nom).join(', ')}${trophees.length > 3 ? ` et ${trophees.length - 3} autre${trophees.length > 4 ? 's' : ''}` : ''}. Ils t'attendent dans le Profil.</small></div>`
    this.element.classList.toggle('or', !!seul && seul.rarete === 'or')
    this.element.hidden = false
    // L'animation repart à chaque fois.
    this.element.classList.remove('arrive')
    void this.element.offsetWidth
    this.element.classList.add('arrive')
    navigator.vibrate?.([30, 40, 30])
    clearTimeout(this.minuterie)
    this.minuterie = window.setTimeout(() => this.fermer(), seul ? DUREE : DUREE_PLUSIEURS)
  }

  fermer(): void {
    clearTimeout(this.minuterie)
    this.element.hidden = true
  }
}
