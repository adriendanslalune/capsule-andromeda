// Vue 3D « dehors » : la fusée au centre, le vrai ciel, le Soleil, les planètes, la Lune, les satellites proches,
// l'ISS et le visiteur, chacun à sa vraie position (en km) et à sa vraie taille. Les astres trop lointains pour être
// vus restent signalés par un point lumineux. La caméra tourne autour de la fusée au doigt.

import * as THREE from 'three'
import terreUrl from '../../../assets/textures/terre_lc.jpg?url'
import luneUrl from '../../../assets/textures/lune_lc.jpg?url'
import { corpsDuSysteme, estPlanete, positionCorps } from '../../astro/corps'
import { satellite } from '../../astro/satellites'
import { UA_KM } from '../../astro/temps'
import type { Vecteur3 } from '../../astro/vecteur'
import { ETOILES } from '../../donnees/etoiles'
import { NOMS_PLANETES, PLANETES, RAYON_LUNE } from '../../donnees/planetes'
import { positionVisiteur, visiteurDetecte } from '../../moteur/chasse'
import type { EtatPartie } from '../../moteur/etat'
import { enAttenteDeFenetre, systemeDeLaFusee } from '../../moteur/fusee'
import { mulberry32 } from '../../moteur/hasard'
import { CHASSE } from '../../donnees/chasse'
import { modeleFusee, modeleISS, modeleSoucoupe } from './modeles'

const COULEURS: Record<string, number> = {
  Mercure: 0xcfc6b6, Vénus: 0xefdfae, Terre: 0x7fa4cf, Mars: 0xe07a5c,
  Jupiter: 0xdcb184, Saturne: 0xe6cf92, Uranus: 0xa9d2d6, Neptune: 0x7f9fd6,
}

/** Rayon d'un corps (km). */
function rayon(nom: string): number {
  if (nom === 'Soleil') return 696_000
  if (nom === 'Lune') return RAYON_LUNE
  const p = PLANETES.find((x) => x.nom === nom)
  if (p) return p.rayon
  return satellite(nom)?.rayon ?? 5
}

/** Passe de l'écliptique (x, y, z nord) aux axes de three.js (y vers le haut). */
const versThree = (v: Vecteur3) => new THREE.Vector3(v.x, v.z, -v.y)

export interface Etiquette {
  nom: string
  x: number
  y: number
  cible: boolean
}

interface Astre {
  nom: string
  maillage: THREE.Mesh
  point: THREE.Points
}

export class Vue3D {
  private rendu: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private fusee = modeleFusee()
  private iss = modeleISS()
  private soucoupe = modeleSoucoupe()
  private lueurVisiteur: THREE.Points
  private soleil: THREE.PointLight
  private astres = new Map<string, Astre>()
  private chargeur = new THREE.TextureLoader()
  private largeur = 1
  private hauteur = 1

  // Caméra en orbite autour de la fusée.
  lacet = 2.6
  tangage = 0.25
  distance = 0.09
  etiquettes: Etiquette[] = []
  /** Position du visiteur à l'écran (pour savoir si on l'a touché), ou null s'il n'est pas visible. */
  visiteurEcran: { x: number; y: number } | null = null

