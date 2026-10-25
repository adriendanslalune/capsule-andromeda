// Le tri des matériaux d'une épave (étape 5, mini-jeu des Nettoyeurs ; prototype, d'après la maquette validée le
// 18/10/2026), en plein écran par-dessus la carte : un objet sort de l'épave, on le jette dans le bon bac (quatre
// gros boutons à portée du pouce) ; la série monte tant qu'on ne se trompe pas. La vue ne décide rien : elle montre
// l'état du tri que tient le moteur (moteur/tri.ts).

import { BACS, DUREE_TRI, OBJETS_EPAVE, type Bac } from '../donnees/tri'
import { imageEpave } from '../carte/epaves'
import { nouveauTri, objetsTries, resteTri, tonnesTriees, trier, type EtatTri } from '../moteur/tri'

/** Un tri : son titre, et ce qu'on fait des matériaux à la fin (en mission : la soute ; le texte du bilan). */
export interface OptionsTri { titre: string; surFin?: (e: EtatTri) => string; /** Le nom de l'épave (sa sorte, son image). */ epave?: string }
export const ENTRAINEMENT: OptionsTri = { titre: 'ÉPAVE D\'ENTRAÎNEMENT' }

const tonnes = (q: number) => `${q.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`

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
  cle: `<g transform="rotate(-30 75 60)"><rect x="66" y="40" width="18" height="66" rx="6" fill="#c9c2b0" ${E}/><path d="M56 16 h38 v26 h-10 v-12 h-18 v12 h-10z" fill="#c9c2b0" ${E}/><circle cx="75" cy="94" r="4" fill="#2b2138"/></g>`,
  ressort: `<path d="M40 30 ${[0, 1, 2, 3, 4, 5].map((k) => `q35 ${k % 2 ? -10 : 10} 70 ${8 - (k % 2) * 16 + 10}`).join(' ')}" fill="none" stroke="#2b2138" stroke-width="7" stroke-linecap="round"/><path d="M40 30 ${[0, 1, 2, 3, 4, 5].map((k) => `q35 ${k % 2 ? -10 : 10} 70 ${8 - (k % 2) * 16 + 10}`).join(' ')}" fill="none" stroke="#c9c2b0" stroke-width="3.5" stroke-linecap="round"/>`,
  tole: `<path d="M24 40 q20 -12 40 0 q20 12 40 -4 q12 -8 22 2 l-4 50 q-14 10 -30 0 q-20 -10 -40 4 q-16 8 -26 -4z" fill="#a69f86" ${E}/><path d="M50 52 q8 18 -4 30 M86 48 q-6 16 6 30" stroke="#2b2138" stroke-width="1.6" fill="none"/>`,
  fil: `<path d="M30 80 q10 -60 40 -30 q30 30 20 -20 q-6 -24 26 -8 q20 12 4 40 q-14 22 -40 10" fill="none" stroke="#2b2138" stroke-width="7" stroke-linecap="round"/><path d="M30 80 q10 -60 40 -30 q30 30 20 -20 q-6 -24 26 -8 q20 12 4 40 q-14 22 -40 10" fill="none" stroke="#d9694f" stroke-width="4" stroke-linecap="round"/>`,
  transistor: `<path d="M50 70 v-30 q0 -14 25 -14 q25 0 25 14 v30z" fill="#3a3340" ${E}/><path d="M60 70 v30 M75 70 v34 M90 70 v30" ${E}/><path d="M60 70 v30 M75 70 v34 M90 70 v30" stroke="#c9c2b0" stroke-width="1.5"/><text x="61" y="56" font-size="10" font-weight="bold" fill="#faf2dc">2N3</text>`,
  condensateur: `<rect x="52" y="22" width="46" height="64" rx="8" fill="#3f63c4" ${E}/><path d="M52 34 h46" stroke="#faf2dc" stroke-width="3"/><path d="M66 86 v20 M84 86 v20" ${E}/><text x="62" y="64" font-size="12" font-weight="bold" fill="#faf2dc">47µ</text>`,
  bande: `<circle cx="48" cy="60" r="26" fill="#3a3340" ${E}/><circle cx="102" cy="60" r="26" fill="#3a3340" ${E}/><circle cx="48" cy="60" r="6" fill="#faf2dc" ${E}/><circle cx="102" cy="60" r="6" fill="#faf2dc" ${E}/><path d="M48 86 h54" stroke="#7d4f2a" stroke-width="4"/>`,
  micro: `<rect x="56" y="16" width="38" height="52" rx="19" fill="#c9c2b0" ${E}/>${[0, 1, 2, 3].map((k) => `<path d="M60 ${28 + k * 9} h30" stroke="#2b2138" stroke-width="1.5"/>`).join('')}<path d="M48 52 q0 30 27 30 q27 0 27 -30 M75 82 v18 M58 102 h34" fill="none" ${E}/>`,
  miroir: `<ellipse cx="75" cy="60" rx="46" ry="38" fill="#d7cdee" ${E}/><ellipse cx="75" cy="60" rx="34" ry="27" fill="#e8f1f2" ${E}/><path d="M56 48 q10 -10 24 -8" stroke="#fffaf0" stroke-width="4" fill="none"/>`,
  ampoule: `<path d="M75 14 q30 0 30 32 q0 18 -14 30 v10 h-32 v-10 q-14 -12 -14 -30 q0 -32 30 -32z" fill="#fff3a8" ${E}/><path d="M68 70 l4 -22 l6 10 l6 -10 l2 22" stroke="#d9694f" stroke-width="2" fill="none"/><rect x="59" y="86" width="32" height="18" rx="3" fill="#a69f86" ${E}/>`,
  bocal: `<rect x="44" y="30" width="62" height="72" rx="10" fill="#bfe0e8" ${E}/><rect x="50" y="18" width="50" height="14" rx="3" fill="#d9a43a" ${E}/><path d="M48 70 q27 -10 54 0 v24 q0 6 -6 6 h-42 q-6 0 -6 -6z" fill="#8fcf98"/><rect x="58" y="44" width="34" height="14" fill="#faf2dc" ${E}/>`,
  chaussette: `<path d="M58 14 h32 v52 q0 10 10 14 q20 8 14 22 q-6 10 -26 4 l-34 -14 q-10 -6 -6 -20 q10 -20 10 -30z" fill="#e8b9c9" ${E}/><path d="M58 26 h32 M58 34 h32" stroke="#d9694f" stroke-width="3"/>`,
  sac: `<path d="M42 44 q-8 50 14 60 h38 q22 -10 14 -60 q-10 -10 -33 -10 q-23 0 -33 10z" fill="#3a3340" ${E}/><path d="M64 34 q10 -18 22 0 l-6 8 l-10 0z" fill="#3a3340" ${E}/><path d="M60 60 q8 6 4 16" stroke="#7d6a9e" stroke-width="2" fill="none"/>`,
  adhesif: `<circle cx="70" cy="60" r="34" fill="#c9c2b0" ${E}/><circle cx="70" cy="60" r="16" fill="#efe2c4" ${E}/><path d="M100 72 l26 10 l-6 14 l-26 -10" fill="#c9c2b0" ${E}/>`,
}

