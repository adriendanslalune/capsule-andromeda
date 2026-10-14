// Vue 3D « dehors » : la fusée au centre, le vrai ciel, le Soleil, les planètes, la Lune, les satellites proches,
// l'ISS et le visiteur, chacun à sa vraie position (en km) et à sa vraie taille. Les astres trop lointains pour être
// vus restent signalés par un point lumineux. Deux façons de regarder : de l'extérieur (la caméra tourne autour de
// la fusée au doigt), ou de l'intérieur (hublot du cockpit : depuis le poste de pilotage, droit devant, dans l'axe du
// cap ; la fusée elle-même n'est pas visible).

import * as THREE from 'three'
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
import { autresFusees } from '../reseau'
import { positionsEngins } from '../../astro/engins'
import { modeleEngin, modeleISSFidele } from './engins'
import { creerTerre, type Terre } from './terre'
import { creerCiel, type Ciel } from './ciel'
import { galactiqueVersEcliptique } from '../../astro/galaxie'
import { aspectAstre, orienter } from './astres'
import { estEngin } from '../../astro/engins'
import { modeleFusee, modeleSoucoupe, refleter } from './modeles'

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
/** Le fond du ciel : presque noir (la lueur vient de la Voie lactée). */
const FOND_DU_CIEL = 0x020306
const versThree = (v: Vecteur3) => new THREE.Vector3(v.x, v.z, -v.y)

export interface Etiquette {
  nom: string
  x: number
  y: number
  cible: boolean
  /** Couleur d'une autre fusée (son nom est alors écrit à sa couleur). */
  couleur?: string
}

/** Les autres fusées : un point de couleur jusqu'à 3 millions de km, leur nom jusqu'à 300 000 km, le modèle à 30 km. */
const AUTRES = { pointKm: 3_000_000, nomKm: 300_000, modeleKm: 30 }

/** Distance de la caméra à la fusée dans la vue extérieure (km) : 90 m. */
const DISTANCE_CAMERA = 0.09

/**
 * Position de la caméra autour de la fusée, partagée entre le hublot du cockpit et la vue extérieure en plein
 * écran : on retrouve la même vue de l'un à l'autre.
 */
