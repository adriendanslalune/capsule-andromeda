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
import { afficherBandeau } from './commun/bandeau'
import { Cockpit } from './commun/cockpit'
import { surveillerMisesAJour } from './commun/mise-a-jour'
import { ACTIONS_FINIES, GENRES_COURTS, NOMS_ACTIONS, VERBES, texteSecondes, titreContrat } from './commun/textes-missions'
import { MODULES, type NomModule } from './donnees/modules'
import { ouvrirFenetreMoteur } from './commun/fenetre-moteur'
import { VoletCapsule, htmlSoute } from './commun/volet-capsule'
import { VoletMarche } from './commun/volet-marche'
import { CAPACITE_SOUTE } from './donnees/marche'
import { htmlManuel } from './commun/manuel'
import { Panneau, type EtatPanneau } from './commun/panneau'
import { gesteDuBouton, htmlCommandes } from './commun/commandes'
import { APPAREILS_PRETS, BLOCS, blocDe, repere, TITRES_APPAREILS, type NomAppareil } from './donnees/blocs'
import { FREQUENCES, STATIONS, texteFrequence } from './donnees/manuel-communications'
import {
  angleAttendu, frequenceReglee, ordreChiffreur, sequenceMorse, tourAntenne, tourChiffreur, tourTelegraphe,
} from './moteur/communications'
import { solution, tourEnergie, type EtatReparation, type Resultat } from './moteur/reparation'
import { VoletMissions } from './commun/volet-missions'
import { texteDate, texteDuree } from './commun/textes'
import { CAPSULE, Carte2D } from './carte/carte'
import { couperTrace, projeterCorps, projeterTrajet, type Point2 } from './carte/loupe'
import { Gestes } from './commun/gestes'
import { dessinerReperes } from './commun/reperes'
import { periode, suivreMission } from './moteur/capsule'
import { astreDominant, corps } from './moteur/corps'
import { Jeu } from './moteur/jeu'
import { restaurer, sauvegarder } from './moteur/sauvegarde'
import type { Contrat } from './moteur/contrats'
import { avancement, planifier, type Plan, type Planification } from './moteur/mission'
import { distanceDepuisCapsule, texteDistance } from './moteur/navigation'
import { lignesDuBandeau } from './moteur/bandeau'
import { chargerPoussiere } from './moteur/poussiere'

const toilePlan = document.querySelector<HTMLCanvasElement>('#plan')!
const ctxPlan = toilePlan.getContext('2d')!
const infos = document.querySelector<HTMLDivElement>('#infos')!
const titre = document.querySelector<HTMLDivElement>('#titre')!
const boutonRetour = document.querySelector<HTMLButtonElement>('#bouton-retour')!

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
import('./donnees/poussiere').then((d) => { chargerPoussiere(d.POUSSIERE, d.REFERENCE_POUSSIERE); carteSale = true })
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
const jeu = chargerPartie() ?? nouvellePartie()
const mission = jeu.mission
suivreMission(mission)

const carte = new Carte2D()
let largeur = 390, hauteur = 844
let selection: string | null = null
/** Vrai si la caméra suit ce qui est choisi (faux une fois qu'on a fait glisser la carte). */
let suivre = true
/** Glissement d'un doigt depuis le début du geste (px) : un petit glissement ne lâche pas ce qu'on suit. */
let glisseCumul = 0
/** Encre et fond de la carte : style Moebius, fond blanc cassé le jour, bleu nuit en mode nuit. */
const THEMES = { jour: { encre: '#1f1b18', halo: '#f4f1ea' }, nuit: { encre: '#efe6d2', halo: '#141826' } }
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
    const k = echelle ?? (cadrer && c?.parent ? carte.echelleSysteme(c.parent) : carte.kmParPx)
    carte.voler(k, performance.now(), positionSuivie(horloge()))
  }
}

