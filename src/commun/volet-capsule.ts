// Le volet Capsule : crédits, moteur, position ; les modules viendront à l'étape 4 (pannes et manuel).

import { lignesDuBandeau } from '../moteur/bandeau'
import type { Jeu } from '../moteur/jeu'
import { texteLigne } from './bandeau'

let dernier = ''

export function afficherCapsule(element: HTMLElement, jeu: Jeu, t: number, vitesseForcee: number | null): void {
  const m = jeu.moteur()
  const position = lignesDuBandeau(jeu.mission, t).map((l) => texteLigne(l, t))
    .map((l) => `<b>${l.titre}</b><br>${l.detail}`).join('<br>')
  const essai = vitesseForcee !== null ? `<br><i>essai : vitesse forcée à ${vitesseForcee.toLocaleString('fr-FR')} km/s</i>` : ''
  const html = `
    <div class="rubrique-capsule"><span class="etiquette">Crédits</span><span class="valeur">${jeu.credits.toLocaleString('fr-FR')}</span></div>
    <div class="rubrique-capsule"><span class="etiquette">Moteur</span><span class="valeur">niveau ${m.niveau} · ${m.vitesse} km/s${essai}</span></div>
    <div class="rubrique-capsule"><span class="etiquette">Position</span><span class="valeur">${position}</span></div>
    <div class="rubrique-capsule grise"><span class="etiquette">Modules</span><span class="valeur">à venir (pannes et manuel)</span></div>`
  if (html !== dernier) element.innerHTML = dernier = html
}
