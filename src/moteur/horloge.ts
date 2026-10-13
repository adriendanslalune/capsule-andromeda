// Horloge injectable.
// Le moteur ne lit jamais l'heure lui-même : on lui passe une horloge.
// En jeu, c'est l'horloge réelle ; dans les tests, une horloge fixe ou accélérée.

/** Une horloge renvoie l'heure courante en millisecondes UTC depuis le 1er janvier 1970. */
export type Horloge = () => number

/** Horloge réelle du téléphone. Seul endroit autorisé à appeler Date.now(). */
export const horlogeReelle: Horloge = () => Date.now()

/** Horloge figée, pour les tests : renvoie toujours le même instant. */
export function horlogeFixe(t: number): Horloge {
  return () => t
}

/** Formate un instant en « HH:MM:SS UTC ». */
export function formaterHeureUTC(t: number): string {
  const d = new Date(t)
  const deux = (n: number) => String(n).padStart(2, '0')
  return `${deux(d.getUTCHours())}:${deux(d.getUTCMinutes())}:${deux(d.getUTCSeconds())} UTC`
}
