// Le catalogue des astres de la carte et leurs positions réelles.
//   - Soleil et planètes : VSOP87B (vsop87.ts) ; Pluton : Meeus (pluton.ts).
//   - Lune : théorie de Meeus ; autres lunes : orbites ajustées sur JPL Horizons (modules du jeu, réutilisés).
//   - Satellites artificiels : SGP4 à partir des orbites publiées (TLE) ; sondes : trajectoires de JPL Horizons.
// Toutes les positions sont héliocentriques, dans l'écliptique J2000, en km. L'affichage ne calcule rien lui-même :
// il demande les positions ici.

import { positionLuneGeocentrique } from '../astro/lune'
import { positionCharon, RAYON_CHARON } from '../astro/charon'
import { positionTLEGeocentrique } from '../astro/iss'
import { LISTE_SATELLITES, positionSatellitePlanetocentrique, type Satellite } from '../astro/satellites'
import { twoline2satrec, type SatRec } from '../astro/sgp4'
import { ENGINS } from '../donnees/engins'
import { ORBITE_ISS_SECOURS } from '../donnees/iss'
import { ALIENS, EPAVES, STATIONS_SYSTEMES, periodeOrbite, type ObjetEnOrbite } from '../donnees/espace'
import { ACCELERATION } from '../donnees/capsule'
import { BOTS } from '../donnees/messages'
import { MONOLITHES } from '../donnees/monolithes'
import { RAPPORT_MASSE_SOLEIL } from '../donnees/planetes'
import { positionPluton } from './pluton'
import { positionSondeRelative, TRAJECTOIRES } from './sondes'
import { MS_PAR_JOUR, TT_MOINS_UTC_MS, UA_KM } from './temps'
import { ajouter, type Vecteur3 } from './vecteur'
import { positionVSOP } from './vsop87'

export type TypeCorps = 'etoile' | 'planete' | 'naine' | 'lune' | 'satellite' | 'sonde' | 'epave' | 'alien' | 'monolithe' | 'joueur'

export interface Corps {
  nom: string
  type: TypeCorps
  /** Astre autour duquel il tourne (null pour le Soleil et ce qui tourne directement autour du Soleil). */
  parent: string | null
  /** Rayon (km) ; 0 s'il est inconnu ou minuscule (dessiné comme un point). */
  rayon: number
  /** Engins : silhouette à dessiner et envergure (m). */
  modele?: string
  tailleM?: number
}

const PLANETES = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'] as const
const RAYONS_PLANETES = [2439.7, 6051.8, 6371.0, 3389.5, 69911, 58232, 25362, 24622]
const RAYON_PLUTON = 1188.3

/** Rapport de masse Soleil / astre (UAI) : sert au rayon de la sphère d'influence. */
const MASSES: Record<string, number> = { ...RAPPORT_MASSE_SOLEIL, Pluton: 136_047_200 }
/** Rapport de masse Soleil / astre, pour les planètes et Pluton. */
export const RAPPORT_MASSE_SOLEIL_ASTRES: Readonly<Record<string, number>> = MASSES
const DEMI_GRANDS_AXES_UA: Record<string, number> = {
  Mercure: 0.387, Vénus: 0.723, Terre: 1, Mars: 1.524, Jupiter: 5.203, Saturne: 9.537, Uranus: 19.19,
  Neptune: 30.07, Pluton: 39.48,
}

// Satellites artificiels de la Terre (orbites TLE).
const ORBITES_TLE = new Map<string, SatRec>([
  ['ISS', twoline2satrec(ORBITE_ISS_SECOURS.ligne1, ORBITE_ISS_SECOURS.ligne2)],
  ...ENGINS.filter((e) => e.tle).map((e) => [e.nom, twoline2satrec(e.tle!.ligne1, e.tle!.ligne2)] as [string, SatRec]),
])

const LUNES = new Map<string, Satellite>(LISTE_SATELLITES.map((s) => [s.nom, s]))
const SONDES = new Map(TRAJECTOIRES.map((t) => [t.nom, t]))

