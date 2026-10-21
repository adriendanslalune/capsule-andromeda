// Les astres qui tournent (demandes d'Adrien du 21/10/2026 : la Terre, puis toutes les planètes) : leur planisphère
// (planispheres.ts), dessiné une fois, est enroulé sur le globe (projection orthographique). On regarde l'astre de
// côté, un peu d'au-dessus, le Soleil sur son bord : la longitude du centre suit son point subsolaire
// (moteur/rotation.ts), la face éclairée est donc la vraie, en temps réel ; le dessin est tourné pour que le Soleil
// soit dans sa direction sur la carte, le Nord à peu près en haut. Les anneaux (Saturne, Uranus) passent derrière et
// devant la boule.
// Pour ne pas faire ramer le téléphone : la géométrie (où tombe chaque pixel sur le planisphère, sa lumière) est
// calculée une fois par taille (et préparée quand le téléphone ne fait rien) ; ensuite on ne fait que décaler le
// planisphère, au demi-degré.

import { orientation } from '../moteur/rotation'
import { H, L, PLANISPHERES } from './planispheres'

/** L'encre de la carte (la même que celle des astres illustrés). */
const ENCRE = '#2b2138'
/** On voit l'astre un peu d'au-dessus (latitude du centre de la vue), pour deviner le pôle Nord. */
const LATITUDE_VUE = 20
const RAD = Math.PI / 180
const OMBRE = [0x54, 0x43, 0x7a]
const ENCRE_RVB = [0x2b, 0x21, 0x38]

/** Un astre tourne-t-il (a-t-il son planisphère) ? */
export const tourne = (nom: string) => !!PLANISPHERES[nom]

/** Les planisphères déjà dessinés (en couleurs, et en gris pour un astre pas encore visité). */
const planispheres = new Map<string, Uint8ClampedArray>()
function planisphere(nom: string, gris: boolean): Uint8ClampedArray {
  const cle = `${nom}|${gris}`
  let p = planispheres.get(cle)
  if (p) return p
  if (gris) {
    p = new Uint8ClampedArray(planisphere(nom, false))
    for (let i = 0; i < p.length; i += 4) { const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]; p[i] = p[i + 1] = p[i + 2] = l }
  } else {
    const toile = document.createElement('canvas')
    toile.width = L
    toile.height = H
    const c = toile.getContext('2d')!
    PLANISPHERES[nom](c)
    p = c.getImageData(0, 0, L, H).data
  }
  planispheres.set(cle, p)
  return p
}

/** La géométrie d'un globe de D pixels de côté : pour chaque pixel du disque, sa place sur le planisphère et sa lumière. */
interface Geometrie { D: number; u: Float32Array; ligne: Int32Array; lumiere: Float32Array }
const geometries = new Map<string, Geometrie>()

function geometrie(D: number, declinaison: number, cote: 1 | -1): Geometrie {
  const cle = `${D}|${declinaison}|${cote}`
  const deja = geometries.get(cle)
  if (deja) return deja
  const R = D / 2, phi0 = LATITUDE_VUE * RAD, d = declinaison * RAD
  // Le Soleil, vu d'ici : à 90° du centre de la vue (à l'est, côté 1 ; à l'ouest, côté −1), à la latitude de sa déclinaison.
  const sx = cote * Math.cos(d), sy = Math.cos(phi0) * Math.sin(d), sz = Math.sin(phi0) * Math.sin(d)
  const u = new Float32Array(D * D).fill(-1), ligne = new Int32Array(D * D), lumiere = new Float32Array(D * D)
  for (let j = 0; j < D; j++) {
    const yv = -(j + 0.5 - R) / R
    for (let i = 0; i < D; i++) {
      const xv = (i + 0.5 - R) / R, r2 = xv * xv + yv * yv
      if (r2 > 1) continue
      const zv = Math.sqrt(1 - r2)
      const lat = Math.asin(zv * Math.sin(phi0) + yv * Math.cos(phi0))
      const dlon = Math.atan2(xv, zv * Math.cos(phi0) - yv * Math.sin(phi0))
      const k = j * D + i
      u[k] = ((dlon / RAD + 180) / 360) * L
      ligne[k] = Math.min(H - 1, Math.floor(((90 - lat / RAD) / 180) * H)) * L
      lumiere[k] = xv * sx + yv * sy + zv * sz
    }
  }
  const g = { D, u, ligne, lumiere }
  geometries.set(cle, g)
  // Au plus 2,5 millions de pixels de géométrie (environ 30 Mo) : au-delà, on oublie les plus anciennes.
  let pixels = 0
  for (const x of geometries.values()) pixels += x.D * x.D
  for (const [k, x] of geometries) {
    if (pixels <= 2_500_000 || k === cle) break
    pixels -= x.D * x.D
    geometries.delete(k)
  }
  return g
}

/** Les globes déjà peints (clé : astre, taille, centre de la vue au demi-degré). */
const peints = new Map<string, HTMLCanvasElement>()

