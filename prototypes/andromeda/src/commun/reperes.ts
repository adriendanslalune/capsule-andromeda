// Repères de la destination choisie, communs à la carte et à la vue extérieure (étape 2, à tester) :
//  - un crochet autour de l'astre sélectionné ;
//  - une étiquette avec son nom et sa distance à la capsule ;
//  - une flèche au bord de l'écran quand il est hors champ (ou derrière nous).
// Chacun se désactive dans le panneau « Repères ».

export interface ReglagesReperes { crochet: boolean; etiquette: boolean; fleche: boolean }

export interface CouleursReperes { encre: string; fond: string; accent: string }

const POLICE = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

/** Marges de l'écran à laisser libres : ligne d'infos en haut, boutons en bas. */
export const MARGE_HAUT = 56
export const MARGE_BAS = 130

/**
 * Dessine les repères d'un astre sélectionné, à la position (x, y) de rayon apparent r (pixels).
 * `visible` : l'astre est devant la caméra et dans l'écran.
 */
export function dessinerReperes(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, x: number, y: number,
  r: number, visible: boolean, nom: string, distance: string, reglages: ReglagesReperes, c: CouleursReperes): void {
  ctx.save()
  if (visible) {
    const a = Math.max(r, 4) + 7 // demi-côté du crochet
    if (reglages.crochet) {
      // Quatre coins, couleur d'accent cernée d'encre.
      const coin = Math.max(5, a * 0.45)
      ctx.beginPath()
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.moveTo(x + sx * a, y + sy * (a - coin))
        ctx.lineTo(x + sx * a, y + sy * a)
        ctx.lineTo(x + sx * (a - coin), y + sy * a)
      }
      ctx.lineCap = 'square'
      ctx.lineJoin = 'miter'
      ctx.lineWidth = 5
      ctx.strokeStyle = c.encre
      ctx.stroke()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = c.accent
      ctx.stroke()
    }
    if (reglages.etiquette) etiquette(ctx, largeur, hauteur, x, y, Math.max(r, 4) + 12, nom, distance, c)
  } else if (reglages.fleche) {
    fleche(ctx, largeur, hauteur, x, y, nom, distance, c)
  }
  ctx.restore()
}

/** Étiquette façon bulle de BD : le nom en capitales, la distance dessous ; à droite de l'astre, ou à gauche. */
function etiquette(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, x: number, y: number, ecart: number,
  nom: string, distance: string, c: CouleursReperes): void {
  ctx.font = `bold 13px ${POLICE}`
  const l1 = ctx.measureText(nom.toUpperCase()).width
  ctx.font = `12px ${POLICE}`
  const l2 = ctx.measureText(distance).width
  const l = Math.max(l1, l2) + 16, h = 40
  let bx = x + ecart
  if (bx + l > largeur - 8) bx = x - ecart - l
  bx = Math.max(8, bx)
  const by = Math.min(Math.max(y - h / 2, MARGE_HAUT), hauteur - MARGE_BAS - h)
  ctx.fillStyle = c.encre
  ctx.fillRect(bx + 3, by + 3, l, h) // ombre dure
  ctx.fillStyle = c.fond
  ctx.fillRect(bx, by, l, h)
  ctx.lineWidth = 2
  ctx.strokeStyle = c.encre
  ctx.strokeRect(bx, by, l, h)
  ctx.fillStyle = c.encre
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `bold 13px ${POLICE}`
  ctx.fillText(nom.toUpperCase(), bx + 8, by + 13)
  ctx.font = `12px ${POLICE}`
  ctx.fillText(distance, bx + 8, by + 29)
}

/** Flèche au bord de l'écran, vers l'astre hors champ, avec son nom et sa distance. */
function fleche(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, sx: number, sy: number, nom: string,
  distance: string, c: CouleursReperes): void {
  const cx = largeur / 2, cy = (MARGE_HAUT + hauteur - MARGE_BAS) / 2
  let dx = sx - cx, dy = sy - cy
  if (dx === 0 && dy === 0) dy = 1
  const mx = cx - 26, haut = cy - MARGE_HAUT - 20, bas = hauteur - MARGE_BAS - cy - 20
  const k = Math.min(mx / Math.abs(dx || 1e-9), (dy < 0 ? haut : bas) / Math.abs(dy || 1e-9))
  const x = cx + dx * k, y = cy + dy * k
  const a = Math.atan2(dy, dx)
  ctx.beginPath()
  ctx.moveTo(x + 16 * Math.cos(a), y + 16 * Math.sin(a))
  ctx.lineTo(x + 13 * Math.cos(a + 2.5), y + 13 * Math.sin(a + 2.5))
  ctx.lineTo(x + 13 * Math.cos(a - 2.5), y + 13 * Math.sin(a - 2.5))
  ctx.closePath()
  ctx.fillStyle = c.accent
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = c.encre
  ctx.stroke()
  ctx.font = `bold 12px ${POLICE}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = Math.cos(a) > 0.3 ? 'right' : Math.cos(a) < -0.3 ? 'left' : 'center'
  const tx = x - 22 * Math.cos(a), ty = y - 22 * Math.sin(a)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 3
  ctx.strokeStyle = c.fond
  ctx.fillStyle = c.encre
  for (const [texte, decalage] of [[nom.toUpperCase(), -7], [distance, 8]] as const) {
    ctx.strokeText(texte, tx, ty + decalage)
    ctx.fillText(texte, tx, ty + decalage)
  }
}
