// Économie : crédits, améliorations du moteur, installation des modules, contrats, trophées.
// Toutes les fonctions sont pures : elles renvoient un nouvel état, sans modifier celui qu'on leur donne.

import { corpsDuSysteme, type NomCorps } from '../astro/corps'
import { NOMS_PLANETES } from '../donnees/planetes'
import {
  AMELIORATION,
  CONTRATS,
  CONTRATS_TUTORIEL,
  INSTRUMENTS,
  MODULES_A_INSTALLER,
  MODULES_DE_BASE,
  TAILLE_JOURNAL,
  TROPHEES_ARRIVEE,
  TROPHEES_DISTANCE,
  TYPES_CONTRATS,
} from '../donnees/economie'
import type { ContratEnCours, EtatPartie, OffreContrat } from './etat'
import {
  annulerDestination,
  choisirDestination,
  choisirDestinationAvecFenetre,
  distance,
  positionAstre,
  type Destination,
} from './fusee'
import { choisirAuHasard, entierAuHasard, mulberry32 } from './hasard'

/** Résultat d'une action du joueur : le nouvel état, ou la raison du refus (l'état est alors inchangé). */
export interface Resultat {
  etat: EtatPartie
  refus: string | null
}

const accepte = (etat: EtatPartie): Resultat => ({ etat, refus: null })
const refuse = (etat: EtatPartie, refus: string): Resultat => ({ etat, refus })

// ---------------------------------------------------------------------------------------------------------------
// Crédits

