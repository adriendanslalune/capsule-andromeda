import { describe, expect, it } from 'vitest'
import { BANDE_OC, DUREE_EMISSION, DUREE_ENREGISTREMENT, LARGEUR_SIGNAL, NOMBRE_VOIX, PERIODE_EMISSION, TEXTES_VOIX } from '../src/donnees/radio'
import { capter, ecouter, emet, radioNeuve, texteVoix, VOIX } from '../src/moteur/radio'

const t0 = Date.UTC(2026, 9, 20, 12)

describe('la radio : les Voix perdues (décisions d’Adrien du 20/10/2026)', () => {
  it('150 voix, chacune dans la bande OC, bien séparées des autres voix de son système', () => {
    expect(NOMBRE_VOIX).toBe(150)
    expect(VOIX).toHaveLength(150)
    for (const v of VOIX) {
      expect(v.frequence).toBeGreaterThan(BANDE_OC.min)
      expect(v.frequence).toBeLessThan(BANDE_OC.max)
      for (const w of VOIX) if (w !== v && w.systeme === v.systeme) expect(Math.abs(w.frequence - v.frequence)).toBeGreaterThan(2 * LARGEUR_SIGNAL)
    }
    expect(VOIX.filter((v) => texteVoix(v)).length).toBe(TEXTES_VOIX.Terre.length)
  })

  it('une voix émet 30 minutes toutes les 6 heures, à heure fixe ; celles sans texte n’émettent pas', () => {
    const v = VOIX.find((x) => x.systeme === 'Terre')!
    const pas = 60_000
    let n = 0
    for (let t = t0; t < t0 + PERIODE_EMISSION; t += pas) if (emet(v, t)) n++
    expect(n).toBe(DUREE_EMISSION / pas)
    expect(VOIX.filter((x) => x.systeme === 'Mars').some((x) => [...Array(360).keys()].some((k) => emet(x, t0 + k * pas)))).toBe(false)
  })

  it('on ne capte une voix que dans son système, pendant qu’elle émet, d’autant mieux qu’on est calé près d’elle', () => {
    const v = VOIX.find((x) => x.systeme === 'Terre')!
    let t = t0
    while (!emet(v, t)) t += 60_000
    expect(capter(v.frequence, 'Terre', t)).toMatchObject({ voix: v, nettete: 1 })
    expect(capter(v.frequence, 'Mars', t)).toBeNull()
    expect(capter(v.frequence, null, t)).toBeNull()
    expect(capter(v.frequence + LARGEUR_SIGNAL / 2, 'Terre', t)!.nettete).toBeLessThan(0.6)
  })

  it('calé net pendant 10 secondes, on l’enregistre (une seule fois) ; décroché, l’enregistrement repart à zéro', () => {
    const v = VOIX.find((x) => x.systeme === 'Terre')!
    let t = t0
    while (!emet(v, t) || !emet(v, t + 60_000)) t += 60_000
    const e = radioNeuve()
    e.frequence = v.frequence
    expect(ecouter(e, 'Terre', t).enregistrement).toBe(0)
    expect(ecouter(e, 'Terre', t + 5000).enregistrement).toBeCloseTo(0.5, 6)
    e.frequence = v.frequence + 0.05
    ecouter(e, 'Terre', t + 6000)
    e.frequence = v.frequence
    ecouter(e, 'Terre', t + 7000)
    expect(ecouter(e, 'Terre', t + 7000 + DUREE_ENREGISTREMENT - 1).nouvelle).toBeNull()
    expect(ecouter(e, 'Terre', t + 7000 + DUREE_ENREGISTREMENT).nouvelle).toBe(v.numero)
    expect(e.captees).toEqual([v.numero])
    expect(ecouter(e, 'Terre', t + 30_000).nouvelle).toBeNull()
  })
})

describe('la radio dans la partie', () => {
  it('les voix enregistrées et la fréquence sont sauvegardées', async () => {
    const { Jeu } = await import('../src/moteur/jeu')
    const { restaurer, sauvegarder } = await import('../src/moteur/sauvegarde')
    const jeu = new Jeu()
    jeu.radio.frequence = 7.315
    jeu.radio.captees = [3, 7]
    jeu.radio.captureesLe = { 3: t0, 7: t0 + 1 }
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.radio.frequence).toBe(7.315)
    expect(copie.radio.captees).toEqual([3, 7])
    expect(copie.radio.captureesLe).toEqual({ 3: t0, 7: t0 + 1 })
  })
})
