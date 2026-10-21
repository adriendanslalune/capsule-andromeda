// La libération des zones (décisions d'Adrien du 21/10/2026) : chaque planète et chaque grande lune (plus de 200 km)
// est une zone occupée par Andromède, sauf la Terre (le QG de la Résistance, libre dès le départ). Une jauge de
// résistance par zone, de 0 à 100 %, que toute activité fait monter ; à 100 %, l'assaut final contre le vaisseau
// amiral de la zone (un combat de boss) ; gagné, la zone est libérée pour de bon. Les libérations font partie des
// quêtes principales (la campagne, facultative). Une planète est plus dure à libérer qu'une lune.
// Seuils, points et vaisseaux amiraux PROVISOIRES (à équilibrer en jouant).

export interface Zone {
  /** L'astre (planète, Pluton ou grande lune). */
  nom: string
  /** Son système (la planète). */
  systeme: string
  planete: boolean
  /** Points de résistance pour atteindre 100 %. */
  seuil: number
  /** Le vaisseau amiral qui tient la zone (l'assaut final). */
  amiral: string
}

/** Les zones libres dès le départ. */
export const ZONES_LIBRES = ['Terre'] as const

/** Points d'une lune de chaque système (une planète en demande le double). */
const BASE: Record<string, number> = { Terre: 100, Vénus: 100, Mars: 100, Mercure: 110, Jupiter: 130, Saturne: 150, Uranus: 170, Neptune: 190, Pluton: 200 }

const z = (nom: string, systeme: string, amiral: string): Zone => {
  const planete = nom === systeme
  return { nom, systeme, planete, seuil: BASE[systeme] * (planete ? 2 : 1), amiral }
}

/** Les 27 zones, système par système (dans l'ordre de la campagne). */
export const ZONES_A_LIBERER: readonly Zone[] = [
  z('Lune', 'Terre', 'le Séléné'),
  z('Mars', 'Mars', 'le Phobétor'),
  z('Vénus', 'Vénus', 'le Brûle-Nuées'),
  z('Mercure', 'Mercure', 'le Calcinateur'),
  z('Io', 'Jupiter', 'le Soufre-Noir'),
  z('Europe', 'Jupiter', 'le Brise-Glace'),
  z('Ganymède', 'Jupiter', 'le Grand Veilleur'),
  z('Callisto', 'Jupiter', 'le Cratère'),
  z('Jupiter', 'Jupiter', 'le Léviathan'),
  z('Encelade', 'Saturne', 'le Geyser'),
  z('Téthys', 'Saturne', 'l\'Ithaque'),
  z('Dione', 'Saturne', 'le Spectre'),
  z('Rhéa', 'Saturne', 'le Givre'),
  z('Titan', 'Saturne', 'le Brouillard'),
  z('Japet', 'Saturne', 'le Janus'),
  z('Saturne', 'Saturne', 'le Couronné'),
  z('Ariel', 'Uranus', 'le Feu-Follet'),
  z('Umbriel', 'Uranus', 'l\'Ombreux'),
  z('Titania', 'Uranus', 'la Reine Pâle'),
  z('Obéron', 'Uranus', 'le Roi Sombre'),
  z('Miranda', 'Uranus', 'le Patchwork'),
  z('Uranus', 'Uranus', 'le Basculé'),
  z('Protée', 'Neptune', 'le Changeant'),
  z('Neptune', 'Neptune', 'le Maelström'),
  z('Triton', 'Neptune', 'TRITON'),
  z('Charon', 'Pluton', 'le Passeur'),
  z('Pluton', 'Pluton', 'le Gardien des Confins'),
]

/** Points de résistance gagnés dans la zone la plus proche (mélange d'activités, décision d'Adrien du 21/10/2026). */
export const POINTS_RESISTANCE = {
  /** Un contrat fini (n'importe quelle Maison). */
  contrat: 3,
  /** Un chasseur abattu (en plus du contrat qui le visait). */
  chasseur: 6,
  /** Une étape de quête principale. */
  etapePrincipale: 10,
  /** Un monolithe trouvé, une Voix perdue enregistrée. */
  monolithe: 2,
  voix: 2,
} as const

/** Paliers de la jauge annoncés au joueur. */
export const PALIERS_JAUGE = [25, 50, 75, 100] as const
