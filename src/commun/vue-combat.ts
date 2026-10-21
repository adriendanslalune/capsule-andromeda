// Le combat en temps réel (ABATTRE, la mission des Mercenaires ; décision d'Adrien du 19/10/2026 : comme les premiers
// jeux de tir sur Game Boy), en plein écran par-dessus la carte. Vue du dessus : on glisse le doigt n'importe où, la
// capsule le suit (un peu au-dessus, pour que le pouce ne la cache pas) et tire toute seule ; on esquive les balles des
// aliens ; le bouton BOMBE efface toutes les balles. La vue ne décide rien : elle montre l'état que tient le moteur
// (moteur/combat.ts).

import { confirmer } from './confirmation'
import { HAUTEUR, LARGEUR } from '../donnees/combat'
import { avancerCombat, bombe, chef, EQUIPEMENT_DEPART, nouveauCombat, retraite, type Equipement, type EtatCombat } from '../moteur/combat'

/** Un combat : son titre, la zone (plus loin, plus d'aliens), et ce qui arrive à la fin (le texte du bilan). */
export interface OptionsCombat {
  titre: string; zone: number; surFin?: (fin: 'victoire' | 'retraite', degatsRecus: number) => string
  /** L'assaut final d'une zone : son vaisseau amiral (décisions d'Adrien du 21/10/2026). */
  amiral?: { nom: string; planete: boolean }
}
export const SIMULATEUR: OptionsCombat = { titre: 'SIMULATEUR · CHASSEUR ALIEN', zone: 1 }

const ENCRE = '#2b2138', CERISE = '#e04b37', VIOLET = '#9d7cc8'

export class VueCombat {
  private etat: EtatCombat | null = null
  private options: OptionsCombat = SIMULATEUR
  private doigt: { x: number; y: number } | null = null
  private boucle = 0
  /** Le combat est figé pendant que la question de la retraite est posée. */
  private enPause = false
  private avant = 0
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elInfos: HTMLElement
  private elBombe: HTMLButtonElement
  private elAide: HTMLElement
  private elFin: HTMLElement
  /** Passage du terrain (ses unités) à l'écran : échelle et décalage. */
  private k = 3
  private ox = 0
  private oy = 0

