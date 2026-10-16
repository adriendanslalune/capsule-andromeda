// Prototype « Capsule Andromeda » : la carte et la navigation.
//  - La CARTE (par défaut) : carte schématique en 2D, distances écrasées, deux niveaux (système solaire, système
//    d'une planète). Toucher un astre le choisit comme destination ; le toucher encore ouvre son système.
//  - La VUE EXTÉRIEURE (optionnelle) : l'espace en 3D, à vraie échelle, depuis derrière la capsule.
//  - Le CADRAN : la liste des astres, pour choisir une destination sans la chercher sur la carte.

import './style.css'
import { RECUL_MAX, RECUL_MIN, Vue3D, type Regard } from './affichage3d/scene'
import { THEME_JOUR, THEME_NUIT, appliquerTheme } from './affichage3d/materiaux'
import { dessinerSurcouche } from './affichage3d/surcouche'
import type { Style } from './affichage3d/textures'
import { Cadran } from './carte/cadran'
import { CAPSULE, Carte2D, aUnSysteme, systemeDe } from './carte/carte'
import { Gestes } from './commun/gestes'
import { dessinerReperes } from './commun/reperes'
import { corps } from './moteur/corps'
import { distanceDepuisCapsule, texteDistance } from './moteur/navigation'

const toile3d = document.querySelector<HTMLCanvasElement>('#vue3d')!
const surcouche = document.querySelector<HTMLCanvasElement>('#surcouche')!
const ctx3d = surcouche.getContext('2d')!
const toilePlan = document.querySelector<HTMLCanvasElement>('#plan')!
const ctxPlan = toilePlan.getContext('2d')!
const echelleTexte = document.querySelector<HTMLDivElement>('#echelle-texte')!
const infos = document.querySelector<HTMLDivElement>('#infos')!
const titre = document.querySelector<HTMLDivElement>('#titre')!
const boutonRetour = document.querySelector<HTMLButtonElement>('#bouton-retour')!
const boutonVue = document.querySelector<HTMLButtonElement>('#bouton-vue')!

/** L'horloge : la vraie heure UTC, précise au-dessous de la milliseconde (le moteur la reçoit en paramètre). */
const departHorloge = Date.now(), departPerf = performance.now()
const horloge = () => departHorloge + (performance.now() - departPerf)

const vue = new Vue3D(toile3d)
const carte = new Carte2D()
/** Recul de départ de la vue extérieure, et celui où RECENTRER ramène : la capsule de près. */
const RECUL_CAPSULE = 0.045
const regard: Regard = { recul: RECUL_CAPSULE, lacet: 0, tangage: 0 }
let largeur = 390, hauteur = 844
let mode: 'carte' | 'exterieur' = 'carte'
let selection: string | null = null

function redimensionner(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  largeur = window.innerWidth
  hauteur = window.innerHeight
  vue.redimensionner(largeur, hauteur, dpr)
  for (const [toile, ctx] of [[surcouche, ctx3d], [toilePlan, ctxPlan]] as const) {
    toile.width = Math.round(largeur * dpr)
    toile.height = Math.round(hauteur * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  carte.largeur = largeur
  carte.hauteur = hauteur
  carte.pixelRatio = dpr
}
window.addEventListener('resize', redimensionner)
redimensionner()

// --- Réglages, chacun désactivable (mémorisés dans le navigateur, si possible).
// (nouvelle clé : le style est désormais fixé à Moebius, les anciens réglages mémorisés sont oubliés)
const CLE_REGLAGES = 'andromeda-reperes-v4'
const reglages = {
  etoiles: true, orbites: true, soleil: true, noms: true, fleches: true, fondNoir: false,
  // Style retenu par Adrien : Moebius (les styles « à plat », « BD tramée » et « réaliste » restent dans le code).
  style: 'moebius' as Style,
  crochet: true, etiquette: true, fleche: true,
}
try {
  Object.assign(reglages, JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? '{}'), { style: 'moebius' })
} catch { /* navigation privée : on garde les réglages de départ */ }
const memoriser = () => { try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)) } catch { /* rien */ } }
const panneau = document.querySelector<HTMLDivElement>('#panneau')!
document.querySelector('#bouton-reperes')!.addEventListener('click', () => panneau.classList.toggle('ouvert'))
for (const caseACocher of panneau.querySelectorAll<HTMLInputElement>('input[data-reglage]')) {
  const cle = caseACocher.dataset.reglage as Exclude<keyof typeof reglages, 'style'>
  caseACocher.checked = reglages[cle]
  caseACocher.addEventListener('change', () => {
    reglages[cle] = caseACocher.checked
    memoriser()
    if (cle === 'fondNoir') changerTheme()
  })
}

/** Fond blanc cassé (le choix d'Adrien) ou fond noir, au choix du joueur. */
function changerTheme(): void {
  const theme = reglages.fondNoir ? THEME_NUIT : THEME_JOUR
  appliquerTheme(theme)
  document.documentElement.dataset.theme = reglages.fondNoir ? 'nuit' : 'jour'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.fond)
}
changerTheme()
const theme = () => (reglages.fondNoir ? THEME_NUIT : THEME_JOUR)

