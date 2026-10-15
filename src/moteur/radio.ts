// Poste radio (décisions d'Adrien du 15/10/2026). Une seule radio, réglée de 0,00 à 12,00. Ce qu'elle capte dépend
// de la fréquence : Radio-Terre, l'Observatoire, les transmissions, les 10 stations morse ; le ping de chasse s'émet
// sur la fréquence du visiteur, qui change chaque mois (table du manuel) et ne s'entend pas. Les stations de la
// Terre arrivent avec le retard de la lumière. Les indices de chasse ne tombent plus tout seuls : il faut écouter
// l'Observatoire ou les transmissions pour les recevoir.

import { planeteDe } from '../astro/corps'
import { delaiLumiere } from '../astro/lumiere'
import { AUTEURS_TRANSMISSIONS, CHASSE as C } from '../donnees/chasse'
import { STATIONS_MORSE } from '../donnees/modules'
import { NOMS_PLANETES } from '../donnees/planetes'
import { FREQUENCES_VISITEUR, RADIO, RADIO_TERRE, STATIONS_RADIO } from '../donnees/radio'
import type { EtatPartie } from './etat'
import { distance, positionAstre, type Point2 } from './fusee'
import { choisirAuHasard, entierAuHasard, mulberry32 } from './hasard'
import { numeroSaison, positionVisiteur } from './visiteur'

const HEURE = 3_600_000

/** Fréquence du visiteur pendant la saison de l'instant t (table mois par mois). */
export function frequenceVisiteur(t: number): number {
  const n = numeroSaison(t)
  return FREQUENCES_VISITEUR[((n % 12) + 12) % 12]
}

/** Fréquence ramenée dans la plage et arrondie au centième. */
export function bornerFrequence(f: number): number {
  return Math.max(RADIO.min, Math.min(RADIO.max, Math.round(f * 100) / 100))
}

/** Vrai si la radio est sur la fréquence f (à la tolérance près). */
export function surFrequence(reglage: number, f: number): boolean {
  return Math.abs(reglage - f) <= RADIO.tolerance + 1e-9
}

/** Retard de la lumière (s) entre la Terre et la fusée. */
export function retardTerre(etat: EtatPartie, t: number): number {
  return delaiLumiere(distance(etat.fusee.position, positionAstre('Terre', t)))
}

// ---------------------------------------------------------------------------------------------------------------
// Contenu des stations (le même pour tous les joueurs)

/** Planète la plus proche d'un point (parmi les 8). */
function planeteLaPlusProche(p: Point2, t: number): string {
  let meilleure: string = NOMS_PLANETES[0]
  let dMin = Infinity
  for (const nom of NOMS_PLANETES) {
    const d = distance(p, positionAstre(nom, t))
    if (d < dMin) { dMin = d; meilleure = nom }
  }
  return meilleure
}

/** Créneau du dernier bulletin de l'Observatoire entendu à l'instant t, compte tenu du retard de la lumière (s). */
export function creneauBulletin(t: number, retard: number): number {
  return Math.floor((t - retard * 1000) / (C.bulletinHeures * HEURE))
}

/** Bulletin n° b de l'Observatoire (émis au début du créneau) : le système où se trouvait le visiteur 6 h plus tôt. */
export function texteBulletin(b: number): string {
  const v = positionVisiteur((b - 1) * C.bulletinHeures * HEURE)
  return `OBSERVATOIRE : PERTURBATIONS DANS LE SYSTÈME DE ${planeteDe(v.astre).toUpperCase()}.`
}

/** Créneau de la dernière transmission (une toutes les 8 h). */
export function creneauTransmission(t: number): number {
  return Math.floor(t / (C.transmissionHeures * HEURE))
}

/** Transmission n° tr : une fois sur deux la planète la plus proche du visiteur, sinon une planète au hasard. */
export function texteTransmission(tr: number): string {
  const t = tr * C.transmissionHeures * HEURE
  const r = mulberry32(tr * C.transmissionMultiplicateur + C.transmissionDecalage)
  const v = positionVisiteur(t)
  const planete = r() < 0.5 ? planeteLaPlusProche(v, t) : NOMS_PLANETES[entierAuHasard(r, NOMS_PLANETES.length)]
  const qui = choisirAuHasard(r, AUTEURS_TRANSMISSIONS)
  return `${qui} SIGNALE UNE LUEUR PRÈS DE ${planete.toUpperCase()}.`
}

/** Nouvelle de Radio-Terre émise à l'instant (terrestre) te. */
export function nouvelleRadioTerre(te: number): string {
  const n = Math.floor(te / (RADIO_TERRE.minutesParNouvelle * 60_000))
  const h = mulberry32(n * 104_729 + 5)
  return RADIO_TERRE.nouvelles[entierAuHasard(h, RADIO_TERRE.nouvelles.length)]
}

// ---------------------------------------------------------------------------------------------------------------
// Réception

export type Emission =
  /** Radio-Terre : la nouvelle et l'heure du top horaire (instant d'émission, ms UTC), reçus avec retard (s). */
  | { sorte: 'radio-terre'; texte: string; topHoraire: number; retard: number }
  | { sorte: 'observatoire'; texte: string; creneau: number }
  | { sorte: 'transmissions'; texte: string; creneau: number }
  /** Une station morse : on n'entend que son indicatif, en morse. */
  | { sorte: 'morse'; indicatif: string }

export interface Reception {
  /** Station la plus proche du réglage (null : rien que du souffle). */
  emission: Emission | null
  /** Fréquence de la station captée. */
  frequence: number | null
  /** Netteté : 1 sur la fréquence (± 0,05), puis de moins en moins jusqu'à ± 0,30, 0 au-delà. */
  nettete: number
}

/** Ce que capte la radio réglée sur `reglage` (par défaut, le réglage de la fusée). */
export function capter(etat: EtatPartie, t: number, reglage = etat.chasse.frequenceRadio): Reception {
  const stations: { f: number; emission: () => Emission }[] = [
    {
      f: STATIONS_RADIO.radioTerre,
      emission: () => {
        const retard = retardTerre(etat, t)
        const te = t - retard * 1000
        return { sorte: 'radio-terre', texte: nouvelleRadioTerre(te), topHoraire: te, retard }
      },
    },
    {
      f: STATIONS_RADIO.observatoire,
      emission: () => {
        const b = creneauBulletin(t, retardTerre(etat, t))
        return { sorte: 'observatoire', texte: texteBulletin(b), creneau: b }
      },
    },
    {
      f: STATIONS_RADIO.transmissions,
      emission: () => {
        const tr = creneauTransmission(t)
        return { sorte: 'transmissions', texte: texteTransmission(tr), creneau: tr }
      },
    },
    ...Object.entries(STATIONS_MORSE).map(([indicatif, f]) => ({ f, emission: (): Emission => ({ sorte: 'morse', indicatif }) })),
  ]
  let proche: (typeof stations)[number] | null = null
  let ecart = Infinity
  for (const s of stations) {
    const d = Math.abs(reglage - s.f)
    if (d < ecart) { ecart = d; proche = s }
  }
  if (!proche || ecart > RADIO.approche) return { emission: null, frequence: null, nettete: 0 }
  const nettete = ecart <= RADIO.tolerance + 1e-9 ? 1 : 1 - (ecart - RADIO.tolerance) / (RADIO.approche - RADIO.tolerance)
  return { emission: proche.emission(), frequence: proche.f, nettete }
}