  /** equipement : l'armement de la capsule (décisions d'Adrien du 21/10/2026), lu à chaque combat. */
  constructor(private element: HTMLElement, private equipement: () => Equipement = () => EQUIPEMENT_DEPART) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-combat"></span><button type="button" data-retraite>RETRAITE</button></div>
      <div class="infos-combat"></div>
      <div class="vue"><canvas></canvas>
        <button type="button" class="bombe" data-bombe>BOMBE<small></small></button>
        <p class="aide-combat">Glisse le doigt : la capsule le suit et tire toute seule. Esquive les balles !</p></div>
      <div class="fin-combat" hidden></div>`
    this.toile = element.querySelector('canvas')!
    this.ctx = this.toile.getContext('2d')!
    this.elInfos = element.querySelector('.infos-combat')!
    this.elBombe = element.querySelector('[data-bombe]')!
    this.elAide = element.querySelector('.aide-combat')!
    this.elFin = element.querySelector('.fin-combat')!
    element.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('button')
      const e = this.etat
      if (!b) return
      if (b.dataset.fermer !== undefined) { this.fermer(); return }
      if (b.dataset.rejouer !== undefined) { this.ouvrir(this.options); return }
      if (!e || e.fin) return
      if (b.dataset.retraite !== undefined) {
        this.enPause = true
        void confirmer({ titre: 'Retraite ?', texte: 'Le chasseur reste là, et la Coque de la capsule tombe en panne.', oui: 'BATTRE EN RETRAITE', non: 'CONTINUER', grave: true })
          .then((oui) => { this.enPause = false; if (oui && !e.fin) { retraite(e); this.terminer() } })
      } else if (b.dataset.bombe !== undefined && bombe(e)) navigator.vibrate?.(80)
    })
    // Le doigt sur le terrain : la capsule le suit.
    const suivre = (ev: PointerEvent) => {
      const r = this.toile.getBoundingClientRect()
      this.doigt = { x: (ev.clientX - r.left - this.ox) / this.k, y: (ev.clientY - r.top - this.oy) / this.k }
    }
    this.toile.addEventListener('pointerdown', (ev) => {
      ev.preventDefault()
      this.toile.setPointerCapture(ev.pointerId)
      suivre(ev)
      this.elAide.hidden = true
    })
    this.toile.addEventListener('pointermove', (ev) => { if (this.doigt) suivre(ev) })
    for (const fin of ['pointerup', 'pointercancel']) this.toile.addEventListener(fin, () => { this.doigt = null })
  }

  ouvrir(options: OptionsCombat = SIMULATEUR): void {
    this.options = options
    this.etat = nouveauCombat((Date.now() % 2147483647) >>> 0, options.zone, options.amiral, this.equipement())
    this.doigt = null
    this.enPause = false
    this.element.querySelector('.titre-combat')!.textContent = options.titre
    this.elAide.hidden = false
    this.elFin.hidden = true
    this.element.hidden = false
    cancelAnimationFrame(this.boucle)
    this.avant = performance.now()
    const image = (maintenant: number) => {
      if (this.element.hidden) return
      const dt = Math.min(0.05, (maintenant - this.avant) / 1000)
      this.avant = maintenant
      if (!this.enPause) this.avancer(dt)
      this.dessiner()
      this.boucle = requestAnimationFrame(image)
    }
    this.boucle = requestAnimationFrame(image)
  }

  fermer(): void {
    this.element.hidden = true
    cancelAnimationFrame(this.boucle)
    this.etat = null
  }

  private avancer(dt: number): void {
    const e = this.etat
    if (!e || e.fin) return
    const ev = avancerCombat(e, dt, this.doigt)
    if (ev.includes('touche')) navigator.vibrate?.(90)
    if (ev.includes('bouclier')) navigator.vibrate?.(30)
    if (e.fin) { this.terminer(); return }
    const c = chef(e)
    const bouclier = e.equipement.bouclier ? `<span class="bouclier-combat${e.temps >= e.bouclierPret ? ' pret' : ''}">BOUCLIER</span>` : ''
    const html = `<span>COQUE <span class="points${e.equipement.coque > 15 ? ' serres' : ''}">${Array.from({ length: e.equipement.coque }, (_, i) => `<i class="${i < e.coque ? 'rempli' : ''}"></i>`).join('')}</span>${bouclier}</span>`
      + `<span class="jauge-chasseur"><small>${this.options.amiral ? this.options.amiral.nom.toUpperCase() : 'CHASSEUR'}</small><span class="jauge"><i style="width:${c ? Math.round((100 * Math.max(0, c.pv)) / c.pvMax) : 0}%"></i></span></span>`
    if (html !== this.elInfos.dataset.html) { this.elInfos.innerHTML = html; this.elInfos.dataset.html = html }
    const bombes = `${e.bombes}/${e.equipement.bombes}`
    if (this.elBombe.dataset.n !== bombes) { this.elBombe.dataset.n = bombes; this.elBombe.querySelector('small')!.textContent = bombes; this.elBombe.disabled = e.bombes === 0 }
  }

  private terminer(): void {
    const e = this.etat!
    const fin = e.fin as 'victoire' | 'retraite'
    navigator.vibrate?.(fin === 'victoire' ? [60, 40, 60] : 300)
    const suite = this.options.surFin ? this.options.surFin(fin, e.degatsRecus) : 'Simulateur : rien n\'arrive à ta capsule.'
    this.elFin.innerHTML = `<div class="carte-fin"><b>${fin === 'victoire' ? (this.options.amiral ? 'VAISSEAU AMIRAL DÉTRUIT !' : 'CHASSEUR ABATTU !') : 'RETRAITE'}</b>`
      + `<p>${fin === 'victoire'
        ? `${e.abattus ? `${e.abattus} escorteur${e.abattus > 1 ? 's' : ''} abattu${e.abattus > 1 ? 's' : ''} en chemin. ` : ''}${e.degatsRecus ? `${e.degatsRecus} coup${e.degatsRecus > 1 ? 's' : ''} reçu${e.degatsRecus > 1 ? 's' : ''}.` : 'Sans une égratignure : prime de 10 %.'}`
        : 'La capsule décroche, coque abîmée.'}</p><p class="petit">${suite}</p>`
      + `<div class="boutons-fin">${this.options.surFin ? '' : '<button type="button" data-rejouer>REJOUER</button>'}<button type="button" class="principal" data-fermer>FERMER</button></div></div>`
    this.elFin.hidden = false
  }

  private dessiner(): void {
    const e = this.etat
    if (!e) return
    const toile = this.toile, ctx = this.ctx
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const l = toile.clientWidth, h = toile.clientHeight
    if (toile.width !== Math.round(l * dpr) || toile.height !== Math.round(h * dpr)) { toile.width = Math.round(l * dpr); toile.height = Math.round(h * dpr) }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, l, h)
    this.k = Math.min(l / LARGEUR, h / HAUTEUR)
    this.ox = (l - LARGEUR * this.k) / 2
    this.oy = (h - HAUTEUR * this.k) / 2
    const k = this.k, X = (x: number) => this.ox + x * k, Y = (y: number) => this.oy + y * k
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // On file vers le haut : de la poussière qui défile.
    ctx.strokeStyle = 'rgba(43,33,56,0.16)'
    ctx.lineWidth = 1
    for (let i = 0; i < 30; i++) {
      const x = (i * 33.7) % LARGEUR, y = ((i * 57.3 + e.temps * 30) % (HAUTEUR + 20)) - 10
      ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x), Y(y + 5)); ctx.stroke()
    }

    // Nos tirs.
    ctx.strokeStyle = '#f2b53a'
    ctx.lineWidth = Math.max(2, 0.8 * k)
    for (const t of e.tirs) { ctx.beginPath(); ctx.moveTo(X(t.x), Y(t.y)); ctx.lineTo(X(t.x), Y(t.y + 3)); ctx.stroke() }

    // Les aliens : le chasseur (gros, cœur vert) et ses escorteurs (petits dards), pointe vers le bas.
    for (const a of e.aliens) {
      if (a.chef && e.amiral) { this.amiral(ctx, X(a.x), Y(a.y), k, a.pv < a.pvMax / 2, e.temps); continue }
      const s = a.chef ? 1.6 : 0.85
      ctx.save()
      ctx.translate(X(a.x), Y(a.y))
      ctx.scale(k * s, k * s)
      ctx.beginPath()
      ctx.moveTo(0, 6); ctx.lineTo(2.5, 1); ctx.lineTo(7, -1); ctx.lineTo(2.5, -2.5); ctx.lineTo(0, -6); ctx.lineTo(-2.5, -2.5); ctx.lineTo(-7, -1); ctx.lineTo(-2.5, 1)
      ctx.closePath()
      ctx.fillStyle = a.chef ? VIOLET : '#b9a0dc'
      ctx.fill()
      ctx.lineWidth = 1.6 / (k * s)
      ctx.strokeStyle = ENCRE
      ctx.stroke()
      ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, 2 * Math.PI); ctx.fillStyle = '#b9f08c'; ctx.fill(); ctx.stroke()
      ctx.restore()
    }

    // Les balles ennemies : de petites billes cerise cernées d'encre (bien visibles).
    for (const b of e.balles) {
      ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), Math.max(4, 1.5 * k), 0, 2 * Math.PI)
      ctx.fillStyle = CERISE; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = ENCRE; ctx.stroke()
    }

    // Le bouclier chargé : un anneau bleu autour de la capsule.
    if (e.temps >= e.bouclierPret) {
      ctx.beginPath()
      ctx.arc(X(e.capsule.x), Y(e.capsule.y), 7.5 * k, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(120, 190, 230, 0.85)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    // La capsule (elle clignote quand elle vient d'être touchée).
    if (e.temps >= e.invulnerableJusqua || Math.floor(e.temps * 12) % 2 === 0) {
      ctx.save()
      ctx.translate(X(e.capsule.x), Y(e.capsule.y))
      ctx.scale(k, k)
      ctx.lineWidth = 1.5 / k
      ctx.strokeStyle = ENCRE
      ctx.fillStyle = '#8fd0dc'
      ctx.fillRect(-7.5, 1, 4.5, 2.2); ctx.strokeRect(-7.5, 1, 4.5, 2.2)
      ctx.fillRect(3, 1, 4.5, 2.2); ctx.strokeRect(3, 1, 4.5, 2.2)
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3, 1.5); ctx.lineTo(2.5, 4.5); ctx.lineTo(-2.5, 4.5); ctx.lineTo(-3, 1.5); ctx.closePath()
      ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-1.2, 4.5); ctx.lineTo(0, 6.5 + Math.sin(e.temps * 30)); ctx.lineTo(1.2, 4.5); ctx.closePath()
      ctx.fillStyle = '#f2b53a'; ctx.fill(); ctx.stroke()
      // Le point d'impact (petit, comme dans les jeux de tir).
      ctx.beginPath(); ctx.arc(0, 0, 0.9, 0, 2 * Math.PI); ctx.fillStyle = CERISE; ctx.fill()
      ctx.restore()
    }

    // Les éclats.
    for (const x of e.eclats) {
      const f = (e.temps - x.t) / 0.5
      ctx.globalAlpha = 1 - f
      ctx.beginPath(); ctx.arc(X(x.x), Y(x.y), (x.gros ? 4 + 8 * f : 1 + 3 * f) * k, 0, 2 * Math.PI)
      ctx.lineWidth = x.gros ? 3 : 1.5
      ctx.strokeStyle = x.gros ? CERISE : '#f2b53a'
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  /** Le vaisseau amiral : une grosse coque en losange, des tourelles, un cœur qui vire au rouge quand il enrage. */
  private amiral(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, rage: boolean, temps: number): void {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k * 2.4, k * 2.4)
    ctx.lineWidth = 1.6 / (k * 2.4)
    ctx.strokeStyle = ENCRE
    // Les ailes.
    ctx.beginPath()
    ctx.moveTo(-7, -2); ctx.lineTo(-10, 3); ctx.lineTo(-4, 2); ctx.lineTo(0, 6); ctx.lineTo(4, 2); ctx.lineTo(10, 3); ctx.lineTo(7, -2); ctx.lineTo(0, -5)
    ctx.closePath()
    ctx.fillStyle = '#6d4fa0'
    ctx.fill(); ctx.stroke()
    // La coque.
    ctx.beginPath()
    ctx.moveTo(0, -6); ctx.lineTo(4, -1); ctx.lineTo(0, 5); ctx.lineTo(-4, -1); ctx.closePath()
    ctx.fillStyle = VIOLET
    ctx.fill(); ctx.stroke()
    // Les tourelles.
    for (const tx of [-7, 7]) { ctx.beginPath(); ctx.arc(tx, 1.5, 1.2, 0, 2 * Math.PI); ctx.fillStyle = '#d7cdee'; ctx.fill(); ctx.stroke() }
    // Le cœur : vert, puis rouge qui palpite quand il enrage.
    ctx.beginPath(); ctx.arc(0, 0, 1.6 + (rage ? 0.4 * Math.sin(temps * 12) : 0), 0, 2 * Math.PI)
    ctx.fillStyle = rage ? CERISE : '#b9f08c'
    ctx.fill(); ctx.stroke()
    ctx.restore()
  }
}