export class VueTri {
  private etat: EtatTri | null = null
  private options: OptionsTri = ENTRAINEMENT
  private fini = false
  private boucle = 0
  private elChrono: HTMLElement
  private elSerie: HTMLElement
  private elGain: HTMLElement
  private elObjet: HTMLElement
  private elFin: HTMLElement

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-tri"></span><button type="button" data-terminer>TERMINER</button></div>
      <div class="corps">
        <div class="tableau-tri"><span class="chrono"><i></i></span><b class="serie"></b><b class="gain"></b></div>
        <img class="epave-tri" alt="">
        <div class="tapis"><div class="objet"></div></div>
        <div class="bacs">${BACS.map((b) => `<button type="button" data-bac="${b.bac}" style="background:${b.teinte}">${b.titre}</button>`).join('')}</div>
        <p class="note">Jette chaque objet dans le bon bac, le plus vite possible. Sans erreur, la série monte (jusqu'à ×5) : tu récupères plus de matériaux. Le rebut ne se vend pas.</p>
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
      if (b.dataset.fermer !== undefined) { this.fermer(); return }
      // TERMINER avant la fin : le tri s'arrête là (en mission, avec ce qui a déjà été trié).
      if (b.dataset.terminer !== undefined) { if (this.etat && !this.fini) this.terminer(); else this.fermer(); return }
      if (b.dataset.rejouer !== undefined) { this.ouvrir(this.options); return }
      if (b.dataset.bac !== undefined && this.etat) this.jeter(b.dataset.bac as Bac, b)
    })
  }

  /** Commence le tri d'une épave (d'entraînement, si rien n'est précisé). */
  ouvrir(options: OptionsTri = ENTRAINEMENT): void {
    this.options = options
    const t = Date.now()
    this.etat = nouveauTri((t % 2147483647) >>> 0, t)
    this.fini = false
    this.element.querySelector('.titre-tri')!.textContent = `TRI · ${this.options.titre}`
    // L'épave qu'on vide, au-dessus du tapis d'où sortent les objets (Adrien, 25/10/2026).
    this.element.querySelector<HTMLImageElement>('.epave-tri')!.src = imageEpave(options.epave ?? 'Satellite mort')
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
    this.elGain.textContent = tonnes(tonnesTriees(e))
    if (reste === 0 && !this.fini) this.terminer()
  }

  /** Fin du tri : le bilan (et, en mission, les matériaux vont dans la soute). */
  private terminer(): void {
    const e = this.etat!
    this.fini = true
    const n = objetsTries(e)
    const suite = this.options.surFin ? this.options.surFin(e) : 'Entraînement : rien n\'est versé à ta capsule.'
    const materiaux = Object.entries(e.materiaux)
    this.elFin.innerHTML = `<div class="carte-fin"><b>ÉPAVE VIDÉE</b><p>${n} objet${n > 1 ? 's' : ''} bien trié${n > 1 ? 's' : ''}`
      + `, ${e.erreurs} erreur${e.erreurs > 1 ? 's' : ''} · <b>${tonnes(tonnesTriees(e))}</b></p><ul class="bilan">`
      + (materiaux.length ? materiaux.map(([m, q]) => `<li>${m}<b>${tonnes(q)}</b></li>`).join('') : '<li>Aucun matériau récupéré</li>')
      + `</ul><p class="petit">${suite}</p>`
      + `<div class="boutons-fin">${this.options.surFin ? '' : '<button type="button" data-rejouer>REJOUER</button>'}<button type="button" class="principal" data-fermer>FERMER</button></div></div>`
    this.elFin.hidden = false
  }
}
