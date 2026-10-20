// Les collections (Plus › Collections ; demande d'Adrien du 20/10/2026 : le classeur des monolithes doit être mis en
// valeur, et d'autres collections viendront). Chaque collection a sa couverture : ce qu'on en a trouvé, une jauge, le
// statut gagné et le prochain palier, et le bouton qui ouvre son classeur.

import { NOMBRE_MONOLITHES } from '../donnees/monolithes'
import { palierSuivant, statut } from '../moteur/monolithes'
import type { Jeu } from '../moteur/jeu'

const PIERRE = '<svg viewBox="0 0 40 56" aria-hidden="true"><ellipse cx="20" cy="50" rx="15" ry="3.5" class="sol"/><path class="pierre" d="M13 8h14v42H13z"/><path class="reflet" d="M15 11h3v36h-3z"/><path class="glyphe" d="M20 20v6M17 23h6"/></svg>'

export function htmlCollections(jeu: Jeu): string {
  const n = jeu.monolithes.trouves.length, rang = statut(n), suivant = palierSuivant(n)
  return '<button type="button" class="retour" data-page="plus">‹ Plus</button>'
    + '<div class="couverture monolithes">'
    + `<div class="illustration">${PIERRE}</div>`
    + '<div class="texte-couverture"><h2 class="titre-pulp">Monolithes</h2>'
    + `<b class="compte">${n} <small>/ ${NOMBRE_MONOLITHES}</small></b>`
    + `<div class="jauge-collection"><i style="width:${(100 * n) / NOMBRE_MONOLITHES}%"></i></div>`
    + `<small>${rang ? `Statut : <b>${rang}</b>` : 'Pas encore de statut'}${suivant ? ` · prochain : ${suivant.titre} (${suivant.seuil})` : ''}</small></div>`
    + '<p>Mille dalles noires cachées dans le système solaire, immobiles par rapport au Soleil. Le PING de la carte les fait répondre ; on les trouve en croisant les échos.</p>'
    + '<button type="button" class="principal" data-classeur>OUVRIR LE CLASSEUR</button></div>'
}
