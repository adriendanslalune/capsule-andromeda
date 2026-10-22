// Ce qui peuple l'espace, en plus des vrais astres et engins (décisions d'Adrien du 18/10/2026) :
//   - des épaves partout, tout le temps : dans chaque système (autour des planètes) et en plein espace (entre les
//     planètes, ceinture d'astéroïdes, ceinture de Kuiper). Elles ne disparaissent pas ; on les vide en mission ;
//   - des chasseurs aliens d'Andromède, très nombreux, partout dans le système solaire (très rares près de la Terre,
//     de plus en plus nombreux loin du Soleil). Ils errent au hasard : on ne peut pas prévoir où ils vont. On ne les
//     voit qu'au radar.
// Tout est tiré une fois pour toutes (graine fixe) : le même monde pour tous. Valeurs PROVISOIRES.

/** Paramètre gravitationnel (km³/s²), pour la période des orbites. */
export const GM: Readonly<Record<string, number>> = {
  Soleil: 132_712_440_018, Mercure: 22_032, Vénus: 324_859, Terre: 398_600, Mars: 42_828, Jupiter: 126_686_534,
  Saturne: 37_931_187, Uranus: 5_793_939, Neptune: 6_836_529, Pluton: 869.6,
  // Les grandes lunes (les zones à libérer) : des épaves, des stations et des chasseurs tournent aussi autour d'elles.
  Lune: 4902.8, Io: 5959.9, Europe: 3202.7, Ganymède: 9887.8, Callisto: 7179.3, Encelade: 7.21, Téthys: 41.2, Dione: 73.1,
  Rhéa: 153.9, Titan: 8978.1, Japet: 120.5, Ariel: 83.5, Umbriel: 85.1, Titania: 228.2, Obéron: 192.4, Miranda: 4.4,
  Protée: 2.94, Triton: 1427.6, Charon: 106.1,
}

/**
 * Les grandes lunes (demande d'Adrien du 21/10/2026 : « hors de question de faire un long voyage pour n'avoir rien à
 * faire ») : leur planète, leur rayon (km) et leur sphère d'influence (rayon de Hill, km) ; chacune a ses épaves, ses
 * stations, ses chasseurs et ses contrats.
 */
export const GRANDES_LUNES: Readonly<Record<string, { planete: string; rayon: number; hill: number }>> = {
  Lune: { planete: 'Terre', rayon: 1737, hill: 61_500 },
  Io: { planete: 'Jupiter', rayon: 1822, hill: 10_560 },
  Europe: { planete: 'Jupiter', rayon: 1561, hill: 13_650 },
  Ganymède: { planete: 'Jupiter', rayon: 2634, hill: 31_700 },
  Callisto: { planete: 'Jupiter', rayon: 2410, hill: 50_150 },
  Encelade: { planete: 'Saturne', rayon: 252, hill: 949 },
  Téthys: { planete: 'Saturne', rayon: 531, hill: 2101 },
  Dione: { planete: 'Saturne', rayon: 561, hill: 3257 },
  Rhéa: { planete: 'Saturne', rayon: 764, hill: 5830 },
  Titan: { planete: 'Saturne', rayon: 2575, hill: 52_400 },
  Japet: { planete: 'Saturne', rayon: 735, hill: 36_300 },
  Ariel: { planete: 'Uranus', rayon: 579, hill: 3222 },
  Umbriel: { planete: 'Uranus', rayon: 585, hill: 4516 },
  Titania: { planete: 'Uranus', rayon: 789, hill: 10_280 },
  Obéron: { planete: 'Uranus', rayon: 761, hill: 13_000 },
  Miranda: { planete: 'Uranus', rayon: 236, hill: 821 },
  Protée: { planete: 'Neptune', rayon: 210, hill: 615 },
  Triton: { planete: 'Neptune', rayon: 1353, hill: 14_600 },
  Charon: { planete: 'Pluton', rayon: 606, hill: 6740 },
}
const UA = 149_597_870.7

