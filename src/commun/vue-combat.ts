// Le combat au tour par tour (ABATTRE, la mission des Mercenaires ; décisions d'Adrien du 19/10/2026), en plein écran
// par-dessus la carte. En haut, le chasseur alien : sa coque, ses trois modules (touche-en un pour le viser) et le coup
// qu'il annonce. Au milieu, la capsule. En bas, les ordres du tour : l'arme, l'esquive, l'intercepteur (contre un
// missile), le bouclier qui prend les crans restants, et ce que ça donnerait ; FIN DU TOUR. La vue ne décide rien :
// elle montre l'état du combat que tient le moteur (moteur/combat.ts).

import { ARMES, COQUE_MAX, COUT_ESQUIVE, ENERGIE_TOTALE, INTERCEPTEURS, MODULES_ENNEMI, TORPILLES, type Arme, type NomModuleEnnemi } from '../donnees/combat'
import {
  bouclierDe, bouclierEnnemi, coutOrdres, jouerTour, nouveauCombat, prevoir, retraite, type Bilan, type EtatCombat, type Intention, type Ordres,
} from '../moteur/combat'

/** Un combat : son titre, la zone (plus loin, plus dur), et ce qui arrive à la fin (le texte du bilan). */
export interface OptionsCombat { titre: string; zone: number; surFin?: (fin: 'victoire' | 'retraite', degatsRecus: number) => string }
export const SIMULATEUR: OptionsCombat = { titre: 'SIMULATEUR · CHASSEUR ALIEN', zone: 1 }

const TITRES: Record<NomModuleEnnemi, string> = Object.fromEntries(MODULES_ENNEMI.map((m) => [m.nom, m.titre])) as Record<NomModuleEnnemi, string>
/** « ses ARMES », « son BOUCLIER »… et l'accord de « détruit ». */
const SON: Record<NomModuleEnnemi, string> = { armes: 'ses ARMES', bouclier: 'son BOUCLIER', moteur: 'son MOTEUR' }
const DETRUIT: Record<NomModuleEnnemi, string> = { armes: 'DÉTRUITES', bouclier: 'DÉTRUIT', moteur: 'DÉTRUIT' }
const points = (n: number, max: number, classe = '') => Array.from({ length: max }, (_, i) => `<i class="${i < n ? `rempli ${classe}` : ''}"></i>`).join('')

/** Le coup annoncé, en clair, et un conseil. */
function annonce(i: Intention, charge: boolean): { titre: string; conseil: string } {
  const x2 = charge ? ' ×2 (CHARGÉ !)' : ''
  switch (i.genre) {
    case 'laser': return { titre: `LASER ${i.degats}${x2}`, conseil: 'Le bouclier l\'arrête cran par cran ; l\'esquive le divise par deux.' }
    case 'missile': return { titre: `MISSILE ${i.degats}${x2}`, conseil: 'Guidé : ni bouclier ni esquive. Seul un intercepteur l\'arrête.' }
    case 'rafale': return { titre: `RAFALE : LASER ${i.laser} + MISSILE ${i.missile}${x2}`, conseil: 'Bouclier ou esquive pour le laser, intercepteur pour le missile.' }
    case 'bouclier': return { titre: 'BOUCLIER RENFORCÉ', conseil: 'Ses lasers sont presque tous arrêtés ce tour : la torpille, elle, passe.' }
    case 'defense': return { titre: 'DÉFENSE', conseil: 'Il interceptera une torpille : tire plutôt au laser.' }
    case 'charge': return { titre: 'CHARGE', conseil: 'Son prochain tir fera le double ! Touche ses ARMES pour annuler la charge.' }
  }
}

/** Le récit d'un tour. */
function recit(b: Bilan): string[] {
  const l: string[] = []
  const t = b.notreTir
  if (!t) l.push('Tu n\'as pas tiré.')
  else if (t.interceptee) l.push(`Ta torpille a été interceptée.`)
  else l.push(`Ton ${ARMES[t.arme].titre.toLowerCase()} : ${t.degats} dégât${t.degats > 1 ? 's' : ''} sur ${SON[t.cible]}${t.arrete ? ` (son bouclier en arrête ${t.arrete})` : ''}${t.detruit ? ` : ${DETRUIT[t.cible]} !` : '.'}`)
  if (b.chargeAnnulee) l.push('Ses armes touchées : sa charge est annulée.')
  const c = b.sonCoup
  if (c.genre === 'laser' || c.genre === 'missile' || c.genre === 'rafale') {
    l.push(b.recus ? `Il te touche : ${b.recus} dégât${b.recus > 1 ? 's' : ''}${b.doublé ? ' (tir doublé)' : ''}.` : 'Son tir ne t\'a rien fait.')
    if (b.intercepte) l.push('Ton intercepteur a abattu son missile.')
  }
  for (const m of b.repares) l.push(`Il a réparé ${SON[m]}.`)
  return l
}

