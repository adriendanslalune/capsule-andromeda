// Astres illustrés (idée d'Adrien du 17/10/2026, d'après une gravure de soleil personnifié) : chaque astre a un
// visage et un décor qui lui est propre, dessinés au trait fin brun-violet sur des aplats pastel, style Moebius.
// Le Soleil a ses flammes ondulées et ses rayons ; chaque planète, son motif (cratères, nuages, bandes, anneaux…).
// Dessiné en coordonnées locales : centre (0, 0), rayon du disque r (pixels). Sous une certaine taille, la carte
// garde le simple disque (un visage de 5 pixels ne se lit pas).

export const ENCRE = '#2b2138'
const OMBRE = '#54437a'
const JOUE = '#f3a08b'

/** Taille à partir de laquelle on dessine l'illustration complète (rayon en pixels), et le visage. */
export const RAYON_ILLUSTRATION = 11
export const RAYON_VISAGE = 18

/** Hasard reproductible (un astre est toujours dessiné pareil). */
function hasard(graine: number): () => number {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const graineDe = (nom: string) => [...nom].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Expression d'un visage. */
interface Visage {
  yeux: 'ouverts' | 'mi-clos' | 'fermes'
  bouche: 'neutre' | 'sourire' | 'moue' | 'boudeuse'
  /** Joues en spirale (comme le soleil de la gravure). */
  spirales: boolean
  /** Sourcils : 0 calmes, positif froncés. */
  froncement: number
}

interface Fiche {
  couleur: string
  visage: Visage
  decor: (ctx: CanvasRenderingContext2D, r: number, h: () => number) => void
  /** Décor dessiné derrière le disque (rayons du Soleil, anneaux de Saturne, arrière). */
  arriere?: (ctx: CanvasRenderingContext2D, r: number, h: () => number) => void
  /** Décor dessiné devant le disque (avant des anneaux). */
  avant?: (ctx: CanvasRenderingContext2D, r: number, h: () => number) => void
  /** Inclinaison du visage et du décor (radians) : Uranus est couchée. */
  inclinaison?: number
}

// --- Petits outils de trait.

function trait(ctx: CanvasRenderingContext2D, largeur: number, couleur = ENCRE): void {
  ctx.lineWidth = largeur
  ctx.strokeStyle = couleur
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function spirale(ctx: CanvasRenderingContext2D, cx: number, cy: number, rayon: number, tours: number): void {
  ctx.beginPath()
  const n = 60
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const a = u * tours * 2 * Math.PI
    const rr = rayon * u
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

/** Cratère gravé : un cercle et un petit arc d'ombre intérieur. */
function cratere(ctx: CanvasRenderingContext2D, x: number, y: number, rc: number, lw: number): void {
  ctx.beginPath()
  ctx.arc(x, y, rc, 0, 2 * Math.PI)
  trait(ctx, lw)
  ctx.beginPath()
  ctx.arc(x + rc * 0.15, y + rc * 0.15, rc * 0.7, Math.PI * 0.9, Math.PI * 1.6)
  trait(ctx, lw * 0.8)
}

/** Lignes de bandes ondulées (Jupiter, Saturne, Neptune), clipées au disque par l'appelant. */
function bandes(ctx: CanvasRenderingContext2D, r: number, h: () => number, n: number, amplitude: number, lw: number): void {
  for (let i = 1; i < n; i++) {
    const y = -r + (2 * r * i) / n + (h() - 0.5) * r * 0.06
    ctx.beginPath()
    for (let k = 0; k <= 24; k++) {
      const x = -r + (2 * r * k) / 24
      const yy = y + Math.sin(k * 0.9 + i * 1.7) * amplitude * r
      if (k === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    trait(ctx, lw)
  }
}

// --- Le visage, à la manière de la gravure : yeux en amande cils compris, nez d'un trait, lèvres, joues en spirale.

function visage(ctx: CanvasRenderingContext2D, r: number, v: Visage): void {
  const lw = Math.max(0.6, r * 0.022)
  for (const s of [-1, 1]) {
    const ex = s * 0.33 * r, ey = -0.08 * r, l = 0.17 * r
    // Sourcil.
    ctx.beginPath()
    ctx.moveTo(ex - l * 1.05, ey - 0.13 * r + (s > 0 ? 0 : v.froncement * 0.06 * r))
    ctx.quadraticCurveTo(ex, ey - (0.24 - v.froncement * 0.05) * r, ex + l * 1.05, ey - 0.12 * r + (s > 0 ? v.froncement * 0.06 * r : 0))
    trait(ctx, lw)
    if (v.yeux === 'fermes') {
      // Paupière baissée et cils.
      ctx.beginPath()
      ctx.moveTo(ex - l, ey)
      ctx.quadraticCurveTo(ex, ey + 0.09 * r, ex + l, ey)
      trait(ctx, lw * 1.1)
      for (let k = -2; k <= 2; k++) {
        const x = ex + k * l * 0.38
        ctx.beginPath()
        ctx.moveTo(x, ey + 0.05 * r)
        ctx.lineTo(x + k * 0.01 * r, ey + 0.11 * r)
        trait(ctx, lw * 0.7)
      }
      continue
    }
    const ouverture = v.yeux === 'mi-clos' ? 0.05 : 0.1
    // Amande de l'œil.
    ctx.beginPath()
    ctx.moveTo(ex - l, ey)
    ctx.quadraticCurveTo(ex, ey - ouverture * r * 1.3, ex + l, ey)
    ctx.quadraticCurveTo(ex, ey + ouverture * r, ex - l, ey)
    ctx.fillStyle = '#fffaf0'
    ctx.fill()
    ctx.save()
    ctx.clip()
    // Iris rayé et pupille.
    const ir = 0.075 * r
    ctx.beginPath()
    ctx.arc(ex, ey + 0.005 * r, ir, 0, 2 * Math.PI)
    ctx.fillStyle = '#8a7a9a'
    ctx.fill()
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(ex + Math.cos(a) * ir * 0.4, ey + Math.sin(a) * ir * 0.4)
      ctx.lineTo(ex + Math.cos(a) * ir, ey + Math.sin(a) * ir)
      trait(ctx, lw * 0.5)
    }
    ctx.beginPath()
    ctx.arc(ex, ey + 0.005 * r, ir * 0.38, 0, 2 * Math.PI)
    ctx.fillStyle = ENCRE
    ctx.fill()
    ctx.restore()
    // Paupière supérieure appuyée, pli au-dessus, cils au coin extérieur.
    ctx.beginPath()
    ctx.moveTo(ex - l, ey)
    ctx.quadraticCurveTo(ex, ey - ouverture * r * 1.3, ex + l, ey)
    trait(ctx, lw * 1.4)
    ctx.beginPath()
    ctx.moveTo(ex - l * 0.8, ey - ouverture * r * 0.9 - 0.03 * r)
    ctx.quadraticCurveTo(ex, ey - ouverture * r * 1.6 - 0.03 * r, ex + l * 0.85, ey - ouverture * r * 0.6 - 0.03 * r)
    trait(ctx, lw * 0.7)
    for (let k = 0; k < 3; k++) {
      const x0 = ex + s * l * (0.55 + k * 0.18), y0 = ey - ouverture * r * (0.8 - k * 0.25)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x0 + s * 0.05 * r, y0 - 0.04 * r)
      trait(ctx, lw * 0.7)
    }
  }
  // Nez : une arête et une narine.
  ctx.beginPath()
  ctx.moveTo(0.02 * r, -0.04 * r)
  ctx.quadraticCurveTo(0.06 * r, 0.1 * r, 0.03 * r, 0.17 * r)
  ctx.quadraticCurveTo(-0.02 * r, 0.2 * r, -0.07 * r, 0.16 * r)
  trait(ctx, lw)
  // Bouche.
  const my = 0.34 * r
  const courbe = v.bouche === 'sourire' ? 0.06 : v.bouche === 'moue' ? -0.05 : v.bouche === 'boudeuse' ? -0.03 : 0
  ctx.beginPath()
  ctx.moveTo(-0.13 * r, my - courbe * r * 0.3)
  ctx.quadraticCurveTo(-0.05 * r, my - 0.05 * r, 0, my - 0.025 * r)
  ctx.quadraticCurveTo(0.05 * r, my - 0.05 * r, 0.13 * r, my - courbe * r * 0.3)
  ctx.quadraticCurveTo(0, my + (0.03 + courbe) * r, -0.13 * r, my - courbe * r * 0.3)
  ctx.fillStyle = '#e8a08c'
  ctx.fill()
  trait(ctx, lw)
  ctx.beginPath()
  ctx.moveTo(-0.11 * r, my - courbe * r * 0.3)
  ctx.quadraticCurveTo(0, my + courbe * r * 0.6, 0.11 * r, my - courbe * r * 0.3)
  trait(ctx, lw * 0.8)
  if (v.bouche === 'boudeuse') {
    ctx.beginPath()
    ctx.moveTo(-0.03 * r, my + 0.1 * r)
    ctx.quadraticCurveTo(0, my + 0.13 * r, 0.03 * r, my + 0.1 * r)
    trait(ctx, lw * 0.8)
  }
  // Joues : fard rose, et spirales gravées.
  for (const s of [-1, 1]) {
    const cx = s * 0.4 * r, cy = 0.17 * r
    ctx.beginPath()
    ctx.arc(cx, cy, 0.12 * r, 0, 2 * Math.PI)
    ctx.fillStyle = JOUE
    ctx.globalAlpha = 0.45
    ctx.fill()
    ctx.globalAlpha = 1
    if (v.spirales) {
      spirale(ctx, cx, cy, 0.11 * r, 2.6)
      trait(ctx, lw * 0.9)
    }
  }
}

// --- Les astres.

const FICHES: Record<string, Fiche> = {
  Soleil: {
    couleur: '#f6cf6b',
    visage: { yeux: 'mi-clos', bouche: 'boudeuse', spirales: true, froncement: 0 },
    arriere: (ctx, r, h) => {
      // Rayons rectilignes, longs et courts en alternance.
      for (let k = 0; k < 72; k++) {
        const a = (k / 72) * 2 * Math.PI + (h() - 0.5) * 0.02
        const long = k % 2 ? 2.15 : 2.6 + h() * 0.25
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25)
        ctx.lineTo(Math.cos(a) * r * long, Math.sin(a) * r * long)
        trait(ctx, Math.max(0.5, r * (k % 2 ? 0.012 : 0.02)))
      }
      // Flammes ondulées, pointes recourbées, avec leurs traits intérieurs.
      const n = 18
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 2 * Math.PI
        const long = (k % 2 ? 1.62 : 1.9) + (h() - 0.5) * 0.12
        const largeur = (Math.PI / n) * 1.25
        const pointe = a + 0.18
        const pt = (ang: number, d: number) => ({ x: Math.cos(ang) * r * d, y: Math.sin(ang) * r * d })
        const g = pt(a - largeur, 0.96), d = pt(a + largeur, 0.96)
        const c1 = pt(a - largeur * 0.9, long * 0.62), c2 = pt(a - largeur * 0.1, long * 0.92)
        const p = pt(pointe, long)
        const c3 = pt(a + largeur * 0.55, long * 0.7), c4 = pt(a + largeur * 1.05, long * 0.5)
        ctx.beginPath()
        ctx.moveTo(g.x, g.y)
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p.x, p.y)
        ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, d.x, d.y)
        ctx.closePath()
        ctx.fillStyle = k % 2 ? '#f9dc8c' : '#f4b860'
        ctx.fill()
        trait(ctx, Math.max(0.6, r * 0.022))
        for (const f of [-0.35, 0.1]) {
          const q0 = pt(a + largeur * f, 1.05), q1 = pt(a + largeur * (f + 0.1), long * 0.62), q2 = pt(pointe - 0.06, long * 0.82)
          ctx.beginPath()
          ctx.moveTo(q0.x, q0.y)
          ctx.quadraticCurveTo(q1.x, q1.y, q2.x, q2.y)
          trait(ctx, Math.max(0.4, r * 0.012))
        }
      }
    },
    decor: () => {},
  },
  Mercure: {
    couleur: '#cbbfae',
    visage: { yeux: 'mi-clos', bouche: 'neutre', spirales: false, froncement: 0.3 },
    decor: (ctx, r, h) => {
      for (let k = 0; k < 9; k++) {
        const a = h() * 2 * Math.PI, d = Math.sqrt(h()) * 0.85 * r
        cratere(ctx, Math.cos(a) * d, Math.sin(a) * d, (0.06 + h() * 0.1) * r, Math.max(0.5, r * 0.015))
      }
    },
  },
  Vénus: {
    couleur: '#f0dca0',
    visage: { yeux: 'fermes', bouche: 'sourire', spirales: true, froncement: 0 },
    decor: (ctx, r, h) => {
      // Voiles de nuages en volutes.
      for (let k = 0; k < 6; k++) {
        const y = -0.8 * r + k * 0.32 * r
        ctx.beginPath()
        ctx.moveTo(-r, y)
        ctx.bezierCurveTo(-0.4 * r, y - 0.2 * r, 0.2 * r, y + 0.2 * r, r, y - 0.05 * r)
        trait(ctx, Math.max(0.5, r * 0.014), '#b99a55')
        spirale(ctx, (h() - 0.5) * 1.2 * r, y, 0.08 * r, 1.6)
        trait(ctx, Math.max(0.5, r * 0.012), '#b99a55')
      }
    },
  },
  Terre: {
    couleur: '#8fb6dc',
    visage: { yeux: 'ouverts', bouche: 'sourire', spirales: false, froncement: 0 },
    decor: (ctx, r) => {
      // Continents stylisés (Amériques et Afrique-Europe), aplat vert et contour gravé.
      const continent = (pts: number[][]) => {
        ctx.beginPath()
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)))
        ctx.closePath()
        ctx.fillStyle = '#a9c98a'
        ctx.fill()
        trait(ctx, Math.max(0.5, r * 0.016))
      }
      continent([[-0.75, -0.55], [-0.45, -0.7], [-0.3, -0.5], [-0.45, -0.25], [-0.35, -0.05], [-0.25, 0.25], [-0.35, 0.6], [-0.5, 0.75], [-0.55, 0.45], [-0.7, 0.1], [-0.85, -0.2]])
      continent([[0.35, -0.8], [0.6, -0.65], [0.55, -0.4], [0.7, -0.2], [0.75, 0.15], [0.6, 0.45], [0.45, 0.7], [0.4, 0.4], [0.25, 0.1], [0.3, -0.25], [0.2, -0.5]])
      // Vagues et nuages.
      for (const [x, y] of [[0, -0.75], [-0.05, 0.65], [0.85, -0.5]]) {
        ctx.beginPath()
        ctx.arc(x * r, y * r, 0.08 * r, Math.PI, 2 * Math.PI)
        ctx.arc((x + 0.14) * r, y * r, 0.08 * r, Math.PI, 2 * Math.PI)
        trait(ctx, Math.max(0.5, r * 0.014), '#4f7fae')
      }
    },
  },
  Lune: {
    couleur: '#dcd6ca',
    visage: { yeux: 'mi-clos', bouche: 'moue', spirales: false, froncement: 0 },
    decor: (ctx, r, h) => {
      for (let k = 0; k < 7; k++) {
        const a = h() * 2 * Math.PI, d = (0.55 + h() * 0.35) * r
        cratere(ctx, Math.cos(a) * d, Math.sin(a) * d, (0.05 + h() * 0.08) * r, Math.max(0.5, r * 0.015))
      }
    },
  },
  Mars: {
    couleur: '#e39a7a',
    visage: { yeux: 'ouverts', bouche: 'boudeuse', spirales: false, froncement: 1 },
    decor: (ctx, r, h) => {
      // Calottes polaires et stries de poussière.
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(0, s * 0.9 * r, 0.32 * r, 0.12 * r, 0, 0, 2 * Math.PI)
        ctx.fillStyle = '#faf2e6'
        ctx.fill()
        trait(ctx, Math.max(0.5, r * 0.015))
      }
      for (let k = 0; k < 8; k++) {
        const y = (h() - 0.5) * 1.4 * r, x = (h() - 0.5) * 1.2 * r
        ctx.beginPath()
        ctx.moveTo(x - 0.15 * r, y)
        ctx.quadraticCurveTo(x, y - 0.05 * r, x + 0.18 * r, y + 0.02 * r)
        trait(ctx, Math.max(0.5, r * 0.013), '#a85a40')
      }
    },
  },
  Jupiter: {
    couleur: '#e9c39a',
    visage: { yeux: 'ouverts', bouche: 'sourire', spirales: false, froncement: 0 },
    decor: (ctx, r, h) => {
      for (const [y0, l, c] of [[-0.62, 0.12, '#d79c6c'], [-0.18, 0.1, '#d79c6c'], [0.52, 0.11, '#c98a5c']] as const) {
        ctx.fillStyle = c
        ctx.globalAlpha = 0.6
        ctx.fillRect(-r, y0 * r, 2 * r, l * r)
        ctx.globalAlpha = 1
      }
      bandes(ctx, r, h, 9, 0.025, Math.max(0.5, r * 0.012))
      // La Grande Tache rouge : une joue en spirale.
      ctx.beginPath()
      ctx.ellipse(0.42 * r, 0.22 * r, 0.16 * r, 0.1 * r, 0, 0, 2 * Math.PI)
      ctx.fillStyle = '#d9684e'
      ctx.fill()
      trait(ctx, Math.max(0.5, r * 0.016))
      spirale(ctx, 0.42 * r, 0.22 * r, 0.09 * r, 2.2)
      trait(ctx, Math.max(0.5, r * 0.012))
    },
  },
  Saturne: {
    couleur: '#f0d79c',
    visage: { yeux: 'mi-clos', bouche: 'sourire', spirales: true, froncement: 0 },
    decor: (ctx, r, h) => bandes(ctx, r, h, 8, 0.015, Math.max(0.5, r * 0.011)),
    arriere: (ctx, r) => anneaux(ctx, r, false),
    avant: (ctx, r) => anneaux(ctx, r, true),
    inclinaison: -0.35,
  },
  Uranus: {
    couleur: '#b7e1e4',
    visage: { yeux: 'fermes', bouche: 'neutre', spirales: false, froncement: 0 },
    decor: (ctx, r, h) => bandes(ctx, r, h, 5, 0.01, Math.max(0.5, r * 0.01)),
    // Anneaux fins et sombres, sans aplat.
    arriere: (ctx, r) => anneaux(ctx, r, false, 0.22, 2, 1.6, false),
    avant: (ctx, r) => anneaux(ctx, r, true, 0.22, 2, 1.6, false),
    inclinaison: 1.45,
  },
  Neptune: {
    couleur: '#8fa6e0',
    visage: { yeux: 'ouverts', bouche: 'moue', spirales: false, froncement: 0.6 },
    decor: (ctx, r, h) => {
      // Vagues et la Grande Tache sombre.
      for (let k = 0; k < 5; k++) {
        const y = -0.7 * r + k * 0.35 * r
        ctx.beginPath()
        for (let i = 0; i <= 20; i++) {
          const x = -r + (2 * r * i) / 20
          const yy = y + Math.sin(i * 1.1 + k) * 0.04 * r
          if (i === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        trait(ctx, Math.max(0.5, r * 0.012), '#5268a8')
      }
      ctx.beginPath()
      ctx.ellipse(-0.45 * r, 0.42 * r, 0.14 * r, 0.08 * r, -0.3, 0, 2 * Math.PI)
      ctx.fillStyle = '#5268a8'
      ctx.fill()
      trait(ctx, Math.max(0.5, r * 0.014))
      void h
    },
  },
  Pluton: {
    couleur: '#e3c6ad',
    visage: { yeux: 'ouverts', bouche: 'neutre', spirales: false, froncement: 0 },
    decor: (ctx, r) => {
      // Le cœur (Tombaugh Regio).
      ctx.beginPath()
      const x = 0.3 * r, y = 0.35 * r, s = 0.22 * r
      ctx.moveTo(x, y + s * 0.9)
      ctx.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.5, y - s * 1.1, x, y - s * 0.4)
      ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s * 1.4, y - s * 0.2, x, y + s * 0.9)
      ctx.fillStyle = '#faf2e6'
      ctx.fill()
      trait(ctx, Math.max(0.5, r * 0.015))
    },
  },
}

