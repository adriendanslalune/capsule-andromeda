// Les animations de la présentation du monde (demandes d'Adrien du 23/10/2026 : montrer les distances et les tailles,
// les engins à leur vraie place, les comètes), dessinées par-dessus la carte : des repères à l'encre, des étiquettes
// de papier, des Terres alignées, l'onde de la lumière qui part du Soleil. Tout est placé d'après les vraies positions
// (le moteur, via projeterCorps) ; seule la lumière est montrée en accéléré, et le texte le dit.

import type { Carte2D } from './carte'
import { projeterCorps } from './loupe'
import { position } from '../moteur/corps'
import { C_KM_S } from '../moteur/navigation'

export type ScenePresentation = 'systeme' | 'distances' | 'tailles' | 'engins' | 'confins' | 'mouvement' | 'lumiere' | 'toi'

const ENCRE = '#1f1b18', ORANGE = '#e0571f', TERRE = '#8fbcd4', PAPIER = '#fffbf2'
const RAYON_TERRE = 6371, UA = 149_597_870.7

const distance = (a: string, b: string, t: number) => { const p = position(a, t), q = position(b, t); return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) }
const nombre = (x: number, chiffres = 3) => x.toLocaleString('fr-FR', { maximumSignificantDigits: chiffres })

/** « 8 min 20 s », « 22 h 40 ». */
function duree(s: number): string {
  if (s < 60) return `${Math.round(s)} s`
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`
  return `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')}`
}

/** Les étiquettes déjà posées dans l'image (elles ne se chevauchent pas), et le bas de l'écran pris par la case de BD. */
let posees: { x: number; y: number; l: number; h: number }[] = []
let basLibre = Infinity

/** Une étiquette de papier, la pointe vers (x, y), du côté préféré s'il est libre, sinon d'un autre. */
function etiquette(ctx: CanvasRenderingContext2D, x: number, y: number, titre: string, detail: string, alpha: number, cote: 1 | -1 = 1, haut = -1): void {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.font = 'bold 12px "IBM Plex Mono", monospace'
  const l1 = ctx.measureText(titre).width
  ctx.font = '11px "IBM Plex Mono", monospace'
  const l2 = detail ? ctx.measureText(detail).width : 0
  const l = Math.max(l1, l2) + 14, h = detail ? 36 : 22
  const boite = (c: number, hh: number) => ({ x: Math.max(6, Math.min(ctx.canvas.clientWidth - l - 6, c > 0 ? x + 14 : x - 14 - l)), y: hh < 0 ? y - h - 12 : y + 12, l, h })
  const libre = (b: { x: number; y: number; l: number; h: number }) => b.y > 4 && b.y + b.h < basLibre
    && posees.every((o) => b.x + b.l < o.x || o.x + o.l < b.x || b.y + b.h < o.y || o.y + o.h < b.y)
  const bases = [boite(cote, haut), boite(-cote, haut), boite(cote, -haut), boite(-cote, -haut)]
  // Si les quatre places sont prises, on glisse l'étiquette vers le haut ou vers le bas (son trait la suit).
  const essais = [...bases, ...[1, -1, 2, -2, 3, -3].flatMap((d) => bases.map((b) => ({ ...b, y: b.y + d * (h + 6) })))]
  const choisie = essais.find(libre) ?? essais[0]
  posees.push(choisie)
  const bx = choisie.x, by = choisie.y
  cote = (choisie.x + l / 2 > x ? 1 : -1)
  haut = choisie.y < y ? -1 : 1
  ctx.strokeStyle = ENCRE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(cote > 0 ? bx : bx + l, haut < 0 ? by + h : by)
  ctx.stroke()
  ctx.fillStyle = PAPIER
  ctx.fillRect(bx, by, l, h)
  ctx.lineWidth = 1.5
  ctx.strokeRect(bx + 0.5, by + 0.5, l - 1, h - 1)
  ctx.fillStyle = ENCRE
  ctx.textBaseline = 'top'
  ctx.font = 'bold 12px "IBM Plex Mono", monospace'
  ctx.fillText(titre, bx + 7, by + 5)
  if (detail) { ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillText(detail, bx + 7, by + 20) }
  ctx.restore()
}

/** Un cercle de repère orange qui bat. */
function repere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, maintenant: number): void {
  ctx.save()
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 2
  ctx.setLineDash([5, 4])
  ctx.lineDashOffset = -maintenant / 60
  ctx.beginPath()
  ctx.arc(x, y, Math.max(1, r + 2 * Math.sin(maintenant / 250)), 0, 2 * Math.PI)
  ctx.stroke()
  ctx.restore()
}

