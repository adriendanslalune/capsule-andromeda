// La formation du convoi (début d'ESCORTER, Mercenaires ; idée validée par Adrien le 21/10/2026), en plein écran
// par-dessus la carte : vue du dessus, la capsule en haut, le hangar de la station en bas. Les trois cargos en sortent
// un par un et dérivent ; on les attrape du doigt et on les lâche sur les places en pointillé, en flèche derrière la
// capsule. La vue ne décide rien : elle montre l'état que tient le moteur (moteur/convoi.ts).

import { CAPSULE, COULEURS_CARGOS, HANGAR, HAUTEUR, LARGEUR, PLACES } from '../donnees/convoi'
import { avancerConvoi, deplacer, lacherCargo, nouveauConvoi, prendre, type EtatConvoi } from '../moteur/convoi'
import { dessinerCapsuleDuJoueur } from '../carte/vaisseaux'
import { dessinerDecorContrat } from '../carte/decor-contrat'
import { dessinerStation } from '../carte/objets-contrats'

/** Un convoi : à quelle station, et ce qu'on fait quand il est formé (renvoie le texte du bilan). */
export interface OptionsConvoi { titre: string; surFin: (egares: number) => string }

const ENCRE = '#2b2138'

export class VueConvoi {
  private etat: EtatConvoi | null = null
  private options: OptionsConvoi | null = null
  private tenu: number | null = null
  private boucle = 0
  private avant = 0
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elFin: HTMLElement
  private elMessage: HTMLElement
  private elCompte: HTMLElement
  private finMessage = 0

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-convoi"></span><button type="button" data-abandonner>PLUS TARD</button></div>
      <div class="vue"><canvas></canvas><div class="message-remorquage" hidden></div></div>
      <div class="commandes-remorquage"><div class="compte-convoi"></div></div>
      <div class="fin-combat" hidden></div>`
    this.toile = element.querySelector('canvas')!
    this.ctx = this.toile.getContext('2d')!
    this.elFin = element.querySelector('.fin-combat')!
    this.elMessage = element.querySelector('.message-remorquage')!
    this.elCompte = element.querySelector('.compte-convoi')!
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (b && (b.dataset.abandonner !== undefined || b.dataset.fermer !== undefined)) this.fermer()
    })
    // Attraper un cargo, le faire glisser, le lâcher sur une place.
    this.toile.addEventListener('pointerdown', (e) => {
      if (!this.etat || this.etat.forme) return
      const p = this.terrain(e)
      this.tenu = prendre(this.etat, p.x, p.y)
      if (this.tenu === null) return
      this.toile.setPointerCapture(e.pointerId)
      navigator.vibrate?.(15)
    })
    this.toile.addEventListener('pointermove', (e) => {
      if (this.etat && this.tenu !== null) { const p = this.terrain(e); deplacer(this.etat, this.tenu, p.x, p.y) }
    })
    for (const fin of ['pointerup', 'pointercancel']) {
      this.toile.addEventListener(fin, () => {
        if (!this.etat || this.tenu === null) return
        const r = lacherCargo(this.etat, this.tenu)
        this.tenu = null
        if (r === 'place') navigator.vibrate?.([30, 20, 30])
        if (r === 'mauvaise') { this.dire('Pas sa place ! Chaque cargo va à la place de sa couleur.', 2500); navigator.vibrate?.(120) }
        if (this.etat.forme) this.terminer()
      })
    }
  }

  /** Le point du terrain (100 × 160 unités) sous le doigt. */
  private terrain(e: PointerEvent): { x: number; y: number } {
    const r = this.toile.getBoundingClientRect(), { k, ox, oy } = this.echelle()
    return { x: (e.clientX - r.left - ox) / k, y: (e.clientY - r.top - oy) / k }
  }

  private echelle(): { k: number; ox: number; oy: number } {
    const l = this.toile.clientWidth, h = this.toile.clientHeight
    const k = Math.min(l / LARGEUR, h / HAUTEUR)
    return { k, ox: (l - LARGEUR * k) / 2, oy: (h - HAUTEUR * k) / 2 }
  }

  ouvrir(options: OptionsConvoi): void {
    this.options = options
    this.etat = nouveauConvoi((Date.now() % 2147483647) >>> 0)
    this.tenu = null
    this.element.querySelector('.titre-convoi')!.textContent = `CONVOI · ${options.titre}`
    this.elFin.hidden = true
    this.element.hidden = false
    this.dire('Les cargos sortent du hangar. Attrape-les du doigt et place chacun à la place de sa couleur, avant qu\'ils ne s\'égarent.', 6000)
    cancelAnimationFrame(this.boucle)
    this.avant = performance.now()
    const image = (maintenant: number) => {
      if (this.element.hidden) return
      const dt = Math.min(0.1, (maintenant - this.avant) / 1000)
      this.avant = maintenant
      if (this.etat && !this.etat.forme && avancerConvoi(this.etat, dt) === 'egare') {
        this.dire('Un cargo s\'est égaré : il retourne au hangar et ressort.', 2500)
        navigator.vibrate?.(80)
      }
      if (performance.now() > this.finMessage) this.elMessage.hidden = true
      const places = this.etat?.cargos.filter((c) => c.etat === 'place').length ?? 0
      this.elCompte.textContent = `EN FORMATION : ${places} / 3`
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

  private dire(texte: string, duree = 4000): void {
    this.elMessage.textContent = texte
    this.elMessage.hidden = false
    this.finMessage = performance.now() + duree
  }

  private terminer(): void {
    const e = this.etat!
    navigator.vibrate?.([60, 40, 60])
    const suite = this.options!.surFin(e.egares)
    this.elFin.innerHTML = '<div class="carte-fin"><b>CONVOI FORMÉ !</b>'
      + `<p>${e.egares || e.erreurs ? [e.egares ? `${e.egares} cargo${e.egares > 1 ? 's' : ''} égaré${e.egares > 1 ? 's' : ''}` : '', e.erreurs ? `${e.erreurs} erreur${e.erreurs > 1 ? 's' : ''} de place` : ''].filter(Boolean).join(', ') + '.' : 'Formation parfaite : aucun cargo égaré, aucune erreur.'}</p>`
      + `<p class="petit">${suite}</p><div class="boutons-fin"><button type="button" class="principal" data-fermer>EN ROUTE !</button></div></div>`
    this.elFin.hidden = false
  }

  /** Un cargo vu du dessus (nez vers le haut), à l'échelle k. */
  private cargo(x: number, y: number, k: number, teinte: string, fantome: boolean): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k, k)
    ctx.lineWidth = 1.8 / k
    ctx.strokeStyle = ENCRE
    if (fantome) { ctx.setLineDash([2, 2]); ctx.globalAlpha = 0.5 }
    ctx.beginPath()
    ctx.moveTo(0, -9); ctx.lineTo(5, -5); ctx.lineTo(5, 8); ctx.lineTo(-5, 8); ctx.lineTo(-5, -5); ctx.closePath()
    if (!fantome) { ctx.fillStyle = teinte; ctx.fill() }
    ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(-5, 4); ctx.lineTo(5, 4); ctx.stroke()
    ctx.restore()
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
    // L'astre près duquel on travaille, en arc au pied de l'écran (Adrien, 25/10/2026).
    dessinerDecorContrat(ctx, l, h)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const { k, ox, oy } = this.echelle()
    const X = (x: number) => ox + x * k, Y = (y: number) => oy + y * k

    // Le hangar de la station, en bas : dessiné par ChatGPT (Adrien, 25/10/2026), le milieu de sa baie là d'où sortent
    // les cargos ; sinon l'ancien dessin.
    if (!dessinerStation(ctx, 'hangar', X(HANGAR.x), Y(HANGAR.y + 2), 84 * k, 0.55)) {
      ctx.lineWidth = 2
      ctx.strokeStyle = ENCRE
      ctx.fillStyle = '#c9c2b0'
      ctx.fillRect(X(HANGAR.x - 30), Y(HANGAR.y - 2), 60 * k, 14 * k); ctx.strokeRect(X(HANGAR.x - 30), Y(HANGAR.y - 2), 60 * k, 14 * k)
      ctx.fillStyle = '#2b2138'
      ctx.fillRect(X(HANGAR.x - 9), Y(HANGAR.y - 2), 18 * k, 5 * k)
    }

    // Les places de la formation (en flèche), et les traits qui les relient à la capsule.
    ctx.setLineDash([3, 5])
    ctx.lineWidth = 1.2
    ctx.strokeStyle = 'rgba(43,33,56,0.35)'
    for (const p of PLACES) { ctx.beginPath(); ctx.moveTo(X(CAPSULE.x), Y(CAPSULE.y)); ctx.lineTo(X(p.x), Y(p.y)); ctx.stroke() }
    ctx.setLineDash([])
    PLACES.forEach((p, i) => {
      if (e.cargos.some((c) => c.place === i)) return
      // La place, de la couleur de son cargo.
      ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 13 * k, 0, 2 * Math.PI)
      ctx.globalAlpha = 0.3; ctx.fillStyle = COULEURS_CARGOS[i]; ctx.fill(); ctx.globalAlpha = 1
      ctx.lineWidth = 2.5; ctx.strokeStyle = COULEURS_CARGOS[i]; ctx.stroke()
      this.cargo(X(p.x), Y(p.y), k * 1.1, '', true)
    })

    // La capsule, nez vers le haut, dans sa forme et sa Maison (Adrien, 25/10/2026) ; sinon l'ancien dessin.
    if (!dessinerCapsuleDuJoueur(ctx, X(CAPSULE.x), Y(CAPSULE.y), 0, 16 * k)) {
    ctx.save()
    ctx.translate(X(CAPSULE.x), Y(CAPSULE.y))
    ctx.scale(k / 2.2, k / 2.2)
    ctx.lineWidth = 2
    ctx.strokeStyle = ENCRE
    ctx.beginPath()
    ctx.moveTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(18, 4); ctx.quadraticCurveTo(0, 10, -18, 4); ctx.closePath()
    ctx.fillStyle = '#e04b37'; ctx.fill(); ctx.stroke()
    ctx.restore()
    }

    // Les cargos (le cargo tenu un peu plus gros, soulevé).
    e.cargos.forEach((c, i) => {
      if (c.etat === 'hangar') return
      const tenu = c.etat === 'tenu'
      if (tenu) { ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), 15 * k, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(242,181,58,0.3)'; ctx.fill() }
      this.cargo(X(c.x), Y(c.y), k * (tenu ? 1.3 : 1.1), COULEURS_CARGOS[i], false)
    })
  }
}
