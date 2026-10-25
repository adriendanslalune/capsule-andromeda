// Les objets des contrats, dessinés par ChatGPT (Adrien, 25/10/2026 ; docs/contrats-prompts.md) : la station (quai
// d'amarrage, hangar) et les épaves. Quatre sortes d'épaves, vues du dessus (satellite mort, étage de fusée, station en ruine, cargo abandonné). Le nom d'une épave dit sa sorte ;
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

/** Où est la pointe du port d'amarrage du quai, en fraction de la hauteur de son image, depuis le haut. */
export const POINTE_QUAI = 0.93

const IMAGES: Record<string, HTMLImageElement> = {}

/** L'image d'un objet des contrats (chargée une fois), ou null tant qu'elle n'est pas là. */
export function imageObjet(chemin: string): HTMLImageElement | null {
  let im = IMAGES[chemin]
  if (!im) { im = IMAGES[chemin] = new Image(); im.src = chemin }
  return im.complete && im.naturalWidth ? im : null
}

/** La station dessinée par ChatGPT (Adrien, 25/10/2026) : le quai d'amarrage (amarrage, largage) ou le hangar (convoi),
 *  large de `largeur`, centré en x ; `y` est la hauteur de son point de contact (`fy`, en fraction de sa hauteur depuis
 *  le haut : la pointe du port du quai, le milieu de la baie du hangar). False tant que l'image n'est pas chargée. */
export function dessinerStation(ctx: CanvasRenderingContext2D, sorte: 'quai' | 'hangar', x: number, y: number, largeur: number, fy: number): boolean {
  const im = imageObjet(`contrats/${sorte}.webp`)
  if (!im) return false
  const h = (largeur * im.naturalHeight) / im.naturalWidth
  ctx.drawImage(im, x - largeur / 2, y - fy * h, largeur, h)
  return true
}

/** Dessine l'épave centrée en (x, y), tournée de `angle` (radians), son plus grand côté long de `cote` ; false si son
 *  image n'est pas encore chargée (on garde alors l'ancien dessin). */
export function dessinerEpave(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, angle: number, cote: number): boolean {
  const im = imageObjet(imageEpave(nom))
  if (!im) return false
  const k = cote / Math.max(im.naturalWidth, im.naturalHeight)
  const w = im.naturalWidth * k, h = im.naturalHeight * k
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.drawImage(im, -w / 2, -h / 2, w, h)
  ctx.restore()
  return true
}

/** Un cargo de la Résistance, dessiné par ChatGPT (Adrien, 25/10/2026), ses bandes repeintes d'avance (par Claude) aux
 *  couleurs des trois cargos du convoi (COULEURS_CARGOS : jaune, bleu, lavande) ; la proue vers le haut, centré en
 *  (x, y), haut de `hauteur` ; gris quand il est hors d'usage. False tant que l'image n'est pas chargée. */
export function dessinerCargo(ctx: CanvasRenderingContext2D, i: number, x: number, y: number, hauteur: number, gris = false): boolean {
  const im = imageObjet(`contrats/cargo-${i % 3}.webp`)
  if (!im) return false
  const l = (hauteur * im.naturalWidth) / im.naturalHeight
  ctx.save()
  if (gris) ctx.filter = 'grayscale(1) brightness(0.85)'
  ctx.drawImage(im, x - l / 2, y - hauteur / 2, l, hauteur)
  ctx.restore()
  return true
}

/** Où sont ses deux tuyères, en parts de la largeur de l'image depuis son milieu. */
export const TUYERES_CARGO = 0.22

/** Le missile d'Andromède, dessiné par ChatGPT (Adrien, 25/10/2026), centré en (x, y), long de `longueur`, la pointe
 *  dans la direction `angle` (radians, 0 vers la droite). False tant que l'image n'est pas chargée. */
export function dessinerMissile(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, longueur: number): boolean {
  const im = imageObjet('contrats/missile.webp')
  if (!im) return false
  const l = (longueur * im.naturalWidth) / im.naturalHeight
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle + Math.PI / 2)
  ctx.drawImage(im, -l / 2, -longueur / 2, l, longueur)
  ctx.restore()
  return true
}
