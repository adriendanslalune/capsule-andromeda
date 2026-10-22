// Capsule Andromeda : la carte et la navigation (en 2D seulement : plus de vue 3D, décision d'Adrien du 17/10/2026).
//  - La CARTE : vue du dessus, vraies distances entre les planètes, loupe autour de chaque astre (carte/loupe.ts) ;
//    zoom libre vers un système. Toucher un astre affiche sa fiche ; Y ALLER calcule le trajet et propose le DÉPART.
//  - Le CADRAN : la liste des astres, pour choisir une destination sans la chercher sur la carte.
//  - La NAVIGATION : un pointillé vers la position actuelle de la destination, et le trajet en ligne droite jusqu'au
//    point de rendez-vous (choix d'Adrien du 17/10/2026) ; le bouton DÉPART lance le voyage.

import './style.css'

/** Version construite (le commit), remplacée par Vite. */
declare const __VERSION__: string
import { Cadran } from './carte/cadran'
import { afficherBandeau, basculerVoyant, type Voyant } from './commun/bandeau'
import { Cockpit } from './commun/cockpit'
import { surveillerMisesAJour } from './commun/mise-a-jour'
import { ACTIONS_FINIES, GENRES_COURTS, NOMS_ACTIONS, VERBES, texteSecondes, titreContrat } from './commun/textes-missions'
import { MODULES, type NomModule } from './donnees/modules'
import { ouvrirFenetreMoteur } from './commun/fenetre-moteur'
import { VoletCapsule, htmlArmement, htmlSoute } from './commun/volet-capsule'
import { SIMULATEUR, VueCombat } from './commun/vue-combat'
import { ARMEMENT, type LigneArmement } from './donnees/combat'
import { VueReve } from './commun/vue-reve'
import { VueTri } from './commun/vue-tri'
import { VueClasseur } from './commun/vue-classeur'
import { SONDE, VueDisparus } from './commun/vue-disparus'
import { disparuVisible, ouChercher } from './moteur/disparus'
import { DISPARUS, disparu } from './donnees/disparus'
import { VueRadio } from './commun/vue-radio'
import { VueCarnet } from './commun/vue-carnet'
import { ecouter as ecouterRadio, emet, texteVoix, VOIX } from './moteur/radio'
import { BANDE_OC, VOIX_PAR_SYSTEME } from './donnees/radio'
import { VueAmarrage } from './commun/vue-amarrage'
import { VueDepannage } from './commun/vue-depannage'
import { VueRemorquage } from './commun/vue-remorquage'
import { VueEscorte } from './commun/vue-escorte'
import { VueLargage } from './commun/vue-largage'
import { VueConvoi } from './commun/vue-convoi'
import { VueInvitation } from './commun/vue-invitation'
import { VueDialogue, medaillon } from './commun/vue-dialogue'
import { htmlJournal } from './commun/volet-journal'
import { htmlBoutique } from './commun/volet-boutique'
import { confirmer, feliciter } from './commun/confirmation'
import { htmlCollections } from './commun/volet-collections'
import { PNJS } from './donnees/quetes'
import { accepter as accepterQuete, assautIci, rattraperSuivi, cheminVersAssaut, liberation, objectif, parler, pnjIci, quete, signePnj } from './moteur/quetes'
import { htmlProfil } from './commun/volet-profil'
import { VoletMessages } from './commun/volet-messages'
import { arrivesDepuis, nonLus } from './moteur/messages'
import { alienLa, intercepterMissile, surLaCarte } from './moteur/espace'
import { angleRadar, basculerRadar, echoRadar, EFFACEMENT_RADAR, jaugeRadar, PORTEE_RADAR } from './moteur/radar'
import { echoEnRoute, echosNonVus, echosRevenus, localise, marquerEchosVus, monolitheNomme, monolithesEcoutes, placesPossibles, statut } from './moteur/monolithes'
import { NOMBRE_MONOLITHES } from './donnees/monolithes'
import { etatBoutonPing } from './commun/radio'
import { tableauDeLaCapsule } from './moteur/tableaux'
import { pseudoValide } from './moteur/profil'
import { objetsTries } from './moteur/tri'
import { VoletComptoir } from './commun/volet-comptoir'
import { texteDelai, VoletBourse } from './commun/volet-bourse'
import { compagnie } from './moteur/bourse'
import { MARCHES } from './donnees/marche'
import { COMPAGNIES } from './donnees/bourse'
import { BOTS } from './donnees/messages'
import { lieuDuBot } from './moteur/messages'
import { titreMaison, type Maison } from './donnees/maisons'
import { ZONES } from './donnees/tableaux'
import { estLibre, jauge, zone } from './moteur/zones'
import { niveauDe, niveauGagne, palierDe } from './moteur/niveau'
import { dessinerVaisseau, rayonVaisseau } from './carte/vaisseaux'
import { oublierSoleilAnime, soleilAnime } from './carte/globes'
import { htmlManuel } from './commun/manuel'
import { Panneau, type EtatPanneau } from './commun/panneau'
import { calibreAttendu, ordreCouplage, tourAccumulateurs, tourFusibles } from './moteur/energie'
import { BORNES } from './donnees/manuel-energie'
import { COMBINAISONS, SYMBOLES_SOUPAPE } from './donnees/manuel-moteur'
import { CRANS_PAR_PRESSION, FISSURES, MESSAGES_SAS, RIVETS } from './donnees/manuel-coque'
import { cransVannes, interrupteursSas, tourBreche, tourSas, tourVannes } from './moteur/coque'
import { ANNEAUX, ASTRES, AZIMUTS, CODES_CALCUL, CONSTELLATIONS, HAUTEURS } from './donnees/manuel-navigation'
import {
  angleAnneau, cadransConstellation, interrupteursCalcul, ordreGyro, tourCalculateur, tourConstellation,
} from './moteur/guidage'
import {
  injecteursACouper, positionsLeviers, pressionSoupape, symboleAuRepos, tourInjecteurs, tourLeviers, tourSoupape, zonePurge,
} from './moteur/propulsion'
import { gesteDuBouton, htmlCommandes } from './commun/commandes'
import { APPAREILS_PRETS, BLOCS, blocDe, repere, TITRES_APPAREILS, type NomAppareil } from './donnees/blocs'
import { FREQUENCES, STATIONS, texteFrequence } from './donnees/manuel-communications'
import {
  angleAttendu, frequenceReglee, ordreChiffreur, sequenceMorse, tourAntenne, tourChiffreur, tourTelegraphe,
} from './moteur/communications'
import { solution, tourEnergieVu, type EtatReparation, type Resultat } from './moteur/reparation'
import { VoletMissions } from './commun/volet-missions'
import { texteDateComplete, texteDuree, texteRestant } from './commun/textes'
import { htmlFrise } from './commun/frise'
import { INSTRUMENTS } from './commun/instruments'
import { feuilleDeRoute } from './moteur/feuille-de-route'
import { annonces } from './moteur/annonces'
import { onomatopee, tampon } from './commun/onomatopee'
import { bavardsIci, phraseDePassage } from './moteur/passages'
import { avec, picto, SYMBOLE_GENRE } from './commun/symboles'
import { CAPSULE, Carte2D } from './carte/carte'
import { CENTRES, couperTrace, projeter, projeterCorps, projeterTrajet, type Point2 } from './carte/loupe'
import { Gestes } from './commun/gestes'
import { dessinerReperes, type Boite } from './commun/reperes'
import { periode, suivreMission } from './moteur/capsule'
import { astreDominant, corps, enfants, position } from './moteur/corps'
import { couleurAstre } from './carte/couleurs'
import { Jeu } from './moteur/jeu'
import { restaurer, sauvegarder } from './moteur/sauvegarde'
import type { Contrat } from './moteur/contrats'
import { avancement, kmRestants, planifier, vitesseDePointe, vitesseEnVol, type Plan, type Planification } from './moteur/mission'
import { distanceDepuisCapsule, texteDistance } from './moteur/navigation'
import { lignesDuBandeau } from './moteur/bandeau'
import { chargerPoussiere } from './moteur/poussiere'

const toilePlan = document.querySelector<HTMLCanvasElement>('#plan')!
const ctxPlan = toilePlan.getContext('2d')!
const infos = document.querySelector<HTMLDivElement>('#infos')!
const titre = document.querySelector<HTMLDivElement>('#titre')!

/**
 * L'horloge : la vraie heure UTC, précise au-dessous de la milliseconde (le moteur la reçoit en paramètre).
 * Réglage d'essai : on peut accélérer le temps (le temps simulé prend alors de l'avance sur l'heure réelle).
 */
let tempsSimule = Date.now()
let dernierPerf = performance.now()
let acceleration = 1
const horloge = () => tempsSimule
function avancerHorloge(maintenant: number): void {
  tempsSimule += (maintenant - dernierPerf) * acceleration
  dernierPerf = maintenant
}

// La poussière de satellites (environ 15 000 points autour de la Terre) : chargée à part, sans retarder l'ouverture.
// Un satellite sur huit (environ 1 900) : les 15 000 faisaient ramer le téléphone en zoomant autour de la Terre
// (Adrien, 21/10/2026).
import('./donnees/poussiere').then((d) => { chargerPoussiere(d.POUSSIERE, d.REFERENCE_POUSSIERE, 8); carteSale = true })
  .catch(() => { /* pas de poussière : la carte s'en passe */ })

// L'état du jeu (crédits, moteur) et la mission de la capsule (orbite, trajet, arrivée) : le moteur les suit.
// Sauvegardé sur le téléphone (mémoire du navigateur) : on reprend la partie là où elle en était.
const CLE_SAUVEGARDE = 'andromeda-partie-v1'
function chargerPartie(): Jeu | null {
  try { return restaurer(JSON.parse(localStorage.getItem(CLE_SAUVEGARDE) ?? 'null')) } catch { return null }
}
/** Vrai après « Recommencer à zéro » : plus rien n'est enregistré avant le rechargement de la page. */
let partieEffacee = false
function enregistrerPartie(): void {
  if (partieEffacee) return
  try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(sauvegarder(jeu, horloge()))) } catch { /* navigation privée : pas de sauvegarde */ }
}
/** Nouvelle partie : son propre hasard (missions, pannes) et son numéro de série. */
function nouvellePartie(): Jeu {
  const j = new Jeu()
  j.nouvellePartie(Math.floor(Math.random() * 2 ** 31))
  return j
}
const partieChargee = chargerPartie()
const jeu = partieChargee ?? nouvellePartie()
rattraperSuivi(jeu)
const mission = jeu.mission
suivreMission(mission)

const carte = new Carte2D()
const plaque = () => {
  const n = niveauDe(jeu.xp).niveau
  carte.plaqueCapsule = `${jeu.numeroSerie} · ${jeu.pseudo} · niv. ${n}`
  carte.formeCapsule = palierDe(n)
}
/** Le niveau du capitaine et sa jauge, pour le bandeau. */
function xpBandeau(): { niveau: number; xp: number } {
  const n = niveauDe(jeu.xp)
  return { niveau: n.niveau, xp: n.besoin ? n.dans / n.besoin : 1 }
}
/** Les gains d'XP : un « +35 XP » qui flotte sous le bandeau, et la plaque de la capsule à jour. */
const elXp = document.createElement('div')
elXp.id = 'gain-xp'
document.body.append(elXp)
function montrerGainsXp(): void {
  if (!jeu.gainsXp.length) return
  const total = jeu.gainsXp.reduce((a, b) => a + b, 0)
  jeu.gainsXp = []
  const s = document.createElement('span')
  s.textContent = `+${total.toLocaleString('fr-FR')} XP`
  elXp.append(s)
  setTimeout(() => s.remove(), 1600)
  plaque()
}
plaque()
// Ce que montre la carte : les astres, les engins, les stations et les capsules des autres, tout le temps (demande
// d'Adrien du 21/10/2026, qui remplace « tout au radar » du 20/10) ; les monolithes localisés ou ramassés ; les
// chasseurs d'Andromède, furtifs, seulement au passage du radar (ou s'ils nous tirent dessus, ou s'ils sont visés) ;
// les épaves seulement en mission (décision du 18/10).
let ramasses = new Set<number>()
carte.visibilite = (nom, t, angle) => {
  const m = monolitheNomme(nom)
  if (m) {
    if (ramasses.size !== jeu.monolithes.trouves.length) ramasses = new Set(jeu.monolithes.trouves)
    return ramasses.has(m.numero) || localise(jeu.monolithes, m.numero, t) ? 1 : 0
  }
  const type = corps(nom)?.type
  // Les Disparus : cachés jusqu'à ce que le radar capte leur écho ; la zone de recherche de celui qu'on cherche.
  const d = disparu(nom)
  if (d) return disparuVisible(jeu.disparus, d) || nom === selection ? 1 : 0
  if (type === 'zone') { const s = jeu.disparus.suivi !== null ? DISPARUS.find((x) => x.numero === jeu.disparus.suivi) : undefined; return s && nom === ouChercher(s).lieu ? 1 : 0 }
  // L'épave en remorque se dessine au bout du câble, derrière la capsule (carte.sillage).
  if (carte.sillage === 'epave' && nom === jeu.remorque()?.epave) return 0
  // Tout le reste se voit tout le temps (demande d'Adrien du 21/10/2026 : le radar enlevait la vie) : engins, stations,
  // capsules des autres ; seuls les chasseurs d'Andromède sont furtifs (le radar les révèle), et les épaves ne se
  // montrent qu'en mission.
  if (type !== 'alien' && type !== 'epave') return 1
  if (surLaCarte(jeu.espace, nom, t, cibles())) return 1
  if (type === 'epave' || !alienLa(jeu.espace, nom, t)) return 0
  if (distanceDepuisCapsule(nom, t) > PORTEE_RADAR) return 0
  return echoRadar(jeu.radar, angle, t)
}
carte.etatZone = (nom) => (zone(nom) ? { visitee: jeu.visites.includes(nom), occupee: !jeu.zones.liberees.includes(nom) } : null)
carte.toujoursVisible = (nom) => nom === selection || lieuxConnus().includes(nom)
carte.radar = (t) => (jeu.radar.actif ? { angle: angleRadar(jeu.radar, t), portee: PORTEE_RADAR, actif: true } : null)
/** Ce qui reste sur la carte et dans la liste Navigation hors radar : ce que visent une mission ou la quête suivie, la
 *  destination choisie, et le lieu d'un PNJ qui a quelque chose à dire (« ! » ou « ? »). */
let lieuxConnusMemo: { quand: number; lieux: string[] } = { quand: -1, lieux: [] }
function lieuxConnus(): string[] {
  // Calculé au plus une fois par image (la carte le demande pour chaque objet).
  const maintenant = performance.now()
  if (maintenant - lieuxConnusMemo.quand < 16) return lieuxConnusMemo.lieux
  const l = cibles()
  if (jeu.queteSuivie) { const o = objectif(jeu, quete(jeu.queteSuivie))?.lieu; if (o) l.push(o) }
  for (const p of PNJS) if (signePnj(jeu, p.id)) l.push(p.lieu)
  lieuxConnusMemo = { quand: maintenant, lieux: l }
  return l
}
/** Les monolithes localisés (pas encore ramassés), les plus proches d'abord. */
function monolithesLocalises(t: number): string[] {
  return monolithesEcoutes(jeu.monolithes, t).filter((n) => localise(jeu.monolithes, n, t)).map((n) => `Monolithe n° ${n}`)
    .sort((a, b) => distanceDepuisCapsule(a, t) - distanceDepuisCapsule(b, t))
}
/** Le lieu (tableau de missions) où est la capsule. */
function lieuIci(t: number): string {
  return tableauDeLaCapsule(mission.phase(t) === 'orbite' ? mission.centre(t) : null, t).lieu
}
/** Les épaves et chasseurs que vise une mission : celle en cours, celle qu'on regarde (VOIR), ou celui qu'on a choisi. */
function cibles(): string[] {
  return [...(jeu.enCours?.contrat.etapes ?? []), ...(apercu?.etapes ?? [])].map((e) => e.lieu).concat(selection ? [selection] : [])
}
let largeur = 390, hauteur = 844
let selection: string | null = null
/** Vrai si la caméra suit ce qui est choisi (faux une fois qu'on a fait glisser la carte). */
let suivre = true
/** Glissement d'un doigt depuis le début du geste (px) : un petit glissement ne lâche pas ce qu'on suit. */
let glisseCumul = 0
/** Encre et fond de la carte : style Moebius, fond blanc cassé le jour, bleu nuit en mode nuit. */
/** Encre et fond de la carte (le même que --carte dans style.css) : kraft le jour, bleu nuit en sombre. */
const THEMES = { jour: { encre: '#1f1b18', halo: '#e7dcc4' }, nuit: { encre: '#efe6d2', halo: '#141826' } }
let th = THEMES.jour

function redimensionner(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  largeur = window.innerWidth
  hauteur = window.innerHeight
  toilePlan.width = Math.round(largeur * dpr)
  toilePlan.height = Math.round(hauteur * dpr)
  ctxPlan.setTransform(dpr, 0, 0, dpr, 0, 0)
  carte.largeur = largeur
  carte.hauteur = hauteur
  carte.pixelRatio = dpr
}
window.addEventListener('resize', redimensionner)
redimensionner()

