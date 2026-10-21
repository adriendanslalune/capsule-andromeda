// Le combat en temps réel (ABATTRE ; décision d'Adrien du 19/10/2026), vu du dessus comme les premiers jeux de tir sur
// Game Boy. La capsule suit le doigt et tire toute seule ; le chasseur visé par la mission (le « boss ») et ses
// escorteurs (de plus en plus nombreux loin de la Terre) tirent des balles à esquiver. Abattre le chasseur, c'est
// gagner ; coque à 0, c'est la retraite. Tout dépend du temps passé en paramètre et d'un hasard à graine.

import {
  BALLES_EVENTAIL, BOMBES, CADENCE, COQUE_MAX, DECALAGE_DOIGT, DEGATS_BOMBE, DEGATS_TIR, ESCORTEURS, FRENESIE_AMIRAL, HAUTEUR, INVULNERABLE,
  LARGEUR, PV_AMIRAL, PV_CHASSEUR, PV_ESCORTEUR, RAGE_AMIRAL, RAYON_CAPSULE, TIR_CHASSEUR, TIR_ESCORTEUR, VAGUE, VAGUE_FRENESIE,
  VITESSE_BALLES, VITESSE_CAPSULE, VITESSE_TIR,
} from '../donnees/combat'
import { hasard } from './contrats'

export type Motif = 'vise' | 'eventail' | 'pluie' | 'spirale'

export interface Alien {
  id: number
  chef: boolean
  x: number
  y: number
  pv: number
  pvMax: number
  /** Prochain tir (s), et le temps de vie (pour son mouvement). */
  prochainTir: number
  age: number
  /** Escorteur : son couloir (x de départ) et son sens. */
  couloir: number
  sens: 1 | -1
}

/** L'équipement de la capsule au combat (son armement, décisions d'Adrien du 21/10/2026). */
export interface Equipement {
  coque: number
  /** Dégâts de chaque tir (multiplicateur). */
  degats: number
  bombes: number
  /** Recharge du bouclier (s), 0 : pas de bouclier. */
  bouclier: number
  /** Une troisième balle, en éventail. */
  troisBalles: boolean
}
export const EQUIPEMENT_DEPART: Equipement = { coque: COQUE_MAX, degats: DEGATS_TIR, bombes: BOMBES, bouclier: 0, troisBalles: false }

export interface EtatCombat {
  graine: number
  equipement: Equipement
  /** Le bouclier est prêt à partir de cet instant (s) ; Infinity : pas de bouclier. */
  bouclierPret: number
  /** Volées tirées (la troisième balle part d'un côté, puis de l'autre). */
  volees: number
  niveau: number
  temps: number
  capsule: { x: number; y: number }
  coque: number
  invulnerableJusqua: number
  bombes: number
  prochainTir: number
  prochaineVague: number
  aliens: Alien[]
  tirs: { x: number; y: number; vx?: number }[]
  balles: { x: number; y: number; vx: number; vy: number }[]
  /** Éclats à montrer (où, quand, gros ou petit). */
  eclats: { x: number; y: number; t: number; gros: boolean }[]
  degatsRecus: number
  abattus: number
  prochainId: number
  fin: null | 'victoire' | 'retraite'
  /** Un vaisseau amiral (l'assaut final d'une zone) plutôt qu'un chasseur. */
  amiral?: boolean
  /** La dernière bombe lâchée : quand et d'où (pour l'onde de choc à l'écran). */
  derniereBombe?: { t: number; x: number; y: number }
}

export type EvenementCombat = 'touche' | 'bouclier' | 'escorteur-abattu' | 'victoire' | 'retraite'

/** Niveau d'un combat selon la zone du système (1 pour la Terre … 60 pour Pluton) : de 0 à 1. */
export function niveauDeZone(zone: number): number {
  return Math.min(1, Math.log2(Math.max(1, zone)) / Math.log2(60))
}
const entre = (ab: readonly [number, number], n: number) => ab[0] + (ab[1] - ab[0]) * n

