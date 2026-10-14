// Le jeu côté interface : il tient la partie, la fait avancer chaque seconde, garde le téléscripteur, sauvegarde
// dans le téléphone et rattrape le temps écoulé quand on revient. Les écrans lisent cet objet et lui demandent d'agir.

import { rattraper, type RapportDeVol } from '../moteur/absence'
import { creerPartie, type ContratAccompli, type EtatPartie } from '../moteur/etat'
import { horlogeReelle } from '../moteur/horloge'
import { hasardReel } from '../moteur/hasard'
import type { Contexte, Evenement } from '../moteur/modules/commun'
import { modulesEnPanne, type EtatModules } from '../moteur/modules'
import { agir as agirMoteur, avancerPartie, basculerInterrupteur } from '../moteur/partie'
import type { NumeroInterrupteur } from '../moteur/interrupteurs'
import { charger, sauvegarder } from '../moteur/sauvegarde'
import { ecartAngle } from '../moteur/fusee'
import { nomAstre } from './format'
import { ALARMES, SONS } from './sons'

const CLE_PARTIE = 'mdv-partie'
const CLE_TELEX = 'mdv-telex'
const CLE_TRACES = 'mdv-traces'
const TELEX_GARDES = 60
const SAUVEGARDE_TOUTES_LES = 10_000

export type Ecran = { nom: 'ouverture' } | { nom: 'fenetre' } | { nom: 'module'; code: string } | { nom: 'dehors' }
export type Volet = 'carte' | 'office' | 'manuel' | 'portefeuille' | null

/** Tracé de chasse sur la carte : cercle autour du point du dernier ping, ou droite depuis la dernière visée. */
export type Trace = { type: 'cercle'; x: number; y: number; rayon: number } | { type: 'droite'; x: number; y: number; angle: number }

export interface LigneTelex {
  t: number
  texte: string
  alerte?: boolean
}

function lire(cle: string): string | null {
  try { return localStorage.getItem(cle) } catch { return null }
}
function ecrire(cle: string, valeur: string) {
  try { localStorage.setItem(cle, valeur) } catch { /* stockage indisponible : la partie continue */ }
}

class Jeu {
  /** La partie en cours (null avant l'ouverture). */
  etat = $state.raw<EtatPartie | null>(null)
  /** Instant présent (ms UTC), rafraîchi chaque seconde. */
  maintenant = $state(horlogeReelle())
  telex = $state.raw<LigneTelex[]>([])
  rapport = $state.raw<RapportDeVol | null>(null)
  /** Contrats accomplis à annoncer (fenêtre « contrat accompli »), le premier d'abord. */
  annonces = $state.raw<ContratAccompli[]>([])
  ecran = $state.raw<Ecran>({ nom: 'ouverture' })
  volet = $state<Volet>(null)
  traces = $state.raw<Trace[]>([])
  /** Page ouverte dans le lecteur du manuel. */
  pageManuel = $state(0)
  /** Vrai pendant l'impression du manuel. */
  impression = $state(false)

  private minuterie: ReturnType<typeof setInterval> | null = null
  /** Partie au pas précédent, pour dessiner les mouvements en douceur entre deux pas. */
  private precedent: EtatPartie | null = null
  private prochaineAlarme = 0
  /** Nombre d'étages ouverts au-dessus du tableau de bord, tels que l'historique du navigateur les connaît. */
  private etagesHistorique = 0
  private retoursIgnores = 0
  /** Instant du dernier changement d'écran (pour ignorer un toucher « fantôme » juste après). */
  dernierChangement = 0
  private derniereSauvegarde = 0