// --- Réglages, chacun désactivable (mémorisés dans le navigateur, si possible).
// (nouvelle clé à chaque changement des réglages par défaut : les anciens réglages mémorisés sont oubliés)
const CLE_REGLAGES = 'andromeda-reperes-v8'
const reglages = {
  orbites: true, noms: true,
  /** La grille de la carte et son échelle (demande d'Adrien du 22/10/2026). */
  grille: true,
  /** Les cercles des échos des PING (monolithes) sur la carte. */
  cercles: true,
  /** Mode nuit : seulement par le bouton (choix d'Adrien du 17/10/2026), jour par défaut. */
  nuit: false,
  crochet: true, etiquette: true, fleche: true,
  /** Essai : forcer la vitesse de croisière (km/s) au lieu de celle du moteur de la capsule. */
  forcerVitesse: false,
  vitesse: 120,
}
try {
  const memo = JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? '{}')
  for (const cle of Object.keys(reglages) as (keyof typeof reglages)[]) if (cle in memo) Object.assign(reglages, { [cle]: memo[cle] })
} catch { /* navigation privée : on garde les réglages de départ */ }
const memoriser = () => { try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)) } catch { /* rien */ } }
const panneau = document.querySelector<HTMLDivElement>('#reglages')!
for (const caseACocher of panneau.querySelectorAll<HTMLInputElement>('input[data-reglage]')) {
  const cle = caseACocher.dataset.reglage as Exclude<keyof typeof reglages, 'vitesse'>
  caseACocher.checked = reglages[cle]
  caseACocher.addEventListener('change', () => {
    reglages[cle] = caseACocher.checked
    memoriser()
    if (cle === 'forcerVitesse') voletMissions.oublierDurees()
    if (cle === 'nuit') appliquerTheme()
  })
}

/** Jour ou nuit : couleurs de la page (style.css), de la carte et de la barre du téléphone. */
function appliquerTheme(): void {
  th = reglages.nuit ? THEMES.nuit : THEMES.jour
  carte.nuit = reglages.nuit
  document.body.classList.toggle('nuit', reglages.nuit)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', th.halo)
}
appliquerTheme()

// --- Sélection (fiche) et destination proposée.
/** Le joueur a appuyé sur Y ALLER pour l'astre sélectionné : on calcule le trajet et on propose le DÉPART. */
let proposee = false
/**
 * Aperçu d'une mission proposée, avant de l'accepter (demande d'Adrien du 17/10/2026) : ses trajets dessinés sur la
 * carte, et la fiche avec ACCEPTER. Toucher la carte (ou choisir un astre) ferme l'aperçu.
 */
let apercu: Contrat | null = null
let apercuPlans: Plan[] | null = null
let apercuAJour = 0
/**
 * Choisit un astre, un engin ou la capsule (null : plus rien de choisi). Demandes d'Adrien du 17/10/2026 : ce qu'on
 * choisit vient au centre de l'écran, en glissant, et y reste, même pendant le zoom ; on peut quand même faire glisser
 * la carte (la caméra le lâche alors, le choix reste) ; le toucher de nouveau recentre dessus ; toucher un endroit vide
 * de la carte retire le choix. Depuis le cadran, une lune ou un satellite fait cadrer le système de son astre.
 */
function choisir(nom: string | null, cadrer = false, echelle?: number): void {
  const avant = selection
  if (nom !== selection) proposee = false
  apercu = null
  selection = nom
  const c = nom ? corps(nom) : undefined
  if (nom && (nom !== avant || cadrer || echelle !== undefined || !suivre)) {
    suivre = true
    // Cadrer (Y ALLER, VOIR…) : la destination et la capsule ensemble à l'écran (demande d'Adrien du 22/10/2026).
    const k = echelle ?? (cadrer && c ? carte.echelleTrajet(nom, horloge()) : carte.kmParPx)
    carte.voler(k, performance.now(), positionSuivie(horloge()))
  }
}


/** Place, sur la carte (km de carte), de ce qui est choisi (la caméra le suit). */
function positionSuivie(t: number): Point2 {
  if (selection === CAPSULE) {
    const p = capsuleSurCarte ?? carte.positionCapsule(t)
    return { x: p.x + decalageCapsule.x, y: p.y + decalageCapsule.y }
  }
  return selection && corps(selection) ? projeterCorps(selection, t) : carte.centre
}
/** Où est dessinée la capsule en route (sur son trajet), mis à jour à chaque image. */
let capsuleSurCarte: Point2 | null = null
/**
 * Vue de loin, la capsule est dessinée à côté de son astre (pour ne pas le cacher), d'autant plus loin qu'on dézoome :
 * ce décalage (km de carte), mesuré à chaque image, est ajouté pour que la caméra reste centrée sur elle.
 */
let decalageCapsule: Point2 = { x: 0, y: 0 }

/**
 * Cadre la carte sur la capsule (le système de l'astre où elle se trouve, la capsule au centre) et la suit : en vol
 * fluide depuis le bouton « Capsule », d'un coup à l'ouverture du jeu (demandes d'Adrien du 17/10/2026).
 */
/**
 * L'astre au-dessus duquel est la capsule, pour le gros plan (demande d'Adrien du 22/10/2026 : près de la Lune, on doit
 * en voir les cratères) : celui autour duquel elle tourne (pour un engin, son astre), sinon, en vol, le plus proche de
 * son système (la planète ou une de ses grandes lunes).
 */
function astreLePlusProche(systeme: string, t: number): string {
  if (systeme === 'Soleil') return systeme
  if (mission.phase(t) === 'orbite') {
    let c = corps(mission.centre(t))
    while (c && c.type !== 'planete' && c.type !== 'lune' && c.type !== 'naine' && c.type !== 'etoile' && c.parent) c = corps(c.parent)
    if (c) return c.nom
  }
  const p = mission.etat(t).position
  const hauteur = (nom: string) => { const q = position(nom, t); return Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) - (corps(nom)?.rayon ?? 0) }
  return [systeme, ...enfants(systeme).filter((c) => c.type === 'lune' && c.rayon >= 100).map((c) => c.nom)].reduce((a, b) => (hauteur(b) < hauteur(a) ? b : a))
}
// Le bas de la console (sa hauteur change avec les alertes) : le volet ouvert commence juste dessous.
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--bas-console', `${Math.round(document.querySelector('#console')!.getBoundingClientRect().bottom)}px`)
}).observe(document.querySelector('#console')!)

function allerALaCapsule(animer = true): void {
  const t = horloge()
  const ou = astreDominant(mission.etat(t).position, t)
  // Le bouton : un gros plan sur la capsule (demandes d'Adrien du 19 et du 20/10/2026) ; à l'ouverture du jeu, tout le
  // système de la planète (comme avant).
  const k = !animer ? (ou === 'Soleil' ? carte.echelleGenerale() : carte.echelleSysteme(ou))
    : carte.echelleGrosPlan(astreLePlusProche(ou, t), t)
  if (animer) choisir(CAPSULE, false, k)
  else {
    // D'un coup : on place la caméra avant de choisir la capsule (le vol lancé par le choix est alors immobile).
    selection = CAPSULE
    carte.kmParPx = k
    carte.centre = positionSuivie(t)
    choisir(CAPSULE)
  }
}
allerALaCapsule(false)
// Les commandes de la carte (demande d'Adrien du 18/10/2026) : système intérieur (jusqu'à Mars), extérieur (jusqu'à
// Pluton), capsule, et ce que montre la carte (le zoom se fait aux doigts : plus de + et −, demande d'Adrien du 21/10/2026).
const choixAffichage = document.querySelector<HTMLDivElement>('#choix-affichage')!
const boutonAffichage = document.querySelector<HTMLButtonElement>('[data-vue="affichage"]')!
function vueGenerale(kmParPx: number): void {
  choisir(null)
  carte.voler(kmParPx, performance.now(), { x: 0, y: 0 }, true)
}
document.querySelector('#commandes-carte .vue')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-vue], [data-afficher]')
  if (!b) return
  const vue = b.dataset.vue
  if (vue === 'systemes') ouvrirSystemes(choixSysteme.hidden !== false)
  else if (vue === 'capsule') allerALaCapsule()
  else if (vue === 'affichage') {
    ouvrirSystemes(false)
    choixAffichage.hidden = !choixAffichage.hidden
    boutonAffichage.setAttribute('aria-expanded', String(!choixAffichage.hidden))
  } else if (b.dataset.afficher) {
    // Les calques, et le mode nuit en accès rapide (demande d'Adrien du 20/10/2026).
    const cle = b.dataset.afficher as 'orbites' | 'noms' | 'grille' | 'cercles' | 'nuit'
    reglages[cle] = !reglages[cle]
    memoriser()
    if (cle === 'nuit') appliquerTheme()
    afficherChoixAffichage()
  }
})
// Les systèmes (décision d'Adrien du 21/10/2026, qui remplace les boutons « système intérieur » et « extérieur ») :
// une bande à côté du bouton, « Tout » (le système solaire), le Soleil et les 9 systèmes ; celui de la capsule est marqué.
const choixSysteme = document.querySelector<HTMLDivElement>('#choix-systeme')!
const boutonSystemes = document.querySelector<HTMLButtonElement>('[data-vue="systemes"]')!
function ouvrirSystemes(ouvrir: boolean): void {
  if (ouvrir) {
    const t = horloge(), ici = astreDominant(mission.etat(t).position, t)
    choixSysteme.innerHTML = '<button type="button" data-systeme="tout"><i class="tout"></i>Tout</button>'
      + ['Soleil', ...CENTRES].map((nom) => `<button type="button" data-systeme="${nom}"${nom === ici ? ' class="ici"' : ''}>`
      + `<i style="background:${couleurAstre(corps(nom)!)}"></i>${nom}${nom === ici ? '<small>ici</small>' : ''}</button>`).join('')
    choixAffichage.hidden = true
    boutonAffichage.setAttribute('aria-expanded', 'false')
  }
  choixSysteme.hidden = !ouvrir
  boutonSystemes.setAttribute('aria-expanded', String(ouvrir))
}
choixSysteme.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-systeme]')
  if (!b) return
  ouvrirSystemes(false)
  const nom = b.dataset.systeme!
  // Tout : le système solaire ; le Soleil ou une planète : un gros plan sur lui (dézoomer montre son système), choisi
  // (sa fiche, Y ALLER).
  if (nom === 'tout') vueGenerale(carte.echelleExterieure())
  else choisir(nom, false, carte.echellePlanete(nom))
})
// Toucher n'importe où ailleurs referme les calques et la bande des systèmes (demande d'Adrien du 22/10/2026).
document.addEventListener('pointerdown', (e) => {
  const cible = e.target as HTMLElement
  if (!choixAffichage.hidden && !choixAffichage.contains(cible) && !boutonAffichage.contains(cible)) {
    choixAffichage.hidden = true
    boutonAffichage.setAttribute('aria-expanded', 'false')
  }
  if (!choixSysteme.hidden && !choixSysteme.contains(cible) && !boutonSystemes.contains(cible)) ouvrirSystemes(false)
}, true)
function afficherChoixAffichage(): void {
  for (const b of choixAffichage.querySelectorAll<HTMLElement>('[data-afficher]')) {
    // Le thème (demande d'Adrien du 21/10/2026) : le bouton propose l'autre, SOMBRE en clair (par défaut), CLAIR en sombre.
    if (b.dataset.afficher === 'nuit') { b.querySelector('span')!.textContent = reglages.nuit ? 'Clair' : 'Sombre'; b.classList.toggle('vers-clair', reglages.nuit); continue }
    b.classList.toggle('actif', reglages[b.dataset.afficher as 'orbites' | 'noms' | 'cercles'])
  }
}
afficherChoixAffichage()

// Le cockpit : barre d'onglets et volets. Choisir un astre dans le volet Navigation referme le volet.
const cockpit = new Cockpit((page) => {
  if (page === 'navigation') cadran.afficher(selection)
  if (page === 'missions') { voletMissions.revenirIci(); afficherOngletJournal() }
  if (page === 'capsule') voletCapsule.afficher(jeu)
  if (page === 'marche') afficherMarche(horloge())
  if (page === 'profil') pageProfil.innerHTML = htmlProfil(jeu)
  if (page === 'messages') voletMessages.afficher(Date.now(), true)
  if (page === 'collections') document.querySelector<HTMLElement>('#collections')!.innerHTML = htmlCollections(jeu)
  if (page === 'boutique') document.querySelector<HTMLElement>('#boutique')!.innerHTML = htmlBoutique()
})
const cadran = new Cadran(document.querySelector<HTMLDivElement>('#cadran')!, (nom) => { choisir(nom, true); cockpit.fermer() }, horloge,
  (t) => ({ aliens: [...new Set(cibles())].filter((n) => corps(n)?.type === 'alien' && surLaCarte(jeu.espace, n, t, cibles())), epaves: [...new Set(cibles())].filter((n) => corps(n)?.type === 'epave'), monolithes: monolithesLocalises(t),
    engins: [...new Set(lieuxConnus())].slice().filter((n) => corps(n)?.type === 'satellite' || corps(n)?.type === 'sonde') }))

// Le PING des monolithes, sur la carte sous les Messages : un PING, l'écho revient à la vitesse de la lumière (on ne
// sait pas quand).
// Les dessins des instruments (partagés avec les Collections).
for (const nom of ['radar', 'ping', 'radio'] as const) document.querySelector(`#bouton-${nom}`)!.insertAdjacentHTML('afterbegin', INSTRUMENTS[nom])
const boutonPing = document.querySelector<HTMLButtonElement>('#bouton-ping')!
const chargePing = boutonPing.querySelector<HTMLElement>('.charge')!
let etatPingAffiche = ''
function afficherPing(t: number): void {
  const p = etatBoutonPing(jeu, t)
  const largeurCharge = p.etat === 'recharge' ? `${Math.round(p.charge * 44)}px` : '0px'
  const cle = `${p.etat}|${largeurCharge}`
  if (cle === etatPingAffiche) return
  etatPingAffiche = cle
  boutonPing.className = p.etat
  chargePing.style.width = largeurCharge
}
boutonPing.addEventListener('click', () => {
  const t = horloge()
  const p = etatBoutonPing(jeu, t)
  if (p.etat !== 'pret') { annoncer(p.texte); return }
  if (!jeu.pinger(t)) return
  enregistrerPartie()
  afficherPing(t)
  annoncer('PING envoyé. On attend l\'écho…')
  navigator.vibrate?.(60)
})
// Le RADAR, sous le PING : on l'allume et l'éteint ; sa jauge monte pendant qu'il tourne (pleine en 30 s : il
// s'arrête) et redescend quand il est éteint ; tant qu'elle n'est pas pleine, on peut le rallumer.
const boutonRadar = document.querySelector<HTMLButtonElement>('#bouton-radar')!
const chargeRadar = boutonRadar.querySelector<HTMLElement>('.charge')!
let etatRadarAffiche = ''
function afficherRadar(t: number): void {
  const j = jaugeRadar(jeu.radar, t)
  const etat = jeu.radar.actif ? 'actif' : j >= 1 ? 'plein' : 'pret'
  const cle = `${etat}|${Math.round(j * 44)}`
  if (cle === etatRadarAffiche) return
  etatRadarAffiche = cle
  boutonRadar.className = etat
  chargeRadar.style.width = `${Math.round(j * 44)}px`
}
boutonRadar.addEventListener('click', () => {
  const t = horloge()
  const avant = jeu.radar.actif
  if (basculerRadar(jeu.radar, t)) navigator.vibrate?.(30)
  else if (!avant) annoncer('Radar en surchauffe : attends que la jauge redescende un peu')
  afficherRadar(t)
  carteSale = true
})
// La RADIO, sous le RADAR (décisions d'Adrien du 20/10/2026) : le poste TSF, bande OC, les Voix perdues.
/** Le système où est la capsule (là où elle peut capter ses voix), ou null en plein espace. */
function systemeDeLaCapsule(t: number): string | null {
  const s = astreDominant(mission.etat(t).position, t)
  return s in VOIX_PAR_SYSTEME ? s : null
}
const vueRadio = new VueRadio(document.querySelector<HTMLDivElement>('#radio')!, {
  frequence: () => jeu.radio.frequence,
  regler: (f) => { jeu.radio.frequence = Math.round(Math.min(BANDE_OC.max, Math.max(BANDE_OC.min, f)) * 1000) / 1000 },
  ecouter: () => {
    const t = horloge(), systeme = systemeDeLaCapsule(t)
    const r = ecouterRadio(jeu.radio, systeme, t)
    const voix = r.capte?.voix ?? null
    if (r.nouvelle) { jeu.voixEnregistree(t); enregistrerPartie(); annoncer(`Voix perdue n° ${r.nouvelle} enregistrée : elle est dans tes Collections`); navigator.vibrate?.([40, 60, 40]) }
    return { voix, texte: voix ? texteVoix(voix) : null, nettete: r.capte?.nettete ?? 0, enregistrement: r.enregistrement,
      dejaEnregistree: !!voix && jeu.radio.captees.includes(voix.numero) && !r.nouvelle, nouvelle: !!r.nouvelle, systeme }
  },
})
document.querySelector('#bouton-radio')!.addEventListener('click', () => vueRadio.ouvrir())
document.querySelector('#radio [data-fermer]')!.addEventListener('click', () => enregistrerPartie())
// Le cadran de vitesse (demande d'Adrien du 20/10/2026), en bas à droite de la carte : la vitesse de la capsule en
// temps réel, de 0 à la vitesse max de son moteur, et la phase du vol (accélère, croisière, freine, en orbite).
const cadranVitesse = document.querySelector<HTMLElement>('#cadran-vitesse')!
const ARC_CADRAN = { debut: -210, fin: 30 }
const pointCadran = (a: number, r: number) => ({ x: 50 + r * Math.cos((a * Math.PI) / 180), y: 54 + r * Math.sin((a * Math.PI) / 180) })
{
  let g = ''
  for (let k = 0; k <= 10; k++) {
    const a = ARC_CADRAN.debut + ((ARC_CADRAN.fin - ARC_CADRAN.debut) * k) / 10, p = pointCadran(a, 38), q = pointCadran(a, k % 5 ? 33 : 30)
    g += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}"/>`
  }
  cadranVitesse.querySelector('.graduations')!.innerHTML = g
}
let cadranAffiche = ''
function afficherCadranVitesse(t: number): void {
  const plan = mission.phase(t) === 'trajet' ? mission.plan : null
  const v = plan ? vitesseEnVol(plan, t) : null
  const max = plan ? plan.vitesse : vitesse()
  const kms = v?.vitesse ?? 0
  const phase = !v ? 'EN ORBITE' : v.phase === 'accelere' ? 'ACCÉLÈRE' : v.phase === 'freine' ? 'FREINE' : v.phase === 'croisiere' ? 'CROISIÈRE' : 'ARRIVÉE'
  // Avec les décimales (demande d'Adrien du 21/10/2026) : on voit la vitesse grimper.
  const texte = kms.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const a = ARC_CADRAN.debut + (ARC_CADRAN.fin - ARC_CADRAN.debut) * Math.min(1, kms / max)
  const cle = `${texte}|${phase}|${a.toFixed(1)}`
  if (cle === cadranAffiche) return
  cadranAffiche = cle
  cadranVitesse.querySelector('.aiguille-vitesse')!.setAttribute('transform', `rotate(${(a + 90).toFixed(1)} 50 54)`)
  // Le nombre sur une ligne, l'unité dessous : jusqu'à « 15 360,00 » (niveau 10), il tient dans la console.
  cadranVitesse.querySelector('.valeur-vitesse')!.innerHTML = `${texte}<small>km/s</small>`
  cadranVitesse.querySelector('.phase-vitesse')!.textContent = phase
  cadranVitesse.dataset.phase = v?.phase ?? 'orbite'
  // L'arc de la phase : de 0 à la vitesse actuelle, vert à l'accélération, moutarde en croisière, cerise au freinage.
  const p0 = pointCadran(ARC_CADRAN.debut, 38), p1 = pointCadran(a, 38)
  cadranVitesse.querySelector('.phase-cadran')!.setAttribute('d', kms > 0 ? `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A38 38 0 ${a - ARC_CADRAN.debut > 180 ? 1 : 0} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}` : '')
}
/** Échos annoncés depuis l'ouverture du jeu ; un écho revenu l'application fermée s'annonce à la réouverture. */
const echosAnnonces = new Set<number>()
function suivreEchos(t: number): void {
  for (const x of echosNonVus(jeu.monolithes, t)) {
    if (echosAnnonces.has(x.envoye)) continue
    echosAnnonces.add(x.envoye)
    const n = placesPossibles(jeu.monolithes, x.monolithe, t).length
    annoncer(n === 1 ? `Monolithe n° ${x.monolithe} localisé ! Touche le bandeau pour le voir.`
      : `Écho du monolithe n° ${x.monolithe} : à ${texteDistance(x.rayon)}${n === 2 ? ' · deux places possibles : re-pingue d\'ailleurs' : ' · déplace-toi et re-pingue'}`)
    navigator.vibrate?.([80, 60, 80])
    if (n === 1 && cockpit.pageOuverte === 'navigation') cadran.afficher(selection)
    carteSale = true
  }
}
/** Montre l'écho revenu : le monolithe s'il est localisé, sinon son cercle en entier. */
function montrerEcho(t: number): void {
  const x = echosNonVus(jeu.monolithes, t)[0]
  marquerEchosVus(jeu.monolithes, t)
  enregistrerPartie()
  if (!x) return
  if (localise(jeu.monolithes, x.monolithe, t)) { choisir(`Monolithe n° ${x.monolithe}`, true); return }
  if (!reglages.cercles) { reglages.cercles = true; memoriser(); afficherChoixAffichage() }
  choisir(null)
  carte.voler((1.3 * x.rayon) / (largeur / 2), performance.now(), projeter({ p: { x: x.centre.x, y: x.centre.y, z: 0 }, t }), true)
}
// Toucher la carte referme le volet.
toilePlan.addEventListener('pointerdown', () => { cockpit.fermer(); glisseCumul = 0 })