/** Combien d'escorteurs à la fois, à ce niveau (trois de plus quand un amiral est en frénésie). */
export function escorteursMax(niveau: number, frenesie = false): number {
  return Math.round(entre(ESCORTEURS, niveau)) + (frenesie ? 3 : 0)
}

/** L'humeur du chef : calme, enragé (sous la moitié de ses points de vie, un amiral), en frénésie (sous le quart). */
function humeur(e: EtatCombat, a: Alien): 'calme' | 'rage' | 'frenesie' {
  if (!e.amiral || !a.chef || a.pv >= a.pvMax / 2) return 'calme'
  return a.pv < a.pvMax / 4 ? 'frenesie' : 'rage'
}
function frenesie(e: EtatCombat): boolean {
  const c = chef(e)
  return !!c && humeur(e, c) === 'frenesie'
}

function x01(e: EtatCombat): number {
  const h = hasard(e.graine)
  e.graine = h.graine
  return h.x
}

export function nouveauCombat(graine: number, zone = 1, amiral?: { planete: boolean }, equipement: Equipement = EQUIPEMENT_DEPART): EtatCombat {
  const niveau = niveauDeZone(zone)
  const pv = Math.round(entre(PV_CHASSEUR, niveau) * (amiral ? (amiral.planete ? PV_AMIRAL.planete : PV_AMIRAL.lune) : 1))
  return {
    amiral: !!amiral, equipement, bouclierPret: equipement.bouclier > 0 ? 0 : Infinity, volees: 0,
    graine, niveau, temps: 0, capsule: { x: LARGEUR / 2, y: HAUTEUR - 24 }, coque: equipement.coque, invulnerableJusqua: 0,
    bombes: equipement.bombes, prochainTir: 0, prochaineVague: 3,
    aliens: [{ id: 1, chef: true, x: LARGEUR / 2, y: -10, pv, pvMax: pv, prochainTir: 2.5, age: 0, couloir: LARGEUR / 2, sens: 1 }],
    tirs: [], balles: [], eclats: [], degatsRecus: 0, abattus: 0, prochainId: 2, fin: null,
  }
}

/** Le chasseur visé (le boss). */
export function chef(e: EtatCombat): Alien | undefined {
  return e.aliens.find((a) => a.chef)
}

function tirerBalles(e: EtatCombat, a: Alien): void {
  const v = entre(VITESSE_BALLES, e.niveau)
  const vers = (dx: number, dy: number, vitesse = v) => { const n = Math.hypot(dx, dy) || 1; e.balles.push({ x: a.x, y: a.y + 4, vx: (dx / n) * vitesse, vy: (dy / n) * vitesse }) }
  const dx = e.capsule.x - a.x, dy = e.capsule.y - a.y
  if (!a.chef) { vers(dx, dy); return }
  // Le chasseur alterne ses motifs : visé, en éventail, en pluie ; un amiral en rage tire aussi en spirale, et en
  // frénésie, ses tirs visés partent en rafale.
  const h = humeur(e, a)
  const motif: Motif = (['vise', 'eventail', 'pluie', 'spirale'] as Motif[])[Math.floor(x01(e) * (h !== 'calme' ? 4 : 3))]
  if (motif === 'vise' && h === 'frenesie') { for (const d of [-24, -12, 0, 12, 24]) vers(dx + d, dy); return }
  if (motif === 'spirale') {
    const debut = e.temps * 2.3
    for (let k = 0; k < 10; k++) { const ang = debut + (k / 10) * 2 * Math.PI; vers(Math.cos(ang), Math.abs(Math.sin(ang)) + 0.2, v * 0.8) }
    return
  }
  if (motif === 'vise') { vers(dx, dy); vers(dx - 12, dy); vers(dx + 12, dy) } else if (motif === 'eventail') {
    const n = Math.round(entre(BALLES_EVENTAIL, e.niveau))
    for (let k = 0; k < n; k++) { const ang = Math.PI / 2 + (k - (n - 1) / 2) * 0.22; vers(Math.cos(ang), Math.sin(ang)) }
  } else for (let k = 0; k < 4; k++) e.balles.push({ x: a.x + (k - 1.5) * 9, y: a.y + 4, vx: 0, vy: v * 0.85 })
}

