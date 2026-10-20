// Le cadre du cockpit (étape 2 de la feuille de route) : la carte en plein écran, et par-dessus une barre de cinq
// onglets en bas (Navigation, Capsule, Missions, Marché, Plus ; barre validée par Adrien le 18/10/2026 : le Manuel
// est passé dans « Plus », l'Armement dans le volet Capsule). Un onglet ouvre un volet qui monte du bas ; on le
// referme en touchant de nouveau l'onglet, avec le bouton Fermer, en le glissant vers le bas (de n'importe où) ou en
// touchant la carte.
// Les onglets pas encore développés sont visibles mais grisés (désactivés dans la page).

import { picto, type NomSymbole } from './symboles'

export type Page = 'navigation' | 'capsule' | 'missions' | 'marche' | 'manuel' | 'profil' | 'messages' | 'plus' | 'reglages' | 'boutique'

const TITRES: Record<Page, string> = {
  navigation: 'NAVIGATION', capsule: 'CAPSULE', missions: 'JOURNAL', marche: 'MARCHÉ', manuel: 'MANUEL DE MAINTENANCE', profil: 'PROFIL', messages: 'MESSAGES', plus: 'PLUS', reglages: 'RÉGLAGES', boutique: 'BOUTIQUE',
}
/** Onglet allumé pour chaque page (le Manuel et les Réglages s'ouvrent depuis « Plus »). */
const ONGLET: Record<Page, string> = {
  navigation: 'navigation', capsule: 'capsule', missions: 'missions', marche: 'marche', manuel: 'plus', profil: 'plus', messages: 'plus', plus: 'plus', reglages: 'plus', boutique: 'plus',
}

export class Cockpit {
  private page: Page | null = null
  private volet: HTMLElement
  private titre: HTMLElement

  /** quandOuvert : appelé à chaque ouverture d'une page (pour la remplir). */
  constructor(private quandOuvert: (page: Page) => void) {
    this.volet = document.querySelector<HTMLElement>('#volet')!
    this.titre = document.querySelector<HTMLElement>('#volet-titre')!
    for (const b of document.querySelectorAll<HTMLButtonElement>('#onglets [data-onglet]')) {
      // Un symbole au-dessus du mot (décision d'Adrien du 20/10/2026).
      b.insertAdjacentHTML('afterbegin', picto(b.dataset.onglet as NomSymbole))
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
    // Glisser vers le bas referme le volet, de n'importe où (demande d'Adrien du 18/10/2026) : seulement si la page
    // du volet est déjà tout en haut (sinon le geste la fait défiler), et si le geste est surtout vertical. Le volet
    // suit le doigt pendant le geste.
    let debut: { x: number; y: number; page: HTMLElement | null } | null = null
    const lacher = (fermer: boolean) => {
      debut = null
      this.volet.style.transition = 'transform 0.15s ease-out'
      this.volet.style.transform = ''
      if (fermer) this.fermer()
    }
    const bouger = (e: TouchEvent) => {
      if (!debut) return
      const dx = e.touches[0].clientX - debut.x, dy = e.touches[0].clientY - debut.y
      if ((debut.page && debut.page.scrollTop > 0) || dy < -10 || Math.abs(dx) > Math.max(20, dy)) { lacher(false); return }
      this.volet.style.transition = 'none'
      this.volet.style.transform = `translateY(${Math.max(0, dy)}px)`
    }
    const finir = (e: TouchEvent) => { if (debut) lacher(e.type === 'touchend' && e.changedTouches[0].clientY - debut.y > 80) }
    this.volet.addEventListener('touchstart', (e) => {
      const cible = e.target as HTMLElement
      const page = cible.closest<HTMLElement>('.page')
      debut = e.touches.length === 1 && (!page || page.scrollTop <= 0) && !cible.closest('input[type="range"], .sans-glisser')
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY, page } : null
      if (!debut) return
      // La suite du geste est écoutée sur l'élément touché lui-même : un volet qui se redessine pendant le geste
      // (Missions, chaque seconde) le retire de la page, et ses événements ne remonteraient plus jusqu'au volet.
      const options = { passive: true }
      cible.addEventListener('touchmove', bouger, options)
      const fin = (ev: TouchEvent) => {
        finir(ev)
        cible.removeEventListener('touchmove', bouger)
        cible.removeEventListener('touchend', fin)
        cible.removeEventListener('touchcancel', fin)
      }
      cible.addEventListener('touchend', fin)
      cible.addEventListener('touchcancel', fin)
    }, { passive: true })
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
