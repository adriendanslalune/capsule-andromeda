// Le niveau du capitaine (décisions d'Adrien du 21/10/2026) : de l'XP au niveau (jusqu'à 100), la jauge du niveau en
// cours, et la forme de la capsule sur la carte (par paliers, un peu plus grosse à l'intérieur de chaque palier).

import { NIVEAU_MAX, PALIERS, xpPourPasser, type Forme } from '../donnees/niveaux'

/** XP totale pour atteindre le niveau n (0 pour le niveau 1). */
export function xpPourNiveau(n: number): number {
  let total = 0
  for (let k = 1; k < Math.min(n, NIVEAU_MAX); k++) total += xpPourPasser(k)
  return total
}

/** Le niveau atteint avec cette XP, et la jauge du niveau en cours (XP gagnée dans ce niveau, XP qu'il demande). */
export function niveauDe(xp: number): { niveau: number; dans: number; besoin: number } {
  let n = 1, reste = Math.max(0, xp)
  while (n < NIVEAU_MAX && reste >= xpPourPasser(n)) { reste -= xpPourPasser(n); n++ }
  return { niveau: n, dans: n < NIVEAU_MAX ? reste : 0, besoin: n < NIVEAU_MAX ? xpPourPasser(n) : 0 }
}

/**
 * Le palier d'un niveau : sa forme, son nom, et sa taille sur la carte. Elle grandit avec le niveau (Adrien, 24/10/2026,
 * qui remplace « de 1 à 1,25 fois la capsule au plus » : une capsule de niveau 3 est visiblement plus petite qu'une de
 * niveau 10, et le niveau 100 est très grand ; puis plus encore, Adrien : « un jeune joueur doit se dire : waw, moi aussi je
 * veux un gros vaisseau comme lui ! ») : de 1 au niveau 1 à 5 au niveau 100, vite au début, puis plus doucement.
 */
export function palierDe(niveau: number): { forme: Forme; nom: string; taille: number } {
  let i = 0
  while (i + 1 < PALIERS.length && niveau >= PALIERS[i + 1].des) i++
  const p = PALIERS[i], n = Math.min(NIVEAU_MAX, Math.max(1, niveau))
  return { forme: p.forme, nom: p.nom, taille: 1 + 4 * ((n - 1) / (NIVEAU_MAX - 1)) ** 0.6 }
}

/** Le niveau d'un PNJ (un bot), tiré une fois pour toutes de son pseudo : il grandit, lui aussi. */
export function niveauDuBot(pseudo: string): number {
  let h = 2166136261
  for (const c of pseudo) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const x = (h >>> 0) / 4294967296
  return 3 + Math.round(x * x * 85)
}

/** Ce que dit la fenêtre d'un niveau gagné : la forme de la capsule (nouvelle ou non), et le prochain palier. */
export function niveauGagne(niveau: number, avant: number): { forme: Forme; nomForme: string; nouvelleForme: boolean; prochain: { niveau: number; nom: string } | null } {
  const p = palierDe(niveau), suivant = PALIERS.find((x) => x.des > niveau)
  return { forme: p.forme, nomForme: p.nom, nouvelleForme: palierDe(avant).forme !== p.forme, prochain: suivant ? { niveau: suivant.des, nom: suivant.nom } : null }
}
