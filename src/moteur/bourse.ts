// La Bourse (décisions d'Adrien du 20/10/2026). Les cours sont les mêmes pour tous : une formule du temps, imprévisible
// mais reproductible. Pour chaque compagnie, pas à pas (toutes les 2 minutes depuis le 1er octobre 2026) :
// - un « fond » qui dérive lentement (et revient doucement vers le cours de référence en quelques mois) ;
// - un écart qui s'agite et revient vers le fond en un jour et demi ;
// - les ordres des bots, qui poussent le cours (et se voient dans le fil des ordres) ;
// - parfois un gros mouvement, sur une heure, annoncé quelques heures avant par une rumeur dans les Messages (juste
//   trois fois sur quatre).
// Les ordres du joueur partent de la capsule à la vitesse de la lumière, s'exécutent au cours de leur arrivée au siège
// de la compagnie, et la confirmation revient de même. Les crédits d'un achat partent avec l'ordre ; les actions d'une
// vente aussi. Frais : FRAIS_BOURSE par ordre, au moins FRAIS_MINIMUM crédits.

import { BOTS } from '../donnees/messages'
import { delaiLumiere } from './marche'
import { COMPAGNIES, FIABILITE_RUMEURS, FRAIS_BOURSE, FRAIS_MINIMUM, RUMEURS_BAISSE, RUMEURS_HAUSSE, type Compagnie } from '../donnees/bourse'

/** Début des cours (avant : le cours de référence). */
export const ORIGINE_BOURSE = Date.UTC(2026, 9, 1)
/** Un pas de cours. */
const PAS = 120_000
const JOUR = 86_400_000
const HEURE = 3_600_000
const PAS_PAR_JOUR = JOUR / PAS
/** Retour de l'écart vers le fond (demi-vie d'un jour et demi), du fond vers la référence (demi-vie de 60 jours). */
const RETOUR_ECART = Math.LN2 / (1.5 * PAS_PAR_JOUR)
const RETOUR_FOND = Math.LN2 / (60 * PAS_PAR_JOUR)
/** Créneaux des ordres des bots (un ordre au plus par créneau et par compagnie). */
const CRENEAU_BOT = 15 * 60_000
const PROBA_ORDRE_BOT = 0.35
/** Durée d'un gros mouvement. */
const DUREE_EVENEMENT = HEURE

/** Hasard reproductible entre 0 et 1, à partir de trois entiers. */
function bruit(a: number, b: number, c: number): number {
  let x = Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263) ^ Math.imul(c + 13, 2246822519)
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  x ^= x >>> 16
  x = Math.imul(x ^ (x >>> 15), 2654435761)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}
/** Hasard « normal » (moyenne 0, écart 1, à peu près). */
const normal = (a: number, b: number, c: number) => (bruit(a, b, c) + bruit(a, b, c + 1000) + bruit(a, b, c + 2000) + bruit(a, b, c + 3000) - 2) * Math.sqrt(3)

const indice = (c: Compagnie) => COMPAGNIES.indexOf(c)

/** Les gros mouvements déjà calculés, par compagnie et par jour. */
const memoEvenements = COMPAGNIES.map(() => new Map<number, Evenement | null>())

/** Un gros mouvement : son début, sa force (fraction, + ou −), et la rumeur qui l'annonce. */
export interface Evenement { compagnie: Compagnie; debut: number; force: number; rumeur: { envoye: number; bot: string; hausse: boolean; texte: string } }

/** Le gros mouvement d'un jour (s'il y en a un). */
export function evenementDuJour(c: Compagnie, jour: number): Evenement | null {
  const i = indice(c), memo = memoEvenements[i]
  if (!memo.has(jour)) memo.set(jour, calculerEvenement(c, i, jour))
  return memo.get(jour)!
}
function calculerEvenement(c: Compagnie, i: number, jour: number): Evenement | null {
  if (bruit(i, jour, 1) >= c.evenements) return null
  const debut = ORIGINE_BOURSE + jour * JOUR + Math.floor(bruit(i, jour, 2) * (JOUR - DUREE_EVENEMENT))
  const sens = bruit(i, jour, 3) < 0.5 ? 1 : -1
  const force = sens * c.volatilite * (1.5 + 2.5 * bruit(i, jour, 4))
  const juste = bruit(i, jour, 5) < FIABILITE_RUMEURS
  const hausse = juste ? sens > 0 : sens < 0
  const modeles = hausse ? RUMEURS_HAUSSE : RUMEURS_BAISSE
  const texte = modeles[Math.floor(bruit(i, jour, 6) * modeles.length)].replaceAll('{compagnie}', c.nom).replaceAll('{siege}', c.siege)
  const bot = BOTS[Math.floor(bruit(i, jour, 7) * BOTS.length)].pseudo
  return { compagnie: c, debut, force, rumeur: { envoye: debut - Math.floor((2 + 4 * bruit(i, jour, 8)) * HEURE), bot, hausse, texte } }
}

