// Projection de la carte (décisions d'Adrien du 17/10/2026) : carte à plat, vue du dessus ; vraies distances entre
// les planètes ; astres dessinés plus gros que nature mais proportionnés entre eux (50 fois leur taille, le Soleil
// 20 fois). Autour de chaque astre, une « loupe » écarte ce qui tourne près de lui : satellites et engins orbitent à
// des distances agrandies mais dans le bon ordre (l'ISS tout près de la Terre, la Lune plus loin, James Webb au bord
// du système). Au bord de la zone d'un astre (sa sphère d'influence), la loupe rejoint les vraies distances, sans saut.
// Distances dessinées d'après la vraie distance dans l'espace : rien ne passe jamais dans le disque d'un astre.
// Orbites couchées dans le plan de la carte (à leur vraie vitesse) : un satellite qui passe au-dessus d'un pôle ne
// saute pas d'un bord à l'autre. Ce n'est que du dessin : le moteur garde les vraies positions.

import { corps, enfants, position, rayonInfluence } from '../moteur/corps'
import { UA_KM } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'

/** Grossissement des astres sur la carte. */
export const GROSSISSEMENT = 50
export const GROSSISSEMENT_SOLEIL = 20
/** Zone de la loupe du Soleil (km) : Mercure (0,31 UA au plus près) reste à sa vraie place. */
const ZONE_SOLEIL = 0.25 * UA_KM
/** Zone réelle et zone dessinée d'une grande lune, en rayons (réels, puis dessinés). */
const ZONE_LUNE_REELLE = 20
const ZONE_LUNE_DESSINEE = 2.5
/** Lunes qui ont leur propre loupe (les autres sont trop petites pour qu'on s'en approche à l'écran). */
const RAYON_GRANDE_LUNE = 200
/** Astres qui ont un système (une loupe à leur taille : leur sphère d'influence). */
export const CENTRES = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'] as const

export interface Point2 { x: number; y: number }

/** Rayon dessiné d'un astre (km de carte). */
export function rayonDessine(nom: string): number {
  return (corps(nom)?.rayon ?? 0) * (nom === 'Soleil' ? GROSSISSEMENT_SOLEIL : GROSSISSEMENT)
}

/** Une loupe : rayon réel et rayon dessiné de l'astre, zone réelle et zone dessinée (km). */
interface Loupe { R: number; Rd: number; zone: number; zoneDessinee: number }

const LOUPES = new Map<string, Loupe>()
function loupe(nom: string): Loupe {
  let l = LOUPES.get(nom)
  if (!l) {
    const R = corps(nom)?.rayon ?? 0
    const Rd = rayonDessine(nom)
    if (nom === 'Soleil') l = { R, Rd, zone: ZONE_SOLEIL, zoneDessinee: ZONE_SOLEIL }
    else if ((CENTRES as readonly string[]).includes(nom)) l = { R, Rd, zone: rayonInfluence(nom), zoneDessinee: rayonInfluence(nom) }
    else l = { R, Rd, zone: R * ZONE_LUNE_REELLE, zoneDessinee: Rd * ZONE_LUNE_DESSINEE }
    LOUPES.set(nom, l)
  }
  return l
}

/** Grandes lunes de chaque astre (celles qui ont leur loupe). */
const GRANDES_LUNES = new Map<string, string[]>(CENTRES.map((c) => [c,
  enfants(c).filter((e) => e.type === 'lune' && e.rayon >= RAYON_GRANDE_LUNE).map((e) => e.nom)]))

/** Zone dessinée d'un astre (km de carte) : pour cadrer son système. */
export function zoneDessinee(nom: string): number {
  return loupe(nom).zoneDessinee
}

/** Distance dessinée pour une distance réelle d au centre (d ≥ R) : logarithmique, de Rd à la zone dessinée. */
function etirer(l: Loupe, d: number): number {
  const d0 = 0.05 * l.R
  const g = Math.log(1 + Math.max(0, d - l.R) / d0) / Math.log(1 + (l.zone - l.R) / d0)
  return l.Rd + (l.zoneDessinee - l.Rd) * g
}

/**
 * Rabat le vecteur r1 dans le plan de la carte, par la rotation (autour de la ligne des nœuds) qui y amène le plan du
 * mouvement (r1, puis r2 un peu plus tard). Un mouvement rétrograde est rabattu « par en dessous », pour garder son sens.
 * Renvoie une direction unitaire dans le plan.
 */
