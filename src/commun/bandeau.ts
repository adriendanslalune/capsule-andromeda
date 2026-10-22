// Le bandeau d'alertes en haut de l'écran : il affiche les lignes que le moteur lui donne (moteur/bandeau.ts).

import { MODULES } from '../donnees/modules'
import type { LigneBandeau } from '../moteur/bandeau'
import { texteDistance } from '../moteur/navigation'
import { texteArrivee, texteDuree, texteRestant } from './textes'
import { picto, type NomSymbole } from './symboles'
import { GENRES_COURTS, NOMS_ACTIONS, SYMBOLES, VERBES, consigne, texteSecondes } from './textes-missions'

/**
 * Titre et détail d'une ligne : « PANNE · MOTEUR », « vitesse divisée par 2 ». Les lignes calmes
 * (en orbite, en route) ont un symbole devant le titre et leurs valeurs en symboles (décision d'Adrien du 20/10/2026) :
 * « (orbite) TERRE », « (altitude) 400 km (tour) 1 h 32 min ».
 */
export function texteLigne(l: LigneBandeau, t: number): { titre: string; detail: string; symbole?: NomSymbole; valeurs?: [NomSymbole, string][] } {
  if (l.genre === 'missile') {
    const s = Math.ceil(l.reste / 1000)
    return {
      titre: `MISSILE · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
      detail: l.intercepteurs ? `${l.alien} · ${l.intercepteurs} intercepteur${l.intercepteurs > 1 ? 's' : ''}` : 'plus d\'intercepteur : il va frapper !',
    }
  }
  if (l.genre === 'panne') {
    const fiches = l.modules.map((m) => MODULES.find((f) => f.nom === m)!)
    return {
      titre: `PANNE · ${fiches.map((f) => f.titre.toUpperCase()).join(', ')}`,
      detail: fiches.length === 1 ? fiches[0].effet : '',
    }
  }
  if (l.genre === 'echo') {
    // On ne sait pas quand l'écho reviendra (décision d'Adrien du 18/10/2026) : pas de décompte.
    return { titre: 'PING ENVOYÉ · ON ATTEND L\'ÉCHO…', detail: 'il reviendra à la vitesse de la lumière : bientôt, ou pas' }
  }
  if (l.genre === 'echo-recu') {
    return {
      titre: l.localise ? `MONOLITHE N° ${l.monolithe} LOCALISÉ !` : `ÉCHO REÇU · MONOLITHE N° ${l.monolithe}`,
      detail: l.localise ? 'touche ici pour le voir sur la carte' : `à ${texteDistance(l.distance)} · touche ici pour voir le cercle`,
    }
  }
  if (l.genre === 'chaleur') {
    return { titre: `TEMPÉRATURE COQUE · BOUCLIERS ${l.boucliers} %`, detail: l.boucliers > 50 ? 'la capsule fonce vers le Soleil' : 'ça chauffe… ça chauffe beaucoup trop…' }
  }
  if (l.genre === 'trajet') {
    return { titre: l.cible.toUpperCase(), detail: '', symbole: 'route', valeurs: [['arrivee', texteArrivee(l.arrivee, t)], ['duree', texteRestant(l.reste)]] }
  }
  if (l.genre === 'contrat') {
    const n = l.contrat.etapes.length > 1 ? ` (étape ${l.numero + 1}/${l.contrat.etapes.length})` : ''
    // Titre court (une ligne) : le genre et le lieu final ; le détail dit quoi faire (sauf « aller » au lieu du titre).
    const lieu = l.contrat.etapes[l.contrat.etapes.length - 1].lieu
    const detail = l.situation === 'action' ? `${NOMS_ACTIONS[l.etape.action]} en cours · ${texteSecondes(l.finAction! - t)}`
      : l.situation === 'sur-place' ? 'sur place'
        : l.etape.lieu === lieu ? '' : consigne(l.etape)
    return { titre: `${GENRES_COURTS[l.contrat.genre]} · ${lieu}`, detail: `${detail}${n}`.trim() }
  }
  const valeurs: [NomSymbole, string][] = [[l.engin ? 'distance' : 'altitude', texteDistance(l.altitude)]]
  if (l.tour !== null) valeurs.push(['tour', texteDuree(l.tour * 1000)])
  return { titre: l.centre.toUpperCase(), detail: '', symbole: 'orbite', valeurs }
}

/**
 * Ce que la console du haut montre en plus des lignes du moteur (maquette validée par Adrien le 21/10/2026) : les
 * crédits, le niveau du capitaine et sa jauge d'XP (0 à 1), et en vol la phase et le système traversé.
 */
export interface EtatCapsuleBandeau {
  credits: number
  niveau: number; xp: number
  /** En vol : « accélère », « croisière », « freine » ; et le système où est la capsule (« Terre », « plein espace »). */
  phase: string; systeme: string
}

/** Forme du bandeau déjà affichée (lignes, genres, symboles) : si elle ne change pas, on ne change que les textes. */
let forme = ''

/** Panne : un petit triangle d'alerte qui palpite. */
const SYMBOLE_PANNE = '<svg class="symbole alerte" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z"/><path d="M8 6v4M8 11.8v.4"/></svg>'

/** Le mot du bouton au bout de chaque alerte (toute la ligne se touche). */
function bouton(l: LigneBandeau): string {
  if (l.genre === 'missile') return l.intercepteurs ? 'INTERCEPTER' : ''
  if (l.genre === 'panne') return 'RÉPARER'
  if (l.genre === 'echo-recu') return 'VOIR'
  if (l.genre === 'contrat') return l.situation === 'sur-place' ? VERBES[l.etape.action] : l.situation === 'action' ? '' : 'VOIR'
  return ''
}

/**
 * La console du haut : une ligne d'état (en orbite autour de quoi, ou en vol), le niveau et les crédits ; puis les
 * alertes, de la plus urgente à la plus calme, chacune avec son bouton. Le trajet lui-même est dans la console du bas
 * (la feuille de route), pas ici : la même chose ne s'affiche jamais deux fois.
 */
export function afficherBandeau(element: HTMLElement, lignes: LigneBandeau[], capsule: EtatCapsuleBandeau, t: number): void {
  const textes: string[] = []
  const valeur = (nom: NomSymbole, texte: string) => { textes.push(texte); return `<span class="val">${picto(nom)}<span data-texte></span></span>` }
  // La ligne d'état.
  const orbite = lignes.find((l) => l.genre === 'orbite')
  let etat: string
  if (orbite && orbite.genre === 'orbite') {
    textes.push(orbite.engin ? `À CÔTÉ DE ${orbite.centre.toUpperCase()}` : `EN ORBITE · ${orbite.centre.toUpperCase()}`)
    const vals = valeur(orbite.engin ? 'distance' : 'altitude', texteDistance(orbite.altitude)) + (orbite.tour !== null ? valeur('tour', texteDuree(orbite.tour * 1000)) : '')
    etat = `<span class="phase">${picto('orbite')}</span><span class="ou"><b data-texte></b><small class="vals">${vals}</small></span>`
  } else {
    textes.push('EN VOL', [capsule.phase, capsule.systeme].filter(Boolean).join(' · '))
    etat = `<span class="phase">${picto('route')}</span><span class="ou"><b data-texte></b><small data-texte></small></span>`
  }
  textes.push(capsule.credits.toLocaleString('fr-FR'))
  const statut = `<div class="etat-capsule" data-ligne="orbite">${etat}`
    + `<span class="niveau" data-ligne="profil"><b>NIV ${capsule.niveau}<span>XP</span></b><span class="jauge-xp"><i></i></span></span>`
    + `<span class="credits" data-ligne="etat">${picto('credits')}<span data-texte></span></span></div>`
  // Le tableau de bord (demande d'Adrien du 22/10/2026 : toutes les catégories tout le temps, on voit tout d'un coup) :
  // les alertes, le contrat, l'écho, dans cet ordre ; une catégorie sans rien garde sa ligne, éteinte, qui le dit.
  const rang = (l: LigneBandeau) => (l.genre === 'missile' || l.genre === 'panne' || l.genre === 'chaleur' ? 0 : l.genre === 'contrat' ? 1 : 2)
  const actives = lignes.filter((l) => l.genre !== 'orbite' && l.genre !== 'trajet').sort((a, b) => rang(a) - rang(b))
  const vide = (cle: string, symbole: string, categorie: string, texte: string) => {
    textes.push(texte, '')
    return `<div class="ligne vide ${cle}" data-ligne="${cle}"><span class="symbole-ligne">${symbole}<small>${categorie}</small></span><span class="texte"><b data-texte></b> <span data-texte></span></span></div>`
  }
  const ligneHtml = (l: LigneBandeau) => {
    const { titre, detail } = texteLigne(l, t)
    textes.push(titre, detail)
    const symbole = l.genre === 'contrat' ? SYMBOLES[l.contrat.genre] : l.genre === 'panne' || l.genre === 'missile' || l.genre === 'chaleur' ? SYMBOLE_PANNE : picto('monolithe')
    const classe = l.genre === 'contrat' && l.situation === 'action' ? 'contrat action' : l.genre
    const b = bouton(l)
    // Chaque ligne a son intercalaire (demande d'Adrien du 22/10/2026 : alertes, contrat, écho et quête bien séparés) :
    // la catégorie écrite sous son symbole, sur la couleur de sa catégorie.
    const categorie = l.genre === 'contrat' ? 'CONTRAT' : l.genre === 'missile' ? 'MISSILE' : l.genre === 'panne' ? 'PANNE' : l.genre === 'chaleur' ? 'CHALEUR' : 'ÉCHO'
    return `<div class="ligne ${classe}" data-ligne="${l.genre}"><span class="symbole-ligne">${symbole}<small>${categorie}</small></span><span class="texte"><b data-texte></b> <span data-texte></span></span>${b ? `<em>${b}</em>` : ''}</div>`
  }
  // Groupe par groupe, dans l'ordre de l'écran (les textes se remplissent dans cet ordre).
  const groupe = (k: number, cle: string, symbole: string, categorie: string, texte: string) => {
    const ici = actives.filter((l) => rang(l) === k)
    return ici.length ? ici.map(ligneHtml).join('') : vide(cle, symbole, categorie, texte)
  }
  let html = statut
  html += groupe(0, 'vide-alerte', picto('panne'), 'ALERTE', 'RAS · tous les modules en état')
  html += groupe(1, 'vide-contrat', picto('missions'), 'CONTRAT', 'aucun contrat en cours')
  html += groupe(2, 'vide-echo', picto('ping'), 'ÉCHO', 'aucun écho attendu')
  // Réécrire le bandeau relancerait les animations (le compte à rebours change chaque seconde) : seulement si sa forme
  // change ; sinon, les textes seuls.
  if (html !== forme) element.innerHTML = forme = html
  element.querySelectorAll<HTMLElement>('[data-texte]').forEach((e, k) => { if (e.textContent !== textes[k]) e.textContent = textes[k] })
  const barre = element.querySelector<HTMLElement>('.jauge-xp i')
  const largeur = `${Math.round(capsule.xp * 1000) / 10}%`
  if (barre && barre.style.width !== largeur) barre.style.width = largeur
}