/** Un ordre d'un bot : qui, quand, achat ou vente, combien d'actions. */
export interface OrdreBot { compagnie: Compagnie; t: number; bot: string; achat: boolean; actions: number }

function ordreBot(c: Compagnie, creneau: number): OrdreBot | null {
  const i = indice(c)
  if (bruit(i, creneau, 11) >= PROBA_ORDRE_BOT) return null
  const valeur = 200 * Math.pow(60, bruit(i, creneau, 12)) // de 200 à 12 000 crédits
  return {
    compagnie: c, t: ORIGINE_BOURSE + creneau * CRENEAU_BOT + Math.floor(bruit(i, creneau, 13) * CRENEAU_BOT),
    bot: BOTS[Math.floor(bruit(i, creneau, 14) * BOTS.length)].pseudo, achat: bruit(i, creneau, 15) < 0.5,
    actions: Math.max(1, Math.round(valeur / c.prix)),
  }
}
/** La poussée d'un ordre de bot sur le cours (fraction). */
const pousseeBot = (o: OrdreBot) => (o.achat ? 1 : -1) * o.compagnie.volatilite * 0.12 * Math.sqrt((o.actions * o.compagnie.prix) / 1000)

/** Les cours calculés (logarithme du cours relatif à la référence), pas après pas, gardés pour la suite. */
const calcules = COMPAGNIES.map(() => ({ fond: [0] as number[], ecart: [0] as number[], creneau: -1, ordre: null as OrdreBot | null }))

function logCours(c: Compagnie, k: number): number {
  if (k <= 0) return 0
  const i = indice(c), s = calcules[i]
  const pasF = c.volatilite * 0.02, pasE = c.volatilite * 0.075
  for (let n = s.fond.length; n <= k; n++) {
    const t = ORIGINE_BOURSE + n * PAS
    let poussee = 0
    // Un gros mouvement en cours (celui du jour, ou celui de la veille qui déborde après minuit).
    for (const jour of [Math.floor((t - ORIGINE_BOURSE) / JOUR), Math.floor((t - ORIGINE_BOURSE) / JOUR) - 1]) {
      const e = evenementDuJour(c, jour)
      if (e && t > e.debut && t <= e.debut + DUREE_EVENEMENT) poussee += (e.force * PAS) / DUREE_EVENEMENT
    }
    // Un ordre de bot dans ce pas.
    const creneau = Math.floor((t - ORIGINE_BOURSE) / CRENEAU_BOT)
    if (creneau !== s.creneau) { s.creneau = creneau; s.ordre = ordreBot(c, creneau) }
    const o = s.ordre
    if (o && o.t > t - PAS && o.t <= t) poussee += pousseeBot(o)
    s.fond.push(s.fond[n - 1] * (1 - RETOUR_FOND) + pasF * normal(i, n, 21))
    s.ecart.push(s.ecart[n - 1] * (1 - RETOUR_ECART) + pasE * normal(i, n, 22) + poussee)
  }
  return s.fond[k] + s.ecart[k]
}

/** Le cours d'une compagnie (crédits l'action) à l'instant t. */
export function coursAction(c: Compagnie, t: number): number {
  const x = (t - ORIGINE_BOURSE) / PAS
  if (x <= 0) return c.prix
  const k = Math.floor(x), f = x - k
  return c.prix * Math.exp(logCours(c, k) * (1 - f) + logCours(c, k + 1) * f)
}

