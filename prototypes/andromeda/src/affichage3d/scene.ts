// La scène 3D : l'espace vu depuis derrière la capsule, qui regarde toujours devant elle.
//
// Précision : l'origine de la scène suit la capsule (« origine flottante »). Toutes les positions du moteur
// (héliocentriques, en km, en double précision) sont ramenées à la capsule avant d'entrer dans la scène ; three.js
// calcule ensuite les matrices caméra × objet en double précision avant de les envoyer à la carte graphique.
// De 1 cm à des milliards de km, rien ne tremble.
//
// Chaque astre est dessiné selon sa taille à l'écran : sphère (jour / nuit), caillou, silhouette d'engin… ou simple
// point quand il fait moins de deux pixels.

import * as THREE from 'three'
import { positionAfficheeEspace } from '../commun/triche'
import { etatCapsule, type EtatCapsule } from '../moteur/capsule'
import { CORPS, PREMIER_NIVEAU, RAYON_SYSTEME, corps, enfants, position, positionRelative, type Corps } from '../moteur/corps'
import { traceOrbite } from '../moteur/orbite'
import { MS_PAR_JOUR } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'
import { COMMUNS, materiauEtoiles, materiauPoints, materiauSphere, materiauTrait } from './materiaux'
import { geometrieCaillou, geometrieCapsule, geometrieEngin, objetAvecContours } from './modeles'

/** Champ de vision vertical (degrés). */
const CHAMP = 62
const M = 0.001
/** Les lunes plus petites (km de rayon) sont des cailloux ; rayon supposé de celles dont on ignore la taille. */
const RAYON_MAX_CAILLOU = 190
const RAYON_INCONNU = 1.5
const TAILLE_CAPSULE_M = 13.3

export const RECUL_MIN = 0.02
export const RECUL_MAX = 3e10

export interface Regard {
  /** Distance de la caméra à la capsule (km). */
  recul: number
  /** Écart du regard par rapport à l'avant de la capsule (radians) : à gauche / à droite, en haut / en bas. */
  lacet: number
  tangage: number
}

export interface ReglagesVue { etoiles: boolean; orbites: boolean }

/** Ce que l'affichage 2D par-dessus (noms, flèches) doit savoir d'un astre. */
export interface AstreEcran {
  corps: Corps
  /** Position à l'écran (pixels CSS) ; devant = devant la caméra. */
  x: number
  y: number
  devant: boolean
  /** Rayon apparent (pixels) et distance à la caméra (km). */
  r: number
  distance: number
  cache: boolean
  /** Direction vue de la caméra (vecteur unitaire) et rayon angulaire (radians), pour savoir qui cache qui. */
  direction: THREE.Vector3
  angle: number
}

const estCaillou = (c: Corps) => c.type === 'lune' && c.rayon < RAYON_MAX_CAILLOU
const grandeLune = (c: Corps) => c.nom === 'Lune' || (c.type === 'lune' && c.rayon >= 100)
const AVEC_ENFANTS = [...new Set(CORPS.filter((c) => c.parent).map((c) => c.parent!))]

function lisser(x: number): number {
  const q = Math.min(1, Math.max(0, x))
  return q * q * (3 - 2 * q)
}

export class Vue3D {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(CHAMP, 390 / 844, 1e-5, 1e12)
  private largeur = 390
  private hauteur = 844
  private spheres = new Map<string, THREE.Mesh>()
  private modeles = new Map<string, THREE.Group>()
  private capsule = objetAvecContours(geometrieCapsule())
  private points: THREE.Points
  private positionsPoints = new Float32Array(3 * 2000)
  private orbites = new Map<string, { ligne: THREE.Line; t: number; points: Vecteur3[] | null }>()
  private etoiles: THREE.Points

