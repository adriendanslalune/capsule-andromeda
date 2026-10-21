import { describe, expect, it } from 'vitest'
import { Jeu } from '../src/moteur/jeu'
import { niveauDe, niveauDuBot, niveauGagne, palierDe, xpPourNiveau } from '../src/moteur/niveau'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

describe('le niveau du capitaine (décisions d’Adrien du 21/10/2026)', () => {
  it('de l’XP au niveau, plafonné à 100 ; chaque niveau demande un peu plus que le précédent', () => {
    expect(niveauDe(0)).toEqual({ niveau: 1, dans: 0, besoin: 50 })
    expect(niveauDe(xpPourNiveau(10)).niveau).toBe(10)
    expect(niveauDe(xpPourNiveau(10) - 1).niveau).toBe(9)
    expect(niveauDe(1e12)).toMatchObject({ niveau: 100, besoin: 0 })
    expect(xpPourNiveau(11) - xpPourNiveau(10)).toBeGreaterThan(xpPourNiveau(10) - xpPourNiveau(9))
  })

  it('la forme de la capsule par paliers de 20 niveaux, un peu plus grosse dans chaque palier', () => {
    expect(palierDe(1)).toEqual({ forme: 'capsule', nom: 'Capsule', taille: 1 })
    expect(palierDe(19).forme).toBe('capsule')
    expect(palierDe(19).taille).toBeCloseTo(1.3)
    expect(palierDe(20).forme).toBe('navette')
    expect(palierDe(99).forme).toBe('croiseur')
    expect(palierDe(100).forme).toBe('legende')
    expect(niveauDuBot('Sirocco_II')).toBe(niveauDuBot('Sirocco_II'))
  })

  it('gagner de l’XP annonce les niveaux et les paliers ; le commerce rapporte au plus 100 XP par jour ; sauvegardé', () => {
    const jeu = new Jeu()
    jeu.gagnerXp(60)
    expect(jeu.niveauAAnnoncer).toEqual({ niveau: 2, avant: 1 })
    jeu.gagnerXp(xpPourNiveau(20) - jeu.xp)
    expect(jeu.niveauAAnnoncer?.niveau).toBe(20)
    expect(niveauGagne(20, 19)).toMatchObject({ forme: 'navette', nouvelleForme: true, prochain: { niveau: 40, nom: 'Corvette' } })
    expect(niveauGagne(21, 20).nouvelleForme).toBe(false)
    const avant = jeu.xp, t = Date.UTC(2026, 9, 21, 12)
    jeu.xpCommerce(250, t)
    expect(jeu.xp - avant).toBe(2)
    jeu.xpCommerce(1e6, t)
    expect(jeu.xp - avant).toBe(100)
    jeu.xpCommerce(500, t + 86_400_000)
    expect(jeu.xp - avant).toBe(105)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t))))!
    expect(copie.xp).toBe(jeu.xp)
    expect(copie.commerce).toEqual(jeu.commerce)
  })

  it('une Voix perdue enregistrée : 50 XP', () => {
    const jeu = new Jeu()
    jeu.voixEnregistree(Date.UTC(2026, 9, 21))
    expect(jeu.xp).toBe(50)
  })
})
