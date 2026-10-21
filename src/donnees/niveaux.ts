// Le niveau du capitaine (décisions d'Adrien du 21/10/2026), comme dans un MMORPG : tout ce qu'on fait rapporte de
// l'expérience (XP), qui remplit une jauge et fait monter de niveau, jusqu'au niveau 100. Il ne sert qu'à se montrer :
// affiché à côté du pseudo, et la capsule change de forme sur la carte par paliers. Barème PROVISOIRE (validé dans son
// principe par Adrien) : le niveau 10 en une semaine environ, le 50 en quelques mois, le 100 en un an.

export const NIVEAU_MAX = 100
/** XP pour passer du niveau n au suivant : 50 × n^1,6. */
export const xpPourPasser = (n: number): number => Math.round(50 * n ** 1.6)

/** Ce que rapporte chaque action. */
export const XP = {
  /** Un contrat fini : le dixième de sa récompense. */
  partContrat: 0.1,
  /** Un chasseur ou un pirate abattu : de près de la Terre à Pluton. */
  chasseur: [20, 200] as const,
  /** Un vaisseau amiral abattu, une zone libérée. */
  amiralLune: 500,
  amiralPlanete: 2000,
  /** Une quête finie : le dixième de sa récompense, entre ces bornes. */
  quete: [100, 500] as const,
  /** Un module de la capsule réparé sur le panneau. */
  reparation: 15,
  /** Comptoir et Bourse : 1 XP par tranche de 100 crédits échangés, au plus 100 XP par jour (pas de farm). */
  commerceParCent: 1,
  commerceParJour: 100,
  /** Un monolithe trouvé, une Voix perdue enregistrée. */
  monolithe: 50,
  /** Une sonde disparue retrouvée (les Disparus). */
  disparu: 50,
  voix: 50,
} as const

/** Les formes de la capsule sur la carte, par paliers de niveau (son grade). */
export type Forme = 'capsule' | 'navette' | 'corvette' | 'fregate' | 'croiseur' | 'legende'
export const PALIERS: readonly { des: number; forme: Forme; nom: string }[] = [
  { des: 1, forme: 'capsule', nom: 'Capsule' },
  { des: 20, forme: 'navette', nom: 'Navette' },
  { des: 40, forme: 'corvette', nom: 'Corvette' },
  { des: 60, forme: 'fregate', nom: 'Frégate' },
  { des: 80, forme: 'croiseur', nom: 'Croiseur' },
  { des: 100, forme: 'legende', nom: 'Légende' },
]
