// Astres illustrés (idée d'Adrien du 17/10/2026, d'après une gravure de soleil) : chaque astre est dessiné au trait
// fin brun-violet sur des aplats pastel, style Moebius, avec les détails qui le font reconnaître (sans visage, à la
// demande d'Adrien) : flammes et rayons du Soleil, mers et cratère Tycho de la Lune, continents et nuages de la Terre,
// volcans et canyon de Mars, bandes et Grande Tache rouge de Jupiter, anneaux et hexagone de Saturne…
// Dessiné en coordonnées locales : centre (0, 0), rayon du disque r (pixels). Sous une certaine taille, la carte garde
// le simple disque.

export const ENCRE = '#2b2138'
const OMBRE = '#54437a'

/** Taille à partir de laquelle on dessine l'illustration (rayon en pixels). */
export const RAYON_ILLUSTRATION = 11

type Point = [number, number]

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

interface Fiche {
  couleur: string
  decor: (ctx: CanvasRenderingContext2D, r: number, h: () => number) => void
  /** Décor dessiné derrière le disque (rayons du Soleil, arrière des anneaux). */
  arriere?: (ctx: CanvasRenderingContext2D, r: number, h: () => number) => void
  /** Décor dessiné devant le disque (avant des anneaux). */
  avant?: (ctx: CanvasRenderingContext2D, r: number, h: () => number) => void
  /** Inclinaison de l'astre (radians) : Saturne penchée, Uranus couchée. */
  inclinaison?: number
}

// --- Petits outils de trait.

/** Épaisseur de trait proportionnée au rayon (k pour mille du rayon), jamais sous 0,4 px. */
const ep = (r: number, k: number) => Math.max(0.4, (r * k) / 1000)

function trait(ctx: CanvasRenderingContext2D, largeur: number, couleur = ENCRE): void {
  ctx.lineWidth = largeur
  ctx.strokeStyle = couleur
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

/** Forme fermée et douce passant près des points (unités du rayon). */
function forme(ctx: CanvasRenderingContext2D, r: number, pts: Point[]): void {
  ctx.beginPath()
  const n = pts.length
  const milieu = (i: number): Point => {
    const a = pts[i % n], b = pts[(i + 1) % n]
    return [((a[0] + b[0]) / 2) * r, ((a[1] + b[1]) / 2) * r]
  }
  const m0 = milieu(n - 1)
  ctx.moveTo(m0[0], m0[1])
  for (let i = 0; i < n; i++) {
    const m = milieu(i)
    ctx.quadraticCurveTo(pts[i][0] * r, pts[i][1] * r, m[0], m[1])
  }
  ctx.closePath()
}

/** Remplit et cerne la forme courante. */
function aplat(ctx: CanvasRenderingContext2D, couleur: string, largeur: number, alpha = 1): void {
  ctx.fillStyle = couleur
  ctx.globalAlpha = alpha
  ctx.fill()
  ctx.globalAlpha = 1
  if (largeur > 0) trait(ctx, largeur)
}

function spirale(ctx: CanvasRenderingContext2D, cx: number, cy: number, rayon: number, tours: number): void {
  ctx.beginPath()
  const n = 60
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const a = u * tours * 2 * Math.PI
    const x = cx + Math.cos(a) * rayon * u, y = cy + Math.sin(a) * rayon * u
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

/** Cratère gravé : un cercle, un arc d'ombre intérieur, et éventuellement un pic central. */
function cratere(ctx: CanvasRenderingContext2D, x: number, y: number, rc: number, lw: number, pic = false): void {
  ctx.beginPath()
  ctx.arc(x, y, rc, 0, 2 * Math.PI)
  trait(ctx, lw)
  ctx.beginPath()
  ctx.arc(x + rc * 0.15, y + rc * 0.15, rc * 0.72, Math.PI * 0.85, Math.PI * 1.65)
  trait(ctx, lw * 0.8)
  if (pic) {
    ctx.beginPath()
    ctx.arc(x, y, rc * 0.15, 0, 2 * Math.PI)
    trait(ctx, lw * 0.8)
  }
}

/** Rayons clairs d'un cratère jeune (Tycho, Hokusai). */
function rayonsDeCratere(ctx: CanvasRenderingContext2D, x: number, y: number, rc: number, longueur: number, n: number,
  h: () => number, couleur: string, lw: number): void {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 2 * Math.PI + h() * 0.3
    const l = longueur * (0.5 + h() * 0.7)
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * rc, y + Math.sin(a) * rc)
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    trait(ctx, lw, couleur)
  }
}

/** Ligne ondulée horizontale à la hauteur y (pour les bandes des géantes). */
function onde(ctx: CanvasRenderingContext2D, r: number, y: number, amplitude: number, frequence: number, phase: number): void {
  ctx.beginPath()
  for (let k = 0; k <= 32; k++) {
    const x = -r + (2 * r * k) / 32
    const yy = y + Math.sin(k * frequence + phase) * amplitude
    if (k === 0) ctx.moveTo(x, yy)
    else ctx.lineTo(x, yy)
  }
}

