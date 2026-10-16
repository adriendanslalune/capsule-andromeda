// Formes dessinées quand on zoome assez : silhouettes des engins (ISS, Hubble, Webb…), cailloux pour les petites lunes.
// Tout est à l'encre (aplats), avec quelques détails en couleur du papier (cellules des panneaux, nombre).
// Les silhouettes sont décrites en unités d'envergure : 1 = la taille réelle de l'engin.

type Primitive =
  | readonly ['rect', number, number, number, number] // centre x, y ; largeur, hauteur
  | readonly ['panneau', number, number, number, number] // rectangle de cellules solaires
  | readonly ['disque', number, number, number] // centre x, y ; rayon
  | readonly ['poly', readonly number[]] // x, y, x, y…
  | readonly ['trait', number, number, number, number, number] // x1, y1, x2, y2, épaisseur

const ISS: Primitive[] = [
  ['rect', 0, 0, 1, 0.03], // poutre
  ...[-0.42, -0.3, 0.3, 0.42].flatMap((x): Primitive[] => [['panneau', x, 0.19, 0.1, 0.33], ['panneau', x, -0.19, 0.1, 0.33]]),
  ['rect', 0, 0.06, 0.05, 0.62], // modules
  ['rect', 0, -0.19, 0.14, 0.04], // nœud et laboratoires
  ['rect', -0.12, -0.08, 0.05, 0.13], ['rect', 0.12, -0.08, 0.05, 0.13], // radiateurs
  ['panneau', 0, 0.33, 0.3, 0.035], // panneaux du segment russe
]
const HUBBLE: Primitive[] = [
  ['rect', -0.02, 0, 0.9, 0.33], ['rect', 0.42, 0, 0.16, 0.37], ['rect', -0.5, 0.1, 0.03, 0.34],
  ['panneau', 0.08, 0.47, 0.2, 0.56], ['panneau', 0.08, -0.47, 0.2, 0.56],
  ['trait', 0.08, 0.16, 0.08, 0.2, 0.02], ['trait', 0.08, -0.16, 0.08, -0.2, 0.02],
]
const TIANGONG: Primitive[] = [
  ['rect', 0.08, 0, 0.36, 0.08], ['disque', -0.12, 0, 0.05],
  ['rect', -0.12, 0.2, 0.07, 0.34], ['rect', -0.12, -0.2, 0.07, 0.34],
  ['panneau', -0.12, 0.43, 0.9, 0.07], ['panneau', -0.12, -0.43, 0.9, 0.07],
  ['panneau', 0.2, 0.1, 0.05, 0.14], ['panneau', 0.2, -0.1, 0.05, 0.14],
]
const WEBB: Primitive[] = [
  ['poly', [-0.5, 0, -0.3, 0.33, 0.3, 0.33, 0.5, 0, 0.3, -0.33, -0.3, -0.33]], // écran solaire
]
const JUNO: Primitive[] = [
  ...[90, 210, 330].map((a): Primitive => {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), l = 0.06, L = 0.5, w = 0.07
    return ['poly', [l * c - w * s, l * s + w * c, L * c - w * s, L * s + w * c, L * c + w * s, L * s - w * c, l * c + w * s, l * s - w * c]]
  }),
  ['disque', 0, 0, 0.1],
]
const VOYAGER: Primitive[] = [
  ['trait', 0, 0, 0.55, 0, 0.012], ['trait', 0, 0, -0.2, -0.12, 0.02], ['rect', -0.2, -0.12, 0.06, 0.04],
  ['disque', 0, 0, 0.14],
]
const PIONEER: Primitive[] = [
  ['trait', 0, 0, 0.55, 0.1, 0.02], ['trait', 0, 0, -0.45, 0.25, 0.03], ['trait', 0, 0, -0.45, -0.25, 0.03],
  ['disque', 0, 0, 0.45],
]
const NEW_HORIZONS: Primitive[] = [
  ['poly', [-0.35, -0.3, 0.4, 0, -0.35, 0.3]], ['disque', -0.05, 0, 0.3], ['rect', -0.4, 0.25, 0.12, 0.08],
]
const PARKER: Primitive[] = [['rect', 0.15, 0, 0.35, 0.2], ['disque', -0.1, 0, 0.42]]
const ROADSTER: Primitive[] = [
  ['rect', 0, 0, 1, 0.42], ['disque', -0.3, 0.24, 0.1], ['disque', 0.3, 0.24, 0.1],
  ['disque', -0.3, -0.24, 0.1], ['disque', 0.3, -0.24, 0.1],
]
const SONDE: Primitive[] = [
  ['panneau', -0.33, 0, 0.32, 0.18], ['panneau', 0.33, 0, 0.32, 0.18], ['rect', 0, 0, 0.22, 0.22], ['disque', 0, 0, 0.17],
]

const SILHOUETTES: Record<string, Primitive[]> = {
  iss: ISS, hubble: HUBBLE, tiangong: TIANGONG, webb: WEBB, juno: JUNO, voyager: VOYAGER, pioneer: PIONEER,
  'new-horizons': NEW_HORIZONS, parker: PARKER, roadster: ROADSTER,
}

/** Petit nombre pseudo-aléatoire stable tiré d'un nom (orientation, forme des cailloux). */
export function graineDe(nom: string): number {
  let h = 2166136261
  for (let i = 0; i < nom.length; i++) h = Math.imul(h ^ nom.charCodeAt(i), 16777619)
  return (h >>> 0) / 2 ** 32
}

