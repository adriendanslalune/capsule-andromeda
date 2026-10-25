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

/** Une fenêtre de félicitations (une zone libérée…) : le titre pulp, le portrait du PNJ qui parle, ses mots, la liste de ce qui s'ouvre. */
export interface Felicitation {
  titre: string
  /** Le médaillon du PNJ (HTML, voir vue-dialogue.ts), son nom et son rôle. */
  portrait: string
  nom: string
  role: string
  texte: string[]
  /** Ce que ça ouvre (une ligne chacun). */
  ouvre: string[]
  bouton: string
  /**
   * En couverture de pulp (Adrien, 22/10/2026 : plus fun) : une accroche dans une étoile, en coin (le nom de la revue
   * est retiré le 25/10/2026).
   */
  couverture?: { accroche: string }
}

export function feliciter(f: Felicitation): Promise<void> {
  return new Promise((fini) => {
    const fond = document.createElement('div')
    fond.className = 'confirmation-jeu felicitation'
    const ouvre = f.ouvre.length ? `<div class="ouvre"><b>Ce qui s'ouvre</b><ul>${f.ouvre.map((o) => `<li>${echapper(o)}</li>`).join('')}</ul></div>` : ''
    const c = f.couverture
    // Plus de nom de revue (Adrien, 25/10/2026 : « CAPITAINES ! » faisait cheap) : seule l'accroche reste, dans son étoile.
    const tete = c ? `<span class="etoile-revue etoile-fenetre">${echapper(c.accroche)}</span>` : ''
    fond.innerHTML = `<div class="carte-confirmation${c ? ' en-couverture' : ''}" role="dialog" aria-modal="true">${tete}<div class="titre-confirmation"><span class="titre-pulp">${echapper(f.titre)}</span></div>`
      + `<div class="pnj-felicitation">${f.portrait}<div><b>${echapper(f.nom)}</b><small>${echapper(f.role)}</small></div></div>`
      + `<div class="texte-confirmation">${f.texte.map((p) => `<p>${echapper(p)}</p>`).join('')}</div>${ouvre}`
      + `<div class="boutons-confirmation-jeu"><button type="button" class="principal">${echapper(f.bouton)}</button></div></div>`
    fond.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) { fond.remove(); fini() }
    })
    document.body.append(fond)
  })
}
