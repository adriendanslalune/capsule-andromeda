// Petit outil commun aux écrans des modules : faire un geste, et secouer l'écran en cas de fausse manœuvre.

import type { Contexte, Evenement } from '../../moteur/modules/commun'
import type { EtatModules } from '../../moteur/modules'
import { jeu } from '../jeu.svelte'

export class Secousse {
  active = $state(false)
  private minuterie: ReturnType<typeof setTimeout> | null = null

  declencher() {
    this.active = false
    if (this.minuterie) clearTimeout(this.minuterie)
    // Laisser le navigateur retirer la classe avant de la remettre, pour rejouer l'animation.
    requestAnimationFrame(() => {
      this.active = true
      this.minuterie = setTimeout(() => (this.active = false), 400)
    })
  }
}

/** Fait un geste sur les modules ; secoue l'écran si le moteur signale une erreur. */
export function geste(secousse: Secousse,
  action: (m: EtatModules, ctx: Contexte) => { modules: EtatModules; evenements: Evenement[] }): Evenement[] {
  const evenements = jeu.agir(action)
  if (evenements.some((e) => e.type === 'erreur')) secousse.declencher()
  return evenements
}
