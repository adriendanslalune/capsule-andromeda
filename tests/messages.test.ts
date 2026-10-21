import { describe, expect, it } from 'vitest'
import { BOTS } from '../src/donnees/messages'
import { Jeu } from '../src/moteur/jeu'
import { delaiLumiere } from '../src/moteur/marche'
import { arrivesDepuis, conversations, enRoute, envoyer, etatEnvoi, fil, intention, marquerLu, nonLus } from '../src/moteur/messages'
import { corps } from '../src/moteur/corps'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 18, 12)

describe('les Messages', () => {
  it('les bots sont sur des astres qui existent', () => {
    for (const b of BOTS) expect(corps(b.lieu), b.lieu).toBeDefined()
  })

  it('le système bavarde : des messages dans le canal général, arrivés avec le délai de la lumière', () => {
    const jeu = new Jeu()
    const f = fil(jeu, 'general', t0)
    expect(f.length).toBeGreaterThan(25) // environ un toutes les 10 minutes sur 12 h (demande d'Adrien du 20/10/2026 : ça parlait trop)
    expect(f.length).toBeLessThan(110)
    for (const m of f) {
      expect(m.recu).toBeLessThanOrEqual(t0)
      // Depuis la capsule du bot, où qu'elle soit (les bots voyagent).
      expect(m.recu - m.envoye).toBeCloseTo(delaiLumiere(m.auteur, m.envoye), -1)
      expect(m.texte).not.toMatch(/\{\w+\}/) // tous les trous remplis
    }
    expect(fil(jeu, 'general', t0)).toEqual(f) // reproductible
  })

  it('le canal de Maison est réservé à ses membres', () => {
    const jeu = new Jeu()
    expect(fil(jeu, 'maison', t0)).toEqual([])
    expect(envoyer(jeu, 'maison', 'coucou', t0)).toBe(false)
    jeu.maison = 'mercenaires'
    const f = fil(jeu, 'maison', t0)
    expect(f.length).toBeGreaterThan(5)
    expect(f.every((m) => m.maison === 'mercenaires')).toBe(true)
  })

  it('les bots répondent à ce qu’on écrit, après l’aller-retour de la lumière', () => {
    expect(intention('Salut tout le monde !')).toBe('salut')
    expect(intention('Qui vend du cuivre ?')).toBe('marche')
    expect(intention('Besoin d\'aide !')).toBe('aide')
    expect(intention('Un chasseur dans le coin ?')).toBe('alien')
    expect(intention('Ça va ?')).toBe('question')
    expect(intention('Bonjour Mme_Ferraille !')).toBe('salut')
    const jeu = new Jeu()
    jeu.pseudo = 'Adrien'
    envoyer(jeu, 'prive:ORION_77', 'Salut ORION !', t0)
    const aller = delaiLumiere('ORION_77', t0)
    const mien = fil(jeu, 'prive:ORION_77', t0).find((m) => m.deMoi)!
    expect(etatEnvoi(mien, t0)).toMatch(/en route vers ORION_77/)
    // La réponse part après l'arrivée chez lui (et un temps de réflexion), et met autant pour revenir.
    const t1 = t0 + aller + 50_000
    expect(enRoute(jeu, 'prive:ORION_77', t1)).toHaveLength(1)
    const t2 = t0 + 2 * aller + 60_000
    // (Les privés spontanés d'ORION_77, s'il y en a, sont à part : on ne regarde que la réponse.)
    const reponse = fil(jeu, 'prive:ORION_77', t2).filter((m) => m.id.startsWith('r'))
    expect(reponse).toHaveLength(1)
    expect(reponse[0].auteur).toBe('ORION_77')
    expect(reponse[0].texte).toMatch(/Adrien|👋|Phobos|Deimos|Mars|Bonjour/)
    expect(conversations(jeu, t2)[0].canal).toBe('prive:ORION_77')
  })

  it('les non-lus, et les messages sauvegardés', () => {
    const jeu = new Jeu()
    jeu.lus.debut = t0 - 3_600_000
    expect(nonLus(jeu, t0).general).toBeGreaterThan(3)
    marquerLu(jeu, 'general', t0)
    expect(nonLus(jeu, t0).general).toBe(0)
    envoyer(jeu, 'general', 'Bonjour !', t0)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.envoyes).toEqual(jeu.envoyes)
    expect(copie.lus).toEqual(jeu.lus)
  })

  it('la fête des bots : une zone libérée, trois bavards la fêtent dans le canal général, une fois la nouvelle reçue', () => {
    const jeu = new Jeu()
    jeu.pseudo = 'Adrien'
    jeu.gagnerAssaut('Lune', t0)
    expect(jeu.fetes).toEqual([{ zone: 'Lune', t: t0 }])
    const fetes = (t: number) => fil(jeu, 'general', t).filter((m) => m.id.startsWith('fLune'))
    expect(fetes(t0 + 10_000)).toEqual([]) // pas encore : la nouvelle voyage
    const f = fetes(t0 + 11.8 * 3_600_000)
    expect(f).toHaveLength(3)
    expect(new Set(f.map((m) => m.auteur)).size).toBe(3)
    expect(new Set(f.map((m) => m.texte)).size).toBe(3)
    for (const m of f) {
      expect(m.envoye).toBeGreaterThan(t0)
      expect(m.texte).not.toMatch(/\{\w+\}/)
      expect(m.texte).toMatch(/Adrien|Lune|lune/)
    }
    // Annoncées sur la carte quand elles nomment le joueur ; reproductibles et sauvegardées.
    expect(fetes(t0 + 11.8 * 3_600_000)).toEqual(f)
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.fetes).toEqual(jeu.fetes)
    expect(arrivesDepuis(jeu, t0, t0 + 11.8 * 3_600_000).filter((m) => m.id.startsWith('fLune')).length).toBeGreaterThan(0)
    // Une fois libérée, une zone ne se refête pas.
    jeu.gagnerAssaut('Lune', t0 + 1000)
    expect(jeu.fetes).toHaveLength(1)
  })

  it('Triton a sa propre fête (la fin de l’acte 1)', () => {
    const jeu = new Jeu()
    jeu.gagnerAssaut('Triton', t0)
    const f = fil(jeu, 'general', t0 + 11.8 * 3_600_000).filter((m) => m.id.startsWith('fTriton'))
    expect(f).toHaveLength(3)
    for (const m of f) expect(m.texte).toMatch(/Triton|TRITON/)
  })
})
