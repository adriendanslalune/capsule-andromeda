// Le tri des matériaux d'une épave (étape 5, mini-jeu des Nettoyeurs ; écrans d'abord, d'après la maquette validée
// le 18/10/2026). Les objets sortent de l'épave un par un ; il faut les jeter vite dans le bon bac. Valeurs PROVISOIRES.

export type Bac = 'metal' | 'electronique' | 'verre' | 'rebut'

export const BACS: readonly { bac: Bac; titre: string; teinte: string }[] = [
  { bac: 'metal', titre: 'MÉTAUX', teinte: '#c9c2b0' },
  { bac: 'electronique', titre: 'ÉLECTRONIQUE', teinte: '#bfe0c8' },
  { bac: 'verre', titre: 'VERRE ET CRISTAUX', teinte: '#bfe0e8' },
  { bac: 'rebut', titre: 'REBUT', teinte: '#f3c2b0' },
]

/**
 * Les objets qu'on trouve dans une épave (30, demande d'Adrien du 18/10/2026), leur bac et la marchandise qu'ils
 * donnent une fois triés (null : le rebut ne se vend pas). `dessin` : le nom de leur dessin (src/commun/vue-tri.ts).
 */
export const OBJETS_EPAVE: readonly { nom: string; bac: Bac; matiere: string | null; dessin: string }[] = [
  { nom: 'Plaque de titane', bac: 'metal', matiere: 'Titane', dessin: 'plaque' },
  { nom: 'Tuyère tordue', bac: 'metal', matiere: 'Titane', dessin: 'tuyere' },
  { nom: 'Poignée de boulons', bac: 'metal', matiere: 'Ferraille', dessin: 'boulons' },
  { nom: 'Bobine de cuivre', bac: 'metal', matiere: 'Cuivre', dessin: 'bobine' },
  { nom: 'Clé à molette', bac: 'metal', matiere: 'Ferraille', dessin: 'cle' },
  { nom: 'Gros ressort', bac: 'metal', matiere: 'Ferraille', dessin: 'ressort' },
  { nom: 'Tôle cabossée', bac: 'metal', matiere: 'Ferraille', dessin: 'tole' },
  { nom: 'Fil de cuivre', bac: 'metal', matiere: 'Cuivre', dessin: 'fil' },
  { nom: 'Carte de circuits', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'carte' },
  { nom: 'Relais grillé', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'relais' },
  { nom: 'Puce mémoire', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'puce' },
  { nom: 'Lampe radio', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'lampe' },
  { nom: 'Transistor', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'transistor' },
  { nom: 'Condensateur', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'condensateur' },
  { nom: 'Bande magnétique', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'bande' },
  { nom: 'Microphone', bac: 'electronique', matiere: 'Circuits anciens', dessin: 'micro' },
  { nom: 'Hublot fêlé', bac: 'verre', matiere: 'Verre', dessin: 'hublot' },
  { nom: 'Cristal de quartz', bac: 'verre', matiere: 'Verre', dessin: 'cristal' },
  { nom: 'Lentille d\'optique', bac: 'verre', matiere: 'Verre', dessin: 'lentille' },
  { nom: 'Fiole de laboratoire', bac: 'verre', matiere: 'Verre', dessin: 'fiole' },
  { nom: 'Miroir de télescope', bac: 'verre', matiere: 'Verre', dessin: 'miroir' },
  { nom: 'Ampoule', bac: 'verre', matiere: 'Verre', dessin: 'ampoule' },
  { nom: 'Bocal à échantillons', bac: 'verre', matiere: 'Verre', dessin: 'bocal' },
  { nom: 'Mousse isolante', bac: 'rebut', matiere: null, dessin: 'mousse' },
  { nom: 'Gant d\'astronaute', bac: 'rebut', matiere: null, dessin: 'gant' },
  { nom: 'Emballage de ration', bac: 'rebut', matiere: null, dessin: 'ration' },
  { nom: 'Toile brûlée', bac: 'rebut', matiere: null, dessin: 'toile' },
  { nom: 'Chaussette perdue', bac: 'rebut', matiere: null, dessin: 'chaussette' },
  { nom: 'Sac de déchets', bac: 'rebut', matiere: null, dessin: 'sac' },
  // Dessinée par ChatGPT à la place du rouleau d'adhésif (25/10/2026) ; du métal (Adrien, 25/10/2026).
  { nom: 'Conserve entamée', bac: 'metal', matiere: 'Ferraille', dessin: 'conserve' },
]

/** Durée du tri d'une épave (ms). */
export const DUREE_TRI = 30_000
/**
 * Tonnes récupérées par objet bien trié, multipliées par la série en cours (jusqu'à SERIE_MAX) : trier vite et sans
 * erreur récupère plus de matériaux. (Le tri ne rapporte plus de crédits : ce sont les matériaux qui se vendent.)
 * Demande d'Adrien du 20/10/2026 : la soute se remplissait en 3 tris ; 0,1 t → 0,03 t (environ 2 t par tri réussi).
 */
export const TONNES_PAR_OBJET = 0.03
export const SERIE_MAX = 5
