// La carte schématique (2D) : celle dont le joueur se sert la plupart du temps. Vue du dessus de l'écliptique,
// directions réelles, distances écrasées (projection.ts), tailles des astres fausses mais lisibles.
// Deux niveaux : le système solaire, et le système d'une planète (ses lunes, ses satellites, les engins qui
// l'accompagnent). Style BD tramée : aplats de couleur cernés d'encre, face de nuit en trame de points.
// La carte ne calcule aucune position réelle : elle les demande au moteur, puis les projette.

import { couleurAstre } from '../affichage3d/couleurs'
import { etatCapsule } from '../moteur/capsule'
import { CORPS, astreDominant, corps, enfants, position, type Corps } from '../moteur/corps'
import { traceOrbite } from '../moteur/orbite'
import { MS_PAR_JOUR, UA_KM } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'
import { projeter, rayonEcran, type Echelle } from './projection'

export const CAPSULE = 'Andromeda'

/** Échelle du système solaire : de Mercure (0,39 UA) à la ceinture de Kuiper (50 UA) dans le demi-écran. */
const ECHELLE_SOLEIL: Echelle = { dMin: 0.15 * UA_KM, d0: 0.25 * UA_KM, dMax: 50 * UA_KM, r0: 14, rMax: 172 }
/** Rayon dessiné d'une planète au centre de son système. */
const RAYON_CENTRE = 26

export interface ReglagesCarte { orbites: boolean; noms: boolean }

export interface Couleurs2D { encre: string; fond: string }

/** Ce qui est dessiné à l'écran (pour le toucher et les repères). */
interface Dessine { nom: string; x: number; y: number; r: number }

const GEANTES = new Set(['Jupiter', 'Saturne', 'Uranus', 'Neptune'])
const grandeLune = (c: Corps) => c.nom === 'Lune' || (c.type === 'lune' && c.rayon >= 100)

/** Système (niveau de la carte) où se trouve un astre : 'Soleil' ou le nom d'une planète. */
export function systemeDe(nom: string, t: number): string {
  if (nom === CAPSULE) return astreDominant(etatCapsule(t).position, t)
  const c = corps(nom)
  if (!c) return 'Soleil'
  if (c.type === 'lune' || c.type === 'satellite') return c.parent!
  if (c.type === 'sonde') return astreDominant(position(nom, t), t)
  return 'Soleil'
}

/** Vrai si une planète a quelque chose à montrer dans son système. */
export function aUnSysteme(nom: string, t: number): boolean {
  if (enfants(nom).length > 0) return true
  return CORPS.some((c) => c.type === 'sonde' && systemeDe(c.nom, t) === nom)
}

// Trames de points (ombres), une par densité, préparées une fois.
const TRAMES = new Map<string, CanvasPattern>()
function trame(ctx: CanvasRenderingContext2D, couleur: string, densite: number, pixelRatio: number): CanvasPattern {
  const cle = `${couleur}:${densite}:${pixelRatio}`
  let m = TRAMES.get(cle)
  if (!m) {
    const cote = Math.round(4 * pixelRatio)
    const c = document.createElement('canvas')
    c.width = c.height = cote
    const g = c.getContext('2d')!
    g.fillStyle = couleur
    g.beginPath()
    g.arc(cote / 2, cote / 2, (cote / 2) * densite, 0, 2 * Math.PI)
    g.fill()
    m = ctx.createPattern(c, 'repeat')!
    m.setTransform(new DOMMatrix().scale(1 / pixelRatio).rotate(45))
    TRAMES.set(cle, m)
  }
  return m
}

