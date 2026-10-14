// Modèles 3D fabriqués à partir de formes et de textures peintes à la volée (aucun fichier à charger).
// Unités : kilomètres (la fusée mesure 30 m, la soucoupe 20 m ; l'ISS et les autres engins sont dans engins.ts).
// Axe de la fusée : +X (le nez). Style « pulp des années 50 » : carrosserie crème et rouge cerise, chrome, laiton.

import * as THREE from 'three'

// ---------------------------------------------------------------------------------------------------------------
// Peinture des textures

function toile(l: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = l
  c.height = h
  return [c, c.getContext('2d')!]
}

function texture(c: HTMLCanvasElement, repete = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Grain et salissures légères, pour que rien ne fasse « plastique neuf ». */
function salir(g: CanvasRenderingContext2D, l: number, h: number, force = 0.06, graine = 7) {
  let s = graine
  const hasard = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < (l * h) / 60; i++) {
    g.fillStyle = `rgba(${hasard() < 0.5 ? '40,25,10' : '255,255,255'},${hasard() * force})`
    g.fillRect(hasard() * l, hasard() * h, 1 + hasard() * 3, 1 + hasard() * 3)
  }
  // Coulures verticales.
  for (let i = 0; i < 40; i++) {
    const x = hasard() * l
    const d = g.createLinearGradient(0, 0, 0, h)
    d.addColorStop(0, 'rgba(60,40,20,0)')
    d.addColorStop(0.5, `rgba(60,40,20,${force * 0.6})`)
    d.addColorStop(1, 'rgba(60,40,20,0)')
    g.fillStyle = d
    g.fillRect(x, 0, 1 + hasard() * 4, h)
  }
}

/**
 * Carrosserie de la fusée. La texture s'enroule autour du fuselage : u = tour, v = de la queue (0) au nez (1).
 * Queue et nez rouges, milieu crème, bandes, panneaux rivetés, inscriptions peintes.
 */
function textureCarrosserie(): THREE.CanvasTexture {
  const [c, g] = toile(2048, 1024)
  const L = c.width, H = c.height
  const y = (v: number) => H * (1 - v) // v = 0 en bas (queue)
  g.fillStyle = '#efe2bf'
  g.fillRect(0, 0, L, H)
  // Queue rouge (avec pointe en flèche vers l'avant), nez rouge.
  g.fillStyle = '#c8302a'
  g.fillRect(0, y(0.26), L, H)
  for (let k = 0; k < 3; k++) {
    const x0 = (k / 3) * L
    g.beginPath()
    g.moveTo(x0, y(0.26))
    g.lineTo(x0 + L / 6, y(0.4))
    g.lineTo(x0 + L / 3, y(0.26))
    g.fill()
  }
  g.fillRect(0, 0, L, y(0.8))
  // Liserés moutarde.
  g.fillStyle = '#e9ad3a'
  g.fillRect(0, y(0.805), L, 10)
  g.fillRect(0, y(0.255), L, 8)
  // Panneaux : lignes de tôle et rivets.
  g.strokeStyle = 'rgba(40,25,15,0.35)'
  g.lineWidth = 2
  for (const v of [0.12, 0.26, 0.44, 0.6, 0.8, 0.9]) { g.beginPath(); g.moveTo(0, y(v)); g.lineTo(L, y(v)); g.stroke() }
  for (let k = 0; k < 12; k++) {
    const x = (k / 12) * L + 8
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke()
    for (let v = 0.02; v < 0.98; v += 0.018) {
      g.fillStyle = 'rgba(30,20,10,0.35)'
      g.beginPath(); g.arc(x + 6, y(v), 2.2, 0, Math.PI * 2); g.fill()
      g.fillStyle = 'rgba(255,255,255,0.35)'
      g.beginPath(); g.arc(x + 5.4, y(v) - 0.7, 1, 0, Math.PI * 2); g.fill()
    }
  }
  // Inscriptions : « C-58 » en grand, des deux côtés, et « O.N.V.I. ».
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (const u of [0.25, 0.75]) {
    g.save()
    g.translate(u * L, y(0.52))
    g.rotate(-Math.PI / 2)
    g.font = '900 150px "Bowlby One SC", "Arial Black", sans-serif'
    g.lineWidth = 10
    g.strokeStyle = '#22160f'
    g.strokeText('C-58', 0, 0)
    g.fillStyle = '#c8302a'
    g.fillText('C-58', 0, 0)
    g.restore()
    g.save()
    g.translate(u * L + 150, y(0.52))
    g.rotate(-Math.PI / 2)
    g.font = '700 46px "Barlow Condensed", "Arial Narrow", sans-serif'
    g.fillStyle = '#22160f'
    g.fillText('O.N.V.I. — SERVICE DES COMMISSIONS', 0, 0)
    g.restore()
  }
  // Damier de marquage sous le nez.
  for (let k = 0; k < 24; k++) {
    g.fillStyle = k % 2 ? '#22160f' : '#efe2bf'
    g.fillRect((k / 24) * L, y(0.78), L / 24, 26)
  }
  salir(g, L, H, 0.07)
  // Suie près de la tuyère.
  const suie = g.createLinearGradient(0, y(0), 0, y(0.18))
  suie.addColorStop(0, 'rgba(20,12,8,0.75)')
  suie.addColorStop(1, 'rgba(20,12,8,0)')
  g.fillStyle = suie
  g.fillRect(0, y(0.18), L, H)
  return texture(c)
}

