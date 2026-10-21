// Le volet Missions : la mission en cours (ses étapes, Y ALLER, l'action sur place, abandonner) et les missions
// proposées (ACCEPTER), avec leur Maison. Deux filtres (demandes d'Adrien du 18/10/2026) : le lieu (chaque planète et
// grande lune a ses missions ; d'abord celles du lieu de la capsule, mais on peut regarder ailleurs, et leurs prix)
// et la Maison. Il ne décide rien : il affiche l'état du jeu et transmet les choix du joueur.

import type { Jeu } from '../moteur/jeu'
import { distanceDepuisCapsule, texteDistance } from '../moteur/navigation'
import type { Contrat } from '../moteur/contrats'
import { texteDuree, texteRestant } from './textes'
import { MAISONS, maisonDuContrat, titreMaison, type Maison } from '../donnees/maisons'
import { TABLEAUX, systemeDuTableau } from '../donnees/tableaux'
import { GENRES_COURTS, NOMS_ACTIONS, VERBES, consigne, texteSecondes, titreContrat, POSTES } from './textes-missions'
import { avec, picto, SYMBOLE_GENRE } from './symboles'

export interface ChoixMissions {
  accepter(id: number): void
  voir(id: number): void
  allerA(lieu: string): void
  agir(): void
  abandonner(): void
}

/** Temps de trajet d'une mission recalculé au plus toutes les 20 secondes (le calcul est long, et l'ordre de la liste
 *  ne doit pas sauter sans arrêt). */
const RAFRAICHIR_DUREES = 20_000

/** Le filtre choisi est retenu sur le téléphone (null : toutes les Maisons). */
const CLE_FILTRE = 'andromeda-filtre-missions'
function lireFiltre(): Maison | null {
  try {
    const m = localStorage.getItem(CLE_FILTRE)
    return MAISONS.some((f) => f.maison === m) ? m as Maison : null
  } catch { return null }
}

/** La portée d'une mission dans son système, en points (●○○ proche, ●●○ mi-distance, ●●● lointaine). */
const PORTEES = { proche: 1, moyenne: 2, lointaine: 3 } as const
const NOMS_PORTEES = { proche: 'proche', moyenne: 'à mi-distance', lointaine: 'lointaine' } as const
function portee(c: Contrat): string {
  if (!c.portee) return ''
  const n = PORTEES[c.portee]
  return `<span class="val portee" data-symbole="Contrat ${NOMS_PORTEES[c.portee]} dans son système">${[1, 2, 3].map((k) => `<i${k <= n ? ' class="on"' : ''}></i>`).join('')}</span>`
}

/** La tuile du type de mission : la couleur de sa Maison, le dessin et le nom de son type. */
function tuile(c: Contrat): string {
  return `<div class="tuile-type maison-${maisonDuContrat(c)}" data-symbole="Maison des ${titreMaison(maisonDuContrat(c)).toLowerCase()}">${picto(SYMBOLE_GENRE[c.genre])}<small>${GENRES_COURTS[c.genre]}</small></div>`
}

export class VoletMissions {
  private dernier = ''
  private durees = new Map<number, { calcule: number; duree: number | null }>()
  private filtre = lireFiltre()
  /** Le lieu dont on regarde les missions (null : celui de la capsule). */
  private lieu: string | null = null
  private derniersArguments: Parameters<VoletMissions['afficher']> | null = null

  /** Temps de trajet d'une mission (ms), depuis là où est la capsule, ou null si hors de portée. */
  duree(jeu: Jeu, c: Contrat, t: number, vitesse: number, maintenant: number): number | null {
    const d = this.durees.get(c.id)
    if (d && maintenant - d.calcule < RAFRAICHIR_DUREES) return d.duree
    const duree = jeu.dureeTrajets(c, t, vitesse)
    this.durees.set(c.id, { calcule: maintenant, duree })
    return duree
  }

  /** À l'ouverture du volet : on revient aux missions du lieu de la capsule. */
  revenirIci(): void {
    this.lieu = null
  }

  /** À appeler quand la capsule part ou change de vitesse : les temps de trajet sont à recalculer. */
  oublierDurees(): void {
    this.durees.clear()
  }

