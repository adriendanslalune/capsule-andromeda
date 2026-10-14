// Trophées : le catalogue complet (un par astre — Soleil, planètes, Lune, chaque satellite —, un par engin, et les
// paliers de src/donnees/trophees.ts), et leur attribution. Ils ne rapportent rien.

import { NOMS_ENGINS, ficheEngin } from '../astro/engins'
import { satellitesDe } from '../astro/satellites'
import { INSTRUMENTS, MODULES_A_INSTALLER } from '../donnees/economie'
import { NOMS_PLANETES, type NomPlanete } from '../donnees/planetes'
import {
  PALIERS_AVARIES, PALIERS_CONTRATS, PALIERS_CREDITS, PALIERS_ELOIGNEMENT, PALIERS_MOTEUR, PALIERS_PROXIMITE, PALIERS_ROUTE,
  PALIERS_SERVICE, PALIERS_TELEGRAMMES, PALIERS_TROUVAILLES, PALIERS_VISITES, PALIERS_VITESSE, type Palier,
} from '../donnees/trophees'
import type { EtatPartie } from './etat'
import { vitesse } from './fusee'

export type CategorieTrophee = 'astres' | 'satellites' | 'engins' | 'voyages' | 'mecanique' | 'office' | 'bord' | 'collections' | 'chasse'
export type IconeTrophee = 'soleil' | 'planete' | 'satellite' | 'engin' | 'compteur' | 'collection' | 'premier' | 'kuiper' | 'helio' | 'voyager' | 'contact'

export interface Trophee {
  id: string
  nom: string
  description: string
  categorie: CategorieTrophee
  /** Sous-groupe (pour les satellites : la planète). */
  groupe?: string
  icone: IconeTrophee
  /** Couleur de l'astre, ou texte court inscrit sur la médaille (« 1 M », « ×50 »…). */
  couleur?: string
  texte?: string
}

export const COULEURS_ASTRES: Readonly<Record<string, string>> = {
  Soleil: '#f2b53a', Mercure: '#cfc6b6', Vénus: '#efdfae', Terre: '#7fa4cf', Mars: '#e07a5c', Jupiter: '#dcb184',
  Saturne: '#e6cf92', Uranus: '#a9d2d6', Neptune: '#7f9fd6', Lune: '#cfc8b8',
}

/** Nombre court pour une médaille : 100 000 → « 100 k », 1 000 000 → « 1 M », 1e9 → « 1 Md ». */
function court(n: number): string {
  if (n >= 1e9) return `${n / 1e9} Md`
  if (n >= 1e6) return `${n / 1e6} M`
  if (n >= 1e4) return `${n / 1e3} k`
  return String(n)
}

const LIEUX: Readonly<Record<string, string>> = { Mercure: 'Mercure', Vénus: 'Vénus', Terre: 'la Terre', Mars: 'Mars' }
const SYSTEMES_A_SATELLITES = ['Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'] as const

function paliers(prefixe: string, liste: readonly Palier[], categorie: CategorieTrophee, texte: (n: number) => string): Trophee[] {
  return liste.map((p) => ({ id: `${prefixe}:${p.seuil}`, nom: p.nom, description: p.description, categorie, icone: 'compteur' as const, texte: texte(p.seuil) }))
}

