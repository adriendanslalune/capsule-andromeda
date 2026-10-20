// Le volet Marché (étape 7, écrans d'abord ; présentation revue par Adrien le 18/10/2026) : un marché par système,
// avec l'âge de ses cours (délai de la lumière depuis sa planète jusqu'à la capsule) ; pour la marchandise choisie, un
// graphique de cours façon trading, qui s'arrête là où s'arrête ce qu'on sait : la fin, hachurée, est « en route » (la
// lumière n'est pas encore arrivée) ; puis toutes les marchandises du marché, avec leur courbe des dernières 24 h.
// Le doigt posé sur le graphique lit le cours à un instant. Acheter et vendre (décision d'Adrien du 20/10/2026) : au
// marché du système où la capsule est en orbite seulement, par 1 t, 5 t ou tout ; ailleurs, on regarde les cours.

import { CAPACITE_SOUTE, LOTS, MARCHANDISES, MARCHES } from '../donnees/marche'
import { historique, marcheDeLaCapsule, vueMarche } from '../moteur/marche'

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

const prix = (c: number) => c.toLocaleString('fr-FR', { maximumFractionDigits: c < 20 ? 1 : 0 })
const pourcent = (v: number) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
const heure = (t: number, jours: boolean) => new Date(t).toLocaleString('fr-FR', jours ? { day: '2-digit', month: '2-digit' } : { hour: '2-digit', minute: '2-digit' })

/** Ce que le volet doit savoir de la capsule pour le commerce. */
export interface EtatCommerce {
  soute: Record<string, number>
  credits: number
  /** Le marché où l'on peut commercer (en orbite dans son système), ou null. */
  ici: string | null
  /** La capsule est-elle en plein vol ? */
  enVol: boolean
}

/** Un ordre du joueur : acheter ou vendre tant de tonnes (Infinity : tout ce qu'on peut). */
export type Ordre = { sens: 'acheter' | 'vendre'; marchandise: string; tonnes: number }

export class VoletMarche {
  private dernier = ''
  /** Marché choisi (son numéro dans MARCHES), ou null : celui du système de la capsule (sinon la Terre). */
  private choisi: number | null = null
  private marchandise = 0
  private periode = 1
  /** Le doigt sur le graphique : position (fraction de la largeur de tracé), ou null. */
  private curseur: number | null = null
  /** Points du graphique affiché (pour la lecture au doigt). */
  private points: { t: number; cours: number; x: number; y: number }[] = []

