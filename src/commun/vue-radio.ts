// Le poste radio de la capsule (décisions d'Adrien du 20/10/2026), en plein écran : un vieux poste TSF des années 50.
// Bande OC : on cherche les Voix perdues. Le cadran (on le touche pour s'y placer), la molette (on la fait glisser pour
// régler finement), le vumètre, et l'écran où la voix s'écrit, d'autant plus lisible qu'elle est nette ; calé net,
// l'enregistrement avance. Du bruit blanc qui s'éclaircit à l'approche d'une voix (on peut couper le son). Bande FM :
// les groupes de joueurs, avec le serveur. La vue ne décide rien : le moteur (moteur/radio.ts) dit ce qu'on capte.

import { BANDE_OC } from '../donnees/radio'
import type { Voix } from '../moteur/radio'
import type { TexteVoix } from '../donnees/radio'

/** Ce que la vue demande au jeu, à chaque image. */
export interface SourceRadio {
  frequence(): number
  regler(f: number): void
  /** On écoute maintenant : ce qu'on capte, son texte, l'enregistrement (0 à 1), et une voix tout juste enregistrée. */
  ecouter(): { voix: Voix | null; texte: TexteVoix | null; nettete: number; enregistrement: number; dejaEnregistree: boolean; nouvelle: boolean; systeme: string | null }
}

const CLE_SON = 'andromeda-radio-son'
const BRUIT = '·:;,.~-_=+*°'
/** Largeur du cadran (unités du viewBox). */
const CADRAN = { l: 14, r: 346, larg: 360, haut: 64 }

export class VueRadio {
  private ouverte = false
  private son = (() => { try { return localStorage.getItem(CLE_SON) !== 'non' } catch { return true } })()
  private audio: { ctx: AudioContext; bruit: GainNode; voix: GainNode; osc: OscillatorNode } | null = null
  private glisse: { x: number; f: number } | null = null
  private annonce = 0

