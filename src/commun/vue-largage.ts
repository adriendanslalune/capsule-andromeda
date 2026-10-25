// Le largage (fin de REMORQUER, Nettoyeurs ; idée validée par Adrien le 21/10/2026), en plein écran par-dessus la
// carte : vue du dessus, la station en haut, la capsule qui monte vers elle avec l'épave au bout du câble. On tient
// FREINER pour ralentir, on touche LÂCHER : l'épave file sur son élan, freinée par le faisceau d'arrimage, et doit
// s'arrêter dans la zone de dépôt (verte). La vue ne décide rien : elle montre l'état que tient le moteur
// (moteur/largage.ts).

import { DISTANCE_DEPART, ZONE_LOIN, ZONE_PROCHE } from '../donnees/largage'
import { avancerLargage, lacher, nouveauLargage, type EtatLargage } from '../moteur/largage'
import { dessinerCapsuleDuJoueur } from '../carte/vaisseaux'
import { dessinerDecorContrat } from '../carte/decor-contrat'
import { dessinerEpave, dessinerStation, POINTE_QUAI } from '../carte/objets-contrats'

/** Un largage : à quelle station, et ce qu'on fait quand l'épave est déposée (renvoie le texte du bilan). */
export interface OptionsLargage { titre: string; surFin: (rates: number) => string; /** Le nom de l'épave remorquée (sa sorte, son image). */ epave?: string }

const ENCRE = '#2b2138', CERISE = '#e04b37'
/** Longueur du câble (m) entre l'épave et la capsule. */
const CABLE = 10
const CONTOUR = [1, 0.82, 0.95, 0.7, 0.9, 1.05, 0.78, 0.92, 0.66, 0.97, 0.85, 0.74]

