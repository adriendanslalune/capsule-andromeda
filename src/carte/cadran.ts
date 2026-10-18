// Le cadran de navigation (le volet Navigation du cockpit) : la liste des astres où l'on peut aller, avec leur
// distance à la capsule.
// Planètes dans l'ordre depuis le Soleil ; une planète qui a des lunes se déplie ; les engins à part ; en tête, ce que
// une mission vise (chasseurs aliens, ou celui qui nous tire dessus) et, plus bas, les épaves visées par une mission
// et les monolithes localisés à la radio.
// Toucher une ligne choisit la destination (et la carte se place sur son système).

import { CORPS, enfants, type Corps } from '../moteur/corps'
import { distanceDepuisCapsule, texteDistance } from '../moteur/navigation'

const PLANETES = ['Soleil', 'Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton']

export class Cadran {
  private ouvertes = new Set<string>()

  /** reperes : les chasseurs repérés au radar et les épaves présentes (le jeu le dit). */
  constructor(private element: HTMLElement, private choisir: (nom: string) => void, private horloge: () => number,
    private reperes: (t: number) => { aliens: string[]; epaves: string[]; monolithes?: string[] } = () => ({ aliens: [], epaves: [] })) {
    element.addEventListener('click', (e) => {
      const cible = (e.target as HTMLElement).closest<HTMLElement>('[data-nom], [data-deplier]')
      if (!cible) return
      if (cible.dataset.deplier) {
        const n = cible.dataset.deplier
        if (this.ouvertes.has(n)) this.ouvertes.delete(n)
        else this.ouvertes.add(n)
        this.remplir()
      } else if (cible.dataset.nom) {
        this.choisir(cible.dataset.nom)
      }
    })
  }

  /** Remplit la liste (à l'ouverture du volet), la destination choisie en évidence. */
  afficher(selection: string | null): void {
    this.selection = selection
    this.remplir()
  }

  private selection: string | null = null

  private ligne(c: Corps, t: number, retrait: boolean): string {
    const lunes = c.type === 'planete' || c.type === 'naine' ? enfants(c.nom).filter((e) => e.type === 'lune') : []
    const choisie = c.nom === this.selection ? ' choisie' : ''
    const deplier = lunes.length
      ? `<button type="button" class="deplier" data-deplier="${c.nom}">${this.ouvertes.has(c.nom) ? '▾' : '▸'} ${lunes.length} lune${lunes.length > 1 ? 's' : ''}</button>`
      : ''
    return `<div class="ligne${retrait ? ' retrait' : ''}${choisie}"><button type="button" class="astre" data-nom="${c.nom}">`
      + `<span class="nom">${c.nom}</span><span class="distance">${texteDistance(distanceDepuisCapsule(c.nom, t))}</span>`
      + `</button>${deplier}</div>`
  }

  private remplir(): void {
    const t = this.horloge()
    const parNom = new Map(CORPS.map((c) => [c.nom, c]))
    const { aliens, epaves, monolithes = [] } = this.reperes(t)
    let html = '<div class="liste">'
    if (aliens.length) {
      html += '<h3>Chasseurs visés</h3>'
      for (const nom of aliens) html += this.ligne(parNom.get(nom)!, t, false)
    }
    html += '<h3>Soleil et planètes</h3>'
    for (const nom of PLANETES) {
      const c = parNom.get(nom)!
      html += this.ligne(c, t, false)
      if (this.ouvertes.has(nom)) {
        // Lunes : les plus grosses d'abord.
        const lunes = enfants(nom).filter((e) => e.type === 'lune').sort((a, b) => b.rayon - a.rayon)
        for (const l of lunes) html += this.ligne(l, t, true)
      }
    }
    // Les épaves visées par une mission (les autres ne se montrent pas), les plus proches d'abord.
    if (epaves.length) {
      html += '<h3>Épaves</h3>'
      for (const nom of [...epaves].sort((a, b) => distanceDepuisCapsule(a, t) - distanceDepuisCapsule(b, t))) html += this.ligne(parNom.get(nom)!, t, false)
    }
    // Les monolithes localisés à la radio (pas encore ramassés).
    if (monolithes.length) {
      html += '<h3>Monolithes localisés</h3>'
      for (const nom of monolithes) html += this.ligne(parNom.get(nom)!, t, false)
    }
    html += '<h3>Engins</h3>'
    for (const c of CORPS.filter((c) => c.type === 'satellite' || c.type === 'sonde')) html += this.ligne(c, t, false)
    html += '</div>'
    this.element.innerHTML = html
  }
}
