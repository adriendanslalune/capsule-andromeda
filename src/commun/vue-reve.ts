// Le rêve du Soleil (décision d'Adrien du 21/10/2026) : un secret pour les curieux qui foncent dans le Soleil. Aucun
// effet sur le jeu : la capsule se réveille là d'où elle était partie. En plein écran, environ 25 secondes, façon
// Moebius qui délire : le Soleil chauffe, s'effondre en trou noir, aspire les planètes (une demi-seconde, à la place de
// Neptune, la silhouette d'un vaisseau : un indice sur Triton), la capsule traverse, un « nouveau » système solaire
// bizarrement familier apparaît, puis tout blanchit… et une case de BD : le capitaine se réveille. Vu en entier la
// première fois ; ensuite, on peut passer.

import { dessinerAstreIllustre } from '../carte/illustrations'

/** Durée de l'animation (s), avant la case du réveil. */
const DUREE = 25
/** Les planètes du rêve : couleur pastel et rayon (px à 390 de large), dans l'ordre depuis le Soleil. */
const PLANETES: [string, number][] = [
  ['#b9b0a4', 3], ['#f1d08c', 4.5], ['#8fbfe6', 4.8], ['#ef9a7a', 3.8], ['#e3b07c', 9], ['#ecd59a', 8], ['#a6e0e6', 6], ['#7f9de6', 6], ['#d8b9a0', 2.6],
]
const NEPTUNE = 7
const CREME = '#f4f1ea', ENCRE = '#2b2138'

const lisse = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u) }

export class VueReve {
  private toile: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private elFin: HTMLElement
  private elPasser: HTMLButtonElement
  private debut = 0
  private boucle = 0
  private premier = false
  private quandFini: () => void = () => {}

