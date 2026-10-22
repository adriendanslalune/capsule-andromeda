// Les onomatopées (Adrien, 22/10/2026 : le jeu doit faire plus fun, moins sérieux) : aux grands moments, un mot de
// bande dessinée jaillit au milieu de l'écran dans une étoile de pulp, et disparaît. Rien que du décor.

/** L'étoile : seize branches irrégulières, comme dans les illustrés des années 50. */
function etoile(): string {
  const pts: string[] = []
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * 2 * Math.PI, r = k % 2 ? 34 + ((k * 7) % 5) : 50 - ((k * 3) % 4)
    pts.push(`${(60 + r * Math.cos(a) * 1.15).toFixed(1)},${(50 + r * Math.sin(a) * 0.8).toFixed(1)}`)
  }
  return `<svg viewBox="0 0 120 100" aria-hidden="true"><polygon points="${pts.join(' ')}"/></svg>`
}

/** Fait jaillir un mot (« VROOOM ! ») dans une étoile de la couleur donnée. */
export function onomatopee(texte: string, couleur = '#f2d58e'): void {
  const el = document.createElement('div')
  el.className = 'onomatopee'
  el.style.setProperty('--couleur', couleur)
  el.style.setProperty('--angle', `${Math.round(Math.random() * 16 - 8)}deg`)
  el.innerHTML = `${etoile()}<b>${texte}</b>`
  document.body.append(el)
  setTimeout(() => el.remove(), 1500)
}
