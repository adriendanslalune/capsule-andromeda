// Les annonces générales (demande d'Adrien du 22/10/2026) : ce qui concerne tous les joueurs, qui défile en petit
// sous le tableau de bord. Les planètes au plus près de la Terre (le bon moment pour y aller, d'après les vraies
// positions) et les événements du jeu en cours. Les mêmes pour tous : rien ne dépend de la partie.

import { EVENEMENTS, type Evenement } from '../donnees/evenements'
import { position } from './corps'

const JOUR = 86_400_000
/** Période synodique de chaque planète vue de la Terre (jours) : le temps entre deux passages au plus près. */
const SYNODIQUE: Readonly<Record<string, number>> = { Mercure: 116, Vénus: 584, Mars: 780, Jupiter: 399, Saturne: 378, Uranus: 370, Neptune: 367 }
/** Une planète est « proche » quand sa distance est dans le premier dixième de ce qu'elle peut être sur sa période. */
export const PART_PROCHE = 0.1
/** « Au plus près » : à moins de tant de jours de son passage au plus près. */
const JOURS_AU_PLUS_PRES = 3

const distance = (planete: string, t: number) => {
  const a = position(planete, t), b = position('Terre', t)
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Où en est une planète sur sa période : sa distance à la Terre, la plus courte et la plus longue, et quand elle passe au plus près. */
export function rapprochement(planete: string, t: number): { distance: number; min: number; max: number; auPlusPres: number } {
  const periode = SYNODIQUE[planete] * JOUR, pas = periode / 120
  let min = Infinity, max = 0, auPlusPres = t
  for (let k = -60; k <= 60; k++) {
    const tk = t + k * pas, d = distance(planete, tk)
    if (d < min) { min = d; auPlusPres = tk }
    if (d > max) max = d
  }
  return { distance: distance(planete, t), min, max, auPlusPres }
}

/**
 * Les brèves de Radio Résistance (Adrien, 22/10/2026 : plus fun) : une à la fois, qui change toutes les heures, la même
 * pour tous ; elles ferment la ronde des annonces.
 */
export const BREVES: readonly string[] = [
  'Radio Résistance · météo solaire clémente aujourd\'hui : sortez couverts quand même',
  'Radio Résistance · rappel : on ne caresse pas les chasseurs d\'Andromède',
  'Radio Résistance · ce soir à la cantine de l\'ISS : lasagnes lyophilisées',
  'Radio Résistance · un capitaine distrait a perdu ses clés dans la ceinture d\'astéroïdes',
  'Radio Résistance · pensez à vérifier vos fusibles avant de partir en week-end sur Pluton',
  'Radio Résistance · Vénus, 465 °C à l\'ombre : prévoyez une crème solaire indice 3 000',
  'Radio Résistance · on recherche un joueur d\'harmonica pour l\'orchestre de la Station Tycho',
  'Radio Résistance · les Nettoyeurs rappellent qu\'une épave n\'est pas une poubelle… enfin, si',
  'Radio Résistance · ne répondez pas aux messages venus de Triton. Jamais.',
  'Radio Résistance · le Veilleur de Hubble affirme avoir vu un monolithe bâiller',
]
export function breve(t: number): string {
  return BREVES[Math.floor(t / 3_600_000) % BREVES.length]
}

const millions = (km: number) => (km >= 1e9 ? `${(km / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} milliards de km`
  : `${Math.round(km / 1e6).toLocaleString('fr-FR')} millions de km`)

/** Les annonces du moment, de la plus utile à la moins utile. */
export function annonces(t: number, evenements: readonly Evenement[] = EVENEMENTS): string[] {
  const liste: string[] = []
  for (const e of evenements) if (t >= Date.parse(e.debut) && t < Date.parse(e.fin)) liste.push(e.texte)
  for (const planete of Object.keys(SYNODIQUE)) {
    const r = rapprochement(planete, t)
    if (r.distance > r.min + PART_PROCHE * (r.max - r.min)) continue
    const jours = Math.round((r.auPlusPres - t) / JOUR)
    if (Math.abs(jours) <= JOURS_AU_PLUS_PRES) liste.push(`${planete} au plus près de la Terre (${millions(r.distance)}) : c'est le moment d'y aller`)
    else if (jours > 0) liste.push(`${planete} se rapproche de la Terre : au plus près dans ${jours} jours, ${millions(r.min)}. Bon moment pour y aller`)
    else liste.push(`${planete} s'éloigne de la Terre après son passage au plus près : il est encore temps d'y aller`)
  }
  liste.push(breve(t))
  return liste
}
