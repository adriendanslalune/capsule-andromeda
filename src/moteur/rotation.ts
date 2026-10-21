// La Terre qui tourne (demande d'Adrien du 21/10/2026) : où le Soleil est au zénith à l'instant t (le point
// subsolaire). La carte enroule le planisphère sur le globe pour que la face éclairée soit la vraie : à minuit à Paris,
// l'Europe est dans la nuit. Formules simplifiées de l'almanach (précises à quelques dixièmes de degré).

const RAD = Math.PI / 180

/** Le point subsolaire à l'instant t (ms UTC) : latitude (la déclinaison du Soleil) et longitude, en degrés. */
export function pointSubsolaire(t: number): { lat: number; lon: number } {
  const n = t / 86_400_000 - 10_957.5 // jours depuis le 1er janvier 2000 à midi (J2000)
  const L = 280.46 + 0.9856474 * n // longitude moyenne du Soleil
  const g = (357.528 + 0.9856003 * n) * RAD // anomalie moyenne
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD // longitude écliptique
  const epsilon = (23.439 - 0.0000004 * n) * RAD // obliquité
  const declinaison = Math.asin(Math.sin(epsilon) * Math.sin(lambda))
  const ascension = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))
  // L'équation du temps (minutes) : l'écart entre le Soleil vrai et le Soleil moyen.
  let ecart = L - ascension / RAD
  ecart = ((ecart % 360) + 540) % 360 - 180
  const heures = ((t % 86_400_000) + 86_400_000) % 86_400_000 / 3_600_000
  let lon = -15 * (heures - 12 + (4 * ecart) / 60)
  lon = ((lon % 360) + 540) % 360 - 180
  return { lat: declinaison / RAD, lon }
}
