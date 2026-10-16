// Textures des astres, pour les deux styles « avec relief » à comparer :
//  - réaliste : cartes de Solar System Scope (CC BY 4.0, d'après la NASA), déjà dans le dépôt du jeu
//    (assets/textures/) ; Saturne, Uranus, Neptune : bandes peintes ici ;
//  - BD : cartes en ligne claire du jeu pour la Terre et la Lune ; pour les autres, la carte réaliste est
//    simplifiée ici en quelques aplats cernés d'un trait d'encre (même esprit que la ligne claire).
// Orientation réelle des astres (pôle et méridien, Union astronomique internationale, 2015).

import * as THREE from 'three'
import jupiterUrl from '../../../../assets/textures/2k_jupiter.jpg?url'
import marsUrl from '../../../../assets/textures/2k_mars.jpg?url'
import mercureUrl from '../../../../assets/textures/2k_mercury.jpg?url'
import luneUrl from '../../../../assets/textures/2k_moon.jpg?url'
import soleilUrl from '../../../../assets/textures/2k_sun.jpg?url'
import venusUrl from '../../../../assets/textures/2k_venus_atmosphere.jpg?url'
import terreUrl from '../../../../assets/textures/earth_atmos_2048.jpg?url'
import luneLcUrl from '../../../../assets/textures/lune_lc.jpg?url'
import terreLcUrl from '../../../../assets/textures/terre_lc.jpg?url'
import { aspectLune } from './couleurs'

export type Style = 'plat' | 'bd' | 'reel' | 'moebius'

const CARTES: Record<string, string> = {
  Soleil: soleilUrl, Mercure: mercureUrl, Vénus: venusUrl, Terre: terreUrl, Mars: marsUrl, Jupiter: jupiterUrl, Lune: luneUrl,
}
const CARTES_BD: Record<string, string> = { Terre: terreLcUrl, Lune: luneLcUrl }
const BANDES: Record<string, string[]> = {
  Saturne: ['#e3cf9f', '#d6bd86', '#ccb27a', '#e8d9b0', '#c9a96e'],
  Uranus: ['#a8d8dc', '#b2dde0', '#9ccfd4', '#aedadd'],
  Neptune: ['#3f63c4', '#4a6fcc', '#3557b4', '#5a7fd6', '#4466c0'],
}

/** Pôle (ascension droite, déclinaison, °) et méridien (W0 en °, vitesse en °/jour), UAI 2015. */
const ORIENTATIONS: Record<string, readonly [number, number, number, number]> = {
  Soleil: [286.13, 63.87, 84.176, 14.1844],
  Mercure: [281.0103, 61.4155, 329.5988, 6.1385108],
  Vénus: [272.76, 67.16, 160.2, -1.4813688],
  Terre: [0, 90, 190.147, 360.9856235],
  Mars: [317.269, 54.432, 176.049, 350.891983],
  Jupiter: [268.057, 64.495, 284.95, 870.536],
  Saturne: [40.589, 83.537, 38.9, 810.7939024],
  Uranus: [257.311, -15.175, 203.81, -501.1600928],
  Neptune: [299.36, 43.46, 249.978, 541.1397757],
  Lune: [269.9949, 66.5392, 38.3213, 13.17635815],
}

const RAD = Math.PI / 180
const OBLIQUITE = 23.4392911 * RAD
const versEcliptique = (x: number, y: number, z: number) => new THREE.Vector3(
  x, Math.cos(OBLIQUITE) * y + Math.sin(OBLIQUITE) * z, -Math.sin(OBLIQUITE) * y + Math.cos(OBLIQUITE) * z)

/**
 * Axes propres de l'astre à l'instant t, dans l'écliptique : x vers le méridien origine, z vers le pôle nord.
 * Sans données (petites lunes) : les axes de l'écliptique.
 */
export function axesAstre(nom: string, t: number): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const o = ORIENTATIONS[nom]
  if (!o) return [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]
  const [ad, dec, w0, vitesse] = o
  const a = ad * RAD, d = dec * RAD
  const p = { x: Math.cos(d) * Math.cos(a), y: Math.cos(d) * Math.sin(a), z: Math.sin(d) }
  const n = { x: -Math.sin(a), y: Math.cos(a), z: 0 } // nœud de l'équateur de l'astre sur l'équateur céleste
  const q = { x: p.y * n.z - p.z * n.y, y: p.z * n.x - p.x * n.z, z: p.x * n.y - p.y * n.x } // p × n
  const jours = t / 86_400_000 + 2440587.5 - 2451545
  const W = ((w0 + vitesse * jours) % 360) * RAD
  const m = { x: n.x * Math.cos(W) + q.x * Math.sin(W), y: n.y * Math.cos(W) + q.y * Math.sin(W), z: n.z * Math.cos(W) + q.z * Math.sin(W) }
  const pole = versEcliptique(p.x, p.y, p.z)
  const x = versEcliptique(m.x, m.y, m.z)
  return [x, pole.clone().cross(x), pole]
}

function toile(l: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = l
  c.height = h
  return [c, c.getContext('2d', { willReadFrequently: true })!]
}

/** Planète gazeuse : bandes horizontales ondulées. */
function peindreBandes(couleurs: string[], graine: number): HTMLCanvasElement {
  const [c, g] = toile(1024, 512)
  let s = graine
  const h = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const n = 34
  for (let i = 0; i < n; i++) {
    g.fillStyle = couleurs[Math.floor(h() * couleurs.length)]
    const y0 = (i / n) * 512
    g.beginPath()
    g.moveTo(0, y0)
    for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y0 + Math.sin(x / 90 + i) * 3)
    g.lineTo(1024, y0 + 512 / n + 4)
    g.lineTo(0, y0 + 512 / n + 4)
    g.fill()
  }
  return c
}