export const camera = { lacet: 2.6, tangage: 0.22, distance: DISTANCE_CAMERA, placee: false }

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
  private iss = modeleISSFidele()
  private soucoupe = modeleSoucoupe()
  private lueurVisiteur: THREE.Points
  private soleil: THREE.PointLight
  private astres = new Map<string, Astre>()
  private chargeur = new THREE.TextureLoader()
  private voieLactee!: Ciel
  private largeur = 1
  private ciel!: THREE.ShaderMaterial
  private environnement: THREE.Texture
  private hauteur = 1
  private terre: Terre | null = null
  /** Direction du regard par le hublot : elle suit en douceur le virage de la fusée. */
  private regard: THREE.Vector3 | null = null
  private horlogePrecedente = 0
  /** Champ du hublot au « grossissement » normal ; il s'élargit près d'un gros astre pour en garder la courbure. */
  private fovBase = 55
  /** Engins humains (Hubble, Webb, Voyager) : point lumineux de loin, modèle de près. */
  private engins = new Map<string, { point: THREE.Points; modele: THREE.Group | null; ecran: THREE.Vector3 }>()
  /** Filtre solaire demandé (bouton) ; l'effet suit en douceur (0 : sans filtre, 1 : filtre en place). */
  filtreSolaire = false
  private filtre = 0
  /** Éblouissement près du Soleil (0 à 1), à rendre par un voile clair sur l'image ; nul derrière le filtre. */
  eblouissement = 0
  /** Les autres fusées (bots, puis vrais joueurs) : point de couleur, et modèle quand on est tout près. */
  private autres = new Map<string, { point: THREE.Points; modele: THREE.Group | null; ecran: THREE.Vector3; nom: string; couleur: string }>()

  // Caméra en orbite autour de la fusée.
  lacet = camera.lacet
  tangage = camera.tangage
  distance = camera.distance
  /** Position de caméra vers laquelle on revient en douceur (RECENTRER), ou null. */
  private objectif: { lacet: number; tangage: number; distance: number } | null = null
  etiquettes: Etiquette[] = []
  /** Position du visiteur à l'écran (pour savoir si on l'a touché), ou null s'il n'est pas visible. */
  visiteurEcran: { x: number; y: number } | null = null

  /** Vue de l'intérieur (hublot du cockpit). */
  private interieur: boolean

  constructor(toile: HTMLCanvasElement, options: { interieur?: boolean } = {}) {
    this.interieur = options.interieur ?? false
    this.rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true })
    this.rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    // Exposition réglable (filtre solaire) : à 1, l'image est inchangée.
    this.rendu.toneMapping = THREE.LinearToneMapping
    this.rendu.toneMappingExposure = 1
    this.camera = new THREE.PerspectiveCamera(55, 1, 1e-5, 1e13)
    this.scene.background = new THREE.Color(FOND_DU_CIEL)
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
    this.voieLactee = creerCiel(this.chargeur)
    this.scene.add(this.voieLactee.maillage)
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
    // Les étoiles faibles se pressent le long de la Voie lactée (disque de la Galaxie), surtout vers son centre.
    for (let i = 0; i < 6000; i++) {
      const m = Math.max(2.5, 6.8 + 2.2 * Math.log10(h()))
      const l = h() < 0.4 ? (h() - 0.5) * 120 : h() * 360
      const gauss = Math.sqrt(-2 * Math.log(1 - h())) * Math.cos(2 * Math.PI * h())
      const e = galactiqueVersEcliptique(l, gauss * 7)
      ajouter(e.lon, e.lat, m)
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
    // La Terre : globe réaliste, à sa vraie orientation (terre.ts) ; les autres astres : astres.ts.
    let maillage: THREE.Mesh
    if (nom === 'Terre') {
      this.terre = creerTerre(this.chargeur)
      maillage = this.terre.globe
    } else {
      const aspect = aspectAstre(nom, rayon(nom), this.chargeur)
      maillage = new THREE.Mesh(aspect.geometrie, aspect.materiau)
      if (aspect.anneau) maillage.add(aspect.anneau)
    }
    maillage.scale.setScalar(rayon(nom))
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
    // En orbite, là où la fusée est arrivée (à sa vraie distance de l'astre).
    if (f.orbite && f.ecartOrbite) return { x: base.x + f.ecartOrbite.x * UA_KM, y: base.y + f.ecartOrbite.y * UA_KM, z: base.z + f.ecartOrbite.z * UA_KM }
    if (f.orbite) return { ...base, x: base.x + rayon(f.orbite) * 1.6 + 300 }
    return base
  }

  taille(largeur: number, hauteur: number) {
    this.largeur = largeur
    this.hauteur = hauteur
    this.rendu.setSize(largeur, hauteur, false)
    this.camera.aspect = largeur / hauteur
    // Même « grossissement » partout : la vue plein écran couvre 55° sur sa hauteur (environ 15 px par degré) ;
    // le hublot, plus petit, couvre un champ plus serré, pour que les astres y paraissent aussi gros.
    this.fovBase = this.interieur ? Math.max(6, Math.min(55, hauteur / 15)) : 55
    this.camera.fov = this.fovBase
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
      // Pôle et rotation réels (UAI) ; la Terre a les siens (terre.ts).
      if (nom !== 'Terre') orienter(nom, a.maillage, t)
      if (nom === 'Soleil') this.soleil.position.copy(p)
    }
    // La Terre tourne comme la vraie : jour et nuit au bon endroit.
    this.terre?.mettreAJour(t, this.soleil.position)

    // ISS : visible si elle est proche.
    const iss = relatif(enKm(positionCorps('ISS', t)))
    this.iss.visible = iss.length() < 2000
    this.iss.position.copy(iss)

    // Fusée au centre, orientée selon son cap ; flamme quand le moteur pousse.
    this.fusee.rotation.y = (etat.fusee.cap * Math.PI) / 180
    const pousse = etat.fusee.destination !== null && !enAttenteDeFenetre(etat.fusee) && etat.modules.propulsion.levierAHaut
      && !etat.fusee.moteurCoupe && (etat.fusee.vitesseCourante ?? 1) > 0
    const flamme = this.fusee.getObjectByName('flamme')!
    flamme.visible = pousse
    flamme.scale.set(0.85 + Math.sin(horloge / 60) * 0.15 + Math.sin(horloge / 23) * 0.05, 1, 1)
    this.fusee.getObjectByName('foyer')!.visible = pousse
    // Feu de position clignotant au bout de l'antenne.
    this.fusee.getObjectByName('feu')!.visible = Math.floor(horloge / 600) % 2 === 0

    // Engins humains : un point jusqu'à 3 millions de km, leur nom jusqu'à 300 000 km, le modèle à moins de 50 km.
    for (const e of positionsEngins(t)) {
      let o = this.engins.get(e.nom)
      if (!o) {
        o = { point: this.point(0xdfe8ff, 3), modele: null, ecran: new THREE.Vector3() }
        this.scene.add(o.point)
        this.engins.set(e.nom, o)
      }
      const pe = relatif(enKm(e.position))
      const d = pe.length()
      o.ecran.copy(pe)
      o.point.position.copy(pe)
      o.point.visible = d > 0.2 && d < AUTRES.pointKm
      if (d < 50 && !o.modele) {
        o.modele = modeleEngin(e.fiche.modele)
        this.scene.add(o.modele)
      }
      if (o.modele) {
        o.modele.visible = d < 50
        o.modele.position.copy(pe)
      }
    }

    // Les autres fusées.
    const vues = new Set<string>()
    for (const a of autresFusees(t)) {
      vues.add(a.serie)
      let o = this.autres.get(a.serie)
      if (!o) {
        o = { point: this.point(new THREE.Color(a.couleur).getHex(), 4), modele: null, ecran: new THREE.Vector3(), nom: a.nom, couleur: a.couleur }
        this.scene.add(o.point)
        this.autres.set(a.serie, o)
      }
      const pa = relatif(enKm({ ...a.position, z: a.position.z ?? 0 }))
      const d = pa.length()
      o.ecran.copy(pa)
      o.point.position.copy(pa)
      o.point.visible = d > 0.05 && d < AUTRES.pointKm
      if (d < AUTRES.modeleKm && !o.modele) {
        o.modele = modeleFusee()
        o.modele.getObjectByName('flamme')!.visible = false
        o.modele.getObjectByName('foyer')!.visible = false
        refleter(o.modele, this.environnement, 0.9)
        this.scene.add(o.modele)
      }
      if (o.modele) {
        o.modele.visible = d < AUTRES.modeleKm
        o.modele.position.copy(pa)
        o.modele.rotation.y = (a.cap * Math.PI) / 180
      }
    }
    for (const [serie, o] of this.autres) if (!vues.has(serie)) { o.point.visible = false; if (o.modele) o.modele.visible = false }

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

    if (this.interieur) {
      // Depuis le poste de pilotage : la destination au centre de la vitre (sinon l'astre de l'orbite, sinon droit
      // devant, dans l'axe du cap).
      this.fusee.visible = false
      this.camera.position.set(0, 0, 0)
      this.camera.up.set(0, 1, 0)
      // L'ISS, trop petite pour être vue de loin : on vise la Terre tant qu'elle n'est pas en vue. Un point libre :
      // on vise le point lui-même.
      const dest = etat.fusee.destination
      let vise = dest?.type === 'astre' ? dest.astre : etat.fusee.orbite
      if (vise === 'ISS' && !this.iss.visible) vise = 'Terre'
      const cible = vise === 'ISS' ? iss
        : vise && estEngin(vise) ? this.engins.get(vise)?.ecran
        : vise ? this.astres.get(vise)?.maillage.position
        : dest?.type === 'visiteur' ? pv
        : dest?.type === 'point' ? relatif({ x: dest.x * UA_KM, y: dest.y * UA_KM, z: 0 })
        : undefined
      // En route, on regarde droit devant, dans l'axe de la fusée (son cap), à la hauteur de la cible : pendant un
      // virage, le paysage défile. En orbite ou à l'arrêt, on regarde l'astre visé.
      const a = (etat.fusee.cap * Math.PI) / 180
      let voulu: THREE.Vector3
      if (dest && !etat.fusee.orbite) {
        const c = cible && cible.lengthSq() > 0 ? cible.clone().normalize() : new THREE.Vector3(Math.cos(a), 0, -Math.sin(a))
        const horizontal = Math.hypot(c.x, c.z)
        const hauteur = Math.atan2(c.y, horizontal)
        voulu = new THREE.Vector3(Math.cos(a) * Math.cos(hauteur), Math.sin(hauteur), -Math.sin(a) * Math.cos(hauteur))
      } else {
        voulu = cible && cible.lengthSq() > 0 ? cible.clone().normalize() : new THREE.Vector3(Math.cos(a), 0, -Math.sin(a))
      }
      // On tourne vers ce regard à 25° par seconde au plus (comme la fusée), sans à-coup.
      const dt = this.horlogePrecedente ? Math.min(0.2, (horloge - this.horlogePrecedente) / 1000) : 1
      this.horlogePrecedente = horloge
      if (!this.regard) this.regard = voulu.clone()
      const ecart = this.regard.angleTo(voulu)
      const pas = (25 * Math.PI) / 180 * dt
      if (ecart <= pas || ecart > Math.PI * 0.999) this.regard.copy(voulu)
      else {
        const q = new THREE.Quaternion().setFromUnitVectors(this.regard, voulu)
        const qPas = new THREE.Quaternion().slerp(q, pas / ecart)
        this.regard.applyQuaternion(qPas).normalize()
      }
      this.camera.lookAt(this.regard)
      // Tout près d'un astre (en orbite à trois rayons), il déborderait du hublot : le champ s'élargit en douceur pour
      // que l'astre remplisse un peu plus que la hauteur de la vitre, sa courbure visible.
      const corps = vise && !estEngin(vise) && vise !== 'ISS' ? this.astres.get(vise)?.maillage : undefined
      let fovVoulu = this.fovBase
      if (corps && corps.visible) {
        const d = corps.position.length()
        const r = corps.scale.x
        if (d > r) fovVoulu = Math.min(40, Math.max(this.fovBase, ((2 * Math.asin(r / d)) * 180) / Math.PI * 0.9))
      }
      if (Math.abs(fovVoulu - this.camera.fov) > 0.01) {
        this.camera.fov += (fovVoulu - this.camera.fov) * Math.min(1, dt * 2)
        this.camera.updateProjectionMatrix()
      }
      this.appliquerSoleil(origine)
      this.rendu.render(this.scene, this.camera)
      this.etiqueter(etat, iss, pv, satellites)
      return
    }

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
    Object.assign(camera, { lacet: this.lacet, tangage: this.tangage, distance: this.distance, placee: true })
    const c = new THREE.Vector3(
      Math.cos(this.tangage) * Math.cos(this.lacet), Math.sin(this.tangage), -Math.cos(this.tangage) * Math.sin(this.lacet),
    ).multiplyScalar(this.distance)
    this.camera.position.copy(c)
    this.camera.lookAt(0, 0, 0)
    this.appliquerSoleil(origine)
    this.rendu.render(this.scene, this.camera)

    this.etiqueter(etat, iss, pv, satellites)
  }

  /**
   * Le Soleil de près : l'image s'éclaire de plus en plus (éblouissement, à partir de 0,6 UA) ; le filtre solaire
   * assombrit tout et ne laisse voir qu'une énorme boule blanche. Passage en douceur de l'un à l'autre.
   */
  private appliquerSoleil(origine: Vecteur3) {
    this.filtre += ((this.filtreSolaire ? 1 : 0) - this.filtre) * 0.06
    if (Math.abs((this.filtreSolaire ? 1 : 0) - this.filtre) < 0.002) this.filtre = this.filtreSolaire ? 1 : 0
    const f = this.filtre
    const dUA = Math.max(1e-6, Math.hypot(origine.x, origine.y, origine.z) / UA_KM)
    const proche = Math.min(1, Math.max(0, Math.log10(0.6 / dUA) / Math.log10(0.6 / 0.02)))
    this.eblouissement = 0.92 * proche ** 1.4 * (1 - f)
    ;(this.scene.background as THREE.Color).setHex(FOND_DU_CIEL).lerp(new THREE.Color(0x000000), f)
    // Derrière le filtre, l'exposition tombe : tout s'éteint, sauf le Soleil, rendu d'autant plus intense (blanc).
    const exposition = 1 - 0.96 * f
    this.rendu.toneMappingExposure = exposition
    const soleil = this.astres.get('Soleil')
    if (soleil) (soleil.maillage.material as THREE.MeshBasicMaterial).color.setHex(0xffffff).lerp(new THREE.Color(0xffffff), f).multiplyScalar(1 / exposition)
    // Derrière le filtre, les étoiles disparaissent.
    this.reglerCiel(6.3 - 9 * f, 1)
    this.voieLactee.regler(1 - f)
  }

  /** Étiquettes des astres et position du visiteur à l'écran. */
  private etiqueter(etat: EtatPartie, iss: THREE.Vector3, pv: THREE.Vector3, satellites: string[]) {
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
    for (const [nom, o] of this.engins) {
      if (!(o.point.visible || o.modele?.visible) || o.ecran.length() > AUTRES.nomKm) continue
      const e = projeter(o.ecran)
      if (e && this.etiquettes.every((x) => Math.abs(x.x - e.x) > 70 || Math.abs(x.y - e.y) > 15)) this.etiquettes.push({ nom, ...e, cible: false })
    }
    for (const o of this.autres.values()) {
      if (!o.point.visible || o.ecran.length() > AUTRES.nomKm) continue
      const e = projeter(o.ecran)
      // Le nom ne s'écrit que s'il ne chevauche aucune autre étiquette (autour de la Terre, ils sont nombreux).
      if (e && this.etiquettes.every((x) => Math.abs(x.x - e.x) > 90 || Math.abs(x.y - e.y) > 15)) this.etiquettes.push({ nom: o.nom, ...e, cible: false, couleur: o.couleur })
    }
    this.visiteurEcran = this.lueurVisiteur.visible || this.soucoupe.visible ? projeter(pv) : null
  }

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
