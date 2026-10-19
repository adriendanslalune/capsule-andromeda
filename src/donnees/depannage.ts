// Le dépannage d'un engin (RÉPARER, mission des Ingénieurs ; décision d'Adrien du 18/10/2026) : le boîtier technique
// d'un satellite ou d'une station, différent du panneau de la capsule. Deux de ses trois appareils sont en défaut ; on
// les répare en suivant la section 6 du Manuel. Les tableaux sont fixes, les mêmes pour tous les joueurs (le Manuel
// sera imprimé) : seul ce que montre le boîtier (lettre du bus, couleur du voyant, symboles) change d'une mission à
// l'autre.

export type Bus = 'A' | 'B' | 'C' | 'D'
export const LES_BUS: readonly Bus[] = ['A', 'B', 'C', 'D']

export type Voyant = 'rouge' | 'orange' | 'bleu' | 'vert'
export const VOYANTS: readonly { voyant: Voyant; titre: string; teinte: string }[] = [
  { voyant: 'rouge', titre: 'ROUGE', teinte: '#e04b37' },
  { voyant: 'orange', titre: 'ORANGE', teinte: '#f2a23a' },
  { voyant: 'bleu', titre: 'BLEU', teinte: '#4f86c6' },
  { voyant: 'vert', titre: 'VERT', teinte: '#6dbb75' },
]

export type AppareilEngin = 'disjoncteurs' | 'cablage' | 'gyroscope'
export const APPAREILS_ENGIN: readonly { appareil: AppareilEngin; titre: string; module: string }[] = [
  { appareil: 'disjoncteurs', titre: 'DISJONCTEURS', module: '6A' },
  { appareil: 'cablage', titre: 'CÂBLAGE', module: '6B' },
  { appareil: 'gyroscope', titre: 'GYROSCOPE', module: '6C' },
]

/** TABLEAU 6-1 : les disjoncteurs à laisser LEVÉS (numéros de 1 à 5), selon le voyant (lignes) et le bus (colonnes). */
export const DISJONCTEURS: Readonly<Record<Voyant, Record<Bus, readonly number[]>>> = {
  rouge: { A: [1, 3], B: [2, 4, 5], C: [1, 2, 5], D: [3] },
  orange: { A: [2, 5], B: [1, 3, 4], C: [4], D: [1, 2, 3, 5] },
  bleu: { A: [1, 4, 5], B: [3, 5], C: [2, 3], D: [2, 4] },
  vert: { A: [3, 4], B: [1], C: [1, 3, 4, 5], D: [1, 5] },
}

/** Les fiches du câblage (couleur du câble) et les prises (1 à 4). */
export const CABLES: readonly { cable: string; titre: string; teinte: string }[] = [
  { cable: 'rouge', titre: 'ROUGE', teinte: '#e04b37' },
  { cable: 'jaune', titre: 'JAUNE', teinte: '#f2c66a' },
  { cable: 'bleu', titre: 'BLEU', teinte: '#4f86c6' },
  { cable: 'noir', titre: 'NOIR', teinte: '#2b2138' },
]
/** TABLEAU 6-2 : la prise de chaque câble (rouge, jaune, bleu, noir), selon le bus. */
export const CABLAGE: Readonly<Record<Bus, readonly [number, number, number, number]>> = {
  A: [2, 4, 1, 3],
  B: [3, 1, 4, 2],
  C: [4, 3, 2, 1],
  D: [1, 2, 4, 3],
}
/** Règle 6.2.3 : si le voyant est BLEU, les câbles des prises 1 et 4 sont échangés. */
export const VOYANT_ECHANGE: Voyant = 'bleu'

/** Les symboles de l'écran du gyroscope. */
export const SYMBOLES_GYRO: readonly string[] = ['◆', '●', '▲', '■', '★', '✚', '◐', '✦']
/** TABLEAU 6-3 : le chiffre de chaque symbole, pour les bus A et B, puis pour les bus C et D. */
export const CHIFFRES_GYRO: Readonly<Record<'AB' | 'CD', readonly number[]>> = {
  AB: [4, 7, 1, 9, 2, 6, 0, 5],
  CD: [8, 3, 6, 2, 5, 1, 7, 4],
}

/** Réparé sans une fausse manœuvre : la récompense augmente de 10 % (comme l'amarrage sans rebond). */
export const BONUS_SANS_ERREUR = 1.1
