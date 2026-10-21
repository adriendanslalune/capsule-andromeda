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
import { corps } from '../moteur/corps'
import { H, L, PLANISPHERES, type Contexte } from './planispheres'
import { planisphereLune } from './planispheres-lunes'

/** L'encre de la carte (la même que celle des astres illustrés). */
const ENCRE = '#2b2138'
/** On voit l'astre un peu d'au-dessus (latitude du centre de la vue), pour deviner le pôle Nord. */
const LATITUDE_VUE = 20
const RAD = Math.PI / 180
const OMBRE = [0x54, 0x43, 0x7a]
const ENCRE_RVB = [0x2b, 0x21, 0x38]

/** Le planisphère d'un astre qui tourne (les planètes et Pluton, toutes les lunes), ou null. */
function planispherePour(nom: string): ((c: Contexte) => void) | null {
  return PLANISPHERES[nom] ?? (corps(nom)?.type === 'lune' ? planisphereLune(nom) : null)
}

/** Un astre tourne-t-il (a-t-il son planisphère) ? */
export const tourne = (nom: string) => !!PLANISPHERES[nom] || corps(nom)?.type === 'lune'

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
    planispherePour(nom)!(c)
    p = c.getImageData(0, 0, L, H).data
  }
  // Au plus une douzaine de planisphères gardés (2 Mo chacun) ; la Terre reste.
  for (const k of planispheres.keys()) { if (planispheres.size < 12) break; if (!k.startsWith('Terre|')) planispheres.delete(k) }
  planispheres.set(cle, p)
  return p
}

/**
 * Le planisphère d'un astre est-il prêt ? Sinon, on le prépare quand le téléphone n'a rien à faire, un à la fois (en
 * zoomant sur Saturne, sept lunes apparaissent d'un coup : les dessiner toutes à la fois ferait un à-coup) ; en
 * attendant, la carte dessine le simple disque.
 */
const aPreparer: string[] = []
let preparationEnCours = false
function planispherePret(nom: string, gris: boolean): boolean {
  if (planispheres.has(`${nom}|${gris}`)) return true
  const cle = `${nom}|${gris}`
  if (!aPreparer.includes(cle)) aPreparer.push(cle)
  if (!preparationEnCours) {
    preparationEnCours = true
    const suivant = () => {
      const k = aPreparer.shift()
      if (!k) { preparationEnCours = false; return }
      const [n, g] = k.split('|')
      planisphere(n, g === 'true')
      if ('requestIdleCallback' in window) requestIdleCallback(suivant, { timeout: 500 })
      else setTimeout(suivant, 50)
    }
    if ('requestIdleCallback' in window) requestIdleCallback(suivant, { timeout: 500 })
    else setTimeout(suivant, 50)
  }
  return false
}

/** La géométrie d'un globe de D pixels de côté : pour chaque pixel du disque, sa place sur le planisphère et sa lumière. */
interface Geometrie { D: number; u: Float32Array; ligne: Int32Array; lumiere: Float32Array; profondeur: Float32Array }
const geometries = new Map<string, Geometrie>()

function geometrie(D: number, declinaison: number, cote: 1 | -1): Geometrie {
  const cle = `${D}|${declinaison}|${cote}`
  const deja = geometries.get(cle)
  if (deja) return deja
  const R = D / 2, phi0 = LATITUDE_VUE * RAD, d = declinaison * RAD
  // Le Soleil, vu d'ici : à 90° du centre de la vue (à l'est, côté 1 ; à l'ouest, côté −1), à la latitude de sa déclinaison.
  const sx = cote * Math.cos(d), sy = Math.cos(phi0) * Math.sin(d), sz = Math.sin(phi0) * Math.sin(d)
  const u = new Float32Array(D * D).fill(-1), ligne = new Int32Array(D * D), lumiere = new Float32Array(D * D), profondeur = new Float32Array(D * D)
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
      profondeur[k] = zv
    }
  }
  const g = { D, u, ligne, lumiere, profondeur }
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
  const p = planisphere(nom, gris), g = geometrie(D, declinaison, cote), lumineux = nom === 'Soleil'
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
    if (lumineux) {
      // Le Soleil n'a pas de nuit : son bord s'assombrit et rougit (l'assombrissement centre-bord).
      const f = Math.sqrt(g.profondeur[k])
      r *= 0.88 + 0.12 * f; v *= 0.62 + 0.38 * f; b *= 0.45 + 0.55 * f
    } else if (lum < 0.08) {
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

/**
 * Les anneaux, vus de dessus comme toute la carte (demande d'Adrien du 21/10/2026 : tout autour de la planète, à leurs
 * vraies distances et tailles), en rayons de la planète : des bandes (début, fin, couleur, opacité) et des anneaux
 * fins (rayon, épaisseur du trait).
 */
const ANNEAUX: Readonly<Record<string, { bandes: [number, number, string, number][]; fins: [number, number][] }>> = {
  // Saturne (rayon 60 268 km) : D, C (sombre, translucide), B (le plus brillant), la division de Cassini, A (avec la
  // division d'Encke), et le fin anneau F.
  Saturne: {
    bandes: [[1.11, 1.235, '#d8c9a8', 0.25], [1.239, 1.527, '#d9c7a0', 0.55], [1.527, 1.951, '#e8d3a2', 0.95], [2.027, 2.269, '#efdfb8', 0.85]],
    fins: [[1.527, 0.6], [1.951, 0.8], [2.027, 0.8], [2.214, 0.6], [2.269, 0.8], [2.326, 0.7]],
  },
  // Uranus (rayon 25 559 km) : treize anneaux sombres et étroits ; ε, le plus large, à 51 149 km ; les deux anneaux
  // de poussière ν et μ, très pâles, loin dehors.
  Uranus: {
    bandes: [[2.59, 2.73, '#a9c9d8', 0.18], [3.37, 4.0, '#a9c9d8', 0.12]],
    fins: [[1.637, 0.5], [1.652, 0.5], [1.666, 0.5], [1.75, 0.6], [1.787, 0.6], [1.846, 0.6], [1.864, 0.5], [1.89, 0.6], [2.001, 1.4]],
  },
}

/** Les anneaux (et l'ombre de la planète sur eux, du côté opposé au Soleil, en local : cote du Soleil sur l'axe x). */
function dessinerAnneaux(ctx: CanvasRenderingContext2D, nom: string, r: number, cote: 1 | -1): void {
  const a = ANNEAUX[nom]
  if (!a) return
  ctx.save()
  for (const [r0, r1, couleur, opacite] of a.bandes) {
    ctx.beginPath()
    ctx.arc(0, 0, r1 * r, 0, 2 * Math.PI)
    ctx.arc(0, 0, r0 * r, 0, 2 * Math.PI, true)
    ctx.globalAlpha = opacite
    ctx.fillStyle = couleur
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = ENCRE
  for (const [rr, largeur] of a.fins) {
    ctx.beginPath()
    ctx.arc(0, 0, rr * r, 0, 2 * Math.PI)
    ctx.lineWidth = Math.max(0.5, Math.min(2, largeur * epaisseurContour(r)))
    ctx.stroke()
  }
  // L'ombre de la planète sur les anneaux, à l'opposé du Soleil (seulement sur la matière des anneaux, pas dans le vide).
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = '#54437a'
  for (const [r0, r1, , opacite] of a.bandes) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, r1 * r, 0, 2 * Math.PI)
    ctx.arc(0, 0, r0 * r, 0, 2 * Math.PI, true)
    ctx.clip()
    ctx.globalAlpha = 0.5 * opacite
    ctx.fillRect(cote === 1 ? -r1 * r : 0, -r, r1 * r, 2 * r)
    ctx.restore()
  }
  ctx.restore()
}

