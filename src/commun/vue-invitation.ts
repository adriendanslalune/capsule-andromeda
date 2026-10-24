// La lettre d'invitation d'une Maison (décision d'Adrien du 19/10/2026 : appartenir à une Maison est un événement
// attendu), en plein écran par-dessus la carte : une lettre aux couleurs de la Maison, cachetée de son sceau et signée
// de son parrain (un de ses capitaines). REJOINDRE ou PLUS TARD ; plus tard, on rejoint depuis le Profil. Si plusieurs
// Maisons écrivent en même temps, les lettres se suivent. La vue ne décide rien : le jeu dit qui invite et fait entrer.

import { BOTS, LETTRES_INVITATION, PARRAINS } from '../donnees/messages'
import { titreMaison, type Maison, COULEURS_MAISONS, MAISONS } from '../donnees/maisons'
import { statut } from '../moteur/monolithes'

const TEINTES = Object.fromEntries(MAISONS.map((m) => [m.maison, COULEURS_MAISONS[m.maison].pale])) as Record<Maison, string>
const SCEAUX: Record<Maison, string> = { nettoyeurs: '🧹', ingenieurs: '🔧', mercenaires: '⚔️' }

/** Le pseudo du joueur, et ce qu'on fait s'il rejoint (vrai si c'est fait). */
export interface OptionsInvitation { joueur: () => string; rejoindre: (m: Maison) => boolean }

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class VueInvitation {
  private file: Maison[] = []

  constructor(private element: HTMLElement, private options: OptionsInvitation) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      const m = this.file[0]
      if (b.dataset.rejoindre !== undefined && m && !this.options.rejoindre(m)) return
      this.file.shift()
      this.afficher()
    })
  }

  /** Ajoute des lettres à lire (elles s'affichent l'une après l'autre). */
  ouvrir(maisons: Maison[]): void {
    this.file.push(...maisons.filter((m) => !this.file.includes(m)))
    this.afficher()
  }

  private afficher(): void {
    const m = this.file[0]
    if (!m) { this.element.hidden = true; return }
    const parrain = PARRAINS[m], bot = BOTS.find((b) => b.pseudo === parrain)
    const rang = bot ? statut(bot.monolithes) : null
    const joueur = echapper(this.options.joueur())
    const paragraphes = LETTRES_INVITATION[m].map((p) => `<p>${echapper(p).replaceAll('{joueur}', joueur)}</p>`).join('')
    const titre = titreMaison(m)
    this.element.style.setProperty('--teinte', TEINTES[m])
    this.element.innerHTML = `
      <div class="lettre">
        <div class="bandeau-maison"><small>MAISON DES</small><b>${titre}</b></div>
        <div class="sceau" aria-hidden="true">${SCEAUX[m]}</div>
        <div class="texte-lettre">${paragraphes}</div>
        <div class="signature"><b>${echapper(parrain)}</b><small>pour la Maison des ${titre.toLowerCase()}${rang ? ` · ${rang}` : ''}${bot ? ` · ${bot.lieu}` : ''}</small></div>
      </div>
      <div class="boutons-lettre">
        <button type="button" data-plus-tard>PLUS TARD</button>
        <button type="button" class="principal" data-rejoindre>REJOINDRE LES ${titre}</button>
      </div>
      <p class="note-lettre">Ce n'est jamais définitif : tu pourras changer d'avis dans ton Profil.</p>`
    this.element.hidden = false
    this.element.scrollTop = 0
  }
}
