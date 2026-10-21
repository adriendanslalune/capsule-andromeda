// Les planisphères des astres qui tournent (demandes d'Adrien du 21/10/2026) : toute leur surface à plat, en aplats
// Moebius (traits d'encre fins, aplats pastel, mêmes couleurs que leurs illustrations), sur 1024 × 512 (longitude de
// −180° à 180° en largeur, latitude de 90° à −90° en hauteur). globes.ts les enroule sur le globe. La Terre d'après
// ses vrais contours (Natural Earth) ; les autres d'après leurs grands traits connus (mers de Mars, bandes et Grande
// Tache de Jupiter, hexagone de Saturne, cœur de Pluton…), placés à leurs vraies longitudes quand on les connaît.

import { TERRES } from '../donnees/terres'

export const L = 1024, H = 512
const ENCRE = '#2b2138'
const RAD = Math.PI / 180

type Contexte = CanvasRenderingContext2D
const x = (lon: number) => ((lon + 180) / 360) * L
const y = (lat: number) => ((90 - lat) / 180) * H

/** Hasard reproductible (un planisphère est toujours dessiné pareil). */
function hasard(graine: number): () => number {
  let a = graine
  return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff }
}

/** Dessine trois fois (décalé d'un tour à gauche et à droite) : une forme à cheval sur le bord du planisphère. */
function partout(c: Contexte, f: () => void): void {
  for (const d of [-L, 0, L]) { c.save(); c.translate(d, 0); f(); c.restore() }
}

/** Une ellipse « vraie » sur l'astre (centre lon/lat, rayons en degrés), étirée en longitude comme sur un planisphère. */
function tache(c: Contexte, lon: number, lat: number, rLon: number, rLat: number, remplissage: string | null, encre = 0, couleurEncre = ENCRE): void {
  partout(c, () => {
    c.beginPath()
    c.ellipse(x(lon), y(lat), Math.min(L / 2, (rLon / 360) * L / Math.max(0.15, Math.cos(lat * RAD))), (rLat / 180) * H, 0, 0, 2 * Math.PI)
    if (remplissage) { c.fillStyle = remplissage; c.fill() }
    if (encre) { c.lineWidth = encre; c.strokeStyle = couleurEncre; c.stroke() }
  })
}

/** Un contour (liste de [lon, lat]) en aplat, cerné d'encre. */
function contour(c: Contexte, points: [number, number][], remplissage: string, encre = 1.2): void {
  partout(c, () => {
    c.beginPath()
    points.forEach(([lo, la], k) => (k ? c.lineTo(x(lo), y(la)) : c.moveTo(x(lo), y(la))))
    c.closePath()
    c.fillStyle = remplissage
    c.fill()
    if (encre) { c.lineWidth = encre; c.strokeStyle = ENCRE; c.lineJoin = 'round'; c.stroke() }
  })
}

/** Une bande de latitude (lat0 > lat1), aux bords ondulés (amplitude en degrés). */
function bande(c: Contexte, lat0: number, lat1: number, couleur: string, amplitude: number, phase: number, encre = 1): void {
  const bord = (lat: number, p: number) => (lon: number) => y(lat + amplitude * Math.sin(lon * 3 * RAD + p) + 0.4 * amplitude * Math.sin(lon * 11 * RAD + 2 * p))
  const haut = bord(lat0, phase), bas = bord(lat1, phase + 1.7)
  c.beginPath()
  for (let lon = -180; lon <= 180; lon += 3) { if (lon === -180) c.moveTo(x(lon), haut(lon)); else c.lineTo(x(lon), haut(lon)) }
  for (let lon = 180; lon >= -180; lon -= 3) c.lineTo(x(lon), bas(lon))
  c.closePath()
  c.fillStyle = couleur
  c.fill()
  if (encre) {
    c.lineWidth = encre
    c.strokeStyle = ENCRE
    for (const f of [haut, bas]) { c.beginPath(); for (let lon = -180; lon <= 180; lon += 3) { if (lon === -180) c.moveTo(x(lon), f(lon)); else c.lineTo(x(lon), f(lon)) } c.stroke() }
  }
}