  constructor(toile: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.sortObjects = true
    this.scene.add(this.capsule)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positionsPoints, 3))
    this.points = new THREE.Points(geo, materiauPoints(1.6))
    this.points.frustumCulled = false
    this.points.renderOrder = 5
    this.scene.add(this.points)

    // Étoiles du fond : 700 directions fixes, tirées une fois pour toutes.
    const dirs = new Float32Array(3 * 700)
    let graine = 20261016
    const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 2 ** 32)
    for (let i = 0; i < 700; i++) {
      const u = 2 * hasard() - 1, a = 2 * Math.PI * hasard(), s = Math.sqrt(1 - u * u)
      dirs.set([s * Math.cos(a), s * Math.sin(a), u], 3 * i)
    }
    const geoEtoiles = new THREE.BufferGeometry()
    geoEtoiles.setAttribute('position', new THREE.BufferAttribute(dirs, 3))
    this.etoiles = new THREE.Points(geoEtoiles, materiauEtoiles())
    this.etoiles.frustumCulled = false
    this.etoiles.renderOrder = -10
    this.scene.add(this.etoiles)
  }

  redimensionner(largeur: number, hauteur: number, pixelRatio: number): void {
    this.largeur = largeur
    this.hauteur = hauteur
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(largeur, hauteur, false)
    this.camera.aspect = largeur / hauteur
    this.camera.updateProjectionMatrix()
    COMMUNS.hauteurPx.value = hauteur * pixelRatio
    COMMUNS.resolution.value.set(largeur * pixelRatio, hauteur * pixelRatio)
    COMMUNS.pixelRatio.value = pixelRatio
  }

  /** Inclinaison de la caméra au-dessus de la capsule : de trois quarts de près, plongeante de loin (vue d'ensemble). */
  static elevation(recul: number): number {
    return ((20 + 40 * lisser((Math.log10(recul) - 3) / 5)) * Math.PI) / 180
  }

  /** De tout près, la caméra se décale un peu sur le côté : on voit la capsule de trois quarts, pas pile de dos. */
  static cote(recul: number): number {
    return ((20 * (1 - lisser((Math.log10(recul) + 1) / 2))) * Math.PI) / 180
  }

  /**
   * Point visé, en avant de la capsule (en fraction du recul) : de près on regarde devant, de loin on vise la capsule
   * pour garder le système au centre.
   */
  static visee(recul: number): number {
    return (0.25 + 0.35 * lisser((Math.log10(recul) + 1) / 2)) * (1 - lisser((Math.log10(recul) - 5) / 2))
  }

  private sphere(c: Corps): THREE.Mesh {
    let m = this.spheres.get(c.nom)
    if (!m) {
      m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materiauSphere(c.rayon, c.type === 'etoile'))
      m.frustumCulled = false
      m.renderOrder = 1
      this.spheres.set(c.nom, m)
      this.scene.add(m)
    }
    return m
  }

  private modele(c: Corps): THREE.Group {
    let m = this.modeles.get(c.nom)
    if (!m) {
      m = estCaillou(c)
        ? objetAvecContours(geometrieCaillou(c.nom))
        : objetAvecContours(geometrieEngin(c.modele ?? 'sonde', c.tailleM ?? 10))
      if (estCaillou(c)) m.scale.setScalar(c.rayon || RAYON_INCONNU)
      // Orientation fixe, propre à chaque objet.
      const g = [...c.nom].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7)
      m.rotation.set((g % 628) / 100, ((g >> 3) % 628) / 100, ((g >> 6) % 628) / 100)
      this.modeles.set(c.nom, m)
      this.scene.add(m)
    }
    return m
  }

  private ligneOrbite(c: Corps, t: number): { ligne: THREE.Line; points: Vecteur3[] | null } {
    let o = this.orbites.get(c.nom)
    const validite = c.type === 'satellite' ? 600_000 : 30 * MS_PAR_JOUR
    if (!o || Math.abs(t - o.t) > validite) {
      const points = traceOrbite(c.nom, t, c.type === 'satellite' ? 96 : 256)
      if (!o) {
        const ligne = new THREE.Line(new THREE.BufferGeometry(), materiauTrait(0.28))
        ligne.frustumCulled = false
        ligne.renderOrder = 2
        this.scene.add(ligne)
        o = { ligne, t, points }
        this.orbites.set(c.nom, o)
      }
      o.t = t
      o.points = points
      if (points) {
        const tableau = new Float32Array(points.length * 3)
        points.forEach((p, i) => tableau.set([p.x, p.y, p.z], 3 * i))
        o.ligne.geometry.setAttribute('position', new THREE.BufferAttribute(tableau, 3))
      }
    }
    return o
  }

  /** Dessine l'image à l'instant t et renvoie la place des astres à l'écran (pour les noms et les flèches). */
  dessiner(t: number, regard: Regard, reglages: ReglagesVue):
    { capsule: EtatCapsule; capsuleEcran: { x: number; y: number; r: number }; astres: AstreEcran[] } {
    const etat = etatCapsule(t)
    const O = etat.position

    // --- Caméra : derrière la capsule, vers l'avant (cap), décalée du regard de l'utilisateur.
    const avant = new THREE.Vector3(etat.cap.x, etat.cap.y, etat.cap.z)
    const z = new THREE.Vector3(0, 0, 1)
    const haut0 = z.clone().addScaledVector(avant, -avant.dot(z))
    if (haut0.lengthSq() < 1e-6) haut0.set(1, 0, 0)
    haut0.normalize()
    const g = avant.clone().applyAxisAngle(haut0, regard.lacet)
    const droite = g.clone().cross(haut0).normalize()
    g.applyAxisAngle(droite, regard.tangage)
    const haut = droite.clone().cross(g).normalize()
    const el = Vue3D.elevation(regard.recul)
    const arriere = g.clone().negate().applyAxisAngle(haut, Vue3D.cote(regard.recul))
    const posCam = arriere.multiplyScalar(regard.recul * Math.cos(el)).addScaledVector(haut, regard.recul * Math.sin(el))
    this.camera.position.copy(posCam)
    this.camera.up.copy(haut)
    this.camera.lookAt(g.clone().multiplyScalar(regard.recul * Vue3D.visee(regard.recul)))
    this.camera.updateMatrixWorld()
    const camAbs = { x: O.x + posCam.x, y: O.y + posCam.y, z: O.z + posCam.z }
    COMMUNS.facteurProfondeur.value = 2 / Math.log2(this.camera.far + 1)
    COMMUNS.tanDemiChamp.value = Math.tan((CHAMP * Math.PI) / 360)
    const focale = this.hauteur / 2 / Math.tan((CHAMP * Math.PI) / 360)
    const vue = this.camera.matrixWorldInverse

    // --- Positions (une fois par image). Les satellites artificiels sont écartés de la Terre vus de loin (triche).
    const cache = new Map<string, Vecteur3>()
    const dist = (p: Vecteur3) => Math.hypot(p.x - camAbs.x, p.y - camAbs.y, p.z - camAbs.z)
    const pos = (nom: string): Vecteur3 => {
      let p = cache.get(nom)
      if (p) return p
      const c = corps(nom)!
      if (c.type === 'satellite' && c.parent) {
        const o = pos(c.parent)
        const kmParPx = dist(o) / focale
        const rel = positionAfficheeEspace(positionRelative(nom, t), corps(c.parent)!.rayon, kmParPx)
        p = { x: o.x + rel.x, y: o.y + rel.y, z: o.z + rel.z }
      } else p = position(nom, t)
      cache.set(nom, p)
      return p
    }
    const relatif = (p: Vecteur3) => new THREE.Vector3(p.x - O.x, p.y - O.y, p.z - O.z)
    const versSoleil = (p: Vecteur3) => new THREE.Vector3(-p.x, -p.y, -p.z).normalize().transformDirection(vue)

    // --- Quels astres : le premier niveau, et les systèmes assez grands à l'écran pour se distinguer de leur planète.
    const aDessiner: Corps[] = [...PREMIER_NIVEAU]
    const ouverts: string[] = []
    for (const nom of AVEC_ENFANTS) {
      const rayonPx = ((RAYON_SYSTEME.get(nom) ?? 0) / dist(pos(nom))) * focale
      // En dessous d'une dizaine de pixels, les lunes s'entassent en pâté sur leur planète : on attend.
      if (rayonPx < 10) continue
      ouverts.push(nom)
      aDessiner.push(...enfants(nom))
    }

    // --- Astres.
    for (const m of this.spheres.values()) m.visible = false
    for (const m of this.modeles.values()) m.visible = false
    let n = 0
    const astres: AstreEcran[] = []
    const ajouterPoint = (v: THREE.Vector3) => {
      if (n < 2000) this.positionsPoints.set([v.x, v.y, v.z], 3 * n++)
    }
    for (const c of aDessiner) {
      const p = pos(c.nom)
      const d = dist(p)
      const v = relatif(p)
      const rayon = estCaillou(c) ? c.rayon || RAYON_INCONNU : c.rayon
      const r = c.tailleM ? ((c.tailleM * M) / 2 / d) * focale : (rayon / d) * focale
      if (c.tailleM ? r * 2 >= 8 : estCaillou(c) ? r >= 2.5 : r >= 2) {
        const objet = c.tailleM || estCaillou(c) ? this.modele(c) : this.sphere(c)
        objet.visible = true
        objet.position.copy(v)
        const sol = versSoleil(p)
        objet.traverse((o) => {
          const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
          if (mat?.uniforms?.versSoleil) mat.uniforms.versSoleil.value.copy(sol)
        })
      } else ajouterPoint(v)
      const direction = new THREE.Vector3(p.x - camAbs.x, p.y - camAbs.y, p.z - camAbs.z).divideScalar(d)
      const angle = d > rayon ? Math.asin(rayon / d) : Math.PI / 2
      // Rayon apparent exact (le disque d'une planète vue de près est bien plus grand que R / d).
      const rEcran = c.tailleM ? r : Math.tan(Math.min(angle, 1.5)) * focale
      astres.push({ corps: c, ...this.ecran(v), r: rEcran, distance: d, cache: false, direction, angle })
    }

    // --- La capsule : son modèle, orienté selon son cap, et un point quand elle devient minuscule.
    this.capsule.position.set(0, 0, 0)
    this.capsule.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), avant)
    const solCapsule = versSoleil(O)
    this.capsule.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
      if (mat?.uniforms?.versSoleil) mat.uniforms.versSoleil.value.copy(solCapsule)
    })
    const rCapsule = ((TAILLE_CAPSULE_M * M) / 2 / regard.recul) * focale
    if (rCapsule * 2 < 8) ajouterPoint(new THREE.Vector3())
    this.points.geometry.setDrawRange(0, n)
    ;(this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true

    // --- Orbites : seulement si le tracé est assez grand pour se voir, et assez fin (une orbite en n segments
    // s'écarte de la vraie courbe de R·(1 − cos(π/n))) pour passer sur l'astre vu de près.
    for (const o of this.orbites.values()) o.ligne.visible = false
    if (reglages.orbites) {
      const candidats = [
        ...PREMIER_NIVEAU.filter((c) => c.type === 'planete' || c.type === 'naine'),
        ...ouverts.flatMap((nom) => enfants(nom).filter((c) => grandeLune(c) || c.type === 'satellite')),
      ]
      for (const c of candidats) {
        const { ligne, points } = this.ligneOrbite(c, t)
        if (!points) continue
        const p = pos(c.nom)
        const centre = c.parent ? pos(c.parent) : { x: 0, y: 0, z: 0 }
        const rayon = Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z)
        const fleche = rayon * (1 - Math.cos(Math.PI / (points.length - 1)))
        // On cache aussi les orbites quand on est tout près de la capsule par rapport à leur taille : vues par la
        // tranche, elles ne font que barrer l'écran.
        if ((rayon / Math.max(dist(centre), rayon)) * focale < 6 || (fleche / dist(p)) * focale > 1.5) continue
        if (regard.recul < 0.02 * rayon) continue
        ligne.visible = true
        ligne.position.copy(relatif(centre))
        if (c.type === 'satellite') {
          const kmParPx = dist(centre) / focale
          const attr = ligne.geometry.getAttribute('position') as THREE.BufferAttribute
          points.forEach((q, i) => {
            const a = positionAfficheeEspace(q, corps(c.parent!)!.rayon, kmParPx)
            attr.setXYZ(i, a.x, a.y, a.z)
          })
          attr.needsUpdate = true
        }
      }
    }

    this.etoiles.visible = reglages.etoiles
    this.etoiles.position.copy(this.camera.position)
    this.renderer.render(this.scene, this.camera)

    // --- Astres cachés derrière une sphère plus proche (pour ne pas écrire leur nom).
    const grosses = astres.filter((a) => a.r > 2 && !a.corps.tailleM)
    for (const a of astres) {
      for (const b of grosses) {
        if (b === a || b.distance >= a.distance) continue
        if (a.direction.angleTo(b.direction) < b.angle) { a.cache = true; break }
      }
    }
    return { capsule: etat, capsuleEcran: { ...this.ecran(new THREE.Vector3()), r: rCapsule }, astres }
  }

  /** Position à l'écran d'un point de la scène. */
  private ecran(v: THREE.Vector3): { x: number; y: number; devant: boolean } {
    const vc = v.clone().applyMatrix4(this.camera.matrixWorldInverse)
    const devant = vc.z < 0
    const p = vc.applyMatrix4(this.camera.projectionMatrix)
    let x = p.x, y = p.y
    if (!devant) { x = -x; y = -y }
    return { x: (x * 0.5 + 0.5) * this.largeur, y: (-y * 0.5 + 0.5) * this.hauteur, devant }
  }
}
