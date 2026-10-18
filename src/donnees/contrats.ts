// Les missions du joueur (étape 3 ; règles validées par Adrien le 17/10/2026, revues le 18/10/2026 : voir tableaux.ts).
// Dans le code, elles s'appellent « contrats » : le mot « mission » y désigne déjà le voyage de la capsule.

/**
 * Missions de chaque tableau (décisions d'Adrien du 18/10/2026) : sur une planète 6, soit 2 par Maison ; quand le
 * joueur appartient à une Maison, 4 de sa Maison et 1 de chacune des deux autres. Sur une lune 4 : une par Maison et
 * une de plus (de la Maison du joueur ; neutre, d'une Maison tirée au hasard). Une nouvelle remplace chaque mission prise.
 */
export const PAR_MAISON_NEUTRE = 2
export const PAR_MAISON_CHOISIE = 4
export const PAR_AUTRE_MAISON = 1
/** Les missions de la Maison du joueur sont mieux payées : +25 % (décision d'Adrien du 18/10/2026). */
export const BONUS_MAISON = 1.25
/** Durée d'une action sur place (charger, livrer, nettoyer, réparer), en temps réel (ms). */
export const DUREE_ACTION = 2 * 60_000

/** Épaves à nettoyer : de vieux satellites morts, et des débris autour des engins en orbite basse. */
export const LIEUX_NETTOYAGE = ['Envisat', 'Vanguard 1', 'Hubble', 'ISS', 'Tiangong', 'Terra', 'Landsat 9', 'Sentinel-2B', 'Fermi', 'Swift']
/** Stations où l'on charge les cargaisons. */
export const STATIONS = ['ISS', 'Tiangong']
/** Destinations des livraisons et satellites à dépanner. */
export const SATELLITES = ['Hubble', 'Terra', 'Landsat 9', 'Sentinel-2B', 'Fermi', 'Swift', 'GPS III-1', 'Galileo 101', 'GOES-19',
  'Meteosat-12', 'Himawari-9', 'Chandra', 'TESS']
