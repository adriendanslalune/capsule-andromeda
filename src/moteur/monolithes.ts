// La chasse aux monolithes (idée d'Adrien du 18/10/2026). La radio de la capsule envoie un PING ; le monolithe pas
// encore trouvé le plus proche répond, quelle que soit la distance ; son écho revient au bout de l'aller-retour de la
// lumière, en vrai temps, et donne sa distance : un cercle autour de la place d'où l'on a pingé. Deux cercles du même
// monolithe se croisent en deux places possibles ; un troisième, pris d'ailleurs (pas sur la même ligne), tranche : le
// monolithe est alors localisé, on peut y aller et le ramasser. Un PING par heure au plus.
// Tout est compté dans le plan de l'écliptique (celui de la carte).

import { ATTENTE_PING, MONOLITHES, NOMBRE_MONOLITHES, PALIERS, PRECISION_ECHO, type Monolithe } from '../donnees/monolithes'
import { C_KM_S } from './navigation'
import { UA_KM } from './temps'

export interface Point { x: number; y: number }

/** Un écho : envoyé d'une place (centre), il revient avec la distance du monolithe (rayon, km). */
export interface Echo {
  monolithe: number; centre: Point; rayon: number; envoye: number; retour: number
  /** Le joueur a vu l'écho revenu (touché sa ligne du bandeau, ou renvoyé un PING) : sinon, le bandeau le signale. */
  vu?: boolean
}

export interface EtatMonolithes {
  /** Numéros des monolithes ramassés. */
  trouves: number[]
  /** Date du ramassage de chacun (ms UTC) ; absente pour ceux ramassés avant qu'on la note. */
  ramassesLe: Record<number, number>
  /** Échos des monolithes pas encore ramassés (en route ou revenus). */
  echos: Echo[]
  /** Instant du dernier PING (0 : jamais). */
  dernierPing: number
}

export function nouveauxMonolithes(): EtatMonolithes {
  return { trouves: [], ramassesLe: {}, echos: [], dernierPing: 0 }
}

const PAR_NUMERO = new Map(MONOLITHES.map((m) => [m.numero, m]))
const PAR_NOM = new Map(MONOLITHES.map((m) => [m.nom, m]))
export const monolithe = (numero: number): Monolithe | undefined => PAR_NUMERO.get(numero)
export const monolitheNomme = (nom: string): Monolithe | undefined => PAR_NOM.get(nom)

/**
 * Emplacement d'un monolithe, le même pour tous les joueurs (pour s'entraider : « il me manque le 846… ») : sa distance
 * au Soleil (UA) et son angle (longitude écliptique, de 0 à 360°).
 */
