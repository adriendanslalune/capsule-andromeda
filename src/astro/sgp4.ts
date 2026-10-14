// Accès direct aux deux fonctions utiles de la bibliothèque satellite.js (méthode SGP4).
// Son point d'entrée principal embarque aussi une version WebAssembly que l'outil de construction ne sait pas
// empaqueter pour le navigateur : on importe donc seulement ces deux fichiers, en JavaScript pur.

export { twoline2satrec } from '../../node_modules/satellite.js/dist/io.js'
export { propagate } from '../../node_modules/satellite.js/dist/propagation/propagate.js'
export type { SatRec } from '../../node_modules/satellite.js/dist/propagation/SatRec.js'
