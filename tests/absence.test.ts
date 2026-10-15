import { describe, expect, it } from 'vitest'
import { MODULES_A_INSTALLER } from '../src/donnees/economie'
import { rattraper } from '../src/moteur/absence'
import { creerPartie, type EtatPartie } from '../src/moteur/etat'
import { choisirDestination } from '../src/moteur/fusee'
import { mulberry32 } from '../src/moteur/hasard'
import { modulesEnPanne } from '../src/moteur/modules'
import { PANNES_TUTORIEL } from '../src/moteur/pannes'
import { avancerPartie } from '../src/moteur/partie'
import { charger, sauvegarder } from '../src/moteur/sauvegarde'
import { Pilote } from './outils/pilote'
import { STATIONS_RADIO } from '../src/donnees/radio'

const T0 = Date.UTC(2026, 9, 13, 12)
const H = 3_600_000
const TOUS = MODULES_A_INSTALLER.map((m) => m.code)
const partie = (): EtatPartie => creerPartie(T0, mulberry32(1), 'La Pie voleuse')
/** Partie après le tutoriel, tous modules installés, en route vers Mars, tout réparé. */
const enRoute = (): EtatPartie => {
  const e = partie()
  return {
    ...e,
    modulesInstalles: TOUS,
    ameliorations: 10,
    fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Mars' }),
    pannes: { ...e.pannes, tutoriel: PANNES_TUTORIEL, prochaine: null },
  }
}

describe('retour après une absence', () => {
  it('absence de moins de 5 s : rien à rattraper', () => {
    const e = partie()
    const r = rattraper(e, T0 + 4000, mulberry32(1))
    expect(r.rapport).toBeNull()
    expect(r.etat).toBe(e)
  })

  it('la fusée a continué son voyage : distance parcourue, vitesse, instant vu', () => {
    const r = rattraper(enRoute(), T0 + 8 * H, mulberry32(2))
    expect(r.etat.vu).toBe(T0 + 8 * H)
    expect(r.rapport!.distanceKm).toBeGreaterThan(8 * 3600 * 10) // même ralentie par les avaries
    expect(r.rapport!.depuis).toBe(T0)
    expect(r.rapport!.jusqua).toBe(T0 + 8 * H)
    expect(r.etat.fusee.destination).not.toBeNull()
  })

  it('au plus une avarie pendant l’absence (sans compter l’usure du recycleur) : une avarie bloque les suivantes', () => {
    let avecAvarie = 0
    for (let graine = 1; graine <= 30; graine++) {
      // Sans recycleur, pour voir les avaries du voyage.
      const e = { ...enRoute(), modulesInstalles: TOUS.filter((c) => c !== 'RE-1') }
      const r = rattraper(e, T0 + 3 * 24 * H, mulberry32(graine))
      const evenements = r.rapport!.avaries.filter((a) => !a.modules.every((c) => c === 'RE-1'))
      expect(evenements.length, `graine ${graine}`).toBeLessThanOrEqual(1)
      if (evenements.length) avecAvarie++
    }
    expect(avecAvarie).toBeGreaterThan(20) // en voyage, il y en a presque toujours une
  }, 60_000)

  it('en orbite : aucune avarie pendant l’absence (sauf l’usure du recycleur)', () => {
    const e = { ...enRoute(), fusee: partie().fusee }
    const r = rattraper(e, T0 + 2 * 24 * H, mulberry32(1))
    expect(r.rapport!.avaries.filter((a) => !a.modules.every((c) => c === 'RE-1'))).toEqual([])
  })

  it('le recycleur s’use pendant l’absence', () => {
    const r = rattraper(enRoute(), T0 + H, mulberry32(1))
    expect(r.etat.modules.re1.o2).toBeCloseTo(80 - 3600 / 90, 0) // 40 : avarie à moins de 25, dans une vingtaine de minutes
    const plusLong = rattraper(enRoute(), T0 + 3 * H, mulberry32(1))
    expect(modulesEnPanne(plusLong.etat.modules)).toContain('RE-1')
  })

  it('arrivée et contrat rempli pendant l’absence : dans le rapport', () => {
    let e = partie()
    // Contrat du tutoriel vers la Lune, départ, puis on ferme le jeu 12 h.
    e = { ...e, contrats: [{ id: 'tutoriel-1', type: 'LIVRAISON', texte: 'essai', destination: 'Lune', prime: 12 }] }
    e = { ...e, fusee: choisirDestination(e.fusee, { type: 'astre', astre: 'Lune' }) }
    const r = rattraper(e, T0 + 12 * H, mulberry32(3))
    expect(r.rapport!.arrivees.map((a) => a.destination)).toEqual([{ type: 'astre', astre: 'Lune' }])
    expect(r.rapport!.contratsRemplis).toBe(1)
    expect(r.rapport!.credits).toBeGreaterThanOrEqual(12)
    expect(r.rapport!.trophees).toContain('premier')
    expect(r.etat.fusee.orbite).toBe('Lune')
  })

  it('chasse : radio restée sur l’Observatoire, un seul bulletin au retour, même après 3 jours', () => {
    const e = { ...partie(), chasse: { ...partie().chasse, frequenceRadio: STATIONS_RADIO.observatoire } }
    const r = rattraper(e, T0 + 72 * H, mulberry32(1))
    expect(r.rapport!.messages.filter((m) => m.startsWith('OBSERVATOIRE'))).toHaveLength(1)
    expect(r.rapport!.messages.filter((m) => m.includes('LUEUR'))).toHaveLength(0)
  })

  it('après le retour, on peut tout réparer en suivant le manuel et reprendre la partie', () => {
    const r = rattraper(enRoute(), T0 + 24 * H, mulberry32(5))
    const p = new Pilote(r.etat, T0 + 24 * H, 5)
    p.toutReparer()
    expect(modulesEnPanne(p.m)).toEqual([])
    p.attendre(600)
  })
})