export const CORPS: readonly Corps[] = [
  { nom: 'Soleil', type: 'etoile', parent: null, rayon: 695_700 },
  ...PLANETES.map((nom, i): Corps => ({ nom, type: 'planete', parent: null, rayon: RAYONS_PLANETES[i] })),
  { nom: 'Pluton', type: 'naine', parent: null, rayon: RAYON_PLUTON },
  { nom: 'Lune', type: 'lune', parent: 'Terre', rayon: 1737.4 },
  { nom: 'Charon', type: 'lune', parent: 'Pluton', rayon: RAYON_CHARON },
  ...LISTE_SATELLITES.map((s): Corps => ({ nom: s.nom, type: 'lune', parent: s.planete, rayon: s.rayon ?? 0 })),
  ...[...ORBITES_TLE.keys()].map((nom): Corps => ({ nom, type: 'satellite', parent: 'Terre', rayon: 0, ...gabarit(nom) })),
  ...TRAJECTOIRES.map((t): Corps => ({ nom: t.nom, type: 'sonde', parent: null, rayon: 0, ...gabarit(t.nom) })),
  // Épaves et chasseurs aliens (donnees/espace.ts) : le jeu dit lesquels sont là (vidées, vaincus, repérés au radar).
  ...EPAVES.map((e): Corps => ({ nom: e.nom, type: 'epave', parent: e.parent === 'Soleil' ? null : e.parent, rayon: 0, modele: 'epave', tailleM: 20 })),
  ...ALIENS.map((a): Corps => ({ nom: a.nom, type: 'alien', parent: a.parent === 'Soleil' ? null : a.parent, rayon: 0, modele: 'alien', tailleM: 60 })),
  ...STATIONS_SYSTEMES.map((s): Corps => ({ nom: s.nom, type: 'satellite', parent: s.parent, rayon: 0, modele: 'iss', tailleM: 120 })),
  // Monolithes (donnees/monolithes.ts) : fixes par rapport au Soleil ; sur la carte une fois localisés.
  ...MONOLITHES.map((m): Corps => ({ nom: m.nom, type: 'monolithe', parent: null, rayon: 0, modele: 'monolithe', tailleM: 4 })),
  // Les capsules des autres joueurs (demande d'Adrien du 19/10/2026), en attendant le serveur : celles des bots des
  // Messages, qui vont d'escale en escale.
  // Elles voyagent : pas d'astre « parent » fixe (voir ouEstLeBot).
  ...BOTS.map((b): Corps => ({ nom: b.pseudo, type: 'joueur', parent: null, rayon: 0, modele: 'capsule', tailleM: 8 })),
]
const PLACES_MONOLITHES = new Map(MONOLITHES.map((m) => [m.nom, { x: m.x, y: m.y, z: 0 }]))

/**
 * Génération de chaque chasseur : abattu, il est remplacé par un renfort qui prend sa place dans la flotte, mais
 * ailleurs sur son orbite et avec une autre errance (le jeu la fixe, voir moteur/espace.ts).
 */
export const GENERATIONS_ALIENS = new Map<string, number>()

/** Orbites simples (circulaires, un peu inclinées) des épaves et des aliens. */
const ORBITES_SIMPLES = new Map<string, ObjetEnOrbite>([...EPAVES, ...ALIENS, ...STATIONS_SYSTEMES].map((o) => [o.nom, o]))
function positionOrbiteSimple(o: ObjetEnOrbite, t: number): Vecteur3 {
  const g = o.errance ? GENERATIONS_ALIENS.get(o.nom) ?? 0 : 0
  const a = 2 * Math.PI * (o.phase + 0.618 * g + t / periodeOrbite(o))
  const p = { x: o.rayon * Math.cos(a), y: o.rayon * Math.sin(a), z: o.rayon * o.inclinaison * Math.sin(a) }
  const e = o.errance
  if (!e) return p
  // L'errance d'un chasseur : trois ondulations sans rapport entre elles, sur chaque axe (imprévisible à l'œil).
  const onde = (k: number) => e.periodes.reduce((s, P, i) => s + Math.sin((2 * Math.PI * t) / P + e.phases[3 * k + i] + 1.7 * g) / (i + 1), 0) / 1.83
  return { x: p.x + e.amplitude * onde(0), y: p.y + e.amplitude * onde(1), z: p.z + 0.2 * e.amplitude * onde(2) }
}

