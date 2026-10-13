// Pilote automatique de test : il joue comme un joueur qui lit le manuel.
// Il ne regarde que ce qui est visible à bord (témoins, aiguilles, affichages, n° de série, interrupteurs, carte)
// et applique les procédures du manuel telles qu'elles sont écrites, indépendamment du code du moteur.

import type { EtatPartie } from '../../src/moteur/etat'
import { positionAstre } from '../../src/moteur/fusee'
import { mulberry32, type Hasard } from '../../src/moteur/hasard'
import type { NumeroInterrupteur } from '../../src/moteur/interrupteurs'
import { tournerAntenne, verrouiller } from '../../src/moteur/modules/an1'
import { insererFusible, retirerFusible } from '../../src/moteur/modules/al1'
import { composer, emettre } from '../../src/moteur/modules/co1'
import type { Contexte, Evenement } from '../../src/moteur/modules/commun'
import { heureAffichee, recaler, reglerChronometre } from '../../src/moteur/modules/cr1'
import { cheminVers, ouvrirVanne, tournerTuyau } from '../../src/moteur/modules/hy1'
import { modulesEnPanne, type EtatModules } from '../../src/moteur/modules'
import { basculerVentilateur, toucherLampe } from '../../src/moteur/modules/lp1'
import { emettreMorse, reglerFrequence, sequenceMorse } from '../../src/moteur/modules/mo1'
import { toucherPrise } from '../../src/moteur/modules/pb1'
import { basculerLevierA, presserP, tournerMolette } from '../../src/moteur/modules/propulsion'
import { basculerVanne, pomper } from '../../src/moteur/modules/re1'
import { releve, reglerSextant } from '../../src/moteur/modules/sx1'
import { agir, avancerPartie, basculerInterrupteur } from '../../src/moteur/partie'

type Action = (m: EtatModules, ctx: Contexte) => { modules: EtatModules; evenements: Evenement[] }

// ---------------------------------------------------------------------------------------------------------------
// Ce que dit le manuel (recopié indépendamment du moteur)

const dernierChiffre = (serie: string) => { const c = serie.match(/[0-9]/g)!; return Number(c[c.length - 1]) }
const pair = (serie: string) => dernierChiffre(serie) % 2 === 0
const voyelle = (serie: string) => 'AEIOUY'.includes(serie[0])

/** Ordre des cascades : alphabétique, inversé si impair ; surchauffe (TU-1) toujours en premier. */
export function ordreSelonManuel(modules: string[], serie: string): string[] {
  const l = [...modules].sort()
  if (!pair(serie)) l.reverse()
  return l.includes('TU-1') ? ['TU-1', ...l.filter((c) => c !== 'TU-1')] : l
}

const MOTS: Record<string, string> = {
  ORION: '4721', VESTA: '3058', ATLAS: '1946', CERES: '8203', TITAN: '6390', ARGOS: '2584', DELTA: '7162',
  HYDRE: '9035', CYGNE: '1478', PERSE: '5609', ALGOL: '3317', RIGEL: '8842', SIRIUS: '2205', ALTAIR: '6671',
  DENEB: '4096', MIRA: '7350', CASTOR: '1189', POLLUX: '9512', ANTARES: '3724', CAPELLA: '5863',
}
const BRASSAGE = { rouge: [[1, 4], [2, 5]], bleu: [[3, 1], [5, 2]], jaune: [[4, 3], [1, 2]] } as const
const ANNUAIRE: Record<string, number> = {
  VEGA: 3.47, ARES: 5.12, IRIS: 8.06, NOVA: 2.89, LUNA: 6.64, ECHO: 9.31, ZETA: 1.75, OMEGA: 10.42, SOL: 4.58, ATLAS: 7.93,
}
const MORSE: Record<string, string> = {
  A: '.-', C: '-.-.', E: '.', G: '--.', H: '....', I: '..', L: '.-..', M: '--', N: '-.', O: '---', R: '.-.', S: '...',
  T: '-', U: '..-', V: '...-', Z: '--..',
}
const ETOILES: [string, number, number][] = [
  ['SIRIUS', 104, -40], ['VÉGA', 285, 62], ['BÉTELGEUSE', 89, -16], ['ARCTURUS', 204, 31], ['ANTARÈS', 250, -5],
  ['RÉGULUS', 150, 0], ['SPICA', 204, -2], ['ALDÉBARAN', 70, -5], ['ALTAÏR', 302, 29], ['POLLUX', 113, 7],
  ['DENEB', 335, 60], ['FOMALHAUT', 334, -21],
]

