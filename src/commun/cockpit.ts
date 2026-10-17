// Le cadre du cockpit (étape 2 de la feuille de route) : la carte en plein écran, et par-dessus une barre de cinq
// onglets en bas (Navigation, Capsule, Missions, Manuel, Plus). Un onglet ouvre un volet qui monte du bas ; on le
// referme en touchant de nouveau l'onglet, avec le bouton Fermer, en le glissant vers le bas ou en touchant la carte.
// Les onglets pas encore développés sont visibles mais grisés (désactivés dans la page).

export type Page = 'navigation' | 'capsule' | 'plus' | 'reglages'

const TITRES: Record<Page, string> = {
  navigation: 'NAVIGATION', capsule: 'CAPSULE', plus: 'PLUS', reglages: 'RÉGLAGES',
}
/** Onglet allumé pour chaque page (Réglages s'ouvre depuis « Plus »). */
const ONGLET: Record<Page, string> = { navigation: 'navigation', capsule: 'capsule', plus: 'plus', reglages: 'plus' }

export class Cockpit {
  private page: Page | null = null
  private volet: HTMLElement
  private titre: HTMLElement

  /** quandOuvert : appelé à chaque ouverture d'une page (pour la remplir). */
  constructor(private quandOuvert: (page: Page) => void) {
    this.volet = document.querySelector<HTMLElement>('#volet')!
    this.titre = document.querySelector<HTMLElement>('#volet-titre')!
    for (const b of document.querySelectorAll<HTMLButtonElement>('#onglets [data-onglet]')) {
      b.addEventListener('click', () => {
        const p = b.dataset.onglet as Page
        if (this.page !== null && ONGLET[this.page] === p) this.fermer()
        else this.ouvrir(p)
      })
    }
    document.querySelector('#volet-fermer')!.addEventListener('click', () => this.fermer())
    this.volet.addEventListener('click', (e) => {
      const lien = (e.target as HTMLElement).closest<HTMLElement>('[data-page]')
      if (lien && !lien.hasAttribute('disabled')) this.ouvrir(lien.dataset.page as Page)
    })
    // Glisser l'en-tête vers le bas referme le volet.
    const entete = this.volet.querySelector<HTMLElement>('.entete')!
    let debut: number | null = null
    entete.addEventListener('pointerdown', (e) => { debut = e.clientY })
    entete.addEventListener('pointerup', (e) => {
      if (debut !== null && e.clientY - debut > 50) this.fermer()
      debut = null
    })
  }

  get ouvert(): boolean {
    return this.page !== null
  }

  /** Page ouverte (null si le volet est fermé). */
  get pageOuverte(): Page | null {
    return this.page
  }

  ouvrir(page: Page): void {
    this.page = page
    this.titre.textContent = TITRES[page]
    for (const p of this.volet.querySelectorAll<HTMLElement>('.page')) p.hidden = p.dataset.contenu !== page
    for (const b of document.querySelectorAll<HTMLElement>('#onglets [data-onglet]')) {
      b.classList.toggle('actif', b.dataset.onglet === ONGLET[page])
    }
    this.volet.hidden = false
    this.quandOuvert(page)
  }

  fermer(): void {
    this.page = null
    this.volet.hidden = true
    for (const b of document.querySelectorAll<HTMLElement>('#onglets [data-onglet]')) b.classList.remove('actif')
  }
}