/** Peint le globe de D pixels, vu depuis la longitude lon0 : le planisphère décalé, la nuit et ses hachures. */
function peindre(nom: string, gris: boolean, D: number, lon0: number, declinaison: number, cote: 1 | -1): HTMLCanvasElement {
  const p = planisphere(nom, gris), g = geometrie(D, declinaison, cote)
  const toile = document.createElement('canvas')
  toile.width = toile.height = D
  const c = toile.getContext('2d')!
  const image = c.createImageData(D, D), px = image.data
  const decalage = (lon0 / 360) * L
  const pas = Math.max(4, D / 70) // l'écart des hachures du terminateur
  for (let k = 0; k < D * D; k++) {
    const u0 = g.u[k]
    if (u0 < 0) continue
    let u = Math.floor(u0 + decalage) % L
    if (u < 0) u += L
    const s = (g.ligne[k] + u) * 4, o = k * 4
    let r = p[s], v = p[s + 1], b = p[s + 2]
    const lum = g.lumiere[k]
    if (lum < 0.08) {
      // Hachures le long du terminateur, puis la nuit en aplat violet (comme « multiplier » à 55 %).
      const i = k % D, j = (k - i) / D
      if (lum > -0.32 && (i - j + 10_000 * pas) % pas < 1.1) { r = ENCRE_RVB[0]; v = ENCRE_RVB[1]; b = ENCRE_RVB[2] } else if (lum < 0) {
        r = r * (0.45 + 0.55 * OMBRE[0] / 255); v = v * (0.45 + 0.55 * OMBRE[1] / 255); b = b * (0.45 + 0.55 * OMBRE[2] / 255)
      }
    }
    px[o] = r; px[o + 1] = v; px[o + 2] = b; px[o + 3] = 255
  }
  c.putImageData(image, 0, 0)
  return toile
}

/** Les anneaux d'un astre : la moitié arrière (dessinée avant le globe) et la moitié avant (après), en coordonnées locales. */
export interface Anneaux { arriere?: (ctx: CanvasRenderingContext2D, r: number) => void; avant?: (ctx: CanvasRenderingContext2D, r: number) => void }

/**
 * Dessine l'astre qui tourne, centré en (x, y), de rayon r (pixels). versSoleil : direction du Soleil à l'écran.
 * D : la taille du dessin (un palier, pour ne pas le refaire à chaque zoom). gris : pas encore visité.
 */
export function dessinerGlobe(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number, versSoleil: number,
  t: number, D: number, gris: boolean, anneaux: Anneaux = {}): void {
  const s = orientation(nom, t)!
  // Le Nord toujours à peu près en haut : le Soleil à droite de l'écran, on regarde l'astre avec le Soleil sur son
  // bord droit (le centre de la vue 90° à l'ouest du point subsolaire) ; à gauche, sur son bord gauche.
  const cote: 1 | -1 = Math.cos(versSoleil) >= 0 ? 1 : -1
  const lon0 = Math.round((s.lon - 90 * cote) * 2) / 2, declinaison = Math.round(s.lat * 2) / 2
  const cle = `${nom}|${gris}|${D}|${lon0}|${declinaison}|${cote}`
  let toile = peints.get(cle)
  if (!toile) {
    toile = peindre(nom, gris, D, lon0, declinaison, cote)
    for (const k of [...peints.keys()]) if (k.startsWith(`${nom}|${gris}|${D}|`)) peints.delete(k)
    if (peints.size >= 6) peints.delete(peints.keys().next().value!)
    peints.set(cle, toile)
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(cote === 1 ? versSoleil : versSoleil - Math.PI)
  // Les anneaux sont dans le plan de l'équateur : ils tournent avec le globe.
  anneaux.arriere?.(ctx, r)
  ctx.drawImage(toile, -r, -r, 2 * r, 2 * r)
  // Le contour : un trait fin, comme le reste (demande d'Adrien du 21/10/2026).
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  ctx.lineWidth = epaisseurContour(r)
  ctx.strokeStyle = ENCRE
  ctx.stroke()
  anneaux.avant?.(ctx, r)
  ctx.restore()
}

/** L'épaisseur du contour d'un astre : un trait fin (demande d'Adrien du 21/10/2026 : plus de gros contour noir). */
export function epaisseurContour(r: number): number {
  return Math.max(0.8, Math.min(1.8, r * 0.008))
}

/** Prépare, quand le téléphone n'a rien à faire, la géométrie d'une autre taille (le zoom y passera sans à-coup). */
const enAttente = new Set<string>()
export function preparerGlobe(nom: string, D: number, t: number): void {
  const s = orientation(nom, t)
  if (!s || D < 16) return
  const declinaison = Math.round(s.lat * 2) / 2
  for (const cote of [1, -1] as const) {
    const cle = `${D}|${declinaison}|${cote}`
    if (geometries.has(cle) || enAttente.has(cle)) continue
    enAttente.add(cle)
    const faire = () => { enAttente.delete(cle); geometrie(D, declinaison, cote) }
    if ('requestIdleCallback' in window) requestIdleCallback(faire, { timeout: 2000 })
    else setTimeout(faire, 300)
  }
}

// Le planisphère de la Terre se dessine dès que le téléphone n'a rien à faire (plutôt qu'au premier gros plan).
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) requestIdleCallback(() => planisphere('Terre', false), { timeout: 5000 })
