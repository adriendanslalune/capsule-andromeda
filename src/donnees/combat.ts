// Le combat en vue tactique (étape 6 ; d'abord un prototype à tester, dans un simulateur). Toutes ces valeurs sont
// PROVISOIRES : elles seront réglées avec Adrien après essai sur téléphone.

/** L'énergie de la capsule, en crans, à répartir entre trois systèmes. */
export interface Energie { boucliers: number; armes: number; moteurs: number }
export type SystemeEnergie = keyof Energie
export const SYSTEMES_ENERGIE: readonly { systeme: SystemeEnergie; titre: string; role: string }[] = [
  { systeme: 'boucliers', titre: 'BOUCLIERS', role: 'chaque cran arrête 20 % des tirs ennemis' },
  { systeme: 'armes', titre: 'ARMES', role: 'plus de crans, recharge plus rapide' },
  { systeme: 'moteurs', titre: 'MOTEURS', role: 'esquive (10 % par cran), et fuir plus vite' },
]
export const ENERGIE_TOTALE = 6
export const MAX_PAR_SYSTEME = 4
export const ENERGIE_DEPART: Energie = { boucliers: 2, armes: 3, moteurs: 1 }

/** La capsule. */
export const COQUE_MAX = 10
export const INTERCEPTEURS = 3
/** Recharge du canon (ms) avec un seul cran d'armes ; divisée par le nombre de crans. */
export const RECHARGE_CANON = 6000
export const PART_BOUCLIER_PAR_CRAN = 0.2
export const ESQUIVE_PAR_CRAN = 0.1
/** Fuir prend ce temps (ms) avec un seul cran de moteurs ; divisé par le nombre de crans. */
export const DUREE_FUITE = 12_000

/** L'ennemi : un chasseur alien, ses modules et leur solidité. */
export type NomModuleEnnemi = 'missiles' | 'canon' | 'bouclier' | 'reacteur'
export const MODULES_ENNEMI: readonly { nom: NomModuleEnnemi; titre: string; pv: number; role: string }[] = [
  { nom: 'missiles', titre: 'MISSILES', pv: 3, role: 'lance un missile toutes les 15 s' },
  { nom: 'canon', titre: 'CANON', pv: 3, role: 'tire toutes les 4 s' },
  { nom: 'bouclier', titre: 'BOUCLIER', pv: 2, role: 'arrête un tir sur deux sur les autres modules' },
  { nom: 'reacteur', titre: 'RÉACTEUR', pv: 4, role: 'détruit : le chasseur est vaincu' },
]
export const INTERVALLE_CANON_ENNEMI = 4000
export const DEGATS_CANON_ENNEMI = 1
export const INTERVALLE_MISSILES = 15_000
export const VOL_MISSILE = 10_000
export const DEGATS_MISSILE = 3
