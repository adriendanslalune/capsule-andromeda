// Projection de la carte : carte à plat, vue du dessus, à l'échelle réelle (décision d'Adrien du 21/10/2026, qui
// remplace les astres grossis 50 fois et les « loupes » qui étiraient les distances autour des planètes) : les astres à
// leur vraie taille, toutes les distances vraies ; la carte dessine une pastille quand un astre devient trop petit.
// Autour de chaque astre, sa zone (sa sphère d'influence) : les orbites y sont couchées dans le plan de la carte (à
// leur vraie vitesse et à leur vraie distance), pour qu'un satellite qui passe au-dessus d'un pôle ne saute pas d'un
// bord à l'autre. Ce n'est que du dessin : le moteur garde les vraies positions.

import { corps, enfants, position, rayonInfluence } from '../moteur/corps'
import { gmAstre, positionDuPoint, type Plan } from '../moteur/mission'
import { UA_KM } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'

/** Zone du Soleil (km) : Mercure (0,31 UA au plus près) est hors de la zone. */
const ZONE_SOLEIL = 0.25 * UA_KM
/** Zone d'une grande lune, en rayons. */
const ZONE_LUNE = 20
/** Lunes qui ont leur propre zone (les autres sont trop petites pour qu'on s'en approche à l'écran). */
const RAYON_GRANDE_LUNE = 200
/** Astres qui ont un système (une zone à leur taille : leur sphère d'influence). */
export const CENTRES = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'] as const

export interface Point2 { x: number; y: number }

/** Rayon dessiné d'un astre (km de carte) : sa vraie taille. */
export function rayonDessine(nom: string): number {
  return corps(nom)?.rayon ?? 0
}

/** La zone d'un astre : son rayon et la distance jusqu'où ses orbites sont couchées dans le plan (km). */
interface Loupe { R: number; zone: number }

const LOUPES = new Map<string, Loupe>()
function loupe(nom: string): Loupe {
  let l = LOUPES.get(nom)
  if (!l) {
    const R = corps(nom)?.rayon ?? 0
    if (nom === 'Soleil') l = { R, zone: ZONE_SOLEIL }
    else if ((CENTRES as readonly string[]).includes(nom)) l = { R, zone: rayonInfluence(nom) }
    else l = { R, zone: R * ZONE_LUNE }
    LOUPES.set(nom, l)
  }
  return l
}

/** Grandes lunes de chaque astre (celles qui ont leur zone). */
const GRANDES_LUNES = new Map<string, string[]>(CENTRES.map((c) => [c,
  enfants(c).filter((e) => e.type === 'lune' && e.rayon >= RAYON_GRANDE_LUNE).map((e) => e.nom)]))

/** Zone d'un astre (km de carte) : pour cadrer son système. */
export function zoneDessinee(nom: string): number {
  return loupe(nom).zone
}

/**
 * Rabat le vecteur r1 dans le plan de la carte, par la rotation (autour de la ligne des nœuds) qui y amène le plan du
 * mouvement (r1, puis r2 un peu plus tard). Un mouvement rétrograde est rabattu « par en dessous », pour garder son sens.
 * Renvoie une direction unitaire dans le plan.
 */
function rabattre(r1: Vecteur3, r2: Vecteur3): Point2 {
  return coucher(r1, { x: r1.y * r2.z - r1.z * r2.y, y: r1.z * r2.x - r1.x * r2.z, z: r1.x * r2.y - r1.y * r2.x })
}

/** Rabat r1 dans le plan de la carte, connaissant la normale n0 au plan de son mouvement (dans le sens du mouvement). */
function coucher(r1: Vecteur3, n0: Vecteur3): Point2 {
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
  const r = Math.max(d, l.R)
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
  if (c && (c.type === 'planete' || c.type === 'naine' || c.type === 'comete')) { const p = position(nom, t); return { x: p.x, y: p.y } }
  return projeter({ p: position(nom, t), t, suivant: { p: position(nom, t + 60_000), t: t + 60_000 } })
}

/**
 * Poussière de satellites autour d'un astre (moteur/poussiere.ts) : positions relatives à l'astre et normales à leurs
 * orbites, trois nombres par satellite. Écrit dans sortie les points dessinés (km de carte), deux nombres par satellite.
 * Seulement la loupe de l'astre (pas celle de ses lunes) : la poussière reste près de la Terre.
 */
