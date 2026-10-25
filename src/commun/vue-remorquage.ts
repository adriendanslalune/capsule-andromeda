// Le remorquage (REMORQUER, la mission des Nettoyeurs ; décision d'Adrien du 18/10/2026), en plein écran par-dessus
// la carte : l'épave tourne sur elle-même en haut, la capsule attend en bas. On lance le grappin quand l'anneau
// d'accroche va passer face à la capsule (le grappin met un moment à arriver : il faut anticiper) ; accrochée, on
// freine la rotation de l'épave avec les propulseurs jusqu'à l'arrêt. La vue ne décide rien : elle montre l'état que
// tient le moteur (moteur/remorquage.ts).

import { SEUIL, TOLERANCE } from '../donnees/remorquage'
import { avancerRemorquage, lancer, nouveauRemorquage, type EtatRemorquage } from '../moteur/remorquage'
import { dessinerCapsuleDuJoueur } from '../carte/vaisseaux'

/** Un remorquage : quelle épave, et ce qu'on fait quand elle est en remorque (renvoie le texte du bilan). */
export interface OptionsRemorquage { titre: string; surFin: (rates: number) => string }

const ENCRE = '#2b2138', CERISE = '#e04b37'
/** La silhouette de l'épave (rayons relatifs, un tous les 30°) : une carcasse cabossée. */
const CONTOUR = [1, 0.82, 0.95, 0.7, 0.9, 1.05, 0.78, 0.92, 0.66, 0.97, 0.85, 0.74]