  constructor(private element: HTMLElement, choix: ChoixMissions) {
    element.addEventListener('click', (e) => {
      const l = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-lieu-filtre]')
      if (l) {
        this.lieu = l.dataset.lieuFiltre || null
        if (this.derniersArguments) this.afficher(...this.derniersArguments)
        return
      }
      const f = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filtre]')
      if (f) {
        this.filtre = (f.dataset.filtre || null) as Maison | null
        try { localStorage.setItem(CLE_FILTRE, this.filtre ?? '') } catch { /* pas de mémoire : tant pis */ }
        if (this.derniersArguments) this.afficher(...this.derniersArguments)
        return
      }
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choix]')
      if (!b || b.disabled) return
      if (b.dataset.choix === 'accepter') choix.accepter(Number(b.dataset.id))
      else if (b.dataset.choix === 'voir') choix.voir(Number(b.dataset.id))
      else if (b.dataset.choix === 'aller') choix.allerA(b.dataset.lieu!)
      else if (b.dataset.choix === 'agir') choix.agir()
      else if (b.dataset.choix === 'abandonner') choix.abandonner()
    })
  }

  /** ici : le lieu (tableau) où est la capsule. */
  afficher(jeu: Jeu, t: number, vitesse: number, maintenant: number, ici: string): void {
    this.derniersArguments = [jeu, t, vitesse, maintenant, ici]
    const lieu = this.lieu ?? ici
    let html = ''
    const ec = jeu.enCours
    if (ec) {
      const fin = jeu.finAction()
      const etapes = ec.contrat.etapes.map((e, i) => {
        const etat = i < ec.etape ? 'faite' : i === ec.etape ? 'actuelle' : ''
        return `<li class="${etat}">${i < ec.etape ? '✓ ' : ''}${VERBES[e.action].charAt(0)}${VERBES[e.action].slice(1).toLowerCase()} — ${e.lieu}</li>`
      }).join('')
      const e = jeu.etapeActuelle()!
      const plan = jeu.mission.plan
      const enRoute = jeu.mission.phase(t) === 'trajet' && plan?.cible === e.lieu
      const bouton = fin !== null
        ? `<div class="action-en-cours">${NOMS_ACTIONS[e.action]} en cours · ${texteSecondes(fin - t)}</div>`
        : enRoute
          ? `<div class="action-en-cours">En route vers ${e.lieu} · arrivée dans ${texteRestant(plan!.arrivee - t)}</div>`
          : jeu.surPlace(t)
          ? `<button type="button" class="principal" data-choix="agir">${VERBES[e.action]}</button>`
          : `<button type="button" class="principal" data-choix="aller" data-lieu="${e.lieu}">Y ALLER</button><span class="consigne">${consigne(e)} · ${texteDistance(distanceDepuisCapsule(e.lieu, t))}</span>`
      html += `<h3>Contrat en cours</h3><div class="contrat en-cours"><div class="carte-mission">${tuile(ec.contrat)}<div class="corps-mission"><div class="titre"><b>${titreContrat(ec.contrat)}</b><span class="prix">${avec('credits', String(ec.contrat.recompense))}</span></div>`
        + `${avec('poste', POSTES[ec.contrat.genre], 'poste')}</div></div><ol>${etapes}</ol><div class="actions">${bouton}</div>`
        + `<button type="button" class="abandon" data-choix="abandonner">Abandonner le contrat</button></div>`
    }
    // Missions proposées : de la plus proche à la plus lointaine en temps de trajet (demande d'Adrien, 17/10/2026).
    // Le système : une rangée des neuf systèmes, celui de la capsule marqué « ici ».
    html += '<h3>Contrats proposés</h3><div class="filtre-lieux">' + TABLEAUX.filter((x) => x.centre === x.systeme).map((x) => {
      return `<button type="button" data-lieu-filtre="${x.lieu === ici ? '' : x.lieu}" class="${x.lieu === lieu ? 'actif' : ''}">${x.lieu}${x.lieu === ici ? '<small>ici</small>' : ''}</button>`
    }).join('') + '</div><div class="filtre-maisons">'
      + `<button type="button" data-filtre=""${this.filtre === null ? ' class="actif"' : ''}>TOUTES</button>`
      + MAISONS.map((m) => `<button type="button" data-filtre="${m.maison}" class="maison-${m.maison}${this.filtre === m.maison ? ' actif' : ''}">${m.titre}</button>`).join('')
      + '</div>'
    const choisies = jeu.proposes.filter((c) => systemeDuTableau(c.tableau) === lieu && (this.filtre === null || maisonDuContrat(c) === this.filtre))
    if (!choisies.length) html += `<p class="note">Aucun contrat${this.filtre ? ` des ${titreMaison(this.filtre).toLowerCase()}` : ''} ici en ce moment.</p>`
    const triees = choisies.map((c) => ({ c, d: this.duree(jeu, c, t, vitesse, maintenant) }))
      .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity))
    for (const { c, d } of triees) {
      const trajet = d === null ? 'hors de portée' : d === 0 ? 'sur place' : texteDuree(d)
      html += `<div class="contrat"><div class="carte-mission">${tuile(c)}<div class="corps-mission">`
        + `<div class="titre"><b>${titreContrat(c)}</b><span class="prix">${avec('credits', String(c.recompense))}</span></div>`
        + `${avec('poste', POSTES[c.genre], 'poste')}<div class="vals">${avec('duree', trajet)}${portee(c)}</div>`
        + `<div class="boutons"><button type="button" data-choix="voir" data-id="${c.id}" aria-label="Voir sur la carte">${picto('voir')}</button>`
        + `<button type="button" data-choix="accepter" data-id="${c.id}"${ec ? ' disabled' : ''}>ACCEPTER</button></div></div></div></div>`
    }
    if (ec) html += '<p class="note">Un seul contrat à la fois : termine ou abandonne celui en cours.</p>'
    if (html === this.dernier) return
    const rangee = this.element.querySelector('.filtre-lieux')?.scrollLeft ?? 0
    this.element.innerHTML = this.dernier = html
    // La rangée des lieux garde sa position ; le lieu choisi reste visible.
    const lieux = this.element.querySelector<HTMLElement>('.filtre-lieux')
    if (!lieux) return
    lieux.scrollLeft = rangee
    const actif = lieux.querySelector<HTMLElement>('.actif')
    if (actif && (actif.offsetLeft < lieux.scrollLeft || actif.offsetLeft + actif.offsetWidth > lieux.scrollLeft + lieux.clientWidth)) lieux.scrollLeft = actif.offsetLeft - 10
  }
}