export function projeterPoussiere(nom: string, t: number, nombre: number, positions: Float64Array, normales: Float64Array,
  sortie: Float64Array): void {
  const l = loupe(nom)
  const c = position(nom, t)
  for (let k = 0; k < nombre; k++) {
    const r = { x: positions[3 * k], y: positions[3 * k + 1], z: positions[3 * k + 2] }
    const u = coucher(r, { x: normales[3 * k], y: normales[3 * k + 1], z: normales[3 * k + 2] })
    const d = Math.max(Math.hypot(r.x, r.y, r.z), l.R)
    sortie[2 * k] = c.x + u.x * d
    sortie[2 * k + 1] = c.y + u.y * d
  }
}

/** Rayon d'un astre que le trait du trajet ne doit pas couper (km de carte) : le disque dessiné, les rayons du Soleil. */
function obstacle(nom: string): number {
  return nom === 'Soleil' ? 2.9 * rayonDessine('Soleil') : 1.15 * rayonDessine(nom)
}

/** Distance entre le point c et le segment [a, b] (dans le plan de la carte). */
function distanceAuSegment(a: Point2, b: Point2, c: Point2): number {
  const dx = b.x - a.x, dy = b.y - a.y
  const l2 = dx * dx + dy * dy
  const k = l2 > 0 ? Math.min(1, Math.max(0, ((c.x - a.x) * dx + (c.y - a.y) * dy) / l2)) : 0
  return Math.hypot(a.x + k * dx - c.x, a.y + k * dy - c.y)
}

/**
 * Le plus court chemin de a à b autour du disque (centre c, rayon r) qui coupe le trait [a, b] : la tangente de a au
 * cercle, un arc (pas de 5° au plus), la tangente vers b (demande d'Adrien du 19/10/2026 : on contourne l'astre
 * jusqu'à ce qu'il ne gêne plus, puis tout droit). Renvoie les points intermédiaires (sans a ni b).
 */
function contournement(a: Point2, b: Point2, c: Point2, r: number): Point2[] {
  const ra = Math.hypot(a.x - c.x, a.y - c.y), rb = Math.hypot(b.x - c.x, b.y - c.y)
  const R = Math.min(1.06 * r, ra, rb)
  const ta = Math.atan2(a.y - c.y, a.x - c.x), tb = Math.atan2(b.y - c.y, b.x - c.x)
  let d = Math.atan2(Math.sin(tb - ta), Math.cos(tb - ta))
  const sens = d < 0 ? -1 : 1
  d = Math.abs(d)
  const t1 = Math.acos(Math.min(1, R / ra)), t2 = d - Math.acos(Math.min(1, R / rb))
  if (t2 <= t1) return []
  const n = Math.max(1, Math.ceil((t2 - t1) / (Math.PI / 36)))
  return Array.from({ length: n + 1 }, (_, j) => {
    const th = ta + sens * (t1 + ((t2 - t1) * j) / n)
    return { x: c.x + R * Math.cos(th), y: c.y + R * Math.sin(th) }
  })
}

/** Chemin de a à b qui contourne, dans l'ordre où le trait les rencontre, les disques qui le gênent (sans a ni b). */
function cheminLibre(a: Point2, b: Point2, disques: { c: Point2; r: number }[], profondeur = 0): Point2[] {
  // Un bout du trait tout près du disque (la capsule en orbite basse) : on contourne à sa hauteur, sans traverser l'astre.
  const genants = disques.map((d) => ({ ...d, r: Math.min(d.r, 0.98 * Math.hypot(a.x - d.c.x, a.y - d.c.y), 0.98 * Math.hypot(b.x - d.c.x, b.y - d.c.y)) }))
    .filter((d) => distanceAuSegment(a, b, d.c) < d.r)
  if (!genants.length || profondeur > 4) return []
  // Le premier disque rencontré en partant de a.
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1
  genants.sort((p, q) => ((p.c.x - a.x) * dx + (p.c.y - a.y) * dy) / l2 - ((q.c.x - a.x) * dx + (q.c.y - a.y) * dy) / l2)
  const d = genants[0]
  const tour = contournement(a, b, d.c, d.r)
  if (!tour.length) return []
  const sortie = tour[tour.length - 1]
  return [...tour, ...cheminLibre(sortie, b, disques.filter((x) => x.c !== d.c), profondeur + 1)]
}

/**
 * Adoucit un tracé (coins arrondis, algorithme de Chaikin) en gardant ses deux bouts : le trajet dessiné est une
 * courbe, pas une suite de traits droits (demande d'Adrien du 19/10/2026).
 */
function adoucir(q: Point2[], passes = 3): Point2[] {
  let l = q
  for (let k = 0; k < passes && l.length > 2; k++) {
    const r: Point2[] = [l[0]]
    for (let i = 0; i < l.length - 1; i++) {
      const p0 = l[i], p1 = l[i + 1]
      if (i > 0) r.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y })
      if (i < l.length - 2) r.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y })
    }
    r.push(l[l.length - 1])
    l = r
  }
  return l
}

