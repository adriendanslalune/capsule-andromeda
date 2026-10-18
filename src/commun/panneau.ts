// Le panneau de réparation (volet Capsule › Réparation ; maquette validée par Adrien le 18/10/2026) : une grande tôle en
// style Moebius, foisonnante — tuyaux, faisceaux de câbles, cadrans, petits écrans, voyants, étiquettes, notes collées —
// dessinée avec un hasard propre à chaque capsule (son numéro de série). Au milieu du fouillis, les cinq modules.
// Le module Énergie montre l'écran DIAG, les voyants de bus, le bornier de câbles et l'interrupteur ISOLER ; l'aiguille
// de pression du module Moteur sert d'indice. Les gestes passent par des boutons sous le panneau (COUPER, ISOLER : demande
// d'Adrien du 18/10/2026, viser un câble fin était trop difficile). Le panneau ne décide rien : il montre l'état que lui
// donne le moteur du jeu.

import type { NomModule } from '../donnees/modules'
import type { CouleurCable } from '../donnees/manuel-energie'
import type { TourEnergie } from '../moteur/reparation'

const NS = 'http://www.w3.org/2000/svg'
const ENCRE = '#2b2138'
const OMBRE = '#7d6a9e'
const PASTELS = ['#bfe0c8', '#f3c2b0', '#bfe0e8', '#f5d38a', '#d7cdee', '#f6e3b8', '#c9d9a8', '#e8b9c9']
const TEINTES: Record<CouleurCable, string> = {
  rouge: '#e04b37', bleu: '#3f63c4', jaune: '#f2b53a', blanc: '#faf2dc', vert: '#5fb36a', noir: '#3a3340',
}
export const LARGEUR_PANNEAU = 390
export const HAUTEUR_PANNEAU = 1180

/** Emplacement des cinq modules sur le panneau. */
const CADRES: Record<NomModule, { x: number; y: number; w: number; h: number; nom: string }> = {
  moteur: { x: 14, y: 128, w: 186, h: 196, nom: '1 · MOTEUR' },
  energie: { x: 172, y: 448, w: 206, h: 238, nom: '2 · ÉNERGIE' },
  communications: { x: 14, y: 448, w: 146, h: 160, nom: '3 · COMMUNIC.' },
  navigation: { x: 196, y: 196, w: 182, h: 170, nom: '4 · NAVIGATION' },
  coque: { x: 30, y: 930, w: 170, h: 150, nom: '5 · COQUE' },
}

/** Ce que le panneau doit montrer du module Énergie. */
export interface EtatEnergie {
  /** Tour de réparation en cours, ou null si l'Énergie marche. */
  tour: TourEnergie | null
  coupes: number[]
  /** Module bloqué après une erreur (secondes restantes, 0 sinon). */
  bloque: number
  /** Tour actuel et nombre de tours (pour l'écran DIAG). */
  numero: number
  tours: number
}

export class Panneau {
  private svg: SVGSVGElement
  private serie = ''
  private graine = 1
  private gEnergie!: SVGGElement
  private aiguillePression!: SVGLineElement
  private voyants = new Map<NomModule, SVGCircleElement>()
  private dernier = ''
  private zones: [NomModule, (typeof CADRES)[NomModule]][] = []
  private selection!: SVGRectElement

