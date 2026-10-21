// La libération des zones (décisions d'Adrien du 21/10/2026) : ce qui est libre, la jauge de résistance de chaque
// zone, et la zone que fait avancer une activité (la zone pas encore libérée la plus proche, dans le même système).
// Ce qui s'ouvre avec une zone libérée : le comptoir de son système (sa planète libérée), la cotation des compagnies
// qui y ont leur siège, les quêtes secondaires de ses PNJ ; les chasseurs d'un système libéré ne reviennent plus.

import { PALIERS_JAUGE, ZONES_A_LIBERER, ZONES_LIBRES, type Zone } from '../donnees/zones'
import { astreDominant, corps, position } from './corps'
import type { Vecteur3 } from './vecteur'

/** Ce que le jeu retient : les points de résistance de chaque zone, et les zones libérées. */
export interface EtatZones { points: Record<string, number>; liberees: string[] }

export function zone(nom: string): Zone | undefined {
  return ZONES_A_LIBERER.find((z) => z.nom === nom)
}

/** La zone est-elle libre (la Terre, ou libérée) ? Un astre qui n'est pas une zone suit sa planète. */
export function estLibre(e: EtatZones, nom: string): boolean {
  const z = zoneDuLieu(nom)
  return z === null || (ZONES_LIBRES as readonly string[]).includes(z) || e.liberees.includes(z)
}

/** La jauge de résistance d'une zone (0 à 100 %). */
export function jauge(e: EtatZones, nom: string): number {
  const z = zone(nom)
  if (!z) return 100
  if (e.liberees.includes(nom)) return 100
  return Math.min(100, Math.floor((100 * (e.points[nom] ?? 0)) / z.seuil))
}

/**
 * La zone dont dépend un lieu : lui-même s'il en est une, sinon la grande lune autour de laquelle il tourne, sinon sa
 * planète (la Terre pour ce qui tourne autour d'elle) ; null en plein espace.
 */
export function zoneDuLieu(nom: string): string | null {
  if (zone(nom) || (ZONES_LIBRES as readonly string[]).includes(nom)) return nom
  let c = corps(nom)
  for (let k = 0; c && k < 4; k++) {
    if (!c.parent) return null
    if (zone(c.parent) || (ZONES_LIBRES as readonly string[]).includes(c.parent)) return c.parent
    c = corps(c.parent)
  }
  return null
}

/** La zone pas encore libérée la plus proche de ce point, dans le même système (null : rien à libérer ici). */
export function zoneProche(e: EtatZones, p: Vecteur3, t: number): string | null {
  const systeme = astreDominant(p, t)
  let meilleure: string | null = null, dMin = Infinity
  for (const z of ZONES_A_LIBERER) {
    if (z.systeme !== systeme || e.liberees.includes(z.nom)) continue
    const q = position(z.nom, t), d = Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z)
    if (d < dMin) { dMin = d; meilleure = z.nom }
  }
  return meilleure
}

/**
 * Une activité à ce point vaut ces points de résistance : ils vont à la zone la plus proche. Renvoie les annonces des
 * paliers franchis (25, 50, 75 %, puis l'assaut final possible).
 */
export function resister(e: EtatZones, p: Vecteur3, points: number, t: number): string[] {
  const nom = zoneProche(e, p, t)
  if (!nom) return []
  return ajouterPoints(e, nom, points)
}

/** Ajoute des points à une zone (au plus jusqu'à 100 %) ; renvoie les annonces des paliers franchis. */
export function ajouterPoints(e: EtatZones, nom: string, points: number): string[] {
  const z = zone(nom)
  if (!z || e.liberees.includes(nom)) return []
  const avant = jauge(e, nom)
  e.points[nom] = Math.min(z.seuil, (e.points[nom] ?? 0) + points)
  const apres = jauge(e, nom)
  const franchi = PALIERS_JAUGE.filter((s) => avant < s && apres >= s).pop()
  if (!franchi) return []
  return [franchi < 100 ? `Résistance ${deLa(nom)} : ${franchi} %`
    : `Résistance ${deLa(nom)} : 100 % ! L'assaut contre ${z.amiral} est possible (quête de libération)`]
}

/** Libère une zone (l'assaut final gagné). */
export function liberer(e: EtatZones, nom: string): void {
  if (zone(nom) && !e.liberees.includes(nom)) e.liberees.push(nom)
}

/** Les zones d'un système, et s'il est entièrement libre. */
export function zonesDuSysteme(systeme: string): Zone[] {
  return ZONES_A_LIBERER.filter((z) => z.systeme === systeme)
}
export function systemeLibre(e: EtatZones, systeme: string): boolean {
  return zonesDuSysteme(systeme).every((z) => e.liberees.includes(z.nom))
}

/** « de la Lune », « de Mars », « d'Io ». */
export function deLa(nom: string): string {
  if (['Lune', 'Terre'].includes(nom)) return `de la ${nom}`
  return /^[AEIOUÉÈYH]/i.test(nom) ? `d'${nom}` : `de ${nom}`
}