/** Bande horizontale de couleur entre y0 et y1 (unités du rayon), bords légèrement ondulés. */
function bande(ctx: CanvasRenderingContext2D, r: number, y0: number, y1: number, couleur: string, phase: number, lw: number): void {
  ctx.beginPath()
  for (let k = 0; k <= 32; k++) {
    const x = -r + (2 * r * k) / 32
    const y = y0 * r + Math.sin(k * 0.8 + phase) * 0.015 * r
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  for (let k = 32; k >= 0; k--) {
    const x = -r + (2 * r * k) / 32
    ctx.lineTo(x, y1 * r + Math.sin(k * 0.8 + phase + 1.3) * 0.015 * r)
  }
  ctx.closePath()
  ctx.fillStyle = couleur
  ctx.fill()
  onde(ctx, r, y0 * r, 0.015 * r, 0.8, phase)
  trait(ctx, lw)
  onde(ctx, r, y1 * r, 0.015 * r, 0.8, phase + 1.3)
  trait(ctx, lw)
}

/** Anneaux : la moitié arrière avant le disque, la moitié avant après. Division de Cassini en option. */
function anneaux(ctx: CanvasRenderingContext2D, r: number, devant: boolean, o: { aplatissement: number; interieur: number;
  exterieur: number; lignes: number; couleurs?: [string, string, string]; cassini?: number }): void {
  const debut = devant ? 0 : Math.PI, fin = devant ? Math.PI : 2 * Math.PI
  const anneau = (r0: number, r1: number, couleur: string) => {
    ctx.beginPath()
    ctx.ellipse(0, 0, r1 * r, r1 * r * o.aplatissement, 0, debut, fin)
    ctx.ellipse(0, 0, r0 * r, r0 * r * o.aplatissement, 0, fin, debut, true)
    ctx.closePath()
    ctx.fillStyle = couleur
    ctx.fill()
  }
  if (o.couleurs) {
    // Anneau C (pâle, intérieur), B (brillant), division de Cassini (vide), A (extérieur).
    const c = o.cassini ?? (o.interieur + o.exterieur) / 2
    const b0 = o.interieur + (c - o.interieur) * 0.3
    anneau(o.interieur, b0, o.couleurs[0])
    anneau(b0, c - 0.04, o.couleurs[1])
    anneau(c + 0.05, o.exterieur, o.couleurs[2])
  }
  for (let k = 0; k < o.lignes; k++) {
    const rr = r * (o.interieur + ((o.exterieur - o.interieur) * k) / (o.lignes - 1))
    ctx.beginPath()
    ctx.ellipse(0, 0, rr, rr * o.aplatissement, 0, debut, fin)
    trait(ctx, ep(r, k === 0 || k === o.lignes - 1 ? 18 : 7))
  }
  if (o.cassini) {
    for (const d of [-0.04, 0.05]) {
      ctx.beginPath()
      ctx.ellipse(0, 0, (o.cassini + d) * r, (o.cassini + d) * r * o.aplatissement, 0, debut, fin)
      trait(ctx, ep(r, 14))
    }
  }
}

// --- Les astres.

const FICHES: Record<string, Fiche> = {
  Soleil: {
    couleur: '#f6cf6b',
    arriere: (ctx, r, h) => {
      // Rayons rectilignes, longs et courts en alternance.
      for (let k = 0; k < 72; k++) {
        const a = (k / 72) * 2 * Math.PI + (h() - 0.5) * 0.02
        const long = k % 2 ? 2.15 : 2.6 + h() * 0.25
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25)
        ctx.lineTo(Math.cos(a) * r * long, Math.sin(a) * r * long)
        trait(ctx, ep(r, k % 2 ? 12 : 20))
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
        aplat(ctx, k % 2 ? '#f9dc8c' : '#f4b860', ep(r, 22))
        for (const f of [-0.35, 0.1]) {
          const q0 = pt(a + largeur * f, 1.05), q1 = pt(a + largeur * (f + 0.1), long * 0.62), q2 = pt(pointe - 0.06, long * 0.82)
          ctx.beginPath()
          ctx.moveTo(q0.x, q0.y)
          ctx.quadraticCurveTo(q1.x, q1.y, q2.x, q2.y)
          trait(ctx, ep(r, 12))
        }
      }
    },
    decor: (ctx, r, h) => {
      // Granulation (petits pointillés), deux groupes de taches solaires, et des facules en arcs.
      ctx.fillStyle = '#e0a84a'
      for (let k = 0; k < 140; k++) {
        const a = h() * 2 * Math.PI, d = Math.sqrt(h()) * r
        ctx.beginPath()
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, ep(r, 10), 0, 2 * Math.PI)
        ctx.fill()
      }
      for (const [x, y, t] of [[-0.35, -0.25, 0.11], [-0.22, -0.3, 0.06], [0.3, 0.32, 0.09], [0.42, 0.27, 0.05]]) {
        ctx.beginPath()
        ctx.ellipse(x * r, y * r, t * r * 1.5, t * r, 0.3, 0, 2 * Math.PI)
        aplat(ctx, '#d48a3c', ep(r, 14))
        ctx.beginPath()
        ctx.ellipse(x * r, y * r, t * r * 0.7, t * r * 0.45, 0.3, 0, 2 * Math.PI)
        aplat(ctx, '#8a4f3a', 0)
      }
      for (let k = 0; k < 4; k++) {
        const y = (-0.6 + k * 0.4) * r
        ctx.beginPath()
        ctx.arc(0, y, 0.7 * r, Math.PI * 1.15, Math.PI * 1.35)
        trait(ctx, ep(r, 10), '#c98e3e')
      }
    },
  },
  Mercure: {
    couleur: '#c9bba6',
    decor: (ctx, r, h) => {
      // Terrains plus sombres, bassin Caloris (grand anneau et fractures), cratères serrés, cratère jeune à rayons.
      forme(ctx, r, [[-0.9, 0.1], [-0.5, -0.2], [-0.2, 0.1], [-0.4, 0.5], [-0.8, 0.6]])
      aplat(ctx, '#a99a86', 0, 0.7)
      forme(ctx, r, [[0.3, -0.9], [0.8, -0.5], [0.6, -0.1], [0.2, -0.4]])
      aplat(ctx, '#a99a86', 0, 0.7)
      const cx = 0.38 * r, cy = 0.35 * r
      for (const k of [0.32, 0.25]) {
        ctx.beginPath()
        ctx.arc(cx, cy, k * r, 0, 2 * Math.PI)
        trait(ctx, ep(r, 16))
      }
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * 2 * Math.PI
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * 0.05 * r, cy + Math.sin(a) * 0.05 * r)
        ctx.lineTo(cx + Math.cos(a) * 0.22 * r, cy + Math.sin(a) * 0.22 * r)
        trait(ctx, ep(r, 8))
      }
      for (let k = 0; k < 26; k++) {
        const a = h() * 2 * Math.PI, d = Math.sqrt(h()) * 0.92 * r
        const x = Math.cos(a) * d, y = Math.sin(a) * d
        if (Math.hypot(x - cx, y - cy) < 0.36 * r) continue
        cratere(ctx, x, y, (0.03 + h() ** 2 * 0.12) * r, ep(r, 13), h() > 0.7)
      }
      rayonsDeCratere(ctx, -0.45 * r, -0.45 * r, 0.05 * r, 0.45 * r, 14, h, '#f4ede0', ep(r, 12))
      ctx.beginPath()
      ctx.arc(-0.45 * r, -0.45 * r, 0.05 * r, 0, 2 * Math.PI)
      aplat(ctx, '#f8f2e6', ep(r, 12))
      // Un escarpement (falaise) en arc.
      ctx.beginPath()
      ctx.moveTo(-0.7 * r, -0.05 * r)
      ctx.bezierCurveTo(-0.4 * r, 0.05 * r, -0.2 * r, -0.15 * r, 0.05 * r, -0.05 * r)
      trait(ctx, ep(r, 14))
    },
  },
  Vénus: {
    couleur: '#f1dfa6',
    decor: (ctx, r) => {
      // Le grand « Y » sombre des nuages, couché, et des voiles en chevrons qui convergent vers les pôles.
      forme(ctx, r, [[1, -0.08], [0.2, -0.05], [-0.5, -0.45], [-0.75, -0.42], [-0.1, 0.02], [-0.75, 0.42], [-0.5, 0.45], [0.2, 0.05], [1, 0.08]])
      aplat(ctx, '#d9bd78', ep(r, 12))
      for (let k = 1; k <= 5; k++) {
        const e = k * 0.15
        for (const s of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(1.05 * r, s * (0.12 + e) * r)
          ctx.quadraticCurveTo(0.1 * r, s * (0.12 + e * 0.9) * r, -0.9 * r, s * (0.05 + e * 1.15) * r)
          trait(ctx, ep(r, 11), '#b8995a')
        }
      }
      for (const s of [-1, 1]) {
        spirale(ctx, 0.15 * r, s * 0.82 * r, 0.12 * r, 2.2)
        trait(ctx, ep(r, 11), '#b8995a')
      }
    },
  },
  Terre: {
    couleur: '#8db6dc',
    decor: (ctx, r) => {
      // Océan : fines lignes de houle.
      for (let k = 0; k < 9; k++) {
        onde(ctx, r, (-0.85 + k * 0.21) * r, 0.012 * r, 1.4, k)
        trait(ctx, ep(r, 7), '#6f9cc8')
      }
      // Continents (vue sur l'Atlantique) : Amériques, Groenland, Europe, Afrique.
      const terres: Point[][] = [
        [[-0.78, -0.62], [-0.62, -0.78], [-0.38, -0.78], [-0.22, -0.66], [-0.3, -0.52], [-0.42, -0.44], [-0.4, -0.3], [-0.52, -0.22], [-0.5, -0.1], [-0.4, -0.02], [-0.46, 0.02], [-0.6, -0.1], [-0.72, -0.3], [-0.86, -0.42]],
        [[-0.18, -0.86], [-0.02, -0.9], [0.02, -0.76], [-0.12, -0.66], [-0.2, -0.74]],
        [[-0.4, 0.02], [-0.24, 0.06], [-0.1, 0.18], [-0.12, 0.32], [-0.24, 0.48], [-0.32, 0.66], [-0.4, 0.78], [-0.42, 0.6], [-0.46, 0.36], [-0.52, 0.18]],
        [[0.22, -0.62], [0.38, -0.7], [0.52, -0.62], [0.5, -0.48], [0.4, -0.4], [0.28, -0.38], [0.2, -0.46]],
        [[0.18, -0.32], [0.4, -0.34], [0.58, -0.24], [0.7, -0.1], [0.62, 0.12], [0.56, 0.36], [0.46, 0.58], [0.36, 0.6], [0.32, 0.38], [0.3, 0.14], [0.16, 0.02], [0.1, -0.14]],
      ]
      for (const t of terres) {
        forme(ctx, r, t)
        aplat(ctx, '#a8c98a', ep(r, 15))
      }
      // Désert (Sahara) et forêt (Amazonie) en aplats plus soutenus.
      forme(ctx, r, [[0.2, -0.28], [0.55, -0.22], [0.6, -0.06], [0.3, -0.04], [0.18, -0.14]])
      aplat(ctx, '#e3cd8e', 0)
      forme(ctx, r, [[-0.38, 0.08], [-0.18, 0.14], [-0.2, 0.3], [-0.38, 0.3]])
      aplat(ctx, '#7fae6c', 0)
      // Rocheuses et Andes : petits chevrons.
      for (const [x0, y0, x1, y1] of [[-0.68, -0.5, -0.55, -0.2], [-0.46, 0.15, -0.38, 0.7]]) {
        for (let k = 0; k <= 5; k++) {
          const x = (x0 + ((x1 - x0) * k) / 5) * r, y = (y0 + ((y1 - y0) * k) / 5) * r
          ctx.beginPath()
          ctx.moveTo(x - 0.03 * r, y + 0.02 * r)
          ctx.lineTo(x, y - 0.02 * r)
          ctx.lineTo(x + 0.03 * r, y + 0.02 * r)
          trait(ctx, ep(r, 9))
        }
      }
      // Calottes polaires.
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(0, s * 0.97 * r, 0.6 * r, 0.16 * r, 0, 0, 2 * Math.PI)
        aplat(ctx, '#f7f4ee', ep(r, 13))
      }
      // Nuages : un cyclone en spirale et des écharpes blanches.
      spirale(ctx, 0.05 * r, -0.2 * r, 0.14 * r, 2.4)
      trait(ctx, ep(r, 30), '#f7f4ee')
      spirale(ctx, 0.05 * r, -0.2 * r, 0.14 * r, 2.4)
      trait(ctx, ep(r, 8))
      for (const [x, y, l] of [[-0.1, 0.55, 0.35], [0.45, 0.7, 0.3], [-0.65, -0.05, 0.25], [0.6, -0.5, 0.25]]) {
        ctx.beginPath()
        ctx.moveTo(x * r, y * r)
        ctx.quadraticCurveTo((x + l / 2) * r, (y - 0.06) * r, (x + l) * r, (y + 0.01) * r)
        trait(ctx, ep(r, 34), '#f7f4ee')
        trait(ctx, ep(r, 7), '#9aa7b8')
      }
    },
  },
  Lune: {
    couleur: '#dcd6ca',
    decor: (ctx, r, h) => {
      // Les mers (face visible) en aplats gris, puis les cratères, Copernic, et Tycho avec ses grands rayons.
      const mers: Point[][] = [
        [[-0.75, -0.25], [-0.55, -0.5], [-0.3, -0.62], [-0.08, -0.5], [-0.1, -0.25], [-0.3, -0.12], [-0.55, 0.15], [-0.78, 0.25]],
        [[-0.85, 0.05], [-0.7, 0.4], [-0.5, 0.55], [-0.45, 0.25], [-0.6, 0.05]],
        [[0.02, -0.45], [0.25, -0.5], [0.3, -0.3], [0.1, -0.22]],
        [[0.08, -0.18], [0.38, -0.2], [0.45, 0.05], [0.2, 0.12], [0.05, 0.02]],
        [[0.55, -0.35], [0.72, -0.32], [0.72, -0.18], [0.56, -0.18]],
        [[0.42, 0.1], [0.6, 0.12], [0.58, 0.35], [0.42, 0.3]],
        [[-0.32, 0.25], [-0.08, 0.28], [-0.1, 0.45], [-0.3, 0.45]],
      ]
      for (const m of mers) {
        forme(ctx, r, m)
        aplat(ctx, '#a9a49b', ep(r, 11), 0.85)
      }
      for (let k = 0; k < 16; k++) {
        const a = h() * 2 * Math.PI, d = Math.sqrt(h()) * 0.92 * r
        cratere(ctx, Math.cos(a) * d, Math.sin(a) * d, (0.025 + h() ** 2 * 0.07) * r, ep(r, 12), h() > 0.6)
      }
      cratere(ctx, -0.32 * r, -0.05 * r, 0.07 * r, ep(r, 14), true)
      rayonsDeCratere(ctx, -0.12 * r, 0.7 * r, 0.06 * r, 0.9 * r, 16, h, '#f6f2ea', ep(r, 14))
      ctx.beginPath()
      ctx.arc(-0.12 * r, 0.7 * r, 0.06 * r, 0, 2 * Math.PI)
      aplat(ctx, '#f6f2ea', ep(r, 14))
    },
  },
  Mars: {
    couleur: '#e3987a',
    decor: (ctx, r, h) => {
      // Terres sombres (Syrtis Major, Mare Acidalium, Mare Erythraeum), canyon de Valles Marineris, volcans de
      // Tharsis et Olympus Mons, calottes polaires.
      for (const m of [
        [[0.3, -0.35], [0.55, -0.15], [0.5, 0.2], [0.35, 0.35], [0.25, 0.05]],
        [[-0.2, -0.75], [0.25, -0.7], [0.1, -0.5], [-0.25, -0.55]],
        [[-0.6, 0.45], [0.1, 0.5], [0.4, 0.6], [-0.2, 0.72], [-0.7, 0.62]],
      ] as Point[][]) {
        forme(ctx, r, m)
        aplat(ctx, '#b86e55', ep(r, 11), 0.8)
      }
      ctx.beginPath()
      ctx.moveTo(-0.55 * r, 0.02 * r)
      ctx.bezierCurveTo(-0.3 * r, 0.06 * r, -0.05 * r, -0.02 * r, 0.22 * r, 0.08 * r)
      trait(ctx, ep(r, 34), '#8a4636')
      trait(ctx, ep(r, 10))
      for (const x of [-0.4, -0.15, 0.05]) {
        ctx.beginPath()
        ctx.moveTo(x * r, 0.04 * r)
        ctx.lineTo((x + 0.05) * r, 0.14 * r)
        trait(ctx, ep(r, 10))
      }
      for (const [x, y] of [[-0.72, -0.28], [-0.62, -0.16], [-0.52, -0.04]]) {
        ctx.beginPath()
        ctx.arc(x * r, y * r, 0.05 * r, 0, 2 * Math.PI)
        aplat(ctx, '#d48466', ep(r, 12))
        ctx.beginPath()
        ctx.arc(x * r, y * r, 0.015 * r, 0, 2 * Math.PI)
        trait(ctx, ep(r, 10))
      }
      for (const k of [0.13, 0.09, 0.03]) {
        ctx.beginPath()
        ctx.arc(-0.78 * r, -0.5 * r, k * r, 0, 2 * Math.PI)
        if (k === 0.13) aplat(ctx, '#d48466', ep(r, 14))
        else trait(ctx, ep(r, 10))
      }
      for (let k = 0; k < 10; k++) {
        const a = h() * 2 * Math.PI, d = Math.sqrt(h()) * 0.85 * r
        cratere(ctx, Math.cos(a) * d, Math.sin(a) * d, (0.02 + h() * 0.04) * r, ep(r, 10))
      }
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(0.05 * r * s, s * 0.95 * r, 0.38 * r, 0.14 * r, 0.2 * s, 0, 2 * Math.PI)
        aplat(ctx, '#faf2e6', ep(r, 14))
      }
    },
  },
  Jupiter: {
    couleur: '#f1dcbc',
    decor: (ctx, r) => {
      // Zones claires et ceintures brunes, festons bleutés, ovales blancs, et la Grande Tache rouge.
      const lw = ep(r, 10)
      bande(ctx, r, -1, -0.78, '#c9a988', 0.3, lw)
      bande(ctx, r, -0.6, -0.48, '#d9b48e', 1.1, lw)
      bande(ctx, r, -0.3, -0.1, '#c98c62', 2.3, lw)
      bande(ctx, r, 0.12, 0.32, '#c98c62', 0.7, lw)
      bande(ctx, r, 0.5, 0.6, '#d9b48e', 1.9, lw)
      bande(ctx, r, 0.78, 1, '#c9a988', 2.7, lw)
      for (let k = 0; k < 6; k++) {
        const x = (-0.8 + k * 0.32) * r
        ctx.beginPath()
        ctx.moveTo(x, -0.1 * r)
        ctx.quadraticCurveTo(x + 0.08 * r, 0.02 * r, x + 0.2 * r, -0.08 * r)
        trait(ctx, ep(r, 14), '#7f93b0')
      }
      for (const [x, y] of [[-0.5, 0.55], [-0.2, 0.56], [0.65, 0.55]]) {
        ctx.beginPath()
        ctx.ellipse(x * r, y * r, 0.07 * r, 0.035 * r, 0, 0, 2 * Math.PI)
        aplat(ctx, '#fbf6ec', ep(r, 10))
      }
      ctx.beginPath()
      ctx.ellipse(0.3 * r, 0.38 * r, 0.22 * r, 0.12 * r, 0, 0, 2 * Math.PI)
      aplat(ctx, '#f1dcbc', ep(r, 12))
      ctx.beginPath()
      ctx.ellipse(0.3 * r, 0.38 * r, 0.17 * r, 0.09 * r, 0, 0, 2 * Math.PI)
      aplat(ctx, '#d6654a', ep(r, 16))
      ctx.save()
      ctx.translate(0.3 * r, 0.38 * r)
      ctx.scale(1.8, 1)
      spirale(ctx, 0, 0, 0.06 * r, 2)
      ctx.restore()
      trait(ctx, ep(r, 10))
    },
  },
  Saturne: {
    couleur: '#f2dfae',
    inclinaison: -0.4,
    decor: (ctx, r) => {
      const lw = ep(r, 9)
      bande(ctx, r, -1, -0.62, '#d9c18e', 0.4, lw)
      bande(ctx, r, -0.3, -0.18, '#e6cf9c', 1.6, lw)
      bande(ctx, r, 0.15, 0.3, '#dcc38f', 2.2, lw)
      bande(ctx, r, 0.55, 1, '#d2b583', 0.9, lw)
      // L'hexagone du pôle nord.
      ctx.beginPath()
      for (let k = 0; k <= 6; k++) {
        const a = (k / 6) * 2 * Math.PI
        const x = Math.cos(a) * 0.32 * r, y = -0.9 * r + Math.sin(a) * 0.09 * r
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      aplat(ctx, '#c7aa7c', ep(r, 12))
    },
    arriere: (ctx, r) => anneaux(ctx, r, false, { aplatissement: 0.3, interieur: 1.25, exterieur: 2.3, lignes: 8, couleurs: ['#efe6cc', '#e8d3a2', '#efdfb8'], cassini: 1.95 }),
    avant: (ctx, r) => anneaux(ctx, r, true, { aplatissement: 0.3, interieur: 1.25, exterieur: 2.3, lignes: 8, couleurs: ['#efe6cc', '#e8d3a2', '#efdfb8'], cassini: 1.95 }),
  },
  Uranus: {
    couleur: '#bfe5e6',
    inclinaison: 1.45,
    decor: (ctx, r) => {
      // Presque uni : bandes très pâles, et le pôle (tourné vers nous) plus clair, cerclé d'un collier.
      for (const y of [-0.5, -0.15, 0.2]) {
        onde(ctx, r, y * r, 0.008 * r, 0.6, y * 5)
        trait(ctx, ep(r, 8), '#93c7cb')
      }
      ctx.beginPath()
      ctx.ellipse(0, 0.62 * r, 0.62 * r, 0.3 * r, 0, 0, 2 * Math.PI)
      aplat(ctx, '#e3f4f3', ep(r, 11))
      ctx.beginPath()
      ctx.ellipse(0, 0.62 * r, 0.42 * r, 0.18 * r, 0, 0, 2 * Math.PI)
      trait(ctx, ep(r, 8), '#93c7cb')
    },
    // Anneaux fins et sombres, sans aplat.
    arriere: (ctx, r) => anneaux(ctx, r, false, { aplatissement: 0.22, interieur: 1.45, exterieur: 1.65, lignes: 3 }),
    avant: (ctx, r) => anneaux(ctx, r, true, { aplatissement: 0.22, interieur: 1.45, exterieur: 1.65, lignes: 3 }),
  },
  Neptune: {
    couleur: '#7f9be0',
    decor: (ctx, r) => {
      // Bandes plus sombres au sud, la Grande Tache sombre et ses nuages blancs, le « Scooter », des cirrus.
      bande(ctx, r, 0.45, 0.62, '#6680c8', 0.5, ep(r, 9))
      bande(ctx, r, 0.75, 1, '#5d74b8', 1.5, ep(r, 9))
      ctx.beginPath()
      ctx.ellipse(-0.3 * r, 0.2 * r, 0.22 * r, 0.12 * r, -0.15, 0, 2 * Math.PI)
      aplat(ctx, '#3f528f', ep(r, 15))
      for (const [x, y, l] of [[-0.42, 0.04, 0.3], [0.1, -0.45, 0.5], [0.3, -0.3, 0.35], [-0.6, -0.3, 0.3], [0.2, 0.42, 0.25]]) {
        ctx.beginPath()
        ctx.moveTo(x * r, y * r)
        ctx.quadraticCurveTo((x + l / 2) * r, (y - 0.04) * r, (x + l) * r, y * r)
        trait(ctx, ep(r, 30), '#f2f5fb')
        trait(ctx, ep(r, 7))
      }
      ctx.beginPath()
      ctx.ellipse(0.45 * r, 0.12 * r, 0.06 * r, 0.035 * r, 0, 0, 2 * Math.PI)
      aplat(ctx, '#f2f5fb', ep(r, 10))
    },
  },
  Pluton: {
    couleur: '#e5cdb5',
    decor: (ctx, r) => {
      // Cthulhu (bande sombre et rousse au sud-ouest), puis le cœur de Tombaugh : lobe gauche lisse (Spoutnik, en
      // cellules), lobe droit plus pâle.
      forme(ctx, r, [[-1, 0.15], [-0.4, 0.2], [0.0, 0.55], [-0.2, 0.85], [-0.8, 0.7]])
      aplat(ctx, '#8f5a44', ep(r, 12))
      forme(ctx, r, [[0.05, -0.15], [0.35, -0.3], [0.5, 0.0], [0.3, 0.4], [0.15, 0.55], [0.0, 0.2]])
      aplat(ctx, '#fbf4ea', ep(r, 14))
      forme(ctx, r, [[0.35, -0.3], [0.72, -0.35], [0.85, -0.05], [0.65, 0.3], [0.3, 0.4], [0.5, 0.0]])
      aplat(ctx, '#f1e2cf', ep(r, 12))
      for (const [x0, y0, x1, y1] of [[0.12, -0.05, 0.35, 0.05], [0.1, 0.18, 0.32, 0.15], [0.22, -0.18, 0.2, 0.4]]) {
        ctx.beginPath()
        ctx.moveTo(x0 * r, y0 * r)
        ctx.lineTo(x1 * r, y1 * r)
        trait(ctx, ep(r, 8), '#c9b49c')
      }
    },
  },
}

