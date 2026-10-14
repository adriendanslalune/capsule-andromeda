// Les pages du manuel, dans l'ordre, et le chapitre de chaque bloc (pour le bouton MANUEL des écrans de module).
// Le manuel est dessiné par le jeu, à partir des mêmes données que le moteur : les deux ne peuvent pas diverger.

import type { Component } from 'svelte'
import Antenne from './chapitres/Antenne.svelte'
import Brassage from './chapitres/Brassage.svelte'
import Cascades from './chapitres/Cascades.svelte'
import Chronometre from './chapitres/Chronometre.svelte'
import Codeur from './chapitres/Codeur.svelte'
import Couverture from './chapitres/Couverture.svelte'
import Fusibles from './chapitres/Fusibles.svelte'
import Hydraulique from './chapitres/Hydraulique.svelte'
import Lampes from './chapitres/Lampes.svelte'
import Morse from './chapitres/Morse.svelte'
import Nomenclature from './chapitres/Nomenclature.svelte'
import Notes from './chapitres/Notes.svelte'
import PostePilotage from './chapitres/PostePilotage.svelte'
import ProceduresPropulsion from './chapitres/ProceduresPropulsion.svelte'
import ProceduresPropulsion2 from './chapitres/ProceduresPropulsion2.svelte'
import Propulsion from './chapitres/Propulsion.svelte'
import Recycleur from './chapitres/Recycleur.svelte'
import Reperes from './chapitres/Reperes.svelte'
import Sextant from './chapitres/Sextant.svelte'
import Sommaire from './chapitres/Sommaire.svelte'
import Telegrammes from './chapitres/Telegrammes.svelte'
import Visiteur from './chapitres/Visiteur.svelte'
import Visiteur2 from './chapitres/Visiteur2.svelte'
import Visiteur3 from './chapitres/Visiteur3.svelte'

export interface PageManuel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  composant: Component<any>
  /** Chapitre de la page (en chiffres romains), s'il y en a un. */
  chapitre?: string
  titre?: string
  /** Vrai pour la suite d'un chapitre (absente du sommaire). */
  suite?: boolean
}

export const PAGES: PageManuel[] = [
  { composant: Couverture },
  { composant: Sommaire },
  { composant: PostePilotage, chapitre: 'I', titre: 'Le poste de pilotage' },
  { composant: Nomenclature, chapitre: 'II', titre: 'Nomenclature du poste' },
  { composant: Reperes, chapitre: 'III', titre: 'Repères du bord' },
  { composant: Propulsion, chapitre: 'IV', titre: 'Bloc propulsion — CH-1, TU-1' },
  { composant: ProceduresPropulsion, chapitre: 'V', titre: 'Procédures de propulsion' },
  { composant: ProceduresPropulsion2, chapitre: 'V', titre: 'Procédures de propulsion (suite)', suite: true },
  { composant: Fusibles, chapitre: 'VI', titre: 'AL-1 — Fusibles' },
  { composant: Codeur, chapitre: 'VII', titre: 'CO-1 — Codeur' },
  { composant: Brassage, chapitre: 'VIII', titre: 'PB-1 — Tableau de brassage' },
  { composant: Lampes, chapitre: 'IX', titre: 'LP-1 — Lampes à vide' },
  { composant: Hydraulique, chapitre: 'X', titre: 'HY-1 — Circuit hydraulique' },
  { composant: Recycleur, chapitre: 'XI', titre: 'RE-1 — Recycleur d’air' },
  { composant: Morse, chapitre: 'XII', titre: 'MO-1 — Morse' },
  { composant: Chronometre, chapitre: 'XIII', titre: 'CR-1 — Chronomètre de bord' },
  { composant: Sextant, chapitre: 'XIV', titre: 'SX-1 — Sextant' },
  { composant: Antenne, chapitre: 'XV', titre: 'AN-1 — Antenne orientable' },
  { composant: Cascades, chapitre: 'XVI', titre: 'Pannes multiples' },
  { composant: Visiteur, chapitre: 'XVII', titre: 'Recherche du visiteur' },
  { composant: Visiteur2, chapitre: 'XVII', titre: 'Recherche du visiteur (suite)', suite: true },
  { composant: Visiteur3, chapitre: 'XVII', titre: 'Chasse : mode d’emploi pas à pas', suite: true },
  { composant: Telegrammes, chapitre: 'XVIII', titre: 'Télégrammes' },
  { composant: Notes, titre: 'Notes de bord' },
]

/** Chapitre du manuel de chaque bloc. */
export const CHAPITRE_DU_MODULE: Readonly<Record<string, string>> = {
  'CH-1': 'IV', 'TU-1': 'IV', 'AL-1': 'VI', 'CO-1': 'VII', 'PB-1': 'VIII', 'LP-1': 'IX', 'HY-1': 'X', 'RE-1': 'XI',
  'MO-1': 'XII', 'CR-1': 'XIII', 'SX-1': 'XIV', 'AN-1': 'XV',
}

/** Numéro (à partir de 0) de la page où commence un chapitre. */
export function pageDuChapitre(chapitre: string): number {
  return Math.max(0, PAGES.findIndex((p) => p.chapitre === chapitre))
}
