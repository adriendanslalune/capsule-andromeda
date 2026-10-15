// Chasse au visiteur. Chaque mois (saison), un visiteur fait une boucle de 3 ou 4 escales, une par jour (voir
// visiteur.ts). Indices : ping radio, bulletins de l'Observatoire et transmissions (à écouter sur le poste radio,
// radio.ts), télescope TEL, détecteur DET.
// Trouvaille (décisions d'Adrien du 13/10/2026) : repérer la soucoupe dans la vue 3D (on ne peut la toucher qu'à
// moins de 300 000 km), s'en approcher (la fusée s'arrête à environ 200 m), puis la photographier à moins de 300 m.
// Chaque trouvaille est annoncée à tous les joueurs ; le premier de la saison reçoit la couronne et la fusée en or
// (attribuées par le serveur, en phase 4).

import { delaiLumiere, SECONDES_LUMIERE_PAR_UA } from '../astro/lumiere'
import { UA_KM } from '../astro/temps'
import { CHASSE as C } from '../donnees/chasse'
import { RADIO } from '../donnees/radio'
import { crediter, estInstalle } from './economie'
import type { EtatPartie } from './etat'
import { direction, distance, type Point2 } from './fusee'
import { type Hasard } from './hasard'
import { bornerFrequence, capter, frequenceVisiteur, surFrequence } from './radio'
import { numeroSaison, positionVisiteur } from './visiteur'

export { boucleSaison, debutSaison, escaleDuJour, finSaison, numeroSaison, positionVisiteur } from './visiteur'

const HEURE = 3_600_000

export interface Indice {
  t: number
  texte: string
}

/** Une trouvaille : de quoi l'annoncer à tous (le serveur y joindra la photo). */
export interface Trouvaille {
  saison: number
  t: number
  /** Nom de la fusée, choisi par le joueur. */
  nomFusee: string
  serie: string
  /** Astre près duquel le visiteur a été photographié. */
  astre: string
}

export interface EtatChasse {
  /** Fréquence du poste radio. */
  frequenceRadio: number
  /** Échos attendus : instant de retour et durée de l'aller-retour (ms). */
  pings: { retour: number; duree: number }[]
  /** Radio disponible à partir de cet instant (ms UTC). */
  radioPrete: number
  /** Position de la fusée au dernier ping (pour tracer le cercle sur la carte). */
  dernierPing: Point2 | null
  /** Dernier écho reçu : instant de réception et durée de l'aller-retour (ms) ; absent des anciennes sauvegardes. */
  dernierEcho?: { t: number; duree: number }
  /** Télescope disponible à partir de cet instant (ms UTC). */
  telescopePret: number
  /** Position de la fusée et direction lue à la dernière visée du télescope (pour tracer la droite). */
  derniereVisee: (Point2 & { direction: number | null }) | null
  /** Dernier bulletin de l'Observatoire et dernière transmission reçus (numéros de créneau). */
  bulletin: number
  transmission: number
  /** Trouvailles du joueur (une par saison au plus). */
  trouvailles: Trouvaille[]
  /** Indices reçus, le plus récent en premier. */
  indices: Indice[]
}

export function creerChasse(t: number): EtatChasse {
  return {
    frequenceRadio: RADIO.depart,
    pings: [],
    radioPrete: t,
    dernierPing: null,
    telescopePret: t,
    derniereVisee: null,
    // Rien d'entendu encore : la première écoute de l'Observatoire ou des transmissions donne leur dernier message.
    bulletin: Math.floor(t / (C.bulletinHeures * HEURE)) - 2,
    transmission: Math.floor(t / (C.transmissionHeures * HEURE)) - 1,
    trouvailles: [],
    indices: [],
  }
}

export interface ResultatChasse {
  etat: EtatPartie
  messages: string[]
}

const chiffre = (x: number, d: number) => x.toFixed(d).replace('.', ',')

function avecIndice(e: EtatPartie, t: number, texte: string): EtatPartie {
  const indices = [{ t, texte }, ...e.chasse.indices].slice(0, C.indicesGardes)
  return { ...e, chasse: { ...e.chasse, indices } }
}

/** Distance (km) entre la fusée et le visiteur, dans le plan de la carte. */
export function distanceVisiteurKm(etat: EtatPartie, t: number): number {
  return distance(etat.fusee.position, positionVisiteur(t)) * UA_KM
}

/** Durée d'un écho, en clair : « 1 H 23 MIN 05 S ». */
export function dureeEcho(ms: number): string {
  const s = Math.round(ms / 1000)
  const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60
  return `${h ? `${h} H ` : ''}${mi} MIN ${String(se).padStart(2, '0')} S`
}