boutonRetour.addEventListener('click', () => {
  choisir(null)
  carte.voler(carte.echelleGenerale(), performance.now(), { x: 0, y: 0 }, true)
})

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
function allerALaCapsule(animer = true): void {
  const t = horloge()
  const ou = astreDominant(mission.etat(t).position, t)
  const k = ou === 'Soleil' ? carte.echelleGenerale() : carte.echelleSysteme(ou)
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
document.querySelector('#bouton-capsule')!.addEventListener('click', () => allerALaCapsule())

// Le cockpit : barre d'onglets et volets. Choisir un astre dans le volet Navigation referme le volet.
const cockpit = new Cockpit((page) => {
  if (page === 'navigation') cadran.afficher(selection)
  if (page === 'missions') voletMissions.afficher(jeu, horloge(), vitesse(), performance.now())
  if (page === 'capsule') voletCapsule.afficher(jeu)
  if (page === 'marche') voletMarche.afficher(jeu, horloge())
})
const cadran = new Cadran(document.querySelector<HTMLDivElement>('#cadran')!, (nom) => { choisir(nom, true); cockpit.fermer() }, horloge)
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
let prevision: Planification | null = null
/** Ce que fait le bouton de la fiche : partir (Y ALLER, DÉPART) ou l'action de la mission (RÉPARER…). */
let actionFiche: 'depart' | 'agir' | 'accepter' = 'depart'
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
  const ligne = (e.target as HTMLElement).closest<HTMLElement>('[data-ligne]')?.dataset.ligne
  if (ligne === 'panne') {
    // Un bloc qui se répare sur le panneau, sinon l'onglet ÉTAT (réparation provisoire).
    const bloc = jeu.pannes.find((b) => !jeu.reparationProvisoire(b))
    if (bloc) montrerReparation(bloc)
    else { cockpit.ouvrir('capsule'); choisirSousOnglet('etat') }
  } else if (ligne === 'contrat') cockpit.ouvrir('missions')
  else if (ligne === 'trajet' || ligne === 'orbite') cockpit.ouvrir('navigation')
  else if (ligne === 'etat') { cockpit.ouvrir('capsule'); choisirSousOnglet('etat') }
})

function mettreAJourFiche(t: number): void {
  afficherBandeau(bandeau, lignesDuBandeau(jeu, t),
    { credits: jeu.credits, soute: `0/${CAPACITE_SOUTE}`, niveauMoteur: jeu.niveauMoteur, vitesse: vitesse(), vitesseForcee: reglages.forcerVitesse }, t)
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  // La situation de la capsule (en route, en orbite) est dans le bandeau d'alertes ; la fiche ne parle que de la
  // destination choisie.
  let texte = '', depart = false, libelle = 'DÉPART'
  actionFiche = 'depart'
  const etape = jeu.etapeActuelle(), fin = jeu.finAction()
  if (selection && !dejaLa(t) && enRoute?.cible !== selection && !jeu.peutNaviguer() && !apercu) {
    // Navigation en panne : impossible de calculer un trajet.
    texte = `<b>${selection.toUpperCase()}</b> · à ${texteDistance(distanceDepuisCapsule(selection, t))}<br>NAVIGATION EN PANNE : impossible de calculer un trajet`
  } else if (apercu) {
    // Aperçu d'une mission : son titre, son temps de trajet, sa récompense, et ACCEPTER.
    const duree = apercuPlans ? apercuPlans.reduce((s, p) => s + p.arrivee - p.depart, 0) : null
    texte = `<b>APERÇU · ${GENRES_COURTS[apercu.genre]}</b> · ${apercu.recompense} crédits<br>${titreContrat(apercu)}<br>`
      + (duree === null ? 'hors de portée' : `trajet ${texteDuree(duree)}`)
      + (jeu.enCours ? ' · une mission est déjà en cours' : '')
    if (!jeu.enCours && duree !== null) { depart = true; libelle = 'ACCEPTER'; actionFiche = 'accepter' }
  } else if (etape && (fin !== null || jeu.peutAgir(t)) && (!selection || dejaLa(t) || selection === etape.lieu)) {
    // Sur le lieu de la mission : le bouton de l'action (RÉPARER, LIVRER…), puis le temps qui reste.
    texte = `<b>${etape.lieu.toUpperCase()}</b> · mission<br>${titreContrat(jeu.enCours!.contrat)}`
    if (fin !== null) texte += `<br>${NOMS_ACTIONS[etape.action]} en cours · ${texteSecondes(fin - t)}`
    else { depart = true; libelle = VERBES[etape.action]; actionFiche = 'agir' }
  } else if (selection && !dejaLa(t) && enRoute?.cible !== selection && !proposee) {
    // Fiche de l'astre touché : rien ne change tant qu'on n'appuie pas sur Y ALLER.
    texte = `<b>${selection.toUpperCase()}</b><br>à ${texteDistance(distanceDepuisCapsule(selection, t))}`
    depart = true
    libelle = 'Y ALLER'
  } else if (selection && !dejaLa(t) && enRoute?.cible !== selection && prevision) {
    const dv = `${vitesse()} km/s`
    if (prevision.possible) {
      const p = prevision.plan
      texte = `<b>${selection.toUpperCase()}</b> · trajet ${texteDuree(p.arrivee - p.depart)}<br>arrivée le ${texteDate(p.arrivee)} · moteurs ${dv}`
      depart = true
      libelle = enRoute ? 'NOUVEAU CAP' : 'DÉPART'
    } else {
      texte = `<b>${selection.toUpperCase()}</b> · hors de portée<br>elle s'éloigne plus vite que la capsule (moteurs ${dv})`
    }
  }
  fiche.hidden = !texte
  if (ficheTexte.innerHTML !== texte) ficheTexte.innerHTML = texte
  boutonDepart.hidden = !depart
  boutonDepart.textContent = libelle
  document.body.classList.toggle('avec-trajet', !!texte)
}

