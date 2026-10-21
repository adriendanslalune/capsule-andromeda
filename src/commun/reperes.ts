// Repères de la destination choisie, communs à la carte et à la vue extérieure (étape 2, à tester) :
//  - un crochet autour de l'astre sélectionné ;
//  - une étiquette avec son nom et sa distance à la capsule ;
//  - une flèche au bord de l'écran quand il est hors champ (ou derrière nous).
// Chacun se désactive dans le panneau « Repères ».

export interface ReglagesReperes { crochet: boolean; etiquette: boolean; fleche: boolean }

export interface CouleursReperes { encre: string; fond: string; accent: string }

/** Un rectangle de l'écran (pixels) : ce qu'occupe une étiquette, pour que les noms de la carte l'évitent. */
export interface Boite { x0: number; y0: number; x1: number; y1: number }

const POLICE = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

/** Marges de l'écran à laisser libres : bandeau d'alertes et titre en haut, onglets et fiche de trajet en bas. */
export const MARGE_HAUT = 144
export const MARGE_BAS = 190

/**
 * Dessine les repères d'un astre sélectionné, à la position (x, y) de rayon apparent r (pixels).
 * `visible` : l'astre est devant la caméra et dans l'écran.
 */
export function dessinerReperes(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, x: number, y: number,
  r: number, visible: boolean, nom: string, distance: string, reglages: ReglagesReperes, c: CouleursReperes,
  eviter: { x: number; y: number }[] = []): Boite | null {
  let boite: Boite | null = null
  ctx.save()
  if (visible) {
    const a = Math.max(r, 3) + 5 // demi-côté du crochet
    if (reglages.crochet) {
      // Quatre petits coins fins, couleur d'accent liserée d'encre : discrets, ils n'écrasent pas l'astre.
      const coin = Math.min(6, Math.max(3.5, a * 0.35))
      ctx.beginPath()
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.moveTo(x + sx * a, y + sy * (a - coin))
        ctx.lineTo(x + sx * a, y + sy * a)
        ctx.lineTo(x + sx * (a - coin), y + sy * a)
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 3
      ctx.strokeStyle = c.encre
      ctx.stroke()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = c.accent
      ctx.stroke()
    }
    if (reglages.etiquette) boite = etiquette(ctx, largeur, hauteur, x, y, a + 3, nom, distance, c, eviter)
  } else if (reglages.fleche) {
    fleche(ctx, largeur, hauteur, x, y, nom, distance, c)
  }
  ctx.restore()
  return boite
}

/**
 * Étiquette façon bulle de BD : le nom en capitales, la distance dessous. Elle se pose à l'écart de l'astre (à
 * droite, à gauche, au-dessus ou en dessous), là où elle ne cache ni les points à éviter (point de rendez-vous,
 * capsule) ni le bord de l'écran ; un trait fin la relie à l'astre.
 */
function etiquette(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, x: number, y: number, ecart: number,
  nom: string, distance: string, c: CouleursReperes, eviter: { x: number; y: number }[]): Boite {
  ctx.font = `bold 13px ${POLICE}`
  const l1 = ctx.measureText(nom.toUpperCase()).width
  ctx.font = `12px ${POLICE}`
  const l2 = ctx.measureText(distance).width
  const l = Math.max(l1, l2) + 16, h = 40
  const loin = ecart + 22
  const essais = [
    { bx: x + loin, by: y - h / 2 }, { bx: x - loin - l, by: y - h / 2 },
    { bx: x - l / 2, by: y - loin - h }, { bx: x - l / 2, by: y + loin },
    { bx: x + loin, by: y - loin - h }, { bx: x - loin - l, by: y + loin },
  ]
  const libre = (b: { bx: number; by: number }) =>
    b.bx >= 8 && b.bx + l <= largeur - 8 && b.by >= MARGE_HAUT && b.by + h <= hauteur - MARGE_BAS
    && eviter.every((p) => p.x < b.bx - 14 || p.x > b.bx + l + 14 || p.y < b.by - 14 || p.y > b.by + h + 14)
  const b = essais.find(libre) ?? {
    bx: Math.min(Math.max(8, x + loin), largeur - 8 - l),
    by: Math.min(Math.max(y - h / 2, MARGE_HAUT), hauteur - MARGE_BAS - h),
  }
  const { bx, by } = b
  // Trait de rappel, du bord du crochet au bord de l'étiquette.
  const cx = Math.min(Math.max(x, bx), bx + l), cy = Math.min(Math.max(y, by), by + h)
  const d = Math.hypot(cx - x, cy - y) || 1
  ctx.beginPath()
  ctx.moveTo(x + ((cx - x) / d) * ecart, y + ((cy - y) / d) * ecart)
  ctx.lineTo(cx, cy)
  ctx.lineWidth = 1.2
  ctx.strokeStyle = c.encre
  ctx.stroke()
  ctx.fillStyle = c.encre
  ctx.fillRect(bx + 3, by + 3, l, h) // ombre dure
  ctx.fillStyle = c.fond
  ctx.fillRect(bx, by, l, h)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = c.encre
  ctx.strokeRect(bx, by, l, h)
  ctx.fillStyle = c.encre
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `bold 13px ${POLICE}`
  ctx.fillText(nom.toUpperCase(), bx + 8, by + 13)
  ctx.font = `12px ${POLICE}`
  ctx.fillText(distance, bx + 8, by + 29)
  return { x0: bx, y0: by, x1: bx + l + 3, y1: by + h + 3 }
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
