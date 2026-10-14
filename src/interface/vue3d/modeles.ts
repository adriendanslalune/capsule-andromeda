// Modèles 3D fabriqués à partir de formes simples (aucun fichier à charger).
// Unités : kilomètres (la fusée mesure environ 30 m, l'ISS 109 m d'envergure, la soucoupe 20 m).
// Axe de la fusée : +X (le nez). Le style reste neutre : couleurs du thème, matériaux mats.

import * as THREE from 'three'

const mat = (couleur: number, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.65, metalness: 0.15, ...options })

/** La fusée de croisière C-58 : corps crème, nez, bande et ailerons orange, hublot. */
export function modeleFusee(): THREE.Group {
  const g = new THREE.Group()
  const L = 0.03 // 30 m
  const R = 0.0028
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L * 0.62, 32), mat(0xefe6d2))
  corps.rotation.z = -Math.PI / 2
  g.add(corps)
  const nez = new THREE.Mesh(new THREE.ConeGeometry(R, L * 0.3, 32), mat(0xefe6d2))
  nez.rotation.z = -Math.PI / 2
  nez.position.x = L * 0.46
  g.add(nez)
  const bande = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, L * 0.07, 32), mat(0xe0743f))
  bande.rotation.z = -Math.PI / 2
  bande.position.x = -L * 0.05
  g.add(bande)
  const hublot = new THREE.Mesh(new THREE.CircleGeometry(R * 0.45, 24), mat(0x7f9db4, { metalness: 0.6, roughness: 0.2 }))
  hublot.position.set(L * 0.18, 0, R * 1.01)
  g.add(hublot)
  const forme = new THREE.Shape()
  forme.moveTo(0, 0)
  forme.lineTo(-L * 0.2, 0)
  forme.lineTo(-L * 0.26, R * 3.2)
  forme.lineTo(-L * 0.12, R * 1.0)
  forme.closePath()
  const aileron = new THREE.ExtrudeGeometry(forme, { depth: R * 0.25, bevelEnabled: false })
  for (let i = 0; i < 3; i++) {
    const a = new THREE.Mesh(aileron, mat(0xe0743f))
    a.position.x = -L * 0.05
    a.rotation.x = (i * 2 * Math.PI) / 3
    g.add(a)
  }
  const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.6, R * 0.9, L * 0.08, 24, 1, true), mat(0x4a4540, { side: THREE.DoubleSide }))
  tuyere.rotation.z = -Math.PI / 2
  tuyere.position.x = -L * 0.35
  g.add(tuyere)
  // Flamme (visible quand le moteur pousse).
  const flamme = new THREE.Mesh(new THREE.ConeGeometry(R * 0.7, L * 0.35, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85 }))
  flamme.rotation.z = Math.PI / 2
  flamme.position.x = -L * 0.56
  flamme.name = 'flamme'
  g.add(flamme)
  return g
}

/** La Station spatiale internationale, simplifiée : poutre, modules, panneaux solaires, radiateurs. */
export function modeleISS(): THREE.Group {
  const g = new THREE.Group()
  const poutre = new THREE.Mesh(new THREE.BoxGeometry(0.109, 0.003, 0.003), mat(0xbfbab0, { metalness: 0.5 }))
  g.add(poutre)
  const modules = new THREE.Mesh(new THREE.CylinderGeometry(0.0021, 0.0021, 0.05, 20), mat(0xe8e4dc, { metalness: 0.3 }))
  modules.rotation.x = Math.PI / 2
  g.add(modules)
  const panneau = mat(0x2c4a7a, { metalness: 0.4, roughness: 0.35, side: THREE.DoubleSide })
  for (const x of [-0.048, -0.034, 0.034, 0.048]) {
    for (const z of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.035), panneau)
      p.rotation.x = Math.PI / 2
      p.position.set(x, 0, z * 0.02)
      g.add(p)
    }
  }
  const radiateur = mat(0xf2f0ea, { side: THREE.DoubleSide })
  for (const x of [-0.012, 0.012]) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.02), radiateur)
    r.position.set(x, 0.012, 0)
    g.add(r)
  }
  return g
}

/** Soucoupe volante classique des années 50 : disque métallique, coupole vitrée, feux de bord qui tournent. */
export function modeleSoucoupe(): THREE.Group {
  const g = new THREE.Group()
  const R = 0.01 // 20 m de diamètre
  const profil = [
    new THREE.Vector2(0, -R * 0.18),
    new THREE.Vector2(R * 0.55, -R * 0.15),
    new THREE.Vector2(R, 0),
    new THREE.Vector2(R * 0.6, R * 0.12),
    new THREE.Vector2(R * 0.3, R * 0.16),
    new THREE.Vector2(0, R * 0.17),
  ]
  const disque = new THREE.Mesh(new THREE.LatheGeometry(profil, 48), mat(0xc8ccd0, { metalness: 0.9, roughness: 0.25 }))
  g.add(disque)
  const coupole = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.32, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x9fe8b0, transparent: true, opacity: 0.6, metalness: 0.2, roughness: 0.05, emissive: 0x1f6a33, emissiveIntensity: 0.4 }),
  )
  coupole.position.y = R * 0.15
  g.add(coupole)
  const feux = new THREE.Group()
  feux.name = 'feux'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const feu = new THREE.Mesh(new THREE.SphereGeometry(R * 0.045, 8, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd27a : 0x8cf0a0 }))
    feu.position.set(Math.cos(a) * R * 0.92, 0, Math.sin(a) * R * 0.92)
    feux.add(feu)
  }
  g.add(feux)
  const halo = new THREE.PointLight(0x8cf0a0, 2, R * 6, 0)
  g.add(halo)
  return g
}