// --- Choix de la destination.
function choisir(nom: string | null): void {
  selection = nom
  // La carte se place sur le système de la destination (une planète se montre au niveau du système solaire).
  if (nom && mode === 'carte') {
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

// --- Bascule carte / vue extérieure.
function changerMode(nouveau: 'carte' | 'exterieur'): void {
  mode = nouveau
  document.body.dataset.mode = mode
  boutonVue.textContent = mode === 'carte' ? 'VUE EXTÉRIEURE' : 'CARTE'
  if (mode === 'carte' && selection) choisir(selection)
}
boutonVue.addEventListener('click', () => changerMode(mode === 'carte' ? 'exterieur' : 'carte'))
changerMode('carte')

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

// --- Gestes de la vue extérieure : tourner autour de la capsule, reculer ; RECENTRER.
let recentrage = false
document.querySelector('#bouton-recentrer')!.addEventListener('click', () => {
  regard.lacet = Math.atan2(Math.sin(regard.lacet), Math.cos(regard.lacet))
  recentrage = true
})
const LIMITE_TANGAGE = (88 * Math.PI) / 180
const gestes3d = new Gestes(surcouche, {
  glisser: (dx, dy) => {
    recentrage = false
    const radParPx = ((62 * Math.PI) / 180) / hauteur
    regard.lacet -= dx * radParPx
    regard.tangage = Math.max(-LIMITE_TANGAGE, Math.min(LIMITE_TANGAGE, regard.tangage - dy * radParPx))
  },
  zoomer: (f) => { recentrage = false; regard.recul = Math.min(RECUL_MAX, Math.max(RECUL_MIN, regard.recul * f)) },
})
document.addEventListener('gesturestart', (e) => e.preventDefault())

function avancerRecentrage(dt: number): void {
  if (!recentrage) return
  // La vue revient derrière la capsule pendant que le recul se rapproche du sien, en échelle logarithmique.
  const k = Math.exp(-dt / 0.4)
  regard.lacet *= k
  regard.tangage *= k
  const ecart = Math.log(regard.recul / RECUL_CAPSULE)
  const pas = Math.sign(ecart) * Math.min(Math.abs(ecart), Math.max(3 * dt, Math.abs(ecart) * (1 - Math.exp(-dt / 0.5))))
  regard.recul = RECUL_CAPSULE * Math.exp(ecart - pas)
  if (Math.abs(regard.lacet) + Math.abs(regard.tangage) < 1e-4 && Math.abs(ecart - pas) < 1e-3) {
    regard.lacet = regard.tangage = 0
    regard.recul = RECUL_CAPSULE
    recentrage = false
  }
}

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
  const t = horloge()
  const th = theme()
  const sel = infosSelection(t)
  // La carte bouge lentement : sans geste en cours, on la redessine dix fois par seconde (économie de batterie).
  const carteAJour = mode === 'carte' && !gestesCarte.actif && !carteSale && maintenant - dernierDessinCarte < 100
  if (mode === 'carte' && !carteAJour) {
    dernierDessinCarte = maintenant
    carteSale = false
    gestesCarte.avancer(dt)
    const place = carte.dessiner(ctxPlan, t, reglages, { encre: th.encre, fond: th.halo }, reglages.style, selection)
    if (place && sel) {
      // Destination dans le système d'une autre planète : on le précise (« Titan (Saturne) »).
      const sys = systemeDe(selection!, t)
      const nom = selection !== CAPSULE && sys !== 'Soleil' && sys !== carte.niveau ? `${sel.nom} (${sys})` : sel.nom
      dessinerReperes(ctxPlan, largeur, hauteur, place.x, place.y, place.r, place.visible, nom, sel.distance, reglages,
        { encre: th.encre, fond: th.halo, accent: reglages.style === 'bd' ? '#e04b37' : reglages.style === 'moebius' ? '#d9694f' : th.encre })
    }
  } else if (mode === 'exterieur') {
    gestes3d.avancer(dt)
    avancerRecentrage(dt)
    const { astres, capsuleEcran } = vue.dessiner(t, regard, reglages)
    dessinerSurcouche(ctx3d, largeur, hauteur, astres, capsuleEcran, reglages, th, sel, reglages)
    echelleTexte.textContent = `Recul : ${texteDistance(regard.recul)}`
  }
  images++
  if (maintenant - debutCompte > 500) {
    const ips = Math.round((images * 1000) / (maintenant - debutCompte))
    images = 0
    debutCompte = maintenant
    infos.textContent = `${new Date(t).toISOString().slice(0, 19).replace('T', ' ')} UTC · ${ips} i/s`
  }
  requestAnimationFrame(image)
}
requestAnimationFrame(image)

// Pour les essais : window.andromeda dans la console.
Object.assign(window, { andromeda: { regard, vue, carte, choisir: (n: string) => choisir(n), changerMode, ouvrirNiveau } })
