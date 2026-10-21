// L'état du jeu (étape 2 de la feuille de route) : ce que possède le joueur et où est sa capsule.
//   - les crédits ;
//   - le niveau du moteur, qui donne la vitesse de croisière ;
//   - la mission de la capsule (son orbite, ou le trajet en cours) ;
//   - les missions du joueur (« contrats ») : celles qu'on lui propose, celle qu'il a acceptée ;
//   - les modules en panne (étape 4) et leurs effets.
// L'heure est toujours passée en paramètre, comme partout dans le moteur.

import { CREDITS_DEPART, NIVEAUX_MOTEUR, type NiveauMoteur } from '../donnees/capsule'
import { BONUS_MAISON, DUREE_ACTION } from '../donnees/contrats'
import { ARMEMENT, BONUS_SANS_DEGAT, CANON_TROIS_BALLES, ENERGIE_DEPART, LIGNE_DE_MAISON, NIVEAU_ARMEMENT_MAX, PRIX_ARMEMENT, type Energie, type LigneArmement } from '../donnees/combat'
import type { Equipement } from './combat'
import { CAPACITE_SOUTE, MARCHANDISES, type FicheMarche } from '../donnees/marche'
import { achatVente, cours, delaiLumiere, marcheDeLaCapsule } from './marche'
import { avancerRadar, radarEteint, type EtatRadar } from './radar'
import { radioNeuve, type EtatRadio } from './radio'
import { avancerOrdres, compagnie, passerOrdre, portefeuilleVide, type OrdreBourse, type Portefeuille } from './bourse'
import { BONUS_SANS_REBOND } from '../donnees/amarrage'
import { BONUS_SANS_ERREUR } from '../donnees/depannage'
import { BONUS_PREMIER_COUP } from '../donnees/remorquage'
import { BONUS_SANS_COUP } from '../donnees/escorte'
import type { MessageEnvoye } from './messages'
import { localise, monolitheNomme, nouveauxMonolithes, oublierFutur, pinger, ramasser, type Echo, type EtatMonolithes } from './monolithes'
import { avancerEspace, nouvelEspace, vaincre, type EtatEspace } from './espace'
import { MAISONS, maisonDuContrat, missionsParMaison, type Maison } from '../donnees/maisons'
import { PORTEES, TABLEAUX, VOL_MAX_DEBUT, ZONES, type Portee } from '../donnees/tableaux'
import { EPAVES } from '../donnees/espace'
import { contexte } from './tableaux'
import { maisonsOuvertes } from './profil'
import { MOTS_DU_PARRAIN, PARRAINS } from '../donnees/messages'
import { CHANCE_PANNE_PAR_TRAJET, MODULES, type NomModule } from '../donnees/modules'
import { APPAREILS_PRETS, blocDe, ficheBloc, type NomAppareil } from '../donnees/blocs'
import { commencer, jouer, type Geste } from './appareils'
import { hasard, tirerContrat, type Contrat, type ContexteTableau, type Etape } from './contrats'
import type { EtatReparation, Resultat } from './reparation'
import { astreDominant, corps, position } from './corps'
import { niveauDe, palierDe } from './niveau'
import { XP } from '../donnees/niveaux'
import { niveauDeZone } from './combat'
import { estLibre, liberer, resister, zoneDuLieu, type EtatZones } from './zones'
import { POINTS_RESISTANCE, ZONES_A_LIBERER } from '../donnees/zones'
import { avancerQuetes, type EtatQuete } from './quetes'
import { Mission, planifier, vitesseAstre, vitesseEnVol, type Plan } from './mission'

/** Le feu d'artifice d'une zone libérée dure 2 minutes (demande d'Adrien du 21/10/2026). */
export const DUREE_FEUX = 120_000

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
  /** Arrivée au Soleil : le rêve (premier : la première fois, le titre Icare gagné). */
  | { genre: 'reve-soleil'; premier: boolean }

