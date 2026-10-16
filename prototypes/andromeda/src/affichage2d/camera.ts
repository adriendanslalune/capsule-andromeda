// La caméra de la carte : quel point de l'espace est au centre de l'écran, et à quelle échelle.
//
// Précision : entre le zoom le plus proche (un mètre par pixel) et le plus lointain (des dizaines de millions de km
// par pixel), le rapport dépasse dix milliards. Le centre est donc tenu comme « un astre + un petit décalage », et
// toutes les positions sont ramenées au centre de la caméra AVANT d'être converties en pixels : aucune grande
// coordonnée n'arrive jusqu'au dessin, ce qui évite les tremblements.
// Accrocher la caméra à un astre lui fait aussi suivre cet astre : la Terre ne file pas hors de l'écran à 30 km/s.

import type { Vecteur3 } from '../moteur/vecteur'

/**
 * Échelles extrêmes (km par pixel) : d'un mètre par pixel (on voit la silhouette de l'ISS, 109 m) à la ceinture de
 * Kuiper et au-delà. Rapport : 5 × 10¹⁰.
 */
export const ECHELLE_MIN = 0.001
export const ECHELLE_MAX = 5e7

export interface Camera {
  /** Astre auquel la caméra est accrochée. */
  ancre: string
  /** Position du centre de l'écran par rapport à l'astre (km, écliptique). */
  dx: number
  dy: number
  /** Kilomètres par pixel (CSS). */
  echelle: number
  /** Taille de l'écran (pixels CSS). */
  largeur: number
  hauteur: number
}

/** Fonction qui donne la position héliocentrique d'un astre à l'instant courant. */
export type Positions = (nom: string) => Vecteur3

export function centre(c: Camera, pos: Positions): { x: number; y: number } {
  const a = pos(c.ancre)
  return { x: a.x + c.dx, y: a.y + c.dy }
}

/**
 * Convertit des positions en pixels. On calcule une fois le centre, puis chaque point est d'abord soustrait au centre
 * (petits nombres), ensuite divisé par l'échelle. y vers le haut dans l'espace, vers le bas à l'écran.
 */
export function projecteur(c: Camera, pos: Positions): (p: { x: number; y: number }) => { sx: number; sy: number } {
  const o = centre(c, pos)
  const k = 1 / c.echelle, mx = c.largeur / 2, my = c.hauteur / 2
  return (p) => ({ sx: mx + (p.x - o.x) * k, sy: my - (p.y - o.y) * k })
}

/** Déplace la vue d'un glissement du doigt (pixels). */
export function glisser(c: Camera, dxPixels: number, dyPixels: number): void {
  c.dx -= dxPixels * c.echelle
  c.dy += dyPixels * c.echelle
}

/** Zoome d'un facteur (> 1 : on s'éloigne) en gardant fixe le point de l'écran (sx, sy). */
export function zoomer(c: Camera, facteur: number, sx: number, sy: number): void {
  const nouvelle = Math.min(ECHELLE_MAX, Math.max(ECHELLE_MIN, c.echelle * facteur))
  const d = c.echelle - nouvelle
  c.dx += (sx - c.largeur / 2) * d
  c.dy -= (sy - c.hauteur / 2) * d
  c.echelle = nouvelle
}

/** Change d'astre d'accroche sans bouger la vue. */
export function raccrocher(c: Camera, nouvelle: string, pos: Positions): void {
  if (nouvelle === c.ancre) return
  const o = centre(c, pos)
  const a = pos(nouvelle)
  c.ancre = nouvelle
  c.dx = o.x - a.x
  c.dy = o.y - a.y
}
