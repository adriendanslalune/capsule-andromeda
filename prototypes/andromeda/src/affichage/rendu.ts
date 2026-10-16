// Le dessin de la carte (Canvas 2D) : vue du dessus, dans le plan de l'écliptique. Le fond blanc cassé est fait en CSS,
// derrière la toile ; ici, on ne dessine que l'encre.
// Les astres sont à leur taille réelle ; trop petits, ils deviennent des points ; assez grands, les engins prennent
// leur silhouette et les petites lunes une forme de caillou.
// Repères à tester, chacun désactivable (voir Reglages) : orbites, symbole du Soleil, noms, flèches vers le Soleil et
// la Terre, étoiles du fond.
// Le rendu ne calcule aucune position : il les demande au moteur, et seulement pour ce qui est visible. Seule
// exception, assumée : la triche d'affichage des satellites artificiels (triche.ts).

import { CORPS, PREMIER_NIVEAU, RAYON_SYSTEME, corps, enfants, position, positionRelative, type Corps } from '../moteur/corps'
import { traceOrbite } from '../moteur/orbite'
import { MS_PAR_JOUR } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'
import { type Camera, projecteur } from './camera'
import { dessinerCaillou, dessinerSilhouette, graineDe } from './formes'
import { positionAffichee, rabattement, type Rabattement } from './triche'

/** Rayon d'un point (pixels CSS) : astres trop petits pour être vus à leur taille. */
export const RAYON_POINT = 1.3
/** Côté d'une étoile du fond (pixels CSS). */
const TAILLE_ETOILE = 1
/** Taille à partir de laquelle un engin prend sa silhouette (pixels). */
const TAILLE_SILHOUETTE = 9
/** Rayon à partir duquel une petite lune prend sa forme de caillou (pixels). */
const RAYON_CAILLOU = 3
/** Les lunes plus petites que ça (km de rayon) sont des cailloux ; les plus grosses, des boules. */
const RAYON_MAX_CAILLOU = 190
/** Rayon supposé des petites lunes dont on ne connaît pas la taille (km). */
const RAYON_INCONNU = 1.5

export interface Palette { encre: string; papier: string; etoiles: string; orbites: string }
export const JOUR: Palette = {
  encre: '#1f1b18', papier: '#f4f1ea', etoiles: 'rgba(31,27,24,0.4)', orbites: 'rgba(31,27,24,0.25)',
}

export interface Reglages {
  etoiles: boolean
  orbites: boolean
  soleil: boolean
  noms: boolean
  fleches: boolean
}

export const REGLAGES_DEPART: Reglages = { etoiles: true, orbites: true, soleil: true, noms: true, fleches: true }

const POLICE = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'

/** Étoiles du fond : semées une fois pour toutes, fixes à l'écran (positions de 0 à 1). */
const ETOILES: { x: number; y: number }[] = (() => {
  let graine = 20261016
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  return Array.from({ length: 160 }, () => ({ x: hasard(), y: hasard() }))
})()

const AVEC_ENFANTS = new Set(CORPS.filter((c) => c.parent).map((c) => c.parent!))
/** Lunes assez grandes pour qu'on dessine leur orbite et qu'on les nomme en priorité. */
const grandeLune = (c: Corps) => c.nom === 'Lune' || (c.type === 'lune' && c.rayon >= 100)
const estCaillou = (c: Corps) => c.type === 'lune' && c.rayon < RAYON_MAX_CAILLOU
const rayonReel = (c: Corps) => (estCaillou(c) && c.rayon === 0 ? RAYON_INCONNU : c.rayon)

// Tracés d'orbite gardés en mémoire, recalculés quand le temps a avancé (plus souvent pour les satellites
// artificiels, dont l'orbite tourne vite).
const ORBITES = new Map<string, { t: number; points: Vecteur3[] | null }>()
const POINTS_ORBITE = 256
function orbite(c: Corps, t: number): Vecteur3[] | null {
  const o = ORBITES.get(c.nom)
  const validite = c.type === 'satellite' ? 600_000 : 30 * MS_PAR_JOUR
  if (o && Math.abs(t - o.t) < validite) return o.points
  const points = traceOrbite(c.nom, t, c.type === 'satellite' ? 96 : POINTS_ORBITE)
  ORBITES.set(c.nom, { t, points })
  return points
}

// Rabattement des orbites des satellites artificiels (voir triche.ts), recalculé toutes les 10 secondes.
const RABATTEMENTS = new Map<string, { t: number; r: Rabattement }>()
function rabattementDe(nom: string, t: number): Rabattement {
  const m = RABATTEMENTS.get(nom)
  if (m && Math.abs(t - m.t) < 10_000) return m.r
  const r = rabattement(positionRelative(nom, t), positionRelative(nom, t + 10_000))
  RABATTEMENTS.set(nom, { t, r })
  return r
}

