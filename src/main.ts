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
import { Cockpit } from './commun/cockpit'
import { CAPSULE, Carte2D } from './carte/carte'
import { couperTrace, projeterTrajet } from './carte/loupe'
import { Gestes } from './commun/gestes'
import { dessinerReperes } from './commun/reperes'
import { periode, suivreMission } from './moteur/capsule'
import { corps } from './moteur/corps'
import { avancement, Mission, planifier, type Planification } from './moteur/mission'
import { distanceDepuisCapsule, texteDistance } from './moteur/navigation'
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

// La mission de la capsule (orbite, trajet, arrivée) : le moteur la suit.
const mission = new Mission()
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
const CLE_REGLAGES = 'andromeda-reperes-v7'
const reglages = {
  orbites: true, noms: true,
  /** Mode nuit : seulement par le bouton (choix d'Adrien du 17/10/2026), jour par défaut. */
  nuit: false,
  crochet: true, etiquette: true, fleche: true,
  /**
   * Puissance des moteurs : vitesse de croisière (km/s). 120 km/s pour le prototype, réglable.
   * (Dans le vrai jeu : départ à 30 km/s, puis améliorations sans limite.)
   */
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
const cockpit = new Cockpit((page) => { if (page === 'navigation') cadran.afficher(selection) })
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

// --- Navigation : trajet prévu vers la destination, fiche de trajet, départ.
const fiche = document.querySelector<HTMLDivElement>('#trajet')!
const ficheTexte = document.querySelector<HTMLDivElement>('#trajet-texte')!
const boutonDepart = document.querySelector<HTMLButtonElement>('#bouton-depart')!
let prevision: Planification | null = null
let previsionPour: string | null = null
let planAJour = 0

/** Durée lisible : « 3 h 20 min », « 12 j 4 h », « 2 ans 3 mois ». */
function texteDuree(ms: number): string {
  const min = ms / 60_000, h = min / 60, j = h / 24
  if (h < 1) return `${Math.max(1, Math.round(min))} min`
  if (j < 2) return `${Math.floor(h)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`
  if (j < 365) return `${Math.floor(j)} j ${Math.round(h % 24)} h`
  const ans = Math.floor(j / 365.25), mois = Math.round((j % 365.25) / 30.44)
  return `${ans} an${ans > 1 ? 's' : ''}${mois ? ` ${mois} mois` : ''}`
}
/** Date et heure à l'heure du lieu du joueur (fuseau du téléphone) : « 17 octobre 2026 à 19:42 ». */
const texteDate = (t: number) => new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** « autour de la Terre », « autour d'Uranus », « autour du Soleil », « à côté de l'ISS »… */
function autourDe(nom: string): string {
  if (corps(nom)?.tailleM) return `À CÔTÉ DE ${nom.toUpperCase()}`
  const article: Record<string, string> = { Terre: 'DE LA ', Lune: 'DE LA ', Soleil: 'DU ', Uranus: "D'", Europe: "D'", Io: "D'", Encelade: "D'" }
  return `AUTOUR ${article[nom] ?? 'DE '}${nom.toUpperCase()}`
}

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
  prevision = planifier(mission.etatHeliocentrique(t), selection!, t, reglages.vitesse)
  previsionPour = selection
  planAJour = maintenant
}

function mettreAJourFiche(t: number): void {
  const enRoute = mission.phase(t) === 'trajet' ? mission.plan! : null
  let texte = '', depart = false, libelle = 'DÉPART'
  if (enRoute) {
    texte = `<b>EN ROUTE VERS ${enRoute.cible.toUpperCase()}</b><br>arrivée dans ${texteDuree(enRoute.arrivee - t)} · ${texteDate(enRoute.arrivee)}`
  } else if (dejaLa(t)) {
    // En orbite : autour de quoi, à quelle altitude, en combien de temps la capsule fait le tour.
    const o = mission.orbiteActuelle(t)
    if (o) {
      const rayon = corps(o.centre)?.rayon ?? 0
      const altitude = o.rayon - rayon
      const altitudeTexte = corps(o.centre)?.tailleM ? `à ${texteDistance(o.rayon)}` : `altitude ${texteDistance(altitude)}`
      const tour = corps(o.centre)?.tailleM ? '' : ` · un tour en ${texteDuree(periode(o) * 1000)}`
      texte = `<b>EN ORBITE ${autourDe(o.centre)}</b><br>${altitudeTexte}${tour}`
    }
  }
  if (selection && !dejaLa(t) && enRoute?.cible !== selection && !proposee) {
    // Fiche de l'astre touché : rien ne change tant qu'on n'appuie pas sur Y ALLER.
    texte = `${enRoute ? texte + '<br>' : ''}<b>${selection.toUpperCase()}</b><br>à ${texteDistance(distanceDepuisCapsule(selection, t))}`
    depart = true
    libelle = 'Y ALLER'
  } else if (selection && !dejaLa(t) && enRoute?.cible !== selection && prevision) {
    const dv = `${reglages.vitesse} km/s`
    if (prevision.possible) {
      const p = prevision.plan
      texte = `${enRoute ? texte + '<br>' : ''}<b>${selection.toUpperCase()}</b> · trajet ${texteDuree(p.arrivee - p.depart)}<br>arrivée le ${texteDate(p.arrivee)} · moteurs ${dv}`
      depart = true
      libelle = enRoute ? 'NOUVEAU CAP' : 'DÉPART'
    } else {
      texte = `${enRoute ? texte + '<br>' : ''}<b>${selection.toUpperCase()}</b> · hors de portée<br>elle s'éloigne plus vite que la capsule (moteurs ${dv})`
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
  if (!selection || dejaLa(t)) return
  if (!proposee) { proposee = true; planAJour = 0; return }
  // On recalcule au moment exact du départ.
  const p = planifier(mission.etatHeliocentrique(t), selection, t, reglages.vitesse)
  if (!p.possible) return
  mission.partir(p.plan)
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
  mettreAJourFiche(t)
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
