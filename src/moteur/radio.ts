// La radio (décisions d'Adrien du 20/10/2026) : les Voix perdues de la bande OC. Chaque voix a son système, sa
// fréquence et son heure d'émission, tirés une fois pour toutes (les mêmes pour tous). On l'entend dans son système
// pendant qu'elle émet, d'autant plus nettement qu'on est calé près de sa fréquence ; calé net pendant
// DUREE_ENREGISTREMENT, on l'enregistre : elle rejoint la collection.

import {
  BANDE_OC, DUREE_EMISSION, DUREE_ENREGISTREMENT, LARGEUR_SIGNAL, PERIODE_EMISSION, SIGNAL_NET, TEXTES_VOIX, VOIX_PAR_SYSTEME,
  type TexteVoix,
} from '../donnees/radio'

/** Une voix perdue : son numéro (de 1 à 150), son système, sa fréquence (MHz) et le décalage de son heure d'émission. */
export interface Voix { numero: number; systeme: string; rang: number; frequence: number; decalage: number }

function hasard(a: number, b: number): number {
  const x = Math.sin(a * 91.17 + b * 47.53 + 3.1) * 43758.5453
  return x - Math.floor(x)
}

/** Les 150 voix, numérotées système par système (dans l'ordre du Soleil vers Pluton). */
export const VOIX: readonly Voix[] = (() => {
  const l: Voix[] = []
  for (const [systeme, n] of Object.entries(VOIX_PAR_SYSTEME)) {
    const prises: number[] = []
    for (let rang = 0; rang < n; rang++) {
      const numero = l.length + 1
      // Une fréquence à elle, assez loin des autres voix de son système pour qu'on ne les confonde pas.
      let f = 0
      for (let essai = 0; essai < 100; essai++) {
        f = Math.round((BANDE_OC.min + 0.1 + hasard(numero, essai) * (BANDE_OC.max - BANDE_OC.min - 0.2)) * 1000) / 1000
        if (prises.every((p) => Math.abs(p - f) > 2.5 * LARGEUR_SIGNAL)) break
      }
      prises.push(f)
      l.push({ numero, systeme, rang, frequence: f, decalage: Math.floor(hasard(numero, 999) * PERIODE_EMISSION) })
    }
  }
  return l
})()

/** Le texte d'une voix, ou null s'il n'est pas encore écrit (elle n'émet pas). */
export function texteVoix(v: Voix): TexteVoix | null {
  return TEXTES_VOIX[v.systeme]?.[v.rang] ?? null
}

/** La voix émet-elle à l'instant t ? */
export function emet(v: Voix, t: number): boolean {
  return !!texteVoix(v) && (((t + v.decalage) % PERIODE_EMISSION) + PERIODE_EMISSION) % PERIODE_EMISSION < DUREE_EMISSION
}

/** Début de la fenêtre d'émission en cours de la voix, ou de la prochaine (le carnet en donne l'heure). */
export function debutEmission(v: Voix, t: number): number {
  const phase = (((t + v.decalage) % PERIODE_EMISSION) + PERIODE_EMISSION) % PERIODE_EMISSION
  return phase < DUREE_EMISSION ? t - phase : t - phase + PERIODE_EMISSION
}

/** Netteté d'une voix calée à `ecart` MHz de sa fréquence : 1 (nette) à 0 (perdue dans le bruit). */
export function nettete(ecart: number): number {
  return Math.max(0, Math.min(1, 1 - (Math.abs(ecart) - SIGNAL_NET) / (LARGEUR_SIGNAL - SIGNAL_NET)))
}

/** Ce qu'on capte, réglé sur `frequence` dans le système `systeme` (null : en plein espace) : la voix la plus nette. */
export function capter(frequence: number, systeme: string | null, t: number): { voix: Voix; nettete: number } | null {
  if (!systeme) return null
  let meilleure: { voix: Voix; nettete: number } | null = null
  for (const v of VOIX) {
    if (v.systeme !== systeme || !emet(v, t)) continue
    const n = nettete(frequence - v.frequence)
    if (n > 0 && (!meilleure || n > meilleure.nettete)) meilleure = { voix: v, nettete: n }
  }
  return meilleure
}

/** La radio du joueur : sa fréquence, les voix enregistrées (et quand), et la voix sur laquelle il est calé. */
export interface EtatRadio {
  frequence: number
  captees: number[]
  captureesLe: Record<number, number>
  calage: { voix: number; depuis: number } | null
}

export const radioNeuve = (): EtatRadio => ({ frequence: 5, captees: [], captureesLe: {}, calage: null })

/**
 * On écoute à l'instant t : calé net sur une voix, l'enregistrement avance ; au bout de DUREE_ENREGISTREMENT, elle
 * rejoint la collection (renvoie son numéro). Renvoie aussi ce qu'on capte et où en est l'enregistrement (0 à 1).
 */
export function ecouter(e: EtatRadio, systeme: string | null, t: number): { capte: ReturnType<typeof capter>; enregistrement: number; nouvelle: number | null } {
  const capte = capter(e.frequence, systeme, t)
  if (!capte || capte.nettete < 0.95 || e.captees.includes(capte.voix.numero)) {
    e.calage = null
    return { capte, enregistrement: capte && e.captees.includes(capte.voix.numero) ? 1 : 0, nouvelle: null }
  }
  if (e.calage?.voix !== capte.voix.numero) e.calage = { voix: capte.voix.numero, depuis: t }
  const enregistrement = Math.min(1, (t - e.calage.depuis) / DUREE_ENREGISTREMENT)
  if (enregistrement < 1) return { capte, enregistrement, nouvelle: null }
  e.captees.push(capte.voix.numero)
  e.captureesLe[capte.voix.numero] = t
  e.calage = null
  return { capte, enregistrement: 1, nouvelle: capte.voix.numero }
}
