// Les engins humains du système solaire, à leur position réelle (en plus de l'ISS, calculée à part) :
//  - en orbite basse (Hubble, la station chinoise Tiangong) : par la méthode SGP4, à partir de leur orbite publiée ;
//  - les sondes et télescopes lointains : trajectoires de JPL Horizons (NASA), voir engins-jpl.ts.
// Chaque engin est une destination : on s'en approche à 100 m.

import type { OrbiteTLE } from './iss'

export type ModeleEngin =
  | 'hubble' | 'tiangong' | 'webb' | 'gaia' | 'voyager' | 'pioneer' | 'new-horizons' | 'parker' | 'solar-orbiter'
  | 'bepicolombo' | 'clipper' | 'juice' | 'lucy' | 'psyche' | 'juno'

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
  { nom: 'New Horizons', modele: 'new-horizons', tailleM: 3, periodeJours: 3650, description: 'Après Pluton, la ceinture de Kuiper' },
  { nom: 'Pioneer 10', modele: 'pioneer', tailleM: 3, periodeJours: 3650, description: 'Silencieuse depuis 2003' },
  { nom: 'Pioneer 11', modele: 'pioneer', tailleM: 3, periodeJours: 3650, description: 'Silencieuse depuis 1995' },
  { nom: 'Voyager 1', modele: 'voyager', tailleM: 13, periodeJours: 3650, description: 'L’objet humain le plus lointain' },
  { nom: 'Voyager 2', modele: 'voyager', tailleM: 13, periodeJours: 3650, description: 'Seule visiteuse d’Uranus et de Neptune' },
]

/** Distance d'approche d'un engin (km) : on s'arrête à 100 m. */
export const APPROCHE_ENGIN_KM = 0.1
