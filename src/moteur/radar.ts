// Le radar de la capsule (décisions d'Adrien du 20/10/2026). Sur la carte, on ne voit d'office que les astres et les
// monolithes trouvés ou localisés : les engins, les capsules des autres et les aliens ne se montrent qu'au passage du
// radar, qui tourne autour de la capsule comme celui d'un sous-marin, puis s'effacent. Il s'allume et s'éteint à la
// demande ; une jauge monte pendant qu'il tourne (pleine en 30 secondes : il s'arrête) et redescend quand il est
// éteint, au même rythme ; tant qu'elle n'est pas pleine, on peut le rallumer.

/** Un tour de balayage (ms). */
export const PERIODE_RADAR = 4000
/** Jauge pleine (ou vide) en… (ms). */
export const DUREE_RADAR = 30_000
/**
 * Portée du radar (km) : 100 000 km (décision d'Adrien du 21/10/2026, au lieu de 500 000, encore trop grand : autour de
 * la Terre, il couvrait jusqu'à la Lune). C'est aussi la distance d'où un chasseur peut tirer sur la capsule.
 */
export const PORTEE_RADAR = 100_000
/** Un écho s'efface en… (ms) après le passage du balayage. */
export const EFFACEMENT_RADAR = 1.25 * PERIODE_RADAR

export interface EtatRadar {
  actif: boolean
  /** Jauge (de 0 à 1) à l'instant majA. */
  jauge: number
  majA: number
  /** Dernier allumage, dernier arrêt (ms ; -Infinity : jamais). */
  debut: number
  fin: number
}

export const radarEteint = (): EtatRadar => ({ actif: false, jauge: 0, majA: 0, debut: -Infinity, fin: -Infinity })

/** La jauge à l'instant t (sans changer l'état). */
export function jaugeRadar(r: EtatRadar, t: number): number {
  const dt = Math.max(0, t - r.majA) / DUREE_RADAR
  return Math.min(1, Math.max(0, r.jauge + (r.actif ? dt : -dt)))
}

/** Fait avancer le radar : s'il tourne et que la jauge est pleine, il s'arrête (à l'instant où elle s'est remplie). */
export function avancerRadar(r: EtatRadar, t: number): void {
  if (r.actif && r.jauge + (t - r.majA) / DUREE_RADAR >= 1) {
    const plein = r.majA + (1 - r.jauge) * DUREE_RADAR
    Object.assign(r, { actif: false, jauge: 1, majA: plein, fin: plein })
  }
  r.jauge = jaugeRadar(r, t)
  r.majA = t
}

/** Allume ou éteint le radar. Renvoie vrai s'il tourne après coup (il ne s'allume pas jauge pleine). */
export function basculerRadar(r: EtatRadar, t: number): boolean {
  avancerRadar(r, t)
  if (r.actif) { r.actif = false; r.fin = t; return false }
  if (r.jauge >= 1) return false
  r.actif = true
  r.debut = t
  return true
}

/** L'angle du balayage (radians, dans le sens de l'écran), qui reprend à zéro à chaque allumage. */
export function angleRadar(r: EtatRadar, t: number): number {
  return (2 * Math.PI * (t - r.debut)) / PERIODE_RADAR
}

/**
 * Ce qu'on voit d'un objet à l'instant t, de 0 (rien) à 1 (le balayage vient de passer) : son écho, au dernier passage
 * du balayage sur sa direction `angle` (radians, même sens que angleRadar) pendant que le radar tournait.
 */
export function echoRadar(r: EtatRadar, angle: number, t: number): number {
  if (r.debut === -Infinity) return 0
  const tour = 2 * Math.PI
  // Le dernier passage sur cette direction, avant t.
  const retard = ((((angleRadar(r, t) - angle) % tour) + tour) % tour) / tour * PERIODE_RADAR
  let passage = t - retard
  // Radar éteint depuis : le dernier passage pendant qu'il tournait.
  const fin = r.actif ? t : r.fin
  if (passage > fin) passage -= Math.ceil((passage - fin) / PERIODE_RADAR) * PERIODE_RADAR
  if (passage < r.debut) return 0
  return Math.max(0, 1 - (t - passage) / EFFACEMENT_RADAR)
}
