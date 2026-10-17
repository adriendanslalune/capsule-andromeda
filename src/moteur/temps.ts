// Temps et unités du moteur. Les instants sont en millisecondes UTC, toujours passés en paramètre (jamais d'horloge
// lue ici) : l'affichage fournit l'heure, ce qui permet aussi d'accélérer le temps pour les essais.

/** Unité astronomique (km). */
export const UA_KM = 149_597_870.7

export const MS_PAR_JOUR = 86_400_000

/** Jour julien de l'époque J2000 (1er janvier 2000, 12 h TT). */
export const JJ_J2000 = 2451545

/**
 * Écart entre le temps terrestre (TT, celui des éphémérides) et l'UTC : 37 secondes intercalaires + 32,184 s.
 * La Terre parcourt 2 000 km pendant ces 69 s : on ne peut pas l'ignorer.
 */
export const TT_MOINS_UTC_MS = 69_184

/** Jour julien (échelle UTC) de l'instant t. */
export function jourJulien(t: number): number {
  return t / MS_PAR_JOUR + 2440587.5
}

/** Jours depuis J2000, en temps terrestre (TT ≈ TDB à 2 ms près). */
export function joursTTDepuisJ2000(t: number): number {
  return jourJulien(t + TT_MOINS_UTC_MS) - JJ_J2000
}
