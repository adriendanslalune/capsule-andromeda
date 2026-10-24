// Le dépannage d'un engin (RÉPARER, la mission des Ingénieurs ; décision d'Adrien du 18/10/2026), en plein écran
// par-dessus la carte : le boîtier technique du satellite ou de la station (plaque avec la lettre du bus, voyant de
// défaut) et ses modules. On règle ceux en défaut en suivant la section 6 du Manuel (consultable sur place), puis
// VÉRIFIER. La vue ne décide rien : elle montre l'état que tient le moteur (moteur/depannage.ts).

import { APPAREILS_ENGIN, CABLES, SYMBOLES_GYRO, VOYANTS, type AppareilEngin } from '../donnees/depannage'
import {
  basculer, brancher, depannageFini, nouveauDepannage, tournerMolette, verifier, type EtatDepannage,
} from '../moteur/depannage'
import { sectionEngins } from './manuel'

/** Un dépannage : quel engin, et ce qu'on fait quand il est réparé (renvoie le texte du bilan). */
export interface OptionsDepannage { titre: string; surFin: (erreurs: number) => string }

export class VueDepannage {
  private etat: EtatDepannage | null = null
  private options: OptionsDepannage | null = null
  /** Câble touché, en attente de sa prise. */
  private cableChoisi: number | null = null
  private elCorps: HTMLElement
  private elFin: HTMLElement
  private elManuel: HTMLElement
  private manuelLu = false
  private elMessage: HTMLElement
  private finMessage = 0

