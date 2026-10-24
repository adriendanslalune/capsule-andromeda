// Les trois Maisons (voir CLAUDE.md ; refonte décidée par Adrien le 18/10/2026) et leurs missions, deux genres
// chacune : vider et remorquer les épaves (Nettoyeurs), abattre et escorter (Mercenaires), réparer et livrer
// (Ingénieurs, qui remplacent les Commerçants). Le volet Missions s'en sert pour son filtre par Maison ; le jeu propose
// 2 missions de chaque Maison par système, ou 4 de la Maison du joueur et 1 de chacune des autres quand il en a
// choisi une. L'appartenance est proposée selon l'affinité ; elle n'est jamais définitive (voir moteur/profil.ts).

import type { Contrat, GenreContrat } from '../moteur/contrats'
import { PAR_AUTRE_MAISON, PAR_MAISON_CHOISIE, PAR_MAISON_NEUTRE } from './contrats'

export type Maison = 'nettoyeurs' | 'ingenieurs' | 'mercenaires'

/**
 * Pour rejoindre une Maison (décision d'Adrien du 19/10/2026 : un événement attendu) : au moins tant de missions finies pour elle, et au moins
 * cette part de toutes ses missions finies.
 */
export const SEUIL_MISSIONS = 25
export const SEUIL_PART = 0.4

export const MAISONS: readonly { maison: Maison; titre: string }[] = [
  { maison: 'nettoyeurs', titre: 'NETTOYEURS' },
  { maison: 'ingenieurs', titre: 'INGÉNIEURS' },
  { maison: 'mercenaires', titre: 'MERCENAIRES' },
]

/**
 * Les couleurs des Maisons (Adrien, 24/10/2026 : les vaisseaux portent la peinture de leur Maison, en pastel ; la même
 * couleur partout dans le jeu) : la peinture des vaisseaux, sa teinte pâle (aplats, toile, avatars), son encre (textes,
 * liserés). Les neutres gardent la peinture orange d'origine.
 */
export const COULEURS_MAISONS: Readonly<Record<Maison, { peinture: string; pale: string; encre: string }>> = {
  nettoyeurs: { peinture: '#7cc79a', pale: '#c4e6cf', encre: '#3f7a4c' },
  ingenieurs: { peinture: '#82aee8', pale: '#c9daf3', encre: '#2f5d9a' },
  mercenaires: { peinture: '#e9828f', pale: '#f5c6cc', encre: '#a8384a' },
}

export const MAISON_DU_GENRE: Readonly<Record<GenreContrat, Maison>> = {
  nettoyer: 'nettoyeurs', remorquer: 'nettoyeurs', chasser: 'mercenaires', escorter: 'mercenaires', depanner: 'ingenieurs', livrer: 'ingenieurs',
}

/**
 * Combien de missions de chaque Maison sur un tableau de `nombre` missions, selon la Maison du joueur (null : neutre).
 * Planète (6) : 2 de chaque, ou 4 de la sienne et 1 des autres. Lune (4) : 1 de chaque, plus 1 de la sienne (neutre : la
 * Maison « en plus » est tirée d'après le nom du lieu, toujours la même).
 */
export function missionsParMaison(maisonDuJoueur: Maison | null, nombre = 6, lieu = ''): Record<Maison, number> {
  if (nombre >= 6) {
    const n = (m: Maison) => (maisonDuJoueur === null ? PAR_MAISON_NEUTRE : m === maisonDuJoueur ? PAR_MAISON_CHOISIE : PAR_AUTRE_MAISON)
    return { nettoyeurs: n('nettoyeurs'), ingenieurs: n('ingenieurs'), mercenaires: n('mercenaires') }
  }
  const enPlus = maisonDuJoueur ?? MAISONS[[...lieu].reduce((s, c) => s + c.charCodeAt(0), 0) % 3].maison
  const r = { nettoyeurs: 1, ingenieurs: 1, mercenaires: 1 }
  r[enPlus] += nombre - 3
  return r
}

/** Les deux genres de chaque Maison. */
export const GENRES_DE_MAISON = Object.fromEntries(MAISONS.map((m) => [m.maison,
  (Object.keys(MAISON_DU_GENRE) as GenreContrat[]).filter((g) => MAISON_DU_GENRE[g] === m.maison)])) as Record<Maison, GenreContrat[]>

export function maisonDuContrat(c: Contrat): Maison {
  return MAISON_DU_GENRE[c.genre]
}

export function titreMaison(m: Maison): string {
  return MAISONS.find((f) => f.maison === m)!.titre
}