// ---------------------------------------------------------------------------------------------------------------

export class Pilote {
  etat: EtatPartie
  t: number
  hasard: Hasard
  evenements: Evenement[] = []
  messages: string[] = []
  /** Instant de la dernière réparation (ms UTC). */
  derniereReparation = 0
  /** Couleur du premier fusible grillé, notée au moment où l'avarie AL-1 apparaît. */
  private premierFusible: string | null = null

  constructor(etat: EtatPartie, t: number, graine = 1) {
    this.etat = etat
    this.t = t
    this.hasard = mulberry32(graine)
    this.noterFusible()
  }

  private garder(r: { etat: EtatPartie; evenements: Evenement[]; messages: string[] }) {
    this.etat = r.etat
    if (r.evenements.some((x) => x.type === 'reparation')) this.derniereReparation = this.t
    this.evenements.push(...r.evenements)
    this.messages.push(...r.messages)
  }

  /** Laisse passer le temps (pas de 1 s par défaut). */
  attendre(secondes: number, pas = 1) {
    for (let s = 0; s < secondes; s += pas) {
      this.t += pas * 1000
      this.garder(avancerPartie(this.etat, this.t, pas, this.hasard))
      this.noterFusible()
    }
  }

  /** Une action sur les modules (une seconde de réflexion avant chaque geste). */
  geste(action: Action) {
    this.attendre(1)
    this.garder(agir(this.etat, this.t, this.hasard, action))
    this.noterFusible()
  }

  interrupteur(n: NumeroInterrupteur) {
    this.attendre(1)
    this.garder(basculerInterrupteur(this.etat, n, this.t, this.hasard))
  }

  private noterFusible() {
    const al1 = this.etat.modules.al1
    if (al1.panne === null) this.premierFusible = null
    else if (this.premierFusible === null) this.premierFusible = al1.fusibles[al1.panne].couleur
  }

  get m() { return this.etat.modules }
  get serie() { return this.etat.serie }
  bas(n: number) { return this.etat.interrupteurs[n - 1] === 'bas' }

  /** Répare tout ce qui est en panne, dans l'ordre du manuel en cas de cascade. */
  toutReparer(maxTours = 20) {
    for (let tour = 0; tour < maxTours; tour++) {
      const pannes = modulesEnPanne(this.m)
      if (pannes.length === 0) return
      // RE-1 n'est jamais dans une cascade : on peut le traiter quand on veut.
      const autres = pannes.filter((c) => c !== 'RE-1')
      const code = autres.length ? ordreSelonManuel(autres, this.serie)[0] : 'RE-1'
      this.reparer(code)
    }
    throw new Error(`Le pilote n'arrive pas à tout réparer : ${modulesEnPanne(this.m).join(', ')}`)
  }

  reparer(code: string) {
    switch (code) {
      case 'TU-1': return this.tu1()
      case 'CH-1': return this.ch1()
      case 'AL-1': return this.al1()
      case 'CO-1': return this.co1()
      case 'PB-1': return this.pb1()
      case 'LP-1': return this.lp1()
      case 'HY-1': return this.hy1()
      case 'RE-1': return this.re1()
      case 'MO-1': return this.mo1()
      case 'CR-1': return this.cr1()
      case 'AN-1': return this.an1()
      case 'SX-1': return this.sx1()
    }
  }

  // Procédure 1 : abaisser L-A, attendre T-2 sous 40, relever L-A.
  tu1() {
    this.geste((m, c) => { const r = basculerLevierA(m.propulsion, c.t); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })
    while (this.m.propulsion.temperature >= 40) this.attendre(1)
    this.geste((m, c) => { const r = basculerLevierA(m.propulsion, c.t); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })
  }

  // Procédure 2 : M-1 en zone rouge → R sur 2 ; en zone bleue → R sur 7 ; presser P une fois ; replacer R sur 5.
  ch1() {
    while (this.m.propulsion.pression <= 70 && this.m.propulsion.pression >= 30) this.attendre(1)
    const molette = (n: number) => {
      while (this.m.propulsion.molette !== n) {
        this.geste((m) => { const r = tournerMolette(m.propulsion); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })
      }
    }
    molette(this.m.propulsion.pression > 50 ? 2 : 7)
    this.geste((m) => { const r = presserP(m.propulsion); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })
    molette(5)
  }