/** Une ligne ondulée sur toute la longueur (houle, voile de nuages). */
function ondulation(c: Contexte, lat: number, amplitude: number, periode: number, couleur: string, largeur: number, phase = 0): void {
  c.beginPath()
  for (let u = 0; u <= L; u += 6) { const v = y(lat) + amplitude * Math.sin(u / periode + phase); if (u) c.lineTo(u, v); else c.moveTo(u, v) }
  c.lineWidth = largeur
  c.strokeStyle = couleur
  c.stroke()
}

/** Des cratères (cercles à l'encre, parfois un piton central), répartis au hasard. */
function crateres(c: Contexte, n: number, graine: number, rMin: number, rMax: number, fond: string | null, sauf?: (lon: number, lat: number) => boolean): void {
  const h = hasard(graine)
  for (let k = 0; k < n; k++) {
    const lon = -180 + 360 * h(), lat = Math.asin(2 * h() - 1) / RAD, r = rMin + (rMax - rMin) * h() ** 2
    if (sauf?.(lon, lat)) continue
    tache(c, lon, lat, r, r, fond, 1.1)
    if (r > (rMin + rMax) / 2 && h() > 0.5) tache(c, lon, lat, r * 0.2, r * 0.2, null, 0.9)
  }
}

/** Des écharpes de nuages blancs, cernées de gris. */
function nuages(c: Contexte, n: number, graine: number, latMin: number, latMax: number, blanc = '#f7f4ee', gris = '#9aa7b8'): void {
  const h = hasard(graine)
  c.lineCap = 'round'
  for (let k = 0; k < n; k++) {
    const cx = h() * L, cy = y(latMin + h() * (latMax - latMin)), l = 30 + h() * 60
    c.beginPath()
    c.moveTo(cx, cy)
    c.quadraticCurveTo(cx + l / 2, cy - 6, cx + l, cy + 1)
    c.lineWidth = 4.5
    c.strokeStyle = blanc
    c.stroke()
    c.lineWidth = 1
    c.strokeStyle = gris
    c.stroke()
  }
}

/** La Terre : océan et houle, les vrais continents, déserts, forêts, glaces, nuages, côtes à l'encre. */
function terre(c: Contexte): void {
  c.fillStyle = '#8db6dc'
  c.fillRect(0, 0, L, H)
  for (let k = 0; k < 40; k++) ondulation(c, 90 - ((8 + k * 12.6) * 180) / H, 1.6, 23, '#6f9cc8', 1, k)
  // Un contour qui passe l'antiméridien (la Russie, les Fidji) : ses longitudes sont recollées, et il est dessiné de
  // part et d'autre du bord du planisphère.
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
  for (const d of [[-16, 34, 15, 31], [36, 58, 14, 31], [118, 142, -31, -19], [88, 116, 37, 47], [-118, -104, 27, 38], [-72, -66, -28, -18]]) {
    c.fillStyle = '#e3cd8e'
    c.beginPath()
    c.ellipse(x((d[0] + d[1]) / 2), y((d[2] + d[3]) / 2), (x(d[1]) - x(d[0])) / 2, (y(d[2]) - y(d[3])) / 2, 0, 0, 2 * Math.PI)
    c.fill()
  }
  for (const f of [[-76, -50, -13, 4], [10, 30, -6, 5], [96, 120, -6, 6]]) {
    c.fillStyle = '#7fae6c'
    c.beginPath()
    c.ellipse(x((f[0] + f[1]) / 2), y((f[2] + f[3]) / 2), (x(f[1]) - x(f[0])) / 2, (y(f[2]) - y(f[3])) / 2, 0, 0, 2 * Math.PI)
    c.fill()
  }
  c.fillStyle = '#f7f4ee'
  c.fillRect(0, y(-62), L, H) // l'Antarctique
  c.beginPath()
  c.ellipse(x(-40), y(71.5), (x(-20) - x(-60)) / 2, (y(59) - y(84)) / 2, 0, 0, 2 * Math.PI) // le Groenland
  c.fill()
  c.fillRect(0, 0, L, y(76))
  c.restore()
  // La banquise arctique, et le pôle Sud.
  c.fillStyle = '#f7f4ee'
  c.fillRect(0, 0, L, y(82))
  c.fillRect(0, y(-84), L, H)
  c.strokeStyle = ENCRE
  c.lineWidth = 1.3
  c.lineCap = 'round'
  c.stroke(cotes)
  nuages(c, 26, 12345, -55, 60)
}