/**
 * Un objet sur une orbite simple (circulaire, un peu inclinée) autour d'une planète ou du Soleil ; un chasseur y ajoute
 * une errance : un écart (km) qui varie sans cesse, fait de trois ondulations de périodes sans rapport entre elles.
 */
export interface ObjetEnOrbite {
  nom: string
  /** Planète (ou Pluton), ou 'Soleil' pour ce qui est en plein espace. */
  parent: string
  rayon: number
  phase: number
  inclinaison: number
  errance?: { amplitude: number; periodes: [number, number, number]; phases: number[] }
}

const o = (nom: string, parent: string, rayon: number, phase: number, inclinaison = 0.15): ObjetEnOrbite => ({ nom, parent, rayon, phase, inclinaison })

/** Période d'une orbite circulaire (ms). */
export function periodeOrbite(o: ObjetEnOrbite): number {
  return 2 * Math.PI * Math.sqrt(o.rayon ** 3 / GM[o.parent]) * 1000
}

/** Hasard à graine fixe (le monde est le même pour tous). */
function hasardFixe(graine: number): () => number {
  let g = graine
  return () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646 }
}

/** Rayon de la sphère d'influence (km) des planètes et de Pluton (pour rester dans leur système). */
const HILL: Readonly<Record<string, number>> = {
  Mercure: 175_000, Vénus: 1_000_000, Terre: 1_470_000, Mars: 980_000, Jupiter: 51_000_000, Saturne: 62_000_000,
  Uranus: 67_000_000, Neptune: 115_000_000, Pluton: 6_000_000,
  ...Object.fromEntries(Object.entries(GRANDES_LUNES).map(([nom, l]) => [nom, l.hill])),
}
/** Rayon des planètes (km) : les objets restent bien au-dessus de la surface. */
const RAYON: Readonly<Record<string, number>> = {
  Mercure: 2440, Vénus: 6052, Terre: 6371, Mars: 3390, Jupiter: 69_911, Saturne: 58_232, Uranus: 25_362, Neptune: 24_622, Pluton: 1188,
  ...Object.fromEntries(Object.entries(GRANDES_LUNES).map(([nom, l]) => [nom, l.rayon])),
}

/** Une région de l'espace : autour d'une planète (de min à max fois son rayon… au plus 80 % de sa sphère), ou entre deux distances du Soleil (UA). */
interface Region { parent: string; min: number; max: number; epaves: number; aliens: number; lettre: string }

