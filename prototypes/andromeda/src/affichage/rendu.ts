// Le dessin de la carte (Canvas 2D) : vue du dessus, dans le plan de l'écliptique. Fond blanc, astres en ronds
// noirs à leur taille réelle ; un astre plus petit qu'un point devient un point, comme les étoiles du fond.
// Le rendu ne calcule aucune position : il les demande au moteur (corps.ts), et seulement pour ce qui est visible.

import { CORPS, PREMIER_NIVEAU, RAYON_SYSTEME, enfants, position, type Corps } from '../moteur/corps'
import type { Vecteur3 } from '../moteur/vecteur'
import { type Camera, projecteur } from './camera'

/** Rayon d'un point (pixels CSS) : étoiles du fond et astres trop petits pour être vus à leur taille. */
export const RAYON_POINT = 1.3

export interface Palette { fond: string; encre: string }
export const JOUR: Palette = { fond: '#ffffff', encre: '#000000' }

/** Étoiles du fond : semées une fois pour toutes, fixes à l'écran (positions de 0 à 1). */
const ETOILES: { x: number; y: number }[] = (() => {
  let graine = 20261016
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  return Array.from({ length: 160 }, () => ({ x: hasard(), y: hasard() }))
})()

const AVEC_ENFANTS = new Set(CORPS.filter((c) => c.parent).map((c) => c.parent!))

export interface Statistiques { calcules: number; dessines: number }

export function dessiner(ctx: CanvasRenderingContext2D, camera: Camera, t: number, palette: Palette): Statistiques {
  const { largeur, hauteur, echelle } = camera
  // Positions de l'image en cours (chaque astre n'est calculé qu'une fois).
  const cache = new Map<string, Vecteur3>()
  const pos = (nom: string) => {
    let p = cache.get(nom)
    if (!p) { p = position(nom, t); cache.set(nom, p) }
    return p
  }
  const proj = projecteur(camera, pos)

  ctx.fillStyle = palette.fond
  ctx.fillRect(0, 0, largeur, hauteur)
  ctx.fillStyle = palette.encre
  ctx.beginPath()
  for (const e of ETOILES) {
    const x = e.x * largeur, y = e.y * hauteur
    ctx.moveTo(x + RAYON_POINT, y)
    ctx.arc(x, y, RAYON_POINT, 0, 2 * Math.PI)
  }

  let dessines = 0
  const diagonale = Math.hypot(largeur, hauteur)
  const tracer = (c: Corps) => {
    const { sx, sy } = proj(pos(c.nom))
    const r = Math.max(RAYON_POINT, c.rayon / echelle)
    // Hors de l'écran : on ne dessine pas.
    if (sx + r < 0 || sx - r > largeur || sy + r < 0 || sy - r > hauteur) return
    // Astre bien plus grand que l'écran et qui le couvre entièrement : un aplat suffit.
    if (Math.hypot(sx - largeur / 2, sy - hauteur / 2) + diagonale < r) {
      ctx.rect(0, 0, largeur, hauteur)
    } else {
      ctx.moveTo(sx + r, sy)
      ctx.arc(sx, sy, r, 0, 2 * Math.PI)
    }
    dessines++
  }

  // Astres de premier niveau, puis les systèmes (lunes, satellites) seulement s'ils sont visibles et assez grands
  // à l'écran pour se distinguer de leur planète.
  const systemes: string[] = []
  for (const c of PREMIER_NIVEAU) {
    tracer(c)
    if (AVEC_ENFANTS.has(c.nom)) systemes.push(c.nom)
  }
  while (systemes.length) {
    const nom = systemes.pop()!
    const rayonPx = (RAYON_SYSTEME.get(nom) ?? 0) / echelle
    if (rayonPx < RAYON_POINT) continue
    const { sx, sy } = proj(pos(nom))
    if (sx + rayonPx < 0 || sx - rayonPx > largeur || sy + rayonPx < 0 || sy - rayonPx > hauteur) continue
    for (const c of enfants(nom)) tracer(c)
  }
  ctx.fill('nonzero')
  return { calcules: cache.size, dessines }
}
