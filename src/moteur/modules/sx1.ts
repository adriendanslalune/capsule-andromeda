// SX-1 Sextant : en cas de dérive de navigation, le bloc affiche le nom d'une étoile de référence. Procédure : si le
// dernier chiffre du n° de série est impair, viser plutôt l'étoile qui la suit dans le tableau (après FOMALHAUT :
// SIRIUS) ; régler l'azimut et la hauteur sur ses coordonnées, presser RELEVÉ. Tolérance : 1,5°
// (écart d'azimut × cos(hauteur), et écart de hauteur).

import { ecartVisee } from '../../astro/etoiles'
import { ETOILES, type Etoile } from '../../donnees/etoiles'
import { SEXTANT } from '../../donnees/modules'
import { entierAuHasard, type Hasard } from '../hasard'
import { dernierChiffrePair } from '../serie'
import { sansEvenement, type Contexte, type Effet } from './commun'

export interface EtatSX1 {
  /** Étoile affichée (avarie en cours), ou null. */
  etoile: string | null
  /** Visée du sextant (degrés) : azimut 0 à 359, hauteur −90 à +90. */
  azimut: number
  hauteur: number
}

export function creerSX1(): EtatSX1 {
  return { etoile: null, azimut: 0, hauteur: 0 }
}

export function sx1EnPanne(e: EtatSX1): boolean {
  return e.etoile !== null
}

export function panneSX1(e: EtatSX1, hasard: Hasard): EtatSX1 {
  return { ...e, etoile: ETOILES[entierAuHasard(hasard, ETOILES.length)].nom }
}

/** Étoile à viser : celle affichée, ou la suivante du tableau si le dernier chiffre du n° de série est impair. */
export function etoileAViser(affichee: string, serie: string): Etoile {
  let i = ETOILES.findIndex((x) => x.nom === affichee)
  if (!dernierChiffrePair(serie)) i = (i + 1) % ETOILES.length
  return ETOILES[i]
}

/** Règle la visée (azimut et hauteur, en degrés). */
export function reglerSextant(e: EtatSX1, dAzimut: number, dHauteur: number): Effet<EtatSX1> {
  return sansEvenement({
    ...e,
    azimut: (((e.azimut + dAzimut) % 360) + 360) % 360,
    hauteur: Math.max(-90, Math.min(90, e.hauteur + dHauteur)),
  })
}

/** RELEVÉ : sans avarie, rien ; visée à 1,5° près de la bonne étoile → réparé ; sinon, erreur. */
export function releve(e: EtatSX1, ctx: Contexte): Effet<EtatSX1> {
  if (!e.etoile) return sansEvenement(e)
  if (ecartVisee(e.azimut, e.hauteur, etoileAViser(e.etoile, ctx.serie)) <= SEXTANT.tolerance) {
    return { etat: { ...e, etoile: null }, evenements: [{ type: 'reparation', module: 'SX-1' }] }
  }
  return { etat: e, evenements: [{ type: 'erreur', module: 'SX-1', nature: 'mauvaise visée' }] }
}
