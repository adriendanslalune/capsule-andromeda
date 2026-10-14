// Aspect réaliste des astres (hors Terre, voir terre.ts).
//  - Soleil, Mercure, Vénus, Mars, Jupiter, Lune : cartes de Solar System Scope (CC BY 4.0), d'après les données de la
//    NASA (assets/textures/2k_*.jpg).
//  - Saturne et ses anneaux, Uranus, Neptune : peints par le jeu (bandes nuageuses, divisions des anneaux).
//  - Les satellites : peints par le jeu, chacun avec sa couleur et ses cratères ; un aspect propre pour les plus connus
//    (Io et ses volcans, Europe et ses rayures, Titan et sa brume orange…) ; les petits ont une forme irrégulière.
//  - Orientation réelle : axe des pôles et rotation selon l'Union astronomique internationale (pôle en ascension
//    droite et déclinaison J2000, méridien W = W0 + vitesse × jours depuis J2000).

import * as THREE from 'three'
import soleilUrl from '../../../assets/textures/2k_sun.jpg?url'
import mercureUrl from '../../../assets/textures/2k_mercury.jpg?url'
import venusUrl from '../../../assets/textures/2k_venus_atmosphere.jpg?url'
import marsUrl from '../../../assets/textures/2k_mars.jpg?url'
import jupiterUrl from '../../../assets/textures/2k_jupiter.jpg?url'
import luneUrl from '../../../assets/textures/2k_moon.jpg?url'
import { OBLIQUITE_J2000, RAD } from '../../astro/vecteur'
import { mulberry32 } from '../../moteur/hasard'

const CARTES: Readonly<Record<string, string>> = {
  Soleil: soleilUrl, Mercure: mercureUrl, Vénus: venusUrl, Mars: marsUrl, Jupiter: jupiterUrl, Lune: luneUrl,
}

/** Pôle (ascension droite, déclinaison, degrés) et méridien (W0, degrés par jour) — UAI, rapport 2015. */
const ORIENTATIONS: Readonly<Record<string, readonly [number, number, number, number]>> = {
  Soleil: [286.13, 63.87, 84.176, 14.1844],
  Mercure: [281.0103, 61.4155, 329.5988, 6.1385108],
  Vénus: [272.76, 67.16, 160.2, -1.4813688],
  Mars: [317.269, 54.432, 176.049, 350.891983],
  Jupiter: [268.057, 64.495, 284.95, 870.536],
  Saturne: [40.589, 83.537, 38.9, 810.7939024],
  Uranus: [257.311, -15.175, 203.81, -501.1600928],
  Neptune: [299.36, 43.46, 249.978, 541.1397757],
  Lune: [269.9949, 66.5392, 38.3213, 13.17635815],
}

/** Passe d'un vecteur équatorial (J2000) aux axes de three.js (écliptique, y vers le haut). */
function versScene(x: number, y: number, z: number): THREE.Vector3 {
  const c = Math.cos(OBLIQUITE_J2000 * RAD), s = Math.sin(OBLIQUITE_J2000 * RAD)
  const ey = y * c + z * s
  const ez = -y * s + z * c
  return new THREE.Vector3(x, ez, -ey)
}

/**
 * Oriente un astre à l'instant t : son axe local +Y sur le pôle, son méridien origine (milieu de la carte, axe +X)
 * à l'angle W compté depuis le nœud de son équateur. Sans données : rien.
 */
export function orienter(nom: string, maillage: THREE.Object3D, t: number) {
  const o = ORIENTATIONS[nom]
  if (!o) return
  const [ad, dec, w0, vitesse] = o
  const a = ad * RAD, d = dec * RAD
  const p = { x: Math.cos(d) * Math.cos(a), y: Math.cos(d) * Math.sin(a), z: Math.sin(d) }
  // Nœud ascendant de l'équateur de l'astre sur l'équateur céleste : z × p.
  const nl = Math.hypot(-p.y, p.x) || 1
  const n = { x: -p.y / nl, y: p.x / nl, z: 0 }
  const q = { x: p.y * n.z - p.z * n.y, y: p.z * n.x - p.x * n.z, z: p.x * n.y - p.y * n.x } // p × n
  const jours = t / 86_400_000 + 2440587.5 - 2451545.0
  const W = ((w0 + vitesse * jours) % 360) * RAD
  const m = { x: n.x * Math.cos(W) + q.x * Math.sin(W), y: n.y * Math.cos(W) + q.y * Math.sin(W), z: n.z * Math.cos(W) + q.z * Math.sin(W) }
  const mz = { x: m.y * p.z - m.z * p.y, y: m.z * p.x - m.x * p.z, z: m.x * p.y - m.y * p.x } // m × p
  const base = new THREE.Matrix4().makeBasis(versScene(m.x, m.y, m.z), versScene(p.x, p.y, p.z), versScene(mz.x, mz.y, mz.z))
  maillage.quaternion.setFromRotationMatrix(base)
}

