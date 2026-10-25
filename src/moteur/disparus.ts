// Les Disparus (idée validée par Adrien le 21/10/2026) : le radar retrouve de vraies sondes perdues. Une sonde posée ou
// en orbite ne renvoie qu'un écho faible : il faut passer à moins de ECHO_PROCHE, et au-dessus d'elle pour celles
// posées. Celles perdues autour du Soleil (et Pioneer 10 et 11) répondent à toute la portée du radar, mais l'espace
// est immense : l'indice du classeur donne une zone de recherche. Un écho capté, la sonde apparaît sur la carte ;
// on la rejoint, elle est identifiée et rejoint le classeur, avec la date de sa découverte.

import { ANGLE_AU_DESSUS, DISPARUS, ECHO_PROCHE, type Disparu } from '../donnees/disparus'
import { position } from './corps'
import { PORTEE_RADAR } from './radar'
import './rotation' // les sondes posées tournent avec leur astre
import type { Vecteur3 } from './vecteur'

export interface EtatDisparus {
  /** Les échos captés (numéro → quand) : la sonde se voit sur la carte. */
  echos: Record<number, number>
  /** Les sondes identifiées (numéro → quand). */
  trouves: Record<number, number>
  /** La sonde qu'on cherche (sa zone, ou son astre, est marquée sur la carte). */
  suivi: number | null
}

export function nouveauxDisparus(): EtatDisparus {
  return { echos: {}, trouves: {}, suivi: null }
}

const ecart = (a: Vecteur3, b: Vecteur3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

/**
 * Le radar balaie depuis ce point : renvoie la sonde dont il capte l'écho pour la première fois, la plus proche, une
 * seule (Adrien, 25/10/2026 : huit sondes de la Lune d'un coup, c'était trop facile ; jeu.ts n'en capte qu'une par
 * passage du radar).
 */
export function detecter(e: EtatDisparus, capsule: Vecteur3, t: number): Disparu[] {
  const nouveaux: Disparu[] = []
  let meilleur = Infinity
  for (const d of DISPARUS) {
    if (e.trouves[d.numero] !== undefined || e.echos[d.numero] !== undefined) continue
    const p = position(d.nom, t), l = d.lieu
    if (l.genre === 'sol' || l.genre === 'orbite') {
      if (ecart(p, capsule) > ECHO_PROCHE) continue
      if (l.genre === 'sol') {
        // Posée : seulement si la capsule passe au-dessus d'elle (pas de l'autre côté de l'astre).
        const c = position(l.astre, t)
        const u = { x: p.x - c.x, y: p.y - c.y, z: p.z - c.z }, v = { x: capsule.x - c.x, y: capsule.y - c.y, z: capsule.z - c.z }
        const cos = (u.x * v.x + u.y * v.y + u.z * v.z) / (Math.hypot(u.x, u.y, u.z) * Math.hypot(v.x, v.y, v.z) || 1)
        if (Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI > ANGLE_AU_DESSUS) continue
      }
    } else if (ecart(p, capsule) > PORTEE_RADAR) continue
    if (ecart(p, capsule) >= meilleur) continue
    meilleur = ecart(p, capsule)
    nouveaux.splice(0, 1, d)
  }
  for (const d of nouveaux) e.echos[d.numero] = t
  return nouveaux
}

/** La capsule a rejoint une sonde : elle est identifiée (renvoie la sonde, la première fois seulement). */
export function identifier(e: EtatDisparus, nom: string, t: number): Disparu | null {
  const d = DISPARUS.find((x) => x.nom === nom)
  if (!d || e.trouves[d.numero] !== undefined) return null
  e.trouves[d.numero] = t
  if (e.suivi === d.numero) e.suivi = null
  return d
}

/** Une sonde se voit-elle sur la carte (écho capté, ou identifiée) ? */
export function disparuVisible(e: EtatDisparus, d: Disparu): boolean {
  return e.echos[d.numero] !== undefined || e.trouves[d.numero] !== undefined
}

/** Ce qu'on suit, pour l'y emmener : la zone de recherche (perdue dans le vide) ou l'astre où elle est. */
export function ouChercher(d: Disparu): { lieu: string; zone: boolean } {
  return d.lieu.genre === 'sol' || d.lieu.genre === 'orbite' ? { lieu: d.lieu.astre, zone: false } : { lieu: `Zone de recherche · ${d.nom}`, zone: true }
}
