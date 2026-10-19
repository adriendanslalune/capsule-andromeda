// La réparation d'un module en panne, sur le panneau (étape 4, maquette validée par Adrien le 18/10/2026), façon
// « Keep Talking and Nobody Explodes » : le panneau montre des indices, le manuel dit quoi faire selon ces indices.
// Ici : le bornier du bloc Énergie (les autres modules ont leur fichier, comme communications.ts). La réparation se fait en plusieurs tours ; chaque tour tire un nouveau code de
// diagnostic, de nouveaux câbles, de nouveaux voyants, et l'état d'un autre module (la pression du Moteur), si bien
// qu'il faut toujours relire le manuel. Une erreur bloque le module 30 secondes, sans rien casser de plus.

import {
  CODES_ENERGIE, COULEURS_CABLES, PREFIXE_R4_INVERSEE, type Circuit, type CodeDiagnostic, type CouleurCable,
} from '../donnees/manuel-energie'
import { hasard } from './contrats'

/** Blocage du module après une erreur (ms). */
export const BLOCAGE_ERREUR = 30_000

export interface Cable { couleur: CouleurCable; /** Étiquette : circuit et chiffre (« β7 »). */ circuit: Circuit; chiffre: number }

/** Ce que montre le panneau pendant un tour de réparation de l'Énergie. */
export interface TourEnergie {
  diagnostic: CodeDiagnostic
  /** Voyants de bus V1 à V4 (allumé : vrai). */
  voyants: [boolean, boolean, boolean, boolean]
  /** Câbles du bornier, de haut en bas. */
  cables: Cable[]
  /** Aiguille de pression du module Moteur dans le rouge (indice d'un autre module). */
  pressionRouge: boolean
}

/** Ce qu'il faut faire pendant un tour : couper un câble (son numéro dans le bornier), ou basculer ISOLER deux fois. */
export type Solution = { couper: number } | { isolerDeuxFois: true }

/** L'état de la réparation d'un module du panneau (enregistré avec la partie). */
export interface EtatReparation {
  graine: number
  /** Tour actuel (0, 1…) et nombre de tours à faire. */
  tour: number
  tours: number
  /** Bornier : câbles déjà coupés pendant ce tour. Chiffreur : touches déjà enfoncées. */
  coupes: number[]
  /** Bornier : ISOLER basculé combien de fois. */
  isoler: number
  /** Télégraphe : cran du cadran des fréquences ; Antenne : angle (degrés). */
  reglage?: number
  /** Après une erreur : module bloqué jusqu'à cet instant (ms UTC). */
  blocageJusqua: number
}

/** Tire un nombre entier entre 0 et n − 1 ; renvoie aussi la graine suivante. */
export function tirer(g: number, n: number): [number, number] {
  const h = hasard(g)
  return [Math.floor(h.x * n), h.graine]
}

/** Commence une réparation du bornier : 2 ou 3 tours (ou le nombre de tours donné, pour un autre module). */
export function nouvelleReparation(graine: number, tours?: number): EtatReparation {
  const [n] = tirer(graine, 2)
  return { graine, tour: 0, tours: tours ?? 2 + n, coupes: [], isoler: 0, blocageJusqua: 0 }
}

/** Un tirage reproductible propre au tour k d'une réparation : t(n) donne un entier entre 0 et n − 1. */
export function tirage(graine: number, k: number): (n: number) => number {
  let g = (graine ^ Math.imul(k + 1, 0x9e3779b1)) >>> 0
  return (n: number) => { const [v, s] = tirer(g, n); g = s; return v }
}

/** Le panneau pendant le tour k d'une réparation (reproductible : même graine, même tour, même panneau). */
export function tourEnergie(graine: number, k: number): TourEnergie {
  const t = tirage(graine, k)
  const diagnostic = CODES_ENERGIE[t(CODES_ENERGIE.length)]
  const voyants = [t(2) === 1, t(2) === 1, t(2) === 1, t(2) === 1] as TourEnergie['voyants']
  // 5 à 8 câbles ; le circuit en défaut en a 2 ou 3, les autres circuits se partagent le reste.
  const total = 5 + t(4)
  const duCircuit = 2 + t(2)
  const autres = ['α', 'β', 'γ', 'δ'].filter((c) => c !== diagnostic.circuit) as Circuit[]
  const circuits: Circuit[] = [...Array(duCircuit).fill(diagnostic.circuit), ...Array.from({ length: total - duCircuit }, () => autres[t(3)])]
  // Mélange (Fisher-Yates).
  for (let i = circuits.length - 1; i > 0; i--) { const j = t(i + 1); [circuits[i], circuits[j]] = [circuits[j], circuits[i]] }
  const chiffres = new Set<number>()
  const cables = circuits.map((circuit): Cable => {
    let chiffre = 1 + t(9)
    while (chiffres.has(chiffre)) chiffre = (chiffre % 9) + 1
    chiffres.add(chiffre)
    return { couleur: COULEURS_CABLES[t(COULEURS_CABLES.length)], circuit, chiffre }
  })
  return { diagnostic, voyants, cables, pressionRouge: t(2) === 1 }
}