// ---------------------------------------------------------------------------------------------------------------
// Instruments

/** Décale la fréquence de la radio (au centième, de 0 à 12). */
export function reglerRadio(etat: EtatPartie, ecart: number): EtatPartie {
  return reglerRadioSur(etat, etat.chasse.frequenceRadio + ecart)
}

/** Règle la radio sur une fréquence (au centième, de 0 à 12). */
export function reglerRadioSur(etat: EtatPartie, f: number): EtatPartie {
  const b = bornerFrequence(f)
  return b === etat.chasse.frequenceRadio ? etat : { ...etat, chasse: { ...etat.chasse, frequenceRadio: b } }
}

/**
 * Ping radio (bouton ÉMETTRE du poste). Recharge de 5 minutes. Sur la fréquence du visiteur de la saison (± 0,05), un
 * écho reviendra après l'aller-retour de la lumière entre la fusée et le visiteur ; sur une autre fréquence, aucun écho.
 */
export function ping(etat: EtatPartie, t: number): ResultatChasse {
  const c = etat.chasse
  if (t < c.radioPrete) return { etat, messages: ['RADIO EN RECHARGE.'] }
  const f = chiffre(c.frequenceRadio, 2)
  let e: EtatPartie = {
    ...etat,
    chasse: { ...c, radioPrete: t + C.rechargePingMinutes * 60_000, dernierPing: { ...etat.fusee.position } },
  }
  if (!surFrequence(c.frequenceRadio, frequenceVisiteur(t))) {
    return { etat: e, messages: [`PING ÉMIS SUR ${f}.`, `AUCUN ÉCHO SUR ${f}.`] }
  }
  const d = distance(etat.fusee.position, positionVisiteur(t))
  const duree = 2 * delaiLumiere(d) * 1000
  e = { ...e, chasse: { ...e.chasse, pings: [...e.chasse.pings, { retour: t + duree, duree }] } }
  return { etat: e, messages: [`PING ÉMIS SUR ${f}. ÉCOUTE EN COURS…`] }
}

/** Distance du visiteur (UA) d'après la durée d'un écho (ms) : la moitié de l'aller-retour, à la vitesse de la lumière. */
export function distanceEcho(dureeMs: number): number {
  return dureeMs / 1000 / 2 / SECONDES_LUMIERE_PAR_UA
}

/**
 * Télescope TEL (s'il est installé). Recharge de 30 minutes. Si le visiteur est à moins de 3 UA : sa direction à
 * ± 3° près ; sinon, rien.
 */
export function viserTelescope(etat: EtatPartie, t: number, hasard: Hasard): ResultatChasse {
  if (!estInstalle(etat, 'TEL')) return { etat, messages: [] }
  const c = etat.chasse
  if (t < c.telescopePret) return { etat, messages: ['TÉLESCOPE EN RECHARGE.'] }
  const v = positionVisiteur(t)
  const pos = etat.fusee.position
  const base = { ...c, telescopePret: t + C.rechargeTelescopeMinutes * 60_000 }
  if (distance(pos, v) > C.porteeTelescope) {
    const e = avecIndice({ ...etat, chasse: { ...base, derniereVisee: { ...pos, direction: null } } }, t, 'TÉLESCOPE : RIEN À MOINS DE 3 UA.')
    return { etat: e, messages: ['TÉLESCOPE : RIEN DANS LA PORTÉE.'] }
  }
  const a = Math.round((direction(pos, v) + (hasard() * 2 - 1) * C.erreurTelescopeDegres + 360) % 360) % 360
  const e = avecIndice({ ...etat, chasse: { ...base, derniereVisee: { ...pos, direction: a } } }, t, `VISÉE : ${a}°.`)
  return { etat: e, messages: [`TÉLESCOPE : OBJET VISÉ À ${a}°.`] }
}

/** Distance du visiteur (UA) si le détecteur DET est installé et qu'il est à moins de 1,5 UA ; sinon null. */
export function visiteurDetecte(etat: EtatPartie, t: number): number | null {
  if (!estInstalle(etat, 'DET')) return null
  const d = distance(etat.fusee.position, positionVisiteur(t))
  return d <= C.porteeDetecteur ? d : null
}

// ---------------------------------------------------------------------------------------------------------------
// Trouvaille