/**
 * Découpe le segment (a, b) au rectangle [x0, x1] × [y0, y1] (méthode de Liang-Barsky), en nombres JavaScript
 * (double précision) : on n'envoie jamais au Canvas des coordonnées gigantesques, qu'il arrondirait.
 */
function decouper(ax: number, ay: number, bx: number, by: number, x0: number, y0: number, x1: number, y1: number):
  [number, number, number, number] | null {
  let t0 = 0, t1 = 1
  const dx = bx - ax, dy = by - ay
  for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
    if (p === 0) { if (q < 0) return null; continue }
    const r = q / p
    if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r } else { if (r < t0) return null; if (r < t1) t1 = r }
  }
  return [ax + t0 * dx, ay + t0 * dy, ax + t1 * dx, ay + t1 * dy]
}

/**
 * Ajoute un disque au chemin. Un disque immense (une planète vue de tout près) n'est pas confié tel quel au Canvas :
 * on ne trace que le morceau de son bord qui passe près de l'écran, avec des coordonnées raisonnables.
 */
function ajouterDisque(ctx: CanvasRenderingContext2D, sx: number, sy: number, r: number, largeur: number,
  hauteur: number): void {
  if (r < 20_000) { ctx.moveTo(sx + r, sy); ctx.arc(sx, sy, r, 0, 2 * Math.PI); return }
  const cx = largeur / 2, cy = hauteur / 2
  const diagonale = Math.hypot(largeur, hauteur)
  const d = Math.hypot(cx - sx, cy - sy)
  if (d + diagonale < r) { ctx.rect(0, 0, largeur, hauteur); return }
  const a0 = Math.atan2(cy - sy, cx - sx)
  const demi = (2 * diagonale) / r
  const n = 48
  const ux = (sx - cx) / d, uy = (sy - cy) / d // vers le centre du disque
  for (let k = 0; k <= n; k++) {
    const a = a0 - demi + (2 * demi * k) / n
    const x = sx + r * Math.cos(a), y = sy + r * Math.sin(a)
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  // On referme le morceau du côté de l'intérieur du disque, au-delà de l'écran.
  const fin = { x: sx + r * Math.cos(a0 + demi), y: sy + r * Math.sin(a0 + demi) }
  const debut = { x: sx + r * Math.cos(a0 - demi), y: sy + r * Math.sin(a0 - demi) }
  ctx.lineTo(fin.x + ux * 3 * diagonale, fin.y + uy * 3 * diagonale)
  ctx.lineTo(debut.x + ux * 3 * diagonale, debut.y + uy * 3 * diagonale)
  ctx.closePath()
}

export interface Statistiques { calcules: number; dessines: number }

export function dessiner(ctx: CanvasRenderingContext2D, camera: Camera, t: number, palette: Palette,
  reglages: Reglages): Statistiques {
  const { largeur, hauteur, echelle } = camera
  // Positions de l'image en cours (chaque astre n'est calculé qu'une fois). Les satellites artificiels sont placés à
  // leur position affichée (triche).
  const cache = new Map<string, Vecteur3>()
  const pos = (nom: string): Vecteur3 => {
    let p = cache.get(nom)
    if (p) return p
    const c = corps(nom)
    if (c?.type === 'satellite' && c.parent) {
      const o = pos(c.parent)
      const rel = positionAffichee(positionRelative(nom, t), rabattementDe(nom, t), corps(c.parent)!.rayon, echelle)
      p = { x: o.x + rel.x, y: o.y + rel.y, z: o.z + rel.z }
    } else p = position(nom, t)
    cache.set(nom, p)
    return p
  }
  const proj = projecteur(camera, pos)
  const marge = 40
  const visible = (sx: number, sy: number, r: number) =>
    sx + r >= 0 && sx - r <= largeur && sy + r >= 0 && sy - r <= hauteur

  ctx.clearRect(0, 0, largeur, hauteur)

  if (reglages.etoiles) {
    ctx.fillStyle = palette.etoiles
    ctx.beginPath()
    for (const e of ETOILES) ctx.rect(Math.round(e.x * largeur), Math.round(e.y * hauteur), TAILLE_ETOILE, TAILLE_ETOILE)
    ctx.fill()
  }

  // Quels astres dessiner : le premier niveau, puis les systèmes (lunes, satellites) seulement s'ils sont visibles
  // et assez grands à l'écran pour se distinguer de leur planète. Les satellites artificiels, dessinés au-dessus du
  // bord de la planète, apparaissent dès que la planète fait quelques pixels.
  const aDessiner: Corps[] = [...PREMIER_NIVEAU]
  const systemesOuverts: { nom: string; rayonPx: number }[] = []
  for (const nom of AVEC_ENFANTS) {
    const rayonPx = (RAYON_SYSTEME.get(nom) ?? 0) / echelle
    if (rayonPx < RAYON_POINT) continue
    const { sx, sy } = proj(pos(nom))
    if (!visible(sx, sy, rayonPx)) continue
    systemesOuverts.push({ nom, rayonPx })
    const planetePx = corps(nom)!.rayon / echelle
    aDessiner.push(...enfants(nom).filter((c) => c.type !== 'satellite' || planetePx > 1 || rayonPx > 60))
  }

  // Orbites : un trait fin, seulement si le tracé est assez grand pour se voir et assez fin pour suivre l'astre
  // (une orbite en n segments s'écarte de la vraie courbe de R·(1 − cos(π/n)) : on la cache avant que ça se voie).
  if (reglages.orbites) {
    ctx.strokeStyle = palette.orbites
    ctx.lineWidth = 1
    ctx.beginPath()
    const tracer = (points: Vecteur3[], origine: Vecteur3 | null, rayonKm: number,
      transformer?: (p: Vecteur3) => Vecteur3) => {
      const rayonPx = rayonKm / echelle
      const fleche = 1 - Math.cos(Math.PI / (points.length - 1))
      if (rayonPx < 4 || rayonPx * fleche > 1.5) return
      let precedent: { sx: number; sy: number } | null = null
      for (const brut of points) {
        const p = transformer ? transformer(brut) : brut
        const q = proj(origine ? { x: origine.x + p.x, y: origine.y + p.y } : p)
        if (precedent) {
          const s = decouper(precedent.sx, precedent.sy, q.sx, q.sy, -marge, -marge, largeur + marge, hauteur + marge)
          if (s) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]) }
        }
        precedent = q
      }
    }
    for (const c of PREMIER_NIVEAU) {
      if (c.type !== 'planete' && c.type !== 'naine') continue
      const points = orbite(c, t)
      if (points) tracer(points, null, Math.hypot(pos(c.nom).x, pos(c.nom).y))
    }
    for (const { nom } of systemesOuverts) {
      const o = pos(nom)
      for (const c of enfants(nom)) {
        if (!grandeLune(c) && c.type !== 'satellite') continue
        if (c.type === 'satellite' && !aDessiner.includes(c)) continue
        const points = orbite(c, t)
        if (!points) continue
        const p = pos(c.nom)
        const transformer = c.type === 'satellite'
          ? (q: Vecteur3) => positionAffichee(q, rabattementDe(c.nom, t), corps(nom)!.rayon, echelle)
          : undefined
        tracer(points, o, Math.hypot(p.x - o.x, p.y - o.y), transformer)
      }
    }
    ctx.stroke()
  }

  // Les astres. Points et disques en un seul aplat ; silhouettes et cailloux à part.
  let dessines = 0
  const ecrans = new Map<string, { sx: number; sy: number; r: number }>()
  const silhouettes: { c: Corps; sx: number; sy: number; taille: number }[] = []
  const cailloux: { c: Corps; sx: number; sy: number; r: number }[] = []
  ctx.fillStyle = palette.encre
  ctx.beginPath()
  for (const c of aDessiner) {
    const { sx, sy } = proj(pos(c.nom))
    const taille = c.tailleM ? c.tailleM / 1000 / echelle : 0
    const reel = rayonReel(c) / echelle
    const r = Math.max(RAYON_POINT, reel, taille / 2)
    ecrans.set(c.nom, { sx, sy, r })
    if (!visible(sx, sy, r)) continue
    dessines++
    if (taille >= TAILLE_SILHOUETTE) silhouettes.push({ c, sx, sy, taille })
    else if (estCaillou(c) && reel >= RAYON_CAILLOU) cailloux.push({ c, sx, sy, r: reel })
    else ajouterDisque(ctx, sx, sy, r, largeur, hauteur)
  }
  ctx.fill('nonzero')
  for (const { c, sx, sy, r } of cailloux) dessinerCaillou(ctx, c.nom, sx, sy, r, palette.encre, palette.papier)
  for (const { c, sx, sy, taille } of silhouettes) {
    dessinerSilhouette(ctx, c.modele ?? 'sonde', sx, sy, taille, graineDe(c.nom) * Math.PI, palette.encre, palette.papier)
  }

  // Le Soleil en symbole (rayons autour du disque) tant qu'il est petit à l'écran.
  const soleil = ecrans.get('Soleil')!
  if (reglages.soleil && soleil.r < 30 && visible(soleil.sx, soleil.sy, soleil.r + 10)) {
    const r = Math.max(soleil.r, 4)
    ctx.beginPath()
    ctx.arc(soleil.sx, soleil.sy, r, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = palette.encre
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6
      const r0 = r + 2.5, r1 = r + (k % 2 ? 5 : 8)
      ctx.moveTo(soleil.sx + r0 * Math.cos(a), soleil.sy + r0 * Math.sin(a))
      ctx.lineTo(soleil.sx + r1 * Math.cos(a), soleil.sy + r1 * Math.sin(a))
    }
    ctx.stroke()
  }

  if (reglages.noms) dessinerNoms(ctx, camera, palette, aDessiner, ecrans, systemesOuverts, reglages)
  if (reglages.fleches) {
    for (const nom of ['Soleil', 'Terre']) {
      const e = ecrans.get(nom)!
      if (!visible(e.sx, e.sy, 0)) dessinerFleche(ctx, camera, palette, nom, e.sx, e.sy)
    }
  }
  return { calcules: cache.size, dessines }
}

