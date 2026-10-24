// Les formes des capsules sur la carte (décisions d'Adrien du 21/10/2026) : le niveau du capitaine change la forme de
// son engin par paliers — capsule, navette, corvette, frégate, croiseur, et la Légende au niveau 100 — et la grossit un
// peu à l'intérieur de chaque palier. Nez vers +x ; unités : pixels à l'échelle 1.

import type { Forme } from '../donnees/niveaux'
import { COULEURS_MAISONS, type Maison } from '../donnees/maisons'

/** Taille de chaque forme au combat, par rapport à la capsule (sur la carte, c'est le niveau qui fait la taille :
 *  palierDe, Adrien, 24/10/2026). */
const TAILLE: Record<Forme, number> = { capsule: 1, navette: 1.05, corvette: 1.1, fregate: 1.15, croiseur: 1.2, legende: 1.25 }
export const tailleAuCombat = (forme: Forme) => TAILLE[forme]

type Pt = [number, number]
const symetrique = (moitie: Pt[]): Pt[] => [...moitie, ...moitie.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y])]

/** Les coques (contour fermé), puis les ailerons de chaque forme. */
const COQUES: Record<Forme, { coque: Pt[]; ailerons: Pt[][]; hublot?: Pt }> = {
  capsule: { coque: [[8, 0], [-5, 5.5], [-2.5, 0], [-5, -5.5]], ailerons: [] },
  navette: { coque: symetrique([[9, 0], [2, 2], [-4, 7], [-6.5, 7], [-4.5, 2], [-6.5, 0]]), ailerons: [], hublot: [3, 0] },
  corvette: {
    coque: symetrique([[11, 0], [6, 2.6], [-6, 2.6], [-8.5, 0]]),
    ailerons: [[[-1, 2.6], [-8, 7.5], [-7, 2.6]], [[-1, -2.6], [-8, -7.5], [-7, -2.6]]], hublot: [5, 0],
  },
  fregate: {
    coque: symetrique([[12, 0], [7, 3], [-8, 3], [-10.5, 0]]),
    ailerons: [[[-6, 5], [4, 5], [4, 7.5], [-6, 7.5]], [[-6, -5], [4, -5], [4, -7.5], [-6, -7.5]], [[0, 3], [0, 5], [-2, 5], [-2, 3]], [[0, -3], [0, -5], [-2, -5], [-2, -3]]],
    hublot: [6, 0],
  },
  croiseur: {
    coque: symetrique([[14, 0], [9, 4], [-10, 4], [-13, 0]]),
    ailerons: [[[-2, 4], [-11, 10], [-12, 4]], [[-2, -4], [-11, -10], [-12, -4]], [[6, 4], [1, 7], [-1, 4]], [[6, -4], [1, -7], [-1, -4]]],
    hublot: [8, 0],
  },
  legende: {
    coque: symetrique([[15, 0], [10, 4.5], [-9, 4.5], [-13, 1.5], [-11, 0]]),
    ailerons: [[[-1, 4.5], [-12, 11], [-13, 4.5]], [[-1, -4.5], [-12, -11], [-13, -4.5]], [[7, 4.5], [2, 8], [0, 4.5]], [[7, -4.5], [2, -8], [0, -4.5]]],
    hublot: [9, 0],
  },
}

/** Les formes dessinées par ChatGPT (Adrien, 24/10/2026 ; `docs/capsule-prompts.md`), dans `public/vaisseaux/`, la proue
 *  vers le haut : la capsule est celle du combat. On inscrit ici chaque forme arrivée ; les autres restent en silhouette. */
export const FORMES_PRETES: readonly Forme[] = ['capsule', 'navette', 'corvette', 'fregate', 'croiseur']

/** L'adresse de l'image d'une forme, si elle est dessinée. */
export function imageForme(forme: Forme): string | null {
  return FORMES_PRETES.includes(forme) ? `vaisseaux/${forme}.webp` : null
}

const IMAGES: Partial<Record<Forme, HTMLImageElement>> = {}
/** L'image d'une forme, une fois chargée (sinon null : on dessine la silhouette en attendant). */
export function chargerForme(forme: Forme): HTMLImageElement | null {
  const src = imageForme(forme)
  if (!src) return null
  let im = IMAGES[forme]
  if (!im) { im = IMAGES[forme] = new Image(); im.src = src }
  return im.complete && im.naturalWidth ? im : null
}

/**
 * La forme repeinte aux couleurs d'une Maison (Adrien, 24/10/2026) : les bandes orange de la livrée prennent la
 * peinture pastel de la Maison, ombres et reflets gardés ; le reste (coque crème, tuyères, encre) ne bouge pas. Fait une
 * fois par forme et par Maison ; null tant que l'image n'est pas chargée. Sans Maison : l'image d'origine.
 */
