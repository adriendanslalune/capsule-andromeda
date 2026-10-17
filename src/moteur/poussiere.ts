// La « poussière » de satellites : tous les satellites actifs autour de la Terre (environ 15 000, d'après CelesTrak),
// dessinés comme de fins points décoratifs (choix d'Adrien du 17/10/2026 : une sélection d'engins touchables, et tous
// les autres en poussière). Ils ne sont pas des destinations.
// Calcul volontairement simple (des milliers de points à chaque image, sur un téléphone) : orbite de Kepler autour de
// la Terre, plus la lente rotation du plan et de l'ellipse due à l'aplatissement de la Terre (J2). Les orbites ne sont
// pas remises à jour (décision d'Adrien) : la poussière reste vraisemblable, pas exacte.
//
// Ce fichier n'importe rien : l'outil outils/poussiere-celestrak.mjs l'utilise tel quel.

const RAD = Math.PI / 180
const GM_TERRE = 398600.4418
const RAYON_TERRE = 6378.137
const J2 = 1.08262668e-3
const OBLIQUITE_J2000 = 23.4392911 * RAD
/** Précession générale en longitude (degrés par siècle), pour revenir de l'équinoxe du jour à celle de J2000. */
const PRECESSION_PAR_SIECLE = 1.3969713
const MS_PAR_JOUR = 86_400_000
const J2000_MS = Date.UTC(2000, 0, 1, 12)

/** Nombre de valeurs par satellite dans le texte des données : i, Ω, e, ω, M (degrés), n (tours par jour). */
export const VALEURS_PAR_SATELLITE = 6

/**
 * Éléments d'une orbite TLE, ramenés à l'instant de référence (ms UTC) : i, Ω, e, ω, M (degrés), n (tours par jour).
 * L'anomalie moyenne avance au mouvement moyen seul entre l'époque de la TLE et la référence (quelques jours).
 */
export function elementsTLE(ligne1: string, ligne2: string, reference: number): number[] {
  const an = Number(ligne1.slice(18, 20))
  const jour = Number(ligne1.slice(20, 32))
  const epoque = Date.UTC(an < 57 ? 2000 + an : 1900 + an, 0, 1) + (jour - 1) * MS_PAR_JOUR
  const i = Number(ligne2.slice(8, 16))
  const noeud = Number(ligne2.slice(17, 25))
  const e = Number(`0.${ligne2.slice(26, 33).trim()}`)
  const omega = Number(ligne2.slice(34, 42))
  const M = Number(ligne2.slice(43, 51))
  const n = Number(ligne2.slice(52, 63))
  const Mref = (((M + n * 360 * ((reference - epoque) / MS_PAR_JOUR)) % 360) + 360) % 360
  return [i, noeud, e, omega, Mref, n]
}

/** La poussière chargée : éléments à l'instant de référence, et ce qu'on peut calculer une fois pour toutes. */
interface Poussiere {
  nombre: number
  reference: number
  /** Par satellite : i, Ω, e, ω, M (radians), n (rad/ms), a (km), dΩ/dt et dω/dt (rad/ms). */
  elements: Float64Array
  positions: Float64Array
  normales: Float64Array
}

let poussiere: Poussiere | null = null

/** Charge les données de la poussière (texte de nombres séparés par des espaces, voir src/donnees/poussiere.ts). */
export function chargerPoussiere(texte: string, reference: number): void {
  const v = texte.trim().split(/\s+/).map(Number)
  const nombre = Math.floor(v.length / VALEURS_PAR_SATELLITE)
  const elements = new Float64Array(nombre * 9)
  for (let k = 0; k < nombre; k++) {
    const [i, noeud, e, omega, M, tours] = v.slice(k * VALEURS_PAR_SATELLITE, (k + 1) * VALEURS_PAR_SATELLITE)
    const n = (tours * 2 * Math.PI) / MS_PAR_JOUR
    const a = Math.cbrt(GM_TERRE / (n * 1000) ** 2)
    // Effet de l'aplatissement de la Terre (J2) : le plan de l'orbite tourne, l'ellipse aussi.
    const p = a * (1 - e * e)
    const k2 = 1.5 * n * J2 * (RAYON_TERRE / p) ** 2
    const ci = Math.cos(i * RAD)
    elements.set([i * RAD, noeud * RAD, e, omega * RAD, M * RAD, n, a, -k2 * ci, 0.5 * k2 * (5 * ci * ci - 1)], k * 9)
  }
  poussiere = { nombre, reference, elements, positions: new Float64Array(nombre * 3), normales: new Float64Array(nombre * 3) }
}

/**
 * Positions de la poussière à l'instant t (ms UTC), vues du centre de la Terre (écliptique J2000, km), et la normale
 * au plan de chaque orbite (dans le sens du mouvement), pour coucher les orbites dans le plan de la carte.
 * Les tableaux renvoyés sont réutilisés d'un appel à l'autre. null tant que les données ne sont pas chargées.
 */
export function positionsPoussiere(t: number): { nombre: number; positions: Float64Array; normales: Float64Array } | null {
  if (!poussiere) return null
  const { nombre, elements: el, positions, normales } = poussiere
  const dt = t - poussiere.reference
  // Repère équatorial du jour → écliptique J2000 : obliquité, puis précession depuis l'an 2000.
  const ce = Math.cos(OBLIQUITE_J2000), se = Math.sin(OBLIQUITE_J2000)
  const pr = -PRECESSION_PAR_SIECLE * ((t - J2000_MS) / (36525 * MS_PAR_JOUR)) * RAD
  const cp = Math.cos(pr), sp = Math.sin(pr)
  const versEcliptique = (x: number, y: number, z: number, sortie: Float64Array, k: number) => {
    const ye = y * ce + z * se, ze = -y * se + z * ce
    sortie[k] = x * cp - ye * sp
    sortie[k + 1] = x * sp + ye * cp
    sortie[k + 2] = ze
  }
  for (let k = 0; k < nombre; k++) {
    const b = k * 9
    const i = el[b], e = el[b + 2], n = el[b + 5], a = el[b + 6]
    const noeud = el[b + 1] + el[b + 7] * dt
    const omega = el[b + 3] + el[b + 8] * dt
    const M = (el[b + 4] + n * dt) % (2 * Math.PI)
    let E = e < 0.8 ? M : Math.PI
    for (let j = 0; j < 8; j++) {
      const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
      E -= d
      if (Math.abs(d) < 1e-9) break
    }
    const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
    const co = Math.cos(omega), so = Math.sin(omega), cO = Math.cos(noeud), sO = Math.sin(noeud)
    const ci = Math.cos(i), si = Math.sin(i)
    versEcliptique(
      (co * cO - so * sO * ci) * xp + (-so * cO - co * sO * ci) * yp,
      (co * sO + so * cO * ci) * xp + (-so * sO + co * cO * ci) * yp,
      so * si * xp + co * si * yp,
      positions, k * 3)
    versEcliptique(si * sO, -si * cO, ci, normales, k * 3)
  }
  return { nombre, positions, normales }
}

/** Vide la poussière (pour les tests). */
export function viderPoussiere(): void {
  poussiere = null
}
