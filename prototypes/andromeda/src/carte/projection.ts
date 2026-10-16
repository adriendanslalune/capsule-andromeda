// Projection de la carte schématique (2D, vue du dessus de l'écliptique) : chaque astre garde sa vraie direction
// autour de son centre (le Soleil, ou sa planète), mais les distances sont écrasées par un logarithme, pour que
// tout tienne dans l'écran du téléphone et reste lisible. L'ordre des distances est conservé.
//
// Rayon à l'écran (pixels, avant le zoom de la carte) en fonction de la distance réelle d (km) au centre :
//   r = r0 + k · ln(1 + (d − dMin) / d0)        (d ≥ dMin)
// r0 : bord du centre (le Soleil ou la planète dessinés) ; d0 : distance de référence ; k choisi pour que la
// distance dMax tombe au rayon rMax.

export interface Echelle {
  /** Distance réelle (km) qui tombe au bord du centre dessiné (rayon r0). */
  dMin: number
  /** Distance réelle (km) de référence du logarithme : en dessous, l'écrasement est faible. */
  d0: number
  /** Distance réelle (km) qui tombe au rayon rMax. */
  dMax: number
  r0: number
  rMax: number
}

export function rayonEcran(d: number, e: Echelle): number {
  const k = (e.rMax - e.r0) / Math.log(1 + (e.dMax - e.dMin) / e.d0)
  if (d <= e.dMin) return (e.r0 * d) / e.dMin
  return e.r0 + k * Math.log(1 + (d - e.dMin) / e.d0)
}

/** Inverse : distance réelle (km) d'un rayon à l'écran. */
export function distanceReelle(r: number, e: Echelle): number {
  const k = (e.rMax - e.r0) / Math.log(1 + (e.dMax - e.dMin) / e.d0)
  if (r <= e.r0) return (r * e.dMin) / e.r0
  return e.dMin + e.d0 * (Math.exp((r - e.r0) / k) - 1)
}

/**
 * Position schématique (pixels, y vers le haut) d'un point de vrai écart (dx, dy, dz) à son centre (km) : même
 * direction vue du dessus, distance écrasée. On prend la vraie distance dans l'espace (pas seulement sa part dans le
 * plan de la carte) : un satellite sur une orbite très inclinée reste ainsi toujours au-dessus du bord de sa planète.
 * Les trajectoires se projettent point par point de la même façon.
 */
export function projeter(dx: number, dy: number, e: Echelle, dz = 0): { x: number; y: number } {
  const h = Math.hypot(dx, dy)
  if (h === 0) return { x: 0, y: 0 }
  const r = rayonEcran(Math.hypot(dx, dy, dz), e)
  return { x: (dx / h) * r, y: (dy / h) * r }
}
