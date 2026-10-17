// Tous les corps où la fusée peut se rendre : Soleil, planètes, Lune, satellites naturels, Station spatiale
// internationale, et les autres engins humains (Hubble, Webb, Voyager… voir engins.ts).
// Chaque corps appartient au système d'une planète (la planète elle-même, ses satellites ; la Lune et l'ISS pour
// la Terre).

import { NOMS_PLANETES, PLANETES, RAPPORT_MASSE_SOLEIL, RAYON_LUNE, type NomPlanete } from '../donnees/planetes'
import { estEngin, ficheEngin, planeteDeLEngin, positionEngin } from './engins'
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
  return estPlanete(nom) || nom === 'Lune' || nom === 'ISS' || nom === 'Soleil' || estEngin(nom) || satellite(nom) !== undefined
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
  if (nom === 'Soleil') return { x: 0, y: 0, z: 0 }
  if (estPlanete(nom)) return positionPlanete(nom, t)
  if (nom === 'Lune') return positionLune(t)
  if (nom === 'ISS') return ajouter(positionPlanete('Terre', t), multiplier(positionISSGeocentrique(t), 1 / UA_KM))
  if (estEngin(nom)) return positionEngin(nom, t)
  return positionSatellite(satelliteConnu(nom), t)
}

/** Planète autour de laquelle tourne le corps (Lune, satellites, ISS, Hubble, Juno…), ou null. */
export function planeteCentrale(nom: NomCorps): NomPlanete | null {
  if (nom === 'Soleil' || estPlanete(nom)) return null
  if (estEngin(nom)) return planeteDeLEngin(nom)
  return planeteDe(nom)
}

const MEMOIRE_PLATE = new Map<NomCorps, { t: number; p: Vecteur3 }>()

/**
 * Position du corps dans le monde du jeu, qui est plat (décision d'Adrien du 17/10/2026) : la carte, la navigation,
 * le visiteur et les autres fusées s'en servent ; seule la vue extérieure 3D garde les vraies positions.
 * Le Soleil, les planètes et les engins lointains : leur vraie position, vue de dessus. Ce qui tourne autour d'une
 * planète : son orbite est « rabattue » dans le plan de la carte (rotation autour de la ligne des nœuds) ; il garde
 * sa vraie distance à la planète et sa vraie vitesse, et ne passe donc jamais dans son disque (vue de dessus, l'ISS
 * y serait 91 % du temps). Hauteur z : celle de la planète.
 */
export function positionPlate(nom: NomCorps, t: number): Vecteur3 {
  const centre = planeteCentrale(nom)
  if (!centre) return positionCorps(nom, t)
  const m = MEMOIRE_PLATE.get(nom)
  if (m && m.t === t) return { ...m.p }
  const c = positionPlanete(centre, t)
  const p = positionCorps(nom, t)
  const rel = { x: p.x - c.x, y: p.y - c.y, z: p.z - c.z }
  // Normale de l'orbite, d'après deux positions à une minute d'écart.
  const c2 = positionPlanete(centre, t + 60_000)
  const p2 = positionCorps(nom, t + 60_000)
  const rel2 = { x: p2.x - c2.x, y: p2.y - c2.y, z: p2.z - c2.z }
  const plat = rabattre(rel, rel2)
  const resultat = { x: c.x + plat.x, y: c.y + plat.y, z: c.z }
  MEMOIRE_PLATE.set(nom, { t, p: resultat })
  return { ...resultat }
}

/**
 * Rabat le vecteur r1 dans le plan de l'écliptique, par la rotation (autour de la ligne des nœuds) qui y amène le plan
 * de l'orbite (r1, r2). Une orbite rétrograde est rabattue « par en dessous », pour garder son sens de parcours.
 * La longueur est conservée.
 */
function rabattre(r1: Vecteur3, r2: Vecteur3): { x: number; y: number } {
  let n = { x: r1.y * r2.z - r1.z * r2.y, y: r1.z * r2.x - r1.x * r2.z, z: r1.x * r2.y - r1.y * r2.x }
  const l = Math.hypot(n.x, n.y, n.z)
  const d = Math.hypot(r1.x, r1.y, r1.z)
  if (!(l > 0)) {
    const h = Math.hypot(r1.x, r1.y) || 1
    return { x: (r1.x / h) * d, y: (r1.y / h) * d }
  }
  n = { x: n.x / l, y: n.y / l, z: n.z / l }
  const sens = n.z >= 0 ? 1 : -1
  const c = n.z * sens
  const ax = n.y * sens, ay = -n.x * sens
  const s = Math.hypot(ax, ay)
  if (s < 1e-12) return { x: r1.x, y: r1.y }
  const k = { x: ax / s, y: ay / s, z: 0 }
  // Rotation de Rodrigues autour de k (cos c, sin s).
  const kv = k.x * r1.x + k.y * r1.y
  const cx = k.y * r1.z, cy = -k.x * r1.z
  const x = r1.x * c + cx * s + k.x * kv * (1 - c)
  const y = r1.y * c + cy * s + k.y * kv * (1 - c)
  // Le résultat est dans le plan (z ≈ 0) : on le remet à la longueur exacte.
  const h = Math.hypot(x, y) || 1
  return { x: (x / h) * d, y: (y / h) * d }
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
  if (estEngin(nom)) return ficheEngin(nom)!.periodeJours
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

/** Système planétaire d'un point de l'espace (dans la sphère d'influence d'une planète), ou null. */
export function systemeDuPoint(p: { x: number; y: number }, t: number): NomPlanete | null {
  let meilleure: NomPlanete | null = null
  let meilleurRapport = 1
  for (const n of NOMS_PLANETES) {
    const c = positionPlanete(n, t)
    const rapport = Math.hypot(p.x - c.x, p.y - c.y) / rayonInfluence(n)
    if (rapport < meilleurRapport) { meilleure = n; meilleurRapport = rapport }
  }
  return meilleure
}

/** Système planétaire d'un corps à l'instant t : null pour le Soleil ; pour un engin, là où il se trouve. */
export function systemeDuCorps(nom: NomCorps, t: number): NomPlanete | null {
  if (nom === 'Soleil') return null
  if (estEngin(nom)) return systemeDuPoint(positionEngin(nom, t), t)
  return planeteDe(nom)
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
