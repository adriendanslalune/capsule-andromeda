// Les quêtes et les PNJ (décisions d'Adrien du 20/10/2026) : ce qui est proposé, ce que dit un PNJ quand on lui parle,
// et l'avancement des étapes, qui se cochent toutes seules (missions finies, lieux atteints, marchandises livrées,
// monolithes trouvés). L'affichage (journal, dialogue, carte) demande tout ici.

import { PNJS, QUETES, type EtapeQuete, type Pnj, type Quete } from '../donnees/quetes'
import type { Contrat } from './contrats'
import type { Jeu } from './jeu'
import { deLa, estLibre, jauge, zone } from './zones'
import { XP } from '../donnees/niveaux'
import type { Instrument } from '../donnees/instruments'
import { MODULES } from '../donnees/modules'
import { COMPAGNIES } from '../donnees/bourse'
import { MARCHES } from '../donnees/marche'
import { ZONES_A_LIBERER } from '../donnees/zones'
import { zoneDuLieu } from './zones'
import { systemeDuTableau } from '../donnees/tableaux'
import type { MessageRadio, SuiteEtape } from '../donnees/quetes'
import type { TexteVoix } from '../donnees/radio'
import { DUREE_ENREGISTREMENT } from '../donnees/radio'
import { nettete } from './radio'
import { PORTEE_RADAR } from './radar'
import { DISPARUS } from '../donnees/disparus'
import { position } from './corps'
import { C_KM_S } from './navigation'
import { ajouterPoints } from './zones'

/** Où en est une quête commencée. */
export interface EtatQuete {
  /** Étape en cours (son numéro) ; égale au nombre d'étapes quand la quête est finie. */
  etape: number
  /** Compteur de l'étape en cours (missions finies, monolithes trouvés depuis son début). */
  compte: number
  /** Acceptée à cet instant ; finie à cet instant (ou null). */
  debut: number
  fin: number | null
  /** Début de l'étape en cours (ce qui compte pour elle : un chasseur repéré, un écho revenu depuis). */
  depuis?: number
}

/** Un message radio d'un PNJ reçu par la capsule : il part de chez lui et arrive au délai de la lumière. */
export interface RadioPnj { id: number; pnj: string; texte: string[]; envoye: number; arrivee: number; lu: boolean; quete?: string }

/** Ce qui fait avancer les quêtes. */
export type FaitDeJeu = { genre: 'contrat'; contrat: Contrat } | { genre: 'monolithe' } | { genre: 'instant' } | { genre: 'assaut'; zone: string }
  | { genre: 'chasseur'; systeme: string | null }

/** Ce que dit un PNJ quand on lui parle. */
export interface Dialogue {
  pnj: Pnj
  pages: string[]
  /** Une quête qu'il propose (boutons ACCEPTER / PLUS TARD). */
  proposition: Quete | null
  /** Une quête qu'on vient de finir avec lui (et sa récompense). */
  terminee: Quete | null
  /** Un message reçu par radio (il parle de loin) : son délai de la lumière (ms). */
  radio?: { delai: number }
  /** La quête qu'il ouvre (par radio, elle est prise d'office). */
  nouvelle?: Quete
}

export function pnj(id: string): Pnj {
  return PNJS.find((p) => p.id === id)!
}

export function quete(id: string): Quete {
  return QUETES.find((q) => q.id === id)!
}

const finie = (jeu: Jeu, id: string) => jeu.quetes[id]?.fin != null

/** Les quêtes qu'on peut se voir proposer (conditions remplies, pas encore acceptées). */
export function disponibles(jeu: Jeu): Quete[] {
  // Avant la fin de la présentation du monde, l'histoire n'a pas commencé.
  if (!jeu.presentation) return []
  // Les quêtes secondaires d'un PNJ ne s'ouvrent qu'une fois sa zone libérée (décision d'Adrien du 21/10/2026).
  return QUETES.filter((q) => !jeu.quetes[q.id] && q.conditions.every((c) => finie(jeu, c))
    && (q.type === 'principale' || estLibre(jeu.zones, pnj(q.donneur).lieu)))
}

