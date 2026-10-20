// Le dialogue avec un PNJ (décisions d'Adrien du 20/10/2026), en plein écran par-dessus la carte : son portrait (ou,
// en attendant les images d'Adrien, un médaillon à son initiale), son nom, son rôle et son lieu ; ce qu'il dit, page
// par page ; et au bout, ACCEPTER / PLUS TARD s'il propose une quête, sinon FERMER. Dialogues linéaires (sans choix
// à conséquences) pour commencer. La vue ne décide rien : le moteur (moteur/quetes.ts) dit ce que dit le PNJ.

import type { Dialogue } from '../moteur/quetes'

/** Ce qu'on fait au bout du dialogue : accepter la quête proposée (renvoie vrai si c'est fait). */
export interface OptionsDialogue { joueur: () => string; accepter: (id: string) => boolean }

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Le médaillon d'un PNJ : son portrait, ou son initiale sur sa couleur. */
export function medaillon(p: Dialogue['pnj'], classe = 'medaillon'): string {
  return p.portrait
    ? `<img class="${classe}" src="${p.portrait}" alt="${echapper(p.nom)}">`
    : `<span class="${classe}" style="background:${p.teinte}">${echapper(p.nom.replace(/^(Dr|Le|La) /, '')[0])}</span>`
}

export class VueDialogue {
  private dialogue: Dialogue | null = null
  private page = 0

  constructor(private element: HTMLElement, private options: OptionsDialogue) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b || !this.dialogue) return
      if (b.dataset.suite !== undefined) { this.page++; this.afficher(); return }
      if (b.dataset.accepter !== undefined && this.dialogue.proposition) this.options.accepter(this.dialogue.proposition.id)
      this.fermer()
    })
  }

  ouvrir(d: Dialogue): void {
    this.dialogue = d
    this.page = 0
    this.afficher()
  }

  fermer(): void {
    this.dialogue = null
    this.element.hidden = true
  }

  private afficher(): void {
    const d = this.dialogue!
    const derniere = this.page >= d.pages.length - 1
    const texte = echapper(d.pages[Math.min(this.page, d.pages.length - 1)]).replaceAll('{joueur}', echapper(this.options.joueur()))
    let boutons = ''
    if (!derniere) boutons = '<button type="button" class="principal" data-suite>CONTINUER ›</button>'
    else if (d.proposition) boutons = '<button type="button" data-fermer>PLUS TARD</button><button type="button" class="principal" data-accepter>ACCEPTER</button>'
    else boutons = '<button type="button" class="principal" data-fermer>FERMER</button>'
    const q = d.proposition ?? d.terminee
    const bandeau = q ? `<div class="type-quete ${q.type}">${q.type === 'principale' ? '◆ QUÊTE PRINCIPALE' : '● QUÊTE SECONDAIRE'} · ${echapper(q.titre)}</div>` : ''
    const fin = d.terminee && derniere ? `<div class="recompense">Quête terminée · <b>+${d.terminee.recompense.toLocaleString('fr-FR')} crédits</b>${d.terminee.libere ? ` · <b>${echapper(d.terminee.libere)} libérée !</b>` : ''}</div>` : ''
    this.element.innerHTML = `
      <div class="fiche-pnj">${medaillon(d.pnj, 'portrait')}<div><b>${echapper(d.pnj.nom)}</b><small>${echapper(d.pnj.role)} · ${echapper(d.pnj.lieu)}</small></div></div>
      ${bandeau}
      <div class="bulle"><p>${texte}</p><small>${this.page + 1}/${d.pages.length}</small></div>
      ${fin}
      <div class="boutons-dialogue">${boutons}</div>`
    this.element.hidden = false
  }
}
