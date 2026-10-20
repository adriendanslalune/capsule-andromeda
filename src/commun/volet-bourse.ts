// La Bourse (onglet du volet Marché ; décisions d'Adrien du 20/10/2026) : des actions de neuf compagnies, aux cours
// les mêmes pour tous. En haut, le portefeuille en direct (ce qu'il vaut, le gain ou la perte) et les ordres en route ;
// puis la compagnie choisie : son cours connu (avec l'âge que lui donne la lumière venue de son siège), un graphique
// façon trading dont la fin, hachurée, est « en route », ce qu'on en a, ACHETER et VENDRE, et le fil des ordres des
// bots ; enfin toutes les compagnies. Un ordre part à la vitesse de la lumière et s'exécute au cours de son arrivée.
// Le doigt posé sur le graphique lit le cours à un instant. La vue ne calcule rien : tout vient de moteur/bourse.ts.

import { COMPAGNIES, FRAIS_BOURSE, MONTANTS_ACHAT, PARTS_VENTE } from '../donnees/bourse'
import { compagnie, historiqueAction, ordresDesBots, valeurPortefeuille, vueAction, type OrdreBourse, type Portefeuille } from '../moteur/bourse'
import { avec } from './symboles'
import { texteRestant } from './textes'

/** Âge des cours, lisible : « 1,3 s », « 12 min 48 s », « 4 h 05 min ». */
export function texteDelai(ms: number): string {
  const s = ms / 1000
  if (s < 60) return `${s.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${String(Math.round(s % 60)).padStart(2, '0')} s`
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
}

const HEURE = 3_600_000
const PERIODES = [{ nom: '6 H', duree: 6 * HEURE }, { nom: '24 H', duree: 24 * HEURE }, { nom: '7 J', duree: 7 * 24 * HEURE }]
/** Le graphique : zone de tracé (unités du viewBox). */
const G = { l: 6, r: 314, h: 14, b: 168, larg: 360, haut: 196 }

const prix = (c: number) => c.toLocaleString('fr-FR', { maximumFractionDigits: c < 20 ? 2 : c < 100 ? 1 : 0 })
const entier = (c: number) => Math.round(c).toLocaleString('fr-FR')
const actions = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: n < 10 ? 2 : 1 })
const pourcent = (v: number) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
const heure = (t: number, jours: boolean) => new Date(t).toLocaleString('fr-FR', jours ? { day: '2-digit', month: '2-digit' } : { hour: '2-digit', minute: '2-digit' })
const sens = (v: number) => (v >= 0 ? 'hausse' : 'baisse')

/** Un ordre du joueur : acheter pour tant de crédits, ou vendre une part de ses actions. */
export type OrdreAction = { compagnie: string; sens: 'acheter' | 'vendre'; quantite: number }

/** Ce que le volet doit savoir du joueur. */
export interface EtatBourse { portefeuille: Portefeuille; credits: number }

export class VoletBourse {
  private dernier = ''
  /** Compagnie choisie (son id), ou null : la première du portefeuille (sinon la Terre). */
  private choisie: string | null = null
  private periode = 1
  private curseur: number | null = null
  private points: { t: number; cours: number; x: number; y: number }[] = []

