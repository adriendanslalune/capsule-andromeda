// Le largage (fin de REMORQUER, mission des Nettoyeurs ; idée validée par Adrien le 21/10/2026) : la capsule arrive à
// la station avec l'épave au bout du câble, en ligne droite. Lâchée, l'épave garde son élan ; le faisceau d'arrimage de
// la station la freine. Il faut la lâcher au bon moment et à la bonne vitesse pour qu'elle s'arrête dans la zone de
// dépôt. Valeurs PROVISOIRES, à régler après essai sur téléphone. Distances en mètres, vitesses en m/s.

/** Distance de la station au début de l'approche (et à chaque nouvel essai). */
export const DISTANCE_DEPART = 80
/** Vitesse d'approche au début (au hasard entre les deux). */
export const VITESSE_MIN = 9
export const VITESSE_MAX = 14
/** Freinage de la capsule, propulseur tenu (m/s²), et la vitesse sous laquelle elle ne descend pas (elle avance toujours). */
export const FREINAGE = 3
export const VITESSE_PLANCHER = 3
/** Le faisceau d'arrimage freine l'épave lâchée (m/s²). */
export const FAISCEAU = 1.2
/** La zone de dépôt : entre ces deux distances de la station. */
export const ZONE_PROCHE = 4
export const ZONE_LOIN = 12
/** Sans lâcher, la capsule s'arrête d'elle-même à cette distance (trop près : on recule et on recommence). */
export const DISTANCE_SECURITE = 3
/** Larguée du premier coup : la récompense augmente de 10 % (comme le harponnage). */
export const BONUS_PREMIER_COUP = 1.1
