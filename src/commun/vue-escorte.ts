// L'escorte (ESCORTER, la mission des Mercenaires ; décision d'Adrien du 18/10/2026), en plein écran par-dessus la
// carte : sur la dernière ligne droite, le convoi (trois cargos) tombe dans une embuscade. Des missiles arrivent des
// bords ; on les intercepte en les touchant du doigt. La vue ne décide rien : elle montre l'état que tient le moteur
// (moteur/escorte.ts).

import { CARGOS, HAUTEUR, LARGEUR, RAYON_INTERCEPTION, RESISTANCE } from '../donnees/escorte'
import { avancerEscorte, nouvelleEscorte, positionMissile, tirer, type EtatEscorte } from '../moteur/escorte'
import { dessinerCapsuleDuJoueur } from '../carte/vaisseaux'
import { dessinerDecorContrat } from '../carte/decor-contrat'
import { dessinerCargo, TUYERES_CARGO } from '../carte/objets-contrats'

/** Une escorte : vers où, la zone (plus loin, plus de missiles), et ce qu'on fait à l'arrivée (texte du bilan). */
export interface OptionsEscorte { titre: string; zone: number; surFin: (coups: number) => string }

const ENCRE = '#2b2138', CERISE = '#e04b37'

export class VueEscorte {
  private etat: EtatEscorte | null = null
  private options: OptionsEscorte | null = null
  private boucle = 0
  private avant = 0
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elInfos: HTMLElement
  private elFin: HTMLElement
  private elMessage: HTMLElement
  private finMessage = 0
  /** Passage du terrain (ses unités) à l'écran : échelle et décalage. */
  private k = 3
  private ox = 0
  private oy = 0

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-escorte"></span><button type="button" data-abandonner>PLUS TARD</button></div>
      <div class="infos-escorte"></div>
      <div class="vue"><canvas></canvas><div class="message-escorte" hidden></div></div>
      <div class="fin-combat" hidden></div>`
    this.toile = element.querySelector('canvas')!
    this.ctx = this.toile.getContext('2d')!
    this.elInfos = element.querySelector('.infos-escorte')!
    this.elFin = element.querySelector('.fin-combat')!
    this.elMessage = element.querySelector('.message-escorte')!
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (b && (b.dataset.abandonner !== undefined || b.dataset.fermer !== undefined)) this.fermer()
    })
    // Toucher le ciel : un intercepteur part là où est le doigt.
    this.toile.addEventListener('pointerdown', (ev) => {
      const e = this.etat
      if (!e) return
      ev.preventDefault()
      const r = this.toile.getBoundingClientRect()
      const x = (ev.clientX - r.left - this.ox) / this.k, y = (ev.clientY - r.top - this.oy) / this.k
      const n = tirer(e, x, y)
      if (n) navigator.vibrate?.(25)
    })
  }

  ouvrir(options: OptionsEscorte): void {
    this.options = options
    this.etat = nouvelleEscorte((Date.now() % 2147483647) >>> 0, options.zone)
    this.element.querySelector('.titre-escorte')!.textContent = `ESCORTE · ${options.titre}`
    this.elFin.hidden = true
    this.element.hidden = false
    this.dire('Embuscade ! Touche les missiles pour les intercepter avant qu\'ils frappent les cargos.')
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

  private dire(texte: string, duree = 3500): void {
    this.elMessage.textContent = texte
    this.elMessage.hidden = false
    this.finMessage = performance.now() + duree
  }

  private avancer(dt: number): void {
    const e = this.etat
    if (!e || e.fini) return
    const r = avancerEscorte(e, dt)
    if (r === 'coup') navigator.vibrate?.(120)
    if (r === 'repli') this.dire('Le convoi est trop touché : il se replie. On recommence l\'approche !', 4000)
    if (r === 'arrive') this.terminer()
    if (performance.now() > this.finMessage) this.elMessage.hidden = true
    const reste = e.aVenir.length + e.missiles.length
    const texte = `<span>MISSILES <b>${reste}</b></span><span>INTERCEPTÉS <b>${e.interceptes}</b></span><span>COUPS REÇUS <b>${e.coups}</b></span>`
    if (texte !== this.elInfos.dataset.texte) { this.elInfos.innerHTML = texte; this.elInfos.dataset.texte = texte }
  }

  private terminer(): void {
    const e = this.etat!
    navigator.vibrate?.([60, 40, 60])
    const suite = this.options!.surFin(e.coups)
    this.elFin.innerHTML = '<div class="carte-fin"><b>CONVOI ARRIVÉ !</b>'
      + `<p>${e.interceptes} missile${e.interceptes > 1 ? 's' : ''} intercepté${e.interceptes > 1 ? 's' : ''}. `
      + `${e.coups ? `${e.coups} coup${e.coups > 1 ? 's' : ''} reçu${e.coups > 1 ? 's' : ''}.` : 'Pas une égratignure : prime de 10 %.'}</p>`
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
    this.k = Math.min(l / LARGEUR, h / HAUTEUR)
    this.ox = (l - LARGEUR * this.k) / 2
    this.oy = (h - HAUTEUR * this.k) / 2
    const k = this.k, X = (x: number) => this.ox + x * k, Y = (y: number) => this.oy + y * k
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // Le convoi file vers le haut : des traits de poussière qui défilent.
    ctx.strokeStyle = 'rgba(43,33,56,0.18)'
    ctx.lineWidth = 1
    for (let i = 0; i < 26; i++) {
      const x = (i * 37.3) % LARGEUR, y = ((i * 61.7 + e.temps * 40) % (HAUTEUR + 20)) - 10
      ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x), Y(y + 6)); ctx.stroke()
    }

    // Les cargos : une cabine et trois conteneurs ; touchés, ils fument ; hors d'usage, gris et fendus.
    CARGOS.forEach((c, i) => {
      const d = e.degats[i] ?? 0, hs = d >= RESISTANCE
      ctx.save()
      ctx.translate(X(c.x), Y(c.y))
      ctx.lineWidth = 1.8
      ctx.strokeStyle = ENCRE
      const s = k
      // Le cargo dessiné par ChatGPT, de sa couleur (Adrien, 25/10/2026), une flamme à chacune de ses deux tuyères ;
      // sinon l'ancien dessin, une cabine et trois conteneurs.
      ctx.fillStyle = '#f2b53a'
      if (!hs) {
        for (const cote of [-1, 1]) {
          const fx = cote * TUYERES_CARGO * 14.2 * s
          ctx.beginPath(); ctx.moveTo(fx - 1.4 * s, 12.5 * s); ctx.lineTo(fx, (15.5 + Math.sin(e.temps * 20 + i + cote) * 1.2) * s); ctx.lineTo(fx + 1.4 * s, 12.5 * s); ctx.closePath(); ctx.fill(); ctx.stroke()
        }
      }
      if (!dessinerCargo(ctx, i, 0, 3, 20 * s, hs)) {
        const teintes = hs ? ['#b8b2a8', '#b8b2a8', '#b8b2a8'] : ['#f2c66a', '#8fd0dc', '#f3a08b']
        teintes.forEach((t, j) => { ctx.fillStyle = t; ctx.fillRect(-4 * s, (-2 + j * 5) * s, 8 * s, 4.5 * s); ctx.strokeRect(-4 * s, (-2 + j * 5) * s, 8 * s, 4.5 * s) })
        ctx.beginPath(); ctx.moveTo(-3 * s, -2 * s); ctx.lineTo(0, -7 * s); ctx.lineTo(3 * s, -2 * s); ctx.closePath()
        ctx.fillStyle = hs ? '#b8b2a8' : '#efe6d2'; ctx.fill(); ctx.stroke()
      }
      for (let f = 0; f < d; f++) {
        ctx.fillStyle = 'rgba(80,72,88,0.35)'
        ctx.beginPath(); ctx.arc((f ? 3 : -3) * s, (-6 - ((e.temps * 6 + f * 3) % 8)) * s, (1.5 + ((e.temps * 3 + f) % 2)) * s, 0, 2 * Math.PI); ctx.fill()
      }
      ctx.restore()
    })

    // La capsule, en escorte derrière le convoi, dans sa forme et sa Maison (Adrien, 25/10/2026) ; sinon un chevron.
    if (!dessinerCapsuleDuJoueur(ctx, X(50), Y(146), 0, 10 * k)) {
    ctx.save()
    ctx.translate(X(50), Y(146))
    ctx.beginPath(); ctx.moveTo(0, -4 * k); ctx.lineTo(3 * k, 3 * k); ctx.lineTo(0, 1.5 * k); ctx.lineTo(-3 * k, 3 * k); ctx.closePath()
    ctx.fillStyle = CERISE; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = ENCRE; ctx.stroke()
    ctx.restore()
    }

    // Les missiles : leur trajectoire (pointillé vers le cargo visé) et le missile lui-même.
    for (const m of e.missiles) {
      const p = positionMissile(m, e.temps), c = CARGOS[m.cargo]
      ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(224,75,55,0.45)'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(c.x), Y(c.y)); ctx.stroke()
      ctx.setLineDash([])
      const a = Math.atan2(c.y - m.depart.y, c.x - m.depart.x)
      ctx.save()
      ctx.translate(X(p.x), Y(p.y))
      ctx.rotate(a)
      ctx.beginPath(); ctx.moveTo(4.8 * k, 0); ctx.lineTo(-3 * k, -2 * k); ctx.lineTo(-1.8 * k, 0); ctx.lineTo(-3 * k, 2 * k); ctx.closePath()
      ctx.fillStyle = CERISE; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = ENCRE; ctx.stroke()
      ctx.restore()
    }

    // Les explosions : l'intercepteur (anneau doré), l'impact sur un cargo (gerbe cerise).
    for (const x of e.explosions) {
      const f = (e.temps - x.t) / 0.6
      ctx.globalAlpha = 1 - f
      ctx.beginPath()
      ctx.arc(X(x.x), Y(x.y), (x.touche ? 5 + 6 * f : RAYON_INTERCEPTION * (0.4 + 0.6 * f)) * k, 0, 2 * Math.PI)
      ctx.lineWidth = x.touche ? 3 : 2
      ctx.strokeStyle = x.touche ? CERISE : '#f2b53a'
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
}