function construire(): Trophee[] {
  const l: Trophee[] = []
  // Astres.
  l.push({ id: 'astre:Soleil', nom: 'Le Soleil', description: 'Atteindre le Soleil', categorie: 'astres', icone: 'soleil', couleur: COULEURS_ASTRES.Soleil })
  for (const p of NOMS_PLANETES) {
    l.push({ id: `astre:${p}`, nom: p, description: `Atteindre ${LIEUX[p] ?? p}`, categorie: 'astres', icone: 'planete', couleur: COULEURS_ASTRES[p] })
  }
  l.push({ id: 'astre:Lune', nom: 'La Lune', description: 'Atteindre la Lune', categorie: 'astres', icone: 'planete', couleur: COULEURS_ASTRES.Lune })
  for (const p of SYSTEMES_A_SATELLITES) {
    for (const s of satellitesDe(p)) {
      l.push({ id: `astre:${s.nom}`, nom: s.nom, description: `Satellite de ${p}`, categorie: 'satellites', groupe: p, icone: 'satellite', couleur: COULEURS_ASTRES[p] })
    }
  }
  // Engins.
  l.push({ id: 'engin:ISS', nom: 'ISS', description: 'Station spatiale internationale', categorie: 'engins', icone: 'engin' })
  for (const n of NOMS_ENGINS) l.push({ id: `engin:${n}`, nom: n, description: ficheEngin(n)!.description, categorie: 'engins', icone: 'engin' })
  // Voyages.
  l.push(...paliers('route', PALIERS_ROUTE, 'voyages', (n) => court(n)))
  for (const p of PALIERS_ELOIGNEMENT) {
    const icone = p.id === 'kuiper' || p.id === 'helio' || p.id === 'voyager' ? p.id : 'compteur'
    l.push({ id: p.id, nom: p.nom, description: p.description, categorie: 'voyages', icone, texte: `${p.seuil} UA` })
  }
  for (const p of PALIERS_PROXIMITE) l.push({ id: p.id, nom: p.nom, description: p.description, categorie: 'voyages', icone: 'soleil', couleur: COULEURS_ASTRES.Soleil })
  // Mécanique.
  l.push(...paliers('avaries', PALIERS_AVARIES, 'mecanique', (n) => `×${court(n)}`))
  l.push(...paliers('moteur', PALIERS_MOTEUR, 'mecanique', (n) => `+${n}`))
  l.push(...paliers('vitesse', PALIERS_VITESSE, 'mecanique', (n) => court(n)))
  l.push({ id: 'modules-tous', nom: 'Fusée complète', description: 'Installer tous les modules', categorie: 'mecanique', icone: 'collection' })
  l.push({ id: 'instruments-tous', nom: 'Panoplie du chasseur', description: 'Installer tous les instruments de chasse', categorie: 'mecanique', icone: 'collection' })
  // Office.
  for (const t of paliers('contrats', PALIERS_CONTRATS, 'office', (n) => `×${n}`)) {
    l.push(t.id === 'contrats:1' ? { ...t, id: 'premier', icone: 'premier' } : t)
  }
  l.push(...paliers('credits', PALIERS_CREDITS, 'office', (n) => `${court(n)} CR`))
  // Bord.
  l.push(...paliers('service', PALIERS_SERVICE, 'bord', (n) => `${n} j`))
  l.push(...paliers('telegrammes', PALIERS_TELEGRAMMES, 'bord', (n) => `×${n}`))
  // Collections.
  l.push({ id: 'grand-tour', nom: 'Grand Tour', description: 'Atteindre les huit planètes', categorie: 'collections', icone: 'collection' })
  l.push({ id: 'systeme:Terre', nom: 'Chez soi', description: 'La Terre, la Lune et l’ISS', categorie: 'collections', icone: 'collection' })
  for (const p of SYSTEMES_A_SATELLITES) {
    l.push({ id: `systeme:${p}`, nom: `Système de ${p}`, description: `${p} et ses ${satellitesDe(p).length} satellites`, categorie: 'collections', icone: 'collection' })
  }
  l.push({ id: 'tous-engins', nom: 'Musée de l’espace', description: `Approcher les ${NOMS_ENGINS.length + 1} engins`, categorie: 'collections', icone: 'collection' })
  l.push(...paliers('visites', PALIERS_VISITES, 'collections', (n) => `×${n}`))
  // Chasse.
  l.push({ id: 'contact', nom: 'Premier contact', description: 'Photographier le visiteur', categorie: 'chasse', icone: 'contact' })
  l.push(...paliers('trouvailles', PALIERS_TROUVAILLES, 'chasse', (n) => `×${n}`))
  return l
}

/** Tous les trophées, dans l'ordre de la vitrine. */
export const CATALOGUE_TROPHEES: readonly Trophee[] = construire()

/** Trophées d'une arrivée : l'astre ou l'engin (l'ISS est un engin). */
export function tropheesDArrivee(astre: string): string[] {
  if (astre === 'ISS') return ['engin:ISS']
  return NOMS_ENGINS.includes(astre) ? [`engin:${astre}`] : [`astre:${astre}`]
}

/** Identifiants des premières versions du jeu. */
const ANCIENS: Readonly<Record<string, string>> = { mars: 'astre:Mars', jupiter: 'astre:Jupiter', neptune: 'astre:Neptune' }

/**
 * Met à jour les records (éloignement et proximité du Soleil) et attribue les trophées de palier et de collection.
 * Les trophées d'arrivée sont attribués par tropheesDArrivee, à l'arrivée.
 */
