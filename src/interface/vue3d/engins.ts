// Modèles 3D des engins humains, aux vraies dimensions (unités : km ; 1 m = 0,001).
// L'ISS (109 m d'envergure), Hubble (13 m), James Webb (pare-soleil de 21 m), Voyager (antenne de 3,7 m).
// Formes simplifiées mais fidèles : proportions, nombre et place des éléments, couleurs réelles.

import * as THREE from 'three'

const M = 0.001 // un mètre, en km

// ---------------------------------------------------------------------------------------------------------------
// Textures peintes

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

/** Couverture solaire : cellules dans une grille (les ailes de l'ISS sont cuivrées, les iROSA bleu nuit). */
function textureCellules(fond: string, cellule: string, colonnes: number, rangees: number): THREE.CanvasTexture {
  const [c, g] = toile(256, 1024)
  g.fillStyle = fond
  g.fillRect(0, 0, 256, 1024)
  const l = 256 / colonnes, h = 1024 / rangees
  g.fillStyle = cellule
  for (let i = 0; i < colonnes; i++) for (let j = 0; j < rangees; j++) g.fillRect(i * l + 1.5, j * h + 1.5, l - 3, h - 3)
  // Bandes plus claires tous les 10 rangs (charnières des panneaux pliés en accordéon).
  g.fillStyle = 'rgba(255,255,255,0.18)'
  for (let j = 0; j < rangees; j += 10) g.fillRect(0, j * h, 256, 2)
  return texture(c)
}

/** Couverture isolante (blanche matelassée) des modules pressurisés. */
function textureIsolant(): THREE.CanvasTexture {
  const [c, g] = toile(512, 256)
  g.fillStyle = '#ecebe6'
  g.fillRect(0, 0, 512, 256)
  g.strokeStyle = 'rgba(110,105,95,0.35)'
  g.lineWidth = 2
  for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke() }
  for (let y = 0; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke() }
  g.fillStyle = 'rgba(120,115,100,0.25)'
  for (let k = 0; k < 120; k++) g.fillRect((k * 97) % 512, (k * 53) % 256, 3, 3)
  const t = texture(c, true)
  t.repeat.set(3, 1)
  return t
}

/** Feuille d'aluminium argentée de Hubble : panneaux rectangulaires. */
function textureHubble(): THREE.CanvasTexture {
  const [c, g] = toile(512, 512)
  g.fillStyle = '#c9ccd0'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 6; j++) {
      g.fillStyle = (i + j) % 3 === 0 ? '#d8dade' : (i + j) % 3 === 1 ? '#bfc2c6' : '#cdd0d4'
      g.fillRect(i * 64 + 2, j * 85 + 2, 60, 81)
    }
  }
  return texture(c, true)
}

// ---------------------------------------------------------------------------------------------------------------
// Matériaux (mats : pas de reflets métalliques)

const mat = (couleur: number, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.7, metalness: 0.1, ...options })

function cylindre(r: number, l: number, m: THREE.Material, axe: 'x' | 'y' | 'z', segments = 24): THREE.Mesh {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segments), m)
  if (axe === 'x') c.rotation.z = Math.PI / 2
  if (axe === 'z') c.rotation.x = Math.PI / 2
  return c
}
function boite(x: number, y: number, z: number, m: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m)
}
/** Plan horizontal (normale +Y), de largeur x et de longueur z. */
function plaque(x: number, z: number, m: THREE.Material): THREE.Mesh {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(x, z), m)
  p.rotation.x = -Math.PI / 2
  return p
}
function placer<T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T {
  o.position.set(x, y, z)
  return o
}

// ---------------------------------------------------------------------------------------------------------------
// L'ISS

/**
 * La Station spatiale internationale : la poutre (109 m) porte huit ailes solaires cuivrées (35 m × 12 m, deux
 * couvertures de part et d'autre d'un mât), six iROSA bleu nuit par-dessus, et les grands radiateurs blancs.
 * Sous la poutre, l'enfilade des modules : PMA-2, Harmony (avec Columbus et Kibo), Destiny, Unity (avec Tranquility
 * et la Coupole), Zarya, Zvezda et ses deux ailes, un cargo Progress ; Nauka et un Soyouz sous la partie russe.
 * Axe de la poutre : X ; enfilade des modules : Z (l'avant vers +Z) ; +Y vers le zénith.
 */