/**
 * Les quêtes principales qui attendent qu'on vienne les prendre (Adrien, 22/10/2026 : une quête de la campagne doit être
 * dans les quêtes principales, pas cachée) : le Journal les montre avec les principales en cours, leur objectif est
 * « parle à leur donneur » ; on peut les suivre. Les secondaires se découvrent sur la carte (« ! »).
 */
export function principalesAPrendre(jeu: Jeu): Quete[] {
  return disponibles(jeu).filter((q) => q.type === 'principale')
}

/** La quête à suivre quand rien ne l'est plus : une principale en cours, sinon une principale à prendre, sinon une autre en cours. */
export function queteASuivre(jeu: Jeu): string | null {
  const cours = enCours(jeu)
  return (cours.find((q) => q.type === 'principale') ?? principalesAPrendre(jeu)[0] ?? cours[0])?.id ?? null
}

/**
 * Au chargement : une quête suivie qui n'est plus en cours (ni à prendre) est remplacée ; une secondaire suivie cède la
 * place à la campagne quand aucune principale n'est en cours mais qu'une attend d'être prise (Adrien, 22/10/2026).
 */
export function rattraperSuivi(jeu: Jeu): void {
  const s = jeu.queteSuivie ? QUETES.find((q) => q.id === jeu.queteSuivie) : undefined
  const valide = !!s && (enCours(jeu).includes(s) || principalesAPrendre(jeu).includes(s))
  const campagneOubliee = s?.type === 'secondaire' && !enCours(jeu).some((q) => q.type === 'principale') && principalesAPrendre(jeu).length > 0
  if (!valide || campagneOubliee) jeu.queteSuivie = queteASuivre(jeu)
}

/**
 * La suite de l'histoire (Adrien, 22/10/2026 : « le tableau de bord doit TOUJOURS afficher la suite de l'histoire ; un
 * joueur ne doit jamais se demander ce qu'il doit faire ») : la quête principale en cours, sinon celle qui attend qu'on
 * vienne la prendre ; null quand la campagne écrite est finie.
 */
export function suiteDeLHistoire(jeu: Jeu): Quete | null {
  return enCours(jeu).find((q) => q.type === 'principale') ?? principalesAPrendre(jeu)[0] ?? null
}

/** Les quêtes en cours, les principales d'abord. */
export function enCours(jeu: Jeu): Quete[] {
  return QUETES.filter((q) => jeu.quetes[q.id] && jeu.quetes[q.id].fin == null)
    .sort((a, b) => Number(b.type === 'principale') - Number(a.type === 'principale'))
}

/** Les quêtes finies, les plus récentes d'abord. */
export function terminees(jeu: Jeu): Quete[] {
  return QUETES.filter((q) => finie(jeu, q.id)).sort((a, b) => jeu.quetes[b.id].fin! - jeu.quetes[a.id].fin!)
}

/** L'étape en cours d'une quête commencée (null si elle est finie). */
export function etapeCourante(jeu: Jeu, q: Quete): EtapeQuete | null {
  const e = jeu.quetes[q.id]
  return e && e.fin == null ? q.etapes[e.etape] ?? null : null
}

/** Le lieu d'une étape (où aller), ou null. */
export function lieuEtape(e: EtapeQuete): string | null {
  if (e.genre === 'parler') return pnj(e.pnj).lieu
  if (e.genre === 'aller' || e.genre === 'livrer') return e.lieu
  if (e.genre === 'jauge' || e.genre === 'assaut') return e.zone
  if (e.genre === 'radar' && e.lieu) return e.lieu
  if (e.genre === 'disparu') return DISPARUS.find((d) => d.nom === e.nom)?.nom ?? null
  return null
}