/** Un astre a-t-il son illustration ? */
export function aUneIllustration(nom: string): boolean {
  return nom in FICHES
}

/** Étendue du dessin autour du disque, en rayons (rayons du Soleil, anneaux de Saturne et d'Uranus). */
const ETENDUE: Record<string, number> = { Soleil: 2.7, Saturne: 2.45, Uranus: 1.8 }
/** Les dessins déjà faits (clé : astre, rayon du palier, direction du Soleil arrondie), les plus récents en dernier. */
const DEJA_DESSINES = new Map<string, HTMLCanvasElement>()
/** Pixels gardés au plus (tous dessins confondus, environ 16 Mo) : au-delà, on oublie les plus anciens. Plus, la
 *  mémoire saturait et faisait ramer tout le téléphone d'Adrien (21/10/2026). */
const PIXELS_MAX = 4_000_000
/** Côté maximal (pixels du téléphone) d'un dessin gardé : au-delà, le dernier palier est agrandi (un peu flou). */
const COTE_MAX = 1100

/** Un dessin de l'astre au rayon rp (palier), sur une toile à part. */
function preparer(nom: string, rp: number, angle: number | null, echelle: number, gris = false): HTMLCanvasElement {
  const ext = ETENDUE[nom] ?? 1.08
  const toile = document.createElement('canvas')
  toile.width = toile.height = Math.ceil(2 * rp * ext * echelle)
  const c = toile.getContext('2d')!
  c.scale(echelle, echelle)
  dessinerDirect(c, nom, rp * ext, rp * ext, rp, angle)
  // Un astre pas encore visité (décision d'Adrien du 21/10/2026) : le même dessin, en gris.
  if (gris) {
    const img = c.getImageData(0, 0, toile.width, toile.height), d = img.data
    for (let i = 0; i < d.length; i += 4) { const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = l }
    c.putImageData(img, 0, 0)
  }
  return toile
}

