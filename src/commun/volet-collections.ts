// Les collections (Plus › Collections ; demande d'Adrien du 20/10/2026 : le classeur des monolithes doit être mis en
// valeur, et d'autres collections viendront). Chaque collection a sa couverture : ce qu'on en a trouvé, une jauge, le
// statut gagné et le prochain palier, et le bouton qui ouvre son classeur.

import { NOMBRE_MONOLITHES } from '../donnees/monolithes'
import { palierSuivant, statut } from '../moteur/monolithes'
import type { Jeu } from '../moteur/jeu'
import { NOMBRE_VOIX } from '../donnees/radio'
import { NOMBRE_DISPARUS } from '../donnees/disparus'
import { SONDE } from './vue-disparus'
import { pastilleInstrument } from './instruments'

const PIERRE = '<svg viewBox="0 0 40 56" aria-hidden="true"><ellipse cx="20" cy="50" rx="15" ry="3.5" class="sol"/><path class="pierre" d="M13 8h14v42H13z"/><path class="reflet" d="M15 11h3v36h-3z"/><path class="glyphe" d="M20 20v6M17 23h6"/></svg>'

export function htmlCollections(jeu: Jeu): string {
  const n = jeu.monolithes.trouves.length, rang = statut(n), suivant = palierSuivant(n)
  return '<div class="couverture monolithes" data-ref="ARC-06 · A">'
    + `<div class="illustration">${PIERRE}</div>`
    + '<div class="texte-couverture"><h2 class="titre-pulp">Monolithes</h2>' + pastilleInstrument('ping')
    + `<b class="compte">${n} <small>/ ${NOMBRE_MONOLITHES}</small></b>`
    + `<div class="jauge-collection"><i style="width:${(100 * n) / NOMBRE_MONOLITHES}%"></i></div>`
    + `<small>${rang ? `Statut : <b>${rang}</b>` : 'Pas encore de statut'}${suivant ? ` · prochain : ${suivant.titre} (${suivant.seuil})` : ''}</small></div>`
    + '<p>Mille dalles noires cachées dans le système solaire, immobiles par rapport au Soleil. Le PING de la carte les fait répondre ; on les trouve en croisant les échos.</p>'
    + '<button type="button" class="principal" data-classeur>OUVRIR LE CLASSEUR</button></div>'
    + couvertureVoix(jeu)
    + couvertureDisparus(jeu)
}

const POSTE = '<svg viewBox="0 0 40 40" aria-hidden="true"><path class="antenne-radio" d="M12 13 27 4"/><rect class="coffret" x="4" y="12" width="32" height="22" rx="4"/><circle class="haut-parleur" cx="13" cy="23" r="6"/><rect class="cadran-radio" x="22" y="17" width="10" height="4.5" rx="1"/><circle class="bouton-radio" cx="27" cy="28" r="2.5"/></svg>'

/** La couverture des Voix perdues (la radio). */
function couvertureVoix(jeu: Jeu): string {
  const n = jeu.radio.captees.length
  return '<div class="couverture voix" data-ref="ARC-06 · B">'
    + `<div class="illustration">${POSTE}</div>`
    + '<div class="texte-couverture"><h2 class="titre-pulp">Voix perdues</h2>' + pastilleInstrument('radio')
    + `<b class="compte">${n} <small>/ ${NOMBRE_VOIX}</small></b>`
    + `<div class="jauge-collection"><i style="width:${(100 * n) / NOMBRE_VOIX}%"></i></div></div>`
    + '<p>Des équipages ont laissé leur voix sur la bande OC pendant l\'invasion. Le bouton RADIO de la carte les cherche, dans leur système, à leur heure. Mises bout à bout, elles racontent ce qui s\'est passé.</p>'
    + '<button type="button" class="principal" data-carnet>OUVRIR LE CARNET</button></div>'
}

/** La couverture des Disparus (le radar). */
function couvertureDisparus(jeu: Jeu): string {
  const n = Object.keys(jeu.disparus.trouves).length
  return '<div class="couverture disparus" data-ref="ARC-06 · C">'
    + `<div class="illustration">${SONDE}</div>`
    + '<div class="texte-couverture"><h2 class="titre-pulp">Les Disparus</h2>' + pastilleInstrument('radar')
    + `<b class="compte">${n} <small>/ ${NOMBRE_DISPARUS}</small></b>`
    + `<div class="jauge-collection"><i style="width:${(100 * n) / NOMBRE_DISPARUS}%"></i></div></div>`
    + '<p>De vraies sondes perdues dans le système solaire, de Luna 2 sur la Lune à Pioneer 10 aux confins. Le RADAR de la carte capte leur écho faible, de près ; l\'indice de chacune dit où chercher.</p>'
    + '<button type="button" class="principal" data-disparus>OUVRIR LE CLASSEUR</button></div>'
}
