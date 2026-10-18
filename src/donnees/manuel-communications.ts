// Données du manuel de maintenance, section 1 (Communications) : le télégraphe (morse et fréquences), l'antenne
// (stations et angles), le chiffreur (colonnes de symboles). Le panneau et le manuel lisent les mêmes données : ce qui
// est écrit dans le manuel est exactement ce que le jeu attend.

/** Petit hasard à graine fixe (les tableaux du manuel sont tirés une fois pour toutes). */
function hasardFixe(graine: number): () => number {
  let g = graine
  return () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646 }
}

/** TABLEAU 1-1 : l'alphabet morse (point « · », trait « — »). */
export const MORSE: Readonly<Record<string, string>> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-',
  L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-',
  W: '.--', X: '-..-', Y: '-.--', Z: '--..',
}

/** Les fréquences du cadran du télégraphe (MHz, × 1000), dans l'ordre du cadran. */
export const FREQUENCES: readonly number[] = [3505, 3515, 3522, 3532, 3535, 3542, 3545, 3552, 3555, 3565, 3572, 3575, 3582, 3592, 3595, 3600]

/** TABLEAU 1-2 : le mot que clignote la lampe, et la fréquence sur laquelle répondre. */
export const MOTS_TELEGRAPHE: readonly { mot: string; frequence: number }[] = (() => {
  const mots = ['LUNE', 'MARS', 'VENUS', 'TITAN', 'TRITON', 'TERRE', 'EUROPE', 'CERES', 'COMETE', 'PLUTON', 'PHOBOS', 'DEIMOS', 'ORBITE', 'RHEA', 'JAPET', 'SOLEIL']
  const x = hasardFixe(1903)
  const f = [...FREQUENCES]
  for (let i = f.length - 1; i > 0; i--) { const j = Math.floor(x() * (i + 1)); [f[i], f[j]] = [f[j], f[i]] }
  return mots.map((mot, k) => ({ mot, frequence: f[k] })).sort((a, b) => a.mot.localeCompare(b.mot))
})()

/** Écriture d'une fréquence : 3505 → « 3,505 ». */
export function texteFrequence(f: number): string {
  return (f / 1000).toFixed(3).replace('.', ',')
}

/** Les stations de poursuite que l'antenne doit viser : un symbole (sur la plaque du module) et un nom. */
export const STATIONS: readonly { symbole: string; nom: string }[] = [
  { symbole: '▲', nom: 'Kourou' }, { symbole: '●', nom: 'Madrid' }, { symbole: '■', nom: 'Canberra' },
  { symbole: '◆', nom: 'Goldstone' }, { symbole: '★', nom: 'Baïkonour' }, { symbole: '✚', nom: 'Toulouse' },
  { symbole: '◐', nom: 'Malindi' }, { symbole: '✱', nom: 'Kerguelen' },
]
export const BANDES = ['A', 'B', 'C'] as const
export type Bande = (typeof BANDES)[number]

/** Pas du cadran de l'antenne (degrés). */
export const PAS_ANTENNE = 15

/** TABLEAU 1-3 : l'angle de l'antenne (degrés, de 0 à 345) pour chaque station et chaque bande. */
export const ANGLES_ANTENNE: readonly (readonly number[])[] = (() => {
  const x = hasardFixe(1969)
  return STATIONS.map(() => {
    const angles: number[] = []
    while (angles.length < BANDES.length) {
      const a = Math.floor(x() * (360 / PAS_ANTENNE)) * PAS_ANTENNE
      if (!angles.includes(a)) angles.push(a)
    }
    return angles
  })
})()

/** Les symboles du chiffreur. */
export const SYMBOLES_CHIFFREUR: readonly string[] = [
  'Ψ', 'Ω', 'Σ', 'Ξ', 'Λ', 'Θ', 'Π', 'ζ', 'ξ', 'λ', 'ϑ', 'Ж', 'Щ', 'Ю', 'Я', 'Ц', 'Э', 'Б', 'Д', 'Й', '¶', '§', '¤', '‡', '∞', '&', '¿',
]

/** TABLEAU 1-4 : six colonnes de sept symboles. Les quatre touches du chiffreur sont toutes dans une seule colonne. */
export const COLONNES_CHIFFREUR: readonly (readonly string[])[] = (() => {
  const x = hasardFixe(1888)
  return Array.from({ length: 6 }, () => {
    const colonne: string[] = []
    while (colonne.length < 7) {
      const s = SYMBOLES_CHIFFREUR[Math.floor(x() * SYMBOLES_CHIFFREUR.length)]
      if (!colonne.includes(s)) colonne.push(s)
    }
    return colonne
  })
})()
