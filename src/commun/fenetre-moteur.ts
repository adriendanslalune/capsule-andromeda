// La fenêtre « Nouveau moteur » (demande d'Adrien du 18/10/2026) : une belle fenêtre qui s'ouvre pour confirmer
// l'achat. Un grand compteur de vitesse montre l'ancienne et la nouvelle vitesse. À l'installation (demande d'Adrien du
// 21/10/2026 : on doit voir le cadran s'améliorer), le moteur s'essaie : l'aiguille grimpe jusqu'en butée, retombe et
// se cale sur la nouvelle vitesse, le chiffre défile, l'arc gagné s'allume, le cadran tremble et des éclats jaillissent.

import type { NiveauMoteur } from '../donnees/capsule'

/** Angle de l'aiguille (degrés, 0 = vers le haut) pour une vitesse : échelle logarithmique de 10 à 20 000 km/s. */
function angle(v: number): number {
  const f = Math.log(Math.max(10, Math.min(20_000, v)) / 10) / Math.log(2000)
  return -120 + 240 * f
}

/** Point du cadran à l'angle a (degrés) et au rayon r. */
function point(a: number, r: number): [number, number] {
  const t = ((a - 90) * Math.PI) / 180
  return [100 + r * Math.cos(t), 110 + r * Math.sin(t)]
}

/** Le compteur de vitesse : graduations, aiguille fantôme (ancienne vitesse) et aiguille (animée). */
function compteur(avant: number): string {
  const graduations = [10, 100, 1000, 10_000].map((v) => {
    const [x1, y1] = point(angle(v), 70), [x2, y2] = point(angle(v), 80), [xt, yt] = point(angle(v), 56)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text x="${xt}" y="${yt + 4}">${v >= 1000 ? `${v / 1000}k` : v}</text>`
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
  return `<svg class="compteur" viewBox="0 8 200 204" aria-hidden="true">
    <g class="eclats">${eclats}</g>
    <circle cx="100" cy="110" r="86" class="boitier"/>
    <path d="M${x0} ${y0} A80 80 0 1 1 ${x1} ${y1}" class="arc"/>
    <g class="graduations">${fines}${graduations}</g>
    <path d="" class="arc-gagne"/>
    <text x="100" y="146" class="unite">km/s</text>
    <text x="100" y="176" class="compte">${avant.toLocaleString('fr-FR')}</text>
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
    <div class="vitesses">${nombre(actuel.vitesse)} km/s ➜ <b>${nombre(suivant.vitesse)} km/s</b><br>vitesse max ×${fois} : les longs trajets raccourcissent</div>
    <div class="prix-fenetre">${nombre(suivant.prix)} crédits${Object.keys(suivant.materiaux).length
      ? `<small>+ ${Object.entries(suivant.materiaux).map(([nom, n]) => `${n} t de ${nom.toLowerCase()}`).join(' et ')}</small>` : ''}</div>
    <div class="boutons-fenetre"><button type="button" data-choix="plus-tard">Plus tard</button><button type="button" data-choix="installer">INSTALLER</button></div>
  </div>`
  fond.hidden = false
  const fermer = () => { fond.classList.add('ferme'); setTimeout(() => { fond.hidden = true; fond.classList.remove('ferme', 'installe', 'cale') }, 250) }
  fond.onclick = (e) => {
    const cible = e.target as HTMLElement
    const choix = cible.closest<HTMLElement>('[data-choix]')?.dataset.choix
    if (cible === fond || choix === 'plus-tard') { fermer(); return }
    if (choix !== 'installer' || fond.classList.contains('installe')) return
    if (!installer()) { fermer(); return }
    fond.classList.add('installe')
    fond.querySelector('.boutons-fenetre')!.innerHTML = ''
    navigator.vibrate?.([60, 40, 60, 40, 200])
    animer(fond, actuel.vitesse, suivant.vitesse, () => {
      fond.querySelector('.titre-fenetre')!.textContent = '✦ MOTEUR INSTALLÉ ! ✦'
      fond.querySelector('.boutons-fenetre')!.innerHTML = '<button type="button" class="principal" data-choix="plus-tard">EN ROUTE !</button>'
    })
  }
}

/** Arc du cadran entre deux angles (degrés). */
function arc(a0: number, a1: number, r: number): string {
  const [x0, y0] = point(a0, r), [x1, y1] = point(a1, r)
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
}

/**
 * L'essai du nouveau moteur (3 s environ, piloté image par image : il se joue même si le téléphone réduit les
 * animations) : l'aiguille grimpe en butée, retombe et se cale sur la nouvelle vitesse en rebondissant ; le chiffre
 * défile, l'arc gagné s'allume ; à la fin, le cadran tremble et des éclats jaillissent.
 */
function animer(fond: HTMLElement, avant: number, apres: number, fini: () => void): void {
  const aiguille = fond.querySelector<SVGGElement>('.aiguille:not(.fantome)')!
  const compte = fond.querySelector<SVGTextElement>('.compte')!
  const gagne = fond.querySelector<SVGPathElement>('.arc-gagne')!
  const compteur = fond.querySelector<SVGSVGElement>('.compteur')!
  const BUTEE = 20_000, MONTEE = 700, DESCENTE = 1300
  const debut = performance.now()
  const doux = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
  // Un rebond au bout (l'aiguille dépasse un peu, puis revient).
  const rebond = (k: number) => 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2
  const vitesseEn = (ms: number): number => {
    if (ms < MONTEE) return avant * (BUTEE / avant) ** doux(ms / MONTEE)
    const k = Math.min(1, (ms - MONTEE) / DESCENTE)
    return BUTEE * (apres / BUTEE) ** rebond(k)
  }
  const image = (maintenant: number) => {
    const ms = maintenant - debut
    const v = vitesseEn(ms)
    aiguille.style.transform = `rotate(${angle(v)}deg)`
    // Le chiffre suit l'aiguille en descente ; il se cale sur la nouvelle vitesse.
    const affiche = ms < MONTEE ? avant : ms >= MONTEE + DESCENTE ? apres : Math.round(Math.max(apres, Math.min(BUTEE, v)))
    compte.textContent = affiche.toLocaleString('fr-FR')
    if (ms > MONTEE) {
      const k = Math.min(1, (ms - MONTEE) / DESCENTE)
      gagne.setAttribute('d', arc(angle(avant), angle(avant) + (angle(apres) - angle(avant)) * doux(k), 80))
    }
    // Le cadran vibre pendant que le moteur hurle.
    const secousse = ms < MONTEE + 300 ? 2.2 * Math.sin(ms / 18) : 0
    compteur.style.transform = `translate(${secousse.toFixed(2)}px, ${(secousse * 0.6).toFixed(2)}px)`
    if (ms < MONTEE + DESCENTE) { requestAnimationFrame(image); return }
    compteur.style.transform = ''
    fond.classList.add('cale')
    fini()
  }
  requestAnimationFrame(image)
}
