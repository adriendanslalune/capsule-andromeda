// Le tri des matériaux d'une épave (étape 5, mini-jeu des Nettoyeurs ; prototype, d'après la maquette validée le
// 18/10/2026), en plein écran par-dessus la carte : un objet sort de l'épave, on le jette dans le bon bac (quatre
// gros boutons à portée du pouce) ; la série monte tant qu'on ne se trompe pas. La vue ne décide rien : elle montre
// l'état du tri que tient le moteur (moteur/tri.ts).

import { BACS, DUREE_TRI, OBJETS_EPAVE, type Bac } from '../donnees/tri'
import { nouveauTri, resteTri, trier, type EtatTri } from '../moteur/tri'

const E = 'stroke="#2b2138" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'
/** Les dessins des objets (viewBox 0 0 150 120), en aplats pastel et encre, style Moebius. */
const DESSINS: Record<string, string> = {
  plaque: `<path d="M30 34 l84 -6 l6 56 l-86 8z" fill="#c9c2b0" ${E}/><circle cx="40" cy="42" r="3.5" fill="#2b2138"/><circle cx="108" cy="36" r="3.5" fill="#2b2138"/><circle cx="112" cy="78" r="3.5" fill="#2b2138"/><circle cx="42" cy="84" r="3.5" fill="#2b2138"/><path d="M52 52 l40 -3 M54 66 l46 -4" stroke="#7d6a9e" stroke-width="2"/>`,
  tuyere: `<path d="M56 22 h36 l22 76 h-80z" fill="#d9a43a" ${E}/><path d="M60 34 l-10 58 M90 30 l6 20" stroke="#2b2138" stroke-width="1.6" fill="none"/><ellipse cx="74" cy="98" rx="40" ry="8" fill="#a69f86" ${E}/>`,
  boulons: [0, 1, 2, 3, 4].map((k) => { const x = 36 + k * 20, y = 50 + (k % 2) * 18; return `<g transform="rotate(${k * 25 - 40} ${x} ${y})"><rect x="${x - 4}" y="${y - 2}" width="8" height="34" fill="#c9c2b0" ${E}/><path d="M${x - 10} ${y - 8} h20 v10 h-20z" fill="#a69f86" ${E}/></g>` }).join(''),
  bobine: `<rect x="40" y="30" width="70" height="62" rx="6" fill="#a69f86" ${E}/>${[0, 1, 2, 3, 4, 5, 6].map((k) => `<path d="M44 ${38 + k * 8} h62" stroke="#d9694f" stroke-width="5"/>`).join('')}<rect x="40" y="30" width="70" height="62" rx="6" fill="none" ${E}/>`,
  carte: `<rect x="26" y="32" width="98" height="58" rx="3" fill="#8fcf98" ${E}/><path d="M36 48 h30 v22 h40 M48 80 v-10 h46 M100 40 v14" stroke="#d9a43a" stroke-width="3" fill="none"/><rect x="72" y="40" width="22" height="16" fill="#2b2138"/><circle cx="40" cy="80" r="4" fill="#faf2dc" ${E}/>`,
  relais: `<rect x="44" y="30" width="62" height="48" rx="5" fill="#3a3340" ${E}/><path d="M54 78 v18 M75 78 v18 M96 78 v18" ${E}/><path d="M58 44 l12 12 l12 -12 l12 12" stroke="#e04b37" stroke-width="2.5" fill="none"/><path d="M98 26 q6 -10 0 -16 M106 30 q8 -12 2 -20" stroke="#7d6a9e" stroke-width="2" fill="none"/>`,
  puce: `<rect x="48" y="36" width="54" height="48" rx="3" fill="#2b2138" ${E}/>${[0, 1, 2, 3, 4].map((k) => `<path d="M${54 + k * 10} 36 v-10 M${54 + k * 10} 84 v10" stroke="#c9c2b0" stroke-width="3"/>`).join('')}<circle cx="58" cy="46" r="3" fill="#faf2dc"/>`,
  lampe: `<path d="M58 88 v-40 q0 -26 17 -26 q17 0 17 26 v40z" fill="#e8f1f2" ${E}/><path d="M66 50 h18 M68 62 h14 M75 50 v28" stroke="#d9694f" stroke-width="2"/><rect x="54" y="88" width="42" height="14" rx="3" fill="#3a3340" ${E}/>`,
  hublot: `<circle cx="75" cy="60" r="40" fill="#a69f86" ${E}/><circle cx="75" cy="60" r="28" fill="#bfe0e8" ${E}/><path d="M60 42 l12 16 l-8 8 l16 12" stroke="#2b2138" stroke-width="2" fill="none"/>${[0, 1, 2, 3, 4, 5].map((k) => { const a = k * Math.PI / 3; return `<circle cx="${(75 + 34 * Math.cos(a)).toFixed(1)}" cy="${(60 + 34 * Math.sin(a)).toFixed(1)}" r="3" fill="#2b2138"/>` }).join('')}`,
  cristal: `<path d="M75 14 l24 32 l-9 56 h-30 l-9 -56z" fill="#d7cdee" ${E}/><path d="M75 14 v88 M51 46 h48" stroke="#2b2138" stroke-width="1.4"/><path d="M64 30 l-6 12" stroke="#fffaf0" stroke-width="3"/>`,
  lentille: `<ellipse cx="75" cy="60" rx="20" ry="42" fill="#bfe0e8" ${E}/><path d="M66 32 q-6 28 0 56" stroke="#fffaf0" stroke-width="3" fill="none"/><rect x="40" y="56" width="16" height="8" fill="#a69f86" ${E}/><rect x="94" y="56" width="16" height="8" fill="#a69f86" ${E}/>`,
  fiole: `<path d="M66 18 h18 v28 l22 46 q4 10 -8 10 h-46 q-12 0 -8 -10 l22 -46z" fill="#e8f1f2" ${E}/><path d="M50 82 h50 l4 10 q2 6 -6 6 h-46 q-8 0 -6 -6z" fill="#8fcf98"/><path d="M66 18 h18" ${E}/>`,
  mousse: `<path d="M28 74 q8 -40 30 -22 q14 -26 36 -6 q26 -10 26 26 q-4 20 -46 16 q-42 6 -46 -14z" fill="#f6e3b8" ${E}/><circle cx="62" cy="66" r="4" fill="none" stroke="#2b2138" stroke-width="1.5"/><circle cx="90" cy="60" r="5" fill="none" stroke="#2b2138" stroke-width="1.5"/><circle cx="78" cy="78" r="3" fill="none" stroke="#2b2138" stroke-width="1.5"/>`,
  gant: `<path d="M50 96 v-38 q0 -8 7 -8 v-20 q0 -7 7 -7 q7 0 7 7 v-4 q0 -7 7 -7 q7 0 7 7 v6 q0 -6 7 -6 q7 0 7 7 v34 q0 20 -22 29z" fill="#faf2dc" ${E}/><rect x="46" y="94" width="40" height="12" rx="3" fill="#d9694f" ${E}/>`,
  ration: `<path d="M38 36 l70 -8 l8 60 l-72 8z" fill="#f5d38a" ${E}/><path d="M46 52 l56 -6 M48 66 l40 -4" stroke="#2b2138" stroke-width="2"/><path d="M38 36 l-6 -8 M108 28 l6 -8" ${E}/><text x="58" y="88" font-size="11" font-weight="bold" fill="#2b2138">RATION</text>`,
  toile: `<path d="M30 40 q20 -14 44 -4 q26 -16 46 2 l-6 52 q-20 10 -40 0 q-24 12 -40 -4z" fill="#a69f86" ${E}/><path d="M70 48 q14 10 6 26 q-10 10 -20 -2" fill="#3a3340"/><path d="M96 54 q6 6 0 14" stroke="#2b2138" stroke-width="2" fill="none"/>`,
}