export class VueCombat {
  private etat: EtatCombat | null = null
  private options: OptionsCombat = SIMULATEUR
  private ordres: Ordres = { arme: 'laser', esquive: false, intercepteur: false, cible: 'armes' }
  private journal: string[] = []
  private elCorps: HTMLElement
  private elFin: HTMLElement

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-combat"></span><button type="button" data-retraite>RETRAITE</button></div>
      <div class="corps"></div>
      <div class="fin-combat" hidden></div>`
    this.elCorps = element.querySelector('.corps')!
    this.elFin = element.querySelector('.fin-combat')!
    element.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('button')
      const e = this.etat
      if (!b) return
      if (b.dataset.fermer !== undefined) { this.fermer(); return }
      if (b.dataset.rejouer !== undefined) { this.ouvrir(this.options); return }
      if (!e || e.fin) return
      if (b.dataset.retraite !== undefined) {
        if (!confirm('Battre en retraite ? Le chasseur reste là, et la Coque de la capsule tombe en panne.')) return
        retraite(e)
        this.terminer()
        return
      }
      if (b.dataset.cible) this.ordres.cible = b.dataset.cible as NomModuleEnnemi
      else if (b.dataset.arme !== undefined) this.ordres.arme = (b.dataset.arme || null) as Arme | null
      else if (b.dataset.esquive !== undefined) this.ordres.esquive = !this.ordres.esquive
      else if (b.dataset.intercepteur !== undefined) this.ordres.intercepteur = !this.ordres.intercepteur
      else if (b.dataset.finTour !== undefined) { this.finDuTour(); return }
      this.corriger()
      this.afficher()
    })
  }

  ouvrir(options: OptionsCombat = SIMULATEUR): void {
    this.options = options
    this.etat = nouveauCombat((Date.now() % 2147483647) >>> 0, options.zone)
    this.ordres = { arme: 'laser', esquive: false, intercepteur: false, cible: 'armes' }
    this.journal = []
    this.element.querySelector('.titre-combat')!.textContent = options.titre
    this.elFin.hidden = true
    this.element.hidden = false
    this.corriger()
    this.afficher()
  }

  fermer(): void {
    this.element.hidden = true
    this.etat = null
  }

  /** Garde des ordres possibles : pas plus de 6 crans, pas de torpille sans torpille, l'intercepteur seulement contre un missile. */
  private corriger(): void {
    const e = this.etat!, o = this.ordres
    if (o.arme === 'torpille' && e.torpilles === 0) o.arme = null
    if (coutOrdres(o) > ENERGIE_TOTALE) o.esquive = false
    const missile = e.intention.genre === 'missile' || e.intention.genre === 'rafale'
    if (!missile || e.intercepteurs === 0) o.intercepteur = false
  }

  private finDuTour(): void {
    const e = this.etat!
    const b = jouerTour(e, this.ordres)
    if (!b) return
    navigator.vibrate?.(b.recus ? 120 : 30)
    this.journal = recit(b)
    if (e.fin) { this.terminer(); return }
    this.corriger()
    this.afficher()
    this.elCorps.scrollTop = 0
  }

  private terminer(): void {
    const e = this.etat!
    const fin = e.fin as 'victoire' | 'retraite'
    const suite = this.options.surFin ? this.options.surFin(fin, e.degatsRecus) : 'Simulateur : rien n\'arrive à ta capsule.'
    this.elFin.innerHTML = `<div class="carte-fin"><b>${fin === 'victoire' ? 'CHASSEUR ABATTU !' : 'RETRAITE'}</b>`
      + `<p>${fin === 'victoire' ? `En ${e.tour} tour${e.tour > 1 ? 's' : ''}. ${e.degatsRecus ? `${e.degatsRecus} dégât${e.degatsRecus > 1 ? 's' : ''} reçu${e.degatsRecus > 1 ? 's' : ''}.` : 'Sans une égratignure : prime de 10 %.'}`
        : 'La capsule décroche, coque abîmée.'}</p><p class="petit">${suite}</p>`
      + `<div class="boutons-fin">${this.options.surFin ? '' : '<button type="button" data-rejouer>REJOUER</button>'}<button type="button" class="principal" data-fermer>FERMER</button></div></div>`
    this.elFin.hidden = false
  }

  private afficher(): void {
    const e = this.etat!, o = this.ordres
    const a = annonce(e.intention, e.charge)
    const missile = e.intention.genre === 'missile' || e.intention.genre === 'rafale'
    const prevu = prevoir(e, o)
    let html = '<div class="ennemi">'
      + `<div class="ligne-coque"><span>CHASSEUR</span><span class="jauge"><i style="width:${(100 * e.coqueEnnemi) / e.coqueEnnemiMax}%"></i></span><b>${e.coqueEnnemi}/${e.coqueEnnemiMax}</b></div>`
      + '<svg class="silhouette" viewBox="0 0 120 50" aria-hidden="true"><path d="M60 4 76 20 116 26 80 32 70 46 60 40 50 46 40 32 4 26 44 20z" fill="#9d7cc8" stroke="#2b2138" stroke-width="2.2" stroke-linejoin="round"/><circle cx="60" cy="24" r="5" fill="#b9f08c" stroke="#2b2138" stroke-width="2"/></svg>'
      + '<div class="modules-ennemi">' + e.modules.map((m) => {
        const hs = m.pv === 0
        return `<button type="button" data-cible="${m.nom}" class="${o.cible === m.nom ? 'vise' : ''}${hs ? ' hs' : ''}"><b>${TITRES[m.nom]}</b>`
          + `<span class="points">${points(m.pv, m.pvMax)}</span><small>${hs ? `HS · réparé au tour ${m.reparation}` : m.nom === 'bouclier' ? `arrête ${bouclierEnnemi(e)} au laser` : '&nbsp;'}</small></button>`
      }).join('') + '</div>'
      + `<div class="intention"><small>IL ANNONCE</small><b>${a.titre}</b><p>${a.conseil}</p></div></div>`
    html += '<div class="nous">'
      + `<div class="ligne-coque"><span>TA COQUE</span><span class="jauge notre-coque"><i style="width:${(100 * e.coque) / COQUE_MAX}%"></i></span><b>${e.coque}/${COQUE_MAX}</b></div>`
      + `<div class="stocks"><span>INTERCEPTEURS <span class="points">${points(e.intercepteurs, INTERCEPTEURS, 'bleu')}</span></span>`
      + `<span>TORPILLES <span class="points">${points(e.torpilles, TORPILLES, 'or')}</span></span></div></div>`
    html += `<h3>Tour ${e.tour} · tes ordres (${ENERGIE_TOTALE} crans)</h3><div class="ordres">`
      + '<div class="rangee"><span class="etiquette">ARME</span>'
      + `<button type="button" data-arme="" class="${o.arme === null ? 'choisi' : ''}">AUCUNE</button>`
      + (['laser', 'torpille'] as Arme[]).map((x) => `<button type="button" data-arme="${x}" class="${o.arme === x ? 'choisi' : ''}"${x === 'torpille' && e.torpilles === 0 ? ' disabled' : ''}>`
        + `${ARMES[x].titre}<small>${ARMES[x].cout} crans · ${ARMES[x].degats} dég.</small></button>`).join('') + '</div>'
      + `<div class="rangee"><span class="etiquette">MANŒUVRE</span><button type="button" data-esquive class="${o.esquive ? 'choisi' : ''}"${!o.esquive && coutOrdres({ ...o, esquive: true }) > ENERGIE_TOTALE ? ' disabled' : ''}>ESQUIVE<small>${COUT_ESQUIVE} crans · laser ÷2</small></button>`
      + (missile ? `<button type="button" data-intercepteur class="${o.intercepteur ? 'choisi' : ''}"${e.intercepteurs === 0 ? ' disabled' : ''}>INTERCEPTEUR<small>contre son missile</small></button>` : '') + '</div>'
      + `<div class="rangee bouclier"><span class="etiquette">BOUCLIER</span><span class="points">${points(bouclierDe(o), ENERGIE_TOTALE, 'bleu')}</span><small>les crans restants : arrête ${bouclierDe(o)} au laser</small></div>`
      + `<p class="prevision">Cible : <b>${SON[o.cible]}</b>${prevu ? ` · tu infligerais <b>${prevu.inflige}</b> · tu recevrais <b>${prevu.recus}</b>` : ''}</p>`
      + '<button type="button" class="fin-tour" data-fin-tour>FIN DU TOUR</button></div>'
    if (this.journal.length) html += '<h3>Le tour précédent</h3><ul class="journal">' + this.journal.map((x) => `<li>${x}</li>`).join('') + '</ul>'
    this.elCorps.innerHTML = html
  }
}
