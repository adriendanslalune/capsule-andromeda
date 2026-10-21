// Le classeur des Disparus (idée validée par Adrien le 21/10/2026), en plein écran : pré-rempli, les quarante cases
// sont là dès le début. Une case grise montre la sonde, qui l'a lancée, et l'indice (où chercher), avec CHERCHER ;
// une sonde retrouvée montre son histoire vraie et la date de sa découverte. La vue ne calcule rien : l'état vient
// de moteur/disparus.ts.

import { DISPARUS, NOMBRE_DISPARUS } from '../donnees/disparus'
import type { EtatDisparus } from '../moteur/disparus'

/** Une sonde, en petit : un corps, une antenne parabolique, deux panneaux. */
export const SONDE = '<svg viewBox="0 0 48 40" aria-hidden="true"><path class="panneau" d="M2 16h12v8H2zM34 16h12v8H34z"/><path class="bras" d="M14 20h6M28 20h6"/><rect class="corps-sonde" x="19" y="14" width="10" height="12" rx="1.5"/><path class="parabole" d="M17 13a7 4 0 0 1 14 0z"/><path class="antenne" d="M24 9V4"/></svg>'

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class VueDisparus {
  constructor(private element: HTMLElement, private etat: () => EtatDisparus, private chercher: (numero: number) => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      if (b.dataset.fermer !== undefined) this.fermer()
      else if (b.dataset.chercher) { this.chercher(Number(b.dataset.chercher)); this.fermer() }
    })
  }

  ouvrir(): void {
    this.afficher()
    this.element.hidden = false
  }

  fermer(): void {
    this.element.hidden = true
  }

  private afficher(): void {
    const e = this.etat(), n = Object.keys(e.trouves).length
    const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const cartes = DISPARUS.map((d) => {
      const trouve = e.trouves[d.numero]
      if (trouve !== undefined) {
        return `<div class="carte-disparu trouve"><b class="numero">n° ${d.numero}</b>${SONDE}<b class="nom">${echapper(d.nom)}</b>`
          + `<small>${echapper(d.qui)} · ${d.annee}</small><p>${echapper(d.histoire)}</p><small class="date">retrouvée le ${date(trouve)}</small></div>`
      }
      const echo = e.echos[d.numero] !== undefined, suivi = e.suivi === d.numero
      return `<div class="carte-disparu${suivi ? ' suivi' : ''}"><b class="numero">n° ${d.numero}</b><b class="nom">${echapper(d.nom)}</b>`
        + `<small>${echapper(d.qui)} · ${d.annee}</small><p class="indice">${echapper(d.indice)}</p>`
        + (echo ? '<small class="echo">écho capté : elle est sur la carte</small>' : '')
        + `<button type="button" data-chercher="${d.numero}">${suivi ? 'Y RETOURNER' : 'CHERCHER'}</button></div>`
    }).join('')
    this.element.innerHTML = `
      <div class="entete-plein"><span>Les Disparus</span><button type="button" data-fermer>FERMER</button></div>
      <div class="corps"><p class="bilan-classeur"><b>${n} / ${NOMBRE_DISPARUS} retrouvées</b><small>De vraies sondes perdues. Allume le radar là où l'indice te mène : une sonde posée ne répond que si tu passes au-dessus d'elle, de près ; une sonde perdue dans le vide, il faut fouiller sa zone de recherche.</small></p>
      <div class="cartes-disparus">${cartes}</div></div>`
  }
}
