// L'annonce de l'assaut (Adrien, 24/10/2026) : avant le combat contre le vaisseau amiral d'une zone, un plein écran façon
// couverture de pulp. L'astre de la zone en grand, au bas de l'écran ; au-dessus, l'amiral qui descend vers nous, son
// image vue du dessus (la même qu'au combat : Adrien, « sinon ça fait bizarre ») ; « VOUS ALLEZ AFFRONTER », son nom en
// grosses lettres ; À L'ASSAUT ! ou PAS ENCORE. Un amiral pas encore dessiné reste une silhouette noire, un « ? »
// dessus. La vue ne décide rien : on lui dit qui, et comment dessiner l'astre.

import { imageVaisseau } from './vue-combat'

export interface Assaut {
  /** La zone (l'astre) et son amiral (« le Séléné »). */
  zone: string
  amiral: string
  /** Boss d'une planète (plus coriace) : ×7 ; d'une lune : ×4. */
  planete: boolean
}

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class AnnonceAssaut {
  private boucle = 0

  /** dessinerAstre : dessine l'astre de la zone centré en (x, y), de rayon r ; renvoie faux s'il n'est pas encore prêt. */
  constructor(private element: HTMLElement, private dessinerAstre: (ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number) => boolean) {}

  ouvrir(a: Assaut, partir: () => void): void {
    const im = imageVaisseau(a.amiral)
    const quoi = /^(Lune|Terre)$/.test(a.zone) ? `la ${a.zone}` : a.zone
    this.element.innerHTML = `<canvas class="ciel"></canvas>
      <div class="vaisseau${im ? '' : ' inconnu'}">${im ? `<img src="${im}" alt="">` : '<img src="vaisseaux/chasseur.webp" alt=""><b>?</b>'}</div>
      <div class="texte-assaut">
        <div class="etoile-assaut">Vous allez affronter</div>
        <h2>${echapper(a.amiral.toUpperCase())}</h2>
        <p>Vaisseau amiral d'Andromède · il tient ${echapper(quoi)}<br>${a.planete ? 'Sept fois plus coriace qu\'un chasseur' : 'Quatre fois plus coriace qu\'un chasseur'} · il enrage blessé</p>
        <div class="boutons-assaut"><button type="button" data-non>PAS ENCORE</button><button type="button" class="principal" data-oui>À L'ASSAUT !</button></div>
      </div>`
    this.element.hidden = false
    navigator.vibrate?.([60, 80, 60, 80, 200])
    const fermer = () => { cancelAnimationFrame(this.boucle); this.element.hidden = true; this.element.innerHTML = '' }
    this.element.querySelector('[data-non]')!.addEventListener('click', fermer)
    this.element.querySelector('[data-oui]')!.addEventListener('click', () => { fermer(); partir() })
    // Le ciel : des étoiles, et l'astre de la zone en grand au bas de l'écran (redessiné tant qu'il n'est pas prêt).
    const toile = this.element.querySelector<HTMLCanvasElement>('.ciel')!, ctx = toile.getContext('2d')!
    const etoiles = Array.from({ length: 120 }, (_, k) => ({ x: ((k * 0.6180339) % 1), y: ((k * 0.7548776) % 1), r: k % 9 === 0 ? 1.6 : 0.8, p: k }))
    let pret = false
    const peindre = (ms: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), l = toile.clientWidth, h = toile.clientHeight
      if (toile.width !== Math.round(l * dpr)) { toile.width = Math.round(l * dpr); toile.height = Math.round(h * dpr) }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, l, h)
      for (const e of etoiles) {
        ctx.globalAlpha = 0.45 + 0.4 * Math.sin(ms / 700 + e.p)
        ctx.beginPath(); ctx.arc(e.x * l, e.y * h, e.r, 0, 2 * Math.PI); ctx.fillStyle = '#fffbf2'; ctx.fill()
      }
      ctx.globalAlpha = 1
      // (Son haut à mi-écran, au-dessus de la plaque du texte.)
      const r = 0.95 * l, cy = 0.5 * h + r
      pret = this.dessinerAstre(ctx, a.zone, l * 0.5, cy, r) || pret
      if (!pret) { ctx.beginPath(); ctx.arc(l * 0.5, cy, r, 0, 2 * Math.PI); ctx.fillStyle = '#3a3448'; ctx.fill() }
      this.boucle = requestAnimationFrame(peindre)
    }
    this.boucle = requestAnimationFrame(peindre)
  }
}
