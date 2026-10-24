// Le dialogue avec un PNJ (décisions d'Adrien du 20/10/2026), en plein écran par-dessus la carte, en case de BD (maquette
// maquette-dialogue.html, validée par Adrien le 24/10/2026) : le PNJ devant le décor de son lieu, son nom dans un
// cartouche ; ce qu'il dit dans un phylactère qui s'écrit lettre à lettre, page par page, son visage selon la page
// (« (joie) … », « (souci) … ») ; par radio, la case grésille ; au bout, ACCEPTER (un coup de tampon) / PLUS TARD s'il
// propose une quête, sinon FERMER. Dialogues linéaires (sans choix à conséquences) pour commencer. La vue ne décide rien : le moteur (moteur/quetes.ts) dit ce que dit le PNJ.

import type { Dialogue } from '../moteur/quetes'
import { decorDe, portraitDe, type Humeur } from './portraits'

/** Ce qu'on fait au bout du dialogue : accepter la quête proposée (renvoie vrai si c'est fait). */
export interface OptionsDialogue { joueur: () => string; accepter: (id: string) => boolean; ferme?: (d: Dialogue) => void }

/** « 1 s », « 3 min », « 4 h 10 » : le délai de la lumière. */
function texteDelai(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Le médaillon d'un PNJ : son portrait, ou son initiale sur sa couleur. */
export function medaillon(p: Dialogue['pnj'], classe = 'medaillon'): string {
  return p.portrait
    ? `<img class="${classe}" src="${p.portrait}" alt="${echapper(p.nom)}">`
    : `<span class="${classe}" style="background:${p.teinte}">${echapper(p.nom.replace(/^(Dr|Le|La) /, '')[0])}</span>`
}

/** L'humeur d'une page (« (joie) Deux fois plus vite ! ») et son texte ; neutre par défaut. */
function humeurDe(page: string): { humeur: Humeur; texte: string } {
  const m = /^\((neutre|joie|souci)\)\s*/.exec(page)
  return m ? { humeur: m[1] as Humeur, texte: page.slice(m[0].length) } : { humeur: 'neutre', texte: page }
}

/** La fréquence d'un PNJ à la radio (la même à chaque appel), pour le voyant de la case. */
function frequence(id: string): string {
  let h = 7
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 9973
  return `${(100 + (h % 400) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1 })} MHz`
}

const QUEUE = '<svg class="queue" viewBox="0 0 44 28" aria-hidden="true"><path d="M6,28 L22,0 L30,28" fill="#fffbf2" stroke="#2b2230" stroke-width="2.5" stroke-linejoin="round"/><path d="M8,27.5 L29,27.5" stroke="#fffbf2" stroke-width="4"/></svg>'
const ECLAIR = '<svg class="queue" viewBox="0 0 44 28" aria-hidden="true"><path d="M4,28 L18,12 L12,12 L26,-2 L22,10 L30,10 L18,28" fill="#fffbf2" stroke="#2b2230" stroke-width="2.5" stroke-linejoin="round"/><path d="M6,27.5 L19,27.5" stroke="#fffbf2" stroke-width="4"/></svg>'

export class VueDialogue {
  private dialogue: Dialogue | null = null
  private page = 0
  private ecriture = 0
  private accepte = false

  constructor(private element: HTMLElement, private options: OptionsDialogue) {
    element.addEventListener('click', (e) => {
      if (!this.dialogue || this.accepte) return
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      // Toucher la bulle l'écrit d'un coup.
      if (!b) { if ((e.target as HTMLElement).closest('.phylactere')) this.toutEcrire(); return }
      if (b.dataset.suite !== undefined) { this.page++; this.afficher(); return }
      if (b.dataset.accepter !== undefined && this.dialogue.proposition && this.options.accepter(this.dialogue.proposition.id)) {
        // Le coup de tampon, puis on referme.
        this.accepte = true
        element.querySelector('.tampon')?.classList.add('pan')
        setTimeout(() => { this.accepte = false; this.fermer() }, 1100)
        return
      }
      this.fermer()
    })
  }

  ouvrir(d: Dialogue): void {
    this.dialogue = d
    this.page = 0
    this.afficher()
  }

  fermer(): void {
    const d = this.dialogue
    this.dialogue = null
    clearInterval(this.ecriture)
    this.element.hidden = true
    if (d) this.options.ferme?.(d)
  }

  get ouvert(): boolean { return !!this.dialogue }

  private texte = ''
  private toutEcrire(): void {
    clearInterval(this.ecriture)
    const p = this.element.querySelector('.phylactere p')
    if (p) p.textContent = this.texte
  }

  private afficher(): void {
    const d = this.dialogue!, p = d.pnj
    const derniere = this.page >= d.pages.length - 1
    const { humeur, texte } = humeurDe(d.pages[Math.min(this.page, d.pages.length - 1)])
    this.texte = texte.replaceAll('{joueur}', this.options.joueur())
    let boutons = ''
    if (!derniere) boutons = '<button type="button" class="principal" data-suite>CONTINUER ›</button>'
    else if (d.proposition) boutons = '<button type="button" data-fermer>PLUS TARD</button><button type="button" class="principal" data-accepter>ACCEPTER</button>'
    else boutons = '<button type="button" class="principal" data-fermer>FERMER</button>'
    const q = d.proposition ?? d.terminee ?? d.nouvelle
    const bande = q ? `<div class="type-quete ${q.type}">${q.type === 'principale' ? '◆ QUÊTE PRINCIPALE' : '● QUÊTE SECONDAIRE'} · ${echapper(q.titre)}</div>` : ''
    const fin = d.terminee && derniere ? `<div class="recompense">Quête terminée · <b>+${d.terminee.recompense.toLocaleString('fr-FR')} crédits</b>${d.terminee.libere ? ` · <b>${echapper(d.terminee.libere)} libérée !</b>` : ''}</div>` : ''
    // Un message radio : il vient de loin, avec le délai de la lumière (Adrien, 22/10/2026 : plus d'allers-retours) ; la
    // case grésille et la queue de la bulle devient un éclair.
    const recitatif = d.radio ? `Par radio · depuis ${echapper(p.lieu)}${d.radio.delai >= 1000 ? ` · ${texteDelai(d.radio.delai)} de lumière` : ''}` : `En orbite · ${echapper(p.lieu)}`
    const image = portraitDe(p.id, humeur) || medaillon(p, 'portrait')
    this.element.innerHTML = `${bande}
      <div class="case${d.radio ? ' radio' : ''}" style="--teinte:${p.teinte}">${decorDe(p.id)}${image}
        <div class="recitatif">${recitatif}</div>
        ${d.radio ? `<div class="frequence"><i></i>${frequence(p.id)}</div><div class="balayage"></div>` : ''}
        <div class="nom"><b>${echapper(p.nom)}</b><small>${echapper(p.role)}</small></div>
      </div>
      <div class="phylactere">${d.radio ? ECLAIR : QUEUE}<p></p>
        <div class="pied"><div class="pages">${d.pages.map((_, k) => `<i class="${k <= this.page ? 'vue' : ''}"></i>`).join('')}</div><small>${this.page + 1}/${d.pages.length}</small></div></div>
      ${fin}
      <div class="boutons-dialogue">${boutons}</div>
      <div class="tampon">Quête acceptée !</div>`
    this.element.hidden = false
    // Le texte s'écrit lettre à lettre.
    const el = this.element.querySelector('.phylactere p')!
    let n = 0
    clearInterval(this.ecriture)
    this.ecriture = window.setInterval(() => {
      n += 2
      el.innerHTML = echapper(this.texte.slice(0, n)) + (n < this.texte.length ? '<span class="curseur"></span>' : '')
      if (n >= this.texte.length) clearInterval(this.ecriture)
    }, 22)
  }
}