export function modeleISSFidele(): THREE.Group {
  const g = new THREE.Group()
  const isolant = mat(0xffffff, { map: textureIsolant() })
  const metal = mat(0xb4b2ab, { roughness: 0.55, metalness: 0.25 })
  const sombre = mat(0x5d5b56)
  const blanc = mat(0xf3f2ee, { side: THREE.DoubleSide })

  // Poutre en treillis : un caisson carré de 109 m, avec ses joints tournants (SARJ) vers ±33 m.
  g.add(boite(109 * M, 4.5 * M, 4.5 * M, metal))
  for (const x of [-33.5, 33.5]) g.add(placer(cylindre(3.2 * M, 2.4 * M, sombre, 'x'), x * M, 0, 0))
  // Barres de treillis apparentes : croisillons foncés sur la poutre.
  for (let x = -52; x <= 52; x += 4) g.add(placer(boite(0.25 * M, 4.7 * M, 4.7 * M, sombre), x * M, 0, 0))

  // Huit ailes solaires : quatre modules (P6, P4, S4, S6), deux ailes chacun (vers +Z et -Z).
  const cuivre = mat(0xffffff, { map: textureCellules('#6a3f1c', '#b0662a', 4, 82), side: THREE.DoubleSide, roughness: 0.5 })
  const irosa = mat(0xffffff, { map: textureCellules('#1b2230', '#2b3d63', 3, 40), side: THREE.DoubleSide, roughness: 0.45 })
  const mats = mat(0xd9d6cc)
  let n = 0
  for (const x of [-52, -38.5, 38.5, 52]) {
    for (const cote of [-1, 1]) {
      const aile = new THREE.Group()
      // Deux couvertures de 4,6 m de large, de part et d'autre du mât (35 m de long).
      for (const dx of [-3.4, 3.4]) aile.add(placer(plaque(4.6 * M, 33 * M, cuivre), dx * M, 0, cote * 19 * M))
      aile.add(placer(cylindre(0.25 * M, 35 * M, mats, 'z', 6), 0, 0, cote * 19 * M))
      // Boîte de rangement au pied de l'aile.
      aile.add(placer(boite(11.6 * M, 0.6 * M, 1.2 * M, sombre), 0, 0, cote * 2.4 * M))
      // iROSA (six ailes sur huit) : plus courte, posée en biais au-dessus.
      if (n % 4 !== 3) {
        const r = placer(plaque(6 * M, 19 * M, irosa), 0, 1.6 * M, cote * 12 * M)
        r.rotation.z = 0.12 * cote
        aile.add(r)
      }
      aile.position.x = x * M
      // Les ailes suivent le Soleil : légère inclinaison (joint bêta).
      aile.rotation.x = 0.35
      g.add(aile)
      n++
    }
  }

  // Grands radiateurs (S1, P1) : trois panneaux blancs de 23 m, vers le bas, en éventail.
  for (const x of [-22, 22]) {
    for (let k = 0; k < 3; k++) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * M, 23 * M), blanc)
      r.position.set(x * M, -13 * M, (k - 1) * 3.6 * M - 6 * M)
      r.rotation.y = Math.PI / 2 + (k - 1) * 0.12
      g.add(r)
    }
  }
  // Petits radiateurs des modules solaires.
  for (const x of [-45, 45]) g.add(placer(boite(0.3 * M, 9 * M, 13 * M, blanc), x * M, -6 * M, 0))

  // Enfilade des modules, sous la poutre (y = -4,5 m).
  const y = -4.6 * M
  const module = (r: number, l: number, z: number, m: THREE.Material = isolant) => g.add(placer(cylindre(r * M, l * M, m, 'z'), 0, y, z * M))
  module(2.2, 8.5, 0) // Destiny, sous la poutre
  module(2.2, 7.2, 7.9) // Harmony
  g.add(placer(new THREE.Mesh(new THREE.ConeGeometry(1.4 * M, 2 * M, 20), metal).rotateX(Math.PI / 2), 0, y, 12.6 * M)) // PMA-2
  module(2.25, 5.5, -7.1) // Unity
  module(2.05, 12.6, -16.4) // Zarya
  module(2.1, 13.1, -29.3) // Zvezda
  module(1.35, 7.2, -39.5, mat(0x9ea58e)) // Progress (cargo, vert kaki)
  // Columbus (tribord) et Kibo (bâbord, 11 m, avec sa plateforme extérieure et son module logistique).
  g.add(placer(cylindre(2.2 * M, 6.9 * M, isolant, 'x'), 5.7 * M, y, 7.9 * M))
  g.add(placer(cylindre(2.2 * M, 11.2 * M, isolant, 'x'), -7.8 * M, y, 7.9 * M))
  g.add(placer(boite(5 * M, 1.2 * M, 5 * M, metal), -15.8 * M, y, 7.9 * M))
  g.add(placer(cylindre(2.2 * M, 4.2 * M, isolant, 'y'), -7.8 * M, y + 4.3 * M, 7.9 * M))
  // Tranquility (bâbord d'Unity) et la Coupole, vers la Terre.
  g.add(placer(cylindre(2.2 * M, 6.7 * M, isolant, 'x'), -5.6 * M, y, -7.1 * M))
  const coupole = new THREE.Mesh(new THREE.CylinderGeometry(1.0 * M, 1.5 * M, 1.5 * M, 7), mat(0x7e8a96))
  g.add(placer(coupole, -5.6 * M, y - 3 * M, -7.1 * M))
  // Ailes de Zvezda (30 m d'envergure), bleues.
  const bleu = mat(0xffffff, { map: textureCellules('#1c2c55', '#3a5a9c', 3, 30), side: THREE.DoubleSide, roughness: 0.45 })
  for (const cote of [-1, 1]) {
    const p = placer(new THREE.Mesh(new THREE.PlaneGeometry(10.5 * M, 3.4 * M), bleu), cote * 8.8 * M, y, -32 * M)
    p.rotation.x = Math.PI / 2 - 0.2
    g.add(p)
  }
  // Nauka (vers la Terre, sous Zvezda) et un Soyouz (vers le zénith, sur Poisk).
  g.add(placer(cylindre(2.1 * M, 13 * M, isolant, 'y'), 0, y - 8.6 * M, -24 * M))
  g.add(placer(cylindre(1.35 * M, 7 * M, mat(0x8c9478), 'y'), 0, y + 5.6 * M, -24 * M))
  for (const cote of [-1, 1]) {
    const p = placer(new THREE.Mesh(new THREE.PlaneGeometry(4 * M, 1.4 * M), bleu), cote * 3.6 * M, y + 5.2 * M, -24 * M)
    p.rotation.x = Math.PI / 2
    g.add(p)
  }
  // Bras robotique Canadarm2 : deux segments de 8,5 m, coudés, sur la poutre.
  const bras = mat(0xf0eee6)
  const b1 = placer(cylindre(0.2 * M, 8.5 * M, bras, 'y', 10), 8 * M, 5.5 * M, 2 * M)
  b1.rotation.z = -0.5
  const b2 = placer(cylindre(0.2 * M, 8.5 * M, bras, 'y', 10), 12.5 * M, 7.6 * M, 6 * M)
  b2.rotation.x = 1.1
  g.add(b1, b2)
  return g
}