/** Ailerons : rouge cerise, liseré crème, rivets le long du bord d'attaque. */
function textureAileron(): THREE.CanvasTexture {
  const [c, g] = toile(512, 512)
  g.fillStyle = '#c8302a'
  g.fillRect(0, 0, 512, 512)
  g.fillStyle = '#efe2bf'
  g.fillRect(0, 440, 512, 24)
  g.fillStyle = 'rgba(30,20,10,0.4)'
  for (let x = 20; x < 512; x += 26) { g.beginPath(); g.arc(x, 470, 3, 0, Math.PI * 2); g.fill() }
  salir(g, 512, 512, 0.08, 3)
  return texture(c)
}

// ---------------------------------------------------------------------------------------------------------------
// Matériaux

const peint = (options: THREE.MeshStandardMaterialParameters) =>
  new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.15, ...options })
const chrome = () => new THREE.MeshStandardMaterial({ color: 0xe8ecef, metalness: 1, roughness: 0.18 })
const laiton = () => new THREE.MeshStandardMaterial({ color: 0xd2a650, metalness: 1, roughness: 0.3 })

/** Profil de révolution lissé (rayon, hauteur), pour LatheGeometry. */
function profil(points: [number, number][], n = 80): THREE.Vector2[] {
  const courbe = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)))
  return courbe.getPoints(n).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y))
}

/** Pièce de révolution autour de l'axe +X. */
function tourne(points: THREE.Vector2[], materiau: THREE.Material, segments = 64): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.LatheGeometry(points, segments), materiau)
  m.rotation.z = -Math.PI / 2
  return m
}

// ---------------------------------------------------------------------------------------------------------------
// La fusée

