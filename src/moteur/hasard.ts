// Hasard injectable.
// Le moteur n'appelle jamais Math.random() : on lui passe une source de hasard.
// Avec une graine, les tirages sont reproductibles (tests, trajectoire du visiteur, contrats du jour).

/** Une source de hasard renvoie un nombre dans [0, 1[. */
export type Hasard = () => number

/**
 * Générateur mulberry32, identique à celui du prototype (fonction `rng`).
 * La même graine donne toujours la même suite de nombres, pour tous les joueurs.
 */
export function mulberry32(graine: number): Hasard {
  let s = graine | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let q = Math.imul(s ^ (s >>> 15), 1 | s)
    q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q
    return ((q ^ (q >>> 14)) >>> 0) / 4294967296
  }
}

/** Hasard non reproductible du téléphone. Seul endroit autorisé à appeler Math.random(). */
export const hasardReel: Hasard = () => Math.random()

/** Entier tiré entre 0 et n − 1. */
export function entierAuHasard(hasard: Hasard, n: number): number {
  return Math.floor(hasard() * n)
}

/** Élément tiré au hasard dans une liste non vide. */
export function choisirAuHasard<T>(hasard: Hasard, liste: readonly T[]): T {
  return liste[entierAuHasard(hasard, liste.length)]
}