/** Une Terre à l'échelle (un disque bleu cerné d'encre). */
function petiteTerre(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = TERRE
  ctx.strokeStyle = ENCRE
  ctx.lineWidth = Math.min(1.2, Math.max(0.5, r / 4))
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0.8, r), 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

const ecran = (carte: Carte2D, nom: string, t: number) => carte.ecranDe(projeterCorps(nom, t))
/** De 0 à 1 entre deux instants de la scène (ms). */
const entre = (age: number, a: number, b: number) => Math.min(1, Math.max(0, (age - a) / (b - a)))

/** Dessine la scène de la présentation, `age` ms après son début. */
export function dessinerScene(ctx: CanvasRenderingContext2D, carte: Carte2D, scene: ScenePresentation, age: number, t: number, maintenant: number): void {
  const k = carte.kmParPx
  posees = []
  basLibre = carte.hauteur - 250
  if (scene === 'systeme') {
    // Les planètes se nomment une à une, du Soleil vers les Confins.
    // (Les planètes intérieures, serrées autour du Soleil à cette échelle, sous le nom de la Terre.)
    const planetes = ['Terre', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton']
    planetes.forEach((nom, i) => {
      const p = ecran(carte, nom, t)
      etiquette(ctx, p.x, p.y, nom === 'Terre' ? 'La Terre' : nom, nom === 'Terre' ? 'à 1 UA du Soleil' : `${nombre(distance(nom, 'Soleil', t) / UA, 2)} UA du Soleil`,
        entre(age, 400 + 450 * i, 700 + 450 * i), p.x < carte.largeur / 2 ? -1 : 1)
    })
  } else if (scene === 'distances') {
    // La ligne Terre–Lune se trace, puis trente Terres s'y alignent, côte à côte.
    const a = ecran(carte, 'Terre', t), b = ecran(carte, 'Lune', t)
    const d = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / d, uy = (b.y - a.y) / d
    const trace = entre(age, 300, 1300)
    ctx.save()
    ctx.strokeStyle = ENCRE
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(a.x + ux * d * trace, a.y + uy * d * trace)
    ctx.stroke()
    ctx.restore()
    const km = distance('Terre', 'Lune', t), n = Math.floor(km / (2 * RAYON_TERRE)), r = RAYON_TERRE / k
    for (let i = 0; i < n; i++) {
      const v = entre(age, 1400 + 70 * i, 1500 + 70 * i)
      if (v <= 0) break
      const f = ((2 * i + 1) * RAYON_TERRE) / km
      petiteTerre(ctx, a.x + ux * d * f, a.y + uy * d * f, r, v)
    }
    etiquette(ctx, a.x, a.y, 'Terre', '', entre(age, 0, 300), ux > 0 ? -1 : 1, 1)
    etiquette(ctx, b.x, b.y, 'Lune', `${nombre(km, 4)} km`, entre(age, 1200, 1500), ux > 0 ? 1 : -1)
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    etiquette(ctx, m.x, m.y + 6, `${n} Terres`, 'côte à côte entre elles', entre(age, 1500 + 70 * n, 1800 + 70 * n), 1, 1)
  } else if (scene === 'tailles') {
    // Onze Terres en travers de Jupiter, puis une Terre à côté, à la même échelle.
    const j = ecran(carte, 'Jupiter', t), R = 69_911 / k, r = RAYON_TERRE / k
    const n = Math.round(69_911 / RAYON_TERRE)
    for (let i = 0; i < n; i++) {
      const v = entre(age, 500 + 120 * i, 620 + 120 * i)
      if (v <= 0) break
      petiteTerre(ctx, j.x - R + r * (2 * i + 1), j.y, r, v)
    }
    const fin = 500 + 120 * n
    etiquette(ctx, j.x, j.y + r, `${n} Terres`, 'd\'un bord à l\'autre', entre(age, fin, fin + 300), -1, 1)
    const g = { x: Math.min(carte.largeur - 20, j.x + R + 4 * r + 10), y: j.y }
    petiteTerre(ctx, g.x, g.y, r, entre(age, fin + 400, fin + 700))
    etiquette(ctx, g.x, g.y - r, 'La Terre', 'à la même échelle', entre(age, fin + 600, fin + 900), -1)
  } else if (scene === 'engins') {
    // Les engins à leur vraie place : l'ISS et Hubble au ras de la Terre, James Webb à 1,5 million de km.
    const terre = ecran(carte, 'Terre', t), webb = ecran(carte, 'James Webb', t), lune = ecran(carte, 'Lune', t)
    ctx.save()
    ctx.strokeStyle = ENCRE
    ctx.globalAlpha = 0.6
    ctx.setLineDash([2, 4])
    const v = entre(age, 1200, 2200)
    ctx.beginPath()
    ctx.moveTo(terre.x, terre.y)
    ctx.lineTo(terre.x + (webb.x - terre.x) * v, terre.y + (webb.y - terre.y) * v)
    ctx.stroke()
    ctx.restore()
    if (age > 300) repere(ctx, terre.x, terre.y, 12, maintenant)
    etiquette(ctx, terre.x, terre.y, 'ISS et Hubble', 'à 400 et 540 km de la Terre', entre(age, 300, 700), webb.x > terre.x ? -1 : 1, 1)
    etiquette(ctx, lune.x, lune.y, 'Lune', `${nombre(distance('Terre', 'Lune', t), 3)} km`, entre(age, 700, 1100), lune.x > terre.x ? 1 : -1)
    if (age > 2200) repere(ctx, webb.x, webb.y, 12, maintenant)
    etiquette(ctx, webb.x, webb.y, 'James Webb', `${nombre(distance('Terre', 'James Webb', t) / 1e6, 2)} million de km`, entre(age, 2200, 2600), webb.x > terre.x ? 1 : -1)
  } else if (scene === 'confins') {
    // Jusqu'aux Confins : Pluton, la comète de Halley, les deux Voyager, l'objet humain le plus lointain.
    const objets: [string, string, number][] = [
      ['Neptune', `${nombre(distance('Neptune', 'Soleil', t) / UA, 2)} UA`, 300],
      ['Pluton', `${nombre(distance('Pluton', 'Soleil', t) / UA, 2)} UA`, 700],
      ['Comète de Halley', 'de retour en 2061', 1200],
      ['Voyager 2', `${nombre(distance('Voyager 2', 'Soleil', t) / UA, 3)} UA`, 1800],
      ['Voyager 1', `${nombre(distance('Voyager 1', 'Soleil', t) / UA, 3)} UA · ${duree(distance('Voyager 1', 'Terre', t) / C_KM_S)} de lumière`, 2400],
    ]
    for (const [nom, detail, debut] of objets) {
      const p = ecran(carte, nom, t)
      if (age > debut && nom.startsWith('Voyager')) repere(ctx, p.x, p.y, 10, maintenant)
      etiquette(ctx, p.x, p.y, nom, detail, entre(age, debut, debut + 400), p.x < carte.largeur / 2 ? 1 : -1, p.y < carte.hauteur * 0.35 ? 1 : -1)
    }
  } else if (scene === 'mouvement') {
    const iss = ecran(carte, 'ISS', t)
    if (age > 500) repere(ctx, iss.x, iss.y, 10, maintenant)
    etiquette(ctx, iss.x, iss.y, 'ISS', 'un tour de Terre en 92 min', entre(age, 500, 900), iss.x < carte.largeur / 2 ? 1 : -1)
  } else if (scene === 'lumiere') {
    // L'onde de la lumière part du Soleil (en accéléré : la Terre en 3 s au lieu de 8 min 20 s) ; chaque planète
    // touchée dit le vrai temps qu'il a fallu.
    const s = ecran(carte, 'Soleil', t), vitesse = distance('Terre', 'Soleil', t) / 3000
    // L'onde repart toutes les 7 secondes.
    const rayon = Math.max(0, ((age % 7000) * vitesse) / k)
    ctx.save()
    ctx.strokeStyle = '#e8a73a'
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(s.x, s.y, rayon, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.35
    for (const f of [0.85, 0.7]) { ctx.beginPath(); ctx.arc(s.x, s.y, rayon * f, 0, 2 * Math.PI); ctx.stroke() }
    ctx.restore()
    for (const nom of ['Mercure', 'Vénus', 'Terre', 'Mars']) {
      const km = distance(nom, 'Soleil', t), p = ecran(carte, nom, t)
      etiquette(ctx, p.x, p.y, nom, `${duree(km / C_KM_S)} de lumière`, entre(age, km / vitesse, km / vitesse + 300), p.x < s.x ? -1 : 1, p.y < s.y ? -1 : 1)
    }
  } else if (scene === 'toi') {
    const c = carte.place('Andromeda')
    if (c && age > 400) repere(ctx, c.x, c.y, 16, maintenant)
  }
}
