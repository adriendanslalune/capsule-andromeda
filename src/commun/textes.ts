// Textes de l'interface : durées, dates (à l'heure du lieu du joueur, fuseau du téléphone), « autour de… ».

import { corps } from '../moteur/corps'

/** Durée lisible : « 3 h 20 min », « 12 j 4 h », « 2 ans 3 mois ». */
export function texteDuree(ms: number): string {
  const min = ms / 60_000, h = min / 60, j = h / 24
  if (h < 1) return `${Math.max(1, Math.round(min))} min`
  if (j < 2) return `${Math.floor(h)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`
  if (j < 365) return `${Math.floor(j)} j ${Math.round(h % 24)} h`
  const ans = Math.floor(j / 365.25), mois = Math.round((j % 365.25) / 30.44)
  return `${ans} an${ans > 1 ? 's' : ''}${mois ? ` ${mois} mois` : ''}`
}

/** Temps restant, à la seconde (demande d'Adrien du 17/10/2026) : « 45 s », « 6 min 32 s », « 2 h 05 min 09 s »,
 *  « 96 j 19 h 05 min 09 s ». */
export function texteRestant(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const j = Math.floor(total / 86_400), h = Math.floor((total % 86_400) / 3600), min = Math.floor((total % 3600) / 60), s = total % 60
  const deux = (n: number) => String(n).padStart(2, '0')
  if (j > 0) return `${j} j ${deux(h)} h ${deux(min)} min ${deux(s)} s`
  if (h > 0) return `${h} h ${deux(min)} min ${deux(s)} s`
  if (min > 0) return `${min} min ${deux(s)} s`
  return `${s} s`
}

/** Date et heure à l'heure du lieu du joueur : « 17 octobre 2026 à 19:42 ». */
export const texteDate = (t: number) =>
  new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Date courte : « aujourd'hui à 19:42 », « demain à 07:10 », « 11 nov. à 17:42 », « 3 mars 2028 à 09:00 ». */
/** « 18 octobre 2026 à 22:05 » (heure du téléphone). */
export function texteDateComplete(t: number): string {
  const d = new Date(t)
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export function texteDateCourte(t: number, maintenant: number): string {
  const d = new Date(t), m = new Date(maintenant)
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const jour = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const ecart = Math.round((jour(d) - jour(m)) / 86_400_000)
  if (ecart === 0) return `aujourd'hui à ${heure}`
  if (ecart === 1) return `demain à ${heure}`
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', ...(d.getFullYear() !== m.getFullYear() ? { year: 'numeric' } : {}) })
  return `${date} à ${heure}`
}

/** « AUTOUR DE LA TERRE », « AUTOUR D'URANUS », « AUTOUR DU SOLEIL », « À CÔTÉ DE ISS »… */
export function autourDe(nom: string): string {
  if (corps(nom)?.tailleM) return `À CÔTÉ DE ${nom.toUpperCase()}`
  const article: Record<string, string> = { Terre: 'DE LA ', Lune: 'DE LA ', Soleil: 'DU ', Uranus: "D'", Europe: "D'", Io: "D'", Encelade: "D'" }
  return `AUTOUR ${article[nom] ?? 'DE '}${nom.toUpperCase()}`
}
