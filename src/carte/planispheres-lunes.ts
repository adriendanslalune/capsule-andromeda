// Les planisphères des lunes (demande d'Adrien du 21/10/2026 : les lunes de Jupiter, Titan, et toutes les lunes
// connues). Les grandes lunes d'après leurs grands traits connus (volcans d'Io, rayures d'Europe, sillons de Ganymède,
// Valhalla sur Callisto, dunes et lacs de Titan, « rayures de tigre » d'Encelade, Herschel sur Mimas, les deux visages
// de Japet, le cantaloup de Triton, Mordor sur Charon, Stickney sur Phobos…), la longitude 0 tournée vers leur
// planète ; les autres, un planisphère tiré de leur nom (leur couleur, des taches, plus ou moins de cratères).

import { aspectLune } from './couleurs'
import { ENCRE, H, L, RAD, contour, crateres, hasard, ondulation, tache, x, y, type Contexte } from './planispheres'

/** Le fond d'un planisphère. */
function fond(c: Contexte, couleur: string): void {
  c.fillStyle = couleur
  c.fillRect(0, 0, L, H)
}

/** Des taches aux formes molles, au hasard (régions plus sombres ou plus claires). */
function taches(c: Contexte, n: number, graine: number, couleur: string, taille: number, latMax = 70): void {
  const h = hasard(graine)
  for (let k = 0; k < n; k++) tache(c, -180 + 360 * h(), (2 * h() - 1) * latMax, taille * (0.5 + h()), taille * (0.3 + 0.6 * h()), couleur)
}

/** Une ligne qui suit un grand cercle (rayure, canyon), d'un point à un autre (degrés), à l'encre ou en couleur. */
function arc(c: Contexte, lon0: number, lat0: number, lon1: number, lat1: number, couleur: string, largeur: number): void {
  const v = (lon: number, lat: number) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)]
  const a = v(lon0, lat0), b = v(lon1, lat1)
  c.strokeStyle = couleur
  c.lineWidth = largeur
  c.lineCap = 'round'
  let precedent: [number, number] | null = null
  c.beginPath()
  for (let k = 0; k <= 40; k++) {
    const f = k / 40, p = a.map((ai, i) => ai * (1 - f) + b[i] * f), n = Math.hypot(p[0], p[1], p[2])
    const lon = Math.atan2(p[1], p[0]) / RAD, lat = Math.asin(p[2] / n) / RAD
    if (precedent && Math.abs(lon - precedent[0]) > 180) c.moveTo(x(lon), y(lat))
    else if (precedent) c.lineTo(x(lon), y(lat))
    else c.moveTo(x(lon), y(lat))
    precedent = [lon, lat]
  }
  c.stroke()
}

/** Un bassin à anneaux concentriques (Valhalla, Herschel, Odysseus…). */
function bassin(c: Contexte, lon: number, lat: number, rayon: number, anneaux: number, remplissage: string | null): void {
  if (remplissage) tache(c, lon, lat, rayon, rayon, remplissage, 1.2)
  for (let k = 1; k <= anneaux; k++) tache(c, lon, lat, rayon * (1 + 0.45 * k), rayon * (1 + 0.45 * k), null, 0.8)
  tache(c, lon, lat, rayon * 0.15, rayon * 0.15, null, 1)
}

/** Des rayons clairs autour d'un cratère jeune. */
function rayons(c: Contexte, lon: number, lat: number, longueur: number, n: number, couleur: string, graine: number): void {
  const h = hasard(graine)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 2 * Math.PI + h(), d = longueur * (0.5 + h())
    c.beginPath()
    c.moveTo(x(lon), y(lat))
    c.lineTo(x(lon + (d * Math.cos(a)) / Math.max(0.2, Math.cos(lat * RAD))), y(lat + d * Math.sin(a)))
    c.lineWidth = 2
    c.strokeStyle = couleur
    c.stroke()
  }
  tache(c, lon, lat, 2, 2, couleur, 1)
}

