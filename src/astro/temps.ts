// Échelles de temps astronomiques.
// Les instants du jeu sont en millisecondes UTC ; l'écart avec le temps TDB des éphémérides (environ 69 s)
// est négligeable ici.

/** Jour julien de l'époque J2000 (1er janvier 2000, 12 h). */
export const JJ_J2000 = 2451545

/** Millisecondes par jour. */
export const MS_PAR_JOUR = 86_400_000

/** Unité astronomique (km). */
export const UA_KM = 149_597_870.7

/** Jour julien de l'instant t (ms UTC). */
export function jourJulien(t: number): number {
  return t / MS_PAR_JOUR + 2440587.5
}

/** Jours écoulés depuis J2000. */
export function joursDepuisJ2000(t: number): number {
  return jourJulien(t) - JJ_J2000
}

/** Siècles juliens écoulés depuis J2000. */
export function sieclesDepuisJ2000(t: number): number {
  return joursDepuisJ2000(t) / 36525
}
