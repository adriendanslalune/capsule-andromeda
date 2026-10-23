// La présentation du monde (demande d'Adrien du 23/10/2026) : au tout début, un nouveau joueur ne voit que la carte.
// Avant l'histoire, une visite guidée la lui fait comprendre : le vrai système solaire, en ce moment même ; les vraies
// distances, les vraies tailles ; tout qui bouge en temps réel ; la vitesse de la lumière ; et enfin sa capsule, tout
// près de l'ISS. Une case de BD en bas de l'écran, la caméra qui vole d'une vue à l'autre. La vue ne décide rien : on
// lui donne les pages et ce que fait la caméra (main.ts).

/** Une page de la visite : son titre, son texte, et la vue de la carte qui va avec. */
export interface PagePresentation { titre: string; texte: string; vue: () => void; scene: string }

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class Presentation {
  private page = 0
  private pages: PagePresentation[] = []
  private fin: () => void = () => {}

  constructor(private element: HTMLElement) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      if (b.dataset.passer !== undefined) { this.terminer(); return }
      this.page++
      if (this.page >= this.pages.length) this.terminer()
      else this.afficher()
    })
  }

  get ouverte(): boolean { return !this.element.hidden }

  /** La scène de la page affichée, et quand elle a commencé (performance.now()), pour ses animations. */
  scene: string | null = null
  debutScene = 0

  ouvrir(pages: PagePresentation[], fin: () => void): void {
    this.pages = pages
    this.fin = fin
    this.page = 0
    this.afficher()
  }

  private terminer(): void {
    this.element.hidden = true
    this.scene = null
    this.fin()
  }

  private afficher(): void {
    const p = this.pages[this.page]
    const derniere = this.page === this.pages.length - 1
    this.element.innerHTML = `<div class="case-presentation">
      <div class="numero">${this.page + 1} / ${this.pages.length}</div>
      <h2 class="titre-pulp">${echapper(p.titre)}</h2>
      <p>${echapper(p.texte)}</p>
      <div class="boutons-presentation">${derniere ? '' : '<button type="button" class="passer" data-passer>PASSER</button>'}<button type="button" class="principal">${derniere ? 'EN AVANT !' : 'SUITE ›'}</button></div>
    </div>`
    this.element.hidden = false
    this.scene = p.scene
    this.debutScene = performance.now()
    p.vue()
  }
}