  constructor(private element: HTMLElement, private source: SourceRadio) {
    element.innerHTML = `
      <div class="entete-plein"><span>Radio</span><button type="button" data-fermer>FERMER</button></div>
      <div class="corps"><div class="poste">
        <div class="bandes"><button type="button" class="actif">OC · VOIX PERDUES</button><button type="button" disabled>FM · GROUPES<small>avec les autres joueurs</small></button></div>
        <svg class="cadran" viewBox="0 0 ${CADRAN.larg} ${CADRAN.haut}" role="img" aria-label="Cadran des fréquences">${this.graduations()}<g class="aiguille"><line y1="6" y2="58"/></g></svg>
        <div class="reglage">
          <div class="lecture"><b class="frequence"></b><small>MHz</small></div>
          <svg class="vumetre" viewBox="0 0 100 60" aria-label="Netteté du signal"><path class="arc" d="M10 52a42 42 0 0 1 80 0"/><path class="zone-nette" d="M74 22a42 42 0 0 1 16 30"/><line class="aiguille-vu" x1="50" y1="54" x2="50" y2="14"/><circle cx="50" cy="54" r="3.5"/></svg>
        </div>
        <div class="molette" aria-label="Molette de réglage fin : glisse le doigt"><span>‹</span><div class="stries"></div><span>›</span></div>
        <div class="ecran-radio"><div class="tete-voix"></div><p class="texte-voix"></p><div class="enregistrement"><i></i><span></span></div></div>
        <button type="button" class="son" data-son></button>
      </div></div>`
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (b?.dataset.fermer !== undefined) this.fermer()
      else if (b?.dataset.son !== undefined) { this.son = !this.son; try { localStorage.setItem(CLE_SON, this.son ? 'oui' : 'non') } catch { /* rien */ } this.reglerSon(0, false) }
    })
    // Le cadran : on touche (ou glisse) pour placer l'aiguille.
    const cadran = element.querySelector<SVGSVGElement>('.cadran')!
    const placer = (ev: PointerEvent) => {
      const r = cadran.getBoundingClientRect()
      const x = ((ev.clientX - r.left) / r.width) * CADRAN.larg
      this.source.regler(BANDE_OC.min + ((x - CADRAN.l) / (CADRAN.r - CADRAN.l)) * (BANDE_OC.max - BANDE_OC.min))
    }
    cadran.addEventListener('pointerdown', (ev) => { cadran.setPointerCapture(ev.pointerId); placer(ev) })
    cadran.addEventListener('pointermove', (ev) => { if (ev.buttons || ev.pointerType === 'touch') placer(ev) })
    // La molette : glisser de côté règle au millième de MHz près (un pixel : un millième).
    const molette = element.querySelector<HTMLElement>('.molette')!
    molette.addEventListener('pointerdown', (ev) => { molette.setPointerCapture(ev.pointerId); this.glisse = { x: ev.clientX, f: this.source.frequence() } })
    molette.addEventListener('pointermove', (ev) => { if (this.glisse) this.source.regler(this.glisse.f + (ev.clientX - this.glisse.x) * 0.001) })
    for (const fin of ['pointerup', 'pointercancel']) molette.addEventListener(fin, () => { this.glisse = null })
  }

  private graduations(): string {
    let g = '<rect class="verre" x="2" y="2" width="356" height="60" rx="8"/>'
    for (let f = BANDE_OC.min; f <= BANDE_OC.max + 1e-9; f += 0.1) {
      const x = CADRAN.l + ((f - BANDE_OC.min) / (BANDE_OC.max - BANDE_OC.min)) * (CADRAN.r - CADRAN.l)
      const entier = Math.abs(f - Math.round(f)) < 1e-6, demi = Math.abs(f * 2 - Math.round(f * 2)) < 1e-6
      g += `<line class="trait" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${entier ? 34 : demi ? 40 : 44}" y2="52"/>`
      if (entier) g += `<text x="${x.toFixed(1)}" y="26" text-anchor="middle">${Math.round(f)}</text>`
    }
    return g
  }

  ouvrir(): void {
    this.ouverte = true
    this.element.hidden = false
    // Le son ne peut démarrer qu'après un geste du joueur : c'est le cas ici (il a touché le bouton RADIO).
    if (!this.audio) {
      try {
        const ctx = new AudioContext()
        const tampon = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
        const d = tampon.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
        const bruit = ctx.createBufferSource()
        bruit.buffer = tampon
        bruit.loop = true
        const filtre = ctx.createBiquadFilter()
        filtre.type = 'bandpass'
        filtre.frequency.value = 1800
        filtre.Q.value = 0.6
        const gBruit = ctx.createGain(), gVoix = ctx.createGain()
        gBruit.gain.value = 0
        gVoix.gain.value = 0
        bruit.connect(filtre).connect(gBruit).connect(ctx.destination)
        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = 520
        osc.connect(gVoix).connect(ctx.destination)
        bruit.start()
        osc.start()
        this.audio = { ctx, bruit: gBruit, voix: gVoix, osc }
      } catch { this.audio = null }
    } else void this.audio.ctx.resume()
    this.afficher()
  }

  fermer(): void {
    this.ouverte = false
    this.element.hidden = true
    this.reglerSon(0, false)
    void this.audio?.ctx.suspend()
  }

  /** À chaque image, tant que le poste est ouvert : on écoute, on montre. Renvoie vrai si une voix vient d'être enregistrée. */
  afficher(): boolean {
    if (!this.ouverte) return false
    const f = this.source.frequence(), e = this.source.ecouter()
    const x = CADRAN.l + ((f - BANDE_OC.min) / (BANDE_OC.max - BANDE_OC.min)) * (CADRAN.r - CADRAN.l)
    this.element.querySelector<SVGGElement>('.aiguille')!.setAttribute('transform', `translate(${x.toFixed(2)} 0)`)
    this.element.querySelector('.frequence')!.textContent = f.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    // Le vumètre : la netteté, et un peu de tremblement du bruit.
    const tremble = (Math.random() - 0.5) * 0.08 * (1 - e.nettete)
    const angle = -70 + 140 * Math.max(0, Math.min(1, e.nettete * 0.95 + 0.05 + tremble))
    this.element.querySelector('.aiguille-vu')!.setAttribute('transform', `rotate(${angle.toFixed(1)} 50 54)`)
    // L'écran : la voix, brouillée selon sa netteté ; sinon, de la friture.
    const tete = this.element.querySelector<HTMLElement>('.tete-voix')!, texte = this.element.querySelector<HTMLElement>('.texte-voix')!
    if (!e.systeme) { tete.textContent = 'EN PLEIN ESPACE'; texte.textContent = 'Rien que le souffle du Soleil. Les voix se cachent dans les systèmes des planètes.' }
    else if (e.texte && e.nettete > 0) {
      tete.textContent = e.nettete > 0.6 ? `${e.texte.auteur} · ${e.texte.lieu} · jour ${e.texte.jour}` : brouiller(`${e.texte.auteur} · ${e.texte.lieu}`, e.nettete)
      texte.textContent = brouiller(e.texte.texte, e.nettete)
    } else { tete.textContent = `BANDE OC · SYSTÈME ${e.systeme === 'Terre' ? 'DE LA TERRE' : `DE ${e.systeme.toUpperCase()}`}`; texte.textContent = brouiller('', 0, 90) }
    const barre = this.element.querySelector<HTMLElement>('.enregistrement')!
    barre.classList.toggle('actif', e.enregistrement > 0)
    barre.querySelector('i')!.style.width = `${Math.round(e.enregistrement * 100)}%`
    barre.querySelector('span')!.textContent = e.dejaEnregistree ? 'DÉJÀ DANS TON CARNET' : e.enregistrement > 0 ? 'ENREGISTREMENT…' : ''
    if (e.nouvelle) this.annonce = performance.now()
    this.element.querySelector('.ecran-radio')!.classList.toggle('flash', performance.now() - this.annonce < 1500)
    this.reglerSon(e.nettete, !!e.voix)
    this.element.querySelector('[data-son]')!.textContent = this.son ? 'SON : OUI' : 'SON : NON'
    return e.nouvelle
  }

  private reglerSon(nettete: number, voix: boolean): void {
    if (!this.audio) return
    const t = this.audio.ctx.currentTime
    const on = this.son && this.ouverte
    this.audio.bruit.gain.setTargetAtTime(on ? 0.05 + 0.12 * (1 - nettete) : 0, t, 0.05)
    // La « voix » : un chant modulé qui monte avec la netteté (une voix sans mots, le jeu sera traduit).
    this.audio.osc.frequency.setTargetAtTime(420 + 180 * Math.sin(t * 7) + 60 * Math.sin(t * 2.3), t, 0.02)
    this.audio.voix.gain.setTargetAtTime(on && voix ? 0.06 * nettete * (0.6 + 0.4 * Math.abs(Math.sin(t * 5))) : 0, t, 0.05)
  }
}

/** Un texte brouillé : chaque lettre a d'autant plus de chances d'être de la friture que la voix est floue. */
function brouiller(texte: string, nettete: number, longueur = texte.length): string {
  let s = ''
  const instant = Math.floor(performance.now() / 120)
  for (let i = 0; i < longueur; i++) {
    const c = texte[i] ?? ' '
    const h = Math.abs(Math.sin(i * 12.9898 + instant * 78.233) * 43758.5453) % 1
    s += c === ' ' && texte ? ' ' : h > nettete * 1.05 ? BRUIT[Math.floor(h * 97) % BRUIT.length] : c
  }
  return s
}