/**
 * Vrai si la soucoupe peut être touchée dans la vue 3D : fusée à moins de 300 000 km du visiteur, et visiteur à son
 * escale (pendant son voyage du matin, il va bien trop vite pour être approché).
 */
export function visiteurAPortee(etat: EtatPartie, t: number): boolean {
  return !positionVisiteur(t).enVoyage && distanceVisiteurKm(etat, t) <= C.distanceReperageKm
}

/**
 * Le joueur a touché la soucoupe dans la vue 3D : la fusée s'en approche (elle s'arrêtera à environ 200 m).
 * Refusé si le visiteur est trop loin pour avoir été vu.
 */
export function approcherVisiteur(etat: EtatPartie, t: number): ResultatChasse {
  if (!visiteurAPortee(etat, t)) return { etat, messages: [] }
  const astre = positionVisiteur(t).astre
  const fusee = { ...etat.fusee, destination: { type: 'visiteur' as const, astre }, fenetre: null, presDuVisiteur: false }
  return { etat: { ...etat, fusee }, messages: ['APPROCHE DE L’OBJET INCONNU.'] }
}

/**
 * Photo prise depuis la fusée : valable à moins de 300 m du visiteur. Une trouvaille par saison et par joueur :
 * 250 CR et le trophée « Premier contact ». Renvoie la trouvaille, à annoncer à tous les joueurs.
 */
export function photographierVisiteur(etat: EtatPartie, t: number): ResultatChasse & { trouvaille: Trouvaille | null } {
  const v = positionVisiteur(t)
  if (distanceVisiteurKm(etat, t) > C.distancePhotoKm) {
    return { etat, messages: ['PHOTO PRISE. RIEN DE NOTABLE SUR LE CLICHÉ.'], trouvaille: null }
  }
  const saison = numeroSaison(t)
  if (etat.chasse.trouvailles.some((x) => x.saison === saison)) {
    return { etat, messages: ['PHOTO PRISE. VISITEUR DÉJÀ SIGNALÉ CETTE SAISON.'], trouvaille: null }
  }
  const trouvaille: Trouvaille = { saison, t, nomFusee: etat.nom, serie: etat.serie, astre: v.astre }
  let e: EtatPartie = { ...etat, chasse: { ...etat.chasse, trouvailles: [...etat.chasse.trouvailles, trouvaille] } }
  e = crediter(e, C.primeTrouvaille, `Visiteur, saison ${saison}`, t)
  if (!e.trophees.includes('contact')) e = { ...e, trophees: [...e.trophees, 'contact'] }
  e = avecIndice(e, t, 'VISITEUR PHOTOGRAPHIÉ.')
  return { etat: e, messages: [`VISITEUR PHOTOGRAPHIÉ PRÈS DE ${v.astre.toUpperCase()} ! LA PHOTO EST TRANSMISE À L’OFFICE.`], trouvaille }
}

// ---------------------------------------------------------------------------------------------------------------
// Indices qui arrivent tout seuls

/**
 * Fait vivre la chasse à l'instant t : échos qui reviennent ; et, si la radio est réglée sur l'Observatoire ou sur
 * les transmissions, leur dernier message (une seule fois chacun). Après une longue absence, radio restée sur l'une
 * d'elles : le plus récent seulement.
 */
export function evoluerChasse(etat: EtatPartie, t: number): ResultatChasse {
  let e = etat
  const messages: string[] = []

  const revenus = e.chasse.pings.filter((p) => t >= p.retour)
  if (revenus.length) {
    e = { ...e, chasse: { ...e.chasse, pings: e.chasse.pings.filter((p) => t < p.retour) } }
    for (const p of revenus) {
      e = { ...e, chasse: { ...e.chasse, dernierEcho: { t, duree: p.duree } } }
      const m = `ÉCHO REÇU APRÈS ${dureeEcho(p.duree)}.`
      messages.push(m)
      e = avecIndice(e, t, m)
    }
  }

  const r = capter(e, t)
  if (r.nettete === 1 && r.emission?.sorte === 'observatoire' && r.emission.creneau > e.chasse.bulletin) {
    e = avecIndice({ ...e, chasse: { ...e.chasse, bulletin: r.emission.creneau } }, t, r.emission.texte)
    messages.push(r.emission.texte)
  }
  if (r.nettete === 1 && r.emission?.sorte === 'transmissions' && r.emission.creneau > e.chasse.transmission) {
    e = avecIndice({ ...e, chasse: { ...e.chasse, transmission: r.emission.creneau } }, t, r.emission.texte)
    messages.push(r.emission.texte)
  }
  return { etat: e, messages }
}
