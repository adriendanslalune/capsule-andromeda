// Les collections (Plus › Collections ; demande d'Adrien du 20/10/2026 : le classeur des monolithes doit être mis en
// valeur, et d'autres collections viendront). Chaque collection a sa couverture : ce qu'on en a trouvé, une jauge, le
// statut gagné et le prochain palier, et le bouton qui ouvre son classeur.

import { NOMBRE_MONOLITHES } from '../donnees/monolithes'
import { palierSuivant, statut } from '../moteur/monolithes'
import type { Jeu } from '../moteur/jeu'
import { NOMBRE_VOIX } from '../donnees/radio'
import { NOMBRE_DISPARUS } from '../donnees/disparus'
import { pastilleInstrument } from './instruments'


/** La vignette d'une collection, dessinée par ChatGPT (Adrien, 25/10/2026) : le monolithe, le poste TSF, la sonde. */
const vignette = (nom: string) => `<div class="illustration"><img src="collections/${nom}.webp" alt=""></div>`

export function htmlCollections(jeu: Jeu): string {
  const n = jeu.monolithes.trouves.length, rang = statut(n), suivant = palierSuivant(n)
  return '<div class="couverture monolithes" data-ref="ARC-06 · A">'
    + vignette('monolithes')
    + '<div class="texte-couverture"><h2 class="titre-pulp">Monolithes</h2>' + pastilleInstrument('ping')
    + `<b class="compte">${n} <small>/ ${NOMBRE_MONOLITHES}</small></b>`
    + `<div class="jauge-collection"><i style="width:${(100 * n) / NOMBRE_MONOLITHES}%"></i></div>`
    + `<small>${rang ? `Statut : <b>${rang}</b>` : 'Pas encore de statut'}${suivant ? ` · prochain : ${suivant.titre} (${suivant.seuil})` : ''}</small></div>`
    + '<p>Mille dalles noires cachées dans le système solaire, immobiles par rapport au Soleil. Le PING de la carte les fait répondre ; on les trouve en croisant les échos.</p>'
    + '<button type="button" class="principal" data-classeur>OUVRIR LE CLASSEUR</button></div>'
    + couvertureVoix(jeu)
    + couvertureDisparus(jeu)
}


/** La couverture des Voix perdues (la radio). */
function couvertureVoix(jeu: Jeu): string {
  const n = jeu.radio.captees.length
  return '<div class="couverture voix" data-ref="ARC-06 · B">'
    + vignette('voix')
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
    + vignette('disparus')
    + '<div class="texte-couverture"><h2 class="titre-pulp">Les Disparus</h2>' + pastilleInstrument('radar')
    + `<b class="compte">${n} <small>/ ${NOMBRE_DISPARUS}</small></b>`
    + `<div class="jauge-collection"><i style="width:${(100 * n) / NOMBRE_DISPARUS}%"></i></div></div>`
    + '<p>De vraies sondes perdues dans le système solaire, de Luna 2 sur la Lune à Pioneer 10 aux confins. Le RADAR de la carte capte leur écho faible, de près ; l\'indice de chacune dit où chercher.</p>'
    + '<button type="button" class="principal" data-disparus>OUVRIR LE CLASSEUR</button></div>'
}
