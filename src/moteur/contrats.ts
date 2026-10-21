// Les missions du joueur (étape 3), appelées « contrats » dans le code (« mission » y désigne le voyage de la capsule).
// Six genres, deux par Maison (décision d'Adrien du 18/10/2026), chacun avec son mini-jeu (à venir pour certains) :
//   - Nettoyeurs : vider une épave (le tri), remorquer une épave jusqu'à une station (harponner, puis larguer) ;
//   - Mercenaires : abattre un chasseur alien (le combat), escorter un convoi d'une station à une autre ;
//   - Ingénieurs : réparer un engin, livrer une cargaison (charger à une station, puis amarrer à l'arrivée).
// Chaque mission appartient au tableau d'un système.
// Une mission est une suite d'étapes : aller à un lieu, puis y faire une action qui dure DUREE_ACTION.
// Les missions sont tirées au hasard, d'un hasard reproductible (une graine, enregistrée avec la partie).

import { ELOIGNEMENT_MAX, ELOIGNEMENT_PLEIN, FACTEUR_CHASSE, FACTEUR_LIVRAISON, LIMITE_MOYENNE, LIMITE_PROCHE, PRIX_ECART, PRIX_MIN, ZONES, type Portee, type Tableau } from '../donnees/tableaux'
import type { Maison } from '../donnees/maisons'

export type GenreContrat = 'nettoyer' | 'remorquer' | 'chasser' | 'escorter' | 'depanner' | 'livrer'
export type Action = 'nettoyer' | 'harponner' | 'larguer' | 'abattre' | 'rejoindre' | 'escorter' | 'reparer' | 'charger' | 'livrer'

export interface Etape { lieu: string; action: Action }

export interface Contrat {
  id: number
  genre: GenreContrat
  etapes: Etape[]
  /** Crédits gagnés à la fin. */
  recompense: number
  /** Le système dont c'est une mission (son tableau). */
  tableau?: string
  /** Sa portée dans le système (près de la planète, à mi-distance, au bord). */
  portee?: Portee
}

/** Tirage pseudo-aléatoire (mulberry32) : renvoie un nombre entre 0 et 1 et la graine suivante. */
export function hasard(graine: number): { x: number; graine: number } {
  const g = (graine + 0x6d2b79f5) >>> 0
  let t = g
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { x: ((t ^ (t >>> 14)) >>> 0) / 4294967296, graine: g }
}

/**
 * Récompense d'une mission, fixée une fois pour toutes à sa création (décision d'Adrien du 18/10/2026) : de PRIX_MIN à
 * PRIX_MIN + PRIX_ECART selon la mission, plus pour une livraison ou une chasse, multipliée par le facteur de sa zone
 * (ZONES : loin de la Terre et dangereux, ça paie plus) ; arrondie à la dizaine.
 */
export function recompense(genre: GenreContrat, zone: number, x: number, eloignement = 1): number {
  const facteur = genre === 'livrer' || genre === 'remorquer' || genre === 'escorter' ? FACTEUR_LIVRAISON : genre === 'chasser' ? FACTEUR_CHASSE : 1
  return Math.round(((PRIX_MIN + PRIX_ECART * x) * facteur * zone * eloignement) / 10) * 10
}

/** Facteur d'éloignement du prix (décision d'Adrien du 18/10/2026) : de ×1 tout près de la planète à ×2 au bord. */
export function facteurEloignement(part: number): number {
  return 1 + (ELOIGNEMENT_MAX - 1) * Math.min(1, part / ELOIGNEMENT_PLEIN)
}

/** De quoi faire les missions d'un tableau : les lieux de son système (voir moteur/tableaux.ts). */
export interface ContexteTableau {
  tableau: Tableau
  /** Épaves à vider, débris à nettoyer. */
  epaves: readonly string[]
  /** Les vraies épaves, qu'on peut remorquer jusqu'à une station (jamais une station ni un satellite en service). */
  remorquables: readonly string[]
  /** Où charger une cargaison, et où la livrer. */
  departs: readonly string[]
  arrivees: readonly string[]
  /** Engins à dépanner ; chasseurs à abattre. */
  depannages: readonly string[]
  aliens: readonly string[]
  /** Éloignement de chaque lieu dans son système (part de la sphère d'influence). */
  parts: ReadonlyMap<string, number>
  /** Autour d'une grande lune : l'éloignement de la lune dans son système, qui fixe le prix et la portée du contrat. */
  partFixe?: number
}

