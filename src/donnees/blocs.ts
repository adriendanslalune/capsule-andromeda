// Le panneau de réparation est fait de cinq blocs, un par grand système de la capsule (le « module » qui tombe en
// panne : Moteur, Navigation…), et chaque bloc a trois modules très différents (décision d'Adrien du 18/10/2026).
// Quand un bloc tombe en panne, un ou deux de ses modules sont en défaut ; le bloc remarche quand ils sont tous réparés.
// Dans le code, le bloc garde le nom de NomModule (le système de la capsule) ; ses modules sont des « appareils ».

import type { NomModule } from './modules'

export type NomAppareil =
  | 'telegraphe' | 'antenne' | 'chiffreur'
  | 'bornier' | 'fusibles' | 'accumulateurs'
  | 'leviers' | 'soupape' | 'injecteurs'
  | 'constellation' | 'gyroscope' | 'calculateur'
  | 'vannes' | 'breche' | 'sas'

export interface FicheBloc {
  bloc: NomModule
  /** Numéro du bloc sur le panneau et de sa section dans le manuel. */
  numero: number
  titre: string
  appareils: readonly [NomAppareil, NomAppareil, NomAppareil]
}

/** Les cinq blocs, de haut en bas du panneau (et dans l'ordre du manuel). */
export const BLOCS: readonly FicheBloc[] = [
  { bloc: 'communications', numero: 1, titre: 'COMMUNICATIONS', appareils: ['telegraphe', 'antenne', 'chiffreur'] },
  { bloc: 'energie', numero: 2, titre: 'ÉNERGIE', appareils: ['bornier', 'fusibles', 'accumulateurs'] },
  { bloc: 'moteur', numero: 3, titre: 'MOTEUR', appareils: ['leviers', 'soupape', 'injecteurs'] },
  { bloc: 'navigation', numero: 4, titre: 'NAVIGATION', appareils: ['constellation', 'gyroscope', 'calculateur'] },
  { bloc: 'coque', numero: 5, titre: 'COQUE', appareils: ['vannes', 'breche', 'sas'] },
]

export const TITRES_APPAREILS: Readonly<Record<NomAppareil, string>> = {
  telegraphe: 'TÉLÉGRAPHE', antenne: 'ANTENNE', chiffreur: 'CHIFFREUR',
  bornier: 'BORNIER', fusibles: 'FUSIBLES', accumulateurs: 'ACCUMULATEURS',
  leviers: 'LEVIERS', soupape: 'SOUPAPE', injecteurs: 'INJECTEURS',
  constellation: 'CONSTELLATION', gyroscope: 'GYROSCOPE', calculateur: 'CALCULATEUR',
  vannes: 'VANNES', breche: 'BRÈCHE', sas: 'SAS',
}

/** Modules déjà raccordés (qui peuvent tomber en défaut et se réparer avec le manuel) ; les autres viendront. */
export const APPAREILS_PRETS: readonly NomAppareil[] = [
  'telegraphe', 'antenne', 'chiffreur', 'bornier', 'fusibles', 'accumulateurs', 'leviers', 'soupape', 'injecteurs',
  'constellation', 'gyroscope', 'calculateur',
]

export function ficheBloc(bloc: NomModule): FicheBloc {
  return BLOCS.find((b) => b.bloc === bloc)!
}

export function blocDe(a: NomAppareil): FicheBloc {
  return BLOCS.find((b) => b.appareils.includes(a))!
}

/** Repère d'un module sur le panneau et dans le manuel : « 1B ». */
export function repere(a: NomAppareil): string {
  const b = blocDe(a)
  return `${b.numero}${'ABC'[b.appareils.indexOf(a)]}`
}