  /** Au lancement : reprend la partie sauvegardée (avec rattrapage), sinon montre l'ouverture. */
  demarrer() {
    const texte = lire(CLE_PARTIE)
    const lu = texte ? charger(texte) : null
    try { this.telex = JSON.parse(lire(CLE_TELEX) ?? '[]') } catch { this.telex = [] }
    try { this.traces = JSON.parse(lire(CLE_TRACES) ?? '[]') } catch { this.traces = [] }
    if (lu?.etat) {
      const r = rattraper(lu.etat, horlogeReelle(), hasardReel)
      this.etat = r.etat
      this.annoncerContrats(lu.etat, r.etat)
      this.precedent = null
      if (r.rapport) {
        this.rapport = r.rapport
        for (const m of r.rapport.messages) this.ajouterTelex(m, r.rapport.jusqua)
      }
      this.ecran = { nom: 'fenetre' }
      this.lancerBoucle()
    }
    if (typeof document !== 'undefined') {
      history.replaceState({ mdv: 0 }, '')
      window.addEventListener('popstate', (e) => this.retourNavigateur(e.state?.mdv ?? 0))
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.sauvegarder()
        else this.revenir()
      })
      window.addEventListener('pagehide', () => this.sauvegarder())
    }
  }

  /** Nouvelle partie, après la lettre de l'Office et le baptême de la fusée. */
  nouvellePartie(nom: string) {
    const t = horlogeReelle()
    this.etat = creerPartie(t, hasardReel, nom)
    this.telex = []
    this.traces = []
    this.ajouterTelex('OFFICE : BON VOL, COMMISSIONNAIRE.', t)
    this.ecran = { nom: 'fenetre' }
    this.sauvegarder()
    this.lancerBoucle()
  }

  /** Étages ouverts au-dessus du tableau de bord : un écran (module, dehors), puis un volet. */
  private etages(): number {
    return (this.ecran.nom === 'module' || this.ecran.nom === 'dehors' ? 1 : 0) + (this.volet ? 1 : 0)
  }

  /**
   * Tient l'historique du navigateur au courant des écrans ouverts, pour que le geste « retour » du téléphone
   * (glisser depuis le bord, ou bouton retour) ferme l'écran du dessus au lieu de quitter le jeu.
   */
  synchroniserHistorique() {
    const n = this.etages()
    if (n === this.etagesHistorique) return
    this.dernierChangement = Date.now()
    if (n > this.etagesHistorique) for (let i = this.etagesHistorique + 1; i <= n; i++) history.pushState({ mdv: i }, '')
    else { this.retoursIgnores++; history.go(n - this.etagesHistorique) }
    this.etagesHistorique = n
  }

  private retourNavigateur(etage: number) {
    if (this.retoursIgnores > 0) { this.retoursIgnores--; return }
    this.etagesHistorique = etage
    this.dernierChangement = Date.now()
    while (this.etages() > etage) {
      if (this.volet) this.volet = null
      else this.ecran = { nom: 'fenetre' }
    }
  }

  /** Ferme l'écran ou le volet du dessus (bouton, ou glissement). */
  fermer() {
    if (this.volet) this.volet = null
    else if (this.ecran.nom !== 'ouverture') this.ecran = { nom: 'fenetre' }
  }

  private lancerBoucle() {
    if (this.minuterie) return
    this.minuterie = setInterval(() => this.pas(), 1000)
    this.sonnerAlarmes()
  }

  /** Les modules en avarie sonnent chacun leur tour (toutes les 0,9 s ; 1,4 s s'il n'y en a qu'un). */
  private sonnerAlarmes() {
    const visible = typeof document === 'undefined' || document.visibilityState === 'visible'
    const enPanne = this.etat && !this.rapport && visible ? modulesEnPanne(this.etat.modules) : []
    if (enPanne.length) ALARMES[enPanne[this.prochaineAlarme++ % enPanne.length]]?.()
    setTimeout(() => this.sonnerAlarmes(), enPanne.length > 1 ? 900 : 1400)
  }

  /** Retour au premier plan après une longue mise en veille : on rattrape comme après une absence. */
  private revenir() {
    if (!this.etat) return
    const t = horlogeReelle()
    if (t - this.etat.vu > 60_000) {
      const avant = this.etat
      const r = rattraper(this.etat, t, hasardReel)
      this.etat = r.etat
      this.annoncerContrats(avant, r.etat)
      this.precedent = null
      if (r.rapport) {
        this.rapport = r.rapport
        for (const m of r.rapport.messages) this.ajouterTelex(m, t)
      }
    }
  }

  /** Une seconde de jeu. */
  private pas() {
    if (!this.etat) return
    const t = horlogeReelle()
    const dt = Math.min(60, Math.max(0, (t - this.etat.vu) / 1000))
    if (dt <= 0) return
    const avant = this.etat
    const r = avancerPartie(avant, t, dt, hasardReel)
    this.precedent = avant
    this.etat = r.etat
    this.maintenant = t
    this.annoncer(avant, r.etat, r.messages, t)
    if (r.arrivee) {
      const nom = r.arrivee.type === 'point' ? 'POINT LIBRE' : r.arrivee.type === 'visiteur' ? 'OBJET INCONNU' : nomAstre(r.arrivee.astre).toUpperCase()
      this.ajouterTelex(`ARRIVÉE : ${nom}. ${r.arrivee.type === 'point' ? 'MOTEUR COUPÉ.' : 'MISE EN ORBITE.'}`, t)
    }
    if (t - this.derniereSauvegarde > SAUVEGARDE_TOUTES_LES) this.sauvegarder()
  }

  /** Contrats accomplis entre deux états : ils seront annoncés, un par un. */
  private annoncerContrats(avant: EtatPartie, apres: EtatPartie) {
    const deja = new Set((avant.contratsAccomplis ?? []).map((c) => c.id))
    const nouveaux = (apres.contratsAccomplis ?? []).filter((c) => !deja.has(c.id)).reverse()
    if (nouveaux.length) {
      this.annonces = [...this.annonces, ...nouveaux]
      SONS.bon()
    }
  }

  /** Messages du moteur, et nouvelles avaries, au téléscripteur. */
  private annoncer(avant: EtatPartie, apres: EtatPartie, messages: string[], t: number) {
    this.annoncerContrats(avant, apres)
    for (const m of messages) this.ajouterTelex(m, t, m.startsWith('FAUTE') || m.startsWith('ORDRE'))
    if (messages.some((m) => m.startsWith('FAUTE') || m.startsWith('ORDRE'))) SONS.erreur()
    const anciennes = new Set(modulesEnPanne(avant.modules))
    const nouvelles = modulesEnPanne(apres.modules).filter((c) => !anciennes.has(c))
    if (nouvelles.length) {
      const cascade = apres.pannes.cascade && nouvelles.length > 1
      this.ajouterTelex(`${cascade ? 'AVARIE EN CASCADE' : 'AVARIE'} : ${nouvelles.join(' + ')}.`, t, true)
      // Première avarie de la carrière : l'Office renvoie au manuel, sans rien expliquer de plus.
      if (avant.pannes.tutoriel === 0 && apres.pannes.tutoriel === 1) this.ajouterTelex('OFFICE : TOUTE AVARIE SE RÉPARE SELON LE MANUEL DE VOL. CONSULTEZ-LE.', t)
    }
  }

  /**
   * La partie telle qu'on la dessine à l'instant `horloge` (ms) : le moteur avance d'un pas par seconde ; entre
   * deux pas, la fusée glisse de sa position précédente à la nouvelle (avec une seconde de retard), pour que les
   * mouvements soient fluides. Renvoie aussi l'instant correspondant, pour placer les astres au même moment.
   */
  /**
   * Où en est le dessin entre le pas précédent (0) et le dernier pas du moteur (1), à l'instant `horloge` : sert à
   * faire glisser en douceur tout ce qui change d'un pas à l'autre (position, temps restant…).
   */
  fraction(horloge = Date.now()): number {
    const e = this.etat
    const p = this.precedent
    if (!e || !p || e.vu <= p.vu || e.vu - p.vu > 5000) return 1
    return Math.max(0, Math.min(1, (horloge - e.vu) / (e.vu - p.vu)))
  }

  affichage(horloge = Date.now()): { etat: EtatPartie; t: number } {
    const e = this.etat!
    const p = this.precedent
    if (!p || e.vu <= p.vu || e.vu - p.vu > 5000) return { etat: e, t: e.vu }
    const duree = e.vu - p.vu
    const a = Math.max(0, Math.min(1, (horloge - e.vu) / duree))
    const f0 = p.fusee
    const f1 = e.fusee
    // Départ ou arrivée pendant ce pas : pas de glissement (il passerait à travers l'astre).
    if (f0.orbite !== f1.orbite) return { etat: e, t: e.vu }
    const fusee = {
      ...f1,
      position: { x: f0.position.x + (f1.position.x - f0.position.x) * a, y: f0.position.y + (f1.position.y - f0.position.y) * a },
      cap: (f0.cap + ecartAngle(f0.cap, f1.cap) * a + 360) % 360,
      z: (f0.z ?? 0) + ((f1.z ?? 0) - (f0.z ?? 0)) * a,
      vitesseCourante: (f0.vitesseCourante ?? 0) + ((f1.vitesseCourante ?? 0) - (f0.vitesseCourante ?? 0)) * a,
    }
    return { etat: { ...e, fusee }, t: p.vu + duree * a }
  }

  ajouterTelex(texte: string, t: number, alerte = false) {
    this.telex = [...this.telex, { t, texte, alerte }].slice(-TELEX_GARDES)
  }

  /** Action du joueur sur un module. */
  agir(action: (modules: EtatModules, ctx: Contexte) => { modules: EtatModules; evenements: Evenement[] }) {
    if (!this.etat) return []
    const t = horlogeReelle()
    const avant = this.etat
    const r = agirMoteur(avant, t, hasardReel, action)
    this.etat = r.etat
    this.annoncer(avant, r.etat, r.messages, t)
    this.reparations(r.evenements, t)
    return r.evenements
  }

  /** Bascule un interrupteur S-1 à S-4. */
  interrupteur(n: NumeroInterrupteur) {
    if (!this.etat) return
    const t = horlogeReelle()
    const avant = this.etat
    const r = basculerInterrupteur(avant, n, t, hasardReel)
    this.etat = r.etat
    this.annoncer(avant, r.etat, r.messages, t)
    this.reparations(r.evenements, t)
  }

  private reparations(evenements: Evenement[], t: number) {
    let repare = false
    for (const ev of evenements) if (ev.type === 'reparation') { this.ajouterTelex(`${ev.module} RÉPARÉ.`, t); repare = true }
    if (repare) SONS.bon()
  }

  /** Remplace la partie (actions de l'Office, de la carte…). */
  remplacer(etat: EtatPartie, messages: string[] = []) {
    if (this.etat) this.annoncerContrats(this.etat, etat)
    this.etat = etat
    for (const m of messages) this.ajouterTelex(m, horlogeReelle())
    this.sauvegarder()
  }

  sauvegarder() {
    if (!this.etat) return
    const t = horlogeReelle()
    ecrire(CLE_PARTIE, sauvegarder(this.etat, t))
    ecrire(CLE_TELEX, JSON.stringify(this.telex))
    ecrire(CLE_TRACES, JSON.stringify(this.traces))
    this.derniereSauvegarde = t
  }
}

export const jeu = new Jeu()
