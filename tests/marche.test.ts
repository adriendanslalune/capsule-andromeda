import { describe, expect, it } from 'vitest'
import { MARCHANDISES, MARCHES } from '../src/donnees/marche'
import type { Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { coursDuMarche, delaiLumiere } from '../src/moteur/marche'
import { maisonDuContrat } from '../src/donnees/maisons'

const t0 = Date.UTC(2026, 9, 18, 12)

describe('le Marché', () => {
  it('chaque marché est sur un astre ou un engin qui existe', () => {
    for (const m of MARCHES) expect(corps(m.lieu), m.lieu).toBeDefined()
  })

  it('le délai de la lumière : environ 1,3 s pour la Lune, plusieurs minutes pour Mars', () => {
    const lune = delaiLumiere('Lune', t0)
    expect(lune).toBeGreaterThan(1100)
    expect(lune).toBeLessThan(1500)
    expect(delaiLumiere('Phobos', t0)).toBeGreaterThan(3 * 60_000)
  })

  it('des cours pour chaque marchandise, achat au-dessus de la vente, toujours les mêmes pour un marché', () => {
    for (const m of MARCHES) {
      const c = coursDuMarche(m)
      expect(c).toHaveLength(MARCHANDISES.length)
      for (const x of c) expect(x.achat).toBeGreaterThanOrEqual(x.vente)
      expect(coursDuMarche(m)).toEqual(c)
    }
    expect(coursDuMarche(MARCHES[0])).not.toEqual(coursDuMarche(MARCHES[4]))
  })
})

describe('la soute', () => {
  it('une livraison chargée est à bord jusqu’à ce qu’elle soit livrée', () => {
    const c: Contrat = { id: 1, genre: 'livrer', etapes: [{ lieu: 'ISS', action: 'charger' }, { lieu: 'Hubble', action: 'livrer' }], recompense: 70 }
    const jeu = new Jeu()
    jeu.proposes = [c]
    jeu.accepter(1, t0)
    expect(jeu.cargaison()).toBeNull()
    jeu.enCours!.etape = 1
    expect(jeu.cargaison()).toEqual({ pour: 'Hubble' })
  })
})

describe('Maison du joueur', () => {
  it('ses missions sont payées 25 % de plus', () => {
    const neutre = new Jeu(), membre = new Jeu()
    membre.maison = 'nettoyeurs'
    neutre.avancer(t0)
    membre.avancer(t0)
    // Même tirage au départ : la première mission de chaque jeu est la même ; celle du membre est mieux payée.
    const a = neutre.proposes.find((c) => maisonDuContrat(c) === 'nettoyeurs')!
    const b = membre.proposes.find((c) => maisonDuContrat(c) === 'nettoyeurs')!
    expect(b.etapes).toEqual(a.etapes)
    expect(b.recompense).toBe(Math.round((a.recompense * 1.25) / 10) * 10)
  })
})