  constructor(private element: HTMLElement) {
    element.innerHTML = '<canvas></canvas><button type="button" class="passer-reve" hidden>PASSER ›</button><div class="fin-reve" hidden></div>'
    this.toile = element.querySelector('canvas')!
    this.ctx = this.toile.getContext('2d')!
    this.elFin = element.querySelector('.fin-reve')!
    this.elPasser = element.querySelector('.passer-reve')!
    this.elPasser.addEventListener('click', () => this.reveiller())
    this.elFin.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-reprendre]')) this.fermer()
    })
  }

  /** Joue le rêve. premier : la première fois (pas de PASSER, et le titre Icare annoncé au réveil). */
  ouvrir(premier: boolean, quandFini: () => void): void {
    this.premier = premier
    this.quandFini = quandFini
    this.element.hidden = false
    this.elFin.hidden = true
    this.elPasser.hidden = premier
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.toile.width = Math.round(window.innerWidth * dpr)
    this.toile.height = Math.round(window.innerHeight * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.debut = performance.now()
    navigator.vibrate?.([60, 80, 60, 80, 200])
    cancelAnimationFrame(this.boucle)
    const image = (maintenant: number) => {
      if (this.element.hidden) return
      const s = (maintenant - this.debut) / 1000
      if (s >= DUREE) { this.reveiller(); return }
      this.dessiner(s)
      this.boucle = requestAnimationFrame(image)
    }
    this.boucle = requestAnimationFrame(image)
  }

  /** La case de BD du réveil. */
  private reveiller(): void {
    cancelAnimationFrame(this.boucle)
    this.elPasser.hidden = true
    const c = this.ctx
    c.fillStyle = '#fffdf6'
    c.fillRect(0, 0, window.innerWidth, window.innerHeight)
    this.elFin.innerHTML = '<div class="case-reveil"><div class="titre-reveil"><span class="titre-pulp">CAPITAINE ?</span></div>'
      + '<p class="bulle-reveil">Capitaine ? Capitaine ! Vous avez encore fait le rêve du Soleil…</p>'
      + '<p class="petit">La capsule tourne tranquillement, là d\'où elle était partie. Rien de cassé.</p>'
      + (this.premier ? '<p class="titre-gagne">Titre secret : <b>ICARE</b><small>Il s\'affiche dans ton Profil et à côté de ton nom dans les Messages. Garde le secret… ou pas.</small></p>' : '')
      + '<button type="button" class="principal" data-reprendre>REPRENDRE</button></div>'
    this.elFin.hidden = false
  }

  fermer(): void {
    cancelAnimationFrame(this.boucle)
    this.element.hidden = true
    this.quandFini()
  }

  private dessiner(s: number): void {
    const c = this.ctx, W = window.innerWidth, H = window.innerHeight
    const cx = W / 2, cy = H / 2, u = Math.min(W, H) / 390
    // Le délire : de la palette de Moebius aux couleurs saturées (4 à 9 s), puis retour (19 à 23 s).
    const psy = lisse(4, 9, s) * (1 - lisse(19, 23, s))
    const teinte = (k: number, l = 70) => `hsl(${(s * 40 + k) % 360}, ${30 + 55 * psy}%, ${l}%)`

    // Le fond : le papier, puis des anneaux ondulés qui changent de couleur.
    c.fillStyle = CREME
    c.fillRect(0, 0, W, H)
    if (psy > 0.01) {
      c.globalAlpha = psy
      const R = Math.hypot(W, H) / 2
      for (let k = 14; k >= 0; k--) {
        const r = (k / 14) * R + ((s * 30) % (R / 14))
        c.beginPath()
        for (let a = 0; a <= 64; a++) {
          const th = (a / 64) * 2 * Math.PI
          const rr = r * (1 + 0.04 * Math.sin(th * 6 + s * 2 + k))
          if (a) c.lineTo(cx + rr * Math.cos(th), cy + rr * Math.sin(th))
          else c.moveTo(cx + rr * Math.cos(th), cy + rr * Math.sin(th))
        }
        c.fillStyle = teinte(k * 24, k % 2 ? 78 : 66)
        c.fill()
      }
      c.globalAlpha = 1
    }

    // Les orbites et les planètes : en place, puis aspirées en spirale (8 à 15 s), puis le « nouveau » système (19 s).
    const rTrou = s < 4 ? 0 : (s < 9 ? 105 - 80 * lisse(4, 9, s) : 25) * u
    const nouveau = lisse(18.5, 21, s)
    for (let i = 0; i < PLANETES.length; i++) {
      const [couleur, taille] = PLANETES[i]
      const r0 = (120 + 26 * i) * u
      const debutChute = 8.5 + 0.55 * (PLANETES.length - 1 - i) * 0.6
      const chute = lisse(debutChute, debutChute + 3.2, s)
      const visible = s < 15 ? 1 - lisse(debutChute + 2.6, debutChute + 3.2, s) : nouveau
      if (visible <= 0) continue
      const r = s < 15 ? r0 * (1 - chute) + rTrou * chute : r0
      const angle = i * 2.1 + (s < 15 ? s * (0.25 + 0.05 * i) + chute * chute * 9 : 0.4 * s)
      // L'orbite (pas pendant la chute).
      if (s < 8.5 || s > 18.5) {
        c.beginPath()
        c.arc(cx, cy, r0, 0, 2 * Math.PI)
        c.strokeStyle = ENCRE
        c.globalAlpha = 0.18 * (s > 18.5 ? nouveau : 1)
        c.lineWidth = 1
        c.stroke()
        c.globalAlpha = 1
      }
      const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle) * 0.92
      // Le clin d'œil (une demi-seconde) : à la place de Neptune, la silhouette d'un vaisseau.
      if (i === NEPTUNE && s > 10.6 && s < 11.1) { this.vaisseau(c, x, y, u, angle); continue }
      // Une traîne pendant la chute.
      if (chute > 0.05 && s < 15) {
        c.beginPath()
        c.moveTo(x, y)
        const a2 = angle - 0.5 * chute
        c.lineTo(cx + (r + 18 * u) * Math.cos(a2), cy + (r + 18 * u) * Math.sin(a2) * 0.92)
        c.strokeStyle = s > 9 ? teinte(i * 40, 55) : couleur
        c.lineWidth = taille * u * 1.2
        c.lineCap = 'round'
        c.globalAlpha = 0.6 * visible
        c.stroke()
        c.globalAlpha = 1
      }
      c.globalAlpha = visible
      c.beginPath()
      c.arc(x, y, taille * u * (s > 18.5 ? 1 : 1 - 0.5 * chute), 0, 2 * Math.PI)
      // Le « nouveau » système : les mêmes planètes, un peu décalées de couleur… puis les bonnes.
      c.fillStyle = s > 18.5 ? teinte(i * 37 + 180, 70) : couleur
      c.fill()
      c.strokeStyle = ENCRE
      c.lineWidth = 1.2
      c.stroke()
      c.globalAlpha = 1
    }

    // Le Soleil qui chauffe (0 à 4 s), s'effondre en trou noir (4 à 9 s), avec son disque d'accrétion.
    if (s < 15) {
      if (s < 9) {
        const chaud = lisse(0, 4, s)
        const rs = (s < 4 ? 70 + 8 * Math.sin(s * 9) * chaud : 78 - 53 * lisse(4, 9, s)) * u
        const noir = lisse(5, 8.5, s)
        // Le vrai Soleil de la carte, qui palpite ; puis il noircit en s'effondrant.
        if (noir < 0.02) dessinerAstreIllustre(c, 'Soleil', cx, cy, rs, null)
        // Les rayons, de plus en plus fous.
        for (let k = 0; k < 28 && noir >= 0.02; k++) {
          const a = (k / 28) * 2 * Math.PI + s * (0.3 + chaud)
          const l = rs * (1.3 + 0.35 * Math.sin(k * 3 + s * 7) * (0.3 + chaud))
          c.beginPath()
          c.moveTo(cx + rs * 1.02 * Math.cos(a), cy + rs * 1.02 * Math.sin(a))
          c.lineTo(cx + l * Math.cos(a), cy + l * Math.sin(a))
          c.strokeStyle = ENCRE
          c.lineWidth = 1.4
          c.stroke()
        }
        if (noir >= 0.02) {
          c.beginPath()
          c.arc(cx, cy, rs, 0, 2 * Math.PI)
          c.fillStyle = `rgb(${Math.round(242 * (1 - noir) + 20 * noir)}, ${Math.round(198 * (1 - noir) + 14 * noir)}, ${Math.round(106 * (1 - noir) + 30 * noir)})`
          c.fill()
          c.lineWidth = 2.5
          c.strokeStyle = ENCRE
          c.stroke()
        }
      }
      if (s >= 4) {
        // Le disque d'accrétion : des ellipses qui tournent, aux couleurs du délire.
        const fort = lisse(4.5, 8, s) * (1 - lisse(13.5, 15, s))
        for (let k = 0; k < 7; k++) {
          c.beginPath()
          c.ellipse(cx, cy, (40 + k * 11) * u * (0.6 + 0.4 * fort), (11 + k * 3) * u * (0.6 + 0.4 * fort), s * (0.8 + k * 0.15), 0, 2 * Math.PI)
          c.strokeStyle = teinte(k * 30, 58)
          c.lineWidth = 3 * u
          c.globalAlpha = fort
          c.stroke()
        }
        c.globalAlpha = 1
        if (s >= 9) {
          c.beginPath()
          c.arc(cx, cy, rTrou * (1 + 0.15 * Math.sin(s * 5)), 0, 2 * Math.PI)
          c.fillStyle = '#140e1f'
          c.fill()
        }
      }
    }

    // Le tunnel (15 à 19 s) : la capsule traverse.
    if (s >= 14.5 && s < 19.5) {
      const f = lisse(14.5, 15.5, s) * (1 - lisse(18.5, 19.5, s))
      c.globalAlpha = f
      c.fillStyle = '#140e1f'
      c.fillRect(0, 0, W, H)
      for (let k = 0; k < 18; k++) {
        const z = ((k / 18 + s * 0.6) % 1)
        const r = 4 * u + z * z * Math.hypot(W, H) * 0.7
        c.beginPath()
        for (let a = 0; a <= 48; a++) {
          const th = (a / 48) * 2 * Math.PI
          const rr = r * (1 + 0.06 * Math.sin(th * 5 + s * 3 + k))
          if (a) c.lineTo(cx + rr * Math.cos(th), cy + rr * Math.sin(th))
          else c.moveTo(cx + rr * Math.cos(th), cy + rr * Math.sin(th))
        }
        c.strokeStyle = teinte(k * 20, 62)
        c.lineWidth = 1 + 3 * z
        c.stroke()
      }
      c.globalAlpha = 1
    }

    // Le nouveau Soleil (19 à 25 s) : le même, bizarrement familier.
    if (s >= 18.5) {
      const v = lisse(18.5, 20.5, s)
      c.globalAlpha = v
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * 2 * Math.PI + s * 0.2
        c.beginPath()
        c.moveTo(cx + 26 * u * Math.cos(a), cy + 26 * u * Math.sin(a))
        c.lineTo(cx + 38 * u * Math.cos(a), cy + 38 * u * Math.sin(a))
        c.strokeStyle = ENCRE
        c.lineWidth = 1.3
        c.stroke()
      }
      // D'abord d'une drôle de couleur, puis le Soleil de toujours.
      if (psy > 0.25) {
        c.beginPath()
        c.arc(cx, cy, 24 * u, 0, 2 * Math.PI)
        c.fillStyle = teinte(270, 70)
        c.fill()
        c.lineWidth = 2
        c.strokeStyle = ENCRE
        c.stroke()
      } else dessinerAstreIllustre(c, 'Soleil', cx, cy, 20 * u, null)
      c.globalAlpha = 1
    }

    // La capsule : elle fonce vers le Soleil (0 à 4 s), tourne dans le trou noir, traverse le tunnel.
    if (s < 19) {
      const vers = lisse(0, 4.5, s)
      const x = s < 9 ? cx : cx, y = s < 9 ? H * 0.82 - (H * 0.82 - cy - 120 * u) * vers : cy
      const a = s < 9 ? -Math.PI / 2 : s * 6
      const k = s < 9 ? 1 : s < 15 ? 1 - lisse(9, 12, s) * 0.6 : 1.2 + Math.sin(s * 4) * 0.2
      if (!(s > 12 && s < 14.6)) this.capsule(c, s < 9 || s >= 14.6 ? x : cx + 30 * u * Math.cos(s * 3), s < 9 || s >= 14.6 ? y : cy + 12 * u * Math.sin(s * 3), a, k * u)
    }

    // Les alertes du début : la chaleur.
    if (s < 4.5 && Math.floor(s * 3) % 2 === 0) {
      c.font = `${Math.round(20 * u)}px 'Bowlby One SC', 'Arial Black', sans-serif`
      c.textAlign = 'center'
      c.fillStyle = '#d9694f'
      c.fillText(s < 2 ? 'TEMPÉRATURE COQUE' : 'BOUCLIERS 3 %', cx, H * 0.14)
    }
    // La chaleur qui blanchit (vers 4 s), et le grand blanc de la fin (23 à 25 s).
    const blanc = Math.max(lisse(2.5, 4, s) * (1 - lisse(4, 5.5, s)) * 0.85, lisse(22.5, 25, s))
    if (blanc > 0) {
      c.fillStyle = `rgba(255, 253, 246, ${blanc})`
      c.fillRect(0, 0, W, H)
    }
  }

  /** La capsule du joueur : un chevron cerise cerné d'encre. */
  private capsule(c: CanvasRenderingContext2D, x: number, y: number, a: number, k: number): void {
    c.save()
    c.translate(x, y)
    c.rotate(a)
    c.scale(k, k)
    c.beginPath()
    c.moveTo(12, 0)
    c.lineTo(-8, 8)
    c.lineTo(-4, 0)
    c.lineTo(-8, -8)
    c.closePath()
    c.fillStyle = '#e04b37'
    c.fill()
    c.lineWidth = 1.5
    c.strokeStyle = ENCRE
    c.stroke()
    c.restore()
  }

  /** La silhouette d'un vaisseau (Triton), le temps d'un battement de cils : un fuseau sombre et ses hublots. */
  private vaisseau(c: CanvasRenderingContext2D, x: number, y: number, u: number, a: number): void {
    c.save()
    c.translate(x, y)
    c.rotate(a + Math.PI / 2)
    c.beginPath()
    c.ellipse(0, 0, 26 * u, 7 * u, 0, 0, 2 * Math.PI)
    c.moveTo(-18 * u, -5 * u)
    c.lineTo(-30 * u, -14 * u)
    c.lineTo(-24 * u, 0)
    c.lineTo(-30 * u, 14 * u)
    c.lineTo(-18 * u, 5 * u)
    c.fillStyle = '#140e1f'
    c.fill()
    for (let k = -3; k <= 3; k++) {
      c.beginPath()
      c.arc(k * 6 * u, 0, 1.3 * u, 0, 2 * Math.PI)
      c.fillStyle = '#9ff0e8'
      c.fill()
    }
    c.restore()
  }
}
