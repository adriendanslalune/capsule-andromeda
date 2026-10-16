// Prototype 1 de « Capsule Andromeda » : la carte du système solaire, à vraie échelle, en temps réel.
// Étape 1 : la carte seule, avec le zoom et le déplacement.

import './style.css'
import { type Camera, ECHELLE_MAX, glisser, raccrocher, zoomer } from './affichage/camera'
import { Gestes } from './affichage/gestes'
import { JOUR, dessiner } from './affichage/rendu'
import { astreDominant, position } from './moteur/corps'
import { UA_KM } from './moteur/temps'

const toile = document.querySelector<HTMLCanvasElement>('#carte')!
const ctx = toile.getContext('2d', { alpha: false })!
const echelleBarre = document.querySelector<HTMLDivElement>('#echelle-barre')!
const echelleTexte = document.querySelector<HTMLDivElement>('#echelle-texte')!
const infos = document.querySelector<HTMLDivElement>('#infos')!

/** L'horloge : la vraie heure UTC (le moteur la reçoit en paramètre). */
const horloge = () => Date.now()

// Départ : la Terre au centre, son orbite basse visible (Hubble, ISS).
const camera: Camera = { ancre: 'Terre', dx: 0, dy: 0, echelle: 45, largeur: 390, hauteur: 844 }

function redimensionner(): void {
  const r = toile.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  camera.largeur = r.width
  camera.hauteur = r.height
  toile.width = Math.round(r.width * dpr)
  toile.height = Math.round(r.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
window.addEventListener('resize', redimensionner)
redimensionner()

const gestes = new Gestes(toile, {
  glisser: (dx, dy) => glisser(camera, dx, dy),
  zoomer: (f, sx, sy) => zoomer(camera, f, sx, sy),
})
// Empêche Safari de zoomer la page elle-même.
document.addEventListener('gesturestart', (e) => e.preventDefault())

/** Accroche la caméra à l'astre dans la sphère d'influence duquel se trouve le centre de l'écran. */
function accrocher(t: number): void {
  const pos = (nom: string) => position(nom, t)
  const a = pos(camera.ancre)
  raccrocher(camera, astreDominant({ x: a.x + camera.dx, y: a.y + camera.dy }, t), pos)
}

// Barre d'échelle : une longueur ronde qui fait entre 70 et 160 pixels.
function texteDistance(km: number): string {
  if (km >= 0.1 * UA_KM) return `${(km / UA_KM).toLocaleString('fr')} UA`
  if (km >= 1e6) return `${(km / 1e6).toLocaleString('fr')} million${km >= 2e6 ? 's' : ''} de km`
  return `${km.toLocaleString('fr')} km`
}
function longueurRonde(echelle: number): number {
  const cible = 110 * echelle
  const ronds: number[] = []
  if (cible >= 0.05 * UA_KM) for (const p of [0.1, 1, 10, 100]) for (const m of [1, 2, 5]) ronds.push(m * p * UA_KM)
  else for (let p = 1; p <= 1e8; p *= 10) for (const m of [1, 2, 5]) ronds.push(m * p)
  return ronds.reduce((a, b) => (Math.abs(Math.log(b / cible)) < Math.abs(Math.log(a / cible)) ? b : a))
}

let precedent = performance.now()
let images = 0, debutCompte = precedent, ips = 0
let derniereAccroche = 0
function image(maintenant: number): void {
  const dt = Math.min(0.1, (maintenant - precedent) / 1000)
  precedent = maintenant
  const t = horloge()
  gestes.avancer(dt)
  // Réaccrochage de la caméra quand la vue a bougé (au plus 10 fois par seconde).
  if (maintenant - derniereAccroche > 100) { accrocher(t); derniereAccroche = maintenant }
  const stats = dessiner(ctx, camera, t, JOUR)

  const l = longueurRonde(camera.echelle)
  echelleBarre.style.width = `${(l / camera.echelle).toFixed(1)}px`
  echelleTexte.textContent = texteDistance(l)
  images++
  if (maintenant - debutCompte > 500) {
    ips = Math.round((images * 1000) / (maintenant - debutCompte))
    images = 0
    debutCompte = maintenant
    const date = new Date(t).toISOString().slice(0, 19).replace('T', ' ')
    infos.textContent = `${date} UTC · ${ips} i/s · ${stats.calcules} astres calculés`
  }
  requestAnimationFrame(image)
}
requestAnimationFrame(image)

// Pour les essais : window.carte.camera dans la console.
Object.assign(window, { carte: { camera, ECHELLE_MAX } })
