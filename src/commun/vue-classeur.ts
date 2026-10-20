// Le classeur des monolithes (demande d'Adrien du 20/10/2026), comme un classeur de cartes à collectionner : neuf
// pochettes par page, les monolithes dans l'ordre croissant ; ceux qu'on a trouvés montrent leur carte (numéro,
// emplacement, date du ramassage), les autres restent grisés. On tourne les pages avec les flèches, en glissant le
// doigt, ou avec la réglette. La vue ne calcule rien : les pages viennent de moteur/monolithes.ts.

import { NOMBRE_MONOLITHES } from '../donnees/monolithes'
import { CASES_PAR_PAGE, PAGES_CLASSEUR, pageClasseur, palierSuivant, statut, type EtatMonolithes } from '../moteur/monolithes'

const DESSIN = '<svg viewBox="0 0 40 56" aria-hidden="true"><ellipse cx="20" cy="50" rx="15" ry="3.5" class="sol"/><path class="pierre" d="M13 8h14v42H13z"/><path class="reflet" d="M15 11h3v36h-3z"/><path class="glyphe" d="M20 20v6M17 23h6"/></svg>'

export class VueClasseur {
  private page = 1
  private depart: number | null = null

  constructor(private element: HTMLElement, private monolithes: () => EtatMonolithes) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      if (b.dataset.fermer !== undefined) { this.fermer(); return }
      if (b.dataset.tourner) this.tourner(Number(b.dataset.tourner))
    })
    element.addEventListener('input', (e) => {
      const r = e.target as HTMLInputElement
      if (r.dataset.reglette !== undefined) { this.page = Number(r.value); this.afficher() }
    })
    // Glisser le doigt de côté tourne la page.
    element.addEventListener('pointerdown', (e) => { if (!(e.target as HTMLElement).closest('input')) this.depart = e.clientX })
    element.addEventListener('pointerup', (e) => {
      if (this.depart === null) return
      const dx = e.clientX - this.depart
      this.depart = null
      if (Math.abs(dx) > 50) this.tourner(dx < 0 ? 1 : -1)
    })
  }

  /** Ouvre le classeur à la page du plus grand monolithe trouvé (sinon la première). */
  ouvrir(): void {
    const trouves = this.monolithes().trouves
    this.page = trouves.length ? Math.ceil(Math.max(...trouves) / CASES_PAR_PAGE) : 1
    this.afficher()
    this.element.hidden = false
  }

  fermer(): void {
    this.element.hidden = true
  }

  private tourner(sens: number): void {
    this.page = Math.min(PAGES_CLASSEUR, Math.max(1, this.page + sens))
    this.afficher()
  }

  private afficher(): void {
    const e = this.monolithes(), n = e.trouves.length
    const rang = statut(n), suivant = palierSuivant(n)
    const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    const f = (x: number, k: number) => x.toLocaleString('fr-FR', { minimumFractionDigits: k, maximumFractionDigits: k })
    const cases = pageClasseur(e, this.page).map((c) => c.trouve
      ? `<div class="pochette trouve"><b class="numero">n° ${c.numero}</b>${DESSIN}<span>${f(c.ua!, 2)} UA · ${f(c.longitude!, 1)}°</span><small>${c.le ? date(c.le) : ''}</small></div>`
      : `<div class="pochette"><b class="numero">n° ${c.numero}</b><span class="vide">?</span></div>`).join('')
    // La dernière page n'est pas pleine : des pochettes vides la complètent.
    const vides = '<div class="pochette absente"></div>'.repeat(CASES_PAR_PAGE - pageClasseur(e, this.page).length)
    // La réglette n'est pas redessinée (on la ferait lâcher au doigt) : on ne change que sa valeur.
    if (!this.element.querySelector('.corps')) {
      this.element.innerHTML = `
        <div class="entete-plein"><span>Classeur des monolithes</span><button type="button" data-fermer>FERMER</button></div>
        <div class="corps"><p class="bilan-classeur"></p><div class="page-classeur"></div><div class="tourner"></div>
          <input type="range" data-reglette min="1" max="${PAGES_CLASSEUR}" aria-label="Aller à la page" /></div>`
    }
    this.element.querySelector('.bilan-classeur')!.innerHTML = `<b>${n} / ${NOMBRE_MONOLITHES}</b>${rang ? ` · ${rang}` : ''}${suivant ? `<small>prochain palier : ${suivant.titre} (${suivant.seuil})</small>` : ''}`
    this.element.querySelector('.page-classeur')!.innerHTML = cases + vides
    this.element.querySelector('.tourner')!.innerHTML = `<button type="button" data-tourner="-1"${this.page === 1 ? ' disabled' : ''}>‹</button>`
      + `<span>page ${this.page} / ${PAGES_CLASSEUR}</span><button type="button" data-tourner="1"${this.page === PAGES_CLASSEUR ? ' disabled' : ''}>›</button>`
    const reglette = this.element.querySelector<HTMLInputElement>('[data-reglette]')!
    if (reglette.value !== String(this.page)) reglette.value = String(this.page)
  }
}