/** Silhouette et envergure d'un engin (l'ISS fait 109 m ; les autres d'après les fiches du jeu). */
function gabarit(nom: string): { modele: string; tailleM: number } {
  if (nom === 'ISS') return { modele: 'iss', tailleM: 109 }
  const fiche = ENGINS.find((e) => e.nom === nom)
  return { modele: fiche?.modele ?? 'sonde', tailleM: fiche?.tailleM ?? 10 }
}

/** Période orbitale d'un satellite artificiel (jours), d'après son orbite publiée. */
export function periodeSatellite(nom: string): number | undefined {
  const o = ORBITES_TLE.get(nom)
  return o ? (2 * Math.PI) / o.no / 1440 : undefined
}

const PAR_NOM = new Map(CORPS.map((c) => [c.nom, c]))

export function corps(nom: string): Corps | undefined {
  return PAR_NOM.get(nom)
}

/** Astres qui tournent autour d'un astre donné. */
export function enfants(nom: string): Corps[] {
  return CORPS.filter((c) => c.parent === nom)
}

/** Astres « de premier niveau » : Soleil, planètes, Pluton, sondes. */
export const PREMIER_NIVEAU: readonly Corps[] = CORPS.filter((c) => c.parent === null)

/** Distance maximale d'un enfant à son astre (km) : sert à ne calculer les lunes que si leur système est à l'écran. */
export const RAYON_SYSTEME: ReadonlyMap<string, number> = (() => {
  const m = new Map<string, number>()
  for (const s of LISTE_SATELLITES) {
    const loin = Math.max(...s.tranches.map((t) => t[2] * (1 + t[3])))
    m.set(s.planete, Math.max(m.get(s.planete) ?? 0, loin))
  }
  m.set('Terre', Math.max(m.get('Terre') ?? 0, 410_000))
  return m
})()

// --- Les capsules des autres joueurs (les bots, en attendant le serveur) ---
// Décision d'Adrien du 19/10/2026 : elles voyagent. Chaque bot va d'escale en escale (donnees/messages.ts) : il reste
// quelques heures en orbite, puis vole vers la suivante comme la capsule du joueur (20 g, puis la vitesse max de son
// moteur, puis freinage). Tout se déduit de l'heure : le même ciel pour tous.

/** Début des itinéraires (avant, chacun est à son port d'attache). */
const DEBUT_ITINERAIRES = Date.UTC(2026, 9, 1)

/** Une escale d'un bot : où, quand il y arrive et quand il en repart (ms UTC). */
interface Escale { lieu: string; arrivee: number; depart: number }

const ITINERAIRES = new Map(BOTS.map((b, k) => [b.pseudo, { k, bot: b, escales: [] as Escale[] }]))

