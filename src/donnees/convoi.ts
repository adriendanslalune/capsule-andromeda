// La formation du convoi (début d'ESCORTER, mission des Mercenaires ; idée validée par Adrien le 21/10/2026) : à la
// station, les trois cargos sortent du hangar un par un et dérivent ; on les place du doigt dans la formation, en
// flèche derrière la capsule, avant qu'ils ne s'égarent. Valeurs PROVISOIRES, à régler après essai sur téléphone.
// Le terrain : 100 unités de large, 160 de haut (comme l'escorte) ; la capsule en haut, le hangar en bas.

export const LARGEUR = 100
export const HAUTEUR = 160
/** La capsule, et les trois places de la formation (en flèche derrière elle). */
export const CAPSULE = { x: 50, y: 30 }
export const PLACES: readonly { x: number; y: number }[] = [{ x: 30, y: 58 }, { x: 70, y: 58 }, { x: 50, y: 80 }]
/** La sortie du hangar, d'où partent les cargos. */
export const HANGAR = { x: 50, y: 150 }
/** Un cargo sort toutes les ECART_SORTIES s ; il monte à VITESSE_CARGO et dérive de côté (jusqu'à DERIVE_MAX). */
export const ECART_SORTIES = 3
export const VITESSE_CARGO = 9
export const DERIVE_MAX = 9
/** Un cargo égaré (sorti du terrain) retourne au hangar et ressort au bout de ce temps (s). */
export const RETOUR_HANGAR = 2
/** On attrape un cargo à moins de RAYON_PRISE du doigt ; lâché à moins de RAYON_PLACE d'une place libre, il s'y range. */
export const RAYON_PRISE = 16
export const RAYON_PLACE = 13
