// Données du manuel de maintenance, section 2 (Énergie, module 2A BORNIER) : le tableau des codes de diagnostic et les règles de coupure
// (étape 4 ; maquette validée par Adrien le 18/10/2026). Le panneau et le manuel lisent les mêmes données : ce qui est
// écrit dans le manuel est exactement ce que le jeu attend.

export type Circuit = 'α' | 'β' | 'γ' | 'δ'
export type Regle = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6'
export type CouleurCable = 'rouge' | 'bleu' | 'jaune' | 'blanc' | 'vert' | 'noir'

export const CIRCUITS: readonly Circuit[] = ['α', 'β', 'γ', 'δ']
export const REGLES: readonly Regle[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']
export const COULEURS_CABLES: readonly CouleurCable[] = ['rouge', 'bleu', 'jaune', 'blanc', 'vert', 'noir']

/** Un code de diagnostic : ce que l'écran DIAG affiche, le circuit en défaut et la règle à appliquer. */
export interface CodeDiagnostic { code: string; circuit: Circuit; regle: Regle }

/**
 * TABLEAU 2-1 : 64 codes de diagnostic (« E-3A7 »…), triés. Tirés une fois pour toutes (graine fixe) : le manuel et
 * le panneau en ont la même liste.
 */
export const CODES_ENERGIE: readonly CodeDiagnostic[] = (() => {
  let g = 4242
  const x = () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646 }
  const vus = new Set<string>()
  const codes: CodeDiagnostic[] = []
  while (codes.length < 64) {
    const code = `E-${1 + Math.floor(x() * 9)}${'ABCDEF'[Math.floor(x() * 6)]}${1 + Math.floor(x() * 9)}`
    if (vus.has(code)) continue
    vus.add(code)
    codes.push({ code, circuit: CIRCUITS[Math.floor(x() * 4)], regle: REGLES[Math.floor(x() * 6)] })
  }
  return codes.sort((a, b) => a.code.localeCompare(b.code))
})()

/** TABLEAU 2-2 : les règles de coupure, telles qu'écrites dans le manuel. */
export const TEXTES_REGLES: Readonly<Record<Regle, string>> = {
  R1: 'Voyant V1 allumé : le premier câble du circuit. V1 éteint : le dernier.',
  R2: 'Autant de voyants allumés que de câbles rouges dans le circuit : le dernier câble rouge. Sinon : le câble dont la position est le nombre de voyants allumés (aucun : le premier ; trop grand : le dernier).',
  R3: 'Un seul câble jaune dans le circuit : ce câble jaune. Sinon : le deuxième câble du circuit.',
  R4: 'Numéro de série finissant par un chiffre pair : le câble blanc le plus haut du circuit ; impair : le plus bas. Aucun blanc : le premier câble du circuit.',
  R5: 'Voyants V2 et V4 tous deux allumés : ne couper aucun câble, basculer ISOLER deux fois. Sinon : le premier câble bleu du circuit (aucun bleu : le dernier câble).',
  R6: 'Aiguille de PRESSION du module 3B SOUPAPE (bloc Moteur) dans le rouge : le câble dont l\'étiquette porte le plus grand chiffre. Sinon : le plus petit.',
}

/** Note manuscrite du manuel (exception) : sur les capsules dont le numéro de série commence par ce préfixe, R4 est inversée. */
export const PREFIXE_R4_INVERSEE = 'AN-7'

// --- Module 2B FUSIBLES (décision d'Adrien du 19/10/2026) ---

/** Les calibres des huit fusibles du module, dans l'ordre du porte-fusibles (ampères). */
export const CALIBRES: readonly number[] = [10, 15, 20, 25, 30, 35, 40, 45]

/** Le voyant TÉMOIN du module 2B. */
export type Temoin = 'vert' | 'jaune' | 'rouge'
export const TEMOINS: readonly Temoin[] = ['vert', 'jaune', 'rouge']
export const TEINTES_TEMOIN: Readonly<Record<Temoin, string>> = { vert: '#5fb36a', jaune: '#f2b53a', rouge: '#e04b37' }

/** TABLEAU 2-3 : le calibre du fusible de rechange, selon le voyant TÉMOIN. */
export const TEXTES_FUSIBLES: Readonly<Record<Temoin, string>> = {
  vert: 'Le plus petit calibre égal ou supérieur à la CHARGE affichée.',
  jaune: 'Le calibre immédiatement au-dessus de celui que donnerait le témoin vert (une marche de plus).',
  rouge: 'Le même calibre que le fusible grillé, quelle que soit la CHARGE.',
}

// --- Module 2C ACCUMULATEURS (décision d'Adrien du 19/10/2026) ---

/** Les trois accumulateurs, de gauche à droite : leur borne. */
export const BORNES: readonly string[] = ['+', '±', '−']

/** La couleur de la cuve d'un accumulateur. */
export type CouleurAccu = 'vert' | 'jaune' | 'bleu'
export const COULEURS_ACCUS: readonly CouleurAccu[] = ['vert', 'jaune', 'bleu']
export const TEINTES_ACCUS: Readonly<Record<CouleurAccu, string>> = { vert: '#8fcf98', jaune: '#f2c66a', bleu: '#8fb4e6' }

/**
 * TABLEAU 2-4 : l'ordre de couplage (numéros des accumulateurs, 0 : +, 1 : ±, 2 : −), selon l'accumulateur le plus
 * chargé (lignes) et la couleur de celui du milieu (colonnes : vert, jaune, bleu).
 */
export const ORDRES_COUPLAGE: readonly (readonly (readonly number[])[])[] = [
  [[0, 2, 1], [2, 1, 0], [1, 0, 2]],
  [[2, 0, 1], [1, 2, 0], [0, 1, 2]],
  [[1, 2, 0], [0, 2, 1], [2, 0, 1]],
]
