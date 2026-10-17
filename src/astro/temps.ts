// Échelles de temps astronomiques.
// Les instants du jeu sont en millisecondes UTC. Les éphémérides des planètes (VSOP87) comptent en temps
// terrestre TT, en avance de 69,184 s sur l'UTC depuis 2017 (37 secondes intercalaires + 32,184 s) ; on n'en
// tient compte que là (ailleurs, l'écart est négligeable).

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

/** Avance du temps terrestre TT sur l'UTC (ms), constante depuis la dernière seconde intercalaire (2017). */
export const TT_MOINS_UTC_MS = 69_184

/** Jours écoulés depuis J2000, en temps terrestre TT (celui des éphémérides VSOP87). */
export function joursTTDepuisJ2000(t: number): number {
  return joursDepuisJ2000(t + TT_MOINS_UTC_MS)
}
