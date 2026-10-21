import { describe, expect, it } from 'vitest'
import { DISTANCE_DEPART, FAISCEAU, ZONE_LOIN, ZONE_PROCHE } from '../src/donnees/largage'
import { HAUTEUR, LARGEUR, PLACES } from '../src/donnees/convoi'
import { arretSiLachee, avancerLargage, lacher, nouveauLargage } from '../src/moteur/largage'
import { avancerConvoi, deplacer, lacherCargo, nouveauConvoi, prendre } from '../src/moteur/convoi'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'
import type { Contrat } from '../src/moteur/contrats'

const PAS = 0.01
const t0 = Date.UTC(2026, 9, 21, 12)

/** Accepte un contrat et emmène la capsule au lieu de sa première étape ; renvoie l'heure d'arrivée. */
function surPlace(jeu: Jeu, contrat: Contrat, etape = 0): number {
  jeu.usureJusqua = Number.MAX_SAFE_INTEGER
  jeu.proposes = [contrat]
  jeu.accepter(contrat.id, t0)
  jeu.enCours!.etape = etape
  const p = planifier(jeu.mission.etatHeliocentrique(t0), contrat.etapes[etape].lieu, t0, jeu.vitesse())
  if (!p.possible) throw new Error('trajet')
  jeu.mission.partir(p.plan)
  return p.plan.arrivee + 1000
}

describe('le largage (fin de REMORQUER, idée validée par Adrien le 21/10/2026)', () => {
  it('lâchée trop tôt : elle s’arrête avant la zone (trop court) ; on recommence, un raté de plus', () => {
    const e = nouveauLargage(4)
    expect(e.distance).toBe(DISTANCE_DEPART)
    for (let k = 0; k < 400; k++) avancerLargage(e, PAS, true) // freiner à fond, puis lâcher de loin
    expect(arretSiLachee(e)).toBeGreaterThan(ZONE_LOIN)
    lacher(e)
    let r = null
    for (let k = 0; k < 10_000 && !r; k++) r = avancerLargage(e, PAS)
    expect(r).toBe('court')
    expect(e.rates).toBe(1)
    expect(e.phase).toBe('approche')
  })

  it('lâchée trop tard, trop vite : elle cogne la station ; sans lâcher, la capsule recule (trop près)', () => {
    const e = nouveauLargage(4)
    while (arretSiLachee(e) > -5) avancerLargage(e, PAS)
    lacher(e)
    let r = null
    for (let k = 0; k < 10_000 && !r; k++) r = avancerLargage(e, PAS)
    expect(r).toBe('long')
    const f = nouveauLargage(7)
    r = null
    for (let k = 0; k < 10_000 && !r; k++) r = avancerLargage(f, PAS, true)
    expect(r).toBe('trop-pres')
  })

  it('freiner puis lâcher au bon moment : elle s’arrête dans la zone de dépôt', () => {
    const e = nouveauLargage(11)
    // On freine un moment, puis on lâche quand elle s'arrêtera au milieu de la zone.
    for (let k = 0; k < 150; k++) avancerLargage(e, PAS, true)
    while (arretSiLachee(e) > (ZONE_PROCHE + ZONE_LOIN) / 2) avancerLargage(e, PAS)
    lacher(e)
    let r = null
    for (let k = 0; k < 10_000 && !r; k++) r = avancerLargage(e, PAS)
    expect(r).toBe('deposee')
    expect(e.rates).toBe(0)
    expect(e.distance).toBeGreaterThanOrEqual(ZONE_PROCHE)
    expect(e.distance).toBeLessThanOrEqual(ZONE_LOIN)
    expect(FAISCEAU).toBeGreaterThan(0)
  })

  it('le jeu : à la station, larguée du premier coup, +10 % et le contrat est fini', () => {
    const jeu = new Jeu()
    const contrat: Contrat = { id: 1, genre: 'remorquer', etapes: [{ lieu: 'Telstar 1', action: 'harponner' }, { lieu: 'ISS', action: 'larguer' }], recompense: 100, tableau: 'Terre' }
    const t = surPlace(jeu, contrat, 1)
    expect(jeu.etapeDeLargage()).toBe(true)
    const credits = jeu.credits
    expect(jeu.larguer(0, t)).not.toBeNull()
    expect(jeu.credits - credits).toBe(110)
    expect(jeu.enCours).toBeNull()
  })
})

describe('la formation du convoi (début d’ESCORTER, idée validée par Adrien le 21/10/2026)', () => {
  it('les cargos sortent du hangar un par un ; laissés à la dérive, ils s’égarent et y retournent', () => {
    const e = nouveauConvoi(3)
    avancerConvoi(e, 1)
    expect(e.cargos.filter((c) => c.etat === 'derive')).toHaveLength(1)
    let egares = 0
    for (let k = 0; k < 4000; k++) if (avancerConvoi(e, PAS) === 'egare') egares++
    expect(egares).toBeGreaterThan(0)
    expect(e.egares).toBe(egares)
    for (const c of e.cargos) if (c.etat === 'derive') expect(c.x >= -6 && c.x <= LARGEUR + 6 && c.y <= HAUTEUR + 6).toBe(true)
  })

  it('attraper chaque cargo et le lâcher sur une place libre : le convoi est formé ; lâché ailleurs, il repart à la dérive', () => {
    const e = nouveauConvoi(8)
    let places = 0
    for (let k = 0; k < 3000 && !e.forme; k++) {
      avancerConvoi(e, PAS)
      const i = e.cargos.findIndex((c) => c.etat === 'derive')
      if (i < 0) continue
      const c = e.cargos[i]
      expect(prendre(e, c.x + 3, c.y - 3)).toBe(i)
      if (places === 0) {
        // Lâché loin de toute place : il repart.
        deplacer(e, i, 50, 120)
        expect(lacherCargo(e, i)).toBe('derive')
        expect(prendre(e, 50, 120)).toBe(i)
      }
      const libre = PLACES.findIndex((_, p) => !e.cargos.some((x) => x.place === p))
      deplacer(e, i, PLACES[libre].x + 4, PLACES[libre].y + 4)
      expect(lacherCargo(e, i)).toBe('place')
      places++
    }
    expect(e.forme).toBe(true)
    expect(new Set(e.cargos.map((c) => c.place)).size).toBe(3)
    expect(prendre(e, PLACES[0].x, PLACES[0].y)).toBeNull() // un cargo rangé ne se reprend pas
  })

  it('le jeu : le convoi formé, l’étape est faite et la capsule part l’escorter', () => {
    const jeu = new Jeu()
    const contrat: Contrat = { id: 2, genre: 'escorter', etapes: [{ lieu: 'ISS', action: 'rejoindre' }, { lieu: 'Hubble', action: 'escorter' }], recompense: 100, tableau: 'Terre' }
    const t = surPlace(jeu, contrat)
    expect(jeu.etapeDeConvoi()).toBe(true)
    const ev = jeu.formerConvoi(t, jeu.vitesse())
    expect(ev?.some((x) => x.genre === 'depart-auto')).toBe(true)
    expect(jeu.etapeDEscorte()).toBe(true)
    expect(jeu.enCours!.contrat.recompense).toBe(100)
  })
})
