// Les Messages (écrans d'abord, en attendant le serveur de l'étape 10 ; décision d'Adrien du 18/10/2026 : « tout le
// fun est là »). Le système solaire bavarde : les bots (donnees/messages.ts) écrivent dans le canal général, dans le
// canal de leur Maison, et parfois en privé au joueur ; ils répondent à ce qu'il écrit. Tout voyage à la vitesse de
// la lumière : un message parti de Neptune arrive des heures plus tard, et la réponse à un message aussi.
// Reproductible : les bavardages dépendent seulement de l'heure (les mêmes pour tous) ; les réponses, du message.

import { ouEstLeBot } from './corps'
import { statut } from './monolithes'
import { BAVARDAGES, BAVARDAGES_MAISON, BOTS, MOTS_INTENTION, PRIVES_SPONTANES, REPONSES, type Bot, type Intention } from '../donnees/messages'
import { MARCHANDISES, MARCHES } from '../donnees/marche'
import type { Maison } from '../donnees/maisons'
import type { Jeu } from './jeu'
import { cours, delaiLumiere } from './marche'
import { rumeursEntre } from './bourse'

/** Un canal : 'general', 'maison', ou une conversation privée avec un bot ('prive:VEGA'). */
export type Canal = string

/** Un message envoyé par le joueur (enregistré avec la partie). */
export interface MessageEnvoye { id: number; canal: Canal; texte: string; envoye: number }

/** Un message tel que le joueur le voit. */
export interface MessageAffiche {
  id: string
  canal: Canal
  auteur: string
  maison: Maison | null
  /** D'où il vient (pour les bots). */
  lieu: string
  texte: string
  envoye: number
  /** Arrivée à la capsule (envoi + délai de la lumière). */
  recu: number
  deMoi: boolean
  /** Le statut de l'auteur (paliers des monolithes), s'il en a un. */
  statut: string | null
}

/** Un bavardage tous les PAS en moyenne (un créneau sur quatre reste silencieux). Demande d'Adrien du 20/10/2026 :
 *  ça parlait trop ; 2 min 30 → 8 min (un message toutes les 10 à 11 minutes en moyenne). */
const PAS = 480_000
/** On garde 12 heures de conversations. */
const MEMOIRE = 12 * 3_600_000

/** Hachage d'un texte, entre 0 et 1. */
function h(s: string): number {
  let x = 2166136261
  for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619)
  x ^= x >>> 13
  x = Math.imul(x, 0x5bd1e995)
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296
}
const choisir = <T>(l: readonly T[], x: number): T => l[Math.floor(x * l.length) % l.length]