const tonnes = (m: Record<string, number>) => Object.entries(m).map(([nom, t]) => `${t} t de ${nom.toLowerCase()}`).join(' et ')

/** L'énoncé d'une étape (pour le journal et le suivi sur la carte). */
export function texteEtape(e: EtapeQuete): string {
  switch (e.genre) {
    case 'parler': { const p = pnj(e.pnj); return `Parle ${/^(Dr|Le) /.test(p.nom) ? `au ${p.nom.replace(/^Le /, '')}` : `à ${p.nom}`} (${p.lieu})` }
    case 'aller': return `Va en orbite autour de : ${e.lieu}`
    case 'mission': return e.texte
    case 'livrer': return `Apporte ${tonnes(e.marchandises)} en orbite à : ${e.lieu}`
    case 'monolithes': return `Trouve ${e.nombre > 1 ? `${e.nombre} monolithes` : 'un monolithe'} (bouton PING de la carte)`
    case 'jauge': return `Porte la résistance ${deLa(e.zone)} à 100 % : contrats, chasseurs, monolithes près d'elle`
    case 'assaut': return `Attaque ${zone(e.zone)?.amiral ?? 'le vaisseau amiral'} : en orbite autour ${deLa(e.zone)}, touche ASSAUT`
    case 'liberer': return e.texte
    case 'chasseurs': return e.texte
    case 'signal': return e.enonce
    case 'radar': return e.texte
    case 'disparu': return `Retrouve ${e.nom} (les Disparus : radar allumé, puis en orbite autour)`
    case 'moteur': return `Installe le moteur de niveau ${e.niveau} (Capsule › MOTEUR)`
    case 'reparer': return `Répare le module ${MODULES.find((m) => m.nom === e.module)!.titre} sur le panneau (Capsule › RÉPARATION)`
    case 'ping': return 'Envoie un PING (bouton PING de la carte) et attends son écho'
  }
}

/** L'objectif en cours d'une quête : son énoncé, son compteur (« 1/2 ») et son lieu. */
export function objectif(jeu: Jeu, q: Quete): { texte: string; compte: string | null; lieu: string | null } | null {
  // Une principale pas encore prise : aller parler à celui qui la donne.
  if (!jeu.quetes[q.id] && q.type === 'principale' && disponibles(jeu).includes(q)) {
    const premier: EtapeQuete = { genre: 'parler', pnj: q.donneur, texte: [] }
    return { texte: texteEtape(premier), compte: null, lieu: lieuEtape(premier) }
  }
  const e = etapeCourante(jeu, q)
  if (!e) return null
  const n = e.genre === 'mission' || e.genre === 'monolithes' || e.genre === 'chasseurs' ? e.nombre : 0
  const compte = e.genre === 'jauge' ? `${jauge(jeu.zones, e.zone)} %`
    : e.genre === 'liberer' ? `${e.zones.filter((z) => jeu.zones.liberees.includes(z)).length}/${e.zones.length}`
      : n > 1 ? `${jeu.quetes[q.id].compte}/${n}` : null
  return { texte: texteEtape(e), compte, lieu: lieuEtape(e) }
}

/** Le signe d'un PNJ sur la carte : « ? » s'il attend qu'on revienne lui parler, « ! » s'il a une quête à proposer. */
export function signePnj(jeu: Jeu, id: string): { signe: '!' | '?'; principale: boolean } | null {
  const attend = enCours(jeu).filter((q) => { const e = etapeCourante(jeu, q); return e?.genre === 'parler' && e.pnj === id })
  if (attend.length) return { signe: '?', principale: attend.some((q) => q.type === 'principale') }
  const propose = disponibles(jeu).filter((q) => q.donneur === id)
  if (propose.length) return { signe: '!', principale: propose.some((q) => q.type === 'principale') }
  return null
}