/** Mercure : terrains plus sombres, le bassin Caloris (anneaux et fractures), des cratères partout, un cratère à rayons. */
function mercure(c: Contexte): void {
  c.fillStyle = '#c9bba6'
  c.fillRect(0, 0, L, H)
  const h = hasard(7)
  for (let k = 0; k < 14; k++) tache(c, -180 + 360 * h(), -60 + 120 * h(), 10 + 25 * h(), 6 + 14 * h(), '#a99a86')
  crateres(c, 170, 11, 1.2, 7, null, (lon, lat) => Math.hypot(lon - 162, lat - 30) < 22)
  // Caloris : deux anneaux et des fractures en étoile.
  tache(c, 162, 30, 20, 20, '#bfae95', 1.4)
  tache(c, 162, 30, 15, 15, null, 1.2)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI
    c.beginPath()
    c.moveTo(x(162 + 2 * Math.cos(a) / Math.cos(30 * RAD)), y(30 + 2 * Math.sin(a)))
    c.lineTo(x(162 + 12 * Math.cos(a) / Math.cos(30 * RAD)), y(30 + 12 * Math.sin(a)))
    c.lineWidth = 0.9
    c.strokeStyle = ENCRE
    c.stroke()
  }
  // Hokusai, le cratère jeune et ses grands rayons clairs.
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * 2 * Math.PI + h()
    c.beginPath()
    c.moveTo(x(16), y(58))
    c.lineTo(x(16 + 30 * Math.cos(a) / Math.cos(58 * RAD) * (0.5 + h())), y(58 + 25 * Math.sin(a) * (0.5 + h())))
    c.lineWidth = 2.2
    c.strokeStyle = '#f4ede0'
    c.stroke()
  }
  tache(c, 16, 58, 2.5, 2.5, '#f8f2e6', 1.1)
}

/** Vénus (ses nuages) : le grand « Y » sombre couché, des voiles en chevrons vers les pôles, des tourbillons polaires. */
function venus(c: Contexte): void {
  c.fillStyle = '#f1dfa6'
  c.fillRect(0, 0, L, H)
  for (const centre of [-90, 90]) {
    // Le « Y » : une bande sombre le long de l'équateur, qui s'ouvre en deux branches vers l'ouest.
    contour(c, [[centre + 70, -6], [centre - 10, -5], [centre - 60, -38], [centre - 85, -36], [centre - 25, 0], [centre - 85, 36], [centre - 60, 38], [centre - 10, 5], [centre + 70, 6]], '#d9bd78', 1.1)
  }
  for (let k = 1; k <= 6; k++) {
    for (const s of [-1, 1]) {
      c.beginPath()
      for (let lon = -180; lon <= 180; lon += 4) {
        const lat = s * (10 + k * 11 + 6 * Math.cos((lon * 2 + k * 40) * RAD))
        if (lon === -180) c.moveTo(x(lon), y(lat)); else c.lineTo(x(lon), y(lat))
      }
      c.lineWidth = 1.3
      c.strokeStyle = '#b8995a'
      c.stroke()
    }
  }
  for (const lat of [82, -82]) tache(c, 0, lat, 160, 6, '#e3c98a', 1)
}

