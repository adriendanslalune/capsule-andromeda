// Données du manuel de maintenance, section 4 (bloc Navigation ; mécaniques validées par Adrien le 19/10/2026) :
// l'atlas des constellations (et leur cap), l'ordre de freinage des anneaux du gyroscope, les codes du calculateur.
// Le panneau et le manuel lisent les mêmes données : ce qui est écrit dans le manuel est exactement ce que le jeu
// attend, le même pour tous les joueurs.

/** Une constellation de l'atlas : ses étoiles (de −1 à 1, y vers le bas), ses traits (paires d'étoiles) et son cap. */
export interface Constellation {
  nom: string
  etoiles: readonly (readonly [number, number])[]
  traits: readonly (readonly [number, number])[]
  /** Cap à régler : azimut (degrés) et hauteur (degrés). */
  azimut: number
  hauteur: number
}

/** Les crans des cadrans du module 4A (degrés). */
export const AZIMUTS: readonly number[] = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
export const HAUTEURS: readonly number[] = [15, 30, 45, 60, 75]

/** TABLEAU 4-1 : l'atlas des constellations. */
export const CONSTELLATIONS: readonly Constellation[] = [
  { nom: 'La Capsule', etoiles: [[-0.5, 0.6], [-0.5, -0.1], [0, -0.7], [0.5, -0.1], [0.5, 0.6]], traits: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], azimut: 120, hauteur: 45 },
  { nom: 'Le Harpon', etoiles: [[-0.8, 0.8], [-0.3, 0.3], [0.2, -0.2], [0.7, -0.7], [0.3, -0.7], [0.7, -0.3]], traits: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]], azimut: 300, hauteur: 15 },
  { nom: 'La Balance', etoiles: [[0, -0.7], [0, 0.7], [-0.7, -0.2], [0.7, -0.2], [-0.7, 0.3], [0.7, 0.3]], traits: [[0, 1], [2, 3], [2, 4], [3, 5]], azimut: 30, hauteur: 60 },
  { nom: 'Le Serpent', etoiles: [[-0.8, -0.4], [-0.45, 0.1], [-0.1, -0.4], [0.25, 0.1], [0.6, -0.4], [0.85, 0.2]], traits: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], azimut: 210, hauteur: 30 },
  { nom: 'La Couronne', etoiles: [[-0.7, 0.3], [-0.4, -0.3], [0, 0.05], [0.4, -0.3], [0.7, 0.3]], traits: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], azimut: 0, hauteur: 75 },
  { nom: 'L\'Ancre', etoiles: [[0, -0.7], [0, 0.6], [-0.55, 0.3], [0.55, 0.3], [-0.3, -0.45], [0.3, -0.45]], traits: [[0, 1], [1, 2], [1, 3], [4, 5]], azimut: 270, hauteur: 45 },
  { nom: 'La Comète', etoiles: [[-0.7, 0.7], [-0.3, 0.3], [0.2, -0.1], [0.45, -0.55], [0.7, -0.1]], traits: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 2]], azimut: 90, hauteur: 30 },
  { nom: 'Le Sextant', etoiles: [[-0.6, 0.55], [0.6, 0.55], [0, -0.6], [-0.3, 0.05], [0.3, 0.05]], traits: [[0, 1], [1, 2], [2, 0], [3, 4]], azimut: 150, hauteur: 60 },
  { nom: 'Le Phare', etoiles: [[0, -0.8], [-0.3, -0.3], [0.3, -0.3], [-0.2, 0.7], [0.2, 0.7]], traits: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]], azimut: 330, hauteur: 75 },
  { nom: 'La Grue', etoiles: [[-0.7, 0.7], [-0.7, -0.6], [0.6, -0.6], [0.6, -0.1]], traits: [[0, 1], [1, 2], [2, 3]], azimut: 240, hauteur: 15 },
  { nom: 'Le Scaphandre', etoiles: [[0, -0.6], [-0.5, -0.1], [0, 0.4], [0.5, -0.1], [0, 0.8], [-0.75, -0.6]], traits: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4]], azimut: 60, hauteur: 15 },
  { nom: 'La Méduse', etoiles: [[0, -0.75], [-0.5, -0.35], [0.5, -0.35], [-0.5, 0.5], [0, 0.6], [0.5, 0.5]], traits: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 5], [1, 4]], azimut: 180, hauteur: 45 },
]

/** Les trois anneaux du gyroscope (module 4B), de l'extérieur vers l'intérieur : vitesse en degrés par seconde. */
export const ANNEAUX: readonly { titre: string; teinte: string; vitesse: number }[] = [
  { titre: 'OR', teinte: '#d9a43a', vitesse: 60 },
  { titre: 'BLEU', teinte: '#3f63c4', vitesse: 80 },
  { titre: 'ROUGE', teinte: '#e04b37', vitesse: 100 },
]
/** Écart toléré entre le repère d'un anneau et l'index au moment de freiner (degrés). */
export const TOLERANCE_GYRO = 25

/** TABLEAU 4-2 : l'ordre de freinage des anneaux, selon le dernier chiffre du numéro de série. */
export const ORDRES_GYRO: readonly { chiffres: string; jusqua: number; ordre: readonly number[] }[] = [
  { chiffres: '0 à 3', jusqua: 3, ordre: [0, 1, 2] },
  { chiffres: '4 à 6', jusqua: 6, ordre: [2, 0, 1] },
  { chiffres: '7 à 9', jusqua: 9, ordre: [1, 2, 0] },
]

/** Les huit touches d'astres du calculateur (module 4C). */
export const ASTRES: readonly string[] = ['☉', '☾', '♄', '♂', '♀', '☿', '♃', '♁']

/** Un code de correction du calculateur : la position des six interrupteurs (vrai : en haut) et trois touches d'astres. */
export interface CodeCalcul { code: string; interrupteurs: readonly boolean[]; astres: readonly number[] }

/** TABLEAU 4-3 : seize codes de correction, triés. Tirés une fois pour toutes (graine fixe). */
export const CODES_CALCUL: readonly CodeCalcul[] = (() => {
  let g = 2001
  const x = () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646 }
  const vus = new Set<string>()
  const codes: CodeCalcul[] = []
  while (codes.length < 16) {
    const code = `Δ-${'KLMNPRST'[Math.floor(x() * 8)]}${10 + Math.floor(x() * 90)}`
    if (vus.has(code)) continue
    vus.add(code)
    const interrupteurs = Array.from({ length: 6 }, () => x() < 0.5)
    const astres: number[] = []
    while (astres.length < 3) { const a = Math.floor(x() * ASTRES.length); if (!astres.includes(a)) astres.push(a) }
    codes.push({ code, interrupteurs, astres })
  }
  return codes.sort((a, b) => a.code.localeCompare(b.code))
})()
