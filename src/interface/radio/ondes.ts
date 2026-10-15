// L'écran des ondes du poste radio, partagé par le poste complet (volet POSTE RADIO) et le pupitre du cockpit : la
// forme du signal de chaque station, son dessin (souffle + porteuse), et le texte reçu (en clair ou brouillé).

import { ALPHABET_MORSE } from '../../donnees/modules'
import { sequenceMorse } from '../../moteur/modules/mo1'
import type { Emission, Reception } from '../../moteur/radio'

/** Le signal des monolithes : des groupes d'impulsions de 2, 3, 5, 7 et 11. */
export const PREMIERS = [2, 3, 5, 7, 11]

/** Ce que fait la porteuse à l'instant s (secondes) : allumée (0 à 1), sa forme, sa hauteur pour le haut-parleur. */
export function signalDuMoment(e: Emission | null, s: number): { allume: number; hauteur: number; forme: (x: number) => number } {
  let allume = 0, hauteur = 600, forme = (x: number) => Math.sin(x)
  if (e?.sorte === 'morse') {
    const seq = sequenceMorse(e.indicatif)
    const total = seq.reduce((a, [, d]) => a + d, 0)
    let k = s % total
    for (const [on, d] of seq) { if (k < d) { allume = on ? 1 : 0; break } k -= d }
    hauteur = 700
  } else if (e?.sorte === 'observatoire') {
    allume = s % 1 < 0.18 ? 1 : 0
    hauteur = 880
    forme = (x) => (Math.sin(x) > 0 ? 1 : -1) * 0.8
  } else if (e?.sorte === 'transmissions') {
    const bloc = Math.floor(s / 0.14)
    allume = ((bloc * 2654435761) >>> 0) % 7 < 4 ? 0.9 : 0.15
    hauteur = 420 + (((bloc * 40503) >>> 0) % 5) * 40
    forme = (x) => Math.sin(x) * 0.7 + Math.sin(x * 2.3) * 0.3
  } else if (e?.sorte === 'detresse') {
    // Veille : une porteuse faible et régulière, sans appel.
    allume = 0.25
    hauteur = 520
  } else if (e?.sorte === 'monolithe') {
    // Groupes d'impulsions (2, 3, 5, 7, 11), une impulsion toutes les 0,25 s, une pause entre deux groupes.
    const sequence = PREMIERS.flatMap((n) => [...Array(n).fill(1), 0, 0, 0])
    const k = Math.floor(s / 0.25) % sequence.length
    allume = sequence[k] && s % 0.25 < 0.12 ? 1 : 0
    hauteur = 1320
    forme = (x) => Math.sin(x) * 0.6 + Math.sin(x * 3) * 0.4
  } else if (e?.sorte === 'radio-terre') {
    allume = 0.55 + 0.45 * Math.abs(Math.sin(s * 2.1) * Math.sin(s * 0.7 + 1))
    hauteur = 330 + 60 * Math.sin(s * 1.3)
    forme = (x) => Math.sin(x) * 0.6 + Math.sin(x * 1.5 + s * 3) * 0.4
  }
  return { allume, hauteur, forme }
}

/**
 * Dessine l'écran des ondes (fond, quadrillage, onde) à l'instant `horloge` (ms) ; `ping` : de 1 (on vient
 * d'émettre) à 0. Renvoie de quoi régler le haut-parleur.
 */
export function dessinerOndes(c: CanvasRenderingContext2D, W: number, H: number, r: Reception, horloge: number,
  ping: number, epaisseur = 2): { souffle: number; ton: number; hauteur: number } {
  const s = horloge / 1000
  const n = r.emission ? r.nettete : 0
  const { allume, hauteur, forme } = signalDuMoment(r.emission, s)
  c.fillStyle = '#0d1a14'
  c.fillRect(0, 0, W, H)
  c.strokeStyle = 'rgba(143, 207, 152, 0.15)'
  c.lineWidth = 1
  for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo((W * i) / 10, 0); c.lineTo((W * i) / 10, H); c.stroke() }
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, (H * i) / 4); c.lineTo(W, (H * i) / 4); c.stroke() }
  // L'onde : du souffle, plus le signal capté (d'autant plus net qu'on est près de la fréquence).
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
  c.strokeStyle = '#8fcf98'
  c.shadowColor = '#8fcf98'
  c.shadowBlur = 6 * dpr
  c.lineWidth = epaisseur * dpr
  c.beginPath()
  const souffle = 0.08 + 0.32 * (1 - n)
  for (let x = 0; x <= W; x += 2) {
    const u = x / W
    let y = (Math.random() * 2 - 1) * souffle
    y += n * allume * 0.75 * forme(u * 40 + s * 18)
    if (ping) y = (Math.sin(u * 90 - s * 40) > 0 ? 1 : -1) * 0.9 * ping + y * (1 - ping)
    const py = H / 2 - y * H * 0.42
    if (x === 0) c.moveTo(x, py)
    else c.lineTo(x, py)
  }
  c.stroke()
  c.shadowBlur = 0
  return { souffle, ton: n * allume + ping, hauteur: ping ? 1200 : hauteur }
}

const heureTU = (ms: number) => {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCHours())} H ${p(d.getUTCMinutes())} MIN ${p(d.getUTCSeconds())} S TU`
}
const enMorse = (indicatif: string) => [...indicatif].map((l) => ALPHABET_MORSE[l].replaceAll('.', '·').replaceAll('-', '−')).join('   ')

/** Ce qu'on entend d'une station, en clair. */
export function texteClair(e: Emission): string {
  switch (e.sorte) {
    case 'radio-terre': return `ICI RADIO-TERRE. ${e.texte} TOP : ${heureTU(e.topHoraire)}.`
    case 'observatoire': return `${e.texte} FIN DU BULLETIN.`
    case 'transmissions': return e.texte
    case 'morse': return enMorse(e.indicatif)
    case 'detresse': return e.texte
    case 'monolithe': return PREMIERS.map((n) => '▮'.repeat(n)).join('  ')
  }
}

/** Le texte reçu : en clair si c'est net, mangé de signes sinon ('' s'il n'y a que du souffle). */
export function texteRecu(r: Reception): string {
  if (!r.emission) return ''
  const clair = texteClair(r.emission)
  if (r.nettete >= 1) return clair
  const perte = Math.pow(1 - r.nettete, 0.6)
  return [...clair].map((c) => (c === ' ' || Math.random() > perte ? c : '#%&*?/'[Math.floor(Math.random() * 6)])).join('')
}