  /** toucher : appelé quand on touche un module du panneau (pour ouvrir ses commandes). */
  constructor(conteneur: HTMLElement, private toucher: (m: NomModule) => void) {
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

  /** Dessine tout le panneau d'une capsule (une seule fois par numéro de série : c'est long). */
  construire(serie: string): void {
    if (serie === this.serie) return
    this.serie = serie
    this.graine = [...serie].reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 2147483646, 7) + 1
    this.svg.innerHTML = ''
    this.voyants.clear()
    this.zones = []
    this.dernier = ''
    const defs = this.el('defs', {})
    const motif = this.el('pattern', { id: 'hachures', width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs)
    this.el('line', { x1: 0, y1: 0, x2: 0, y2: 4, stroke: OMBRE, 'stroke-width': 0.9 }, motif)
    const trame = this.el('pattern', { id: 'trame', width: 3, height: 3, patternUnits: 'userSpaceOnUse' }, defs)
    this.el('circle', { cx: 1.5, cy: 1.5, r: 0.55, fill: ENCRE, opacity: 0.35 }, trame)

    // Fond : la tôle sable et ses joints.
    this.el('rect', { x: 0, y: 0, width: LARGEUR_PANNEAU, height: HAUTEUR_PANNEAU, fill: '#efe2c4' })
    this.el('rect', { x: 0, y: 0, width: LARGEUR_PANNEAU, height: HAUTEUR_PANNEAU, fill: 'url(#trame)', opacity: 0.35 })
    for (let y = 0; y < HAUTEUR_PANNEAU; y += 118) this.el('path', { d: `M0 ${y} H${LARGEUR_PANNEAU}`, stroke: ENCRE, 'stroke-width': 0.6, opacity: 0.4 })

    // Grands tuyaux et faisceaux de câbles décoratifs.
    this.tuyau('M-10 70 H120 Q150 70 150 100 V380 Q150 410 180 410 H400', this.choix(PASTELS), 14)
    this.tuyau('M400 160 H330 Q300 160 300 190 V640 Q300 670 270 670 H-10', this.choix(PASTELS), 11)
    this.tuyau('M60 -10 V40 Q60 60 80 60 H90', this.choix(PASTELS), 9)
    this.tuyau('M-10 860 H90 Q120 860 120 890 V1190', this.choix(PASTELS), 13)
    this.tuyau('M400 980 H250 Q220 980 220 1010 V1190', this.choix(PASTELS), 10)
    this.bride(150, 230, true); this.bride(300, 420, true); this.bride(60, 860, false); this.bride(220, 1100, true); this.bride(330, 160, false)
    this.faisceau(30, 120, 90, 300, 5)
    this.faisceau(350, 420, 330, 600, 6)
    this.faisceau(40, 700, 120, 840, 4)
    this.faisceau(360, 860, 300, 980, 5)

    // Le fouillis : petites plaques semées partout, puis les derniers recoins.
    const zones: { x: number; y: number; w: number; h: number }[] = Object.values(CADRES).map((c) => ({ ...c }))
    zones.push({ x: 206, y: 14, w: 168, h: 44 }) // plaque du numéro de série
    const libre = (x: number, y: number, w: number, h: number) => zones.every((z) => x + w < z.x - 4 || x > z.x + z.w + 4 || y + h < z.y - 4 || y > z.y + z.h + 4)
    for (let essai = 0; essai < 4000; essai++) {
      const grand = essai < 1500
      const w = grand ? this.entre(40, 110) : this.entre(22, 48), h = grand ? this.entre(30, 80) : this.entre(18, 34)
      const x = this.entre(2, LARGEUR_PANNEAU - 2 - w), y = this.entre(2, HAUTEUR_PANNEAU - 2 - h)
      if (!libre(x, y, w, h)) continue
      zones.push({ x, y, w, h })
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
    for (let k = 0; k < 2500; k++) {
      const x = this.entre(3, LARGEUR_PANNEAU - 3), y = this.entre(3, HAUTEUR_PANNEAU - 3)
      if (!libre(x - 5, y - 5, 10, 10)) continue
      zones.push({ x: x - 5, y: y - 5, w: 10, h: 10 })
      const r = this.hasard()
      if (r < 0.35) this.rivet(x, y)
      else if (r < 0.5) this.voyant(x, y, this.choix(['#8fcf98', '#e04b37', '#f2b53a', '#bfe0e8']), this.svg, 2)
      else if (r < 0.65) this.el('path', { d: `M${x - 5} ${y} q3 -5 5 0 t5 0`, fill: 'none', stroke: this.choix(['#e04b37', '#3f63c4', '#f2b53a']), 'stroke-width': 1.6 })
      else if (r < 0.8) for (let j = 0; j < 4; j++) this.el('line', { x1: x - 4 + j * 2.6, y1: y - 3, x2: x - 4 + j * 2.6, y2: y + (j % 2 ? 1 : 3), stroke: ENCRE, 'stroke-width': 0.7 })
      else this.el('rect', { x: x - 4, y: y - 3, width: 8, height: 6, rx: 1, fill: this.choix(PASTELS), stroke: ENCRE, 'stroke-width': 0.7 })
    }
    // Notes collées, à la main.
    for (const [x, y, t, a] of [[10, 640, 'lire le\nmanuel !!', -6], [250, 1120, 'appeler J.\nsi R5', 5]] as [number, number, string, number][]) {
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

  /** Cadres des cinq modules, et ce qui ne bouge pas dedans. */
  private dessinerModules(): void {
    const cadres = new Map<NomModule, SVGGElement>()
    for (const [nom, m] of Object.entries(CADRES) as [NomModule, typeof CADRES.moteur][]) {
      const g = this.g()
      this.el('rect', { x: m.x + 4, y: m.y + 4, width: m.w, height: m.h, rx: 10, fill: OMBRE, opacity: 0.5 }, g)
      this.el('rect', { x: m.x, y: m.y, width: m.w, height: m.h, rx: 10, fill: '#e9dfc4', stroke: ENCRE, 'stroke-width': 2.2 }, g)
      this.el('rect', { x: m.x + 4, y: m.y + 4, width: m.w - 8, height: m.h - 8, rx: 7, fill: 'none', stroke: ENCRE, 'stroke-width': 0.6, 'stroke-dasharray': '3 2' }, g)
      this.el('rect', { x: m.x + 10, y: m.y - 8, width: m.nom.length * 5.6 + 12, height: 15, rx: 3, fill: '#f2c66a', stroke: ENCRE, 'stroke-width': 1.4 }, g)
      this.texte(m.x + 16, m.y + 3, m.nom, 8.5, g, { 'font-weight': 'bold' })
      this.voyants.set(nom, this.voyant(m.x + m.w - 14, m.y + 2, '#8fcf98', g, 4.2))
      cadres.set(nom, g)
      // Toucher le module ouvre ses commandes (zone par-dessus tout le cadre, ajoutée à la fin : voir zonesDeToucher).
      this.zones.push([nom, m])
    }
    // 1 · MOTEUR : jauges (l'aiguille de pression est un indice pour l'Énergie), symbole, leviers.
    const mo = CADRES.moteur, gMo = cadres.get('moteur')!
    this.aiguillePression = this.cadran(mo.x + 40, mo.y + 48, 24, gMo, 0, true)
    this.texte(mo.x + 22, mo.y + 84, 'PRESSION', 6, gMo)
    this.cadran(mo.x + 100, mo.y + 48, 18, gMo); this.texte(mo.x + 88, mo.y + 78, 'TEMP.', 6, gMo)
    this.el('rect', { x: mo.x + 132, y: mo.y + 28, width: 40, height: 40, rx: 4, fill: '#f2c66a', stroke: ENCRE, 'stroke-width': 1.4 }, gMo)
    this.texte(mo.x + 142, mo.y + 58, this.choix(['♃', '♄', '☿', '♀']), 26, gMo)
    for (let k = 0; k < 5; k++) {
      const x = mo.x + 22 + k * 34, y = mo.y + 110
      this.el('rect', { x: x - 12, y: y + 50, width: 24, height: 12, rx: 3, fill: '#a69f86', stroke: ENCRE, 'stroke-width': 1.2 }, gMo)
      this.el('rect', { x: x - 3, y: y + 8, width: 6, height: 46, rx: 2, fill: ENCRE }, gMo)
      this.el('circle', { cx: x, cy: y + 8, r: 8, fill: ['#e04b37', '#bfe0e8', '#f2b53a', '#8fcf98', '#faf2dc'][k], stroke: ENCRE, 'stroke-width': 1.4 }, gMo)
      this.texte(x - 3, y + 74, ['I', 'II', 'III', 'IV', 'V'][k], 7, gMo)
    }
    // 3 · COMMUNICATIONS : la radio.
    const co = CADRES.communications, gCo = cadres.get('communications')!
    this.el('rect', { x: co.x + 12, y: co.y + 16, width: 56, height: 60, rx: 5, fill: '#6b5d4a', stroke: ENCRE, 'stroke-width': 1.4 }, gCo)
    for (let k = 0; k < 9; k++) this.el('line', { x1: co.x + 16, y1: co.y + 22 + k * 6, x2: co.x + 64, y2: co.y + 22 + k * 6, stroke: '#e9dfc4', 'stroke-width': 2 }, gCo)
    this.ecran(co.x + 76, co.y + 16, 60, 24, ['3.505', 'MHz'], gCo, 8)
    this.cadran(co.x + 106, co.y + 64, 16, gCo)
    this.voyant(co.x + 40, co.y + 92, '#fff3a8', gCo, 6)
    this.texte(co.x + 14, co.y + 110, 'TÉLÉGRAPHE', 6, gCo)
    for (let k = 0; k < 4; k++) this.bouton(co.x + 24 + k * 30, co.y + 134, 9, this.choix(PASTELS), gCo)
    // 4 · NAVIGATION : écran rond, constellation, boutons à symboles.
    const na = CADRES.navigation, gNa = cadres.get('navigation')!
    this.el('circle', { cx: na.x + 56, cy: na.y + 70, r: 46, fill: '#1f2b22', stroke: ENCRE, 'stroke-width': 2 }, gNa)
    this.el('circle', { cx: na.x + 56, cy: na.y + 70, r: 30, fill: 'none', stroke: '#3c5a3e', 'stroke-width': 1 }, gNa)
    this.el('path', { d: `M${na.x + 56} ${na.y + 24} v92 M${na.x + 10} ${na.y + 70} h92`, stroke: '#3c5a3e', 'stroke-width': 1 }, gNa)
    const etoiles = Array.from({ length: 6 }, () => [this.entre(28, 84), this.entre(38, 102)])
    this.el('path', { d: 'M' + etoiles.map(([a, b]) => `${na.x + a} ${na.y + b}`).join(' L') + 'z', fill: 'none', stroke: '#b9f08c', 'stroke-width': 0.8, opacity: 0.6 }, gNa)
    for (const [a, b] of etoiles) this.el('circle', { cx: na.x + a, cy: na.y + b, r: 2.4, fill: '#b9f08c' }, gNa)
    ;['☉', '☾', '♄', '♂', '♀', '☿'].forEach((s, k) => {
      const x = na.x + 118 + (k % 2) * 30, y = na.y + 30 + Math.floor(k / 2) * 32
      this.el('rect', { x: x - 12, y: y - 12, width: 24, height: 24, rx: 4, fill: '#faf2dc', stroke: ENCRE, 'stroke-width': 1.4 }, gNa)
      this.texte(x - 6, y + 6, s, 15, gNa)
    })
    this.cadran(na.x + 132, na.y + 142, 12, gNa); this.cadran(na.x + 162, na.y + 142, 12, gNa)
    // 5 · COQUE : manomètre et vannes.
    const cq = CADRES.coque, gCq = cadres.get('coque')!
    this.cadran(cq.x + 34, cq.y + 46, 22, gCq); this.texte(cq.x + 24, cq.y + 78, 'BAR', 6, gCq)
    ;['#d9694f', '#3f63c4', '#8fcf98'].forEach((c, k) => {
      const x = cq.x + 82 + k * 30, y = cq.y + 46
      this.el('circle', { cx: x, cy: y, r: 13, fill: 'none', stroke: ENCRE, 'stroke-width': 5.5 }, gCq)
      this.el('circle', { cx: x, cy: y, r: 13, fill: 'none', stroke: c, 'stroke-width': 3.5 }, gCq)
      this.el('path', { d: `M${x} ${y - 13} v26 M${x - 13} ${y} h26`, stroke: ENCRE, 'stroke-width': 2 }, gCq)
      this.texte(x - 2, y + 26, 'ABC'[k], 7, gCq)
    })
    for (let k = 0; k < 6; k++) this.interrupteur(cq.x + 20 + k * 24, cq.y + 118, gCq)
    // 2 · ÉNERGIE : son contenu change à chaque tour (dessiné par afficher()).
    this.gEnergie = this.g(cadres.get('energie')!)
    // Zones de toucher des modules, et le cadre de sélection.
    for (const [nom, m] of this.zones) {
      const z = this.el('rect', { x: m.x, y: m.y - 8, width: m.w, height: m.h + 8, fill: 'transparent', class: 'commande' })
      z.addEventListener('click', () => this.toucher(nom))
    }
    this.selection = this.el('rect', { x: 0, y: 0, width: 0, height: 0, rx: 12, fill: 'none', stroke: '#e04b37', 'stroke-width': 3.5, 'stroke-dasharray': '8 5', 'pointer-events': 'none', class: 'selection-module' }) as SVGRectElement
  }

  /** Entoure le module choisi (null : aucun). */
  choisir(nom: NomModule | null): void {
    if (!nom) { this.selection.setAttribute('width', '0'); return }
    const m = CADRES[nom]
    for (const [k, v] of Object.entries({ x: m.x - 5, y: m.y - 13, width: m.w + 10, height: m.h + 18 })) this.selection.setAttribute(k, String(v))
  }

  /** Met le panneau à jour : voyants des modules en panne, module Énergie, aiguille de pression du Moteur. */
  afficher(pannes: NomModule[], energie: EtatEnergie): void {
    const cle = JSON.stringify([pannes, energie])
    if (cle === this.dernier) return
    this.dernier = cle
    for (const [nom, v] of this.voyants) {
      const panne = pannes.includes(nom)
      v.setAttribute('fill', panne ? '#e04b37' : '#8fcf98')
      v.classList.toggle('clignote', panne)
    }
    // Aiguille de pression : dans le rouge ou non (indice d'un tour de réparation de l'Énergie).
    const mo = CADRES.moteur, a = energie.tour?.pressionRouge ? 1.75 : -0.9
    this.aiguillePression.setAttribute('x2', String(mo.x + 40 + 18 * Math.sin(a)))
    this.aiguillePression.setAttribute('y2', String(mo.y + 48 - 18 * Math.cos(a)))
    this.dessinerEnergie(energie)
  }

  private dessinerEnergie(e: EtatEnergie): void {
    const m = CADRES.energie, g = this.gEnergie
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
    // Le bornier et ses câbles (de haut en bas). Toucher un câble le coupe.
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

  /** Une étincelle sur le module Énergie (erreur). */
  etincelle(): void {
    const m = CADRES.energie
    const g = this.g(this.svg, { class: 'etincelle' })
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, x = m.x + m.w / 2, y = m.y + 126
      this.el('line', { x1: x + 8 * Math.cos(a), y1: y + 8 * Math.sin(a), x2: x + 34 * Math.cos(a), y2: y + 34 * Math.sin(a), stroke: k % 2 ? '#f2b53a' : '#fff3a8', 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
    }
    setTimeout(() => g.remove(), 700)
  }

  /** Position verticale (fraction de la hauteur) du module Énergie, pour y faire défiler le volet. */
  static hauteurEnergie(): number {
    return CADRES.energie.y / HAUTEUR_PANNEAU
  }
}
