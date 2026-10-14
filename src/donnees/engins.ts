// Les engins humains du système solaire (en plus de l'ISS, calculée à part) : Hubble en orbite basse, James Webb
// autour du point de Lagrange L2, Voyager 1 et 2 aux confins. Orbites simplifiées, mais à la bonne place et au bon
// rythme : Hubble fait le tour de la Terre en 95 minutes, Webb son orbite de halo en six mois, les Voyager
// s'éloignent en ligne droite à leur vraie vitesse.

export type Engin =
  | { nom: string; type: 'orbite-basse'; altitudeKm: number; inclinaison: number; noeud: number; periodeMinutes: number; tailleM: number }
  | { nom: string; type: 'L2'; distanceKm: number; haloPlanKm: number; haloHautKm: number; periodeJours: number; tailleM: number }
  | {
      nom: string; type: 'lointain'
      /** Instant de référence (ms UTC), distance au Soleil (UA) à cet instant, vitesse d'éloignement (UA par an). */
      epoque: number; distanceUA: number; vitesseUAParAn: number
      /** Direction (écliptique J2000, degrés). */
      longitude: number; latitude: number
      tailleM: number
    }

export const ENGINS: readonly Engin[] = [
  // Hubble : 515 km d'altitude, inclinaison 28,5°, 95,4 minutes par tour (nœud choisi arbitrairement).
  { nom: 'Hubble', type: 'orbite-basse', altitudeKm: 515, inclinaison: 28.47, noeud: 120, periodeMinutes: 95.4, tailleM: 13 },
  // James Webb : à 1,5 million de km de la Terre, à l'opposé du Soleil ; halo d'environ 250 000 × 800 000 km.
  { nom: 'James Webb', type: 'L2', distanceKm: 1_500_000, haloPlanKm: 250_000, haloHautKm: 800_000, periodeJours: 180, tailleM: 21 },
  // Voyager 1 et 2 (NASA/JPL) : distances au 1er janvier 2025, vitesses d'éloignement et directions approchées.
  { nom: 'Voyager 1', type: 'lointain', epoque: Date.UTC(2025, 0, 1), distanceUA: 165.4, vitesseUAParAn: 3.57, longitude: 255.0, latitude: 35.0, tailleM: 13 },
  { nom: 'Voyager 2', type: 'lointain', epoque: Date.UTC(2025, 0, 1), distanceUA: 138.6, vitesseUAParAn: 3.22, longitude: 290.0, latitude: -35.5, tailleM: 13 },
]
