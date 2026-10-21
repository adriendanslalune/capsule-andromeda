// La Terre qui tourne (demande d'Adrien du 21/10/2026) : un planisphère dessiné une fois, en aplats Moebius (vrais
// contours des continents, donnees/terres.ts), enroulé sur le globe (projection orthographique). On regarde la Terre
// de côté, le Soleil à droite : la longitude du centre suit le point subsolaire (moteur/rotation.ts), la face éclairée
// est donc la vraie, en temps réel. Le dessin est ensuite tourné pour que le Soleil soit dans sa direction sur la carte.
// Pour ne pas faire ramer le téléphone : la géométrie (où tombe chaque pixel sur le planisphère, sa lumière) est
// calculée une fois par taille ; ensuite on ne fait que décaler le planisphère, toutes les demi-degrés (2 minutes).

import { TERRES } from '../donnees/terres'
import { pointSubsolaire } from '../moteur/rotation'
/** L'encre de la carte (la même que celle des astres illustrés). */
const ENCRE = '#2b2138'

/** Le planisphère : 1024 × 512 (un texel pour 0,35°). */
const L = 1024, H = 512
/** On voit la Terre un peu d'au-dessus (latitude du centre de la vue), pour deviner le pôle Nord. */
const LATITUDE_VUE = 20
const RAD = Math.PI / 180
const OMBRE = [0x54, 0x43, 0x7a]
const ENCRE_RVB = [0x2b, 0x21, 0x38]

let planisphere: Uint8ClampedArray | null = null

/** Dessine le planisphère (une fois) : océan et sa houle, continents, déserts, forêts, glaces, nuages, traits d'encre. */
function dessinerPlanisphere(): Uint8ClampedArray {
  const toile = document.createElement('canvas')
  toile.width = L
  toile.height = H
  const c = toile.getContext('2d')!
  const x = (lon: number) => ((lon + 180) / 360) * L, y = (lat: number) => ((90 - lat) / 180) * H
  c.fillStyle = '#8db6dc'
  c.fillRect(0, 0, L, H)
  // La houle : de fines ondulations.
  c.strokeStyle = '#6f9cc8'
  c.lineWidth = 1
  for (let k = 0; k < 40; k++) {
    const y0 = 8 + k * 12.6
    c.beginPath()
    for (let u = 0; u <= L; u += 8) { const v = y0 + 1.6 * Math.sin(u / 23 + k); if (u) c.lineTo(u, v); else c.moveTo(u, v) }
    c.stroke()
  }
  // Les terres. Un contour qui passe l'antiméridien (la Russie, les Fidji) : ses longitudes sont recollées, et il est
  // dessiné de part et d'autre du bord du planisphère.
  const anneaux = TERRES.map((anneau) => {
    const lons: number[] = [], lats: number[] = []
    for (let k = 0; k < anneau.length; k += 2) {
      let lo = anneau[k]
      if (lons.length) { const prec = lons[lons.length - 1]; while (lo - prec > 1800) lo -= 3600; while (prec - lo > 1800) lo += 3600 }
      lons.push(lo)
      lats.push(anneau[k + 1])
    }
    return { lons, lats, deborde: lons.some((lo) => lo < -1800 || lo > 1800) }
  })
  const terres = new Path2D(), cotes = new Path2D()
  for (const { lons, lats, deborde } of anneaux) {
    for (const decalage of deborde ? [-3600, 0, 3600] : [0]) {
      lons.forEach((lo, k) => { const px = x((lo + decalage) / 10), py = y(lats[k] / 10); if (k) terres.lineTo(px, py); else terres.moveTo(px, py) })
      terres.closePath()
      // Les côtes, sans le bord du pôle Sud (une coupure des données, pas une côte).
      for (let k = 0; k < lons.length; k++) {
        const k2 = (k + 1) % lons.length
        if (lats[k] <= -840 && lats[k2] <= -840) continue
        if (Math.abs(lons[k2] - lons[k]) > 1800) continue
        cotes.moveTo(x((lons[k] + decalage) / 10), y(lats[k] / 10))
        cotes.lineTo(x((lons[k2] + decalage) / 10), y(lats[k2] / 10))
      }
    }
  }
  c.fillStyle = '#a8c98a'
  c.fill(terres)
  // Déserts, grandes forêts et glaces : des aplats, gardés à l'intérieur des terres.
  c.save()
  c.clip(terres)
  const zone = (couleur: string, lon0: number, lon1: number, lat0: number, lat1: number) => {
    c.fillStyle = couleur
    c.beginPath()
    c.ellipse(x((lon0 + lon1) / 2), y((lat0 + lat1) / 2), (x(lon1) - x(lon0)) / 2, (y(lat0) - y(lat1)) / 2, 0, 0, 2 * Math.PI)
    c.fill()
  }
  for (const d of [[-16, 34, 15, 31], [36, 58, 14, 31], [118, 142, -31, -19], [88, 116, 37, 47], [-118, -104, 27, 38], [-72, -66, -28, -18]]) zone('#e3cd8e', d[0], d[1], d[2], d[3])
  for (const f of [[-76, -50, -13, 4], [10, 30, -6, 5], [96, 120, -6, 6]]) zone('#7fae6c', f[0], f[1], f[2], f[3])
  c.fillStyle = '#f7f4ee'
  c.fillRect(0, y(-62), L, H) // l'Antarctique
  zone('#f7f4ee', -60, -20, 59, 84) // le Groenland
  c.fillRect(0, 0, L, y(76))
  c.restore()
  // La banquise arctique, et le pôle Sud.
  c.fillStyle = '#f7f4ee'
  c.fillRect(0, 0, L, y(82))
  c.fillRect(0, y(-84), L, H)
  // Les côtes, à l'encre.
  c.strokeStyle = ENCRE
  c.lineWidth = 1.3
  c.lineCap = 'round'
  c.stroke(cotes)
  // Quelques nuages : des écharpes blanches cernées de gris.
  let a = 12345
  const hasard = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff }
  for (let k = 0; k < 26; k++) {
    const cx = hasard() * L, cy = y(-55 + hasard() * 115), l = 30 + hasard() * 60
    c.beginPath()
    c.moveTo(cx, cy)
    c.quadraticCurveTo(cx + l / 2, cy - 6, cx + l, cy + 1)
    c.lineCap = 'round'
    c.lineWidth = 4.5
    c.strokeStyle = '#f7f4ee'
    c.stroke()
    c.lineWidth = 1
    c.strokeStyle = '#9aa7b8'
    c.stroke()
  }
  return c.getImageData(0, 0, L, H).data
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
  if (geometries.size >= 6) geometries.delete(geometries.keys().next().value!)
  const g = { D, u, ligne, lumiere }
  geometries.set(cle, g)
  return g
}