  constructor(private element: HTMLElement, private rafraichir: () => void, private commercer: (o: Ordre) => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!b || b.disabled) return
      if (b.dataset.sens) {
        this.commercer({ sens: b.dataset.sens as Ordre['sens'], marchandise: MARCHANDISES[this.marchandise].nom, tonnes: Number(b.dataset.tonnes) })
        return
      }
      if (b.dataset.marche !== undefined) this.choisi = Number(b.dataset.marche)
      else if (b.dataset.marchandise !== undefined) this.marchandise = Number(b.dataset.marchandise)
      else if (b.dataset.periode !== undefined) this.periode = Number(b.dataset.periode)
      else return
      this.rafraichir()
      // Une marchandise choisie dans la liste : on remonte jusqu'à son graphique.
      if (b.dataset.marchandise !== undefined) this.element.querySelector('.tete-cours')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
    // Lire le cours au doigt : le curseur suit le doigt tant qu'il est posé sur le graphique.
    const lire = (e: PointerEvent) => {
      const svg = (e.target as Element).closest('svg.graphique')
      if (!svg) return
      const r = svg.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * G.larg
      this.curseur = Math.max(0, Math.min(1, (x - G.l) / (G.r - G.l)))
      this.dessinerCurseur()
    }
    element.addEventListener('pointerdown', lire)
    element.addEventListener('pointermove', (e) => { if (this.curseur !== null) lire(e) })
    for (const fin of ['pointerup', 'pointercancel', 'pointerleave']) element.addEventListener(fin, () => { this.curseur = null; this.dessinerCurseur() })
  }

  afficher(t: number, etat: EtatCommerce): void {
    const soute = etat.soute
    const ici = marcheDeLaCapsule(t)
    const k = this.choisi ?? (ici ? MARCHES.indexOf(ici) : 2)
    const vues = MARCHES.map((m) => vueMarche(m, t))
    const vue = vues[k], m = vue.marche
    const f = MARCHANDISES[this.marchandise], choisie = vue.marchandises[this.marchandise]

    // Les marchés : un par système, avec l'âge de ses cours.
    let html = '<div class="places">' + vues.map((v, i) =>
      `<button type="button" data-marche="${i}"${i === k ? ' class="actif"' : ''}><span class="pastille" style="background:${v.marche.teinte}"></span>`
      + `${v.marche.nom}<small>${v.ici ? 'ici · en direct' : texteDelai(v.delai)}</small></button>`).join('') + '</div>'

    // L'en-tête : la marchandise, son cours connu, sa variation sur 24 h, l'âge des cours.
    html += `<div class="tete-cours"><div><b>${f.nom}</b><small>marché de ${m.nom}</small></div>`
      + `<div class="droite"><b class="grand">${prix(choisie.cours)}</b><small>cr. la tonne</small>`
      + `<span class="${choisie.variation >= 0 ? 'hausse' : 'baisse'}">${pourcent(choisie.variation)} <small>24 h</small></span></div></div>`
    html += `<p class="age">${vue.ici ? 'Tu es dans ce système : cours <b>en direct</b>.'
      : `Cours d'il y a <b>${texteDelai(vue.delai)}</b> : le temps que met la lumière pour venir de ${m.nom} jusqu'à ta capsule.`}</p>`

    // Le graphique.
    const p = PERIODES[this.periode]
    const debut = t - p.duree, finConnue = Math.max(debut, vue.connuA)
    const serie = finConnue > debut ? historique(m, f, debut, finConnue, 120) : []
    const valeurs = serie.map((s) => s.cours)
    const min = Math.min(...valeurs), max = Math.max(...valeurs), marge = (max - min) * 0.12 || 1
    const bas = min - marge, haut = max + marge
    const X = (tt: number) => G.l + ((tt - debut) / p.duree) * (G.r - G.l)
    const Y = (c: number) => G.b - ((c - bas) / (haut - bas)) * (G.b - G.h)
    this.points = serie.map((s) => ({ ...s, x: X(s.t), y: Y(s.cours) }))
    const ligne = this.points.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
    const dernier = this.points[this.points.length - 1]
    let svg = `<svg class="graphique sans-glisser" viewBox="0 0 ${G.larg} ${G.haut}" role="img" aria-label="Cours de ${f.nom} sur le marché de ${m.nom}">`
    svg += '<defs><pattern id="en-route" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hachure"/></pattern></defs>'
    // Grille et axe des cours (à droite).
    for (let i = 0; i <= 3; i++) {
      const c = bas + ((haut - bas) * (i + 0.5)) / 4, y = Y(c)
      svg += `<line x1="${G.l}" x2="${G.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="grille"/><text x="${G.r + 4}" y="${(y + 3).toFixed(1)}" class="axe">${prix(c)}</text>`
    }
    // Axe du temps.
    for (let i = 0; i <= 3; i++) {
      const tt = debut + (p.duree * i) / 3, x = X(tt)
      svg += `<text x="${x.toFixed(1)}" y="${G.haut - 6}" class="axe" text-anchor="${i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}">${i === 3 ? 'maintenant' : heure(tt, this.periode === 2)}</text>`
    }
    // Ce qu'on ne sait pas encore : la lumière est en route.
    const xConnu = X(finConnue)
    if (G.r - xConnu > 1) {
      svg += `<rect x="${xConnu.toFixed(1)}" y="${G.h}" width="${(G.r - xConnu).toFixed(1)}" height="${G.b - G.h}" fill="url(#en-route)" class="inconnu"/>`
      if (G.r - xConnu > 46) svg += `<text x="${((xConnu + G.r) / 2).toFixed(1)}" y="${G.h + 12}" class="axe en-route" text-anchor="middle">en route</text>`
    }
    // La courbe, son aire, le dernier cours connu.
    if (this.points.length) {
      svg += `<path d="${ligne} L${dernier.x.toFixed(1)} ${G.b} L${G.l} ${G.b}Z" fill="${m.teinte}" class="aire"/>`
      svg += `<path d="${ligne}" class="courbe"/>`
      svg += `<circle cx="${dernier.x.toFixed(1)}" cy="${dernier.y.toFixed(1)}" r="4" class="point"/>`
    }
    svg += `<line x1="${G.l}" x2="${G.r}" y1="${G.b}" y2="${G.b}" class="base"/>`
    svg += '<g class="curseur"></g></svg>'
    html += `<div class="bloc graphe">${svg}<div class="periodes">`
      + PERIODES.map((q, i) => `<button type="button" data-periode="${i}"${i === this.periode ? ' class="actif"' : ''}>${q.nom}</button>`).join('')
      + `</div><div class="achat-vente"><span>achat <b>${choisie.achat}</b> · vente <b>${choisie.vente}</b> <small>cr. la tonne</small></span></div>`
    // Acheter et vendre : seulement ici, en orbite dans le système de ce marché.
    const charge = Object.values(soute).reduce((a, b) => a + b, 0), stock = soute[f.nom] ?? 0
    const t1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
    // Les boutons sont toujours là ; grisés, avec la raison, quand on ne peut pas commercer sur ce marché.
    const possible = etat.ici === m.nom
    const plein = !possible || charge >= CAPACITE_SOUTE - 0.05 || etat.credits < choisie.achat
    const rien = !possible || stock <= 0
    const lot = (sens: 'acheter' | 'vendre', n: number, texte: string, off: boolean) =>
      `<button type="button" data-sens="${sens}" data-tonnes="${n}"${off ? ' disabled' : ''}${sens === 'vendre' ? ' class="principal"' : ''}>${texte}</button>`
    html += '<div class="commerce">'
      + `<div class="ligne-commerce"><span>ACHETER</span>${LOTS.map((n) => lot('acheter', n, `${n} t`, plein)).join('')}${lot('acheter', Infinity, 'MAX', plein)}</div>`
      + `<div class="ligne-commerce"><span>VENDRE</span>${LOTS.map((n) => lot('vendre', n, `${n} t`, rien)).join('')}${lot('vendre', Infinity, 'TOUT', rien)}</div>`
    if (possible) {
      if (charge >= CAPACITE_SOUTE - 0.05) html += '<p class="raison">Soute pleine : vends quelque chose pour faire de la place.</p>'
      else if (etat.credits < choisie.achat) html += `<p class="raison">Pas assez de crédits : une tonne coûte ${choisie.achat} crédits. Fais des missions, ou vends ce que tu as dans la soute.</p>`
      html += `<p class="petit">Soute ${t1(charge)}/${CAPACITE_SOUTE} t · ${f.nom.toLowerCase()} à bord : ${stock ? `${t1(stock)} t` : 'aucun'} · ${etat.credits.toLocaleString('fr-FR')} crédits</p>`
    } else {
      const raison = etat.enVol ? 'En plein vol, pas de commerce : on achète et on vend une fois en orbite.'
        : !etat.ici ? 'Pas de marché ici : mets-toi en orbite dans le système d\'une planète (ou de Pluton) pour commercer.'
          : `Ta capsule est dans le système ${etat.ici === 'Terre' ? 'de la Terre' : `de ${etat.ici}`} : on n'achète et ne vend qu'à son marché. Ici, on ne fait que regarder les cours.`
      const iciK = etat.ici ? MARCHES.findIndex((x) => x.nom === etat.ici) : -1
      html += `<p class="raison">${raison}</p>`
        + (iciK >= 0 ? `<button type="button" class="vers-ici" data-marche="${iciK}">MARCHÉ ${etat.ici === 'Terre' ? 'DE LA TERRE' : `DE ${etat.ici!.toUpperCase()}`} ›</button>` : '')
    }
    html += '</div>'
    html += '</div>'

    // Les marchandises de ce marché : courbe des dernières 24 h, cours, variation.
    html += '<h3>Marchandises</h3><div class="liste-cours">' + vue.marchandises.map((x, i) => {
      const h = historique(m, x.fiche, vue.connuA - 24 * HEURE, vue.connuA, 40)
      const lo = Math.min(...h.map((q) => q.cours)), hi = Math.max(...h.map((q) => q.cours)) || 1
      const pts = h.map((q, j) => `${((j / 40) * 70).toFixed(1)},${(20 - ((q.cours - lo) / (hi - lo || 1)) * 18).toFixed(1)}`).join(' ')
      return `<button type="button" data-marchandise="${i}"${i === this.marchandise ? ' class="actif"' : ''}>`
        + `<span class="nom">${x.fiche.nom}<small>soute ${soute[x.fiche.nom] ? `${soute[x.fiche.nom].toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t` : '—'}</small></span>`
        + `<svg class="mini" viewBox="0 0 70 22"><polyline points="${pts}"/></svg>`
        + `<span class="valeur">${prix(x.cours)}<small class="${x.variation >= 0 ? 'hausse' : 'baisse'}">${pourcent(x.variation)}</small></span></button>`
    }).join('') + '</div>'
    html += '<p class="note">Cours en crédits la tonne. On achète au cours + 6 %, on vend au cours − 6 % ; chaque système a ses spécialités, moins chères là où elles se produisent.</p>'

    if (html === this.dernier) return
    const rangee = this.element.querySelector('.places')?.scrollLeft ?? 0
    this.element.innerHTML = this.dernier = html
    // La rangée des marchés garde sa position ; le marché choisi reste visible.
    const places = this.element.querySelector<HTMLElement>('.places')!
    places.scrollLeft = rangee
    const actif = places.querySelector<HTMLElement>('.actif')!
    if (actif.offsetLeft < places.scrollLeft || actif.offsetLeft + actif.offsetWidth > places.scrollLeft + places.clientWidth) {
      places.scrollLeft = actif.offsetLeft - 10
    }
    this.dessinerCurseur()
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
    const texte = `${heure(q.t, PERIODES[this.periode].duree > 24 * HEURE)}${PERIODES[this.periode].duree > 24 * HEURE ? ` ${heure(q.t, false)}` : ''} · ${prix(q.cours)} cr.`
    const ancre = q.x < 90 ? 'start' : q.x > G.r - 90 ? 'end' : 'middle'
    g.innerHTML = `<line x1="${q.x.toFixed(1)}" x2="${q.x.toFixed(1)}" y1="${G.h}" y2="${G.b}" class="viseur"/>`
      + `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="5" class="point-viseur"/>`
      + `<text x="${q.x.toFixed(1)}" y="${G.h - 3}" class="lecture" text-anchor="${ancre}">${texte}</text>`
  }
}