/** Mars : ses mers sombres, Valles Marineris, les volcans de Tharsis et Olympus Mons, Hellas, des cratères, les calottes. */
function mars(c: Contexte): void {
  c.fillStyle = '#e3987a'
  c.fillRect(0, 0, L, H)
  const sombre = '#b86e55'
  // Les grandes régions sombres (Syrtis Major, Acidalia, Erythraeum, Meridiani, Cimmerium, Utopia, Tyrrhenum).
  contour(c, [[62, 25], [78, 20], [80, 0], [72, -8], [64, 0], [58, 15]], sombre)
  contour(c, [[-55, 55], [-20, 58], [-5, 45], [-25, 35], [-45, 40]], sombre)
  contour(c, [[-60, -15], [-20, -18], [-5, -35], [-35, -45], [-60, -35]], sombre)
  contour(c, [[-20, 2], [15, 0], [20, -8], [-5, -12], [-22, -8]], sombre)
  contour(c, [[120, -10], [175, -15], [170, -35], [130, -32], [115, -22]], sombre)
  contour(c, [[95, 55], [135, 50], [130, 38], [100, 38]], sombre)
  contour(c, [[90, -10], [115, -12], [110, -28], [88, -24]], sombre)
  // Hellas, le grand bassin clair.
  tache(c, 70, -42, 18, 12, '#eab399', 1.2)
  crateres(c, 60, 23, 1, 4, null)
  // Valles Marineris : une longue entaille.
  c.beginPath()
  c.moveTo(x(-95), y(-6))
  c.bezierCurveTo(x(-80), y(-9), x(-60), y(-6), x(-40), y(-13))
  c.lineCap = 'round'
  c.lineWidth = 5
  c.strokeStyle = '#8a4636'
  c.stroke()
  c.lineWidth = 1.2
  c.strokeStyle = ENCRE
  c.stroke()
  // Les volcans : Olympus Mons (très grand), et les trois de Tharsis.
  for (const [lon, lat, r] of [[-134, 18, 7], [-121, -9, 3.5], [-113, 1, 3.5], [-104, 11, 3.5]]) {
    tache(c, lon, lat, r, r, '#d48466', 1.3)
    tache(c, lon, lat, r * 0.3, r * 0.3, null, 1)
  }
  tache(c, -134, 18, 4.5, 4.5, null, 0.9)
  // Les calottes polaires.
  c.fillStyle = '#faf2e6'
  c.fillRect(0, 0, L, y(80))
  c.fillRect(0, y(-82), L, H)
  ondulation(c, 80, 1.2, 9, ENCRE, 1)
  ondulation(c, -82, 1.2, 9, ENCRE, 1, 2)
}

/** Jupiter : zones claires et ceintures brunes, festons bleutés, ovales blancs, et la Grande Tache rouge. */
function jupiter(c: Contexte): void {
  c.fillStyle = '#f1dcbc'
  c.fillRect(0, 0, L, H)
  bande(c, 90, 50, '#c9a988', 2, 0.3)
  bande(c, 32, 25, '#d9b48e', 1.2, 1.1)
  bande(c, 19, 7, '#c98c62', 1.4, 2.3)
  bande(c, -7, -20, '#c98c62', 1.4, 0.7)
  bande(c, -27, -33, '#d9b48e', 1.2, 1.9)
  bande(c, -50, -90, '#c9a988', 2, 2.7)
  // Les festons bleutés, au bord de la ceinture équatoriale nord.
  for (let k = 0; k < 12; k++) {
    const lon = -180 + k * 30
    c.beginPath()
    c.moveTo(x(lon), y(7))
    c.quadraticCurveTo(x(lon + 6), y(1), x(lon + 16), y(6))
    c.lineWidth = 2
    c.strokeStyle = '#7f93b0'
    c.stroke()
  }
  for (const lon of [-150, -60, 20, 110]) tache(c, lon, -38, 5, 2.4, '#fbf6ec', 1)
  // La Grande Tache rouge (et son collier clair).
  tache(c, 60, -22, 14, 7, '#f1dcbc', 1.2)
  tache(c, 60, -22, 11, 5, '#d6654a', 1.4)
  c.save()
  c.beginPath()
  for (let k = 0; k < 60; k++) {
    const a = k * 0.35, rr = 0.5 + k * 0.15
    c.lineTo(x(60) + rr * 1.6 * Math.cos(a), y(-22) + rr * 0.8 * Math.sin(a))
  }
  c.lineWidth = 0.9
  c.strokeStyle = ENCRE
  c.stroke()
  c.restore()
}