/**
 * Dessine la silhouette d'un engin centrée en (x, y), d'envergure `taille` pixels, tournée d'un angle (radians).
 */
export function dessinerSilhouette(ctx: CanvasRenderingContext2D, modele: string, x: number, y: number, taille: number,
  angle: number, encre: string, papier: string): void {
  const forme = SILHOUETTES[modele] ?? SONDE
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(taille, taille)
  ctx.fillStyle = encre
  ctx.strokeStyle = encre
  ctx.lineCap = 'round'
  const panneaux: Primitive[] = []
  for (const p of forme) {
    ctx.beginPath()
    switch (p[0]) {
      case 'rect': case 'panneau':
        ctx.rect(p[1] - p[3] / 2, p[2] - p[4] / 2, p[3], p[4])
        ctx.fill()
        if (p[0] === 'panneau') panneaux.push(p)
        break
      case 'disque':
        ctx.arc(p[1], p[2], p[3], 0, 2 * Math.PI)
        ctx.fill()
        break
      case 'poly':
        ctx.moveTo(p[1][0], p[1][1])
        for (let k = 2; k < p[1].length; k += 2) ctx.lineTo(p[1][k], p[1][k + 1])
        ctx.closePath()
        ctx.fill()
        break
      case 'trait':
        ctx.moveTo(p[1], p[2])
        ctx.lineTo(p[3], p[4])
        ctx.lineWidth = Math.max(p[5], 1 / taille)
        ctx.stroke()
        break
    }
  }
  // Détails en couleur du papier, quand la silhouette est assez grande : cellules des panneaux, miroir de Webb,
  // antennes paraboliques.
  if (taille > 60) {
    ctx.strokeStyle = papier
    ctx.lineWidth = 1 / taille
    ctx.beginPath()
    for (const p of panneaux) {
      if (p[0] !== 'panneau') continue
      const [, cx, cy, w, h] = p
      const n = Math.max(2, Math.round(Math.max(w, h) / Math.min(w, h)) * 2)
      for (let k = 1; k < n; k++) {
        if (h > w) { const yy = cy - h / 2 + (h * k) / n; ctx.moveTo(cx - w / 2, yy); ctx.lineTo(cx + w / 2, yy) }
        else { const xx = cx - w / 2 + (w * k) / n; ctx.moveTo(xx, cy - h / 2); ctx.lineTo(xx, cy + h / 2) }
      }
      ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx, cy + h / 2)
    }
    ctx.stroke()
    if (modele === 'webb') {
      // Miroir : 18 hexagones de papier, cernés d'encre.
      ctx.fillStyle = papier
      const r = 0.035
      for (const [q, s] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1], [2, -1], [-2, 1], [1, 1], [-1, -1],
        [2, 0], [-2, 0], [0, 2], [0, -2], [1, -2], [-1, 2], [2, -2]]) {
        const hx = 0.1 + r * 1.75 * (q + s / 2), hy = r * 1.52 * s
        ctx.beginPath()
        for (let k = 0; k < 6; k++) ctx.lineTo(hx + r * Math.cos((k * Math.PI) / 3 + Math.PI / 6), hy + r * Math.sin((k * Math.PI) / 3 + Math.PI / 6))
        ctx.closePath()
        ctx.fill()
      }
    }
    for (const p of forme) {
      if (p[0] !== 'disque' || p[3] < 0.1 || modele === 'roadster') continue
      ctx.beginPath()
      ctx.arc(p[1], p[2], p[3] * 0.6, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/**
 * Dessine une petite lune en caillou : un contour bosselé, stable pour chaque lune, et quelques nombre quand elle est
 * assez grande à l'écran.
 */
export function dessinerCaillou(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number,
  encre: string, papier: string): void {
  const g = graineDe(nom)
  let graine = Math.floor(g * 2 ** 31) || 1
  const hasard = () => ((graine = (graine * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const harmoniques = [2, 3, 4, 5, 7].map((k) => ({ k, a: (0.1 + 0.12 * hasard()) / k ** 0.6, p: hasard() * 6.283 }))
  const allongement = 1 + 0.35 * hasard()
  const angle = hasard() * Math.PI
  const ca = Math.cos(angle), sa = Math.sin(angle)
  const n = 40
  ctx.fillStyle = encre
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n
    let f = 1
    for (const h of harmoniques) f += h.a * Math.sin(h.k * t + h.p)
    const px = Math.cos(t) * f * r * allongement / Math.sqrt(allongement), py = Math.sin(t) * f * r / Math.sqrt(allongement)
    ctx.lineTo(x + px * ca - py * sa, y + px * sa + py * ca)
  }
  ctx.closePath()
  ctx.fill()
  if (r > 14) {
    ctx.strokeStyle = papier
    ctx.lineWidth = Math.max(1, r / 40)
    const nombre = 3 + Math.floor(hasard() * 4)
    for (let i = 0; i < nombre; i++) {
      const d = 0.55 * Math.sqrt(hasard()) * r, a = hasard() * 6.283, rc = r * (0.07 + 0.12 * hasard())
      ctx.beginPath()
      ctx.arc(x + d * Math.cos(a), y + d * Math.sin(a), rc, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }
}
