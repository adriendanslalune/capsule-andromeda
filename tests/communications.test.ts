import { describe, expect, it } from 'vitest'
import { APPAREILS_PRETS, BLOCS, repere } from '../src/donnees/blocs'
import {
  ANGLES_ANTENNE, COLONNES_CHIFFREUR, FREQUENCES, MORSE, MOTS_TELEGRAPHE, PAS_ANTENNE, STATIONS,
} from '../src/donnees/manuel-communications'
import {
  angleAttendu, frequenceReglee, ordreChiffreur, sequenceMorse, tourAntenne, tourChiffreur, tourTelegraphe,
} from '../src/moteur/communications'
import { Jeu } from '../src/moteur/jeu'
import { BLOCAGE_ERREUR } from '../src/moteur/reparation'
import { restaurer, sauvegarder } from '../src/moteur/sauvegarde'

const t0 = Date.UTC(2026, 9, 18, 12)

/** Fait ce que dit le manuel pour le module, comme un joueur attentif ; renvoie le dernier résultat. */
function bienReparer(jeu: Jeu, a: 'telegraphe' | 'antenne' | 'chiffreur', t: number) {
  let res = 'ok'
  for (let garde = 0; jeu.enDefaut(a) && garde < 10; garde++) {
    const r = jeu.reparation(a)!
    if (a === 'telegraphe') {
      const pas = FREQUENCES.indexOf(tourTelegraphe(r.graine, r.tour).frequence) - r.reglage!
      jeu.geste(a, { genre: 'regler', pas }, t)
      res = jeu.geste(a, { genre: 'emettre' }, t)
    } else if (a === 'antenne') {
      jeu.geste(a, { genre: 'tourner', degres: angleAttendu(tourAntenne(r.graine, r.tour)) - r.reglage! }, t)
      res = jeu.geste(a, { genre: 'verrouiller' }, t)
    } else {
      for (const i of ordreChiffreur(tourChiffreur(r.graine, r.tour))) res = jeu.geste(a, { genre: 'appuyer', touche: i }, t)
    }
  }
  return res
}

describe('les blocs du panneau', () => {
  it('cinq blocs de trois modules différents', () => {
    expect(BLOCS).toHaveLength(5)
    const tous = BLOCS.flatMap((b) => b.appareils)
    expect(new Set(tous).size).toBe(15)
    expect(repere('antenne')).toBe('1B')
    expect(repere('bornier')).toBe('2A')
  })

  it('une panne met un ou deux modules raccordés du bloc en défaut', () => {
    const jeu = new Jeu()
    const nombres = new Set<number>()
    for (let k = 0; k < 60; k++) {
      jeu.casser('communications')
      const d = jeu.defauts.communications!
      expect(d.length === 1 || d.length === 2).toBe(true)
      expect(new Set(d).size).toBe(d.length)
      nombres.add(d.length)
      jeu.reparer('communications')
      expect(jeu.defauts.communications).toBeUndefined()
    }
    expect([...nombres].sort()).toEqual([1, 2])
    jeu.casser('energie')
    expect(jeu.defauts.energie!.length).toBeGreaterThan(0)
    expect(jeu.defauts.energie!.every((a) => ['bornier', 'fusibles', 'accumulateurs'].includes(a))).toBe(true)
    // Bloc dont aucun module n'est encore raccordé : réparation provisoire (depuis ÉTAT).
    jeu.casser('moteur')
    expect(jeu.defauts.moteur).toEqual([])
    expect(jeu.reparationProvisoire('moteur')).toBe(true)
    expect(jeu.reparationProvisoire('energie')).toBe(false)
    expect(APPAREILS_PRETS).toContain('chiffreur')
  })

  it('le bloc remarche quand tous ses modules en défaut sont réparés', () => {
    const jeu = new Jeu()
    for (let g = 1; ; g++) {
      jeu.graine = g
      jeu.casser('communications')
      if (jeu.defauts.communications!.length === 2) break
      jeu.reparer('communications')
    }
    const [a, b] = jeu.defauts.communications! as ('telegraphe' | 'antenne' | 'chiffreur')[]
    expect(bienReparer(jeu, a, t0)).toBe('repare')
    expect(jeu.enPanne('communications')).toBe(true)
    expect(jeu.enDefaut(a)).toBe(false)
    expect(bienReparer(jeu, b, t0)).toBe('repare')
    expect(jeu.enPanne('communications')).toBe(false)
  })
})

describe('télégraphe', () => {
  it('16 mots, 16 fréquences différentes, toutes sur le cadran', () => {
    expect(MOTS_TELEGRAPHE).toHaveLength(16)
    expect(new Set(MOTS_TELEGRAPHE.map((m) => m.frequence)).size).toBe(16)
    for (const m of MOTS_TELEGRAPHE) {
      expect(FREQUENCES).toContain(m.frequence)
      for (const l of m.mot) expect(MORSE[l]).toBeDefined()
    }
  })

  it('la lampe clignote le mot en morse (SOS : · · · — — — · · ·)', () => {
    const s = sequenceMorse('SOS')
    const allumages = s.filter(([on]) => on).map(([, d]) => d)
    expect(allumages).toHaveLength(9)
    expect(allumages[3]).toBe(3 * allumages[0])
    expect(s[s.length - 1][0]).toBe(false)
  })

  it('le cadran ne commence jamais sur la bonne fréquence ; ÉMETTRE au mauvais endroit bloque 30 s', () => {
    const jeu = new Jeu()
    for (let g = 1; g < 50; g++) {
      jeu.graine = g
      jeu.reparer('communications')
      jeu.casser('communications')
      jeu.defauts.communications = ['telegraphe']
      const r = jeu.reparation('telegraphe')!
      expect(frequenceReglee(r)).not.toBe(tourTelegraphe(r.graine, 0).frequence)
    }
    expect(jeu.geste('telegraphe', { genre: 'emettre' }, t0)).toBe('erreur')
    expect(jeu.geste('telegraphe', { genre: 'regler', pas: 1 }, t0 + 1000)).toBe('bloque')
    expect(bienReparer(jeu, 'telegraphe', t0 + BLOCAGE_ERREUR)).toBe('repare')
  })

  it('le cadran s’arrête aux bords', () => {
    const jeu = new Jeu()
    jeu.casser('communications')
    jeu.defauts.communications = ['telegraphe']
    const r = jeu.reparation('telegraphe')!
    jeu.geste('telegraphe', { genre: 'regler', pas: -40 }, t0)
    expect(r.reglage).toBe(0)
    jeu.geste('telegraphe', { genre: 'regler', pas: 40 }, t0)
    expect(r.reglage).toBe(FREQUENCES.length - 1)
  })
})

