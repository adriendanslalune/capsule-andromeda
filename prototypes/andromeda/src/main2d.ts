// Prototype 1 de « Capsule Andromeda » : la carte du système solaire, à vraie échelle, en temps réel.
// Étape 1 : la carte seule, avec le zoom et le déplacement, et des repères pour s'y retrouver.

import './style.css'
import { type Camera, ECHELLE_MAX, glisser, raccrocher, zoomer } from './affichage2d/camera'
import { Gestes } from './commun/gestes'
import { JOUR, REGLAGES_DEPART, dessiner, type Reglages } from './affichage2d/rendu'
import { PREMIER_NIVEAU, astreDominant, enfants, position } from './moteur/corps'
import { UA_KM } from './moteur/temps'

const toile = document.querySelector<HTMLCanvasElement>('#carte')!
const ctx = toile.getContext('2d')!
const echelleBarre = document.querySelector<HTMLDivElement>('#echelle-barre')!
const echelleTexte = document.querySelector<HTMLDivElement>('#echelle-texte')!
const infos = document.querySelector<HTMLDivElement>('#infos')!

/**
 * L'horloge : la vraie heure UTC (le moteur la reçoit en paramètre), avec une précision sous la milliseconde : au
 * zoom maximal, l'ISS parcourt 8 pixels par milliseconde.
 */
const departHorloge = Date.now(), departPerf = performance.now()
const horloge = () => departHorloge + (performance.now() - departPerf)

// Départ : le Soleil au centre, les planètes intérieures et leurs orbites (on se situe d'abord dans le système).
const camera: Camera = { ancre: 'Soleil', dx: 0, dy: 0, echelle: 1.3e6, largeur: 390, hauteur: 844 }

// Repères, chacun désactivable (mémorisés dans le navigateur, si possible).
const CLE_REGLAGES = 'andromeda-reperes'
const reglages: Reglages = { ...REGLAGES_DEPART }
try {
  Object.assign(reglages, JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? '{}'))
} catch { /* navigation privée : on garde les réglages de départ */ }
const panneau = document.querySelector<HTMLDivElement>('#panneau')!
document.querySelector('#bouton-reperes')!.addEventListener('click', () => panneau.classList.toggle('ouvert'))
for (const caseACocher of panneau.querySelectorAll<HTMLInputElement>('input[data-reglage]')) {
  const cle = caseACocher.dataset.reglage as keyof Reglages
  caseACocher.checked = reglages[cle]
  caseACocher.addEventListener('change', () => {
    reglages[cle] = caseACocher.checked
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)) } catch { /* rien */ }
  })
}

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

/**
 * Accroche la caméra à l'astre dans la sphère d'influence duquel se trouve le centre de l'écran. De très près, elle
 * s'accroche à l'objet le plus proche du centre (lune, engin), pour le suivre : l'ISS file à 8 km/s.
 */
function accrocher(t: number): void {
  const pos = (nom: string) => position(nom, t)
  const a = pos(camera.ancre)
  const centre = { x: a.x + camera.dx, y: a.y + camera.dy }
  let ancre = astreDominant(centre, t)
  if (camera.echelle < 5) {
    const voisins = [...enfants(ancre), ...PREMIER_NIVEAU.filter((c) => c.type === 'sonde')]
    let meilleur = 200 * camera.echelle
    for (const c of voisins) {
      const p = pos(c.nom)
      const d = Math.hypot(p.x - centre.x, p.y - centre.y)
      if (d < meilleur) { meilleur = d; ancre = c.nom }
    }
  }
  raccrocher(camera, ancre, pos)
}

// Barre d'échelle : une longueur ronde qui fait entre 70 et 160 pixels.
function texteDistance(km: number): string {
  if (km >= 0.1 * UA_KM) return `${(km / UA_KM).toLocaleString('fr')} UA`
  if (km >= 1e6) return `${(km / 1e6).toLocaleString('fr')} million${km >= 2e6 ? 's' : ''} de km`
  if (km < 1) return `${Math.round(km * 1000).toLocaleString('fr')} m`
  return `${km.toLocaleString('fr')} km`
}
function longueurRonde(echelle: number): number {
  const cible = 110 * echelle
  const ronds: number[] = []
  if (cible >= 0.05 * UA_KM) for (const p of [0.1, 1, 10, 100]) for (const m of [1, 2, 5]) ronds.push(m * p * UA_KM)
  else for (let p = 0.001; p <= 1e8; p *= 10) for (const m of [1, 2, 5]) ronds.push(+(m * p).toPrecision(3))
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
  const stats = dessiner(ctx, camera, t, JOUR, reglages)

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