export function emplacement(numero: number): { ua: number; longitude: number } {
  const m = PAR_NUMERO.get(numero)!
  return { ua: Math.hypot(m.x, m.y) / UA_KM, longitude: ((Math.atan2(m.y, m.x) * 180) / Math.PI + 360) % 360 }
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** Instant à partir duquel on peut pinger de nouveau (l'écho revenu, et une heure après le précédent). */
export function prochainPing(e: EtatMonolithes): number {
  const enRoute = e.echos.filter((x) => x.envoye === e.dernierPing).map((x) => x.retour)
  return Math.max(e.dernierPing + ATTENTE_PING, ...enRoute)
}

export function peutPinger(e: EtatMonolithes, t: number): boolean {
  return t >= prochainPing(e) && e.trouves.length < MONOLITHES.length
}

/** Le statut d'un capitaine selon le nombre de monolithes trouvés (null sous le premier palier). */
export function statut(nombre: number): string | null {
  return [...PALIERS].reverse().find((p) => nombre >= p.seuil)?.titre ?? null
}

/** Une case du classeur des monolithes : son numéro, et s'il est trouvé, où il est et quand on l'a ramassé. */
export interface CaseClasseur { numero: number; trouve: boolean; ua?: number; longitude?: number; le?: number }

/** Monolithes par page du classeur (trois rangées de trois, comme un classeur de cartes à collectionner). */
export const CASES_PAR_PAGE = 9

/** Une page du classeur (numérotée à partir de 1) : les monolithes dans l'ordre croissant, trouvés ou non. */
export function pageClasseur(e: EtatMonolithes, page: number): CaseClasseur[] {
  const trouves = new Set(e.trouves)
  const l: CaseClasseur[] = []
  for (let n = (page - 1) * CASES_PAR_PAGE + 1; n <= Math.min(page * CASES_PAR_PAGE, NOMBRE_MONOLITHES); n++) {
    l.push(trouves.has(n) ? { numero: n, trouve: true, ...emplacement(n), le: e.ramassesLe[n] } : { numero: n, trouve: false })
  }
  return l
}

/** Le nombre de pages du classeur. */
export const PAGES_CLASSEUR = Math.ceil(NOMBRE_MONOLITHES / CASES_PAR_PAGE)

/** Le palier suivant (null une fois Oracle). */
export function palierSuivant(nombre: number): { seuil: number; titre: string } | null {
  return PALIERS.find((p) => nombre < p.seuil) ?? null
}

/** Envoie un PING depuis la place de la capsule ; renvoie l'écho attendu (ou null si on ne peut pas encore). */
export function pinger(e: EtatMonolithes, capsule: Point, t: number): Echo | null {
  if (!peutPinger(e, t)) return null
  marquerEchosVus(e)
  const trouves = new Set(e.trouves)
  let meilleur: Monolithe | null = null, dMin = Infinity
  for (const m of MONOLITHES) {
    if (trouves.has(m.numero)) continue
    const d = distance(m, capsule)
    if (d < dMin) { dMin = d; meilleur = m }
  }
  if (!meilleur) return null
  const echo = { monolithe: meilleur.numero, centre: { x: capsule.x, y: capsule.y }, rayon: dMin, envoye: t, retour: t + (2 * dMin / C_KM_S) * 1000 }
  e.dernierPing = t
  e.echos.push(echo)
  return echo
}

/** L'écho en route (envoyé, pas encore revenu), s'il y en a un. */
export function echoEnRoute(e: EtatMonolithes, t: number): Echo | null {
  return e.echos.find((x) => x.retour > t) ?? null
}

/**
 * Le front d'onde d'un PING (demande d'Adrien du 22/10/2026 : les ondes à la vraie vitesse de la lumière, qui
 * s'arrêtent en touchant le monolithe ; le joueur qui les regarde est dans le suspense) : parti de la place de l'envoi,
 * il grandit à 299 792 km/s jusqu'à la distance du monolithe, puis s'y arrête en attendant que l'écho revienne.
 */
export function frontDuPing(e: Echo, t: number): { centre: Point; rayon: number; arrete: boolean } {
  const parcouru = Math.max(0, ((t - e.envoye) / 1000) * C_KM_S)
  return { centre: e.centre, rayon: Math.min(parcouru, e.rayon), arrete: parcouru >= e.rayon }
}

/**
 * Oublie ce qui a été fait « dans le futur » : un PING envoyé en temps accéléré (essais), puis l'application relancée à
 * l'heure vraie. Sans ça, l'écho resterait en attente (et la radio indisponible) jusqu'à l'heure de son envoi.
 */
export function oublierFutur(e: EtatMonolithes, t: number): void {
  if (e.dernierPing > t) e.dernierPing = 0
  if (e.echos.some((x) => x.envoye > t)) e.echos = e.echos.filter((x) => x.envoye <= t)
}

/** Échos revenus que le joueur n'a pas encore vus (le plus récent d'abord). */
export function echosNonVus(e: EtatMonolithes, t: number): Echo[] {
  return echosRevenus(e, t).filter((x) => !x.vu).sort((a, b) => b.retour - a.retour)
}

/** Les échos revenus sont vus (le joueur a regardé). */
export function marquerEchosVus(e: EtatMonolithes, t = Infinity): void {
  for (const x of e.echos) if (x.retour <= t) x.vu = true
}

/** Échos revenus à l'instant t. */
export function echosRevenus(e: EtatMonolithes, t: number): Echo[] {
  return e.echos.filter((x) => x.retour <= t)
}

/** Les deux points où se croisent deux cercles (un seul s'ils se touchent ; aucun s'ils ne se croisent pas). */
export function croisement(a: Echo, b: Echo): Point[] {
  const d = distance(a.centre, b.centre)
  if (d === 0) return []
  const l = (a.rayon ** 2 - b.rayon ** 2 + d * d) / (2 * d)
  const h2 = a.rayon ** 2 - l * l
  if (h2 < -1e-6 * a.rayon ** 2) return []
  const h = Math.sqrt(Math.max(0, h2))
  const ux = (b.centre.x - a.centre.x) / d, uy = (b.centre.y - a.centre.y) / d
  const px = a.centre.x + l * ux, py = a.centre.y + l * uy
  if (h === 0) return [{ x: px, y: py }]
  return [{ x: px - h * uy, y: py + h * ux }, { x: px + h * uy, y: py - h * ux }]
}

/**
 * Ce que les échos revenus disent d'un monolithe : ses places possibles (aucune avec un seul écho, deux avec deux
 * échos, une seule quand il est localisé).
 */
export function placesPossibles(e: EtatMonolithes, numero: number, t: number): Point[] {
  const echos = echosRevenus(e, t).filter((x) => x.monolithe === numero)
  if (echos.length < 2) return []
  // Pour chaque paire d'échos, leurs deux places possibles ; un autre écho écarte celle qui ne colle pas avec sa
  // distance. Une paire qui tranche suffit ; sinon, les places de la paire prise de plus loin (le croisement le plus net).
  let meilleures: Point[] = [], dMax = -1
  for (let i = 0; i < echos.length; i++) {
    for (let j = i + 1; j < echos.length; j++) {
      const a = echos[i], b = echos[j]
      let places = croisement(a, b)
      // Deux places presque confondues : c'est la même.
      if (places.length === 2 && distance(places[0], places[1]) < PRECISION_ECHO * a.rayon) places = [places[0]]
      if (places.length === 2) {
        const gardees = places.filter((p) => echos.every((c) => Math.abs(distance(p, c.centre) - c.rayon) < PRECISION_ECHO * c.rayon))
        if (gardees.length === 1) places = gardees
      }
      if (places.length === 1) return places
      const d = distance(a.centre, b.centre)
      if (d > dMax) { dMax = d; meilleures = places }
    }
  }
  return meilleures
}

/** Un monolithe est-il localisé (une seule place possible), et pas encore ramassé ? */
export function localise(e: EtatMonolithes, numero: number, t: number): boolean {
  return !e.trouves.includes(numero) && placesPossibles(e, numero, t).length === 1
}

/** Les monolithes dont on a des échos revenus (pas encore ramassés). */
export function monolithesEcoutes(e: EtatMonolithes, t: number): number[] {
  return [...new Set(echosRevenus(e, t).map((x) => x.monolithe))]
}

/** Ramasse un monolithe localisé (la capsule est à côté : le jeu le vérifie) ; ses échos s'effacent. */
export function ramasser(e: EtatMonolithes, numero: number, t: number): boolean {
  if (!localise(e, numero, t)) return false
  e.trouves.push(numero)
  e.ramassesLe[numero] = t
  e.echos = e.echos.filter((x) => x.monolithe !== numero)
  return true
}