// ---------------------------------------------------------------------------------------------------------------
// Peintures

function toile(l: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = l
  c.height = h
  return [c, c.getContext('2d')!]
}
function enTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Planète gazeuse : bandes horizontales de couleurs données, ondulées, avec un grain fin. */
function peindreBandes(couleurs: string[], graine: number, tache?: { y: number; couleur: string }): THREE.CanvasTexture {
  const [c, g] = toile(1024, 512)
  const h = mulberry32(graine)
  const n = 40
  for (let i = 0; i < n; i++) {
    g.fillStyle = couleurs[Math.floor(h() * couleurs.length)]
    const y0 = (i / n) * 512
    g.beginPath()
    g.moveTo(0, y0)
    for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y0 + Math.sin(x / 90 + i) * 2.5)
    g.lineTo(1024, y0 + 512 / n + 3)
    g.lineTo(0, y0 + 512 / n + 3)
    g.fill()
  }
  // Adoucit les bandes.
  g.globalAlpha = 0.5
  g.filter = 'blur(3px)'
  g.drawImage(c, 0, 0)
  g.filter = 'none'
  g.globalAlpha = 1
  for (let k = 0; k < 4000; k++) {
    g.fillStyle = `rgba(255,255,255,${h() * 0.04})`
    g.fillRect(h() * 1024, h() * 512, 2 + h() * 10, 1)
  }
  if (tache) {
    g.fillStyle = tache.couleur
    g.beginPath()
    g.ellipse(620, tache.y * 512, 38, 16, 0, 0, Math.PI * 2)
    g.fill()
  }
  return enTexture(c)
}

/** Anneaux de Saturne : bandes C, B, A, division de Cassini, en transparence (du bord intérieur vers l'extérieur). */
function peindreAnneaux(): THREE.CanvasTexture {
  const [c, g] = toile(1024, 8)
  const h = mulberry32(7)
  for (let x = 0; x < 1024; x++) {
    const r = 1.24 + (x / 1024) * (2.27 - 1.24) // en rayons de Saturne
    let a = 0
    if (r < 1.52) a = 0.18 // anneau C, pâle
    else if (r < 1.95) a = 0.85 // anneau B, dense
    else if (r < 2.03) a = 0.06 // division de Cassini
    else if (r < 2.26) a = r > 2.21 && r < 2.215 ? 0.1 : 0.6 // anneau A, et la division d'Encke
    a *= 0.85 + h() * 0.3
    const v = Math.round(200 + h() * 30)
    g.fillStyle = `rgba(${v},${Math.round(v * 0.92)},${Math.round(v * 0.78)},${Math.min(1, a)})`
    g.fillRect(x, 0, 1, 8)
  }
  return enTexture(c)
}

/** Aspects connus des satellites : couleur de fond, couleur des taches, densité de cratères, particularités. */
const ASPECTS: Readonly<Record<string, { fond: string; taches: string; crateres: number; motif?: 'volcans' | 'rayures' | 'sillons' | 'brume' | 'deux-faces' | 'rayures-tigre' }>> = {
  Io: { fond: '#d9c45a', taches: '#b5652a', crateres: 0, motif: 'volcans' },
  Europe: { fond: '#ddd3c0', taches: '#9a6b47', crateres: 0.1, motif: 'rayures' },
  Ganymède: { fond: '#8f857a', taches: '#c9c1b2', crateres: 0.5, motif: 'sillons' },
  Callisto: { fond: '#5c5248', taches: '#a59a8b', crateres: 1.6 },
  Titan: { fond: '#c78a3a', taches: '#d9a04e', crateres: 0, motif: 'brume' },
  Encelade: { fond: '#f2f2ef', taches: '#bfd2dc', crateres: 0.3, motif: 'rayures-tigre' },
  Japet: { fond: '#d8d2c6', taches: '#3d332b', crateres: 0.8, motif: 'deux-faces' },
  Triton: { fond: '#d9c3b8', taches: '#a58f86', crateres: 0.2 },
  Mimas: { fond: '#b9b5ae', taches: '#7d7974', crateres: 1.4 },
  Rhéa: { fond: '#c8c4bc', taches: '#8d8983', crateres: 1.2 },
  Dioné: { fond: '#cfccc6', taches: '#97938d', crateres: 1 },
  Téthys: { fond: '#d6d4cf', taches: '#9b9893', crateres: 1 },
  Phobos: { fond: '#6b5f53', taches: '#3f3731', crateres: 1.4 },
  Deimos: { fond: '#8a7b69', taches: '#5d5246', crateres: 0.8 },
  Titania: { fond: '#a39d95', taches: '#6e6862', crateres: 1 },
  Obéron: { fond: '#8e857c', taches: '#5a524b', crateres: 1.2 },
  Miranda: { fond: '#a9a7a2', taches: '#6e6c68', crateres: 0.6, motif: 'sillons' },
  Ariel: { fond: '#b4b0a8', taches: '#7b776f', crateres: 0.8 },
  Umbriel: { fond: '#5f5a55', taches: '#3a3633', crateres: 1.2 },
}