  constructor(toile: HTMLCanvasElement) {
    this.rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true })
    this.rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    this.camera = new THREE.PerspectiveCamera(55, 1, 1e-5, 1e13)
    this.scene.background = new THREE.Color(0x05080d)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12))
    this.soleil = new THREE.PointLight(0xfff3dd, 2.2, 0, 0)
    this.scene.add(this.soleil)
    this.scene.add(this.fusee, this.iss, this.soucoupe)
    this.ajouterEtoiles()
    this.ajouterAstre('Soleil', 0xffd27a, true)
    for (const nom of NOMS_PLANETES) this.ajouterAstre(nom, COULEURS[nom])
    this.ajouterAstre('Lune', 0xcfc8b8)
    this.lueurVisiteur = this.point(0xbfffd0, 5)
    this.scene.add(this.lueurVisiteur)
  }

  private point(couleur: number, taille: number): THREE.Points {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: couleur, size: taille, sizeAttenuation: false, transparent: true }))
  }

  private ajouterEtoiles() {
    const h = mulberry32(58)
    const positions: number[] = []
    const D = 1e11
    const direction = (lon: number, lat: number) => {
      const l = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180
      return versThree({ x: D * Math.cos(b) * Math.cos(l), y: D * Math.cos(b) * Math.sin(l), z: D * Math.sin(b) })
    }
    for (let i = 0; i < 2500; i++) {
      const p = direction(h() * 360, (Math.asin(h() * 2 - 1) * 180) / Math.PI)
      positions.push(p.x, p.y, p.z)
    }
    const fond = new THREE.BufferGeometry()
    fond.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.scene.add(new THREE.Points(fond, new THREE.PointsMaterial({ color: 0xdfe6f0, size: 1.2, sizeAttenuation: false })))
    const brillantes: number[] = []
    for (const e of ETOILES) { const p = direction(e.azimut, e.hauteur); brillantes.push(p.x, p.y, p.z) }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(brillantes, 3))
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff3cf, size: 3, sizeAttenuation: false })))
  }

  private ajouterAstre(nom: string, couleur: number, lumineux = false) {
    const materiau = lumineux
      ? new THREE.MeshBasicMaterial({ color: couleur })
      : new THREE.MeshStandardMaterial({ color: nom === 'Terre' || nom === 'Lune' ? 0xffffff : couleur, roughness: 0.9 })
    if (nom === 'Terre') (materiau as THREE.MeshStandardMaterial).map = this.chargeur.load(terreUrl)
    if (nom === 'Lune') (materiau as THREE.MeshStandardMaterial).map = this.chargeur.load(luneUrl)
    const maillage = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), materiau)
    maillage.scale.setScalar(rayon(nom))
    if (nom === 'Saturne') {
      const anneau = new THREE.Mesh(new THREE.RingGeometry(1.24, 2.27, 96), new THREE.MeshStandardMaterial({ color: 0xd9c08a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }))
      anneau.rotation.x = -Math.PI / 2 + 0.47
      maillage.add(anneau)
    }
    if (nom === 'Terre') maillage.rotation.z = (23.44 * Math.PI) / 180
    const point = this.point(couleur, lumineux ? 6 : 3)
    this.scene.add(maillage, point)
    this.astres.set(nom, { nom, maillage, point })
  }

  /** Les satellites du système où se trouve la fusée sont ajoutés quand on y entre. */
  private satellitesDuSysteme(etat: EtatPartie, t: number) {
    const systeme = systemeDeLaFusee(etat.fusee, t)
    if (!systeme) return []
    const noms = corpsDuSysteme(systeme).filter((n) => !estPlanete(n) && n !== 'Lune' && n !== 'ISS')
    for (const n of noms) if (!this.astres.has(n)) this.ajouterAstre(n, 0xcfc8b8)
    return noms
  }

  /** Position où l'on dessine la fusée (km, héliocentrique) : à côté de l'ISS, du visiteur, ou en orbite basse. */
  private positionFusee(etat: EtatPartie, t: number): Vecteur3 {
    const f = etat.fusee
    const z = f.orbite ? positionCorps(f.orbite, t).z : 0
    const base = { x: f.position.x * UA_KM, y: f.position.y * UA_KM, z: z * UA_KM }
    if (f.presDuVisiteur) return { ...base, x: base.x + CHASSE.distanceApprocheKm }
    if (f.orbite === 'ISS') return { x: base.x + 0.03, y: base.y, z: base.z - 0.05 } // à quelques dizaines de mètres, sous l'ISS
    if (f.orbite) return { ...base, x: base.x + rayon(f.orbite) * 1.6 + 300 }
    return base
  }

  taille(largeur: number, hauteur: number) {
    this.largeur = largeur
    this.hauteur = hauteur
    this.rendu.setSize(largeur, hauteur, false)
    this.camera.aspect = largeur / hauteur
    this.camera.updateProjectionMatrix()
  }

  /** Met la scène à l'instant t et dessine. */
  dessiner(etat: EtatPartie, t: number, horloge: number) {
    const origine = this.positionFusee(etat, t)
    const relatif = (p: Vecteur3) => versThree({ x: p.x - origine.x, y: p.y - origine.y, z: p.z - origine.z })
    const enKm = (p: Vecteur3) => ({ x: p.x * UA_KM, y: p.y * UA_KM, z: p.z * UA_KM })

    // Astres.
    const satellites = this.satellitesDuSysteme(etat, t)
    const visibles = new Set(['Soleil', ...NOMS_PLANETES, 'Lune', ...satellites])
    for (const [nom, a] of this.astres) {
      const montre = visibles.has(nom)
      a.maillage.visible = montre
      a.point.visible = montre
      if (!montre) continue
      const p = nom === 'Soleil' ? relatif({ x: 0, y: 0, z: 0 }) : relatif(enKm(positionCorps(nom, t)))
      a.maillage.position.copy(p)
      a.point.position.copy(p)
      if (nom === 'Soleil') this.soleil.position.copy(p)
    }
    if (this.astres.get('Terre')) this.astres.get('Terre')!.maillage.rotation.y = ((t / 86_164_000) % 1) * Math.PI * 2

    // ISS : visible si elle est proche.
    const iss = relatif(enKm(positionCorps('ISS', t)))
    this.iss.visible = iss.length() < 2000
    this.iss.position.copy(iss)

    // Fusée au centre, orientée selon son cap ; flamme quand le moteur pousse.
    this.fusee.rotation.y = (etat.fusee.cap * Math.PI) / 180
    const pousse = etat.fusee.destination !== null && !enAttenteDeFenetre(etat.fusee) && etat.modules.propulsion.levierAHaut
    const flamme = this.fusee.getObjectByName('flamme')!
    flamme.visible = pousse
    flamme.scale.setScalar(0.85 + Math.sin(horloge / 60) * 0.15)

    // Visiteur : la soucoupe de près ; une lueur de loin (et elle clignote si le détecteur DET la signale).
    const v = positionVisiteur(t)
    const pv = relatif({ x: v.x * UA_KM, y: v.y * UA_KM, z: v.z * UA_KM })
    const d = pv.length()
    this.soucoupe.visible = d < 60
    this.soucoupe.position.copy(pv)
    this.soucoupe.getObjectByName('feux')!.rotation.y = horloge / 400
    const detecte = visiteurDetecte(etat, t) !== null
    this.lueurVisiteur.visible = d >= 1 && d <= CHASSE.distanceReperageKm
    this.lueurVisiteur.position.copy(pv)
    const mat = this.lueurVisiteur.material as THREE.PointsMaterial
    mat.opacity = detecte ? 0.4 + 0.6 * (Math.sin(horloge / 120) > 0 ? 1 : 0) : 0.55

    // Caméra.
    const c = new THREE.Vector3(
      Math.cos(this.tangage) * Math.cos(this.lacet), Math.sin(this.tangage), -Math.cos(this.tangage) * Math.sin(this.lacet),
    ).multiplyScalar(this.distance)
    this.camera.position.copy(c)
    this.camera.lookAt(0, 0, 0)
    this.rendu.render(this.scene, this.camera)

    // Étiquettes et position du visiteur à l'écran.
    const projeter = (p: THREE.Vector3) => {
      const q = p.clone().project(this.camera)
      if (q.z > 1 || Math.abs(q.x) > 1.05 || Math.abs(q.y) > 1.05) return null
      return { x: ((q.x + 1) / 2) * this.largeur, y: ((1 - q.y) / 2) * this.hauteur }
    }
    const dest = etat.fusee.destination
    const cibleNom = dest?.type === 'astre' ? dest.astre : null
    this.etiquettes = []
    for (const nom of ['Soleil', ...NOMS_PLANETES, 'Lune', ...satellites.filter((s) => (satellite(s)?.rayon ?? 0) > 100 || s === cibleNom)]) {
      const a = this.astres.get(nom)
      if (!a?.maillage.visible) continue
      const e = projeter(a.maillage.position)
      if (e) this.etiquettes.push({ nom, ...e, cible: nom === cibleNom })
    }
    if (this.iss.visible) { const e = projeter(iss); if (e) this.etiquettes.push({ nom: 'ISS', ...e, cible: cibleNom === 'ISS' }) }
    this.visiteurEcran = this.lueurVisiteur.visible || this.soucoupe.visible ? projeter(pv) : null
  }

  /** Recentre la caméra derrière la fusée, dans l'axe de son cap. */
  recentrer(cap: number) {
    this.lacet = (cap * Math.PI) / 180 + Math.PI
    this.tangage = 0.22
  }

  tourner(dx: number, dy: number) {
    this.lacet -= dx * 0.008
    this.tangage = Math.max(-1.4, Math.min(1.4, this.tangage + dy * 0.008))
  }

  zoomer(facteur: number) {
    this.distance = Math.max(0.035, Math.min(50, this.distance * facteur))
  }

  /** Image de la vue (pour la photo du visiteur). */
  photo(): string {
    return this.rendu.domElement.toDataURL('image/jpeg', 0.85)
  }

  liberer() {
    this.rendu.dispose()
  }
}