/** Ordre de priorité des noms : quand deux noms se chevauchent, le premier gagne. */
function priorite(c: Corps): number {
  if (c.type === 'etoile') return 0
  if (c.type === 'planete') return 1
  if (c.type === 'naine') return 2
  if (grandeLune(c)) return 3
  if (c.type === 'sonde' || c.type === 'satellite') return 4
  return 5
}

function dessinerNoms(ctx: CanvasRenderingContext2D, camera: Camera, palette: Palette, astres: Corps[],
  ecrans: Map<string, { sx: number; sy: number; r: number }>, systemes: { nom: string; rayonPx: number }[],
  reglages: Reglages): void {
  const ouverts = new Map(systemes.map((s) => [s.nom, s.rayonPx]))
  const occupes: { x0: number; y0: number; x1: number; y1: number }[] = []
  ctx.font = POLICE
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 3
  ctx.strokeStyle = palette.papier
  ctx.fillStyle = palette.encre
  for (const c of [...astres].sort((a, b) => priorite(a) - priorite(b))) {
    // Lunes : seulement quand leur système est bien ouvert à l'écran (les satellites artificiels, eux, dès qu'ils
    // sont dessinés).
    if (c.parent && c.type !== 'satellite' && (ouverts.get(c.parent) ?? 0) < 25) continue
    if (c.type === 'lune' && !grandeLune(c) && (ouverts.get(c.parent!) ?? 0) < 400) continue
    const e = ecrans.get(c.nom)!
    const largeurTexte = ctx.measureText(c.nom).width
    // Le Soleil en symbole porte des rayons : on décale son nom d'autant.
    const decalage = c.type === 'etoile' && reglages.soleil && e.r < 30 ? 12 : 5
    const x = e.sx + Math.min(e.r, 60) + decalage, y = e.sy
    // Le nom doit tenir entier dans l'écran.
    if (x < 4 || x + largeurTexte > camera.largeur - 4 || y < 40 || y > camera.hauteur - 70) continue
    const boite = { x0: x - 2, y0: y - 8, x1: x + largeurTexte + 2, y1: y + 8 }
    if (occupes.some((o) => boite.x0 < o.x1 && boite.x1 > o.x0 && boite.y0 < o.y1 && boite.y1 > o.y0)) continue
    occupes.push(boite)
    ctx.strokeText(c.nom, x, y)
    ctx.fillText(c.nom, x, y)
  }
}