const LUNES: Readonly<Record<string, (c: Contexte) => void>> = {
  // Io : soufre jaune et orangé, plaines blanches, volcans noirs ; l'anneau rouge de Pélé, Loki, Prométhée.
  Io: (c) => {
    fond(c, '#e2cc55')
    taches(c, 22, 3, '#d9a944', 16)
    taches(c, 10, 5, '#efe6c2', 14)
    c.fillStyle = '#b98a4a'
    c.fillRect(0, 0, L, y(60))
    c.fillRect(0, y(-60), L, H)
    tache(c, -105, -19, 14, 10, null, 5, '#c0612a')
    const h = hasard(9)
    for (let k = 0; k < 34; k++) tache(c, -180 + 360 * h(), -55 + 110 * h(), 1 + 2.5 * h(), 1 + 2 * h(), '#2b2138')
    tache(c, -105, -19, 2.5, 2.5, '#2b2138')
    tache(c, -55, 13, 6, 4, '#2b2138', 0)
    tache(c, -153, -2, 2, 2, '#2b2138')
    rayons(c, -153, -2, 6, 10, '#f3e7c4', 4)
  },
  // Europe : glace crème, les grandes rayures brun-roux qui se croisent, des terrains chaotiques, Pwyll et ses rayons.
  Europe: (c) => {
    fond(c, '#e6dcc8')
    taches(c, 12, 7, '#d8c4a4', 18, 55)
    const h = hasard(13)
    for (let k = 0; k < 26; k++) {
      const lon = -180 + 360 * h(), lat = -60 + 120 * h()
      arc(c, lon, lat, lon + 40 + 80 * h(), lat + (h() - 0.5) * 70, '#a8683f', 1.6 + 1.6 * h())
    }
    for (let k = 0; k < 8; k++) tache(c, -180 + 360 * h(), -40 + 80 * h(), 4, 3, '#b98b6c', 0.8)
    rayons(c, -89, -25, 15, 14, '#f7f2ea', 17)
  },
  // Ganymède : terrains sombres anciens (Galileo Regio) et sillons clairs, calottes givrées, cratères à rayons.
  Ganymède: (c) => {
    fond(c, '#d2c9b8')
    contour(c, [[-170, 55], [-110, 60], [-100, 20], [-140, 5], [-175, 20]], '#7f7365', 1)
    contour(c, [[20, 40], [80, 45], [90, 10], [40, -5], [10, 15]], '#857a6c', 1)
    contour(c, [[110, -10], [170, -15], [160, -45], [115, -40]], '#857a6c', 1)
    contour(c, [[-60, -20], [-10, -25], [-20, -55], [-70, -45]], '#857a6c', 1)
    const h = hasard(21)
    for (let k = 0; k < 40; k++) { const lat = -60 + 120 * h(), lon = -180 + 360 * h(); arc(c, lon, lat, lon + 25, lat + 6 * (h() - 0.5), '#b9ae9c', 1) }
    c.fillStyle = '#ece8e0'
    c.fillRect(0, 0, L, y(68))
    c.fillRect(0, y(-68), L, H)
    crateres(c, 50, 25, 0.8, 4, null)
    rayons(c, 120, 36, 10, 12, '#f2eee6', 27)
  },
  // Callisto : très sombre, criblée de cratères clairs, et le grand bassin à anneaux Valhalla.
  Callisto: (c) => {
    fond(c, '#6a5d50')
    taches(c, 14, 31, '#5b4f44', 20)
    crateres(c, 220, 33, 0.6, 3.5, '#b0a492', (lon, lat) => Math.hypot(lon + 56, lat - 18) < 20)
    bassin(c, -56, 18, 7, 6, '#9a8e7d')
    bassin(c, 140, 30, 4, 4, '#8f8372')
  },
  // Titan : la brume orangée, la ceinture sombre des dunes à l'équateur, Xanadu clair, les lacs près du pôle nord.
  Titan: (c) => {
    fond(c, '#d9953c')
    c.fillStyle = '#b8762c'
    c.beginPath()
    for (let lon = -180; lon <= 180; lon += 4) c.lineTo(x(lon), y(20 + 6 * Math.sin(lon * 3 * RAD)))
    for (let lon = 180; lon >= -180; lon -= 4) c.lineTo(x(lon), y(-20 + 6 * Math.sin(lon * 2 * RAD + 1)))
    c.closePath()
    c.fill()
    contour(c, [[-140, 10], [-80, 5], [-70, -20], [-110, -30], [-145, -15]], '#eab25a', 0)
    for (const [lon, lat, rl, rb] of [[-50, 78, 20, 4], [70, 72, 14, 3], [160, 80, 25, 3], [-150, 70, 10, 2.5], [10, -72, 12, 3]]) tache(c, lon, lat, rl, rb, '#5c4127', 0.8)
    ondulation(c, 45, 1.2, 30, '#c7843a', 2)
    ondulation(c, -45, 1.2, 30, '#c7843a', 2, 1)
  },
  // Encelade : glace d'un blanc pur, les quatre « rayures de tigre » bleutées au pôle sud, des cratères au nord.
  Encelade: (c) => {
    fond(c, '#f4f4f0')
    crateres(c, 60, 41, 1, 4, '#e6e6e0', (_lon, lat) => lat < 10)
    for (let k = 0; k < 4; k++) arc(c, -170 + k * 15, -62 - k * 4, 10 + k * 15, -66 - k * 4, '#7fb2d0', 2.6)
    c.fillStyle = '#e4eef2'
    c.fillRect(0, y(-50), L, 6)
  },
  // Mimas : gris, criblée, et l'immense cratère Herschel (un tiers de son diamètre), avec son piton central.
  Mimas: (c) => {
    fond(c, '#c2bdb4')
    crateres(c, 200, 43, 1, 6, null, (lon, lat) => Math.hypot(lon - 104, lat) < 32)
    bassin(c, 104, 0, 26, 0, '#b0aaa0')
    tache(c, 104, 0, 4, 4, '#a39d93', 1)
  },
  // Japet : deux visages, l'hémisphère avant sombre (Cassini Regio), l'arrière clair ; sa crête le long de l'équateur.
  Japet: (c) => {
    fond(c, '#ddd6c9')
    contour(c, [[0, 40], [60, 55], [120, 50], [175, 35], [170, -30], [110, -50], [50, -45], [5, -30]], '#4a3b30', 1)
    crateres(c, 120, 47, 1, 5, null)
    ondulation(c, 0, 0.6, 12, ENCRE, 1.6)
  },
  // Rhéa : glace cratérisée, des traînées claires sur l'hémisphère arrière.
  Rhéa: (c) => {
    fond(c, '#cfcac1')
    crateres(c, 200, 51, 0.8, 5, null)
    for (let k = 0; k < 8; k++) arc(c, -150 + k * 8, 40 - k * 6, -100 + k * 8, -30 + k * 4, '#ebe8e2', 2.2)
  },
  // Dioné : cratères, et les grandes falaises claires (« chasmata ») de l'hémisphère arrière.
  Dione: (c) => {
    fond(c, '#d5d1ca')
    crateres(c, 170, 57, 0.8, 4.5, null)
    for (let k = 0; k < 6; k++) arc(c, -140 + k * 10, 50 - k * 12, -60 + k * 6, -40 + k * 8, '#f0eee9', 2.4)
  },
  // Téthys : le grand cratère Odysseus, et le long canyon d'Ithaca Chasma.
  Téthys: (c) => {
    fond(c, '#dcdad4')
    crateres(c, 160, 61, 0.8, 4.5, null, (lon, lat) => Math.hypot(lon - 130, lat - 30) < 28)
    bassin(c, 130, 30, 22, 0, '#cfccc5')
    arc(c, 10, 60, 30, -60, '#a19e98', 3)
    arc(c, 10, 60, 30, -60, ENCRE, 0.8)
  },
  // Titania : grands canyons (Messina Chasmata), cratères.
  Titania: (c) => {
    fond(c, '#b0a59a')
    taches(c, 10, 67, '#9d9287', 15)
    crateres(c, 140, 69, 0.8, 4, null)
    arc(c, -20, -10, 60, -40, '#776e66', 2.5)
    arc(c, 30, 20, 100, -5, '#776e66', 2)
  },
  // Obéron : cratères aux fonds sombres, une haute montagne.
  Obéron: (c) => {
    fond(c, '#9a8d80')
    crateres(c, 130, 71, 0.8, 4.5, '#62584f')
    tache(c, 40, -20, 3, 3, '#c0b5a8', 1)
  },
  // Ariel : de longues vallées qui se croisent, peu de cratères.
  Ariel: (c) => {
    fond(c, '#c0bab0')
    crateres(c, 70, 73, 0.8, 3, null)
    const h = hasard(75)
    for (let k = 0; k < 10; k++) { const lon = -180 + 360 * h(); arc(c, lon, -40 + 30 * h(), lon + 70, 30 * h(), '#827d74', 2) }
  },
  // Umbriel : la plus sombre, et l'anneau clair de Wunda.
  Umbriel: (c) => {
    fond(c, '#6c655e')
    crateres(c, 150, 77, 0.8, 4, '#5d5751')
    tache(c, 0, 50, 6, 6, null, 3, '#e0dbd2')
  },
  // Miranda : un patchwork de terrains (les « couronnes » en chevrons), des falaises immenses.
  Miranda: (c) => {
    fond(c, '#b5b1aa')
    crateres(c, 80, 79, 0.8, 3.5, null)
    for (const [lon, lat] of [[0, -30], [100, -25], [-100, -40]]) {
      for (let k = 0; k < 6; k++) tache(c, lon, lat, 8 + k * 4, 6 + k * 3, null, 1.1, k % 2 ? '#76736d' : ENCRE)
    }
    arc(c, -40, 10, 20, -50, '#76736d', 2.5)
  },
  // Triton : le terrain « cantaloup » rosé, la calotte polaire sud et les traînées sombres de ses geysers.
  Triton: (c) => {
    fond(c, '#e2c6b8')
    const h = hasard(83)
    for (let k = 0; k < 220; k++) tache(c, -180 + 360 * h(), -10 + 60 * h(), 1.2 + h(), 1 + h(), null, 0.7, '#b08f84')
    c.fillStyle = '#f2e1d8'
    c.fillRect(0, y(-15), L, H)
    ondulation(c, -15, 2, 18, ENCRE, 1)
    for (let k = 0; k < 30; k++) { const lon = -180 + 360 * h(), lat = -25 - 40 * h(); arc(c, lon, lat, lon + 6, lat - 6, '#8f6f66', 1.8) }
  },
  // Charon : gris, la tache rousse de Mordor au pôle nord, une ceinture de canyons.
  Charon: (c) => {
    fond(c, '#b7b2aa')
    c.fillStyle = '#8a5a4a'
    c.fillRect(0, 0, L, y(70))
    ondulation(c, 70, 2, 14, ENCRE, 1)
    crateres(c, 60, 89, 0.8, 3.5, null)
    for (let k = 0; k < 4; k++) arc(c, -160 + k * 90, 5 + k * 2, -90 + k * 90, -5 + k * 3, '#6f6a63', 2.4)
  },
  // Phobos : sombre, le grand cratère Stickney, et ses longs sillons parallèles.
  Phobos: (c) => {
    fond(c, '#7a6a5a')
    crateres(c, 80, 91, 0.8, 4, null, (lon, lat) => Math.hypot(lon + 50, lat) < 22)
    bassin(c, -50, 0, 18, 0, '#6b5c4d')
    for (let k = 0; k < 10; k++) arc(c, 0, -30 + k * 6, 160, -30 + k * 6, '#5a4c40', 1)
  },
  // Deimos : lisse, presque sans relief, quelques cratères doux.
  Deimos: (c) => {
    fond(c, '#9a8670')
    crateres(c, 25, 93, 1, 4, '#8d7a65')
  },
}

/** Le planisphère d'une lune : le sien, ou un planisphère tiré de son nom (sa couleur, des taches, des cratères). */
export function planisphereLune(nom: string): (c: Contexte) => void {
  const propre = LUNES[nom]
  if (propre) return propre
  return (c) => {
    const a = aspectLune(nom), graine = [...nom].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7) % 100_000
    fond(c, a.fond)
    taches(c, 8, graine, a.taches, 18)
    crateres(c, Math.round(40 + 120 * a.crateres), graine + 1, 0.8, 6, null)
  }
}
