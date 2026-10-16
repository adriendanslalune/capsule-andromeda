// La capsule Andromeda : son état (position, vitesse, cap). Au départ, elle est en orbite basse circulaire autour de
// la Terre, comme l'ISS (400 km d'altitude, inclinaison 51,6° sur l'équateur). Le trajet viendra à l'étape 3.
// Repère du moteur : écliptique J2000, km, km/s. L'heure est toujours passée en paramètre.

import { position } from './corps'
import type { Vecteur3 } from './vecteur'

/** Constante de gravitation de la Terre, G·M (km³/s²). */
export const GM_TERRE = 398_600.4418
const RAYON_TERRE = 6371
const OBLIQUITE = 23.4392911 * (Math.PI / 180)

export interface OrbiteCirculaire {
  /** Rayon de l'orbite (km, depuis le centre de la planète). */
  rayon: number
  /** Inclinaison sur l'équateur terrestre et longitude du nœud ascendant (radians). */
  inclinaison: number
  noeud: number
  /** Instant de référence (ms UTC) et angle parcouru depuis le nœud à cet instant (radians). */
  epoque: number
  phase: number
}

export const ORBITE_DEPART: OrbiteCirculaire = {
  rayon: RAYON_TERRE + 400,
  inclinaison: 51.6 * (Math.PI / 180),
  noeud: 1.2,
  epoque: Date.UTC(2026, 9, 1),
  phase: 0,
}

/** Équatorial terrestre → écliptique (rotation d'axe x, de l'obliquité). */
function versEcliptique(v: Vecteur3): Vecteur3 {
  const c = Math.cos(OBLIQUITE), s = Math.sin(OBLIQUITE)
  return { x: v.x, y: c * v.y + s * v.z, z: -s * v.y + c * v.z }
}

/** Période de l'orbite (s). */
export function periode(o: OrbiteCirculaire): number {
  return 2 * Math.PI * Math.sqrt(o.rayon ** 3 / GM_TERRE)
}

/** Position et vitesse de la capsule relatives à la Terre (km, km/s). */
export function etatRelatif(o: OrbiteCirculaire, t: number): { r: Vecteur3; v: Vecteur3 } {
  const n = (2 * Math.PI) / periode(o)
  const u = o.phase + n * ((t - o.epoque) / 1000)
  const vitesse = n * o.rayon
  const cO = Math.cos(o.noeud), sO = Math.sin(o.noeud), ci = Math.cos(o.inclinaison), si = Math.sin(o.inclinaison)
  // Base du plan de l'orbite (repère équatorial) : p vers le nœud ascendant, q à 90° dans le sens du mouvement.
  const p = { x: cO, y: sO, z: 0 }
  const q = { x: -sO * ci, y: cO * ci, z: si }
  const cu = Math.cos(u), su = Math.sin(u)
  const r = { x: o.rayon * (p.x * cu + q.x * su), y: o.rayon * (p.y * cu + q.y * su), z: o.rayon * (p.z * cu + q.z * su) }
  const v = { x: vitesse * (-p.x * su + q.x * cu), y: vitesse * (-p.y * su + q.y * cu), z: vitesse * (-p.z * su + q.z * cu) }
  return { r: versEcliptique(r), v: versEcliptique(v) }
}

export interface EtatCapsule {
  /** Position héliocentrique (km). */
  position: Vecteur3
  /** Vitesse par rapport à la Terre (km/s). */
  vitesse: Vecteur3
  /** Direction où pointe la capsule (vecteur unitaire) : devant elle, dans le sens de la marche. */
  cap: Vecteur3
}

export function etatCapsule(t: number, o: OrbiteCirculaire = ORBITE_DEPART): EtatCapsule {
  const { r, v } = etatRelatif(o, t)
  const terre = position('Terre', t)
  const l = Math.hypot(v.x, v.y, v.z)
  return {
    position: { x: terre.x + r.x, y: terre.y + r.y, z: terre.z + r.z },
    vitesse: v,
    cap: { x: v.x / l, y: v.y / l, z: v.z / l },
  }
}
