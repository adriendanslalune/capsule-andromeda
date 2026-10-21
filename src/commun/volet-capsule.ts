// Le volet Capsule, onglet ÉTAT : le moteur (niveau, vitesse) et l'achat du suivant avec les crédits (étape 3) ; les
// systèmes de la capsule (blocs du panneau) et leurs pannes (étape 4). Le volet affiche l'état du jeu et transmet le
// choix du joueur.

import { MODULES, type NomModule } from '../donnees/modules'
import { CAPACITE_SOUTE } from '../donnees/marche'
import { ARMEMENT } from '../donnees/combat'
import type { Jeu } from '../moteur/jeu'
import { avec, picto, SYMBOLE_MODULE } from './symboles'

export class VoletCapsule {
  private dernier = ''

  constructor(private element: HTMLElement, acheter: () => void, reparer: (m: NomModule) => void, versPanneau: (m: NomModule) => void,
    depanneur: (m: NomModule) => void) {
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix]')
      if (!b || b.disabled) return
      if (b.dataset.choix === 'acheter') acheter()
      else if (b.dataset.choix === 'reparer') reparer(b.dataset.module as NomModule)
      else if (b.dataset.choix === 'panneau') versPanneau(b.dataset.module as NomModule)
      else if (b.dataset.choix === 'depanneur') depanneur(b.dataset.module as NomModule)
    })
  }

  afficher(jeu: Jeu): void {
    const m = jeu.moteur(), suivant = jeu.moteurSuivant()
    const nombre = (n: number) => n.toLocaleString('fr-FR')
    const panne = jeu.enPanne('moteur') ? ` <span class="panne">· EN PANNE : ${nombre(jeu.vitesse())} km/s</span>` : ''
    let html = `<h3>Moteur</h3><div class="bloc"><div class="vals"><b>${avec('moteur', `Niveau ${m.niveau}`)}</b>${avec('vitesse', `${nombre(m.vitesse)} km/s max`)}</div>${panne}</div>`
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
      + pannes.map((f) => `<div class="effet-panne">${picto('panne')} <b>${f.titre}</b> : ${f.effet}</div>`
        + `<button type="button" class="depanneur" data-choix="depanneur" data-module="${f.nom}">APPELER LE DÉPANNEUR · ${jeu.prixDepanneur() ? `${nombre(jeu.prixDepanneur())} cr.` : 'gratuit'}</button>`).join('')
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
/**
 * L'onglet ARMEMENT (décisions d'Adrien du 21/10/2026) : quatre lignes (coque, canon, bombes, bouclier), six niveaux
 * chacune, payés en crédits et en matériaux de la soute ; +1 niveau sur la ligne de sa Maison. Puis les simulateurs.
 */
export function htmlArmement(jeu: Jeu): string {
  const tonnes = (q: number) => q.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  let html = '<h3>Armement</h3>'
  for (const f of ARMEMENT) {
    const n = jeu.armement[f.ligne], effectif = jeu.niveauArmement(f.ligne), manque = jeu.manquePourArmement(f.ligne)
    const bonus = effectif > n ? ` <small class="bonus-maison">+1 Maison</small>` : ''
    html += `<div class="bloc ligne-armement"><div class="tete-armement"><b>${f.titre}</b><span class="niveau">niv. ${n}${bonus}</span></div>`
      + `<div class="effet"><small>${f.effet}</small><b>${f.texte(f.valeurs[effectif - 1])}</b>`
      + (manque ? `<span class="suivant">→ ${f.texte(f.valeurs[effectif])}</span>` : '') + '</div>'
    if (manque) {
      const besoin = f.materiaux[n]
      const materiaux = Object.entries(besoin).map(([nom, q]) => {
        const assez = !manque.materiaux[nom]
        return `<span class="materiau${assez ? ' assez' : ''}">${assez ? '✓' : '·'} ${nom} ${tonnes(Math.min(q, jeu.soute[nom] ?? 0))}/${q} t</span>`
      }).join('')
      const bloque = manque.credits > 0 || Object.keys(manque.materiaux).length > 0
      html += `<div class="achat-armement"><span class="prix">${avec('credits', manque.prix.toLocaleString('fr-FR'))}</span>${materiaux}`
        + `<button type="button" data-ameliorer="${f.ligne}"${bloque ? ' disabled' : ''}>AMÉLIORER</button></div>`
    } else html += '<div class="achat-armement"><small>Au plus haut.</small></div>'
    html += '</div>'
  }
  return html
    + '<p class="note">Membre d\'une Maison : +1 niveau gratuit sur sa ligne (Mercenaires : le canon ; Ingénieurs : le bouclier ; Nettoyeurs : les bombes). Plus on s\'éloigne du Soleil, plus les aliens sont coriaces : améliore ton armement pour suivre.</p>'
    + '<h3>Simulateur</h3><div class="vers-combat"><button type="button" data-combat="1">PRÈS DE LA TERRE</button>'
    + '<button type="button" data-combat="12">VERS JUPITER</button><button type="button" data-combat="60">VERS PLUTON</button></div>'
    + '<p class="note">Un combat d\'entraînement avec ton armement, sans conséquence pour ta capsule.</p>'
}
