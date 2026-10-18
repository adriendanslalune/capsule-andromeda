import { describe, expect, it } from 'vitest'
import { MARCHANDISES, MARCHES } from '../src/donnees/marche'
import type { Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { achatVente, cours, delaiLumiere, historique, vueMarche } from '../src/moteur/marche'
import { maisonDuContrat } from '../src/donnees/maisons'

const t0 = Date.UTC(2026, 9, 18, 12)

describe('le Marché', () => {
  it('un marché par système : les huit planètes et Pluton, tous connus du moteur', () => {
    expect(MARCHES.map((m) => m.nom)).toEqual(['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton'])
    for (const m of MARCHES) expect(corps(m.lieu), m.lieu).toBeDefined()
  })

  it('les cours de son propre système sont en direct ; ceux de Mars ont des minutes de retard', () => {
    const terre = vueMarche(MARCHES[2], t0), mars = vueMarche(MARCHES[3], t0)
    expect(terre.ici).toBe(true)
    expect(terre.delai).toBe(0)
    expect(mars.ici).toBe(false)
    expect(mars.delai).toBeGreaterThan(3 * 60_000)
    expect(mars.connuA).toBe(t0 - mars.delai)
    expect(vueMarche(MARCHES[8], t0).delai).toBeGreaterThan(4 * 3_600_000) // Pluton : plus de 4 heures
  })

  it('le délai de la lumière : environ 1,3 s pour la Lune', () => {
    expect(delaiLumiere('Lune', t0)).toBeGreaterThan(1100)
    expect(delaiLumiere('Lune', t0)).toBeLessThan(1500)
  })

  it('les cours : reproductibles, continus, autour du prix de base, différents d’un marché à l’autre', () => {
    const [m, f] = [MARCHES[3], MARCHANDISES[1]]
    expect(cours(m, f, t0)).toBe(cours(m, f, t0))
    expect(Math.abs(cours(m, f, t0 + 1000) - cours(m, f, t0))).toBeLessThan(0.01 * f.prix)
    for (const mm of MARCHES) for (const ff of MARCHANDISES) {
      for (let k = 0; k < 50; k++) {
        const c = cours(mm, ff, t0 + k * 7_777_777)
        expect(c).toBeGreaterThan(0.5 * ff.prix)
        expect(c).toBeLessThan(1.6 * ff.prix)
      }
    }
    expect(cours(MARCHES[0], f, t0)).not.toBeCloseTo(cours(MARCHES[5], f, t0), 1)
    const { achat, vente } = achatVente(100)
    expect(achat).toBeGreaterThan(vente)
    expect(historique(m, f, t0 - 1000, t0, 10)).toHaveLength(11)
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
