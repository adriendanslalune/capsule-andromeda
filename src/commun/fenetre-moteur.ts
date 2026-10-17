// La fenêtre « Nouveau moteur » (demande d'Adrien du 18/10/2026) : une belle fenêtre qui s'ouvre pour confirmer
// l'achat. Un grand compteur de vitesse montre l'ancienne et la nouvelle vitesse ; à l'installation, l'aiguille monte
// jusqu'à la nouvelle vitesse, des éclats jaillissent, puis la fenêtre se referme.

import type { NiveauMoteur } from '../donnees/capsule'

/** Angle de l'aiguille (degrés, 0 = vers le haut) pour une vitesse : échelle logarithmique de 10 à 500 km/s. */
function angle(v: number): number {
  const f = Math.log(Math.max(10, Math.min(500, v)) / 10) / Math.log(50)
  return -120 + 240 * f
}

/** Point du cadran à l'angle a (degrés) et au rayon r. */
function point(a: number, r: number): [number, number] {
  const t = ((a - 90) * Math.PI) / 180
  return [100 + r * Math.cos(t), 110 + r * Math.sin(t)]
}

/** Le compteur de vitesse : graduations, aiguille fantôme (ancienne vitesse) et aiguille (animée). */
function compteur(avant: number): string {
  const graduations = [10, 30, 60, 120, 250, 500].map((v) => {
    const [x1, y1] = point(angle(v), 70), [x2, y2] = point(angle(v), 80), [xt, yt] = point(angle(v), 56)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text x="${xt}" y="${yt + 4}">${v}</text>`
  }).join('')
  const fines = Array.from({ length: 25 }, (_, k) => {
    const a = -120 + k * 10, [x1, y1] = point(a, 75), [x2, y2] = point(a, 80)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="fine"/>`
  }).join('')
  const eclats = Array.from({ length: 12 }, (_, k) => {
    const a = k * 30, [x1, y1] = point(a, 88), [x2, y2] = point(a, 100)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
  }).join('')
  const [x0, y0] = point(-120, 80), [x1, y1] = point(120, 80)
  return `<svg class="compteur" viewBox="0 0 200 175" aria-hidden="true">
    <g class="eclats">${eclats}</g>
    <circle cx="100" cy="110" r="86" class="boitier"/>
    <path d="M${x0} ${y0} A80 80 0 1 1 ${x1} ${y1}" class="arc"/>
    <g class="graduations">${fines}${graduations}</g>
    <text x="100" y="150" class="unite">km/s</text>
    <g class="aiguille fantome" style="transform: rotate(${angle(avant)}deg)"><path d="M100 110 L97 112 L100 40 L103 112 Z"/></g>
    <g class="aiguille" style="transform: rotate(${angle(avant)}deg)"><path d="M100 110 L96 113 L100 36 L104 113 Z"/></g>
    <circle cx="100" cy="110" r="7" class="moyeu"/>
  </svg>`
}

/**
 * Ouvre la fenêtre pour passer du moteur `actuel` au moteur `suivant`. installer() fait l'achat (renvoie faux s'il
 * échoue) ; la fenêtre joue alors l'animation, puis se referme.
 */
export function ouvrirFenetreMoteur(actuel: NiveauMoteur, suivant: NiveauMoteur, installer: () => boolean): void {
  const fond = document.querySelector<HTMLDivElement>('#fenetre')!
  const nombre = (n: number) => n.toLocaleString('fr-FR')
  const fois = (suivant.vitesse / actuel.vitesse).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  fond.innerHTML = `<div class="carte-fenetre" role="dialog" aria-label="Nouveau moteur">
    <div class="titre-fenetre">✦ NOUVEAU MOTEUR ✦</div>
    ${compteur(actuel.vitesse)}
    <div class="niveaux"><span>Niveau ${actuel.niveau}</span><span class="fleche">➜</span><b>Niveau ${suivant.niveau}</b></div>
    <div class="vitesses">${nombre(actuel.vitesse)} km/s ➜ <b>${nombre(suivant.vitesse)} km/s</b><br>${fois} fois plus rapide</div>
    <div class="prix-fenetre">${nombre(suivant.prix)} crédits</div>
    <div class="boutons-fenetre"><button type="button" data-choix="plus-tard">Plus tard</button><button type="button" data-choix="installer">INSTALLER</button></div>
  </div>`
  fond.hidden = false
  const fermer = () => { fond.classList.add('ferme'); setTimeout(() => { fond.hidden = true; fond.classList.remove('ferme', 'installe') }, 250) }
  fond.onclick = (e) => {
    const cible = e.target as HTMLElement
    const choix = cible.closest<HTMLElement>('[data-choix]')?.dataset.choix
    if (cible === fond || choix === 'plus-tard') { fermer(); return }
    if (choix !== 'installer' || fond.classList.contains('installe')) return
    if (!installer()) { fermer(); return }
    // L'aiguille monte jusqu'à la nouvelle vitesse, des éclats jaillissent, puis la fenêtre se referme.
    fond.classList.add('installe')
    const aiguille = fond.querySelector<SVGGElement>('.aiguille:not(.fantome)')!
    requestAnimationFrame(() => { aiguille.style.transform = `rotate(${angle(suivant.vitesse)}deg)` })
    fond.querySelector('.titre-fenetre')!.textContent = '✦ MOTEUR INSTALLÉ ! ✦'
    fond.querySelector('.boutons-fenetre')!.innerHTML = ''
    setTimeout(fermer, 2200)
  }
}
