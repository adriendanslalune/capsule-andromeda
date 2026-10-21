// La fenêtre de confirmation du jeu (demande d'Adrien du 21/10/2026 : celle du navigateur est moche), dans le style
// des fenêtres du cockpit : un titre pulp, le texte, et deux boutons. Elle remplace window.confirm partout.

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export interface Question {
  titre: string
  /** Le texte (des paragraphes, sans HTML). */
  texte: string | string[]
  /** Le bouton qui confirme (« OUI » par défaut), et celui qui renonce (« ANNULER »). */
  oui?: string
  non?: string
  /** Un choix qui coûte ou qui détruit : le bouton qui confirme en cerise. */
  grave?: boolean
}

/** Pose la question ; la promesse dit si le joueur a confirmé. */
export function confirmer(q: Question): Promise<boolean> {
  return new Promise((repondre) => {
    const fond = document.createElement('div')
    fond.className = 'confirmation-jeu'
    const paragraphes = (Array.isArray(q.texte) ? q.texte : [q.texte]).map((p) => `<p>${echapper(p)}</p>`).join('')
    fond.innerHTML = `<div class="carte-confirmation" role="dialog" aria-modal="true"><div class="titre-confirmation"><span class="titre-pulp">${echapper(q.titre)}</span></div>`
      + `<div class="texte-confirmation">${paragraphes}</div><div class="boutons-confirmation-jeu">`
      + `<button type="button" data-non>${echapper(q.non ?? 'ANNULER')}</button><button type="button" class="${q.grave ? 'grave' : 'principal'}" data-oui>${echapper(q.oui ?? 'OUI')}</button></div></div>`
    const fermer = (r: boolean) => { fond.remove(); repondre(r) }
    fond.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (b) fermer(b.dataset.oui !== undefined)
      else if (e.target === fond) fermer(false)
    })
    document.body.append(fond)
  })
}
