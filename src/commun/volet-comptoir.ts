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
  /** Les comptoirs qui existent : ceux des systèmes dont la planète est libérée (décision d'Adrien du 21/10/2026). */
  ouverts: string[]
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
      // Soute pleine : acheter est impossible, la jauge de la soute tremble (Adrien, 24/10/2026).
      if (b.dataset.soutePleine !== undefined) { this.secouerSoute(); return }
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

  private chargePrecedente: number | null = null

  /** La jauge de la soute tremble, en rouge gras, et le téléphone vibre : elle est pleine. */
  private secouerSoute(): void {
    const el = this.element.querySelector<HTMLElement>('.tete-comptoir .vals')
    if (!el) return
    el.classList.remove('soute-pleine')
    void el.offsetWidth
    el.classList.add('soute-pleine')
    navigator.vibrate?.([60, 40, 60, 40, 60])
  }

  /** besoins : les tonnes qui manquent pour le moteur suivant, par matériau (marquées dans la liste). */
  afficher(t: number, etat: EtatCommerce, besoins: Record<string, number>): void {
    const ici = marcheDeLaCapsule(t)
    const ouvert = (i: number) => etat.ouverts.includes(MARCHES[i].nom)
    let k = this.choisi ?? (ici ? MARCHES.indexOf(ici) : 2)
    if (!ouvert(k)) k = MARCHES.findIndex((x) => etat.ouverts.includes(x.nom))
    const vue = vueMarche(MARCHES[k], t), m = vue.marche
    const possible = etat.ici === m.nom
    const charge = Object.values(etat.soute).reduce((a, b) => a + b, 0)
    const t1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

    // Les comptoirs ouverts, pour regarder les prix d'ailleurs ; un seul ouvert : rien à choisir, la rangée disparaît.
    let html = MARCHES.filter((_, i) => ouvert(i)).length < 2 ? '' : '<div class="places">' + MARCHES.map((x, i) => !ouvert(i) ? '' :
      `<button type="button" data-comptoir="${i}"${i === k ? ' class="actif"' : ''}><span class="pastille" style="background:${x.teinte}"></span>`
      + `${x.nom}${etat.ici === x.nom ? '<small>ici</small>' : ''}</button>`).join('') + '</div>'
    html += `<div class="tete-comptoir"><b>Comptoir ${du(m.nom)}</b><span class="vals${charge > CAPACITE_SOUTE - 1 ? ' presque-pleine' : ''}">${avec('soute', `${t1(charge)}/${CAPACITE_SOUTE} t`)}</span></div>`
    // Les boutons n'apparaissent qu'en touchant un matériau : on le dit en haut (Adrien ne les avait pas trouvés).
    if (possible && !this.ouverte) html += '<p class="consigne-comptoir">Touche un matériau pour l\'acheter ou le vendre.</p>'
    if (!possible) {
      const raison = etat.enVol ? 'En plein vol : on achète et on vend une fois en orbite.'
        : !etat.ici ? (ici && !etat.ouverts.includes(ici.nom) ? `Pas de comptoir ici : le système ${du(ici.nom)} est occupé par Andromède. Libère la planète pour qu'il ouvre.`
          : 'Pas de comptoir ici : mets-toi en orbite dans le système d\'une planète libre.')
          : `On n'achète et ne vend qu'au comptoir ${du(etat.ici)}, où est ta capsule. Ici, on regarde les prix.`
      const iciK = etat.ici ? MARCHES.findIndex((x) => x.nom === etat.ici) : -1
      html += `<p class="raison">${raison}</p>` + (iciK >= 0 && iciK !== k ? `<button type="button" class="vers-ici" data-comptoir="${iciK}">COMPTOIR ${du(etat.ici!).toUpperCase()} ›</button>` : '')
    }

    // Les matériaux : prix d'achat et de vente, spécialité du système, ce qu'on en a à bord, ce qu'il manque au moteur.
    html += '<div class="liste-comptoir"><div class="entete-liste"><span>matériau</span><span>crédits la tonne</span><span>à bord</span></div>' + vue.marchandises.map((x) => {
      const nom = x.fiche.nom, stock = etat.soute[nom] ?? 0, specialite = SPECIALITES[m.nom]?.[nom] ?? 1
      const marque = specialite < 1 ? '<span class="specialite bon-marche">▼ produit ici</span>' : specialite > 1 ? '<span class="specialite recherche">▲ recherché ici</span>' : ''
      const besoin = besoins[nom] ? `<span class="besoin">${picto('moteur')}il t'en manque ${t1(besoins[nom])} t</span>` : ''
      let ligne = `<div class="materiau-comptoir${this.ouverte === nom ? ' ouvert' : ''}"><button type="button" class="tete-materiau" data-ouvrir="${nom}">`
        + `<span class="nom"><b>${nom}</b>${marque}${besoin}</span>`
        + `<span class="prix-comptoir"><span>achat <b>${x.achat}</b></span><span>vente <b>${x.vente}</b></span></span>`
        + `<span class="a-bord">${stock ? `${t1(stock)} t` : '—'}</span></button>`
      if (this.ouverte === nom) {
        const d = this.aConfirmer?.marchandise === nom && possible ? this.devis(this.aConfirmer) : null
        if (d && d.tonnes > 0) {
          const achat = this.aConfirmer!.sens === 'acheter'
          ligne += `<div class="commerce"><div class="confirmation"><b>${achat ? 'Acheter' : 'Vendre'} ${t1(d.tonnes)} t de ${nom.toLowerCase()} ?</b>`
            + `<div><span>${achat ? 'Tu paies' : 'Tu reçois'}</span><b>${d.prix.toLocaleString('fr-FR')} crédits</b></div>`
            + '<div class="boutons-confirmation"><button type="button" data-annuler>ANNULER</button><button type="button" class="principal" data-confirmer>CONFIRMER</button></div></div></div>'
          return ligne + '</div>'
        }
        // Chaque bouton dit ce qu'il fait vraiment (demande d'Adrien du 21/10/2026) : les tonnes échangées (dans la limite
        // des crédits, de la place en soute ou du stock) et les crédits payés ou reçus. Un lot qui ferait la même chose
        // qu'un plus petit, ou plafonné, n'est pas montré ; TOUT dit combien de tonnes.
        const lots = (sens: 'acheter' | 'vendre') => {
          let avant = 0, html = ''
          for (const n of [...LOTS, Infinity]) {
            const v = possible ? this.devis({ sens, marchandise: nom, tonnes: n }) : { tonnes: 0, prix: 0 }
            const tout = n === Infinity
            // Un lot plafonné (crédits, place, stock) revient à TOUT : seul TOUT est montré.
            if (!tout && v.tonnes > 0 && v.tonnes < n - 1e-9) continue
            if (tout && v.tonnes > 0 && v.tonnes <= avant + 1e-9 && html) continue
            const titre = tout ? (v.tonnes > 0 ? `TOUT · ${t1(v.tonnes)} t` : 'TOUT') : `${t1(v.tonnes > 0 ? v.tonnes : n)} t`
            const somme = v.tonnes > 0 ? `${sens === 'acheter' ? '−' : '+'}${v.prix.toLocaleString('fr-FR')} cr` : '—'
            const pleine = sens === 'acheter' && v.tonnes <= 0 && possible && charge > CAPACITE_SOUTE - 1
            html += (pleine ? '<button type="button" class="eteint" data-soute-pleine>'
              : `<button type="button" data-sens="${sens}" data-nom-marchandise="${nom}" data-tonnes="${n}"${v.tonnes > 0 ? '' : ' disabled'}>`)
              + `<b>${titre}</b><small>${somme}</small></button>`
            avant = Math.max(avant, v.tonnes)
          }
          return html
        }
        ligne += '<div class="commerce">'
          + `<div class="bloc-commerce achat"><span class="titre-bloc">ACHETER <small>tu paies ${x.achat} cr la tonne</small></span><div class="lots">${lots('acheter')}</div></div>`
          + `<div class="bloc-commerce vente"><span class="titre-bloc">VENDRE <small>${stock > 0 ? `tu reçois ${x.vente} cr la tonne · ${t1(stock)} t à bord` : 'tu n\'en as pas à bord'}</small></span><div class="lots">${lots('vendre')}</div></div>`
        if (possible && charge >= CAPACITE_SOUTE - 0.05) ligne += '<p class="raison">Soute pleine : vends quelque chose pour faire de la place.</p>'
        else if (possible && etat.credits < x.achat) ligne += `<p class="raison">Pas assez de crédits : une tonne coûte ${x.achat} crédits.</p>`
        ligne += '</div>'
      }
      return ligne + '</div>'
    }).join('') + '</div>'
    html += '<p class="note">Achat : ce que tu paies une tonne ; vente : ce qu\'on t\'en donne. Chaque système a ses spécialités : moins chères là où elles se produisent, plus chères là où elles manquent.</p>'

    // Un achat vient de remplir la soute : elle tremble aussi.
    // Au-delà de 19 t (Adrien, 24/10/2026 : à 19,97 t, on ne peut déjà plus rien acheter), la soute compte comme pleine.
    const pleine = charge > CAPACITE_SOUTE - 1, vientDeSeRemplir = pleine && this.chargePrecedente !== null && this.chargePrecedente <= CAPACITE_SOUTE - 1
    this.chargePrecedente = charge
    if (html === this.dernier) { if (vientDeSeRemplir) this.secouerSoute(); return }
    const rangee = this.element.querySelector('.places')?.scrollLeft ?? 0
    this.element.innerHTML = this.dernier = html
    if (vientDeSeRemplir) this.secouerSoute()
    const places = this.element.querySelector<HTMLElement>('.places')
    if (!places) return
    places.scrollLeft = rangee
    const actif = places.querySelector<HTMLElement>('.actif')
    if (!actif) return
    if (actif.offsetLeft < places.scrollLeft || actif.offsetLeft + actif.offsetWidth > places.scrollLeft + places.clientWidth) places.scrollLeft = actif.offsetLeft - 10
  }
}
