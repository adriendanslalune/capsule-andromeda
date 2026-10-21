// Le remorquage (REMORQUER, mission des Nettoyeurs ; décision d'Adrien du 18/10/2026) : réglages du harponnage d'une
// épave qui tourne sur elle-même, puis de sa stabilisation. Valeurs PROVISOIRES, à régler après essai sur téléphone.

/** Rotation de l'épave au départ (degrés/s, au hasard entre les deux), qui varie un peu (± VARIATION). */
export const ROTATION_MIN = 60
export const ROTATION_MAX = 130
export const VARIATION = 0.25
/** Le grappin met ce temps à atteindre l'épave (s) : il faut anticiper. */
export const VOL_GRAPPIN = 0.8
/** L'anneau d'accroche doit être face à la capsule, à ce nombre de degrés près, quand le grappin arrive. */
export const TOLERANCE = 18
/** Raté : le grappin ricoche ; temps pour l'enrouler et retirer (s). */
export const RECHARGE = 1.6
/** Stabiliser : chaque seconde de propulseur change la rotation de tant de degrés/s ; arrêtée sous SEUIL pendant TENUE s. */
export const COUPLE = 40
export const SEUIL = 4
export const TENUE = 1.3
/**
 * L'épave est déséquilibrée (demande d'Adrien du 21/10/2026 : stabiliser était trop facile) : un couple parasite, qui
 * change de sens tout seul, la remet à tourner (jusqu'à tant de degrés/s chaque seconde) ; il faut corriger sans cesse.
 */
export const PARASITE = 6 // 14 le 21/10/2026, puis 6 (Adrien : devenu impossible)
/** Harponnée du premier coup : la récompense augmente de 10 % (comme l'amarrage et le dépannage). */
export const BONUS_PREMIER_COUP = 1.1
