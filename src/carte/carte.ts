// La carte (2D) : celle dont le joueur se sert tout le temps. Vue du dessus de l'écliptique, vraies distances
// entre les planètes, astres grossis mais proportionnés, et une loupe autour de chaque astre pour ses satellites et
// les engins qui l'accompagnent (loupe.ts). Zoom libre : on zoome directement vers un système pour en voir le contenu
// (décisions d'Adrien du 17/10/2026, qui remplacent l'échelle logarithmique et les deux niveaux du prototype).
// Style Moebius : aplats pastel cernés d'encre, face de nuit en aplat violet, hachures le long du terminateur.
// La carte ne calcule aucune position réelle : elle les demande au moteur, puis les projette.

import { couleurAstre } from './couleurs'
import { dessinerEngin } from './engins'
import { aUneIllustration, dessinerAstreIllustre, RAYON_ILLUSTRATION } from './illustrations'
import { anneauxGradues, CENTRES, projeter, projeterCorps, projeterPoussiere, rayonDessine, zoneDessinee, type Point2 } from './loupe'
import { BOTS } from '../donnees/messages'
import { etatCapsule } from '../moteur/capsule'
import { CORPS, corps, enfants, position, type Corps } from '../moteur/corps'
import { traceOrbite } from '../moteur/orbite'
import { positionsPoussiere } from '../moteur/poussiere'
import { MS_PAR_JOUR, UA_KM } from '../moteur/temps'
import type { Vecteur3 } from '../moteur/vecteur'

export const CAPSULE = 'Andromeda'

export interface ReglagesCarte { orbites: boolean; noms: boolean }

export interface Couleurs2D { encre: string; fond: string }

/** Ce qui est dessiné à l'écran (pour le toucher et les repères). */
interface Dessine { nom: string; x: number; y: number; r: number }

/** Taille minimale à l'écran (rayon, px) quand on dézoome, dans l'ordre des vraies tailles (le Soleil énorme, Mercure
 *  petite) : assez grande pour que chaque planète soit illustrée dès l'ouverture (essai demandé par Adrien le
 *  17/10/2026 ; l'illustration commence à 11 px). */
const MINIMUMS: Record<string, number> = {
  Soleil: 18, Jupiter: 16, Saturne: 15, Uranus: 13, Neptune: 13, Terre: 12, Vénus: 12, Mars: 11.5, Mercure: 11,
  Pluton: 11, Lune: 11,
}
/** Rayon le plus petit d'un astre, quand on a beaucoup dézoomé : un point. */
const RAYON_POINT = 1.8

