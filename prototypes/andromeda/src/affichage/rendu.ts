// Le dessin de la carte (Canvas 2D) : vue du dessus, dans le plan de l'écliptique. Fond blanc, astres en ronds
// noirs à leur taille réelle ; un astre plus petit qu'un point devient un point. Les étoiles du fond sont plus
// petites (un pixel) et plus claires, pour ne pas les confondre avec les planètes.
// Repères à tester, chacun désactivable (voir Reglages) : orbites, symbole du Soleil, tailles minimales par
// catégorie, noms, flèches au bord de l'écran vers le Soleil et la Terre.
// Le rendu ne calcule aucune position : il les demande au moteur, et seulement pour ce qui est visible.

import { CORPS, PREMIER_NIVEAU, RAYON_SYSTEME, enfants, position, type Corps } from '../moteur/corps'
import { traceOrbite } from '../moteur/orbite'
import { MS_PAR_JOUR } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'
import { type Camera, projecteur } from './camera'

/** Rayon d'un point (pixels CSS) : astres trop petits pour être vus à leur taille. */
export const RAYON_POINT = 1.3
/** Côté d'une étoile du fond (pixels CSS). */
const TAILLE_ETOILE = 1

export interface Palette { fond: string; encre: string; etoiles: string; orbites: string }
export const JOUR: Palette = { fond: '#ffffff', encre: '#000000', etoiles: '#a0a0a0', orbites: 'rgba(0,0,0,0.22)' }

export interface Reglages {
  etoiles: boolean
  orbites: boolean
  soleil: boolean
  tailles: boolean
  noms: boolean
  fleches: boolean
}

export const REGLAGES_DEPART: Reglages = { etoiles: true, orbites: true, soleil: true, tailles: true, noms: true, fleches: true }

const POLICE = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'

/** Étoiles du fond : semées une fois pour toutes, fixes à l'écran (positions de 0 à 1). */
const ETOILES: { x: number; y: number }[] = (() => {
  let graine = 20261016
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  return Array.from({ length: 160 }, () => ({ x: hasard(), y: hasard() }))
})()

const AVEC_ENFANTS = new Set(CORPS.filter((c) => c.parent).map((c) => c.parent!))
const GEANTES = new Set(['Jupiter', 'Saturne', 'Uranus', 'Neptune'])
/** Lunes assez grandes pour qu'on dessine leur orbite et qu'on les nomme en priorité. */
const grandeLune = (c: Corps) => c.nom === 'Lune' || (c.type === 'lune' && c.rayon >= 100)

/** Rayon minimal à l'écran selon la catégorie (repère « tailles »). */
function rayonMinimal(c: Corps, r: Reglages): number {
  if (!r.tailles) return RAYON_POINT
  if (c.type === 'etoile') return 4
  if (GEANTES.has(c.nom)) return 3.5
  if (c.type === 'planete') return 2.6
  if (c.type === 'naine' || grandeLune(c)) return 1.9
  return RAYON_POINT
}

