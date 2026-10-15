// Sons du bord, fabriqués par le navigateur (aucun fichier) : bips, réussite, erreur, et une alarme propre à
// chaque module (reprises du prototype).

let contexte: AudioContext | null = null
let actif = lireReglage()

function lireReglage(): boolean {
  try { return localStorage.getItem('mdv-son') !== 'muet' } catch { return true }
}

export function sonActif(): boolean {
  return actif
}

export function basculerSon(): boolean {
  actif = !actif
  try { localStorage.setItem('mdv-son', actif ? 'actif' : 'muet') } catch { /* sans effet */ }
  return actif
}

function bip(frequence: number, duree: number, forme: OscillatorType = 'square', volume = 0.05, glissando?: number) {
  if (!actif) return
  try {
    contexte ??= new AudioContext()
    if (contexte.state === 'suspended') void contexte.resume()
  } catch {
    return
  }
  const o = contexte.createOscillator()
  const g = contexte.createGain()
  const t = contexte.currentTime
  o.type = forme
  o.frequency.setValueAtTime(frequence, t)
  if (glissando) o.frequency.exponentialRampToValueAtTime(glissando, t + duree)
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  o.connect(g)
  g.connect(contexte.destination)
  o.start(t)
  o.stop(t + duree + 0.02)
}

const plus = (ms: number, f: () => void) => setTimeout(f, ms)

export const SONS = {
  bouton: () => bip(220, 0.1, 'triangle', 0.12, 110),
  erreur: () => { bip(90, 0.35, 'sawtooth', 0.1); bip(95, 0.35, 'sawtooth', 0.08) },
  bon: () => { bip(660, 0.08, 'triangle', 0.08); plus(90, () => bip(990, 0.12, 'triangle', 0.08)) },
  echo: () => bip(700, 0.18, 'sine', 0.06, 1100),
}

/** Alarme de chaque module en avarie. */
export const ALARMES: Record<string, () => void> = {
  'CH-1': () => { bip(440, 0.12, 'square', 0.04); plus(180, () => bip(440, 0.12, 'square', 0.04)) }, // double bip : pression
  'TU-1': () => bip(500, 0.45, 'sawtooth', 0.04, 1100), // sirène montante : surchauffe
  'AL-1': () => { for (let i = 0; i < 5; i++) plus(i * 45, () => bip(2000 + Math.random() * 1500, 0.02, 'square', 0.04)) }, // grésillement
  'CO-1': () => { for (let i = 0; i < 6; i++) plus(i * 55, () => bip(i % 2 ? 1000 : 800, 0.05, 'square', 0.035)) }, // téléphone
  'PB-1': () => bip(110, 0.35, 'sawtooth', 0.06), // bourdonnement
  'LP-1': () => bip(1900, 0.4, 'sine', 0.03, 1700), // sifflement aigu
  'HY-1': () => { bip(380, 0.12, 'sine', 0.06, 180); plus(150, () => bip(330, 0.12, 'sine', 0.06, 150)) }, // glouglou
  'RE-1': () => bip(160, 0.6, 'triangle', 0.05, 220), // souffle grave
  'MO-1': () => {}, // le morse a déjà sa propre lampe
  'CR-1': () => { bip(1500, 0.02, 'square', 0.05); plus(260, () => bip(1100, 0.02, 'square', 0.05)) }, // tic-tac
  'AN-1': () => bip(1600, 0.5, 'sine', 0.04, 300),
  'SX-1': () => { bip(1320, 0.25, 'sine', 0.04); plus(160, () => bip(1760, 0.35, 'sine', 0.035)) },
}

/**
 * Haut-parleur du poste radio : un souffle continu (bruit filtré) et une tonalité (bips, morse, porteuse), dont on
 * règle le volume à chaque image. Muet si le son est coupé.
 */
let radio: { souffle: GainNode; ton: GainNode; oscillateur: OscillatorNode; source: AudioBufferSourceNode } | null = null

export const sonRadio = {
  /** souffle et ton : 0 à 1 ; frequence : hauteur de la tonalité (Hz). */
  regler(souffle: number, ton: number, frequence: number) {
    if (!actif) { this.couper(); return }
    try {
      contexte ??= new AudioContext()
      if (contexte.state === 'suspended') void contexte.resume()
    } catch {
      return
    }
    const c = contexte
    if (!radio) {
      const tampon = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
      const d = tampon.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      const source = c.createBufferSource()
      source.buffer = tampon
      source.loop = true
      const filtre = c.createBiquadFilter()
      filtre.type = 'bandpass'
      filtre.frequency.value = 1800
      filtre.Q.value = 0.6
      const gs = c.createGain()
      gs.gain.value = 0
      source.connect(filtre).connect(gs).connect(c.destination)
      const oscillateur = c.createOscillator()
      oscillateur.type = 'sine'
      const gt = c.createGain()
      gt.gain.value = 0
      oscillateur.connect(gt).connect(c.destination)
      source.start()
      oscillateur.start()
      radio = { souffle: gs, ton: gt, oscillateur, source }
    }
    const t = c.currentTime
    radio.souffle.gain.setTargetAtTime(0.05 * souffle, t, 0.03)
    radio.ton.gain.setTargetAtTime(0.06 * ton, t, 0.008)
    radio.oscillateur.frequency.setTargetAtTime(frequence, t, 0.01)
  },
  couper() {
    if (!radio) return
    radio.source.stop()
    radio.oscillateur.stop()
    radio.souffle.disconnect()
    radio.ton.disconnect()
    radio = null
  },
}