/** Les PNJ du lieu où la capsule est en orbite (pour le bouton PARLER), ceux qui ont quelque chose à dire d'abord. */
export function pnjIci(jeu: Jeu, t: number): Pnj[] {
  const lieu = jeu.lieuEnOrbite(t)
  if (!lieu) return []
  return PNJS.filter((p) => p.lieu === lieu).sort((a, b) => Number(!!signePnj(jeu, b.id)) - Number(!!signePnj(jeu, a.id)))
}

/** Passe à l'étape suivante d'une quête ; à la dernière, la quête est finie (récompense, zone libérée). */
function franchir(jeu: Jeu, q: Quete, t: number): string[] {
  const e = jeu.quetes[q.id]
  const annonces = suivreEtape(jeu, q.etapes[e.etape], t)
  e.etape++
  e.compte = 0
  e.depuis = t
  if (e.etape < q.etapes.length) return annonces
  finir(jeu, q, t)
  return annonces
}

/** Une quête finie : sa récompense, ce qu'elle installe, la zone qu'elle libère, la suivante à suivre. */
function finir(jeu: Jeu, q: Quete, t: number): void {
  const e = jeu.quetes[q.id]
  e.etape = q.etapes.length
  e.fin = t
  for (const i of q.ouvre ?? []) if (!jeu.installes.includes(i)) jeu.installes.push(i)
  jeu.credits += q.recompense
  jeu.gagnerXp(Math.min(XP.quete[1], Math.max(XP.quete[0], q.recompense / 10)))
  if (q.libere && !jeu.zones.liberees.includes(q.libere)) jeu.gagnerAssaut(q.libere, t)
  // La suivante à suivre ; une principale qui s'ouvre passe devant une secondaire suivie.
  const suivie = jeu.queteSuivie ? quete(jeu.queteSuivie) : null
  if (!suivie || suivie.id === q.id || (suivie.type === 'secondaire' && principalesAPrendre(jeu).length)) jeu.queteSuivie = queteASuivre(jeu)
}

/** Ce qui suit une étape franchie : sa part de la jauge, la réponse radio d'un PNJ. */
function suivreEtape(jeu: Jeu, e: SuiteEtape | undefined, t: number): string[] {
  const annonces: string[] = []
  if (e?.jauge) {
    const z = zone(e.jauge.zone)
    if (z) annonces.push(...ajouterPoints(jeu.zones, z.nom, (z.seuil * e.jauge.part) / 100))
  }
  if (e?.radio) envoyerRadio(jeu, e.radio, t)
  return annonces
}

/** Délai de la lumière (ms) entre le lieu d'un PNJ et la capsule. */
export function delaiRadio(jeu: Jeu, id: string, t: number): number {
  const a = position(pnj(id).lieu, t), b = jeu.mission.etat(t).position
  return (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) / C_KM_S) * 1000
}

/** Un PNJ envoie un message radio à la capsule : il arrive au délai de la lumière. */
export function envoyerRadio(jeu: Jeu, m: MessageRadio, t: number, queteOuverte?: string): RadioPnj {
  const r: RadioPnj = { id: (jeu.radioPnj.at(-1)?.id ?? 0) + 1, pnj: m.pnj, texte: m.texte, envoye: t, arrivee: t + delaiRadio(jeu, m.pnj, t), lu: false, ...(queteOuverte ? { quete: queteOuverte } : {}) }
  jeu.radioPnj.push(r)
  return r
}

/** Le prochain message radio arrivé et pas encore lu (le plus ancien), ou null. */
export function radioALire(jeu: Jeu, t: number): RadioPnj | null {
  return jeu.radioPnj.find((r) => !r.lu && r.arrivee <= t) ?? null
}

/**
 * Le prochain message radio à ouvrir de lui-même : pas celui qui annonce une nouvelle quête principale (Adrien,
 * 24/10/2026 : le tableau de bord la montre d'abord, son losange doré clignote, et on la touche pour l'écouter).
 */
