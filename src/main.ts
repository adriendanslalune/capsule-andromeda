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
import { ACTIONS_FINIES, NOMS_ACTIONS, VERBES, texteSecondes, titreContrat } from './commun/textes-missions'
import { VoletMissions } from './commun/volet-missions'
import { texteDate, texteDuree } from './commun/textes'
import { CAPSULE, Carte2D } from './carte/carte'
import { couperTrace, projeterTrajet } from './carte/loupe'
import { Gestes } from './commun/gestes'
import { dessinerReperes } from './commun/reperes'
import { periode, suivreMission } from './moteur/capsule'
import { corps } from './moteur/corps'
import { Jeu } from './moteur/jeu'
import { restaurer, sauvegarder } from './moteur/sauvegarde'
import { avancement, planifier, type Planification } from './moteur/mission'
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
const jeu = chargerPartie() ?? new Jeu()
const mission = jeu.mission
suivreMission(mission)

const carte = new Carte2D()
let largeur = 390, hauteur = 844
let selection: string | null = null
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
function choisir(nom: string | null, cadrer = false): void {
  if (nom !== selection) proposee = false
  selection = nom
  // Depuis le cadran : une lune ou un satellite fait cadrer le système de son astre.
  const c = nom ? corps(nom) : undefined
  if (cadrer && c?.parent) carte.cadrerSysteme(c.parent, horloge())
}

boutonRetour.addEventListener('click', () => carte.vueGenerale())
carte.vueGenerale()

// Le cockpit : barre d'onglets et volets. Choisir un astre dans le volet Navigation referme le volet.
const cockpit = new Cockpit((page) => {
  if (page === 'navigation') cadran.afficher(selection)
  if (page === 'missions') voletMissions.afficher(jeu, horloge())
})
const cadran = new Cadran(document.querySelector<HTMLDivElement>('#cadran')!, (nom) => { choisir(nom, true); cockpit.fermer() }, horloge)
// Toucher la carte referme le volet.
toilePlan.addEventListener('pointerdown', () => cockpit.fermer())

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
let actionFiche: 'depart' | 'agir' = 'depart'
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
  if (selection === previsionPour && maintenant - planAJour < 1000) return
  prevision = planifier(mission.etatHeliocentrique(t), selection!, t, vitesse())
  previsionPour = selection
  planAJour = maintenant
}

const bandeau = document.querySelector<HTMLDivElement>('#bandeau')!

function mettreAJourFiche(t: number): void {
  afficherBandeau(bandeau, lignesDuBandeau(jeu, t),
    { credits: jeu.credits, niveauMoteur: jeu.niveauMoteur, vitesse: vitesse(), vitesseForcee: reglages.forcerVitesse }, t)
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  // La situation de la capsule (en route, en orbite) est dans le bandeau d'alertes ; la fiche ne parle que de la
  // destination choisie.
  let texte = '', depart = false, libelle = 'DÉPART'
  actionFiche = 'depart'
  const etape = jeu.etapeActuelle(), fin = jeu.finAction()
  if (etape && (fin !== null || jeu.peutAgir(t)) && (!selection || dejaLa(t) || selection === etape.lieu)) {
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
  if (!selection || dejaLa(t)) return
  if (!proposee) { proposee = true; planAJour = 0; return }
  // On recalcule au moment exact du départ.
  const p = planifier(mission.etatHeliocentrique(t), selection, t, vitesse())
  if (!p.possible) return
  mission.partir(p.plan)
  enregistrerPartie()
  prevision = null
  proposee = false
  carteSale = true
})

// --- Gestes de la carte : glisser, pincer, toucher un astre.
const gestesCarte = new Gestes(toilePlan, {
  glisser: (dx, dy) => carte.glisser(dx, dy),
  zoomer: (f, sx, sy) => carte.zoomer(f, sx, sy),
  toucher: (x, y) => {
    const nom = carte.toucher(x, y)
    if (nom) choisir(nom)
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
const voletMissions = new VoletMissions(document.querySelector<HTMLDivElement>('#missions')!, {
  accepter: (id) => { if (jeu.accepter(id, horloge())) { enregistrerPartie(); dernierVolet = 0 } },
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
  const evenements = jeu.avancer(t)
  for (const e of evenements) {
    if (e.genre === 'contrat-fini') annoncer(`Mission terminée : +${e.contrat.recompense} crédits`)
    else if (e.genre === 'etape-finie' && e.contrat.etapes.length > 1 && e.etape !== e.contrat.etapes[e.contrat.etapes.length - 1]) annoncer(ACTIONS_FINIES[e.etape.action])
    else if (e.genre === 'action-interrompue') annoncer('Action interrompue : la capsule est repartie')
  }
  if (evenements.length) enregistrerPartie()
}
let dernierVolet = 0

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
  if (cockpit.pageOuverte === 'missions' && maintenant - dernierVolet > 1000) { voletMissions.afficher(jeu, t); dernierVolet = maintenant }
  if (!message.hidden && maintenant > finMessage) message.hidden = true
  const accent = '#d9694f'
  // Les deux traits : le trajet (en cours, ou prévu vers la destination) et le point de rendez-vous.
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  const planTrace = prevision?.possible ? prevision.plan : enRoute
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
  const carteAJour = !gestesCarte.actif && !carteSale && acceleration === 1 && maintenant - dernierDessinCarte < 100
  if (!carteAJour) {
    dernierDessinCarte = maintenant
    carteSale = false
    gestesCarte.avancer(dt)
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
    carte, mission, choisir: (n: string) => choisir(n, true), allerA: (n: string) => { choisir(n, true); proposee = true },
    accelerer: (k: number) => { acceleration = k },
  },
})
