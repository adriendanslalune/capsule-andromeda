// La réparation des trois modules du bloc Navigation (étape 4 ; mécaniques validées par Adrien le 19/10/2026), à la
// manière de « Keep Talking and Nobody Explodes » : le panneau montre des indices, le manuel (section 4) dit quoi faire.
//   - Constellation : l'écran montre une constellation ; l'atlas du manuel donne son cap ; on règle l'azimut et la
//     hauteur, puis POINTER (2 tours).
//   - Gyroscope : trois anneaux tournent ; on les freine un par un quand leur repère passe devant l'index, dans
//     l'ordre que donne le manuel selon le numéro de série (1 tour, trois freinages).
//   - Calculateur : l'écran affiche un code ; le manuel donne la position des six interrupteurs et trois touches
//     d'astres ; on règle les interrupteurs, puis on tape les astres dans l'ordre (2 tours).
// Tout est reproductible (même graine, même tour, même panneau). Une erreur bloque le module 30 secondes.

import {
  ANNEAUX, AZIMUTS, CODES_CALCUL, CONSTELLATIONS, HAUTEURS, ORDRES_GYRO, TOLERANCE_GYRO,
} from '../donnees/manuel-navigation'
import { bloque, erreur, nouvelleReparation, tirage, tourFini, type EtatReparation, type Resultat } from './reparation'

// --- Constellation ---

export interface TourConstellation {
  /** La constellation affichée (numéro dans l'atlas). */
  constellation: number
  /** Crans des cadrans au début du tour (jamais sur le cap). */
  azimut: number
  hauteur: number
}

export function tourConstellation(graine: number, k: number): TourConstellation {
  const t = tirage(graine, k)
  const constellation = t(CONSTELLATIONS.length), c = CONSTELLATIONS[constellation]
  for (;;) {
    const azimut = t(AZIMUTS.length), hauteur = t(HAUTEURS.length)
    if (AZIMUTS[azimut] !== c.azimut && HAUTEURS[hauteur] !== c.hauteur) return { constellation, azimut, hauteur }
  }
}

/** Les crans des cadrans (r.reglage : décalage en crans depuis le début du tour, azimut × 100 + hauteur). */
export function cadransConstellation(r: EtatReparation): { azimut: number; hauteur: number } {
  const t = tourConstellation(r.graine, r.tour), d = r.reglage ?? 0
  const da = Math.round(d / 100), dh = d - da * 100
  return {
    azimut: (((t.azimut + da) % AZIMUTS.length) + AZIMUTS.length) % AZIMUTS.length,
    hauteur: Math.max(0, Math.min(HAUTEURS.length - 1, t.hauteur + dh)),
  }
}

export function nouvelleConstellation(graine: number): EtatReparation {
  return { ...nouvelleReparation(graine, 2), reglage: 0 }
}

/** Tourner le cadran d'azimut (tout le tour) ou de hauteur (jusqu'aux butées) d'un cran. */
export function reglerCap(r: EtatReparation, cadran: 'azimut' | 'hauteur', pas: 1 | -1, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const avant = cadransConstellation(r), tour = tourConstellation(r.graine, r.tour)
  const azimut = cadran === 'azimut' ? avant.azimut + pas : avant.azimut
  const hauteur = cadran === 'hauteur' ? Math.max(0, Math.min(HAUTEURS.length - 1, avant.hauteur + pas)) : avant.hauteur
  r.reglage = (azimut - tour.azimut) * 100 + (hauteur - tour.hauteur)
  return 'ok'
}

/** POINTER : tour réussi si les cadrans sont sur le cap de l'atlas. */
export function pointer(r: EtatReparation, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const c = CONSTELLATIONS[tourConstellation(r.graine, r.tour).constellation], cad = cadransConstellation(r)
  const res = AZIMUTS[cad.azimut] === c.azimut && HAUTEURS[cad.hauteur] === c.hauteur ? tourFini(r) : erreur(r, t)
  r.reglage = 0
  return res
}

// --- Gyroscope ---

/** Le calage de départ des trois anneaux (degrés), propre à la réparation. */
export function phasesGyro(graine: number): number[] {
  const t = tirage(graine, 0)
  return ANNEAUX.map(() => t(360))
}

/** Angle du repère de l'anneau i à l'instant t (degrés, 0 : devant l'index) ; un anneau freiné reste devant l'index. */
export function angleAnneau(r: EtatReparation, i: number, t: number): number {
  if (r.coupes.includes(i)) return 0
  return (phasesGyro(r.graine)[i] + ANNEAUX[i].vitesse * t / 1000) % 360
}

/** L'ordre de freinage du manuel (TABLEAU 4-2), selon le dernier chiffre du numéro de série. */
export function ordreGyro(numeroSerie: string): readonly number[] {
  const chiffre = Number(numeroSerie.slice(-1))
  return ORDRES_GYRO.find((o) => chiffre <= o.jusqua)!.ordre
}

export function nouveauGyroscope(graine: number): EtatReparation {
  return nouvelleReparation(graine, 1)
}

/** Freiner l'anneau i : le bon anneau (dans l'ordre), son repère devant l'index. */
export function freiner(r: EtatReparation, i: number, numeroSerie: string, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  if (r.coupes.includes(i)) return 'ok'
  const a = angleAnneau(r, i, t), ecart = Math.min(a, 360 - a)
  if (ordreGyro(numeroSerie)[r.coupes.length] !== i || ecart > TOLERANCE_GYRO) return erreur(r, t)
  r.coupes.push(i)
  return r.coupes.length === ANNEAUX.length ? tourFini(r) : 'ok'
}

// --- Calculateur ---

export interface TourCalculateur {
  /** Le code affiché (numéro dans CODES_CALCUL). */
  code: number
  /** Position des interrupteurs au début du tour (vrai : en haut), jamais la bonne. */
  depart: boolean[]
}

export function tourCalculateur(graine: number, k: number): TourCalculateur {
  const t = tirage(graine, k)
  const code = t(CODES_CALCUL.length)
  for (;;) {
    const depart = Array.from({ length: 6 }, () => t(2) === 1)
    if (depart.some((h, i) => h !== CODES_CALCUL[code].interrupteurs[i])) return { code, depart }
  }
}

/** Position actuelle des interrupteurs (r.reglage : ceux basculés depuis le début du tour, en bits). */
export function interrupteursCalcul(r: EtatReparation): boolean[] {
  const bits = r.reglage ?? 0
  return tourCalculateur(r.graine, r.tour).depart.map((h, i) => h !== ((bits >> i) & 1) > 0)
}

export function nouveauCalculateur(graine: number): EtatReparation {
  return { ...nouvelleReparation(graine, 2), reglage: 0 }
}

/** Basculer l'interrupteur i. */
export function basculerInterrupteur(r: EtatReparation, i: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  r.reglage = (r.reglage ?? 0) ^ (1 << i)
  return 'ok'
}

/** Taper la touche d'astre a : les interrupteurs doivent être réglés, et l'astre être le suivant du code. */
export function taperAstre(r: EtatReparation, a: number, t: number): Resultat {
  if (bloque(r, t)) return 'bloque'
  const c = CODES_CALCUL[tourCalculateur(r.graine, r.tour).code]
  const regles = interrupteursCalcul(r).every((h, i) => h === c.interrupteurs[i])
  if (!regles || c.astres[r.coupes.length] !== a) { const res = erreur(r, t); r.reglage = 0; return res }
  r.coupes.push(a)
  if (r.coupes.length < c.astres.length) return 'ok'
  const res = tourFini(r)
  r.reglage = 0
  return res
}