export function radioAOuvrir(jeu: Jeu, t: number): RadioPnj | null {
  return jeu.radioPnj.find((r) => !r.lu && r.arrivee <= t && !(r.quete && quete(r.quete)?.type === 'principale')) ?? null
}

/** Le message radio, arrivé et pas encore écouté, qui annonce une quête (null s'il n'y en a pas). */
export function radioDeQuete(jeu: Jeu, id: string, t: number): RadioPnj | null {
  return jeu.radioPnj.find((r) => r.quete === id && !r.lu && r.arrivee <= t) ?? null
}

/**
 * Une quête principale nouvelle (son losange doré clignote au tableau de bord) : son message radio pas encore écouté,
 * ou, à prendre auprès d'un PNJ, pas encore regardée.
 */
export function queteNouvelle(jeu: Jeu, q: Quete, t: number): boolean {
  if (q.type !== 'principale') return false
  if (radioDeQuete(jeu, q.id, t)) return true
  return !jeu.quetes[q.id] && disponibles(jeu).includes(q) && !jeu.aides.includes(`quete:${q.id}`)
}

/** Les messages radio d'un PNJ arrivés (sa conversation, dans les Messages). */
export function radiosDe(jeu: Jeu, id: string, t: number): RadioPnj[] {
  return jeu.radioPnj.filter((r) => r.pnj === id && r.arrivee <= t)
}

/** Prend une quête : elle commence, avec ce qu'elle installe, donne ou met en panne. */
function commencer(jeu: Jeu, q: Quete, t: number): void {
  jeu.quetes[q.id] = { etape: 0, compte: 0, debut: t, fin: null, depuis: t }
  for (const i of q.installe ?? []) if (!jeu.installes.includes(i)) jeu.installes.push(i)
  if (q.don) jeu.charger(q.don)
  if (q.panne && !jeu.enPanne(q.panne)) jeu.casser(q.panne)
}

/** Les quêtes proposées par radio sont prises d'office ; leur intro arrive en message. */
function prendreParRadio(jeu: Jeu, t: number): void {
  for (const q of disponibles(jeu)) {
    if (!q.parRadio) continue
    commencer(jeu, q, t)
    envoyerRadio(jeu, { pnj: q.donneur, texte: q.intro }, t, q.id)
    if (!q.etapes.length) finir(jeu, q, t)
    const suivie = jeu.queteSuivie ? quete(jeu.queteSuivie) : null
    if (!suivie || q.type === 'principale' && suivie.type !== 'principale' || finie(jeu, suivie.id)) jeu.queteSuivie = q.id
  }
}

/** On parle à un PNJ (la capsule en orbite à son lieu). */
export function parler(jeu: Jeu, id: string, t: number): Dialogue {
  const p = pnj(id)
  // Une quête attend qu'on vienne lui parler : l'étape est franchie.
  for (const q of enCours(jeu)) {
    const e = etapeCourante(jeu, q)
    if (e?.genre !== 'parler' || e.pnj !== id) continue
    jeu.annoncesQuetes.push(...franchir(jeu, q, t))
    avancerQuetes(jeu, { genre: 'instant' }, t)
    return { pnj: p, pages: e.texte, proposition: null, terminee: finie(jeu, q.id) ? q : null }
  }
  const q = disponibles(jeu).find((x) => x.donneur === id && !x.parRadio)
  if (q) return { pnj: p, pages: q.intro, proposition: q, terminee: null }
  return { pnj: p, pages: [p.repos], proposition: null, terminee: null }
}

/** Accepte une quête proposée ; elle devient la quête suivie si aucune ne l'est. */
export function accepter(jeu: Jeu, id: string, t: number): boolean {
  const q = disponibles(jeu).find((x) => x.id === id)
  if (!q) return false
  commencer(jeu, q, t)
  if (!jeu.queteSuivie || q.type === 'principale' && quete(jeu.queteSuivie).type !== 'principale') jeu.queteSuivie = id
  // Une quête sans étape (le premier mot d'Elsa) est finie en la prenant.
  if (!q.etapes.length) finir(jeu, q, t)
  avancerQuetes(jeu, { genre: 'instant' }, t)
  return true
}

