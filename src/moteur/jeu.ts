// L'état du jeu (étape 2 de la feuille de route) : ce que possède le joueur et où est sa capsule.
//   - les crédits ;
//   - le niveau du moteur, qui donne la vitesse de croisière ;
//   - la mission de la capsule (son orbite, ou le trajet en cours) ;
//   - les missions du joueur (« contrats ») : celles qu'on lui propose, celle qu'il a acceptée ;
//   - les modules en panne (étape 4) et leurs effets.
// L'heure est toujours passée en paramètre, comme partout dans le moteur.

import { CREDITS_DEPART, NIVEAUX_MOTEUR, type NiveauMoteur } from '../donnees/capsule'
import { CONTRATS_PROPOSES, DUREE_ACTION } from '../donnees/contrats'
import { CHANCE_PANNE_PAR_TRAJET, MODULES, type NomModule } from '../donnees/modules'
import { hasard, tirerContrat, type Contrat, type Etape } from './contrats'
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
  /** Modules en panne. */
  pannes: NomModule[] = []
  /** Arrivée (ms UTC) du dernier trajet dont l'usure a été tirée (chaque trajet n'est tiré qu'une fois). */
  usureJusqua = 0

  /** Le module est-il en panne ? */
  enPanne(m: NomModule): boolean {
    return this.pannes.includes(m)
  }

  /** Met un module en panne (s'il ne l'est pas déjà). */
  casser(m: NomModule): void {
    if (!this.enPanne(m)) this.pannes.push(m)
  }

  /** Répare un module. */
  reparer(m: NomModule): void {
    this.pannes = this.pannes.filter((p) => p !== m)
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

  /** Complète la liste des missions proposées (jusqu'à CONTRATS_PROPOSES), en variant les lieux. */
  proposer(t: number): void {
    // Communications en panne : plus de nouvelles missions (celles déjà proposées restent).
    if (this.enPanne('communications')) return
    while (this.proposes.length < CONTRATS_PROPOSES) {
      const exclus = [...this.proposes, ...(this.enCours ? [this.enCours.contrat] : [])].flatMap((c) => c.etapes.map((e) => e.lieu))
      const { contrat, graine } = tirerContrat(this.prochainId++, this.graine, t, exclus)
      this.graine = graine
      this.proposes.push(contrat)
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
    const etape = ec.contrat.etapes[ec.etape]
    ec.debutAction = null
    ec.etape++
    evenements.push({ genre: 'etape-finie', contrat: ec.contrat, etape })
    if (ec.etape >= ec.contrat.etapes.length) {
      this.credits += ec.contrat.recompense
      this.enCours = null
      evenements.push({ genre: 'contrat-fini', contrat: ec.contrat })
      this.proposer(t)
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
    return evenements
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