/** Ce que demande le manuel pour un tour (règles du TABLEAU 4-2), selon le numéro de série de la capsule. */
export function solution(tour: TourEnergie, numeroSerie: string): Solution {
  const { diagnostic, voyants, cables } = tour
  // Les câbles du circuit en défaut, de haut en bas (avec leur numéro dans le bornier).
  const circuit = cables.map((c, i) => ({ ...c, i })).filter((c) => c.circuit === diagnostic.circuit)
  const premier = circuit[0].i, dernier = circuit[circuit.length - 1].i
  const allumes = voyants.filter(Boolean).length
  const de = (couleur: CouleurCable) => circuit.filter((c) => c.couleur === couleur)
  switch (diagnostic.regle) {
    case 'R1':
      return { couper: voyants[0] ? premier : dernier }
    case 'R2': {
      const rouges = de('rouge')
      if (rouges.length > 0 && rouges.length === allumes) return { couper: rouges[rouges.length - 1].i }
      return { couper: allumes === 0 ? premier : circuit[Math.min(allumes, circuit.length) - 1].i }
    }
    case 'R3': {
      const jaunes = de('jaune')
      return { couper: jaunes.length === 1 ? jaunes[0].i : circuit[1].i }
    }
    case 'R4': {
      const blancs = de('blanc')
      if (!blancs.length) return { couper: premier }
      let pair = Number(numeroSerie.slice(-1)) % 2 === 0
      if (numeroSerie.startsWith(PREFIXE_R4_INVERSEE)) pair = !pair // note manuscrite du manuel
      return { couper: pair ? blancs[0].i : blancs[blancs.length - 1].i }
    }
    case 'R5': {
      if (voyants[1] && voyants[3]) return { isolerDeuxFois: true }
      const bleus = de('bleu')
      return { couper: bleus.length ? bleus[0].i : dernier }
    }
    case 'R6': {
      const tries = [...circuit].sort((a, b) => a.chiffre - b.chiffre)
      return { couper: tour.pressionRouge ? tries[tries.length - 1].i : tries[0].i }
    }
  }
}

/** Résultat d'un geste sur le panneau. */
export type Resultat = 'ok' | 'erreur' | 'bloque' | 'tour-suivant' | 'repare'

/** Le module est-il bloqué (après une erreur) à l'instant t ? */
export function bloque(r: EtatReparation, t: number): boolean {
  return t < r.blocageJusqua
}

/** Une erreur : le module est bloqué BLOCAGE_ERREUR, le tour recommence. */
export function erreur(r: EtatReparation, t: number): Resultat {
  r.blocageJusqua = t + BLOCAGE_ERREUR
  r.coupes = []
  r.isoler = 0
  return 'erreur'
}

/** Le tour est réussi : au suivant, ou réparé si c'était le dernier. */
export function tourFini(r: EtatReparation): Resultat {
  r.tour++
  r.coupes = []
  r.isoler = 0
  return r.tour >= r.tours ? 'repare' : 'tour-suivant'
}

/**
 * Le tour du bornier tel que le voit le joueur : si la soupape (bloc Moteur) est elle-même en défaut, son aiguille de
 * PRESSION est dans le rouge quoi qu'il arrive (pressionRouge : vrai), et c'est elle que lit la règle R6.
 */
export function tourEnergieVu(graine: number, k: number, pressionRouge?: boolean): TourEnergie {
  const tour = tourEnergie(graine, k)
  return pressionRouge === undefined ? tour : { ...tour, pressionRouge }
}

/** Couper le câble n° i du bornier. */
export function couperCable(r: EtatReparation, i: number, numeroSerie: string, t: number, pressionRouge?: boolean): Resultat {
  if (bloque(r, t)) return 'bloque'
  if (r.coupes.includes(i)) return 'ok'
  const s = solution(tourEnergieVu(r.graine, r.tour, pressionRouge), numeroSerie)
  if ('isolerDeuxFois' in s || s.couper !== i) return erreur(r, t)
  r.coupes.push(i)
  return 'ok'
}

/** Basculer ISOLER : valide le tour si le bon câble est coupé (ou au second basculement, quand il n'en faut aucun). */
export function basculerIsoler(r: EtatReparation, numeroSerie: string, t: number, pressionRouge?: boolean): Resultat {
  if (bloque(r, t)) return 'bloque'
  const s = solution(tourEnergieVu(r.graine, r.tour, pressionRouge), numeroSerie)
  if ('isolerDeuxFois' in s) {
    if (r.coupes.length) return erreur(r, t)
    r.isoler++
    return r.isoler >= 2 ? tourFini(r) : 'ok'
  }
  if (!r.coupes.includes(s.couper)) return erreur(r, t)
  return tourFini(r)
}
