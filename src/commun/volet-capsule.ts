// Le volet Capsule, onglet ÉTAT : le moteur (niveau, vitesse) et l'achat du suivant avec les crédits (étape 3) ; les
// systèmes de la capsule (blocs du panneau) et leurs pannes (étape 4). Le volet affiche l'état du jeu et transmet le
// choix du joueur.

import { MODULES, type NomModule } from '../donnees/modules'
import { CAPACITE_SOUTE } from '../donnees/marche'
import type { Jeu } from '../moteur/jeu'

export class VoletCapsule {
  private dernier = ''

  constructor(private element: HTMLElement, acheter: () => void, reparer: (m: NomModule) => void, versPanneau: (m: NomModule) => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix]')
      if (!b || b.disabled) return
      if (b.dataset.choix === 'acheter') acheter()
      else if (b.dataset.choix === 'reparer') reparer(b.dataset.module as NomModule)
      else if (b.dataset.choix === 'panneau') versPanneau(b.dataset.module as NomModule)
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
    // Systèmes : en état ou en panne. Ceux dont un module est raccordé se réparent sur le panneau ; les autres, en
    // attendant leur section du manuel, d'un bouton (procédure provisoire).
    html += '<h3>Modules</h3><div class="bloc modules">' + MODULES.map((f) => {
      const panne = jeu.enPanne(f.nom)
      const action = !panne ? '<span class="ok">✓</span>'
        : !jeu.reparationProvisoire(f.nom) ? `<button type="button" data-choix="panneau" data-module="${f.nom}">PANNEAU</button>`
          : `<button type="button" data-choix="reparer" data-module="${f.nom}">RÉPARER</button>`
      return `<div class="module${panne ? ' en-panne' : ''}"><span><b>${f.titre}</b><br><small>${panne ? `EN PANNE : ${f.effet}` : 'en état'}</small></span>${action}</div>`
    }).join('') + '<p class="note">Communications et Énergie se réparent sur le panneau, avec le manuel. Moteur, Navigation et Coque : réparation provisoire, en attendant leur section du manuel.</p></div>'
    if (html !== this.dernier) this.element.innerHTML = this.dernier = html
  }
}

/**
 * L'onglet SOUTE du volet Capsule (écrans d'abord : décision d'Adrien du 18/10/2026) : ce qui est à bord. Pour
 * l'instant, la cargaison d'une livraison ; les matériaux des épaves (étape 5) et les marchandises du Marché
 * (étape 7) viendront ici.
 */
export function htmlSoute(jeu: Jeu): string {
  const c = jeu.cargaison()
  return `<h3>Soute · 0 / ${CAPACITE_SOUTE} t</h3><div class="bloc">`
    + (c ? `<div class="module"><span><b>Cargaison à livrer</b><br><small>pour ${c.pour} (mission)</small></span><span class="ok">1 caisse</span></div>` : '<div>Soute vide.</div>')
    + '<p class="note">Les matériaux récupérés dans les épaves et les marchandises achetées au Marché viendront ici.</p></div>'
    + '<div class="vers-marche"><button type="button" data-page="marche">MARCHÉ ›</button></div>'
}
