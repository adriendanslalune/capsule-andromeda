import { describe, expect, it } from 'vitest'
import { position, positionRelative } from '../src/moteur/corps'

// Demande d'Adrien du 18/10/2026 : s'assurer que planètes et satellites tournent à leur vitesse.
const t0 = Date.UTC(2026, 9, 18, 12)
const JOUR = 86_400_000
const angle = (p: { x: number; y: number }) => Math.atan2(p.y, p.x)
/** Angle parcouru (degrés, dans le sens du mouvement) entre deux positions. */
function parcouru(a: { x: number; y: number }, b: { x: number; y: number }): number {
  let d = ((angle(b) - angle(a)) * 180) / Math.PI
  while (d <= -180) d += 360
  while (d > 180) d -= 360
  return d
}

describe('les astres tournent à leur vraie vitesse', () => {
  it('les planètes autour du Soleil (degrés par jour, sur 10 jours)', () => {
    const attendus: Record<string, number> = { Mercure: 4.09, Vénus: 1.60, Terre: 0.986, Mars: 0.524, Jupiter: 0.0831, Saturne: 0.0335, Uranus: 0.0117, Neptune: 0.006, Pluton: 0.004 }
    for (const [nom, v] of Object.entries(attendus)) {
      const d = parcouru(position(nom, t0), position(nom, t0 + 10 * JOUR)) / 10
      // Orbites excentriques (Mercure, Mars, Pluton) : la vitesse varie le long de l'orbite.
      expect(d / v, nom).toBeGreaterThan(0.6)
      expect(d / v, nom).toBeLessThan(1.6)
    }
  })

  it('la Lune fait le tour de la Terre en 27,3 jours (environ 13° par jour)', () => {
    for (let k = 0; k < 28; k++) {
      const d = parcouru(positionRelative('Lune', t0 + k * JOUR), positionRelative('Lune', t0 + (k + 1) * JOUR))
      expect(d).toBeGreaterThan(10.5)
      expect(d).toBeLessThan(16)
    }
  })

  it('les lunes des géantes (degrés par heure)', () => {
    // Période sidérale (jours) ; Triton tourne à l'envers.
    const periodes: Record<string, number> = { Io: 1.769, Europe: 3.551, Ganymède: 7.155, Callisto: 16.69, Titan: 15.95, Rhéa: 4.518, Triton: -5.877, Phobos: 0.3189 }
    for (const [nom, P] of Object.entries(periodes)) {
      const h = 3_600_000
      const d = parcouru(positionRelative(nom, t0), positionRelative(nom, t0 + h))
      const attendu = 360 / (P * 24)
      expect(d / attendu, nom).toBeGreaterThan(0.6)
      expect(d / attendu, nom).toBeLessThan(1.6)
    }
  })
})
