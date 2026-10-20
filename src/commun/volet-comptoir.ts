// Le Comptoir (onglet du volet Marché ; décision d'Adrien du 20/10/2026) : on y achète et vend les matériaux, dont
// le moteur a besoin pour monter de niveau. Un comptoir par système, des prix stables ; chaque système a ses
// spécialités (moins chères là où elles se produisent, plus chères là où elles manquent). On n'achète et ne vend qu'au
// comptoir du système où la capsule est en orbite ; les autres se regardent (prix connus avec le délai de la lumière).
// La vue ne décide rien : les prix viennent de moteur/marche.ts, l'achat et la vente de jeu.ts.

import { CAPACITE_SOUTE, LOTS, MARCHES, SPECIALITES } from '../donnees/marche'
import { marcheDeLaCapsule, vueMarche } from '../moteur/marche'
import { avec, picto } from './symboles'

/** Ce que le volet doit savoir de la capsule pour le commerce. */
export interface EtatCommerce {
  soute: Record<string, number>
  credits: number
  /** Le comptoir où l'on peut commercer (en orbite dans son système), ou null. */
  ici: string | null
  /** La capsule est-elle en plein vol ? */
  enVol: boolean
}

/** Un ordre du joueur : acheter ou vendre tant de tonnes (Infinity : tout ce qu'on peut). */
export type Ordre = { sens: 'acheter' | 'vendre'; marchandise: string; tonnes: number }

/** Le système, avec son article : « de la Terre », « de Mars ». */
const du = (nom: string) => (nom === 'Terre' ? 'de la Terre' : `de ${nom}`)

export class VoletComptoir {
  private dernier = ''
  /** Comptoir choisi (son numéro dans MARCHES), ou null : celui du système de la capsule (sinon la Terre). */
  private choisi: number | null = null
  /** Marchandise dépliée (ses boutons ACHETER / VENDRE), par son nom. */
  private ouverte: string | null = null

  /** TOUT (acheter ou vendre), en attente de confirmation (demande d'Adrien du 20/10/2026 : pas de gros achat d'un seul doigt). */
  private aConfirmer: Ordre | null = null