function grainePour(nom: string): number {
  let h = 2166136261
  for (const c of nom) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Peinture d'un satellite : fond, marbrures, cratères, et son motif propre. */
function peindreSatellite(nom: string, rayonKm: number): THREE.CanvasTexture {
  const h = mulberry32(grainePour(nom))
  const gris = Math.round(110 + h() * 70)
  const a = ASPECTS[nom] ?? {
    fond: `rgb(${gris},${Math.round(gris * (0.9 + h() * 0.08))},${Math.round(gris * (0.8 + h() * 0.12))})`,
    taches: `rgba(40,32,26,0.5)`, crateres: 1 + h(),
  }
  // Les grands satellites, vus de près, méritent une peinture plus fine.
  const L = rayonKm > 500 ? 1024 : 512
  const H = L / 2
  const [c, g] = toile(L, H)
  g.scale(L / 512, L / 512)
  g.fillStyle = a.fond
  g.fillRect(0, 0, 512, 256)
  // Marbrures : taches dégradées, sans bord.
  const tache = (x: number, y: number, rx: number, couleur: string, alpha: number) => {
    const d = g.createRadialGradient(x, y, 0, x, y, rx)
    d.addColorStop(0, couleur)
    d.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalAlpha = alpha
    g.fillStyle = d
    g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill()
  }
  for (let k = 0; k < 220; k++) tache(h() * 512, h() * 256, 6 + h() * 40, h() < 0.6 ? a.taches : '#ffffff', 0.04 + h() * 0.1)
  g.globalAlpha = 1
  if (a.motif === 'volcans') {
    // Dépôts de soufre (jaunes, blanchâtres, verdâtres), puis les volcans : un cœur sombre et un halo rougeâtre diffus.
    for (let k = 0; k < 60; k++) tache(h() * 512, 20 + h() * 216, 10 + h() * 30, ['#efe39a', '#c9b24a', '#e8e4cf', '#a7a35a'][Math.floor(h() * 4)], 0.25)
    for (let k = 0; k < 45; k++) {
      const x = h() * 512, y = 30 + h() * 196
      tache(x, y, 6 + h() * 14, '#a5481c', 0.45)
      tache(x, y, 1.5 + h() * 3, '#21160f', 0.9)
    }
    g.globalAlpha = 1
  } else if (a.motif === 'rayures' || a.motif === 'rayures-tigre') {
    g.strokeStyle = a.taches
    for (let k = 0; k < (a.motif === 'rayures' ? 60 : 5); k++) {
      g.globalAlpha = 0.35 + h() * 0.4
      g.lineWidth = a.motif === 'rayures' ? 1 + h() * 2.5 : 4
      const y = a.motif === 'rayures' ? h() * 256 : 210 + k * 7
      g.beginPath(); g.moveTo(0, y)
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 50 + k) * (a.motif === 'rayures' ? 30 : 4) + (h() - 0.5) * 6)
      g.stroke()
    }
    g.globalAlpha = 1
  } else if (a.motif === 'sillons') {
    g.strokeStyle = a.taches
    for (let k = 0; k < 90; k++) {
      g.globalAlpha = 0.25
      g.lineWidth = 1.5
      const x = h() * 512, y = h() * 256, l = 20 + h() * 60, ang = h() * Math.PI
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); g.stroke()
    }
    g.globalAlpha = 1
  } else if (a.motif === 'brume') {
    const d = g.createLinearGradient(0, 0, 0, 256)
    d.addColorStop(0, 'rgba(120,80,30,0.5)'); d.addColorStop(0.5, 'rgba(230,170,80,0.2)'); d.addColorStop(1, 'rgba(120,80,30,0.5)')
    g.fillStyle = d
    g.fillRect(0, 0, 512, 256)
  } else if (a.motif === 'deux-faces') {
    g.fillStyle = a.taches
    g.beginPath(); g.ellipse(128, 128, 130, 110, 0, 0, Math.PI * 2); g.fill()
  }
  // Cratères : bord sombre, fond clair.
  const nombre = Math.round(a.crateres * 160)
  for (let k = 0; k < nombre; k++) {
    const x = h() * 512, y = 10 + h() * 236, r = 1.5 + Math.pow(h(), 3) * 18
    tache(x + r * 0.2, y + r * 0.2, r, '#000000', 0.35)
    tache(x - r * 0.15, y - r * 0.15, r * 0.8, '#ffffff', 0.18)
    g.globalAlpha = 1
  }
  return enTexture(c)
}

