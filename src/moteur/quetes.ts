// Les quêtes et les PNJ (décisions d'Adrien du 20/10/2026) : ce qui est proposé, ce que dit un PNJ quand on lui parle,
// et l'avancement des étapes, qui se cochent toutes seules (missions finies, lieux atteints, marchandises livrées,
// monolithes trouvés). L'affichage (journal, dialogue, carte) demande tout ici.

import { PNJS, QUETES, type EtapeQuete, type Pnj, type Quete } from '../donnees/quetes'
import type { Contrat } from './contrats'
import type { Jeu } from './jeu'
import { deLa, estLibre, jauge, zone } from './zones'
import { XP } from '../donnees/niveaux'
import { COMPAGNIES } from '../donnees/bourse'
import { MARCHES } from '../donnees/marche'
import { ZONES_A_LIBERER } from '../donnees/zones'
import { zoneDuLieu } from './zones'
import { systemeDuTableau } from '../donnees/tableaux'

/** Où en est une quête commencée. */
export interface EtatQuete {
  /** Étape en cours (son numéro) ; égale au nombre d'étapes quand la quête est finie. */
  etape: number
  /** Compteur de l'étape en cours (missions finies, monolithes trouvés depuis son début). */
  compte: number
  /** Acceptée à cet instant ; finie à cet instant (ou null). */
  debut: number
  fin: number | null
}

/** Ce qui fait avancer les quêtes. */
export type FaitDeJeu = { genre: 'contrat'; contrat: Contrat } | { genre: 'monolithe' } | { genre: 'instant' } | { genre: 'assaut'; zone: string }

/** Ce que dit un PNJ quand on lui parle. */
export interface Dialogue {
  pnj: Pnj
  pages: string[]
  /** Une quête qu'il propose (boutons ACCEPTER / PLUS TARD). */
  proposition: Quete | null
  /** Une quête qu'on vient de finir avec lui (et sa récompense). */
  terminee: Quete | null
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
  // Les quêtes secondaires d'un PNJ ne s'ouvrent qu'une fois sa zone libérée (décision d'Adrien du 21/10/2026).
  return QUETES.filter((q) => !jeu.quetes[q.id] && q.conditions.every((c) => finie(jeu, c))
    && (q.type === 'principale' || estLibre(jeu.zones, pnj(q.donneur).lieu)))
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
  }
}

/** L'objectif en cours d'une quête : son énoncé, son compteur (« 1/2 ») et son lieu. */
export function objectif(jeu: Jeu, q: Quete): { texte: string; compte: string | null; lieu: string | null } | null {
  const e = etapeCourante(jeu, q)
  if (!e) return null
  const n = e.genre === 'mission' || e.genre === 'monolithes' ? e.nombre : 0
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
function franchir(jeu: Jeu, q: Quete, t: number): void {
  const e = jeu.quetes[q.id]
  e.etape++
  e.compte = 0
  if (e.etape < q.etapes.length) return
  e.fin = t
  jeu.credits += q.recompense
  jeu.gagnerXp(Math.min(XP.quete[1], Math.max(XP.quete[0], q.recompense / 10)))
  if (q.libere && !jeu.zones.liberees.includes(q.libere)) jeu.gagnerAssaut(q.libere, t)
  if (jeu.queteSuivie === q.id) jeu.queteSuivie = enCours(jeu)[0]?.id ?? null
}

/** On parle à un PNJ (la capsule en orbite à son lieu). */
export function parler(jeu: Jeu, id: string, t: number): Dialogue {
  const p = pnj(id)
  // Une quête attend qu'on vienne lui parler : l'étape est franchie.
  for (const q of enCours(jeu)) {
    const e = etapeCourante(jeu, q)
    if (e?.genre !== 'parler' || e.pnj !== id) continue
    franchir(jeu, q, t)
    return { pnj: p, pages: e.texte, proposition: null, terminee: finie(jeu, q.id) ? q : null }
  }
  const q = disponibles(jeu).find((x) => x.donneur === id)
  if (q) return { pnj: p, pages: q.intro, proposition: q, terminee: null }
  return { pnj: p, pages: [p.repos], proposition: null, terminee: null }
}

/** Accepte une quête proposée ; elle devient la quête suivie si aucune ne l'est. */
export function accepter(jeu: Jeu, id: string, t: number): boolean {
  const q = disponibles(jeu).find((x) => x.id === id)
  if (!q) return false
  jeu.quetes[id] = { etape: 0, compte: 0, debut: t, fin: null }
  if (!jeu.queteSuivie || q.type === 'principale' && quete(jeu.queteSuivie).type !== 'principale') jeu.queteSuivie = id
  avancerQuetes(jeu, { genre: 'instant' }, t)
  return true
}

/**
 * Fait avancer les quêtes en cours : une mission finie, un monolithe trouvé, ou simplement l'instant présent (un lieu
 * atteint, des marchandises à livrer). Renvoie les annonces à faire (objectifs atteints, quêtes finies).
 */
export function avancerQuetes(jeu: Jeu, fait: FaitDeJeu, t: number): string[] {
  const annonces: string[] = []
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
      franchir(jeu, q, t)
      const suite = objectif(jeu, q)
      annonces.push(suite ? `${q.titre} : ${suite.texte}` : `Quête finie : ${q.titre} (+${q.recompense} crédits)`)
    }
  }
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
  return `Pour lancer l'assaut, il te manque la quête « ${r.quete.titre} » : ${d.nom} t'attend (${d.lieu}). Mets-toi en orbite et parle-lui.`
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
  const texte = [`Le vaisseau amiral ${z.amiral} est en miettes, {joueur} ! ${la} est libre.`,
    `Viens me voir à ${p.lieu} : la Résistance te doit une récompense.`]
  const ouvre: string[] = []
  if (MARCHES.some((m) => m.lieu === nom)) ouvre.push(`Le comptoir ${deLa(nom)}`)
  for (const c of COMPAGNIES.filter((x) => x.siege === nom)) ouvre.push(`La cotation de la ${c.nom}`)
  const secondaires = [...new Set(QUETES.filter((x) => x.type === 'secondaire' && zoneDuLieu(pnj(x.donneur).lieu) === nom).map((x) => pnj(x.donneur).nom))]
  if (secondaires.length) ouvre.push(`Les quêtes de ${secondaires.join(', ')}`)
  if (z.planete) ouvre.push(`Plus de chasseurs autour ${deLa(nom)}`)
  return { zone: nom, pnj: p, texte, ouvre }
}
