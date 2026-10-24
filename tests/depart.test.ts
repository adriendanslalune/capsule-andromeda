import { describe, expect, it } from 'vitest'
import { etatSurOrbite, orbiteDerriere } from '../src/moteur/capsule'
import { position } from '../src/moteur/corps'
import { planifier } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 23, 18)

describe('le départ (Adrien, 23/10/2026 : le premier trajet, jusqu’à l’ISS, en moins de 30 secondes)', () => {
  it('la capsule naît sur l’orbite de l’ISS, une quarantaine de kilomètres derrière elle', () => {
    const o = orbiteDerriere('ISS', t0, 40)
    const ecart = (t: number) => { const a = etatSurOrbite(o, t).position, b = position('ISS', t); return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) }
    expect(ecart(t0)).toBeGreaterThan(30)
    expect(ecart(t0)).toBeLessThan(50)
    // Une heure plus tard, elle est toujours tout près (même orbite).
    expect(ecart(t0 + 3_600_000)).toBeLessThan(150)
  })
})

describe('le premier trajet', () => {
  it('de la naissance de la capsule à l’ISS, au moteur 1 : moins de 30 secondes', async () => {
    const { Mission } = await import('../src/moteur/mission')
    const m = new Mission()
    m.orbite = orbiteDerriere('ISS', t0, 40)
    const p = planifier(m.etatHeliocentrique(t0 + 5000), 'ISS', t0 + 5000, 30)
    if (!p.possible) throw new Error('impossible')
    expect((p.plan.arrivee - p.plan.depart) / 1000).toBeLessThan(30)
  })
})

describe('les contrats du tutoriel (Adrien, 24/10/2026 : tout à moins de 5 minutes)', () => {
  it('pendant « Le cœur de la capsule », le tableau de la Terre est dans le voisinage de l’ISS, chaque trajet en moins de 5 minutes', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const { VOISINAGE_ISS } = await import('../src/donnees/espace')
    const jeu = new Jeu()
    jeu.nouvellePartie(1234, t0)
    jeu.quetes.q1 = { etape: 0, compte: 0, debut: t0, fin: null }
    jeu.proposer(t0)
    const terre = jeu.proposes.filter((c) => c.tableau === 'Terre')
    expect(terre.map((c) => c.genre).sort()).toEqual(['depanner', 'nettoyer', 'nettoyer', 'remorquer'])
    // Un état (position, vitesse) sur place, à un lieu.
    const etat = (lieu: string, t: number) => {
      const a = position(lieu, t), b = position(lieu, t + 1000)
      return { r: a, v: { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z } }
    }
    // À toute heure de la journée (l'ISS fait le tour de la Terre en 92 minutes).
    for (let h = 0; h < 24; h += 5) {
      const t = t0 + h * 3_600_000
      for (const c of terre) {
        let depart = jeu.mission.etatHeliocentrique(t)
        for (const e of c.etapes) {
          expect(e.lieu === 'ISS' || e.lieu in VOISINAGE_ISS).toBe(true)
          const p = planifier(depart, e.lieu, t, 30)
          if (!p.possible) throw new Error('impossible')
          expect((p.plan.arrivee - p.plan.depart) / 1000).toBeLessThan(300)
          depart = etat(e.lieu, t)
        }
      }
    }
  })

  it('le moteur amélioré, le tableau de la Terre redevient ordinaire', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const jeu = new Jeu()
    jeu.nouvellePartie(1234, t0)
    jeu.quetes.q1 = { etape: 0, compte: 0, debut: t0, fin: null }
    jeu.proposer(t0)
    jeu.niveauMoteur = 2
    jeu.quetes.q1.fin = t0
    jeu.proposer(t0)
    expect(jeu.proposes.filter((c) => c.tableau === 'Terre').length).toBeGreaterThan(4)
  })
})
