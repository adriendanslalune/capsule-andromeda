// L'état du jeu (étape 2 de la feuille de route) : ce que possède le joueur et où est sa capsule.
//   - les crédits ;
//   - le niveau du moteur, qui donne la vitesse de croisière ;
//   - la mission de la capsule (son orbite, ou le trajet en cours) ;
//   - les missions du joueur (« contrats ») : celles qu'on lui propose, celle qu'il a acceptée ;
//   - les modules en panne (étape 4) et leurs effets.
// L'heure est toujours passée en paramètre, comme partout dans le moteur.

import { CREDITS_DEPART, NIVEAUX_MOTEUR, type NiveauMoteur } from '../donnees/capsule'
import { BONUS_MAISON, DUREE_ACTION } from '../donnees/contrats'
import { ENERGIE_DEPART, type Energie } from '../donnees/combat'
import { CAPACITE_SOUTE } from '../donnees/marche'
import type { MessageEnvoye } from './messages'
import { avancerEspace, nouvelEspace, vaincre, type EtatEspace } from './espace'
import { MAISONS, maisonDuContrat, missionsParMaison, type Maison } from '../donnees/maisons'
import { TABLEAUX } from '../donnees/tableaux'
import { contexte } from './tableaux'
import { CHANCE_PANNE_PAR_TRAJET, MODULES, type NomModule } from '../donnees/modules'
import { APPAREILS_PRETS, blocDe, ficheBloc, type NomAppareil } from '../donnees/blocs'
import { commencer, jouer, type Geste } from './appareils'
import { hasard, tirerContrat, type Contrat, type ContexteTableau, type Etape } from './contrats'
import type { EtatReparation, Resultat } from './reparation'
import { position } from './corps'
import { Mission, planifier, vitesseAstre, type Plan } from './mission'

/**
 * La mission acceptée : où on en est (numéro de l'étape) et, si une action est en cours, son début (ms UTC) et sa
 * durée (ms ; plus longue si l'énergie est en panne au moment où elle commence).
 */
export interface ContratEnCours { contrat: Contrat; etape: number; debutAction: number | null; dureeAction?: number }

/** Ce qui s'est passé en faisant avancer le jeu (pour prévenir le joueur). */
export type Evenement =
  | { genre: 'etape-finie'; contrat: Contrat; etape: Etape }
  | { genre: 'contrat-fini'; contrat: Contrat }
  | { genre: 'action-interrompue'; contrat: Contrat }
  /** Étape finie : la capsule est partie d'elle-même vers le lieu de l'étape suivante. */
  | { genre: 'depart-auto'; contrat: Contrat; lieu: string }
  /** Un module vient de tomber en panne (usure à l'arrivée d'un trajet). */
  | { genre: 'panne'; module: NomModule }
  /** Un chasseur alien a tiré un missile ; un missile a frappé la capsule (modules en panne). */
  | { genre: 'missile'; alien: string; impact: number }
  | { genre: 'impact'; modules: NomModule[] }

export class Jeu {
  credits = CREDITS_DEPART
  niveauMoteur = 1
  readonly mission = new Mission()
  /** Graine du tirage des missions (enregistrée avec la partie : les tirages sont reproductibles). */
  graine = 20261017
  /** Numéro de la prochaine mission tirée. */
  prochainId = 1
  proposes: Contrat[] = []
  enCours: ContratEnCours | null = null
  /** Numéro de série de la capsule (gravé sur le panneau ; certaines règles du manuel en dépendent). */
  numeroSerie = numeroDeSerie(20261017)
  /** Réparations commencées sur le panneau (module du panneau → état), jusqu'à ce que le module soit réparé. */
  reparations: Partial<Record<NomAppareil, EtatReparation>> = {}
  /** Blocs (systèmes de la capsule) en panne. */
  pannes: NomModule[] = []
  /**
   * Pour chaque bloc en panne, ses modules encore en défaut (un ou deux, tirés à la panne, parmi les modules
   * raccordés). Liste vide : aucun module raccordé dans ce bloc, il se répare depuis ÉTAT (procédure provisoire).
   */
  defauts: Partial<Record<NomModule, NomAppareil[]>> = {}
  /** Répartition de l'énergie entre boucliers, armes et moteurs (Capsule › Armement ; reprise au début d'un combat). */
  energie: Energie = { ...ENERGIE_DEPART }
  /** Les messages envoyés par le joueur, et jusqu'à quand chaque canal a été lu (debut : avant, tout est lu). */
  envoyes: MessageEnvoye[] = []
  lus: Record<string, number> = {}
  /** L'espace autour : épaves vidées, chasseurs vaincus, missiles en vol, intercepteurs. */
  espace: EtatEspace = nouvelEspace()
  /** Le pseudo du joueur (Profil ; c'est son nom dans les Messages). */
  pseudo = 'Capitaine'
  /** La soute : marchandise → tonnes (au plus CAPACITE_SOUTE en tout). */
  soute: Record<string, number> = {}
  /** Le carnet de bord (pour le Profil) : missions finies par Maison, crédits gagnés, objets triés. */
  carnet = { missions: { nettoyeurs: 0, commercants: 0, mercenaires: 0 } as Record<Maison, number>, credits: 0, objetsTries: 0 }
  /** Maison du joueur (null : neutre). Choisie selon son affinité à l'étape 8 ; elle change les missions proposées. */
  maison: Maison | null = null
  /** Arrivée (ms UTC) du dernier trajet dont l'usure a été tirée (chaque trajet n'est tiré qu'une fois). */
  usureJusqua = 0