const REGIONS: readonly Region[] = [
  { parent: 'Mercure', min: 3, max: 50, epaves: 4, aliens: 3, lettre: 'Μ' },
  { parent: 'Vénus', min: 3, max: 150, epaves: 6, aliens: 5, lettre: 'Β' },
  // Autour de la Terre : beaucoup d'épaves ; les chasseurs ne s'aventurent qu'au bord du système.
  { parent: 'Terre', min: 1.2, max: 60, epaves: 10, aliens: 0, lettre: 'Τ' },
  { parent: 'Terre', min: 180, max: 225, epaves: 0, aliens: 3, lettre: 'Ξ' },
  { parent: 'Mars', min: 2, max: 230, epaves: 8, aliens: 12, lettre: 'Ψ' },
  { parent: 'Jupiter', min: 3, max: 600, epaves: 10, aliens: 35, lettre: 'Ω' },
  { parent: 'Saturne', min: 3, max: 800, epaves: 10, aliens: 35, lettre: 'Σ' },
  { parent: 'Uranus', min: 3, max: 2000, epaves: 8, aliens: 35, lettre: 'Φ' },
  { parent: 'Neptune', min: 3, max: 3500, epaves: 8, aliens: 40, lettre: 'Λ' },
  { parent: 'Pluton', min: 3, max: 3500, epaves: 4, aliens: 15, lettre: 'Δ' },
  // En plein espace (distances au Soleil en UA).
  { parent: 'Soleil', min: 0.45, max: 0.9, epaves: 6, aliens: 4, lettre: 'Α' },
  { parent: 'Soleil', min: 1.1, max: 1.9, epaves: 8, aliens: 6, lettre: 'Γ' },
  { parent: 'Soleil', min: 2.1, max: 3.4, epaves: 20, aliens: 30, lettre: 'Κ' },
  { parent: 'Soleil', min: 4, max: 9, epaves: 10, aliens: 30, lettre: 'Η' },
  { parent: 'Soleil', min: 10, max: 18, epaves: 8, aliens: 30, lettre: 'Θ' },
  { parent: 'Soleil', min: 20, max: 29, epaves: 8, aliens: 30, lettre: 'Ι' },
  { parent: 'Soleil', min: 31, max: 48, epaves: 14, aliens: 40, lettre: 'Ζ' },
  // Autour de chaque grande lune (demande d'Adrien du 21/10/2026) : 3 épaves et 2 chasseurs, de 1,3 à 25 fois son rayon
  // (au plus 80 % de sa sphère d'influence). Ajoutées à la fin : le reste du monde ne change pas.
  ...Object.keys(GRANDES_LUNES).map((nom): Region => ({ parent: nom, min: 1.3, max: 25, epaves: 3, aliens: 2, lettre: nom })),
  // Deux chasseurs tout près de la Terre (demande d'Adrien du 22/10/2026 : tous les genres de contrat, dès le début, et
  // ABATTRE en fait partie) : à portée du premier moteur (VOL_MAX_DEBUT). Ajoutés à la fin : le reste ne change pas.
  { parent: 'Terre', min: 3, max: 5, epaves: 0, aliens: 2, lettre: 'Π' },
]

const SORTES_EPAVES = [
  'Satellite mort', 'Étage de fusée', 'Sonde perdue', 'Cargo abandonné', 'Station en ruine', 'Conteneur à la dérive',
  'Remorqueur éventré', 'Réservoir crevé', 'Navette échouée', 'Module habitable', 'Antenne arrachée', 'Minéralier',
]

/** Épaves célèbres (qui gardent leur nom), placées dans leur système. */
const CELEBRES: readonly [string, string, number][] = [
  ['Kosmos 482', 'Terre', 21_000], ['Telstar 1', 'Terre', 9_500], ['Vanguard 2', 'Terre', 12_000],
  ['Snoopy (Apollo 10)', 'Terre', 260_000], ['Mars 3', 'Mars', 18_000], ['Phobos-Grunt', 'Mars', 45_000],
  ['Venera 7', 'Vénus', 40_000], ['Débris de Galileo', 'Jupiter', 2_500_000], ['Débris de Cassini', 'Saturne', 1_800_000],
]

function tirer(): { epaves: ObjetEnOrbite[]; aliens: ObjetEnOrbite[] } {
  const x = hasardFixe(20261018)
  const epaves: ObjetEnOrbite[] = CELEBRES.map(([nom, parent, rayon]) => ({ nom, parent, rayon, phase: x(), inclinaison: 0.15 }))
  const aliens: ObjetEnOrbite[] = []
  const distance = (r: Region) => {
    if (r.parent === 'Soleil') return (r.min + (r.max - r.min) * x()) * UA
    const R = RAYON[r.parent]
    // Réparti en distance logarithmique : autant près que loin de la planète.
    const a = Math.log(r.min * R), b = Math.log(Math.min(r.max * R, 0.8 * HILL[r.parent]))
    return Math.exp(a + (b - a) * x())
  }
  let numero = 1
  for (const r of REGIONS) {
    for (let k = 0; k < r.epaves; k++) {
      const sorte = SORTES_EPAVES[Math.floor(x() * SORTES_EPAVES.length)]
      epaves.push({ nom: `${sorte} ${String.fromCharCode(65 + Math.floor(x() * 26))}-${numero++}`, parent: r.parent, rayon: distance(r), phase: x(), inclinaison: 0.3 * (x() - 0.5) })
    }
    for (let k = 0; k < r.aliens; k++) {
      const rayon = distance(r)
      // L'errance : autour de son orbite, un écart de l'ordre de 30 % de sa distance (en plein espace : 5 à 20 millions
      // de km), qui change en quelques heures (en plein espace : en quelques jours).
      const loin = r.parent === 'Soleil'
      const amplitude = loin ? (5 + 15 * x()) * 1e6 : 0.3 * rayon
      const base = loin ? 30 * 3_600_000 : 4 * 3_600_000
      aliens.push({
        nom: `Chasseur ${r.lettre}-${aliens.filter((a) => a.nom.startsWith(`Chasseur ${r.lettre}-`)).length + 1}`, parent: r.parent, rayon,
        phase: x(), inclinaison: 0.4 * (x() - 0.5),
        errance: { amplitude, periodes: [base * (0.7 + x()), base * (1.9 + 2 * x()), base * (0.23 + 0.3 * x())], phases: Array.from({ length: 9 }, () => x() * 2 * Math.PI) },
      })
    }
  }
  return { epaves, aliens }
}