// ---------------------------------------------------------------------------------------------------------------
// Hubble

/** Le télescope Hubble : tube argenté de 13,2 m (4,2 m de diamètre), porte d'ouverture, deux ailes solaires. */
export function modeleHubble(): THREE.Group {
  const g = new THREE.Group()
  const argent = mat(0xffffff, { map: textureHubble(), roughness: 0.5 })
  g.add(cylindre(2.1 * M, 13.2 * M, argent, 'x', 32))
  // Partie arrière, un peu plus large, et ses instruments.
  g.add(placer(cylindre(2.15 * M, 3.6 * M, mat(0xb9bcc0), 'x', 32), -4.8 * M, 0, 0))
  // Porte d'ouverture, ouverte.
  const porte = new THREE.Mesh(new THREE.CircleGeometry(1.6 * M, 32), mat(0xd6d8db, { side: THREE.DoubleSide }))
  porte.position.set(7.2 * M, 1.8 * M, 0)
  porte.rotation.z = -1.1
  porte.rotation.y = Math.PI / 2
  g.add(porte)
  g.add(placer(new THREE.Mesh(new THREE.CircleGeometry(1.95 * M, 32), mat(0x101418)).rotateY(Math.PI / 2), 6.61 * M, 0, 0))
  // Deux ailes solaires (7,1 × 2,6 m), de part et d'autre.
  const cellules = mat(0xffffff, { map: textureCellules('#1d2333', '#4b4f8c', 6, 26), side: THREE.DoubleSide })
  for (const cote of [-1, 1]) {
    g.add(placer(cylindre(0.08 * M, 2.2 * M, mat(0xcfcfcf), 'z', 6), 0.5 * M, 0, cote * 3.1 * M))
    g.add(placer(plaque(7.1 * M, 2.6 * M, cellules), 0.5 * M, 0, cote * 5.4 * M))
  }
  // Antennes à grand gain, sur leurs mâts.
  for (const cote of [-1, 1]) {
    g.add(placer(cylindre(0.06 * M, 4 * M, mat(0xcfcfcf), 'y', 6), 0, cote * 3.9 * M, 0))
    const plat = new THREE.Mesh(new THREE.SphereGeometry(0.65 * M, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), mat(0xeeeeee, { side: THREE.DoubleSide }))
    plat.position.set(0, cote * 6 * M, 0)
    if (cote < 0) plat.rotation.x = Math.PI
    g.add(plat)
  }
  return g
}

