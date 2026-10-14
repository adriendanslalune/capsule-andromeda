// Glisser pour fermer : un écran se ferme en le tirant depuis le bord gauche vers la droite (comme le retour du
// téléphone), un volet en le tirant vers le bas par sa poignée. L'écran suit le doigt ; lâché assez loin, il se ferme.
// Le geste se pose sur une « prise » (bande du bord, poignée) qui le réserve, et déplace l'écran entier.

export interface OptionsGlisser {
  sens: 'droite' | 'bas'
  /** L'élément qui suit le doigt (l'écran ou le volet). */
  cible: () => HTMLElement | null | undefined
  fermer: () => void
}

/** Distance (px) au-delà de laquelle l'écran lâché se ferme. */
const SEUIL = 80

export function glisserPourFermer(prise: HTMLElement, options: OptionsGlisser) {
  let o = options
  let doigt: number | null = null
  let depart = 0
  let decalage = 0
  prise.style.touchAction = 'none'

  const placer = (d: number, anime: boolean) => {
    const c = o.cible()
    if (!c) return
    c.style.transition = anime ? 'transform 0.18s ease-out' : 'none'
    c.style.transform = d ? (o.sens === 'droite' ? `translateX(${d}px)` : `translateY(${d}px)`) : ''
  }
  const position = (e: PointerEvent) => (o.sens === 'droite' ? e.clientX : e.clientY)

  function appuyer(e: PointerEvent) {
    if (doigt !== null) return
    doigt = e.pointerId
    depart = position(e)
    decalage = 0
    // Posé sur la prise elle-même (bande, poignée) : le geste est à nous tout de suite.
    if (e.target === prise) prise.setPointerCapture(e.pointerId)
  }
  function bouger(e: PointerEvent) {
    if (e.pointerId !== doigt) return
    decalage = Math.max(0, position(e) - depart)
    // On ne capture le doigt qu'une fois le geste lancé : un simple toucher reste un toucher (bouton FERMER…).
    if (decalage > 6 && !prise.hasPointerCapture(e.pointerId)) prise.setPointerCapture(e.pointerId)
    placer(decalage, false)
  }
  function lacher(e: PointerEvent) {
    if (e.pointerId !== doigt) return
    doigt = null
    if (decalage > SEUIL) {
      const c = o.cible()
      placer(o.sens === 'droite' ? (c?.clientWidth ?? 400) : (c?.clientHeight ?? 800), true)
      setTimeout(() => o.fermer(), 170)
    } else placer(0, true)
    decalage = 0
  }

  prise.addEventListener('pointerdown', appuyer)
  prise.addEventListener('pointermove', bouger)
  prise.addEventListener('pointerup', lacher)
  prise.addEventListener('pointercancel', lacher)
  return {
    update(nouvelles: OptionsGlisser) { o = nouvelles },
    destroy() {
      prise.removeEventListener('pointerdown', appuyer)
      prise.removeEventListener('pointermove', bouger)
      prise.removeEventListener('pointerup', lacher)
      prise.removeEventListener('pointercancel', lacher)
    },
  }
}