export function verifierTropheesPaliers(etat: EtatPartie): EtatPartie {
  const f = etat.fusee
  const dSoleil = Math.hypot(f.position.x + (f.ecartOrbite?.x ?? 0), f.position.y + (f.ecartOrbite?.y ?? 0))
  const s = etat.stats
  const stats = {
    ...s,
    distanceMaxSoleil: Math.max(s.distanceMaxSoleil, dSoleil),
    distanceMinSoleil: Math.min(s.distanceMinSoleil ?? Infinity, dSoleil),
  }
  const avant = new Set(etat.trophees.map((id) => ANCIENS[id] ?? id))
  const ont = new Set(avant)
  const si = (id: string, ok: boolean) => { if (ok) ont.add(id) }
  // Lieux déjà visités : là où la fusée est en orbite, et les destinations des contrats remplis (parties d'avant
  // les trophées d'astres).
  if (f.orbite) for (const id of tropheesDArrivee(f.orbite)) ont.add(id)
  for (const c of etat.contratsAccomplis ?? []) for (const id of tropheesDArrivee(c.destination)) ont.add(id)
  for (const p of PALIERS_ROUTE) si(`route:${p.seuil}`, f.distanceParcourue >= p.seuil)
  for (const p of PALIERS_ELOIGNEMENT) si(p.id, stats.distanceMaxSoleil >= p.seuil)
  for (const p of PALIERS_PROXIMITE) si(p.id, stats.distanceMinSoleil <= p.seuil)
  for (const p of PALIERS_AVARIES) si(`avaries:${p.seuil}`, s.pannes >= p.seuil)
  for (const p of PALIERS_MOTEUR) si(`moteur:${p.seuil}`, etat.ameliorations >= p.seuil)
  const croisiere = vitesse({ ameliorations: etat.ameliorations, levierAAbaisse: false, avarie: false })
  for (const p of PALIERS_VITESSE) si(`vitesse:${p.seuil}`, croisiere >= p.seuil)
  si('modules-tous', MODULES_A_INSTALLER.every((m) => etat.modulesInstalles.includes(m.code)))
  si('instruments-tous', INSTRUMENTS.every((m) => etat.modulesInstalles.includes(m.code)))
  for (const p of PALIERS_CONTRATS) si(p.seuil === 1 ? 'premier' : `contrats:${p.seuil}`, s.contrats >= p.seuil)
  for (const p of PALIERS_CREDITS) si(`credits:${p.seuil}`, etat.credits >= p.seuil)
  const jours = (etat.vu - etat.creeLe) / 86_400_000
  for (const p of PALIERS_SERVICE) si(`service:${p.seuil}`, jours >= p.seuil)
  for (const p of PALIERS_TELEGRAMMES) si(`telegrammes:${p.seuil}`, (s.telegrammes ?? 0) >= p.seuil)
  // Collections.
  si('grand-tour', NOMS_PLANETES.every((p) => ont.has(`astre:${p}`)))
  si('systeme:Terre', ['astre:Terre', 'astre:Lune', 'engin:ISS'].every((id) => ont.has(id)))
  for (const p of SYSTEMES_A_SATELLITES) si(`systeme:${p}`, ont.has(`astre:${p}`) && satellitesDe(p as NomPlanete).every((x) => ont.has(`astre:${x.nom}`)))
  si('tous-engins', ont.has('engin:ISS') && NOMS_ENGINS.every((n) => ont.has(`engin:${n}`)))
  const visites = [...ont].filter((id) => id.startsWith('astre:') || id.startsWith('engin:')).length
  for (const p of PALIERS_VISITES) si(`visites:${p.seuil}`, visites >= p.seuil)
  for (const p of PALIERS_TROUVAILLES) si(`trouvailles:${p.seuil}`, etat.chasse.trouvailles.length >= p.seuil)

  const changeStats = stats.distanceMaxSoleil !== s.distanceMaxSoleil || stats.distanceMinSoleil !== s.distanceMinSoleil
  const changeTrophees = ont.size !== etat.trophees.length || etat.trophees.some((id) => ANCIENS[id])
  const quand = etat.tropheesQuand
  const sansDate = !quand || [...ont].some((id) => quand[id] === undefined)
  if (!changeStats && !changeTrophees && !sansDate) return etat
  // Ordre d'obtention conservé : les anciens d'abord, les nouveaux à la suite.
  const ordre = [...avant, ...[...ont].filter((id) => !avant.has(id))]
  // Date d'obtention de chaque trophée (pour les classements de la semaine et du mois). Ceux des sauvegardes
  // d'avant les dates comptent comme obtenus à la mise en service de la fusée.
  const dates: Record<string, number> = { ...(quand ?? Object.fromEntries(etat.trophees.map((id) => [ANCIENS[id] ?? id, etat.creeLe]))) }
  for (const id of ordre) if (dates[id] === undefined) dates[id] = etat.vu
  return { ...etat, stats, trophees: changeTrophees ? ordre : etat.trophees, tropheesQuand: dates }
}

/** Trophées obtenus depuis l'instant debut. */
export function tropheesDepuis(etat: EtatPartie, debut: number): number {
  const q = etat.tropheesQuand ?? {}
  return etat.trophees.filter((id) => (q[id] ?? etat.creeLe) >= debut).length
}

export type PeriodeClassement = 'semaine' | 'mois' | 'general'

/** Début de la période de classement contenant t : lundi 00:00 UTC, 1er du mois 00:00 UTC, ou le début des temps. */
export function debutPeriode(periode: PeriodeClassement, t: number): number {
  const d = new Date(t)
  if (periode === 'mois') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  if (periode === 'semaine') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return -Infinity
}
