// Les quêtes et les PNJ (décisions d'Adrien du 20/10/2026) : ce qui est proposé, ce que dit un PNJ quand on lui parle,
// et l'avancement des étapes, qui se cochent toutes seules (missions finies, lieux atteints, marchandises livrées,
// monolithes trouvés). L'affichage (journal, dialogue, carte) demande tout ici.

import { PNJS, QUETES, type EtapeQuete, type Pnj, type Quete } from '../donnees/quetes'
import type { Contrat } from './contrats'
import type { Jeu } from './jeu'

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
export type FaitDeJeu = { genre: 'contrat'; contrat: Contrat } | { genre: 'monolithe' } | { genre: 'instant' }

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
  return QUETES.filter((q) => !jeu.quetes[q.id] && q.conditions.every((c) => finie(jeu, c)))
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
  }
}

/** L'objectif en cours d'une quête : son énoncé, son compteur (« 1/2 ») et son lieu. */
export function objectif(jeu: Jeu, q: Quete): { texte: string; compte: string | null; lieu: string | null } | null {
  const e = etapeCourante(jeu, q)
  if (!e) return null
  const n = e.genre === 'mission' || e.genre === 'monolithes' ? e.nombre : 0
  return { texte: texteEtape(e), compte: n > 1 ? `${jeu.quetes[q.id].compte}/${n}` : null, lieu: lieuEtape(e) }
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
  if (q.libere && !jeu.zonesLiberees.includes(q.libere)) jeu.zonesLiberees.push(q.libere)
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
      if (e.genre === 'mission' && fait.genre === 'contrat' && garde === 0 && fait.contrat.genre === e.mission && (!e.systeme || fait.contrat.tableau === e.systeme)) {
        etat.compte++
        atteint = etat.compte >= e.nombre
        if (!atteint) annonces.push(`${q.titre} : ${etat.compte}/${e.nombre}`)
      } else if (e.genre === 'monolithes' && fait.genre === 'monolithe' && garde === 0) {
        etat.compte++
        atteint = etat.compte >= e.nombre
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
