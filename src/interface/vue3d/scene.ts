// Vue 3D « dehors » : la fusée au centre, le vrai ciel, le Soleil, les planètes, la Lune, les satellites proches,
// l'ISS et le visiteur, chacun à sa vraie position (en km) et à sa vraie taille. Les astres trop lointains pour être
// vus restent signalés par un point lumineux. Deux façons de regarder :
//  - « orbite » (écran Dehors) : la caméra tourne autour de la fusée au doigt ;
//  - « hublot » (tableau de bord) : depuis l'intérieur de la fusée, à travers trois vitres (gauche, face, droite)
//    de 60° chacune, soit 180° en tout. Chaque vitre est une vue droite, sans déformation.

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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { modeleFusee, modeleISS, modeleSoucoupe, refleter } from './modeles'

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
  /** Hublot : la cible est hors du champ, de ce côté (l'étiquette est collée au bord). */
  horsChamp?: 'gauche' | 'droite'
}

/** Distance de la caméra à la fusée dans la vue extérieure (km) : 90 m. */
const DISTANCE_CAMERA = 0.09

/** Les trois vitres du hublot : décalage de chacune par rapport au cap (degrés), de gauche à droite. */
const VITRES = [60, 0, -60]
/** Champ horizontal d'une vitre (degrés). */
const CHAMP_VITRE = 60
/** Largeur des montants entre les vitres (px). */
export const MONTANT = 12