describe('antenne', () => {
  it('un angle par station et par bande, multiple du pas, différent d’une bande à l’autre', () => {
    expect(ANGLES_ANTENNE).toHaveLength(STATIONS.length)
    for (const l of ANGLES_ANTENNE) {
      expect(new Set(l).size).toBe(3)
      for (const a of l) { expect(a % PAS_ANTENNE).toBe(0); expect(a).toBeLessThan(360) }
    }
  })

  it('deux tours ; verrouiller sur un mauvais angle est une erreur', () => {
    const jeu = new Jeu()
    jeu.casser('communications')
    jeu.defauts.communications = ['antenne']
    const r = jeu.reparation('antenne')!
    expect(r.tours).toBe(2)
    expect(r.reglage).not.toBe(angleAttendu(tourAntenne(r.graine, 0)))
    expect(jeu.geste('antenne', { genre: 'verrouiller' }, t0)).toBe('erreur')
    expect(bienReparer(jeu, 'antenne', t0 + BLOCAGE_ERREUR)).toBe('repare')
    expect(jeu.enPanne('communications')).toBe(false)
  })

  it('l’antenne fait le tour du cadran (345° + 15° = 0°)', () => {
    const jeu = new Jeu()
    jeu.casser('communications')
    jeu.defauts.communications = ['antenne']
    const r = jeu.reparation('antenne')!
    r.reglage = 345
    jeu.geste('antenne', { genre: 'tourner', degres: 15 }, t0)
    expect(r.reglage).toBe(0)
    jeu.geste('antenne', { genre: 'tourner', degres: -45 }, t0)
    expect(r.reglage).toBe(315)
  })
})

describe('chiffreur', () => {
  it('six colonnes de sept symboles différents', () => {
    expect(COLONNES_CHIFFREUR).toHaveLength(6)
    for (const c of COLONNES_CHIFFREUR) expect(new Set(c).size).toBe(7)
  })

  it('les quatre touches sont dans une seule colonne ; l’ordre est celui de la colonne', () => {
    for (let g = 1; g < 300; g++) {
      const tour = tourChiffreur(g * 13, 0)
      expect(COLONNES_CHIFFREUR.filter((c) => tour.touches.every((s) => c.includes(s)))).toHaveLength(1)
      const c = COLONNES_CHIFFREUR[tour.colonne]
      const positions = ordreChiffreur(tour).map((i) => c.indexOf(tour.touches[i]))
      expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    }
  })

  it('une touche dans le désordre est une erreur, et tout est à refaire', () => {
    const jeu = new Jeu()
    jeu.casser('communications')
    jeu.defauts.communications = ['chiffreur']
    const r = jeu.reparation('chiffreur')!
    const ordre = ordreChiffreur(tourChiffreur(r.graine, 0))
    expect(jeu.geste('chiffreur', { genre: 'appuyer', touche: ordre[0] }, t0)).toBe('ok')
    expect(jeu.geste('chiffreur', { genre: 'appuyer', touche: ordre[2] }, t0)).toBe('erreur')
    expect(r.coupes).toEqual([])
    expect(bienReparer(jeu, 'chiffreur', t0 + BLOCAGE_ERREUR)).toBe('repare')
  })
})

describe('sauvegarde des blocs', () => {
  it('les modules en défaut et les réparations en cours sont sauvegardés', () => {
    const jeu = new Jeu()
    jeu.casser('communications')
    jeu.defauts.communications = ['telegraphe', 'chiffreur']
    jeu.reparation('telegraphe')!.reglage = 3
    const copie = restaurer(JSON.parse(JSON.stringify(sauvegarder(jeu, t0))))!
    expect(copie.defauts).toEqual(jeu.defauts)
    expect(copie.reparations.telegraphe!.reglage).toBe(3)
  })

  it('une sauvegarde de la version 4 : l’Énergie en cours de réparation devient le bornier', () => {
    const jeu = new Jeu()
    jeu.casser('energie')
    jeu.defauts.energie = ['bornier']
    jeu.casser('communications')
    const r = jeu.reparation('bornier')!
    r.coupes = [1]
    const v4 = JSON.parse(JSON.stringify(sauvegarder(jeu, t0)))
    v4.version = 4
    delete v4.defauts
    v4.reparations = { energie: r }
    const copie = restaurer(v4)!
    expect(copie.defauts.energie).toEqual(['bornier'])
    expect(copie.reparations.bornier).toEqual(r)
    expect(copie.defauts.communications!.length).toBeGreaterThan(0)
  })
})
