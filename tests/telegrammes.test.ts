import { describe, expect, it } from 'vitest'
import { positionCorps } from '../src/astro/corps'
import { SECONDES_LUMIERE_PAR_UA } from '../src/astro/lumiere'
import { FLOTTE } from '../src/donnees/flotte'
import { TELEGRAMMES } from '../src/donnees/reglages'
import { PHRASES_BOTS } from '../src/donnees/telegrammes'
import { creerPartie } from '../src/moteur/etat'
import { positionBot, reponsesDesBots, telegrammesDesBots } from '../src/moteur/flotte'
import { mulberry32 } from '../src/moteur/hasard'
import {
  arriveeEn, envoisRestants, estLu, marquerLus, envoyerTelegramme, estDestinataire, prochainEnvoi, telegrammesDe, telegrammesOffice, type Telegramme,
} from '../src/moteur/telegrammes'

const T0 = Date.UTC(2026, 9, 14, 12)
const H = 3_600_000
const neuve = () => creerPartie(T0, mulberry32(1), 'La Pie voleuse')

describe('télégrammes', () => {
  it('trois envois par 24 heures glissantes, gratuits', () => {
    let e = neuve()
    for (let i = 0; i < TELEGRAMMES.parJour; i++) {
      expect(envoisRestants(e, T0 + i * H)).toBe(TELEGRAMMES.parJour - i)
      e = envoyerTelegramme(e, 'BON VOL !', { type: 'tout' }, T0 + i * H)!
      expect(e).not.toBeNull()
    }
    expect(e.credits).toBe(0)
    expect(envoisRestants(e, T0 + 3 * H)).toBe(0)
    expect(envoyerTelegramme(e, 'ENCORE', { type: 'tout' }, T0 + 3 * H)).toBeNull()
    expect(prochainEnvoi(e, T0 + 3 * H)).toBe(T0 + 24 * H)
    // 24 heures après le premier envoi, une place se libère.
    expect(envoisRestants(e, T0 + 24 * H + 1)).toBe(1)
  })

  it('texte vide ou trop long refusé ; espaces resserrés', () => {
    const e = neuve()
    expect(envoyerTelegramme(e, '   ', { type: 'tout' }, T0)).toBeNull()
    expect(envoyerTelegramme(e, 'x'.repeat(TELEGRAMMES.longueur + 1), { type: 'tout' }, T0)).toBeNull()
    const f = envoyerTelegramme(e, '  BON   VOL  ', { type: 'tout' }, T0)!
    expect(telegrammesDe(f).envoyes[0].texte).toBe('BON VOL')
  })

  it('on ne peut écrire à son système que depuis ce système', () => {
    const e = neuve() // la partie commence autour de la Terre
    expect(envoyerTelegramme(e, 'SALUT', { type: 'systeme', systeme: 'Terre' }, T0)).not.toBeNull()
    expect(envoyerTelegramme(e, 'SALUT', { type: 'systeme', systeme: 'Mars' }, T0)).toBeNull()
  })

  it('destinataires : tout le monde, un joueur, ou ceux du système ; jamais soi-même', () => {
    const m = (portee: Telegramme['portee']): Telegramme => ({ id: 'a', de: 'A', serie: 'AAA', texte: 'x', portee, envoye: T0, origine: { x: 1, y: 0, z: 0 }, systeme: 'Terre' })
    expect(estDestinataire(m({ type: 'tout' }), 'BBB', null)).toBe(true)
    expect(estDestinataire(m({ type: 'tout' }), 'AAA', null)).toBe(false)
    expect(estDestinataire(m({ type: 'joueur', serie: 'BBB', nom: 'B' }), 'BBB', 'Mars')).toBe(true)
    expect(estDestinataire(m({ type: 'joueur', serie: 'BBB', nom: 'B' }), 'CCC', 'Terre')).toBe(false)
    expect(estDestinataire(m({ type: 'systeme', systeme: 'Terre' }), 'CCC', 'Terre')).toBe(true)
    expect(estDestinataire(m({ type: 'systeme', systeme: 'Terre' }), 'CCC', 'Mars')).toBe(false)
    expect(estDestinataire(m({ type: 'systeme', systeme: 'Terre' }), 'CCC', null)).toBe(false)
  })

  it('reçu au vrai délai de la lumière : 1 UA, 499 secondes', () => {
    const m: Telegramme = { id: 'a', de: 'A', serie: 'AAA', texte: 'x', portee: { type: 'tout' }, envoye: T0, origine: { x: 1, y: 0, z: 0 }, systeme: null }
    expect(arriveeEn(m, { x: 2, y: 0, z: 0 }) - T0).toBeCloseTo(SECONDES_LUMIERE_PAR_UA * 1000, 3)
    expect(arriveeEn(m, { x: 1, y: 0, z: 0 })).toBe(T0)
  })

  it('l’Office souhaite la bienvenue, puis annonce les contrats chaque lundi, depuis la Terre', () => {
    const e = neuve()
    const l = telegrammesOffice(e, T0 - 1, T0 + 8 * 24 * H)
    expect(l.some((m) => m.id === 'onvi-bienvenue')).toBe(true)
    const lundis = l.filter((m) => m.id.startsWith('onvi-contrats'))
    expect(lundis.length).toBe(1)
    expect(new Date(lundis[0].envoye).getUTCDay()).toBe(1)
    expect(lundis[0].origine).toEqual(positionCorps('Terre', lundis[0].envoye))
  })

  it('les bots écrivent avec modération (au plus 3 par jour chacun), sans indice de chasse', () => {
    const l = telegrammesDesBots(FLOTTE, T0, T0 + 10 * 24 * H)
    expect(l.length).toBeGreaterThan(10)
    for (const bot of FLOTTE) {
      for (let j = 0; j < 10; j++) {
        const n = l.filter((m) => m.serie === bot.serie && m.envoye >= T0 + j * 24 * H && m.envoye < T0 + (j + 1) * 24 * H).length
        expect(n).toBeLessThanOrEqual(TELEGRAMMES.parJour)
      }
    }
    for (const m of l) expect(PHRASES_BOTS as readonly string[]).toContain(m.texte)
    // Émis de là où se trouve le bot.
    const m = l[0]
    const bot = FLOTTE.find((b) => b.serie === m.serie)!
    expect(m.origine).toEqual(positionBot(bot, m.envoye).position)
  })

  it('un bot répond toujours à un télégramme qui lui est adressé, après l’avoir reçu', () => {
    const bot = FLOTTE[0]
    const e = envoyerTelegramme(neuve(), 'BONJOUR', { type: 'joueur', serie: bot.serie, nom: bot.nom }, T0)!
    const [m] = telegrammesDe(e).envoyes
    const r = reponsesDesBots(FLOTTE, [m], { serie: e.serie, nom: e.nom })
    expect(r).toHaveLength(1)
    expect(r[0].serie).toBe(bot.serie)
    expect(r[0].portee).toEqual({ type: 'joueur', serie: e.serie, nom: e.nom })
    expect(r[0].envoye).toBeGreaterThan(arriveeEn(m, positionBot(bot, T0).position))
  })

  it('un télégramme lu le reste, même si son heure d’arrivée bouge avec la fusée', () => {
    const e = neuve()
    const m = { id: 'x', de: 'A', serie: 'AAA', texte: 'x', portee: { type: 'tout' as const }, envoye: T0, origine: { x: 1, y: 0, z: 0 }, systeme: null, arrivee: T0 + 500 }
    expect(estLu(e, m)).toBe(false)
    const f = marquerLus(e, [m])
    expect(estLu(f, { ...m, arrivee: T0 + 900 })).toBe(true)
    expect(marquerLus(f, [m])).toBe(f)
  })
})