/**
 * Fait avancer les quêtes en cours : une mission finie, un monolithe trouvé, ou simplement l'instant présent (un lieu
 * atteint, des marchandises à livrer). Renvoie les annonces à faire (objectifs atteints, quêtes finies).
 */
export function avancerQuetes(jeu: Jeu, fait: FaitDeJeu, t: number): string[] {
  const annonces: string[] = []
  prendreParRadio(jeu, t)
  for (const q of enCours(jeu)) {
    for (let garde = 0; garde < q.etapes.length; garde++) {
      const e = etapeCourante(jeu, q), etat = jeu.quetes[q.id]
      if (!e) break
      let atteint = false
      if (e.genre === 'mission' && fait.genre === 'contrat' && garde === 0 && fait.contrat.genre === e.mission && (!e.systeme || systemeDuTableau(fait.contrat.tableau) === e.systeme)) {
        etat.compte++
        atteint = etat.compte >= e.nombre
        if (!atteint) annonces.push(`${q.titre} : ${etat.compte}/${e.nombre}`)
      } else if (e.genre === 'monolithes' && fait.genre === 'monolithe' && garde === 0) {
        etat.compte++
        atteint = etat.compte >= e.nombre
      } else if (e.genre === 'chasseurs' && fait.genre === 'chasseur' && garde === 0 && (!e.systeme || fait.systeme === e.systeme)) {
        etat.compte++
        atteint = etat.compte >= e.nombre
        if (!atteint) annonces.push(`${q.titre} : ${etat.compte}/${e.nombre}`)
      } else if (e.genre === 'signal') {
        atteint = etat.compte >= 1
      } else if (e.genre === 'radar') {
        const depuis = etat.depuis ?? etat.debut
        if (e.lieu) {
          const a = position(e.lieu, t), b = jeu.mission.etat(t).position
          atteint = jeu.radar.actif && Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= PORTEE_RADAR
        } else atteint = Object.values(jeu.espace.reperes ?? {}).some((x) => x >= depuis)
      } else if (e.genre === 'disparu') {
        const d = DISPARUS.find((x) => x.nom === e.nom)
        atteint = !d || jeu.disparus.trouves[d.numero] !== undefined
      } else if (e.genre === 'moteur') {
        atteint = jeu.niveauMoteur >= e.niveau
      } else if (e.genre === 'reparer') {
        atteint = !jeu.enPanne(e.module)
      } else if (e.genre === 'ping') {
        const depuis = etat.depuis ?? etat.debut
        atteint = jeu.monolithes.echos.some((x) => x.envoye >= depuis && x.retour <= t)
      } else if (e.genre === 'jauge') {
        atteint = jauge(jeu.zones, e.zone) >= 100
      } else if (e.genre === 'assaut') {
        atteint = (fait.genre === 'assaut' && fait.zone === e.zone && garde === 0) || jeu.zones.liberees.includes(e.zone)
      } else if (e.genre === 'liberer') {
        atteint = e.zones.every((z) => jeu.zones.liberees.includes(z))
      } else if (e.genre === 'aller') {
        atteint = jeu.lieuEnOrbite(t) === e.lieu
      } else if (e.genre === 'livrer' && jeu.lieuEnOrbite(t) === e.lieu
        && Object.entries(e.marchandises).every(([nom, n]) => (jeu.soute[nom] ?? 0) >= n - 1e-9)) {
        for (const [nom, n] of Object.entries(e.marchandises)) {
          const reste = Math.round(((jeu.soute[nom] ?? 0) - n) * 100) / 100
          if (reste > 0) jeu.soute[nom] = reste
          else delete jeu.soute[nom]
        }
        atteint = true
      }
      if (!atteint) break
      annonces.push(...franchir(jeu, q, t))
      const suite = objectif(jeu, q)
      annonces.push(suite ? `${q.titre} : ${suite.texte}` : `Quête finie : ${q.titre} (+${q.recompense} crédits)`)
    }
  }
  // Une quête finie peut en ouvrir une autre par radio : elle arrive aussitôt.
  prendreParRadio(jeu, t)
  return annonces
}

