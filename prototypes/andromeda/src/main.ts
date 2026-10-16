// Prototype 1 de « Capsule Andromeda », en 3D : l'espace vu depuis derrière la capsule. Glisser un doigt : on tourne
// autour de la capsule, dans toutes les directions ; le bouton RECENTRER replace la caméra derrière elle. Pincer : on
// recule ou on se rapproche, de quelques mètres jusqu'à voir tout le système solaire au loin.

import './style.css'
import { Gestes } from './commun/gestes'
import { RECUL_MAX, RECUL_MIN, Vue3D, type Regard } from './affichage3d/scene'
import { THEME_JOUR, THEME_NUIT, appliquerTheme } from './affichage3d/materiaux'
import { dessinerSurcouche } from './affichage3d/surcouche'
import { UA_KM } from './moteur/temps'

const toile = document.querySelector<HTMLCanvasElement>('#carte')!
const surcouche = document.querySelector<HTMLCanvasElement>('#surcouche')!
const ctx = surcouche.getContext('2d')!
const echelleTexte = document.querySelector<HTMLDivElement>('#echelle-texte')!
const infos = document.querySelector<HTMLDivElement>('#infos')!

/** L'horloge : la vraie heure UTC, précise au-dessous de la milliseconde (le moteur la reçoit en paramètre). */
const departHorloge = Date.now(), departPerf = performance.now()
const horloge = () => departHorloge + (performance.now() - departPerf)

const vue = new Vue3D(toile)
const regard: Regard = { recul: 0.045, lacet: 0, tangage: 0 }
let largeur = 390, hauteur = 844

function redimensionner(): void {
  const r = toile.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  largeur = r.width
  hauteur = r.height
  vue.redimensionner(largeur, hauteur, dpr)
  surcouche.width = Math.round(largeur * dpr)
  surcouche.height = Math.round(hauteur * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
window.addEventListener('resize', redimensionner)
redimensionner()

// Repères, chacun désactivable (mémorisés dans le navigateur, si possible).
const CLE_REGLAGES = 'andromeda-reperes-3d'
const reglages = { etoiles: true, orbites: true, soleil: true, noms: true, fleches: true, fondNoir: false }
try {
  Object.assign(reglages, JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? '{}'))
} catch { /* navigation privée : on garde les réglages de départ */ }
const panneau = document.querySelector<HTMLDivElement>('#panneau')!
document.querySelector('#bouton-reperes')!.addEventListener('click', () => panneau.classList.toggle('ouvert'))
for (const caseACocher of panneau.querySelectorAll<HTMLInputElement>('input[data-reglage]')) {
  const cle = caseACocher.dataset.reglage as keyof typeof reglages
  caseACocher.checked = reglages[cle]
  caseACocher.addEventListener('change', () => {
    reglages[cle] = caseACocher.checked
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)) } catch { /* rien */ }
    if (cle === 'fondNoir') changerTheme()
  })
}

/** Fond blanc cassé (étoiles noires) ou fond noir (étoiles blanches), au choix du joueur. */
function changerTheme(): void {
  const theme = reglages.fondNoir ? THEME_NUIT : THEME_JOUR
  appliquerTheme(theme)
  document.documentElement.dataset.theme = reglages.fondNoir ? 'nuit' : 'jour'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.fond)
}
changerTheme()

// RECENTRER : la caméra revient en douceur derrière la capsule.
let recentrage = false
document.querySelector('#bouton-recentrer')!.addEventListener('click', () => {
  // On ramène d'abord l'angle entre −π et π, pour revenir par le plus court chemin.
  regard.lacet = Math.atan2(Math.sin(regard.lacet), Math.cos(regard.lacet))
  recentrage = true
})

const LIMITE_TANGAGE = (88 * Math.PI) / 180
const gestes = new Gestes(surcouche, {
  glisser: (dx, dy) => {
    // On tourne autour de la capsule (sens des axes choisi par Adrien après essai sur téléphone).
    recentrage = false
    const radParPx = ((62 * Math.PI) / 180) / hauteur
    regard.lacet -= dx * radParPx
    regard.tangage = Math.max(-LIMITE_TANGAGE, Math.min(LIMITE_TANGAGE, regard.tangage - dy * radParPx))
  },
  zoomer: (f) => { regard.recul = Math.min(RECUL_MAX, Math.max(RECUL_MIN, regard.recul * f)) },
})
document.addEventListener('gesturestart', (e) => e.preventDefault())

function texteDistance(km: number): string {
  const rond = (x: number) => x.toLocaleString('fr', { maximumSignificantDigits: 2 })
  if (km >= 0.1 * UA_KM) return `${rond(km / UA_KM)} UA`
  if (km >= 1e6) return `${rond(km / 1e6)} million${km >= 2e6 ? 's' : ''} de km`
  if (km < 1) return `${rond(km * 1000)} m`
  return `${rond(km)} km`
}

let precedent = performance.now()
let images = 0, debutCompte = precedent
function image(maintenant: number): void {
  const dt = Math.min(0.1, (maintenant - precedent) / 1000)
  precedent = maintenant
  gestes.avancer(dt)
  if (recentrage) {
    const k = Math.exp(-dt / 0.15)
    regard.lacet *= k
    regard.tangage *= k
    if (Math.abs(regard.lacet) + Math.abs(regard.tangage) < 1e-4) { regard.lacet = regard.tangage = 0; recentrage = false }
  }
  const t = horloge()
  const { astres, capsuleEcran } = vue.dessiner(t, regard, reglages)
  dessinerSurcouche(ctx, largeur, hauteur, astres, capsuleEcran, reglages, reglages.fondNoir ? THEME_NUIT : THEME_JOUR)
  echelleTexte.textContent = `Recul : ${texteDistance(regard.recul)}`
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

// Pour les essais : window.carte.regard dans la console.
Object.assign(window, { carte: { regard, vue } })
