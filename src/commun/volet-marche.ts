// Le volet Marché (étape 7, écrans d'abord : décision d'Adrien du 18/10/2026, d'après la maquette) : les marchés du
// système solaire, avec l'âge de leurs cours (délai de la lumière), et les cours du marché choisi. Pour l'instant les
// cours sont des cours d'essai et on ne peut ni acheter ni vendre : la mécanique du commerce viendra ensuite.

import { MARCHES } from '../donnees/marche'
import type { Jeu } from '../moteur/jeu'
import { coursDuMarche, delaiLumiere } from '../moteur/marche'

/** Âge des cours, lisible : « 1,3 s », « 12 min 40 s », « 1 h 05 min ». */
export function texteDelai(ms: number): string {
  const s = ms / 1000
  if (s < 0.1) return 'en direct'
  if (s < 60) return `${s.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${String(Math.round(s % 60)).padStart(2, '0')} s`
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
}

export class VoletMarche {
  private dernier = ''
  /** Marché choisi (son numéro dans MARCHES), ou null : le plus proche. */
  private choisi: number | null = null

  constructor(private element: HTMLElement, private rafraichir: () => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-marche]')
      if (!b) return
      this.choisi = Number(b.dataset.marche)
      this.rafraichir()
    })
  }

  afficher(jeu: Jeu, t: number): void {
    const delais = MARCHES.map((m) => delaiLumiere(m.lieu, t))
    const plusProche = delais.indexOf(Math.min(...delais))
    const k = this.choisi ?? plusProche
    const ici = (i: number) => jeu.mission.phase(t) === 'orbite' && jeu.mission.centre(t) === MARCHES[i].lieu
    const m = MARCHES[k]
    let html = '<div class="places">' + MARCHES.map((f, i) =>
      `<button type="button" data-marche="${i}"${i === k ? ' class="actif"' : ''}>${f.nom}<br><small>${f.region} · ${ici(i) ? 'ici' : texteDelai(delais[i])}</small></button>`).join('') + '</div>'
    html += `<p class="note-marche">${ici(k) ? `Tu es à <b>${m.nom}</b> : cours en direct.`
      : delais[k] < 100 ? `Cours de <b>${m.nom}</b> en direct : tu es tout près.`
        : `Cours de <b>${m.nom}</b> reçus avec <b>${texteDelai(delais[k])}</b> de retard (délai de la lumière). Le temps d'y aller, ils auront bougé.`}</p>`
    html += '<div class="bloc"><table class="cours"><tr><th>MARCHANDISE</th><th>ACHAT</th><th>VENTE</th><th></th><th>SOUTE</th></tr>'
      + coursDuMarche(m).map((c) => `<tr><td><b>${c.marchandise}</b></td><td>${c.achat}</td><td>${c.vente}</td>`
        + `<td class="${c.tendance > 0 ? 'hausse' : c.tendance < 0 ? 'baisse' : ''}">${c.tendance > 0 ? '▲' : c.tendance < 0 ? '▼' : '·'}</td><td>—</td></tr>`).join('')
      + '</table></div>'
    html += '<div class="achat-vente"><button type="button" disabled>ACHETER</button><button type="button" class="principal" disabled>VENDRE</button></div>'
    html += '<p class="note">Cours d\'essai, en crédits la tonne. Acheter et vendre viendront avec le commerce (étape 7).</p>'
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
  }
}