  /** Le module est-il en panne ? */
  enPanne(m: NomModule): boolean {
    return this.pannes.includes(m)
  }

  /** Met un bloc en panne (s'il ne l'est pas déjà) : un ou deux de ses modules tombent en défaut. */
  casser(m: NomModule): void {
    if (this.enPanne(m)) return
    this.pannes.push(m)
    this.tirerDefauts(m)
  }

  /** Tire les modules en défaut d'un bloc en panne : un ou deux parmi ses modules raccordés. */
  tirerDefauts(m: NomModule): void {
    const prets = ficheBloc(m).appareils.filter((a) => APPAREILS_PRETS.includes(a))
    const a = hasard(this.graine), b = hasard(a.graine)
    this.graine = b.graine
    const n = Math.min(prets.length, 1 + Math.floor(a.x * 2))
    if (n === 1 && prets.length > 1) this.defauts[m] = [prets[Math.floor(b.x * prets.length)]]
    else this.defauts[m] = n === 2 && prets.length === 3 ? prets.filter((_, k) => k !== Math.floor(b.x * 3)) : prets.slice(0, n)
  }

  /** Répare un bloc d'un coup (procédure provisoire, ou essai). */
  reparer(m: NomModule): void {
    this.pannes = this.pannes.filter((p) => p !== m)
    for (const a of ficheBloc(m).appareils) delete this.reparations[a]
    delete this.defauts[m]
  }

  /** Le module du panneau est-il en défaut ? */
  enDefaut(a: NomAppareil): boolean {
    return !!this.defauts[blocDe(a).bloc]?.includes(a)
  }

  /** Le bloc en panne ne se répare-t-il que depuis ÉTAT (aucun de ses modules n'est encore raccordé) ? */
  reparationProvisoire(m: NomModule): boolean {
    return this.enPanne(m) && !this.defauts[m]?.length
  }

  /** Nouvelle partie : un hasard propre à elle (missions, pannes) et un numéro de série tiré au sort. */
  nouvellePartie(graine: number): void {
    this.graine = graine >>> 0
    this.numeroSerie = numeroDeSerie(this.graine)
    this.pseudo = `Capitaine-${this.numeroSerie.slice(-3)}`
  }

  /** La réparation d'un module du panneau (commencée au premier regard), ou null s'il n'est pas en défaut. */
  reparation(a: NomAppareil): EtatReparation | null {
    if (!this.enDefaut(a)) return null
    if (!this.reparations[a]) {
      const h = hasard(this.graine)
      this.graine = h.graine
      this.reparations[a] = commencer(a, h.graine)
    }
    return this.reparations[a]!
  }

  /**
   * Un geste sur les commandes d'un module en défaut. Réparé (« repare ») : le module n'est plus en défaut, et le bloc
   * remarche quand tous ses modules sont réparés.
   */
  geste(a: NomAppareil, g: Geste, t: number): Resultat {
    const r = this.reparation(a)
    if (!r) return 'ok'
    const res = jouer(a, r, g, this.numeroSerie, t)
    if (res === 'repare') {
      const bloc = blocDe(a).bloc
      delete this.reparations[a]
      this.defauts[bloc] = this.defauts[bloc]!.filter((d) => d !== a)
      if (!this.defauts[bloc]!.length) this.reparer(bloc)
    }
    return res
  }

  /** La navigation marche-t-elle (sinon : impossible de calculer un trajet) ? */
  peutNaviguer(): boolean {
    return !this.enPanne('navigation')
  }

  /** Durée d'une action sur place (ms) : deux fois plus longue si l'énergie est en panne. */
  dureeAction(): number {
    return DUREE_ACTION * (this.enPanne('energie') ? 2 : 1)
  }

