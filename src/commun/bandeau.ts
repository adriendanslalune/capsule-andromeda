// Le bandeau d'alertes en haut de l'écran : il affiche les lignes que le moteur lui donne (moteur/bandeau.ts).

import { MODULES } from '../donnees/modules'
import type { LigneBandeau } from '../moteur/bandeau'
import { texteDistance } from '../moteur/navigation'
import { texteArrivee, texteDuree, texteRestant } from './textes'
import { picto, type NomSymbole } from './symboles'
import { GENRES_COURTS, NOMS_ACTIONS, VERBES, consigne, texteSecondes } from './textes-missions'

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
    return { titre: 'PING ENVOYÉ · ON ATTEND L\'ÉCHO…', detail: 'il reviendra à la vitesse de la lumière' }
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
  /** La quête suivie (son titre, son objectif en cours), ou null. */
  quetes: { id: string; titre: string; objectif: string; principale: boolean; suivie: boolean }[]
}

/** Le triangle d'alerte du voyant (c'est le voyant qui s'allume). */
const SYMBOLE_PANNE_VOYANT = '<svg class="symbole" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z"/><path d="M8 6v4M8 11.8v.4"/></svg>'
/** Les quatre voyants du tableau de bord, dans l'ordre (demande d'Adrien du 22/10/2026). */
export type Voyant = 'alerte' | 'quete' | 'contrat' | 'echo'
const VOYANTS: { cle: Voyant; nom: string; symbole: string }[] = [
  { cle: 'alerte', nom: 'ALERTE', symbole: SYMBOLE_PANNE_VOYANT },
  { cle: 'quete', nom: 'QUÊTE', symbole: picto('principale') },
  { cle: 'contrat', nom: 'CONTRAT', symbole: picto('missions') },
  { cle: 'echo', nom: 'ÉCHO', symbole: picto('ping') },
]
/** Le voyant choisi au doigt (null : l'afficheur montre ce qui compte le plus, voir afficherBandeau). */
let voyantOuvert: Voyant | null = null
/** Ce que montre l'afficheur en ce moment, et les alertes déjà vues (une nouvelle passe devant tout). */
let afficheActuel: Voyant | null = null
let alertesVues = ''
/** Toucher un voyant : l'afficheur montre sa catégorie ; retoucher celui qui est montré revient au choix du tableau. */
export function basculerVoyant(v: Voyant): void {
  voyantOuvert = afficheActuel === v ? null : v
}