/** Un message privé qu'un bot a écrit au joueur après un événement du jeu. */
export interface LettreDeBot { id: number; bot: string; texte: string; envoye: number }

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
  /** Les monolithes : ceux qu'on a ramassés, les échos de la radio. */
  monolithes: EtatMonolithes = nouveauxMonolithes()
  /** Le pseudo du joueur (Profil ; c'est son nom dans les Messages). */
  pseudo = 'Capitaine'
  /** Les quêtes commencées (décisions d'Adrien du 20/10/2026), celle qu'on suit sur la carte, les zones libérées. */
  quetes: Record<string, EtatQuete> = {}
  queteSuivie: string | null = null
  /** La libération des zones (décisions d'Adrien du 21/10/2026) : points de résistance et zones libérées. */
  zones: EtatZones = { points: {}, liberees: [] }
  /** L'expérience du capitaine (décisions d'Adrien du 21/10/2026) : le niveau s'en déduit (moteur/niveau.ts). */
  xp = 0
  /** Le commerce du jour (crédits échangés pas encore comptés, XP déjà gagnée ce jour-là) : au plus 100 XP par jour. */
  commerce = { jour: 0, credits: 0, xp: 0 }
  /** Les gains d'XP pas encore montrés (le « +35 XP » qui flotte). */
  gainsXp: number[] = []
  /** L'armement acheté (décisions d'Adrien du 21/10/2026) : le niveau de chaque ligne, de 1 à 6. */
  armement: Record<LigneArmement, number> = { coque: 1, canon: 1, bombes: 1, bouclier: 1 }
  /** Les zones où la capsule est déjà allée (en orbite autour d'elles ou de ce qui tourne autour) : sur la carte, les autres sont grisées. */
  visites: string[] = ['Terre']
  /** Annonces des quêtes (objectifs atteints…) que l'affichage n'a pas encore faites. */
  annoncesQuetes: string[] = []
  /** Les zones libérées pas encore annoncées par leur fenêtre (demande d'Adrien du 21/10/2026). */
  liberationsAAnnoncer: string[] = []
  /** Les feux d'artifice sur la carte : la zone libérée et quand (2 minutes, demande d'Adrien du 21/10/2026). */
  feux: { zone: string; t: number }[] = []
  /** La Bourse : actions, ordres en route, derniers ordres confirmés ; et les confirmations à annoncer. */
  bourse: Portefeuille = portefeuilleVide()
  /** Le radar de la carte (sa jauge ; pas sauvegardé : il repart éteint). */
  radar: EtatRadar = radarEteint()
  /** La radio : sa fréquence, les Voix perdues enregistrées. */
  radio: EtatRadio = radioNeuve()
  annoncesBourse: OrdreBourse[] = []
  /** La soute : marchandise → tonnes (au plus CAPACITE_SOUTE en tout). */
  soute: Record<string, number> = {}
  /** Le carnet de bord (pour le Profil) : missions finies par Maison, crédits gagnés, objets triés. */
  carnet = { missions: { nettoyeurs: 0, ingenieurs: 0, mercenaires: 0 } as Record<Maison, number>, credits: 0, objetsTries: 0 }
  /** Maison du joueur (null : neutre). Choisie selon son affinité à l'étape 8 ; elle change les missions proposées. */
  maison: Maison | null = null
  /** Les Maisons qui ont déjà proposé au joueur de les rejoindre (une seule fois chacune). */
  invitations: Maison[] = []
  /** Les messages privés que des bots ont écrits au joueur à la suite d'un événement (invitation, bienvenue…). */
  lettres: LettreDeBot[] = []
  /** Arrivée (ms UTC) du dernier trajet dont l'usure a été tirée (chaque trajet n'est tiré qu'une fois). */
  usureJusqua = 0
  /**
   * Le titre secret « Icare » (décision d'Adrien du 21/10/2026) : la date du premier rêve du Soleil, null avant. Foncer
   * dans le Soleil n'a aucun effet sur le jeu : un rêve (animation), et la capsule se réveille là d'où elle était partie.
   */
  icare: number | null = null

  constructor() {
    this.synchroniserZones()
  }

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

  /**
   * Le dépanneur (décision d'Adrien du 20/10/2026) : pour un joueur coincé, la réparation automatique d'un bloc en
   * panne coûte la moitié de ses crédits (gratuite s'il n'en a pas). Renvoie ce qu'il a payé, ou null (pas en panne).
   */
  prixDepanneur(): number {
    return Math.floor(this.credits / 2)
  }
  appelerDepanneur(m: NomModule): number | null {
    if (!this.enPanne(m)) return null
    const prix = this.prixDepanneur()
    this.credits -= prix
    this.reparer(m)
    return prix
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
    const res = jouer(a, r, g, this.numeroSerie, t, this.pressionForcee())
    if (res === 'repare') {
      const bloc = blocDe(a).bloc
      delete this.reparations[a]
      this.defauts[bloc] = this.defauts[bloc]!.filter((d) => d !== a)
      if (!this.defauts[bloc]!.length) this.reparer(bloc)
      this.gagnerXp(XP.reparation)
    }
    return res
  }

  /** La soupape en défaut a son aiguille de PRESSION dans le rouge (vrai) ; sinon, c'est le tour du bornier qui décide. */
  pressionForcee(): true | undefined {
    return this.enDefaut('soupape') ? true : undefined
  }

  /** Envoie un PING depuis la place de la capsule (au plus un par heure) : l'écho attendu, ou null. */
  pinger(t: number): Echo | null {
    const r = this.mission.etatHeliocentrique(t).r
    return pinger(this.monolithes, { x: r.x, y: r.y }, t)
  }

  /** Le monolithe (localisé, pas encore ramassé) à côté duquel est la capsule, ou null. */
  monolitheIci(t: number): number | null {
    if (this.mission.phase(t) !== 'orbite') return null
    const m = monolitheNomme(this.mission.centre(t))
    return m && localise(this.monolithes, m.numero, t) ? m.numero : null
  }

  /** Ramasse le monolithe à côté duquel est la capsule. */
  ramasserMonolithe(t: number): number | null {
    const n = this.monolitheIci(t)
    if (n === null || !ramasser(this.monolithes, n, t)) return null
    this.annoncesQuetes.push(...avancerQuetes(this, { genre: 'monolithe' }, t))
    this.annoncesQuetes.push(...resister(this.zones, this.mission.etat(t).position, POINTS_RESISTANCE.monolithe, t))
    this.gagnerXp(XP.monolithe)
    return n
  }

  /** L'astre ou l'engin autour duquel la capsule est en orbite (null en plein vol). */
  lieuEnOrbite(t: number): string | null {
    return this.mission.phase(t) === 'orbite' ? this.mission.centre(t) : null
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

  /**
   * Passe un ordre à la Bourse, de n'importe où : il part vers le siège de la compagnie à la vitesse de la lumière.
   * Achat : `quantite` crédits (Infinity : tout) ; vente : `quantite` actions.
   */
  ordreBourse(id: string, sens: 'acheter' | 'vendre', quantite: number, t: number): OrdreBourse | null {
    const c = compagnie(id)
    // Une compagnie n'est cotée qu'une fois la zone de son siège libérée (décision d'Adrien du 21/10/2026).
    if (!c || !estLibre(this.zones, c.siege)) return null
    const credits = { valeur: this.credits }
    const o = passerOrdre(this.bourse, credits, id, sens, quantite, t, delaiLumiere(c.siege, t))
    this.credits = credits.valeur
    return o
  }

  /** Les ordres de Bourse arrivés au siège s'exécutent ; les confirmations revenues à la capsule changent le portefeuille. */
  avancerBourse(t: number): void {
    if (!this.bourse.ordres.length) return
    const credits = { valeur: this.credits }
    const arrivees = avancerOrdres(this.bourse, credits, t, delaiLumiere)
    this.annoncesBourse.push(...arrivees)
    this.credits = credits.valeur
    for (const o of arrivees) this.xpCommerce((o.actions ?? 0) * (o.prix ?? 0), t)
  }

  /** Ce qui manque pour le moteur suivant : crédits, et tonnes de chaque matériau (vide si rien ne manque). */
  manquePourMoteur(): { credits: number; materiaux: Record<string, number> } {
    const m = this.moteurSuivant()
    if (!m) return { credits: 0, materiaux: {} }
    const materiaux: Record<string, number> = {}
    for (const [nom, n] of Object.entries(m.materiaux)) {
      const manque = Math.round((n - (this.soute[nom] ?? 0)) * 100) / 100
      if (manque > 0) materiaux[nom] = manque
    }
    return { credits: Math.max(0, m.prix - this.credits), materiaux }
  }

  /** Gagne de l'XP ; annonce un niveau gagné, et la nouvelle forme de la capsule à chaque palier. */
  gagnerXp(n: number): void {
    const gain = Math.round(n)
    if (gain <= 0) return
    const avant = niveauDe(this.xp).niveau
    this.xp += gain
    this.gainsXp.push(gain)
    const apres = niveauDe(this.xp).niveau
    if (apres === avant) return
    const p = palierDe(apres)
    this.annoncesQuetes.push(palierDe(avant).forme !== p.forme ? `Niveau ${apres} ! Ta capsule devient une ${p.nom.toLowerCase()} !` : `Niveau ${apres} !`)
  }

  /** Du commerce (Comptoir, Bourse) : 1 XP par tranche de 100 crédits, au plus 100 XP par jour. */
  xpCommerce(credits: number, t: number): void {
    const jour = Math.floor(t / 86_400_000)
    if (this.commerce.jour !== jour) this.commerce = { jour, credits: 0, xp: 0 }
    this.commerce.credits += credits
    const gain = Math.min(Math.floor(this.commerce.credits / 100) * XP.commerceParCent, XP.commerceParJour - this.commerce.xp)
    this.commerce.credits %= 100
    if (gain <= 0) return
    this.commerce.xp += gain
    this.gagnerXp(gain)
  }

  /** Le niveau d'une ligne d'armement au combat : acheté, plus 1 sur la ligne de sa Maison (jusqu'au 7e niveau). */
  niveauArmement(ligne: LigneArmement): number {
    return this.armement[ligne] + (this.maison && LIGNE_DE_MAISON[this.maison] === ligne ? 1 : 0)
  }

  /** L'équipement de la capsule au combat, d'après son armement. */
  equipement(): Equipement {
    const v = (ligne: LigneArmement) => ARMEMENT.find((f) => f.ligne === ligne)!.valeurs[this.niveauArmement(ligne) - 1]
    return { coque: v('coque'), degats: v('canon'), bombes: v('bombes'), bouclier: v('bouclier'), troisBalles: this.niveauArmement('canon') >= CANON_TROIS_BALLES }
  }

  /** Ce qui manque pour le niveau suivant d'une ligne d'armement (null : déjà au plus haut). */
  manquePourArmement(ligne: LigneArmement): { prix: number; credits: number; materiaux: Record<string, number> } | null {
    const n = this.armement[ligne]
    if (n >= NIVEAU_ARMEMENT_MAX) return null
    const prix = PRIX_ARMEMENT[n], besoin = ARMEMENT.find((f) => f.ligne === ligne)!.materiaux[n]
    const materiaux: Record<string, number> = {}
    for (const [nom, q] of Object.entries(besoin)) {
      const manque = Math.round((q - (this.soute[nom] ?? 0)) * 100) / 100
      if (manque > 0) materiaux[nom] = manque
    }
    return { prix, credits: Math.max(0, prix - this.credits), materiaux }
  }

  /** Achète le niveau suivant d'une ligne d'armement, si les crédits et les matériaux de la soute suffisent. */
  acheterArmement(ligne: LigneArmement): boolean {
    const m = this.manquePourArmement(ligne)
    if (!m || m.credits > 0 || Object.keys(m.materiaux).length) return false
    const n = this.armement[ligne]
    this.credits -= m.prix
    for (const [nom, q] of Object.entries(ARMEMENT.find((f) => f.ligne === ligne)!.materiaux[n])) {
      const reste = Math.round(((this.soute[nom] ?? 0) - q) * 100) / 100
      if (reste > 0) this.soute[nom] = reste
      else delete this.soute[nom]
    }
    this.armement[ligne] = n + 1
    return true
  }

  /** Achète le moteur suivant, si les crédits et les matériaux de la soute suffisent. Renvoie vrai si l'achat est fait. */
  acheterMoteur(): boolean {
    const m = this.moteurSuivant()
    const manque = this.manquePourMoteur()
    if (!m || manque.credits > 0 || Object.keys(manque.materiaux).length) return false
    this.credits -= m.prix
    for (const [nom, n] of Object.entries(m.materiaux)) {
      const reste = Math.round(((this.soute[nom] ?? 0) - n) * 100) / 100
      if (reste > 0) this.soute[nom] = reste
      else delete this.soute[nom]
    }
    this.niveauMoteur = m.niveau
    return true
  }

  /**
   * Complète les tableaux de missions (décisions d'Adrien du 18/10/2026) : 6 par système, réparties entre les Maisons
   * (missionsParMaison) et entre les portées (3 proches, 2 moyennes, 1 lointaine) ; son prix est fixé par la zone du
   * système et l'éloignement du lieu (le membre d'une Maison est payé 25 % de plus pour les missions de sa Maison).
   */
  proposer(t: number): void {
    // Communications en panne : plus de nouvelles missions (celles déjà proposées restent).
    if (this.enPanne('communications')) return
    // Début de partie : dans le système de la Terre, les contrats restent à portée du moteur (VOL_MAX_DEBUT) ; ceux
    // proposés plus loin (avant cette règle) sont retirés et remplacés.
    const porteeTerre = this.moteur().vitesse * VOL_MAX_DEBUT
    const terre = position('Terre', t)
    const horsPortee = (c: Contrat) => c.tableau === 'Terre' && c.etapes.some((e) => {
      const p = position(e.lieu, t)
      return Math.hypot(p.x - terre.x, p.y - terre.y, p.z - terre.z) > porteeTerre
    })
    // Un remorquage dont « l'épave » n'en est pas une (une station, un satellite en service) : retiré.
    const aberrant = (c: Contrat) => c.genre === 'remorquer' && !EPAVES.some((e) => e.nom === c.etapes[0].lieu)
    this.proposes = this.proposes.filter((c) => !horsPortee(c) && !aberrant(c))
    for (const tableau of TABLEAUX) {
      const voulues = missionsParMaison(this.maison, tableau.nombre, tableau.lieu)
      let ctx: ContexteTableau | null = null
      for (const { maison } of MAISONS) {
        while (this.proposes.filter((c) => c.tableau === tableau.lieu && maisonDuContrat(c) === maison).length < voulues[maison]) {
          ctx ??= contexte(tableau, this.espace, t, tableau.systeme === 'Terre' ? porteeTerre : Infinity)
          const exclus = [...this.proposes, ...(this.enCours ? [this.enCours.contrat] : [])].flatMap((c) => c.etapes.map((e) => e.lieu))
          // La portée voulue : tirée parmi celles qui manquent au tableau (3 proches, 2 moyennes, 1 lointaine), au
          // prorata de ce qui manque ; puis les autres, au cas où la Maison n'a pas de lieu à cette portée.
          const ici = this.proposes.filter((c) => c.tableau === tableau.lieu)
          const manque = (p: Portee) => Math.max(0, PORTEES[p] - ici.filter((c) => c.portee === p).length)
          const toutes: Portee[] = ['proche', 'moyenne', 'lointaine']
          const total = toutes.reduce((s, p) => s + manque(p), 0)
          const h = hasard(this.graine)
          this.graine = h.graine
          let r = h.x * total
          const voulue = toutes.find((p) => (r -= manque(p)) < 0) ?? 'proche'
          const portees = [voulue, ...toutes.filter((p) => p !== voulue).sort((a, b) => manque(b) - manque(a))]
          const { contrat, graine } = tirerContrat(this.prochainId++, this.graine, ctx, maison, exclus, portees)
          this.graine = graine
          if (maison === this.maison) contrat.recompense = Math.round((contrat.recompense * BONUS_MAISON) / 10) * 10
          this.proposes.push(contrat)
        }
      }
    }
  }

  /**
   * Rejoindre une Maison (si l'affinité le permet), ou redevenir neutre (null). Jamais définitif. Les tableaux de
   * missions se réorganisent : les missions en trop d'une Maison sont retirées, les manquantes tirées.
   */
  rejoindre(maison: Maison | null, t: number): boolean {
    if (maison !== null && !maisonsOuvertes(this).includes(maison)) return false
    if (maison === this.maison) return false
    this.maison = maison
    for (const tableau of TABLEAUX) {
      const voulues = missionsParMaison(this.maison, tableau.nombre, tableau.lieu)
      for (const { maison: m } of MAISONS) {
        const ici = this.proposes.filter((c) => c.tableau === tableau.lieu && maisonDuContrat(c) === m)
        const enTrop = ici.slice(voulues[m])
        this.proposes = this.proposes.filter((c) => !enTrop.includes(c))
      }
    }
    this.proposer(t)
    if (maison) this.ecrire(PARRAINS[maison], MOTS_DU_PARRAIN[maison].bienvenue, t)
    return true
  }

  /** Un bot écrit au joueur, en privé (le message voyage à la vitesse de la lumière). */
  private ecrire(bot: string, texte: string, t: number): void {
    this.lettres.push({ id: this.lettres.length + 1, bot, texte: texte.replaceAll('{joueur}', this.pseudo), envoye: t })
  }

  /** Les Maisons qui proposent au joueur de les rejoindre maintenant (chacune une seule fois). */
  nouvellesInvitations(t: number): Maison[] {
    const nouvelles = maisonsOuvertes(this).filter((m) => m !== this.maison && !this.invitations.includes(m))
    this.invitations.push(...nouvelles)
    // Le parrain de la Maison écrit aussi, en privé.
    for (const m of nouvelles) this.ecrire(PARRAINS[m], MOTS_DU_PARRAIN[m].invitation, t)
    return nouvelles
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

  /** L'épave en remorque (harponnée, pas encore larguée) : laquelle, et la station où la larguer ; ou null. */
  remorque(): { epave: string; pour: string } | null {
    const ec = this.enCours
    if (!ec || ec.contrat.genre !== 'remorquer' || ec.etape === 0) return null
    return { epave: ec.contrat.etapes[0].lieu, pour: ec.contrat.etapes[1].lieu }
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
    oublierFutur(this.monolithes, t)
    // Les missiles d'abord : un impact passé (jeu fermé, téléphone endormi) ralentit le trajet à l'heure de l'impact,
    // ce qui peut repousser une arrivée.
    this.menaces(t, evenements)
    this.soleil(t, evenements)
    this.visiter(t)
    this.user(t, evenements)
    this.proposer(t)
    // Les quêtes : un lieu atteint, des marchandises à livrer.
    this.annoncesQuetes.push(...avancerQuetes(this, { genre: 'instant' }, t))
    this.avancerBourse(t)
    avancerRadar(this.radar, t)
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
      this.annoncesQuetes.push(...resister(this.zones, position(etape.lieu, fin), POINTS_RESISTANCE.contrat, fin))
      this.gagnerXp(ec.contrat.recompense * XP.partContrat)
      this.annoncesQuetes.push(...avancerQuetes(this, { genre: 'contrat', contrat: ec.contrat }, fin))
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
      // Le Moteur en panne : le trajet ralentit dès l'impact, même s'il a eu lieu jeu fermé.
      if (touches.includes('moteur')) this.suivreLeMoteur(m.impact)
      evenements.push({ genre: 'impact', modules: touches })
    }
  }

  /**
   * Le trajet en cours suit la vitesse du moteur (panne, réparation, nouveau moteur ; demande d'Adrien du 21/10/2026) :
   * recalculé à l'instant t, depuis là où était la capsule et à la vitesse qu'elle avait, jusqu'à la même destination.
   * C'est le trajet en cours qui continue : une Navigation en panne ne l'empêche pas. Renvoie le nouveau plan (déjà
   * pris), ou null si rien ne change (pas en route à t, ou déjà à cette vitesse).
   */
  suivreLeMoteur(t: number, vitesse = this.vitesse()): Plan | null {
    const plan = this.mission.plan
    if (!plan || this.mission.phase(t) !== 'trajet' || t < plan.depart || plan.vitesse === vitesse) return null
    const p = planifier(this.mission.etatHeliocentrique(t), plan.cible, t, vitesse, vitesseEnVol(plan, t).vitesse)
    if (!p.possible) return null
    this.mission.partir(p.plan)
    return p.plan
  }

  /** L'étape actuelle est-elle une chasse (qui se fait par un combat, en vue tactique) ? */
  etapeDeCombat(): boolean {
    return this.etapeActuelle()?.action === 'abattre'
  }

  /**
   * Un chasseur abattu : il disparaît (un renfort le remplace ailleurs). Si la capsule tournait autour de lui, elle reste
   * où elle est, en orbite autour de sa planète (bug vu par Adrien le 21/10/2026 : elle sautait avec le renfort).
   */
  vaincreChasseur(nom: string, t: number): void {
    this.annoncesQuetes.push(...resister(this.zones, position(nom, t), POINTS_RESISTANCE.chasseur, t))
    const zone = niveauDeZone(ZONES[astreDominant(position(nom, t), t)] ?? 1)
    this.gagnerXp(XP.chasseur[0] + (XP.chasseur[1] - XP.chasseur[0]) * zone)
    if (this.mission.centre(t) === nom) this.mission.decrocher(t, corps(nom)?.parent ?? 'Soleil')
    vaincre(this.espace, nom, t)
  }

  /** Le chasseur de l'étape de chasse est abattu (victoire au combat) : il disparaît, l'étape est faite. */
  abattre(t: number, vitesseEnchainement?: number, degatsRecus?: number): Evenement[] | null {
    if (!this.etapeDeCombat() || !this.peutAgir(t)) return null
    // Abattu sans perdre un point de coque : la récompense augmente de 10 % (comme les autres missions).
    if (degatsRecus === 0) this.enCours!.contrat.recompense = Math.round((this.enCours!.contrat.recompense * BONUS_SANS_DEGAT) / 10) * 10
    this.vaincreChasseur(this.etapeActuelle()!.lieu, t)
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return evenements
  }

  /** L'étape actuelle est-elle un amarrage (la livraison d'une cargaison, qui se fait par la manœuvre d'amarrage) ? */
  etapeDAmarrage(): boolean {
    return this.etapeActuelle()?.action === 'livrer'
  }

  /**
   * Amarrée : la cargaison est livrée, l'étape est faite. Amarrée du premier coup (sans rebond), la récompense augmente
   * de 10 % (BONUS_SANS_REBOND). null si ce n'est pas possible ici.
   */
  amarrer(rebonds: number, t: number, vitesseEnchainement?: number): Evenement[] | null {
    if (!this.etapeDAmarrage() || !this.peutAgir(t)) return null
    if (rebonds === 0) this.enCours!.contrat.recompense = Math.round((this.enCours!.contrat.recompense * BONUS_SANS_REBOND) / 10) * 10
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return evenements
  }

  /** L'étape actuelle est-elle un dépannage (qui se fait sur le boîtier technique de l'engin) ? */
  etapeDeDepannage(): boolean {
    return this.etapeActuelle()?.action === 'reparer'
  }

  /**
   * L'engin est réparé : l'étape est faite. Sans une fausse manœuvre, la récompense augmente de 10 %
   * (BONUS_SANS_ERREUR). null si ce n'est pas possible ici.
   */
  depanner(erreurs: number, t: number, vitesseEnchainement?: number): Evenement[] | null {
    if (!this.etapeDeDepannage() || !this.peutAgir(t)) return null
    if (erreurs === 0) this.enCours!.contrat.recompense = Math.round((this.enCours!.contrat.recompense * BONUS_SANS_ERREUR) / 10) * 10
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return evenements
  }

  /** L'étape actuelle est-elle un harponnage (l'épave qui tourne, à harponner puis stabiliser) ? */
  etapeDeHarponnage(): boolean {
    return this.etapeActuelle()?.action === 'harponner'
  }

  /**
   * L'épave est harponnée et stabilisée : elle est en remorque, l'étape est faite (la suivante : la larguer à la
   * station). Harponnée du premier coup, la récompense augmente de 10 %. null si ce n'est pas possible ici.
   */
  harponner(rates: number, t: number, vitesseEnchainement?: number): Evenement[] | null {
    if (!this.etapeDeHarponnage() || !this.peutAgir(t)) return null
    if (rates === 0) this.enCours!.contrat.recompense = Math.round((this.enCours!.contrat.recompense * BONUS_PREMIER_COUP) / 10) * 10
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return evenements
  }

  /** L'étape actuelle est-elle la fin d'une escorte (l'embuscade sur la dernière ligne droite) ? */
  etapeDEscorte(): boolean {
    return this.etapeActuelle()?.action === 'escorter'
  }

  /**
   * Le convoi est arrivé : l'étape est faite. Escorté sans un coup reçu, la récompense augmente de 10 %
   * (BONUS_SANS_COUP). null si ce n'est pas possible ici.
   */
  escorter(coups: number, t: number, vitesseEnchainement?: number): Evenement[] | null {
    if (!this.etapeDEscorte() || !this.peutAgir(t)) return null
    if (coups === 0) this.enCours!.contrat.recompense = Math.round((this.enCours!.contrat.recompense * BONUS_SANS_COUP) / 10) * 10
    const evenements: Evenement[] = []
    this.finirEtape(t, evenements, vitesseEnchainement)
    return evenements
  }

  /** Facteur de zone de la mission en cours (son système : 1 pour la Terre … 60 pour Pluton). */
  zoneEnCours(): number {
    return ZONES[this.enCours?.contrat.tableau ?? 'Terre'] ?? 1
  }

  /**
   * Le marché où la capsule peut commercer à l'instant t : celui du système où elle est en orbite (pas en plein vol),
   * ou null. On y achète et vend au cours en direct.
   */
  marcheIci(t: number): FicheMarche | null {
    // Le comptoir n'existe pas tant que la planète de son système n'est pas libérée (décision d'Adrien du 21/10/2026).
    const m = this.mission.phase(t) === 'orbite' ? marcheDeLaCapsule(t) : null
    return m && estLibre(this.zones, m.lieu) ? m : null
  }

  /**
   * Achète des tonnes d'une marchandise au marché d'ici (au prix d'achat, cours + 6 %), dans la limite de la place en
   * soute et des crédits (par dixièmes de tonne). Renvoie ce qui a été acheté : tonnes et crédits payés.
   */
  acheter(nom: string, tonnes: number, t: number, devis = false): { tonnes: number; prix: number } {
    const m = this.marcheIci(t), f = MARCHANDISES.find((x) => x.nom === nom)
    if (!m || !f) return { tonnes: 0, prix: 0 }
    const unitaire = achatVente(cours(m, f, t)).achat
    const place = CAPACITE_SOUTE - this.chargeSoute()
    const q = Math.floor(Math.min(tonnes, place, this.credits / unitaire) * 10 + 1e-9) / 10
    if (q <= 0) return { tonnes: 0, prix: 0 }
    const prix = Math.round(q * unitaire)
    // Le devis (avant confirmation) : sans rien changer.
    if (devis) return { tonnes: q, prix }
    this.credits -= prix
    this.soute[nom] = Math.round(((this.soute[nom] ?? 0) + q) * 100) / 100
    this.xpCommerce(prix, t)
    return { tonnes: q, prix }
  }

  /** Vend des tonnes d'une marchandise au marché d'ici (au prix de vente, cours − 6 %). Renvoie tonnes et crédits reçus. */
  vendre(nom: string, tonnes: number, t: number, devis = false): { tonnes: number; prix: number } {
    const m = this.marcheIci(t), f = MARCHANDISES.find((x) => x.nom === nom)
    const stock = this.soute[nom] ?? 0
    if (!m || !f || stock <= 0) return { tonnes: 0, prix: 0 }
    const q = Math.round(Math.min(tonnes, stock) * 100) / 100
    const prix = Math.round(q * achatVente(cours(m, f, t)).vente)
    if (devis) return { tonnes: q, prix }
    this.credits += prix
    const reste = Math.round((stock - q) * 100) / 100
    if (reste > 0) this.soute[nom] = reste
    else delete this.soute[nom]
    this.xpCommerce(prix, t)
    return { tonnes: q, prix }
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
  /** La capsule en orbite dans une zone pas encore visitée : elle l'est désormais (décision d'Adrien du 21/10/2026). */
  private visiter(t: number): void {
    const lieu = this.lieuEnOrbite(t)
    const z = lieu ? zoneDuLieu(lieu) : null
    if (z && !this.visites.includes(z)) this.visites.push(z)
  }

  /** Une Voix perdue enregistrée : un peu de résistance dans la zone la plus proche. */
  voixEnregistree(t: number): void {
    this.annoncesQuetes.push(...resister(this.zones, this.mission.etat(t).position, POINTS_RESISTANCE.voix, t))
    this.gagnerXp(XP.voix)
  }

  /**
   * L'assaut final gagné : la zone est libérée tout de suite (son comptoir ouvre si c'est une planète), et l'étape
   * ASSAUT de sa quête est faite.
   */
  gagnerAssaut(nom: string, t: number): void {
    if (!this.zones.liberees.includes(nom)) {
      this.libererZone(nom)
      this.gagnerXp(ZONES_A_LIBERER.find((z) => z.nom === nom)?.planete ? XP.amiralPlanete : XP.amiralLune)
      this.liberationsAAnnoncer.push(nom)
      this.feux.push({ zone: nom, t })
    }
    this.annoncesQuetes.push(...avancerQuetes(this, { genre: 'assaut', zone: nom }, t))
  }

  /** Les feux d'artifice en cours : chaque zone libérée il y a moins de 2 minutes, et depuis combien de temps (ms). */
  feuxEnCours(t: number): { zone: string; age: number }[] {
    this.feux = this.feux.filter((f) => t - f.t < DUREE_FEUX)
    return this.feux.filter((f) => t >= f.t).map((f) => ({ zone: f.zone, age: t - f.t }))
  }

  /** Une zone libérée (l'assaut final gagné) ; les chasseurs de son système, si c'est une planète, ne reviennent plus. */
  libererZone(nom: string): void {
    liberer(this.zones, nom)
    this.synchroniserZones()
  }

  /** Après une sauvegarde lue : l'espace connaît les zones libérées. */
  synchroniserZones(): void {
    this.espace.liberes = this.zones.liberees
  }

  /** Arrivée au Soleil : le rêve, et la capsule revient là d'où elle était partie, sans panne ni rien de perdu. */
  private soleil(t: number, evenements: Evenement[]): void {
    const p = this.mission.plan
    if (!p || p.cible !== 'Soleil' || t < p.arrivee) return
    this.usureJusqua = Math.max(this.usureJusqua, p.arrivee)
    this.mission.revenir()
    const premier = this.icare === null
    if (premier) this.icare = p.arrivee
    evenements.push({ genre: 'reve-soleil', premier })
  }

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
