// Les gestes sur la carte : glisser un doigt pour se déplacer, pincer pour zoomer, toucher deux fois pour zoomer
// vers un point. Au lâcher, le mouvement continue sur son élan puis ralentit (inertie), comme sur une carte.
// La molette de la souris zoome aussi (pratique pour les essais sur ordinateur).

export interface ActionsCarte {
  glisser(dx: number, dy: number): void
  /** facteur > 1 : on s'éloigne ; (sx, sy) : point de l'écran qui reste fixe. */
  zoomer(facteur: number, sx: number, sy: number): void
}

interface Point { x: number; y: number }

/** Durée caractéristique du ralentissement après le lâcher (s). */
const FREIN_GLISSER = 0.32
const FREIN_ZOOM = 0.22
/** Zoom du double toucher (rapprochement d'un facteur 3). */
const ZOOM_DOUBLE_TOUCHER = Math.log(1 / 3)
/** Élan de zoom maximal au lâcher d'un pincement (au plus un facteur 3 de plus, environ). */
const ELAN_ZOOM_MAX = 5

export class Gestes {
  private pointeurs = new Map<number, Point>()
  // Élan (pixels/s pour le glissement, logarithme du facteur de zoom par seconde pour le zoom).
  private vx = 0
  private vy = 0
  private vz = 0
  private foyer: Point = { x: 0, y: 0 }
  private dernierMouvement = 0
  private touche: { x: number; y: number; t: number; bouge: boolean } | null = null
  private dernierToucher: { x: number; y: number; t: number } | null = null

  constructor(private element: HTMLElement, private actions: ActionsCarte) {
    element.addEventListener('pointerdown', (e) => this.appui(e))
    element.addEventListener('pointermove', (e) => this.mouvement(e))
    element.addEventListener('pointerup', (e) => this.relache(e))
    element.addEventListener('pointercancel', (e) => this.relache(e))
    element.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.actions.zoomer(Math.exp(e.deltaY * 0.0025), e.offsetX, e.offsetY)
    }, { passive: false })
  }

  /** Vrai tant que la carte bouge (doigts posés ou élan). */
  get actif(): boolean {
    return this.pointeurs.size > 0 || Math.abs(this.vx) + Math.abs(this.vy) > 2 || Math.abs(this.vz) > 0.02
  }

  /** À appeler à chaque image : applique l'élan restant. */
  avancer(dt: number): void {
    if (this.pointeurs.size > 0) return
    if (Math.abs(this.vx) + Math.abs(this.vy) > 2) {
      this.actions.glisser(this.vx * dt, this.vy * dt)
      const k = Math.exp(-dt / FREIN_GLISSER)
      this.vx *= k
      this.vy *= k
    } else this.vx = this.vy = 0
    if (Math.abs(this.vz) > 0.02) {
      this.actions.zoomer(Math.exp(this.vz * dt), this.foyer.x, this.foyer.y)
      this.vz *= Math.exp(-dt / FREIN_ZOOM)
    } else this.vz = 0
  }

  private position(e: PointerEvent): Point {
    const r = this.element.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  private appui(e: PointerEvent): void {
    this.element.setPointerCapture(e.pointerId)
    const p = this.position(e)
    this.pointeurs.set(e.pointerId, p)
    this.vx = this.vy = this.vz = 0
    this.dernierMouvement = performance.now()
    this.touche = this.pointeurs.size === 1 ? { ...p, t: performance.now(), bouge: false } : null
  }

  private mouvement(e: PointerEvent): void {
    const avant = this.pointeurs.get(e.pointerId)
    if (!avant) return
    const p = this.position(e)
    const maintenant = performance.now()
    const dt = Math.max(0.004, (maintenant - this.dernierMouvement) / 1000)
    this.dernierMouvement = maintenant
    if (this.touche && Math.hypot(p.x - this.touche.x, p.y - this.touche.y) > 10) this.touche.bouge = true

    if (this.pointeurs.size === 1) {
      const dx = p.x - avant.x, dy = p.y - avant.y
      this.actions.glisser(dx, dy)
      this.lisser(dx / dt, dy / dt, 0)
    } else if (this.pointeurs.size === 2) {
      const autre = [...this.pointeurs.entries()].find(([id]) => id !== e.pointerId)![1]
      const milieuAvant = { x: (avant.x + autre.x) / 2, y: (avant.y + autre.y) / 2 }
      const milieu = { x: (p.x + autre.x) / 2, y: (p.y + autre.y) / 2 }
      const facteur = Math.hypot(avant.x - autre.x, avant.y - autre.y) / Math.max(1, Math.hypot(p.x - autre.x, p.y - autre.y))
      this.actions.glisser(milieu.x - milieuAvant.x, milieu.y - milieuAvant.y)
      this.actions.zoomer(facteur, milieu.x, milieu.y)
      this.foyer = milieu
      this.lisser((milieu.x - milieuAvant.x) / dt, (milieu.y - milieuAvant.y) / dt, Math.log(facteur) / dt)
    }
    this.pointeurs.set(e.pointerId, p)
  }

  /** Estimation de la vitesse, lissée sur les derniers mouvements. */
  private lisser(vx: number, vy: number, vz: number): void {
    const a = 0.35
    this.vx += (vx - this.vx) * a
    this.vy += (vy - this.vy) * a
    this.vz += (vz - this.vz) * a
  }

  private relache(e: PointerEvent): void {
    if (!this.pointeurs.delete(e.pointerId)) return
    const maintenant = performance.now()
    // Doigt immobile avant le lâcher : pas d'élan.
    if (maintenant - this.dernierMouvement > 80) this.vx = this.vy = this.vz = 0
    if (this.pointeurs.size === 1) this.vx = this.vy = 0 // fin d'un pincement : seul le zoom garde son élan
    this.vz = Math.max(-ELAN_ZOOM_MAX, Math.min(ELAN_ZOOM_MAX, this.vz))
    if (this.pointeurs.size === 0 && this.touche && !this.touche.bouge && maintenant - this.touche.t < 300) {
      const d = this.dernierToucher
      if (d && maintenant - d.t < 350 && Math.hypot(d.x - this.touche.x, d.y - this.touche.y) < 40) {
        // Double toucher : zoom vers ce point, en douceur (l'élan fait tout le chemin).
        this.foyer = { x: this.touche.x, y: this.touche.y }
        this.vz = ZOOM_DOUBLE_TOUCHER / FREIN_ZOOM
        this.vx = this.vy = 0
        this.dernierToucher = null
      } else this.dernierToucher = { x: this.touche.x, y: this.touche.y, t: maintenant }
    }
    if (this.pointeurs.size === 0) this.touche = null
  }
}