  constructor(private element: HTMLElement) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-depannage"></span><button type="button" data-abandonner>PLUS TARD</button></div>
      <div class="corps"></div>
      <div class="message-depannage" hidden></div>
      <div class="papier" hidden></div>
      <div class="fin-combat" hidden></div>`
    this.elCorps = element.querySelector('.corps')!
    this.elFin = element.querySelector('.fin-combat')!
    this.elManuel = element.querySelector('.papier')!
    this.elMessage = element.querySelector('.message-depannage')!
    element.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('button')
      const e = this.etat
      if (!b) return
      if (b.dataset.abandonner !== undefined || b.dataset.fermer !== undefined) { this.fermer(); return }
      if (b.dataset.manuel !== undefined) {
        // Pour les trophées (« Lecteur assidu ») : un dépannage où l'on a ouvert le Manuel compte une fois.
        if (!this.manuelLu) { this.manuelLu = true; document.dispatchEvent(new CustomEvent('trophee', { detail: { cle: 'manuelDepannage' } })) }
        this.elManuel.hidden = false; this.elManuel.scrollTop = 0; return
      }
      if (b.dataset.retour !== undefined) { this.elManuel.hidden = true; return }
      if (!e) return
      if (b.dataset.levier) basculer(e, Number(b.dataset.levier))
      else if (b.dataset.cable) this.cableChoisi = this.cableChoisi === Number(b.dataset.cable) ? null : Number(b.dataset.cable)
      else if (b.dataset.prise && this.cableChoisi !== null) { brancher(e, this.cableChoisi, Number(b.dataset.prise)); this.cableChoisi = null }
      else if (b.dataset.molette) tournerMolette(e, Number(b.dataset.molette), Number(b.dataset.pas) as 1 | -1)
      else if (b.dataset.verifier) this.verifier(b.dataset.verifier as AppareilEngin)
      this.afficher()
    })
  }

  ouvrir(options: OptionsDepannage): void {
    this.options = options
    this.manuelLu = false
    this.etat = nouveauDepannage((Date.now() % 2147483647) >>> 0)
    this.cableChoisi = null
    this.element.querySelector('.titre-depannage')!.textContent = `DÉPANNAGE · ${options.titre}`
    this.elManuel.innerHTML = '<button type="button" class="retour-boitier" data-retour>‹ RETOUR AU BOÎTIER</button>' + sectionEngins()
    this.elManuel.hidden = true
    this.elFin.hidden = true
    this.element.hidden = false
    this.afficher()
  }

  fermer(): void {
    this.element.hidden = true
    this.etat = null
  }

  private dire(texte: string): void {
    this.elMessage.textContent = texte
    this.elMessage.hidden = false
    const fin = this.finMessage = performance.now() + 3000
    setTimeout(() => { if (this.finMessage === fin) this.elMessage.hidden = true }, 3000)
  }

  private verifier(a: AppareilEngin): void {
    const e = this.etat!
    if (verifier(e, a)) {
      navigator.vibrate?.(40)
      if (depannageFini(e)) { this.terminer(); return }
      this.dire('Module réparé. Au suivant !')
    } else {
      navigator.vibrate?.(150)
      this.dire('Fausse manœuvre : le module est toujours en défaut. Relis le Manuel.')
    }
  }

  private terminer(): void {
    const e = this.etat!
    const suite = this.options!.surFin(e.erreurs)
    this.elFin.innerHTML = '<div class="carte-fin"><b>ENGIN RÉPARÉ</b>'
      + `<p>${e.erreurs ? `${e.erreurs} fausse${e.erreurs > 1 ? 's' : ''} manœuvre${e.erreurs > 1 ? 's' : ''} dans le rapport.` : 'Sans une fausse manœuvre : prime de 10 %.'}</p>`
      + `<p class="petit">${suite}</p><div class="boutons-fin"><button type="button" class="principal" data-fermer>FERMER</button></div></div>`
    this.elFin.hidden = false
  }

  private afficher(): void {
    const e = this.etat
    if (!e) return
    const voyant = VOYANTS.find((v) => v.voyant === e.voyant)!
    let html = '<div class="plaque"><div><small>BOÎTIER TECHNIQUE</small><b>BUS ' + e.bus + '</b></div>'
      + `<div class="voyant-defaut"><i style="background:${voyant.teinte}"></i><small>${voyant.titre}</small></div>`
      + '<button type="button" data-manuel>📖 MANUEL</button></div>'
    for (const { appareil, titre, module } of APPAREILS_ENGIN) {
      const enDefaut = e.enDefaut.includes(appareil), repare = e.repares.includes(appareil)
      if (!enDefaut) { html += `<div class="module-engin calme"><span class="lampe verte"></span><b>MODULE ${module} — ${titre}</b><small>en état</small></div>`; continue }
      html += `<div class="module-engin${repare ? ' repare' : ''}"><div class="titre-module"><span class="lampe ${repare ? 'verte' : 'rouge'}"></span><b>MODULE ${module} — ${titre}</b></div>`
      if (appareil === 'disjoncteurs') {
        html += '<div class="leviers">' + e.leviers.map((leve, k) => `<button type="button" data-levier="${k}" class="${leve ? 'leve' : 'baisse'}"${repare ? ' disabled' : ''}>`
          + `<i></i><small>${k + 1}</small></button>`).join('') + '</div>'
      } else if (appareil === 'cablage') {
        html += '<div class="cablage"><div class="cables">' + CABLES.map((c, k) => `<button type="button" data-cable="${k}" class="${this.cableChoisi === k ? 'choisi' : ''}"${repare ? ' disabled' : ''}>`
          + `<i style="background:${c.teinte}"></i>${c.titre}<small>${e.prises[k] ? `→ ${e.prises[k]}` : '—'}</small></button>`).join('') + '</div>'
          + '<div class="prises">' + [1, 2, 3, 4].map((p) => {
            const k = e.prises.indexOf(p)
            return `<button type="button" data-prise="${p}"${repare || this.cableChoisi === null ? ' disabled' : ''}><b>${p}</b>${k >= 0 ? `<i style="background:${CABLES[k].teinte}"></i>` : '<i class="vide"></i>'}</button>`
          }).join('') + '</div></div>'
          + (repare ? '' : `<p class="aide">${this.cableChoisi === null ? 'Touche un câble, puis sa prise.' : `Câble ${CABLES[this.cableChoisi].titre} : touche sa prise.`}</p>`)
      } else {
        html += '<div class="gyro"><div class="ecran-gyro">' + e.symboles.map((s) => `<span>${SYMBOLES_GYRO[s]}</span>`).join('') + '</div><div class="molettes">'
          + e.molettes.map((m, k) => `<div class="molette"><button type="button" data-molette="${k}" data-pas="1"${repare ? ' disabled' : ''}>▲</button><b>${m}</b>`
            + `<button type="button" data-molette="${k}" data-pas="-1"${repare ? ' disabled' : ''}>▼</button></div>`).join('') + '</div></div>'
      }
      html += repare ? '<p class="repare-texte">RÉPARÉ</p>' : `<button type="button" class="verifier" data-verifier="${appareil}">VÉRIFIER</button>`
      html += '</div>'
    }
    this.elCorps.innerHTML = html
  }
}
