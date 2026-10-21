// Les formes des capsules sur la carte (décisions d'Adrien du 21/10/2026) : le niveau du capitaine change la forme de
// son engin par paliers — capsule, navette, corvette, frégate, croiseur, et la Légende au niveau 100 — et la grossit un
// peu à l'intérieur de chaque palier. Nez vers +x ; unités : pixels à l'échelle 1.

import type { Forme } from '../donnees/niveaux'

/** Taille de chaque forme par rapport à la capsule : au plus 1,25 fois (demande d'Adrien du 21/10/2026 : plus gros, c'était
 *  fantaisiste et moche ; c'est la silhouette qui montre le niveau). */
const TAILLE: Record<Forme, number> = { capsule: 1, navette: 1.05, corvette: 1.1, fregate: 1.15, croiseur: 1.2, legende: 1.25 }

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

/** Rayon (pixels) d'un engin de cette forme et de cette taille, pour le toucher. */
export function rayonVaisseau(forme: Forme, taille: number): number {
  return 6 * TAILLE[forme] * taille
}

/**
 * Dessine un engin : sa forme, tournée dans le sens de sa marche (angle), à la taille de son palier. couleur : sa
 * teinte (la cerise du joueur, la couleur de la Maison d'un bot) ; la Légende est toujours dorée, avec un halo.
 */
export function dessinerVaisseau(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, forme: Forme, taille: number,
  couleur: string, encre: string): void {
  const f = COQUES[forme], k = TAILLE[forme] * taille
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
