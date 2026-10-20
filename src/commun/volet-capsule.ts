// Le volet Capsule, onglet ÉTAT : le moteur (niveau, vitesse) et l'achat du suivant avec les crédits (étape 3) ; les
// systèmes de la capsule (blocs du panneau) et leurs pannes (étape 4). Le volet affiche l'état du jeu et transmet le
// choix du joueur.

import { MODULES, type NomModule } from '../donnees/modules'
import { CAPACITE_SOUTE } from '../donnees/marche'
import { BOMBES, COQUE_MAX } from '../donnees/combat'
import type { Jeu } from '../moteur/jeu'
import { avec, picto, SYMBOLE_MODULE } from './symboles'

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
    let html = `<h3>Moteur</h3><div class="bloc"><div class="vals"><b>${avec('moteur', `Niveau ${m.niveau}`)}</b>${avec('vitesse', `${nombre(m.vitesse)} km/s max`)}</div>${panne}`
      + '<div class="manque">Accélération et freinage à 10 g : sur les trajets courts, la capsule n\'a pas le temps d\'atteindre sa vitesse max.</div></div>'
    if (suivant) {
      const manque = jeu.manquePourMoteur()
      const tonnes = (q: number) => q.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
      // Les matériaux du niveau : ce qu'il faut, ce qu'on a dans la soute (coché quand il y en a assez).
      const materiaux = Object.entries(suivant.materiaux).map(([nom, n]) => {
        const assez = !manque.materiaux[nom]
        return `<div class="materiau${assez ? ' assez' : ''}"><span>${assez ? '✓' : '·'} ${nom}</span><span>${tonnes(Math.min(n, jeu.soute[nom] ?? 0))} / ${n} t</span></div>`
      }).join('')
      const bloque = manque.credits > 0 || Object.keys(manque.materiaux).length > 0
      const conseil = manque.credits > 0 && Object.keys(manque.materiaux).length ? 'fais des missions, et trouve les matériaux au Comptoir ou dans les épaves'
        : manque.credits > 0 ? 'fais des missions' : 'trouve les matériaux au Comptoir ou dans les épaves'
      html += `<h3>Moteur suivant</h3><div class="bloc"><div class="vals"><b>${avec('moteur', `Niveau ${suivant.niveau}`)}</b>${avec('vitesse', `${nombre(suivant.vitesse)} km/s max`)}`
        + `<span>(×${(suivant.vitesse / m.vitesse).toLocaleString('fr-FR', { maximumFractionDigits: 1 })})</span></div>`
        + `<div class="materiaux-moteur">${avec('soute', 'à fournir')}${materiaux}</div>`
        + `<div class="achat"><span class="prix">${avec('credits', nombre(suivant.prix))}</span>`
        + `<button type="button" data-choix="acheter"${bloque ? ' disabled' : ''}>ACHETER</button></div>`
        + (bloque ? `<div class="manque">${manque.credits > 0 ? `Il manque ${nombre(manque.credits)} crédit${manque.credits > 1 ? 's' : ''}. ` : ''}`
          + `${conseil.charAt(0).toUpperCase()}${conseil.slice(1)}.</div>` : '')
        + '</div>'
    } else html += '<div class="bloc">Ton moteur est au niveau le plus haut.</div>'
    // Systèmes : en état ou en panne ; ils se réparent tous sur le panneau, avec le manuel (le bouton RÉPARER ne sert
    // plus qu'à un bloc en panne sans module en défaut, ce qui n'arrive plus).
    // Les cinq modules en tuiles (décision d'Adrien du 20/10/2026) : une pastille dit leur état ; toucher un module en
    // panne ouvre le panneau de réparation à son bloc. Sous les tuiles, l'effet de chaque panne.
    const pannes = MODULES.filter((f) => jeu.enPanne(f.nom))
    html += '<h3>Modules</h3><div class="bloc"><div class="tuiles-modules">' + MODULES.map((f) => {
      const panne = jeu.enPanne(f.nom)
      const choix = !panne ? '' : ` data-choix="${jeu.reparationProvisoire(f.nom) ? 'reparer' : 'panneau'}" data-module="${f.nom}"`
      return `<button type="button" class="tuile-module${panne ? ' en-panne' : ''}"${choix}>${picto(SYMBOLE_MODULE[f.nom])}${f.titre === 'Communications' ? 'COMMS' : f.titre === 'Navigation' ? 'NAVIG.' : f.titre.toUpperCase()}<b>${panne ? '!' : '✓'}</b></button>`
    }).join('') + '</div>'
      + pannes.map((f) => `<div class="effet-panne">${picto('panne')} <b>${f.titre}</b> : ${f.effet}</div>`).join('')
      + `<p class="note">${pannes.length ? 'Touche un module en panne pour le réparer sur le panneau, avec le manuel.' : 'Tous les modules sont en état.'}</p></div>`
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
  const r = jeu.remorque()
  const charge = jeu.chargeSoute()
  const t = (q: number) => q.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  const lignes = Object.entries(jeu.soute).filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1])
  return `<h3>Soute · ${t(charge)} / ${CAPACITE_SOUTE} t</h3>`
    + `<div class="jauge-soute"><i style="width:${Math.min(100, (100 * charge) / CAPACITE_SOUTE)}%"></i></div><div class="bloc">`
    + (c ? `<div class="module"><span><b>Cargaison à livrer</b><br><small>pour ${c.pour} (mission)</small></span><span class="ok">1 caisse</span></div>` : '')
    + (r ? `<div class="module"><span><b>En remorque : ${r.epave}</b><br><small>à larguer à ${r.pour} (mission)</small></span><span class="ok">au câble</span></div>` : '')
    + lignes.map(([m, q]) => `<div class="module"><span><b>${m}</b></span><span class="ok">${t(q)} t</span></div>`).join('')
    + (!c && !r && !lignes.length ? '<div>Soute vide.</div><p class="note">Les matériaux triés dans les épaves (missions de nettoyage) viennent ici ; ils servent au moteur, ou se vendent au Comptoir (Marché).</p>' : '')
    + '</div>'
    + '<div class="vers-combat"><button type="button" data-tri>ENTRAÎNEMENT AU TRI D\'ÉPAVE</button></div>'
    + '<p class="note-soute">Pour s\'exercer au tri des matériaux, sans conséquence pour ta capsule.</p>'
}