// Tracés d'orbite gardés en mémoire (recalculés si le temps a beaucoup avancé, quand on accélère le temps).
const ORBITES = new Map<string, { t: number; points: Vecteur3[] | null }>()
const POINTS_ORBITE = 256
function orbite(nom: string, t: number): Vecteur3[] | null {
  const o = ORBITES.get(nom)
  if (o && Math.abs(t - o.t) < 30 * MS_PAR_JOUR) return o.points
  const points = traceOrbite(nom, t, POINTS_ORBITE)
  ORBITES.set(nom, { t, points })
  return points
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

export interface Statistiques { calcules: number; dessines: number }

export function dessiner(ctx: CanvasRenderingContext2D, camera: Camera, t: number, palette: Palette,
  reglages: Reglages): Statistiques {
  const { largeur, hauteur, echelle } = camera
  // Positions de l'image en cours (chaque astre n'est calculé qu'une fois).
  const cache = new Map<string, Vecteur3>()
  const pos = (nom: string) => {
    let p = cache.get(nom)
    if (!p) { p = position(nom, t); cache.set(nom, p) }
    return p
  }
  const proj = projecteur(camera, pos)
  const marge = 40
  const visible = (sx: number, sy: number, r: number) =>
    sx + r >= 0 && sx - r <= largeur && sy + r >= 0 && sy - r <= hauteur

  ctx.fillStyle = palette.fond
  ctx.fillRect(0, 0, largeur, hauteur)

  if (reglages.etoiles) {
    ctx.fillStyle = palette.etoiles
    ctx.beginPath()
    for (const e of ETOILES) ctx.rect(Math.round(e.x * largeur), Math.round(e.y * hauteur), TAILLE_ETOILE, TAILLE_ETOILE)
    ctx.fill()
  }

  // Quels astres dessiner : le premier niveau, puis les systèmes (lunes, satellites) seulement s'ils sont visibles
  // et assez grands à l'écran pour se distinguer de leur planète.
  const aDessiner: Corps[] = [...PREMIER_NIVEAU]
  const systemesOuverts: { nom: string; rayonPx: number }[] = []
  for (const nom of AVEC_ENFANTS) {
    const rayonPx = (RAYON_SYSTEME.get(nom) ?? 0) / echelle
    if (rayonPx < RAYON_POINT) continue
    const { sx, sy } = proj(pos(nom))
    if (!visible(sx, sy, rayonPx)) continue
    systemesOuverts.push({ nom, rayonPx })
    aDessiner.push(...enfants(nom))
  }

  // Orbites : un trait fin, seulement si le tracé est assez grand pour se voir et assez fin pour suivre l'astre
  // (une orbite en 256 segments s'écarte de la vraie courbe de R·(1 − cos(π/256)) : on la cache avant que ça se voie).
  if (reglages.orbites) {
    ctx.strokeStyle = palette.orbites
    ctx.lineWidth = 1
    ctx.beginPath()
    const fleche = 1 - Math.cos(Math.PI / POINTS_ORBITE)
    const tracer = (points: Vecteur3[], origine: Vecteur3 | null, rayonKm: number) => {
      const rayonPx = rayonKm / echelle
      if (rayonPx < 4 || rayonKm * fleche / echelle > 1.5) return
      let precedent: { sx: number; sy: number } | null = null
      for (const p of points) {
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
      const points = orbite(c.nom, t)
      if (points) tracer(points, null, Math.hypot(pos(c.nom).x, pos(c.nom).y))
    }
    for (const { nom } of systemesOuverts) {
      for (const c of enfants(nom)) {
        if (!grandeLune(c)) continue
        const points = orbite(c.nom, t)
        if (!points) continue
        const p = pos(c.nom), o = pos(nom)
        tracer(points, o, Math.hypot(p.x - o.x, p.y - o.y))
      }
    }
    ctx.stroke()
  }

  // Les astres, en un seul aplat noir.
  let dessines = 0
  const diagonale = Math.hypot(largeur, hauteur)
  const ecrans = new Map<string, { sx: number; sy: number; r: number }>()
  ctx.fillStyle = palette.encre
  ctx.beginPath()
  for (const c of aDessiner) {
    const { sx, sy } = proj(pos(c.nom))
    const r = Math.max(rayonMinimal(c, reglages), c.rayon / echelle)
    ecrans.set(c.nom, { sx, sy, r })
    if (!visible(sx, sy, r)) continue
    // Astre bien plus grand que l'écran et qui le couvre entièrement : un aplat suffit.
    if (Math.hypot(sx - largeur / 2, sy - hauteur / 2) + diagonale < r) ctx.rect(0, 0, largeur, hauteur)
    else { ctx.moveTo(sx + r, sy); ctx.arc(sx, sy, r, 0, 2 * Math.PI) }
    dessines++
  }
  ctx.fill('nonzero')

  // Le Soleil en symbole (rayons autour du disque) tant qu'il est petit à l'écran.
  const soleil = ecrans.get('Soleil')!
  if (reglages.soleil && soleil.r < 30 && visible(soleil.sx, soleil.sy, soleil.r + 10)) {
    ctx.strokeStyle = palette.encre
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6
      const r0 = soleil.r + 2.5, r1 = soleil.r + (k % 2 ? 5 : 8)
      ctx.moveTo(soleil.sx + r0 * Math.cos(a), soleil.sy + r0 * Math.sin(a))
      ctx.lineTo(soleil.sx + r1 * Math.cos(a), soleil.sy + r1 * Math.sin(a))
    }
    ctx.stroke()
  }

  if (reglages.noms) dessinerNoms(ctx, camera, palette, aDessiner, ecrans, systemesOuverts)
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
  ecrans: Map<string, { sx: number; sy: number; r: number }>, systemes: { nom: string; rayonPx: number }[]): void {
  const ouverts = new Map(systemes.map((s) => [s.nom, s.rayonPx]))
  const occupes: { x0: number; y0: number; x1: number; y1: number }[] = []
  ctx.font = POLICE
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 3
  ctx.strokeStyle = palette.fond
  ctx.fillStyle = palette.encre
  // Les noms des astres déjà dessinés occupent leur place : un astre réserve aussi son disque.
  for (const c of [...astres].sort((a, b) => priorite(a) - priorite(b))) {
    // Lunes et satellites : seulement quand leur système est bien ouvert à l'écran.
    if (c.parent && (ouverts.get(c.parent) ?? 0) < 25) continue
    if (c.type === 'lune' && !grandeLune(c) && (ouverts.get(c.parent!) ?? 0) < 400) continue
    const e = ecrans.get(c.nom)!
    const largeurTexte = ctx.measureText(c.nom).width
    // Le Soleil en symbole porte des rayons : on décale son nom d'autant.
    const x = e.sx + Math.min(e.r, 60) + (c.type === 'etoile' && e.r < 30 ? 12 : 5), y = e.sy
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
  ctx.strokeStyle = palette.fond
  ctx.strokeText(nom, tx, ty)
  ctx.fillText(nom, tx, ty)
  ctx.textAlign = 'left'
}
