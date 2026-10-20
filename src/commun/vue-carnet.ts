// Le carnet des Voix perdues (Plus › Collections ; décisions d'Adrien du 20/10/2026) : les bandes enregistrées à la
// radio, rangées par système, avec leur texte ; les autres restent grisées. Lues dans l'ordre, elles racontent
// l'invasion. La vue ne calcule rien : les voix viennent de moteur/radio.ts.

import { NOMBRE_VOIX, VOIX_PAR_SYSTEME } from '../donnees/radio'
import { texteVoix, VOIX, type EtatRadio } from '../moteur/radio'

const du = (s: string) => (s === 'Terre' ? 'de la Terre' : `de ${s}`)

export class VueCarnet {
  constructor(private element: HTMLElement, private radio: () => EtatRadio) {
    element.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-fermer]')) element.hidden = true })
  }

  ouvrir(): void {
    const r = this.radio(), captees = new Set(r.captees)
    let html = `<div class="entete-plein"><span>Voix perdues</span><button type="button" data-fermer>FERMER</button></div><div class="corps">`
      + `<p class="bilan-classeur"><b>${captees.size} / ${NOMBRE_VOIX}</b><small>Des équipages ont laissé leur voix sur la bande OC. Cherche-les à la radio, dans leur système, à leur heure.</small></p>`
    for (const systeme of Object.keys(VOIX_PAR_SYSTEME)) {
      const voix = VOIX.filter((v) => v.systeme === systeme)
      html += `<h3>Système ${du(systeme)} · ${voix.filter((v) => captees.has(v.numero)).length} / ${voix.length}</h3><div class="bandes-systeme">`
      html += voix.map((v) => {
        const t = texteVoix(v)
        if (!captees.has(v.numero) || !t) return `<div class="bande"><b>Bande n° ${v.numero}</b><span class="vide">· · · · · ·</span></div>`
        return `<div class="bande captee"><b>Bande n° ${v.numero}</b><small>${t.auteur} · ${t.lieu} · jour ${t.jour}</small><p>${t.texte}</p></div>`
      }).join('') + '</div>'
    }
    this.element.innerHTML = html + '</div>'
    this.element.hidden = false
  }
}