const MONDE = tirer()
/** Les épaves (en plus des débris autour des satellites de la Terre). */
export const EPAVES: readonly ObjetEnOrbite[] = MONDE.epaves
/** Les chasseurs aliens. */
export const ALIENS: readonly ObjetEnOrbite[] = MONDE.aliens

/**
 * Les stations des autres systèmes (la Terre a les siennes : l'ISS, Tiangong) : on y charge les cargaisons, on y
 * livre, on les dépanne. Toujours sur la carte.
 */
export const STATIONS_SYSTEMES: readonly ObjetEnOrbite[] = (() => {
  // 5 stations par système (demande d'Adrien du 18/10/2026 : plus de variété), chacune sur sa propre orbite (rayon en
  // rayons de la planète : elles tournent, plus vite près de la planète, plus lentement loin).
  const noms: Record<string, [string, number][]> = {
    Mercure: [['Relais Hermès', 2.5], ['Forge Caloris', 4.5], ['Observatoire Messenger', 7], ['Dock Mariner', 11], ['Abri Solaire', 18]],
    Vénus: [['Station Aphrodite', 2.3], ['Aérostat Ishtar', 4], ['Aérostat Lakshmi', 6.5], ['Dock Venera', 10], ['Relais Magellan', 16]],
    Mars: [['Station Arès', 3], ['Dock Olympus', 5], ['Base Valles', 8], ['Relais Curiosity', 12], ['Station Hellas', 20]],
    Jupiter: [['Station Zeus', 3.5], ['Raffinerie Amalthée', 6], ['Dock Galilée', 12], ['Station Héra', 20], ['Relais Juno', 35]],
    Saturne: [['Station Cronos', 3.2], ['Dock des Anneaux', 5], ['Station Huygens', 10], ['Raffinerie Pan', 18], ['Relais Cassini', 30]],
    Uranus: [['Station Herschel', 3], ['Relais Miranda', 6], ['Dock Voyager', 11], ['Station Puck', 18], ['Phare Cordélia', 28]],
    Neptune: [['Station Le Verrier', 3], ['Phare Galle', 7], ['Dock Adams', 13], ['Station Néréide', 22], ['Relais Protée', 35]],
    Pluton: [['Station Tombaugh', 4], ['Avant-poste Kuiper', 8], ['Dock Charon', 14], ['Relais New Horizons', 24], ['Station Styx', 40]],
    // Deux stations autour de chaque grande lune (demande d'Adrien du 21/10/2026), au plus à 70 % de sa sphère d'influence.
    Lune: [['Station Tycho', 1.6], ['Relais Apollo', 6]],
    Io: [['Station Loki', 1.6], ['Relais Pelé', 3]],
    Europe: [['Station Minos', 1.6], ['Relais Clipper', 4]],
    Ganymède: [['Station Osiris', 1.6], ['Dock Marius', 5]],
    Callisto: [['Station Valhalla', 1.6], ['Relais Asgard', 6]],
    Encelade: [['Station Damas', 1.6], ['Relais Bagdad', 2.5]],
    Téthys: [['Station Odyssée', 1.6], ['Relais Pénélope', 2.5]],
    Dione: [['Station Évandre', 1.6], ['Relais Didon', 3]],
    Rhéa: [['Station Inktomi', 1.6], ['Relais Tirawa', 3]],
    Titan: [['Station Kraken', 1.6], ['Aérostat Shangri-La', 6]],
    Japet: [['Station Roncevaux', 1.6], ['Relais Turgis', 6]],
    Ariel: [['Station Kachina', 1.6], ['Relais Prospero', 3]],
    Umbriel: [['Station Wunda', 1.6], ['Relais Vuver', 3]],
    Titania: [['Station Messina', 1.6], ['Relais Gertrude', 4]],
    Obéron: [['Station Hamlet', 1.6], ['Relais Othello', 5]],
    Miranda: [['Station Vérone', 1.6], ['Relais Inverness', 2.4]],
    Protée: [['Station Pharos', 1.6], ['Relais Vidar', 2]],
    Triton: [['Avant-poste Sippar', 1.6], ['Relais Tuonela', 4]],
    Charon: [['Station Mordor', 1.6], ['Relais Vulcain', 4]],
  }
  const x = hasardFixe(1930)
  return Object.entries(noms).flatMap(([parent, liste]) => liste.map(([nom, k]) => o(nom, parent, Math.min(k * RAYON[parent], 0.7 * HILL[parent]), x(), 0.2 * (x() - 0.5))))
})()

