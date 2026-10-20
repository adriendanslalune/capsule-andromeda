// Les symboles de l'interface (décision d'Adrien du 20/10/2026, d'après maquette-symboles.html) : les mots qui
// reviennent partout (crédits, soute, durée, arrivée, distance, vitesse, types de mission, modules…) deviennent des
// pictogrammes dessinés, dans le trait des boutons de la carte (encre, aplats pastel). Les chiffres restent écrits à
// côté : le symbole remplace le mot, jamais la valeur. Un symbole veut toujours dire la même chose, partout ; un appui
// long dessus affiche son nom (main.ts), et le Manuel en donne le lexique.

import type { GenreContrat } from '../moteur/contrats'
import type { NomModule } from '../donnees/modules'

/** Nom d'un symbole et son dessin (24 × 24). Classes des aplats : or, bleu, vert, rose, mauve, rouge, plein (encre). */
export const SYMBOLES = {
  credits: ['Crédits', '<circle class="or" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path class="plein" d="M12 9.2l.9 1.9 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2z"/>'],
  soute: ['Soute', '<path class="bleu" d="M4 9h16v10.5H4z"/><path d="M4 9l2.5-4h11L20 9M9.5 12.5h5"/>'],
  moteur: ['Moteur', '<path class="mauve" d="M9.5 2.5h5v4h-5z"/><path class="mauve" d="M10 6.5h4c0 3 2.5 5 3.5 6.5h-11C7.5 11.5 10 9.5 10 6.5z"/><path class="or" d="M8.5 15c.5 2.7 2 4.7 3.5 6 1.5-1.3 3-3.3 3.5-6z"/>'],
  vitesse: ['Vitesse (de pointe / max du moteur)', '<path d="M4 7l5 5-5 5M10.5 7l5 5-5 5M17 7l3 5-3 5"/>'],
  duree: ['Durée du trajet', '<path class="or" d="M8 6h8c0 4-4 4.5-4 6s4 2 4 6H8c0-4 4-4.5 4-6s-4-2-4-6z"/><path d="M6 3.5h12M6 20.5h12"/>'],
  arrivee: ['Heure d\'arrivée', '<path d="M6 21V3.5"/><path class="rouge" d="M6 4h12l-3 3.5 3 3.5H6"/>'],
  distance: ['Distance', '<path d="M3 12h18M3 8v8M21 8v8M7.5 12v-2M12 12V9M16.5 12v-2"/>'],
  orbite: ['En orbite', '<ellipse cx="12" cy="12" rx="9.5" ry="5" stroke-dasharray="2 2"/><circle class="bleu" cx="12" cy="12" r="4"/><path class="rouge" d="M20 10.6l1.8 1.2-1.8 1.2z"/>'],
  altitude: ['Altitude', '<path d="M12 20V5M8 8.5 12 4.5l4 4"/><path d="M4 20.5h16"/>'],
  tour: ['Durée d\'un tour d\'orbite', '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M18 3.5v3.5h-3.5"/>'],
  route: ['En route', '<path d="M3 17c4-1 6-9 12-9" stroke-dasharray="2 2"/><path class="rouge" d="M21 8l-6-3 1.5 3-1.5 3z"/>'],
  depart: ['Départ', '<path class="or" d="M19 12 5 5l4 7-4 7z"/>'],
  voir: ['Voir sur la carte', '<path class="bleu" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle class="plein" cx="12" cy="12" r="2.8"/>'],
  lunes: ['Lunes', '<circle class="mauve" cx="10" cy="12" r="5.5"/><circle class="plein" cx="19" cy="8" r="1.6"/><circle cx="18.5" cy="17" r="1.3"/>'],
  poste: ['Poste de la capsule', '<path class="or" d="M5 15.5C5 9 9 4 12 3c3 1 7 6 7 12.5z"/><path d="M5 15.5l-1.5 4h17l-1.5-4"/><circle class="bleu" cx="12" cy="10" r="2.2"/>'],
  // Les types de mission (la couleur de leur tuile dit la Maison).
  vider: ['VIDER une épave', '<path class="vert" d="M5 8h14l-1.5 11h-11z"/><path d="M3.5 8h17M9.5 8V5.5h5V8M10 12l2-2 2 2M12 10v6"/>'],
  remorquer: ['REMORQUER une épave', '<path d="M3 3l9 9" stroke-dasharray="2 2"/><path class="vert" d="M14 11l6.5 2.5-2.5 7-6.5-2.5z"/><path d="M12 12l-.5-3M12 12l3-.5"/><circle class="plein" cx="3.5" cy="3.5" r="1.5"/>'],
  reparer: ['RÉPARER un engin', '<path class="or" d="M14.5 3.5a5 5 0 0 0-5 6.5l-6 6 4 4 6-6a5 5 0 0 0 6.5-5L17 12l-4.5-1.5L11 6z"/>'],
  amarrer: ['AMARRER (livrer une cargaison)', '<path class="or" d="M14 5h6.5v14H14z"/><path d="M3 12h8M8 8.5 11.5 12 8 15.5"/><path d="M14 9.5h-2v5h2"/>'],
  abattre: ['ABATTRE un chasseur', '<circle class="rose" cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>'],
  escorter: ['ESCORTER un convoi', '<path class="rose" d="M12 3 19.5 6v5.5c0 5-3.5 8-7.5 9.5-4-1.5-7.5-4.5-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'],
  // Les onglets.
  navigation: ['Navigation', '<circle class="bleu" cx="12" cy="12" r="9"/><path class="rouge" d="M12 4.5l2.2 7.5h-4.4z"/><path d="M12 19.5l2.2-7.5h-4.4z"/>'],
  capsule: ['Capsule', '<path class="or" d="M5 15.5C5 9 9 4 12 3c3 1 7 6 7 12.5z"/><path d="M5 15.5l-1.5 4h17l-1.5-4"/><circle class="bleu" cx="12" cy="10" r="2.2"/>'],
  missions: ['Missions', '<path class="creme" d="M6 3.5h12v17H6z"/><path d="M9 3.5V2h6v1.5M9 9h6M9 12.5h6M9 16h4"/>'],
  marche: ['Marché', '<path d="M3.5 20.5h17M3.5 3.5v17"/><path class="trait-rouge" d="M6 15l4-4 3 2.5 6-7"/><path d="M16 6.5h3v3"/>'],
  plus: ['Plus', '<circle class="plein" cx="5.5" cy="12" r="1.8"/><circle class="plein" cx="12" cy="12" r="1.8"/><circle class="plein" cx="18.5" cy="12" r="1.8"/>'],
  // Les modules de la capsule.
  'module-moteur': ['Module Moteur', '<path class="mauve" d="M9.5 2.5h5v4h-5z"/><path class="mauve" d="M10 6.5h4c0 3 2.5 5 3.5 6.5h-11C7.5 11.5 10 9.5 10 6.5z"/><path class="or" d="M8.5 15c.5 2.7 2 4.7 3.5 6 1.5-1.3 3-3.3 3.5-6z"/>'],
  'module-navigation': ['Module Navigation', '<circle class="bleu" cx="12" cy="12" r="8.5"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/><path class="rouge" d="M9 15l2-5 4-1-2 5z"/>'],
  'module-communications': ['Module Communications', '<path d="M12 21V11M8.5 21h7"/><circle class="or" cx="12" cy="9.5" r="2"/><path d="M7.5 5a6.5 6.5 0 0 0 0 9M16.5 5a6.5 6.5 0 0 1 0 9"/>'],
  'module-energie': ['Module Énergie', '<path class="or" d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6z"/>'],
  'module-coque': ['Module Coque', '<path class="mauve" d="M4 6.5h16v11H4z"/><circle class="plein" cx="7" cy="9.5" r="0.9"/><circle class="plein" cx="17" cy="9.5" r="0.9"/><circle class="plein" cx="7" cy="14.5" r="0.9"/><circle class="plein" cx="17" cy="14.5" r="0.9"/>'],
  panne: ['Panne', '<path class="rouge" d="M12 3.5 21 19.5H3z"/><path class="blanc" d="M12 9.5v4.5M12 16.8v.2"/>'],
  missile: ['Missile en approche', '<path class="rose" d="M4 20 15 9l2.5-5 2.5 2.5-5 2.5L4 20z"/><path d="M8 13l-3-.5M11 16l.5 3"/>'],
  principale: ['Quête principale', '<path class="or" d="M12 3.5 19.5 12 12 20.5 4.5 12z"/>'],
  secondaire: ['Quête secondaire', '<circle class="bleu-quete" cx="12" cy="12" r="7.5"/>'],
  monolithe: ['Monolithe', '<path class="mauve" d="M9 3.5h6v17H9z"/><path d="M6 20.5h12"/>'],
  ping: ['PING envoyé', '<path d="M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6M8.1 8.1a5.5 5.5 0 0 0 0 7.8M15.9 8.1a5.5 5.5 0 0 1 0 7.8"/><circle class="mauve" cx="12" cy="12" r="2.4"/>'],
} as const satisfies Record<string, readonly [string, string]>

