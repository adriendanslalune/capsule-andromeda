// Capsule Andromeda : la carte et la navigation (en 2D seulement : plus de vue 3D, décision d'Adrien du 17/10/2026).
//  - La CARTE : carte schématique en 2D, distances écrasées, deux niveaux (système solaire, système
//    d'une planète). Toucher un astre le choisit comme destination ; le toucher encore ouvre son système.
//  - Le CADRAN : la liste des astres, pour choisir une destination sans la chercher sur la carte.
//  - La NAVIGATION : un pointillé vers la position actuelle de la destination, et le vrai trajet (arc de conique
//    autour du Soleil, problème de Lambert) jusqu'au point de rendez-vous ; le bouton DÉPART lance le voyage.

import './style.css'
import { Cadran } from './carte/cadran'
import { CAPSULE, Carte2D, aUnSysteme, systemeDe } from './carte/carte'
import { Gestes } from './commun/gestes'
import { dessinerReperes } from './commun/reperes'
import { periode, suivreMission } from './moteur/capsule'
import { corps } from './moteur/corps'
import { Mission, planifier, traceTrajet, type Planification } from './moteur/mission'
import { distanceDepuisCapsule, texteDistance } from './moteur/navigation'

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

// La mission de la capsule (orbite, trajet, arrivée) : le moteur la suit.
const mission = new Mission()
suivreMission(mission)

const carte = new Carte2D()
let largeur = 390, hauteur = 844
let selection: string | null = null
/** Encre et fond de la carte (style Moebius, fond blanc cassé). */
const th = { encre: '#1f1b18', halo: '#f4f1ea' }

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
const CLE_REGLAGES = 'andromeda-reperes-v6'
const reglages = {
  orbites: true, noms: true,
  crochet: true, etiquette: true, fleche: true,
  /**
   * Puissance des moteurs : budget de delta-v (km/s). Choix d'Adrien : 120 km/s pour le prototype, réglable.
   * (Dans le vrai jeu : départ à 30 km/s, puis améliorations sans limite.)
   */
  budget: 120,
}
try {
  const memo = JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? '{}')
  for (const cle of Object.keys(reglages) as (keyof typeof reglages)[]) if (cle in memo) Object.assign(reglages, { [cle]: memo[cle] })
} catch { /* navigation privée : on garde les réglages de départ */ }
const memoriser = () => { try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)) } catch { /* rien */ } }
const panneau = document.querySelector<HTMLDivElement>('#panneau')!
document.querySelector('#bouton-reperes')!.addEventListener('click', () => panneau.classList.toggle('ouvert'))
for (const caseACocher of panneau.querySelectorAll<HTMLInputElement>('input[data-reglage]')) {
  const cle = caseACocher.dataset.reglage as Exclude<keyof typeof reglages, 'budget'>
  caseACocher.checked = reglages[cle]
  caseACocher.addEventListener('change', () => {
    reglages[cle] = caseACocher.checked
    memoriser()
  })
}

// --- Choix de la destination.
function choisir(nom: string | null): void {
  selection = nom
  // La carte se place sur le système de la destination (une planète se montre au niveau du système solaire).
  if (nom) {
    const sys = systemeDe(nom, horloge())
    if (sys !== carte.niveau) ouvrirNiveau(sys)
  }
}

/** « Système de la Terre », « système d'Uranus »… */
const DE: Record<string, string> = { Terre: 'DE LA ', Uranus: "D'" }

function ouvrirNiveau(niveau: string): void {
  carte.ouvrir(niveau)
  titre.textContent = niveau === 'Soleil' ? 'SYSTÈME SOLAIRE' : `SYSTÈME ${DE[niveau] ?? 'DE '}${niveau.toUpperCase()}`
  boutonRetour.hidden = niveau === 'Soleil'
}
boutonRetour.addEventListener('click', () => ouvrirNiveau('Soleil'))
ouvrirNiveau('Soleil')

const cadran = new Cadran(document.querySelector<HTMLDivElement>('#cadran')!, (nom) => choisir(nom), horloge)
document.querySelector('#bouton-cadran')!.addEventListener('click', () => cadran.ouvrir(selection))

// --- Réglages d'essai : accélération du temps et puissance des moteurs.
for (const bouton of panneau.querySelectorAll<HTMLInputElement>('input[name="acceleration"]')) {
  bouton.checked = Number(bouton.value) === acceleration
  bouton.addEventListener('change', () => { acceleration = Number(bouton.value); planAJour = 0 })
}
const curseurBudget = document.querySelector<HTMLInputElement>('#budget')!
const texteBudget = document.querySelector<HTMLSpanElement>('#texte-budget')!
// Curseur logarithmique : de 5 à 5 000 km/s (les moteurs du vrai jeu s'amélioreront sans limite).
const versBudget = (x: number) => { const b = 5 * 1000 ** (x / 100); return b < 100 ? Math.round(b) : Math.round(b / 10) * 10 }
const depuisBudget = (b: number) => (100 * Math.log(b / 5)) / Math.log(1000)
curseurBudget.value = String(depuisBudget(reglages.budget))
texteBudget.textContent = `${reglages.budget} km/s`
curseurBudget.addEventListener('input', () => {
  reglages.budget = versBudget(Number(curseurBudget.value))
  texteBudget.textContent = `${reglages.budget} km/s`
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
const texteDate = (t: number) => new Date(t).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })

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
  if (dejaLa(t) || (mission.phase(t) === 'trajet' && mission.plan?.cible === selection)) {
    prevision = null
    previsionPour = selection
    return
  }
  if (selection === previsionPour && maintenant - planAJour < 1000) return
  prevision = planifier(mission.etatHeliocentrique(t), selection!, t, reglages.budget)
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
  if (selection && !dejaLa(t) && enRoute?.cible !== selection && prevision) {
    const dv = `${reglages.budget} km/s`
    if (prevision.possible) {
      const p = prevision.plan
      texte = `${enRoute ? texte + '<br>' : ''}<b>${selection.toUpperCase()}</b> · trajet ${texteDuree(p.arrivee - p.depart)}<br>arrivée le ${texteDate(p.arrivee)} · moteurs ${dv}`
      depart = true
      libelle = enRoute ? 'NOUVEAU CAP' : 'DÉPART'
    } else {
      texte = `${enRoute ? texte + '<br>' : ''}<b>${selection.toUpperCase()}</b> · hors de portée<br>il faudrait ${Math.ceil(prevision.dvMinimum)} km/s (moteurs ${dv})`
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
  // On recalcule au moment exact du départ.
  const p = planifier(mission.etatHeliocentrique(t), selection, t, reglages.budget)
  if (!p.possible) return
  mission.partir(p.plan)
  prevision = null
  carteSale = true
  // La carte montre le voyage : le système solaire si l'on quitte le système d'une planète.
  if (systemeDe(selection, t) !== carte.niveau) ouvrirNiveau('Soleil')
})

