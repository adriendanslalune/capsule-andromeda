// Planche de présentation des astres illustrés (pour qu'Adrien les valide avant de les brancher sur la carte).
import { dessinerAstreIllustre, RAYON_ILLUSTRATION } from './carte/illustrations'

const NOMS = ['Soleil', 'Mercure', 'Vénus', 'Terre', 'Lune', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Pluton']
const dpr = Math.min(window.devicePixelRatio || 1, 3)

function toile(l: number, h: number, el: HTMLCanvasElement = document.createElement('canvas')) {
  el.width = Math.round(l * dpr)
  el.height = Math.round(h * dpr)
  el.style.aspectRatio = `${l} / ${h}`
  const ctx = el.getContext('2d')!
  ctx.scale(dpr, dpr)
  return { el, ctx }
}

const grandes = document.querySelector('#grandes')!
for (const nom of NOMS) {
  const soleil = nom === 'Soleil'
  const { el, ctx } = toile(180, soleil ? 200 : 180)
  // Le Soleil prend toute la largeur ; les planètes sont éclairées depuis la gauche.
  dessinerAstreIllustre(ctx, nom, 90, soleil ? 100 : 90, soleil ? 36 : nom === 'Saturne' ? 36 : 58, soleil ? null : Math.PI)
  const fig = document.createElement('figure')
  fig.append(el)
  const legende = document.createElement('figcaption')
  legende.textContent = nom.toUpperCase()
  fig.append(legende)
  if (soleil) fig.style.gridColumn = '1 / -1'
  grandes.append(fig)
}

// Aux tailles de la carte : sous RAYON_ILLUSTRATION, on garde le disque simple (ici, un rond de la couleur de base).
const tailles = [8, 12, 20, 32]
const { ctx } = toile(360, NOMS.length * 90, document.querySelector<HTMLCanvasElement>('#tailles')!)
NOMS.forEach((nom, i) => {
  tailles.forEach((r, j) => {
    const x = 45 + j * 90, y = 45 + i * 90
    const rr = nom === 'Soleil' ? r * 0.7 : r
    if (rr < RAYON_ILLUSTRATION) {
      ctx.beginPath()
      ctx.arc(x, y, rr, 0, 2 * Math.PI)
      ctx.fillStyle = '#d8cdb8'
      ctx.fill()
      ctx.strokeStyle = '#2b2138'
      ctx.lineWidth = 1
      ctx.stroke()
    } else dessinerAstreIllustre(ctx, nom, x, y, rr, nom === 'Soleil' ? null : Math.PI)
  })
})
