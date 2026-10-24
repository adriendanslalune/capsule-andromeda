// Les bulles d'aide à l'écran (demande d'Adrien du 24/10/2026) : une à la fois, cerclant l'élément expliqué d'un
// contour orange qui tourne (comme la main du guide), une case de papier avec le texte et SUITE ou COMPRIS. Le reste de
// l'écran ne s'assombrit pas. La vue ne décide pas quoi expliquer : on lui donne les bulles (donnees/aides.ts).

import type { Bulle } from '../donnees/aides'

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class Bulles {
  private file: Bulle[] = []
  private page = 0
  private fin: () => void = () => {}

  constructor(private element: HTMLElement) {
    element.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('button')) return
      this.page++
      this.afficher()
    })
  }

  get ouvertes(): boolean { return !this.element.hidden }

  /** Montre une suite de bulles (celles dont l'élément n'est pas à l'écran sont sautées) ; `fin` à la dernière. */
  montrer(bulles: Bulle[], fin: () => void): void {
    this.file = bulles
    this.page = 0
    this.fin = fin
    this.afficher()
  }

  /** Recale la bulle sur son élément (il peut bouger : un volet qui s'ouvre). Appelée à chaque image. */
  recaler(): void {
    if (this.ouvertes) this.placer()
  }

  private visible(b: Bulle): HTMLElement | null | undefined {
    if (!b.sel) return null
    const el = document.querySelector<HTMLElement>(b.sel)
    return el && el.offsetParent !== null && el.getBoundingClientRect().height > 0 ? el : undefined
  }

  private afficher(): void {
    while (this.page < this.file.length && this.visible(this.file[this.page]) === undefined) this.page++
    if (this.page >= this.file.length) { this.element.hidden = true; this.fin(); return }
    const b = this.file[this.page]
    const reste = this.file.slice(this.page + 1).some((x) => this.visible(x) !== undefined)
    this.element.innerHTML = `<svg class="contour-guide" aria-hidden="true"><rect/></svg>
      <div class="case-bulle"><p>${echapper(b.texte)}</p><button type="button" class="principal">${reste ? 'SUITE ›' : 'COMPRIS'}</button></div>`
    this.element.hidden = false
    this.placer()
  }

  private placer(): void {
    const b = this.file[this.page]
    if (!b) return
    const el = this.visible(b)
    // L'élément a disparu (le volet refermé) : on laisse tomber ; elles reviendront à la prochaine ouverture.
    if (el === undefined) { this.element.hidden = true; return }
    const contour = this.element.querySelector<SVGSVGElement>('.contour-guide')!, cas = this.element.querySelector<HTMLElement>('.case-bulle')!
    if (!el) {
      contour.style.display = 'none'
      // Sans élément : en bas de l'écran, la carte reste visible au-dessus.
      Object.assign(cas.style, { top: 'auto', bottom: 'calc(110px + env(safe-area-inset-bottom))' })
      return
    }
    const r = el.getBoundingClientRect(), m = 5
    contour.style.display = ''
    Object.assign(contour.style, { left: `${r.left - m}px`, top: `${r.top - m}px`, width: `${r.width + 2 * m}px`, height: `${r.height + 2 * m}px` })
    const rect = contour.querySelector('rect')!
    rect.setAttribute('x', '2'); rect.setAttribute('y', '2')
    rect.setAttribute('width', String(Math.max(0, r.width + 2 * m - 4))); rect.setAttribute('height', String(Math.max(0, r.height + 2 * m - 4)))
    rect.setAttribute('rx', '6')
    // La case sous l'élément s'il y a la place, sinon au-dessus.
    const h = cas.offsetHeight || 120
    if (r.bottom + 14 + h < window.innerHeight - 8) Object.assign(cas.style, { top: `${r.bottom + 14}px`, bottom: 'auto' })
    else Object.assign(cas.style, { top: `${Math.max(8, r.top - 14 - h)}px`, bottom: 'auto' })
  }
}
