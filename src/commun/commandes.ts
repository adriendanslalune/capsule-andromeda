// Les commandes d'un module du panneau, collées en bas du volet : elles s'ouvrent en touchant le module (demande
// d'Adrien du 18/10/2026). Chaque bouton porte son geste (data-geste, en JSON) ; la page le transmet au jeu.

import { repere, TITRES_APPAREILS, type NomAppareil } from '../donnees/blocs'
import { BORNES, CALIBRES, TEINTES_ACCUS } from '../donnees/manuel-energie'
import { LEVIERS, TEINTES_INJECTEURS } from '../donnees/manuel-moteur'
import { ANNEAUX, ASTRES } from '../donnees/manuel-navigation'
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
  if (a === 'leviers' && e.leviers.actif) {
    const t = e.leviers, b = t.bloque ? ' disabled' : ''
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : 'LEVIERS'}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="grille-commandes cinq">' + LEVIERS.map((l, k) =>
        `<button type="button" ${geste({ genre: 'basculer', levier: k })}${b}><i style="background:${l.teinte}"></i><b>${l.numero}</b>${t.positions[k] ? '▲ haut' : '▼ bas'}</button>`).join('')
      + `</div><button type="button" class="action" ${geste({ genre: 'enclencher' })}${b}>ENCLENCHER</button>`
  }
  if (a === 'soupape' && e.soupape.temperature !== null) {
    const t = e.soupape
    // Ce bouton se tient appuyé (voir main.ts) : son texte ne change pas pendant la purge.
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : 'PURGE'}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="note-commandes">Tenir PURGER : l\'aiguille de PRESSION descend. Relâcher dans la bonne zone.</div>'
      + `<button type="button" class="action purger" data-purger${t.bloque ? ' disabled' : ''}>PURGER (tenir)</button>`
  }
  if (a === 'injecteurs' && e.injecteurs.voyants) {
    const t = e.injecteurs, b = t.bloque ? ' disabled' : ''
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : `COUPÉS ${t.coupes.length}`}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="grille-commandes trois">' + t.voyants!.map((v, k) => {
        const coupe = t.coupes.includes(k)
        return `<button type="button" class="${coupe ? 'coupe' : ''}" ${geste({ genre: 'injecteur', injecteur: k })}${b}><i style="background:${TEINTES_INJECTEURS[v]}"></i><b>J${k + 1}</b>${coupe ? 'coupé' : 'couper'}</button>`
      }).join('') + `</div><button type="button" class="action" ${geste({ genre: 'amorcer' })}${b}>AMORCER</button>`
  }
  if (a === 'constellation' && e.constellation.constellation) {
    const t = e.constellation, b = t.bloque ? ' disabled' : ''
    const bouton = (cadran: 'azimut' | 'hauteur', pas: 1 | -1, texte: string) => `<button type="button" ${geste({ genre: 'cap', cadran, pas })}${b}>${texte}</button>`
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : `AZ ${t.azimut}° · HT ${t.hauteur}°`}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="grille-commandes">' + bouton('azimut', -1, '<b>↺</b>azimut') + bouton('azimut', 1, '<b>↻</b>azimut')
      + bouton('hauteur', -1, '<b>▼</b>hauteur') + bouton('hauteur', 1, '<b>▲</b>hauteur') + '</div>'
      + `<button type="button" class="action" ${geste({ genre: 'pointer' })}${b}>POINTER</button>`
  }
  if (a === 'gyroscope' && e.gyroscope.actif) {
    const t = e.gyroscope
    return titre + `<div class="note-commandes">${t.bloque ? `Gyroscope bloqué : ${t.bloque} s` : 'Freiner chaque anneau quand son repère passe sous l\'index ▼.'}</div>`
      + '<div class="grille-commandes trois">' + ANNEAUX.map((x, k) => {
        const freine = t.freines.includes(k)
        return `<button type="button" ${geste({ genre: 'freiner', anneau: k })}${freine || t.bloque ? ' disabled' : ''} style="background:${x.teinte};color:#fff">`
          + `<b>${x.titre}</b>${freine ? 'freiné' : 'FREINER'}</button>`
      }).join('') + '</div>'
  }
  if (a === 'calculateur' && e.calculateur.code) {
    const t = e.calculateur, b = t.bloque ? ' disabled' : ''
    return titre + `<div class="ligne-commandes"><div class="affichage">${t.bloque ? `BLOQUÉ ${t.bloque} s` : t.code}</div><div class="tour">tour ${t.numero + 1}/${t.tours}</div></div>`
      + '<div class="grille-commandes six">' + t.interrupteurs.map((h, k) =>
        `<button type="button" ${geste({ genre: 'interrupteur', interrupteur: k })}${b}><b>${k + 1}</b>${h ? '▲' : '▼'}</button>`).join('') + '</div>'
      + '<div class="grille-commandes">' + ASTRES.map((s, k) =>
        `<button type="button" class="symbole" ${geste({ genre: 'astre', astre: k })}${b || (t.tapes.includes(k) ? ' disabled' : '')}>${s}</button>`).join('') + '</div>'
      + `<div class="note-commandes">${t.tapes.length} astre${t.tapes.length > 1 ? 's' : ''} sur 3</div>`
  }
  return ''
}