const PEINTES = new Map<string, HTMLCanvasElement>()
export function formePeinte(forme: Forme, maison: Maison | null): HTMLImageElement | HTMLCanvasElement | null {
  const im = chargerForme(forme)
  if (!im || !maison) return im
  const cle = `${forme}|${maison}`
  let toile = PEINTES.get(cle)
  if (!toile) {
    toile = document.createElement('canvas')
    toile.width = im.naturalWidth
    toile.height = im.naturalHeight
    const ctx = toile.getContext('2d')!
    ctx.drawImage(im, 0, 0)
    const donnees = ctx.getImageData(0, 0, toile.width, toile.height), d = donnees.data
    const [th, ts, tv] = enHsv(...enRgb(COULEURS_MAISONS[maison].peinture))
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue
      const [h, s, v] = enHsv(d[i], d[i + 1], d[i + 2])
      // L'orange de la livrée : teinte de 10 à 45°, bien saturé, assez clair.
      if (h < 10 || h > 45 || s < 0.45 || v < 0.35) continue
      const [r, g, b] = deHsv(th, ts, Math.min(1, tv * Math.min(1.15, v / 0.98)))
      d[i] = r; d[i + 1] = g; d[i + 2] = b
    }
    ctx.putImageData(donnees, 0, 0)
    PEINTES.set(cle, toile)
  }
  return toile
}
/** L'adresse d'une forme repeinte (pour une balise img) : son dessin s'il est prêt, sinon l'image d'origine. */
export function urlFormePeinte(forme: Forme, maison: Maison | null): string | null {
  const p = formePeinte(forme, maison)
  return p instanceof HTMLCanvasElement ? p.toDataURL() : imageForme(forme)
}
/** La largeur et la hauteur d'une image ou d'un dessin. */
export const dimensions = (im: HTMLImageElement | HTMLCanvasElement): [number, number] =>
  im instanceof HTMLImageElement ? [im.naturalWidth, im.naturalHeight] : [im.width, im.height]
const enRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
function enHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), e = max - min
  let h = 0
  if (e) h = max === r ? ((g - b) / e) % 6 : max === g ? (b - r) / e + 2 : (r - g) / e + 4
  return [(h * 60 + 360) % 360, max ? e / max : 0, max]
}
function deHsv(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))) }
  return [f(5), f(3), f(1)]
}

/** Rayon (pixels) d'un engin de cette forme et de cette taille, pour le toucher. */
export function rayonVaisseau(_forme: Forme, taille: number): number {
  return 9 * taille
}

/**
 * Dessine un engin : sa forme, tournée dans le sens de sa marche (angle), à la taille de son palier. couleur : sa
 * teinte (la cerise du joueur, la couleur de la Maison d'un bot) pour sa silhouette ; anneau : un anneau de cette
 * couleur sous le vaisseau, seulement pour celui du joueur (Adrien, 24/10/2026 : pour les Maisons, ça gâchait la
 * lisibilité ; tout le monde a les mêmes images). La Légende a en plus un halo doré.
 */
export function dessinerVaisseau(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, forme: Forme, taille: number,
  couleur: string, encre: string, anneau = false, maison: Maison | null = null): void {
  const f = COQUES[forme], k = taille
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(k, k)
  ctx.lineWidth = 1.4 / k
  ctx.lineJoin = 'round'
  ctx.strokeStyle = encre
  if (forme === 'legende') {
    ctx.beginPath()
    ctx.arc(0, 0, 15, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(242, 198, 106, 0.25)'
    ctx.fill()
  }
  // Discret (Adrien, 24/10/2026 : le disque rouge gênait) : un fin cercle pointillé, sans aplat.
  if (anneau) {
    ctx.beginPath()
    ctx.arc(0, 0, 9.5, 0, 2 * Math.PI)
    ctx.globalAlpha = 0.6
    ctx.setLineDash([2 / k, 2.5 / k])
    ctx.lineWidth = 1.1 / k
    ctx.strokeStyle = couleur
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.lineWidth = 1.4 / k
    ctx.strokeStyle = encre
  }
  // L'image de la forme (proue vers le haut, donc un quart de tour de plus), sinon sa silhouette.
  const im = formePeinte(forme, maison)
  if (im) {
    const [L, H] = dimensions(im), cote = 15, l = (cote * L) / Math.max(L, H), h = (cote * H) / Math.max(L, H)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(im, -l / 2, -h / 2, l, h)
    ctx.restore()
    return
  }
  const teinte = forme === 'legende' ? '#f2c66a' : couleur
  const trace = (pts: Pt[]) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath() }
  for (const a of f.ailerons) { trace(a); ctx.fillStyle = teinte; ctx.fill(); ctx.stroke() }
  trace(f.coque)
  ctx.fillStyle = teinte
  ctx.fill()
  ctx.stroke()
  if (f.hublot) {
    ctx.beginPath()
    ctx.arc(f.hublot[0], f.hublot[1], 1.4, 0, 2 * Math.PI)
    ctx.fillStyle = '#faf2dc'
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}
