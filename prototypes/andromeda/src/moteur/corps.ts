// Le catalogue des astres de la carte et leurs positions réelles.
//   - Soleil et planètes : VSOP87B (vsop87.ts) ; Pluton : Meeus (pluton.ts).
//   - Lune : théorie de Meeus ; autres lunes : orbites ajustées sur JPL Horizons (modules du jeu, réutilisés).
//   - Satellites artificiels : SGP4 à partir des orbites publiées (TLE) ; sondes : trajectoires de JPL Horizons.
// Toutes les positions sont héliocentriques, dans l'écliptique J2000, en km. L'affichage ne calcule rien lui-même :
// il demande les positions ici.

import { positionLuneGeocentrique } from '../../../../src/astro/lune'
import { positionTLEGeocentrique } from '../../../../src/astro/iss'
import { LISTE_SATELLITES, positionSatellitePlanetocentrique, type Satellite } from '../../../../src/astro/satellites'
import { twoline2satrec, type SatRec } from '../../../../src/astro/sgp4'
import { ENGINS } from '../../../../src/donnees/engins'
import { ORBITE_ISS_SECOURS } from '../../../../src/donnees/iss'
import { RAPPORT_MASSE_SOLEIL } from '../../../../src/donnees/planetes'
import { positionPluton } from './pluton'
import { positionSondeRelative, TRAJECTOIRES } from './sondes'
import { MS_PAR_JOUR, TT_MOINS_UTC_MS, UA_KM } from './temps'
import { ajouter, type Vecteur3 } from './vecteur'
import { positionVSOP } from './vsop87'

export type TypeCorps = 'etoile' | 'planete' | 'naine' | 'lune' | 'satellite' | 'sonde'

export interface Corps {
  nom: string
  type: TypeCorps
  /** Astre autour duquel il tourne (null pour le Soleil et ce qui tourne directement autour du Soleil). */
  parent: string | null
  /** Rayon (km) ; 0 s'il est inconnu ou minuscule (dessiné comme un point). */
  rayon: number
  /** Engins : silhouette à dessiner et envergure (m). */
  modele?: string
  tailleM?: number
}

const PLANETES = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'] as const
const RAYONS_PLANETES = [2439.7, 6051.8, 6371.0, 3389.5, 69911, 58232, 25362, 24622]
const RAYON_PLUTON = 1188.3

/** Rapport de masse Soleil / astre (UAI) : sert au rayon de la sphère d'influence. */
const MASSES: Record<string, number> = { ...RAPPORT_MASSE_SOLEIL, Pluton: 136_047_200 }
const DEMI_GRANDS_AXES_UA: Record<string, number> = {
  Mercure: 0.387, Vénus: 0.723, Terre: 1, Mars: 1.524, Jupiter: 5.203, Saturne: 9.537, Uranus: 19.19,
  Neptune: 30.07, Pluton: 39.48,
}

// Satellites artificiels de la Terre (orbites TLE).
const ORBITES_TLE = new Map<string, SatRec>([
  ['ISS', twoline2satrec(ORBITE_ISS_SECOURS.ligne1, ORBITE_ISS_SECOURS.ligne2)],
  ...ENGINS.filter((e) => e.tle).map((e) => [e.nom, twoline2satrec(e.tle!.ligne1, e.tle!.ligne2)] as [string, SatRec]),
])

const LUNES = new Map<string, Satellite>(LISTE_SATELLITES.map((s) => [s.nom, s]))
const SONDES = new Map(TRAJECTOIRES.map((t) => [t.nom, t]))

export const CORPS: readonly Corps[] = [
  { nom: 'Soleil', type: 'etoile', parent: null, rayon: 695_700 },
  ...PLANETES.map((nom, i): Corps => ({ nom, type: 'planete', parent: null, rayon: RAYONS_PLANETES[i] })),
  { nom: 'Pluton', type: 'naine', parent: null, rayon: RAYON_PLUTON },
  { nom: 'Lune', type: 'lune', parent: 'Terre', rayon: 1737.4 },
  ...LISTE_SATELLITES.map((s): Corps => ({ nom: s.nom, type: 'lune', parent: s.planete, rayon: s.rayon ?? 0 })),
  ...[...ORBITES_TLE.keys()].map((nom): Corps => ({ nom, type: 'satellite', parent: 'Terre', rayon: 0, ...gabarit(nom) })),
  ...TRAJECTOIRES.map((t): Corps => ({ nom: t.nom, type: 'sonde', parent: null, rayon: 0, ...gabarit(t.nom) })),
]

