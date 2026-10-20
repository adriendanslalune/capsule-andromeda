import { describe, expect, it } from 'vitest'
import { MARCHANDISES } from '../src/donnees/marche'
import { PNJS, QUETES } from '../src/donnees/quetes'
import type { Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { accepter, avancerQuetes, disponibles, enCours, objectif, parler, quete, signePnj } from '../src/moteur/quetes'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 20, 12)

/** Une partie où l'on décide soi-même où la capsule est en orbite. */
function partie(): Jeu & { ici: string | null } {
  const jeu = new Jeu() as Jeu & { ici: string | null }
  jeu.ici = 'Terre'
  jeu.lieuEnOrbite = () => jeu.ici
  return jeu
}
const contrat = (genre: string, tableau: string) => ({ id: 1, genre, etapes: [], recompense: 0, tableau }) as unknown as Contrat

describe('les PNJ et les quêtes : les données', () => {
  it('chaque PNJ est à un lieu de la carte ; chaque quête a un donneur, des conditions et des étapes valables', () => {
    for (const p of PNJS) expect(corps(p.lieu), p.lieu).toBeDefined()
    for (const q of QUETES) {
      expect(PNJS.some((p) => p.id === q.donneur)).toBe(true)
      for (const c of q.conditions) expect(QUETES.some((x) => x.id === c)).toBe(true)
      for (const e of q.etapes) {
        if (e.genre === 'parler') expect(PNJS.some((p) => p.id === e.pnj)).toBe(true)
        if (e.genre === 'aller' || e.genre === 'livrer') expect(corps(e.lieu)).toBeDefined()
        if (e.genre === 'livrer') for (const m of Object.keys(e.marchandises)) expect(MARCHANDISES.some((x) => x.nom === m)).toBe(true)
      }
      // La dernière étape : on revient parler à quelqu'un (le donneur, en général).
      expect(q.etapes[q.etapes.length - 1].genre).toBe('parler')
    }
  })
})

describe('la Lune, de bout en bout', () => {
  it('Elsa propose la première quête (« ! » principal) ; on l’accepte, elle devient la quête suivie', () => {
    const jeu = partie()
    expect(disponibles(jeu).map((q) => q.id)).toEqual(['lune-1', 'veilleur', 'rosa'])
    expect(signePnj(jeu, 'elsa')).toEqual({ signe: '!', principale: true })
    expect(signePnj(jeu, 'veilleur')).toEqual({ signe: '!', principale: false })
    expect(signePnj(jeu, 'keita')).toBeNull()
    const d = parler(jeu, 'elsa', t0)
    expect(d.proposition?.id).toBe('lune-1')
    expect(accepter(jeu, 'lune-1', t0)).toBe(true)
    expect(jeu.queteSuivie).toBe('lune-1')
    expect(objectif(jeu, quete('lune-1'))?.lieu).toBe('Lune')
    expect(signePnj(jeu, 'elsa')).toBeNull()
  })

  it('aller sur la Lune, parler à Keïta, revenir à Elsa : quête finie, récompense, la suite se débloque', () => {
    const jeu = partie()
    accepter(jeu, 'lune-1', t0)
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes['lune-1'].etape).toBe(0)
    jeu.ici = 'Lune'
    expect(avancerQuetes(jeu, { genre: 'instant' }, t0 + 1)[0]).toMatch(/Parle au Dr Amadou Keïta \(Lune\)/)
    expect(signePnj(jeu, 'keita')).toEqual({ signe: '?', principale: true })
    expect(parler(jeu, 'keita', t0 + 2).pages.length).toBeGreaterThan(0)
    const avant = jeu.credits
    const fin = parler(jeu, 'elsa', t0 + 3)
    expect(fin.terminee?.id).toBe('lune-1')
    expect(jeu.credits).toBe(avant + 300)
    expect(disponibles(jeu).map((q) => q.id)).toEqual(expect.arrayContaining(['lune-2', 'lune-3']))
  })

  it('les missions comptent seulement si elles sont du bon genre et dans le bon système', () => {
    const jeu = partie()
    jeu.quetes['lune-1'] = { etape: 3, compte: 0, debut: t0, fin: t0 }
    accepter(jeu, 'lune-2', t0)
    avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('chasser', 'Mars') }, t0)
    avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('nettoyer', 'Terre') }, t0)
    expect(jeu.quetes['lune-2'].compte).toBe(0)
    expect(avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('chasser', 'Terre') }, t0)).toEqual(['Les guetteurs d\'Andromède : 1/2'])
    expect(objectif(jeu, quete('lune-2'))?.compte).toBe('1/2')
    avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('chasser', 'Terre') }, t0)
    expect(jeu.quetes['lune-2'].etape).toBe(1)
  })

  it('livrer : il faut tout avoir en soute, et être en orbite au bon endroit ; les marchandises quittent la soute', () => {
    const jeu = partie()
    jeu.quetes['lune-1'] = { etape: 3, compte: 0, debut: t0, fin: t0 }
    accepter(jeu, 'lune-3', t0)
    jeu.soute = { Eau: 5, Titane: 1 }
    jeu.ici = 'Lune'
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes['lune-3'].etape).toBe(0)
    jeu.soute = { Eau: 6, Titane: 2 }
    jeu.ici = 'Terre'
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes['lune-3'].etape).toBe(0)
    jeu.ici = 'Lune'
    avancerQuetes(jeu, { genre: 'instant' }, t0)
    expect(jeu.quetes['lune-3'].etape).toBe(1)
    expect(jeu.soute).toEqual({ Eau: 1 })
  })

  it('la dernière quête libère la Lune ; tout est sauvegardé', () => {
    const jeu = partie()
    for (const id of ['lune-1', 'lune-2', 'lune-3', 'lune-4']) jeu.quetes[id] = { etape: 9, compte: 0, debut: t0, fin: t0 }
    accepter(jeu, 'lune-5', t0)
    for (let k = 0; k < 3; k++) avancerQuetes(jeu, { genre: 'contrat', contrat: contrat('chasser', 'Terre') }, t0)
    parler(jeu, 'elsa', t0 + 1)
    expect(jeu.zonesLiberees).toEqual(['Lune'])
    expect(enCours(jeu)).toEqual([])
    accepter(jeu, 'veilleur', t0 + 2)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.quetes).toEqual(jeu.quetes)
    expect(copie.zonesLiberees).toEqual(['Lune'])
    expect(copie.queteSuivie).toBe('veilleur')
  })
})
