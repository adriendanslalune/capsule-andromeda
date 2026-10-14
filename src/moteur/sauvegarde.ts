// Sauvegarde d'une partie : tout l'état, en texte (JSON), avec un numéro de version de format.
// Quand la structure de l'état change, on augmente VERSION_FORMAT et on ajoute une migration ci-dessous, pour que
// les anciennes sauvegardes restent lisibles.

import { VERSION_FORMAT, type EtatPartie } from './etat'

/** Enveloppe d'une sauvegarde. */
interface Fichier {
  jeu: 'manuel-de-vol'
  version: number
  /** Instant de la sauvegarde (ms UTC). */
  enregistreLe: number
  etat: EtatPartie
}

/**
 * Migrations : MIGRATIONS[v] transforme un état au format v en état au format v + 1.
 * (Aucune pour l'instant : le format 1 est le premier.)
 */
const MIGRATIONS: Record<number, (etat: Record<string, unknown>) => Record<string, unknown>> = {}

/** Écrit la partie en texte, à l'instant t (qui devient le dernier instant vu, pour le rattrapage). */
export function sauvegarder(etat: EtatPartie, t: number): string {
  const fichier: Fichier = { jeu: 'manuel-de-vol', version: VERSION_FORMAT, enregistreLe: t, etat: { ...etat, vu: t } }
  return JSON.stringify(fichier)
}

export type ResultatChargement = { etat: EtatPartie; erreur: null } | { etat: null; erreur: string }

/** Champs indispensables d'un état, pour reconnaître une sauvegarde abîmée. */
const CHAMPS = ['serie', 'interrupteurs', 'credits', 'fusee', 'modules', 'pannes', 'chasse', 'contrats', 'stats'] as const

/** Lit une sauvegarde : vérifie qu'elle est complète, la met au format actuel si besoin. */
export function charger(texte: string): ResultatChargement {
  let fichier: Partial<Fichier>
  try {
    fichier = JSON.parse(texte)
  } catch {
    return { etat: null, erreur: 'Sauvegarde illisible.' }
  }
  if (!fichier || fichier.jeu !== 'manuel-de-vol' || typeof fichier.version !== 'number' || !fichier.etat) {
    return { etat: null, erreur: "Ce n'est pas une sauvegarde de Manuel de vol." }
  }
  if (fichier.version > VERSION_FORMAT) {
    return { etat: null, erreur: 'Sauvegarde faite par une version plus récente du jeu.' }
  }
  let etat = fichier.etat as unknown as Record<string, unknown>
  for (let v = fichier.version; v < VERSION_FORMAT; v++) {
    const migration = MIGRATIONS[v]
    if (!migration) return { etat: null, erreur: `Pas de migration depuis le format ${v}.` }
    etat = migration(etat)
  }
  const manquants = CHAMPS.filter((c) => !(c in etat))
  if (manquants.length) return { etat: null, erreur: `Sauvegarde incomplète (${manquants.join(', ')}).` }
  return { etat: { ...(etat as unknown as EtatPartie), version: VERSION_FORMAT }, erreur: null }
}
