// Les engins humains du système solaire, à leur position réelle (en plus de l'ISS, calculée à part) :
//  - autour de la Terre (Hubble, Tiangong, la sélection de satellites) : par la méthode SGP4, à partir de leur orbite
//    publiée ;
//  - les sondes et télescopes lointains : trajectoires de JPL Horizons (NASA), voir engins-jpl.ts.
// Chaque engin est une destination : on s'en approche à trois fois sa taille (de 25 à 100 m).

import type { OrbiteTLE } from './iss'

export type ModeleEngin =
  | 'hubble' | 'tiangong' | 'webb' | 'gaia' | 'voyager' | 'pioneer' | 'new-horizons' | 'parker' | 'solar-orbiter'
  | 'bepicolombo' | 'clipper' | 'juice' | 'lucy' | 'psyche' | 'juno' | 'roadster'
  /** Silhouettes communes : télescope, satellite (un corps et deux panneaux). */
  | 'observatoire' | 'satellite'

export interface FicheEngin {
  nom: string
  modele: ModeleEngin
  /** Envergure (m), pour l'échelle des points et des étiquettes. */
  tailleM: number
  /** Période de son mouvement autour de ce qu'il suit (jours) : sert au calcul des rendez-vous. */
  periodeJours: number
  /** Une ligne pour la vitrine des trophées. */
  description: string
  /** Orbite publiée (engins en orbite basse). */
  tle?: OrbiteTLE
}