/** Position (x, largeur) de chaque vitre dans le hublot. */
export function disposerVitres(largeur: number): { x: number; l: number }[] {
  const l = (largeur - 2 * MONTANT) / 3
  return VITRES.map((_, i) => ({ x: i * (l + MONTANT), l }))
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
  private ciel!: THREE.ShaderMaterial
  private environnement: THREE.Texture
  private hauteur = 1
  /** Caméras des trois vitres du hublot (null pour la vue « orbite »). */
  private vitres: THREE.PerspectiveCamera[] | null = null

  // Caméra en orbite autour de la fusée.
  lacet = 2.6
  tangage = 0.25
  distance = DISTANCE_CAMERA
  /** Position de caméra vers laquelle on revient en douceur (RECENTRER), ou null. */
  private objectif: { lacet: number; tangage: number; distance: number } | null = null
  etiquettes: Etiquette[] = []
  /** Position du visiteur à l'écran (pour savoir si on l'a touché), ou null s'il n'est pas visible. */
  visiteurEcran: { x: number; y: number } | null = null

  constructor(toile: HTMLCanvasElement, mode: 'orbite' | 'hublot' = 'orbite') {
    this.rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: mode === 'orbite' })
    this.rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    this.camera = new THREE.PerspectiveCamera(55, 1, 1e-5, 1e13)
    this.scene.background = new THREE.Color(0x05080d)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12))
    this.soleil = new THREE.PointLight(0xfff3dd, 2.2, 0, 0)
    this.scene.add(this.soleil)
    this.scene.add(this.fusee, this.iss, this.soucoupe)
    // Reflets du chrome et de la peinture : une pièce éclairée, réduite en carte d'environnement (seulement pour les
    // modèles ; les astres n'en ont pas, leur face nuit reste noire).
    const pmrem = new THREE.PMREMGenerator(this.rendu)
    this.environnement = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    refleter(this.fusee, this.environnement, 0.9)
    refleter(this.iss, this.environnement, 0.6)
    refleter(this.soucoupe, this.environnement, 1)
    this.ajouterEtoiles()
    this.ajouterAstre('Soleil', 0xffd27a, true)
    for (const nom of NOMS_PLANETES) this.ajouterAstre(nom, COULEURS[nom])
    this.ajouterAstre('Lune', 0xcfc8b8)
    this.lueurVisiteur = this.point(0xbfffd0, 5)
    this.scene.add(this.lueurVisiteur)
    if (mode === 'hublot') this.vitres = VITRES.map(() => new THREE.PerspectiveCamera(50, 1, 1e-5, 1e13))
  }

  private point(couleur: number, taille: number): THREE.Points {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: couleur, size: taille, sizeAttenuation: false, transparent: true }))
  }

  /**
   * Le ciel étoilé : quelques étoiles brillantes et une multitude de faibles (comme le vrai ciel, le nombre
   * d'étoiles triple à chaque magnitude), rondes, légèrement teintées. La magnitude limite et la taille dépendent
   * de la vue (le hublot, très large, en montre moins de faibles).
   */
  private ajouterEtoiles() {
    const h = mulberry32(58)
    const positions: number[] = []
    const magnitudes: number[] = []
    const teintes: number[] = []
    const D = 1e11
    const ajouter = (lon: number, lat: number, m: number) => {
      const l = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180
      const p = versThree({ x: D * Math.cos(b) * Math.cos(l), y: D * Math.cos(b) * Math.sin(l), z: D * Math.sin(b) })
      positions.push(p.x, p.y, p.z)
      magnitudes.push(m)
      // Teinte : bleutée, blanche ou orangée.
      const k = h()
      const c = k < 0.18 ? [0.78, 0.86, 1] : k > 0.85 ? [1, 0.85, 0.7] : [1, 0.97, 0.92]
      teintes.push(c[0], c[1], c[2])
    }
    for (let i = 0; i < 9000; i++) {
      const m = Math.max(-0.5, 6.8 + 2.2 * Math.log10(h()))
      ajouter(h() * 360, (Math.asin(h() * 2 - 1) * 180) / Math.PI, m)
    }
    for (const e of ETOILES) ajouter(e.azimut, e.hauteur, 0.4)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('magnitude', new THREE.Float32BufferAttribute(magnitudes, 1))
    geo.setAttribute('teinte', new THREE.Float32BufferAttribute(teintes, 3))
    this.ciel = new THREE.ShaderMaterial({
      uniforms: { limite: { value: 6.5 }, echelle: { value: 1 }, pixels: { value: 1 } },
      vertexShader: `
        attribute float magnitude;
        attribute vec3 teinte;
        uniform float limite;
        uniform float echelle;
        uniform float pixels;
        varying float vEclat;
        varying vec3 vTeinte;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vEclat = magnitude > limite ? 0.0 : clamp(0.12 + 0.88 * pow((limite - magnitude) / (limite + 1.0), 1.4), 0.0, 1.0);
          gl_PointSize = pixels * echelle * (1.6 + 3.4 * clamp((3.0 - magnitude) / 4.0, 0.0, 1.0));
          vTeinte = teinte;
        }`,
      fragmentShader: `
        varying float vEclat;
        varying vec3 vTeinte;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r2 = dot(c, c) * 4.0;
          float a = exp(-r2 * 3.5) * vEclat;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vTeinte, a);
        }`,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const etoiles = new THREE.Points(geo, this.ciel)
    etoiles.renderOrder = -1 // dessinées d'abord : tout le reste passe devant
    etoiles.frustumCulled = false
    this.scene.add(etoiles)
  }

  /** Règle le ciel pour la vue : magnitude limite et taille des étoiles. */
  private reglerCiel(limite: number, echelle: number) {
    this.ciel.uniforms.limite.value = limite
    this.ciel.uniforms.echelle.value = echelle
    this.ciel.uniforms.pixels.value = this.rendu.getPixelRatio()
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
    if (nom === 'Terre') {
      maillage.rotation.z = (23.44 * Math.PI) / 180
      // Halo de l'atmosphère, visible sur le bord du globe.
      const halo = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 32),
        new THREE.MeshBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.35, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }))
      maillage.add(halo)
    }
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
    // En orbite, la fusée suit son astre (à l'instant dessiné) ; en route, elle est à sa position et sa hauteur.
    const o = f.orbite ? positionCorps(f.orbite, t) : { ...f.position, z: f.z ?? 0 }
    const base = { x: o.x * UA_KM, y: o.y * UA_KM, z: o.z * UA_KM }
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
    if (this.vitres) {
      // Champ vertical d'une vitre, déduit de son champ horizontal (60°) et de ses proportions.
      const { l } = disposerVitres(largeur)[0]
      for (const c of this.vitres) {
        c.aspect = l / hauteur
        c.fov = (2 * Math.atan(Math.tan(((CHAMP_VITRE / 2) * Math.PI) / 180) / c.aspect) * 180) / Math.PI
        c.updateProjectionMatrix()
      }
    }
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
    flamme.scale.set(0.85 + Math.sin(horloge / 60) * 0.15 + Math.sin(horloge / 23) * 0.05, 1, 1)
    this.fusee.getObjectByName('foyer')!.visible = pousse
    // Feu de position clignotant au bout de l'antenne.
    this.fusee.getObjectByName('feu')!.visible = Math.floor(horloge / 600) % 2 === 0

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

    if (this.vitres) return this.dessinerHublot(etat, iss, satellites)

    // Caméra (en douceur vers l'objectif de RECENTRER, s'il y en a un ; le zoom glisse en échelle logarithmique).
    if (this.objectif) {
      const o = this.objectif
      const k = 0.12
      this.lacet += (o.lacet - this.lacet) * k
      this.tangage += (o.tangage - this.tangage) * k
      this.distance = Math.exp(Math.log(this.distance) + (Math.log(o.distance) - Math.log(this.distance)) * k)
      if (Math.abs(o.lacet - this.lacet) < 1e-3 && Math.abs(o.tangage - this.tangage) < 1e-3 && Math.abs(Math.log(o.distance / this.distance)) < 1e-3) {
        this.lacet = o.lacet; this.tangage = o.tangage; this.distance = o.distance; this.objectif = null
      }
    }
    const c = new THREE.Vector3(
      Math.cos(this.tangage) * Math.cos(this.lacet), Math.sin(this.tangage), -Math.cos(this.tangage) * Math.sin(this.lacet),
    ).multiplyScalar(this.distance)
    this.camera.position.copy(c)
    this.camera.lookAt(0, 0, 0)
    this.reglerCiel(6.3, 1)
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

  /** Hublot : la vue depuis la fusée, à travers les trois vitres. */
  private dessinerHublot(etat: EtatPartie, iss: THREE.Vector3, satellites: string[]) {
    const vitres = this.vitres!
    const cases = disposerVitres(this.largeur)
    const cap = etat.fusee.cap
    const regard = (deg: number) => { const a = (deg * Math.PI) / 180; return new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)) }
    this.fusee.visible = false // on est dedans
    this.reglerCiel(5.4, 0.85)
    this.rendu.setScissorTest(true)
    vitres.forEach((c, i) => {
      c.position.set(0, 0, 0)
      c.up.set(0, 1, 0)
      c.lookAt(regard(cap + VITRES[i]))
      c.updateMatrixWorld()
      const { x, l } = cases[i]
      this.rendu.setViewport(x, 0, l, this.hauteur)
      this.rendu.setScissor(x, 0, l, this.hauteur)
      this.rendu.render(this.scene, c)
    })
    this.rendu.setScissorTest(false)

    // Étiquettes, vitre par vitre ; la cible hors du champ est signalée au bord, du côté où il faut tourner.
    const dest = etat.fusee.destination
    const cibleNom = dest?.type === 'astre' ? dest.astre : null
    const avant = regard(cap)
    const gauche = regard(cap + 90)
    const placer = (nom: string, p: THREE.Vector3) => {
      const cible = nom === cibleNom
      for (let i = 0; i < vitres.length; i++) {
        const q = p.clone().project(vitres[i])
        if (q.z > 1 || Math.abs(q.x) > 1 || Math.abs(q.y) > 1) continue
        this.etiquettes.push({ nom, x: cases[i].x + ((q.x + 1) / 2) * cases[i].l, y: ((1 - q.y) / 2) * this.hauteur, cible })
        return
      }
      if (!cible) return
      const az = Math.atan2(p.dot(gauche), p.dot(avant))
      if (Math.abs(az) < Math.PI / 2) return // devant, mais trop haut ou trop bas
      const cote = az > 0 ? 'gauche' : 'droite'
      this.etiquettes.push({ nom, x: cote === 'gauche' ? 0 : this.largeur, y: this.hauteur / 2, cible, horsChamp: cote })
    }
    this.etiquettes = []
    for (const nom of ['Soleil', ...NOMS_PLANETES, 'Lune', ...satellites.filter((s) => (satellite(s)?.rayon ?? 0) > 100 || s === cibleNom)]) {
      const a = this.astres.get(nom)
      if (a?.maillage.visible) placer(nom, a.maillage.position)
    }
    if (this.iss.visible) placer('ISS', iss)
    this.visiteurEcran = null
  }

  /** Recentre la caméra derrière la fusée, dans l'axe de son cap. */
  /** Ramène la caméra près de la fusée, juste derrière elle, en regardant dans l'axe de sa trajectoire. */
  recentrer(cap: number) {
    let lacet = (cap * Math.PI) / 180 + Math.PI
    // Par le plus court chemin.
    lacet = this.lacet + ((((lacet - this.lacet) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
    this.objectif = { lacet, tangage: 0.22, distance: DISTANCE_CAMERA }
  }

  tourner(dx: number, dy: number) {
    this.objectif = null
    this.lacet -= dx * 0.008
    this.tangage = Math.max(-1.4, Math.min(1.4, this.tangage + dy * 0.008))
  }

  zoomer(facteur: number) {
    this.objectif = null
    this.distance = Math.max(0.035, Math.min(50, this.distance * facteur))
  }

  /** Image de la vue (pour la photo du visiteur). */
  photo(): string {
    return this.rendu.domElement.toDataURL('image/jpeg', 0.85)
  }

  liberer() {
    this.environnement.dispose()
    this.rendu.dispose()
  }
}