  /** Fiche du niveau actuel du moteur. */
  moteur(): NiveauMoteur {
    return NIVEAUX_MOTEUR.find((n) => n.niveau === this.niveauMoteur) ?? NIVEAUX_MOTEUR[0]
  }

  /** Vitesse de croisière de la capsule (km/s), d'après son moteur ; divisée par 2 si le moteur est en panne. */
  vitesse(): number {
    return this.moteur().vitesse / (this.enPanne('moteur') ? 2 : 1)
  }

  /** Le moteur suivant (à acheter), ou null au niveau le plus haut. */
  moteurSuivant(): NiveauMoteur | null {
    return NIVEAUX_MOTEUR.find((n) => n.niveau === this.niveauMoteur + 1) ?? null
  }

  /** Achète le moteur suivant, si les crédits suffisent. Renvoie vrai si l'achat est fait. */
  acheterMoteur(): boolean {
    const m = this.moteurSuivant()
    if (!m || this.credits < m.prix) return false
    this.credits -= m.prix
    this.niveauMoteur = m.niveau
    return true
  }

  /**
   * Complète les tableaux de missions (décisions d'Adrien du 18/10/2026) : chaque planète en a 6, chaque grande lune 4,
   * réparties entre les Maisons (missionsParMaison) ; chaque mission se passe dans le système de son lieu ; son prix
   * est fixé par la zone (le membre d'une Maison est payé 25 % de plus pour les missions de sa Maison).
   */
  proposer(t: number): void {
    // Communications en panne : plus de nouvelles missions (celles déjà proposées restent).
    if (this.enPanne('communications')) return
    for (const tableau of TABLEAUX) {
      const voulues = missionsParMaison(this.maison, tableau.nombre, tableau.lieu)
      let ctx: ContexteTableau | null = null
      for (const { maison } of MAISONS) {
        while (this.proposes.filter((c) => c.tableau === tableau.lieu && maisonDuContrat(c) === maison).length < voulues[maison]) {
          ctx ??= contexte(tableau, this.espace, t)
          const exclus = [...this.proposes, ...(this.enCours ? [this.enCours.contrat] : [])].flatMap((c) => c.etapes.map((e) => e.lieu))
          const { contrat, graine } = tirerContrat(this.prochainId++, this.graine, ctx, maison, exclus)
          this.graine = graine
          if (maison === this.maison) contrat.recompense = Math.round((contrat.recompense * BONUS_MAISON) / 10) * 10
          this.proposes.push(contrat)
        }
      }
    }
  }

  /** Accepte une mission proposée (une seule à la fois). Renvoie faux si c'est impossible. */
  accepter(id: number, t: number): boolean {
    const c = this.proposes.find((p) => p.id === id)
    if (!c || this.enCours) return false
    this.proposes = this.proposes.filter((p) => p !== c)
    this.enCours = { contrat: c, etape: 0, debutAction: null }
    this.proposer(t)
    return true
  }

  /** La cargaison à bord (livraison chargée, pas encore livrée) : où la livrer, ou null. */
  cargaison(): { pour: string } | null {
    const ec = this.enCours
    if (!ec || ec.contrat.genre !== 'livrer' || ec.etape === 0) return null
    return { pour: ec.contrat.etapes[ec.contrat.etapes.length - 1].lieu }
  }

  /** Abandonne la mission en cours (sans pénalité). */
  abandonner(): void {
    this.enCours = null
  }

  /** Étape actuelle de la mission en cours, ou null. */
  etapeActuelle(): Etape | null {
    return this.enCours ? this.enCours.contrat.etapes[this.enCours.etape] : null
  }

  /** La capsule est-elle arrivée sur le lieu de l'étape actuelle (en orbite autour de lui, ou à côté) ? */
  surPlace(t: number): boolean {
    const e = this.etapeActuelle()
    return !!e && this.mission.phase(t) === 'orbite' && this.mission.centre(t) === e.lieu
  }

  /** Peut-on lancer l'action de l'étape actuelle (sur place, aucune action en cours) ? */
  peutAgir(t: number): boolean {
    return !!this.enCours && this.enCours.debutAction === null && this.surPlace(t)
  }

  /** Lance l'action de l'étape actuelle (elle dure DUREE_ACTION). */
  agir(t: number): boolean {
    if (!this.peutAgir(t)) return false
    this.enCours!.debutAction = t
    this.enCours!.dureeAction = this.dureeAction()
    return true
  }

