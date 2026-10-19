// L'amarrage (AMARRER, la livraison des Ingénieurs ; décision d'Adrien du 18/10/2026), en plein écran par-dessus la
// carte : vue du dessus, le port de la station en haut, la capsule qui approche. On la pilote au pouce : propulseurs
// d'approche et de côté à droite, rotation à gauche (on les tient enfoncés). Les cadrans disent si le contact serait
// bon (vitesse, centrage, alignement). La vue ne décide rien : elle montre l'état que tient le moteur
// (moteur/amarrage.ts).

import { ANGLE_CONTACT, ECART_CONTACT, VITESSE_CONTACT } from '../donnees/amarrage'
import { avancerAmarrage, contactBon, nouvelAmarrage, type EtatAmarrage, type Poussees } from '../moteur/amarrage'

/** Un amarrage : où, et ce qu'on fait quand la capsule est amarrée (renvoie le texte du bilan). */
export interface OptionsAmarrage { titre: string; surFin: (rebonds: number) => string }

const ENCRE = '#2b2138', CERISE = '#e04b37'
const nombre = (x: number, n = 1) => x.toLocaleString('fr-FR', { minimumFractionDigits: n, maximumFractionDigits: n })

export class VueAmarrage {
  private etat: EtatAmarrage | null = null
  private options: OptionsAmarrage | null = null
  private poussees: Poussees = { avant: 0, cote: 0, tourner: 0 }
  private boucle = 0
  private avant = 0
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elCadrans: HTMLElement
  private elFin: HTMLElement
  private elMessage: HTMLElement
  /** Échelle affichée (pixels par mètre), qui suit la distance en douceur. */
  private k = 25
  private finMessage = 0

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-amarrage"></span><button type="button" data-abandonner>PLUS TARD</button></div>
      <div class="vue"><canvas></canvas><div class="message-amarrage" hidden></div></div>
      <div class="cadrans"></div>
      <div class="commandes-amarrage">
        <div class="rotation">
          <button type="button" data-tourner="-1" aria-label="Tourner à gauche">⟲</button>
          <button type="button" data-tourner="1" aria-label="Tourner à droite">⟳</button>
        </div>
        <div class="croix">
          <button type="button" data-avant="1" class="haut" aria-label="Avancer">▲</button>
          <button type="button" data-cote="-1" class="gauche" aria-label="À gauche">◀</button>
          <button type="button" data-cote="1" class="droite" aria-label="À droite">▶</button>
          <button type="button" data-avant="-1" class="bas" aria-label="Reculer">▼</button>
        </div>
      </div>
      <div class="fin-combat" hidden></div>`
    this.toile = element.querySelector('canvas')!
    this.ctx = this.toile.getContext('2d')!
    this.elCadrans = element.querySelector('.cadrans')!
    this.elFin = element.querySelector('.fin-combat')!
    this.elMessage = element.querySelector('.message-amarrage')!
    // Les propulseurs poussent tant qu'on tient le bouton (plusieurs doigts à la fois).
    const commandes = element.querySelector<HTMLElement>('.commandes-amarrage')!
    const tenir = (b: HTMLElement, oui: boolean) => {
      if (b.dataset.avant) this.poussees.avant = oui ? (Number(b.dataset.avant) as -1 | 1) : 0
      if (b.dataset.cote) this.poussees.cote = oui ? (Number(b.dataset.cote) as -1 | 1) : 0
      if (b.dataset.tourner) this.poussees.tourner = oui ? (Number(b.dataset.tourner) as -1 | 1) : 0
      b.classList.toggle('tenu', oui)
    }
    commandes.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      e.preventDefault()
      b.setPointerCapture(e.pointerId)
      tenir(b, true)
    })
    for (const fin of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      commandes.addEventListener(fin, (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('button')
        if (b) tenir(b, false)
      })
    }
    commandes.addEventListener('contextmenu', (e) => e.preventDefault())
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!b) return
      if (b.dataset.abandonner !== undefined || b.dataset.fermer !== undefined) this.fermer()
    })
  }

  ouvrir(options: OptionsAmarrage): void {
    this.options = options
    const t = Date.now()
    this.etat = nouvelAmarrage((t % 2147483647) >>> 0)
    this.poussees = { avant: 0, cote: 0, tourner: 0 }
    this.k = 25
    this.element.querySelector('.titre-amarrage')!.textContent = `AMARRAGE · ${options.titre}`
    this.elFin.hidden = true
    this.element.hidden = false
    this.dire('Centre-toi sur le port, aligne-toi, puis approche tout doucement.')
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

  private dire(texte: string): void {
    this.elMessage.textContent = texte
    this.elMessage.hidden = false
    this.finMessage = performance.now() + 3500
  }

  private avancer(dt: number): void {
    const e = this.etat
    if (!e || e.amarre) return
    // Pas de 1/100 s : la physique reste la même quelle que soit la cadence d'images.
    let reste = dt
    while (reste > 0) {
      const pas = Math.min(0.01, reste)
      reste -= pas
      const r = avancerAmarrage(e, this.poussees, pas)
      if (r === 'rebond') {
        const c = contactBon(e)
        this.dire(!c.vitesse ? 'Trop vite ! La capsule rebondit.' : !c.aligne ? 'De travers ! La capsule rebondit.' : 'Décentrée ! La capsule rebondit.')
        navigator.vibrate?.(150)
      }
      if (r === 'amarre') { this.terminer(); break }
    }
    if (performance.now() > this.finMessage) this.elMessage.hidden = true
  }

  private terminer(): void {
    const e = this.etat!
    navigator.vibrate?.([60, 40, 60])
    const suite = this.options!.surFin(e.rebonds)
    this.elFin.innerHTML = `<div class="carte-fin"><b>AMARRÉE !</b>`
      + `<p>${e.rebonds ? `${e.rebonds} rebond${e.rebonds > 1 ? 's' : ''} avant l'amarrage.` : 'Du premier coup, sans un rebond : prime de 10 %.'}</p>`
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
    // L'échelle suit la distance : de loin on voit toute l'approche, de près on voit le moindre écart.
    const voulue = Math.max(16, Math.min(90, (h - 140) / (Math.max(0, e.distance) + 9)))
    this.k += (voulue - this.k) * 0.08
    const k = this.k, cx = l / 2
    // Le port assez bas pour que la station reste visible (de près, elle déborde en haut : c'est voulu).
    const portY = Math.min(h * 0.4, 4.9 * k + 14)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // L'axe d'approche (pointillé) et la tolérance de centrage.
    ctx.setLineDash([4, 6])
    ctx.strokeStyle = 'rgba(43,33,56,0.35)'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(cx, portY); ctx.lineTo(cx, h); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(143,207,152,0.18)'
    ctx.fillRect(cx - ECART_CONTACT * k, portY, 2 * ECART_CONTACT * k, h - portY)

    // La station : un grand module, ses panneaux, et le port d'amarrage (anneau) au milieu.
    ctx.lineWidth = 2
    ctx.strokeStyle = ENCRE
    const module = (x: number, y: number, w: number, hh: number, couleur: string) => { ctx.fillStyle = couleur; ctx.fillRect(x, y, w, hh); ctx.strokeRect(x, y, w, hh) }
    module(cx - 4.5 * k, portY - 4.6 * k, 9 * k, 3.6 * k, '#d9d1bd')
    module(cx - 16 * k, portY - 3.8 * k, 10.5 * k, 2 * k, '#8fd0dc')
    module(cx + 5.5 * k, portY - 3.8 * k, 10.5 * k, 2 * k, '#8fd0dc')
    ctx.lineWidth = 1
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 16 * k + i * 1.75 * k, portY - 3.8 * k); ctx.lineTo(cx - 16 * k + i * 1.75 * k, portY - 1.8 * k); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 5.5 * k + i * 1.75 * k, portY - 3.8 * k); ctx.lineTo(cx + 5.5 * k + i * 1.75 * k, portY - 1.8 * k); ctx.stroke()
    }
    ctx.lineWidth = 2
    module(cx - 0.9 * k, portY - 1.1 * k, 1.8 * k, 1.1 * k, '#f2c66a')
    // L'anneau du port : vert quand le contact serait bon.
    const c = contactBon(e)
    const bon = c.vitesse && c.centre && c.aligne && c.glisse
    ctx.fillStyle = bon ? '#8fcf98' : '#f3a08b'
    ctx.fillRect(cx - 0.6 * k, portY - 0.25 * k, 1.2 * k, 0.25 * k)
    ctx.strokeRect(cx - 0.6 * k, portY - 0.25 * k, 1.2 * k, 0.25 * k)

    // La capsule (son nez au point de contact), tournée de son angle.
    const x = cx + e.ecart * k, y = portY + Math.max(0, e.distance) * k
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((e.angle * Math.PI) / 180)
    // Flammes des propulseurs tenus.
    const flamme = (fx: number, fy: number, dx: number, dy: number) => {
      ctx.beginPath()
      ctx.moveTo(fx - dy * 0.15 * k, fy + dx * 0.15 * k)
      ctx.lineTo(fx + dx * 0.7 * k, fy + dy * 0.7 * k)
      ctx.lineTo(fx + dy * 0.15 * k, fy - dx * 0.15 * k)
      ctx.closePath()
      ctx.fillStyle = '#f2b53a'
      ctx.fill()
      ctx.lineWidth = 1
      ctx.stroke()
    }
    const p = this.poussees
    if (p.avant === 1) { flamme(-0.25 * k, 3.9 * k, 0, 1); flamme(0.25 * k, 3.9 * k, 0, 1) }
    if (p.avant === -1) { flamme(-0.75 * k, 0.9 * k, 0, -1); flamme(0.75 * k, 0.9 * k, 0, -1) }
    if (p.cote === 1) flamme(-1 * k, 2.6 * k, -1, 0)
    if (p.cote === -1) flamme(1 * k, 2.6 * k, 1, 0)
    if (p.tourner === 1) { flamme(-1 * k, 1.9 * k, -1, 0); flamme(1 * k, 3.3 * k, 1, 0) }
    if (p.tourner === -1) { flamme(1 * k, 1.9 * k, 1, 0); flamme(-1 * k, 3.3 * k, -1, 0) }
    // Le vaisseau : panneaux solaires de part et d'autre, module de service, tuyère, capsule conique, et la sonde
    // d'amarrage rouge au nez.
    ctx.lineWidth = 2
    ctx.strokeStyle = ENCRE
    const rect = (x0: number, y0: number, w: number, hh: number, couleur: string) => { ctx.fillStyle = couleur; ctx.fillRect(x0 * k, y0 * k, w * k, hh * k); ctx.strokeRect(x0 * k, y0 * k, w * k, hh * k) }
    for (const sens of [-1, 1]) {
      const x0 = sens < 0 ? -3.4 : 1.25
      ctx.beginPath(); ctx.moveTo(sens * 0.95 * k, 2.55 * k); ctx.lineTo(sens * 1.25 * k, 2.55 * k); ctx.stroke()
      rect(x0, 2.2, 2.15, 0.7, '#8fd0dc')
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo((x0 + i * 0.54) * k, 2.2 * k); ctx.lineTo((x0 + i * 0.54) * k, 2.9 * k); ctx.stroke() }
      ctx.lineWidth = 2
    }
    ctx.beginPath()
    ctx.moveTo(-0.35 * k, 3.4 * k); ctx.lineTo(0.35 * k, 3.4 * k); ctx.lineTo(0.55 * k, 3.95 * k); ctx.lineTo(-0.55 * k, 3.95 * k); ctx.closePath()
    ctx.fillStyle = '#a69f86'; ctx.fill(); ctx.stroke()
    rect(-0.95, 1.85, 1.9, 1.55, '#c9c2b0')
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(-0.95 * k, 2.35 * k); ctx.lineTo(0.95 * k, 2.35 * k); ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-0.3 * k, 0.35 * k); ctx.lineTo(0.3 * k, 0.35 * k); ctx.lineTo(1.05 * k, 1.75 * k)
    ctx.quadraticCurveTo(0, 2.05 * k, -1.05 * k, 1.75 * k); ctx.closePath()
    ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 1.15 * k, 0.2 * k, 0, 2 * Math.PI); ctx.fillStyle = '#bfe0e8'; ctx.fill(); ctx.stroke()
    rect(-0.1, 0, 0.2, 0.35, CERISE)
    ctx.restore()

    // Les cadrans : distance, vitesse d'approche, centrage, alignement (verts quand c'est bon).
    const cadran = (titre: string, valeur: string, ok: boolean | null) => `<span class="${ok === null ? '' : ok ? 'ok' : 'pas-ok'}"><small>${titre}</small><b>${valeur}</b></span>`
    const html = cadran('DISTANCE', `${nombre(Math.max(0, e.distance))} m`, null)
      + cadran('VITESSE', `${nombre(e.approche, 2)} m/s`, e.approche <= VITESSE_CONTACT)
      + cadran('ÉCART', `${nombre(e.ecart, 2)} m`, c.centre && c.glisse)
      + cadran('ANGLE', `${nombre(e.angle)}°`, Math.abs(e.angle) <= ANGLE_CONTACT)
    if (html !== this.elCadrans.dataset.html) { this.elCadrans.innerHTML = html; this.elCadrans.dataset.html = html }
  }
}
