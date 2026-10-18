// Les missions sont attachées aux lieux (décision d'Adrien du 18/10/2026) : 6 missions par planète (Pluton compris),
// 4 par grande lune ; elles se consultent de partout (volet Missions, filtre de lieu). Chaque mission se passe dans le
// système de son lieu, et son prix est fixé une fois pour toutes selon la zone (voir ZONES).

export interface Tableau {
  /** Le lieu (planète ou lune) dont c'est le tableau de missions. */
  lieu: string
  /** Le système (la planète) où se passent ses missions. */
  systeme: string
  /** 6 pour une planète, 4 pour une lune. */
  nombre: number
}

const P = (lieu: string): Tableau => ({ lieu, systeme: lieu, nombre: 6 })
const L = (lieu: string, systeme: string): Tableau => ({ lieu, systeme, nombre: 4 })

export const TABLEAUX: readonly Tableau[] = [
  P('Mercure'), P('Vénus'), P('Terre'), L('Lune', 'Terre'), P('Mars'),
  P('Jupiter'), L('Io', 'Jupiter'), L('Europe', 'Jupiter'), L('Ganymède', 'Jupiter'), L('Callisto', 'Jupiter'),
  P('Saturne'), L('Titan', 'Saturne'), L('Rhéa', 'Saturne'), L('Japet', 'Saturne'),
  P('Uranus'), L('Titania', 'Uranus'), L('Obéron', 'Uranus'),
  P('Neptune'), L('Triton', 'Neptune'),
  P('Pluton'),
]

/**
 * Validé par Adrien le 18/10/2026 (à ajuster plus tard) : le prix d'une mission dépend de sa zone, pas de là où est la capsule.
 * Facteur de zone = l'éloignement depuis la Terre (le port d'attache de tous, où s'achètent les moteurs) et le danger
 * du lieu. Mercure et Vénus, plus près du Soleil, paient selon la difficulté d'y aller et leur enfer (chaleur,
 * tempêtes solaires) : Vénus comme Mars, Mercure comme la ceinture d'astéroïdes.
 */
export const ZONES: Readonly<Record<string, number>> = {
  Terre: 1, Lune: 2, Vénus: 4, Mars: 4, Mercure: 8,
  Jupiter: 12, Io: 12, Europe: 12, Ganymède: 12, Callisto: 12,
  Saturne: 20, Titan: 20, Rhéa: 20, Japet: 20,
  Uranus: 30, Titania: 30, Obéron: 30,
  Neptune: 45, Triton: 45,
  Pluton: 60,
}

/** Prix de base d'une mission dans la zone de la Terre (crédits) : de 50 à 100, selon la mission. */
export const PRIX_MIN = 50
export const PRIX_ECART = 50
/** Une livraison (deux étapes) paie 40 % de plus ; une chasse (un combat), 50 %. */
export const FACTEUR_LIVRAISON = 1.4
export const FACTEUR_CHASSE = 1.5