// --- Réglages d'essai : accélération du temps et puissance des moteurs.
for (const bouton of panneau.querySelectorAll<HTMLInputElement>('input[name="acceleration"]')) {
  bouton.checked = Number(bouton.value) === acceleration
  bouton.addEventListener('change', () => { acceleration = Number(bouton.value); planAJour = 0 })
}
const curseurBudget = document.querySelector<HTMLInputElement>('#budget')!
const texteBudget = document.querySelector<HTMLSpanElement>('#texte-budget')!
// Curseur logarithmique : de 5 à 5 000 km/s (les moteurs du vrai jeu s'amélioreront sans limite).
const versVitesse = (x: number) => { const b = 5 * 1000 ** (x / 100); return b < 100 ? Math.round(b) : Math.round(b / 10) * 10 }
const depuisVitesse = (b: number) => (100 * Math.log(b / 5)) / Math.log(1000)
curseurBudget.value = String(depuisVitesse(reglages.vitesse))
texteBudget.textContent = `${reglages.vitesse} km/s`
curseurBudget.addEventListener('input', () => {
  reglages.vitesse = versVitesse(Number(curseurBudget.value))
  voletMissions.oublierDurees()
  texteBudget.textContent = `${reglages.vitesse} km/s`
  memoriser()
  planAJour = 0
})

/** Vitesse de croisière (km/s) : celle du moteur de la capsule, sauf essai. */
const vitesse = () => (reglages.forcerVitesse ? reglages.vitesse : jeu.vitesse())

// --- Navigation : trajet prévu vers la destination, fiche de trajet, départ.
const fiche = document.querySelector<HTMLDivElement>('#trajet')!
const ficheTexte = document.querySelector<HTMLDivElement>('#trajet-texte')!
const boutonDepart = document.querySelector<HTMLButtonElement>('#bouton-depart')!
const boutonCommuniquer = document.querySelector<HTMLButtonElement>('#bouton-communiquer')!
const boutonAttaquer = document.querySelector<HTMLButtonElement>('#bouton-attaquer')!
const elFrise = document.querySelector<HTMLDivElement>('#frise')!
const onglets = document.querySelector<HTMLElement>('#onglets')!
const instruments = document.querySelector<HTMLElement>('#instruments')!
const hauteurEcran = () => window.innerHeight
/** Ce que les commandes posées sur la carte cachent (pixels de l'écran) : les noms et la plaque l'évitent. */
let zonesCommandes: Boite[] = []
boutonCommuniquer.addEventListener('click', () => { if (selection) ouvrirMessages(`prive:${selection}`) })
let prevision: Planification | null = null
/** Ce que fait le bouton de la fiche : partir (Y ALLER, DÉPART) ou l'action de la mission (RÉPARER…). */
let actionFiche: 'depart' | 'agir' | 'accepter' | 'combat' | 'ramasser' | 'parler' | 'assaut' = 'depart'
let previsionPour: string | null = null
let planAJour = 0

/** La destination choisie est-elle là où l'on est déjà (ou la capsule elle-même) ? */
function dejaLa(t: number): boolean {
  return !selection || selection === CAPSULE || (mission.phase(t) === 'orbite' && mission.centre(t) === selection)
}

/** Recalcule le trajet prévu (la destination bouge : une fois par seconde de temps réel, ou si elle change). */
function prevoir(t: number, maintenant: number): void {
  if (!proposee || dejaLa(t) || (mission.phase(t) === 'trajet' && mission.plan?.cible === selection)) {
    prevision = null
    previsionPour = selection
    return
  }
  if (!jeu.peutNaviguer()) { prevision = null; previsionPour = selection; return }
  if (selection === previsionPour && maintenant - planAJour < 1000) return
  prevision = planifier(mission.etatHeliocentrique(t), selection!, t, vitesse())
  previsionPour = selection
  planAJour = maintenant
}

const bandeau = document.querySelector<HTMLDivElement>('#bandeau')!
// Toucher une ligne du bandeau ouvre le volet qui va avec (demande d'Adrien du 18/10/2026) : la panne, le panneau de
// réparation ; la mission, le volet Missions ; le trajet ou l'orbite, la Navigation ; crédits et moteur, la Capsule.
bandeau.addEventListener('click', (e) => {
  // Un voyant du tableau de bord : l'afficheur montre sa catégorie (ou se vide).
  const voyant = (e.target as HTMLElement).closest<HTMLElement>('[data-voyant]')?.dataset.voyant
  if (voyant) { basculerVoyant(voyant as Voyant); mettreAJourFiche(horloge()); return }
  const ligne = (e.target as HTMLElement).closest<HTMLElement>('[data-ligne]')?.dataset.ligne
  if (ligne === 'missile') {
    // Toucher le missile, c'est l'intercepter (s'il reste un intercepteur).
    const t = horloge()
    if (intercepterMissile(jeu.espace, t)) { onomatopee('PAF !', '#f6c4ad'); annoncer(`Missile intercepté ! (${jeu.espace.intercepteurs} intercepteur${jeu.espace.intercepteurs > 1 ? 's' : ''} restant${jeu.espace.intercepteurs > 1 ? 's' : ''})`); enregistrerPartie() }
    else annoncer('Plus d\'intercepteur ! Un nouveau dans moins de 30 minutes…')
  } else if (ligne === 'panne') {
    // Un bloc qui se répare sur le panneau, sinon l'onglet ÉTAT (réparation provisoire).
    const bloc = jeu.pannes.find((b) => !jeu.reparationProvisoire(b))
    if (bloc) montrerReparation(bloc)
    else { cockpit.ouvrir('capsule'); choisirSousOnglet('etat') }
  } else if (ligne === 'contrat') ouvrirJournal('contrats')
  else if (ligne === 'trajet' || ligne === 'orbite') cockpit.ouvrir('navigation')
  else if (ligne === 'echo') annoncer(etatBoutonPing(jeu, horloge()).texte)
  else if (ligne === 'echo-recu') montrerEcho(horloge())
  else if (ligne === 'etat') { cockpit.ouvrir('capsule'); choisirSousOnglet('etat') }
  else if (ligne === 'profil') cockpit.ouvrir('profil')
  // Les lignes éteintes du tableau de bord mènent là où on les allume.
  else if (ligne === 'vide-alerte') { cockpit.ouvrir('capsule'); choisirSousOnglet('etat') }
  else if (ligne === 'vide-contrat') ouvrirJournal('contrats')
  else if (ligne === 'quete' || ligne === 'vide-quete') { journalOuvert = jeu.queteSuivie; ouvrirJournal('quetes') }
  else if (ligne === 'vide-echo') annoncer(etatBoutonPing(jeu, horloge()).texte)
})

/**
 * Sur la fiche d'une zone occupée (demande d'Adrien du 21/10/2026) : où en est sa libération, la jauge de résistance
 * (ce que le moteur en dit, moteur/zones.ts) ; une zone libérée le dit.
 */
function occupation(nom: string): string {
  if (!zone(nom)) return ''
  if (jeu.zones.liberees.includes(nom)) return '<div class="occupation libre"><span>libérée par la Résistance</span></div>'
  const j = jauge(jeu.zones, nom)
  // À 100 %, ce qu'il reste à faire pour lancer l'assaut (Adrien, 22/10/2026 : sinon on ne sait pas pourquoi la zone reste occupée).
  const chemin = j >= 100 ? cheminVersAssaut(jeu, nom) : null
  return `<div class="occupation"><span>occupée par Andromède · résistance <b>${j} %</b></span><i><i style="width:${j}%"></i></i>`
    + `${chemin ? `<span class="chemin-assaut">${chemin}</span>` : ''}</div>`
}
function mettreAJourFiche(t: number): void {
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  const vol = enRoute ? vitesseEnVol(enRoute, t) : null
  const ou = astreDominant(mission.etat(t).position, t)
  afficherAnnonces(t)
  afficherBandeau(bandeau, lignesDuBandeau(jeu, t), {
    credits: jeu.credits, ...xpBandeau(), quete: queteDuTableau(),
    phase: !vol ? '' : vol.phase === 'accelere' ? 'accélère' : vol.phase === 'freine' ? 'freine' : vol.phase === 'croisiere' ? 'croisière' : 'arrivée',
    systeme: ou === 'Soleil' ? 'plein espace' : ou,
  }, t)
  // Le trajet dont la console du bas montre la feuille de route : celui qu'on prévoit (DÉPART), ou celui en cours.
  let planFiche: Plan | null = null
  // La situation de la capsule (en route, en orbite) est dans le bandeau d'alertes ; la fiche ne parle que de la
  // destination choisie.
  let texte = '', depart = false, libelle = 'DÉPART'
  actionFiche = 'depart'
  const etape = jeu.etapeActuelle(), fin = jeu.finAction()
  const pnjs = pnjIci(jeu, t)
  const assaut = assautIci(jeu, t)
  const monolithe = jeu.monolitheIci(t)
  if (monolithe !== null && !apercu && (!selection || dejaLa(t))) {
    // À côté d'un monolithe localisé : on le ramasse.
    texte = `<b>MONOLITHE N° ${monolithe}</b><br>une dalle noire, immobile, qui ne tourne autour de rien`
    depart = true
    libelle = 'RAMASSER'
    actionFiche = 'ramasser'
  } else if (selection && !apercu && monolitheNomme(selection) && jeu.monolithes.trouves.includes(monolitheNomme(selection)!.numero)
    && (dejaLa(t) || !proposee) && enRoute?.cible !== selection) {
    // Un monolithe déjà ramassé (il reste sur la carte) : quand (demande d'Adrien du 18/10/2026).
    const quand = jeu.monolithes.ramassesLe[monolitheNomme(selection)!.numero]
    texte = `<b>${selection.toUpperCase()}</b> · déjà ramassé<br>${quand ? `le ${texteDateComplete(quand)}` : 'date inconnue'}`
      + (dejaLa(t) ? '' : ` · ${avec('distance', texteDistance(distanceDepuisCapsule(selection, t)))}`)
    if (!dejaLa(t)) { depart = true; libelle = 'Y ALLER' }
  } else if (selection && !dejaLa(t) && enRoute?.cible !== selection && !jeu.peutNaviguer() && !apercu) {
    // Navigation en panne : impossible de calculer un trajet.
    texte = `<b>${selection.toUpperCase()}</b> · ${avec('distance', texteDistance(distanceDepuisCapsule(selection, t)))}<br>${picto('panne')} NAVIGATION EN PANNE : impossible de calculer un trajet`
  } else if (apercu) {
    // Aperçu d'une mission : son titre, son temps de trajet, sa récompense, et ACCEPTER.
    const duree = apercuPlans ? apercuPlans.reduce((s, p) => s + p.arrivee - p.depart, 0) : null
    texte = `<b>${picto(SYMBOLE_GENRE[apercu.genre])} ${GENRES_COURTS[apercu.genre]}</b> · ${avec('credits', String(apercu.recompense))}<br>${titreContrat(apercu)}<br>`
      + (duree === null ? 'hors de portée' : avec('duree', texteDuree(duree)))
      + (jeu.enCours ? ' · une mission est déjà en cours' : '')
    if (!jeu.enCours && duree !== null) { depart = true; libelle = 'ACCEPTER'; actionFiche = 'accepter' }
  } else if (selection && corps(selection)?.type === 'alien' && jeu.espace.missiles.some((m) => m.alien === selection)) {
    // Un chasseur qui nous tire dessus : on peut riposter (vue de combat).
    texte = `<b>${selection.toUpperCase()}</b> · ${avec('distance', texteDistance(distanceDepuisCapsule(selection, t)))}<br>chasseur alien d'Andromède : il te tire dessus !`
    depart = true
    libelle = 'RIPOSTER'
    actionFiche = 'combat'
  } else if (etape && (fin !== null || jeu.peutAgir(t)) && (!selection || dejaLa(t) || selection === etape.lieu)) {
    // Sur le lieu de la mission : le bouton de l'action (RÉPARER, LIVRER…), puis le temps qui reste.
    texte = `<b>${etape.lieu.toUpperCase()}</b> · contrat<br>${titreContrat(jeu.enCours!.contrat)}`
    if (fin !== null) texte += `<br>${NOMS_ACTIONS[etape.action]} en cours · ${texteSecondes(fin - t)}`
    else { depart = true; libelle = VERBES[etape.action]; actionFiche = 'agir' }
  } else if (assaut && !apercu && (!selection || selection === assaut || dejaLa(t))) {
    // L'assaut final d'une zone (décisions d'Adrien du 21/10/2026) : la résistance est à 100 %, on attaque l'amiral.
    const z = zone(assaut)!
    texte = `<b>${assaut.toUpperCase()}</b> · assaut final<br>${z.amiral[0].toUpperCase()}${z.amiral.slice(1)}, le vaisseau amiral, tient encore la zone`
    depart = true
    libelle = 'ASSAUT'
    actionFiche = 'assaut'
  } else if (pnjs.length && !apercu && (!selection || selection === pnjs[0].lieu || dejaLa(t)) && (signePnj(jeu, pnjs[0].id) || selection === pnjs[0].lieu)) {
    // Un PNJ ici (décisions d'Adrien du 20/10/2026) : on peut lui parler.
    const p = pnjs[0], s = signePnj(jeu, p.id)
    texte = `<b>${p.lieu.toUpperCase()}</b> · ${p.nom}<br>${p.role}${s ? ` · ${s.signe === '!' ? 'a quelque chose à te demander' : 'attend de tes nouvelles'}` : ''}`
    depart = true
    libelle = 'PARLER'
    actionFiche = 'parler'
  } else if (selection && corps(selection)?.type === 'alien' && dejaLa(t) && alienLa(jeu.espace, selection, t) && !apercu) {
    // Un chasseur rejoint hors contrat (décision d'Adrien du 21/10/2026) : on peut l'attaquer ; pas de crédits, mais
    // de l'XP et de la résistance pour la zone.
    texte = `<b>${selection.toUpperCase()}</b> · chasseur d'Andromède<br>hors contrat : pas de crédits, mais de l'XP et de la résistance pour la zone`
    depart = true
    libelle = 'ATTAQUER'
    actionFiche = 'combat'
  } else if (selection && !dejaLa(t) && enRoute?.cible !== selection && !proposee) {
    // Fiche de l'astre touché : rien ne change tant qu'on n'appuie pas sur Y ALLER.
    const genre = corps(selection)?.type
    const bot = genre === 'joueur' ? BOTS.find((b) => b.pseudo === selection) : undefined
    const quoi = genre === 'epave' ? ' · épave (à vider en mission)' : genre === 'monolithe' ? ' · localisé à la radio'
      : genre === 'alien' ? ' · chasseur d\'Andromède : rejoins-le pour l\'attaquer'
      : disparu(selection) ? (jeu.disparus.trouves[disparu(selection)!.numero] !== undefined ? ' · retrouvée (les Disparus)' : ' · écho faible : rejoins-la pour l\'identifier')
      : genre === 'zone' ? ' · fouille-la, radar allumé'
      : bot ? ` · PNJ, capitaine des ${titreMaison(bot.maison).toLowerCase()}${statut(bot.monolithes) ? ` · ${statut(bot.monolithes)}` : ''} · ${lieuDuBot(bot.pseudo, t)}${bot.bavard ? '' : ' · ne répond pas aux messages'}` : ''
    texte = `<b>${selection.toUpperCase()}</b>${quoi}<br>${avec('distance', texteDistance(distanceDepuisCapsule(selection, t)))}${occupation(selection)}`
    depart = true
    libelle = 'Y ALLER'
  } else if (selection && !dejaLa(t) && enRoute?.cible !== selection && prevision) {
    const dv = `${vitesse().toLocaleString('fr-FR')} km/s`
    if (prevision.possible) {
      const p = prevision.plan
      // La vitesse de pointe du trajet, face à la vitesse max du moteur : on voit si le moteur limite ce trajet.
      const pointe = Math.round(vitesseDePointe((p.arrivee - p.depart) / 1000, p.vitesse, p.vitesseInitiale)).toLocaleString('fr-FR')
      // L'heure d'arrivée est sur la frise, juste en dessous.
      texte = `<b class="destination">${selection.toUpperCase()}</b><span class="vals">${avec('duree', texteDuree(p.arrivee - p.depart))}`
        + `${avec('vitesse', `${pointe}/${dv}`)}</span>${occupation(selection)}`
      planFiche = p
      depart = true
      libelle = enRoute ? 'NOUVEAU CAP' : 'DÉPART'
    } else {
      texte = `<b>${selection.toUpperCase()}</b> · hors de portée<br>elle s'éloigne plus vite que la capsule (moteurs ${dv})`
    }
  }
  // En vol, sans autre chose à montrer : la destination, le temps qui reste, et la feuille de route du trajet.
  let enVol = false
  if (!texte && enRoute) {
    const e = jeu.etapeActuelle()
    // Compacte (demande d'Adrien du 22/10/2026) : le reste du trajet et l'étape du contrat sur une seule ligne.
    // Les kilomètres qui restent, qui défilent jusqu'à 0 (demande d'Adrien du 22/10/2026).
    texte = `<b class="destination">${enRoute.cible.toUpperCase()}</b><span class="vals">${avec('duree', `reste ${texteRestant(enRoute.arrivee - t)}`)}`
      + avec('distance', `${Math.round(kmRestants(enRoute, t)).toLocaleString('fr-FR')} km`, 'km-restants')
      + (jeu.enCours && e?.lieu === enRoute.cible ? `<span class="etape-contrat">contrat ${jeu.enCours.etape + 1}/${jeu.enCours.contrat.etapes.length}</span>` : '') + '</span>'
    planFiche = enRoute
    enVol = true
  }
  const ici = mission.phase(t) === 'orbite' ? mission.centre(t) : 'ici'
  const frise = planFiche ? htmlFrise(feuilleDeRoute(planFiche, enVol, t, jeu.enCours, ici), t) : ''
  elFrise.hidden = !frise
  if (frise && elFrise.innerHTML !== frise) elFrise.innerHTML = frise
  // Le compteur de vitesse n'est là qu'en vol (au repos, la vitesse ne dit rien).
  cadranVitesse.hidden = !enRoute || !texte
  fiche.hidden = !texte
  if (ficheTexte.innerHTML !== texte) ficheTexte.innerHTML = texte
  boutonDepart.hidden = !depart
  // La capsule d'un autre capitaine : on peut aussi lui écrire en privé (demande d'Adrien du 20/10/2026 ; les figurants
  // muets ne répondent pas, pas de bouton pour eux).
  const capitaine = selection && corps(selection)?.type === 'joueur' ? BOTS.find((b) => b.pseudo === selection) : undefined
  boutonCommuniquer.hidden = !texte || !capitaine?.bavard
  // ATTAQUER (décision d'Adrien du 21/10/2026) : grisé tant qu'il n'y a que des PNJ (on n'attaque que les vrais joueurs).
  boutonAttaquer.hidden = !texte || !capitaine
  const html = libelle === 'DÉPART' || libelle === 'NOUVEAU CAP' ? picto('depart') + libelle : libelle
  if (boutonDepart.innerHTML !== html) boutonDepart.innerHTML = html
  document.body.classList.toggle('avec-trajet', !!texte)
  // Ce que les commandes cachent de la carte (les noms ne s'y posent pas) : le haut, le bas, le boîtier des instruments.
  const rHaut = document.querySelector('#haut')!.getBoundingClientRect(), rBas = (texte ? fiche : onglets).getBoundingClientRect()
  carte.marges = { haut: rHaut.bottom + 4, bas: hauteurEcran() - rBas.top + 4 }
  const r = instruments.getBoundingClientRect()
  zonesCommandes = [{ x0: r.left - 4, y0: r.top - 4, x1: r.right + 4, y1: r.bottom + 4 }]
  // Les instruments se posent au-dessus de la console du bas, quelle que soit sa hauteur.
  const haut = texte ? `${fiche.offsetHeight}px` : '0px'
  if (document.body.style.getPropertyValue('--fiche') !== haut) document.body.style.setProperty('--fiche', haut)
}

