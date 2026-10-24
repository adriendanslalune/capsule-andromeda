// Les trophées (idée d'Adrien du 24/10/2026, liste validée le même jour ; données : donnees/trophees.ts). Le jeu tient
// des compteurs (Stats) que ses actions font monter ; une fois par seconde, il regarde quels trophées sont gagnés. Un
// trophée gagné l'est pour toujours, avec sa date ; sa petite fenêtre vient après les autres. Aucune récompense : la
// gloire seulement. Les compteurs ne partent que du jour où les trophées sont arrivés (rien de rétroactif, sauf ce que
// la sauvegarde savait déjà : contrats finis, objets triés, collections, niveau…).

import type { Jeu } from './jeu'
import { TROPHEES } from '../donnees/trophees'
import { CAPACITE_SOUTE, MARCHANDISES } from '../donnees/marche'
import { NIVEAU_ARMEMENT_MAX } from '../donnees/combat'
import { ZONES_A_LIBERER } from '../donnees/zones'
import { HALLEY } from '../donnees/petits-corps'
import { NOMBRE_VOIX, VOIX_PAR_SYSTEME } from '../donnees/radio'
import { VOIX } from './radio'
import { NOMBRE_MONOLITHES } from '../donnees/monolithes'
import { DISPARUS } from '../donnees/disparus'
import { corps } from './corps'
import { niveauDe } from './niveau'
import { zoneDuLieu } from './zones'

const HEURE = 3_600_000, JOUR = 24 * HEURE
/** Une unité astronomique (km). */
const UA = 149_597_870.7

/** Les compteurs des trophées. */
export interface Stats {
  /** Compteurs et drapeaux (1 : fait), par nom. */
  n: Record<string, number>
  /** Ensembles (lieux où l'on a été en orbite, systèmes, comptoirs…), par nom. */
  ens: Record<string, string[]>
  /** Où la capsule est en orbite, et depuis quand (null : en vol). */
  ici: { lieu: string; depuis: number } | null
  /** Le dernier jour (local) où le jeu a tourné, et combien de jours de suite. */
  jours: { dernier: number; suite: number }
  /** Le dernier trajet fini : d'où, vers où, départ (pour l'aller-retour). */
  dernierTrajet: { de: string; a: string; depart: number } | null
  /** Les derniers impacts de missile (ms UTC). */
  impacts: number[]
  /** Les capitaines bavards croisés sur la même orbite : canal privé → quand. */
  passages: Record<string, number>
  /** Le dernier passage en orbite dans le système de la Terre (ms UTC). */
  terre: number
  /** La naissance de la capsule (le jour où les trophées l'ont connue). */
  naissance: number
}

export const statsNeuves = (t = 0): Stats => ({ n: {}, ens: {}, ici: null, jours: { dernier: 0, suite: 0 }, dernierTrajet: null, impacts: [], passages: {}, terre: t, naissance: t })

/** Ajoute n à un compteur. */
export function noter(s: Stats, cle: string, n = 1): void {
  s.n[cle] = (s.n[cle] ?? 0) + n
}
/** Met une valeur dans un ensemble (une seule fois). */
export function ajouter(s: Stats, cle: string, valeur: string): void {
  const l = (s.ens[cle] ??= [])
  if (!l.includes(valeur)) l.push(valeur)
}
const compte = (s: Stats, cle: string) => s.n[cle] ?? 0
const dans = (s: Stats, cle: string, valeur: string) => !!s.ens[cle]?.includes(valeur)
const taille = (s: Stats, cle: string) => s.ens[cle]?.length ?? 0

/** Le jour local (le fuseau du téléphone) d'un instant. */
const jourLocal = (t: number) => { const d = new Date(t); return Math.floor((t - d.getTimezoneOffset() * 60_000) / JOUR) }

const PLANETES = ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune']
const GRANDES_LUNES = ZONES_A_LIBERER.filter((z) => !z.planete && z.nom !== 'Pluton').map((z) => z.nom)
const COMETES = ['Comète Hale-Bopp', 'Comète d\'Encke', 'Comète 67P', HALLEY]
const numeroDisparu = (nom: string) => DISPARUS.find((d) => d.nom === nom)?.numero ?? -1

const contrats = (j: Jeu) => Object.values(j.carnet.missions).reduce((a, b) => a + b, 0)
const orbite = (j: Jeu, lieu: string) => dans(j.stats, 'lieux', lieu)
const lunes = (j: Jeu) => (j.stats.ens.lieux ?? []).filter((x) => corps(x)?.type === 'lune').length
const heureLocale = (t: number) => new Date(t).getHours()
/** Le carnet d'un système est-il complet (toutes ses voix enregistrées) ? */
const carnetComplet = (j: Jeu) => Object.entries(VOIX_PAR_SYSTEME).some(([s, n]) => VOIX.filter((v) => v.systeme === s && j.radio.captees.includes(v.numero)).length >= n)

