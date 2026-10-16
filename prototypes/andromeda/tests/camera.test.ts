import { describe, expect, it } from 'vitest'
import { type Camera, centre, glisser, projecteur, raccrocher, zoomer } from '../src/affichage2d/camera'
import { position } from '../src/moteur/corps'

const t = Date.UTC(2026, 9, 16, 12)
const pos = (nom: string) => position(nom, t)
const camera = (ancre: string, echelle: number): Camera => ({ ancre, dx: 0, dy: 0, echelle, largeur: 390, hauteur: 844 })

describe('caméra', () => {
  it("l'astre d'accroche est au centre de l'écran", () => {
    const c = camera('Neptune', 2)
    const p = projecteur(c, pos)(pos('Neptune'))
    expect(p.sx).toBe(195)
    expect(p.sy).toBe(422)
  })

  it('près de Neptune (4,5 milliards de km), au zoom maximal, un écart de 1 km reste précis au millième de pixel', () => {
    const c = camera('Neptune', 2)
    const n = pos('Neptune')
    const p = projecteur(c, pos)({ x: n.x + 1, y: n.y })
    expect(p.sx - 195).toBeCloseTo(0.5, 3)
  })

  it('zoomer garde fixe le point sous les doigts', () => {
    const c = camera('Terre', 100)
    const avant = { x: centre(c, pos).x + (300 - 195) * 100, y: centre(c, pos).y - (100 - 422) * 100 }
    zoomer(c, 3.7, 300, 100)
    const p = projecteur(c, pos)(avant)
    expect(p.sx).toBeCloseTo(300, 6)
    expect(p.sy).toBeCloseTo(100, 6)
  })

  it('glisser déplace la vue avec le doigt', () => {
    const c = camera('Terre', 100)
    const terre = pos('Terre')
    glisser(c, 50, -20)
    const p = projecteur(c, pos)(terre)
    expect(p.sx).toBeCloseTo(245, 6)
    expect(p.sy).toBeCloseTo(402, 6)
  })

  it("changer d'accroche ne bouge pas la vue", () => {
    const c = camera('Terre', 1e5)
    glisser(c, 30, 40)
    const avant = centre(c, pos)
    raccrocher(c, 'Soleil', pos)
    const apres = centre(c, pos)
    expect(apres.x).toBeCloseTo(avant.x, 3)
    expect(apres.y).toBeCloseTo(avant.y, 3)
  })
})