/**
 * Départ en plein vol (nouveau cap, ou trajet recalculé après une panne) : le nouveau tracé part de là où la capsule
 * était dessinée, accroché à l'astre de départ (sinon elle sauterait : la carte ne place pas pareil un point du vide).
 */
let departEnVol: { plan: Plan; ancre: string; rel: Point2 } | null = null
let derniereCapsuleDessinee: Point2 | null = null
function partir(plan: Plan, t: number): void {
  dessinerDepart(plan, mission.phase(t) === 'trajet', t)
  mission.partir(plan)
}
/** Un trajet parti en plein vol se dessine depuis là où la capsule était dessinée (sinon : le départ normal). */
function dessinerDepart(plan: Plan, enVol: boolean, t: number): void {
  const d = enVol ? derniereCapsuleDessinee : null
  if (d) {
    const ancre = plan.cles[0].ancre, c = projeterCorps(ancre, t)
    departEnVol = { plan, ancre, rel: { x: d.x - c.x, y: d.y - c.y } }
  } else departEnVol = null
}
/** Où commence le tracé d'un trajet parti en plein vol (sinon undefined : le départ normal). */
function departDessine(plan: Plan, t: number): Point2 | undefined {
  if (departEnVol?.plan !== plan) return undefined
  const c = projeterCorps(departEnVol.ancre, t)
  return { x: c.x + departEnVol.rel.x, y: c.y + departEnVol.rel.y }
}

boutonDepart.addEventListener('click', () => {
  const t = horloge()
  if (actionFiche === 'agir') { agirMission(); return }
  if (actionFiche === 'accepter') { accepterMission(apercu!.id); return }
  if (actionFiche === 'combat') { combattre(selection!); return }
  if (actionFiche === 'assaut') { const z = assautIci(jeu, t); if (z) lancerAssaut(z); return }
  if (actionFiche === 'parler') {
    const p = pnjIci(jeu, t)[0]
    if (!p) return
    const d = parler(jeu, p.id, t)
    enregistrerPartie()
    vueDialogue.ouvrir(d)
    return
  }
  if (actionFiche === 'ramasser') {
    const n = jeu.ramasserMonolithe(t)
    if (n === null) return
    enregistrerPartie()
    choisir(null)
    annoncer(`Monolithe n° ${n} ramassé ! ${jeu.monolithes.trouves.length} / ${NOMBRE_MONOLITHES} dans la cale`)
    onomatopee('EURÊKA !', '#cdbfe8')
    navigator.vibrate?.([60, 40, 60, 40, 200])
    return
  }
  if (!jeu.peutNaviguer()) return
  if (!selection || dejaLa(t)) return
  if (!proposee) { proposee = true; planAJour = 0; return }
  // On recalcule au moment exact du départ.
  const p = planifier(mission.etatHeliocentrique(t), selection, t, vitesse())
  if (!p.possible) return
  partir(p.plan, t)
  onomatopee('VROOOM !', '#f2d58e')
  enregistrerPartie()
  voletMissions.oublierDurees()
  prevision = null
  proposee = false
  carteSale = true
})

// --- Gestes de la carte : glisser, pincer, toucher un astre.
const gestesCarte = new Gestes(toilePlan, {
  // La caméra suit ce qui est choisi : le pincement zoome autour de lui, et seul un vrai glissement d'un doigt (plus de
  // 15 px : pas le petit glissement du premier doigt d'un pincement) la fait lâcher prise.
  glisser: (dx, dy, pince) => {
    fermerTas()
    const accroche = selection !== null && suivre
    if (pince) { if (!accroche) carte.glisser(dx, dy); return }
    if (accroche) {
      glisseCumul += Math.hypot(dx, dy)
      if (glisseCumul < 15) return
      suivre = false
    }
    carte.glisser(dx, dy)
  },
  zoomer: (f, sx, sy) => { fermerTas(); carte.zoomer(f, sx, sy) },
  toucher: (x, y) => {
    ouvrirSystemes(false)
    // À l'échelle réelle, les engins s'entassent près de leur planète : toucher le tas propose de choisir.
    const noms = carte.touches(x, y)
    if (noms.length > 1) { montrerTas(noms, x, y); return }
    fermerTas()
    // Toucher un endroit vide retire le choix (et ferme l'aperçu d'une mission).
    choisir(noms[0] ?? null)
  },
})

document.addEventListener('gesturestart', (e) => e.preventDefault())

// Le tas sous le doigt (échelle réelle) : une petite liste près du doigt, pour choisir ce qu'on voulait toucher.
const tas = document.createElement('div')
tas.id = 'tas'
tas.hidden = true
document.body.append(tas)
function montrerTas(noms: string[], x: number, y: number): void {
  const nom = (n: string) => (n === CAPSULE ? `Ta capsule ${jeu.numeroSerie}` : n)
  tas.innerHTML = noms.slice(0, 8).map((n) => `<button type="button" data-tas="${n.replace(/"/g, '&quot;')}">${nom(n)}</button>`).join('')
  tas.hidden = false
  const r = tas.getBoundingClientRect()
  tas.style.left = `${Math.min(window.innerWidth - r.width - 8, Math.max(8, x - r.width / 2))}px`
  tas.style.top = `${Math.min(window.innerHeight - r.height - 90, Math.max(60, y + 16))}px`
}
function fermerTas(): void { tas.hidden = true }
tas.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tas]')
  if (!b) return
  fermerTas()
  choisir(b.dataset.tas!)
})

// --- Missions (« contrats » dans le moteur) : volet, action sur place, messages.
const message = document.querySelector<HTMLDivElement>('#message')!
let finMessage = 0
function annoncer(texte: string): void {
  message.textContent = texte
  message.hidden = false
  finMessage = performance.now() + 4000
}
function agirMission(): void {
  const t = horloge()
  // Abattre un chasseur (mission des Mercenaires) : le combat en vue tactique ; gagné, l'étape est faite.
  if (jeu.etapeDeCombat() && jeu.peutAgir(t)) {
    const alien = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueCombat.ouvrir({
      titre: `COMBAT · ${alien.toUpperCase()}`,
      zone: jeu.zoneEnCours(),
      surFin: (fin, degats) => {
        if (fin === 'victoire') {
          traiterEvenements(jeu.abattre(horloge(), vitesse(), degats) ?? [])
          choisir(null)
          enregistrerPartie()
          return 'Mission accomplie. Andromède enverra un renfort… ailleurs.'
        }
        if (fin === 'retraite') { jeu.casser('coque'); apresChangementDePanne(); return 'La Coque est en panne. Le chasseur est toujours là : la mission continue.' }
        return 'Il est toujours là : la mission continue.'
      },
    })
    return
  }
  // Escorter un convoi : à l'arrivée, l'embuscade (décision d'Adrien du 18/10/2026 : ESCORTER, Mercenaires).
  if (jeu.etapeDEscorte() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueEscorte.ouvrir({
      titre: lieu.toUpperCase(),
      zone: jeu.zoneEnCours(),
      surFin: (coups) => {
        const ev = jeu.escorter(coups, horloge(), vitesse())
        if (!ev) return 'La capsule n\'est plus sur place : l\'escorte n\'est pas validée.'
        traiterEvenements(ev)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        return `Le convoi est à bon port, à ${lieu}.`
      },
    })
    return
  }
  // Remorquer une épave : d'abord la harponner et la stabiliser (décision d'Adrien du 18/10/2026 : REMORQUER).
  if (jeu.etapeDeHarponnage() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueRemorquage.ouvrir({
      titre: lieu.toUpperCase(),
      surFin: (rates) => {
        const ev = jeu.harponner(rates, horloge(), vitesse())
        if (!ev) return 'La capsule n\'est plus sur place : l\'épave s\'est décrochée.'
        traiterEvenements(ev)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        const r = jeu.remorque()
        return r ? `Elle est au bout du câble. Direction ${r.pour}, pour la larguer.` : 'Elle est au bout du câble.'
      },
    })
    return
  }
  // Larguer l'épave à la station (idée validée par Adrien le 21/10/2026) : la lâcher pour qu'elle s'arrête dans la zone.
  if (jeu.etapeDeLargage() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueLargage.ouvrir({
      titre: lieu.toUpperCase(),
      surFin: (rates) => {
        const ev = jeu.larguer(rates, horloge(), vitesse())
        if (!ev) return 'La capsule n\'est plus sur place : l\'épave n\'est pas déposée.'
        traiterEvenements(ev)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        return `L'épave est à quai, ${lieu === 'ISS' ? "à l'ISS" : `à ${lieu}`}.`
      },
    })
    return
  }
  // Former le convoi à la station (idée validée par Adrien le 21/10/2026), avant de l'escorter.
  if (jeu.etapeDeConvoi() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueConvoi.ouvrir({
      titre: lieu.toUpperCase(),
      surFin: () => {
        const ev = jeu.formerConvoi(horloge(), vitesse())
        if (!ev) return 'La capsule n\'est plus sur place : le convoi ne part pas.'
        traiterEvenements(ev)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        const suite = jeu.etapeActuelle()
        return suite ? `En route ${suite.lieu === 'ISS' ? "vers l'ISS" : `vers ${suite.lieu}`}. Gare aux embuscades sur la dernière ligne droite.` : 'Le convoi est en route.'
      },
    })
    return
  }
  // Réparer un engin, c'est sur son boîtier technique, avec le Manuel (décision d'Adrien du 18/10/2026 : RÉPARER).
  if (jeu.etapeDeDepannage() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueDepannage.ouvrir({
      titre: lieu.toUpperCase(),
      surFin: (erreurs) => {
        const ev = jeu.depanner(erreurs, horloge(), vitesse())
        if (!ev) return 'La capsule n\'est plus sur place : la réparation n\'est pas validée.'
        traiterEvenements(ev)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        return `${lieu} remarche.`
      },
    })
    return
  }
  // Livrer une cargaison, c'est s'amarrer à la station (décision d'Adrien du 18/10/2026 : AMARRER, Ingénieurs).
  if (jeu.etapeDAmarrage() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueAmarrage.ouvrir({
      titre: lieu.toUpperCase(),
      surFin: (rebonds) => {
        const ev = jeu.amarrer(rebonds, horloge(), vitesse())
        if (!ev) return 'La capsule n\'est plus sur place : la cargaison n\'est pas livrée.'
        traiterEvenements(ev)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        return 'Cargaison livrée.'
      },
    })
    return
  }
  // Nettoyer une épave, c'est la trier (décision d'Adrien du 18/10/2026) : les matériaux vont dans la soute.
  if (jeu.etapeDeTri() && jeu.peutAgir(t)) {
    const lieu = jeu.etapeActuelle()!.lieu
    cockpit.fermer()
    vueTri.ouvrir({
      titre: `ÉPAVE · ${lieu.toUpperCase()}`,
      surFin: (e) => {
        const r = jeu.nettoyer(e.materiaux, objetsTries(e), horloge(), vitesse())
        if (!r) return 'La capsule n\'est plus sur place : rien n\'a été rangé.'
        traiterEvenements(r.evenements)
        enregistrerPartie()
        carteSale = true
        dernierVolet = 0
        return r.perdu ? `Rangé dans la soute… mais elle est pleine : ${r.perdu.toLocaleString('fr-FR')} t laissées dans l'épave.` : 'Tout est rangé dans la soute.'
      },
    })
    return
  }
  if (jeu.agir(t)) { enregistrerPartie(); carteSale = true; dernierVolet = 0 }
}
/** Accepte une mission ; depuis l'aperçu, prépare aussitôt le trajet vers son premier lieu (reste à appuyer sur DÉPART). */
function accepterMission(id: number): void {
  if (!jeu.accepter(id, horloge())) return
  enregistrerPartie()
  dernierVolet = 0
  if (apercu?.id === id) {
    const lieu = apercu.etapes[0].lieu
    choisir(lieu)
    proposee = true
    planAJour = 0
  }
}
const voletMissions = new VoletMissions(document.querySelector<HTMLDivElement>('#contrats')!, {
  accepter: accepterMission,
  voir: (id) => {
    const c = jeu.proposes.find((p) => p.id === id)
    if (!c) return
    cockpit.fermer()
    // Le lieu de près, avec l'astre autour duquel il tourne (demande d'Adrien du 21/10/2026 : on voyait trop loin).
    choisir(c.etapes[0].lieu, false, carte.echelleLieu(c.etapes[0].lieu, horloge()))
    apercu = c
    apercuAJour = 0
  },
  allerA: (lieu) => { cockpit.fermer(); choisir(lieu, true); proposee = true; planAJour = 0 },
  agir: agirMission,
  abandonner: () => {
    void confirmer({ titre: 'Abandonner ?', texte: 'Tu abandonnes le contrat en cours. Il ne te rapportera rien.', oui: 'ABANDONNER', grave: true }).then((oui) => {
      if (!oui) return
      jeu.abandonner()
      enregistrerPartie()
      dernierVolet = 0
    })
  },
})
/** Fait avancer les missions (actions finies, récompenses) et prévient le joueur. */
function avancerMissions(t: number): void {
  traiterEvenements(jeu.avancer(t, vitesse()))
}
/** Ce que le joueur apprend des événements du jeu (missions, pannes). */
// Les quêtes (décisions d'Adrien du 20/10/2026) : le dialogue avec un PNJ, l'onglet Journal (quêtes et contrats) et la
// ligne de la quête suivie sous le bandeau.
const vueDialogue = new VueDialogue(document.querySelector<HTMLDivElement>('#dialogue')!, {
  joueur: () => jeu.pseudo,
  accepter: (id) => {
    const ok = accepterQuete(jeu, id, horloge())
    if (ok) { enregistrerPartie(); annoncer(`Nouvelle quête : ${quete(id).titre} (voir le Journal)`) }
    return ok
  },
})
const pageJournal = document.querySelector<HTMLDivElement>('#journal')!
let journalOuvert: string | null = null
function afficherJournal(): void {
  const html = htmlJournal(jeu, journalOuvert)
  if (pageJournal.innerHTML !== html) pageJournal.innerHTML = html
}
// L'onglet Journal (décision d'Adrien du 20/10/2026) : ce qui est en cours en haut, puis deux sous-onglets, QUÊTES
// (principales, secondaires, terminées) et CONTRATS (les missions des Maisons) ; le dernier choisi est retenu.
const CLE_ONGLET_JOURNAL = 'andromeda-onglet-journal'
let ongletJournal: 'quetes' | 'contrats' = (() => { try { return localStorage.getItem(CLE_ONGLET_JOURNAL) === 'contrats' ? 'contrats' : 'quetes' } catch { return 'quetes' } })()
const enCoursJournal = document.querySelector<HTMLDivElement>('#en-cours-journal')!
function afficherOngletJournal(): void {
  document.querySelector<HTMLElement>('#journal')!.hidden = ongletJournal !== 'quetes'
  document.querySelector<HTMLElement>('#contrats')!.hidden = ongletJournal !== 'contrats'
  for (const b of document.querySelectorAll<HTMLElement>('[data-journal-onglet]')) b.classList.toggle('actif', b.dataset.journalOnglet === ongletJournal)
  // Plus de rappel « en cours » en haut du Journal (demande d'Adrien du 22/10/2026) : le tableau de bord le montre déjà.
  enCoursJournal.hidden = true
  if (ongletJournal === 'quetes') afficherJournal()
  else voletMissions.afficher(jeu, horloge(), vitesse(), performance.now(), lieuIci(horloge()))
}
/** Ouvre le Journal sur un de ses sous-onglets. */
function ouvrirJournal(o: typeof ongletJournal): void {
  ongletJournal = o
  if (cockpit.pageOuverte === 'missions') afficherOngletJournal()
  else cockpit.ouvrir('missions')
}
document.querySelector<HTMLElement>('#missions')!.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-journal-onglet]')
  if (!b) return
  ongletJournal = b.dataset.journalOnglet as typeof ongletJournal
  document.querySelector<HTMLElement>('#missions')!.scrollTop = 0
  try { localStorage.setItem(CLE_ONGLET_JOURNAL, ongletJournal) } catch { /* pas de mémoire : tant pis */ }
  afficherOngletJournal()
})
pageJournal.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('button')
  if (!b) return
  if (b.dataset.ouvrir) journalOuvert = journalOuvert === b.dataset.ouvrir ? '' : b.dataset.ouvrir
  else if (b.dataset.suivre) { jeu.queteSuivie = b.dataset.suivre; enregistrerPartie() }
  else if (b.dataset.yAller) { cockpit.fermer(); choisir(b.dataset.yAller, true); proposee = true; return }
  else return
  afficherJournal()
})
// Le bandeau des annonces générales (demande d'Adrien du 22/10/2026) : un texte qui défile sous le tableau de bord, le
// même pour tous (planètes au plus près, événements du jeu). Recalculé chaque minute ; le défilement ne repart que si
// le texte change.
const bandeAnnonces = document.querySelector<HTMLElement>('#annonces span')!
let annoncesAJour = 0
function afficherAnnonces(t: number): void {
  if (performance.now() - annoncesAJour < 60_000 && annoncesAJour) return
  annoncesAJour = performance.now()
  const liste = annonces(t)
  const texte = liste.join('   ◆   ')
  if (bandeAnnonces.textContent === texte) return
  bandeAnnonces.textContent = texte
  // Une vitesse de lecture constante, quelle que soit la longueur.
  bandeAnnonces.style.animationDuration = `${Math.max(14, texte.length * 0.16)}s`
}
/** La quête suivie, pour le voyant QUÊTE du tableau de bord : son titre et son objectif en cours. */
function queteDuTableau(): { titre: string; objectif: string; principale: boolean } | null {
  const q = jeu.queteSuivie ? quete(jeu.queteSuivie) : null
  const o = q ? objectif(jeu, q) : null
  return q && o ? { titre: q.titre, objectif: `${o.texte}${o.compte ? ` (${o.compte})` : ''}`, principale: q.type === 'principale' } : null
}