/** Formes déjà affichées (l'état, l'écran) : si elles ne changent pas, on ne change que les textes. */
let formeEtat = '', formeDetail = ''
/** Les crédits au dernier affichage (pour faire sauter le compteur quand on en gagne). */
let creditsVus: number | null = null


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
  const nEtat = textes.length
  // Le tableau de bord (demandes d'Adrien du 22/10/2026) : quatre voyants sur une rangée, ALERTE, QUÊTE, CONTRAT,
  // ÉCHO, allumés quand il y a quelque chose ; dessous, l'afficheur (un écran e-ink). Il montre d'office l'alerte
  // (une nouvelle alerte passe devant tout), sinon le contrat en cours, sinon la quête suivie ; toucher un voyant y
  // montre sa catégorie. L'écho reste allumé jusqu'à ce qu'on touche son bouton.
  const categorieDe = (l: LigneBandeau): Voyant => (l.genre === 'missile' || l.genre === 'panne' || l.genre === 'chaleur' ? 'alerte' : l.genre === 'contrat' ? 'contrat' : 'echo')
  const actives = lignes.filter((l) => l.genre !== 'orbite' && l.genre !== 'trajet')
  const nombre = (v: Voyant) => (v === 'quete' ? capsule.quetes.length : actives.filter((l) => categorieDe(l) === v).length)
  const urgent = actives.some((l) => l.genre === 'missile' || l.genre === 'chaleur')
  const alertes = actives.filter((l) => categorieDe(l) === 'alerte').map((l) => l.genre).sort().join()
  if (alertes && alertes !== alertesVues) voyantOuvert = null
  alertesVues = alertes
  const affiche: Voyant | null = voyantOuvert ?? (nombre('alerte') ? 'alerte' : nombre('contrat') ? 'contrat' : nombre('quete') ? 'quete' : null)
  afficheActuel = affiche
  // L'afficheur : les lignes de la catégorie ouverte, ou ce qui dit qu'il n'y a rien ; vide si aucun voyant n'est ouvert.
  const ligneHtml = (l: LigneBandeau) => {
    const { titre, detail } = texteLigne(l, t)
    textes.push(titre, detail)
    const classe = l.genre === 'contrat' && l.situation === 'action' ? 'contrat action' : l.genre
    const b = bouton(l)
    return `<div class="ligne ${classe}" data-ligne="${l.genre}"><span class="texte"><b data-texte></b> <span data-texte></span></span>${b ? `<em>${b}</em>` : ''}</div>`
  }
  const vide = (cle: string, texte: string) => {
    textes.push(texte, '')
    return `<div class="ligne vide" data-ligne="${cle}"><span class="texte"><b data-texte></b> <span data-texte></span></span></div>`
  }
  let detail = ''
  if (affiche === 'quete') {
    // La suite de l'histoire d'abord (toujours là), puis la quête secondaire suivie s'il y en a une.
    // La ligne de l'histoire et celles des secondaires se distinguent (Adrien, 22/10/2026) : un intitulé au-dessus de
    // chaque groupe ; l'histoire en plus grand, les secondaires en plus petit.
    let groupe = ''
    for (const q of capsule.quetes) {
      const g = q.principale ? 'principale' : 'secondaire'
      if (g !== groupe) { detail += `<div class="intitule-quetes ${g}">${q.principale ? '◆ L\'HISTOIRE' : '● SECONDAIRES'}</div>`; groupe = g }
      textes.push(q.titre, q.objectif)
      detail += `<div class="ligne quete ${g}${q.suivie ? ' suivie' : ''}" data-ligne="quete" data-quete="${q.id}"><span class="texte"><b data-texte></b> <span data-texte></span></span><em>VOIR</em></div>`
    }
    if (!detail) detail = vide('vide-quete', 'la suite de l\'histoire arrive bientôt, capitaine…')
  } else if (affiche) {
    const ici = actives.filter((l) => categorieDe(l) === affiche)
    detail = ici.length ? ici.map(ligneHtml).join('')
      : vide(`vide-${affiche}`, affiche === 'alerte' ? 'RAS · tous les modules ronronnent' : affiche === 'contrat' ? 'aucun contrat : la Résistance a besoin de bras !' : 'aucun écho : le cosmos fait la sourde oreille')
  }
  // Trois zones qui ne sont jamais refaites d'un bloc (Adrien, 22/10/2026 : toucher une touche rechargeait tout le
  // tableau) : l'état, les touches (seules leurs classes changent : une touche enfoncée reste la même touche) et
  // l'écran, chacun réécrit seulement si sa forme change ; sinon, les textes seuls.
  if (!element.querySelector('.zone-etat')) {
    element.innerHTML = '<div class="zone-etat"></div><div class="voyants">' + VOYANTS.map(({ cle, nom, symbole }) =>
      `<button type="button" class="voyant v-${cle}" data-voyant="${cle}">${symbole}<small>${nom}</small><i class="compte" hidden></i></button>`).join('')
      + '</div><div class="afficheur"></div>'
    formeEtat = formeDetail = ''
  }
  const zone = element.querySelector<HTMLElement>('.zone-etat')!, ecran = element.querySelector<HTMLElement>('.afficheur')!
  if (statut !== formeEtat) zone.innerHTML = formeEtat = statut
  zone.querySelectorAll<HTMLElement>('[data-texte]').forEach((e, k) => { if (e.textContent !== textes[k]) e.textContent = textes[k] })
  for (const b of element.querySelectorAll<HTMLElement>('.voyant')) {
    const cle = b.dataset.voyant as Voyant, n = nombre(cle)
    const classe = ['voyant', `v-${cle}`, n ? 'allume' : 'eteint', affiche === cle ? 'ouvert' : '', cle === 'alerte' && urgent ? 'urgent' : ''].filter(Boolean).join(' ')
    if (b.className !== classe) b.className = classe
    b.setAttribute('aria-pressed', String(affiche === cle))
    const compte = b.querySelector<HTMLElement>('.compte')!
    compte.hidden = n < 2
    if (compte.textContent !== String(n)) compte.textContent = String(n)
  }
  const classeEcran = `afficheur${affiche ? ` v-${affiche}` : ''}`
  if (ecran.className !== classeEcran) ecran.className = classeEcran
  if (detail !== formeDetail) ecran.innerHTML = formeDetail = detail
  ecran.querySelectorAll<HTMLElement>('[data-texte]').forEach((e, k) => { if (e.textContent !== textes[nEtat + k]) e.textContent = textes[nEtat + k] })
  // Des crédits gagnés : le compteur saute (Adrien, 22/10/2026 : plus fun).
  if (creditsVus !== null && capsule.credits > creditsVus) {
    const c = zone.querySelector<HTMLElement>('.credits')
    if (c) { c.classList.remove('gagne'); void c.offsetWidth; c.classList.add('gagne') }
  }
  creditsVus = capsule.credits
  const barre = element.querySelector<HTMLElement>('.jauge-xp i')
  const largeur = `${Math.round(capsule.xp * 1000) / 10}%`
  if (barre && barre.style.width !== largeur) barre.style.width = largeur
}
