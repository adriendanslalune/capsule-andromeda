// Le volet Capsule, onglet ÉTAT : le moteur (niveau, vitesse) et l'achat du suivant avec les crédits (étape 3) ; les
// systèmes de la capsule (blocs du panneau) et leurs pannes (étape 4). Le volet affiche l'état du jeu et transmet le
// choix du joueur.

import { MODULES, type NomModule } from '../donnees/modules'
import { CAPACITE_SOUTE } from '../donnees/marche'
import { COQUE_MAX, ENERGIE_TOTALE, INTERCEPTEURS, MAX_PAR_SYSTEME, SYSTEMES_ENERGIE, type Energie } from '../donnees/combat'
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
    + '<div class="vers-combat"><button type="button" data-tri>ENTRAÎNEMENT AU TRI D\'ÉPAVE</button></div>'
    + '<p class="note-soute">Le tri des matériaux des Nettoyeurs : un prototype à tester, sans conséquence pour ta capsule.</p>'
}

/** La répartition de l'énergie : un cran par case, des boutons − et + par système (Armement et combat). */
export function htmlEnergie(en: Energie): string {
  const libres = ENERGIE_TOTALE - en.boucliers - en.armes - en.moteurs
  return SYSTEMES_ENERGIE.map((f) => `<div class="systeme"><span><b>${f.titre}</b><small>${f.role}</small></span><span class="crans">`
    + `<button type="button" data-energie="${f.systeme}" data-d="-1"${en[f.systeme] === 0 ? ' disabled' : ''} aria-label="moins">−</button>`
    + Array.from({ length: MAX_PAR_SYSTEME }, (_, i) => `<i${i < en[f.systeme] ? ' class="rempli"' : ''}></i>`).join('')
    + `<button type="button" data-energie="${f.systeme}" data-d="1"${libres === 0 || en[f.systeme] === MAX_PAR_SYSTEME ? ' disabled' : ''} aria-label="plus">+</button></span></div>`).join('')
    + `<p class="libres">${libres} cran${libres > 1 ? 's' : ''} libre${libres > 1 ? 's' : ''} sur ${ENERGIE_TOTALE}</p>`
}

/**
 * L'onglet ARMEMENT du volet Capsule (étape 6, écrans d'abord ; d'après la maquette validée le 18/10/2026) :
 * l'énergie à répartir, l'équipement, et le simulateur de combat (le prototype à tester).
 */
export function htmlArmement(jeu: Jeu): string {
  return `<h3>Énergie à répartir</h3><div class="bloc energie">${htmlEnergie(jeu.energie)}</div>`
    + '<h3>Équipement</h3><div class="bloc">'
    + '<div class="module"><span><b>Canon à rivets</b><br><small>tire sur un module ennemi</small></span><span class="ok">niv. 1</span></div>'
    + `<div class="module"><span><b>Intercepteurs</b><br><small>abattent un missile en approche</small></span><span class="ok">${INTERCEPTEURS}</span></div>`
    + `<div class="module"><span><b>Coque</b><br><small>points de résistance en combat</small></span><span class="ok">${COQUE_MAX}</span></div>`
    + '<div class="module grise"><span><b>Lance-missiles</b><br><small>à venir</small></span><span class="ok">—</span></div>'
    + '</div><div class="vers-combat"><button type="button" data-combat>SIMULATEUR DE COMBAT</button></div>'
    + '<p class="note">Un prototype à tester : un chasseur alien d\'entraînement, sans conséquence pour ta capsule.</p>'
}
