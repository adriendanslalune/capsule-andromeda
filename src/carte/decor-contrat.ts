// Le décor des écrans des contrats (Adrien, 25/10/2026 : au lieu de décors peints, incohérents selon le système) :
// en bas de l'écran, un grand arc de l'astre près duquel on travaille, dessiné par le même moteur que les globes de la
// carte (la vraie Terre et sa nuit autour de l'ISS, la Lune à Tycho, Saturne et ses anneaux…) ; rien en plein espace.
// main.ts tient DECOR_CONTRAT à jour ; les écrans l'appellent juste après avoir effacé leur toile.

import { dessinerGlobe } from './globes'

export const DECOR_CONTRAT: { astre: string | null; gris: boolean; versSoleil: number; couleur: string; temps: number } = {
  astre: null, gris: false, versSoleil: 0, couleur: '#c9c2b0', temps: Date.now(),
}

/** Le globe est peint une fois à cette taille (pixels), puis agrandi : un arc de décor n'a pas besoin de plus. */
const TAILLE_PEINTE = 640

/** L'arc de l'astre, au pied de l'écran (l × h, pixels CSS) : on n'en voit que le haut, environ un cinquième de l'écran. */
export function dessinerDecorContrat(ctx: CanvasRenderingContext2D, l: number, h: number): void {
  const d = DECOR_CONTRAT
  if (!d.astre) return
  const r = l * 1.35, x = l / 2, y = h + r - Math.min(h * 0.2, 0.32 * l)
  ctx.save()
  ctx.globalAlpha = 0.9
  if (!dessinerGlobe(ctx, d.astre, x, y, r, d.versSoleil, d.temps, TAILLE_PEINTE, d.gris)) {
    // Son planisphère n'est pas encore là : un simple disque de sa couleur.
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fillStyle = d.couleur
    ctx.fill()
  }
  ctx.restore()
}