// Hachures (style Moebius) : traits parallèles à 45°, ou croisés, préparés une fois.
const HACHURES = new Map<string, CanvasPattern>()
function hachure(ctx: CanvasRenderingContext2D, couleur: string, epaisseur: number, croisee: boolean,
  pixelRatio: number): CanvasPattern {
  const cle = `${couleur}:${epaisseur}:${croisee}:${pixelRatio}`
  let m = HACHURES.get(cle)
  if (!m) {
    const cote = Math.round(4.5 * pixelRatio)
    const c = document.createElement('canvas')
    c.width = c.height = cote
    const g = c.getContext('2d')!
    g.strokeStyle = couleur
    g.lineWidth = epaisseur * pixelRatio
    g.beginPath()
    for (const k of [-1, 0, 1]) { g.moveTo(k * cote, cote); g.lineTo(k * cote + cote, 0) }
    if (croisee) for (const k of [-1, 0, 1]) { g.moveTo(k * cote, 0); g.lineTo(k * cote + cote, cote) }
    g.stroke()
    m = ctx.createPattern(c, 'repeat')!
    m.setTransform(new DOMMatrix().scale(1 / pixelRatio))
    HACHURES.set(cle, m)
  }
  return m
}

/** Mélange deux couleurs « #rrggbb » (k = part de la seconde). */
function melanger(a: string, b: string, k: number): string {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16)
  const canal = (d: number) => Math.round(((x >> d) & 255) * (1 - k) + ((y >> d) & 255) * k)
  return `#${((canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).padStart(6, '0')}`
}

const ENCRE_MOEBIUS = '#2b2138'

export class Carte2D {
  /** Niveau affiché : 'Soleil' (le système solaire) ou une planète. */
  niveau = 'Soleil'
  /** Zoom et décalage de la carte (pixels), réglés par les gestes. */
  zoom = 1
  dx = 0
  dy = 0
  largeur = 390
  hauteur = 844
  pixelRatio = 2
  private dessines: Dessine[] = []
  private moebius = false
  private orbites = new Map<string, { t: number; points: Vecteur3[] | null }>()

  /** Centre de la carte à l'écran (entre la ligne d'infos et les boutons). */
  private centre(): { x: number; y: number } {
    return { x: this.largeur / 2 + this.dx, y: (56 + this.hauteur - 130) / 2 + this.dy }
  }

  /** Échelle du niveau affiché. */
  echelle(t: number): Echelle {
    if (this.niveau === 'Soleil') return ECHELLE_SOLEIL
    const planete = corps(this.niveau)!
    let loin = 0
    for (const nom of this.contenu(t)) {
      if (nom === this.niveau) continue
      const p = nom === CAPSULE ? etatCapsule(t).position : position(nom, t)
      const o = position(this.niveau, t)
      loin = Math.max(loin, Math.hypot(p.x - o.x, p.y - o.y, p.z - o.z))
    }
    return { dMin: planete.rayon, d0: 0.05 * planete.rayon, dMax: Math.max(loin * 1.08, planete.rayon * 3), r0: RAYON_CENTRE, rMax: 172 }
  }

  /** Noms des astres montrés au niveau affiché (et la capsule si elle y est). */
  contenu(t: number): string[] {
    const noms: string[] = []
    if (this.niveau === 'Soleil') {
      for (const c of CORPS) if (!c.parent && (c.type !== 'sonde' || systemeDe(c.nom, t) === 'Soleil')) noms.push(c.nom)
    } else {
      noms.push(this.niveau, ...enfants(this.niveau).map((c) => c.nom))
      for (const c of CORPS) if (c.type === 'sonde' && systemeDe(c.nom, t) === this.niveau) noms.push(c.nom)
    }
    // La capsule : dans son système, et au niveau du système solaire (posée à côté de sa planète).
    if (this.niveau === 'Soleil' || systemeDe(CAPSULE, t) === this.niveau) noms.push(CAPSULE)
    return noms
  }

  /** Position à l'écran d'un astre du niveau affiché. */
  private ecran(nom: string, t: number, e: Echelle): { x: number; y: number } {
    const c = this.centre()
    if (nom === this.niveau) return c
    const p = nom === CAPSULE ? etatCapsule(t).position : position(nom, t)
    const o = this.niveau === 'Soleil' ? { x: 0, y: 0, z: 0 } : position(this.niveau, t)
    const q = projeter(p.x - o.x, p.y - o.y, e, p.z - o.z)
    return { x: c.x + q.x * this.zoom, y: c.y - q.y * this.zoom }
  }

