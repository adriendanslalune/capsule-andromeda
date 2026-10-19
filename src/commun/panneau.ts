// Le panneau de réparation (volet Capsule › Réparation ; maquette validée par Adrien le 18/10/2026) : une grande tôle en
// style Moebius, foisonnante — tuyaux, faisceaux de câbles, cadrans, petits écrans, voyants, étiquettes, notes collées —
// dessinée avec un hasard propre à chaque capsule (son numéro de série). Au milieu du fouillis, cinq blocs (un par
// système de la capsule) de trois modules chacun (décision d'Adrien du 18/10/2026). Les modules raccordés montrent
// les indices de leur réparation (écrans, lampe morse, antenne, touches à symboles, bornier) ; les gestes passent par
// des boutons sous le panneau, qui s'ouvrent en touchant le module. Le panneau ne décide rien : il montre l'état que
// lui donne le moteur du jeu.

import { BLOCS, repere, TITRES_APPAREILS, type NomAppareil } from '../donnees/blocs'
import type { NomModule } from '../donnees/modules'
import { BORNES, CALIBRES, TEINTES_ACCUS, TEINTES_TEMOIN, type CouleurCable } from '../donnees/manuel-energie'
import { LEVIERS, TEINTES_INJECTEURS, ZONE_ROUGE, type VoyantInjecteur } from '../donnees/manuel-moteur'
import type { TourAccumulateurs, TourFusibles } from '../moteur/energie'
import type { TourEnergie } from '../moteur/reparation'

const NS = 'http://www.w3.org/2000/svg'
const ENCRE = '#2b2138'
const OMBRE = '#7d6a9e'
const PASTELS = ['#bfe0c8', '#f3c2b0', '#bfe0e8', '#f5d38a', '#d7cdee', '#f6e3b8', '#c9d9a8', '#e8b9c9']
const TEINTES: Record<CouleurCable, string> = {
  rouge: '#e04b37', bleu: '#3f63c4', jaune: '#f2b53a', blanc: '#faf2dc', vert: '#5fb36a', noir: '#3a3340',
}
export const LARGEUR_PANNEAU = 390
export const HAUTEUR_PANNEAU = 1900

interface Cadre { x: number; y: number; w: number; h: number }

/** Les cinq blocs, de haut en bas, et leur teinte de fond. */
const CADRES_BLOCS: Record<NomModule, Cadre & { teinte: string }> = {
  communications: { x: 6, y: 82, w: 378, h: 332, teinte: '#d9e6dc' },
  energie: { x: 6, y: 480, w: 378, h: 290, teinte: '#f0d9c8' },
  moteur: { x: 6, y: 836, w: 378, h: 290, teinte: '#e3dcef' },
  navigation: { x: 6, y: 1192, w: 378, h: 300, teinte: '#d8e5ec' },
  coque: { x: 6, y: 1558, w: 378, h: 280, teinte: '#ede3c5' },
}

/** Emplacement des quinze modules. */
const CADRES: Record<NomAppareil, Cadre> = {
  telegraphe: { x: 14, y: 112, w: 204, h: 150 },
  antenne: { x: 228, y: 112, w: 148, h: 150 },
  chiffreur: { x: 14, y: 280, w: 362, h: 120 },
  bornier: { x: 14, y: 510, w: 206, h: 238 },
  fusibles: { x: 230, y: 510, w: 146, h: 112 },
  accumulateurs: { x: 230, y: 636, w: 146, h: 112 },
  leviers: { x: 14, y: 866, w: 214, h: 126 },
  soupape: { x: 238, y: 866, w: 138, h: 126 },
  injecteurs: { x: 14, y: 1006, w: 362, h: 106 },
  constellation: { x: 14, y: 1222, w: 214, h: 150 },
  gyroscope: { x: 238, y: 1222, w: 138, h: 150 },
  calculateur: { x: 14, y: 1386, w: 362, h: 92 },
  vannes: { x: 14, y: 1588, w: 214, h: 120 },
  breche: { x: 238, y: 1588, w: 138, h: 120 },
  sas: { x: 14, y: 1722, w: 362, h: 102 },
}

/** Ce que le panneau doit montrer du bornier (bloc Énergie). */
export interface EtatEnergie {
  /** Tour de réparation en cours, ou null si le bornier marche. */
  tour: TourEnergie | null
  coupes: number[]
  /** Module bloqué après une erreur (secondes restantes, 0 sinon). */
  bloque: number
  /** Tour actuel et nombre de tours (pour l'écran DIAG). */
  numero: number
  tours: number
}

/** Ce que le panneau doit montrer du télégraphe. */
export interface EtatTelegraphe {
  /** La lampe : suite de [allumée ?, durée (ms)] répétée en boucle ; null quand le télégraphe marche. */
  morse: [boolean, number][] | null
  /** Fréquence affichée (« 3,505 ») et cran du cadran (0 à crans − 1). */
  frequence: string
  cran: number
  crans: number
  bloque: number
}

/** Ce que le panneau doit montrer de l'antenne. */
export interface EtatAntenne {
  /** Symbole de la station et bande, ou null quand l'antenne marche. */
  symbole: string | null
  bande: string | null
  /** Angle de l'antenne (degrés, 0 : vers le haut, sens des aiguilles d'une montre). */
  angle: number
  numero: number
  tours: number
  bloque: number
}

/** Ce que le panneau doit montrer du chiffreur. */
export interface EtatChiffreur {
  /** Les symboles des quatre touches, ou null quand le chiffreur marche. */
  touches: string[] | null
  /** Touches déjà enfoncées (numéros). */
  enfoncees: number[]
  bloque: number
}

/** Ce que le panneau doit montrer des fusibles. */
export interface EtatFusibles {
  /** Tour de réparation en cours, ou null si les fusibles sont en état. */
  tour: TourFusibles | null
  numero: number
  tours: number
  bloque: number
}

/** Ce que le panneau doit montrer des accumulateurs. */
export interface EtatAccumulateurs {
  /** Tour de réparation en cours, ou null si les accumulateurs sont en état. */
  tour: TourAccumulateurs | null
  /** Accumulateurs déjà branchés (numéros, dans l'ordre). */
  branches: number[]
  numero: number
  tours: number
  bloque: number
}

/** Ce que le panneau doit montrer des leviers (bloc Moteur). */
export interface EtatLeviers {
  /** En défaut (réparation en cours) ? */
  actif: boolean
  /** Position des cinq leviers (vrai : en haut). */
  positions: boolean[]
  numero: number
  tours: number
  bloque: number
}

/** Ce que le panneau doit montrer de la soupape. */
export interface EtatSoupape {
  /** Le symbole de la plaque (lu par les leviers). */
  symbole: string
  /** Température affichée (°C), ou null quand la soupape est en état. */
  temperature: number | null
  /** Pression (graduations de 0 à 10) et purge en cours. */
  pression: number
  purge: boolean
  numero: number
  tours: number
  bloque: number
}

/** Ce que le panneau doit montrer des injecteurs. */
export interface EtatInjecteurs {
  /** Voyants des six injecteurs, ou null quand ils sont en état. */
  voyants: VoyantInjecteur[] | null
  /** Injecteurs coupés (numéros). */
  coupes: number[]
  numero: number
  tours: number
  bloque: number
}

/** Tout ce que le panneau montre. */
export interface EtatPanneau {
  /** Blocs en panne. */
  pannes: NomModule[]
  /** Modules en défaut. */
  defauts: NomAppareil[]
  energie: EtatEnergie
  telegraphe: EtatTelegraphe
  antenne: EtatAntenne
  chiffreur: EtatChiffreur
  fusibles: EtatFusibles
  accumulateurs: EtatAccumulateurs
  leviers: EtatLeviers
  soupape: EtatSoupape
  injecteurs: EtatInjecteurs
}

