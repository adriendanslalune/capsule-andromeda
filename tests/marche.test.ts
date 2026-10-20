import { describe, expect, it } from 'vitest'
import { MARCHANDISES, MARCHES } from '../src/donnees/marche'
import type { Contrat } from '../src/moteur/contrats'
import { corps } from '../src/moteur/corps'
import { Jeu } from '../src/moteur/jeu'
import { achatVente, cours, delaiLumiere, historique, vueMarche } from '../src/moteur/marche'
import { planifier } from '../src/moteur/mission'
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
        // Spécialités (−30 % à +30 %), ±5 % propres au marché, ondulations (±4,5 % au plus).
        expect(c).toBeGreaterThan(0.45 * ff.prix)
        expect(c).toBeLessThan(1.8 * ff.prix)
      }
    }
    expect(cours(MARCHES[0], f, t0)).not.toBeCloseTo(cours(MARCHES[5], f, t0), 1)
    const { achat, vente } = achatVente(100)
    expect(achat).toBeGreaterThan(vente)
    expect(historique(m, f, t0 - 1000, t0, 10)).toHaveLength(11)
  })

  it('prix stables (décision d’Adrien du 20/10/2026) : acheter puis revendre au même comptoir ne rapporte jamais', () => {
    for (const mm of MARCHES) for (const ff of MARCHANDISES) {
      const h = historique(mm, ff, t0, t0 + 14 * 24 * 3_600_000, 2000).map((x) => x.cours)
      expect(achatVente(Math.max(...h)).vente, `${mm.nom}/${ff.nom}`).toBeLessThanOrEqual(achatVente(Math.min(...h)).achat)
    }
    // Mais transporter paie : l'Hélium 3 acheté vers Jupiter se revend bien plus cher sur Terre.
    const h3 = MARCHANDISES.find((x) => x.nom === 'Hélium 3')!
    expect(achatVente(cours(MARCHES[2], h3, t0)).vente).toBeGreaterThan(1.3 * achatVente(cours(MARCHES[4], h3, t0)).achat)
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

  it('les spécialités font des routes rentables : l’Hélium 3 acheté vers Jupiter se revend bien plus cher vers la Terre', () => {
    const jupiter = MARCHES.find((x) => x.nom === 'Jupiter')!, terre = MARCHES.find((x) => x.nom === 'Terre')!
    const he3 = MARCHANDISES.find((x) => x.nom === 'Hélium 3')!
    let gagnant = 0
    for (let k = 0; k < 100; k++) {
      const t = t0 + k * 3 * 3_600_000
      if (achatVente(cours(terre, he3, t)).vente > achatVente(cours(jupiter, he3, t)).achat) gagnant++
    }
    expect(gagnant).toBeGreaterThan(80)
  })
})

describe('acheter et vendre (étape 7, décision d’Adrien du 20/10/2026)', () => {
  it('seulement en orbite dans un système qui a un marché, au cours en direct, dans la limite de la soute et des crédits', () => {
    const jeu = new Jeu()
    expect(jeu.marcheIci(t0)?.nom).toBe('Terre')
    jeu.credits = 1000
    const f = MARCHANDISES.find((x) => x.nom === 'Cuivre')!
    const unitaire = achatVente(cours(jeu.marcheIci(t0)!, f, t0)).achat
    const a = jeu.acheter('Cuivre', 5, t0)
    expect(a.tonnes).toBe(5)
    expect(a.prix).toBe(Math.round(5 * unitaire))
    expect(jeu.credits).toBe(1000 - a.prix)
    expect(jeu.soute.Cuivre).toBe(5)
    // Pas assez de crédits : on achète ce qu'on peut payer (par dixièmes de tonne).
    jeu.credits = Math.round(2.55 * unitaire)
    expect(jeu.acheter('Cuivre', 5, t0).tonnes).toBe(2.5)
    // La soute (20 t) limite aussi.
    jeu.credits = 1e9
    expect(jeu.acheter('Ferraille', 100, t0).tonnes).toBeCloseTo(20 - 7.5, 5)
    expect(jeu.chargeSoute()).toBeCloseTo(20, 5)
    expect(jeu.acheter('Eau', 1, t0).tonnes).toBe(0)
  })

  it('vendre rapporte le prix de vente (moins que l’achat) ; tout vendre vide la place', () => {
    const jeu = new Jeu()
    jeu.soute = { Titane: 3.4 }
    const avant = jeu.credits
    const v = jeu.vendre('Titane', 99, t0)
    expect(v.tonnes).toBe(3.4)
    expect(jeu.credits - avant).toBe(v.prix)
    expect(jeu.soute.Titane).toBeUndefined()
    expect(jeu.vendre('Titane', 1, t0).tonnes).toBe(0)
  })

  it('en plein vol, pas de commerce', () => {
    const jeu = new Jeu()
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Mars', t0, jeu.vitesse())
    if (!p.possible) throw new Error('impossible')
    jeu.mission.partir(p.plan)
    const t = t0 + 3600_000
    expect(jeu.marcheIci(t)).toBeNull()
    jeu.credits = 1000
    expect(jeu.acheter('Cuivre', 1, t).tonnes).toBe(0)
  })
})