// ---------------------------------------------------------------------------------------------------------------
// James Webb

/**
 * Le télescope James Webb : pare-soleil en cerf-volant de 21 × 14 m (cinq voiles violacées), miroir de 6,5 m fait
 * de 18 segments hexagonaux dorés, miroir secondaire au bout de trois bras, plateforme et panneau solaire dessous.
 */
export function modeleWebb(): THREE.Group {
  const g = new THREE.Group()
  const voile = mat(0xc9b6d6, { side: THREE.DoubleSide, roughness: 0.5 })
  const forme = new THREE.Shape()
  const pts: [number, number][] = [[-10.5, 0], [-6.5, 7.1], [6.5, 7.1], [10.5, 0], [6.5, -7.1], [-6.5, -7.1]]
  forme.moveTo(pts[0][0] * M, pts[0][1] * M)
  for (const [x, z] of pts.slice(1)) forme.lineTo(x * M, z * M)
  for (let k = 0; k < 5; k++) {
    const v = new THREE.Mesh(new THREE.ShapeGeometry(forme), voile)
    v.rotation.x = -Math.PI / 2
    v.scale.setScalar(1 - k * 0.035)
    v.position.y = k * 0.3 * M
    g.add(v)
  }
  // Miroir primaire : 18 hexagones dorés (1,32 m), autour d'un trou central, presque vertical.
  const or = mat(0xd9a83a, { roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide })
  const miroir = new THREE.Group()
  const hex = new THREE.CircleGeometry(0.7 * M, 6)
  const pas = 1.36 * M
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      const s = -q - r
      const anneau = Math.max(Math.abs(q), Math.abs(r), Math.abs(s))
      if (anneau === 0 || anneau > 2) continue
      // Première couronne : 6 hexagones ; deuxième : 12 ; 18 en tout.
      const h = new THREE.Mesh(hex, or)
      h.position.set(pas * (q + r / 2), pas * (r * Math.sqrt(3) / 2), 0)
      h.rotation.z = Math.PI / 6
      miroir.add(h)
    }
  }
  miroir.position.set(0, 4.2 * M, 0)
  miroir.rotation.x = -0.1
  g.add(miroir)
  // Miroir secondaire au bout de trois bras.
  const bras = mat(0x3a3a3a)
  for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    const b = cylindre(0.05 * M, 7.4 * M, bras, 'z', 6)
    b.position.set(Math.cos(a) * 1.4 * M, 4.2 * M + Math.sin(a) * 1.4 * M, 3.6 * M)
    b.rotation.y = Math.cos(a) * -0.18
    b.rotation.x = Math.PI / 2 + Math.sin(a) * 0.18
    g.add(b)
  }
  g.add(placer(new THREE.Mesh(new THREE.CircleGeometry(0.37 * M, 24), or), 0, 4.2 * M, 7.2 * M))
  // Instruments derrière le miroir, plateforme sous le pare-soleil, panneau solaire.
  g.add(placer(boite(2.2 * M, 2.2 * M, 1.4 * M, mat(0x2c2c2c)), 0, 3.6 * M, -1 * M))
  g.add(placer(boite(2.6 * M, 1.6 * M, 2.6 * M, mat(0xb98f3a)), 0, -1.2 * M, 0))
  g.add(placer(plaque(6 * M, 2 * M, mat(0xffffff, { map: textureCellules('#1b2230', '#2b3d63', 8, 20), side: THREE.DoubleSide })), -4.2 * M, -1.6 * M, 0))
  return g
}