/** L'historique d'un cours : n + 1 points réguliers de debut à fin. */
export function historiqueAction(c: Compagnie, debut: number, fin: number, n: number): { t: number; cours: number }[] {
  return Array.from({ length: n + 1 }, (_, k) => { const t = debut + ((fin - debut) * k) / n; return { t, cours: coursAction(c, t) } })
}

/** Les ordres des bots sur une compagnie entre deux instants, du plus récent au plus ancien. */
export function ordresDesBots(c: Compagnie, debut: number, fin: number): (OrdreBot & { prix: number })[] {
  const l: (OrdreBot & { prix: number })[] = []
  for (let s = Math.floor((fin - ORIGINE_BOURSE) / CRENEAU_BOT); s >= Math.floor((debut - ORIGINE_BOURSE) / CRENEAU_BOT) && s >= 0; s--) {
    const o = ordreBot(c, s)
    if (o && o.t > debut && o.t <= fin) l.push({ ...o, prix: coursAction(c, o.t) })
  }
  return l
}

/** Les rumeurs parties entre deux instants (pour les Messages). */
export function rumeursEntre(debut: number, fin: number): Evenement[] {
  const l: Evenement[] = []
  // Une rumeur part au plus 6 h avant son mouvement : on regarde les mouvements jusqu'à un jour après « fin ».
  for (let jour = Math.floor((debut - ORIGINE_BOURSE) / JOUR); jour <= Math.floor((fin - ORIGINE_BOURSE) / JOUR) + 1; jour++) {
    if (jour < 0) continue
    for (const c of COMPAGNIES) {
      const e = evenementDuJour(c, jour)
      if (e && e.rumeur.envoye > debut && e.rumeur.envoye <= fin) l.push(e)
    }
  }
  return l
}

/** Ce que la capsule sait d'une compagnie à l'instant t : ses cours d'il y a « delai » (la lumière vient du siège). */
export interface VueAction { compagnie: Compagnie; delai: number; connuA: number; cours: number; /** Sur 24 h (fraction). */ variation: number }

export function vueAction(c: Compagnie, t: number): VueAction {
  const delai = delaiLumiere(c.siege, t), connuA = t - delai, cours = coursAction(c, connuA)
  return { compagnie: c, delai, connuA, cours, variation: cours / coursAction(c, connuA - JOUR) - 1 }
}

// --- Le portefeuille du joueur ---

/** Ce que le joueur a d'une compagnie : ses actions, et ce qu'elles lui ont coûté (frais compris). */
export interface Position { actions: number; investi: number }

/** Un ordre du joueur, de son envoi à sa confirmation. */
export interface OrdreBourse {
  id: number
  compagnie: string
  sens: 'acheter' | 'vendre'
  /** Achat : crédits engagés. Vente : crédits reçus (à la confirmation). */
  credits: number
  /** Actions achetées (à la confirmation) ou envoyées à la vente. */
  actions: number
  /** Vente : ce que les actions avaient coûté, et le gain (ou la perte, frais compris) à la confirmation. */
  cout: number
  gain: number | null
  envoye: number
  /** Arrivée au siège : l'ordre s'y exécute. */
  arrivee: number
  /** Exécuté : le cours, puis l'instant où la confirmation arrive à la capsule. */
  prix: number | null
  confirme: number | null
}

export interface Portefeuille { positions: Record<string, Position>; ordres: OrdreBourse[]; /** Les derniers ordres confirmés. */ journal: OrdreBourse[] }

export const portefeuilleVide = (): Portefeuille => ({ positions: {}, ordres: [], journal: [] })
export const compagnie = (id: string) => COMPAGNIES.find((c) => c.id === id)

/** Ce que vaut le portefeuille aux cours connus (sans les ordres en route), et ce qu'il a coûté. */
export function valeurPortefeuille(p: Portefeuille, t: number): { valeur: number; investi: number } {
  let valeur = 0, investi = 0
  for (const [id, pos] of Object.entries(p.positions)) {
    const c = compagnie(id)
    if (!c) continue
    valeur += pos.actions * vueAction(c, t).cours
    investi += pos.investi
  }
  return { valeur, investi }
}

/** Les frais d'un ordre (crédits), selon son montant. */
export const fraisOrdre = (montant: number) => Math.max(FRAIS_MINIMUM, montant * FRAIS_BOURSE)