/** Anneaux (Saturne, Uranus) : ellipses fines ; la moitié arrière avant le disque, la moitié avant après. */
function anneaux(ctx: CanvasRenderingContext2D, r: number, avant: boolean, aplatissement = 0.32, nombre = 7,
  exterieur = 2.2, aplat = true): void {
  const debut = avant ? 0 : Math.PI, fin = avant ? Math.PI : 2 * Math.PI
  if (aplat) {
    ctx.beginPath()
    ctx.ellipse(0, 0, exterieur * r, exterieur * r * aplatissement, 0, debut, fin)
    ctx.ellipse(0, 0, 1.35 * r, 1.35 * r * aplatissement, 0, fin, debut, true)
    ctx.closePath()
    ctx.fillStyle = '#efe0b8'
    ctx.globalAlpha = 0.85
    ctx.fill()
    ctx.globalAlpha = 1
  }
  for (let k = 0; k < nombre; k++) {
    const rr = r * (1.35 + ((exterieur - 1.35) * k) / (nombre - 1))
    ctx.beginPath()
    ctx.ellipse(0, 0, rr, rr * aplatissement, 0, debut, fin)
    trait(ctx, Math.max(0.4, r * (k === 0 || k === nombre - 1 ? 0.02 : 0.009)))
  }
}

