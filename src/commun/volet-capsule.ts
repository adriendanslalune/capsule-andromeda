// Le volet Capsule : le moteur (niveau, vitesse) et l'achat du suivant avec les crédits (étape 3) ; les modules
// viendront à l'étape 4 (pannes et manuel). Le volet affiche l'état du jeu et transmet le choix du joueur.

import type { Jeu } from '../moteur/jeu'

export class VoletCapsule {
  private dernier = ''

  constructor(private element: HTMLElement, acheter: () => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix="acheter"]')
      if (b && !b.disabled) acheter()
    })
  }

  afficher(jeu: Jeu): void {
    const m = jeu.moteur(), suivant = jeu.moteurSuivant()
    const nombre = (n: number) => n.toLocaleString('fr-FR')
    let html = `<h3>Moteur</h3><div class="bloc"><b>Niveau ${m.niveau}</b> · ${nombre(m.vitesse)} km/s</div>`
    if (suivant) {
      const manque = suivant.prix - jeu.credits
      html += `<h3>Moteur suivant</h3><div class="bloc"><div><b>Niveau ${suivant.niveau}</b> · ${nombre(suivant.vitesse)} km/s`
        + ` · ${(suivant.vitesse / m.vitesse).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} fois plus rapide</div>`
        + `<div class="achat"><span class="prix">${nombre(suivant.prix)} crédits</span>`
        + `<button type="button" data-choix="acheter"${manque > 0 ? ' disabled' : ''}>ACHETER</button></div>`
        + (manque > 0 ? `<div class="manque">Il manque ${nombre(manque)} crédit${manque > 1 ? 's' : ''} : fais des missions.</div>` : '')
        + '</div>'
    } else html += '<div class="bloc">Ton moteur est au niveau le plus haut, pour l\'instant.</div>'
    html += '<h3>Modules</h3><div class="bloc grise">À venir (pannes et manuel).</div>'
    if (html !== this.dernier) this.element.innerHTML = this.dernier = html
  }
}