/** Hasard reproductible d'un bot pour son escale n : entre 0 et 1. */
function hasardBot(k: number, n: number): number {
  const x = Math.sin((k + 1) * 12.9898 + (n + 1) * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Durée (ms) d'un vol de L km à la vitesse max v (km/s), à 20 g, à l'arrêt au départ et à l'arrivée. */
function dureeVol(L: number, v: number): number {
  return 1000 * (L >= (v * v) / ACCELERATION ? L / v + v / ACCELERATION : 2 * Math.sqrt(L / ACCELERATION))
}

/** Écart de la capsule d'un bot autour de l'astre où il fait escale (km), sur une orbite à lui. */
function orbiteBot(k: number, lieu: string, t: number): Vecteur3 {
  const R = PAR_NOM.get(lieu)?.rayon || 1000
  const rayon = Math.max(2.2 * R, R + 600) * (1 + 0.15 * (k % 3))
  const periode = (3 + (k % 5) * 0.7) * 3_600_000
  const a = 2 * Math.PI * (0.137 * k + t / periode)
  return { x: rayon * Math.cos(a), y: rayon * Math.sin(a), z: 0.2 * rayon * Math.sin(a + k) }
}

/** Les escales d'un bot jusqu'à l'instant t (calculées une fois, puis prolongées au besoin). */
function escalesJusqua(pseudo: string, t: number): Escale[] {
  const it = ITINERAIRES.get(pseudo)!
  const l = it.escales
  if (!l.length) l.push({ lieu: it.bot.escales[0], arrivee: DEBUT_ITINERAIRES, depart: DEBUT_ITINERAIRES + (6 + 18 * hasardBot(it.k, 0)) * 3_600_000 })
  while (l[l.length - 1].depart <= t) {
    const n = l.length, prec = l[n - 1]
    const autres = it.bot.escales.filter((e) => e !== prec.lieu)
    const lieu = autres[Math.floor(hasardBot(it.k, n) * autres.length) % autres.length]
    const a = ajouter(position(prec.lieu, prec.depart), orbiteBot(it.k, prec.lieu, prec.depart))
    const b = position(lieu, prec.depart)
    const arrivee = prec.depart + dureeVol(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z), it.bot.vitesse)
    // Une escale de 4 à 30 heures.
    l.push({ lieu, arrivee, depart: arrivee + (4 + 26 * hasardBot(it.k, n + 100)) * 3_600_000 })
  }
  return l
}

/** Où est un bot à l'instant t : à une escale (lieu), ou en route (de, vers, avancement de 0 à 1). */
export function ouEstLeBot(pseudo: string, t: number): { lieu: string; enRoute: false } | { de: string; vers: string; enRoute: true; part: number } {
  const it = ITINERAIRES.get(pseudo)!
  if (t < DEBUT_ITINERAIRES) return { lieu: it.bot.escales[0], enRoute: false }
  const l = escalesJusqua(pseudo, t)
  let i = l.length - 1
  while (i > 0 && l[i].arrivee > t) i--
  if (t < l[i].depart || i === l.length - 1) return { lieu: l[i].lieu, enRoute: false }
  const suivante = l[i + 1]
  return { de: l[i].lieu, vers: suivante.lieu, enRoute: true, part: (t - l[i].depart) / (suivante.arrivee - l[i].depart) }
}

/** Position héliocentrique de la capsule d'un bot (km), ou null si ce n'est pas un bot. */
function positionBot(pseudo: string, t: number): Vecteur3 | null {
  const it = ITINERAIRES.get(pseudo)
  if (!it) return null
  const ou = ouEstLeBot(pseudo, t)
  if (!ou.enRoute) return ajouter(position(ou.lieu, t), orbiteBot(it.k, ou.lieu, t))
  // En route : en ligne droite, de son orbite de départ au rendez-vous avec l'escale suivante (profil 20 g).
  const l = escalesJusqua(pseudo, t)
  let i = l.length - 2
  while (i > 0 && l[i].depart > t) i--
  const de = l[i], vers = l[i + 1]
  const a = ajouter(position(de.lieu, de.depart), orbiteBot(it.k, de.lieu, de.depart))
  const b = ajouter(position(vers.lieu, vers.arrivee), orbiteBot(it.k, vers.lieu, vers.arrivee))
  const T = (vers.arrivee - de.depart) / 1000, s = (t - de.depart) / 1000
  const v = Math.min(it.bot.vitesse, (ACCELERATION * T) / 2), ta = v / ACCELERATION, L = v * (T - ta)
  const f = s < ta ? (ACCELERATION * s * s) / 2 / L : s > T - ta ? 1 - (ACCELERATION * (T - s) * (T - s)) / 2 / L : (v * ta / 2 + v * (s - ta)) / L
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f }
}