/** Un astre a-t-il son illustration ? (sinon : la Lune pour les lunes connues, rien pour les autres) */
export function aUneIllustration(nom: string): boolean {
  return nom in FICHES
}

/**
 * Dessine l'astre illustré centré en (x, y), disque de rayon r (pixels). versSoleil : direction du Soleil à l'écran
 * (radians), pour la face de nuit ; null pour le Soleil.
 */
export function dessinerAstreIllustre(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number,
  versSoleil: number | null): void {
  const f = FICHES[nom]
  if (!f) return
  const h = hasard(graineDe(nom))
  ctx.save()
  ctx.translate(x, y)
  if (f.inclinaison) ctx.rotate(f.inclinaison)
  f.arriere?.(ctx, r, h)
  // Disque, décor et visage, clipés au disque.
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  ctx.fillStyle = f.couleur
  ctx.fill()
  ctx.save()
  ctx.clip()
  f.decor(ctx, r, h)
  if (r >= RAYON_VISAGE) visage(ctx, r, f.visage)
  // Face de nuit : aplat violet en « multiplier » (les traits restent visibles), hachures le long du terminateur.
  if (versSoleil !== null) {
    const a = versSoleil - (f.inclinaison ?? 0)
    ctx.rotate(a)
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = OMBRE
    ctx.globalAlpha = 0.45
    ctx.fillRect(-2 * r, -2 * r, 2 * r - 0.15 * r, 4 * r)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath()
    ctx.rect(-0.45 * r, -2 * r, 0.42 * r, 4 * r)
    ctx.clip()
    for (let k = 0; k < 30; k++) {
      const xh = -1.2 * r + k * 0.06 * r
      ctx.beginPath()
      ctx.moveTo(xh, -r)
      ctx.lineTo(xh + 0.6 * r, r)
      trait(ctx, Math.max(0.4, r * 0.01))
    }
  }
  ctx.restore()
  // Contour d'encre, un peu plus épais.
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  trait(ctx, Math.max(0.8, r * 0.035))
  f.avant?.(ctx, r, h)
  ctx.restore()
}
