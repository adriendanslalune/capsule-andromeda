// Le visiteur de la saison : où il se trouve, à chaque instant. Identique pour tous les joueurs.
// Chaque mois, il fait une boucle de 3 ou 4 escales (tirées comme les contrats : un système, puis un astre de ce
// système) ; il change d'escale chaque jour à 00:00 UTC et se tient à côté de son astre, à une distance et dans
// une direction qui changent chaque jour. Il ne voyage pas entre deux escales : il disparaît et réapparaît.
// (Décisions d'Adrien du 13/10/2026 ; le prototype le faisait voyager entre les planètes.)

import { corpsDuSysteme, positionPlate, type NomCorps } from '../astro/corps'
import { UA_KM } from '../astro/temps'
import { CHASSE as C } from '../donnees/chasse'
import { NOMS_PLANETES } from '../donnees/planetes'
import { choisirAuHasard, entierAuHasard, mulberry32 } from './hasard'

const JOUR = 86_400_000

/** Numéro de la saison de l'instant t : nombre de mois écoulés depuis janvier 2026 (janvier 2026 = 0). */
export function numeroSaison(t: number): number {
  const d = new Date(t)
  return (d.getUTCFullYear() - C.anneeDepart) * 12 + d.getUTCMonth()
}

/** Début de la saison n (1er du mois, 00:00 UTC). */
export function debutSaison(n: number): number {
  return Date.UTC(C.anneeDepart, n, 1)
}

/** Fin de la saison n (1er du mois suivant, 00:00 UTC). */
export function finSaison(n: number): number {
  return debutSaison(n + 1)
}

const boucles = new Map<number, NomCorps[]>()

/** Boucle d'escales de la saison n : 3 ou 4 astres différents, dans l'ordre. */
export function boucleSaison(n: number): NomCorps[] {
  const deja = boucles.get(n)
  if (deja) return deja
  const h = mulberry32(n * C.graineMultiplicateur + C.graineDecalage)
  const nombre = C.escalesMin + entierAuHasard(h, C.escalesMax - C.escalesMin + 1)
  const escales: NomCorps[] = []
  while (escales.length < nombre) {
    const astre = choisirAuHasard(h, corpsDuSysteme(choisirAuHasard(h, NOMS_PLANETES)))
    if (!escales.includes(astre)) escales.push(astre)
  }
  boucles.set(n, escales)
  return escales
}

export interface PositionVisiteur {
  x: number
  y: number
  z: number
  /** Astre de l'escale du jour (pendant le voyage : l'astre vers lequel il se dirige). */
  astre: NomCorps
  /** Distance à l'astre (km) une fois arrivé. */
  distanceAstreKm: number
  /** Vrai pendant le voyage (de 00:00 à 06:00 UTC) : on ne peut alors pas l'approcher. */
  enVoyage: boolean
}

/** Numéro du jour dans la saison (0 = le 1er du mois). */
export function jourDansSaison(t: number): number {
  return Math.floor((t - debutSaison(numeroSaison(t))) / JOUR)
}

/** Escale du jour de l'instant t (pendant le voyage du matin : celle vers laquelle il se dirige). */
export function escaleDuJour(t: number): NomCorps {
  const boucle = boucleSaison(numeroSaison(t))
  return boucle[jourDansSaison(t) % boucle.length]
}

/** Début du jour UTC de l'instant t. */
function minuit(t: number): number {
  return Math.floor(t / JOUR) * JOUR
}

/** Place du visiteur à côté de l'astre de son escale, pour le jour de l'instant t. */
function placeAuRepos(t: number): Omit<PositionVisiteur, 'enVoyage'> {
  const n = numeroSaison(t)
  const jour = jourDansSaison(t)
  const astre = escaleDuJour(t)
  // Distance et direction tirées pour ce jour (les mêmes pour tous).
  const h = mulberry32((n * C.graineMultiplicateur + C.graineDecalage) * 64 + jour)
  const distanceAstreKm = C.distanceAstreMinKm + h() * (C.distanceAstreMaxKm - C.distanceAstreMinKm)
  const angle = h() * 2 * Math.PI
  const d = distanceAstreKm / UA_KM
  const a = positionPlate(astre, t)
  // Dans le plan de l'astre (la fusée navigue dans le plan de la carte, sans hauteur).
  return { x: a.x + d * Math.cos(angle), y: a.y + d * Math.sin(angle), z: a.z, astre, distanceAstreKm }
}

/**
 * Position du visiteur à l'instant t (héliocentrique, écliptique J2000, UA). Chaque jour à 00:00 UTC, il quitte sa
 * place de la veille et file en ligne droite vers sa place du jour, où il arrive à 06:00 ; il y reste jusqu'au
 * minuit suivant, en suivant son astre.
 */
export function positionVisiteur(t: number): PositionVisiteur {
  const debut = minuit(t)
  const arrivee = debut + C.dureeVoyageHeures * 3_600_000
  if (t >= arrivee) return { ...placeAuRepos(t), enVoyage: false }
  const A = placeAuRepos(debut - 1) // place de la veille, au moment du départ
  const B = placeAuRepos(arrivee) // place du jour, au moment de l'arrivée
  const f = (t - debut) / (arrivee - debut)
  return {
    x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, z: A.z + (B.z - A.z) * f,
    astre: B.astre, distanceAstreKm: B.distanceAstreKm, enVoyage: true,
  }
}