// La lettre d'invitation d'une Maison, en plein écran (REJOINDRE ou PLUS TARD).
const vueInvitation = new VueInvitation(document.querySelector<HTMLDivElement>('#invitation')!, {
  joueur: () => jeu.pseudo,
  rejoindre: (m) => entrerDansLaMaison(m),
})
function traiterEvenements(evenements: ReturnType<Jeu['avancer']>): void {
  for (const e of evenements) {
    if (e.genre === 'contrat-fini') { annoncer(`Mission terminée : +${e.contrat.recompense} crédits`); tampon('MISSION ACCOMPLIE', `+${e.contrat.recompense.toLocaleString('fr-FR')} crédits`) }
    else if (e.genre === 'etape-finie' && e.contrat.etapes.length > 1 && e.etape !== e.contrat.etapes[e.contrat.etapes.length - 1]) annoncer(ACTIONS_FINIES[e.etape.action])
    else if (e.genre === 'depart-auto') {
      // Les étapes s'enchaînent : la capsule est partie d'elle-même vers l'étape suivante (voir Jeu.avancer).
      const fini = evenements.find((x) => x.genre === 'etape-finie')
      annoncer(`${fini?.genre === 'etape-finie' ? ACTIONS_FINIES[fini.etape.action] : 'Étape terminée'} · départ vers ${e.lieu}`)
      choisir(e.lieu)
      voletMissions.oublierDurees()
      carteSale = true
    }
    else if (e.genre === 'action-interrompue') annoncer('Action interrompue : la capsule est repartie')
    else if (e.genre === 'missile') {
      annoncer(`RADAR : le ${e.alien} te tire dessus ! Touche le bandeau pour intercepter le missile`)
      navigator.vibrate?.([200, 100, 200])
    } else if (e.genre === 'impact') {
      onomatopee('BLAM !', '#f6c4ad')
      annoncer(e.modules.length ? `IMPACT ! En panne : ${e.modules.map((m) => MODULES.find((f) => f.nom === m)!.titre).join(', ')}` : 'IMPACT !')
      navigator.vibrate?.(400)
      // Le moteur a déjà ralenti le trajet à l'heure de l'impact ; s'il vient d'avoir lieu, on le redessine depuis la
      // capsule dessinée (sans saut).
      const p = mission.plan, t = horloge()
      if (p && p !== departEnVol?.plan && mission.phase(t) === 'trajet' && t - p.depart < 5000) dessinerDepart(p, true, t)
      apresChangementDePanne()
    } else if (e.genre === 'panne') {
      onomatopee('KRRZZT !', '#f2d58e')
      annoncer(`PANNE : ${MODULES.find((f) => f.nom === e.module)!.titre} !`)
      apresChangementDePanne()
    } else if (e.genre === 'reve-soleil') {
      // La capsule est déjà revenue là d'où elle était partie (moteur) : le rêve, puis la caméra sur elle.
      cockpit.fermer()
      choisir(null)
      carteSale = true
      vueReve.ouvrir(e.premier, () => allerALaCapsule())
    }
  }
  // Assez d'affinité avec une Maison : elle propose au joueur de la rejoindre (une seule fois).
  if (evenements.some((e) => e.genre === 'contrat-fini')) {
    const invitations = jeu.nouvellesInvitations(horloge())
    if (invitations.length) { navigator.vibrate?.([80, 60, 80]); vueInvitation.ouvrir(invitations) }
  }
  if (evenements.length) enregistrerPartie()
}
let dernierVolet = 0
let dernierMarche = 0
let dernierCourrier = 0

// Volet Capsule : acheter le moteur suivant (après confirmation) ; les trajets prévus se recalculent à la nouvelle vitesse.
const voletCapsule = new VoletCapsule(document.querySelector<HTMLDivElement>('#capsule')!, () => {
  const m = jeu.moteurSuivant()
  if (!m) return
  // La belle fenêtre « Nouveau moteur » (demande d'Adrien du 18/10/2026) : elle confirme, puis montre l'installation.
  ouvrirFenetreMoteur(jeu.moteur(), m, () => {
    if (!jeu.acheterMoteur()) return false
    // En route, le trajet se recalcule aussitôt à la nouvelle vitesse (demande d'Adrien du 21/10/2026).
    apresChangementDePanne()
    return true
  })
}, (m) => {
  jeu.reparer(m)
  apresChangementDePanne()
}, (m) => montrerReparation(m), (m) => {
  // Le dépanneur (décision d'Adrien du 20/10/2026) : la moitié des crédits, après confirmation.
  const titre = MODULES.find((f) => f.nom === m)!.titre, prix = jeu.prixDepanneur()
  void confirmer({
    titre: 'Le dépanneur',
    texte: [`Un dépanneur des Ingénieurs répare le bloc ${titre} tout de suite.`, prix ? `Il prend la moitié de tes crédits : ${prix.toLocaleString('fr-FR')} crédits.` : 'Tu n\'as pas de crédits : il le fait gratuitement.'],
    oui: prix ? `PAYER ${prix.toLocaleString('fr-FR')} CR.` : 'RÉPARER', non: 'PLUS TARD', grave: prix > 0,
  }).then((oui) => {
    if (!oui) return
    jeu.appelerDepanneur(m)
    apresChangementDePanne()
    annoncer(`Le dépanneur a réparé le bloc ${titre}`)
  })
})

