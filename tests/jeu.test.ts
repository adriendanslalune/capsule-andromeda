import { NIVEAUX_MOTEUR } from '../src/donnees/capsule'
import { CAPACITE_SOUTE } from '../src/donnees/marche'
import { describe, expect, it } from 'vitest'
import { lignesDuBandeau } from '../src/moteur/bandeau'
import { Jeu } from '../src/moteur/jeu'
import { planifier } from '../src/moteur/mission'

const t0 = Date.UTC(2026, 9, 17, 12)

describe('état du jeu au départ (décision d’Adrien du 17/10/2026)', () => {
  it('0 crédit, moteur niveau 1 à 30 km/s, en orbite basse autour de la Terre', () => {
    const jeu = new Jeu()
    expect(jeu.credits).toBe(0)
    expect(jeu.niveauMoteur).toBe(1)
    expect(jeu.vitesse()).toBe(30)
    expect(lignesDuBandeau(jeu, t0)[0]).toMatchObject({ genre: 'orbite', centre: 'Terre' })
  })

  it('le moteur fixe la durée des trajets : la Lune en quelques heures', () => {
    const jeu = new Jeu()
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Lune', t0, jeu.vitesse())
    if (!p.possible) throw new Error('impossible')
    const heures = (p.plan.arrivee - p.plan.depart) / 3_600_000
    expect(heures).toBeGreaterThan(3)
    expect(heures).toBeLessThan(6)
  })
})