  /** Rayon dessiné (pixels) : faux mais lisible. */
  private rayon(c: Corps): number {
    if (c.nom === this.niveau) return this.niveau === 'Soleil' ? 10 : RAYON_CENTRE
    if (c.type === 'etoile') return 10
    if (GEANTES.has(c.nom)) return 7.5
    if (c.type === 'planete') return 5
    if (c.type === 'naine') return 3.5
    if (c.type === 'lune') return Math.min(9, Math.max(2, 2 + 1.7 * Math.log(1 + (c.rayon || 1) / 60)))
    return 2.6
  }

  /** Dessine la carte ; renvoie la place (à l'écran) d'un astre donné, même hors du niveau (sa planète). */
  dessiner(ctx: CanvasRenderingContext2D, t: number, reglages: ReglagesCarte, couleurs: Couleurs2D, style: string,
    selection: string | null, directionCapsule?: { x: number; y: number } | null):
    { x: number; y: number; r: number; visible: boolean } | null {
    const e = this.echelle(t)
    const centre = this.centre()
    ctx.clearRect(0, 0, this.largeur, this.hauteur)
    const bd = style !== 'plat'
    const moebius = style === 'moebius'
    this.moebius = moebius
    // Moebius : couleurs adoucies vers le sable, encre brun-violet.
    const couleurDe = (c: Corps) => {
      if (!bd) return couleurs.fond
      const k = `#${couleurAstre(c).getHexString()}`
      return moebius ? melanger(k, '#f7e8cc', 0.3) : k
    }
    if (moebius && couleurs.encre === '#1f1b18') couleurs = { ...couleurs, encre: ENCRE_MOEBIUS }

    // Ceintures (au niveau du système solaire) : astéroïdes de 2,2 à 3,3 UA, Kuiper de 30 à 50 UA, en trame légère.
    if (this.niveau === 'Soleil') {
      for (const [a, b] of [[2.2, 3.3], [30, 50]]) {
        ctx.beginPath()
        ctx.arc(centre.x, centre.y, rayonEcran(b * UA_KM, e) * this.zoom, 0, 2 * Math.PI)
        ctx.arc(centre.x, centre.y, rayonEcran(a * UA_KM, e) * this.zoom, 0, 2 * Math.PI, true)
        ctx.fillStyle = trame(ctx, couleurs.encre, 0.28, this.pixelRatio)
        ctx.globalAlpha = 0.35
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    // Orbites : les vraies trajectoires, projetées point par point.
    const contenu = this.contenu(t)
    if (reglages.orbites) {
      ctx.lineWidth = moebius ? 0.9 : 1.3
      for (const nom of contenu) {
        const c = corps(nom)
        if (!c || nom === this.niveau) continue
        if (!(c.type === 'planete' || c.type === 'naine' || grandeLune(c) || c.type === 'satellite' || this.peuDeLunes())) continue
        const points = this.orbite(c, t)
        if (!points) continue
        ctx.beginPath()
        for (const [i, p] of points.entries()) {
          // Planètes : points héliocentriques ; lunes et satellites : relatifs à la planète.
          const q = projeter(p.x, p.y, e, p.z)
          const x = centre.x + q.x * this.zoom, y = centre.y - q.y * this.zoom
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = bd ? couleurDe(c) : couleurs.encre
        ctx.globalAlpha = bd ? 0.75 : 0.3
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    // Astres : le centre d'abord, puis ce qui tourne autour (toujours dessiné par-dessus).
    const soleil = this.niveau === 'Soleil' ? { x: 0, y: 0 } : (() => {
      const o = position(this.niveau, t)
      return { x: -o.x, y: -o.y }
    })()
    const angleSoleil = Math.atan2(-soleil.y, soleil.x) // direction du Soleil à l'écran (y vers le bas)
    this.dessines = []
    const astres = contenu.filter((n) => n !== CAPSULE).map((n) => corps(n)!)
    for (const c of astres.sort((a, b) => (b.nom === this.niveau ? 1 : 0) - (a.nom === this.niveau ? 1 : 0))) {
      const { x, y } = this.ecran(c.nom, t, e)
      const r = this.rayon(c)
      this.dessines.push({ nom: c.nom, x, y, r })
      if (x < -20 || x > this.largeur + 20 || y < -20 || y > this.hauteur + 20) continue
      // Au niveau du système solaire, chaque astre est éclairé depuis le centre ; dans un système, tous par la
      // direction du Soleil.
      const versSoleil = this.niveau === 'Soleil' ? Math.atan2(centre.y - y, centre.x - x) : angleSoleil
      if (c.type === 'sonde' || c.type === 'satellite') this.point(ctx, x, y, r, bd ? couleurDe(c) : couleurs.encre, couleurs)
      else this.disque(ctx, x, y, r, couleurDe(c), c.type === 'etoile' ? null : versSoleil, couleurs, bd)
    }

    // La capsule : un petit chevron cerise, dans le sens de sa marche.
    if (contenu.includes(CAPSULE)) {
      const etat = etatCapsule(t)
      let { x, y } = this.ecran(CAPSULE, t, e)
      // Dans le système d'une planète, vue du système solaire : posée à côté de sa planète (pas dessus).
      if (this.niveau === 'Soleil' && systemeDe(CAPSULE, t) !== 'Soleil') { x += 9; y -= 9 }
      // Orientation : dans le sens de la marche TEL QU'IL APPARAÎT sur la carte (la projection écrase les distances,
      // donc les angles changent) ; s'il y a un trajet, le long de son premier tronçon dessiné.
      let a: number
      if (directionCapsule) a = Math.atan2(directionCapsule.y, directionCapsule.x)
      else {
        const o = this.niveau === 'Soleil' ? { x: 0, y: 0, z: 0 } : position(this.niveau, t)
        const p = etat.position
        const pas = Math.max(1, 0.002 * Math.hypot(p.x - o.x, p.y - o.y, p.z - o.z))
        const devant = { x: p.x + etat.cap.x * pas, y: p.y + etat.cap.y * pas, z: p.z + etat.cap.z * pas }
        const q0 = this.projeterPoint(p, t, e), q1 = this.projeterPoint(devant, t, e)
        a = Math.atan2(q1.y - q0.y, q1.x - q0.x)
      }
      this.dessines.push({ nom: CAPSULE, x, y, r: 6 })
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(8, 0)
      ctx.lineTo(-5, 5.5)
      ctx.lineTo(-2.5, 0)
      ctx.lineTo(-5, -5.5)
      ctx.closePath()
      ctx.fillStyle = bd ? '#e04b37' : couleurs.encre
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.strokeStyle = couleurs.encre
      ctx.stroke()
      ctx.restore()
    }

    if (reglages.noms) this.noms(ctx, couleurs, selection)

    // Place de la sélection : elle-même si elle est à ce niveau ; au niveau du système solaire, la planète qui
    // l'abrite ; dans le système d'une planète, une flèche dans sa direction réelle si elle est ailleurs.
    if (!selection) return null
    let cible = this.dessines.find((d) => d.nom === selection)
    if (!cible && this.niveau === 'Soleil') cible = this.dessines.find((d) => d.nom === systemeDe(selection, t))
    if (!cible) {
      const p = selection === CAPSULE ? etatCapsule(t).position : position(selection, t)
      const o = position(this.niveau, t)
      const dx = p.x - o.x, dy = p.y - o.y, l = Math.hypot(dx, dy) || 1
      return { x: centre.x + (dx / l) * 5000, y: centre.y - (dy / l) * 5000, r: 0, visible: false }
    }
    const visible = cible.x >= 0 && cible.x <= this.largeur && cible.y >= 40 && cible.y <= this.hauteur - 100
    return { x: cible.x, y: cible.y, r: cible.r, visible }
  }

  /**
   * Position à l'écran d'un point de l'espace (héliocentrique, km) à l'instant tPoint, au niveau affiché : dans le
   * système d'une planète, le point est pris par rapport à la planète AU MÊME INSTANT (le trajet suit la planète).
   */
  projeterPoint(r: Vecteur3, tPoint: number, e: Echelle): { x: number; y: number } {
    const c = this.centre()
    const o = this.niveau === 'Soleil' ? { x: 0, y: 0, z: 0 } : position(this.niveau, tPoint)
    const q = projeter(r.x - o.x, r.y - o.y, e, r.z - o.z)
    return { x: c.x + q.x * this.zoom, y: c.y - q.y * this.zoom }
  }

  /** Position à l'écran d'un astre déjà dessiné (dont la capsule), ou null. */
  place(nom: string): { x: number; y: number; r: number } | null {
    const d = this.dessines.find((x) => x.nom === nom)
    return d ? { x: d.x, y: d.y, r: d.r } : null
  }

  /**
   * Les deux traits de la navigation : le pointillé de la capsule vers la position ACTUELLE de la destination, et
   * le trajet réel (courbe) jusqu'au point de rendez-vous, marqué d'une croix cerclée.
   */
  dessinerTraits(ctx: CanvasRenderingContext2D, t: number, cible: { x: number; y: number } | null,
    trajet: { t: number; r: Vecteur3 }[] | null, rendezVous: { r: Vecteur3; t: number } | null, accent: string,
    c: Couleurs2D, orbiteCapsule: { t: number; r: Vecteur3 }[] | null = null): void {
    const e = this.echelle(t)
    const capsule = this.place(CAPSULE)
    ctx.save()
    // L'orbite de la capsule autour de son astre (dans le système de cet astre) : un trait fin de couleur vive.
    if (orbiteCapsule && orbiteCapsule.length > 1 && this.niveau !== 'Soleil') {
      ctx.beginPath()
      for (const [i, p] of orbiteCapsule.entries()) {
        const q = this.projeterPoint(p.r, p.t, e)
        if (i === 0) ctx.moveTo(q.x, q.y)
        else ctx.lineTo(q.x, q.y)
      }
      ctx.lineWidth = 1.4
      ctx.strokeStyle = accent
      ctx.stroke()
    }
    if (capsule && cible) {
      ctx.setLineDash([3, 5])
      ctx.lineWidth = 1.6
      ctx.strokeStyle = c.encre
      ctx.beginPath()
      ctx.moveTo(capsule.x, capsule.y)
      ctx.lineTo(cible.x, cible.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
    if (trajet && trajet.length > 1) {
      ctx.beginPath()
      // Au niveau du système solaire, la capsule est dessinée à côté de la Terre : le trajet part de son dessin.
      for (const [i, p] of trajet.entries()) {
        const q = this.projeterPoint(p.r, p.t, e)
        if (i === 0 && capsule && this.niveau === 'Soleil') ctx.moveTo(capsule.x, capsule.y)
        else if (i === 0) ctx.moveTo(q.x, q.y)
        else ctx.lineTo(q.x, q.y)
      }
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = 4.5
      ctx.strokeStyle = c.encre
      ctx.stroke()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = accent
      ctx.stroke()
    }
    if (rendezVous) {
      const q = this.projeterPoint(rendezVous.r, rendezVous.t, e)
      ctx.beginPath()
      ctx.arc(q.x, q.y, 7, 0, 2 * Math.PI)
      ctx.moveTo(q.x - 5, q.y - 5); ctx.lineTo(q.x + 5, q.y + 5)
      ctx.moveTo(q.x + 5, q.y - 5); ctx.lineTo(q.x - 5, q.y + 5)
      ctx.lineWidth = 3.5
      ctx.strokeStyle = c.fond
      ctx.stroke()
      ctx.lineWidth = 1.6
      ctx.strokeStyle = c.encre
      ctx.stroke()
    }
    ctx.restore()
  }

  /** Disque d'un astre : aplat de sa couleur, face de nuit en trame, cerné d'encre. */
  private disque(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string,
    versSoleil: number | null, c: Couleurs2D, bd: boolean): void {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fillStyle = couleur
    ctx.fill()
    if (versSoleil !== null) {
      ctx.save()
      ctx.clip()
      // Demi-plan opposé au Soleil : trame claire près du terminateur, trame serrée au-delà.
      const ux = Math.cos(versSoleil), uy = Math.sin(versSoleil)
      const demiPlan = (debut: number) => {
        ctx.beginPath()
        const px = -ux * debut * r, py = -uy * debut * r
        ctx.moveTo(x + px - uy * 2 * r, y + py + ux * 2 * r)
        ctx.lineTo(x + px + uy * 2 * r, y + py - ux * 2 * r)
        ctx.lineTo(x + px + uy * 2 * r - ux * 3 * r, y + py - ux * 2 * r - uy * 3 * r)
        ctx.lineTo(x + px - uy * 2 * r - ux * 3 * r, y + py + ux * 2 * r - uy * 3 * r)
        ctx.closePath()
      }
      if (this.moebius) {
        // Ombre en aplat coloré (violet), hachures seulement le long du terminateur.
        const ombre = melanger(couleur, '#54437a', 0.6)
        demiPlan(0.1)
        ctx.fillStyle = ombre
        ctx.fill()
        demiPlan(-0.2)
        ctx.fillStyle = hachure(ctx, c.encre, 0.8, false, this.pixelRatio)
        ctx.fill()
        demiPlan(0.5)
        ctx.fillStyle = ombre
        ctx.fill()
        ctx.restore()
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.lineWidth = r > 15 ? 1.6 : 1
        ctx.strokeStyle = c.encre
        ctx.stroke()
        return
      }
      for (const [debut, densite] of [[0, 0.55], [0.4, 0.95]] as const) {
        ctx.beginPath()
        const px = -ux * debut * r, py = -uy * debut * r
        ctx.moveTo(x + px - uy * 2 * r, y + py + ux * 2 * r)
        ctx.lineTo(x + px + uy * 2 * r, y + py - ux * 2 * r)
        ctx.lineTo(x + px + uy * 2 * r - ux * 3 * r, y + py - ux * 2 * r - uy * 3 * r)
        ctx.lineTo(x + px - uy * 2 * r - ux * 3 * r, y + py + ux * 2 * r - uy * 3 * r)
        ctx.closePath()
        ctx.fillStyle = bd ? trame(ctx, c.encre, densite, this.pixelRatio) : c.encre
        if (!bd && debut > 0) continue
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.lineWidth = r > 15 ? 2.5 : 1.5
    ctx.strokeStyle = c.encre
    ctx.stroke()
    if (versSoleil === null && r < 30) {
      // Le Soleil : des rayons.
      ctx.beginPath()
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6, r0 = r + 3, r1 = r + (k % 2 ? 6 : 10)
        ctx.moveTo(x + r0 * Math.cos(a), y + r0 * Math.sin(a))
        ctx.lineTo(x + r1 * Math.cos(a), y + r1 * Math.sin(a))
      }
      ctx.lineCap = 'round'
      ctx.lineWidth = 4
      ctx.strokeStyle = c.encre
      ctx.stroke()
      ctx.lineWidth = 2
      ctx.strokeStyle = bd ? couleur : c.fond
      ctx.stroke()
    }
  }

  /** Engin : un rond de sa couleur cerné d'encre. */
  private point(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string, c: Couleurs2D): void {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fillStyle = couleur
    ctx.fill()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = c.encre
    ctx.stroke()
  }

  /** Noms : par ordre d'importance, sans chevauchement ; la sélection a son étiquette, on ne la nomme pas ici. */
  private noms(ctx: CanvasRenderingContext2D, c: Couleurs2D, selection: string | null): void {
    const priorite = (d: Dessine) => {
      if (d.nom === CAPSULE) return 0
      const k = corps(d.nom)!
      return d.nom === this.niveau ? -1 : k.type === 'etoile' ? 1 : k.type === 'planete' ? 2 : k.type === 'naine' ? 3
        : grandeLune(k) ? 4 : k.type === 'satellite' || k.type === 'sonde' ? 5 : 6
    }
    const occupes = this.dessines.map((d) => ({ x0: d.x - d.r, y0: d.y - d.r, x1: d.x + d.r, y1: d.y + d.r }))
    ctx.font = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = c.fond
    ctx.fillStyle = c.encre
    for (const d of [...this.dessines].sort((a, b) => priorite(a) - priorite(b))) {
      if (d.nom === selection) continue
      // Les petites lunes (des dizaines autour des géantes) ne sont nommées que si l'on zoome.
      const k = corps(d.nom)
      if (k?.type === 'lune' && !grandeLune(k) && !this.peuDeLunes() && this.zoom < (k.rayon >= 20 ? 1.6 : 3.5)) continue
      const texte = d.nom
      const l = ctx.measureText(texte).width
      // À droite si possible, sinon à gauche ; le nom du centre d'un système va dessous.
      const essais = d.nom === this.niveau && this.niveau !== 'Soleil'
        ? [{ x: d.x - l / 2, y: d.y + d.r + 12 }]
        : [{ x: d.x + d.r + (d.nom === 'Soleil' ? 12 : 5), y: d.y }, { x: d.x - d.r - 5 - l, y: d.y }]
      for (const p of essais) {
        const b = { x0: p.x - 2, y0: p.y - 7, x1: p.x + l + 2, y1: p.y + 7 }
        if (b.x0 < 4 || b.x1 > this.largeur - 4 || b.y0 < 44 || b.y1 > this.hauteur - 120) continue
        if (occupes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)) continue
        occupes.push(b)
        ctx.strokeText(texte, p.x, p.y)
        ctx.fillText(texte, p.x, p.y)
        break
      }
    }
  }

  private orbite(c: Corps, t: number): Vecteur3[] | null {
    const o = this.orbites.get(c.nom)
    const validite = c.type === 'satellite' ? 600_000 : 30 * MS_PAR_JOUR
    if (o && Math.abs(t - o.t) < validite) return o.points
    const points = traceOrbite(c.nom, t, c.type === 'satellite' ? 96 : 256)
    this.orbites.set(c.nom, { t, points })
    return points
  }

  /** Vrai si le système affiché a peu de lunes (Mars, la Terre…) : on les nomme et on trace leur orbite. */
  private peuDeLunes(): boolean {
    return this.niveau !== 'Soleil' && enfants(this.niveau).length <= 12
  }

  /** Astre touché (le plus proche du doigt, à moins de 24 pixels), ou null. */
  toucher(x: number, y: number): string | null {
    let meilleur: string | null = null
    let dMin = 24
    for (const d of this.dessines) {
      const ecart = Math.hypot(d.x - x, d.y - y) - d.r
      if (ecart < dMin) { dMin = ecart; meilleur = d.nom }
    }
    return meilleur
  }

  /** Ouvre un niveau (le système solaire ou celui d'une planète), vue recentrée. */
  ouvrir(niveau: string): void {
    this.niveau = niveau
    this.zoom = 1
    this.dx = this.dy = 0
  }

  glisser(dx: number, dy: number): void {
    this.dx += dx
    this.dy += dy
  }

  zoomer(facteur: number, sx: number, sy: number): void {
    const nouveau = Math.min(12, Math.max(0.6, this.zoom / facteur))
    const k = nouveau / this.zoom
    const c = this.centre()
    // Le point sous les doigts reste fixe.
    this.dx += (sx - c.x) * (1 - k)
    this.dy += (sy - c.y) * (1 - k)
    this.zoom = nouveau
  }
}