/** Saturne : des bandes dorées très douces, et l'hexagone du pôle nord. */
function saturne(c: Contexte): void {
  c.fillStyle = '#f2dfae'
  c.fillRect(0, 0, L, H)
  bande(c, 90, 55, '#d2b583', 1.5, 0.4, 0.9)
  bande(c, 30, 20, '#e6cf9c', 1, 1.6, 0.9)
  bande(c, -12, -24, '#dcc38f', 1, 2.2, 0.9)
  bande(c, -50, -90, '#d9c18e', 1.5, 0.9, 0.9)
  // L'hexagone : une bordure à six côtés autour du pôle nord.
  c.beginPath()
  for (let lon = -180; lon <= 180; lon += 2) {
    const a = ((lon + 180) % 60) / 60
    const lat = 76 + 3 * Math.abs(a - 0.5) * 2
    if (lon === -180) c.moveTo(x(lon), y(lat)); else c.lineTo(x(lon), y(lat))
  }
  c.lineTo(L, 0)
  c.lineTo(0, 0)
  c.closePath()
  c.fillStyle = '#c7aa7c'
  c.fill()
  c.lineWidth = 1.1
  c.strokeStyle = ENCRE
  c.stroke()
}

/** Uranus : presque uni, des bandes très pâles, le pôle plus clair cerclé d'un collier. */
function uranus(c: Contexte): void {
  c.fillStyle = '#bfe5e6'
  c.fillRect(0, 0, L, H)
  for (const lat of [-45, -20, 15, 35]) ondulation(c, lat, 1.2, 40, '#93c7cb', 1.4, lat)
  c.fillStyle = '#e3f4f3'
  c.fillRect(0, 0, L, y(58))
  ondulation(c, 58, 1, 30, '#93c7cb', 1.6)
  ondulation(c, 50, 0.8, 25, '#93c7cb', 1)
}

/** Neptune : bandes sombres au sud, la Grande Tache sombre et ses nuages blancs, le « Scooter », des cirrus. */
function neptune(c: Contexte): void {
  c.fillStyle = '#7f9be0'
  c.fillRect(0, 0, L, H)
  bande(c, -28, -42, '#6680c8', 1.5, 0.5, 0.9)
  bande(c, -55, -90, '#5d74b8', 2, 1.5, 0.9)
  bande(c, 50, 30, '#7590d8', 1, 2, 0)
  tache(c, 0, -20, 16, 8, '#3f528f', 1.4)
  nuages(c, 4, 31, -14, -10, '#f2f5fb', ENCRE)
  nuages(c, 14, 37, -50, 50, '#f2f5fb', '#8095c8')
  tache(c, 80, -42, 4, 2, '#f2f5fb', 1)
}

/** Pluton : le cœur de Tombaugh (Spoutnik, lisse et clair, et son lobe est), Cthulhu (sombre et roux), d'autres taches. */
function pluton(c: Contexte): void {
  c.fillStyle = '#e5cdb5'
  c.fillRect(0, 0, L, H)
  // Les régions sombres de l'équateur : Cthulhu, et Krun.
  contour(c, [[20, 12], [90, 8], [150, -5], [140, -25], [80, -22], [25, -10]], '#8f5a44')
  contour(c, [[-120, 5], [-60, 8], [-40, -12], [-90, -20], [-125, -12]], '#9b6a50')
  // Le cœur : Spoutnik Planitia (à l'ouest, lisse, en cellules) et le lobe est, plus pâle.
  contour(c, [[160, 45], [180, 40], [190, 15], [180, -10], [168, -15], [158, 5]], '#fbf4ea', 1.3)
  contour(c, [[180, 40], [215, 42], [235, 25], [225, 0], [195, -8], [190, 15]], '#f1e2cf', 1.1)
  for (const [a, b, cc, d] of [[162, 20, 182, 22], [164, 5, 182, 2], [172, 35, 170, -5]]) {
    c.beginPath()
    c.moveTo(x(a > 180 ? a - 360 : a), y(b))
    c.lineTo(x(cc > 180 ? cc - 360 : cc), y(d))
    c.lineWidth = 0.9
    c.strokeStyle = '#c9b49c'
    c.stroke()
  }
  crateres(c, 30, 41, 1, 4, null, (lon, lat) => lon > 150 && lat > -20 && lat < 50)
  // Le pôle nord, un peu roussi.
  c.fillStyle = '#d9b796'
  c.fillRect(0, 0, L, y(75))
  ondulation(c, 75, 1, 20, ENCRE, 0.9)
}

