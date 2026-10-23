// Les instruments de la capsule (décision d'Adrien du 23/10/2026) : une capsule neuve n'a rien d'installé (ni radar, ni
// PING, ni radio, ni Marché, ni communications) ; chaque instrument arrive par une quête du tutoriel. Une partie
// commencée avant cette règle les a tous.

export const INSTRUMENTS = ['communications', 'contrats', 'marche', 'reparation', 'radar', 'armement', 'ping', 'collections', 'radio', 'bourse'] as const
export type Instrument = typeof INSTRUMENTS[number]

/** Son nom à l'écran. */
export const NOMS_INSTRUMENTS: Record<Instrument, string> = {
  communications: 'Communications', contrats: 'Contrats', marche: 'Marché', reparation: 'Panneau de réparation',
  radar: 'Radar', armement: 'Armement', ping: 'PING', collections: 'Collections', radio: 'Radio', bourse: 'Bourse',
}
