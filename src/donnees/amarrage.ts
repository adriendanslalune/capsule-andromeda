// L'amarrage (AMARRER, mission des Ingénieurs ; décision d'Adrien du 18/10/2026) : réglages de la manœuvre.
// Vue du dessus : le port de la station devant, la capsule qui approche, pilotée par petites poussées.
// Valeurs PROVISOIRES, à régler après essai sur téléphone.

/** Départ : à quelle distance du port (m), décalée de côté (jusqu'à ± m) et tournée (jusqu'à ± degrés). */
export const DISTANCE_DEPART = 14
export const ECART_DEPART = 4
export const ANGLE_DEPART = 25
/** Poussée des propulseurs : accélération (m/s²) et accélération de rotation (degrés/s²). */
export const POUSSEE = 0.12
export const POUSSEE_ROTATION = 8
/** Une petite dérive qui pousse sans cesse de côté (m/s²) : il faut corriger. */
export const DERIVE = 0.006
/** Pour s'amarrer : arriver à moins de 0,1 m/s, centré (à 0,3 m près), aligné (à 4° près), sans glisser de côté. */
export const VITESSE_CONTACT = 0.1
export const ECART_CONTACT = 0.3
export const ANGLE_CONTACT = 4
export const GLISSE_CONTACT = 0.1
/** Bien amarré du premier coup, sans rebond : la récompense augmente de 10 %. */
export const BONUS_SANS_REBOND = 1.1