  /** Fin de l'action en cours (ms UTC), ou null. */
  finAction(): number | null {
    const ec = this.enCours
    return ec?.debutAction != null ? ec.debutAction + (ec.dureeAction ?? DUREE_ACTION) : null
  }

  /**
   * Fait avancer les missions jusqu'à l'instant t : une action terminée passe à l'étape suivante ; la dernière rapporte
   * la récompense et une nouvelle mission est proposée. Une action est interrompue si la capsule n'est plus sur place.
   * Avec une vitesse (km/s), les étapes s'enchaînent (demande d'Adrien du 17/10/2026) : l'action finie, la capsule part
   * aussitôt vers le lieu de l'étape suivante (au moment où l'action s'est terminée, même application fermée).
   */
  avancer(t: number, vitesseEnchainement?: number): Evenement[] {
    const evenements: Evenement[] = []
    this.user(t, evenements)
    this.menaces(t, evenements)
    this.proposer(t)
    const ec = this.enCours
    if (!ec || ec.debutAction === null) return evenements
    const fin = ec.debutAction + (ec.dureeAction ?? DUREE_ACTION)
    // La capsule doit rester sur place jusqu'au bout (vérifié à la fin de l'action si elle est passée).
    if (!this.surPlace(Math.min(t, fin))) {
      ec.debutAction = null
      evenements.push({ genre: 'action-interrompue', contrat: ec.contrat })
      return evenements
    }
    if (t < fin) return evenements
    ec.debutAction = null
    this.finirEtape(fin, evenements, vitesseEnchainement)
    return evenements
  }

  /**
   * L'étape actuelle est faite (à l'instant fin) : on passe à la suivante, ou la mission est finie (récompense, et une
   * nouvelle mission proposée). Avec une vitesse, la capsule part aussitôt vers le lieu de l'étape suivante.
   */
  private finirEtape(fin: number, evenements: Evenement[], vitesseEnchainement?: number): void {
    const ec = this.enCours!
    const etape = ec.contrat.etapes[ec.etape]
    ec.etape++
    evenements.push({ genre: 'etape-finie', contrat: ec.contrat, etape })
    if (ec.etape >= ec.contrat.etapes.length) {
      this.credits += ec.contrat.recompense
      this.carnet.credits += ec.contrat.recompense
      this.carnet.missions[maisonDuContrat(ec.contrat)]++
      this.enCours = null
      evenements.push({ genre: 'contrat-fini', contrat: ec.contrat })
      this.proposer(fin)
    } else if (vitesseEnchainement !== undefined && this.peutNaviguer()) {
      const lieu = ec.contrat.etapes[ec.etape].lieu
      if (!this.surPlace(fin)) {
        const p = planifier(this.mission.etatHeliocentrique(fin), lieu, fin, vitesseEnchainement)
        if (p.possible) {
          this.mission.partir(p.plan)
          evenements.push({ genre: 'depart-auto', contrat: ec.contrat, lieu })
        }
      }
    }
  }

  /**
   * Missiles aliens : les tirs (décompte) et les impacts. Un impact ralentit la capsule (le Moteur tombe en panne :
   * vitesse divisée par 2 jusqu'à réparation) ; si le Moteur l'est déjà, un autre bloc ; si la Coque est en panne,
   * l'impact touche un bloc de plus (décisions d'Adrien du 18/10/2026).
   */
  private menaces(t: number, evenements: Evenement[]): void {
    const { lances, impacts } = avancerEspace(this.espace, t)
    for (const m of lances) evenements.push({ genre: 'missile', alien: m.alien, impact: m.impact })
    for (const m of impacts) {
      const coqueEnPanne = this.enPanne('coque')
      const touches: NomModule[] = []
      const autre = (graine: number) => {
        const libres = MODULES.map((f) => f.nom).filter((n) => !this.enPanne(n) && !touches.includes(n))
        return libres.length ? libres[Math.floor(hasard(graine).x * libres.length)] : null
      }
      const premier = !this.enPanne('moteur') ? 'moteur' : autre(m.id)
      if (premier) { this.casser(premier); touches.push(premier) }
      if (coqueEnPanne) { const second = autre(m.id + 1); if (second) { this.casser(second); touches.push(second) } }
      evenements.push({ genre: 'impact', modules: touches })
    }
  }

  /** L'étape actuelle est-elle une chasse (qui se fait par un combat, en vue tactique) ? */
  etapeDeCombat(): boolean {
    return this.etapeActuelle()?.action === 'abattre'
  }

  /** Le chasseur de l'étape de chasse est abattu (victoire au combat) : il disparaît, l'étape est faite. */
  abattre(t: number, vitesseEnchainement?: number): Evenement[] | null {
    if (!this.etapeDeCombat() || !this.peutAgir(t)) return null
    vaincre(this.espace, this.etapeActuelle()!.lieu, t)
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return evenements
  }