/** Chance qu'un chasseur repéré tire un missile, par heure, selon sa région (rare près de la Terre). */
export function tirsParHeure(o: ObjetEnOrbite): number {
  const lune = GRANDES_LUNES[o.parent]
  if (lune) return tirsParHeure({ ...o, parent: lune.planete })
  if (o.parent === 'Soleil') return o.rayon < 2 * UA ? 0.05 : o.rayon < 4 * UA ? 0.08 : o.rayon < 19 * UA ? 0.1 : 0.15
  return ({ Mercure: 0.04, Vénus: 0.04, Terre: 0.02, Mars: 0.06, Jupiter: 0.08, Saturne: 0.1, Uranus: 0.12, Neptune: 0.15, Pluton: 0.15 } as Record<string, number>)[o.parent]
}
/** Au plus tant de missiles en vol à la fois. */
export const MISSILES_MAX = 2

/** Durée de vol d'un missile (ms) : le décompte. */
export const VOL_MISSILE = 90_000
/**
 * Un chasseur repéré au radar depuis moins de REPERAGE ne surprend pas : son missile met VOL_MISSILE à arriver ; un
 * chasseur qu'on n'a pas vu tire sans prévenir, son missile arrive deux fois plus vite (décision d'Adrien du
 * 21/10/2026 : allumer le radar avant de partir devient un réflexe de prudence).
 */
export const REPERAGE = 30 * 60_000
/** Un chasseur abattu est remplacé par un renfort d'Andromède (ailleurs dans sa région) au bout de ce temps. */
export const RETOUR_ALIEN = 2 * 3_600_000
/**
 * Une épave remorquée reste à quai à sa station le temps d'être recyclée ; puis une autre apparaît ailleurs autour du
 * même astre (demande d'Adrien du 21/10/2026 : que le remorquage déplace vraiment l'épave, sans en manquer un jour).
 */
export const RECYCLAGE_EPAVE = 24 * 3_600_000
/** Intercepteurs : au plus 3 ; un nouveau toutes les 30 minutes. */
export const INTERCEPTEURS_MAX = 3
export const RECHARGE_INTERCEPTEUR = 30 * 60_000