/** Position relative au parent (km), pour un astre qui a un parent. */
export function positionRelative(nom: string, t: number): Vecteur3 {
  if (nom === 'Lune') return positionLuneGeocentrique(t + TT_MOINS_UTC_MS)
  if (nom === 'Charon') return positionCharon(t)
  const simple = ORBITES_SIMPLES.get(nom)
  if (simple) return positionOrbiteSimple(simple, t)
  const lune = LUNES.get(nom)
  if (lune) return positionSatellitePlanetocentrique(lune, t)
  const orbite = ORBITES_TLE.get(nom)
  if (orbite) {
    try {
      return positionTLEGeocentrique(orbite, t)
    } catch {
      // Orbite trop ancienne pour SGP4 : on rejoue la dernière année (position simulée, le temps du prototype).
      const epoque = (orbite.jdsatepoch - 2440587.5) * MS_PAR_JOUR
      const an = 365 * MS_PAR_JOUR
      return positionTLEGeocentrique(orbite, epoque + (((t - epoque) % an) + an) % an)
    }
  }
  throw new Error(`Astre sans parent ou inconnu : ${nom}`)
}

// Mémoire des positions des derniers instants demandés : dans une même image, la carte demande souvent les mêmes
// astres plusieurs fois, à l'instant présent et une minute plus tard (pour coucher les orbites dans le plan) ; VSOP87
// coûte quelques milliers de cosinus par planète.
const INSTANTS_MEMORISES = 4
const memoire = new Map<number, Map<string, Vecteur3>>()

/** Position héliocentrique d'un astre (écliptique J2000, km) à l'instant t (ms UTC). */
export function position(nom: string, t: number): Vecteur3 {
  let m = memoire.get(t)
  if (!m) {
    if (memoire.size >= INSTANTS_MEMORISES) memoire.delete(memoire.keys().next().value!)
    m = new Map()
    memoire.set(t, m)
  }
  let p = m.get(nom)
  if (!p) { p = calculerPosition(nom, t); m.set(nom, p) }
  return p
}

function calculerPosition(nom: string, t: number): Vecteur3 {
  if (nom === 'Soleil') return { x: 0, y: 0, z: 0 }
  if (nom === 'Pluton') return positionPluton(t)
  const fixe = PLACES_MONOLITHES.get(nom)
  if (fixe) return fixe
  const bot = positionBot(nom, t)
  if (bot) return bot
  // En plein espace (épaves, chasseurs) : leur orbite autour du Soleil.
  const simple = ORBITES_SIMPLES.get(nom)
  if (simple?.parent === 'Soleil') return positionOrbiteSimple(simple, t)
  const c = PAR_NOM.get(nom)
  if (!c) throw new Error(`Astre inconnu : ${nom}`)
  if (c.type === 'planete') return positionVSOP(nom, t)
  const sonde = SONDES.get(nom)
  if (sonde) return ajouter(position(sonde.centre, t), positionSondeRelative(sonde, t))
  return ajouter(position(c.parent!, t), positionRelative(nom, t))
}

/** Rayon de la sphère d'influence (rayon de Hill, km) d'une planète ou de Pluton : a × (m / 3M)^(1/3). */
export function rayonInfluence(nom: string): number {
  return DEMI_GRANDS_AXES_UA[nom] * UA_KM * (1 / (3 * MASSES[nom])) ** (1 / 3)
}

/**
 * Astre dans la sphère d'influence duquel se trouve un point (planète ou Pluton), sinon le Soleil.
 * La caméra s'y accroche, pour suivre l'astre dans son mouvement autour du Soleil.
 */
export function astreDominant(p: { x: number; y: number }, t: number): string {
  let meilleur = 'Soleil'
  let rapport = 1
  for (const nom of [...PLANETES, 'Pluton']) {
    const c = position(nom, t)
    const r = Math.hypot(p.x - c.x, p.y - c.y) / rayonInfluence(nom)
    if (r < rapport) { meilleur = nom; rapport = r }
  }
  return meilleur
}