// --- Réparation (volet Capsule › RÉPARATION) et Manuel (étape 4) ---
const zoneReparation = document.querySelector<HTMLDivElement>('#reparation')!
const etatReparation = document.querySelector<HTMLSpanElement>('#etat-reparation')!
type SousOnglet = 'etat' | 'soute' | 'armement' | 'reparation'
let sousOnglet: SousOnglet = 'etat'
const panneauReparation = new Panneau(document.querySelector<HTMLDivElement>('#panneau')!, (a) => {
  // Toucher un module en défaut ouvre ses commandes (demande d'Adrien du 18/10/2026) ; le toucher de nouveau les referme.
  const bloc = blocDe(a)
  if (!jeu.enDefaut(a)) {
    annoncer(jeu.reparationProvisoire(bloc.bloc) ? `Bloc ${bloc.titre} : se répare depuis ÉTAT (en attendant sa section du manuel)`
      : APPAREILS_PRETS.includes(a) ? `${repere(a)} · ${TITRES_APPAREILS[a]} : en état` : `${repere(a)} · ${TITRES_APPAREILS[a]} : pas encore raccordé`)
    moduleOuvert = null
  } else moduleOuvert = moduleOuvert === a ? null : a
  panneauReparation.choisir(moduleOuvert)
  afficherReparation()
})
/** Module du panneau dont les commandes sont ouvertes. */
let moduleOuvert: NomAppareil | null = null
/** Les commandes du module ouvert, collées en bas du volet (voir commun/commandes.ts). */
const commandes = document.querySelector<HTMLDivElement>('#commandes')!
let dernieresCommandes = ''
function afficherCommandes(e: EtatPanneau): void {
  if (moduleOuvert && !jeu.enDefaut(moduleOuvert)) { moduleOuvert = null; panneauReparation.choisir(null) }
  const html = moduleOuvert ? htmlCommandes(moduleOuvert, e) : ''
  commandes.hidden = !html
  if (html !== dernieresCommandes) commandes.innerHTML = dernieresCommandes = html
}
commandes.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button')
  if (!b || b.disabled || !moduleOuvert) return
  if (b.dataset.fermer !== undefined) { moduleOuvert = null; panneauReparation.choisir(null); afficherReparation(); return }
  const g = gesteDuBouton(b)
  if (g) gesteReparation(moduleOuvert, jeu.geste(moduleOuvert, g, horloge()))
})
// PURGER (module 3B SOUPAPE) se tient appuyé : on purge tant que le doigt reste dessus.
commandes.addEventListener('pointerdown', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-purger]')
  if (!b || b.disabled || moduleOuvert !== 'soupape') return
  ev.preventDefault()
  b.setPointerCapture(ev.pointerId)
  b.classList.add('tenu')
  gesteReparation('soupape', jeu.geste('soupape', { genre: 'purger', tenir: true }, horloge()))
})
const relacherPurge = (ev: PointerEvent) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-purger]')
  if (!b || !b.classList.contains('tenu')) return
  b.classList.remove('tenu')
  gesteReparation('soupape', jeu.geste('soupape', { genre: 'purger', tenir: false }, horloge()))
}
commandes.addEventListener('pointerup', relacherPurge)
commandes.addEventListener('pointercancel', relacherPurge)
/** Ce que le panneau doit montrer (le moteur du jeu le décide). */
function etatPanneau(t: number): EtatPanneau {
  const secondes = (r: EtatReparation | null) => r ? Math.max(0, Math.ceil((r.blocageJusqua - t) / 1000)) : 0
  const b = jeu.reparation('bornier'), te = jeu.reparation('telegraphe'), an = jeu.reparation('antenne'), ch = jeu.reparation('chiffreur')
  const fu = jeu.reparation('fusibles'), ac = jeu.reparation('accumulateurs')
  const le = jeu.reparation('leviers'), so = jeu.reparation('soupape'), inj = jeu.reparation('injecteurs')
  const co = jeu.reparation('constellation'), gy = jeu.reparation('gyroscope'), ca = jeu.reparation('calculateur')
  const cadCo = co ? cadransConstellation(co) : null, tourCa = ca ? tourCalculateur(ca.graine, ca.tour) : null
  const va = jeu.reparation('vannes'), br = jeu.reparation('breche'), sa = jeu.reparation('sas')
  const tourB = b ? tourEnergieVu(b.graine, b.tour, jeu.pressionForcee()) : null
  const tourAn = an ? tourAntenne(an.graine, an.tour) : null
  return {
    pannes: jeu.pannes,
    defauts: BLOCS.flatMap((f) => jeu.defauts[f.bloc] ?? []),
    energie: b ? { tour: tourB, coupes: b.coupes, bloque: secondes(b), numero: b.tour, tours: b.tours }
      : { tour: null, coupes: [], bloque: 0, numero: 0, tours: 0 },
    telegraphe: {
      morse: te ? sequenceMorse(tourTelegraphe(te.graine, te.tour).mot) : null,
      frequence: texteFrequence(te ? frequenceReglee(te) : FREQUENCES[0]), cran: te?.reglage ?? 0, crans: FREQUENCES.length, bloque: secondes(te),
    },
    antenne: {
      symbole: tourAn ? STATIONS[tourAn.station].symbole : null, bande: tourAn?.bande ?? null,
      angle: an?.reglage ?? 0, numero: an?.tour ?? 0, tours: an?.tours ?? 0, bloque: secondes(an),
    },
    chiffreur: { touches: ch ? tourChiffreur(ch.graine, ch.tour).touches : null, enfoncees: ch?.coupes ?? [], bloque: secondes(ch) },
    fusibles: { tour: fu ? tourFusibles(fu.graine, fu.tour) : null, numero: fu?.tour ?? 0, tours: fu?.tours ?? 0, bloque: secondes(fu) },
    accumulateurs: {
      tour: ac ? tourAccumulateurs(ac.graine, ac.tour) : null, branches: ac?.coupes ?? [], numero: ac?.tour ?? 0, tours: ac?.tours ?? 0, bloque: secondes(ac),
    },
    leviers: {
      actif: !!le, positions: le ? positionsLeviers(le) : [...COMBINAISONS[symboleAuRepos(jeu.numeroSerie)]],
      numero: le?.tour ?? 0, tours: le?.tours ?? 0, bloque: secondes(le),
    },
    soupape: {
      symbole: SYMBOLES_SOUPAPE[le ? tourLeviers(le.graine, le.tour).symbole : symboleAuRepos(jeu.numeroSerie)],
      temperature: so ? tourSoupape(so.graine, so.tour).temperature : null,
      // En état, l'aiguille indique ce que lit la règle R6 du bornier (dans le rouge ou non).
      pression: so ? pressionSoupape(so, t) : tourB?.pressionRouge ? 9 : 3.5,
      purge: so?.reglage !== undefined && !secondes(so), numero: so?.tour ?? 0, tours: so?.tours ?? 0, bloque: secondes(so),
    },
    injecteurs: {
      voyants: inj ? tourInjecteurs(inj.graine, inj.tour).voyants : null, coupes: inj?.coupes ?? [], numero: inj?.tour ?? 0, tours: inj?.tours ?? 0,
      bloque: secondes(inj),
    },
    constellation: {
      constellation: co ? CONSTELLATIONS[tourConstellation(co.graine, co.tour).constellation] : null,
      azimut: cadCo ? AZIMUTS[cadCo.azimut] : 0, hauteur: cadCo ? HAUTEURS[cadCo.hauteur] : 45,
      numero: co?.tour ?? 0, tours: co?.tours ?? 0, bloque: secondes(co),
    },
    gyroscope: {
      actif: !!gy, angles: gy ? [0, 1, 2].map((i) => angleAnneau(gy, i, t)) : [20, 140, 260], freines: gy?.coupes ?? [], bloque: secondes(gy),
    },
    calculateur: {
      code: tourCa ? CODES_CALCUL[tourCa.code].code : null, interrupteurs: ca ? interrupteursCalcul(ca) : [true, false, true, true, false, false],
      tapes: ca?.coupes ?? [], numero: ca?.tour ?? 0, tours: ca?.tours ?? 0, bloque: secondes(ca),
    },
    vannes: { actif: !!va, crans: va ? cransVannes(va) : [0, 0, 0], numero: va?.tour ?? 0, tours: va?.tours ?? 0, bloque: secondes(va) },
    breche: {
      fissure: br ? FISSURES[tourBreche(br.graine, br.tour).fissure].trace : null, frappes: br?.coupes ?? [],
      // Le manomètre montre la pression que lisent les vannes en défaut ; sinon, la pression normale.
      pression: va ? tourVannes(va.graine, va.tour).pression : 1, numero: br?.tour ?? 0, tours: br?.tours ?? 0, bloque: secondes(br),
    },
    sas: {
      message: sa ? MESSAGES_SAS[tourSas(sa.graine, sa.tour).messages[sa.coupes.length]].message : null, etape: sa?.coupes.length ?? 0,
      interrupteurs: sa ? interrupteursSas(sa) : Array(8).fill(false), bloque: secondes(sa),
    },
  }
}
function afficherReparation(): void {
  if (sousOnglet !== 'reparation') return
  const t = horloge()
  panneauReparation.construire(jeu.numeroSerie)
  const e = etatPanneau(t)
  panneauReparation.afficher(e)
  afficherCommandes(e)
  const texte = !jeu.pannes.length ? 'Tous les modules sont en état.'
    : e.defauts.length ? (moduleOuvert ? `${repere(moduleOuvert)} · ${TITRES_APPAREILS[moduleOuvert]} : suis le manuel` : `À réparer : ${e.defauts.map(repere).join(', ')} (voyants rouges)`)
      : `En panne : ${jeu.pannes.map((m) => MODULES.find((f) => f.nom === m)!.titre).join(', ')} (depuis ÉTAT)`
  if (etatReparation.textContent !== texte) etatReparation.textContent = texte
}
/** Résultat d'un geste sur le panneau : étincelle, tour suivant, module réparé, bloc réparé. */
function gesteReparation(a: NomAppareil, r: Resultat): void {
  const bloc = blocDe(a)
  if (r === 'erreur') {
    panneauReparation.etincelle(a)
    navigator.vibrate?.(200)
    annoncer('Erreur ! Module bloqué 30 s')
  } else if (r === 'bloque') annoncer('Module bloqué : patience…')
  else if (r === 'tour-suivant') annoncer('Bien ! Nouvelle consigne')
  else if (r === 'repare') {
    onomatopee('CLONK !', '#9fcfca')
    annoncer(jeu.enPanne(bloc.bloc) ? `${repere(a)} · ${TITRES_APPAREILS[a]} réparé ! Reste : ${jeu.defauts[bloc.bloc]!.map(repere).join(', ')}` : `Bloc ${bloc.titre} réparé !`)
    moduleOuvert = null
    panneauReparation.choisir(null)
    apresChangementDePanne()
  }
  enregistrerPartie()
  afficherReparation()
}
function choisirSousOnglet(s: SousOnglet): void {
  if (s !== sousOnglet) { const page = document.querySelector<HTMLElement>('.page[data-contenu="capsule"]'); if (page) page.scrollTop = 0 }
  sousOnglet = s
  for (const b of document.querySelectorAll<HTMLElement>('[data-sous]')) b.classList.toggle('actif', b.dataset.sous === s)
  document.querySelector<HTMLDivElement>('#capsule')!.hidden = s !== 'etat'
  zoneReparation.hidden = s !== 'reparation'
  pageSoute.hidden = s !== 'soute'
  pageArmement.hidden = s !== 'armement'
  if (s === 'reparation') afficherReparation()
  afficherSoute()
  afficherArmement()
}
/** L'onglet ARMEMENT du volet Capsule : l'énergie à répartir (sauvegardée) et le simulateur de combat. */
const pageArmement = document.querySelector<HTMLDivElement>('#armement')!
let dernierArmement = ''
function afficherArmement(): void {
  if (sousOnglet !== 'armement') return
  const html = htmlArmement(jeu)
  if (html !== dernierArmement) pageArmement.innerHTML = dernierArmement = html
}
pageArmement.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
  if (!b || b.disabled) return
  if (b.dataset.combat !== undefined) vueCombat.ouvrir({ ...SIMULATEUR, zone: Number(b.dataset.combat) })
  const ligne = b.dataset.ameliorer as LigneArmement | undefined
  if (ligne) {
    // Améliorer l'armement (décisions d'Adrien du 21/10/2026) : crédits et matériaux, après confirmation.
    const f = ARMEMENT.find((x) => x.ligne === ligne)!, m = jeu.manquePourArmement(ligne)
    if (!m) return
    const mats = Object.entries(f.materiaux[jeu.armement[ligne]]).map(([nom, q]) => `${q} t de ${nom.toLowerCase()}`).join(' et ')
    void confirmer({ titre: `${f.titre} niv. ${jeu.armement[ligne] + 1}`, texte: [`${f.titre} : ${f.texte(f.valeurs[jeu.niveauArmement(ligne) - 1])} → ${f.texte(f.valeurs[jeu.niveauArmement(ligne)])}.`, `Pour ${m.prix.toLocaleString('fr-FR')} crédits et ${mats}.`], oui: 'AMÉLIORER' })
      .then((oui) => { if (oui && jeu.acheterArmement(ligne)) { enregistrerPartie(); annoncer(`${f.titre} amélioré : niveau ${jeu.armement[ligne]}`); afficherArmement() } })
  }
})
// La vue de combat (au tour par tour) : missions ABATTRE, riposte contre un chasseur qui tire, simulateur.
const vueCombat = new VueCombat(document.querySelector<HTMLDivElement>('#combat')!, () => jeu.equipement())
// Le rêve du Soleil (décision d'Adrien du 21/10/2026) : un secret, sans effet sur le jeu.
const vueReve = new VueReve(document.querySelector<HTMLDivElement>('#reve')!)
/** L'onglet SOUTE du volet Capsule. */
const pageSoute = document.querySelector<HTMLDivElement>('#soute')!
let derniereSoute = ''
function afficherSoute(): void {
  if (sousOnglet !== 'soute') return
  // Comparer au dernier HTML écrit (le navigateur réécrit innerHTML à sa façon : le comparer redessinerait tout,
  // à chaque image, et un bouton pourrait disparaître sous le doigt).
  const html = htmlSoute(jeu)
  if (html !== derniereSoute) pageSoute.innerHTML = derniereSoute = html
}
// --- Messages (décision d'Adrien du 18/10/2026 : « tout le fun est là », accessible et fun) ---
// Les messages vivent en temps réel (Date.now()), pas au temps accéléré des essais.
const voletMessages = new VoletMessages(document.querySelector<HTMLDivElement>('#messages')!, () => jeu, () => enregistrerPartie(),
  // VOIR : la capsule du capitaine sur la carte (demande d'Adrien du 20/10/2026).
  (pseudo) => { cockpit.fermer(); choisir(pseudo, true) })
// Avant la première ouverture : les 20 dernières minutes de bavardage sont « nouvelles » (le système est vivant).
if (jeu.lus.debut === undefined) jeu.lus.debut = Date.now() - 20 * 60_000
const boutonMessages = document.querySelector<HTMLButtonElement>('#bouton-messages')!
const bulleMessage = document.querySelector<HTMLButtonElement>('#bulle-message')!
let courrierDepuis = Date.now()
let finBulle = 0
/** Ouvre les Messages (sur un canal donné). */
function ouvrirMessages(canal?: string): void {
  cockpit.ouvrir('messages')
  if (canal) voletMessages.ouvrirCanal(canal)
}
boutonMessages.addEventListener('click', () => ouvrirMessages())
bulleMessage.addEventListener('click', () => { bulleMessage.hidden = true; ouvrirMessages(bulleMessage.dataset.canal) })
/** Chaque seconde : les non-lus (bouton des Messages, et la rubrique Messages dans « Plus » ; plus de pastille sur l'onglet Plus, qui faisait doublon), une bulle sur la carte pour ce qui nous est adressé. */
function courrier(): void {
  const t = Date.now()
  if (cockpit.pageOuverte === 'messages') voletMessages.afficher(t)
  const n = nonLus(jeu, t).total
  for (const [el, texte] of [[boutonMessages.querySelector<HTMLElement>('.pastille')!, String(n)],
    [document.querySelector<HTMLElement>('.pastille-rubrique')!, String(n)]] as [HTMLElement, string][]) {
    el.hidden = n === 0
    if (el.textContent !== texte) el.textContent = texte
  }
  const nouveaux = arrivesDepuis(jeu, courrierDepuis, t)
  courrierDepuis = t
  const m = nouveaux[nouveaux.length - 1]
  if (m && cockpit.pageOuverte !== 'messages') {
    bulleMessage.innerHTML = `<b>${m.auteur}</b> ${m.texte.length > 70 ? `${m.texte.slice(0, 68)}…` : m.texte}`
    bulleMessage.dataset.canal = m.canal
    bulleMessage.hidden = false
    finBulle = t + 6000
    navigator.vibrate?.(30)
  } else if (!bulleMessage.hidden && t > finBulle) bulleMessage.hidden = true
  // Un bavard sur la même orbite lance une phrase (Adrien, 22/10/2026 : plus fun), une fois par jour et par lieu ; la
  // toucher ouvre la conversation avec lui.
  const tj = horloge()
  if (bulleMessage.hidden && cockpit.pageOuverte === null && mission.phase(tj) === 'orbite') {
    const lieu = mission.centre(tj), jour = Math.floor(tj / 86_400_000)
    const pseudo = bavardsIci(lieu, tj).find((p) => !passagesVus.has(`${p}@${lieu}@${jour}`))
    if (pseudo) {
      passagesVus.add(`${pseudo}@${lieu}@${jour}`)
      bulleMessage.innerHTML = `<b>${pseudo}</b> ${phraseDePassage(pseudo, lieu, tj)}`
      bulleMessage.dataset.canal = `prive:${pseudo}`
      bulleMessage.hidden = false
      finBulle = t + 7000
    }
  }
}
/** Les bavards qui nous ont déjà parlé (pseudo, lieu, jour). */
const passagesVus = new Set<string>()

// Au tout début du jeu (demande d'Adrien du 20/10/2026) : la capsule a reçu son numéro ; le joueur choisit le nom de
// son capitaine (3 à 16 caractères). Il pourra le changer plus tard dans le Profil.
if (!partieChargee) {
  const bienvenue = document.createElement('div')
  bienvenue.id = 'bienvenue'
  bienvenue.className = 'plein'
  bienvenue.innerHTML = `<div class="carte-bienvenue"><h2 class="titre-pulp">Bienvenue à bord&nbsp;!</h2>
    <p>Ta capsule vient de sortir des chantiers. Elle porte le numéro <b>${jeu.numeroSerie}</b>.</p>
    <p>Quel est le nom de son capitaine&nbsp;?</p>
    <input id="nom-capitaine" type="text" maxlength="16" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="ton nom de capitaine" />
    <small>3 à 16 lettres, chiffres, - ou _</small>
    <button type="button" class="principal">PRENDRE LES COMMANDES</button></div>`
  document.body.append(bienvenue)
  const champ = bienvenue.querySelector<HTMLInputElement>('#nom-capitaine')!
  const valider = () => {
    const p = champ.value.trim()
    if (!pseudoValide(p)) { champ.classList.add('erreur'); annoncer('Nom : 3 à 16 lettres, chiffres, - ou _'); return }
    jeu.pseudo = p
    plaque()
    enregistrerPartie()
    bienvenue.remove()
    annoncer(`Capitaine ${p}, la capsule ${jeu.numeroSerie} est à toi`)
  }
  bienvenue.querySelector('button')!.addEventListener('click', valider)
  champ.addEventListener('keydown', (e) => { if (e.key === 'Enter') valider() })
}