/** Le devis d'un ordre, avant de le confirmer : ce qui part, les frais, et ce qu'on obtiendrait au cours connu. */
export interface Devis { sens: 'acheter' | 'vendre'; compagnie: Compagnie; /** Crédits engagés (achat) ou actions vendues. */ quantite: number; frais: number; /** Actions (achat) ou crédits (vente) estimés. */ estime: number; cours: number; delai: number }

export function devisOrdre(p: Portefeuille, credits: number, id: string, sens: 'acheter' | 'vendre', quantite: number, t: number): Devis | null {
  const c = compagnie(id)
  if (!c || !(quantite > 0)) return null
  const v = vueAction(c, t)
  if (sens === 'acheter') {
    const montant = Math.floor(Math.min(quantite, credits))
    if (montant <= FRAIS_MINIMUM) return null
    return { sens, compagnie: c, quantite: montant, frais: fraisOrdre(montant), estime: (montant - fraisOrdre(montant)) / v.cours, cours: v.cours, delai: v.delai }
  }
  const pos = p.positions[id]
  if (!pos || pos.actions <= 0) return null
  const n = Math.min(quantite, pos.actions), brut = n * v.cours
  return { sens, compagnie: c, quantite: n, frais: fraisOrdre(brut), estime: Math.max(0, brut - fraisOrdre(brut)), cours: v.cours, delai: v.delai }
}

/**
 * Passe un ordre. Achat : `quantite` crédits (pris tout de suite). Vente : `quantite` actions (elles partent avec
 * l'ordre). `delai` : le temps que met la lumière jusqu'au siège. Renvoie l'ordre, ou null s'il est impossible.
 */
export function passerOrdre(p: Portefeuille, credits: { valeur: number }, id: string, sens: 'acheter' | 'vendre', quantite: number, t: number, delai: number): OrdreBourse | null {
  const c = compagnie(id)
  if (!c || !(quantite > 0)) return null
  const o: OrdreBourse = { id: t + p.ordres.length, compagnie: id, sens, credits: 0, actions: 0, cout: 0, gain: null, envoye: t, arrivee: t + delai, prix: null, confirme: null }
  if (sens === 'acheter') {
    const montant = Math.floor(Math.min(quantite, credits.valeur))
    if (montant <= FRAIS_MINIMUM) return null
    credits.valeur -= montant
    o.credits = montant
  } else {
    const pos = p.positions[id]
    if (!pos || pos.actions <= 0) return null
    const n = Math.min(quantite, pos.actions)
    o.actions = n
    o.cout = pos.investi * (n / pos.actions)
    pos.investi -= o.cout
    pos.actions -= n
    if (pos.actions < 1e-9) delete p.positions[id]
  }
  p.ordres.push(o)
  return o
}

/**
 * Fait avancer les ordres : à leur arrivée au siège, ils s'exécutent au cours du moment ; la confirmation revient à la
 * capsule (`retour` : le délai de la lumière depuis le siège, à cet instant) ; à son arrivée, le portefeuille et les
 * crédits changent. Renvoie les ordres confirmés maintenant.
 */
export function avancerOrdres(p: Portefeuille, credits: { valeur: number }, t: number, retour: (siege: string, t: number) => number): OrdreBourse[] {
  const confirmes: OrdreBourse[] = []
  for (const o of p.ordres) {
    const c = compagnie(o.compagnie)!
    if (o.prix === null && t >= o.arrivee) {
      o.prix = coursAction(c, o.arrivee)
      o.confirme = o.arrivee + retour(c.siege, o.arrivee)
    }
    if (o.confirme === null || t < o.confirme) continue
    if (o.sens === 'acheter') {
      o.actions = (o.credits - fraisOrdre(o.credits)) / o.prix!
      const pos = p.positions[o.compagnie] ??= { actions: 0, investi: 0 }
      pos.actions += o.actions
      pos.investi += o.credits
    } else {
      o.credits = Math.floor(Math.max(0, o.actions * o.prix! - fraisOrdre(o.actions * o.prix!)))
      credits.valeur += o.credits
      o.gain = o.credits - o.cout
    }
    confirmes.push(o)
  }
  if (confirmes.length) {
    p.ordres = p.ordres.filter((o) => !confirmes.includes(o))
    p.journal = [...confirmes.reverse(), ...p.journal].slice(0, 20)
  }
  return confirmes
}
