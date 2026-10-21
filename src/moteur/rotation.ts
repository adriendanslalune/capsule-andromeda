// La Terre qui tourne (demande d'Adrien du 21/10/2026) : où le Soleil est au zénith à l'instant t (le point
// subsolaire). La carte enroule le planisphère sur le globe pour que la face éclairée soit la vraie : à minuit à Paris,
// l'Europe est dans la nuit. Formules simplifiées de l'almanach (précises à quelques dixièmes de degré).

import { corps, definirOrientation, position } from './corps'

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

/**
 * Les autres astres qui tournent (demande d'Adrien du 21/10/2026) : leur jour solaire (heures ; négatif : ils tournent à
 * l'envers), l'inclinaison de leur axe (degrés) et la longitude héliocentrique où commence leur printemps nord (degrés),
 * qui disent quel pôle est au soleil. Valeurs arrondies ; Vénus : ce sont ses nuages qu'on voit, qui font le tour en
 * 4 jours (la planète elle-même met 117 jours).
 */
export const ROTATIONS: Readonly<Record<string, { jour: number; obliquite: number; printemps: number }>> = {
  Soleil: { jour: 609.12, obliquite: 0, printemps: 0 }, // 25,38 jours à l'équateur
  Mercure: { jour: 4222.6, obliquite: 0, printemps: 0 },
  Vénus: { jour: -96, obliquite: 0, printemps: 0 },
  Mars: { jour: 24.6597, obliquite: 25.19, printemps: 85 },
  Jupiter: { jour: 9.9259, obliquite: 3.13, printemps: 0 },
  Saturne: { jour: 10.6562, obliquite: 26.73, printemps: 173 },
  Uranus: { jour: -17.24, obliquite: 82.23, printemps: 347 },
  Neptune: { jour: 16.11, obliquite: 28.32, printemps: 45 },
  Pluton: { jour: -153.29, obliquite: 57.5, printemps: 220 },
}

/**
 * Le point subsolaire d'un astre qui tourne à l'instant t (latitude, longitude en degrés), ou null s'il ne tourne pas
 * dans le jeu. La Terre : le vrai (pointSubsolaire) ; les lunes : d'après leurs phases ; les autres : sa longitude tourne avec leur jour solaire (depuis
 * le 1er janvier 2000), sa latitude suit leur saison.
 */
export function orientation(nom: string, t: number): { lat: number; lon: number } | null {
  if (nom === 'Terre') return pointSubsolaire(t)
  // Les lunes (demandes d'Adrien du 21/10/2026) montrent toujours la même face à leur planète (leur longitude 0 la
  // regarde) : le Soleil fait leurs phases. Pleine lune : le Soleil est derrière la planète, la face tournée vers elle
  // est éclairée (longitude 0) ; nouvelle lune : 180°. Leur saison : celle de leur planète (elles tournent dans le plan
  // de son équateur).
  const c = corps(nom)
  if (c?.type === 'lune' && c.parent) {
    const m = position(nom, t), e = position(c.parent, t)
    const versPlanete = Math.atan2(e.y - m.y, e.x - m.x), versSoleil = Math.atan2(-m.y, -m.x)
    const lat = ROTATIONS[c.parent] ? orientation(c.parent, t)!.lat : 0
    return { lat, lon: ((((versSoleil - versPlanete) / RAD) % 360) + 540) % 360 - 180 }
  }
  const r = ROTATIONS[nom]
  if (!r) return null
  const heures = (t - Date.UTC(2000, 0, 1, 12)) / 3_600_000
  const lon = (((-360 * heures) / r.jour) % 360 + 540) % 360 - 180
  const p = position(nom, t), saison = Math.atan2(p.y, p.x) / RAD - r.printemps
  return { lat: Math.asin(Math.sin(r.obliquite * RAD) * Math.sin(saison * RAD)) / RAD, lon }
}

// Les sondes posées sur un astre tournent avec lui (moteur/corps.ts a besoin de son orientation).
definirOrientation(orientation)