boutonDepart.addEventListener('click', () => {
  const t = horloge()
  if (actionFiche === 'agir') { agirMission(); return }
  if (actionFiche === 'accepter') { accepterMission(apercu!.id); return }
  if (!jeu.peutNaviguer()) return
  if (!selection || dejaLa(t)) return
  if (!proposee) { proposee = true; planAJour = 0; return }
  // On recalcule au moment exact du départ.
  const p = planifier(mission.etatHeliocentrique(t), selection, t, vitesse())
  if (!p.possible) return
  mission.partir(p.plan)
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
    const accroche = selection !== null && suivre
    if (pince) { if (!accroche) carte.glisser(dx, dy); return }
    if (accroche) {
      glisseCumul += Math.hypot(dx, dy)
      if (glisseCumul < 15) return
      suivre = false
    }
    carte.glisser(dx, dy)
  },
  zoomer: (f, sx, sy) => carte.zoomer(f, sx, sy),
  toucher: (x, y) => {
    const nom = carte.toucher(x, y)
    // Toucher un endroit vide retire le choix (et ferme l'aperçu d'une mission).
    choisir(nom)
  },
})

document.addEventListener('gesturestart', (e) => e.preventDefault())

// --- Missions (« contrats » dans le moteur) : volet, action sur place, messages.
const message = document.querySelector<HTMLDivElement>('#message')!
let finMessage = 0
function annoncer(texte: string): void {
  message.textContent = texte
  message.hidden = false
  finMessage = performance.now() + 4000
}
function agirMission(): void {
  if (jeu.agir(horloge())) { enregistrerPartie(); carteSale = true; dernierVolet = 0 }
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
const voletMissions = new VoletMissions(document.querySelector<HTMLDivElement>('#missions')!, {
  accepter: accepterMission,
  voir: (id) => {
    const c = jeu.proposes.find((p) => p.id === id)
    if (!c) return
    cockpit.fermer()
    choisir(c.etapes[0].lieu, true)
    apercu = c
    apercuAJour = 0
  },
  allerA: (lieu) => { cockpit.fermer(); choisir(lieu, true); proposee = true; planAJour = 0 },
  agir: agirMission,
  abandonner: () => {
    if (!confirm('Abandonner la mission en cours ?')) return
    jeu.abandonner()
    enregistrerPartie()
    dernierVolet = 0
  },
})
/** Fait avancer les missions (actions finies, récompenses) et prévient le joueur. */
function avancerMissions(t: number): void {
  const evenements = jeu.avancer(t, vitesse())
  for (const e of evenements) {
    if (e.genre === 'contrat-fini') annoncer(`Mission terminée : +${e.contrat.recompense} crédits`)
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
    else if (e.genre === 'panne') {
      annoncer(`PANNE : ${MODULES.find((f) => f.nom === e.module)!.titre} !`)
      apresChangementDePanne()
    }
  }
  if (evenements.length) enregistrerPartie()
}
let dernierVolet = 0
let dernierMarche = 0

// Volet Capsule : acheter le moteur suivant (après confirmation) ; les trajets prévus se recalculent à la nouvelle vitesse.
const voletCapsule = new VoletCapsule(document.querySelector<HTMLDivElement>('#capsule')!, () => {
  const m = jeu.moteurSuivant()
  if (!m) return
  // La belle fenêtre « Nouveau moteur » (demande d'Adrien du 18/10/2026) : elle confirme, puis montre l'installation.
  ouvrirFenetreMoteur(jeu.moteur(), m, () => {
    if (!jeu.acheterMoteur()) return false
    enregistrerPartie()
    voletMissions.oublierDurees()
    planAJour = 0
    apercuAJour = 0
    voletCapsule.afficher(jeu)
    return true
  })
}, (m) => {
  jeu.reparer(m)
  apresChangementDePanne()
}, (m) => montrerReparation(m))

// --- Réparation (volet Capsule › RÉPARATION) et Manuel (étape 4) ---
const zoneReparation = document.querySelector<HTMLDivElement>('#reparation')!
const etatReparation = document.querySelector<HTMLSpanElement>('#etat-reparation')!
type SousOnglet = 'etat' | 'soute' | 'reparation'
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
/** Ce que le panneau doit montrer (le moteur du jeu le décide). */
function etatPanneau(t: number): EtatPanneau {
  const secondes = (r: EtatReparation | null) => r ? Math.max(0, Math.ceil((r.blocageJusqua - t) / 1000)) : 0
  const b = jeu.reparation('bornier'), te = jeu.reparation('telegraphe'), an = jeu.reparation('antenne'), ch = jeu.reparation('chiffreur')
  const tourAn = an ? tourAntenne(an.graine, an.tour) : null
  return {
    pannes: jeu.pannes,
    defauts: BLOCS.flatMap((f) => jeu.defauts[f.bloc] ?? []),
    energie: b ? { tour: tourEnergie(b.graine, b.tour), coupes: b.coupes, bloque: secondes(b), numero: b.tour, tours: b.tours }
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
    annoncer(jeu.enPanne(bloc.bloc) ? `${repere(a)} · ${TITRES_APPAREILS[a]} réparé ! Reste : ${jeu.defauts[bloc.bloc]!.map(repere).join(', ')}` : `Bloc ${bloc.titre} réparé !`)
    moduleOuvert = null
    panneauReparation.choisir(null)
    apresChangementDePanne()
  }
  enregistrerPartie()
  afficherReparation()
}
function choisirSousOnglet(s: SousOnglet): void {
  sousOnglet = s
  for (const b of document.querySelectorAll<HTMLElement>('[data-sous]')) b.classList.toggle('actif', b.dataset.sous === s)
  document.querySelector<HTMLDivElement>('#capsule')!.hidden = s !== 'etat'
  zoneReparation.hidden = s !== 'reparation'
  pageSoute.hidden = s !== 'soute'
  if (s === 'reparation') afficherReparation()
  afficherSoute()
}
/** L'onglet SOUTE du volet Capsule. */
const pageSoute = document.querySelector<HTMLDivElement>('#soute')!
function afficherSoute(): void {
  if (sousOnglet !== 'soute') return
  const html = htmlSoute(jeu)
  if (pageSoute.innerHTML !== html) pageSoute.innerHTML = html
}
// Volet Marché : les cours, rafraîchis chaque seconde tant qu'il est ouvert (le délai de la lumière change).
const voletMarche = new VoletMarche(document.querySelector<HTMLDivElement>('#marche')!, () => voletMarche.afficher(jeu, horloge()))
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
zoneReparation.querySelector('[data-choix="manuel"]')!.addEventListener('click', () => cockpit.ouvrir('manuel'))
const pageManuel = document.querySelector<HTMLDivElement>('#manuel')!
pageManuel.innerHTML = '<button type="button" class="retour" data-page="plus">‹ Plus</button>' + htmlManuel()
pageManuel.querySelector('[data-choix="panneau"]')!.addEventListener('click', () => montrerReparation())

/** Après une panne ou une réparation : sauvegarde, et les trajets prévus se recalculent (vitesse, navigation). */
function apresChangementDePanne(): void {
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

// Sauvegarde aussi quand on quitte l'application (ou qu'elle passe en arrière-plan).
document.addEventListener('visibilitychange', () => { if (document.hidden) enregistrerPartie() })
window.addEventListener('pagehide', enregistrerPartie)

// Recommencer à zéro (dans Réglages) : la partie sauvegardée est effacée, après confirmation.
document.querySelector('#recommencer')!.addEventListener('click', () => {
  if (!confirm('Recommencer à zéro ? Crédits, moteur et position de la capsule seront perdus.')) return
  partieEffacee = true
  try { localStorage.removeItem(CLE_SAUVEGARDE) } catch { /* rien */ }
  location.reload()
})

/** Nom et distance de la destination, pour son étiquette. */
function infosSelection(t: number): { nom: string; distance: string } | null {
  if (!selection) return null
  if (selection === CAPSULE) return { nom: CAPSULE, distance: 'vous êtes ici' }
  return { nom: selection, distance: texteDistance(distanceDepuisCapsule(selection, t)) }
}

let precedent = performance.now()
let images = 0, debutCompte = precedent
let dernierDessinCarte = 0
/** Vrai quand la carte doit être redessinée tout de suite (sélection, niveau, réglage changés). */
let carteSale = true
for (const evenement of ['pointerup', 'click', 'change']) document.addEventListener(evenement, () => { carteSale = true })
function image(maintenant: number): void {
  const dt = Math.min(0.1, (maintenant - precedent) / 1000)
  precedent = maintenant
  avancerHorloge(maintenant)
  const t = horloge()
  const sel = infosSelection(t)
  prevoir(t, maintenant)
  avancerMissions(t)
  mettreAJourFiche(t)
  if (cockpit.pageOuverte === 'missions' && maintenant - dernierVolet > 1000) { voletMissions.afficher(jeu, t, vitesse(), maintenant); dernierVolet = maintenant }
  if (cockpit.pageOuverte === 'capsule') { voletCapsule.afficher(jeu); afficherReparation(); afficherSoute() }
  if (cockpit.pageOuverte === 'marche' && maintenant - dernierMarche > 1000) { voletMarche.afficher(jeu, t); dernierMarche = maintenant }
  // Aperçu d'une mission : ses trajets, recalculés une fois par seconde (les lieux bougent).
  if (apercu && maintenant - apercuAJour > 1000) { apercuPlans = jeu.trajetsContrat(apercu, t, vitesse()); apercuAJour = maintenant }
  if (!message.hidden && maintenant > finMessage) message.hidden = true
  const accent = '#d9694f'
  // Les deux traits : le trajet (en cours, ou prévu vers la destination) et le point de rendez-vous.
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  const planTrace = apercu ? apercuPlans?.[0] ?? null : prevision?.possible ? prevision.plan : enRoute
  // Aperçu d'une livraison : le second trajet (de la station au satellite), dessiné aussi.
  const autresTraces = apercu && apercuPlans ? apercuPlans.slice(1).map((p) => projeterTrajet(p, t)) : []
  const trace = planTrace ? projeterTrajet(planTrace, t) : null
  let trajet = trace
  // En route : la capsule avance à vitesse régulière sur le trajet dessiné ; on ne dessine que ce qui reste.
  let capsuleDessinee = null
  if (trace && enRoute && planTrace === enRoute) {
    const coupe = couperTrace(trace, avancement(enRoute, t))
    capsuleDessinee = coupe.point
    trajet = coupe.reste
  } else if (trace && enRoute) {
    // Nouveau cap proposé en route : la capsule reste sur le trajet en cours, le nouveau part de là où elle est dessinée.
    capsuleDessinee = couperTrace(projeterTrajet(enRoute, t), avancement(enRoute, t)).point
    trajet = [capsuleDessinee, ...trace.slice(1)]
  }
  const rendezVous = trace ? trace[trace.length - 1] : null
  // La carte bouge lentement : sans geste en cours, on la redessine dix fois par seconde (économie de batterie).
  const carteAJour = !gestesCarte.actif && !carte.enVol && !carteSale && acceleration === 1 && maintenant - dernierDessinCarte < 100
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
    const place = carte.dessiner(ctxPlan, t, reglages, { encre: th.encre, fond: th.halo }, selection, direction, capsuleDessinee)
    // Décalage de la capsule dessinée par rapport à sa vraie place sur la carte (voir decalageCapsule).
    const dessinee = carte.place(CAPSULE)
    if (dessinee) {
      const brut = carte.ecranDe(capsuleDessinee ?? carte.positionCapsule(t))
      decalageCapsule = { x: (dessinee.x - brut.x) * carte.kmParPx, y: -(dessinee.y - brut.y) * carte.kmParPx }
    }
    // Titre : le système qu'on regarde ; bouton de retour à la vue générale quand on a zoomé sur un système.
    const titreCarte = carte.titre(t)
    if (titre.textContent !== titreCarte) titre.textContent = titreCarte
    boutonRetour.hidden = carte.systemeRegarde(t) === 'Soleil'
    // Pointillé vers la destination (sa position actuelle), une fois le trajet proposé.
    const cibleIci = proposee && place && selection !== CAPSULE && !dejaLa(t) ? place : null
    // Orbite de la capsule autour de son astre.
    const o = mission.orbiteActuelle(t)
    const orbiteCapsule = o && !corps(o.centre)?.tailleM
      ? Array.from({ length: 97 }, (_, k) => { const tk = t + (k / 96) * periode(o) * 1000; return { t: tk, r: mission.etat(tk).position } })
      : null
    carte.dessinerTraits(ctxPlan, t, cibleIci, trajet, rendezVous, accent, { encre: th.encre, fond: th.halo }, orbiteCapsule)
    for (const tr of autresTraces) carte.dessinerTraits(ctxPlan, t, null, tr, tr[tr.length - 1], accent, { encre: th.encre, fond: th.halo })
    // Points que l'étiquette de la destination ne doit pas cacher : le rendez-vous, la capsule.
    const eviter: { x: number; y: number }[] = []
    if (rendezVous) eviter.push(carte.ecranDe(rendezVous))
    const ici = carte.place(CAPSULE)
    if (ici) eviter.push(ici)
    if (place && sel) {
      // Destination qui tourne autour d'un autre astre que celui qu'on regarde : on le précise (« Titan (Saturne) »).
      const parent = corps(selection!)?.parent
      const nom = parent && parent !== carte.systemeRegarde(t) ? `${sel.nom} (${parent})` : sel.nom
      dessinerReperes(ctxPlan, largeur, hauteur, place.x, place.y, place.r, place.visible, nom, sel.distance, reglages,
        { encre: th.encre, fond: th.halo, accent }, eviter)
    }
  }
  images++
  if (maintenant - debutCompte > 500) {
    const ips = Math.round((images * 1000) / (maintenant - debutCompte))
    images = 0
    debutCompte = maintenant
    const avance = t - Date.now()
    // Heure du lieu du joueur (fuseau du téléphone) ; le moteur, lui, compte en temps universel.
    const heure = new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })
    infos.textContent = `${heure} · ${ips} i/s · v${__VERSION__}`
      + (acceleration > 1 || avance > 60_000 ? ` · temps ×${acceleration.toLocaleString('fr')} (+${texteDuree(avance)})` : '')
  }
  requestAnimationFrame(image)
}
requestAnimationFrame(image)

// Pour les essais : window.andromeda dans la console.
Object.assign(window, {
  andromeda: {
    // Essais : la réponse du manuel pour le tour en cours de la réparation d'un module.
    solution: (a: NomAppareil) => {
      const r = jeu.reparation(a)
      if (!r) return null
      if (a === 'bornier') return solution(tourEnergie(r.graine, r.tour), jeu.numeroSerie)
      if (a === 'telegraphe') return tourTelegraphe(r.graine, r.tour)
      if (a === 'antenne') return angleAttendu(tourAntenne(r.graine, r.tour))
      if (a === 'chiffreur') return ordreChiffreur(tourChiffreur(r.graine, r.tour))
      return null
    },
    carte, mission, jeu, choisir: (n: string) => choisir(n, true), allerA: (n: string) => { choisir(n, true); proposee = true },
    accelerer: (k: number) => { acceleration = k },
  },
})