// --- Gestes de la carte : glisser, pincer, toucher un astre.
const gestesCarte = new Gestes(toilePlan, {
  glisser: (dx, dy) => carte.glisser(dx, dy),
  zoomer: (f, sx, sy) => carte.zoomer(f, sx, sy),
  toucher: (x, y) => {
    const nom = carte.toucher(x, y)
    if (!nom) return
    // Toucher une planète déjà choisie : on ouvre son système.
    if (nom === selection && nom !== carte.niveau && corps(nom) && aUnSysteme(nom, horloge())
      && (corps(nom)!.type === 'planete' || corps(nom)!.type === 'naine')) {
      ouvrirNiveau(nom)
      return
    }
    selection = nom
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
  let trajet = planTrace ? traceTrajet(planTrace, 200) : null
  // En route : seulement ce qui reste à parcourir, en partant de la capsule elle-même.
  if (trajet && planTrace === enRoute) trajet = [{ t, r: mission.etat(t).position }, ...trajet.filter((p) => p.t > t)]
  const rendezVous = planTrace ? { r: planTrace.rendezVous, t: planTrace.arrivee } : null
  // La carte bouge lentement : sans geste en cours, on la redessine dix fois par seconde (économie de batterie).
  const carteAJour = !gestesCarte.actif && !carteSale && acceleration === 1 && maintenant - dernierDessinCarte < 100
  if (!carteAJour) {
    dernierDessinCarte = maintenant
    carteSale = false
    gestesCarte.avancer(dt)
    // La capsule pointe le long du trajet tel qu'il est dessiné (premier tronçon visible à l'écran).
    let direction: { x: number; y: number } | null = null
    if (trajet && trajet.length > 1) {
      const e = carte.echelle(t)
      const q0 = carte.projeterPoint(trajet[0].r, trajet[0].t, e)
      for (const p of trajet.slice(1)) {
        const q = carte.projeterPoint(p.r, p.t, e)
        if (Math.hypot(q.x - q0.x, q.y - q0.y) > 6) { direction = { x: q.x - q0.x, y: q.y - q0.y }; break }
      }
    }
    const place = carte.dessiner(ctxPlan, t, reglages, { encre: th.encre, fond: th.halo }, 'moebius', selection, direction)
    // Pointillé vers la destination (sa position actuelle), seulement si elle est à ce niveau de la carte.
    const cibleIci = place && place.r > 0 && selection !== CAPSULE && !dejaLa(t) ? place : null
    // Orbite de la capsule, quand on regarde le système de l'astre qu'elle entoure.
    const o = mission.orbiteActuelle(t)
    const orbiteCapsule = o && o.centre === carte.niveau && !corps(o.centre)?.tailleM
      ? Array.from({ length: 97 }, (_, k) => { const tk = t + (k / 96) * periode(o) * 1000; return { t: tk, r: mission.etat(tk).position } })
      : null
    carte.dessinerTraits(ctxPlan, t, cibleIci, trajet, rendezVous, accent, { encre: th.encre, fond: th.halo }, orbiteCapsule)
    // Points que l'étiquette de la destination ne doit pas cacher : le rendez-vous, la capsule.
    const eviter: { x: number; y: number }[] = []
    if (rendezVous) eviter.push(carte.projeterPoint(rendezVous.r, rendezVous.t, carte.echelle(t)))
    const ici = carte.place(CAPSULE)
    if (ici) eviter.push(ici)
    if (place && sel) {
      // Destination dans le système d'une autre planète : on le précise (« Titan (Saturne) »).
      const sys = systemeDe(selection!, t)
      const nom = selection !== CAPSULE && sys !== 'Soleil' && sys !== carte.niveau ? `${sel.nom} (${sys})` : sel.nom
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
    infos.textContent = `${new Date(t).toISOString().slice(0, 19).replace('T', ' ')} UTC · ${ips} i/s`
      + (acceleration > 1 || avance > 60_000 ? ` · temps ×${acceleration.toLocaleString('fr')} (+${texteDuree(avance)})` : '')
  }
  requestAnimationFrame(image)
}
requestAnimationFrame(image)

// Pour les essais : window.andromeda dans la console.
Object.assign(window, {
  andromeda: {
    carte, mission, choisir: (n: string) => choisir(n), ouvrirNiveau,
    accelerer: (k: number) => { acceleration = k },
  },
})
