// Le profil d'un autre capitaine (Adrien, 24/10/2026 : depuis les Messages ou la carte, en plus de lui écrire ou de
// l'attaquer) : une fiche posée par-dessus, son vaisseau dans la forme de son niveau, son niveau, sa Maison, son statut,
// où il est. En attendant le serveur, ce sont les capitaines PNJ (les bots), marqués comme tels.

import { BOTS } from '../donnees/messages'
import { titreMaison } from '../donnees/maisons'
import { niveauDuBot, palierDe } from '../moteur/niveau'
import { statut } from '../moteur/monolithes'
import { lieuDuBot } from '../moteur/messages'
import { dessinerVaisseau, imageForme, rayonVaisseau, urlFormePeinte } from '../carte/vaisseaux'

export interface ActionsCapitaine { ecrire: (pseudo: string) => void; voir: (pseudo: string) => void }

export class FicheCapitaine {
  private element: HTMLDivElement

  constructor(private actions: ActionsCapitaine) {
    this.element = document.createElement('div')
    this.element.id = 'fiche-capitaine'
    this.element.hidden = true
    this.element.addEventListener('click', (e) => {
      const cible = e.target as HTMLElement
      const b = cible.closest<HTMLElement>('[data-action]')
      if (cible === this.element || b?.dataset.action === 'fermer') { this.fermer(); return }
      const pseudo = this.element.dataset.pseudo!
      if (b?.dataset.action === 'ecrire') { this.fermer(); this.actions.ecrire(pseudo) }
      if (b?.dataset.action === 'voir') { this.fermer(); this.actions.voir(pseudo) }
    })
    document.body.append(this.element)
  }

  get ouverte(): boolean {
    return !this.element.hidden
  }

  ouvrir(pseudo: string, t: number): void {
    const bot = BOTS.find((b) => b.pseudo === pseudo)
    if (!bot) return
    const niveau = niveauDuBot(pseudo), p = palierDe(niveau), s = statut(bot.monolithes)
    let image = imageForme(p.forme) ? urlFormePeinte(p.forme, bot.maison) : null
    if (!image) {
      const toile = document.createElement('canvas')
      toile.width = toile.height = 160
      dessinerVaisseau(toile.getContext('2d')!, 80, 80, -Math.PI / 2, p.forme, 60 / rayonVaisseau(p.forme, 1), '#d7cdee', '#2b2138')
      image = toile.toDataURL()
    }
    this.element.dataset.pseudo = pseudo
    this.element.innerHTML = `<div class="carte-capitaine" role="dialog" aria-label="Profil de ${pseudo}">`
      + '<small class="reference">DOSSIER DU CAPITAINE · PNJ</small>'
      + `<h2 class="nom-capitaine">${pseudo}</h2><div class="double-filet"></div>`
      + `<div class="portrait-vaisseau"><img src="${image}" alt="${p.nom}"><b>${p.nom}</b></div>`
      + `<div class="rang"><span>Niveau</span><b>${niveau}</b></div>`
      + `<div class="rang"><span>Maison</span><b>${titreMaison(bot.maison)}</b></div>`
      + `<div class="rang"><span>Monolithes</span><b>${bot.monolithes}${s ? ` · ${s}` : ''}</b></div>`
      + `<div class="rang"><span>En ce moment</span><b>${lieuDuBot(pseudo, t)}</b></div>`
      + '<p class="petit">Un capitaine du jeu (PNJ), en attendant les vrais joueurs.</p>'
      + `<div class="boutons-capitaine">${bot.bavard ? '<button type="button" data-action="ecrire">ÉCRIRE</button>' : ''}`
      + '<button type="button" data-action="voir">VOIR SUR LA CARTE</button><button type="button" class="principal" data-action="fermer">FERMER</button></div></div>'
    this.element.hidden = false
  }

  fermer(): void {
    this.element.hidden = true
  }
}