/** Forme irrégulière (pomme de terre) pour les petits satellites (rayon < 200 km). */
function formeIrreguliere(nom: string): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 48, 24)
  const h = mulberry32(grainePour(nom) ^ 99)
  const bosses = Array.from({ length: 7 }, () => ({ d: new THREE.Vector3(h() - 0.5, h() - 0.5, h() - 0.5).normalize(), a: (h() - 0.4) * 0.35 }))
  const allonge = 1 + h() * 0.45
  const p = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    let k = 1
    for (const b of bosses) k += b.a * Math.max(0, v.dot(b.d)) ** 3
    v.multiplyScalar(k)
    v.x *= allonge
    p.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

/** Matériau et forme d'un astre (Soleil, planète hors Terre, Lune, satellite). */
export function aspectAstre(nom: string, rayonKm: number, chargeur: THREE.TextureLoader): { geometrie: THREE.BufferGeometry; materiau: THREE.Material; anneau?: THREE.Mesh } {
  const carte = CARTES[nom]
  const sphere = () => new THREE.SphereGeometry(1, 64, 32)
  if (nom === 'Soleil') {
    const tx = chargeur.load(carte)
    tx.colorSpace = THREE.SRGBColorSpace
    return { geometrie: sphere(), materiau: new THREE.MeshBasicMaterial({ map: tx, color: 0xffffff }) }
  }
  if (carte) {
    const tx = chargeur.load(carte)
    tx.colorSpace = THREE.SRGBColorSpace
    tx.anisotropy = 4
    return { geometrie: sphere(), materiau: new THREE.MeshStandardMaterial({ map: tx, roughness: nom === 'Vénus' ? 1 : 0.95, metalness: 0 }) }
  }
  if (nom === 'Saturne') {
    const anneau = new THREE.Mesh(new THREE.RingGeometry(1.24, 2.27, 128, 1), new THREE.MeshStandardMaterial({
      map: peindreAnneaux(), side: THREE.DoubleSide, transparent: true, roughness: 1, depthWrite: false,
    }))
    // Le motif des anneaux suit le rayon : on recale les coordonnées de texture (u = distance au centre).
    const pos = anneau.geometry.attributes.position as THREE.BufferAttribute
    const uv = anneau.geometry.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) - 1.24) / (2.27 - 1.24), 0.5)
    anneau.rotation.x = -Math.PI / 2
    return { geometrie: sphere(), materiau: new THREE.MeshStandardMaterial({ map: peindreBandes(['#e3cf9f', '#d6bd86', '#ccb27a', '#e8d9b0', '#c9a96e'], 6), roughness: 1 }), anneau }
  }
  if (nom === 'Uranus') return { geometrie: sphere(), materiau: new THREE.MeshStandardMaterial({ map: peindreBandes(['#a8d8dc', '#b2dde0', '#9ccfd4', '#aedadd'], 8), roughness: 1 }) }
  if (nom === 'Neptune') {
    return { geometrie: sphere(), materiau: new THREE.MeshStandardMaterial({ map: peindreBandes(['#3f63c4', '#4a6fcc', '#3557b4', '#5a7fd6', '#4466c0'], 9, { y: 0.6, couleur: '#24346f' }), roughness: 1 }) }
  }
  // Satellite.
  return {
    geometrie: rayonKm < 200 ? formeIrreguliere(nom) : sphere(),
    materiau: new THREE.MeshStandardMaterial({ map: peindreSatellite(nom, rayonKm), roughness: 1, metalness: 0 }),
  }
}
