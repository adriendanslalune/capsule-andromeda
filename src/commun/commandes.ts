// Les commandes d'un module du panneau, collées en bas du volet : elles s'ouvrent en touchant le module (demande
// d'Adrien du 18/10/2026). Chaque bouton porte son geste (data-geste, en JSON) ; la page le transmet au jeu.

import { repere, TITRES_APPAREILS, type NomAppareil } from '../donnees/blocs'
import { BORNES, CALIBRES, TEINTES_ACCUS } from '../donnees/manuel-energie'
import type { Geste } from '../moteur/appareils'
import { attributsMorse, type EtatPanneau } from './panneau'

const TEINTES_BOUTONS: Record<string, string> = {
  rouge: '#e04b37', bleu: '#3f63c4', jaune: '#f2b53a', blanc: '#faf2dc', vert: '#5fb36a', noir: '#3a3340',
}

const geste = (g: Geste) => `data-geste='${JSON.stringify(g)}'`

/** Le geste d'un bouton des commandes, ou null. */
export function gesteDuBouton(b: HTMLElement): Geste | null {
  return b.dataset.geste ? JSON.parse(b.dataset.geste) as Geste : null
}

/** Les commandes du module (HTML) ; vide s'il n'y a rien à faire (module en état). */
export function htmlCommandes(a: NomAppareil, e: EtatPanneau): string {
  const titre = `<div class="titre-commandes">MODULE ${repere(a)} · ${TITRES_APPAREILS[a]}<button type="button" class="fermer-commandes" data-fermer>✕</button></div>`
  if (a === 'bornier' && e.energie.tour) {
    const b = e.energie.bloque ? ' disabled' : ''
    return titre + '<div class="grille-commandes">' + e.energie.tour.cables.map((c, k) => {
      const coupe = e.energie.coupes.includes(k)
      const clair = c.couleur === 'blanc' || c.couleur === 'jaune'
      return `<button type="button" ${geste({ genre: 'couper', cable: k })}${coupe || e.energie.bloque ? ' disabled' : ''} style="background:${TEINTES_BOUTONS[c.couleur]};color:${clair ? '#1f1b18' : '#fff'}">`
        + `${coupe ? 'coupé' : '✂ COUPER'}<b>${c.circuit}${c.chiffre}</b></button>`
    }).join('') + `</div><button type="button" class="action" ${geste({ genre: 'isoler' })}${b}>ISOLER</button>`
  }
  if (a === 'telegraphe' && e.telegraphe.morse) {
    const t = e.telegraphe, b = t.bloque ? ' disabled' : ''
    const animation = Object.entries(attributsMorse(t.morse!, '#fff3a8', '#5a4e3a')).map(([k, v]) => `${k}="${v}"`).join(' ')
    const lampe = `<svg class="lampe" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#d9a43a" stroke="#2b2138" stroke-width="2"/>`
      + `<circle cx="22" cy="22" r="14" fill="#5a4e3a" stroke="#2b2138">${t.bloque ? '' : `<animate ${animation}/>`}</circle></svg>`
    return titre + `<div class="ligne-commandes">${lampe}<div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : `${t.frequence} MHz`}</div></div>`
      + `<div class="grille-commandes deux"><button type="button" ${geste({ genre: 'regler', pas: -1 })}${b || (t.cran === 0 ? ' disabled' : '')}><b>◀</b>fréquence</button>`
      + `<button type="button" ${geste({ genre: 'regler', pas: 1 })}${b || (t.cran === t.crans - 1 ? ' disabled' : '')}><b>▶</b>fréquence</button></div>`
      + `<button type="button" class="action" ${geste({ genre: 'emettre' })}${b}>ÉMETTRE</button>`
  }
  if (a === 'antenne' && e.antenne.symbole) {
    const t = e.antenne, b = t.bloque ? ' disabled' : ''
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : `ANGLE ${t.angle}°`}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="grille-commandes">' + [-45, -15, 15, 45].map((d) =>
        `<button type="button" ${geste({ genre: 'tourner', degres: d })}${b}><b>${d < 0 ? '↺' : '↻'}</b>${d > 0 ? '+' : '−'}${Math.abs(d)}°</button>`).join('')
      + `</div><button type="button" class="action" ${geste({ genre: 'verrouiller' })}${b}>VERROUILLER</button>`
  }
  if (a === 'chiffreur' && e.chiffreur.touches) {
    const t = e.chiffreur
    return titre + '<div class="grille-commandes">' + t.touches!.map((s, k) => {
      const enfoncee = t.enfoncees.includes(k)
      return `<button type="button" class="symbole" ${geste({ genre: 'appuyer', touche: k })}${enfoncee || t.bloque ? ' disabled' : ''}>${s}${enfoncee ? '<small>✓</small>' : ''}</button>`
    }).join('') + `</div><div class="note-commandes">${t.bloque ? `Chiffreur bloqué : ${t.bloque} s` : `${t.enfoncees.length} touche${t.enfoncees.length > 1 ? 's' : ''} sur 4`}</div>`
  }
  if (a === 'fusibles' && e.fusibles.tour) {
    const f = e.fusibles, b = f.bloque ? ' disabled' : ''
    return titre + `<div class="ligne-commandes"><div class="affichage">${f.bloque ? `BLOQUÉ ${f.bloque} s` : `GRILLÉ : ${CALIBRES[f.tour!.grille]} A`}</div><div class="tour">fusible ${f.numero + 1}/${f.tours}</div></div>`
      + '<div class="note-commandes">Tiroir de rechange : toucher le fusible à mettre à la place du grillé.</div>'
      + '<div class="grille-commandes">' + f.tour!.rechanges.map((c, k) =>
        `<button type="button" ${geste({ genre: 'remplacer', rechange: k })}${b}><b>${c} A</b>remettre</button>`).join('') + '</div>'
  }
  if (a === 'accumulateurs' && e.accumulateurs.tour) {
    const t = e.accumulateurs, b = t.bloque ? ' disabled' : ''
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : `BRANCHÉS ${t.branches.length}/3`}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="grille-commandes trois">' + BORNES.map((borne, k) => {
        const branche = t.branches.includes(k)
        return `<button type="button" ${geste({ genre: 'brancher', accu: k })}${branche || t.bloque ? ' disabled' : ''} style="background:${TEINTES_ACCUS[t.tour!.couleurs[k]]};color:#1f1b18">`
          + `<b>${borne}</b>${branche ? `branché (${t.branches.indexOf(k) + 1})` : 'brancher'}</button>`
      }).join('') + `</div><button type="button" class="action" ${geste({ genre: 'coupler' })}${b}>COUPLER</button>`
  }
  return ''
}
