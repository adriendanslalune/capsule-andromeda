// La feuille de route en frise (demande d'Adrien du 21/10/2026), dans la console du bas : le départ, la destination
// (un losange doré), les étapes du contrat qui suivent, et la capsule dessus en temps réel. Le moteur dit quoi
// (moteur/feuille-de-route.ts) ; ici, seulement le dessin.

import type { FeuilleDeRoute } from '../moteur/feuille-de-route'
import { texteArrivee } from './textes'
import { VERBES } from './textes-missions'

const CAPSULE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12 6 19.5 9 12 6 4.5z"/></svg>'

/** L'heure seule (« 22:31 »), ou « demain 02:36 » (voir texteArrivee). */
const heure = (quand: number, t: number) => texteArrivee(quand, t)

export function htmlFrise(f: FeuilleDeRoute, t: number): string {
  const n = f.points.length
  const position = `${(Math.round(f.position * 500) / 5).toFixed(1)}%`
  const points = f.points.map((p, k) => {
    const sous: string[] = []
    if (p.action) sous.push(VERBES[p.action].toLowerCase())
    // Le point de départ d'un trajet (pas une étape du contrat) le dit, pour ne pas le prendre pour une étape.
    else if (k === 0) sous.push('départ')
    if (p.passe) { if (p.quand !== undefined) sous.push(`parti ${heure(p.quand, t)}`) }
    else if (k === 0 && !p.action) sous[0] = 'départ · maintenant'
    else if (p.quand !== undefined) sous.push(`<em>${heure(p.quand, t)}</em>`)
    const classe = ['point', k === 0 ? 'debut' : '', k === n - 1 ? 'fin' : '', p.passe ? 'passe' : '', p.but ? 'but' : ''].filter(Boolean).join(' ')
    return `<div class="${classe}" style="left:${((100 * k) / (n - 1)).toFixed(1)}%"><b>${p.nom}</b><i></i><small>${sous.join(' · ')}</small></div>`
  })
  return `<div class="rail"></div><div class="fait" style="width:${position}"></div>${points.join('')}<span class="capsule" style="left:${position}">${CAPSULE}</span>`
}
