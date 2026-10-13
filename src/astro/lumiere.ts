// Vitesse de la lumière : temps de trajet d'un signal (ping, transmissions).

/** Secondes mises par la lumière pour parcourir 1 UA. */
export const SECONDES_LUMIERE_PAR_UA = 499.0048

/** Temps de trajet de la lumière (secondes) sur une distance en UA. */
export function delaiLumiere(distanceUA: number): number {
  return distanceUA * SECONDES_LUMIERE_PAR_UA
}