/** Silhouette et envergure d'un engin (l'ISS fait 109 m ; les autres d'après les fiches du jeu). */
function gabarit(nom: string): { modele: string; tailleM: number } {
  if (nom === 'ISS') return { modele: 'iss', tailleM: 109 }
  const fiche = ENGINS.find((e) => e.nom === nom)
  return { modele: fiche?.modele ?? 'sonde', tailleM: fiche?.tailleM ?? 10 }
}

/** Période orbitale d'un satellite artificiel (jours), d'après son orbite publiée. */
export function periodeSatellite(nom: string): number | undefined {
  const o = ORBITES_TLE.get(nom)
  return o ? (2 * Math.PI) / o.no / 1440 : undefined
}

const PAR_NOM = new Map(CORPS.map((c) => [c.nom, c]))

export function corps(nom: string): Corps | undefined {
  return PAR_NOM.get(nom)
}

/** Astres qui tournent autour d'un astre donné. */
export function enfants(nom: string): Corps[] {
  return CORPS.filter((c) => c.parent === nom)
}

/** Astres « de premier niveau » : Soleil, planètes, Pluton, sondes. */
export const PREMIER_NIVEAU: readonly Corps[] = CORPS.filter((c) => c.parent === null)

/** Distance maximale d'un enfant à son astre (km) : sert à ne calculer les lunes que si leur système est à l'écran. */
export const RAYON_SYSTEME: ReadonlyMap<string, number> = (() => {
  const m = new Map<string, number>()
  for (const s of LISTE_SATELLITES) {
    const loin = Math.max(...s.tranches.map((t) => t[2] * (1 + t[3])))
    m.set(s.planete, Math.max(m.get(s.planete) ?? 0, loin))
  }
  m.set('Terre', Math.max(m.get('Terre') ?? 0, 410_000))
  return m
})()

/** Position relative au parent (km), pour un astre qui a un parent. */
export function positionRelative(nom: string, t: number): Vecteur3 {
  if (nom === 'Lune') return positionLuneGeocentrique(t + TT_MOINS_UTC_MS)
  const lune = LUNES.get(nom)
  if (lune) return positionSatellitePlanetocentrique(lune, t)
  const orbite = ORBITES_TLE.get(nom)
  if (orbite) {
    try {
      return positionTLEGeocentrique(orbite, t)
    } catch {
      // Orbite trop ancienne pour SGP4 : on rejoue la dernière année (position simulée, le temps du prototype).
      const epoque = (orbite.jdsatepoch - 2440587.5) * MS_PAR_JOUR
      const an = 365 * MS_PAR_JOUR
      return positionTLEGeocentrique(orbite, epoque + (((t - epoque) % an) + an) % an)
    }
  }
  throw new Error(`Astre sans parent ou inconnu : ${nom}`)
}

/** Position héliocentrique d'un astre (écliptique J2000, km) à l'instant t (ms UTC). */
export function position(nom: string, t: number): Vecteur3 {
  if (nom === 'Soleil') return { x: 0, y: 0, z: 0 }
  if (nom === 'Pluton') return positionPluton(t)
  const c = PAR_NOM.get(nom)
  if (!c) throw new Error(`Astre inconnu : ${nom}`)
  if (c.type === 'planete') return positionVSOP(nom, t)
  const sonde = SONDES.get(nom)
  if (sonde) return ajouter(position(sonde.centre, t), positionSondeRelative(sonde, t))
  return ajouter(position(c.parent!, t), positionRelative(nom, t))
}

/** Rayon de la sphère d'influence (rayon de Hill, km) d'une planète ou de Pluton : a × (m / 3M)^(1/3). */
export function rayonInfluence(nom: string): number {
  return DEMI_GRANDS_AXES_UA[nom] * UA_KM * (1 / (3 * MASSES[nom])) ** (1 / 3)
}

/**
 * Astre dans la sphère d'influence duquel se trouve un point (planète ou Pluton), sinon le Soleil.
 * La caméra s'y accroche, pour suivre l'astre dans son mouvement autour du Soleil.
 */
export function astreDominant(p: { x: number; y: number }, t: number): string {
  let meilleur = 'Soleil'
  let rapport = 1
  for (const nom of [...PLANETES, 'Pluton']) {
    const c = position(nom, t)
    const r = Math.hypot(p.x - c.x, p.y - c.y) / rayonInfluence(nom)
    if (r < rapport) { meilleur = nom; rapport = r }
  }
  return meilleur
}
