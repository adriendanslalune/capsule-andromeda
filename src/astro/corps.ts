// Tous les corps où la fusée peut se rendre : planètes, Lune, satellites naturels et Station spatiale internationale.
// Chaque corps appartient au système d'une planète (la planète elle-même, ses satellites ; la Lune et l'ISS pour
// la Terre).

import { NOMS_PLANETES, PLANETES, RAPPORT_MASSE_SOLEIL, RAYON_LUNE, type NomPlanete } from '../donnees/planetes'
import { demiGrandAxeISS, periodeISS, positionISSGeocentrique } from './iss'
import { positionLune } from './lune'
import { positionPlanete } from './planetes'
import { LISTE_SATELLITES, positionSatellite, satellite, satellitesDe, type Satellite } from './satellites'
import { UA_KM } from './temps'
import { ajouter, multiplier, type Vecteur3 } from './vecteur'

/** Nom d'un corps : une planète, « Lune », « ISS », ou le nom d'un satellite (par exemple « Titan »). */
export type NomCorps = string

const PLANETES_CONNUES = new Set<string>(NOMS_PLANETES)

export function estPlanete(nom: NomCorps): nom is NomPlanete {
  return PLANETES_CONNUES.has(nom)
}

export function corpsExiste(nom: NomCorps): boolean {
  return estPlanete(nom) || nom === 'Lune' || nom === 'ISS' || satellite(nom) !== undefined
}

/** Tous les corps, dans l'ordre : planètes, Lune, ISS, puis satellites naturels. */
export function tousLesCorps(): NomCorps[] {
  return [...NOMS_PLANETES, 'Lune', 'ISS', ...LISTE_SATELLITES.map((s) => s.nom)]
}

/** Corps d'un système, dans l'ordre : la planète, (pour la Terre : Lune, ISS), puis ses satellites naturels. */
export function corpsDuSysteme(planete: NomPlanete): NomCorps[] {
  const proches = planete === 'Terre' ? ['Lune', 'ISS'] : []
  return [planete, ...proches, ...satellitesDe(planete).map((s) => s.nom)]
}

function satelliteConnu(nom: NomCorps): Satellite {
  const s = satellite(nom)
  if (!s) throw new Error(`Corps inconnu : ${nom}`)
  return s
}

/** Planète dont le corps fait partie du système. */
export function planeteDe(nom: NomCorps): NomPlanete {
  if (estPlanete(nom)) return nom
  if (nom === 'Lune' || nom === 'ISS') return 'Terre'
  return satelliteConnu(nom).planete
}

/** Position héliocentrique du corps (écliptique J2000, UA). */
export function positionCorps(nom: NomCorps, t: number): Vecteur3 {
  if (estPlanete(nom)) return positionPlanete(nom, t)
  if (nom === 'Lune') return positionLune(t)
  if (nom === 'ISS') return ajouter(positionPlanete('Terre', t), multiplier(positionISSGeocentrique(t), 1 / UA_KM))
  return positionSatellite(satelliteConnu(nom), t)
}

/** Demi-grand axe de l'orbite du satellite autour de sa planète (km) ; null pour une planète. */
export function demiGrandAxeAutourDeLaPlanete(nom: NomCorps): number | null {
  if (estPlanete(nom)) return null
  if (nom === 'Lune') return 384_400
  if (nom === 'ISS') return demiGrandAxeISS()
  return satelliteConnu(nom).demiGrandAxe
}

/**
 * Période du mouvement du corps (jours) : autour du Soleil pour une planète, autour de sa planète pour un
 * satellite ou la Lune.
 */
export function periodeOrbitale(nom: NomCorps): number {
  if (estPlanete(nom)) {
    const a = PLANETES.find((p) => p.nom === nom)!.elements[0]
    return 365.25 * a ** 1.5
  }
  if (nom === 'Lune') return 27.321661
  if (nom === 'ISS') return periodeISS()
  return satelliteConnu(nom).periode
}

/**
 * Rayon de la sphère d'influence de la planète (rayon de Hill, UA) : a × (m / 3M)^(1/3).
 * Terre ≈ 0,010 UA, Jupiter ≈ 0,35 UA, Neptune ≈ 0,78 UA.
 */
export function rayonInfluence(planete: NomPlanete): number {
  const a = PLANETES.find((p) => p.nom === planete)!.elements[0]
  return a * (1 / (3 * RAPPORT_MASSE_SOLEIL[planete])) ** (1 / 3)
}

/** Distance (km) convertie en UA. */
export function enUA(km: number): number {
  return km / UA_KM
}

/** Rayon du Soleil (km). */
export const RAYON_SOLEIL = 696_000

/** Rayon d'un corps (km) : le Soleil, une planète, la Lune, un satellite (null s'il est inconnu) ; 0 pour l'ISS. */
export function rayonCorps(nom: NomCorps): number | null {
  if (nom === 'Soleil') return RAYON_SOLEIL
  if (nom === 'Lune') return RAYON_LUNE
  if (nom === 'ISS') return 0
  const p = PLANETES.find((x) => x.nom === nom)
  if (p) return p.rayon
  return satellite(nom)?.rayon ?? null
}
