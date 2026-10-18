// Les tableaux de missions (décisions d'Adrien du 18/10/2026) : chaque planète et chaque grande lune a ses missions,
// qui se passent dans son système. Ici : de quoi les faire (les épaves, stations, engins et chasseurs du système), et
// le tableau du lieu où est la capsule (celui que le volet Missions montre d'abord).

import { EPAVES, STATIONS_SYSTEMES } from '../donnees/espace'
import { LIEUX_NETTOYAGE, SATELLITES, STATIONS } from '../donnees/contrats'
import { TABLEAUX, type Tableau } from '../donnees/tableaux'
import type { ContexteTableau } from './contrats'
import { astreDominant, position } from './corps'
import { etatCapsule } from './capsule'
import { aliensDe, type EtatEspace } from './espace'

/** Les lieux d'un système où l'on peut faire des missions. */
export function contexte(tableau: Tableau, espace: EtatEspace, t: number): ContexteTableau {
  const s = tableau.systeme
  const terre = s === 'Terre'
  const stations = terre ? STATIONS : STATIONS_SYSTEMES.filter((x) => x.parent === s).map((x) => x.nom)
  const lunes = TABLEAUX.filter((x) => x.systeme === s && x.lieu !== s).map((x) => x.lieu)
  const epaves = [...EPAVES.filter((e) => e.parent === s).map((e) => e.nom), ...(terre ? LIEUX_NETTOYAGE : [])]
  const estLune = tableau.lieu !== s
  return {
    tableau,
    epaves,
    // Sur une lune, on charge chez elle et on livre aux stations ; sur une planète, d'une station vers une autre
    // station, une lune ou (autour de la Terre) un satellite.
    departs: estLune ? [tableau.lieu] : stations,
    arrivees: estLune ? stations : [...stations, ...lunes, ...(terre ? SATELLITES : [])],
    depannages: terre ? SATELLITES : stations,
    aliens: aliensDe(espace, s, t),
  }
}

/**
 * Le tableau du lieu où est la capsule : la grande lune ou la planète autour de laquelle elle tourne ; sinon celui du
 * système où elle se trouve ; en plein espace, celui de la planète la plus proche.
 */
export function tableauDeLaCapsule(centre: string | null, t: number): Tableau {
  const direct = TABLEAUX.find((x) => x.lieu === centre)
  if (direct) return direct
  const p = etatCapsule(t).position
  const systeme = astreDominant(p, t)
  const duSysteme = TABLEAUX.find((x) => x.lieu === systeme)
  if (duSysteme) return duSysteme
  const planetes = TABLEAUX.filter((x) => x.lieu === x.systeme)
  const d = (nom: string) => { const q = position(nom, t); return Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) }
  return planetes.reduce((a, b) => (d(b.lieu) < d(a.lieu) ? b : a))
}