  constructor(private element: HTMLElement, private rafraichir: () => void, private ordonner: (o: OrdreAction) => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!b || b.disabled) return
      if (b.dataset.ordre) { this.ordonner({ compagnie: b.dataset.compagnie!, sens: b.dataset.ordre as OrdreAction['sens'], quantite: Number(b.dataset.quantite) }); return }
      if (b.dataset.action !== undefined) this.choisie = b.dataset.action
      else if (b.dataset.periode !== undefined) this.periode = Number(b.dataset.periode)
      else return
      this.rafraichir()
      if (b.dataset.action !== undefined) this.element.querySelector('.tete-cours')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
    const lire = (e: PointerEvent) => {
      const svg = (e.target as Element).closest('svg.graphique')
      if (!svg) return
      const r = svg.getBoundingClientRect()
      this.curseur = Math.max(0, Math.min(1, (((e.clientX - r.left) / r.width) * G.larg - G.l) / (G.r - G.l)))
      this.dessinerCurseur()
    }
    element.addEventListener('pointerdown', lire)
    element.addEventListener('pointermove', (e) => { if (this.curseur !== null) lire(e) })
    for (const fin of ['pointerup', 'pointercancel', 'pointerleave']) element.addEventListener(fin, () => { this.curseur = null; this.dessinerCurseur() })
  }

  afficher(t: number, etat: EtatBourse): void {
    const p = etat.portefeuille
    const id = this.choisie ?? Object.keys(p.positions)[0] ?? 'vanguard'
    const c = compagnie(id)!, vue = vueAction(c, t)
    const pos = p.positions[id]

    // Le portefeuille : ce qu'il vaut aux cours connus, le gain ou la perte ; les ordres en route.
    const { valeur, investi } = valeurPortefeuille(p, t)
    let html = '<div class="portefeuille">'
    if (investi > 0) {
      const g = valeur - investi
      html += `<div class="ligne-portefeuille"><span><small>PORTEFEUILLE</small><b>${entier(valeur)} cr.</b></span>`
        + `<span class="${sens(g)}"><b>${g >= 0 ? '+' : '−'}${entier(Math.abs(g))} cr.</b><small>${pourcent(g / investi)}</small></span>`
        + `<span>${avec('credits', entier(etat.credits))}</span></div>`
    } else html += `<div class="ligne-portefeuille"><span><small>PORTEFEUILLE</small><b>aucune action</b></span><span>${avec('credits', entier(etat.credits))}</span></div>`
    html += p.ordres.map((o) => ligneOrdre(o, t)).join('')
    if (p.journal.length && !p.ordres.length) html += ligneOrdre(p.journal[0], t)
    html += '</div>'

    // La compagnie choisie : cours connu, variation, âge des cours.
    html += `<div class="tete-cours"><div><b>${c.nom}</b><small>${c.metier} · siège : ${c.siege}</small><small class="caractere">${c.caractere}</small></div>`
      + `<div class="droite"><b class="grand">${prix(vue.cours)}</b><small>cr. l'action</small>`
      + `<span class="${sens(vue.variation)}">${pourcent(vue.variation)} <small>24 h</small></span></div></div>`
    html += `<p class="age">Cours d'il y a <b>${texteDelai(vue.delai)}</b> : le temps que met la lumière pour venir de ${c.siege} jusqu'à ta capsule.</p>`
    html += `<div class="bloc graphe">${this.graphique(c.id, c.nom, c.teinte, t, vue.connuA)}<div class="periodes">`
      + PERIODES.map((q, i) => `<button type="button" data-periode="${i}"${i === this.periode ? ' class="actif"' : ''}>${q.nom}</button>`).join('') + '</div>'

    // Ce qu'on en a ; acheter, vendre.
    if (pos) {
      const vaut = pos.actions * vue.cours, g = vaut - pos.investi
      html += `<p class="position">Tu as <b>${actions(pos.actions)} action${pos.actions >= 2 ? 's' : ''}</b>, payées ${entier(pos.investi)} cr. · elles valent <b>${entier(vaut)} cr.</b> <span class="${sens(g)}">${pourcent(g / pos.investi)}</span></p>`
    }
    const bouton = (s: 'acheter' | 'vendre', q: number, texte: string, off: boolean) =>
      `<button type="button" data-ordre="${s}" data-compagnie="${c.id}" data-quantite="${q}"${off ? ' disabled' : ''}${s === 'vendre' ? ' class="principal"' : ''}>${texte}</button>`
    html += '<div class="commerce">'
      + `<div class="ligne-commerce"><span>ACHETER</span>${MONTANTS_ACHAT.map((m) => bouton('acheter', m, `${m}`, etat.credits < m)).join('')}${bouton('acheter', Infinity, 'MAX', etat.credits < 1)}</div>`
      + `<div class="ligne-commerce"><span>VENDRE</span>${PARTS_VENTE.map((f) => bouton('vendre', pos ? pos.actions * f : 0, f === 1 ? 'TOUT' : f === 0.5 ? '½' : '¼', !pos)).join('')}</div>`
      + `<p class="petit">Achat en crédits. Ton ordre mettra <b>${texteDelai(vue.delai)}</b> à arriver à ${c.siege} ; il s'exécutera au cours de ce moment-là. Frais : ${FRAIS_BOURSE * 100} % par ordre.</p></div></div>`

    // Le fil des ordres des bots (connus, eux aussi, avec le délai de la lumière).
    const bots = ordresDesBots(c, vue.connuA - 6 * HEURE, vue.connuA).slice(0, 6)
    if (bots.length) {
      html += '<h3>Derniers ordres</h3><div class="fil-ordres">' + bots.map((o) =>
        `<div><span>${heure(o.t, false)}</span><b>${o.bot}</b><span class="${o.achat ? 'hausse' : 'baisse'}">${o.achat ? 'achète' : 'vend'} ${o.actions.toLocaleString('fr-FR')}</span><span>à ${prix(o.prix)}</span></div>`).join('') + '</div>'
    }

    // Toutes les compagnies : courbe des dernières 24 h, cours connu, variation, ce qu'on en a.
    html += '<h3>Compagnies</h3><div class="liste-cours">' + COMPAGNIES.map((x) => {
      const v = vueAction(x, t)
      const h = historiqueAction(x, v.connuA - 24 * HEURE, v.connuA, 40)
      const lo = Math.min(...h.map((q) => q.cours)), hi = Math.max(...h.map((q) => q.cours))
      const pts = h.map((q, j) => `${((j / 40) * 70).toFixed(1)},${(20 - ((q.cours - lo) / (hi - lo || 1)) * 18).toFixed(1)}`).join(' ')
      const a = p.positions[x.id]
      return `<button type="button" data-action="${x.id}"${x.id === id ? ' class="actif"' : ''}>`
        + `<span class="pastille" style="background:${x.teinte}"></span><span class="nom">${x.nom}<small>${x.siege} · ${a ? `${actions(a.actions)} action${a.actions >= 2 ? 's' : ''}` : texteDelai(v.delai)}</small></span>`
        + `<svg class="mini" viewBox="0 0 70 22"><polyline points="${pts}"/></svg>`
        + `<span class="valeur">${prix(v.cours)}<small class="${sens(v.variation)}">${pourcent(v.variation)}</small></span></button>`
    }).join('') + '</div>'
    html += '<p class="note">Les cours sont les mêmes pour tous les capitaines. Les rumeurs du canal général annoncent parfois un gros mouvement… trois fois sur quatre, elles disent vrai.</p>'

    if (html === this.dernier) return
    this.element.innerHTML = this.dernier = html
    this.dessinerCurseur()
  }

  /** Le graphique du cours : ce qu'on sait, puis, hachuré, ce qui est encore « en route ». */
  private graphique(id: string, nom: string, teinte: string, t: number, connuA: number): string {
    const c = compagnie(id)!
    const p = PERIODES[this.periode]
    const debut = t - p.duree, finConnue = Math.max(debut, connuA)
    const serie = finConnue > debut ? historiqueAction(c, debut, finConnue, 120) : []
    const valeurs = serie.map((s) => s.cours)
    const min = Math.min(...valeurs), max = Math.max(...valeurs), marge = (max - min) * 0.12 || 1
    const bas = min - marge, haut = max + marge
    const X = (tt: number) => G.l + ((tt - debut) / p.duree) * (G.r - G.l)
    const Y = (v: number) => G.b - ((v - bas) / (haut - bas)) * (G.b - G.h)
    this.points = serie.map((s) => ({ ...s, x: X(s.t), y: Y(s.cours) }))
    const ligne = this.points.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
    const dernier = this.points[this.points.length - 1]
    let svg = `<svg class="graphique sans-glisser" viewBox="0 0 ${G.larg} ${G.haut}" role="img" aria-label="Cours de ${nom}">`
    svg += '<defs><pattern id="en-route" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hachure"/></pattern></defs>'
    for (let i = 0; i <= 3; i++) {
      const v = bas + ((haut - bas) * (i + 0.5)) / 4, y = Y(v)
      svg += `<line x1="${G.l}" x2="${G.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="grille"/><text x="${G.r + 4}" y="${(y + 3).toFixed(1)}" class="axe">${prix(v)}</text>`
    }
    for (let i = 0; i <= 3; i++) {
      const tt = debut + (p.duree * i) / 3, x = X(tt)
      svg += `<text x="${x.toFixed(1)}" y="${G.haut - 6}" class="axe" text-anchor="${i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}">${i === 3 ? 'maintenant' : heure(tt, this.periode === 2)}</text>`
    }
    const xConnu = X(finConnue)
    if (G.r - xConnu > 1) {
      svg += `<rect x="${xConnu.toFixed(1)}" y="${G.h}" width="${(G.r - xConnu).toFixed(1)}" height="${G.b - G.h}" fill="url(#en-route)" class="inconnu"/>`
      if (G.r - xConnu > 46) svg += `<text x="${((xConnu + G.r) / 2).toFixed(1)}" y="${G.h + 12}" class="axe en-route" text-anchor="middle">en route</text>`
    }
    if (this.points.length) {
      svg += `<path d="${ligne} L${dernier.x.toFixed(1)} ${G.b} L${G.l} ${G.b}Z" fill="${teinte}" class="aire"/>`
      svg += `<path d="${ligne}" class="courbe"/>`
      svg += `<circle cx="${dernier.x.toFixed(1)}" cy="${dernier.y.toFixed(1)}" r="4" class="point"/>`
    }
    svg += `<line x1="${G.l}" x2="${G.r}" y1="${G.b}" y2="${G.b}" class="base"/>`
    return svg + '<g class="curseur"></g></svg>'
  }

  /** Le curseur du doigt : un trait vertical et le cours à cet instant. */
  private dessinerCurseur(): void {
    const g = this.element.querySelector('.graphique .curseur')
    if (!g) return
    if (this.curseur === null || !this.points.length) { g.innerHTML = ''; return }
    const x = G.l + this.curseur * (G.r - G.l)
    const q = this.points.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a))
    if (x > this.points[this.points.length - 1].x + 2) {
      g.innerHTML = `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${G.h}" y2="${G.b}" class="viseur"/>`
        + `<text x="${Math.min(G.r - 2, Math.max(G.l + 2, x)).toFixed(1)}" y="${G.h - 3}" class="lecture" text-anchor="middle">pas encore connu</text>`
      return
    }
    const long = PERIODES[this.periode].duree > 24 * HEURE
    const texte = `${heure(q.t, long)}${long ? ` ${heure(q.t, false)}` : ''} · ${prix(q.cours)} cr.`
    const ancre = q.x < 90 ? 'start' : q.x > G.r - 90 ? 'end' : 'middle'
    g.innerHTML = `<line x1="${q.x.toFixed(1)}" x2="${q.x.toFixed(1)}" y1="${G.h}" y2="${G.b}" class="viseur"/>`
      + `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="5" class="point-viseur"/>`
      + `<text x="${q.x.toFixed(1)}" y="${G.h - 3}" class="lecture" text-anchor="${ancre}">${texte}</text>`
  }
}

/** Un ordre du joueur, où il en est : en route vers le siège, exécuté (confirmation en route), ou confirmé. */
function ligneOrdre(o: OrdreBourse, t: number): string {
  const c = compagnie(o.compagnie)!
  const quoi = o.sens === 'acheter' ? `Achat ${c.nom} · ${entier(o.credits)} cr.` : `Vente ${c.nom} · ${actions(o.actions)} action${o.actions >= 2 ? 's' : ''}`
  let ou: string
  if (o.prix === null) ou = `📡 en route vers ${c.siege} · arrive dans ${texteRestant(o.arrivee - t)}`
  else if (o.confirme !== null && t < o.confirme) ou = `exécuté à ${prix(o.prix)} · confirmation dans ${texteRestant(o.confirme - t)}`
  else ou = o.sens === 'acheter' ? `✓ ${actions(o.actions)} actions à ${prix(o.prix)}` : `✓ vendu à ${prix(o.prix)} · <span class="${sens(o.gain ?? 0)}">${(o.gain ?? 0) >= 0 ? '+' : '−'}${entier(Math.abs(o.gain ?? 0))} cr.</span>`
  return `<div class="ordre-bourse"><b>${quoi}</b><small>${ou}</small></div>`
}
