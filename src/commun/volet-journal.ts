// Le journal des quêtes (Plus › Journal ; décisions d'Adrien du 20/10/2026), comme dans les MMORPG : les quêtes en
// cours (principales d'abord), chacune avec le portrait de son donneur, ses étapes (cochées, en cours), sa récompense,
// et les boutons SUIVRE (celle qu'on voit sur la carte) et Y ALLER ; puis les quêtes finies. Rien n'est calculé ici :
// tout vient de moteur/quetes.ts.

import type { Quete } from '../donnees/quetes'
import type { Jeu } from '../moteur/jeu'
import { enCours, objectif, pnj, terminees, texteEtape } from '../moteur/quetes'
import { medaillon } from './vue-dialogue'

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function carte(jeu: Jeu, q: Quete, ouverte: boolean): string {
  const e = jeu.quetes[q.id], donneur = pnj(q.donneur)
  const finie = e.fin != null
  const o = finie ? null : objectif(jeu, q)
  const suivie = jeu.queteSuivie === q.id
  let html = `<div class="quete ${q.type}${suivie ? ' suivie' : ''}${finie ? ' finie' : ''}">`
    + `<button type="button" class="tete-quete" data-ouvrir="${q.id}">${medaillon(donneur, 'medaillon')}`
    + `<span><small>${q.type === 'principale' ? '◆ PRINCIPALE' : '● SECONDAIRE'}${suivie ? ' · suivie' : ''}</small><b>${echapper(q.titre)}</b>`
    + `${o ? `<em>${echapper(o.texte)}${o.compte ? ` · ${o.compte}` : ''}</em>` : '<em>Terminée</em>'}</span><i>${ouverte ? '▾' : '▸'}</i></button>`
  if (ouverte) {
    html += '<ol class="etapes">' + q.etapes.map((x, k) => {
      const etat = k < e.etape ? 'faite' : k === e.etape && !finie ? 'en-cours' : 'a-venir'
      // Les étapes à venir restent cachées : on ne gâche pas la surprise.
      return `<li class="${etat}">${etat === 'faite' ? '✓' : etat === 'en-cours' ? '➜' : '·'} ${etat === 'a-venir' ? '…' : echapper(texteEtape(x))}</li>`
    }).join('') + '</ol>'
    html += `<p class="donneur">Donnée par ${echapper(donneur.nom)} (${echapper(donneur.lieu)}) · récompense : <b>${q.recompense.toLocaleString('fr-FR')} crédits</b>${q.libere ? ` et la libération de ${echapper(q.libere)}` : ''}</p>`
    if (!finie) {
      const lieu = o?.lieu ?? null
      html += '<div class="boutons-quete">'
        + (suivie ? '<button type="button" disabled>SUIVIE SUR LA CARTE</button>' : `<button type="button" data-suivre="${q.id}">SUIVRE</button>`)
        + (lieu ? `<button type="button" class="principal" data-y-aller="${echapper(lieu)}">Y ALLER · ${echapper(lieu)}</button>` : '')
        + '</div>'
    }
  }
  return html + '</div>'
}

/** Le contenu du journal. ouverte : la quête dépliée (par défaut, la quête suivie). */
export function htmlJournal(jeu: Jeu, ouverte: string | null): string {
  const cours = enCours(jeu), finies = terminees(jeu)
  const deplie = ouverte ?? jeu.queteSuivie
  let html = '<button type="button" class="retour" data-page="plus">‹ Plus</button>'
  if (!cours.length && !finies.length) {
    return html + '<p class="vide-journal">Aucune quête pour l\'instant. Sur la carte, un <b>!</b> près d\'un personnage signale qu\'il a quelque chose à te demander : va en orbite à son lieu et parle-lui. Commence par Elsa Varga, sur l\'ISS.</p>'
  }
  for (const [titre, liste] of [['Principales', cours.filter((q) => q.type === 'principale')], ['Secondaires', cours.filter((q) => q.type === 'secondaire')]] as const) {
    if (liste.length) html += `<h3>${titre}</h3>` + liste.map((q) => carte(jeu, q, q.id === deplie)).join('')
  }
  if (finies.length) html += '<h3>Terminées</h3>' + finies.map((q) => carte(jeu, q, q.id === ouverte)).join('')
  return html
}