/**
 * L'onglet ARMEMENT du volet Capsule : comment se bat la capsule (en temps réel, décision d'Adrien du 19/10/2026), son
 * équipement (les améliorations s'achèteront plus tard), et le simulateur de combat.
 */
export function htmlArmement(_jeu: Jeu): string {
  return '<h3>Le combat</h3><div class="bloc"><p class="note">Vu du dessus, en temps réel. Glisse le doigt : la capsule le '
    + 'suit et tire toute seule. Esquive les balles des aliens ; abats le chasseur. Plus il y a d\'aliens (loin de la Terre), '
    + 'plus c\'est dur.</p></div>'
    + '<h3>Équipement</h3><div class="bloc">'
    + '<div class="module"><span><b>Canons</b><br><small>tir automatique, double</small></span><span class="ok">niv. 1</span></div>'
    + `<div class="module"><span><b>Bombes</b><br><small>effacent toutes les balles, abîment tous les aliens</small></span><span class="ok">${BOMBES}</span></div>`
    + `<div class="module"><span><b>Coque</b><br><small>à 0 : retraite, la Coque tombe en panne</small></span><span class="ok">${COQUE_MAX}</span></div>`
    + '<div class="module grise"><span><b>Améliorations</b><br><small>canons, bombes, coque : plus tard, avec les crédits</small></span><span class="ok">—</span></div>'
    + '</div><div class="vers-combat"><button type="button" data-combat="1">SIMULATEUR · PRÈS DE LA TERRE</button>'
    + '<button type="button" data-combat="60">SIMULATEUR · VERS PLUTON</button></div>'
    + '<p class="note">Un combat d\'entraînement, sans conséquence pour ta capsule.</p>'
}
