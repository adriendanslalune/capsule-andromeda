// Les modules de la capsule et l'effet de leur panne (décisions d'Adrien du 18/10/2026, étape 4).

export type NomModule = 'moteur' | 'navigation' | 'communications' | 'energie' | 'coque'

export interface FicheModule {
  nom: NomModule
  /** Nom affiché. */
  titre: string
  /** Effet de la panne, en quelques mots. */
  effet: string
}

export const MODULES: readonly FicheModule[] = [
  { nom: 'moteur', titre: 'Moteur', effet: 'vitesse divisée par 2' },
  { nom: 'navigation', titre: 'Navigation', effet: 'impossible de calculer un trajet' },
  { nom: 'communications', titre: 'Communications', effet: 'plus de nouvelles missions' },
  { nom: 'energie', titre: 'Énergie', effet: 'actions sur place deux fois plus longues' },
  { nom: 'coque', titre: 'Coque', effet: 'un impact abîmera deux modules' },
]

/** Usure : chance qu'un module tombe en panne à l'arrivée d'un trajet (environ une panne tous les 10 trajets). */
export const CHANCE_PANNE_PAR_TRAJET = 0.1
