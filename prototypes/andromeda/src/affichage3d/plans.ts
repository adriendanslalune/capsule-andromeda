// Plans des engins (ISS, Hubble, Webb…), vus de dessus, en unités d'envergure (1 = la taille réelle de l'engin).
// La vue 3D leur donne de l'épaisseur (modeles.ts).

export type Primitive =
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
export const SONDE: Primitive[] = [
  ['panneau', -0.33, 0, 0.32, 0.18], ['panneau', 0.33, 0, 0.32, 0.18], ['rect', 0, 0, 0.22, 0.22], ['disque', 0, 0, 0.17],
]

export const SILHOUETTES: Record<string, Primitive[]> = {
  iss: ISS, hubble: HUBBLE, tiangong: TIANGONG, webb: WEBB, juno: JUNO, voyager: VOYAGER, pioneer: PIONEER,
  'new-horizons': NEW_HORIZONS, parker: PARKER, roadster: ROADSTER,
}

/** Petit nombre pseudo-aléatoire stable tiré d'un nom (orientation, forme des cailloux). */
export function graineDe(nom: string): number {
  let h = 2166136261
  for (let i = 0; i < nom.length; i++) h = Math.imul(h ^ nom.charCodeAt(i), 16777619)
  return (h >>> 0) / 2 ** 32
}
