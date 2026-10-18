// Le tri des matériaux d'une épave (étape 5, mini-jeu des Nettoyeurs ; écrans d'abord, d'après la maquette validée
// le 18/10/2026). Les objets sortent de l'épave un par un ; il faut les jeter vite dans le bon bac. Valeurs PROVISOIRES.

export type Bac = 'metal' | 'electronique' | 'verre' | 'rebut'

export const BACS: readonly { bac: Bac; titre: string; teinte: string }[] = [
  { bac: 'metal', titre: 'MÉTAUX', teinte: '#c9c2b0' },
  { bac: 'electronique', titre: 'ÉLECTRONIQUE', teinte: '#bfe0c8' },
  { bac: 'verre', titre: 'VERRE ET CRISTAUX', teinte: '#bfe0e8' },
  { bac: 'rebut', titre: 'REBUT', teinte: '#f3c2b0' },
]

/** Les objets qu'on trouve dans une épave, et leur bac. `dessin` : le nom de leur dessin (src/commun/vue-tri.ts). */
export const OBJETS_EPAVE: readonly { nom: string; bac: Bac; dessin: string }[] = [
  { nom: 'Plaque de titane', bac: 'metal', dessin: 'plaque' },
  { nom: 'Tuyère tordue', bac: 'metal', dessin: 'tuyere' },
  { nom: 'Poignée de boulons', bac: 'metal', dessin: 'boulons' },
  { nom: 'Bobine de cuivre', bac: 'metal', dessin: 'bobine' },
  { nom: 'Carte de circuits', bac: 'electronique', dessin: 'carte' },
  { nom: 'Relais grillé', bac: 'electronique', dessin: 'relais' },
  { nom: 'Puce mémoire', bac: 'electronique', dessin: 'puce' },
  { nom: 'Lampe radio', bac: 'electronique', dessin: 'lampe' },
  { nom: 'Hublot fêlé', bac: 'verre', dessin: 'hublot' },
  { nom: 'Cristal de quartz', bac: 'verre', dessin: 'cristal' },
  { nom: 'Lentille d\'optique', bac: 'verre', dessin: 'lentille' },
  { nom: 'Fiole de laboratoire', bac: 'verre', dessin: 'fiole' },
  { nom: 'Mousse isolante', bac: 'rebut', dessin: 'mousse' },
  { nom: 'Gant d\'astronaute', bac: 'rebut', dessin: 'gant' },
  { nom: 'Emballage de ration', bac: 'rebut', dessin: 'ration' },
  { nom: 'Toile brûlée', bac: 'rebut', dessin: 'toile' },
]

/** Durée du tri d'une épave (ms). */
export const DUREE_TRI = 30_000
/** Crédits par objet bien trié, multipliés par la série en cours (jusqu'à SERIE_MAX). */
export const GAIN_PAR_OBJET = 2
export const SERIE_MAX = 5
