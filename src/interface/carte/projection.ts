// Projection de la carte (décisions d'Adrien du 17/10/2026) : carte à plat, vue du dessus, vraies distances entre les
// planètes ; astres dessinés plus gros que nature mais proportionnés entre eux (50 fois leur taille, le Soleil 20 fois) ;
// autour de chaque astre, une « loupe » écarte ce qui tourne près de lui : satellites et engins orbitent à des distances
// agrandies mais dans le bon ordre (l'ISS tout près de la Terre, la Lune plus loin, James Webb au bord du système).
// Au bord de la zone d'un astre (sa sphère d'influence), la loupe rejoint les vraies distances, sans saut.
// Le moteur garde les vraies positions : ce n'est que du dessin (positions en UA, « UA de carte »).

import { corpsDuSysteme, estPlanete, rayonCorps, rayonInfluence, type NomCorps } from '../../astro/corps'
import { UA_KM } from '../../astro/temps'
import { NOMS_PLANETES, type NomPlanete } from '../../donnees/planetes'
import { positionAstre, type Point2 } from '../../moteur/fusee'

/** Grossissement des astres sur la carte. */
export const GROSSISSEMENT = 50
export const GROSSISSEMENT_SOLEIL = 20
/** Zone de la loupe du Soleil (UA) : Mercure (0,31 UA au plus près) reste à sa vraie place. */
const ZONE_SOLEIL = 0.25
/** Zone réelle et zone dessinée d'une grande lune, en rayons (réels, puis dessinés). */
const ZONE_LUNE_REELLE = 20
const ZONE_LUNE_DESSINEE = 2.5
/** Lunes qui ont leur propre loupe (les autres sont trop petites pour qu'on s'en approche à l'écran). */
const RAYON_GRANDE_LUNE = 200

const km = (x: number) => x / UA_KM

/** Rayon dessiné d'un astre (UA de carte). */
export function rayonDessine(nom: NomCorps): number {
  const r = rayonCorps(nom) ?? 0
  return km(r) * (nom === 'Soleil' ? GROSSISSEMENT_SOLEIL : GROSSISSEMENT)
}

/** Une loupe : centre (vrai), rayon réel et rayon dessiné de l'astre, zone réelle et zone dessinée. */
interface Loupe { nom: NomCorps; R: number; Rd: number; zone: number; zoneDessinee: number }

const LOUPES = new Map<NomCorps, Loupe>()
function loupe(nom: NomCorps): Loupe {
  let l = LOUPES.get(nom)
  if (!l) {
    const R = km(rayonCorps(nom) ?? 0)
    const Rd = rayonDessine(nom)
    if (nom === 'Soleil') l = { nom, R, Rd, zone: ZONE_SOLEIL, zoneDessinee: ZONE_SOLEIL }
    else if (estPlanete(nom)) l = { nom, R, Rd, zone: rayonInfluence(nom), zoneDessinee: rayonInfluence(nom) }
    else l = { nom, R, Rd, zone: R * ZONE_LUNE_REELLE, zoneDessinee: Rd * ZONE_LUNE_DESSINEE }
    LOUPES.set(nom, l)
  }
  return l
}

/** Grandes lunes de chaque planète (celles qui ont leur loupe). */
const GRANDES_LUNES = new Map<NomPlanete, NomCorps[]>(NOMS_PLANETES.map((p) => [p,
  corpsDuSysteme(p).filter((n) => !estPlanete(n) && n !== 'ISS' && (rayonCorps(n) ?? 0) >= RAYON_GRANDE_LUNE)]))

/** Distance dessinée, pour une distance réelle d au centre (d ≥ R) : logarithmique, de Rd à la zone dessinée. */
function etirer(l: Loupe, d: number): number {
  const d0 = 0.05 * l.R
  const g = Math.log(1 + Math.max(0, d - l.R) / d0) / Math.log(1 + (l.zone - l.R) / d0)
  return l.Rd + (l.zoneDessinee - l.Rd) * g
}

/** Inverse de etirer. */
function contracter(l: Loupe, dd: number): number {
  const d0 = 0.05 * l.R
  const g = Math.max(0, (dd - l.Rd) / (l.zoneDessinee - l.Rd))
  return l.R + d0 * (Math.exp(g * Math.log(1 + (l.zone - l.R) / d0)) - 1)
}

/** Point p (vrai) vu à travers la loupe l, centrée sur c (dessiné en cd). */
function aTravers(l: Loupe, c: Point2, cd: Point2, p: Point2): Point2 {
  const dx = p.x - c.x, dy = p.y - c.y
  const d = Math.hypot(dx, dy)
  if (d < 1e-15) return cd
  const k = etirer(l, Math.max(d, l.R)) / d
  return { x: cd.x + dx * k, y: cd.y + dy * k }
}

/** Point dessiné d'un point vrai p (UA), à l'instant t. */
export function projeter(p: Point2, t: number): Point2 {
  // Loupe du Soleil.
  const s = loupe('Soleil')
  if (Math.hypot(p.x, p.y) < s.zone) return aTravers(s, { x: 0, y: 0 }, { x: 0, y: 0 }, p)
  for (const planete of NOMS_PLANETES) {
    const l = loupe(planete)
    const c = positionAstre(planete, t)
    if (Math.hypot(p.x - c.x, p.y - c.y) >= l.zone) continue
    const vu = aTravers(l, c, c, p)
    // Près d'une grande lune : sa propre loupe, raccordée à celle de la planète entre une et deux zones de la lune.
    for (const lune of GRANDES_LUNES.get(planete)!) {
      const m = loupe(lune)
      const cl = positionAstre(lune, t)
      const d = Math.hypot(p.x - cl.x, p.y - cl.y)
      if (d >= 2 * m.zone) continue
      const local = aTravers(m, cl, aTravers(l, c, c, cl), p)
      const q = Math.min(1, Math.max(0, d / m.zone - 1))
      const w = 1 - q * q * (3 - 2 * q)
      return { x: local.x * w + vu.x * (1 - w), y: local.y * w + vu.y * (1 - w) }
    }
    return vu
  }
  return p
}

/** Point vrai d'un point dessiné q (pour toucher un point libre). Les loupes des lunes sont ignorées. */
export function deprojeter(q: Point2, t: number): Point2 {
  const s = loupe('Soleil')
  const inverse = (l: Loupe, c: Point2) => {
    const dx = q.x - c.x, dy = q.y - c.y
    const dd = Math.hypot(dx, dy)
    if (dd < 1e-15) return c
    const k = contracter(l, Math.max(dd, l.Rd)) / dd
    return { x: c.x + dx * k, y: c.y + dy * k }
  }
  if (Math.hypot(q.x, q.y) < s.zoneDessinee) return inverse(s, { x: 0, y: 0 })
  for (const planete of NOMS_PLANETES) {
    const l = loupe(planete)
    const c = positionAstre(planete, t)
    if (Math.hypot(q.x - c.x, q.y - c.y) < l.zoneDessinee) return inverse(l, c)
  }
  return q
}

/** Zone dessinée d'une planète (UA de carte) : pour cadrer son système. */
export function zoneDessinee(planete: NomPlanete): number {
  return loupe(planete).zoneDessinee
}
