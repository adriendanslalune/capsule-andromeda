// Le carnet des Voix perdues (Plus › Collections ; décisions d'Adrien du 20/10/2026) : les bandes enregistrées à la
// radio, rangées par système, avec leur texte ; les autres restent grisées. Lues dans l'ordre, elles racontent
// l'invasion. La vue ne calcule rien : les voix viennent de moteur/radio.ts.

import { DUREE_EMISSION, NOMBRE_VOIX, VOIX_PAR_SYSTEME } from '../donnees/radio'
import { debutEmission, emet, texteVoix, VOIX, type EtatRadio } from '../moteur/radio'

const du = (s: string) => (s === 'Terre' ? 'de la Terre' : `de ${s}`)

export class VueCarnet {
  constructor(private element: HTMLElement, private radio: () => EtatRadio, private maintenant: () => number) {
    element.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-fermer]')) element.hidden = true })
  }

  ouvrir(): void {
    const r = this.radio(), captees = new Set(r.captees), maintenant = this.maintenant()
    let html = `<div class="entete-plein"><span>Voix perdues</span><button type="button" data-fermer>FERMER</button></div><div class="corps">`
      + `<p class="bilan-classeur"><b>${captees.size} / ${NOMBRE_VOIX}</b><small>Des équipages ont laissé leur voix sur la bande OC. Chacune émet une fois par jour, une demi-heure, à son heure : sois dans son système à ce moment-là et cherche sa fréquence à la radio.</small></p>`
    for (const systeme of Object.keys(VOIX_PAR_SYSTEME)) {
      const voix = VOIX.filter((v) => v.systeme === systeme)
      html += `<h3>Système ${du(systeme)} · ${voix.filter((v) => captees.has(v.numero)).length} / ${voix.length}</h3><div class="bandes-systeme">`
      html += voix.map((v) => {
        const t = texteVoix(v)
        // Une voix qui manque donne son heure (l'heure du téléphone), pas sa fréquence (décision d'Adrien du 22/10/2026).
        if (!t) return `<div class="bande"><b>Bande n° ${v.numero}</b><span class="vide">· · · · · ·</span></div>`
        if (!captees.has(v.numero)) {
          // De telle heure à telle heure (demande d'Adrien du 22/10/2026).
          const debut = debutEmission(v, maintenant), h = (x: number) => new Date(x).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          return `<div class="bande"><b>Bande n° ${v.numero}</b><span class="heure-voix">${emet(v, maintenant) ? `émet en ce moment, jusqu'à ${h(debut + DUREE_EMISSION)} !` : `chaque jour de ${h(debut)} à ${h(debut + DUREE_EMISSION)}`}</span></div>`
        }
        return `<div class="bande captee"><b>Bande n° ${v.numero}</b><small>${t.auteur} · ${t.lieu} · jour ${t.jour}</small><p>${t.texte}</p></div>`
      }).join('') + '</div>'
    }
    this.element.innerHTML = html + '</div>'
    this.element.hidden = false
  }
}