/** Les globes déjà peints (clé : taille, centre de la vue au demi-degré). */
const peints = new Map<string, HTMLCanvasElement>()

/** Peint le globe de D pixels, vu depuis la longitude lon0 : le planisphère décalé, la nuit et ses hachures. */
function peindre(D: number, lon0: number, declinaison: number, cote: 1 | -1): HTMLCanvasElement {
  planisphere ??= dessinerPlanisphere()
  const p = planisphere, g = geometrie(D, declinaison, cote)
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

/**
 * Dessine la Terre qui tourne, centrée en (x, y), de rayon r (pixels). versSoleil : direction du Soleil à l'écran.
 * D : la taille du dessin (un palier, pour ne pas le refaire à chaque zoom).
 */
export function dessinerTerreQuiTourne(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, versSoleil: number, t: number, D: number): void {
  const s = pointSubsolaire(t)
  // Le Nord toujours à peu près en haut : le Soleil à droite de l'écran, on regarde la Terre avec le Soleil sur son
  // bord droit (le centre de la vue 90° à l'ouest du point subsolaire) ; à gauche, sur son bord gauche.
  const cote: 1 | -1 = Math.cos(versSoleil) >= 0 ? 1 : -1
  const lon0 = Math.round((s.lon - 90 * cote) * 2) / 2, declinaison = Math.round(s.lat * 2) / 2
  const cle = `${D}|${lon0}|${declinaison}|${cote}`
  let toile = peints.get(cle)
  if (!toile) {
    toile = peindre(D, lon0, declinaison, cote)
    for (const k of [...peints.keys()]) if (k.startsWith(`${D}|`)) peints.delete(k)
    if (peints.size >= 3) peints.delete(peints.keys().next().value!)
    peints.set(cle, toile)
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(cote === 1 ? versSoleil : versSoleil - Math.PI)
  ctx.drawImage(toile, -r, -r, 2 * r, 2 * r)
  ctx.restore()
  // Le contour d'encre.
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.lineWidth = Math.max(0.8, r * 0.035)
  ctx.strokeStyle = ENCRE
  ctx.stroke()
}

/** Prépare, quand le téléphone n'a rien à faire, la géométrie d'une autre taille (le zoom y passera sans à-coup). */
const enAttente = new Set<string>()
export function preparerGlobe(D: number, t: number): void {
  const declinaison = Math.round(pointSubsolaire(t).lat * 2) / 2
  if (D < 16) return
  for (const cote of [1, -1] as const) {
    const cle = `${D}|${declinaison}|${cote}`
    if (geometries.has(cle) || enAttente.has(cle)) continue
    enAttente.add(cle)
    const faire = () => { enAttente.delete(cle); geometrie(D, declinaison, cote) }
    if ('requestIdleCallback' in window) requestIdleCallback(faire, { timeout: 2000 })
    else setTimeout(faire, 300)
  }
}

// Le planisphère se dessine dès que le téléphone n'a rien à faire (plutôt qu'au premier gros plan sur la Terre).
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) requestIdleCallback(() => { planisphere ??= dessinerPlanisphere() }, { timeout: 5000 })