/** Garde un dessin, en oubliant les plus anciens si la mémoire déborde. */
function garder(cle: string, toile: HTMLCanvasElement): void {
  DEJA_DESSINES.set(cle, toile)
  let pixels = 0
  for (const t of DEJA_DESSINES.values()) pixels += t.width * t.height
  for (const [k, t] of DEJA_DESSINES) {
    if (pixels <= PIXELS_MAX || k === cle) break
    pixels -= t.width * t.height
    DEJA_DESSINES.delete(k)
  }
}

/** Finesse du dessin (pixels du téléphone par pixel de l'écran). */
const finesse = (echelleEcran: number) => Math.min(1.5, echelleEcran)
/** Palier du rayon r : la puissance de 2 juste au-dessus (le dessin est réduit), sans dépasser COTE_MAX (au-delà, il
 *  est agrandi). */
function palier(nom: string, r: number, e: number): number {
  const plafond = 2 ** Math.floor(Math.log2(COTE_MAX / (2 * (ETENDUE[nom] ?? 1.08) * e)))
  return Math.min(plafond, 2 ** Math.ceil(Math.log2(Math.max(16, r))))
}

/** Prépare, quand le téléphone n'a rien à faire, les paliers voisins (le zoom y passera sans à-coup). */
const enAttente = new Set<string>()
function preparerVoisins(nom: string, rp: number, angle: number | null, e: number, gris: boolean): void {
  for (const v of [palier(nom, rp * 2, e), rp / 2]) {
    const cle = `${nom}|${v}|${angle}|${gris}`
    if (v === rp || v < 16 || DEJA_DESSINES.has(cle) || enAttente.has(cle)) continue
    enAttente.add(cle)
    const faire = () => { enAttente.delete(cle); if (!DEJA_DESSINES.has(cle)) garder(cle, preparer(nom, v, angle, e, gris)) }
    if ('requestIdleCallback' in window) requestIdleCallback(faire, { timeout: 1500 })
    else setTimeout(faire, 200)
  }
}