/** Délai de la lumière (texte court) : « 1,3 s », « 12 min », « 4 h 05 ». */
export function texteDelaiCourt(ms: number): string {
  const s = ms / 1000
  if (s < 60) return `${s.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

/** Où est un bot, pour l'affichage : « Lune », ou « en route vers Mars » (les bots voyagent, voir moteur/corps.ts). */
export function lieuDuBot(pseudo: string, t: number): string {
  const ou = ouEstLeBot(pseudo, t)
  return ou.enRoute ? `en route vers ${ou.vers}` : ou.lieu
}

/** Où est un bot, dans une phrase (« Bonjour de {lieu} ») : « Lune », ou « la route de Mars ». */
function lieuDansUnTexte(pseudo: string, t: number): string {
  const ou = ouEstLeBot(pseudo, t)
  return ou.enRoute ? `la route de ${ou.vers}` : ou.lieu
}

/** Remplit les trous d'un texte de bot : pseudo du joueur, lieu, délai, un vrai cours sur le marché du bot. */
function remplir(modele: string, bot: Bot, joueur: string, t: number, graine: string, marchandiseVoulue?: string): string {
  const marche = MARCHES.find((m) => m.nom === bot.marche)!
  const f = MARCHANDISES.find((m) => m.nom === marchandiseVoulue) ?? choisir(MARCHANDISES, h(`${graine}/m`))
  const prix = Math.round(cours(marche, f, t))
  return modele.replaceAll('{joueur}', joueur).replaceAll('{lieu}', lieuDansUnTexte(bot.pseudo, t)).replaceAll('{marche}', marche.nom === 'Terre' ? 'la Terre' : marche.nom)
    .replaceAll('{marchandise}', f.nom.toLowerCase()).replaceAll('{prix}', String(prix))
    .replaceAll('{delai}', texteDelaiCourt(delaiLumiere(bot.pseudo, t)))
}

/** Le bavardage d'un créneau (k : numéro du créneau depuis 1970), ou null s'il est silencieux. */
const memoire = new Map<string, MessageAffiche | null>()
function bavardage(k: number, joueur: string): MessageAffiche | null {
  const cle = `${k}/${joueur}`
  if (memoire.has(cle)) return memoire.get(cle)!
  let m: MessageAffiche | null = null
  if (h(`c${k}/0`) < 0.75) {
    const envoye = k * PAS + Math.floor(h(`c${k}/1`) * PAS)
    const bot = choisir(BOTS, h(`c${k}/2`))
    const x = h(`c${k}/3`)
    const canal = x < 0.02 ? `prive:${bot.pseudo}` : x < 0.3 ? 'maison' : 'general'
    const modeles = canal === 'general' ? BAVARDAGES : canal === 'maison' ? BAVARDAGES_MAISON[bot.maison] : PRIVES_SPONTANES
    const texte = remplir(choisir(modeles, h(`c${k}/4`)), bot, joueur, envoye, `c${k}`)
    m = { id: `c${k}`, canal, auteur: bot.pseudo, maison: bot.maison, lieu: lieuDuBot(bot.pseudo, envoye), texte, envoye, recu: envoye + delaiLumiere(bot.pseudo, envoye), deMoi: false, statut: statut(bot.monolithes) }
  }
  if (memoire.size > 5000) memoire.clear()
  memoire.set(cle, m)
  return m
}

/** Ce que veut dire le joueur (pour que les bots répondent à propos). */
export function intention(texte: string): Intention {
  // Les pseudos ne comptent pas (« Bonjour Mme_Ferraille » est un bonjour, pas une affaire de ferraille).
  let t = texte.toLowerCase()
  for (const b of BOTS) t = t.replaceAll(b.pseudo.toLowerCase(), '')
  t = t.normalize('NFD').replace(/[̀-ͯ]/g, '')
  for (const [i, mots] of MOTS_INTENTION) if (mots.some((m) => t.includes(m))) return i
  return t.includes('?') ? 'question' : 'autre'
}

/** Les bots qui répondent à un message du joueur : le destinataire d'un privé ; ceux qu'il nomme ; sinon un ou deux. */
function repondants(m: MessageEnvoye): Bot[] {
  if (m.canal.startsWith('prive:')) return BOTS.filter((b) => `prive:${b.pseudo}` === m.canal)
  const nommes = BOTS.filter((b) => m.texte.toLowerCase().includes(b.pseudo.toLowerCase()))
  if (nommes.length) return nommes.slice(0, 2)
  const a = choisir(BOTS, h(`r${m.id}/a`))
  const b = choisir(BOTS.filter((x) => x !== a), h(`r${m.id}/b`))
  return h(`r${m.id}/n`) < 0.5 ? [a] : [a, b]
}

/** Les réponses des bots à un message du joueur (parties, ou pas encore, ou en route). Calculées une fois. */
const memoireReponses = new Map<string, MessageAffiche[]>()
function reponses(m: MessageEnvoye, joueur: string, maisonJoueur: Maison | null): MessageAffiche[] {
  const cle = `${m.id}/${joueur}/${maisonJoueur}`
  if (!memoireReponses.has(cle)) {
    if (memoireReponses.size > 2000) memoireReponses.clear()
    memoireReponses.set(cle, calculerReponses(m, joueur, maisonJoueur))
  }
  return memoireReponses.get(cle)!
}
function calculerReponses(m: MessageEnvoye, joueur: string, maisonJoueur: Maison | null): MessageAffiche[] {
  if (m.canal === 'maison' && !maisonJoueur) return []
  const i = intention(m.texte)
  const marchandise = MARCHANDISES.find((f) => m.texte.toLowerCase().includes(f.nom.toLowerCase().slice(0, 5)))?.nom
  return repondants(m).filter((b) => m.canal !== 'maison' || b.maison === maisonJoueur).map((b, n) => {
    const arrivee = m.envoye + delaiLumiere(b.pseudo, m.envoye)
    const envoye = arrivee + 8000 + Math.floor(h(`r${m.id}/${b.pseudo}/t`) * 30_000) + n * 6000
    const texte = remplir(choisir(REPONSES[i], h(`r${m.id}/${b.pseudo}/x`)), b, joueur, envoye, `r${m.id}`, marchandise)
    return { id: `r${m.id}/${b.pseudo}`, canal: m.canal, auteur: b.pseudo, maison: b.maison, lieu: lieuDuBot(b.pseudo, envoye), texte, envoye, recu: envoye + delaiLumiere(b.pseudo, envoye), deMoi: false, statut: statut(b.monolithes) }
  })
}

/** Tous les messages des 12 dernières heures qui concernent le joueur : reçus, en route, et les siens. */
function tous(jeu: Jeu, t: number): MessageAffiche[] {
  const l: MessageAffiche[] = []
  for (let k = Math.floor((t - MEMOIRE) / PAS); k <= Math.floor(t / PAS); k++) {
    const m = bavardage(k, jeu.pseudo)
    if (m && (m.canal !== 'maison' || m.maison === jeu.maison)) l.push(m)
  }
  // Les rumeurs de la Bourse : un bot les fait courir dans le canal général, quelques heures avant un gros mouvement.
  for (const e of rumeursEntre(t - MEMOIRE, t)) {
    const bot = BOTS.find((b) => b.pseudo === e.rumeur.bot)!, envoye = e.rumeur.envoye
    l.push({ id: `b${e.compagnie.id}/${envoye}`, canal: 'general', auteur: bot.pseudo, maison: bot.maison, lieu: lieuDuBot(bot.pseudo, envoye), texte: e.rumeur.texte, envoye, recu: envoye + delaiLumiere(bot.pseudo, envoye), deMoi: false, statut: statut(bot.monolithes) })
  }
  // Les messages que des bots ont écrits au joueur à la suite d'un événement (invitation d'une Maison…) : gardés.
  for (const x of jeu.lettres) {
    const bot = BOTS.find((b) => b.pseudo === x.bot)
    if (!bot) continue
    l.push({ id: `l${x.id}`, canal: `prive:${bot.pseudo}`, auteur: bot.pseudo, maison: bot.maison, lieu: lieuDuBot(bot.pseudo, x.envoye), texte: x.texte, envoye: x.envoye, recu: x.envoye + delaiLumiere(bot.pseudo, x.envoye), deMoi: false, statut: statut(bot.monolithes) })
  }
  for (const m of jeu.envoyes) {
    if (m.envoye < t - MEMOIRE) continue
    l.push({ id: `e${m.id}`, canal: m.canal, auteur: jeu.pseudo, maison: jeu.maison, lieu: '', texte: m.texte, envoye: m.envoye, recu: m.envoye, deMoi: true, statut: statut(jeu.monolithes.trouves.length) })
    l.push(...reponses(m, jeu.pseudo, jeu.maison))
  }
  return l
}

/** Le fil d'un canal à l'instant t : les messages arrivés (et les siens), du plus ancien au plus récent. */
export function fil(jeu: Jeu, canal: Canal, t: number): MessageAffiche[] {
  return tous(jeu, t).filter((m) => m.canal === canal && m.recu <= t).sort((a, b) => a.recu - b.recu)
}

/** Les réponses parties vers la capsule mais pas encore arrivées (« VEGA a répondu : en route… »). */
export function enRoute(jeu: Jeu, canal: Canal, t: number): MessageAffiche[] {
  return tous(jeu, t).filter((m) => m.canal === canal && !m.deMoi && m.id.startsWith('r') && m.envoye <= t && m.recu > t)
}

/** Les conversations privées (avec qui), de la plus récente à la plus ancienne. */
export function conversations(jeu: Jeu, t: number): { canal: Canal; bot: Bot; dernier: MessageAffiche }[] {
  const par = new Map<Canal, MessageAffiche>()
  for (const m of tous(jeu, t)) if (m.canal.startsWith('prive:') && m.recu <= t && (!par.get(m.canal) || par.get(m.canal)!.recu < m.recu)) par.set(m.canal, m)
  return [...par.entries()].map(([canal, dernier]) => ({ canal, bot: BOTS.find((b) => `prive:${b.pseudo}` === canal)!, dernier }))
    .sort((a, b) => b.dernier.recu - a.dernier.recu)
}

/** Messages arrivés et pas encore lus, par canal (les privés regroupés sous 'prives'). */
export function nonLus(jeu: Jeu, t: number): { general: number; maison: number; prives: number; total: number } {
  const n = { general: 0, maison: 0, prives: 0, total: 0 }
  for (const m of tous(jeu, t)) {
    if (m.deMoi || m.recu > t || m.recu <= (jeu.lus[m.canal] ?? jeu.lus.debut ?? 0)) continue
    const c = m.canal.startsWith('prive:') ? 'prives' : (m.canal as 'general' | 'maison')
    n[c]++
    n.total++
  }
  return n
}

/** Les messages arrivés depuis l'instant depuis (pour les annoncer sur la carte), hors bavardages du canal général. */
export function arrivesDepuis(jeu: Jeu, depuis: number, t: number): MessageAffiche[] {
  return tous(jeu, t).filter((m) => !m.deMoi && m.recu > depuis && m.recu <= t && (m.canal !== 'general' || m.id.startsWith('r') || m.texte.includes(jeu.pseudo)))
}

/** Envoyer un message (texte non vide, 200 caractères au plus). */
export function envoyer(jeu: Jeu, canal: Canal, texte: string, t: number): boolean {
  const propre = texte.trim().slice(0, 200)
  if (!propre || (canal === 'maison' && !jeu.maison)) return false
  jeu.envoyes.push({ id: t, canal, texte: propre, envoye: t })
  if (jeu.envoyes.length > 200) jeu.envoyes.splice(0, jeu.envoyes.length - 200)
  return true
}

/** Le canal a été lu jusqu'à l'instant t. */
export function marquerLu(jeu: Jeu, canal: Canal, t: number): void {
  jeu.lus[canal] = t
}

/** Où en est un message du joueur : en route vers les autres, ou arrivé partout. */
export function etatEnvoi(m: MessageAffiche, t: number): string {
  const destinataires = m.canal.startsWith('prive:') ? BOTS.filter((b) => `prive:${b.pseudo}` === m.canal) : BOTS
  const dernier = Math.max(...destinataires.map((b) => m.envoye + delaiLumiere(b.pseudo, m.envoye)))
  if (t >= dernier) return m.canal.startsWith('prive:') ? `✓ arrivé à ${destinataires[0].pseudo} (${lieuDuBot(destinataires[0].pseudo, dernier)})` : '✓ arrivé dans tout le système'
  return `📡 en route${m.canal.startsWith('prive:') ? ` vers ${destinataires[0].pseudo}` : ''} · encore ${texteDelaiCourt(dernier - t)}`
}