export const ENGINS: readonly FicheEngin[] = [
  { nom: 'Hubble', modele: 'hubble', tailleM: 13, periodeJours: 95.4 / 1440, description: 'Télescope spatial, vers 470 km d’altitude',
    // CelesTrak (NORAD 20580), le 14/10/2026.
    tle: { ligne1: '1 20580U 90037B   26286.62243497  .00006667  00000+0  20260-3 0  9992', ligne2: '2 20580  28.4737 350.3749 0001899  43.5848 316.4898 15.31930979806749' } },
  { nom: 'Tiangong', modele: 'tiangong', tailleM: 55, periodeJours: 92.3 / 1440, description: 'Station spatiale chinoise',
    // CelesTrak (NORAD 48274, module Tianhe), le 14/10/2026.
    tle: { ligne1: '1 48274U 21035A   26287.28427591  .00021633  00000+0  25637-3 0  9999', ligne2: '2 48274  41.4695 318.6409 0000496 117.1795 242.9094 15.60710014311760' } },
  // Sélection de satellites de la Terre, touchables (liste validée par Adrien le 17/10/2026) ; tous les autres satellites
  // actifs sont la poussière (donnees/poussiere.ts). Envergures approximatives.
  { nom: 'Chandra', modele: 'observatoire', tailleM: 19.5, periodeJours: 3809.7 / 1440, description: 'Télescope à rayons X, sur une orbite très allongée',
    // CelesTrak (NORAD 25867), le 17/10/2026.
    tle: { ligne1: '1 25867U 99040B   26291.02171895  .00000831  00000+0  00000+0 0  9993', ligne2: '2 25867  57.8392 113.5005 7647127 309.0348   0.2108  0.37797800 17785' } },
  { nom: 'Fermi', modele: 'observatoire', tailleM: 9, periodeJours: 94.5 / 1440, description: 'Télescope à rayons gamma',
    // CelesTrak (NORAD 33053), le 17/10/2026.
    tle: { ligne1: '1 33053U 08029A   26289.73436165  .00002769  00000+0  96048-4 0  9999', ligne2: '2 33053  25.5813  80.1576 0007662 325.4127  34.5913 15.24495265 14252' } },
  { nom: 'Swift', modele: 'observatoire', tailleM: 6, periodeJours: 90.2 / 1440, description: 'Chasseur de sursauts gamma',
    // CelesTrak (NORAD 28485), le 17/10/2026.
    tle: { ligne1: '1 28485U 04047A   26290.39541751  .00465324  64813-4  10431-2 0  9997', ligne2: '2 28485  20.5507 309.9702 0002760 165.2944 194.7587 15.96238936206184' } },
  { nom: 'TESS', modele: 'observatoire', tailleM: 4, periodeJours: 20504.0 / 1440, description: 'Chasseur de planètes, jusqu’à la distance de la Lune',
    // CelesTrak (NORAD 43435), le 17/10/2026.
    tle: { ligne1: '1 43435U 18038A   26264.61819158 -.00000879  00000+0  00000+0 0  9991', ligne2: '2 43435  56.2338  32.1610 4943752  64.1731  11.1423  0.07023037  1923' } },
  { nom: 'Terra', modele: 'satellite', tailleM: 10, periodeJours: 98.6 / 1440, description: 'Observe la Terre depuis 1999',
    // CelesTrak (NORAD 25994), le 17/10/2026.
    tle: { ligne1: '1 25994U 99068A   26290.47041127  .00000284  00000+0  66688-4 0  9997', ligne2: '2 25994  97.9312 335.0823 0002174 168.4952 303.6542 14.61178548427466' } },
  { nom: 'Landsat 9', modele: 'satellite', tailleM: 10, periodeJours: 98.8 / 1440, description: 'Photographie les terres émergées',
    // CelesTrak (NORAD 49260), le 17/10/2026.
    tle: { ligne1: '1 49260U 21088A   26290.15413886  .00000290  00000+0  74354-4 0  9992', ligne2: '2 49260  98.2159 358.7737 0001324  86.6605 273.4745 14.57114795268763' } },
  { nom: 'Sentinel-2B', modele: 'satellite', tailleM: 8, periodeJours: 100.6 / 1440, description: 'Satellite européen d’observation de la Terre',
    // CelesTrak (NORAD 42063), le 17/10/2026.
    tle: { ligne1: '1 42063U 17013A   26290.51519021  .00000415  00000+0  17499-3 0  9992', ligne2: '2 42063  98.5739   3.5336 0001131  88.8278 271.3035 14.30814837502136' } },
  { nom: 'GOES-19', modele: 'satellite', tailleM: 25, periodeJours: 1436.1 / 1440, description: 'Météo des Amériques, géostationnaire',
    // CelesTrak (NORAD 60133), le 17/10/2026.
    tle: { ligne1: '1 60133U 24119A   26290.46997009 -.00000247  00000+0  00000+0 0  9995', ligne2: '2 60133   0.0074  95.0445 0000481 179.8312 205.1326  1.00271723  8197' } },
  { nom: 'Meteosat-12', modele: 'satellite', tailleM: 16, periodeJours: 1436.0 / 1440, description: 'Météo de l’Europe et de l’Afrique, géostationnaire',
    // CelesTrak (NORAD 54743), le 17/10/2026.
    tle: { ligne1: '1 54743U 22170C   26290.29110434 -.00000003  00000+0  00000+0 0  9990', ligne2: '2 54743   0.7696  24.3189 0003222  91.0384  15.1009  1.00277895 14206' } },
  { nom: 'Himawari-9', modele: 'satellite', tailleM: 8, periodeJours: 1436.1 / 1440, description: 'Météo de l’Asie, géostationnaire',
    // CelesTrak (NORAD 41836), le 17/10/2026.
    tle: { ligne1: '1 41836U 16064A   26289.96263613 -.00000272  00000+0  00000+0 0  9992', ligne2: '2 41836   0.0125  72.0179 0001052 126.2184 314.5924  1.00273919 36436' } },
  { nom: 'GPS III-1', modele: 'satellite', tailleM: 12, periodeJours: 718.0 / 1440, description: 'Satellite GPS « Vespucci »',
    // CelesTrak (NORAD 43873), le 17/10/2026.
    tle: { ligne1: '1 43873U 18109A   26289.90754345  .00000024  00000+0  00000+0 0  9992', ligne2: '2 43873  55.7633  87.3859 0041027 196.5268 335.6401  2.00566327 57518' } },
  { nom: 'Galileo 101', modele: 'satellite', tailleM: 15, periodeJours: 844.7 / 1440, description: 'Premier satellite Galileo opérationnel',
    // CelesTrak (NORAD 37846), le 17/10/2026.
    tle: { ligne1: '1 37846U 11060A   26289.85810171 -.00000078  00000+0  00000+0 0  9998', ligne2: '2 37846  56.9444 338.4586 0001311 302.2506  57.7997  1.70475835 93199' } },
  { nom: 'Vanguard 1', modele: 'satellite', tailleM: 1, periodeJours: 100.1 / 1440, description: 'Le plus vieux satellite encore en orbite (1958)',
    // CelesTrak (NORAD 27386), le 17/10/2026.
    tle: { ligne1: '1 27386U 02009A   26290.35983958  .00000090  00000+0  43077-4 0  9999', ligne2: '2 27386  98.3985 239.0304 0001361  87.5203  63.3582 14.39088484291050' } },
  { nom: 'Envisat', modele: 'satellite', tailleM: 26, periodeJours: 100.1 / 1440, description: 'Satellite européen de 8 tonnes, mort depuis 2012',
    // CelesTrak (NORAD 27386), le 17/10/2026.
    tle: { ligne1: '1 27386U 02009A   26290.35983958  .00000090  00000+0  43077-4 0  9999', ligne2: '2 27386  98.3985 239.0304 0001361  87.5203  63.3582 14.39088484291050' } },
  { nom: 'James Webb', modele: 'webb', tailleM: 21, periodeJours: 180, description: 'Télescope, autour du point L2' },
  { nom: 'Gaia', modele: 'gaia', tailleM: 10, periodeJours: 365, description: 'Cartographe des étoiles, retraité en 2025' },
  { nom: 'Parker Solar Probe', modele: 'parker', tailleM: 3, periodeJours: 88, description: 'Sonde qui frôle le Soleil' },
  { nom: 'Solar Orbiter', modele: 'solar-orbiter', tailleM: 18, periodeJours: 180, description: 'Sonde solaire européenne' },
  { nom: 'BepiColombo', modele: 'bepicolombo', tailleM: 30, periodeJours: 88, description: 'En route vers Mercure' },
  { nom: 'Europa Clipper', modele: 'clipper', tailleM: 30, periodeJours: 365, description: 'En route vers Europe' },
  { nom: 'JUICE', modele: 'juice', tailleM: 27, periodeJours: 365, description: 'En route vers les lunes de Jupiter' },
  { nom: 'Juno', modele: 'juno', tailleM: 20, periodeJours: 33, description: 'En orbite autour de Jupiter' },
  { nom: 'Lucy', modele: 'lucy', tailleM: 16, periodeJours: 365, description: 'Vers les astéroïdes troyens' },
  { nom: 'Psyche', modele: 'psyche', tailleM: 25, periodeJours: 365, description: 'Vers l’astéroïde métallique Psyché' },
  { nom: 'Tesla Roadster', modele: 'roadster', tailleM: 4, periodeJours: 557, description: 'Une voiture et son pilote, lancés en 2018' },
  { nom: 'New Horizons', modele: 'new-horizons', tailleM: 3, periodeJours: 3650, description: 'Après Pluton, la ceinture de Kuiper' },
  { nom: 'Pioneer 10', modele: 'pioneer', tailleM: 3, periodeJours: 3650, description: 'Silencieuse depuis 2003' },
  { nom: 'Pioneer 11', modele: 'pioneer', tailleM: 3, periodeJours: 3650, description: 'Silencieuse depuis 1995' },
  { nom: 'Voyager 1', modele: 'voyager', tailleM: 13, periodeJours: 3650, description: 'L’objet humain le plus lointain' },
  { nom: 'Voyager 2', modele: 'voyager', tailleM: 13, periodeJours: 3650, description: 'Seule visiteuse d’Uranus et de Neptune' },
]

/** Distance d'approche d'un engin (km) : trois fois sa taille, de 25 m (Roadster) à 100 m (Tiangong). */
export function approcheEnginKm(tailleM: number): number {
  return Math.min(100, Math.max(25, 3 * tailleM)) / 1000
}
