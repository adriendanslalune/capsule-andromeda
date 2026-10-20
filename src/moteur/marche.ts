// Le Marché vu depuis la capsule (étape 7) : un marché par système, dont les cours arrivent avec le délai de la lumière
// depuis sa planète. Formule du temps : autour d'un prix propre à chaque marché (le prix de base, ses spécialités de
// −30 % à +30 %, et ±5 % propres au marché), des ondulations de périodes différentes (de quelques jours à quelques
// minutes), décalées pour chaque marché et chaque marchandise. Reproductible : même instant, même cours, pour tous.
// On n'achète et ne vend qu'au marché du système où la capsule est en orbite, au cours en direct (voir jeu.ts).

import { MARCHANDISES, MARCHES, MARGE, SPECIALITES, type FicheMarchandise, type FicheMarche } from '../donnees/marche'
import { etatCapsule } from './capsule'
import { astreDominant } from './corps'
import { C_KM_S, distanceDepuisCapsule } from './navigation'

/** Délai de la lumière (ms) entre un lieu et la capsule, à l'instant t. */
export function delaiLumiere(lieu: string, t: number): number {
  return (distanceDepuisCapsule(lieu, t) / C_KM_S) * 1000
}

/** Le marché du système où se trouve la capsule (là où ses cours sont en direct), ou null (en plein espace). */
export function marcheDeLaCapsule(t: number): FicheMarche | null {
  const systeme = astreDominant(etatCapsule(t).position, t)
  return MARCHES.find((m) => m.lieu === systeme) ?? null
}

/** Petit hachage d'un texte, entre 0 et 1 (toujours le même pour le même texte). */
function hachage(s: string): number {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0) / 4294967296
}

const HEURE = 3_600_000
/**
 * Les ondulations : période (ms) et amplitude (fraction du prix). Comptoir aux prix stables (décision d'Adrien du
 * 20/10/2026) : ±4,5 % au plus, moins que la marge (12 %) : attendre sur place pour revendre plus cher ne rapporte
 * jamais ; on gagne en transportant, d'un système à ses spécialités.
 */
const ONDES: readonly [number, number][] = [[4.3 * 24 * HEURE, 0.022], [19 * HEURE, 0.013], [2.7 * HEURE, 0.007], [23 * 60_000, 0.002], [6 * 60_000, 0.001]]

/** Le cours (crédits la tonne) d'une marchandise sur un marché, à l'instant t. */
export function cours(m: FicheMarche, f: FicheMarchandise, t: number): number {
  const cle = `${m.nom}/${f.nom}`
  const base = f.prix * (SPECIALITES[m.nom]?.[f.nom] ?? 1) * (0.95 + 0.1 * hachage(cle))
  const onde = ONDES.reduce((s, [p, a], k) => s + a * Math.sin((2 * Math.PI * t) / p + 2 * Math.PI * hachage(`${cle}/${k}`)), 0)
  return base * (1 + onde)
}

/** Prix d'achat et de vente autour du cours. */
export function achatVente(c: number): { achat: number; vente: number } {
  return { achat: Math.round(c * (1 + MARGE / 2)), vente: Math.max(1, Math.round(c * (1 - MARGE / 2))) }
}

/** L'historique d'un cours : n + 1 points réguliers de debut à fin (ms UTC). */
export function historique(m: FicheMarche, f: FicheMarchandise, debut: number, fin: number, n: number): { t: number; cours: number }[] {
  return Array.from({ length: n + 1 }, (_, k) => {
    const t = debut + ((fin - debut) * k) / n
    return { t, cours: cours(m, f, t) }
  })
}

/** Ce que la capsule sait d'un marché à l'instant t : les cours d'il y a « delai » ms (le délai de la lumière). */
export interface VueMarche {
  marche: FicheMarche
  /** Âge des cours (ms) ; 0 si la capsule est dans ce système. */
  delai: number
  ici: boolean
  /** Instant des derniers cours connus (t − délai). */
  connuA: number
  marchandises: { fiche: FicheMarchandise; cours: number; achat: number; vente: number; /** Sur 24 h (fraction). */ variation: number }[]
}

export function vueMarche(m: FicheMarche, t: number): VueMarche {
  const ici = marcheDeLaCapsule(t)?.nom === m.nom
  const delai = ici ? 0 : delaiLumiere(m.lieu, t)
  const connuA = t - delai
  return {
    marche: m, delai, ici, connuA,
    marchandises: MARCHANDISES.map((f) => {
      const c = cours(m, f, connuA)
      return { fiche: f, cours: c, ...achatVente(c), variation: c / cours(m, f, connuA - 24 * HEURE) - 1 }
    }),
  }
}
