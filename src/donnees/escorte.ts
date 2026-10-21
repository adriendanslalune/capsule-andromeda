// L'escorte (ESCORTER, mission des Mercenaires ; décision d'Adrien du 18/10/2026) : à l'arrivée, le convoi tombe dans
// une embuscade ; on intercepte les missiles en les touchant. Valeurs PROVISOIRES, à régler après essai sur téléphone.
// Le terrain : 100 unités de large, 160 de haut ; les cargos en bas, les missiles partent des bords.

export const LARGEUR = 100
export const HAUTEUR = 160
/** Les trois cargos du convoi (position). */
export const CARGOS: readonly { x: number; y: number }[] = [{ x: 28, y: 122 }, { x: 50, y: 112 }, { x: 72, y: 122 }]
/** Un cargo est hors d'usage après tant de coups ; les trois hors d'usage : le convoi se replie, la vague recommence. */
export const RESISTANCE = 2
/** Nombre de missiles de l'embuscade : MISSILES_BASE près de la Terre, plus loin (et plus dangereux) davantage. */
export const MISSILES_BASE = 10
export const MISSILES_PAR_DOUBLEMENT = 2
/** Durée de vol d'un missile (s) jusqu'à son cargo, et l'écart entre deux lancers (s) ; plus serrés loin de la Terre. */
export const VOL_MISSILE = 2.2 // 3,4 avant le 21/10/2026 (Adrien : trop facile)
export const ECART_LANCERS = 2.4
/** L'interception : rayon (unités) autour du doigt, et recharge entre deux tirs (s). */
export const RAYON_INTERCEPTION = 9
export const RECHARGE_TIR = 0.3
/** Escorte sans un coup reçu : la récompense augmente de 10 % (comme les autres missions). */
export const BONUS_SANS_COUP = 1.1