/** Ce qui déclenche chaque trophée (par numéro ; voir docs/trophees.md). */
export const CONDITIONS: Readonly<Record<number, (j: Jeu, t: number) => boolean>> = {
  // Voyage
  1: (j) => compte(j.stats, 'trajets') >= 1,
  2: (j) => orbite(j, 'Lune'),
  3: (j) => orbite(j, 'Mars'),
  4: (j) => orbite(j, 'Vénus'),
  5: (j) => orbite(j, 'Mercure'),
  6: (j) => orbite(j, 'Jupiter'),
  7: (j) => orbite(j, 'Saturne'),
  8: (j) => orbite(j, 'Uranus'),
  9: (j) => orbite(j, 'Neptune'),
  10: (j) => orbite(j, 'Pluton'),
  // La capsule naît autour de la Terre (près de l'ISS) : elle compte d'office.
  11: (j) => PLANETES.every((p) => p === 'Terre' || orbite(j, p)),
  12: (j) => lunes(j) >= 10,
  13: (j) => GRANDES_LUNES.every((l) => orbite(j, l)),
  14: (j, t) => !!j.stats.ici && t - j.stats.ici.depuis >= 7 * JOUR,
  15: (j) => compte(j.stats, 'trajetLong') >= 1,
  16: (j) => compte(j.stats, 'trajets') >= 100,
  17: (j) => compte(j.stats, 'trajets') >= 1000,
  18: (j) => compte(j.stats, 'km') >= UA,
  19: (j) => compte(j.stats, 'km') >= 100 * UA,
  20: (j) => compte(j.stats, 'vitesseMax10') >= 1,
  21: (j) => j.niveauMoteur >= 2,
  22: (j) => j.niveauMoteur >= 10,
  23: (j) => compte(j.stats, 'allerRetour') >= 1,
  24: (j) => compte(j.stats, 'caps') >= 3,
  25: (j) => compte(j.stats, 'retourTerre') >= 1,
  // Contrats
  26: (j) => contrats(j) >= 1,
  27: (j) => contrats(j) >= 25,
  28: (j) => contrats(j) >= 100,
  29: (j) => contrats(j) >= 500,
  30: (j) => j.carnet.objetsTries >= 1000,
  31: (j) => j.carnet.objetsTries >= 10_000,
  32: (j) => compte(j.stats, 'triParfait') >= 1,
  33: (j) => compte(j.stats, 'triRate') >= 1,
  34: (j) => compte(j.stats, 'harponPremier') >= 1,
  35: (j) => compte(j.stats, 'genre:remorquer') >= 25,
  36: (j) => compte(j.stats, 'harponRicochets') >= 1,
  37: (j) => compte(j.stats, 'amarrageParfait') >= 1,
  38: (j) => compte(j.stats, 'genre:livrer') >= 25,
  39: (j) => compte(j.stats, 'rebonds') >= 1,
  40: (j) => compte(j.stats, 'depannageParfait') >= 1,
  41: (j) => compte(j.stats, 'genre:depanner') >= 25,
  42: (j) => compte(j.stats, 'manuelDepannage') >= 10,
  43: (j) => compte(j.stats, 'escorteParfaite') >= 1,
  44: (j) => compte(j.stats, 'genre:escorter') >= 25,
  45: (j) => compte(j.stats, 'cargosEgares') >= 1,
  46: (j) => compte(j.stats, 'genre:chasser') >= 25,
  47: (j) => ['nettoyer', 'remorquer', 'chasser', 'escorter', 'depanner', 'livrer'].every((g) => compte(j.stats, `genre:${g}`) >= 1),
  48: (j) => taille(j.stats, 'systemes') >= 9,
  49: (j) => compte(j.stats, 'primes') >= 10,
  50: (j) => compte(j.stats, 'primes') >= 100,
  51: (j) => compte(j.stats, 'abandons') >= 10,
  52: (j) => j.maison === 'nettoyeurs',
  53: (j) => j.maison === 'ingenieurs',
  54: (j) => j.maison === 'mercenaires',
  55: (j) => compte(j.stats, 'changementsMaison') >= 3,
  // Combat et pannes
  56: (j) => compte(j.stats, 'chasseurs') >= 1,
  57: (j) => compte(j.stats, 'chasseurs') >= 5,
  58: (j) => compte(j.stats, 'chasseurs') >= 100,
  59: (j) => compte(j.stats, 'chasseurs') >= 1000,
  60: (j) => compte(j.stats, 'combatParfait') >= 1,
  61: (j) => compte(j.stats, 'bombesVite') >= 1,
  62: (j) => compte(j.stats, 'victoiresSansBombe') >= 20,
  63: (j) => compte(j.stats, 'surUnFil') >= 1,
  64: (j) => compte(j.stats, 'retraites') >= 1,
  65: (j) => j.zones.liberees.length >= 1,
  66: (j) => ['Mars', 'Vénus', 'Mercure'].every((z) => j.zones.liberees.includes(z)),
  67: (j) => j.zones.liberees.length >= 10,
  68: (j) => j.zones.liberees.includes('Triton'),
  69: (j) => ZONES_A_LIBERER.every((z) => j.zones.liberees.includes(z.nom)),
  70: (j) => compte(j.stats, 'reperes') >= 50,
  71: (j) => compte(j.stats, 'interceptions') >= 1,
  72: (j) => compte(j.stats, 'interceptions') >= 100,
  73: (j, t) => j.stats.impacts.filter((x) => t - x < JOUR).length >= 3,
  74: (j) => compte(j.stats, 'reparations') >= 1,
  75: (j) => compte(j.stats, 'reparations') >= 100,
  76: (j) => j.pannes.length >= 4,
  77: (j) => compte(j.stats, 'depanneur') >= 1,
  // Argent, Comptoir et Bourse
  78: (j) => j.credits >= 1000,
  79: (j) => j.credits >= 100_000,
  80: (j) => j.credits >= 1_000_000,
  81: (j) => j.credits <= 0 && compte(j.stats, 'creditsMax') >= 1000,
  82: (j) => compte(j.stats, 'tonnesVendues') >= 100,
  83: (j) => j.chargeSoute() >= CAPACITE_SOUTE - 1e-6,
  84: (j) => taille(j.stats, 'comptoirs') >= 5,
  85: (j) => (j.soute['Hélium 3'] ?? 0) >= 10,
  86: (j) => compte(j.stats, 'ordres') >= 1,
  87: (j) => Object.keys(j.bourse.positions).length >= 3,
  88: (j) => Object.keys(j.bourse.positions).length >= 9,
  89: (j) => compte(j.stats, 'gainsBourse') >= 10_000,
  90: (j) => compte(j.stats, 'grossePerte') >= 1,
  91: (j) => compte(j.stats, 'initie') >= 1,
  92: (j) => compte(j.stats, 'ordreLointain') >= 1,
  93: (j) => compte(j.stats, 'toutSurLeRouge') >= 1,
  94: (j) => compte(j.stats, 'frais') >= 1000,
  95: (j) => Object.values(j.armement).every((n) => n >= 2),
  96: (j) => Object.values(j.armement).every((n) => n >= NIVEAU_ARMEMENT_MAX),
  97: (j) => MARCHANDISES.every((m) => (j.soute[m.nom] ?? 0) >= 1),
  // Collections
  98: (j) => j.monolithes.trouves.length >= 1,
  99: (j) => j.monolithes.trouves.length >= 10,
  100: (j) => j.monolithes.trouves.length >= 50,
  101: (j) => j.monolithes.trouves.length >= 100,
  102: (j) => j.monolithes.trouves.length >= NOMBRE_MONOLITHES,
  103: (j) => compte(j.stats, 'pings') >= 100,
  104: (j) => compte(j.stats, 'triangulation') >= 1,
  105: (j) => j.radio.captees.length >= 1,
  106: (j) => j.radio.captees.length >= 25,
  107: (j) => compte(j.stats, 'voixNocturne') >= 1,
  108: (j) => j.radio.captees.length >= NOMBRE_VOIX,
  109: (j) => carnetComplet(j),
  110: (j) => Object.keys(j.disparus.trouves).length >= 1,
  111: (j) => Object.keys(j.disparus.trouves).length >= 10,
  112: (j) => Object.keys(j.disparus.trouves).length >= DISPARUS.length,
  113: (j) => numeroDisparu('Pioneer 10') in j.disparus.trouves,
  114: (j) => numeroDisparu('Philae') in j.disparus.trouves,
  115: (j) => taille(j.stats, 'dossiers') >= 10,
  116: (j) => j.monolithes.trouves.length >= 100 && j.radio.captees.length >= 50 && Object.keys(j.disparus.trouves).length >= 20,
  117: (j) => compte(j.stats, 'ecouteVaine') >= 30 * 60_000,
  // Le monde
  118: (j) => COMETES.some((c) => orbite(j, c)),
  119: (j) => orbite(j, HALLEY),
  120: (j) => orbite(j, 'Arrokoth'),
  121: (j) => orbite(j, 'ʻOumuamua'),
  122: (j) => compte(j.stats, 'apophis2029') >= 1,
  123: (j) => orbite(j, 'Cérès') && orbite(j, 'Vesta'),
  124: (j) => orbite(j, 'Sedna'),
  125: (j, t) => j.stats.ici?.lieu === 'ISS' && t - j.stats.ici.depuis >= JOUR,
  126: (j) => orbite(j, 'Hubble'),
  127: (j) => orbite(j, 'James Webb'),
  128: (j) => orbite(j, 'Voyager 1') && orbite(j, 'Voyager 2'),
  129: (j) => j.icare !== null,
  130: (j) => orbite(j, 'Io'),
  131: (j) => orbite(j, 'Charon'),
  132: (j) => compte(j.stats, 'tritonOccupe') >= 1,
  133: (j) => compte(j.stats, 'feuxEnEntier') >= 1,
  134: (_j, t) => { const d = new Date(t); return d.getHours() === 0 && d.getMinutes() === 0 },
  135: (_j, t) => heureLocale(t) === 3,
  136: (j) => j.stats.jours.suite >= 7,
  137: (j) => j.stats.jours.suite >= 30,
  138: (j, t) => {
    const a = new Date(j.stats.naissance), b = new Date(t)
    return b.getFullYear() > a.getFullYear() && b.getMonth() === a.getMonth() && b.getDate() === a.getDate()
  },
  139: (j) => compte(j.stats, 'nuit') >= 1,
  // Capitaine et Messages
  140: (j) => !/^Capitaine(-...)?$/.test(j.pseudo),
  141: (j) => niveauDe(j.xp).niveau >= 20,
  142: (j) => niveauDe(j.xp).niveau >= 80,
  143: (j) => niveauDe(j.xp).niveau >= 100,
  144: (j) => Math.max(compte(j.stats, 'messages'), j.envoyes.length) >= 10,
  145: (j) => Math.max(compte(j.stats, 'messages'), j.envoyes.length) >= 500,
  146: (j) => new Set(j.envoyes.filter((m) => m.canal.startsWith('prive:')).map((m) => m.canal)).size >= 5,
  147: (j) => j.envoyes.some((m) => { const p = j.stats.passages[m.canal]; return p !== undefined && m.envoye >= p && m.envoye - p < HEURE }),
  148: (j) => compte(j.stats, 'changementsNom') >= 1,
  149: (j) => compte(j.stats, 'niveauxLus') >= 10,
  150: (j) => Object.keys(j.trophees).length >= 100,
}