/**
 * Tire une nouvelle mission d'une Maison sur un tableau : un nettoyage pour les Nettoyeurs, une livraison pour les
 * Ingénieurs, une chasse ou un dépannage pour les Mercenaires. `exclus` : lieux déjà pris (pour varier).
 */
export function tirerContrat(id: number, graine: number, ctx: ContexteTableau, maison: Maison, exclus: string[] = [],
  portees: readonly Portee[] = ['proche', 'moyenne', 'lointaine']): { contrat: Contrat; graine: number } {
  let g = graine
  const x = () => { const h = hasard(g); g = h.graine; return h.x }
  const tirer = <T>(liste: readonly T[]): T => liste[Math.floor(x() * liste.length)]
  // Un lieu de la portée voulue, pas déjà pris (pour varier) ; à défaut, de la portée la plus proche qui en a.
  const part = (l: string) => ctx.parts.get(l) ?? 0
  const classe = (l: string): Portee => (part(l) < LIMITE_PROCHE ? 'proche' : part(l) < LIMITE_MOYENNE ? 'moyenne' : 'lointaine')
  const parmi = (liste: readonly string[]) => {
    for (const p of portees) {
      const ici = liste.filter((l) => classe(l) === p)
      const libres = ici.filter((l) => !exclus.includes(l))
      if (libres.length) return tirer(libres)
      if (ici.length) return tirer(ici)
    }
    return tirer(liste)
  }
  // Les deux genres de la Maison : celui qui a un lieu à la portée voulue ; sinon, l'un ou l'autre (à pile ou face).
  const voulue = portees[0]
  const aPortee = (liste: readonly string[]) => liste.some((l) => classe(l) === voulue)
  const [g1, g2, lieux1, lieux2]: [GenreContrat, GenreContrat, readonly string[], readonly string[]] =
    maison === 'nettoyeurs' ? ['nettoyer', 'remorquer', ctx.epaves, ctx.remorquables]
      : maison === 'mercenaires' ? ['chasser', 'escorter', ctx.aliens, ctx.arrivees]
        : ['depanner', 'livrer', ctx.depannages, ctx.arrivees]
  const pile = x() < 0.5
  let genre: GenreContrat = !lieux1.length ? g2 : !lieux2.length ? g1
    : aPortee(lieux1) && !aPortee(lieux2) ? g1 : aPortee(lieux2) && !aPortee(lieux1) ? g2 : pile ? g1 : g2
  // Pas de station dans le système (ou aucune destination ailleurs qu'au départ) : ni remorquage, ni escorte, ni livraison.
  const destinations = ctx.departs.length > 1 ? ctx.arrivees : ctx.arrivees.filter((l) => !ctx.departs.includes(l))
  if ((!ctx.departs.length || (genre !== 'remorquer' && !destinations.length)) && genre !== g1) genre = g1
  let etapes: Etape[]
  const station = () => tirer(ctx.departs)
  if (genre === 'nettoyer') etapes = [{ lieu: parmi(ctx.epaves), action: 'nettoyer' }]
  else if (genre === 'remorquer') etapes = [{ lieu: parmi(ctx.remorquables), action: 'harponner' }, { lieu: station(), action: 'larguer' }]
  else if (genre === 'depanner') etapes = [{ lieu: parmi(ctx.depannages), action: 'reparer' }]
  else if (genre === 'chasser') etapes = [{ lieu: parmi(ctx.aliens), action: 'abattre' }]
  else {
    const depart = station()
    const arrivee = parmi(ctx.arrivees.filter((a) => a !== depart))
    etapes = genre === 'escorter'
      ? [{ lieu: depart, action: 'rejoindre' }, { lieu: arrivee, action: 'escorter' }]
      : [{ lieu: depart, action: 'charger' }, { lieu: arrivee, action: 'livrer' }]
  }
  const loin = ctx.partFixe ?? Math.max(...etapes.map((e) => part(e.lieu)))
  const contrat: Contrat = {
    id, genre, etapes, recompense: recompense(genre, ZONES[ctx.tableau.systeme], x(), facteurEloignement(loin)), tableau: ctx.tableau.lieu,
    portee: loin < LIMITE_PROCHE ? 'proche' : loin < LIMITE_MOYENNE ? 'moyenne' : 'lointaine',
  }
  return { contrat, graine: g }
}
