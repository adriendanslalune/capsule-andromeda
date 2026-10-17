// Silhouettes des engins sur la carte (reconnaissables à leur forme, demande d'Adrien du 17/10/2026) : aplats de
// couleur cernés d'encre, dans un carré d'environ 16 px centré sur l'engin.

const CORPS = '#23476b', PANNEAU = '#8fd0dc', OR = '#f2b53a', ROSE = '#f3a08b', CLAIR = '#faf2dc', CERISE = '#e04b37'

type Forme = 'station' | 'tiangong' | 'telescope' | 'webb' | 'gaia' | 'bouclier' | 'antenne' | 'sonde' | 'voiture'
const FORMES: Record<string, Forme> = {
  iss: 'station', tiangong: 'tiangong', hubble: 'telescope', webb: 'webb', gaia: 'gaia', parker: 'bouclier',
  'solar-orbiter': 'bouclier', roadster: 'voiture', 'new-horizons': 'antenne', pioneer: 'antenne', voyager: 'antenne',
}

export function dessinerEngin(ctx: CanvasRenderingContext2D, modele: string, x: number, y: number, encre: string, echelle = 1): void {
  const forme = FORMES[modele] ?? 'sonde'
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(echelle, echelle)
  ctx.lineWidth = 0.9
  ctx.lineJoin = 'round'
  ctx.strokeStyle = encre
  const rect = (x0: number, y0: number, l: number, h: number, couleur: string) => {
    ctx.fillStyle = couleur
    ctx.fillRect(x0, y0, l, h)
    ctx.strokeRect(x0, y0, l, h)
  }
  const chemin = (points: number[][], couleur: string) => {
    ctx.beginPath()
    points.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)))
    ctx.closePath()
    ctx.fillStyle = couleur
    ctx.fill()
    ctx.stroke()
  }
  const trait = (x0: number, y0: number, x1: number, y1: number, epaisseur = 1.1) => {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.lineWidth = epaisseur
    ctx.stroke()
    ctx.lineWidth = 0.9
  }
  if (forme === 'station') {
    trait(-8, 0, 8, 0, 1.4)
    rect(-8.5, -4.5, 3.5, 9, PANNEAU)
    rect(5, -4.5, 3.5, 9, PANNEAU)
    rect(-2, -2.5, 4, 5, CORPS)
  } else if (forme === 'tiangong') {
    rect(-1.8, -6, 3.6, 12, CORPS)
    rect(-8, -1.5, 6, 3, PANNEAU)
    rect(2, -1.5, 6, 3, PANNEAU)
  } else if (forme === 'telescope') {
    rect(-1.5, -7, 3, 4, PANNEAU)
    rect(-1.5, 3, 3, 4, PANNEAU)
    rect(-6, -2.5, 11, 5, CORPS)
    rect(5, -2.5, 1.6, 5, CLAIR)
  } else if (forme === 'webb') {
    chemin([[-8, 3], [0, 0], [8, 3], [0, 6.5]], ROSE)
    chemin([[0, -7.5], [3.5, -5.5], [3.5, -1.5], [0, 0.5], [-3.5, -1.5], [-3.5, -5.5]], OR)
  } else if (forme === 'gaia') {
    ctx.beginPath()
    ctx.ellipse(0, 3, 7.5, 2.8, 0, 0, 2 * Math.PI)
    ctx.fillStyle = CLAIR
    ctx.fill()
    ctx.stroke()
    rect(-2.5, -5, 5, 7, CORPS)
  } else if (forme === 'bouclier') {
    rect(-2.5, -2, 5, 6, CORPS)
    rect(-7, -1, 4.5, 2.5, PANNEAU)
    rect(2.5, -1, 4.5, 2.5, PANNEAU)
    ctx.beginPath()
    ctx.moveTo(-6, -3.5)
    ctx.quadraticCurveTo(0, -8, 6, -3.5)
    ctx.closePath()
    ctx.fillStyle = CLAIR
    ctx.fill()
    ctx.stroke()
  } else if (forme === 'antenne') {
    trait(0, 0, 6, 6)
    rect(-2, 0, 4, 3.5, CORPS)
    ctx.beginPath()
    ctx.ellipse(0, -1, 6.5, 4, 0, Math.PI, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = CLAIR
    ctx.fill()
    ctx.stroke()
  } else if (forme === 'voiture') {
    chemin([[-8, 2], [-7, -1], [-3, -1.5], [-1, -4], [3, -4], [5, -1.5], [8, -1], [8, 2]], CERISE)
    for (const cx of [-4.5, 4.5]) {
      ctx.beginPath()
      ctx.arc(cx, 2.5, 1.8, 0, 2 * Math.PI)
      ctx.fillStyle = encre
      ctx.fill()
    }
  } else {
    rect(-9, -1.5, 6, 3, PANNEAU)
    rect(3, -1.5, 6, 3, PANNEAU)
    rect(-3, -3, 6, 6, CORPS)
    trait(0, -3, 0, -6.5)
    ctx.beginPath()
    ctx.arc(0, -6.5, 1, 0, 2 * Math.PI)
    ctx.fillStyle = CLAIR
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}