describe('sauvegarde', () => {
  it('sauvegarder puis charger redonne exactement la même partie (avec l’instant vu)', () => {
    let e = enRoute()
    for (let s = 1; s <= 120; s++) e = avancerPartie(e, T0 + s * 1000, 1, mulberry32(s)).etat
    const texte = sauvegarder(e, T0 + 120_000)
    const lu = charger(texte)
    expect(lu.erreur).toBeNull()
    expect(lu.etat).toEqual({ ...e, vu: T0 + 120_000 })
  })

  it('reprendre une partie sauvegardée : rattrapage depuis l’instant de la sauvegarde', () => {
    const texte = sauvegarder(enRoute(), T0)
    const lu = charger(texte).etat!
    const r = rattraper(lu, T0 + 2 * H, mulberry32(1))
    expect(r.rapport!.depuis).toBe(T0)
    expect(r.rapport!.distanceKm).toBeGreaterThan(0)
  })

  it('sauvegardes abîmées, étrangères ou trop récentes : refusées avec une explication', () => {
    expect(charger('pas du json').erreur).toBe('Sauvegarde illisible.')
    expect(charger('{"jeu":"autre","version":1,"etat":{}}').erreur).toBe("Ce n'est pas une sauvegarde de Manuel de vol.")
    expect(charger(JSON.stringify({ jeu: 'manuel-de-vol', version: 99, etat: {} })).erreur)
      .toBe('Sauvegarde faite par une version plus récente du jeu.')
    expect(charger(JSON.stringify({ jeu: 'manuel-de-vol', version: 1, etat: { serie: 'KE4-71B' } })).erreur)
      .toMatch(/^Sauvegarde incomplète/)
  })

  it('le texte reste raisonnable (quelques dizaines de kilo-octets au plus)', () => {
    expect(sauvegarder(enRoute(), T0).length).toBeLessThan(30_000)
  })
})