/** L'animation SVG (SMIL) qui fait clignoter une lampe selon une suite morse : couleur allumée, couleur éteinte. */
export function attributsMorse(morse: [boolean, number][], allumee: string, eteinte: string): Record<string, string> {
  const total = morse.reduce((s, [, d]) => s + d, 0)
  let t = 0
  const temps: string[] = [], valeurs: string[] = []
  for (const [on, d] of morse) { temps.push((t / total).toFixed(4)); valeurs.push(on ? allumee : eteinte); t += d }
  return { attributeName: 'fill', dur: `${total}ms`, repeatCount: 'indefinite', calcMode: 'discrete', keyTimes: temps.join(';'), values: valeurs.join(';') }
}

export class Panneau {
  private svg: SVGSVGElement
  private serie = ''
  private graine = 1
  private groupes = new Map<string, SVGGElement>()
  private voyantsBlocs = new Map<NomModule, SVGCircleElement>()
  private voyantsModules = new Map<NomAppareil, SVGCircleElement>()
  private derniers = new Map<string, string>()
  private selection!: SVGRectElement

  /** toucher : appelé quand on touche un module du panneau (pour ouvrir ses commandes). */
  constructor(conteneur: HTMLElement, private toucher: (a: NomAppareil) => void) {
    this.svg = document.createElementNS(NS, 'svg')
    this.svg.setAttribute('viewBox', `0 0 ${LARGEUR_PANNEAU} ${HAUTEUR_PANNEAU}`)
    this.svg.setAttribute('class', 'panneau-svg')
    conteneur.appendChild(this.svg)
  }

