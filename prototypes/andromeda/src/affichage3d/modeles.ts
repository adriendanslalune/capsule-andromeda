// Modèles 3D, en kilomètres (l'unité de la scène) : la capsule Andromeda (type Apollo), les engins (d'après les plans
// des silhouettes 2D, auxquels on donne de l'épaisseur) et les petites lunes en cailloux.
// Chaque modèle vient avec ses coques de contour (voir materiaux.ts).

import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { SILHOUETTES, SONDE, graineDe, type Primitive } from './plans'
import { PALETTE } from './couleurs'
import { COULEURS, materiauCoque, materiauObjet } from './materiaux'

const M = 0.001 // un mètre, en km

/** Peint toute une pièce d'une couleur (attribut « teinteSommet », lu par le matériau des objets). */
function peindre(g: THREE.BufferGeometry, couleur: string): THREE.BufferGeometry {
  const c = new THREE.Color(couleur)
  const n = g.getAttribute('position').count
  const t = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) t.set([c.r, c.g, c.b], 3 * i)
  g.setAttribute('teinteSommet', new THREE.BufferAttribute(t, 3))
  return g
}

/**
 * Objet modelé : la forme jour / nuit et ses deux coques (contour intérieur, puis extérieur autour). Les coques se dessinent
 * avant l'objet et ne marquent pas la profondeur : l'objet les recouvre, sauf sur le pourtour.
 */
export function objetAvecContours(geometrie: THREE.BufferGeometry): THREE.Group {
  const groupe = new THREE.Group()
  // Normales lissées pour les coques (sinon elles s'ouvrent aux arêtes vives).
  const lisse = new THREE.BufferGeometry()
  lisse.setAttribute('position', geometrie.getAttribute('position'))
  if (geometrie.index) lisse.setIndex(geometrie.index)
  const coque = mergeVertices(lisse.index ? lisse.toNonIndexed() : lisse, 1e-7)
  coque.computeVertexNormals()
  const noire = new THREE.Mesh(coque, materiauCoque(COULEURS.contourExt, 2.2))
  const blanche = new THREE.Mesh(coque, materiauCoque(COULEURS.contourInt, 1.1))
  const forme = new THREE.Mesh(geometrie, materiauObjet())
  if (geometrie.getAttribute('teinteSommet')) (forme.material as THREE.ShaderMaterial).uniforms.aTeintes.value = 1
  noire.renderOrder = 10
  blanche.renderOrder = 11
  forme.renderOrder = 12
  for (const m of [noire, blanche, forme]) { m.frustumCulled = false; groupe.add(m) }
  return groupe
}

/**
 * Capsule Andromeda, type Apollo : module de commande conique (3,9 m de diamètre), module de service cylindrique,
 * tuyère, quatre blocs de petits moteurs. Longueur ≈ 13 m. Le nez pointe vers +x.
 */
export function geometrieCapsule(): THREE.BufferGeometry {
  const profil = [
    [0, 5.7], [0.35, 5.7], [0.35, 5.35], [0.6, 5.25], [1.95, 2.45], [1.98, 2.3], [1.95, 2.15], [1.95, -4.9],
    [1.55, -5.15], [0.55, -5.25], [0.6, -5.5], [1.0, -6.6], [1.3, -7.6], [0, -7.6],
  ].reverse().map(([r, y]) => new THREE.Vector2(r * M, y * M))
  // Couleurs façon BD : module de commande crème, module de service rouge cerise avec une bande moutarde,
  // tuyère couleur tôle, petits moteurs moutarde.
  const corps = new THREE.LatheGeometry(profil, 48).toNonIndexed()
  const pos = corps.getAttribute('position')
  const teintes = new Float32Array(3 * pos.count)
  const creme = new THREE.Color(PALETTE.papier), cerise = new THREE.Color(PALETTE.cerise)
  const moutarde = new THREE.Color(PALETTE.moutarde), tole = new THREE.Color(PALETTE.tole)
  for (let i = 0; i < pos.count; i += 3) {
    const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 / M // par triangle, pour des limites nettes
    const c = y > 2.2 ? creme : y > -0.4 && y < 0.6 ? moutarde : y > -5.0 ? cerise : tole
    for (let k = 0; k < 3; k++) teintes.set([c.r, c.g, c.b], 3 * (i + k))
  }
  corps.setAttribute('teinteSommet', new THREE.BufferAttribute(teintes, 3))
  const morceaux: THREE.BufferGeometry[] = [corps]
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4
    const bloc = new THREE.BoxGeometry(0.5 * M, 0.9 * M, 0.5 * M)
    bloc.translate(2.1 * M * Math.cos(a), 0.8 * M, 2.1 * M * Math.sin(a))
    morceaux.push(peindre(bloc.toNonIndexed(), PALETTE.moutarde))
  }
  // Antenne à grand gain, repliée contre l'arrière du module de service.
  const mat = new THREE.CylinderGeometry(0.06 * M, 0.06 * M, 2.4 * M, 6)
  mat.rotateZ(Math.PI / 2)
  mat.translate(3.1 * M, -4.2 * M, 0)
  morceaux.push(peindre(mat.toNonIndexed(), PALETTE.tole))
  const antenne = new THREE.CylinderGeometry(0.7 * M, 0.7 * M, 0.25 * M, 16)
  antenne.rotateZ(Math.PI / 2)
  antenne.translate(4.3 * M, -4.2 * M, 0)
  morceaux.push(peindre(antenne.toNonIndexed(), PALETTE.papier))
  const g = mergeGeometries(morceaux.map((m) => { m.deleteAttribute('uv'); return m }))!
  g.rotateZ(-Math.PI / 2) // axe de la capsule : de +y vers +x
  return g
}