/**
 * Lune peinte à plat, façon BD : un fond, de grandes taches franches, des cratères cernés d'encre.
 * (Les grandes lunes sauf la Lune n'ont pas de carte publiée dans le dépôt.)
 */
function peindreLune(nom: string): HTMLCanvasElement {
  const { fond, taches, crateres } = aspectLune(nom)
  const [c, g] = toile(1024, 512)
  let s = [...nom].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 11) & 0x7fffffff
  const h = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  g.fillStyle = fond
  g.fillRect(0, 0, 1024, 512)
  // Taches : des blobs aux bords francs.
  g.fillStyle = taches
  for (let k = 0; k < 26; k++) {
    const x = h() * 1024, y = 60 + h() * 392, r = 20 + h() * 70
    g.beginPath()
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2, rr = r * (0.7 + 0.5 * h())
      g.lineTo(x + Math.cos(t) * rr * 1.6, y + Math.sin(t) * rr)
    }
    g.closePath()
    g.fill()
  }
  // Cratères : un rond de la couleur des taches, cerné d'encre.
  g.strokeStyle = '#1f1b18'
  g.lineWidth = 2
  for (let k = 0; k < Math.round(crateres * 70); k++) {
    const x = h() * 1024, y = 40 + h() * 432, r = 3 + h() ** 3 * 28
    g.fillStyle = h() < 0.5 ? taches : fond
    g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2); g.fill(); g.stroke()
  }
  return c
}

/**
 * Simplification « ligne claire » d'une carte : quatre aplats de la teinte moyenne (du plus sombre au plus clair,
 * seuils choisis pour que chaque aplat couvre autant de surface), puis un trait d'encre entre deux aplats.
 */
function versBD(source: CanvasImageSource): HTMLCanvasElement {
  const L = 1024, H = 512
  const [c, g] = toile(L, H)
  g.filter = 'blur(3px)'
  g.drawImage(source, 0, 0, L, H)
  g.filter = 'none'
  const img = g.getImageData(0, 0, L, H)
  const d = img.data
  const lum = new Float32Array(L * H)
  let r = 0, v = 0, b = 0
  for (let i = 0; i < L * H; i++) {
    lum[i] = 0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]
    r += d[4 * i]; v += d[4 * i + 1]; b += d[4 * i + 2]
  }
  const moy = [r / (L * H), v / (L * H), b / (L * H)]
  const tries = Float32Array.from(lum).sort()
  const NIVEAUX = 4
  const seuils = Array.from({ length: NIVEAUX - 1 }, (_, k) => tries[Math.floor(((k + 1) / NIVEAUX) * tries.length)])
  const niveau = new Uint8Array(L * H)
  for (let i = 0; i < L * H; i++) { let k = 0; while (k < seuils.length && lum[i] > seuils[k]) k++; niveau[i] = k }
  // Teintes : de 55 % à 125 % de la couleur moyenne, un peu plus saturées.
  const gris = (moy[0] + moy[1] + moy[2]) / 3
  const teintes = Array.from({ length: NIVEAUX }, (_, k) => {
    const f = 0.55 + (0.7 * k) / (NIVEAUX - 1)
    return moy.map((x) => Math.max(0, Math.min(255, (gris + (x - gris) * 1.35) * f)))
  })
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < L; x++) {
      const i = y * L + x
      const k = niveau[i]
      const bord = (x + 1 < L && niveau[i + 1] !== k) || (y + 1 < H && niveau[i + L] !== k)
      const t = bord ? [31, 27, 24] : teintes[k]
      d[4 * i] = t[0]; d[4 * i + 1] = t[1]; d[4 * i + 2] = t[2]; d[4 * i + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  return c
}

const chargeur = new THREE.TextureLoader()
const memoire = new Map<string, THREE.Texture | null>()

function enTexture(t: THREE.Texture): THREE.Texture {
  t.colorSpace = THREE.NoColorSpace // couleurs prises telles quelles (le matériau n'applique aucune conversion)
  t.wrapS = THREE.RepeatWrapping
  t.anisotropy = 4
  if (t.image) t.needsUpdate = true // les images chargées se mettent à jour d'elles-mêmes à l'arrivée
  return t
}

/** Texture d'un astre dans un style (chargée à la première demande), ou null s'il n'en a pas. */
export function textureAstre(nom: string, choix: Style): THREE.Texture | null {
  if (choix === 'plat') return null
  const style = choix === 'moebius' ? 'bd' : choix // Moebius reprend les cartes en ligne claire
  const cle = `${style}:${nom}`
  if (memoire.has(cle)) return memoire.get(cle)!
  let tx: THREE.Texture | null = null
  const graine = [...nom].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) & 0x7fffffff
  if (style === 'reel') {
    if (CARTES[nom]) tx = enTexture(chargeur.load(CARTES[nom]))
    else if (BANDES[nom]) tx = enTexture(new THREE.CanvasTexture(peindreBandes(BANDES[nom], graine)))
  } else {
    if (CARTES_BD[nom]) tx = enTexture(chargeur.load(CARTES_BD[nom]))
    else if (BANDES[nom]) tx = enTexture(new THREE.CanvasTexture(versBD(peindreBandes(BANDES[nom], graine))))
    else if (!CARTES[nom]) tx = enTexture(new THREE.CanvasTexture(peindreLune(nom)))
    else {
      // La photo se charge, puis on la simplifie : en attendant, l'astre est dessiné sans carte.
      chargeur.load(CARTES[nom], (photo) => {
        memoire.set(cle, enTexture(new THREE.CanvasTexture(versBD(photo.image as HTMLImageElement))))
      })
    }
  }
  memoire.set(cle, tx)
  return tx
}