/** La zone dont on peut lancer l'assaut final ici (une quête en est à l'étape ASSAUT, la capsule en orbite autour). */
export function assautIci(jeu: Jeu, t: number): string | null {
  const ici = jeu.lieuEnOrbite(t)
  if (!ici) return null
  for (const q of enCours(jeu)) {
    const e = etapeCourante(jeu, q)
    if (e?.genre === 'assaut' && e.zone === ici && !jeu.zones.liberees.includes(ici)) return ici
  }
  return null
}

/**
 * Ce qu'il reste à faire pour lancer l'assaut d'une zone dont la résistance est à 100 % (Adrien, 22/10/2026 : la Lune
 * à 100 % restait occupée sans qu'on sache pourquoi) : l'assaut passe par la quête de libération de la zone, dont
 * l'étape « assaut » se joue en orbite autour d'elle. Null si aucune quête ne mène à son assaut.
 */
export function cheminVersAssaut(jeu: Jeu, nomZone: string): string | null {
  const q = QUETES.find((x) => x.etapes.some((e) => e.genre === 'assaut' && e.zone === nomZone))
  if (!q) return null
  const amiral = zone(nomZone)?.amiral ?? 'le vaisseau amiral'
  const e = etapeCourante(jeu, q)
  if (e && (e.genre === 'assaut' || e.genre === 'jauge')) return `Mets-toi en orbite autour ${deLa(nomZone)} et lance l'ASSAUT contre ${amiral}.`
  // Sinon, en remontant la chaîne des quêtes (Adrien, 22/10/2026 : nommer la fin de la chaîne ne l'aidait pas) : la
  // quête qu'on peut faire maintenant, celle qui est en cours ou celle qui attend qu'on la prenne.
  const r = prochaineQuete(jeu, q)
  if (!r) return null
  if (r.enCours) {
    const etape = etapeCourante(jeu, r.quete)
    return etape ? `Pour lancer l'assaut, avance d'abord dans la quête « ${r.quete.titre} » : ${texteEtape(etape).replace(/^./, (c) => c.toLowerCase())}.` : null
  }
  const d = pnj(r.quete.donneur)
  return `Pour lancer l'assaut, avance d'abord dans la quête « ${r.quete.titre} » : ${d.nom} t'attend (${d.lieu}), mets-toi en orbite et parle-lui.`
}

/** La quête qu'on peut faire maintenant sur le chemin d'une autre : elle-même ou une de ses conditions (en cours, ou à prendre). */
function prochaineQuete(jeu: Jeu, q: Quete): { quete: Quete; enCours: boolean } | null {
  if (finie(jeu, q.id)) return null
  if (jeu.quetes[q.id]) return { quete: q, enCours: true }
  if (disponibles(jeu).includes(q)) return { quete: q, enCours: false }
  for (const c of q.conditions) { const r = prochaineQuete(jeu, quete(c)); if (r) return r }
  return null
}

/** La fenêtre d'une zone libérée (demande d'Adrien du 21/10/2026) : le PNJ de la Résistance qui l'annonce, ce qu'il dit, ce qui s'ouvre. */
export interface Liberation { zone: string; pnj: Pnj; texte: string[]; ouvre: string[] }

