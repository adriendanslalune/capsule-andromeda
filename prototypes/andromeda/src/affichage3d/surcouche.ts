// Ce qui se dessine à plat par-dessus la vue 3D : noms des astres, rayons du Soleil quand il est petit, flèches au
// bord de l'écran vers le Soleil et la Terre quand ils sont hors champ (ou derrière nous).

import { dessinerReperes, type ReglagesReperes } from '../commun/reperes'
import type { Theme } from './materiaux'
import type { AstreEcran } from './scene'

const POLICE = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
let ENCRE = '#1f1b18'
let FOND = '#f4f1ea'

export interface ReglagesSurcouche { soleil: boolean; noms: boolean; fleches: boolean; style: string }

/** Couleurs du style BD pour la surcouche : rayons du Soleil et flèches à la couleur de leur astre. */
const COULEUR_FLECHE: Record<string, string> = { Soleil: '#f2b53a', Terre: '#3f7fc1' }

const grandeLune = (a: AstreEcran) => a.corps.nom === 'Lune' || (a.corps.type === 'lune' && a.corps.rayon >= 100)
function priorite(a: AstreEcran): number {
  const t = a.corps.type
  if (t === 'etoile') return 0
  if (t === 'planete') return 1
  if (t === 'naine') return 2
  if (grandeLune(a)) return 3
  if (t === 'sonde' || t === 'satellite') return 4
  return 5
}

function texte(ctx: CanvasRenderingContext2D, s: string, x: number, y: number): void {
  ctx.strokeText(s, x, y)
  ctx.fillText(s, x, y)
}

export function dessinerSurcouche(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number,
  astres: AstreEcran[], capsule: { x: number; y: number; r: number }, reglages: ReglagesSurcouche, theme: Theme,
  selection: { nom: string; distance: string } | null, reperes: ReglagesReperes): void {
  ENCRE = theme.encre
  FOND = theme.halo
  ctx.clearRect(0, 0, largeur, hauteur)
  ctx.font = POLICE
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 3
  ctx.strokeStyle = FOND
  ctx.fillStyle = ENCRE
  const dansEcran = (a: { x: number; y: number }) => a.x >= 0 && a.x <= largeur && a.y >= 0 && a.y <= hauteur
  const soleil = astres.find((a) => a.corps.nom === 'Soleil')!

  // Rayons du Soleil, tant qu'il est petit à l'écran.
  if (reglages.soleil && soleil.devant && !soleil.cache && soleil.r < 30 && dansEcran(soleil)) {
    const r = Math.max(soleil.r, 3)
    ctx.beginPath()
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6, r0 = r + 3, r1 = r + (k % 2 ? 6 : 10)
      ctx.moveTo(soleil.x + r0 * Math.cos(a), soleil.y + r0 * Math.sin(a))
      ctx.lineTo(soleil.x + r1 * Math.cos(a), soleil.y + r1 * Math.sin(a))
    }
    const bd = reglages.style === 'bd' || reglages.style === 'moebius'
    ctx.lineCap = 'round'
    if (bd) {
      // Rayons moutarde cernés d'encre.
      ctx.lineWidth = 4
      ctx.strokeStyle = ENCRE
      ctx.stroke()
      ctx.lineWidth = 2
      ctx.strokeStyle = COULEUR_FLECHE.Soleil
      ctx.stroke()
    } else {
      ctx.lineWidth = 1.5
      ctx.strokeStyle = ENCRE
      ctx.stroke()
    }
    ctx.lineWidth = 3
    ctx.strokeStyle = FOND
  }

  if (reglages.noms) {
    const occupes: { x0: number; y0: number; x1: number; y1: number }[] = []
    const poser = (nom: string, x0: number, y: number): void => {
      const l = ctx.measureText(nom).width
      if (x0 < 4 || x0 + l > largeur - 4 || y < 40 || y > hauteur - 130) return
      const b = { x0: x0 - 2, y0: y - 8, x1: x0 + l + 2, y1: y + 8 }
      if (occupes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)) return
      occupes.push(b)
      texte(ctx, nom, x0, y)
    }
    if (capsule.r < 20) poser('Andromeda', capsule.x + Math.max(capsule.r, 3) + 6, capsule.y)
    const candidats = astres.filter((a) => a.devant && !a.cache && dansEcran(a))
      .sort((a, b) => priorite(a) - priorite(b) || a.distance - b.distance)
    for (const a of candidats) {
      if (a.corps.nom === selection?.nom) continue // elle a son étiquette
      // Petites lunes : seulement de près (quand on les voit en caillou).
      if (a.corps.type === 'lune' && !grandeLune(a) && a.r < 2.5) continue
      const decalage = a.corps.type === 'etoile' && reglages.soleil && a.r < 30 ? 13 : 6
      poser(a.corps.nom, a.x + Math.min(a.r, 60) + decalage, a.y)
    }
  }

  // Destination choisie : crochet, étiquette, ou flèche si elle est hors champ (ou cachée derrière nous).
  if (selection) {
    const a = selection.nom === 'Andromeda' ? { ...capsule, devant: true, cache: false } : astres.find((x) => x.corps.nom === selection.nom)
    if (a) {
      const visible = a.devant && !a.cache && dansEcran(a)
      dessinerReperes(ctx, largeur, hauteur, a.x, a.y, Math.min(a.r, 80), visible, selection.nom, selection.distance, reperes,
        { encre: ENCRE, fond: FOND, accent: reglages.style === 'bd' ? '#e04b37' : reglages.style === 'moebius' ? '#d9694f' : ENCRE })
    }
  }

  if (reglages.fleches) {
    for (const nom of ['Soleil', 'Terre']) {
      const a = astres.find((x) => x.corps.nom === nom)
      // Flèche seulement si l'astre (son disque entier) est hors de l'écran ou derrière nous.
      const horsEcran = a && (a.x + a.r < 0 || a.x - a.r > largeur || a.y + a.r < 0 || a.y - a.r > hauteur)
      if (a && (!a.devant || horsEcran)) fleche(ctx, largeur, hauteur, nom, a.x, a.y, reglages.style === 'bd' || reglages.style === 'moebius' ? COULEUR_FLECHE[nom] : ENCRE)
    }
  }
}

function fleche(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, nom: string, sx: number,
  sy: number, couleur: string): void {
  const cx = largeur / 2, cy = hauteur / 2
  let dx = sx - cx, dy = sy - cy
  if (dx === 0 && dy === 0) dy = 1
  // On évite la ligne d'infos en haut, et le recul et les boutons en bas.
  const mx = cx - 22, haut = cy - 50, bas = cy - 130
  const k = Math.min(mx / Math.abs(dx || 1e-9), (dy < 0 ? haut : bas) / Math.abs(dy || 1e-9))
  const x = cx + dx * k, y = cy + dy * k
  const a = Math.atan2(dy, dx)
  ctx.fillStyle = couleur
  ctx.beginPath()
  ctx.moveTo(x + 11 * Math.cos(a), y + 11 * Math.sin(a))
  ctx.lineTo(x + 9 * Math.cos(a + 2.4), y + 9 * Math.sin(a + 2.4))
  ctx.lineTo(x + 9 * Math.cos(a - 2.4), y + 9 * Math.sin(a - 2.4))
  ctx.closePath()
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = ENCRE
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.strokeStyle = FOND
  ctx.fillStyle = ENCRE
  ctx.textAlign = Math.cos(a) > 0.3 ? 'right' : Math.cos(a) < -0.3 ? 'left' : 'center'
  texte(ctx, nom, x - 16 * Math.cos(a), y - 16 * Math.sin(a))
  ctx.textAlign = 'left'
}
