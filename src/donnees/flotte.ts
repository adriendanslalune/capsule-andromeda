// La flotte des autres commissionnaires, en attendant le serveur (phase 4) : des « bots » qui font leur vie dans le
// vrai système solaire. Chacun a son nom peint, sa couleur, sa vitesse (selon ses améliorations du moteur) et ses
// escales habituelles. Leur position ne dépend que de l'heure : tous les joueurs les voient au même endroit.

export interface Bot {
  nom: string
  serie: string
  /** Couleur du point sur la carte et dans la vue 3D. */
  couleur: string
  /** Vitesse de croisière (km/s). */
  vitesse: number
  /** Escales entre lesquelles il navigue. */
  escales: string[]
  /** Durée d'un cycle (jours) : une escale, puis un trajet vers la suivante. */
  cycleJours: number
  /** Part du temps où il est connecté (0 à 1). */
  enLigne: number
}

/** Active les bots (à couper quand les vrais joueurs seront assez nombreux). */
export const BOTS_ACTIFS = true

const TERRE_LUNE = ['Terre', 'Lune', 'ISS']

export const FLOTTE: Bot[] = [
  { nom: 'L’Hirondelle', serie: 'BX2-41K', couleur: '#e04b37', vitesse: 30, escales: TERRE_LUNE, cycleJours: 1, enLigne: 0.5 },
  { nom: 'Mistinguett', serie: 'QA7-09D', couleur: '#f2b53a', vitesse: 33, escales: TERRE_LUNE, cycleJours: 1.5, enLigne: 0.35 },
  { nom: 'Cocotte-Minute', serie: 'PL4-77M', couleur: '#8fcf98', vitesse: 36.3, escales: TERRE_LUNE, cycleJours: 0.75, enLigne: 0.6 },
  { nom: 'Le Petit Prince', serie: 'ZR1-12B', couleur: '#8fd0dc', vitesse: 30, escales: ['Terre', 'Lune'], cycleJours: 2, enLigne: 0.25 },
  { nom: 'Bel Ami', serie: 'KT9-30F', couleur: '#f3a08b', vitesse: 39.9, escales: TERRE_LUNE, cycleJours: 1.2, enLigne: 0.45 },
  { nom: 'La Fusée de Mémé', serie: 'DD3-58A', couleur: '#d9a0e0', vitesse: 30, escales: ['Terre', 'ISS'], cycleJours: 0.5, enLigne: 0.3 },
  { nom: 'Zéphyr', serie: 'MV6-24C', couleur: '#ffd27a', vitesse: 48.3, escales: ['Terre', 'Lune', 'Vénus'], cycleJours: 70, enLigne: 0.4 },
  { nom: 'Le Vieux Grognard', serie: 'GR8-66T', couleur: '#cfc6b6', vitesse: 58.5, escales: ['Terre', 'Mars', 'Lune'], cycleJours: 90, enLigne: 0.55 },
  { nom: 'Belle Époque', serie: 'BE5-19P', couleur: '#e6cf92', vitesse: 53.1, escales: ['Terre', 'Vénus', 'Mercure'], cycleJours: 80, enLigne: 0.3 },
  { nom: 'Sputnik Jojo', serie: 'SJ2-57S', couleur: '#7fa4cf', vitesse: 77.8, escales: ['Mars', 'Jupiter', 'Terre'], cycleJours: 400, enLigne: 0.5 },
  { nom: 'Le Rossignol', serie: 'RS4-03L', couleur: '#a9d2d6', vitesse: 43.9, escales: ['Terre', 'Lune', 'Mars'], cycleJours: 100, enLigne: 0.35 },
  { nom: 'Capitaine Fracasse', serie: 'CF7-88V', couleur: '#e07a5c', vitesse: 103.6, escales: ['Jupiter', 'Saturne', 'Mars'], cycleJours: 700, enLigne: 0.4 },
]