/** La fusée de croisière C-58 (30 m) : fuselage galbé, ailerons effilés, hublots éclairés, tuyère. */
export function modeleFusee(): THREE.Group {
  const g = new THREE.Group()
  const L = 0.03
  const R = 0.0032
  // Rayon du fuselage selon la position y (de −0,4 L à la queue jusqu'à +0,5 L au nez).
  const forme: [number, number][] = [
    [0.5 * R, -0.4 * L], [0.78 * R, -0.36 * L], [0.94 * R, -0.26 * L], [R, -0.12 * L], [R, 0.02 * L],
    [0.96 * R, 0.14 * L], [0.84 * R, 0.26 * L], [0.62 * R, 0.37 * L], [0.34 * R, 0.45 * L], [0.0, 0.5 * L],
  ]
  const contour = profil(forme)
  const rayonA = (y: number) => {
    let meilleur = contour[0]
    for (const p of contour) if (Math.abs(p.y - y) < Math.abs(meilleur.y - y)) meilleur = p
    return meilleur.x
  }
  const corps = tourne(contour, peint({ map: textureCarrosserie(), roughness: 0.38, metalness: 0.2 }), 96)
  g.add(corps)

  // Bagues chromées.
  for (const y of [-0.3 * L, 0.0, 0.3 * L]) {
    const r = rayonA(y)
    const bague = new THREE.Mesh(new THREE.TorusGeometry(r * 1.005, R * 0.035, 10, 96), chrome())
    bague.rotation.y = Math.PI / 2
    bague.position.x = y
    g.add(bague)
  }
  // Pointe chromée du nez.
  const pointe = tourne(profil([[0.12 * R, 0], [0.06 * R, 0.04 * L], [0, 0.09 * L]], 20), chrome(), 32)
  pointe.position.x = 0.49 * L
  g.add(pointe)

  // Hublots en laiton, éclairés de l'intérieur.
  const vitre = new THREE.MeshStandardMaterial({ color: 0x3a5068, emissive: 0xffc56b, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.08 })
  for (const [x, angle] of [[0.16, 0], [0.08, 0], [0.0, 0], [0.16, Math.PI], [0.08, Math.PI], [0.0, Math.PI]] as const) {
    const xh = x * L
    const r = rayonA(xh)
    const support = new THREE.Group()
    const cercle = new THREE.Mesh(new THREE.TorusGeometry(R * 0.2, R * 0.05, 10, 32), laiton())
    const verre = new THREE.Mesh(new THREE.CircleGeometry(R * 0.2, 32), vitre)
    cercle.position.z = r * 1.0
    verre.position.z = r * 0.995
    support.add(cercle, verre)
    support.position.x = xh
    support.rotation.x = angle
    g.add(support)
  }

  // Ailerons : grands, effilés, balayés vers l'arrière, avec une boule chromée au bout.
  const f = new THREE.Shape()
  f.moveTo(0.02 * L, 0)
  f.quadraticCurveTo(-0.06 * L, R * 0.4, -0.26 * L, R * 3.3)
  f.quadraticCurveTo(-0.33 * L, R * 3.6, -0.36 * L, R * 3.1)
  f.quadraticCurveTo(-0.33 * L, R * 1.6, -0.38 * L, 0)
  f.closePath()
  const aileron = new THREE.ExtrudeGeometry(f, { depth: R * 0.16, bevelEnabled: true, bevelThickness: R * 0.05, bevelSize: R * 0.05, bevelSegments: 3, curveSegments: 24 })
  aileron.translate(0, 0, -R * 0.08)
  // UV simples (projection latérale) pour la texture.
  aileron.computeBoundingBox()
  const bb = aileron.boundingBox!
  const pos = aileron.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x)
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)
  }
  aileron.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  const matAileron = peint({ map: textureAileron(), roughness: 0.32 })
  for (let i = 0; i < 3; i++) {
    const support = new THREE.Group()
    const a = new THREE.Mesh(aileron, matAileron)
    a.position.y = R * 0.6
    const fuseau = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.14, 0.08 * L, 6, 16), chrome())
    fuseau.rotation.z = Math.PI / 2
    fuseau.position.set(-0.32 * L, R * 0.6 + R * 3.45, 0)
    support.add(a, fuseau)
    support.rotation.x = (i * 2 * Math.PI) / 3 + Math.PI / 2
    g.add(support)
  }

  // Tuyère : cloche en métal bleui par la chaleur, intérieur rougeoyant.
  const cloche = profil([[0.42 * R, 0], [0.5 * R, -0.03 * L], [0.68 * R, -0.07 * L], [0.86 * R, -0.1 * L]], 24)
  const tuyere = tourne(cloche, new THREE.MeshStandardMaterial({ color: 0x5a5f70, metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide }), 48)
  tuyere.position.x = -0.4 * L
  g.add(tuyere)
  const foyer = new THREE.Mesh(new THREE.CircleGeometry(0.44 * R, 32), new THREE.MeshBasicMaterial({ color: 0xff8a3a }))
  foyer.rotation.y = -Math.PI / 2
  foyer.position.x = -0.402 * L
  foyer.name = 'foyer'
  g.add(foyer)

  // Antenne fouet sur le dos.
  const antenne = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.015, R * 0.02, R * 2.2, 8), chrome())
  antenne.position.set(0.05 * L, R * 1.95, 0)
  antenne.rotation.z = -0.35
  g.add(antenne)
  const bouton = new THREE.Mesh(new THREE.SphereGeometry(R * 0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff4a2a }))
  bouton.position.set(0.05 * L + Math.sin(0.35) * R * 1.1, R * 1.95 + Math.cos(0.35) * R * 1.1, 0)
  bouton.name = 'feu'
  g.add(bouton)

  // Flamme (visible quand le moteur pousse) : cœur bleu, panache orangé.
  const flamme = new THREE.Group()
  flamme.name = 'flamme'
  const coeur = new THREE.Mesh(new THREE.ConeGeometry(R * 0.4, L * 0.22, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }))
  coeur.rotation.z = Math.PI / 2
  coeur.position.x = -0.51 * L
  const panache = new THREE.Mesh(new THREE.ConeGeometry(R * 0.8, L * 0.5, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
  panache.rotation.z = Math.PI / 2
  panache.position.x = -0.65 * L
  flamme.add(coeur, panache)
  g.add(flamme)
  return g
}

// ---------------------------------------------------------------------------------------------------------------
// Le visiteur

/** Soucoupe volante classique des années 50 : disque chromé à nervures, coupole, hublots, feux qui tournent. */
export function modeleSoucoupe(): THREE.Group {
  const g = new THREE.Group()
  const R = 0.01 // 20 m de diamètre
  const disque = new THREE.Mesh(new THREE.LatheGeometry(profil([
    [0, -R * 0.2], [R * 0.35, -R * 0.19], [R * 0.7, -R * 0.12], [R, -R * 0.01], [R * 0.98, R * 0.02],
    [R * 0.7, R * 0.1], [R * 0.4, R * 0.16], [0, R * 0.18],
  ]), 96), new THREE.MeshStandardMaterial({ color: 0xdfe4e8, metalness: 1, roughness: 0.2 }))
  g.add(disque)
  // Nervures concentriques.
  for (const k of [0.45, 0.62, 0.8]) {
    const n = new THREE.Mesh(new THREE.TorusGeometry(R * k, R * 0.008, 6, 96), chrome())
    n.rotation.x = Math.PI / 2
    n.position.y = R * (0.17 - k * 0.12)
    g.add(n)
  }
  // Anneau lumineux dessous.
  const anneau = new THREE.Mesh(new THREE.TorusGeometry(R * 0.32, R * 0.04, 12, 64), new THREE.MeshBasicMaterial({ color: 0x8cf0ff }))
  anneau.rotation.x = Math.PI / 2
  anneau.position.y = -R * 0.19
  g.add(anneau)
  // Coupole vitrée, avec une silhouette à l'intérieur.
  const coupole = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.32, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x9fe8b0, transparent: true, opacity: 0.45, metalness: 0.1, roughness: 0.02, emissive: 0x1f6a33, emissiveIntensity: 0.5 }),
  )
  coupole.position.y = R * 0.16
  g.add(coupole)
  const pilote = new THREE.Mesh(new THREE.SphereGeometry(R * 0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x5fbf6a, roughness: 0.6 }))
  pilote.position.y = R * 0.27
  pilote.scale.set(1, 1.3, 1)
  g.add(pilote)
  // Hublots tout autour.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const h = new THREE.Mesh(new THREE.CircleGeometry(R * 0.035, 16), new THREE.MeshBasicMaterial({ color: 0xfff1a8 }))
    h.position.set(Math.cos(a) * R * 0.84, R * 0.06, Math.sin(a) * R * 0.84)
    h.lookAt(Math.cos(a) * R * 2, R * 0.3, Math.sin(a) * R * 2)
    g.add(h)
  }
  // Antenne.
  const antenne = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.006, R * 0.006, R * 0.25, 8), chrome())
  antenne.position.y = R * 0.6
  g.add(antenne)
  // Feux de bord qui tournent.
  const feux = new THREE.Group()
  feux.name = 'feux'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const feu = new THREE.Mesh(new THREE.SphereGeometry(R * 0.045, 8, 8), new THREE.MeshBasicMaterial({ color: [0xffd27a, 0x8cf0a0, 0xff6b5a][i % 3] }))
    feu.position.set(Math.cos(a) * R * 0.99, 0, Math.sin(a) * R * 0.99)
    feux.add(feu)
  }
  g.add(feux)
  const halo = new THREE.PointLight(0x8cf0a0, 2, R * 6, 0)
  g.add(halo)
  return g
}

/** Donne aux pièces métalliques d'un modèle les reflets de l'environnement. */
export function refleter(modele: THREE.Object3D, environnement: THREE.Texture, intensite = 1) {
  modele.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
    if (m && m.isMeshStandardMaterial) { m.envMap = environnement; m.envMapIntensity = intensite; m.needsUpdate = true }
  })
}
