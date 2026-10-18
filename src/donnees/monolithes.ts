// Les monolithes (idée d'Adrien du 18/10/2026, comme les Korogu de Zelda) : 1000 monolithes cachés dans tout le
// système solaire. Ils ne tournent pas : ils restent fixes par rapport au Soleil, et les planètes passent à côté
// (décision d'Adrien du 18/10/2026). On les trouve à la radio : un PING, l'écho du plus proche revient à la vitesse de
// la lumière ; plusieurs échos venus de places différentes le situent (triangulation).
// Tirés une fois pour toutes (graine fixe) : le même monde pour tous. Répartition PROVISOIRE.

export interface Monolithe {
  /** Numéro (de 1 à 1000) : l'écho le donne. */
  numero: number
  nom: string
  /** Position héliocentrique fixe, dans le plan de l'écliptique (km). */
  x: number
  y: number
}

export const NOMBRE_MONOLITHES = 1000
/** Attente entre deux PING (décision d'Adrien du 18/10/2026 : 1 h), et jamais tant que l'écho n'est pas revenu. */
export const ATTENTE_PING = 3_600_000
/**
 * Un écho de plus « tranche » entre deux places possibles quand il les sépare d'au moins 0,3 % de sa distance : depuis
 * la Terre, pour un monolithe à 10 millions de km, un tour par la Lune suffit ; rester en orbite basse ne suffit pas.
 */
export const PRECISION_ECHO = 0.003

/**
 * Paliers de la collection (validés par Adrien le 18/10/2026) : un statut affiché à côté du pseudo dans les Messages
 * et dans le Profil. C'est le seul avantage des monolithes pour l'instant (le côté social).
 */
export const PALIERS: readonly { seuil: number; titre: string }[] = [
  { seuil: 10, titre: 'Écouteur' },
  { seuil: 50, titre: 'Sourcier' },
  { seuil: 100, titre: 'Arpenteur' },
  { seuil: 250, titre: 'Cartographe' },
  { seuil: 500, titre: 'Gardien' },
  { seuil: 1000, titre: 'Oracle' },
]

const UA = 149_597_870.7

/** Bandes de distance au Soleil (UA) et nombre de monolithes : autour des orbites des planètes, et entre elles. */
const BANDES: readonly [number, number, number][] = [
  [0.30, 0.47, 40], // Mercure
  [0.65, 0.80, 60], // Vénus
  [0.92, 1.08, 120], // Terre
  [1.35, 1.70, 100], // Mars
  [2.2, 3.3, 150], // ceinture d'astéroïdes
  [4.9, 5.5, 110], // Jupiter
  [9.0, 10.1, 100], // Saturne
  [18.3, 20.1, 80], // Uranus
  [29.5, 30.6, 70], // Neptune
  [30.6, 50, 90], // ceinture de Kuiper (Pluton)
  [1.08, 2.2, 15], [3.3, 4.9, 15], [5.5, 9.0, 15], [10.1, 18.3, 20], [20.1, 29.5, 15], // entre les deux
]

function hasardFixe(graine: number): () => number {
  let g = graine
  return () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646 }
}

export const MONOLITHES: readonly Monolithe[] = (() => {
  const x = hasardFixe(2001)
  const liste: { x: number; y: number }[] = []
  for (const [a, b, n] of BANDES) {
    for (let k = 0; k < n; k++) {
      // Uniformes sur la surface de l'anneau.
      const r = Math.sqrt(a * a + x() * (b * b - a * a)) * UA, angle = 2 * Math.PI * x()
      liste.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) })
    }
  }
  // Numérotés dans le désordre (le numéro ne dit pas où il est).
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(x() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]]
  }
  return liste.map((p, i) => ({ numero: i + 1, nom: `Monolithe n° ${i + 1}`, ...p }))
})()