  // --- Outils de dessin ---
  private hasard(): number {
    this.graine = (this.graine * 16807) % 2147483647
    return (this.graine - 1) / 2147483646
  }
  private entre(a: number, b: number): number { return a + (b - a) * this.hasard() }
  private choix<T>(l: readonly T[]): T { return l[Math.floor(this.hasard() * l.length)] }
  private el(nom: string, attrs: Record<string, string | number>, parent: Element = this.svg): SVGElement {
    const e = document.createElementNS(NS, nom)
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
    parent.appendChild(e)
    return e
  }
  private g(parent: Element = this.svg, attrs: Record<string, string | number> = {}): SVGGElement {
    return this.el('g', attrs, parent) as SVGGElement
  }
  private texte(x: number, y: number, t: string, taille: number, parent: Element = this.svg, attrs: Record<string, string | number> = {}): void {
    this.el('text', { x, y, 'font-size': taille, fill: ENCRE, ...attrs }, parent).textContent = t
  }
  private rivet(x: number, y: number, parent: Element = this.svg): void {
    this.el('circle', { cx: x, cy: y, r: 2, fill: '#e8c97a', stroke: ENCRE, 'stroke-width': 0.8 }, parent)
    this.el('path', { d: `M${x - 1} ${y - 0.5} l1.4 1.2`, stroke: ENCRE, 'stroke-width': 0.5 }, parent)
  }
  private plaque(x: number, y: number, w: number, h: number, couleur: string, parent: Element): void {
    this.el('path', { d: `M${x + 5} ${y + h} h${w} v${-h + 5} l-5 -5 v${h} h${-w}z`, fill: 'url(#hachures)' }, parent)
    this.el('rect', { x: x + this.entre(-0.6, 0.6), y: y + this.entre(-0.6, 0.6), width: w, height: h, rx: 6, fill: couleur, stroke: ENCRE, 'stroke-width': 1.6 }, parent)
    for (const [rx, ry] of [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]]) this.rivet(rx, ry, parent)
  }
  private tuyau(d: string, couleur: string, largeur: number): void {
    const base = { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
    this.el('path', { ...base, stroke: ENCRE, 'stroke-width': largeur + 3 })
    this.el('path', { ...base, stroke: couleur, 'stroke-width': largeur })
    this.el('path', { ...base, stroke: '#fffaf0', 'stroke-width': largeur * 0.18, opacity: 0.8, 'stroke-dasharray': '18 10' })
    this.el('path', { ...base, stroke: OMBRE, 'stroke-width': largeur * 0.22, opacity: 0.35, transform: `translate(${largeur * 0.25} ${largeur * 0.25})` })
  }
  private bride(x: number, y: number, vertical: boolean): void {
    const w = vertical ? 22 : 8, h = vertical ? 8 : 22
    this.el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 2, fill: '#d9a43a', stroke: ENCRE, 'stroke-width': 1.2 })
    this.rivet(vertical ? x - 7 : x, vertical ? y : y - 7)
    this.rivet(vertical ? x + 7 : x, vertical ? y : y + 7)
  }
  /** Petit cadran à aiguille ; renvoie l'aiguille (pour la faire bouger). */
  private cadran(x: number, y: number, r: number, parent: Element, angle = this.entre(-2.2, 2.2), zoneRouge = this.hasard() < 0.5): SVGLineElement {
    this.el('circle', { cx: x + 1.5, cy: y + 1.5, r, fill: OMBRE, opacity: 0.4 }, parent)
    this.el('circle', { cx: x, cy: y, r, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.4 }, parent)
    for (let k = 0; k <= 8; k++) {
      const a = (-135 + k * 33.75) * Math.PI / 180, r1 = r * 0.72, r2 = r * (k % 2 ? 0.84 : 0.9)
      this.el('line', { x1: x + r1 * Math.sin(a), y1: y - r1 * Math.cos(a), x2: x + r2 * Math.sin(a), y2: y - r2 * Math.cos(a), stroke: ENCRE, 'stroke-width': 0.8 }, parent)
    }
    if (zoneRouge) {
      const a0 = 1.2, a1 = 2.36, rr = r * 0.8
      this.el('path', { d: `M${x + rr * Math.sin(a0)} ${y - rr * Math.cos(a0)} A${rr} ${rr} 0 0 1 ${x + rr * Math.sin(a1)} ${y - rr * Math.cos(a1)}`, stroke: '#e04b37', 'stroke-width': r * 0.16, fill: 'none' }, parent)
    }
    const aiguille = this.el('line', { x1: x, y1: y, x2: x + r * 0.75 * Math.sin(angle), y2: y - r * 0.75 * Math.cos(angle), stroke: '#e04b37', 'stroke-width': Math.max(1, r * 0.1), 'stroke-linecap': 'round' }, parent) as SVGLineElement
    this.el('circle', { cx: x, cy: y, r: Math.max(1.2, r * 0.12), fill: ENCRE }, parent)
    return aiguille
  }
  private ecran(x: number, y: number, w: number, h: number, lignes: string[], parent: Element, taille = 6): void {
    this.el('rect', { x, y, width: w, height: h, rx: 3, fill: '#1f2b22', stroke: ENCRE, 'stroke-width': 1.4 }, parent)
    lignes.forEach((t, k) => this.texte(x + 4, y + 2 + taille + k * (taille + 2), t, taille, parent, { fill: '#b9f08c' }))
  }
  private voyant(x: number, y: number, couleur: string, parent: Element, r = 3.2): SVGCircleElement {
    this.el('circle', { cx: x, cy: y, r: r + 1.4, fill: '#c9b88a', stroke: ENCRE, 'stroke-width': 0.9 }, parent)
    return this.el('circle', { cx: x, cy: y, r, fill: couleur, stroke: ENCRE, 'stroke-width': 0.6 }, parent) as SVGCircleElement
  }
  private interrupteur(x: number, y: number, parent: Element): void {
    this.el('rect', { x: x - 4, y: y - 2, width: 8, height: 10, rx: 1.5, fill: '#cfc3a0', stroke: ENCRE, 'stroke-width': 0.9 }, parent)
    const d = this.hasard() < 0.5 ? -2 : 2
    this.el('line', { x1: x, y1: y + 3, x2: x + d, y2: y - 6, stroke: ENCRE, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, parent)
    this.el('circle', { cx: x + d, cy: y - 6.5, r: 1.6, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 0.7 }, parent)
  }
  private bouton(x: number, y: number, r: number, couleur: string, parent: Element): void {
    this.el('circle', { cx: x + 1, cy: y + 1.2, r, fill: OMBRE, opacity: 0.45 }, parent)
    this.el('circle', { cx: x, cy: y, r, fill: couleur, stroke: ENCRE, 'stroke-width': 1.2 }, parent)
    this.el('line', { x1: x, y1: y - r * 0.8, x2: x, y2: y - r * 0.2, stroke: ENCRE, 'stroke-width': 1.2 }, parent)
  }
  private etiquette(x: number, y: number, t: string, couleur: string, parent: Element): void {
    this.el('rect', { x, y: y - 6, width: t.length * 3.9 + 6, height: 8.5, fill: couleur, stroke: ENCRE, 'stroke-width': 0.7 }, parent)
    this.texte(x + 3, y + 0.5, t, 5.6, parent)
  }
  private faisceau(x1: number, y1: number, x2: number, y2: number, n: number): void {
    for (let k = 0; k < n; k++) {
      const dx = (k - n / 2) * 3.2, c = this.choix(['#e04b37', '#3f63c4', '#f2b53a', '#faf2dc', '#8fcf98', '#2b2138', '#d7cdee'])
      const d = `M${x1 + dx} ${y1} C${x1 + dx + this.entre(-40, 40)} ${y1 + this.entre(20, 80)} ${x2 + dx + this.entre(-40, 40)} ${y2 - this.entre(20, 80)} ${x2 + dx} ${y2}`
      this.el('path', { d, fill: 'none', stroke: ENCRE, 'stroke-width': 3.6, 'stroke-linecap': 'round' })
      this.el('path', { d, fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round' })
    }
  }

  /** Un grand cadran rond gradué (antenne), avec ses repères tous les 15° et les angles 0, 90, 180, 270. */
  private couronne(x: number, y: number, r: number, parent: Element): void {
    this.el('circle', { cx: x + 2, cy: y + 2, r, fill: OMBRE, opacity: 0.4 }, parent)
    this.el('circle', { cx: x, cy: y, r, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.6 }, parent)
    for (let a = 0; a < 360; a += 15) {
      const ra = a * Math.PI / 180, r1 = r * (a % 45 ? 0.9 : 0.8)
      this.el('line', { x1: x + r1 * Math.sin(ra), y1: y - r1 * Math.cos(ra), x2: x + r * 0.98 * Math.sin(ra), y2: y - r * 0.98 * Math.cos(ra), stroke: ENCRE, 'stroke-width': a % 45 ? 0.7 : 1.3 }, parent)
    }
    for (const a of [0, 90, 180, 270]) {
      const ra = a * Math.PI / 180, rr = r * 0.66
      this.texte(x + rr * Math.sin(ra), y - rr * Math.cos(ra) + 2.5, String(a), 7, parent, { 'text-anchor': 'middle', 'font-weight': 'bold' })
    }
  }

  /** Dessine tout le panneau d'une capsule (une seule fois par numéro de série : c'est long). */
  construire(serie: string): void {
    if (serie === this.serie) return
    this.serie = serie
    this.graine = [...serie].reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 2147483646, 7) + 1
    this.svg.innerHTML = ''
    this.voyantsBlocs.clear()
    this.voyantsModules.clear()
    this.groupes.clear()
    this.derniers.clear()
    const defs = this.el('defs', {})
    const motif = this.el('pattern', { id: 'hachures', width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs)
    this.el('line', { x1: 0, y1: 0, x2: 0, y2: 4, stroke: OMBRE, 'stroke-width': 0.9 }, motif)
    const trame = this.el('pattern', { id: 'trame', width: 3, height: 3, patternUnits: 'userSpaceOnUse' }, defs)
    this.el('circle', { cx: 1.5, cy: 1.5, r: 0.55, fill: ENCRE, opacity: 0.35 }, trame)

    // Fond : la tôle sable et ses joints.
    this.el('rect', { x: 0, y: 0, width: LARGEUR_PANNEAU, height: HAUTEUR_PANNEAU, fill: '#efe2c4' })
    this.el('rect', { x: 0, y: 0, width: LARGEUR_PANNEAU, height: HAUTEUR_PANNEAU, fill: 'url(#trame)', opacity: 0.35 })
    for (let y = 0; y < HAUTEUR_PANNEAU; y += 118) this.el('path', { d: `M0 ${y} H${LARGEUR_PANNEAU}`, stroke: ENCRE, 'stroke-width': 0.6, opacity: 0.4 })

    // Entre les blocs : tuyaux et faisceaux de câbles qui passent de l'un à l'autre.
    const blocs = Object.values(CADRES_BLOCS)
    this.tuyau('M-10 40 H120 Q150 40 150 70 V100', this.choix(PASTELS), 12)
    blocs.forEach((b, k) => {
      const y0 = b.y + b.h, y1 = k + 1 < blocs.length ? blocs[k + 1].y : HAUTEUR_PANNEAU, m = (y0 + y1) / 2
      const x = this.entre(60, 330)
      this.tuyau(`M-10 ${m - 10} H${x - 30} Q${x} ${m - 10} ${x} ${m + 20} V${y1 + 20}`, this.choix(PASTELS), this.entre(9, 14))
      this.tuyau(`M400 ${m + 8} H${x + 40}`, this.choix(PASTELS), this.entre(7, 11))
      this.bride(x, m + 22, true)
      this.faisceau(this.entre(40, 120), y0 - 10, this.entre(40, 140), y1 + 10, 3 + Math.floor(this.hasard() * 3))
      this.faisceau(this.entre(250, 350), y0 - 10, this.entre(240, 350), y1 + 10, 3 + Math.floor(this.hasard() * 3))
    })

    // Les blocs (avant le fouillis, qui vient se glisser dans leurs recoins).
    for (const fiche of BLOCS) {
      const b = CADRES_BLOCS[fiche.bloc], g = this.g()
      this.el('rect', { x: b.x + 5, y: b.y + 5, width: b.w, height: b.h, rx: 14, fill: OMBRE, opacity: 0.5 }, g)
      this.el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 14, fill: b.teinte, stroke: ENCRE, 'stroke-width': 2.8 }, g)
      this.el('rect', { x: b.x + 5, y: b.y + 5, width: b.w - 10, height: b.h - 10, rx: 10, fill: 'none', stroke: ENCRE, 'stroke-width': 0.7 }, g)
      for (const [rx, ry] of [[b.x + 10, b.y + 10], [b.x + b.w - 10, b.y + 10], [b.x + 10, b.y + b.h - 10], [b.x + b.w - 10, b.y + b.h - 10]]) this.rivet(rx, ry, g)
      const titre = `BLOC ${fiche.numero} · ${fiche.titre}`
      this.el('rect', { x: b.x + 14, y: b.y - 10, width: titre.length * 6.4 + 34, height: 19, rx: 4, fill: '#f2c66a', stroke: ENCRE, 'stroke-width': 1.6 }, g)
      this.texte(b.x + 22, b.y + 4, titre, 9.5, g, { 'font-weight': 'bold' })
      this.voyantsBlocs.set(fiche.bloc, this.voyant(b.x + 14 + titre.length * 6.4 + 22, b.y, '#8fcf98', g, 4.6))
    }

    // Le fouillis : petites plaques semées partout (hors des modules ; dans un bloc ou dehors, jamais à cheval).
    const obstacles: Cadre[] = Object.values(CADRES).map((c) => ({ x: c.x, y: c.y - 10, w: c.w, h: c.h + 10 }))
    obstacles.push({ x: 206, y: 14, w: 168, h: 44 }) // plaque du numéro de série
    for (const b of blocs) obstacles.push({ x: b.x + 10, y: b.y - 12, w: 240, h: 24 }) // titres des blocs
    const touche = (a: Cadre, z: Cadre, marge: number) => !(a.x + a.w < z.x - marge || a.x > z.x + z.w + marge || a.y + a.h < z.y - marge || a.y > z.y + z.h + marge)
    const dedans = (a: Cadre, z: Cadre) => a.x > z.x + 8 && a.x + a.w < z.x + z.w - 8 && a.y > z.y + 8 && a.y + a.h < z.y + z.h - 8
    const libre = (x: number, y: number, w: number, h: number) => {
      const a = { x, y, w, h }
      return obstacles.every((z) => !touche(a, z, 4)) && blocs.every((b) => dedans(a, b) || !touche(a, b, 5))
    }
    for (let essai = 0; essai < 5000; essai++) {
      const grand = essai < 1500
      const w = grand ? this.entre(40, 110) : this.entre(22, 48), h = grand ? this.entre(30, 60) : this.entre(18, 34)
      const x = this.entre(2, LARGEUR_PANNEAU - 2 - w), y = this.entre(2, HAUTEUR_PANNEAU - 2 - h)
      if (!libre(x, y, w, h)) continue
      obstacles.push({ x, y, w, h })
      const g = this.g()
      this.plaque(x, y, w, h, this.choix(PASTELS), g)
      const genre = this.hasard()
      if (genre < 0.22) this.cadran(x + w / 2, y + h / 2, Math.min(w, h) * 0.34, g)
      else if (genre < 0.38) this.ecran(x + 7, y + 8, w - 14, Math.min(h - 16, 30), [this.choix(['P 0.83', 'T+12:04', 'Q 117', 'ΔV 4.2', 'NOM.', 'CH 3']), this.choix(['--', '0043', 'OK', '···', 'AUX'])], g, 5.5)
      else if (genre < 0.55) { const n = Math.floor((w - 10) / 9); for (let k = 0; k < n; k++) this.interrupteur(x + 9 + k * 9, y + h / 2, g) }
      else if (genre < 0.7) { const n = Math.floor((w - 8) / 9); for (let k = 0; k < n; k++) this.voyant(x + 8 + k * 9, y + h / 2, this.choix(['#8fcf98', '#e04b37', '#f2b53a', '#c9b88a', '#bfe0e8']), g, 2.6) }
      else if (genre < 0.82) { for (let k = 0; k < 3; k++) this.bouton(x + w * (k + 1) / 4, y + h / 2, Math.min(7, h / 5), this.choix(PASTELS), g) }
      else {
        this.el('rect', { x: x + 6, y: y + 6, width: w - 12, height: h - 12, fill: 'url(#hachures)', stroke: ENCRE, 'stroke-width': 0.8 }, g)
        for (let k = 0; k < 4 && 10 + k * 5 < h - 8; k++) this.el('line', { x1: x + 9, y1: y + 10 + k * 5, x2: x + w - 9, y2: y + 10 + k * 5, stroke: ENCRE, 'stroke-width': 1.4 }, g)
      }
      if (this.hasard() < 0.6) this.etiquette(x + 4, y + h - 3, this.choix(['Q-12', 'AUX 2', 'NE PAS TOUCHER', 'B7', 'ATT.', 'VENT.', 'R-44', 'LOX', 'CAL.', 'K-3', 'PURGE', 'TEST']), this.choix(['#faf2dc', '#f5d38a', '#f3c2b0']), g)
    }
    for (let k = 0; k < 3500; k++) {
      const x = this.entre(3, LARGEUR_PANNEAU - 3), y = this.entre(3, HAUTEUR_PANNEAU - 3)
      if (!libre(x - 5, y - 5, 10, 10)) continue
      obstacles.push({ x: x - 5, y: y - 5, w: 10, h: 10 })
      const r = this.hasard()
      if (r < 0.35) this.rivet(x, y)
      else if (r < 0.5) this.voyant(x, y, this.choix(['#8fcf98', '#e04b37', '#f2b53a', '#bfe0e8']), this.svg, 2)
      else if (r < 0.65) this.el('path', { d: `M${x - 5} ${y} q3 -5 5 0 t5 0`, fill: 'none', stroke: this.choix(['#e04b37', '#3f63c4', '#f2b53a']), 'stroke-width': 1.6 })
      else if (r < 0.8) for (let j = 0; j < 4; j++) this.el('line', { x1: x - 4 + j * 2.6, y1: y - 3, x2: x - 4 + j * 2.6, y2: y + (j % 2 ? 1 : 3), stroke: ENCRE, 'stroke-width': 0.7 })
      else this.el('rect', { x: x - 4, y: y - 3, width: 8, height: 6, rx: 1, fill: this.choix(PASTELS), stroke: ENCRE, 'stroke-width': 0.7 })
    }
    // Notes collées, à la main.
    for (const [x, y, t, a] of [[300, 424, 'lire le\nmanuel !!', -6], [20, 1130, 'appeler J.\nsi R5', 5], [290, 1498, 'morse :\nlentement', 4]] as [number, number, string, number][]) {
      const g = this.g(this.svg, { transform: `rotate(${a} ${x + 30} ${y + 20})` })
      this.el('rect', { x, y, width: 64, height: 36, fill: '#fff3a8', stroke: ENCRE, 'stroke-width': 0.8 }, g)
      this.el('rect', { x: x + 20, y: y - 4, width: 24, height: 8, fill: '#e8dfc8', opacity: 0.85 }, g)
      t.split('\n').forEach((l, k) => this.texte(x + 6, y + 15 + k * 10, l, 8, g, { fill: '#2c4a8a', 'font-family': 'Segoe Print, Bradley Hand, cursive' }))
    }
    // La plaque du numéro de série.
    this.el('rect', { x: 210, y: 18, width: 160, height: 34, rx: 4, fill: '#f2c66a', stroke: ENCRE, 'stroke-width': 1.8 })
    this.texte(220, 32, 'CAPSULE ANDROMEDA', 8.5, this.svg, { 'font-weight': 'bold' })
    this.texte(220, 45, `N° SÉRIE ${serie} · 2026`, 7.5)
    for (const [x, y] of [[214, 22], [366, 22], [214, 48], [366, 48]]) this.rivet(x, y)

    this.dessinerModules()
  }

  /** Cadres des quinze modules, ce qui ne bouge pas dedans, et les groupes de ce qui change. */
  private dessinerModules(): void {
    const cadres = new Map<NomAppareil, SVGGElement>()
    for (const [nom, m] of Object.entries(CADRES) as [NomAppareil, Cadre][]) {
      const g = this.g()
      this.el('rect', { x: m.x + 4, y: m.y + 4, width: m.w, height: m.h, rx: 10, fill: OMBRE, opacity: 0.5 }, g)
      this.el('rect', { x: m.x, y: m.y, width: m.w, height: m.h, rx: 10, fill: '#e9dfc4', stroke: ENCRE, 'stroke-width': 2.2 }, g)
      this.el('rect', { x: m.x + 4, y: m.y + 4, width: m.w - 8, height: m.h - 8, rx: 7, fill: 'none', stroke: ENCRE, 'stroke-width': 0.6, 'stroke-dasharray': '3 2' }, g)
      const nomAffiche = `${repere(nom)} · ${TITRES_APPAREILS[nom]}`
      this.el('rect', { x: m.x + 10, y: m.y - 8, width: nomAffiche.length * 5.4 + 12, height: 15, rx: 3, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.3 }, g)
      this.texte(m.x + 16, m.y + 3, nomAffiche, 8, g, { 'font-weight': 'bold' })
      this.voyantsModules.set(nom, this.voyant(m.x + m.w - 14, m.y + 2, '#8fcf98', g, 4))
      cadres.set(nom, g)
    }
    const c = (a: NomAppareil) => [CADRES[a], cadres.get(a)!] as const

    // --- Bloc 4 · Navigation : constellation, gyroscope, calculateur. ---
    {
      const [m, g] = c('constellation')
      const cx = m.x + 70, cy = m.y + 78
      this.el('circle', { cx, cy, r: 54, fill: '#1f2b22', stroke: ENCRE, 'stroke-width': 2 }, g)
      this.el('circle', { cx, cy, r: 34, fill: 'none', stroke: '#3c5a3e', 'stroke-width': 1 }, g)
      this.el('path', { d: `M${cx} ${cy - 54} v108 M${cx - 54} ${cy} h108`, stroke: '#3c5a3e', 'stroke-width': 1 }, g)
      const etoiles = Array.from({ length: 6 }, () => [this.entre(-34, 34), this.entre(-34, 34)])
      this.el('path', { d: 'M' + etoiles.map(([a, b]) => `${cx + a} ${cy + b}`).join(' L') + 'z', fill: 'none', stroke: '#b9f08c', 'stroke-width': 0.8, opacity: 0.6 }, g)
      for (const [a, b] of etoiles) this.el('circle', { cx: cx + a, cy: cy + b, r: 2.4, fill: '#b9f08c' }, g)
      this.cadran(m.x + 168, m.y + 46, 16, g); this.cadran(m.x + 168, m.y + 106, 16, g)
    }
    {
      const [m, g] = c('gyroscope')
      const cx = m.x + 69, cy = m.y + 76
      for (const [rx, ry, a, couleur] of [[52, 52, 0, '#d9a43a'], [48, 18, 30, '#3f63c4'], [18, 46, -20, '#e04b37']] as [number, number, number, string][]) {
        this.el('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: ENCRE, 'stroke-width': 5, transform: `rotate(${a} ${cx} ${cy})` }, g)
        this.el('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: couleur, 'stroke-width': 3, transform: `rotate(${a} ${cx} ${cy})` }, g)
      }
      this.el('circle', { cx, cy, r: 9, fill: '#f2c66a', stroke: ENCRE, 'stroke-width': 1.4 }, g)
    }
    {
      const [m, g] = c('calculateur')
      this.ecran(m.x + 14, m.y + 18, 110, 34, ['ΔV 0412', 'T−00:42'], g, 10)
      ;['☉', '☾', '♄', '♂', '♀', '☿', '♃', '♁'].forEach((s, k) => {
        const x = m.x + 150 + (k % 4) * 52, y = m.y + 30 + Math.floor(k / 4) * 34
        this.el('rect', { x: x - 14, y: y - 13, width: 28, height: 26, rx: 4, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.4 }, g)
        this.texte(x - 7, y + 6, s, 15, g)
      })
      for (let k = 0; k < 6; k++) this.interrupteur(m.x + 22 + k * 17, m.y + 70, g)
    }
    // --- Bloc 5 · Coque : vannes, brèche, sas. ---
    {
      const [m, g] = c('vannes')
      ;['#d9694f', '#3f63c4', '#8fcf98'].forEach((couleur, k) => {
        const x = m.x + 40 + k * 66, y = m.y + 52
        this.el('circle', { cx: x, cy: y, r: 22, fill: 'none', stroke: ENCRE, 'stroke-width': 7 }, g)
        this.el('circle', { cx: x, cy: y, r: 22, fill: 'none', stroke: couleur, 'stroke-width': 4.5 }, g)
        this.el('path', { d: `M${x} ${y - 22} v44 M${x - 22} ${y} h44`, stroke: ENCRE, 'stroke-width': 2.5 }, g)
        this.el('circle', { cx: x, cy: y, r: 5, fill: '#d9a43a', stroke: ENCRE, 'stroke-width': 1.2 }, g)
        this.texte(x - 3, y + 40, 'ABC'[k], 8, g, { 'font-weight': 'bold' })
      })
    }
    {
      const [m, g] = c('breche')
      this.cadran(m.x + 40, m.y + 50, 26, g); this.texte(m.x + 30, m.y + 90, 'BAR', 7, g)
      this.el('rect', { x: m.x + 78, y: m.y + 20, width: 48, height: 80, rx: 3, fill: '#c9c2b0', stroke: ENCRE, 'stroke-width': 1.4 }, g)
      this.el('path', { d: `M${m.x + 84} ${m.y + 30} l10 14 l-6 10 l14 12 l-4 12 l12 14`, fill: 'none', stroke: ENCRE, 'stroke-width': 1.6 }, g)
      for (let k = 0; k < 4; k++) this.rivet(m.x + 84 + (k % 2) * 36, m.y + 26 + Math.floor(k / 2) * 68, g)
    }
    {
      const [m, g] = c('sas')
      this.el('circle', { cx: m.x + 56, cy: m.y + 52, r: 36, fill: '#a69f86', stroke: ENCRE, 'stroke-width': 2 }, g)
      this.el('circle', { cx: m.x + 56, cy: m.y + 52, r: 26, fill: '#bfe0e8', stroke: ENCRE, 'stroke-width': 1.6 }, g)
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; this.rivet(m.x + 56 + 31 * Math.cos(a), m.y + 52 + 31 * Math.sin(a), g) }
      for (let k = 0; k < 8; k++) this.interrupteur(m.x + 120 + k * 26, m.y + 40, g)
      this.ecran(m.x + 120, m.y + 60, 120, 26, ['SAS FERMÉ', 'P 1.01'], g, 8)
      this.voyant(m.x + 270, m.y + 72, '#8fcf98', g, 6); this.voyant(m.x + 300, m.y + 72, '#c9b88a', g, 6); this.voyant(m.x + 330, m.y + 72, '#c9b88a', g, 6)
    }

    // --- Les modules raccordés : ce qui change à chaque geste est redessiné par afficher(). ---
    {
      // Télégraphe : décor (grille du haut-parleur), le reste change.
      const [m, g] = c('telegraphe')
      for (let k = 0; k < 6; k++) this.el('line', { x1: m.x + 14, y1: m.y + 76 + k * 5, x2: m.x + 58, y2: m.y + 76 + k * 5, stroke: ENCRE, 'stroke-width': 1.6 }, g)
      this.groupes.set('telegraphe', this.g(g))
    }
    for (const a of ['antenne', 'chiffreur', 'bornier', 'fusibles', 'accumulateurs', 'leviers', 'soupape', 'injecteurs'] as const) this.groupes.set(a, this.g(c(a)[1]))
    // Zones de toucher des modules, et le cadre de sélection.
    for (const [nom, m] of Object.entries(CADRES) as [NomAppareil, Cadre][]) {
      const z = this.el('rect', { x: m.x, y: m.y - 8, width: m.w, height: m.h + 8, fill: 'transparent', class: 'commande' })
      z.addEventListener('click', () => this.toucher(nom))
    }
    this.selection = this.el('rect', { x: 0, y: 0, width: 0, height: 0, rx: 12, fill: 'none', stroke: '#e04b37', 'stroke-width': 3.5, 'stroke-dasharray': '8 5', 'pointer-events': 'none', class: 'selection-module' }) as SVGRectElement
  }

  /** Entoure le module choisi (null : aucun). */
  choisir(nom: NomAppareil | null): void {
    if (!nom) { this.selection.setAttribute('width', '0'); return }
    const m = CADRES[nom]
    for (const [k, v] of Object.entries({ x: m.x - 5, y: m.y - 13, width: m.w + 10, height: m.h + 18 })) this.selection.setAttribute(k, String(v))
  }

  /** Redessine une partie si ce qu'elle montre a changé. */
  private changer(cle: string, valeur: unknown, dessiner: () => void): void {
    const v = JSON.stringify(valeur)
    if (this.derniers.get(cle) === v) return
    this.derniers.set(cle, v)
    dessiner()
  }

  /** Met le panneau à jour : voyants des blocs et des modules, modules raccordés, aiguille de pression. */
  afficher(e: EtatPanneau): void {
    this.changer('voyants', [e.pannes, e.defauts], () => {
      for (const [nom, v] of this.voyantsBlocs) {
        const panne = e.pannes.includes(nom)
        v.setAttribute('fill', panne ? '#e04b37' : '#8fcf98')
        v.classList.toggle('clignote', panne)
      }
      for (const [nom, v] of this.voyantsModules) {
        const defaut = e.defauts.includes(nom)
        v.setAttribute('fill', defaut ? '#e04b37' : '#8fcf98')
        v.classList.toggle('clignote', defaut)
      }
    })
    this.changer('bornier', e.energie, () => this.dessinerBornier(e.energie))
    this.changer('telegraphe', e.telegraphe, () => this.dessinerTelegraphe(e.telegraphe))
    this.changer('antenne', e.antenne, () => this.dessinerAntenne(e.antenne))
    this.changer('chiffreur', e.chiffreur, () => this.dessinerChiffreur(e.chiffreur))
    this.changer('fusibles', e.fusibles, () => this.dessinerFusibles(e.fusibles))
    this.changer('accumulateurs', e.accumulateurs, () => this.dessinerAccumulateurs(e.accumulateurs))
    this.changer('leviers', e.leviers, () => this.dessinerLeviers(e.leviers))
    this.changer('soupape', e.soupape, () => this.dessinerSoupape(e.soupape))
    this.changer('injecteurs', e.injecteurs, () => this.dessinerInjecteurs(e.injecteurs))
  }

  private dessinerLeviers(e: EtatLeviers): void {
    const m = CADRES.leviers, g = this.groupes.get('leviers')!
    g.innerHTML = ''
    LEVIERS.forEach((l, k) => {
      const x = m.x + 26 + k * 40, y = m.y + 20, haut = e.positions[k]
      // La glissière, la tige et le pommeau (en haut ou en bas).
      this.el('rect', { x: x - 3, y: y + 6, width: 6, height: 62, rx: 3, fill: '#3b3346', stroke: ENCRE, 'stroke-width': 0.8 }, g)
      this.texte(x + 11, y + 12, 'H', 6, g); this.texte(x + 11, y + 66, 'B', 6, g)
      this.el('rect', { x: x - 12, y: y + 72, width: 24, height: 12, rx: 3, fill: '#a69f86', stroke: ENCRE, 'stroke-width': 1.2 }, g)
      const py = haut ? y + 12 : y + 56
      this.el('rect', { x: x - 2.5, y: py, width: 5, height: y + 72 - py, rx: 2, fill: ENCRE }, g)
      this.el('circle', { cx: x, cy: py, r: 9, fill: l.teinte, stroke: ENCRE, 'stroke-width': 1.4 }, g)
      this.el('path', { d: `M${x - 4} ${py - 4} q3 -3 7 -2`, fill: 'none', stroke: '#fffaf0', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.8 }, g)
      this.texte(x, y + 98, l.numero, 7, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
    })
    if (e.bloque) this.texte(m.x + m.w - 10, m.y + 18, `BLOQUÉ ${e.bloque} s`, 7, g, { 'text-anchor': 'end', fill: '#e04b37', 'font-weight': 'bold' })
    else if (e.actif) this.texte(m.x + m.w - 10, m.y + 18, `${e.numero + 1}/${e.tours}`, 7, g, { 'text-anchor': 'end', 'font-weight': 'bold' })
  }

  private dessinerSoupape(e: EtatSoupape): void {
    const m = CADRES.soupape, g = this.groupes.get('soupape')!
    g.innerHTML = ''
    // Le grand cadran de PRESSION, gradué de 0 à 10 (zone rouge de 8 à 10).
    const cx = m.x + 50, cy = m.y + 60, r = 36
    const angle = (p: number) => (-135 + 27 * p) * Math.PI / 180
    const pt = (p: number, rr: number) => `${cx + rr * Math.sin(angle(p))} ${cy - rr * Math.cos(angle(p))}`
    this.el('circle', { cx: cx + 2, cy: cy + 2, r, fill: OMBRE, opacity: 0.4 }, g)
    this.el('circle', { cx, cy, r, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.6 }, g)
    this.el('path', { d: `M${pt(ZONE_ROUGE, r * 0.84)} A${r * 0.84} ${r * 0.84} 0 0 1 ${pt(10, r * 0.84)}`, stroke: '#e04b37', 'stroke-width': 5, fill: 'none' }, g)
    for (let p = 0; p <= 10; p++) {
      this.el('path', { d: `M${pt(p, r * 0.72)} L${pt(p, r * 0.94)}`, stroke: ENCRE, 'stroke-width': p % 2 ? 0.8 : 1.4 }, g)
      if (p % 2 === 0) this.texte(cx + r * 0.55 * Math.sin(angle(p)), cy - r * 0.55 * Math.cos(angle(p)) + 2.5, String(p), 7, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
    }
    this.el('path', { d: `M${cx} ${cy} L${pt(e.pression, r * 0.8)}`, stroke: '#e04b37', 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
    this.el('circle', { cx, cy, r: 4, fill: ENCRE }, g)
    this.texte(cx, m.y + 114, 'PRESSION', 7, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
    // La vapeur de la purge.
    if (e.purge) for (let k = 0; k < 4; k++) this.el('circle', { cx: cx + 28 + k * 5, cy: cy - 30 - k * 6, r: 3 + k * 1.5, fill: '#fffaf0', stroke: ENCRE, 'stroke-width': 0.7, opacity: 0.85 }, g)
    // L'écran de la température et la plaque du symbole.
    const ecran = e.bloque ? ['BLOQ.', `${e.bloque}s`] : e.temperature !== null ? ['TEMP', `${e.temperature}°`] : ['TEMP', 'NOM.']
    this.ecran(m.x + 92, m.y + 14, 40, 30, ecran, g, 9)
    if (e.temperature !== null && !e.bloque) this.texte(m.x + 112, m.y + 62, `${e.numero + 1}/${e.tours}`, 7, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
    this.el('rect', { x: m.x + 94, y: m.y + 78, width: 36, height: 32, rx: 4, fill: '#f2c66a', stroke: ENCRE, 'stroke-width': 1.4 }, g)
    this.texte(m.x + 112, m.y + 102, e.symbole, 20, g, { 'text-anchor': 'middle', style: 'font-family: Georgia, serif' })
  }

  private dessinerInjecteurs(e: EtatInjecteurs): void {
    const m = CADRES.injecteurs, g = this.groupes.get('injecteurs')!
    g.innerHTML = ''
    for (let k = 0; k < 6; k++) {
      const x = m.x + 34 + k * 58, y = m.y + 24, coupe = e.coupes.includes(k)
      this.voyant(x, y, TEINTES_INJECTEURS[e.voyants?.[k] ?? 'vert'], g, 5)
      this.el('path', { d: `M${x - 14} ${y + 14} h28 l-6 30 h-16z`, fill: coupe ? '#c9c2b0' : PASTELS[k], stroke: ENCRE, 'stroke-width': 1.4 }, g)
      this.el('path', { d: `M${x - 5} ${y + 44} l-3 14 h16 l-3 -14`, fill: '#a69f86', stroke: ENCRE, 'stroke-width': 1.2 }, g)
      if (coupe) this.el('path', { d: `M${x - 9} ${y + 19} l18 20 M${x + 9} ${y + 19} l-18 20`, stroke: '#e04b37', 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
      this.texte(x, y + 74, `J${k + 1}`, 7, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
    }
    if (e.bloque) this.texte(m.x + m.w - 10, m.y + 100, `BLOQUÉ ${e.bloque} s`, 7, g, { 'text-anchor': 'end', fill: '#e04b37', 'font-weight': 'bold' })
    else if (e.voyants) this.texte(m.x + m.w - 10, m.y + 100, `${e.numero + 1}/${e.tours}`, 7, g, { 'text-anchor': 'end', 'font-weight': 'bold' })
  }

  private dessinerFusibles(e: EtatFusibles): void {
    const m = CADRES.fusibles, g = this.groupes.get('fusibles')!
    g.innerHTML = ''
    // Le porte-fusibles : huit fusibles de verre, calibres gravés dessous ; le grillé a le verre noirci et le fil rompu.
    CALIBRES.forEach((calibre, k) => {
      const x = m.x + 12 + (k % 4) * 32, y = m.y + 14 + Math.floor(k / 4) * 33
      const grille = e.tour?.grille === k
      this.el('rect', { x: x - 2, y, width: 26, height: 22, rx: 3, fill: '#3b3346', stroke: ENCRE, 'stroke-width': 1 }, g)
      this.el('rect', { x: x + 2, y: y + 3, width: 18, height: 16, rx: 5, fill: grille ? '#4a4038' : '#e8f1f2', stroke: ENCRE, 'stroke-width': 1, opacity: 0.95 }, g)
      this.el('path', { d: grille ? `M${x + 4} ${y + 11} q3 -4 5 -1 M${x + 13} ${y + 10} q3 3 5 1` : `M${x + 4} ${y + 11} q3 -5 7 0 q4 5 7 0`, fill: 'none', stroke: grille ? '#e04b37' : '#d9a43a', 'stroke-width': 1.3 }, g)
      if (grille) this.el('path', { d: `M${x + 9} ${y + 6} l3 3 l-2 2 l3 3`, fill: 'none', stroke: '#faf2dc', 'stroke-width': 0.8 }, g)
      this.texte(x + 1, y + 29, `${calibre}A`, 6, g, { 'font-weight': grille ? 'bold' : 'normal' })
    })
    // L'écran de la CHARGE et le voyant TÉMOIN.
    const ecran = !e.tour ? ['CHARGE', 'OK'] : e.bloque ? ['PROTECT.', `${e.bloque} s`] : [`CHARGE ${e.numero + 1}/${e.tours}`, `${e.tour.charge} A`]
    this.ecran(m.x + 10, m.y + 82, 86, 24, ecran, g, 8)
    this.texte(m.x + 104, m.y + 88, 'TÉMOIN', 6, g, { 'font-weight': 'bold' })
    this.voyant(m.x + 122, m.y + 98, e.tour ? TEINTES_TEMOIN[e.tour.temoin] : '#7a6a4a', g, 5.5)
  }

  private dessinerAccumulateurs(e: EtatAccumulateurs): void {
    const m = CADRES.accumulateurs, g = this.groupes.get('accumulateurs')!
    g.innerHTML = ''
    const couleurs = e.tour ? e.tour.couleurs.map((c) => TEINTES_ACCUS[c]) : ['#d9cfb4', '#d9cfb4', '#d9cfb4']
    const niveaux = e.tour ? e.tour.niveaux : [80, 80, 80]
    BORNES.forEach((borne, k) => {
      const x = m.x + 14 + k * 44, y = m.y + 18
      const branche = e.branches.includes(k)
      // La borne : verte une fois branchée (avec son rang dans le couplage).
      this.el('rect', { x: x + 10, y: y - 5, width: 14, height: 7, rx: 1.5, fill: branche ? '#5fb36a' : '#a69f86', stroke: ENCRE, 'stroke-width': 1 }, g)
      this.el('rect', { x, y, width: 34, height: 56, rx: 4, fill: couleurs[k], stroke: ENCRE, 'stroke-width': 1.6 }, g)
      this.el('rect', { x: x + 6, y: y + 7, width: 22, height: 40, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 0.8 }, g)
      const h = 40 * niveaux[k] / 100
      this.el('rect', { x: x + 6, y: y + 47 - h, width: 22, height: h, fill: 'url(#hachures)', stroke: 'none' }, g)
      this.el('line', { x1: x + 6, y1: y + 47 - h, x2: x + 28, y2: y + 47 - h, stroke: ENCRE, 'stroke-width': 1.2 }, g)
      if (branche) this.texte(x + 17, y + 31, String(e.branches.indexOf(k) + 1), 14, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
      this.texte(x + 17, y + 68, borne, 10, g, { 'text-anchor': 'middle', 'font-weight': 'bold' })
      this.texte(x + 17, y + 80, `${niveaux[k]} %`, 7, g, { 'text-anchor': 'middle' })
    })
    if (e.bloque) this.texte(m.x + m.w - 12, m.y + 104, `${e.bloque} s`, 7, g, { 'text-anchor': 'end', fill: '#e04b37', 'font-weight': 'bold' })
  }

  private dessinerTelegraphe(e: EtatTelegraphe): void {
    const m = CADRES.telegraphe, g = this.groupes.get('telegraphe')!
    g.innerHTML = ''
    // La lampe : elle clignote le mot en morse tant que le télégraphe est en défaut.
    const lx = m.x + 36, ly = m.y + 42
    this.el('circle', { cx: lx + 2, cy: ly + 2, r: 19, fill: OMBRE, opacity: 0.45 }, g)
    this.el('circle', { cx: lx, cy: ly, r: 19, fill: '#d9a43a', stroke: ENCRE, 'stroke-width': 1.6 }, g)
    const lampe = this.el('circle', { cx: lx, cy: ly, r: 13, fill: e.morse ? '#5a4e3a' : '#8fcf98', stroke: ENCRE, 'stroke-width': 1 }, g)
    if (e.morse && !e.bloque) this.el('animate', attributsMorse(e.morse, '#fff3a8', '#5a4e3a'), lampe)
    this.el('path', { d: `M${lx - 6} ${ly - 6} q3 -4 8 -3`, fill: 'none', stroke: '#fffaf0', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 }, g)
    // L'écran des fréquences.
    const ecran = e.bloque ? ['BLOQUÉ', `${e.bloque} s`] : e.morse ? [e.frequence, 'MHz'] : ['LIAISON', 'OK']
    this.ecran(m.x + 70, m.y + 18, 122, 40, ecran, g, 14)
    // Le cadran des fréquences (sa flèche suit le cran) et le manipulateur.
    const cx = m.x + 92, cy = m.y + 104, a = (-135 + (270 * e.cran) / Math.max(1, e.crans - 1)) * Math.PI / 180
    this.el('circle', { cx: cx + 1.5, cy: cy + 1.5, r: 26, fill: OMBRE, opacity: 0.4 }, g)
    this.el('circle', { cx, cy, r: 26, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.4 }, g)
    for (let k = 0; k < e.crans; k++) {
      const b = (-135 + (270 * k) / (e.crans - 1)) * Math.PI / 180
      this.el('line', { x1: cx + 20 * Math.sin(b), y1: cy - 20 * Math.cos(b), x2: cx + 25 * Math.sin(b), y2: cy - 25 * Math.cos(b), stroke: ENCRE, 'stroke-width': 0.9 }, g)
    }
    this.el('circle', { cx, cy, r: 14, fill: '#3b3346', stroke: ENCRE, 'stroke-width': 1.2 }, g)
    this.el('line', { x1: cx, y1: cy, x2: cx + 19 * Math.sin(a), y2: cy - 19 * Math.cos(a), stroke: '#e04b37', 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
    this.texte(cx - 9, cy + 38, 'FRÉQ.', 6, g)
    const kx = m.x + 132
    this.el('rect', { x: kx, y: m.y + 118, width: 62, height: 14, rx: 3, fill: '#a69f86', stroke: ENCRE, 'stroke-width': 1.2 }, g)
    this.el('path', { d: `M${kx + 8} ${m.y + 116} L${kx + 52} ${m.y + 104}`, stroke: '#d9a43a', 'stroke-width': 5, 'stroke-linecap': 'round' }, g)
    this.el('path', { d: `M${kx + 8} ${m.y + 116} L${kx + 52} ${m.y + 104}`, stroke: ENCRE, 'stroke-width': 1, 'stroke-linecap': 'round' }, g)
    this.el('circle', { cx: kx + 52, cy: m.y + 102, r: 7, fill: '#3b3346', stroke: ENCRE, 'stroke-width': 1.2 }, g)
    this.texte(kx + 6, m.y + 80, 'ÉMETTRE', 7, g, { 'font-weight': 'bold' })
  }

  private dessinerAntenne(e: EtatAntenne): void {
    const m = CADRES.antenne, g = this.groupes.get('antenne')!
    g.innerHTML = ''
    const cx = m.x + 74, cy = m.y + 84, r = 46
    this.couronne(cx, cy, r, g)
    // L'antenne parabolique, tournée de son angle.
    const ga = this.g(g, { transform: `rotate(${e.angle} ${cx} ${cy})` })
    this.el('line', { x1: cx, y1: cy, x2: cx, y2: cy - 26, stroke: ENCRE, 'stroke-width': 3 }, ga)
    this.el('path', { d: `M${cx - 18} ${cy - 22} Q${cx} ${cy - 36} ${cx + 18} ${cy - 22} Q${cx} ${cy - 28} ${cx - 18} ${cy - 22}z`, fill: '#bfe0e8', stroke: ENCRE, 'stroke-width': 1.6 }, ga)
    this.el('line', { x1: cx, y1: cy - 26, x2: cx, y2: cy - 40, stroke: ENCRE, 'stroke-width': 1.2 }, ga)
    this.el('circle', { cx, cy: cy - 41, r: 2.6, fill: '#e04b37', stroke: ENCRE, 'stroke-width': 0.8 }, ga)
    this.el('circle', { cx, cy, r: 6, fill: '#d9a43a', stroke: ENCRE, 'stroke-width': 1.2 }, g)
    // La plaque de la station et l'écran de la bande.
    this.el('rect', { x: m.x + 8, y: m.y + 14, width: 32, height: 28, rx: 4, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.4 }, g)
    this.texte(m.x + 24, m.y + 35, e.symbole ?? '—', 18, g, { 'text-anchor': 'middle', style: 'font-family: Georgia, serif' })
    const ecran = e.bloque ? ['BLOQ.', `${e.bloque}s`] : e.bande ? ['BANDE', e.bande] : ['LIAIS.', 'OK']
    this.ecran(m.x + 100, m.y + 14, 42, 30, ecran, g, 9)
    if (e.symbole) this.texte(m.x + 112, m.y + 144, `${e.numero + 1}/${e.tours}`, 7, g, { 'font-weight': 'bold' })
    this.texte(m.x + 8, m.y + 144, `${e.angle}°`, 7, g, { 'font-weight': 'bold' })
  }

  private dessinerChiffreur(e: EtatChiffreur): void {
    const m = CADRES.chiffreur, g = this.groupes.get('chiffreur')!
    g.innerHTML = ''
    const touches = e.touches ?? ['·', '·', '·', '·']
    touches.forEach((s, k) => {
      const x = m.x + 18 + k * 68, y = m.y + 38, enfoncee = e.enfoncees.includes(k)
      this.voyant(x + 30, m.y + 22, enfoncee ? '#8fcf98' : '#7a6a4a', g, 4)
      this.el('rect', { x: x + 4, y: y + 4, width: 60, height: 60, rx: 8, fill: OMBRE, opacity: enfoncee ? 0 : 0.5 }, g)
      const d = enfoncee ? 3 : 0
      this.el('rect', { x: x + d, y: y + d, width: 60, height: 60, rx: 8, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 2 }, g)
      this.el('rect', { x: x + 5 + d, y: y + 5 + d, width: 50, height: 50, rx: 5, fill: 'none', stroke: ENCRE, 'stroke-width': 0.6 }, g)
      this.texte(x + 30 + d, y + 42 + d, s, 30, g, { 'text-anchor': 'middle', style: 'font-family: Georgia, serif' })
    })
    const ecran = e.bloque ? ['BLOQUÉ', `${e.bloque} s`] : e.touches ? ['CHIFFRE', `${e.enfoncees.length}/4`] : ['CHIFFRE', 'OK']
    this.ecran(m.x + 294, m.y + 38, 58, 34, ecran, g, 9)
    this.cadran(m.x + 322, m.y + 92, 12, g)
  }

  private dessinerBornier(e: EtatEnergie): void {
    const m = CADRES.bornier, g = this.groupes.get('bornier')!
    g.innerHTML = ''
    const tour = e.tour
    const ecranTexte = !tour ? ['DIAG', 'BUS OK'] : e.bloque > 0 ? ['PROTECT.', `${e.bloque} s`] : [`DIAG ${e.numero + 1}/${e.tours}`, tour.diagnostic.code]
    this.ecran(m.x + 12, m.y + 16, 90, 30, ecranTexte, g, 9)
    this.texte(m.x + 112, m.y + 22, 'BUS', 7, g, { 'font-weight': 'bold' })
    const voyants = tour ? tour.voyants : [true, true, true, true]
    voyants.forEach((on, k) => {
      this.voyant(m.x + 118 + k * 18, m.y + 36, on ? '#f2b53a' : '#7a6a4a', g, 4)
      this.texte(m.x + 114 + k * 18, m.y + 50, `V${k + 1}`, 6, g)
    })
    // Le bornier et ses câbles (de haut en bas).
    const bx = m.x + 14, by = m.y + 62, H = 128
    this.el('rect', { x: bx, y: by, width: 178, height: H, rx: 6, fill: '#3b3346', stroke: ENCRE, 'stroke-width': 1.6 }, g)
    const cables = tour ? tour.cables : [{ couleur: 'rouge', circuit: 'α', chiffre: 1 }, { couleur: 'bleu', circuit: 'β', chiffre: 4 }, { couleur: 'jaune', circuit: 'γ', chiffre: 6 }, { couleur: 'blanc', circuit: 'δ', chiffre: 8 }] as TourEnergie['cables']
    const n = cables.length, pas = H / (n + 1)
    cables.forEach((c, k) => {
      const y1 = by + pas * (k + 1), y2 = by + pas * (((k * 3 + 2) % n) + 1), couleur = TEINTES[c.couleur]
      const coupe = e.coupes.includes(k)
      const gc = this.g(g)
      const traits = coupe
        ? [`M${bx + 26} ${y1} C${bx + 55} ${y1} ${bx + 70} ${(y1 * 2 + y2) / 3} ${bx + 80} ${(y1 * 2 + y2) / 3 + 3}`, `M${bx + 106} ${(y1 + y2 * 2) / 3 - 3} C${bx + 120} ${y2} ${bx + 135} ${y2} ${bx + 160} ${y2}`]
        : [`M${bx + 26} ${y1} C${bx + 80} ${y1} ${bx + 100} ${y2} ${bx + 160} ${y2}`]
      for (const d of traits) {
        this.el('path', { d, fill: 'none', stroke: ENCRE, 'stroke-width': 7.5, 'stroke-linecap': 'round' }, gc)
        this.el('path', { d, fill: 'none', stroke: couleur, 'stroke-width': 5, 'stroke-linecap': 'round' }, gc)
      }
      this.el('rect', { x: bx + 2, y: y1 - 6, width: 22, height: 11, rx: 2, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 0.8 }, g)
      this.texte(bx + 5, y1 + 2.5, `${c.circuit}${c.chiffre}`, 7, g, { 'font-weight': 'bold' })
      this.el('circle', { cx: bx + 26, cy: y1, r: 3.5, fill: '#d9a43a', stroke: ENCRE, 'stroke-width': 1 }, g)
      this.el('circle', { cx: bx + 160, cy: y2, r: 3.5, fill: '#d9a43a', stroke: ENCRE, 'stroke-width': 1 }, g)
    })
    // ISOLER.
    const gi = this.g(g)
    this.el('rect', { x: m.x + 12, y: m.y + 196, width: 76, height: 34, rx: 5, fill: '#e04b37', stroke: ENCRE, 'stroke-width': 1.6 }, gi)
    this.el('rect', { x: m.x + 18, y: m.y + 200, width: 64, height: 26, rx: 3, fill: 'url(#hachures)', stroke: ENCRE, 'stroke-width': 0.8 }, gi)
    this.texte(m.x + 27, m.y + 216, 'ISOLER', 9, gi, { 'font-weight': 'bold' })
    this.cadran(m.x + 120, m.y + 212, 14, g); this.texte(m.x + 140, m.y + 216, 'AMP.', 6, g)
    this.cadran(m.x + 180, m.y + 212, 14, g)
  }

  /** Une étincelle sur un module (erreur). */
  etincelle(a: NomAppareil): void {
    const m = CADRES[a]
    const g = this.g(this.svg, { class: 'etincelle' })
    for (let k = 0; k < 10; k++) {
      const an = (k / 10) * Math.PI * 2, x = m.x + m.w / 2, y = m.y + m.h / 2
      this.el('line', { x1: x + 8 * Math.cos(an), y1: y + 8 * Math.sin(an), x2: x + 34 * Math.cos(an), y2: y + 34 * Math.sin(an), stroke: k % 2 ? '#f2b53a' : '#fff3a8', 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
    }
    setTimeout(() => g.remove(), 700)
  }

  /** Position verticale (fraction de la hauteur) du haut d'un module, pour y faire défiler le volet. */
  static hauteur(a: NomAppareil): number {
    return CADRES[a].y / HAUTEUR_PANNEAU
  }
}