export type NomSymbole = keyof typeof SYMBOLES

/** Le symbole seul : `<span class="picto" data-symbole="Crédits"><svg>…</svg></span>`. */
export function picto(nom: NomSymbole, classe = ''): string {
  const [titre, dessin] = SYMBOLES[nom]
  return `<span class="picto${classe ? ` ${classe}` : ''}" data-symbole="${titre.replace(/"/g, '&quot;')}"><svg viewBox="0 0 24 24" aria-hidden="true">${dessin}</svg></span>`
}

/** Un symbole suivi de sa valeur, insécables : « (pièce) 1 234 ». */
export function avec(nom: NomSymbole, valeur: string, classe = ''): string {
  return `<span class="val${classe ? ` ${classe}` : ''}">${picto(nom)}${valeur}</span>`
}

/** Le symbole du type d'une mission (son mini-jeu). */
export const SYMBOLE_GENRE: Record<GenreContrat, NomSymbole> = {
  nettoyer: 'vider', remorquer: 'remorquer', depanner: 'reparer', livrer: 'amarrer', chasser: 'abattre', escorter: 'escorter',
}

/** Le symbole d'un module de la capsule. */
export const SYMBOLE_MODULE: Record<NomModule, NomSymbole> = {
  moteur: 'module-moteur', navigation: 'module-navigation', communications: 'module-communications', energie: 'module-energie', coque: 'module-coque',
}

/** Le lexique, dans l'ordre où le Manuel le présente. */
export const LEXIQUE: readonly NomSymbole[] = [
  'credits', 'soute', 'moteur', 'vitesse', 'duree', 'arrivee', 'distance', 'orbite', 'altitude', 'tour', 'route', 'lunes', 'voir', 'poste',
  'vider', 'remorquer', 'reparer', 'amarrer', 'abattre', 'escorter',
  'module-navigation', 'module-communications', 'module-energie', 'module-coque', 'panne', 'missile', 'ping',
  'principale', 'secondaire', 'monolithe',
]
