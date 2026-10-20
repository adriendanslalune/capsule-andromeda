// La Bourse du système solaire (onglet du volet Marché ; décisions d'Adrien du 20/10/2026) : des actions de neuf
// compagnies, chacune avec son siège (d'où partent ses cours, où doivent arriver les ordres, à la vitesse de la
// lumière) et son caractère, de stable à spéculative. Les cours sont les mêmes pour tous les joueurs (formule du temps,
// src/moteur/bourse.ts) : jamais liés à la partie d'un joueur. Valeurs PROVISOIRES.

export interface Compagnie {
  id: string
  nom: string
  /** Son siège : un astre de la carte (délai de la lumière des cours et des ordres). */
  siege: string
  metier: string
  /** Son caractère, en quelques mots (dans la fiche). */
  caractere: string
  /** Couleur de sa pastille et de l'aire de son graphique. */
  teinte: string
  /** Cours de référence (crédits l'action). */
  prix: number
  /** Nervosité : écart typique du cours en une journée (fraction). */
  volatilite: number
  /** Chance, chaque jour, d'un gros mouvement (annoncé par une rumeur dans les Messages). */
  evenements: number
}

export const COMPAGNIES: readonly Compagnie[] = [
  { id: 'phare', nom: 'Phare de Mercure', siege: 'Mercure', metier: 'Centrales solaires', caractere: 'Stable, ennuyeuse, sûre', teinte: '#f2c66a', prix: 42, volatilite: 0.008, evenements: 0.08 },
  { id: 'chantiers', nom: 'Chantiers Navals de Vénus', siege: 'Vénus', metier: 'Capsules et moteurs', caractere: 'Moyenne', teinte: '#f5d38a', prix: 118, volatilite: 0.016, evenements: 0.15 },
  { id: 'vanguard', nom: 'Recyclage Orbital Vanguard', siege: 'Terre', metier: 'Récupération d\'épaves', caractere: 'Très stable', teinte: '#bfe0c8', prix: 27, volatilite: 0.006, evenements: 0.06 },
  { id: 'messageries', nom: 'Messageries Interplanétaires', siege: 'Terre', metier: 'Convois et livraisons', caractere: 'Moyenne', teinte: '#8fc3e0', prix: 64, volatilite: 0.015, evenements: 0.15 },
  { id: 'tycho', nom: 'Compagnie Lunaire de Tycho', siege: 'Lune', metier: 'Mines de la Lune', caractere: 'Moyenne, avec des à-coups', teinte: '#d7cdee', prix: 85, volatilite: 0.018, evenements: 0.3 },
  { id: 'ares', nom: 'Arès Titane', siege: 'Mars', metier: 'Mines de titane', caractere: 'Nerveuse', teinte: '#e98a6f', prix: 150, volatilite: 0.03, evenements: 0.22 },
  { id: 'jovienne', nom: 'Jovienne d\'Hélium', siege: 'Jupiter', metier: 'Extraction d\'Hélium 3', caractere: 'Très nerveuse : gros gains, grosses pertes', teinte: '#e8c9a0', prix: 310, volatilite: 0.05, evenements: 0.3 },
  { id: 'glacieres', nom: 'Glacières des Anneaux', siege: 'Saturne', metier: 'Eau tirée des anneaux', caractere: 'Moyenne, loin donc lente à suivre', teinte: '#f6e3b8', prix: 58, volatilite: 0.02, evenements: 0.15 },
  { id: 'confins', nom: 'Société des Confins', siege: 'Pluton', metier: 'Exploration du bout du système', caractere: 'Spéculative : le casino du lot', teinte: '#c9b8e8', prix: 12, volatilite: 0.08, evenements: 0.4 },
]

/** Frais de la Bourse sur chaque ordre : une fraction du montant, et au moins FRAIS_MINIMUM crédits (option A
 *  choisie par Adrien le 20/10/2026 : les tout petits ordres n'ont plus d'intérêt). */
export const FRAIS_BOURSE = 0.01
export const FRAIS_MINIMUM = 5

/** Ce qu'on investit d'un coup (crédits) ; « MAX » vient en plus. */
export const MONTANTS_ACHAT: readonly number[] = [100, 500, 1000]
/** Ce qu'on revend d'un coup (part des actions qu'on a) ; « TOUT » est la dernière. */
export const PARTS_VENTE: readonly number[] = [0.25, 0.5, 1]

/** Fiabilité des rumeurs : part de celles qui disent juste. */
export const FIABILITE_RUMEURS = 0.75

/** Les rumeurs que les bots font courir avant un gros mouvement ({compagnie}, {siege}). */
export const RUMEURS_HAUSSE: readonly string[] = [
  'Il paraît que {compagnie} prépare une grosse annonce. Je dis ça, je dis rien… 📈',
  'Un ami à {siege} me dit que {compagnie} vient de décrocher un énorme contrat.',
  'Rumeur du jour : {compagnie} aurait trouvé un filon. Les malins achètent déjà.',
  'Ça s\'agite au siège de {compagnie}, à {siege}. Dans le bon sens, à ce qu\'on raconte.',
]
export const RUMEURS_BAISSE: readonly string[] = [
  'Mauvaise nouvelle pour {compagnie}, paraît-il : un accident à {siege}. 📉',
  'On murmure que {compagnie} a perdu un convoi entier. Moi, je vendrais.',
  'Rumeur du jour : les comptes de {compagnie} seraient dans le rouge.',
  'Un chasseur d\'Andromède rôderait autour des installations de {compagnie}. Ça sent le roussi.',
]