export function liberation(nom: string): Liberation {
  const z = ZONES_A_LIBERER.find((x) => x.nom === nom)!
  const q = QUETES.find((x) => x.libere === nom)
  const retour = q?.etapes.find((e) => e.genre === 'parler')
  const p = pnj(retour && retour.genre === 'parler' ? retour.pnj : q?.donneur ?? PNJS[0].id)
  const la = ['Lune', 'Terre'].includes(nom) ? `La ${nom}` : nom
  const texte = q?.liberation?.texte ?? [`Le vaisseau amiral ${z.amiral} est en miettes, {joueur} ! ${la} est libre.`,
    `Viens me voir à ${p.lieu} : la Résistance te doit une récompense.`]
  const ouvre: string[] = []
  if (MARCHES.some((m) => m.lieu === nom)) ouvre.push(`Le comptoir ${deLa(nom)}`)
  for (const c of COMPAGNIES.filter((x) => x.siege === nom)) ouvre.push(`La cotation de la ${c.nom}`)
  const secondaires = [...new Set(QUETES.filter((x) => x.type === 'secondaire' && zoneDuLieu(pnj(x.donneur).lieu) === nom).map((x) => pnj(x.donneur).nom))]
  if (secondaires.length) ouvre.push(`Les quêtes de ${secondaires.join(', ')}`)
  if (z.planete) ouvre.push(`Plus de chasseurs autour ${deLa(nom)}`)
  return { zone: nom, pnj: q?.liberation ? pnj(q.liberation.pnj) : p, texte, ouvre }
}

/** Le signal radio d'une quête qu'on peut capter dans ce système (une étape « signal » en cours), ou null. */
export function signalDeQuete(jeu: Jeu, systeme: string | null): { quete: Quete; frequence: number; texte: TexteVoix } | null {
  if (!systeme) return null
  for (const q of enCours(jeu)) {
    const e = etapeCourante(jeu, q)
    if (e?.genre === 'signal' && e.systeme === systeme && jeu.quetes[q.id].compte < 1) {
      return { quete: q, frequence: e.frequence, texte: { auteur: e.auteur, lieu: e.lieu, jour: 0, texte: e.texte } }
    }
  }
  return null
}

/**
 * On écoute un signal de quête, calé à `frequence` (MHz) : comme une Voix perdue, calé net DUREE_ENREGISTREMENT, il
 * est capté et l'étape est faite. Null si aucun signal de quête ne s'entend ici à cette fréquence.
 */
export function ecouterSignal(jeu: Jeu, systeme: string | null, frequence: number, t: number): { texte: TexteVoix; nettete: number; enregistrement: number; capte: boolean } | null {
  const s = signalDeQuete(jeu, systeme)
  const n = s ? nettete(frequence - s.frequence) : 0
  if (!s || n <= 0) { jeu.calageSignal = null; return null }
  if (n < 0.95) { jeu.calageSignal = null; return { texte: s.texte, nettete: n, enregistrement: 0, capte: false } }
  if (jeu.calageSignal?.quete !== s.quete.id) jeu.calageSignal = { quete: s.quete.id, depuis: t }
  const enregistrement = Math.min(1, (t - jeu.calageSignal.depuis) / DUREE_ENREGISTREMENT)
  if (enregistrement < 1) return { texte: s.texte, nettete: n, enregistrement, capte: false }
  jeu.quetes[s.quete.id].compte = 1
  jeu.calageSignal = null
  jeu.annoncesQuetes.push(...avancerQuetes(jeu, { genre: 'instant' }, t))
  return { texte: s.texte, nettete: n, enregistrement: 1, capte: true }
}

/** Qui installe un instrument : la quête qui l'apporte et son donneur (pour le dire sur ce qui est encore grisé). */
export function quiInstalle(i: Instrument): { quete: Quete; pnj: Pnj } | null {
  const q = QUETES.find((x) => x.installe?.includes(i) || x.ouvre?.includes(i))
  return q ? { quete: q, pnj: pnj(q.donneur) } : null
}
