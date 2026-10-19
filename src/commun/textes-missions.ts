// Textes des missions (« contrats » dans le moteur) : titres, verbes des actions, consignes.

import type { Action, Contrat, Etape, GenreContrat } from '../moteur/contrats'
import { corps } from '../moteur/corps'

/** Épaves elles-mêmes (on vide l'épave), et non des débris autour d'un engin. */
const EPAVES = ['Envisat', 'Vanguard 1']
const estEpave = (lieu: string) => EPAVES.includes(lieu) || corps(lieu)?.type === 'epave'

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
  const premier = c.etapes[0].lieu, lieu = c.etapes[c.etapes.length - 1].lieu
  if (c.genre === 'livrer') return `Livrer une cargaison ${de(premier)} ${a(lieu)}`
  if (c.genre === 'remorquer') return `Remorquer l'épave ${premier} jusqu'${a(lieu)}`
  if (c.genre === 'escorter') return `Escorter un convoi ${de(premier)} ${a(lieu)}`
  if (c.genre === 'depanner') return `Réparer ${article(lieu)}`
  if (c.genre === 'chasser') return `Abattre le ${lieu}`
  return estEpave(lieu) ? `Vider l'épave ${lieu}` : `Nettoyer les débris autour ${de(lieu)}`
}

/**
 * Le type de mission, c'est-à-dire son mini-jeu (décision d'Adrien du 18/10/2026 : en choisissant une mission, on
 * sait à quoi on va jouer) : VIDER, REMORQUER, ABATTRE, ESCORTER, RÉPARER, AMARRER.
 */
export const GENRES_COURTS: Record<GenreContrat, string> = {
  nettoyer: 'VIDER', remorquer: 'REMORQUER', chasser: 'ABATTRE', escorter: 'ESCORTER', depanner: 'RÉPARER', livrer: 'AMARRER',
}
/**
 * Le poste de la capsule où se joue chaque type de mission, en mots du jeu (demande d'Adrien du 18/10/2026 : jamais
 * « mini-jeu » à l'écran, ça casse l'immersion).
 */
export const POSTES: Record<GenreContrat, string> = {
  nettoyer: 'poste de tri', remorquer: 'grappin', chasser: 'poste de combat', escorter: 'tourelle d\'interception',
  depanner: 'panneau technique', livrer: 'commandes d\'amarrage',
}

/** Bouton de l'action : « VIDER », « CHARGER », « AMARRER »… */
export const VERBES: Record<Action, string> = {
  nettoyer: 'VIDER', harponner: 'HARPONNER', larguer: 'LARGUER', abattre: 'COMBAT', rejoindre: 'REJOINDRE', escorter: 'ESCORTER',
  reparer: 'RÉPARER', charger: 'CHARGER', livrer: 'AMARRER',
}
/** Action en cours : « Tri », « Chargement »… */
export const NOMS_ACTIONS: Record<Action, string> = {
  nettoyer: 'Tri', harponner: 'Harponnage', larguer: 'Largage', abattre: 'Combat', rejoindre: 'Formation du convoi', escorter: 'Escorte',
  reparer: 'Réparation', charger: 'Chargement', livrer: 'Amarrage',
}
/** Action terminée (message) : « Cargaison chargée »… */
export const ACTIONS_FINIES: Record<Action, string> = {
  nettoyer: 'Épave vidée', harponner: 'Épave harponnée : en remorque !', larguer: 'Épave larguée à la station', abattre: 'Chasseur abattu',
  rejoindre: 'Convoi formé : en route !', escorter: 'Convoi arrivé à bon port', reparer: 'Réparation terminée', charger: 'Cargaison chargée',
  livrer: 'Amarrage réussi : cargaison livrée',
}

/** Consigne de l'étape, tant qu'on n'est pas sur place : « Aller à Hubble », « Rejoindre le convoi à l'ISS ». */
export function consigne(e: Etape): string {
  if (e.action === 'abattre') return `Rejoindre le ${e.lieu}`
  if (e.action === 'rejoindre') return `Rejoindre le convoi ${a(e.lieu)}`
  if (e.action === 'larguer') return `Remorquer l'épave ${a(e.lieu).replace(/^à /, 'jusqu\'à ')}`
  return `Aller ${a(e.lieu)}`
}

/** Temps restant d'une action : « 1 min 23 s », « 45 s ». */
export function texteSecondes(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`
}

/**
 * Petit symbole animé du genre de mission, pour le bandeau (demande d'Adrien du 17/10/2026) : une enveloppe qui
 * flotte (livraison), un balai qui balaie (nettoyage), une clé qui tourne (dépannage), un viseur qui palpite (chasse).
 * Trait de la couleur du texte.
 */
export const SYMBOLES: Record<GenreContrat, string> = {
  remorquer: '<svg class="symbole balai" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2.5 9.5 10"/><path d="M9 6.5a3.5 3.5 0 1 0 3.5 3.5"/><path d="M12.5 10l1.5-1.2M12.5 10l-.2 1.9"/></svg>',
  escorter: '<svg class="symbole viseur" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 13.5 3.5v4c0 3.4-2.4 5.9-5.5 7-3.1-1.1-5.5-3.6-5.5-7v-4z"/><path d="M5.5 8 7.3 9.8 10.7 6.2"/></svg>',
  livrer: '<svg class="symbole enveloppe" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="4" width="13" height="9" rx="1"/><path d="M1.5 4.5 8 9.5l6.5-5"/></svg>',
  nettoyer: '<svg class="symbole balai" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 1.5 7 9"/><path d="M4.5 8.5 9.5 10.8 8.2 14.5 2.5 12z"/><path d="M4.6 13 5.6 10.4M6.6 13.8 7.4 11.2"/></svg>',
  chasser: '<svg class="symbole viseur" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5"/><path d="M8 1v4M8 11v4M1 8h4M11 8h4"/><circle cx="8" cy="8" r="0.8"/></svg>',
  depanner: '<svg class="symbole cle" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 2.2a3.4 3.4 0 0 0-3.5 4.6L2.2 11.7a1.5 1.5 0 0 0 2.1 2.1l4.9-4.9a3.4 3.4 0 0 0 4.6-3.5l-2 2-2-.5-.5-2z"/></svg>',
}