/**
 * Dessine l'astre qui tourne, centré en (x, y), de rayon r (pixels). versSoleil : direction du Soleil à l'écran.
 * D : la taille du dessin (un palier, pour ne pas le refaire à chaque zoom). gris : pas encore visité. Renvoie faux si
 * son planisphère n'est pas encore prêt (rien n'est dessiné : la carte dessine le simple disque en attendant).
 */
export function dessinerGlobe(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number, versSoleil: number,
  t: number, D: number, gris: boolean): boolean {
  if (!planispherePret(nom, gris)) return false
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
  // Les anneaux, tout autour (vus de dessus), sous le globe ; la couronne du Soleil.
  dessinerAnneaux(ctx, nom, r, cote)
  if (nom === 'Soleil') couronne(ctx, r, s.lon)
  ctx.drawImage(toile, -r, -r, 2 * r, 2 * r)
  // Le contour : un trait fin, comme le reste (demande d'Adrien du 21/10/2026).
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  ctx.lineWidth = epaisseurContour(r)
  ctx.strokeStyle = ENCRE
  ctx.stroke()
  if (nom === 'Soleil') protuberances(ctx, r, s.lon)
  ctx.restore()
  return true
}

/** La couronne du Soleil : une lueur dorée, et de fins rayons ondulés à l'encre, comme sur une gravure. */
function couronne(ctx: CanvasRenderingContext2D, r: number, rotation: number): void {
  const g = ctx.createRadialGradient(0, 0, r, 0, 0, 1.9 * r)
  g.addColorStop(0, 'rgba(247, 201, 85, 0.55)')
  g.addColorStop(1, 'rgba(247, 201, 85, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, 1.9 * r, 0, 2 * Math.PI)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201, 122, 42, 0.55)'
  ctx.lineWidth = epaisseurContour(r) * 0.8
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * 2 * Math.PI + rotation * RAD * 0.1, l = r * (1.25 + 0.35 * ((k * 7) % 5) / 4)
    ctx.beginPath()
    for (let i = 0; i <= 10; i++) {
      const d = r * 1.06 + ((l - r * 1.06) * i) / 10, o = Math.sin(i * 1.3 + k) * r * 0.015
      const px = Math.cos(a) * d - Math.sin(a) * o, py = Math.sin(a) * d + Math.cos(a) * o
      if (i) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
    }
    ctx.stroke()
  }
}

/** Les protubérances : des boucles de plasma au bord du Soleil, qui tournent avec lui. */
function protuberances(ctx: CanvasRenderingContext2D, r: number, rotation: number): void {
  ctx.lineJoin = 'round'
  for (const [base, taille] of [[0.4, 0.22], [1.7, 0.15], [2.6, 0.28], [3.9, 0.12], [5.1, 0.2]]) {
    const a = base + rotation * RAD
    const a0 = a - 0.09, a1 = a + 0.09, h = r * (1 + taille)
    ctx.beginPath()
    ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
    ctx.bezierCurveTo(Math.cos(a0) * h, Math.sin(a0) * h, Math.cos(a1) * h, Math.sin(a1) * h, Math.cos(a1) * r, Math.sin(a1) * r)
    ctx.lineWidth = Math.max(1.5, r * 0.04)
    ctx.strokeStyle = '#e8673c'
    ctx.stroke()
    ctx.lineWidth = epaisseurContour(r) * 0.7
    ctx.strokeStyle = ENCRE
    ctx.stroke()
  }
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