// ---------------------------------------------------------------------------------------------------------------
// Voyager

/**
 * Une sonde Voyager : grande antenne blanche (3,7 m) sur un corps à dix faces, perche du magnétomètre (13 m),
 * perche des trois générateurs à radio-isotopes, perche scientifique et sa plateforme orientable.
 */
export function modeleVoyager(): THREE.Group {
  const g = new THREE.Group()
  // Antenne parabolique, tournée vers +X (vers la Terre).
  const antenne = new THREE.Mesh(new THREE.SphereGeometry(2.9 * M, 32, 12, 0, Math.PI * 2, 0, 0.68), mat(0xf2f0ea, { side: THREE.DoubleSide }))
  antenne.rotation.z = Math.PI / 2
  antenne.position.x = -1.8 * M
  g.add(antenne)
  g.add(placer(cylindre(0.08 * M, 1.6 * M, mat(0xcfcfcf), 'x', 6), 1.5 * M, 0, 0))
  // Corps décagonal, couvert d'isolant doré et noir.
  g.add(placer(new THREE.Mesh(new THREE.CylinderGeometry(0.9 * M, 0.9 * M, 0.47 * M, 10), mat(0x2b2723)).rotateZ(Math.PI / 2), -1.3 * M, 0, 0))
  g.add(placer(new THREE.Mesh(new THREE.CylinderGeometry(0.55 * M, 0.55 * M, 0.5 * M, 16), mat(0xc49a3c)).rotateZ(Math.PI / 2), -1.8 * M, 0, 0))
  // Perche du magnétomètre (13 m), en treillis fin.
  const perche = placer(cylindre(0.05 * M, 13 * M, mat(0xd8d8d8), 'y', 6), -1.3 * M, 6.3 * M, 1.5 * M)
  perche.rotation.x = -0.25
  g.add(perche)
  // Perche des générateurs (RTG) : trois cylindres ailetés.
  const rtg = new THREE.Group()
  rtg.add(placer(cylindre(0.05 * M, 3 * M, mat(0xcfcfcf), 'z', 6), 0, 0, 1.5 * M))
  for (let k = 0; k < 3; k++) rtg.add(placer(cylindre(0.2 * M, 0.55 * M, mat(0x4a4a4a), 'z', 8), 0, 0, (1.4 + k * 0.6) * M))
  rtg.position.set(-1.3 * M, -0.6 * M, -0.6 * M)
  rtg.rotation.x = 0.6
  rtg.rotation.y = Math.PI
  g.add(rtg)
  // Perche scientifique et plateforme (caméras).
  const sci = placer(cylindre(0.06 * M, 2.3 * M, mat(0xcfcfcf), 'z', 6), -1.3 * M, 0.3 * M, 1.7 * M)
  g.add(sci)
  g.add(placer(boite(0.5 * M, 0.5 * M, 0.8 * M, mat(0x3a3a3a)), -1.3 * M, 0.3 * M, 3 * M))
  return g
}