describe('acheter un meilleur moteur (barème revu par Adrien le 21/10/2026)', () => {
  it('niveau 2 à 60 km/s pour 200 crédits, puis 3 (120 km/s, 400) et 4 (240 km/s, 800)', () => {
    const jeu = new Jeu()
    expect(jeu.moteurSuivant()).toMatchObject({ niveau: 2, vitesse: 60, prix: 200 })
    jeu.credits = 199
    expect(jeu.acheterMoteur()).toBe(false)
    expect(jeu.niveauMoteur).toBe(1)
    jeu.credits = 300
    jeu.soute = { Ferraille: 3, Cuivre: 8, Verre: 2 }
    expect(jeu.acheterMoteur()).toBe(true)
    expect(jeu.credits).toBe(100)
    expect(jeu.vitesse()).toBe(60)
    jeu.credits = 10_000
    expect(jeu.acheterMoteur() && jeu.acheterMoteur()).toBe(true)
    expect(jeu.vitesse()).toBe(240)
    expect(jeu.credits).toBe(10_000 - 400 - 800)
    expect(jeu.soute).toEqual({})
  })

  it('chaque niveau demande aussi des matériaux, pris dans la soute (décision d’Adrien du 20/10/2026)', () => {
    const jeu = new Jeu()
    jeu.credits = 1000
    jeu.soute = { Ferraille: 2.5, Eau: 1 }
    expect(jeu.manquePourMoteur()).toEqual({ credits: 0, materiaux: { Ferraille: 0.5 } })
    expect(jeu.acheterMoteur()).toBe(false)
    expect(jeu.credits).toBe(1000)
    jeu.soute.Ferraille = 4
    expect(jeu.acheterMoteur()).toBe(true)
    expect(jeu.soute).toEqual({ Ferraille: 1, Eau: 1 })
    expect(jeu.manquePourMoteur()).toEqual({ credits: 0, materiaux: { Cuivre: 3 } })
    // Tout tient dans la soute de 20 t.
    for (const n of NIVEAUX_MOTEUR) expect(Object.values(n.materiaux).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(CAPACITE_SOUTE)
  })

  it('dix niveaux (décision d’Adrien du 19/10/2026) : vitesse ×2, prix ×2 (décision du 21/10/2026) ; rien après le niveau 10', () => {
    for (let k = 1; k < NIVEAUX_MOTEUR.length; k++) {
      expect(NIVEAUX_MOTEUR[k].vitesse).toBe(2 * NIVEAUX_MOTEUR[k - 1].vitesse)
      if (k > 1) expect(NIVEAUX_MOTEUR[k].prix).toBe(2 * NIVEAUX_MOTEUR[k - 1].prix)
    }
    expect(NIVEAUX_MOTEUR).toHaveLength(10)
    const jeu = new Jeu()
    jeu.niveauMoteur = 10
    expect(jeu.vitesse()).toBe(15_360)
    expect(jeu.moteurSuivant()).toBeNull()
    jeu.credits = 1e9
    expect(jeu.acheterMoteur()).toBe(false)
  })

  it('un meilleur moteur raccourcit les trajets', () => {
    const jeu = new Jeu()
    const duree = () => {
      const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Lune', t0, jeu.vitesse())
      if (!p.possible) throw new Error('impossible')
      return p.plan.arrivee - p.plan.depart
    }
    const avant = duree()
    jeu.credits = 200
    jeu.soute = { Ferraille: 3 }
    jeu.acheterMoteur()
    expect(duree()).toBeLessThan(avant * 0.6)
  })
})

describe('le dépanneur (décision d’Adrien du 20/10/2026)', () => {
  it('répare un bloc en panne pour la moitié des crédits ; gratuit sans crédits', () => {
    const jeu = new Jeu()
    jeu.credits = 1001
    jeu.casser('moteur')
    expect(jeu.prixDepanneur()).toBe(500)
    expect(jeu.appelerDepanneur('moteur')).toBe(500)
    expect(jeu.credits).toBe(501)
    expect(jeu.enPanne('moteur')).toBe(false)
    expect(jeu.appelerDepanneur('moteur')).toBeNull()
    jeu.credits = 0
    jeu.casser('coque')
    expect(jeu.appelerDepanneur('coque')).toBe(0)
    expect(jeu.enPanne('coque')).toBe(false)
  })
})

describe('la vitesse en vol (cadran de vitesse, demande d’Adrien du 20/10/2026)', () => {
  it('accélère 2 minutes, croise à la vitesse max, freine 2 minutes, nulle à l’arrivée', async () => {
    const { vitesseEnVol } = await import('../src/moteur/mission')
    const jeu = new Jeu()
    const p = planifier(jeu.mission.etatHeliocentrique(t0), 'Mars', t0, 30)
    if (!p.possible) throw new Error('impossible')
    const plan = p.plan
    expect(vitesseEnVol(plan, plan.depart + 1000)).toMatchObject({ phase: 'accelere' })
    expect(vitesseEnVol(plan, plan.depart + 1000).vitesse).toBeCloseTo(0.25, 6)
    expect(vitesseEnVol(plan, (plan.depart + plan.arrivee) / 2)).toEqual({ vitesse: 30, pointe: 30, phase: 'croisiere' })
    expect(vitesseEnVol(plan, plan.arrivee - 1000)).toMatchObject({ phase: 'freine' })
    expect(vitesseEnVol(plan, plan.arrivee + 1)).toMatchObject({ vitesse: 0, phase: 'arrivee' })
  })
})

describe('abattre le chasseur autour duquel on tourne (bug vu par Adrien le 21/10/2026)', () => {
  it('la capsule reste où elle est (en orbite autour de la planète), au lieu de sauter avec le renfort', async () => {
    const { ALIENS } = await import('../src/donnees/espace')
    const { orbiteAutour } = await import('../src/moteur/mission')
    const { position } = await import('../src/moteur/corps')
    const jeu = new Jeu()
    const alien = ALIENS.find((a) => a.parent === 'Terre')!.nom
    jeu.mission.orbite = orbiteAutour(alien, t0, position(alien, t0))
    const avant = jeu.mission.etat(t0).position
    jeu.vaincreChasseur(alien, t0)
    const apres = jeu.mission.etat(t0).position
    expect(Math.hypot(apres.x - avant.x, apres.y - avant.y, apres.z - avant.z)).toBeLessThan(2000)
    expect(jeu.mission.centre(t0)).toBe('Terre')
  })
})
