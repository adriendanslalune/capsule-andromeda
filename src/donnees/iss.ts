// Orbite de secours de la Station spatiale internationale (ISS), au format TLE (« two-line elements »).
// Source : CelesTrak (NORAD 25544), récupérée le 13/10/2026.
// Le jeu télécharge une orbite à jour quand il le peut ; celle-ci ne sert que si le téléchargement échoue
// (la position devient alors une simulation, de moins en moins précise avec le temps).

export interface OrbiteTLE {
  ligne1: string
  ligne2: string
}

export const ORBITE_ISS_SECOURS: OrbiteTLE = {
  ligne1: '1 25544U 98067A   26286.11204827  .00005858  00000+0  11499-3 0  9991',
  ligne2: '2 25544  51.6319  76.5194 0006724 256.4602 103.5638 15.48846742590035',
}

/** Âge maximal (jours) d'une orbite pour que la position de l'ISS soit considérée comme réelle. */
export const AGE_MAX_ORBITE_ISS = 3
