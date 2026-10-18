// Les tableaux de missions (décision d'Adrien du 18/10/2026) : un par système, ses missions réparties dans tout le
// système. Ici : de quoi les faire (les épaves, stations, engins, lunes et chasseurs du système, et leur éloignement de
// la planète), et le tableau du système où est la capsule (celui que le volet Missions montre d'abord).

import { EPAVES, STATIONS_SYSTEMES } from '../donnees/espace'
import { LIEUX_NETTOYAGE, SATELLITES, STATIONS } from '../donnees/contrats'
import { LIMITE_MOYENNE, LIMITE_PROCHE, TABLEAUX, type Portee, type Tableau } from '../donnees/tableaux'
import type { ContexteTableau } from './contrats'
import { astreDominant, enfants, position, rayonInfluence } from './corps'
import { etatCapsule } from './capsule'
import { aliensDe, type EtatEspace } from './espace'

/** Éloignement d'un lieu dans son système : sa distance à la planète, en part de la sphère d'influence. */
export function partDuSysteme(nom: string, systeme: string, t: number): number {
  const p = position(nom, t), c = position(systeme, t)
  return Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z) / rayonInfluence(systeme)
}

/** Portée d'un lieu : proche, moyenne ou lointaine (voir LIMITE_PROCHE, LIMITE_MOYENNE). */
export function porteeDe(part: number): Portee {
  return part < LIMITE_PROCHE ? 'proche' : part < LIMITE_MOYENNE ? 'moyenne' : 'lointaine'
}

/** Les lieux d'un système où l'on peut faire des missions, avec leur éloignement de la planète. */
export function contexte(tableau: Tableau, espace: EtatEspace, t: number): ContexteTableau {
  const s = tableau.systeme
  const terre = s === 'Terre'
  const stations = terre ? STATIONS : STATIONS_SYSTEMES.filter((x) => x.parent === s).map((x) => x.nom)
  // Les grandes lunes du système (les six plus grosses).
  const lunes = enfants(s).filter((c) => c.type === 'lune').sort((a, b) => b.rayon - a.rayon).slice(0, 6).map((c) => c.nom)
  const epaves = [...EPAVES.filter((e) => e.parent === s).map((e) => e.nom), ...(terre ? LIEUX_NETTOYAGE : [])]
  const depannages = terre ? [...SATELLITES, ...STATIONS] : stations
  const arrivees = [...stations, ...lunes, ...(terre ? SATELLITES : [])]
  const aliens = aliensDe(espace, s, t)
  const parts = new Map<string, number>()
  for (const nom of new Set([...epaves, ...stations, ...arrivees, ...depannages, ...aliens])) parts.set(nom, partDuSysteme(nom, s, t))
  return { tableau, epaves, departs: stations, arrivees, depannages, aliens, parts }
}

/** Le tableau du système où est la capsule ; en plein espace, celui de la planète la plus proche. */
export function tableauDeLaCapsule(_centre: string | null, t: number): Tableau {
  const p = etatCapsule(t).position
  const systeme = astreDominant(p, t)
  const duSysteme = TABLEAUX.find((x) => x.systeme === systeme)
  if (duSysteme) return duSysteme
  const d = (nom: string) => { const q = position(nom, t); return Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) }
  return TABLEAUX.reduce((a, b) => (d(b.systeme) < d(a.systeme) ? b : a))
}
