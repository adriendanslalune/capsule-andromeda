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
  /** Astre autour duquel la capsule tourne, et sa constante de gravitation G·M (km³/s²). */
  centre: string
  mu: number
  /** Rayon de l'orbite (km, depuis le centre de l'astre). */
  rayon: number
  /** Inclinaison sur l'équateur terrestre et longitude du nœud ascendant (radians). */
  inclinaison: number
  noeud: number
  /** Instant de référence (ms UTC) et angle parcouru depuis le nœud à cet instant (radians). */
  epoque: number
  phase: number
}

export const ORBITE_DEPART: OrbiteCirculaire = {
  centre: 'Terre',
  mu: GM_TERRE,
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
  return 2 * Math.PI * Math.sqrt(o.rayon ** 3 / o.mu)
}

/** Position et vitesse de la capsule relatives à l'astre qu'elle entoure (km, km/s). */
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

/**
 * État de la capsule à l'instant t. Par défaut, la mission en cours (voir mission.ts) ; avec une orbite donnée, sur
 * cette orbite.
 */
export function etatCapsule(t: number, o?: OrbiteCirculaire): EtatCapsule {
  if (!o) return missionCourante.etat(t)
  return etatSurOrbite(o, t)
}

/** État sur une orbite circulaire autour d'un astre. */
export function etatSurOrbite(o: OrbiteCirculaire, t: number): EtatCapsule {
  const { r, v } = etatRelatif(o, t)
  const c = position(o.centre, t)
  const l = Math.hypot(v.x, v.y, v.z) || 1
  return {
    position: { x: c.x + r.x, y: c.y + r.y, z: c.z + r.z },
    vitesse: v,
    cap: { x: v.x / l, y: v.y / l, z: v.z / l },
  }
}

/** Ce que la capsule fait : la mission en cours la remplit (mission.ts) ; au départ, l'orbite basse terrestre. */
export interface SuiviCapsule { etat(t: number): EtatCapsule }
let missionCourante: SuiviCapsule = { etat: (t) => etatSurOrbite(ORBITE_DEPART, t) }

/** Désigne la mission que suit la capsule (une seule à la fois dans ce prototype). */
export function suivreMission(m: SuiviCapsule): void {
  missionCourante = m
}

/** Écliptique → équatorial terrestre (l'inverse de versEcliptique). */
function versEquateur(v: Vecteur3): Vecteur3 {
  const c = Math.cos(OBLIQUITE), s = Math.sin(OBLIQUITE)
  return { x: v.x, y: c * v.y - s * v.z, z: s * v.y + c * v.z }
}

/**
 * Une orbite circulaire autour de la Terre, sur celle d'un engin (son altitude, son plan), `km` derrière lui. Au début du
 * jeu (Adrien, 23/10/2026 : le premier trajet ne doit pas dépasser 30 secondes), la capsule naît derrière l'ISS.
 */
export function orbiteDerriere(nom: string, t: number, km: number): OrbiteCirculaire {
  const relatif = (instant: number) => { const a = position(nom, instant), c = position('Terre', instant); return versEquateur({ x: a.x - c.x, y: a.y - c.y, z: a.z - c.z }) }
  const r = relatif(t), r2 = relatif(t + 1000)
  const v = { x: r2.x - r.x, y: r2.y - r.y, z: r2.z - r.z }
  const h = { x: r.y * v.z - r.z * v.y, y: r.z * v.x - r.x * v.z, z: r.x * v.y - r.y * v.x }
  const nh = Math.hypot(h.x, h.y, h.z), rayon = Math.hypot(r.x, r.y, r.z)
  const inclinaison = Math.acos(h.z / nh)
  const noeud = Math.atan2(h.x, -h.y)
  const p = { x: Math.cos(noeud), y: Math.sin(noeud), z: 0 }
  const q = { x: -Math.sin(noeud) * Math.cos(inclinaison), y: Math.cos(noeud) * Math.cos(inclinaison), z: Math.sin(inclinaison) }
  const u = Math.atan2(r.x * q.x + r.y * q.y + r.z * q.z, r.x * p.x + r.y * p.y + r.z * p.z)
  return { centre: 'Terre', mu: GM_TERRE, rayon, inclinaison, noeud, epoque: t, phase: u - km / rayon }
}
