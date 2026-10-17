// Textes des missions (« contrats » dans le moteur) : titres, verbes des actions, consignes.

import type { Action, Contrat, Etape, GenreContrat } from '../moteur/contrats'

/** Épaves elles-mêmes (on nettoie l'épave), et non des débris autour d'un engin. */
const EPAVES = ['Envisat', 'Vanguard 1']

/** « l'ISS », « Hubble », « la Lune »… */
function article(lieu: string): string {
  if (lieu === 'ISS') return "l'ISS"
  if (lieu === 'Lune' || lieu === 'Terre') return `la ${lieu}`
  return lieu
}
/** « de l'ISS », « de Tiangong ». */
const de = (lieu: string) => (lieu === 'ISS' ? "de l'ISS" : `de ${article(lieu)}`)
/** « à l'ISS », « à Hubble ». */
const a = (lieu: string) => (lieu === 'ISS' ? "à l'ISS" : `à ${article(lieu)}`)

/** Titre d'une mission : « Réparer GOES-19 », « Livrer une cargaison de l'ISS à Hubble »… */
export function titreContrat(c: Contrat): string {
  const lieu = c.etapes[c.etapes.length - 1].lieu
  if (c.genre === 'livrer') return `Livrer une cargaison ${de(c.etapes[0].lieu)} ${a(lieu)}`
  if (c.genre === 'depanner') return `Réparer ${article(lieu)}`
  return EPAVES.includes(lieu) ? `Nettoyer l'épave ${lieu}` : `Nettoyer les débris autour ${de(lieu)}`
}

/** Genre d'une mission, en un mot : « NETTOYAGE », « LIVRAISON », « DÉPANNAGE ». */
export const GENRES_COURTS = { nettoyer: 'NETTOYAGE', livrer: 'LIVRAISON', depanner: 'DÉPANNAGE' } as const

/** Bouton de l'action : « NETTOYER », « CHARGER », « LIVRER », « RÉPARER ». */
export const VERBES: Record<Action, string> = { nettoyer: 'NETTOYER', charger: 'CHARGER', livrer: 'LIVRER', reparer: 'RÉPARER' }
/** Action en cours : « Nettoyage », « Chargement »… */
export const NOMS_ACTIONS: Record<Action, string> = { nettoyer: 'Nettoyage', charger: 'Chargement', livrer: 'Livraison', reparer: 'Réparation' }
/** Action terminée (message) : « Cargaison chargée »… */
export const ACTIONS_FINIES: Record<Action, string> = {
  nettoyer: 'Nettoyage terminé', charger: 'Cargaison chargée', livrer: 'Cargaison livrée', reparer: 'Réparation terminée',
}

/** Consigne de l'étape, tant qu'on n'est pas sur place : « Aller à Hubble », « Aller à l'ISS ». */
export function consigne(e: Etape): string {
  return `Aller ${a(e.lieu)}`
}

/** Temps restant d'une action : « 1 min 23 s », « 45 s ». */
export function texteSecondes(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`
}

/**
 * Petit symbole animé du genre de mission, pour le bandeau (demande d'Adrien du 17/10/2026) : une enveloppe qui
 * flotte (livraison), un balai qui balaie (nettoyage), une clé qui tourne (dépannage). Trait de la couleur du texte.
 */
export const SYMBOLES: Record<GenreContrat, string> = {
  livrer: '<svg class="symbole enveloppe" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="4" width="13" height="9" rx="1"/><path d="M1.5 4.5 8 9.5l6.5-5"/></svg>',
  nettoyer: '<svg class="symbole balai" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 1.5 7 9"/><path d="M4.5 8.5 9.5 10.8 8.2 14.5 2.5 12z"/><path d="M4.6 13 5.6 10.4M6.6 13.8 7.4 11.2"/></svg>',
  depanner: '<svg class="symbole cle" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 2.2a3.4 3.4 0 0 0-3.5 4.6L2.2 11.7a1.5 1.5 0 0 0 2.1 2.1l4.9-4.9a3.4 3.4 0 0 0 4.6-3.5l-2 2-2-.5-.5-2z"/></svg>',
}