  // Page VII : S-4 bas, retirer le grillé, neuf de la bonne couleur (S-1 bas → jaune ; pair → même ; impair →
  // suivante, à partir du premier fusible grillé), S-4 haut.
  al1() {
    const i = this.m.al1.fusibles.findIndex((f) => f.etat === 'grille')
    const ordre = ['bleu', 'rouge', 'vert', 'jaune'] as const
    const k = ordre.indexOf(this.premierFusible as (typeof ordre)[number])
    const couleur = this.bas(1) ? 'jaune' : pair(this.serie) ? ordre[k] : ordre[(k + 1) % 4]
    if (!this.bas(4)) this.interrupteur(4)
    this.geste((m, c) => { const r = retirerFusible(m.al1, i, c); return { modules: { ...m, al1: r.etat }, evenements: r.evenements } })
    this.geste((m, c) => { const r = insererFusible(m.al1, i, couleur, c); return { modules: { ...m, al1: r.etat }, evenements: r.evenements } })
    this.interrupteur(4)
  }

  // Page VIII : chiffres du mot ; voyelle → inverser ; S-3 bas → +1 au dernier ; composer ; ÉMETTRE.
  co1() {
    let chiffres = MOTS[this.m.co1.mot!].split('')
    if (voyelle(this.serie)) chiffres = chiffres.reverse()
    if (this.bas(3)) chiffres[3] = String((Number(chiffres[3]) + 1) % 10)
    for (const ch of chiffres) this.geste((m) => { const r = composer(m.co1, ch); return { modules: { ...m, co1: r.etat }, evenements: r.evenements } })
    this.geste((m, c) => { const r = emettre(m.co1, c); return { modules: { ...m, co1: r.etat }, evenements: r.evenements } })
  }

  // Page IX : débrancher le câble défectueux, puis prise A et prise B du tableau (prise occupée → suivante libre).
  pb1() {
    const couleur = this.m.pb1.panne!
    const cable = this.m.pb1.cables.find((x) => x.couleur === couleur)!
    const prise = (rang: 'a' | 'b', n: number) => this.geste((m, c) => { const r = toucherPrise(m.pb1, rang, n, c); return { modules: { ...m, pb1: r.etat }, evenements: r.evenements } })
    prise('a', cable.a)
    let [a, b] = BRASSAGE[couleur][pair(this.serie) ? 0 : 1]
    while (this.m.pb1.cables.some((x) => x.a === a)) a = (a % 5) + 1
    while (this.m.pb1.cables.some((x) => x.b === b)) b = (b % 5) + 1
    prise('a', a)
    prise('b', b)
  }

  // Page XI : VT en marche ; éteintes, bleues, vertes ; à égalité croissant (pair) ou décroissant ; arrêter VT.
  lp1() {
    const vt = () => this.geste((m) => { const r = basculerVentilateur(m.lp1); return { modules: { ...m, lp1: r.etat }, evenements: r.evenements } })
    vt()
    for (const couleur of ['eteinte', 'bleue', 'verte']) {
      const n = this.m.lp1.lampes.map((l, i) => (l === couleur ? i : -1)).filter((i) => i >= 0)
      for (const i of pair(this.serie) ? n : n.reverse()) {
        this.geste((m, c) => { const r = toucherLampe(m.lp1, i, c); return { modules: { ...m, lp1: r.etat }, evenements: r.evenements } })
      }
    }
    vt()
  }

  // Page XII : manomètre H ; < 35 → R-1, 35 à 70 → R-2, > 70 → R-3 ; S-2 bas → suivant ; relier ; VANNE.
  hy1() {
    const h = this.m.hy1.manometre
    let r = h < 35 ? 0 : h <= 70 ? 1 : 2
    if (this.bas(2)) r = (r + 1) % 3
    const chemin = cheminVers(this.m.hy1.tuyaux, r)! // le « jeu du plombier » : trouver comment relier
    for (const [k, rot] of chemin) {
      while (this.m.hy1.tuyaux[k].rotation !== rot) {
        this.geste((m) => { const x = tournerTuyau(m.hy1, k); return { modules: { ...m, hy1: x.etat }, evenements: x.evenements } })
      }
    }
    this.geste((m, c) => { const x = ouvrirVanne(m.hy1, c); return { modules: { ...m, hy1: x.etat }, evenements: x.evenements } })
  }