  /** devis : ce que donnerait un ordre (tonnes, crédits), sans rien changer. */
  constructor(private element: HTMLElement, private rafraichir: () => void, private commercer: (o: Ordre) => void,
    private devis: (o: Ordre) => { tonnes: number; prix: number }) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!b || b.disabled) return
      if (b.dataset.sens) {
        const o: Ordre = { sens: b.dataset.sens as Ordre['sens'], marchandise: b.dataset.nomMarchandise!, tonnes: Number(b.dataset.tonnes) }
        if (o.tonnes !== Infinity) { this.commercer(o); return }
        this.aConfirmer = o
      } else if (b.dataset.confirmer !== undefined && this.aConfirmer) { const o = this.aConfirmer; this.aConfirmer = null; this.commercer(o); return }
      else if (b.dataset.annuler !== undefined) this.aConfirmer = null
      else if (b.dataset.comptoir !== undefined) { this.choisi = Number(b.dataset.comptoir); this.aConfirmer = null }
      else if (b.dataset.ouvrir !== undefined) { this.ouverte = this.ouverte === b.dataset.ouvrir ? null : b.dataset.ouvrir; this.aConfirmer = null }
      else return
      this.rafraichir()
    })
  }

  /** besoins : les tonnes qui manquent pour le moteur suivant, par matériau (marquées dans la liste). */
  afficher(t: number, etat: EtatCommerce, besoins: Record<string, number>): void {
    const ici = marcheDeLaCapsule(t)
    const k = this.choisi ?? (ici ? MARCHES.indexOf(ici) : 2)
    const vue = vueMarche(MARCHES[k], t), m = vue.marche
    const possible = etat.ici === m.nom
    const charge = Object.values(etat.soute).reduce((a, b) => a + b, 0)
    const t1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

    let html = '<div class="places">' + MARCHES.map((x, i) =>
      `<button type="button" data-comptoir="${i}"${i === k ? ' class="actif"' : ''}><span class="pastille" style="background:${x.teinte}"></span>`
      + `${x.nom}${etat.ici === x.nom ? '<small>ici</small>' : ''}</button>`).join('') + '</div>'
    html += `<div class="tete-comptoir"><b>Comptoir ${du(m.nom)}</b><span class="vals">${avec('credits', etat.credits.toLocaleString('fr-FR'))}${avec('soute', `${t1(charge)}/${CAPACITE_SOUTE} t`)}</span></div>`
    if (!possible) {
      const raison = etat.enVol ? 'En plein vol : on achète et on vend une fois en orbite.'
        : !etat.ici ? 'Pas de comptoir ici : mets-toi en orbite dans le système d\'une planète (ou de Pluton).'
          : `On n'achète et ne vend qu'au comptoir ${du(etat.ici)}, où est ta capsule. Ici, on regarde les prix.`
      const iciK = etat.ici ? MARCHES.findIndex((x) => x.nom === etat.ici) : -1
      html += `<p class="raison">${raison}</p>` + (iciK >= 0 && iciK !== k ? `<button type="button" class="vers-ici" data-comptoir="${iciK}">COMPTOIR ${du(etat.ici!).toUpperCase()} ›</button>` : '')
    }

    // Les matériaux : prix d'achat et de vente, spécialité du système, ce qu'on en a à bord, ce qu'il manque au moteur.
    html += '<div class="liste-comptoir">' + vue.marchandises.map((x) => {
      const nom = x.fiche.nom, stock = etat.soute[nom] ?? 0, specialite = SPECIALITES[m.nom]?.[nom] ?? 1
      const marque = specialite < 1 ? '<span class="specialite bon-marche">▼ produit ici</span>' : specialite > 1 ? '<span class="specialite recherche">▲ recherché ici</span>' : ''
      const besoin = besoins[nom] ? `<span class="besoin">${picto('moteur')}il t'en manque ${t1(besoins[nom])} t</span>` : ''
      let ligne = `<div class="materiau-comptoir${this.ouverte === nom ? ' ouvert' : ''}"><button type="button" class="tete-materiau" data-ouvrir="${nom}">`
        + `<span class="nom"><b>${nom}</b>${marque}${besoin}</span>`
        + `<span class="prix-comptoir"><span>achat <b>${x.achat}</b></span><span>vente <b>${x.vente}</b></span></span>`
        + `<span class="a-bord">${stock ? `${t1(stock)} t` : '—'}</span></button>`
      if (this.ouverte === nom) {
        const off = !possible || charge >= CAPACITE_SOUTE - 0.05 || etat.credits < x.achat, rien = !possible || stock <= 0
        const lot = (sens: 'acheter' | 'vendre', n: number, texte: string, desactive: boolean) =>
          `<button type="button" data-sens="${sens}" data-nom-marchandise="${nom}" data-tonnes="${n}"${desactive ? ' disabled' : ''}${sens === 'vendre' ? ' class="principal"' : ''}>${texte}</button>`
        const d = this.aConfirmer?.marchandise === nom && possible ? this.devis(this.aConfirmer) : null
        if (d && d.tonnes > 0) {
          const achat = this.aConfirmer!.sens === 'acheter'
          ligne += `<div class="commerce"><div class="confirmation"><b>${achat ? 'Acheter' : 'Vendre'} ${t1(d.tonnes)} t de ${nom.toLowerCase()} ?</b>`
            + `<div><span>${achat ? 'Pour' : 'Tu reçois'}</span><b>${d.prix.toLocaleString('fr-FR')} cr.</b></div>`
            + '<div class="boutons-confirmation"><button type="button" data-annuler>ANNULER</button><button type="button" class="principal" data-confirmer>CONFIRMER</button></div></div></div>'
          return ligne + '</div>'
        }
        ligne += '<div class="commerce">'
          + `<div class="ligne-commerce"><span>ACHETER</span>${LOTS.map((n) => lot('acheter', n, `${n} t`, off)).join('')}${lot('acheter', Infinity, 'TOUT', off)}</div>`
          + `<div class="ligne-commerce"><span>VENDRE</span>${LOTS.map((n) => lot('vendre', n, `${n} t`, rien)).join('')}${lot('vendre', Infinity, 'TOUT', rien)}</div>`
        if (possible && charge >= CAPACITE_SOUTE - 0.05) ligne += '<p class="raison">Soute pleine : vends quelque chose pour faire de la place.</p>'
        else if (possible && etat.credits < x.achat) ligne += `<p class="raison">Pas assez de crédits : une tonne coûte ${x.achat} crédits.</p>`
        ligne += '</div>'
      }
      return ligne + '</div>'
    }).join('') + '</div>'
    html += '<p class="note">Prix en crédits la tonne. Touche un matériau pour l\'acheter ou le vendre. Chaque système a ses spécialités : moins chères là où elles se produisent, plus chères là où elles manquent.</p>'

    if (html === this.dernier) return
    const rangee = this.element.querySelector('.places')?.scrollLeft ?? 0
    this.element.innerHTML = this.dernier = html
    const places = this.element.querySelector<HTMLElement>('.places')!
    places.scrollLeft = rangee
    const actif = places.querySelector<HTMLElement>('.actif')!
    if (actif.offsetLeft < places.scrollLeft || actif.offsetLeft + actif.offsetWidth > places.scrollLeft + places.clientWidth) places.scrollLeft = actif.offsetLeft - 10
  }
}