/** Lunes : minimum selon leur vraie taille, toujours plus grandes à l'écran qu'un engin (demande d'Adrien, 17/10/2026). */
const minimumLune = (rayonKm: number) => (rayonKm >= 1000 ? 10 : rayonKm >= 200 ? 8 : 4.5)
/** Taille d'une silhouette d'engin (rayon, px) et son échelle de dessin. */
const RAYON_ENGIN = 6
/** En dessous de cet écart à l'écran (px) entre un lieu et sa planète, ses PNJ ne s'affichent plus (carte trop dézoomée). */
const SEUIL_PNJ = 24
/** Teinte des capsules des autres joueurs, selon leur Maison (celles du Profil). */
const TEINTES_MAISONS: Record<string, string> = { nettoyeurs: '#8fcf98', ingenieurs: '#f2c66a', mercenaires: '#f3a08b' }
const ECHELLE_ENGIN = 0.75
/** Demi-largeur de la vue générale (km) : les planètes jusqu'à Mars. */
const VUE_GENERALE = 2.2 * UA_KM
const KM_PAR_PX_MIN = 20
/** Dézoom maximal : jusqu'aux Voyager (demi-largeur de 200 UA), pour voir New Horizons et au-delà. */
const KM_PAR_PX_MAX = (200 * UA_KM) / 195
/** Planètes extérieures : elles ne rétrécissent qu'une fois New Horizons à l'écran (demande d'Adrien, 17/10/2026). */
const EXTERIEURES = new Set(['Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'])
const DE: Record<string, string> = { Terre: 'DE LA ', Uranus: "D'" }
/** Étendue des astres illustrés, en rayons du disque : rayons du Soleil, anneaux de Saturne et d'Uranus. */
const ETENDUES: Record<string, number> = { Soleil: 2.6, Saturne: 2.35, Uranus: 1.7 }


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
  largeur = 390
  hauteur = 844
  pixelRatio = 2
  /** Mode nuit : encre claire sur fond bleu nuit, astres un peu assombris. */
  nuit = false
  /** Ce qui est sur la carte (le jeu le dit : épaves vidées et chasseurs hors radar n'y sont pas). */
  surLaCarte: (nom: string, t: number) => boolean = () => true
  /** Centre de la vue (km de carte) et échelle (km par pixel). */
  centre: Point2 = { x: 0, y: 0 }
  kmParPx = VUE_GENERALE / 195
  /** Position de New Horizons par rapport au Soleil (km), mise à jour à chaque image. */
  private newHorizons = { x: 66 * UA_KM, y: 0 }
  private dessines: Dessine[] = []
  /** Angle du chevron de la capsule à l'écran (pour le faire pivoter en douceur) et instant du dernier dessin. */
  private angleCapsule: number | null = null
  private instantAngle = 0
  private orbites = new Map<string, { t: number; points: Vecteur3[] | null }>()
  /** Points dessinés de la poussière de satellites (km de carte), réutilisés d'une image à l'autre. */
  private pointsPoussiere = new Float64Array(0)

  /** Centre de la carte à l'écran (entre le bandeau d'alertes et la barre d'onglets). */
  private milieu(): { x: number; y: number } {
    return { x: this.largeur / 2, y: (144 + this.hauteur - 130) / 2 }
  }

  /** Point de carte (km) → écran (px). */
  ecranDe(q: Point2): { x: number; y: number } {
    const m = this.milieu()
    return { x: m.x + (q.x - this.centre.x) / this.kmParPx, y: m.y - (q.y - this.centre.y) / this.kmParPx }
  }

  /** Position à l'écran d'un point de l'espace (héliocentrique, km) à l'instant tPoint. */
  projeterPoint(r: Vecteur3, tPoint: number, suivant?: { p: Vecteur3; t: number }, tCentre?: number): { x: number; y: number } {
    return this.ecranDe(projeter({ p: r, t: tPoint, suivant, tCentre }))
  }

  /** Rayon dessiné (pixels) : grossi mais proportionné, jamais sous le minimum de l'astre. */
  private rayon(c: Corps): number {
    // Soleil et planètes intérieures : tailles minimales à l'échelle de la vue générale ; en dézoomant, elles
    // rétrécissent ensemble, jusqu'au point. Les planètes extérieures, assez éloignées les unes des autres, gardent leur
    // taille tant que New Horizons n'est pas entré dans l'écran (Soleil au milieu) (demandes d'Adrien, 17/10/2026).
    const facteur = EXTERIEURES.has(c.nom)
      ? Math.max(Math.abs(this.newHorizons.x) / (this.largeur / 2), Math.abs(this.newHorizons.y) / (this.hauteur / 2))
        / this.kmParPx
      : VUE_GENERALE / (this.largeur / 2) / this.kmParPx
    const minimum = MINIMUMS[c.nom] !== undefined && c.type !== 'lune'
      ? Math.max(RAYON_POINT, MINIMUMS[c.nom] * Math.min(1, facteur))
      : MINIMUMS[c.nom] ?? (c.type === 'lune' ? minimumLune(c.rayon) : 2)
    return Math.max(minimum, rayonDessine(c.nom) / this.kmParPx)
  }

  /** Système regardé : celui dont la zone remplit la vue, sinon le système solaire. */
  systemeRegarde(t: number): string {
    for (const nom of CENTRES) {
      const p = position(nom, t)
      const zone = zoneDessinee(nom) / this.kmParPx
      if (zone < this.largeur * 0.25) continue
      const e = this.ecranDe(p)
      const m = this.milieu()
      if (Math.hypot(e.x - m.x, e.y - m.y) < zone) return nom
    }
    return 'Soleil'
  }

  /** Titre de la carte : « SYSTÈME SOLAIRE », « SYSTÈME DE LA TERRE »… */
  titre(t: number): string {
    const s = this.systemeRegarde(t)
    return s === 'Soleil' ? 'SYSTÈME SOLAIRE' : `SYSTÈME ${DE[s] ?? 'DE '}${s.toUpperCase()}`
  }

  /** Vol de la caméra en cours (déplacement fluide vers ce qu'on veut voir), ou null. */
  private vol: { debut: number; duree: number; c0: Point2; k0: number; k1: number; bosse: number; fixe: Point2 | null } | null = null

  /**
   * Lance un vol de la caméra vers l'échelle k1 (km par pixel) : la carte glisse et zoome en douceur (demande d'Adrien du
   * 17/10/2026). Le point visé est soit fixe, soit donné à chaque image (ce que la caméra suit, qui bouge). De loin, la
   * caméra recule en chemin, pour qu'on voie d'où elle part et où elle va.
   */
  voler(k1: number, maintenant: number, vers: Point2, fixe = false): void {
    const d = Math.hypot(vers.x - this.centre.x, vers.y - this.centre.y)
    const bosse = Math.min(4, Math.max(0, Math.log(d / (Math.max(this.kmParPx, k1) * this.largeur * 0.6))))
    this.vol = { debut: maintenant, duree: 900 + 200 * bosse, c0: { ...this.centre }, k0: this.kmParPx, k1, bosse, fixe: fixe ? vers : null }
  }

  /** Vrai pendant un vol de la caméra. */
  get enVol(): boolean {
    return this.vol !== null
  }

  /** Place la caméra à chaque image : sur ce qu'elle suit (cible), ou à l'étape du vol en cours. */
  placerCamera(cible: Point2 | null, maintenant: number): void {
    const v = this.vol
    if (!v) {
      if (cible) this.centre = { x: cible.x, y: cible.y }
      return
    }
    const vise = v.fixe ?? cible ?? this.centre
    const u = Math.min(1, (maintenant - v.debut) / v.duree)
    const doux = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2) // départ et arrivée en douceur
    const tot = (x: number) => doux(Math.min(1, x / 0.6)), tard = (x: number) => doux(Math.max(0, (x - 0.4) / 0.6))
    // Pour zoomer, on glisse d'abord au-dessus de la cible ; pour reculer, on recule d'abord : l'écran n'est jamais vide.
    const avant = v.k1 < v.k0
    const ep = avant ? tot(u) : tard(u), ez = avant ? tard(u) : tot(u)
    this.centre = { x: v.c0.x + (vise.x - v.c0.x) * ep, y: v.c0.y + (vise.y - v.c0.y) * ep }
    const k = Math.exp(Math.log(v.k0) + (Math.log(v.k1) - Math.log(v.k0)) * ez + v.bosse * Math.sin(Math.PI * u))
    this.kmParPx = Math.min(KM_PAR_PX_MAX, Math.max(KM_PAR_PX_MIN, k))
    if (u >= 1) this.vol = null
  }

  /** Échelle (km par pixel) de la vue générale, et celle qui cadre le système d'un astre. */
  echelleGenerale(): number {
    return VUE_GENERALE / (this.largeur / 2)
  }
  /** Vue du système extérieur : le Soleil au centre, jusqu'à l'orbite de Pluton. */
  echelleExterieure(): number {
    return (42 * UA_KM) / (this.largeur / 2)
  }
  echelleSysteme(planete: string): number {
    return (zoneDessinee(planete) * 1.05) / (this.largeur / 2)
  }

  /**
   * Les PNJ (décisions d'Adrien du 20/10/2026) : un médaillon à leur lieu (à côté de l'astre ou de l'engin dessiné),
   * avec un signe s'ils ont quelque chose pour le joueur : « ! » une quête à proposer, « ? » ils attendent son retour.
   * Petite distinction (demande d'Adrien) : quête principale, losange doré ; secondaire, rond bleu. Et le losange (ou
   * rond) de l'objectif de la quête suivie, à son lieu.
   */
  dessinerPnj(ctx: CanvasRenderingContext2D, t: number, pnjs: { lieu: string; initiale: string; teinte: string; signe: '!' | '?' | null; principale: boolean }[],
    objectif: { lieu: string; principale: boolean } | null, couleurs: Couleurs2D): void {
    const placeDe = (lieu: string) => {
      const d = this.dessines.find((x) => x.nom === lieu)
      if (d) return d
      const q = this.ecranDe(projeterCorps(lieu, t))
      return { x: q.x, y: q.y, r: 4 }
    }
    const DORE = '#f2b53a', BLEU = '#8fb4e6'
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // L'objectif suivi : un grand losange (principale) ou un cercle (secondaire) pointillé autour du lieu.
    if (objectif) {
      const p = placeDe(objectif.lieu), r = Math.max(14, p.r + 9)
      if (p.x > -r && p.x < this.largeur + r && p.y > -r && p.y < this.hauteur + r) {
        ctx.beginPath()
        if (objectif.principale) { ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r, p.y); ctx.closePath() }
        else ctx.arc(p.x, p.y, r, 0, 2 * Math.PI)
        ctx.setLineDash([4, 3])
        ctx.lineWidth = 2
        ctx.strokeStyle = objectif.principale ? DORE : BLEU
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
    // Plusieurs PNJ au même lieu : leurs médaillons côte à côte. En dézoomant, ils s'effacent dès que leur lieu se
    // confond avec sa planète (demande d'Adrien du 20/10/2026 : ne pas encombrer la carte).
    const parLieu = new Map<string, number>()
    for (const n of pnjs) {
      if (this.lieuReplie(n.lieu, t)) continue
      const p = placeDe(n.lieu), k = parLieu.get(n.lieu) ?? 0
      parLieu.set(n.lieu, k + 1)
      const x = p.x + p.r * 0.75 + 12 + k * 22, y = p.y - p.r * 0.75 - 12
      if (x < -20 || x > this.largeur + 20 || y < -20 || y > this.hauteur + 20) continue
      ctx.beginPath()
      ctx.arc(x, y, 9, 0, 2 * Math.PI)
      ctx.fillStyle = n.teinte
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = couleurs.encre
      ctx.stroke()
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace'
      ctx.fillStyle = '#1f1b18'
      ctx.fillText(n.initiale, x, y + 0.5)
      if (!n.signe) continue
      // Le signe : losange doré (principale) ou rond bleu (secondaire), au-dessus du médaillon.
      const sx = x + 8, sy = y - 10
      ctx.beginPath()
      if (n.principale) { ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 8, sy); ctx.lineTo(sx, sy + 8); ctx.lineTo(sx - 8, sy); ctx.closePath() }
      else ctx.arc(sx, sy, 6.5, 0, 2 * Math.PI)
      ctx.fillStyle = n.principale ? DORE : BLEU
      ctx.fill()
      ctx.lineWidth = 1.3
      ctx.stroke()
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace'
      ctx.fillStyle = '#1f1b18'
      ctx.fillText(n.signe, sx, sy + 0.5)
    }
    ctx.restore()
  }

  /** Vrai si un lieu est trop près de sa planète à l'écran pour qu'on l'en distingue (la carte est trop dézoomée). */
  private lieuReplie(lieu: string, t: number): boolean {
    let c = corps(lieu)
    while (c?.parent && corps(c.parent)?.type !== 'etoile') c = corps(c.parent)
    const planete = c && c.nom !== lieu ? c.nom : null
    if (!planete) return false
    const a = this.ecranDe(projeterCorps(lieu, t)), b = this.ecranDe(projeterCorps(planete, t))
    return Math.hypot(a.x - b.x, a.y - b.y) < SEUIL_PNJ
  }

  /** La capsule d'un autre joueur : un chevron aux couleurs de sa Maison, dans le sens de sa marche. */
  private capsuleJoueur(ctx: CanvasRenderingContext2D, nom: string, q: { x: number; y: number }, t: number, couleurs: Couleurs2D): void {
    const q2 = this.ecranDe(projeterCorps(nom, t + 60_000))
    const maison = BOTS.find((b) => b.pseudo === nom)?.maison
    ctx.save()
    ctx.translate(q.x, q.y)
    ctx.rotate(Math.atan2(q2.y - q.y, q2.x - q.x))
    ctx.beginPath()
    ctx.moveTo(6.5, 0)
    ctx.lineTo(-4, 4.5)
    ctx.lineTo(-2, 0)
    ctx.lineTo(-4, -4.5)
    ctx.closePath()
    ctx.fillStyle = maison ? TEINTES_MAISONS[maison] : '#d7cdee'
    ctx.fill()
    ctx.lineWidth = 1.3
    ctx.lineJoin = 'round'
    ctx.strokeStyle = couleurs.encre
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Gros plan sur la capsule (demande d'Adrien du 20/10/2026 : « on doit la voir de près ») : le bord de l'astre où
   * elle est, la capsule au centre et les engins voisins ; en plein espace, 2 millions de km autour d'elle.
   */
  echelleGrosPlan(astre: string, t: number): number {
    let demi = 2e6
    if (astre !== 'Soleil') {
      const c = projeterCorps(astre, t), q = this.positionCapsule(t)
      const hauteur = Math.max(0, Math.hypot(q.x - c.x, q.y - c.y) - rayonDessine(astre))
      demi = Math.max(0.12 * rayonDessine(astre), 1.25 * hauteur)
    }
    return Math.max(KM_PAR_PX_MIN, demi / (this.largeur / 2))
  }

  /** Place de la capsule sur la carte (km de carte), hors trajet (en route, elle est sur le trajet dessiné). */
  positionCapsule(t: number): Point2 {
    return projeter({ p: etatCapsule(t).position, t, suivant: { p: etatCapsule(t + 60_000).position, t: t + 60_000 } })
  }

  /** Vue générale : le Soleil au centre, les planètes jusqu'à Mars. */
  vueGenerale(): void {
    this.centre = { x: 0, y: 0 }
    this.kmParPx = VUE_GENERALE / (this.largeur / 2)
  }

  /** Cadre le système d'un astre : sa planète au centre, toute sa zone visible. */
  cadrerSysteme(planete: string, t: number): void {
    const p = position(planete, t)
    this.centre = { x: p.x, y: p.y }
    this.kmParPx = (zoneDessinee(planete) * 1.05) / (this.largeur / 2)
  }

  /** Dessine la carte ; renvoie la place (à l'écran) d'un astre donné. */
  dessiner(ctx: CanvasRenderingContext2D, t: number, reglages: ReglagesCarte, couleurs: Couleurs2D,
    selection: string | null, directionCapsule?: { x: number; y: number } | null, capsuleDessinee?: Point2 | null):
    { x: number; y: number; r: number; visible: boolean } | null {
    ctx.clearRect(0, 0, this.largeur, this.hauteur)
    const nh = position('New Horizons', t)
    this.newHorizons = { x: nh.x, y: nh.y }
    // Moebius : couleurs adoucies vers le sable, encre brun-violet.
    const couleurDe = (c: Corps) => melanger(couleurAstre(c), '#f7e8cc', 0.3)
    if (!this.nuit && couleurs.encre === '#1f1b18') couleurs = { ...couleurs, encre: ENCRE_MOEBIUS }
    const soleil = this.ecranDe({ x: 0, y: 0 })
    const dedans = (x: number, y: number, marge = 30) => x > -marge && x < this.largeur + marge && y > -marge && y < this.hauteur + marge

    // Ceintures : astéroïdes de 2,2 à 3,3 UA, Kuiper de 30 à 50 UA, en trame légère.
    for (const [a, b] of [[2.2, 3.3], [30, 50]]) {
      const ra = (a * UA_KM) / this.kmParPx, rb = (b * UA_KM) / this.kmParPx
      if (rb < 4 || ra > 20 * Math.max(this.largeur, this.hauteur)) continue
      ctx.beginPath()
      ctx.arc(soleil.x, soleil.y, rb, 0, 2 * Math.PI)
      ctx.arc(soleil.x, soleil.y, ra, 0, 2 * Math.PI, true)
      ctx.fillStyle = trame(ctx, couleurs.encre, 0.28, this.pixelRatio)
      ctx.globalAlpha = 0.35
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Anneaux gradués autour des planètes dont le système est assez grand à l'écran (avec les orbites) : 1 000 km,
    // 10 000 km… Ils se resserrent en s'éloignant, la carte écrasant les grandes distances autour des planètes.
    if (reglages.orbites) {
      ctx.save()
      ctx.font = '9px ui-monospace, Menlo, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.setLineDash([2, 4])
      ctx.lineWidth = 0.8
      for (const nom of CENTRES) {
        if (zoneDessinee(nom) / this.kmParPx < this.largeur * 0.25) continue
        const q = this.ecranDe(projeterCorps(nom, t))
        for (const a of anneauxGradues(nom)) {
          const r = a.rayon / this.kmParPx
          if (r < 12) continue
          ctx.beginPath()
          ctx.arc(q.x, q.y, r, 0, 2 * Math.PI)
          ctx.strokeStyle = couleurs.encre
          ctx.globalAlpha = 0.22
          ctx.stroke()
          // L'étiquette, en haut de l'anneau, sur un petit fond pour rester lisible parmi les satellites.
          const texte = `${a.distance.toLocaleString('fr-FR')} km`, w = ctx.measureText(texte).width + 6
          ctx.globalAlpha = 0.85
          ctx.fillStyle = couleurs.fond
          ctx.fillRect(q.x - w / 2, q.y - r - 6, w, 12)
          ctx.globalAlpha = 0.55
          ctx.fillStyle = couleurs.encre
          ctx.fillText(texte, q.x, q.y - r)
        }
      }
      ctx.restore()
    }

    // Orbites des planètes et de Pluton : les vraies trajectoires, vues du dessus.
    if (reglages.orbites) {
      ctx.lineWidth = 0.9
      for (const nom of CENTRES) {
        const c = corps(nom)!
        const points = this.orbite(c, t)
        if (!points) continue
        ctx.beginPath()
        for (const [i, p] of points.entries()) {
          const q = this.ecranDe(p)
          if (i === 0) ctx.moveTo(q.x, q.y)
          else ctx.lineTo(q.x, q.y)
        }
        ctx.strokeStyle = couleurDe(c)
        ctx.globalAlpha = 0.75
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    this.poussiere(ctx, t, couleurs)

    // Astres : Soleil, planètes, Pluton toujours ; ce qui tourne autour d'eux quand leur système est assez grand à
    // l'écran, et seulement si on le distingue de ce qui est déjà dessiné (sinon il apparaît en zoomant).
    this.dessines = []
    const libre = (x: number, y: number, r: number) => this.dessines.every((d) => Math.hypot(d.x - x, d.y - y) > d.r + r + 3)
    const astre = (c: Corps, q: { x: number; y: number }) => {
      const r = this.rayon(c)
      this.dessines.push({ nom: c.nom, x: q.x, y: q.y, r })
      if (!dedans(q.x, q.y, r * 2.6 + 20)) return
      const versSoleil = c.type === 'etoile' ? null : Math.atan2(soleil.y - q.y, soleil.x - q.x)
      // Assez grand à l'écran : l'astre illustré (planche validée par Adrien le 17/10/2026) ; sinon le simple disque.
      if (r >= RAYON_ILLUSTRATION && aUneIllustration(c.nom)) dessinerAstreIllustre(ctx, c.nom, q.x, q.y, r, versSoleil)
      else if (r <= RAYON_POINT * 1.2) this.point(ctx, q.x, q.y, r, couleurDe(c), couleurs)
      else this.disque(ctx, q.x, q.y, r, couleurDe(c), versSoleil, couleurs)
      // La nuit, les astres (sauf le Soleil) s'assombrissent un peu : un voile de la couleur du fond.
      if (this.nuit && c.type !== 'etoile') {
        ctx.beginPath()
        ctx.arc(q.x, q.y, Math.max(r, 1.2), 0, 2 * Math.PI)
        ctx.fillStyle = couleurs.fond
        ctx.globalAlpha = 0.15
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
    astre(corps('Soleil')!, soleil)
    for (const nom of CENTRES) astre(corps(nom)!, this.ecranDe(projeterCorps(nom, t)))
    for (const nom of CENTRES) {
      const e = this.ecranDe(projeterCorps(nom, t))
      const zone = zoneDessinee(nom) / this.kmParPx
      if (zone < 30 || !dedans(e.x, e.y, zone)) continue
      const lunes = enfants(nom).filter((c) => c.type === 'lune').sort((a, b) => b.rayon - a.rayon)
      for (const c of lunes) {
        const q = this.ecranDe(projeterCorps(c.nom, t))
        const r = this.rayon(c)
        if (!libre(q.x, q.y, r)) continue
        // Orbite de la lune autour de son astre, de sa couleur (les grandes, ou toutes s'il y en a peu).
        if (reglages.orbites && (c.rayon >= 100 || lunes.length <= 12)) {
          ctx.beginPath()
          ctx.arc(e.x, e.y, Math.hypot(q.x - e.x, q.y - e.y), 0, 2 * Math.PI)
          ctx.lineWidth = 0.8
          ctx.strokeStyle = couleurDe(c)
          ctx.globalAlpha = 0.55
          ctx.stroke()
          ctx.globalAlpha = 1
        }
        astre(c, q)
      }
    }
    // Engins (satellites de la Terre, sondes), épaves et chasseurs aliens repérés : leur silhouette. Les chasseurs
    // d'abord (on ne doit pas les manquer), cerclés d'un pointillé cerise.
    const engins = CORPS.filter((c) => (c.type === 'alien' || c.type === 'epave' || c.type === 'monolithe' || c.type === 'satellite' || c.type === 'sonde' || c.type === 'joueur'))
      .sort((a, b) => Number(b.type === 'alien') - Number(a.type === 'alien'))
    for (const c of engins) {
      if ((c.type === 'alien' || c.type === 'epave' || c.type === 'monolithe') && !this.surLaCarte(c.nom, t)) continue
      const q = this.ecranDe(projeterCorps(c.nom, t))
      if (!dedans(q.x, q.y) || !libre(q.x, q.y, RAYON_ENGIN)) continue
      this.dessines.push({ nom: c.nom, x: q.x, y: q.y, r: RAYON_ENGIN })
      if (c.type === 'alien') {
        ctx.beginPath()
        ctx.arc(q.x, q.y, 15, 0, 2 * Math.PI)
        ctx.setLineDash([3, 3])
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#e04b37'
        ctx.stroke()
        ctx.setLineDash([])
      }
      if (c.type === 'joueur') { this.capsuleJoueur(ctx, c.nom, q, t, couleurs); continue }
      dessinerEngin(ctx, c.modele ?? 'sonde', q.x, q.y, couleurs.encre, ECHELLE_ENGIN)
    }

    // La capsule : un petit chevron cerise, dans le sens de sa marche.
    const etat = etatCapsule(t)
    // En route : sa place sur le trajet dessiné (elle y avance à vitesse régulière, voir loupe.ts).
    let { x, y } = capsuleDessinee ? this.ecranDe(capsuleDessinee)
      : this.projeterPoint(etat.position, t, { p: etatCapsule(t + 60_000).position, t: t + 60_000 })
    // Vue de loin, la capsule tomberait sur le disque de son astre : on la pose juste à côté, sans le cacher.
    for (const d of this.dessines) {
      const ecart = Math.hypot(x - d.x, y - d.y)
      if (ecart >= d.r + 7) continue
      const ux = ecart > 0.5 ? (x - d.x) / ecart : 0.7, uy = ecart > 0.5 ? (y - d.y) / ecart : -0.7
      x = d.x + ux * (d.r + 8)
      y = d.y + uy * (d.r + 8)
    }
    // Orientation : dans le sens de la marche TEL QU'IL APPARAÎT sur la carte ; s'il y a un trajet, le long de son
    // premier tronçon dessiné.
    let a: number
    if (directionCapsule) a = Math.atan2(directionCapsule.y, directionCapsule.x)
    else {
      const q1 = this.projeterPoint(etatCapsule(t + 60_000).position, t + 60_000, { p: etatCapsule(t + 120_000).position, t: t + 120_000 })
      a = Math.atan2(q1.y - y, q1.x - x)
    }
    // Changement de cap : le chevron pivote en douceur (au plus 90° par seconde de temps réel).
    const maintenant = performance.now()
    if (this.angleCapsule !== null) {
      let ecart = Math.atan2(Math.sin(a - this.angleCapsule), Math.cos(a - this.angleCapsule))
      const max = (Math.PI / 2) * Math.min(0.2, (maintenant - this.instantAngle) / 1000)
      if (Math.abs(ecart) > max && Math.abs(ecart) > 0.35) ecart = Math.sign(ecart) * max
      a = this.angleCapsule + ecart
    }
    this.angleCapsule = a
    this.instantAngle = maintenant
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
    ctx.fillStyle = '#e04b37'
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.strokeStyle = couleurs.encre
    ctx.stroke()
    ctx.restore()

    if (reglages.noms) this.noms(ctx, couleurs, selection)

    if (!selection) return null
    const cible = this.dessines.find((d) => d.nom === selection)
    if (cible) {
      const visible = cible.x >= 0 && cible.x <= this.largeur && cible.y >= 144 && cible.y <= this.hauteur - 100
      return { x: cible.x, y: cible.y, r: cible.r, visible }
    }
    // Pas dessinée (trop près de son astre à ce zoom) : sa place à l'écran, sans disque.
    if (!corps(selection)) return null
    const q = this.ecranDe(projeterCorps(selection, t))
    const visible = q.x >= 0 && q.x <= this.largeur && q.y >= 144 && q.y <= this.hauteur - 100
    return { x: q.x, y: q.y, r: 2, visible }
  }

  /**
   * La poussière de satellites autour de la Terre (choix d'Adrien du 17/10/2026) : de fins points d'encre, décoratifs
   * (on ne peut pas les toucher), quand le système de la Terre est assez grand à l'écran.
   */
  private poussiere(ctx: CanvasRenderingContext2D, t: number, couleurs: Couleurs2D): void {
    const e = this.ecranDe(projeterCorps('Terre', t))
    const zone = zoneDessinee('Terre') / this.kmParPx
    if (zone < 30 || e.x < -zone || e.x > this.largeur + zone || e.y < -zone || e.y > this.hauteur + zone) return
    const p = positionsPoussiere(t)
    if (!p) return
    if (this.pointsPoussiere.length < 2 * p.nombre) this.pointsPoussiere = new Float64Array(2 * p.nombre)
    const q = this.pointsPoussiere
    projeterPoussiere('Terre', t, p.nombre, p.positions, p.normales, q)
    const m = this.milieu()
    const cote = 1.1
    ctx.beginPath()
    for (let k = 0; k < p.nombre; k++) {
      const x = m.x + (q[2 * k] - this.centre.x) / this.kmParPx, y = m.y - (q[2 * k + 1] - this.centre.y) / this.kmParPx
      if (x < 0 || x > this.largeur || y < 0 || y > this.hauteur) continue
      ctx.rect(x - cote / 2, y - cote / 2, cote, cote)
    }
    ctx.fillStyle = couleurs.encre
    ctx.globalAlpha = this.nuit ? 0.3 : 0.4
    ctx.fill()
    ctx.globalAlpha = 1
  }

  /**
   * Les missiles aliens en vol : un pointillé cerise du chasseur à la capsule, le missile qui avance dessus (fraction
   * de son vol) et son décompte.
   */
  /**
   * Les échos des PING : un cercle pointillé par écho revenu, autour de la place d'où il est parti (elle reste fixe
   * par rapport au Soleil : les planètes s'en éloignent), avec le numéro du monolithe ; ses places possibles marquées
   * d'un « ? ». Le cercle passe par la loupe de la carte comme tout le reste.
   */
  dessinerEchos(ctx: CanvasRenderingContext2D, t: number, cercles: { numero: number; centre: Point2; rayon: number }[],
    places: Point2[], c: Couleurs2D): void {
    ctx.save()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = '#7a5aa8'
    ctx.setLineDash([2, 4])
    ctx.font = '10px ui-monospace, Menlo, monospace'
    ctx.textBaseline = 'middle'
    for (const e of cercles) {
      const n = 180
      const pts: { x: number; y: number }[] = []
      for (let k = 0; k <= n; k++) {
        const a = (2 * Math.PI * k) / n
        pts.push(this.projeterPoint({ x: e.centre.x + e.rayon * Math.cos(a), y: e.centre.y + e.rayon * Math.sin(a), z: 0 }, t))
      }
      ctx.beginPath()
      pts.forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
      ctx.stroke()
      // Le numéro, sur le premier point du cercle qui est à l'écran.
      const q = pts.find((p) => p.x > 10 && p.x < this.largeur - 60 && p.y > 150 && p.y < this.hauteur - 130)
      if (q) {
        ctx.setLineDash([])
        ctx.lineWidth = 3
        ctx.strokeStyle = c.fond
        ctx.strokeText(`n° ${e.numero}`, q.x + 4, q.y)
        ctx.fillStyle = '#7a5aa8'
        ctx.fillText(`n° ${e.numero}`, q.x + 4, q.y)
        ctx.lineWidth = 1.2
        ctx.strokeStyle = '#7a5aa8'
        ctx.setLineDash([2, 4])
      }
    }
    ctx.setLineDash([])
    ctx.font = 'bold 12px ui-monospace, Menlo, monospace'
    ctx.textAlign = 'center'
    for (const p of places) {
      const q = this.projeterPoint({ x: p.x, y: p.y, z: 0 }, t)
      ctx.beginPath()
      ctx.arc(q.x, q.y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = c.fond
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = '#7a5aa8'
      ctx.stroke()
      ctx.fillStyle = '#7a5aa8'
      ctx.fillText('?', q.x, q.y + 0.5)
    }
    ctx.restore()
  }

  dessinerMissiles(ctx: CanvasRenderingContext2D, t: number, missiles: { alien: string; fraction: number; decompte: string }[], c: Couleurs2D): void {
    const capsule = this.place(CAPSULE)
    if (!capsule) return
    for (const m of missiles) {
      const a = this.place(m.alien) ?? this.ecranDe(projeterCorps(m.alien, t))
      const x = a.x + (capsule.x - a.x) * m.fraction, y = a.y + (capsule.y - a.y) * m.fraction
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(capsule.x, capsule.y)
      ctx.setLineDash([4, 4])
      ctx.lineDashOffset = -(performance.now() / 40) % 8
      ctx.lineWidth = 1.6
      ctx.strokeStyle = '#e04b37'
      ctx.globalAlpha = 0.8
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      // Le missile, dans le sens de sa course.
      ctx.translate(x, y)
      ctx.rotate(Math.atan2(capsule.y - a.y, capsule.x - a.x))
      ctx.beginPath()
      ctx.moveTo(8, 0); ctx.lineTo(3, -2.5); ctx.lineTo(-6, -2.5); ctx.lineTo(-9, -5); ctx.lineTo(-8, 0); ctx.lineTo(-9, 5); ctx.lineTo(-6, 2.5); ctx.lineTo(3, 2.5)
      ctx.closePath()
      ctx.fillStyle = '#e04b37'
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = c.encre
      ctx.stroke()
      ctx.restore()
      // Le décompte, sur une étiquette cerise.
      ctx.save()
      ctx.font = 'bold 11px ui-monospace, Menlo, monospace'
      const l = ctx.measureText(m.decompte).width + 10
      ctx.fillStyle = '#e04b37'
      ctx.strokeStyle = c.encre
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(x + 10, y - 9, l, 18, 4)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.fillText(m.decompte, x + 15, y + 4)
      ctx.restore()
    }
  }

  /** Position à l'écran d'un astre déjà dessiné (dont la capsule), ou null. */
  place(nom: string): { x: number; y: number; r: number } | null {
    const d = this.dessines.find((x) => x.nom === nom)
    return d ? { x: d.x, y: d.y, r: d.r } : null
  }

  /**
   * Les deux traits de la navigation : le pointillé de la capsule vers la position ACTUELLE de la destination, et
   * le trajet (traits droits, km de carte) jusqu'au point de rendez-vous, marqué d'une croix cerclée.
   */
  dessinerTraits(ctx: CanvasRenderingContext2D, t: number, cible: { x: number; y: number } | null,
    trajet: Point2[] | null, rendezVous: Point2 | null, accent: string,
    c: Couleurs2D, orbiteCapsule: { t: number; r: Vecteur3 }[] | null = null): void {
    const capsule = this.place(CAPSULE)
    const ecrans = (l: { t: number; r: Vecteur3 }[], tCentre?: number) =>
      l.map((p, i) => this.projeterPoint(p.r, p.t, l[i + 1] ? { p: l[i + 1].r, t: l[i + 1].t } : undefined, tCentre))
    ctx.save()
    // L'orbite de la capsule autour de son astre : un trait fin de couleur vive.
    if (orbiteCapsule && orbiteCapsule.length > 1) {
      ctx.beginPath()
      for (const [i, q] of ecrans(orbiteCapsule, t).entries()) {
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
      for (const [i, q] of trajet.map((p) => this.ecranDe(p)).entries()) {
        if (i === 0) ctx.moveTo(q.x, q.y)
        else ctx.lineTo(q.x, q.y)
      }
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      // Un trait fin (demande d'Adrien du 19/10/2026), cerné d'encre pour rester lisible.
      ctx.lineWidth = 2.6
      ctx.strokeStyle = c.encre
      ctx.stroke()
      ctx.lineWidth = 1.4
      ctx.strokeStyle = accent
      ctx.stroke()
    }
    if (rendezVous) {
      const q = this.ecranDe(rendezVous)
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

  /** Disque d'un astre : aplat de sa couleur, face de nuit en aplat violet et hachures, cerné d'encre ; le Soleil a ses rayons. */
  private disque(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string,
    versSoleil: number | null, c: Couleurs2D): void {
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
      ctx.strokeStyle = couleur
      ctx.stroke()
    }
  }

  /** Astre réduit à un point (serré contre ses voisins) : un rond de sa couleur cerné d'encre. */
  private point(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string, c: Couleurs2D): void {
    ctx.beginPath()
    ctx.arc(x, y, Math.max(r, 1.2), 0, 2 * Math.PI)
    ctx.fillStyle = couleur
    ctx.fill()
    ctx.lineWidth = 0.8
    ctx.strokeStyle = c.encre
    ctx.stroke()
  }

  /** Noms : par ordre d'importance, sans chevauchement ; la sélection a son étiquette, on ne la nomme pas ici. */
  private noms(ctx: CanvasRenderingContext2D, c: Couleurs2D, selection: string | null): void {
    const priorite = (d: Dessine) => {
      if (d.nom === CAPSULE) return 0
      const k = corps(d.nom)!
      return k.type === 'etoile' ? 1 : k.type === 'planete' ? 2 : k.type === 'naine' ? 3
        : k.type === 'lune' && k.rayon >= 100 ? 4 : k.type === 'satellite' || k.type === 'sonde' ? 5 : 6
    }
    // Le chevron de la capsule n'empêche pas un nom de se poser (vue de loin, il est collé à son astre).
    const occupes = this.dessines.filter((d) => d.nom !== CAPSULE).map((d) => ({ x0: d.x - d.r, y0: d.y - d.r, x1: d.x + d.r, y1: d.y + d.r }))
    ctx.font = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = c.fond
    ctx.fillStyle = c.encre
    for (const d of [...this.dessines].sort((a, b) => priorite(a) - priorite(b))) {
      if (d.nom === selection || d.nom === CAPSULE) continue
      // Petites lunes (des dizaines autour des géantes) : pas de nom.
      const k = corps(d.nom)
      if (k?.type === 'lune' && k.rayon < 100) continue
      // Épaves (il y en a partout) : leur nom seulement en regardant un système de près.
      if (k?.type === 'epave' && this.kmParPx > 1e6) continue
      const texte = d.nom
      const l = ctx.measureText(texte).width
      // Astres illustrés : le nom se pose au-delà des rayons du Soleil et des anneaux.
      const etendue = d.r >= RAYON_ILLUSTRATION ? ETENDUES[d.nom] ?? 1 : 1
      const ecart = d.r * etendue + (d.nom === 'Soleil' && etendue === 1 ? 12 : k?.type === 'satellite' || k?.type === 'sonde' ? 4 : 5)
      const essais = [{ x: d.x + ecart, y: d.y }, { x: d.x - ecart - l, y: d.y }, { x: d.x - l / 2, y: d.y + d.r + 10 },
        { x: d.x - l / 2, y: d.y - d.r - 10 }]
      for (const p of essais) {
        const b = { x0: p.x - 2, y0: p.y - 7, x1: p.x + l + 2, y1: p.y + 7 }
        if (b.x0 < 4 || b.x1 > this.largeur - 4 || b.y0 < 144 || b.y1 > this.hauteur - 120) continue
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
    if (o && Math.abs(t - o.t) < 30 * MS_PAR_JOUR) return o.points
    const points = traceOrbite(c.nom, t, 256)
    this.orbites.set(c.nom, { t, points })
    return points
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

  glisser(dx: number, dy: number): void {
    this.vol = null
    this.centre = { x: this.centre.x - dx * this.kmParPx, y: this.centre.y + dy * this.kmParPx }
  }

  zoomer(facteur: number, sx: number, sy: number): void {
    this.vol = null
    const nouveau = Math.min(KM_PAR_PX_MAX, Math.max(KM_PAR_PX_MIN, this.kmParPx * facteur))
    const m = this.milieu()
    // Le point sous les doigts reste fixe.
    const qx = this.centre.x + (sx - m.x) * this.kmParPx, qy = this.centre.y - (sy - m.y) * this.kmParPx
    this.kmParPx = nouveau
    this.centre = { x: qx - (sx - m.x) * nouveau, y: qy + (sy - m.y) * nouveau }
  }
}