export class VueRemorquage {
  private etat: EtatRemorquage | null = null
  private options: OptionsRemorquage | null = null
  private poussee: -1 | 0 | 1 = 0
  private boucle = 0
  private avant = 0
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elCommandes: HTMLElement
  private elFin: HTMLElement
  private elMessage: HTMLElement
  private finMessage = 0
  private commandesAffichees = ''

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-remorquage"></span><button type="button" data-abandonner>PLUS TARD</button></div>
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
      else if (b.dataset.lancer !== undefined && this.etat && lancer(this.etat)) navigator.vibrate?.(30)
    })
    // Les propulseurs de rotation poussent tant qu'on les tient.
    this.elCommandes.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tourner]')
      if (!b) return
      e.preventDefault()
      b.setPointerCapture(e.pointerId)
      this.poussee = Number(b.dataset.tourner) as -1 | 1
      b.classList.add('tenu')
    })
    for (const fin of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.elCommandes.addEventListener(fin, (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tourner]')
        if (!b) return
        this.poussee = 0
        b.classList.remove('tenu')
      })
    }
    this.elCommandes.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  ouvrir(options: OptionsRemorquage): void {
    this.options = options
    this.etat = nouveauRemorquage((Date.now() % 2147483647) >>> 0)
    this.poussee = 0
    this.commandesAffichees = ''
    this.element.querySelector('.titre-remorquage')!.textContent = `REMORQUAGE · ${options.titre}`
    this.elFin.hidden = true
    this.element.hidden = false
    this.dire('L\'épave tourne. Lance le grappin quand l\'anneau rouge va passer face à toi : il met un moment à arriver.')
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
      const r = avancerRemorquage(e, pas, this.poussee)
      if (r === 'rate') { this.dire('Raté ! Le grappin a ricoché sur la coque. On enroule le câble…', 2500); navigator.vibrate?.(120) }
      if (r === 'accroche') { this.dire('Accrochée ! Freine sa rotation : tiens le propulseur qui tourne dans l\'autre sens. Attention, elle est déséquilibrée : elle repart toute seule.', 6000); navigator.vibrate?.([40, 30, 40]) }
      if (r === 'stabilisee') { this.terminer(); break }
    }
    if (performance.now() > this.finMessage) this.elMessage.hidden = true
    // Les commandes de la phase (réécrites seulement quand elles changent).
    const pret = e.grappin === null && e.recharge === 0
    const html = e.phase === 'viser'
      ? `<button type="button" class="lancer" data-lancer${pret ? '' : ' disabled'}>${e.grappin !== null ? 'GRAPPIN EN VOL…' : e.recharge > 0 ? 'ENROULEMENT DU CÂBLE…' : 'LANCER LE GRAPPIN'}</button>`
      : '<div class="stabiliser"><button type="button" data-tourner="1" aria-label="Pousser dans le sens inverse des aiguilles">⟲</button>'
        + '<div class="jauge-rotation"><small>ROTATION</small><b></b></div>'
        + '<button type="button" data-tourner="-1" aria-label="Pousser dans le sens des aiguilles">⟳</button></div>'
    if (html !== this.commandesAffichees) { this.elCommandes.innerHTML = this.commandesAffichees = html; this.poussee = 0 }
    const jauge = this.elCommandes.querySelector<HTMLElement>('.jauge-rotation')
    if (jauge) {
      jauge.querySelector('b')!.textContent = `${Math.abs(e.rotation).toFixed(0)}°/s`
      jauge.classList.toggle('ok', Math.abs(e.rotation) < SEUIL)
    }
  }

  private terminer(): void {
    const e = this.etat!
    navigator.vibrate?.([60, 40, 60])
    const suite = this.options!.surFin(e.rates)
    this.elFin.innerHTML = '<div class="carte-fin"><b>ÉPAVE EN REMORQUE !</b>'
      + `<p>${e.rates ? `${e.rates} grappin${e.rates > 1 ? 's' : ''} raté${e.rates > 1 ? 's' : ''} avant de l'accrocher.` : 'Harponnée du premier coup : prime de 10 %.'}</p>`
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
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const cx = l / 2, ey = Math.max(h * 0.36, 150), R = Math.min(l * 0.2, 80)
    const capY = h - 45
    const theta = (e.angle * Math.PI) / 180
    // L'anneau d'accroche : 0° en bas (face à la capsule) ; il tourne avec l'épave.
    const anneau = { x: cx + 1.05 * R * Math.sin(theta), y: ey + 1.05 * R * Math.cos(theta) }

    // La zone où l'anneau doit être quand le grappin arrive (un secteur vert sous l'épave).
    if (e.phase === 'viser') {
      const a0 = Math.PI / 2 - (TOLERANCE * Math.PI) / 180, a1 = Math.PI / 2 + (TOLERANCE * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(cx, ey)
      ctx.arc(cx, ey, R * 1.45, a0, a1)
      ctx.closePath()
      ctx.fillStyle = 'rgba(143,207,152,0.3)'
      ctx.fill()
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(43,33,56,0.35)'
      ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(cx, ey + R * 1.1); ctx.lineTo(cx, capY - 40); ctx.stroke()
      ctx.setLineDash([])
    }

    // L'épave : une carcasse cabossée, des tôles, une antenne arrachée ; elle tourne.
    ctx.save()
    ctx.translate(cx, ey)
    ctx.rotate(-theta)
    ctx.beginPath()
    CONTOUR.forEach((r, k) => {
      const a = (k * Math.PI) / 6
      const x = R * r * Math.sin(a), y = R * r * Math.cos(a)
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = '#c9c2b0'
    ctx.fill()
    ctx.lineWidth = 2.2
    ctx.strokeStyle = ENCRE
    ctx.stroke()
    ctx.lineWidth = 1.2
    ctx.fillStyle = '#a69f86'
    ctx.fillRect(-R * 0.45, -R * 0.35, R * 0.55, R * 0.4)
    ctx.strokeRect(-R * 0.45, -R * 0.35, R * 0.55, R * 0.4)
    ctx.fillStyle = '#8fd0dc'
    ctx.fillRect(R * 0.15, R * 0.05, R * 0.45, R * 0.25)
    ctx.strokeRect(R * 0.15, R * 0.05, R * 0.45, R * 0.25)
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(R * (0.15 + 0.11 * k), R * 0.05); ctx.lineTo(R * (0.15 + 0.11 * k), R * 0.3); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.7); ctx.lineTo(-R * 0.55, -R * 1.25); ctx.moveTo(-R * 0.55, -R * 1.25); ctx.lineTo(-R * 0.75, -R * 1.15); ctx.stroke()
    ctx.restore()
    // L'anneau rouge.
    ctx.beginPath()
    ctx.arc(anneau.x, anneau.y, 9, 0, 2 * Math.PI)
    ctx.fillStyle = CERISE
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = ENCRE
    ctx.stroke()
    ctx.beginPath(); ctx.arc(anneau.x, anneau.y, 3, 0, 2 * Math.PI); ctx.fillStyle = '#faf2dc'; ctx.fill()

    // Le câble et le grappin.
    const bec = { x: cx, y: capY - 34 }
    let pointe: { x: number; y: number } | null = null
    if (e.phase !== 'viser') pointe = anneau
    else if (e.grappin !== null) pointe = { x: cx, y: bec.y + (ey + R * 0.95 - bec.y) * e.grappin }
    if (pointe) {
      ctx.beginPath(); ctx.moveTo(bec.x, bec.y); ctx.lineTo(pointe.x, pointe.y)
      ctx.lineWidth = 1.6; ctx.strokeStyle = ENCRE; ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pointe.x, pointe.y - 7); ctx.lineTo(pointe.x - 6, pointe.y + 4); ctx.lineTo(pointe.x + 6, pointe.y + 4); ctx.closePath()
      ctx.fillStyle = '#f2b53a'; ctx.fill(); ctx.stroke()
    }

    // La capsule, le nez (et le lance-grappin) vers l'épave : dans sa forme et sa Maison (Adrien, 25/10/2026).
    if (dessinerCapsuleDuJoueur(ctx, cx, capY, 0, 84)) return
    ctx.save()
    ctx.translate(cx, capY)
    ctx.lineWidth = 2
    ctx.strokeStyle = ENCRE
    ctx.beginPath()
    ctx.moveTo(-8, -30); ctx.lineTo(8, -30); ctx.lineTo(26, 4); ctx.quadraticCurveTo(0, 12, -26, 4); ctx.closePath()
    ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#c9c2b0'
    ctx.fillRect(-22, 6, 44, 30); ctx.strokeRect(-22, 6, 44, 30)
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#8fd0dc'
      ctx.fillRect(s < 0 ? -78 : 30, 12, 48, 16); ctx.strokeRect(s < 0 ? -78 : 30, 12, 48, 16)
      ctx.beginPath(); ctx.moveTo(s * 22, 20); ctx.lineTo(s * 30, 20); ctx.stroke()
    }
    ctx.fillStyle = e.phase === 'viser' && e.grappin === null && e.recharge === 0 ? '#f2b53a' : '#a69f86'
    ctx.fillRect(-4, -38, 8, 9); ctx.strokeRect(-4, -38, 8, 9)
    ctx.restore()
  }
}
