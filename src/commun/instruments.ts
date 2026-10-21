// Les dessins des trois instruments de la carte (RADAR, PING, RADIO) : sur leurs boutons, et dans les Collections, à
// côté de ce que chacun permet de chercher (demande d'Adrien du 21/10/2026 : comprendre quel instrument sert à quoi).

const dessin = (nom: string, svg: string) => svg.replace('<svg viewBox="0 0 24 24" aria-hidden="true">', `<svg class="picto-instrument picto-${nom}" viewBox="0 0 24 24" aria-hidden="true">`)

export const INSTRUMENTS = {
  radar: dessin('radar', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ecran" cx="12" cy="12" r="9.5"/><circle class="anneau-radar" cx="12" cy="12" r="5.5"/><path class="faisceau" d="M12 12 19.8 6.6A9.5 9.5 0 0 0 12 2.5z"/><path class="trait-radar" d="M12 12 19.8 6.6"/><circle class="blip" cx="8" cy="15" r="1.2"/></svg>'),
  ping: dessin('ping', '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="onde o2" d="M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6"/><path class="onde o1" d="M8.1 8.1a5.5 5.5 0 0 0 0 7.8M15.9 8.1a5.5 5.5 0 0 1 0 7.8"/><circle class="ping-point" cx="12" cy="12" r="2.4"/></svg>'),
  radio: dessin('radio', '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="antenne-radio" d="M7 9 16 3.5"/><rect class="coffret" x="2.5" y="8.5" width="19" height="12.5" rx="2.5"/><circle class="haut-parleur" cx="8" cy="15" r="3.3"/><path class="grille-hp" d="M6 15h4M8 13v4"/><rect class="cadran-radio" x="13.5" y="11.5" width="5.5" height="2.5" rx="0.6"/><circle class="bouton-radio" cx="16.2" cy="17.6" r="1.4"/></svg>'),
} as const

export type Instrument = keyof typeof INSTRUMENTS

/** Le symbole d'un instrument et son nom, en petite pastille (dans les Collections). */
export function pastilleInstrument(nom: Instrument): string {
  return `<span class="instrument-requis">${INSTRUMENTS[nom]}<b>${nom.toUpperCase()}</b></span>`
}