/** Une vague d'escorteurs, jusqu'au nombre permis à ce niveau. */
function vague(e: EtatCombat): void {
  const max = escorteursMax(e.niveau, frenesie(e))
  const presents = e.aliens.filter((a) => !a.chef).length
  for (let k = presents; k < max; k++) {
    const couloir = 12 + 76 * x01(e)
    e.aliens.push({ id: e.prochainId++, chef: false, x: couloir, y: -8 - 10 * k, pv: Math.round(entre(PV_ESCORTEUR, e.niveau)), pvMax: Math.round(entre(PV_ESCORTEUR, e.niveau)), prochainTir: 1 + 2 * x01(e), age: 0, couloir, sens: x01(e) < 0.5 ? -1 : 1 })
  }
}

/** Lâche une bombe : toutes les balles disparaissent, tous les aliens sont abîmés. */
export function bombe(e: EtatCombat): boolean {
  if (e.fin || e.bombes === 0) return false
  e.bombes--
  e.derniereBombe = { t: e.temps, x: e.capsule.x, y: e.capsule.y }
  // Chaque balle effacée laisse une étincelle.
  for (const b of e.balles.slice(0, 60)) e.eclats.push({ x: b.x, y: b.y, t: e.temps, gros: false })
  e.balles = []
  for (const a of e.aliens) { a.pv -= DEGATS_BOMBE; e.eclats.push({ x: a.x, y: a.y, t: e.temps, gros: true }) }
  return true
}

export function retraite(e: EtatCombat): void {
  if (!e.fin) e.fin = 'retraite'
}

/**
 * Fait avancer de dt secondes. `doigt` : où est le doigt (unités du terrain), ou null s'il est levé ; la capsule va
 * se placer au-dessus de lui (DECALAGE_DOIGT), à vitesse limitée.
 */