function rabattre(r1: Vecteur3, r2: Vecteur3): Point2 {
  const n0 = { x: r1.y * r2.z - r1.z * r2.y, y: r1.z * r2.x - r1.x * r2.z, z: r1.x * r2.y - r1.y * r2.x }
  const l = Math.hypot(n0.x, n0.y, n0.z)
  const plat = (x: number, y: number) => { const h = Math.hypot(x, y) || 1; return { x: x / h, y: y / h } }
  if (!(l > 0)) return plat(r1.x, r1.y)
  const n = { x: n0.x / l, y: n0.y / l, z: n0.z / l }
  const sens = n.z >= 0 ? 1 : -1
  const c = n.z * sens
  const ax = n.y * sens, ay = -n.x * sens
  const s = Math.hypot(ax, ay)
  if (s < 1e-12) return plat(r1.x, r1.y)
  const kx = ax / s, ky = ay / s
  // Rotation de Rodrigues autour de k = (kx, ky, 0), d'angle (cos c, sin s).
  const kv = kx * r1.x + ky * r1.y
  return plat(r1.x * c + ky * r1.z * s + kx * kv * (1 - c), r1.y * c - kx * r1.z * s + ky * kv * (1 - c))
}

/**
 * Un point de l'espace à l'instant t, et (pour coucher son mouvement dans le plan) le même un peu plus tard.
 * tCentre : instant où l'on dessine l'astre autour duquel il est (par défaut t) ; pour une orbite tracée sur toute sa
 * période, on la dessine autour de l'astre tel qu'il est maintenant.
 */
export interface PointMobile { p: Vecteur3; t: number; suivant?: { p: Vecteur3; t: number }; tCentre?: number }

/** Point vu à travers la loupe l d'un astre (centre réel c à l'instant du point, dessiné en cd). */
function aTravers(l: Loupe, nom: string, cd: Point2, m: PointMobile): Point2 {
  const c = position(nom, m.t)
  const rel = { x: m.p.x - c.x, y: m.p.y - c.y, z: m.p.z - c.z }
  const d = Math.hypot(rel.x, rel.y, rel.z)
  if (d < 1e-9) return cd
  let u: Point2
  if (m.suivant) {
    const c2 = position(nom, m.suivant.t)
    u = rabattre(rel, { x: m.suivant.p.x - c2.x, y: m.suivant.p.y - c2.y, z: m.suivant.p.z - c2.z })
  } else {
    const h = Math.hypot(rel.x, rel.y) || 1
    u = { x: rel.x / h, y: rel.y / h }
  }
  const r = etirer(l, Math.max(d, l.R))
  return { x: cd.x + u.x * r, y: cd.y + u.y * r }
}

/** Point dessiné (km de carte) d'un point de l'espace. */
export function projeter(m: PointMobile): Point2 {
  const s = loupe('Soleil')
  if (Math.hypot(m.p.x, m.p.y, m.p.z) < s.zone) return aTravers(s, 'Soleil', { x: 0, y: 0 }, m)
  for (const centre of CENTRES) {
    const l = loupe(centre)
    const c = position(centre, m.t)
    if (Math.hypot(m.p.x - c.x, m.p.y - c.y, m.p.z - c.z) >= l.zone) continue
    const cd = m.tCentre === undefined ? c : position(centre, m.tCentre)
    const vu = aTravers(l, centre, cd, m)
    // Près d'une grande lune : sa propre loupe, raccordée à celle de l'astre entre une et deux zones de la lune.
    for (const lune of GRANDES_LUNES.get(centre)!) {
      const ml = loupe(lune)
      const cl = position(lune, m.t)
      const d = Math.hypot(m.p.x - cl.x, m.p.y - cl.y, m.p.z - cl.z)
      if (d >= 2 * ml.zone) continue
      // Centre de la lune vu à travers la loupe de son astre (sans la sienne).
      const centreLune = aTravers(l, centre, cd, { p: cl, t: m.t, suivant: { p: position(lune, m.t + 60_000), t: m.t + 60_000 } })
      const local = aTravers(ml, lune, centreLune, m)
      const q = Math.min(1, Math.max(0, d / ml.zone - 1))
      const w = 1 - q * q * (3 - 2 * q)
      return { x: local.x * w + vu.x * (1 - w), y: local.y * w + vu.y * (1 - w) }
    }
    return vu
  }
  return { x: m.p.x, y: m.p.y }
}

/** Point dessiné d'un astre ou d'un engin (son mouvement couché dans le plan de la carte). */
export function projeterCorps(nom: string, t: number): Point2 {
  if (nom === 'Soleil') return { x: 0, y: 0 }
  const c = corps(nom)
  if (c && (c.type === 'planete' || c.type === 'naine')) { const p = position(nom, t); return { x: p.x, y: p.y } }
  return projeter({ p: position(nom, t), t, suivant: { p: position(nom, t + 60_000), t: t + 60_000 } })
}