export class VueTri {
  private etat: EtatTri | null = null
  private boucle = 0
  private elChrono: HTMLElement
  private elSerie: HTMLElement
  private elGain: HTMLElement
  private elObjet: HTMLElement
  private elFin: HTMLElement

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span>TRI · ÉPAVE D'ENTRAÎNEMENT</span><button type="button" data-terminer>TERMINER</button></div>
      <div class="corps">
        <div class="tableau-tri"><span class="chrono"><i></i></span><b class="serie"></b><b class="gain"></b></div>
        <div class="tapis"><div class="objet"></div></div>
        <div class="bacs">${BACS.map((b) => `<button type="button" data-bac="${b.bac}" style="background:${b.teinte}">${b.titre}</button>`).join('')}</div>
        <p class="note">Jette chaque objet dans le bon bac, le plus vite possible. Sans erreur, la série monte (jusqu'à ×5).</p>
      </div>
      <div class="fin-combat" hidden></div>`
    this.elChrono = element.querySelector('.chrono i')!
    this.elSerie = element.querySelector('.serie')!
    this.elGain = element.querySelector('.gain')!
    this.elObjet = element.querySelector('.objet')!
    this.elFin = element.querySelector('.fin-combat')!
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!b) return
      if (b.dataset.fermer !== undefined || b.dataset.terminer !== undefined) { this.fermer(); return }
      if (b.dataset.rejouer !== undefined) { this.ouvrir(); return }
      if (b.dataset.bac !== undefined && this.etat) this.jeter(b.dataset.bac as Bac, b)
    })
  }

  /** Commence le tri d'une épave d'entraînement. */
  ouvrir(): void {
    const t = Date.now()
    this.etat = nouveauTri((t % 2147483647) >>> 0, t)
    this.elFin.hidden = true
    this.montrerObjet('')
    this.element.hidden = false
    cancelAnimationFrame(this.boucle)
    const image = () => {
      if (this.element.hidden) return
      this.dessiner()
      this.boucle = requestAnimationFrame(image)
    }
    image()
  }

  fermer(): void {
    this.element.hidden = true
    cancelAnimationFrame(this.boucle)
    this.etat = null
  }

  private jeter(bac: Bac, bouton: HTMLElement): void {
    const r = trier(this.etat!, bac, Date.now())
    if (r === 'fini') return
    // Bien trié : l'objet suivant arrive ; mal trié : le bac tremble et le téléphone vibre.
    this.montrerObjet(r === 'juste' ? 'arrive' : 'rate')
    bouton.classList.remove('bon', 'mauvais')
    void bouton.offsetWidth
    bouton.classList.add(r === 'juste' ? 'bon' : 'mauvais')
    if (r === 'faux') navigator.vibrate?.(120)
  }

  private montrerObjet(animation: string): void {
    const o = OBJETS_EPAVE[this.etat!.objet]
    this.elObjet.className = `objet ${animation}`
    this.elObjet.innerHTML = `<svg viewBox="0 0 150 120">${DESSINS[o.dessin]}</svg><b>${o.nom}</b>`
  }

  private dessiner(): void {
    const e = this.etat
    if (!e) return
    const reste = resteTri(e, Date.now())
    this.elChrono.style.width = `${(100 * reste) / DUREE_TRI}%`
    this.elChrono.parentElement!.dataset.secondes = `${Math.ceil(reste / 1000)} s`
    this.elSerie.textContent = `série ×${e.serie}`
    this.elGain.textContent = `${e.gain} cr.`
    if (reste === 0 && this.elFin.hidden) {
      const tries = Object.values(e.tries).reduce((a, b) => a + b, 0)
      this.elFin.innerHTML = `<div class="carte-fin"><b>ÉPAVE VIDÉE</b><p>${tries} objet${tries > 1 ? 's' : ''} bien trié${tries > 1 ? 's' : ''}`
        + `, ${e.erreurs} erreur${e.erreurs > 1 ? 's' : ''} · <b>${e.gain} cr.</b></p><ul class="bilan">`
        + BACS.map((b) => `<li><span class="pastille" style="background:${b.teinte}"></span>${b.titre}<b>${e.tries[b.bac]}</b></li>`).join('')
        + '</ul><p class="petit">Entraînement : rien n\'est versé à ta capsule.</p>'
        + '<div class="boutons-fin"><button type="button" data-rejouer>REJOUER</button><button type="button" class="principal" data-fermer>FERMER</button></div></div>'
      this.elFin.hidden = false
    }
  }
}
