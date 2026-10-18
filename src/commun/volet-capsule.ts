// Le volet Capsule : le moteur (niveau, vitesse) et l'achat du suivant avec les crédits (étape 3) ; les modules
// viendront à l'étape 4 (pannes et manuel). Le volet affiche l'état du jeu et transmet le choix du joueur.

import { MODULES, type NomModule } from '../donnees/modules'
import type { Jeu } from '../moteur/jeu'

export class VoletCapsule {
  private dernier = ''

  constructor(private element: HTMLElement, acheter: () => void, reparer: (m: NomModule) => void, versPanneau: () => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix]')
      if (!b || b.disabled) return
      if (b.dataset.choix === 'acheter') acheter()
      else if (b.dataset.choix === 'reparer') reparer(b.dataset.module as NomModule)
      else if (b.dataset.choix === 'panneau') versPanneau()
    })
  }

  afficher(jeu: Jeu): void {
    const m = jeu.moteur(), suivant = jeu.moteurSuivant()
    const nombre = (n: number) => n.toLocaleString('fr-FR')
    const panne = jeu.enPanne('moteur') ? ` <span class="panne">· EN PANNE : ${nombre(jeu.vitesse())} km/s</span>` : ''
    let html = `<h3>Moteur</h3><div class="bloc"><b>Niveau ${m.niveau}</b> · ${nombre(m.vitesse)} km/s${panne}</div>`
    if (suivant) {
      const manque = suivant.prix - jeu.credits
      html += `<h3>Moteur suivant</h3><div class="bloc"><div><b>Niveau ${suivant.niveau}</b> · ${nombre(suivant.vitesse)} km/s`
        + ` · ${(suivant.vitesse / m.vitesse).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} fois plus rapide</div>`
        + `<div class="achat"><span class="prix">${nombre(suivant.prix)} crédits</span>`
        + `<button type="button" data-choix="acheter"${manque > 0 ? ' disabled' : ''}>ACHETER</button></div>`
        + (manque > 0 ? `<div class="manque">Il manque ${nombre(manque)} crédit${manque > 1 ? 's' : ''} : fais des missions.</div>` : '')
        + '</div>'
    } else html += '<div class="bloc">Ton moteur est au niveau le plus haut, pour l\'instant.</div>'
    // Modules : en état ou en panne. En attendant le panneau de réparation (4.2), un bouton répare d'un coup.
    html += '<h3>Modules</h3><div class="bloc modules">' + MODULES.map((f) => {
      const panne = jeu.enPanne(f.nom)
      // L'Énergie se répare sur le panneau ; les autres modules, en attendant leur section du manuel, d'un bouton.
      const action = !panne ? '<span class="ok">✓</span>'
        : f.nom === 'energie' ? '<button type="button" data-choix="panneau">PANNEAU</button>'
          : `<button type="button" data-choix="reparer" data-module="${f.nom}">RÉPARER</button>`
      return `<div class="module${panne ? ' en-panne' : ''}"><span><b>${f.titre}</b><br><small>${panne ? `EN PANNE : ${f.effet}` : 'en état'}</small></span>${action}</div>`
    }).join('') + '<p class="note">L\'Énergie se répare sur le panneau, avec le manuel. Les autres modules : réparation provisoire, en attendant leur section du manuel.</p></div>'
    if (html !== this.dernier) this.element.innerHTML = this.dernier = html
  }
}