export function avancerCombat(e: EtatCombat, dt: number, doigt: { x: number; y: number } | null): EvenementCombat[] {
  if (e.fin) return []
  const ev: EvenementCombat[] = []
  e.temps += dt
  e.eclats = e.eclats.filter((x) => e.temps - x.t < 0.5)
  // La capsule suit le doigt.
  if (doigt) {
    const cx = Math.max(4, Math.min(LARGEUR - 4, doigt.x)), cy = Math.max(HAUTEUR * 0.35, Math.min(HAUTEUR - 6, doigt.y - DECALAGE_DOIGT))
    const dx = cx - e.capsule.x, dy = cy - e.capsule.y, d = Math.hypot(dx, dy), pas = VITESSE_CAPSULE * dt
    if (d <= pas) e.capsule = { x: cx, y: cy }
    else e.capsule = { x: e.capsule.x + (dx / d) * pas, y: e.capsule.y + (dy / d) * pas }
  }
  // Le tir automatique.
  if (e.temps >= e.prochainTir) {
    e.tirs.push({ x: e.capsule.x - 1.5, y: e.capsule.y - 5 }, { x: e.capsule.x + 1.5, y: e.capsule.y - 5 })
    // Le canon amélioré : une troisième balle, d'un côté puis de l'autre (un éventail).
    if (e.equipement.troisBalles) e.tirs.push({ x: e.capsule.x, y: e.capsule.y - 6, vx: (e.volees % 2 ? 1 : -1) * VITESSE_TIR * 0.22 })
    e.volees++
    e.prochainTir = e.temps + CADENCE
  }
  for (const t of e.tirs) { t.y -= VITESSE_TIR * dt; t.x += (t.vx ?? 0) * dt }
  e.tirs = e.tirs.filter((t) => t.y > -5 && t.x > -5 && t.x < LARGEUR + 5)
  // Les vagues d'escorteurs.
  if (e.temps >= e.prochaineVague) { vague(e); e.prochaineVague = e.temps + (frenesie(e) ? VAGUE_FRENESIE : VAGUE) }
  // Les aliens bougent et tirent.
  for (const a of e.aliens) {
    a.age += dt
    if (a.chef) {
      a.y = Math.min(28, a.y + 20 * dt)
      a.x = LARGEUR / 2 + 32 * Math.sin(a.age * 0.7) * Math.cos(a.age * 0.23)
    } else {
      a.y += (14 + 6 * e.niveau) * dt
      a.x = a.couloir + a.sens * 14 * Math.sin(a.age * 1.6)
      if (a.y > HAUTEUR + 10) { a.y = -10; a.couloir = 12 + 76 * x01(e) }
    }
    if (a.y > 0 && e.temps >= a.prochainTir) {
      tirerBalles(e, a)
      const h = humeur(e, a), rythme = h === 'frenesie' ? FRENESIE_AMIRAL : h === 'rage' ? RAGE_AMIRAL : 1
      a.prochainTir = e.temps + (a.chef ? entre(TIR_CHASSEUR, e.niveau) * rythme : entre(TIR_ESCORTEUR, e.niveau)) * (0.8 + 0.4 * x01(e))
    }
  }
  // Nos tirs touchent les aliens.
  for (const t of [...e.tirs]) {
    const a = e.aliens.find((x) => Math.abs(x.x - t.x) < (x.chef ? (e.amiral ? 14 : 9) : 5) && Math.abs(x.y - t.y) < (x.chef ? (e.amiral ? 8 : 6) : 4))
    if (!a) continue
    a.pv -= e.equipement.degats
    e.tirs = e.tirs.filter((x) => x !== t)
    e.eclats.push({ x: t.x, y: t.y, t: e.temps, gros: false })
  }
  for (const a of [...e.aliens]) {
    if (a.pv > 0) continue
    e.aliens = e.aliens.filter((x) => x !== a)
    e.eclats.push({ x: a.x, y: a.y, t: e.temps, gros: true })
    if (a.chef) { e.fin = 'victoire'; ev.push('victoire'); return ev }
    e.abattus++
    ev.push('escorteur-abattu')
  }
  // Les balles ennemies : elles avancent ; une qui touche la capsule l'abîme (puis un instant d'invulnérabilité).
  for (const b of e.balles) { b.x += b.vx * dt; b.y += b.vy * dt }
  e.balles = e.balles.filter((b) => b.x > -5 && b.x < LARGEUR + 5 && b.y > -10 && b.y < HAUTEUR + 5)
  const touche = e.balles.find((b) => Math.hypot(b.x - e.capsule.x, b.y - e.capsule.y) < RAYON_CAPSULE + 1.2)
  // Un alien qui percute la capsule, c'est pareil.
  const percute = e.aliens.find((a) => Math.hypot(a.x - e.capsule.x, a.y - e.capsule.y) < (a.chef ? 8 : 5))
  if ((touche || percute) && e.temps >= e.invulnerableJusqua) {
    if (touche) e.balles = e.balles.filter((b) => b !== touche)
    // Le bouclier, s'il est chargé, encaisse le coup à la place de la coque, puis se recharge.
    if (e.temps >= e.bouclierPret) {
      e.bouclierPret = e.temps + e.equipement.bouclier
      e.invulnerableJusqua = e.temps + INVULNERABLE
      ev.push('bouclier')
      return ev
    }
    e.coque--
    e.degatsRecus++
    e.invulnerableJusqua = e.temps + INVULNERABLE
    e.eclats.push({ x: e.capsule.x, y: e.capsule.y, t: e.temps, gros: false })
    ev.push('touche')
    if (e.coque <= 0) { e.fin = 'retraite'; ev.push('retraite') }
  }
  return ev
}