/**
 * Le trajet dessiné (km de carte), vu à travers la loupe : du départ (la capsule telle qu'elle est dessinée) à
 * l'arrivée (la destination telle qu'elle sera dessinée à l'arrivée : une planète, là où elle sera ; une lune, un
 * satellite, autour de son astre, tel qu'il est maintenant). Tout droit, sauf pour contourner par le plus court les
 * disques dessinés des astres qui gênent (départ, arrivée, Soleil) ; les coins sont arrondis. depart : là où la
 * capsule est dessinée, si elle part en plein vol (un nouveau cap) ; le tracé part alors de là.
 */
export function projeterTrajet(p: Plan, t: number, depart?: Point2): Point2[] {
  const n = p.cles.length
  const minute = 60_000
  const deplacement = (nom: string, u: number) => {
    const a = position(nom, u), b = position(nom, u + minute)
    return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
  }
  const plus = (a: Vecteur3, b: Vecteur3) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
  const cles = p.cles.map((c, i): Point2 => {
    const ici = positionDuPoint(c, t)
    if (i === 0) {
      // La capsule au départ : son mouvement est couché dans le plan, comme sur son orbite. Partie en plein vol (sa
      // vitesse n'est pas celle d'une orbite circulaire), on la voit simplement d'en haut.
      const v = p.vitesseDepart, r = Math.hypot(c.rel.x, c.rel.y, c.rel.z)
      const orbitale = c.ancre !== 'Soleil' && r > 0 && Math.abs(Math.hypot(v.x, v.y, v.z) / Math.sqrt(gmAstre(c.ancre) / r) - 1) < 0.3
      if (!orbitale) return projeter({ p: ici, t })
      return projeter({ p: ici, t, suivant: { p: plus(positionDuPoint(c, t + minute), { x: v.x * 60, y: v.y * 60, z: v.z * 60 }), t: t + minute } })
    }
    if (i === n - 1) {
      if (c.ancre === 'Soleil') return projeter({ p: ici, t: p.arrivee, suivant: { p: plus(ici, deplacement(p.cible, p.arrivee)), t: p.arrivee + minute } })
      // Autour de son astre : dans le plan de son mouvement à l'arrivée.
      const d = deplacement(p.cible, p.arrivee), dA = deplacement(c.ancre, p.arrivee)
      return projeter({ p: ici, t, suivant: { p: plus(positionDuPoint(c, t + minute), { x: d.x - dA.x, y: d.y - dA.y, z: d.z - dA.z }), t: t + minute } })
    }
    return projeter({ p: ici, t })
  })
  // Les points de sortie et d'entrée des systèmes (utiles au moteur) ne servent pas au dessin : on va droit du départ à
  // l'arrivée, en contournant ce qui gêne.
  const a = depart ?? cles[0], b = cles[n - 1]
  const disques = [...new Set([p.cles[0].ancre, p.cles[n - 1].ancre, 'Soleil'])]
    .map((nom) => ({ c: nom === 'Soleil' ? { x: 0, y: 0 } : projeterCorps(nom, t), r: obstacle(nom) }))
  return adoucir([a, ...cheminLibre(a, b, disques), b])
}

/** Longueur d'un tracé (dans le plan de la carte). */
function longueurTrace(q: Point2[]): number {
  let l = 0
  for (let k = 1; k < q.length; k++) l += Math.hypot(q[k].x - q[k - 1].x, q[k].y - q[k - 1].y)
  return l
}

/**
 * Coupe un tracé à la part f (0 à 1) de sa longueur : renvoie le point atteint et ce qui reste à parcourir (à partir
 * de ce point). La capsule avance ainsi à vitesse régulière sur la carte.
 */
export function couperTrace(q: Point2[], f: number): { point: Point2; reste: Point2[] } {
  let reste = f * longueurTrace(q)
  for (let k = 1; k < q.length; k++) {
    const l = Math.hypot(q[k].x - q[k - 1].x, q[k].y - q[k - 1].y)
    if (reste <= l && l > 0) {
      const point = { x: q[k - 1].x + ((q[k].x - q[k - 1].x) * reste) / l, y: q[k - 1].y + ((q[k].y - q[k - 1].y) * reste) / l }
      return { point, reste: [point, ...q.slice(k)] }
    }
    reste -= l
  }
  const fin = q[q.length - 1]
  return { point: fin, reste: [fin] }
}