// Le Profil (dans « Plus ») : rempli à l'ouverture ; le pseudo se change ici.
const pageProfil = document.querySelector<HTMLDivElement>('#profil')!
function changerPseudo(): void {
  const champ = pageProfil.querySelector<HTMLInputElement>('#pseudo')!
  const p = champ.value.trim()
  if (!pseudoValide(p)) { annoncer('Pseudo : 3 à 16 lettres, chiffres, - ou _'); return }
  jeu.pseudo = p
  plaque()
  enregistrerPartie()
  champ.blur()
  annoncer(`Tu t'appelles maintenant ${p}`)
}
pageProfil.addEventListener('click', (e) => {
  const cible = e.target as HTMLElement
  if (cible.closest('[data-pseudo]')) { changerPseudo(); return }
  // Rejoindre une Maison, ou redevenir neutre (jamais définitif).
  const b = cible.closest<HTMLElement>('[data-rejoindre]')
  if (!b) return
  const maison = (b.dataset.rejoindre || null) as Maison | null
  const question = maison ? `Rejoindre les ${titreMaison(maison).toLowerCase()} ? Tu pourras toujours changer d'avis.` : 'Redevenir neutre ? Tu pourras rejoindre une Maison plus tard.'
  void confirmer({ titre: maison ? `Les ${titreMaison(maison).toLowerCase()}` : 'Redevenir neutre', texte: question, oui: maison ? 'REJOINDRE' : 'REDEVENIR NEUTRE' }).then((oui) => { if (oui) entrerDansLaMaison(maison) })
})
/** Rejoint une Maison (ou redevient neutre) : les tableaux de missions se réorganisent, le parrain écrit. */
function entrerDansLaMaison(maison: Maison | null): boolean {
  if (!jeu.rejoindre(maison, horloge())) return false
  enregistrerPartie()
  voletMissions.oublierDurees()
  dernierVolet = 0
  pageProfil.innerHTML = htmlProfil(jeu)
  annoncer(maison ? `Bienvenue chez les ${titreMaison(maison).toLowerCase()} ! Leurs missions t'attendent.` : 'Te voilà neutre.')
  return true
}
pageProfil.addEventListener('keydown', (e) => { if (e.key === 'Enter') changerPseudo() })
// Le tri d'une épave (entraînement, depuis la SOUTE).
const vueTri = new VueTri(document.querySelector<HTMLDivElement>('#tri')!)
const vueAmarrage = new VueAmarrage(document.querySelector<HTMLDivElement>('#amarrage')!)
const vueDepannage = new VueDepannage(document.querySelector<HTMLDivElement>('#depannage')!)
const vueRemorquage = new VueRemorquage(document.querySelector<HTMLDivElement>('#remorquage')!)
const vueEscorte = new VueEscorte(document.querySelector<HTMLDivElement>('#escorte')!)
const vueLargage = new VueLargage(document.querySelector<HTMLDivElement>('#largage')!)
const vueConvoi = new VueConvoi(document.querySelector<HTMLDivElement>('#convoi')!)
pageSoute.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-tri]')) vueTri.ouvrir()
})
document.querySelector('#collections')!.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-disparus]')) vueDisparus.ouvrir()
  if ((e.target as HTMLElement).closest('[data-classeur]')) vueClasseur.ouvrir()
  if ((e.target as HTMLElement).closest('[data-carnet]')) vueCarnet.ouvrir()
})
// Le classeur des Disparus : CHERCHER suit une sonde et emmène la carte là où chercher (son astre, ou sa zone).
const vueDisparus = new VueDisparus(document.querySelector<HTMLDivElement>('#disparus')!, () => jeu.disparus, (numero) => {
  const d = DISPARUS.find((x) => x.numero === numero)!
  jeu.disparus.suivi = numero
  enregistrerPartie()
  cockpit.fermer()
  const o = ouChercher(d)
  choisir(o.lieu, false, o.zone ? undefined : carte.echellePlanete(o.lieu))
  annoncer(o.zone ? `${d.nom} : sa zone de recherche est marquée sur la carte. Fouille-la au radar.` : `${d.nom} : ${d.indice} Passe au-dessus, de près, radar allumé.`)
})
const vueCarnet = new VueCarnet(document.querySelector<HTMLDivElement>('#carnet')!, () => jeu.radio)
// Le classeur des monolithes (Plus › Collections), en plein écran.
const vueClasseur = new VueClasseur(document.querySelector<HTMLDivElement>('#classeur')!, () => jeu.monolithes)
// Volet Marché : les cours, rafraîchis chaque seconde tant qu'il est ouvert (le délai de la lumière change).
const etatCommerce = () => {
  const t = horloge()
  return { soute: jeu.soute, credits: jeu.credits, ici: jeu.marcheIci(t)?.nom ?? null, enVol: mission.phase(t) === 'trajet', ouverts: MARCHES.filter((m) => estLibre(jeu.zones, m.lieu)).map((m) => m.nom) }
}
// Le Comptoir (onglet du Marché) : acheter et vendre les matériaux au comptoir d'ici (décision d'Adrien du 20/10/2026).
const afficherComptoir = (t: number) => voletComptoir.afficher(t, etatCommerce(), jeu.manquePourMoteur().materiaux)
const voletComptoir = new VoletComptoir(document.querySelector<HTMLDivElement>('#comptoir')!, () => afficherComptoir(horloge()), (o) => {
  const t = horloge()
  const r = o.sens === 'acheter' ? jeu.acheter(o.marchandise, o.tonnes, t) : jeu.vendre(o.marchandise, o.tonnes, t)
  if (!r.tonnes) { annoncer(o.sens === 'acheter' ? 'Achat impossible : soute pleine ou pas assez de crédits' : 'Rien à vendre'); return }
  const q = r.tonnes.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  annoncer(o.sens === 'acheter' ? `Acheté ${q} t de ${o.marchandise.toLowerCase()} pour ${r.prix.toLocaleString('fr-FR')} crédits`
    : `Vendu ${q} t de ${o.marchandise.toLowerCase()} pour ${r.prix.toLocaleString('fr-FR')} crédits`)
  navigator.vibrate?.(30)
  enregistrerPartie()
  afficherComptoir(t)
}, (o) => (o.sens === 'acheter' ? jeu.acheter(o.marchandise, o.tonnes, horloge(), true) : jeu.vendre(o.marchandise, o.tonnes, horloge(), true)))
// La Bourse (onglet du Marché, décisions d'Adrien du 20/10/2026) : un ordre part vers le siège de la compagnie à la
// vitesse de la lumière ; sa confirmation est annoncée à son retour (voir la boucle).
const voletBourse = new VoletBourse(document.querySelector<HTMLDivElement>('#bourse')!, () => afficherMarche(horloge()), (o) => {
  const t = horloge()
  const ordre = jeu.ordreBourse(o.compagnie, o.sens, o.quantite, t)
  if (!ordre) { annoncer(o.sens === 'acheter' ? 'Ordre impossible : pas assez de crédits' : 'Ordre impossible : pas d\'actions à vendre'); return }
  const c = compagnie(o.compagnie)!
  annoncer(`Ordre parti vers le siège de ${c.nom} (${c.siege}) : il y arrive dans ${texteDelai(ordre.arrivee - t)}`)
  navigator.vibrate?.(30)
  enregistrerPartie()
  afficherMarche(t)
})
// Les deux onglets du Marché ; le dernier choisi est retenu sur le téléphone.
const CLE_ONGLET_MARCHE = 'andromeda-onglet-marche'
let ongletMarche: 'bourse' | 'comptoir' = (() => { try { return localStorage.getItem(CLE_ONGLET_MARCHE) === 'comptoir' ? 'comptoir' : 'bourse' } catch { return 'bourse' } })()
function afficherMarche(t: number): void {
  document.querySelector<HTMLElement>('#bourse')!.hidden = ongletMarche !== 'bourse'
  document.querySelector<HTMLElement>('#comptoir')!.hidden = ongletMarche !== 'comptoir'
  for (const b of document.querySelectorAll<HTMLElement>('[data-marche-onglet]')) b.classList.toggle('actif', b.dataset.marcheOnglet === ongletMarche)
  if (ongletMarche === 'bourse') voletBourse.afficher(t, { portefeuille: jeu.bourse, credits: jeu.credits, cotees: COMPAGNIES.filter((c) => estLibre(jeu.zones, c.siege)).map((c) => c.id) })
  else afficherComptoir(t)
}
for (const b of document.querySelectorAll<HTMLElement>('[data-marche-onglet]')) {
  b.addEventListener('click', () => {
    ongletMarche = b.dataset.marcheOnglet as typeof ongletMarche
    document.querySelector<HTMLElement>('#marche')!.scrollTop = 0
    try { localStorage.setItem(CLE_ONGLET_MARCHE, ongletMarche) } catch { /* pas de mémoire : tant pis */ }
    afficherMarche(horloge())
  })
}
for (const b of document.querySelectorAll<HTMLElement>('[data-sous]')) b.addEventListener('click', () => choisirSousOnglet(b.dataset.sous as SousOnglet))
/** Ouvre le panneau de réparation, sur le premier module en défaut (du bloc donné, sinon de tous). */
function montrerReparation(bloc?: NomModule): void {
  cockpit.ouvrir('capsule')
  choisirSousOnglet('reparation')
  const a = (bloc ? jeu.defauts[bloc] : BLOCS.flatMap((f) => jeu.defauts[f.bloc] ?? []))?.[0]
  if (a) {
    const page = zoneReparation.closest<HTMLElement>('.page')!
    requestAnimationFrame(() => {
      // Le haut du module, juste sous les sous-onglets (collés en haut du volet) et la barre.
      const svg = zoneReparation.querySelector('svg')!
      page.scrollTop = svg.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop
        + Panneau.hauteur(a) * svg.getBoundingClientRect().height - 80
    })
  }
}
const pageManuel = document.querySelector<HTMLDivElement>('#manuel')!
pageManuel.innerHTML = '<button type="button" class="retour" data-page="plus">‹ Plus</button>' + htmlManuel()
const pagePanneau = zoneReparation.closest<HTMLElement>('.page')!
// Passer du panneau au Manuel et revenir (demande d'Adrien du 21/10/2026) : d'un glissement à gauche ou à droite, ou
// par leurs boutons ; chacun retrouve l'endroit où on l'avait laissé, sans avoir à rechercher le module ou la page.
const positions = { panneau: null as number | null, manuel: 0 }
function basculer(vers: 'panneau' | 'manuel'): void {
  if (cockpit.pageOuverte === 'manuel') positions.manuel = pageManuel.scrollTop
  else if (cockpit.pageOuverte === 'capsule' && sousOnglet === 'reparation') positions.panneau = pagePanneau.scrollTop
  if (vers === 'manuel') cockpit.ouvrir('manuel')
  else if (positions.panneau === null) montrerReparation()
  else { cockpit.ouvrir('capsule'); choisirSousOnglet('reparation') }
  const page = vers === 'manuel' ? pageManuel : pagePanneau
  const haut = vers === 'manuel' ? positions.manuel : positions.panneau
  if (haut !== null) page.scrollTop = haut
  page.classList.remove('vers-gauche', 'vers-droite')
  void page.offsetWidth
  page.classList.add(vers === 'manuel' ? 'vers-gauche' : 'vers-droite')
}
// Le Manuel ouvert depuis Plus (sans réparation en cours) garde le geste : il mène au panneau.
function glisserEntre(page: HTMLElement, vers: 'panneau' | 'manuel', sens: -1 | 1, actif: () => boolean): void {
  let debut: { x: number; y: number } | null = null
  page.addEventListener('touchstart', (e) => {
    debut = e.touches.length === 1 && actif() && !(e.target as HTMLElement).closest('input[type="range"], .commandes')
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
  }, { passive: true })
  page.addEventListener('touchend', (e) => {
    if (!debut) return
    const dx = e.changedTouches[0].clientX - debut.x, dy = e.changedTouches[0].clientY - debut.y
    debut = null
    if (dx * sens > 70 && Math.abs(dx) > 2 * Math.abs(dy)) basculer(vers)
  }, { passive: true })
}
glisserEntre(pagePanneau, 'manuel', -1, () => sousOnglet === 'reparation')
// Ces deux-là ont leur propre glissement : pas de changement d'onglet en glissant dessus.
cockpit.glissementPropre = (cible) => !!cible.closest('#manuel') || (sousOnglet === 'reparation' && pagePanneau.contains(cible))
glisserEntre(pageManuel, 'panneau', 1, () => true)
zoneReparation.querySelector('[data-choix="manuel"]')!.addEventListener('click', () => basculer('manuel'))
pageManuel.querySelector('[data-choix="panneau"]')!.addEventListener('click', () => basculer('panneau'))

/** L'assaut final d'une zone : le combat contre son vaisseau amiral ; gagné, la zone est libérée. */
function lancerAssaut(nom: string): void {
  const z = zone(nom)!
  cockpit.fermer()
  vueCombat.ouvrir({
    titre: `ASSAUT · ${z.amiral.toUpperCase()}`,
    zone: ZONES[z.systeme] ?? 1,
    amiral: { nom: z.amiral, planete: z.planete || nom === 'Triton' },
    surFin: (fin) => {
      const t = horloge()
      if (fin === 'victoire') { jeu.gagnerAssaut(nom, t); enregistrerPartie(); carteSale = true; return `${nom} est libérée ! Va le dire à la Résistance.` }
      jeu.casser('coque'); apresChangementDePanne()
      return 'La Coque est en panne. Répare, et retente l\'assaut quand tu veux : la résistance reste à 100 %.'
    },
  })
}

/** Attaquer un chasseur repéré (la vue de combat) : vaincu, il disparaît ; la retraite abîme la Coque. */
function combattre(alien: string): void {
  cockpit.fermer()
  vueCombat.ouvrir({
    titre: `COMBAT · ${alien.toUpperCase()}`,
    zone: ZONES[lieuIci(horloge())] ?? 1,
    surFin: (fin) => {
      const t = horloge()
      if (fin === 'victoire') { jeu.vaincreChasseur(alien, t); choisir(null); enregistrerPartie(); return 'Il ne reviendra pas de sitôt. Ses missiles en vol sont tombés avec lui.' }
      if (fin === 'retraite') { jeu.casser('coque'); apresChangementDePanne(); return 'La Coque est en panne : à réparer (un impact touchera deux blocs).' }
      return 'Il est toujours là : il peut encore tirer.'
    },
  })
}
/** Après une panne, une réparation ou un nouveau moteur : sauvegarde, et les trajets prévus se recalculent (vitesse, navigation). */
function apresChangementDePanne(): void {
  // En route, le trajet suit la vitesse du moteur : ralenti de moitié tant qu'il est en panne, de nouveau à pleine
  // vitesse une fois réparé (décision d'Adrien : un impact ralentit le trajet de 50 % jusqu'à réparation), et plus vite
  // avec un nouveau moteur (demande d'Adrien du 21/10/2026).
  const t = horloge()
  // Le moteur recalcule le trajet ; ici, on le redessine depuis là où la capsule est dessinée.
  const nouveau = jeu.suivreLeMoteur(t, vitesse())
  if (nouveau) dessinerDepart(nouveau, true, t)
  enregistrerPartie()
  voletMissions.oublierDurees()
  planAJour = 0
  apercuAJour = 0
  voletCapsule.afficher(jeu)
  carteSale = true
}
// Essai (Réglages) : provoquer une panne au hasard parmi les modules en état.
document.querySelector('#provoquer-panne')!.addEventListener('click', () => {
  const libres = MODULES.filter((f) => !jeu.enPanne(f.nom))
  if (!libres.length) return
  const f = libres[Math.floor(Math.random() * libres.length)]
  jeu.casser(f.nom)
  apresChangementDePanne()
  annoncer(`PANNE : ${f.titre} !`)
})

// Nouvelle version en ligne : le jeu se recharge tout seul (la partie est sauvegardée juste avant).
surveillerMisesAJour(enregistrerPartie)

// Appui long sur un symbole : son nom s'affiche un instant, au-dessus (décision d'Adrien du 20/10/2026). Le toucher qui
// a montré le nom ne déclenche pas le bouton qui contient le symbole.
const bulleSymbole = document.createElement('div')
bulleSymbole.id = 'nom-symbole'
bulleSymbole.hidden = true
document.body.append(bulleSymbole)
let appuiSymbole = 0, cacherSymbole = 0, nomMontre = false
document.addEventListener('pointerdown', (e) => {
  clearTimeout(appuiSymbole)
  nomMontre = false
  const s = (e.target as HTMLElement).closest<HTMLElement>('[data-symbole]')
  if (!s) return
  appuiSymbole = window.setTimeout(() => {
    bulleSymbole.textContent = s.dataset.symbole!
    bulleSymbole.hidden = false
    const r = s.getBoundingClientRect(), l = bulleSymbole.offsetWidth, h = bulleSymbole.offsetHeight
    bulleSymbole.style.left = `${Math.min(window.innerWidth - l - 8, Math.max(8, r.left + r.width / 2 - l / 2))}px`
    bulleSymbole.style.top = `${r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8}px`
    nomMontre = true
    clearTimeout(cacherSymbole)
    cacherSymbole = window.setTimeout(() => { bulleSymbole.hidden = true }, 1600)
  }, 450)
}, true)
for (const ev of ['pointerup', 'pointercancel', 'scroll']) document.addEventListener(ev, () => clearTimeout(appuiSymbole), true)
document.addEventListener('click', (e) => {
  if (!nomMontre) return
  nomMontre = false
  e.preventDefault()
  e.stopPropagation()
}, true)

// Sauvegarde aussi quand on quitte l'application (ou qu'elle passe en arrière-plan).
document.addEventListener('visibilitychange', () => { if (document.hidden) enregistrerPartie() })
window.addEventListener('pagehide', enregistrerPartie)

// Recommencer à zéro (dans Réglages) : la partie sauvegardée est effacée, après confirmation.
document.querySelector('#recommencer')!.addEventListener('click', async () => {
  if (!await confirmer({ titre: 'Tout effacer ?', texte: 'Crédits, moteur, soute, collections et position de la capsule seront perdus.', oui: 'RECOMMENCER', grave: true })) return
  partieEffacee = true
  try { localStorage.removeItem(CLE_SAUVEGARDE) } catch { /* rien */ }
  location.reload()
})

/** Nom et distance de la destination, pour son étiquette. */
function infosSelection(t: number): { nom: string; distance: string } | null {
  if (!selection) return null
  if (selection === CAPSULE) return { nom: `Capsule ${jeu.numeroSerie}`, distance: `cap. ${jeu.pseudo} · vous êtes ici` }
  return { nom: selection, distance: texteDistance(distanceDepuisCapsule(selection, t)) }
}