/** Flèche au bord de l'écran, dans la direction d'un astre hors champ, avec son nom. */
function dessinerFleche(ctx: CanvasRenderingContext2D, camera: Camera, palette: Palette, nom: string,
  sx: number, sy: number): void {
  const { largeur, hauteur } = camera
  const cx = largeur / 2, cy = hauteur / 2
  const dx = sx - cx, dy = sy - cy
  // Bord intérieur : on évite la ligne d'infos en haut et l'échelle en bas.
  const mx = cx - 22, haut = cy - 50, bas = cy - 70
  const k = Math.min(mx / Math.abs(dx || 1e-9), (dy < 0 ? haut : bas) / Math.abs(dy || 1e-9))
  const x = cx + dx * k, y = cy + dy * k
  const a = Math.atan2(dy, dx)
  ctx.fillStyle = palette.encre
  ctx.beginPath()
  ctx.moveTo(x + 9 * Math.cos(a), y + 9 * Math.sin(a))
  ctx.lineTo(x + 7 * Math.cos(a + 2.4), y + 7 * Math.sin(a + 2.4))
  ctx.lineTo(x + 7 * Math.cos(a - 2.4), y + 7 * Math.sin(a - 2.4))
  ctx.closePath()
  ctx.fill()
  ctx.font = POLICE
  ctx.textBaseline = 'middle'
  ctx.textAlign = Math.cos(a) > 0.3 ? 'right' : Math.cos(a) < -0.3 ? 'left' : 'center'
  const tx = x - 16 * Math.cos(a), ty = y - 16 * Math.sin(a)
  ctx.lineWidth = 3
  ctx.strokeStyle = palette.papier
  ctx.strokeText(nom, tx, ty)
  ctx.fillText(nom, tx, ty)
  ctx.textAlign = 'left'
}