/**
 * La Lune : sa face visible (centrée sur la longitude 0) et ses mers sombres, Procellarum, Imbrium, Serenitatis,
 * Tranquillitatis, Crisium… ; sa face cachée, presque sans mers et criblée de cratères, avec l'immense bassin
 * Pôle Sud-Aitken ; Tycho et Copernic et leurs grands rayons clairs.
 */
function lune(c: Contexte): void {
  c.fillStyle = '#dcd6ca'
  c.fillRect(0, 0, L, H)
  // Le bassin Pôle Sud-Aitken, sur la face cachée : un grand aplat un peu plus sombre.
  tache(c, -170, -53, 45, 25, '#cbc4b6', 1)
  const mer = '#a9a49b'
  contour(c, [[-85, 45], [-55, 50], [-35, 30], [-25, 5], [-40, -15], [-60, -10], [-80, 5], [-88, 25]], mer) // Procellarum
  contour(c, [[-35, 45], [-5, 47], [5, 35], [-5, 22], [-25, 18], [-38, 28]], mer) // Imbrium
  contour(c, [[8, 37], [28, 36], [30, 22], [15, 17], [6, 25]], mer) // Serenitatis
  contour(c, [[20, 15], [42, 18], [45, 5], [32, -2], [20, 4]], mer) // Tranquillitatis
  contour(c, [[52, 22], [68, 22], [70, 12], [55, 10]], mer) // Crisium
  contour(c, [[42, 2], [58, 0], [58, -15], [45, -18]], mer) // Fecunditatis
  contour(c, [[28, -10], [40, -12], [38, -22], [28, -20]], mer) // Nectaris
  contour(c, [[-28, -12], [-8, -14], [-10, -30], [-25, -28]], mer) // Nubium
  contour(c, [[-45, -18], [-33, -18], [-33, -30], [-45, -28]], mer) // Humorum
  contour(c, [[-40, 60], [40, 60], [45, 52], [-35, 52]], mer) // Frigoris
  contour(c, [[140, 32], [154, 30], [152, 22], [142, 22]], mer) // Moscoviense (face cachée)
  crateres(c, 220, 53, 0.8, 6, null, (lon, lat) => Math.abs(lon) < 75 && Math.abs(lat) < 50 && h2(lon, lat))
  // Tycho et Copernic, cratères jeunes aux grands rayons clairs.
  const h = hasard(97)
  for (const [lon0, lat0, n, l] of [[-11, -43, 18, 35], [-20, 10, 14, 18]]) {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 2 * Math.PI + h(), d = l * (0.5 + h())
      c.beginPath()
      c.moveTo(x(lon0), y(lat0))
      c.lineTo(x(lon0 + (d * Math.cos(a)) / Math.cos(lat0 * RAD)), y(lat0 + d * Math.sin(a)))
      c.lineWidth = 2
      c.strokeStyle = '#f6f2ea'
      c.stroke()
    }
    tache(c, lon0, lat0, 2.2, 2.2, '#f6f2ea', 1.1)
  }
}
/** Sur la face visible, les mers ont peu de cratères : on en garde un sur quatre. */
function h2(lon: number, lat: number): boolean {
  return Math.sin(lon * 12.9898 + lat * 78.233) * 43758.5453 % 1 > -0.5
}

/** Les astres qui tournent, et leur planisphère. */
export const PLANISPHERES: Readonly<Record<string, (c: Contexte) => void>> = {
  Terre: terre, Lune: lune, Mercure: mercure, Vénus: venus, Mars: mars, Jupiter: jupiter, Saturne: saturne, Uranus: uranus, Neptune: neptune, Pluton: pluton,
}
