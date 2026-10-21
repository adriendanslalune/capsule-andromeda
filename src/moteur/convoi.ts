// La formation du convoi (début d'ESCORTER, Mercenaires) : les cargos sortent du hangar un par un et dérivent ; on les
// attrape du doigt et on les lâche sur une place de la formation. Un cargo qui sort du terrain s'égare : il retourne
// au hangar et ressort un peu plus tard. Les trois en place : le convoi est formé. Pas de chrono, pas d'échec.

import {
  DERIVE_MAX, ECART_SORTIES, HANGAR, HAUTEUR, LARGEUR, PLACES, RAYON_PLACE, RAYON_PRISE, RETOUR_HANGAR, VITESSE_CARGO,
} from '../donnees/convoi'
import { hasard } from './contrats'

export interface Cargo {
  etat: 'hangar' | 'derive' | 'tenu' | 'place'
  x: number
  y: number
  vx: number
  vy: number
  /** Au hangar : sortie dans tant de secondes. */
  sortie: number
  /** Rangé : le numéro de sa place. */
  place: number | null
}

export interface EtatConvoi { cargos: Cargo[]; egares: number; graine: number; forme: boolean }

export function nouveauConvoi(graine: number): EtatConvoi {
  const cargos: Cargo[] = PLACES.map((_, k) => ({ etat: 'hangar', x: HANGAR.x, y: HANGAR.y, vx: 0, vy: 0, sortie: 0.8 + k * ECART_SORTIES, place: null }))
  return { cargos, egares: 0, graine, forme: false }
}

/** Fait avancer de dt secondes ; renvoie 'egare' (un cargo a quitté le terrain), 'forme' (les trois en place) ou null. */
export function avancerConvoi(e: EtatConvoi, dt: number): 'egare' | 'forme' | null {
  if (e.forme) return null
  let r: 'egare' | null = null
  for (const c of e.cargos) {
    if (c.etat === 'hangar') {
      c.sortie -= dt
      if (c.sortie > 0) continue
      // Il sort, et dérive de côté au hasard.
      const h = hasard(e.graine)
      e.graine = h.graine
      Object.assign(c, { etat: 'derive', x: HANGAR.x, y: HANGAR.y, vx: (2 * h.x - 1) * DERIVE_MAX, vy: -VITESSE_CARGO })
    } else if (c.etat === 'derive') {
      c.x += c.vx * dt
      c.y += c.vy * dt
      if (c.x < -6 || c.x > LARGEUR + 6 || c.y < -6 || c.y > HAUTEUR + 6) {
        Object.assign(c, { etat: 'hangar', x: HANGAR.x, y: HANGAR.y, sortie: RETOUR_HANGAR })
        e.egares++
        r = 'egare'
      }
    }
  }
  return r
}

/** Attraper le cargo à la dérive le plus proche du doigt (x, y) ; renvoie son numéro, ou null. */
export function prendre(e: EtatConvoi, x: number, y: number): number | null {
  let meilleur: number | null = null, dMin = RAYON_PRISE
  e.cargos.forEach((c, k) => {
    const d = Math.hypot(c.x - x, c.y - y)
    if (c.etat === 'derive' && d <= dMin) { dMin = d; meilleur = k }
  })
  if (meilleur !== null) e.cargos[meilleur].etat = 'tenu'
  return meilleur
}

/** Le cargo tenu suit le doigt (dans le terrain). */
export function deplacer(e: EtatConvoi, k: number, x: number, y: number): void {
  const c = e.cargos[k]
  if (c?.etat !== 'tenu') return
  c.x = Math.max(0, Math.min(LARGEUR, x))
  c.y = Math.max(0, Math.min(HAUTEUR, y))
}

/** Lâcher le cargo tenu : près d'une place libre, il s'y range ; sinon il repart à la dérive, d'où on l'a lâché. */
export function lacherCargo(e: EtatConvoi, k: number): 'place' | 'derive' | null {
  const c = e.cargos[k]
  if (c?.etat !== 'tenu') return null
  const libres = PLACES.map((p, i) => ({ p, i })).filter(({ i }) => !e.cargos.some((x) => x.place === i))
  const proche = libres.map(({ p, i }) => ({ i, p, d: Math.hypot(p.x - c.x, p.y - c.y) })).sort((a, b) => a.d - b.d)[0]
  if (proche && proche.d <= RAYON_PLACE) {
    Object.assign(c, { etat: 'place', x: proche.p.x, y: proche.p.y, vx: 0, vy: 0, place: proche.i })
    if (e.cargos.every((x) => x.etat === 'place')) e.forme = true
    return 'place'
  }
  c.etat = 'derive'
  return 'derive'
}
