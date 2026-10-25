// Les épaves des contrats, dessinées par ChatGPT (Adrien, 25/10/2026 ; docs/contrats-prompts.md) : quatre sortes,
// vues du dessus (satellite mort, étage de fusée, station en ruine, cargo abandonné). Le nom d'une épave dit sa sorte ;
// les épaves célèbres (Kosmos 482, Telstar 1…) en prennent une d'après leur nom. Le jeu dessine lui-même l'anneau
// d'accroche par-dessus.

export type SorteEpave = 'satellite' | 'etage' | 'station' | 'cargo'

const SORTES: readonly SorteEpave[] = ['satellite', 'etage', 'station', 'cargo']

/** D'après le début du nom (les sortes de donnees/espace.ts). */
const PAR_NOM: readonly [RegExp, SorteEpave][] = [
  [/^(Satellite|Sonde|Antenne)/, 'satellite'],
  [/^(Étage|Réservoir)/, 'etage'],
  [/^(Station|Module)/, 'station'],
  [/^(Cargo|Conteneur|Remorqueur|Navette|Minéralier)/, 'cargo'],
]

export function sorteEpave(nom: string): SorteEpave {
  for (const [motif, sorte] of PAR_NOM) if (motif.test(nom)) return sorte
  let h = 0
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return SORTES[h % SORTES.length]
}

export function imageEpave(nom: string): string {
  return `contrats/epave-${sorteEpave(nom)}.webp`
}

const IMAGES: Partial<Record<SorteEpave, HTMLImageElement>> = {}

/** Dessine l'épave centrée en (x, y), tournée de `angle` (radians), son plus grand côté long de `cote` ; false si son
 *  image n'est pas encore chargée (on garde alors l'ancien dessin). */
export function dessinerEpave(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, angle: number, cote: number): boolean {
  const sorte = sorteEpave(nom)
  let im = IMAGES[sorte]
  if (!im) { im = IMAGES[sorte] = new Image(); im.src = imageEpave(nom) }
  if (!im.complete || !im.naturalWidth) return false
  const k = cote / Math.max(im.naturalWidth, im.naturalHeight)
  const w = im.naturalWidth * k, h = im.naturalHeight * k
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.drawImage(im, -w / 2, -h / 2, w, h)
  ctx.restore()
  return true
}