/**
 * Les trophées une fois par seconde : met à jour les compteurs qui dépendent du temps (l'orbite, les jours de suite,
 * le retour sur Terre…), puis regarde les trophées pas encore gagnés. Renvoie les nouveaux (numéros), déjà notés dans
 * jeu.trophees (avec la date) et jeu.tropheesAAnnoncer.
 */
export function suivreTrophees(j: Jeu, t: number): number[] {
  const s = j.stats
  // La naissance de la capsule : le premier instant où les trophées la voient.
  if (!s.naissance) { s.naissance = t; s.terre = t }
  // L'orbite : le lieu (on y a été), depuis quand.
  const lieu = j.lieuEnOrbite(t)
  if (!lieu) s.ici = null
  else {
    if (s.ici?.lieu !== lieu) s.ici = { lieu, depuis: t }
    const c = corps(lieu)
    if (c && ['planete', 'naine', 'comete', 'asteroide', 'lune', 'satellite', 'sonde'].includes(c.type)) ajouter(s, 'lieux', lieu)
    if (lieu === 'Triton' && !j.zones.liberees.includes('Triton')) s.n.tritonOccupe = 1
    if (lieu === 'Apophis' && new Date(t).getFullYear() === 2029 && new Date(t).getMonth() === 3 && new Date(t).getDate() === 13) s.n.apophis2029 = 1
    // Le retour sur Terre après 30 jours ailleurs.
    if (zoneDuLieu(lieu) === 'Terre' || lieu === 'Terre') {
      if (t - s.terre >= 30 * JOUR) s.n.retourTerre = 1
      s.terre = t
    }
  }
  // Les jours de suite (le jour du téléphone).
  const jour = jourLocal(t)
  if (jour !== s.jours.dernier) s.jours = { dernier: jour, suite: jour === s.jours.dernier + 1 ? s.jours.suite + 1 : 1 }
  s.n.creditsMax = Math.max(compte(s, 'creditsMax'), j.credits)
  s.impacts = s.impacts.filter((x) => t - x < JOUR)
  const nouveaux: number[] = []
  for (const tr of TROPHEES) {
    if (tr.n in j.trophees) continue
    if (!CONDITIONS[tr.n]?.(j, t)) continue
    j.trophees[tr.n] = t
    nouveaux.push(tr.n)
  }
  // Le dernier attend les autres (il compte les trophées gagnés).
  if (nouveaux.length && !(150 in j.trophees) && CONDITIONS[150](j, t)) { j.trophees[150] = t; nouveaux.push(150) }
  j.tropheesAAnnoncer.push(...nouveaux)
  return nouveaux
}

/** Combien de trophées gagnés. */
export const nombreTrophees = (j: Jeu) => Object.keys(j.trophees).length
