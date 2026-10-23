// La main qui montre où toucher (demande d'Adrien du 23/10/2026, style validé le même jour) : pendant le tutoriel,
// tant qu'une mécanique n'a jamais servi, une main de pulp qui pointe (le doigt tendu, la manchette, un trait d'encre,
// comme dans les réclames des années 50) bat doucement à côté de l'endroit à toucher, cerné d'un contour orange en
// pointillés qui tourne, avec une bulle de BD de deux ou trois mots. Le reste ne s'assombrit pas : on peut toujours
// faire autre chose. Une seule main à la fois. La vue ne décide rien : on lui dit où montrer (main.ts).

/** Où montrer : un rectangle de l'écran (px CSS) ou un cercle (un astre de la carte), et la bulle. */
export type Cible = { texte: string } & ({ rect: DOMRect } | { cercle: { x: number; y: number; r: number } })

/** La main : le doigt tendu vers le haut, la pointe en (21, 2). */
const MAIN = `<svg class="main-guide" viewBox="0 0 64 92" aria-hidden="true">
  <path class="peau" d="M15 6a6 6 0 0 1 12 0v30h3V30a5.5 5.5 0 0 1 11 0v6h1v-3a5.5 5.5 0 0 1 11 0v5a5 5 0 0 1 9 3v14c0 9-5 16-12 18H22c-6-2-11-9-13-16l-6-12a5.5 5.5 0 0 1 9-6l3 5z"/>
  <path class="trait" d="M30 36v8M42 38v7M53 40v6M15 46c3 1 5 3 6 6"/>
  <path class="manchette" d="M19 71h34v19H19z"/>
  <path class="trait" d="M19 76h34"/>
  <circle class="bouton" cx="47" cy="83" r="2"/>
</svg>`

export class Guide {
  private cle = ''

  constructor(private element: HTMLElement) {
    element.innerHTML = `<svg class="contour-guide" aria-hidden="true"><rect/></svg>${MAIN}<div class="bulle-guide"></div>`
  }

  /** Montre la cible (ou rien). Appelée à chaque image : ne touche au DOM que si la place ou le texte change. */
  montrer(c: Cible | null): void {
    if (!c) { if (!this.element.hidden) { this.element.hidden = true; this.cle = '' } return }
    const b = 'rect' in c ? { x: c.rect.left, y: c.rect.top, l: c.rect.width, h: c.rect.height, rond: false }
      : { x: c.cercle.x - c.cercle.r, y: c.cercle.y - c.cercle.r, l: 2 * c.cercle.r, h: 2 * c.cercle.r, rond: true }
    const marge = 6
    const x = Math.round(b.x - marge), y = Math.round(b.y - marge), l = Math.round(b.l + 2 * marge), h = Math.round(b.h + 2 * marge)
    const cle = `${x},${y},${l},${h},${b.rond},${c.texte}`
    if (cle === this.cle && !this.element.hidden) return
    this.cle = cle
    this.element.hidden = false
    const contour = this.element.querySelector<SVGSVGElement>('.contour-guide')!
    Object.assign(contour.style, { left: `${x}px`, top: `${y}px`, width: `${l}px`, height: `${h}px` })
    const rect = contour.querySelector('rect')!
    rect.setAttribute('x', '2'); rect.setAttribute('y', '2')
    rect.setAttribute('width', String(l - 4)); rect.setAttribute('height', String(h - 4))
    rect.setAttribute('rx', b.rond ? String((l - 4) / 2) : '6')
    // La main sous la cible, le doigt vers elle ; près du bas de l'écran, au-dessus, le doigt vers le bas.
    const main = this.element.querySelector<SVGSVGElement>('.main-guide')!, bulle = this.element.querySelector<HTMLElement>('.bulle-guide')!
    const dessous = y + h + 96 < window.innerHeight - 70
    const cx = Math.min(window.innerWidth - 40, Math.max(24, x + l / 2))
    // La pointe du doigt (21, 2 dans le dessin de 64 × 92) sur le bord de la cible.
    main.classList.toggle('vers-le-bas', !dessous)
    Object.assign(main.style, dessous ? { left: `${cx - 21}px`, top: `${y + h - 2}px` } : { left: `${cx - 43}px`, top: `${y - 90}px` })
    bulle.textContent = c.texte
    const droite = cx < window.innerWidth / 2
    Object.assign(bulle.style, {
      top: dessous ? `${y + h + 30}px` : `${y - 70}px`,
      left: droite ? `${Math.min(window.innerWidth - 170, cx + 34)}px` : 'auto',
      right: droite ? 'auto' : `${Math.max(8, window.innerWidth - cx + 34)}px`,
    })
  }
}