export class VueLargage {
  private etat: EtatLargage | null = null
  private options: OptionsLargage | null = null
  private frein = false
  private boucle = 0
  private avant = 0
  /** Où la capsule s'est arrêtée en lâchant (m), pour la dessiner pendant que l'épave file. */
  private capsuleArretee = 0
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elCommandes: HTMLElement
  private elFin: HTMLElement
  private elMessage: HTMLElement
  private finMessage = 0
  private commandesAffichees = ''

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-largage"></span><button type="button" data-abandonner>PLUS TARD</button></div>
      <div class="vue"><canvas></canvas><div class="message-remorquage" hidden></div></div>
      <div class="commandes-remorquage"></div>
      <div class="fin-combat" hidden></div>`
    this.toile = element.querySelector('canvas')!
    this.ctx = this.toile.getContext('2d')!
    this.elCommandes = element.querySelector('.commandes-remorquage')!
    this.elFin = element.querySelector('.fin-combat')!
    this.elMessage = element.querySelector('.message-remorquage')!
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      if (b.dataset.abandonner !== undefined || b.dataset.fermer !== undefined) this.fermer()
      else if (b.dataset.lacher !== undefined && this.etat && lacher(this.etat)) {
        this.capsuleArretee = this.etat.distance + CABLE
        this.frein = false
        navigator.vibrate?.(30)
      }
    })
    // Le frein agit tant qu'on le tient.
    this.elCommandes.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-frein]')
      if (!b) return
      e.preventDefault()
      b.setPointerCapture(e.pointerId)
      this.frein = true
      b.classList.add('tenu')
    })
    for (const fin of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.elCommandes.addEventListener(fin, (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-frein]')
        if (!b) return
        this.frein = false
        b.classList.remove('tenu')
      })
    }
    this.elCommandes.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  ouvrir(options: OptionsLargage): void {
    this.options = options
    this.etat = nouveauLargage((Date.now() % 2147483647) >>> 0)
    this.frein = false
    this.commandesAffichees = ''
    this.element.querySelector('.titre-largage')!.textContent = `LARGAGE · ${options.titre}`
    this.elFin.hidden = true
    this.element.hidden = false
    this.dire('L\'épave est au bout du câble. Freine, puis lâche-la : le faisceau de la station la ralentit. Elle doit s\'arrêter dans la zone verte.', 6000)
    cancelAnimationFrame(this.boucle)
    this.avant = performance.now()
    const image = (maintenant: number) => {
      if (this.element.hidden) return
      const dt = Math.min(0.1, (maintenant - this.avant) / 1000)
      this.avant = maintenant
      this.avancer(dt)
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

  private avancer(dt: number): void {
    const e = this.etat
    if (!e || e.phase === 'fini') return
    let reste = dt
    while (reste > 0) {
      const pas = Math.min(0.01, reste)
      reste -= pas
      const r = avancerLargage(e, pas, this.frein)
      if (r === 'court') { this.dire('Trop court ! Elle s\'est arrêtée avant la zone : le faisceau la relâche. On la reprend au câble…', 3000); navigator.vibrate?.(120) }
      if (r === 'long') { this.dire('Trop vite ! Elle a cogné la station. On la reprend au câble…', 3000); navigator.vibrate?.([120, 60, 120]) }
      if (r === 'trop-pres') { this.dire('Trop près ! La capsule recule. Lâche l\'épave avant la station.', 3000); navigator.vibrate?.(120) }
      if (r === 'deposee') { this.terminer(); break }
    }
    if (performance.now() > this.finMessage) this.elMessage.hidden = true
    // Les commandes (réécrites seulement quand elles changent), puis les cadrans de vitesse et de distance.
    const html = e.phase === 'approche'
      ? '<div class="largage"><button type="button" class="frein" data-frein>FREINER<small>tenir</small></button>'
        + '<div class="cadrans-largage"><div><small>VITESSE</small><b class="v"></b></div><div><small>STATION</small><b class="d"></b></div></div>'
        + '<button type="button" class="lacher" data-lacher>LÂCHER</button></div>'
      : '<div class="largage"><div class="cadrans-largage seul"><div><small>VITESSE DE L\'ÉPAVE</small><b class="v"></b></div><div><small>STATION</small><b class="d"></b></div></div></div>'
    if (html !== this.commandesAffichees) { this.elCommandes.innerHTML = this.commandesAffichees = html; this.frein = false }
    const nombre = (x: number, d: number) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
    this.elCommandes.querySelector('.v')!.textContent = `${nombre(e.vitesse, 1)} m/s`
    this.elCommandes.querySelector('.d')!.textContent = `${nombre(Math.max(0, e.distance), 0)} m`
  }

  private terminer(): void {
    const e = this.etat!
    navigator.vibrate?.([60, 40, 60])
    const suite = this.options!.surFin(e.rates)
    this.elFin.innerHTML = '<div class="carte-fin"><b>ÉPAVE LARGUÉE !</b>'
      + `<p>${e.rates ? `${e.rates} essai${e.rates > 1 ? 's' : ''} raté${e.rates > 1 ? 's' : ''} avant de la déposer.` : 'Déposée du premier coup : prime de 10 %.'}</p>`
      + `<p class="petit">${suite}</p><div class="boutons-fin"><button type="button" class="principal" data-fermer>FERMER</button></div></div>`
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
    // L'astre près duquel on travaille, en arc au pied de l'écran (Adrien, 25/10/2026).
    dessinerDecorContrat(ctx, l, h)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const cx = l / 2, quai = 125, k = (h - quai - 40) / (DISTANCE_DEPART + CABLE)
    const y = (m: number) => quai + m * k

    // La zone de dépôt, verte, et les graduations de distance.
    ctx.fillStyle = 'rgba(143,207,152,0.35)'
    ctx.fillRect(cx - 70, y(ZONE_PROCHE), 140, (ZONE_LOIN - ZONE_PROCHE) * k)
    ctx.setLineDash([4, 5])
    ctx.strokeStyle = 'rgba(63,138,79,0.8)'
    ctx.lineWidth = 1.4
    for (const m of [ZONE_PROCHE, ZONE_LOIN]) { ctx.beginPath(); ctx.moveTo(cx - 70, y(m)); ctx.lineTo(cx + 70, y(m)); ctx.stroke() }
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(43,33,56,0.55)'
    ctx.font = '10px ui-monospace, Menlo, monospace'
    ctx.textAlign = 'right'
    for (let m = 10; m <= DISTANCE_DEPART; m += 10) {
      ctx.fillRect(l - 22, y(m), 10, 1)
      ctx.fillText(`${m} m`, l - 26, y(m) + 3)
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = '#3f8a4f'
    ctx.fillText('ZONE DE DÉPÔT', cx + 74, y((ZONE_PROCHE + ZONE_LOIN) / 2) + 3)

    // La station : un quai, ses projecteurs ; le faisceau d'arrimage quand l'épave est lâchée.
    if (e.phase !== 'approche') {
      const g = ctx.createLinearGradient(0, quai, 0, y(e.distance))
      g.addColorStop(0, 'rgba(242,181,58,0.45)')
      g.addColorStop(1, 'rgba(242,181,58,0.05)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(cx - 26, quai); ctx.lineTo(cx + 26, quai); ctx.lineTo(cx + 40, y(e.distance)); ctx.lineTo(cx - 40, y(e.distance)); ctx.closePath()
      ctx.fill()
    }
    // Le quai dessiné par ChatGPT (Adrien, 25/10/2026), sinon l'ancien dessin.
    if (!dessinerStation(ctx, 'quai', cx, quai, Math.min(l - 24, 340), POINTE_QUAI)) {
      ctx.lineWidth = 2.2
      ctx.strokeStyle = ENCRE
      ctx.fillStyle = '#c9c2b0'
      ctx.fillRect(cx - 120, quai - 56, 240, 44); ctx.strokeRect(cx - 120, quai - 56, 240, 44)
      ctx.fillStyle = '#8fd0dc'
      for (const s of [-1, 1]) { ctx.fillRect(cx + s * 135 - 30, quai - 50, 60, 30); ctx.strokeRect(cx + s * 135 - 30, quai - 50, 60, 30) }
      ctx.fillStyle = '#a69f86'
      ctx.fillRect(cx - 32, quai - 12, 64, 12); ctx.strokeRect(cx - 32, quai - 12, 64, 12)
      ctx.fillStyle = '#f2b53a'
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 22, quai - 6, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke() }
    }
    ctx.lineWidth = 2.2
    ctx.strokeStyle = ENCRE

    // L'épave, la capsule, et le câble entre les deux pendant l'approche.
    const ye = y(Math.max(0, e.distance)), yc = y(e.phase === 'approche' ? e.distance + CABLE : this.capsuleArretee)
    if (e.phase === 'approche') {
      ctx.lineWidth = 1.6
      ctx.beginPath(); ctx.moveTo(cx, ye + 22); ctx.lineTo(cx, yc - 22); ctx.stroke()
    }
    ctx.save()
    ctx.translate(cx, ye)
    // L'épave dessinée par ChatGPT (Adrien, 25/10/2026), sinon l'ancien dessin ; le point d'accroche cerise par-dessus.
    if (!dessinerEpave(ctx, this.options?.epave ?? '', 0, 0, 0, 58)) {
      ctx.beginPath()
      CONTOUR.forEach((r, i) => {
        const a = (i * Math.PI) / 6, x = 16 * r * Math.sin(a), yy = 16 * r * Math.cos(a)
        if (i === 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      })
      ctx.closePath()
      ctx.fillStyle = '#c9c2b0'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.lineWidth = 2
    ctx.fillStyle = CERISE
    ctx.beginPath(); ctx.arc(0, 22, 3.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    ctx.restore()
    ctx.save()
    ctx.translate(cx, yc)
    ctx.lineWidth = 2
    // Dans sa forme et sa Maison (Adrien, 25/10/2026), sinon l'ancien dessin.
    if (!dessinerCapsuleDuJoueur(ctx, 0, -6, 0, 46)) {
      ctx.beginPath()
      ctx.moveTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(18, 4); ctx.quadraticCurveTo(0, 10, -18, 4); ctx.closePath()
      ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.stroke()
    }
    // La flamme du frein (vers l'avant : rétrofusée).
    if (this.frein && e.phase === 'approche') {
      ctx.fillStyle = '#f2b53a'
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -16); ctx.lineTo(s * 13, -34); ctx.lineTo(s * 16, -16); ctx.closePath(); ctx.fill(); ctx.stroke() }
    }
    ctx.restore()
  }
}