/**
 * Dessine l'astre illustré centré en (x, y), disque de rayon r (pixels). versSoleil : direction du Soleil à l'écran
 * (radians), pour la face de nuit ; null pour le Soleil. gris : un astre pas encore visité.
 * Le dessin est fait une fois par palier de taille (×2), puis seulement réduit : redessiner la Terre à chaque image,
 * puis à chaque cran du zoom, faisait ramer le téléphone d'Adrien (21/10/2026). Les paliers voisins se préparent
 * quand le téléphone n'a rien d'autre à faire.
 */
export function dessinerAstreIllustre(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number,
  versSoleil: number | null, gris = false): void {
  if (!FICHES[nom]) return
  const e = finesse(ctx.getTransform().a || 1)
  const rp = palier(nom, r, e)
  const angle = versSoleil === null ? null : Math.round(versSoleil * 90 / Math.PI) * Math.PI / 90
  const cle = `${nom}|${rp}|${angle}|${gris}`
  let toile = DEJA_DESSINES.get(cle)
  if (toile) DEJA_DESSINES.delete(cle)
  else toile = preparer(nom, rp, angle, e, gris)
  garder(cle, toile)
  preparerVoisins(nom, rp, angle, e, gris)
  const ext = ETENDUE[nom] ?? 1.08
  ctx.drawImage(toile, x - r * ext, y - r * ext, 2 * r * ext, 2 * r * ext)
}

