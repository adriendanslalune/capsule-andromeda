// Les missions sont classées par système (décision d'Adrien du 18/10/2026, qui remplace les tableaux par planète et
// par grande lune) : 6 missions par système, Pluton compris ; elles se consultent de partout (volet Missions, filtre de
// système). Leurs lieux sont répartis dans tout le système (stations, satellites, épaves, lunes, chasseurs), au plus
// près de la planète comme au bord de sa zone d'influence ; le prix est fixé une fois pour toutes à la création, selon
// la zone du système (ZONES) et l'éloignement du lieu (ELOIGNEMENT).

export interface Tableau {
  /** Le système (sa planète) : ses missions se passent chez lui. */
  lieu: string
  systeme: string
  nombre: number
}

const S = (lieu: string): Tableau => ({ lieu, systeme: lieu, nombre: 6 })

export const TABLEAUX: readonly Tableau[] = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'].map(S)

/**
 * Facteur de zone de chaque système (validé par Adrien le 18/10/2026, à ajuster plus tard) : l'éloignement depuis la
 * Terre (le port d'attache de tous, où s'achètent les moteurs) et le danger. Mercure et Vénus paient selon la
 * difficulté d'y aller et leur enfer (chaleur, tempêtes solaires).
 */
export const ZONES: Readonly<Record<string, number>> = {
  Terre: 1, Vénus: 4, Mars: 4, Mercure: 8, Jupiter: 12, Saturne: 20, Uranus: 30, Neptune: 45, Pluton: 60,
}

/** Portée d'une mission dans son système : près de la planète, à mi-distance, ou au bord de sa zone d'influence. */
export type Portee = 'proche' | 'moyenne' | 'lointaine'
/** Sur les 6 missions d'un système : 3 proches, 2 moyennes, 1 lointaine (des courtes et des longues). */
export const PORTEES: Readonly<Record<Portee, number>> = { proche: 3, moyenne: 2, lointaine: 1 }
/** Limites des portées, en part de la sphère d'influence du système (distance du lieu à la planète). */
export const LIMITE_PROCHE = 0.08
export const LIMITE_MOYENNE = 0.3
/**
 * Facteur d'éloignement du prix : ×1 tout près de la planète, jusqu'à ×2 à la moitié de la sphère d'influence et
 * au-delà (une mission vers la Lune paie environ 1,5 fois une mission vers l'ISS).
 */
export const ELOIGNEMENT_MAX = 2
export const ELOIGNEMENT_PLEIN = 0.5

/** Prix de base d'une mission dans la zone de la Terre (crédits) : de 50 à 100, selon la mission. */
export const PRIX_MIN = 50
export const PRIX_ECART = 50
/** Une mission en deux étapes (livraison, remorquage, escorte) paie 40 % de plus ; une chasse (un combat), 50 %. */
export const FACTEUR_LIVRAISON = 1.4
export const FACTEUR_CHASSE = 1.5

/**
 * Début de partie (demande d'Adrien du 21/10/2026 : « pas trop chiant dès le début ») : dans le système de la Terre,
 * les lieux des contrats restent à moins de 25 minutes de vol de la planète au moteur actuel (distance ≤ vitesse max ×
 * 25 min : 45 000 km au niveau 1, 90 000 au niveau 2…). Le cercle s'élargit à chaque moteur ; au niveau 4, il couvre
 * tout le système.
 */
export const VOL_MAX_DEBUT = 25 * 60