/** Engin d'après son plan 2D (unités d'envergure) : chaque pièce prend une épaisseur. */
export function geometrieEngin(modele: string, tailleM: number): THREE.BufferGeometry {
  const plan: Primitive[] = SILHOUETTES[modele] ?? SONDE
  const k = tailleM * M
  const morceaux: THREE.BufferGeometry[] = []
  for (const p of plan) {
    let g: THREE.BufferGeometry
    switch (p[0]) {
      case 'rect': {
        const ep = Math.min(p[3], p[4])
        g = new THREE.BoxGeometry(p[3], p[4], ep)
        g.translate(p[1], p[2], 0)
        break
      }
      case 'panneau':
        g = new THREE.BoxGeometry(p[3], p[4], 0.01)
        g.translate(p[1], p[2], 0)
        break
      case 'disque':
        g = new THREE.CylinderGeometry(p[3], p[3] * 0.6, p[3] * 0.4, 24)
        g.rotateX(Math.PI / 2)
        g.translate(p[1], p[2], p[3] * 0.2)
        break
      case 'poly': {
        const forme = new THREE.Shape()
        forme.moveTo(p[1][0], p[1][1])
        for (let i = 2; i < p[1].length; i += 2) forme.lineTo(p[1][i], p[1][i + 1])
        g = new THREE.ExtrudeGeometry(forme, { depth: 0.03, bevelEnabled: false })
        g.translate(0, 0, -0.015)
        break
      }
      case 'trait': {
        const dx = p[3] - p[1], dy = p[4] - p[2], l = Math.hypot(dx, dy)
        g = new THREE.BoxGeometry(l, Math.max(p[5], 0.01), Math.max(p[5], 0.01))
        g.rotateZ(Math.atan2(dy, dx))
        g.translate((p[1] + p[3]) / 2, (p[2] + p[4]) / 2, 0)
        break
      }
    }
    g = g.index ? g.toNonIndexed() : g
    g.deleteAttribute('uv')
    // Couleurs façon BD : panneaux solaires bleus, corps en feuille d'or, antennes crème, perches couleur tôle ;
    // l'écran solaire de Webb rose argenté.
    const couleur = p[0] === 'panneau' ? PALETTE.panneau : p[0] === 'disque' ? PALETTE.papier
      : p[0] === 'trait' ? PALETTE.tole : p[0] === 'poly' ? (modele === 'webb' ? '#d7b3d8' : PALETTE.or)
        : modele === 'roadster' ? PALETTE.cerise : PALETTE.or
    morceaux.push(peindre(g, couleur))
  }
  const g = mergeGeometries(morceaux)!
  g.scale(k, k, k)
  return g
}

/** Petite lune en caillou : une boule bosselée et allongée, toujours la même pour une lune donnée (rayon 1). */
export function geometrieCaillou(nom: string): THREE.BufferGeometry {
  let graine = Math.floor(graineDe(nom) * 2 ** 31) || 1
  const hasard = () => ((graine = (graine * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const bosses = Array.from({ length: 7 }, () => {
    const u = hasard() * 2 - 1, a = hasard() * 2 * Math.PI, s = Math.sqrt(1 - u * u)
    return { d: new THREE.Vector3(s * Math.cos(a), s * Math.sin(a), u), h: (hasard() - 0.5) * 0.5, l: 0.6 + hasard() * 0.8 }
  })
  const allongement = new THREE.Vector3(1 + 0.4 * hasard(), 1, 1 - 0.25 * hasard())
  const g = new THREE.IcosahedronGeometry(1, 4)
  const p = g.getAttribute('position') as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize()
    let f = 1
    for (const b of bosses) f += b.h * Math.exp(-(1 - v.dot(b.d)) / (0.25 * b.l))
    v.multiplyScalar(f).multiply(allongement)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  const lisse = mergeVertices(g, 1e-6)
  lisse.computeVertexNormals()
  return lisse
}