let precedent = performance.now()
let images = 0, debutCompte = precedent, tempsCalcul = 0
let dernierDessinCarte = 0
/** Vrai quand la carte doit être redessinée tout de suite (sélection, niveau, réglage changés). */
let carteSale = true
for (const evenement of ['pointerup', 'click', 'change']) document.addEventListener(evenement, () => { carteSale = true })
function image(maintenant: number): void {
  const debutCalcul = performance.now()
  const dt = Math.min(0.1, (maintenant - precedent) / 1000)
  precedent = maintenant
  avancerHorloge(maintenant)
  const t = horloge()
  const sel = infosSelection(t)
  prevoir(t, maintenant)
  avancerMissions(t)
  suivreEchos(t)
  mettreAJourFiche(t)
  montrerGainsXp()
  afficherPing(t)
  afficherRadar(t)
  vueRadio.afficher()
  afficherCadranVitesse(t)
  if (cockpit.pageOuverte === 'missions' && maintenant - dernierVolet > 1000) { afficherOngletJournal(); dernierVolet = maintenant }
  if (cockpit.pageOuverte === 'capsule') { voletCapsule.afficher(jeu); afficherReparation(); afficherSoute() }
  if (cockpit.pageOuverte === 'marche' && maintenant - dernierMarche > 1000) { afficherMarche(t); dernierMarche = maintenant }
  if (maintenant - dernierCourrier > 1000) { courrier(); dernierCourrier = maintenant }
  // Aperçu d'une mission : ses trajets, recalculés une fois par seconde (les lieux bougent).
  if (apercu && maintenant - apercuAJour > 1000) { apercuPlans = jeu.trajetsContrat(apercu, t, vitesse()); apercuAJour = maintenant }
  if (!message.hidden && maintenant > finMessage) message.hidden = true
  // Les quêtes : la ligne de la quête suivie, et les annonces (objectif atteint…), une à la fois.
  if (jeu.annoncesQuetes.length && message.hidden) { annoncer(jeu.annoncesQuetes.shift()!); enregistrerPartie() }
  // Un niveau gagné : sa fenêtre (demande d'Adrien du 21/10/2026), avec la capsule dessinée dans sa forme.
  if (jeu.niveauAAnnoncer && !jeu.liberationsAAnnoncer.length && !document.querySelector('div.plein:not([hidden]), .confirmation-jeu')) {
    const { niveau, avant } = jeu.niveauAAnnoncer
    jeu.niveauAAnnoncer = null
    const g = niveauGagne(niveau, avant)
    const toile = document.createElement('canvas')
    toile.width = toile.height = 240
    const c = toile.getContext('2d')!
    c.fillStyle = g.forme === 'legende' ? '#f6e3b0' : '#e8dfcb'
    c.fillRect(0, 0, 240, 240)
    dessinerVaisseau(c, 120, 120, -Math.PI / 2, g.forme, 70 / rayonVaisseau(g.forme, 1), '#e04b37', '#2b2138')
    navigator.vibrate?.([80, 60, 160])
    void feliciter({
      titre: `Niveau ${niveau} !`, portrait: `<img class="portrait" src="${toile.toDataURL()}" alt="${g.nomForme}">`,
      nom: jeu.pseudo, role: `capitaine niv. ${niveau} · ${g.nomForme.toLowerCase()}`,
      texte: [g.nouvelleForme ? `Ta capsule devient une ${g.nomForme.toLowerCase()} ! Tout le système la verra passer sur la carte.` : `Bravo, capitaine. Ta ${g.nomForme.toLowerCase()} prend un peu d'envergure sur la carte.`,
        g.prochain ? `Prochaine forme au niveau ${g.prochain.niveau} : ${g.prochain.nom.toLowerCase()}.` : 'Tu as atteint le sommet : la Légende, dorée.'],
      ouvre: [], bouton: 'EN AVANT !',
      // La fenêtre en couverture de pulp, le numéro du niveau en numéro de la revue.
      couverture: { numero: niveau, accroche: g.nouvelleForme ? 'Nouvelle forme !' : ['Il monte en grade !', 'Inédit !', 'Sensationnel !', 'Plus fort que jamais !'][niveau % 4] },
    })
  }
  // Une sonde disparue retrouvée : sa fenêtre, avec son histoire vraie.
  if (jeu.disparusAAnnoncer.length && !document.querySelector('div.plein:not([hidden]), .confirmation-jeu')) {
    const d = jeu.disparusAAnnoncer.shift()!
    navigator.vibrate?.([80, 60, 160])
    void feliciter({ titre: 'Retrouvée !', portrait: `<span class="portrait sonde">${SONDE}</span>`, nom: d.nom, role: `${d.qui} · ${d.annee}`,
      texte: [d.histoire, 'Elle rejoint ton classeur des Disparus (Plus › Collections).'], ouvre: [], bouton: 'AU CLASSEUR' })
  }
  // Une zone libérée : sa fenêtre, une fois le combat refermé (demande d'Adrien du 21/10/2026).
  if (jeu.liberationsAAnnoncer.length && !document.querySelector('div.plein:not([hidden]), .confirmation-jeu')) {
    const l = liberation(jeu.liberationsAAnnoncer.shift()!)
    navigator.vibrate?.([120, 80, 120, 80, 240])
    void feliciter({ titre: `${l.zone} libérée !`, portrait: medaillon(l.pnj, 'portrait'), nom: l.pnj.nom, role: l.pnj.role,
      texte: l.texte.map((x) => x.replaceAll('{joueur}', jeu.pseudo)), ouvre: l.ouvre, bouton: 'VIVE LA RÉSISTANCE !' })
  }
  // Une confirmation de la Bourse revenue à la capsule.
  if (jeu.annoncesBourse.length && message.hidden) {
    const o = jeu.annoncesBourse.shift()!, c = compagnie(o.compagnie)!
    const n = o.actions.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    annoncer(o.sens === 'acheter' ? `Bourse : ${n} actions ${c.nom} achetées à ${Math.round(o.prix!).toLocaleString('fr-FR')}`
      : `Bourse : ${n} actions ${c.nom} vendues, ${(o.gain ?? 0) >= 0 ? '+' : '−'}${Math.abs(o.gain ?? 0).toLocaleString('fr-FR')} cr. de ${(o.gain ?? 0) >= 0 ? 'gain' : 'perte'}`)
    enregistrerPartie()
  }
  const accent = '#d9694f'
  // Les deux traits : le trajet (en cours, ou prévu vers la destination) et le point de rendez-vous.
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  const planTrace = apercu ? apercuPlans?.[0] ?? null : prevision?.possible ? prevision.plan : enRoute
  // Aperçu d'une livraison : le second trajet (de la station au satellite), dessiné aussi.
  const autresTraces = apercu && apercuPlans ? apercuPlans.slice(1).map((p) => projeterTrajet(p, t)) : []
  // En route : la capsule avance à vitesse régulière sur le trajet dessiné ; on ne dessine que ce qui reste.
  const traceEnRoute = enRoute ? projeterTrajet(enRoute, t, departDessine(enRoute, t)) : null
  let capsuleDessinee: Point2 | null = null
  let trace: Point2[] | null = null
  let trajet: Point2[] | null = null
  if (traceEnRoute && enRoute && planTrace === enRoute) {
    const coupe = couperTrace(traceEnRoute, avancement(enRoute, t))
    capsuleDessinee = coupe.point
    trace = traceEnRoute
    trajet = coupe.reste
  } else if (planTrace) {
    // Nouveau cap proposé en route : la capsule reste sur le trajet en cours, le nouveau part de là où elle est dessinée.
    if (traceEnRoute && enRoute) capsuleDessinee = couperTrace(traceEnRoute, avancement(enRoute, t)).point
    trace = projeterTrajet(planTrace, t, capsuleDessinee ?? undefined)
    trajet = trace
  }
  derniereCapsuleDessinee = capsuleDessinee
  const rendezVous = trace ? trace[trace.length - 1] : null
  // La carte bouge lentement : sans geste en cours, on la redessine dix fois par seconde (économie de batterie) ; à
  // chaque image tant que le radar tourne ou que ses échos s'effacent.
  // (Les ondes d'un PING en attente d'écho aussi : elles doivent filer en douceur.)
  const radarAnime = jeu.radar.actif || t - jeu.radar.fin < EFFACEMENT_RADAR || jeu.feux.length > 0 || !!echoEnRoute(jeu.monolithes, t)
  // Le Soleil dessiné en grand s'anime (demande d'Adrien du 21/10/2026) : on redessine alors à chaque image.
  const carteAJour = !gestesCarte.actif && !carte.enVol && !carteSale && !radarAnime && !soleilAnime && acceleration === 1 && maintenant - dernierDessinCarte < 100
  if (!carteAJour) {
    dernierDessinCarte = maintenant
    carteSale = false
    gestesCarte.avancer(dt)
    // La caméra suit ce qu'on regarde (en route, la capsule est là où elle est dessinée sur son trajet).
    capsuleSurCarte = capsuleDessinee
    carte.placerCamera(selection && suivre ? positionSuivie(t) : null, maintenant)
    // La capsule pointe le long du trajet tel qu'il est dessiné (premier tronçon visible à l'écran).
    let direction: { x: number; y: number } | null = null
    if (trajet && trajet.length > 1) {
      const q0 = carte.ecranDe(trajet[0])
      for (const p of trajet.slice(1)) {
        const q = carte.ecranDe(p)
        if (Math.hypot(q.x - q0.x, q.y - q0.y) > 6) { direction = { x: q.x - q0.x, y: q.y - q0.y }; break }
      }
    }
    // En vol, l'épave remorquée ou le convoi escorté suivent la capsule (demande d'Adrien du 21/10/2026).
    const enVol = mission.phase(t) === 'trajet', etapeEnCours = jeu.etapeActuelle()?.action
    carte.sillage = enVol && etapeEnCours === 'larguer' ? 'epave' : enVol && etapeEnCours === 'escorter' ? 'convoi' : null
    oublierSoleilAnime()
    const place = carte.dessiner(ctxPlan, t, reglages, { encre: th.encre, fond: th.halo }, selection, direction, capsuleDessinee)
    if (reglages.grille) carte.dessinerEchelle(ctxPlan, { encre: th.encre, fond: th.halo }, texteDistance)
    // Décalage de la capsule dessinée par rapport à sa vraie place sur la carte (voir decalageCapsule).
    const dessinee = carte.place(CAPSULE)
    if (dessinee) {
      const brut = carte.ecranDe(capsuleDessinee ?? carte.positionCapsule(t))
      decalageCapsule = { x: (dessinee.x - brut.x) * carte.kmParPx, y: -(dessinee.y - brut.y) * carte.kmParPx }
    }
    // Le système qu'on regarde, écrit sur son bouton (« TERRE », « SOLAIRE » pour la vue générale).
    const regarde = carte.systemeRegarde(t)
    const titreCarte = regarde === 'Soleil' ? 'SOLAIRE' : regarde.toUpperCase()
    if (titre.textContent !== titreCarte) titre.textContent = titreCarte
    // Pointillé vers la destination (sa position actuelle), une fois le trajet proposé.
    const cibleIci = proposee && place && selection !== CAPSULE && !dejaLa(t) ? place : null
    // Orbite de la capsule autour de son astre.
    const o = mission.orbiteActuelle(t)
    const orbiteCapsule = o && !corps(o.centre)?.tailleM
      ? Array.from({ length: 97 }, (_, k) => { const tk = t + (k / 96) * periode(o) * 1000; return { t: tk, r: mission.etat(tk).position } })
      : null
    carte.dessinerTraits(ctxPlan, t, cibleIci, trajet, rendezVous, accent, { encre: th.encre, fond: th.halo }, orbiteCapsule)
    // Les PNJ, leurs signes, et l'objectif de la quête suivie.
    const suivie = jeu.queteSuivie ? quete(jeu.queteSuivie) : null, lieuObjectif = suivie ? objectif(jeu, suivie)?.lieu ?? null : null
    carte.dessinerPnj(ctxPlan, t, PNJS.map((p) => {
      const s = signePnj(jeu, p.id)
      return { lieu: p.lieu, initiale: p.nom.replace(/^(Dr|Le|La) /, '')[0], teinte: p.teinte, signe: s?.signe ?? null, principale: s?.principale ?? false }
    }), lieuObjectif ? { lieu: lieuObjectif, principale: suivie!.type === 'principale' } : null, { encre: th.encre, fond: th.halo })
    // Les feux d'artifice des zones libérées (2 minutes).
    const feux = jeu.feuxEnCours(t)
    if (feux.length) carte.dessinerFeux(ctxPlan, feux)
    // Les échos des PING : leurs cercles, et les places possibles des monolithes (pas les localisés : ils sont dessinés).
    if (reglages.cercles && jeu.monolithes.echos.length) {
      const revenus = echosRevenus(jeu.monolithes, t)
      const places = monolithesEcoutes(jeu.monolithes, t).map((n) => placesPossibles(jeu.monolithes, n, t)).filter((p) => p.length > 1).flat()
      carte.dessinerEchos(ctxPlan, t, revenus.map((x) => ({ numero: x.monolithe, centre: x.centre, rayon: x.rayon })), places, { encre: th.encre, fond: th.halo })
    }
    for (const tr of autresTraces) carte.dessinerTraits(ctxPlan, t, null, tr, tr[tr.length - 1], accent, { encre: th.encre, fond: th.halo })
    // Un PING envoyé : des ondes violettes partent de la capsule jusqu'au retour de l'écho (demande d'Adrien du 22/10/2026).
    const capsuleIci = carte.place(CAPSULE)
    if (capsuleIci && echoEnRoute(jeu.monolithes, t)) carte.dessinerOndesPing(ctxPlan, capsuleIci.x, capsuleIci.y, performance.now())
    // Les missiles aliens en vol, avec leur décompte.
    if (jeu.espace.missiles.length) {
      carte.dessinerMissiles(ctxPlan, t, jeu.espace.missiles.map((m) => {
        const s = Math.max(0, Math.ceil((m.impact - t) / 1000))
        return { alien: m.alien, fraction: Math.min(1, (t - m.lance) / (m.impact - m.lance)), decompte: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
      }), { encre: th.encre, fond: th.halo })
    }
    let boiteEtiquette: Boite | null = null
    // Points que l'étiquette de la destination ne doit pas cacher : le rendez-vous, la capsule.
    const eviter: { x: number; y: number }[] = []
    if (rendezVous) eviter.push(carte.ecranDe(rendezVous))
    const ici = carte.place(CAPSULE)
    if (ici) eviter.push(ici)
    if (place && sel) {
      // Destination qui tourne autour d'un autre astre que celui qu'on regarde : on le précise (« Titan (Saturne) »).
      const parent = corps(selection!)?.parent
      const nom = parent && parent !== carte.systemeRegarde(t) ? `${sel.nom} (${parent})` : sel.nom
      boiteEtiquette = dessinerReperes(ctxPlan, largeur, hauteur, place.x, place.y, place.r, place.visible, nom, sel.distance, reglages,
        { encre: th.encre, fond: th.halo, accent }, eviter)
    }
    // La plaque de la capsule et les noms, en dernier : là où rien d'autre n'est posé (demande d'Adrien du 21/10/2026).
    carte.dessinerNoms(ctxPlan, { encre: th.encre, fond: th.halo }, selection, [...(boiteEtiquette ? [boiteEtiquette] : []), ...zonesCommandes])
  }
  images++
  tempsCalcul += performance.now() - debutCalcul
  if (maintenant - debutCompte > 500) {
    const ips = Math.round((images * 1000) / (maintenant - debutCompte))
    const ms = Math.round(tempsCalcul / images)
    images = 0
    tempsCalcul = 0
    debutCompte = maintenant
    const avance = t - Date.now()
    // Heure du lieu du joueur (fuseau du téléphone) ; le moteur, lui, compte en temps universel.
    const heure = new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })
    infos.textContent = `${heure} · ${ips} i/s · ${ms} ms · v${__VERSION__}`
      + (acceleration > 1 || avance > 60_000 ? ` · temps ×${acceleration.toLocaleString('fr')} (+${texteDuree(avance)})` : '')
  }
  requestAnimationFrame(image)
}
requestAnimationFrame(image)

// L'écran de chargement en couverture de pulp (Adrien, 22/10/2026) : le numéro de la revue (le nombre de jours depuis
// le lancement du jeu), une accroche au hasard ; il s'efface une fois le jeu prêt, ou en le touchant.
{
  const couverture = document.querySelector<HTMLElement>('#couverture')
  if (couverture) {
    const UNES = ['L\'invasion venue des étoiles !', 'Seul contre les chasseurs furtifs !', 'Le secret de Triton enfin révélé ?', 'Mille monolithes dans la nuit !',
      'Des voix perdues sur les ondes courtes !', 'Panne sèche au bord du Soleil !', 'La Résistance a besoin de vous !', 'Pirates sur l\'orbite de Mars !']
    const jours = Math.max(1, Math.floor((Date.now() - Date.UTC(2026, 9, 17)) / 86_400_000))
    document.querySelector('#numero-revue')!.textContent = `N° ${jours} · 25 cents`
    document.querySelector('#une-revue')!.textContent = UNES[Math.floor(Math.random() * UNES.length)]
    const effacer = () => { couverture.classList.add('effacee'); setTimeout(() => couverture.remove(), 600) }
    couverture.addEventListener('click', effacer)
    setTimeout(effacer, 2200)
  }
}

// Pour les essais : window.andromeda dans la console.
Object.assign(window, {
  andromeda: {
    horloge: () => horloge(),
    // Essais : les Voix perdues qui émettent en ce moment dans le système de la capsule (numéro, fréquence).
    voix: () => VOIX.filter((v) => v.systeme === systemeDeLaCapsule(horloge()) && emet(v, horloge())).map((v) => ({ numero: v.numero, frequence: v.frequence })),
    // Essais : la réponse du manuel pour le tour en cours de la réparation d'un module.
    solution: (a: NomAppareil) => {
      const r = jeu.reparation(a)
      if (!r) return null
      if (a === 'bornier') return solution(tourEnergieVu(r.graine, r.tour, jeu.pressionForcee()), jeu.numeroSerie)
      if (a === 'telegraphe') return tourTelegraphe(r.graine, r.tour)
      if (a === 'antenne') return angleAttendu(tourAntenne(r.graine, r.tour))
      if (a === 'chiffreur') return ordreChiffreur(tourChiffreur(r.graine, r.tour))
      if (a === 'fusibles') return calibreAttendu(tourFusibles(r.graine, r.tour))
      if (a === 'leviers') return COMBINAISONS[tourLeviers(r.graine, r.tour).symbole].map((h) => (h ? 'H' : 'B')).join(' ')
      if (a === 'soupape') return zonePurge(tourSoupape(r.graine, r.tour).temperature)
      if (a === 'injecteurs') return injecteursACouper(tourInjecteurs(r.graine, r.tour)).map((i) => `J${i + 1}`)
      if (a === 'constellation') { const c = CONSTELLATIONS[tourConstellation(r.graine, r.tour).constellation]; return `${c.nom} : AZ ${c.azimut}°, HT ${c.hauteur}°` }
      if (a === 'gyroscope') return { ordre: ordreGyro(jeu.numeroSerie).map((i) => ANNEAUX[i].titre), angles: [0, 1, 2].map((i) => angleAnneau(r, i, horloge())) }
      if (a === 'calculateur') { const c = CODES_CALCUL[tourCalculateur(r.graine, r.tour).code]; return { interrupteurs: c.interrupteurs.map((h) => (h ? 'H' : 'B')).join(' '), astres: c.astres.map((i) => ASTRES[i]).join(' ') } }
      if (a === 'vannes') return CRANS_PAR_PRESSION[tourVannes(r.graine, r.tour).pression - 1]
      if (a === 'breche') return FISSURES[tourBreche(r.graine, r.tour).fissure].ordre.map((i) => RIVETS[i])
      if (a === 'sas') return tourSas(r.graine, r.tour).messages.map((m) => MESSAGES_SAS[m].interrupteur)
      if (a === 'accumulateurs') return ordreCouplage(tourAccumulateurs(r.graine, r.tour)).map((i) => BORNES[i])
      return null
    },
    carte, mission, jeu, choisir: (n: string) => choisir(n, true), allerA: (n: string) => { choisir(n, true); proposee = true },
    accelerer: (k: number) => { acceleration = k },
    // Essais : l'assaut final d'une zone (son vaisseau amiral).
    assaut: (z: string) => lancerAssaut(z),
    // Essais : la manœuvre d'amarrage, sans mission.
    amarrage: () => vueAmarrage.ouvrir({ titre: 'ESSAI', surFin: () => 'Essai : rien n\'est livré.' }),
    depannage: () => vueDepannage.ouvrir({ titre: 'ESSAI', surFin: () => 'Essai : rien n\'est validé.' }),
    remorquage: () => vueRemorquage.ouvrir({ titre: 'ESSAI', surFin: () => 'Essai : rien n\'est remorqué.' }),
    invitation: (m: Maison = 'nettoyeurs') => vueInvitation.ouvrir([m]),
    escorte: (zone = 1) => vueEscorte.ouvrir({ titre: 'ESSAI', zone, surFin: () => 'Essai : aucun convoi réel.' }),
    largage: () => vueLargage.ouvrir({ titre: 'ESSAI', surFin: () => 'Essai : rien n\'est déposé.' }),
    convoi: () => vueConvoi.ouvrir({ titre: 'ESSAI', surFin: () => 'Essai : aucun convoi réel.' }),
    etatConvoi: () => (vueConvoi as unknown as { etat: unknown }).etat,
  },
})