function dessinerDirect(ctx: CanvasRenderingContext2D, nom: string, x: number, y: number, r: number,
  versSoleil: number | null): void {
  const f = FICHES[nom]
  if (!f) return
  const h = hasard(graineDe(nom))
  ctx.save()
  ctx.translate(x, y)
  if (f.inclinaison) ctx.rotate(f.inclinaison)
  f.arriere?.(ctx, r, h)
  // Disque et décor, clipés au disque.
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  ctx.fillStyle = f.couleur
  ctx.fill()
  ctx.save()
  ctx.clip()
  f.decor(ctx, r, h)
  // Face de nuit : aplat violet en « multiplier » (les traits restent visibles), hachures le long du terminateur.
  if (versSoleil !== null) {
    ctx.rotate(versSoleil - (f.inclinaison ?? 0))
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = OMBRE
    ctx.globalAlpha = 0.45
    // Un croissant d'ombre (et non la moitié du disque) : les détails de l'astre restent lisibles.
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.01, Math.PI / 2, (3 * Math.PI) / 2)
    ctx.ellipse(0, 0, r * 0.45, r * 1.01, 0, (3 * Math.PI) / 2, Math.PI / 2, true)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    // Hachures le long du terminateur (une bande en demi-ellipse).
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.62, r * 1.01, 0, Math.PI / 2, (3 * Math.PI) / 2)
    ctx.ellipse(0, 0, r * 0.3, r * 1.01, 0, (3 * Math.PI) / 2, Math.PI / 2, true)
    ctx.clip()
    for (let k = 0; k < 30; k++) {
      const xh = -1.2 * r + k * 0.06 * r
      ctx.beginPath()
      ctx.moveTo(xh, -r)
      ctx.lineTo(xh + 0.6 * r, r)
      trait(ctx, ep(r, 10))
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
