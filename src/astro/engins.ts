// Position des engins humains (Hubble, James Webb, Voyager 1 et 2), héliocentrique, écliptique J2000, en UA.

import { ENGINS, type Engin } from '../donnees/engins'
import { positionPlanete } from './planetes'
import { UA_KM } from './temps'
import { OBLIQUITE_J2000, RAD, type Vecteur3 } from './vecteur'

const AN = 365.25 * 86_400_000
const RAYON_TERRE = 6378.137

export function engin(nom: string): Engin | undefined {
  return ENGINS.find((e) => e.nom === nom)
}

export function positionEngin(e: Engin, t: number): Vecteur3 {
  if (e.type === 'lointain') {
    const r = e.distanceUA + (e.vitesseUAParAn * (t - e.epoque)) / AN
    const l = e.longitude * RAD, b = e.latitude * RAD
    return { x: r * Math.cos(b) * Math.cos(l), y: r * Math.cos(b) * Math.sin(l), z: r * Math.sin(b) }
  }
  const terre = positionPlanete('Terre', t)
  if (e.type === 'orbite-basse') {
    // Orbite circulaire, dans le repère équatorial, puis passage à l'écliptique.
    const R = RAYON_TERRE + e.altitudeKm
    const u = (2 * Math.PI * (t / 60_000)) / e.periodeMinutes
    const O = e.noeud * RAD, i = e.inclinaison * RAD
    const x = R * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i))
    const y = R * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i))
    const z = R * Math.sin(u) * Math.sin(i)
    const c = Math.cos(OBLIQUITE_J2000 * RAD), s = Math.sin(OBLIQUITE_J2000 * RAD)
    return { x: terre.x + x / UA_KM, y: terre.y + (y * c + z * s) / UA_KM, z: terre.z + (-y * s + z * c) / UA_KM }
  }
  // Point L2 : dans le prolongement Soleil-Terre ; halo autour de lui.
  const d = Math.hypot(terre.x, terre.y)
  const ux = terre.x / d, uy = terre.y / d
  const phi = (2 * Math.PI * (t / 86_400_000)) / e.periodeJours
  const plan = (e.haloPlanKm * Math.cos(phi)) / UA_KM
  const haut = (e.haloHautKm * Math.sin(phi)) / UA_KM
  const l2 = e.distanceKm / UA_KM
  return { x: terre.x + ux * l2 - uy * plan, y: terre.y + uy * l2 + ux * plan, z: terre.z + haut }
}

/** Tous les engins à l'instant t. */
export function positionsEngins(t: number): { nom: string; position: Vecteur3; tailleM: number }[] {
  return ENGINS.map((e) => ({ nom: e.nom, position: positionEngin(e, t), tailleM: e.tailleM }))
}