/** Ajoute (ou retire, si le montant est négatif) des crédits, avec une ligne au journal. */
export function crediter(etat: EtatPartie, montant: number, raison: string, t: number): EtatPartie {
  return {
    ...etat,
    credits: etat.credits + montant,
    journal: [{ t, raison, montant }, ...etat.journal].slice(0, TAILLE_JOURNAL),
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Améliorations du moteur

/** Coût de l'amélioration n (n commence à 0). */
export function coutAmelioration(n: number): number {
  const { base, facteur, palier, facteurApresPalier } = AMELIORATION
  return Math.round(n <= palier ? base * facteur ** n : base * facteur ** palier * facteurApresPalier ** (n - palier))
}

/** Achète l'amélioration suivante (une à la fois, dans l'ordre). */
export function acheterAmelioration(etat: EtatPartie, t: number): Resultat {
  const cout = coutAmelioration(etat.ameliorations)
  if (etat.credits < cout) return refuse(etat, `Il manque ${cout - etat.credits} CR.`)
  const n = etat.ameliorations + 1
  return accepte({ ...crediter(etat, -cout, `Amélioration n° ${n}`, t), ameliorations: n })
}

// ---------------------------------------------------------------------------------------------------------------
// Modules et instruments

export function estInstalle(etat: EtatPartie, code: string): boolean {
  return (MODULES_DE_BASE as readonly string[]).includes(code) || etat.modulesInstalles.includes(code)
}

/** Prochain module à installer (ils s'installent dans l'ordre), ou null s'ils le sont tous. */
export function prochainModule(etat: EtatPartie): { code: string; nom: string; prix: number } | null {
  return MODULES_A_INSTALLER.find((m) => !estInstalle(etat, m.code)) ?? null
}

/** Installe un module (le prochain dans l'ordre) ou un instrument de chasse (DET exige TEL). */
export function installer(etat: EtatPartie, code: string, t: number): Resultat {
  if (estInstalle(etat, code)) return refuse(etat, `${code} est déjà installé.`)
  const instrument = INSTRUMENTS.find((i) => i.code === code)
  const module = MODULES_A_INSTALLER.find((m) => m.code === code)
  if (!instrument && !module) return refuse(etat, `${code} n'existe pas.`)
  if (module && prochainModule(etat)?.code !== code) {
    return refuse(etat, `Il faut d'abord installer ${prochainModule(etat)!.code}.`)
  }
  if (instrument?.exige && !estInstalle(etat, instrument.exige)) {
    return refuse(etat, `Il faut d'abord installer ${instrument.exige}.`)
  }
  const prix = (instrument ?? module)!.prix
  if (etat.credits < prix) return refuse(etat, `Il manque ${prix - etat.credits} CR.`)
  const apres = crediter(etat, -prix, `Installation ${code}`, t)
  return accepte({ ...apres, modulesInstalles: [...apres.modulesInstalles, code] })
}

// ---------------------------------------------------------------------------------------------------------------
// Contrats

/** Jour UTC de l'instant t, au format AAAA-MM-JJ. */
export function jourUTC(t: number): string {
  return new Date(t).toISOString().slice(0, 10)
}

/** Nom d'un lieu dans une phrase (« la Lune », « l'ISS », « Titan »). */
function lieu(destination: NomCorps): string {
  if (destination === 'Lune') return 'la Lune'
  if (destination === 'ISS') return 'l’ISS'
  return destination
}

/**
 * Les contrats d'un jour UTC, identiques pour tous les joueurs (tirage à graine = AAAAMMJJ).
 * Pour chacun : un système tiré au hasard (une chance sur 8), puis un corps de ce système (la planète, un de ses
 * satellites ; la Lune ou l'ISS pour la Terre), sans doublon dans la journée.
 */
export function contratsDuJour(jour: string): OffreContrat[] {
  const hasard = mulberry32(Number(jour.replace(/-/g, '')))
  const offres: OffreContrat[] = []
  const destinations = new Set<NomCorps>()
  while (offres.length < CONTRATS.parJour) {
    const systeme = choisirAuHasard(hasard, NOMS_PLANETES)
    const destination = choisirAuHasard(hasard, corpsDuSysteme(systeme))
    const modele = TYPES_CONTRATS[entierAuHasard(hasard, TYPES_CONTRATS.length)]
    const objet = choisirAuHasard(hasard, modele.objets)
    if (destinations.has(destination)) continue
    destinations.add(destination)
    offres.push({
      id: `${jour}-${offres.length}`,
      type: modele.type,
      texte: modele.texte.replace('{o}', objet).replace('{d}', lieu(destination)),
      destination,
    })
  }
  return offres
}

/** Nombre de contrats du tutoriel déjà remplis. */
export function contratsTutorielFaits(etat: EtatPartie): number {
  return CONTRATS_TUTORIEL.filter((c) => etat.contratsFaits.includes(c.id)).length
}

/**
 * Contrats proposés à l'instant t : tant que le tutoriel n'est pas fini, seulement le prochain contrat du tutoriel ;
 * ensuite, les contrats du jour pas encore remplis.
 */
export function contratsProposes(etat: EtatPartie, t: number): OffreContrat[] {
  const tutoriel = CONTRATS_TUTORIEL.find((c) => !etat.contratsFaits.includes(c.id))
  if (tutoriel) return [{ ...tutoriel }]
  return contratsDuJour(jourUTC(t)).filter((c) => !etat.contratsFaits.includes(c.id))
}

/** Vrai si la fusée est déjà en orbite autour de la destination du contrat. */
export function contratSurPlace(etat: EtatPartie, offre: OffreContrat): boolean {
  return etat.fusee.orbite === offre.destination && etat.fusee.destination === null
}

/**
 * Prime proposée (CR) : max(6, arrondi((8 + 30 × √distance) × cours)), distance en UA entre la fusée et la
 * destination. Le cours (1 par défaut) viendra du serveur : plus un contrat est choisi par les joueurs, moins il
 * rapporte (idée d'Adrien du 13/10/2026, formule à décider en phase 4).
 * Si la fusée est déjà en orbite autour de la destination : prime divisée par 10 (au moins 1 CR).
 */
export function primeContrat(etat: EtatPartie, offre: OffreContrat, t: number, cours = 1): number {
  const d = distance(etat.fusee.position, positionAstre(offre.destination, t))
  const brute = (CONTRATS.primeBase + CONTRATS.primeParRacineUA * Math.sqrt(d)) * cours
  const prime = Math.max(CONTRATS.primeMinimum, Math.round(brute))
  return contratSurPlace(etat, offre) ? Math.max(1, Math.round(prime / CONTRATS.diviseurSurPlace)) : prime
}

/** Remplit le contrat en cours : prime versée, contrat noté comme fait. */
function remplirContrat(etat: EtatPartie, t: number): EtatPartie {
  const c = etat.contrat
  if (!c) return etat
  const jour = jourUTC(t)
  // On ne garde que les contrats faits aujourd'hui et ceux du tutoriel.
  const faits = [...etat.contratsFaits.filter((id) => id.startsWith(jour) || id.startsWith('tutoriel')), c.id]
  const apres = crediter(etat, c.prime, `Contrat ${c.destination}`, t)
  return { ...apres, contrat: null, contratsFaits: faits, stats: { ...apres.stats, contrats: apres.stats.contrats + 1 } }
}

/**
 * Accepte un contrat proposé : la prime est figée et la destination fixée (départ maintenant, ou à la fenêtre de
 * tir). Un contrat vers l'astre où la fusée est déjà en orbite est rempli aussitôt, avec une prime réduite.
 */
export function accepterContrat(etat: EtatPartie, id: string, t: number, vitesseKmS: number,
  depart: 'maintenant' | 'fenetre' = 'maintenant', cours = 1): Resultat {
  if (etat.contrat) return refuse(etat, 'Un contrat est déjà en cours.')
  const offre = contratsProposes(etat, t).find((c) => c.id === id)
  if (!offre) return refuse(etat, "Ce contrat n'est pas proposé.")
  const contrat: ContratEnCours = { ...offre, prime: primeContrat(etat, offre, t, cours) }
  if (contratSurPlace(etat, offre)) return accepte(verifierTrophees(remplirContrat({ ...etat, contrat }, t)))
  const dest: Destination = { type: 'astre', astre: offre.destination }
  const fusee = depart === 'fenetre'
    ? choisirDestinationAvecFenetre(etat.fusee, dest, t, vitesseKmS)
    : choisirDestination(etat.fusee, dest)
  return accepte({ ...etat, contrat, fusee })
}

/** Change de destination (hors contrat) ; refusé pendant un contrat. */
export function changerDestination(etat: EtatPartie, dest: Destination, t: number, vitesseKmS: number,
  depart: 'maintenant' | 'fenetre' = 'maintenant'): Resultat {
  if (etat.contrat) return refuse(etat, 'Contrat en cours : annulez-le avant de changer de cap.')
  const fusee = depart === 'fenetre'
    ? choisirDestinationAvecFenetre(etat.fusee, dest, t, vitesseKmS)
    : choisirDestination(etat.fusee, dest)
  return accepte({ ...etat, fusee })
}

/** Annule la destination ; pendant un contrat, le contrat est abandonné. */
export function annulerDestinationEtContrat(etat: EtatPartie): EtatPartie {
  return { ...etat, contrat: null, fusee: annulerDestination(etat.fusee) }
}

// ---------------------------------------------------------------------------------------------------------------
// Arrivées et trophées

function ajouterTrophee(etat: EtatPartie, id: string): EtatPartie {
  return etat.trophees.includes(id) ? etat : { ...etat, trophees: [...etat.trophees, id] }
}

/** Arrivée sur une destination : contrat rempli si c'est la sienne, trophées d'arrivée. */
export function traiterArrivee(etat: EtatPartie, arrivee: Destination, t: number): EtatPartie {
  let e = etat
  if (arrivee.type === 'astre') {
    if (e.contrat && e.contrat.destination === arrivee.astre) e = remplirContrat(e, t)
    const trophee = TROPHEES_ARRIVEE[arrivee.astre]
    if (trophee) e = ajouterTrophee(e, trophee)
  }
  return verifierTrophees(e)
}

/** Met à jour la distance maximale au Soleil et attribue les trophées de contrat et de distance. */
export function verifierTrophees(etat: EtatPartie): EtatPartie {
  const dSoleil = Math.hypot(etat.fusee.position.x, etat.fusee.position.y)
  let e: EtatPartie = dSoleil > etat.stats.distanceMaxSoleil
    ? { ...etat, stats: { ...etat.stats, distanceMaxSoleil: dSoleil } }
    : etat
  if (e.stats.contrats > 0) e = ajouterTrophee(e, 'premier')
  for (const { ua, id } of TROPHEES_DISTANCE) if (e.stats.distanceMaxSoleil >= ua) e = ajouterTrophee(e, id)
  return e
}