  // Page XIII : ouvrir V-C, attendre CO2 bien sous 40, refermer, pomper jusqu'à la zone verte (60 à 90).
  re1() {
    const vanne = () => this.geste((m) => { const r = basculerVanne(m.re1); return { modules: { ...m, re1: r.etat }, evenements: r.evenements } })
    if (this.m.re1.co2 >= 35) { vanne(); while (this.m.re1.co2 >= 35) this.attendre(1); vanne() }
    while (this.m.re1.o2 < 60) this.geste((m) => { const r = pomper(m.re1); return { modules: { ...m, re1: r.etat }, evenements: r.evenements } })
    this.attendre(1)
  }

  // Page XIV : déchiffrer l'indicatif, fréquence de l'annuaire (+1,00 si S-1 bas), ÉMETTRE.
  mo1() {
    let lettre = ''
    let indicatif = ''
    for (const [allume, duree] of sequenceMorse(this.m.mo1.indicatif!)) {
      if (allume) lettre += duree < 0.4 ? '.' : '-'
      else if (duree > 0.4) { indicatif += Object.keys(MORSE).find((k) => MORSE[k] === lettre)!; lettre = '' }
    }
    const cible = ANNUAIRE[indicatif] + (this.bas(1) ? 1 : 0)
    while (Math.abs(this.m.mo1.frequence - cible) > 0.0001) {
      const ecart = cible - this.m.mo1.frequence
      const pas = Math.abs(ecart) >= 1 ? 1 : Math.abs(ecart) >= 0.1 ? 0.1 : 0.01
      this.geste((m) => { const r = reglerFrequence(m.mo1, Math.sign(ecart) * pas); return { modules: { ...m, mo1: r.etat }, evenements: r.evenements } })
    }
    this.geste((m, c) => { const r = emettreMorse(m.mo1, c); return { modules: { ...m, mo1: r.etat }, evenements: r.evenements } })
  }

  // Page XV : heure UTC + dernier chiffre en minutes ; régler H± M± ; RECALER.
  cr1() {
    for (let essai = 0; essai < 3; essai++) {
      const d = new Date(this.t + 1000) // l'heure au moment du prochain geste
      const voulu = (d.getUTCHours() * 60 + d.getUTCMinutes() + dernierChiffre(this.serie)) % 1440
      const aff = heureAffichee(this.m.cr1, this.t + 1000, this.serie)
      let ecart = voulu - (aff.heures * 60 + aff.minutes)
      if (ecart > 720) ecart -= 1440
      if (ecart < -720) ecart += 1440
      this.geste((m) => { const r = reglerChronometre(m.cr1, ecart); return { modules: { ...m, cr1: r.etat }, evenements: r.evenements } })
      this.geste((m) => { const r = recaler(m.cr1); return { modules: { ...m, cr1: r.etat }, evenements: r.evenements } })
      if (!this.m.cr1.avarie) return
    }
  }

  // Page XVII : direction de la Terre sur la carte (comme le cap), +180° si S-3 bas, VERROUILLER.
  an1() {
    const p = this.etat.fusee.position
    const terre = positionAstre('Terre', this.t + 1000)
    let voulu = (Math.atan2(terre.y - p.y, terre.x - p.x) * 180 / Math.PI + 360) % 360
    if (this.bas(3)) voulu = (voulu + 180) % 360
    const ecart = Math.round(voulu) - this.m.an1.orientation
    this.geste((m) => { const r = tournerAntenne(m.an1, ecart); return { modules: { ...m, an1: r.etat }, evenements: r.evenements } })
    this.geste((m, c) => { const r = verrouiller(m.an1, this.etat.fusee.position, c); return { modules: { ...m, an1: r.etat }, evenements: r.evenements } })
  }

  // Page XVI : étoile affichée (ou la suivante si impair), régler azimut et hauteur, RELEVÉ.
  sx1() {
    let k = ETOILES.findIndex((x) => x[0] === this.m.sx1.etoile)
    if (!pair(this.serie)) k = (k + 1) % ETOILES.length
    const [, az, ht] = ETOILES[k]
    this.geste((m) => { const r = reglerSextant(m.sx1, az - m.sx1.azimut, ht - m.sx1.hauteur); return { modules: { ...m, sx1: r.etat }, evenements: r.evenements } })
    this.geste((m, c) => { const r = releve(m.sx1, c); return { modules: { ...m, sx1: r.etat }, evenements: r.evenements } })
  }
}