  /** Tonnes dans la soute. */
  chargeSoute(): number {
    return Object.values(this.soute).reduce((a, b) => a + b, 0)
  }

  /** Range des marchandises dans la soute, jusqu'à ce qu'elle soit pleine. Renvoie les tonnes qui n'ont pas tenu. */
  charger(materiaux: Record<string, number>): number {
    let perdu = 0
    for (const [m, q] of Object.entries(materiaux)) {
      const place = Math.max(0, CAPACITE_SOUTE - this.chargeSoute())
      const range = Math.round(Math.min(place, q) * 100) / 100
      if (range > 0) this.soute[m] = Math.round(((this.soute[m] ?? 0) + range) * 100) / 100
      perdu += q - range
    }
    return Math.round(perdu * 100) / 100
  }

  /** L'étape actuelle est-elle un nettoyage (qui se fait par le tri de l'épave, décision d'Adrien du 18/10/2026) ? */
  etapeDeTri(): boolean {
    return this.etapeActuelle()?.action === 'nettoyer'
  }

  /**
   * Fin du tri de l'épave d'une étape de nettoyage : les matériaux vont dans la soute (ce qui ne tient pas est perdu),
   * et l'étape est faite. Renvoie les événements, et les tonnes perdues ; null si ce n'est pas possible ici.
   */
  nettoyer(materiaux: Record<string, number>, objetsTries: number, t: number, vitesseEnchainement?: number): { evenements: Evenement[]; perdu: number } | null {
    if (!this.etapeDeTri() || !this.peutAgir(t)) return null
    const perdu = this.charger(materiaux)
    this.carnet.objetsTries += objetsTries
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return { evenements, perdu }
  }

  /**
   * Usure : à l'arrivée de chaque trajet (une seule fois par trajet), un module peut tomber en panne
   * (CHANCE_PANNE_PAR_TRAJET), tiré au hasard reproductible de la partie.
   */
  private user(t: number, evenements: Evenement[]): void {
    const p = this.mission.plan
    if (!p || t < p.arrivee || p.arrivee <= this.usureJusqua) return
    this.usureJusqua = p.arrivee
    const a = hasard(this.graine), b = hasard(a.graine)
    this.graine = b.graine
    if (a.x >= CHANCE_PANNE_PAR_TRAJET) return
    const m = MODULES[Math.floor(b.x * MODULES.length)].nom
    if (this.enPanne(m)) return
    this.casser(m)
    evenements.push({ genre: 'panne', module: m })
  }

  /**
   * Les trajets d'une mission, depuis là où est la capsule à l'instant t, à la vitesse donnée (km/s) : vers le lieu de
   * chaque étape restante, en comptant le temps des actions sur place. null si un lieu est hors de portée.
   */
  trajetsContrat(c: Contrat, t: number, vitesse: number): Plan[] | null {
    const debut = this.enCours?.contrat.id === c.id ? this.enCours.etape : 0
    const plans: Plan[] = []
    let depart = this.mission.etatHeliocentrique(t)
    let instant = t
    let ici = this.mission.phase(t) === 'orbite' ? this.mission.centre(t) : null
    for (const e of c.etapes.slice(debut)) {
      if (e.lieu !== ici) {
        const p = planifier(depart, e.lieu, instant, vitesse)
        if (!p.possible) return null
        plans.push(p.plan)
        instant = p.plan.arrivee
      }
      // Après l'action sur place, on repart de là (de la position du lieu, à sa vitesse).
      instant += this.dureeAction()
      depart = { r: position(e.lieu, instant), v: vitesseAstre(e.lieu, instant) }
      ici = e.lieu
    }
    return plans
  }

  /** Temps de trajet total d'une mission (ms, sans les actions sur place), ou null si hors de portée. */
  dureeTrajets(c: Contrat, t: number, vitesse: number): number | null {
    const plans = this.trajetsContrat(c, t, vitesse)
    return plans ? plans.reduce((s, p) => s + p.arrivee - p.depart, 0) : null
  }
}

/** Numéro de série d'une capsule (« AN-7Q3 ») tiré d'une graine. */
export function numeroDeSerie(graine: number): string {
  const LETTRES = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  let g = graine >>> 0
  const t = (n: number) => { const h = hasard(g); g = h.graine; return Math.floor(h.x * n) }
  return `${LETTRES[t(23)]}${LETTRES[t(23)]}-${1 + t(9)}${LETTRES[t(23)]}${t(10)}`
}
