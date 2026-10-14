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
  TYPES_CONTRATS,
} from '../donnees/economie'
import type { ContratEnCours, EtatPartie, OffreContrat } from './etat'
import { tropheesDArrivee, verifierTropheesPaliers } from './trophees'
import { distance, lieuDArrivee, positionAstre, seuilArrivee, type Destination } from './fusee'
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
//
// Décisions d'Adrien (13/10/2026) : contrats renouvelés chaque semaine (lundi 00:00 UTC), les mêmes pour tous ;
// 3 contrats en cours au plus ; accepter un contrat ne change pas la destination ; prime = base (la même pour
// tous, soumise plus tard au cours) + bonus selon la distance du joueur qui l'accepte.

/** Lundi (00:00 UTC) de la semaine de l'instant t, au format AAAA-MM-JJ. */
export function semaineUTC(t: number): string {
  const d = new Date(t)
  const joursDepuisLundi = (d.getUTCDay() + 6) % 7
  const lundi = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - joursDepuisLundi)
  return new Date(lundi).toISOString().slice(0, 10)
}

/** Nom d'un lieu dans une phrase (« la Lune », « la Terre », « l'ISS », « Titan »). */
function lieu(destination: NomCorps): string {
  if (destination === 'Soleil') return 'le Soleil'
  if (destination === 'Lune') return 'la Lune'
  if (destination === 'Terre') return 'la Terre'
  if (destination === 'ISS') return 'l’ISS'
  return destination
}

/** Élision devant une voyelle : « près de Obéron » → « près d'Obéron ». */
function elider(texte: string): string {
  return texte.replace(/(^|\s)de ([AEIOUYÉÈÊÂÎÔ])/g, '$1d’$2').replace(/(^|\s)de le /g, '$1du ').replace(/(^|\s|’)à le /g, '$1au ')
}

/**
 * Les contrats d'une semaine (désignée par la date de son lundi), identiques pour tous les joueurs
 * (tirage à graine = AAAAMMJJ du lundi). Pour chacun : un système tiré au hasard (une chance sur 8), puis un corps
 * de ce système (la planète, un de ses satellites ; la Lune ou l'ISS pour la Terre), sans doublon dans la semaine.
 */
export function contratsDeLaSemaine(lundi: string): OffreContrat[] {
  const hasard = mulberry32(Number(lundi.replace(/-/g, '')))
  const offres: OffreContrat[] = []
  const destinations = new Set<NomCorps>()
  while (offres.length < CONTRATS.parSemaine) {
    // Une chance sur 9 : le Soleil ; sinon un système planétaire.
    const systeme = choisirAuHasard(hasard, [...NOMS_PLANETES, 'Soleil'] as const)
    // La Terre, c'est l'ISS : un contrat pour la Terre se remplit à l'amarrage.
    const destination = systeme === 'Soleil' ? 'Soleil' : lieuDArrivee(choisirAuHasard(hasard, corpsDuSysteme(systeme)))
    const modele = TYPES_CONTRATS[entierAuHasard(hasard, TYPES_CONTRATS.length)]
    const objet = choisirAuHasard(hasard, modele.objets)
    if (destinations.has(destination)) continue
    destinations.add(destination)
    offres.push({
      id: `${lundi}-${offres.length}`,
      type: modele.type,
      texte: elider(modele.texte.replace('{o}', objet).replace('{d}', lieu(destination))),
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
 * Contrats proposés à l'instant t (hors contrats déjà acceptés ou remplis) : tant que le tutoriel n'est pas fini,
 * seulement le prochain contrat du tutoriel ; ensuite, les contrats de la semaine.
 */
export function contratsProposes(etat: EtatPartie, t: number): OffreContrat[] {
  const pris = new Set([...etat.contratsFaits, ...etat.contrats.map((c) => c.id)])
  const tutoriel = CONTRATS_TUTORIEL.find((c) => !etat.contratsFaits.includes(c.id))
  if (tutoriel) return pris.has(tutoriel.id) ? [] : [{ ...tutoriel }]
  return contratsDeLaSemaine(semaineUTC(t)).filter((c) => !pris.has(c.id))
}

/**
 * Vrai si la fusée, qui ne vole pas, est déjà sur place : en orbite autour de la destination du contrat, ou assez
 * près pour y être arrivée (par exemple à côté de l'ISS pour un contrat vers la Terre).
 */
export function contratSurPlace(etat: EtatPartie, offre: OffreContrat, t: number): boolean {
  if (etat.fusee.destination !== null && etat.fusee.fenetre === null) return false
  if (etat.fusee.orbite === lieuDArrivee(offre.destination)) return true
  const dest: Destination = { type: 'astre', astre: lieuDArrivee(offre.destination) }
  return distance(etat.fusee.position, positionAstre(offre.destination, t)) <= seuilArrivee(dest)
}

/**
 * Prime proposée au joueur (CR) : arrondi(10 × cours + 10 × distance), distance en UA entre sa fusée et la
 * destination. La base est la même pour tous ; le bonus dépend de la position de chaque joueur. Le cours (1 par
 * défaut) viendra du serveur : plus un contrat est choisi, moins il rapporte (formule à décider en phase 4).
 * Si la fusée est déjà en orbite autour de la destination : prime divisée par 10 (au moins 1 CR).
 */
export function primeContrat(etat: EtatPartie, offre: OffreContrat, t: number, cours = 1): number {
  const d = distance(etat.fusee.position, positionAstre(offre.destination, t))
  const prime = Math.round(CONTRATS.primeBase * cours + CONTRATS.bonusParUA * d)
  return contratSurPlace(etat, offre, t) ? Math.max(1, Math.round(prime / CONTRATS.diviseurSurPlace)) : prime
}

/** Remplit les contrats en cours dont la destination est cet astre : primes versées, contrats notés comme faits. */
/** Nombre de contrats accomplis gardés dans l'historique. */
const HISTORIQUE_CONTRATS = 50

function remplirContrats(etat: EtatPartie, astre: NomCorps, t: number): EtatPartie {
  // Les contrats « Terre » des anciennes parties se remplissent à l'ISS.
  const remplis = etat.contrats.filter((c) => lieuDArrivee(c.destination) === lieuDArrivee(astre))
  if (remplis.length === 0) return etat
  const semaine = semaineUTC(t)
  // On ne garde que les contrats faits cette semaine et ceux du tutoriel.
  const anciens = etat.contratsFaits.filter((id) => id.startsWith(semaine) || id.startsWith('tutoriel'))
  let e: EtatPartie = {
    ...etat,
    contrats: etat.contrats.filter((c) => !remplis.includes(c)),
    contratsFaits: [...anciens, ...remplis.map((c) => c.id)],
    contratsAccomplis: [...remplis.map((c) => ({ ...c, t })), ...(etat.contratsAccomplis ?? [])].slice(0, HISTORIQUE_CONTRATS),
    stats: { ...etat.stats, contrats: etat.stats.contrats + remplis.length },
  }
  for (const c of remplis) e = crediter(e, c.prime, `Contrat ${c.destination}`, t)
  return e
}

/**
 * Accepte un contrat proposé : la prime est figée ; la destination de la fusée ne change pas.
 * Un contrat vers l'astre où la fusée est déjà en orbite est rempli aussitôt, avec une prime réduite.
 */
export function accepterContrat(etat: EtatPartie, id: string, t: number, cours = 1): Resultat {
  const offre = contratsProposes(etat, t).find((c) => c.id === id)
  if (!offre) return refuse(etat, "Ce contrat n'est pas proposé.")
  if (etat.contrats.length >= CONTRATS.maxEnCours) {
    return refuse(etat, `${CONTRATS.maxEnCours} contrats au plus en même temps.`)
  }
  const contrat: ContratEnCours = { ...offre, prime: primeContrat(etat, offre, t, cours) }
  const e: EtatPartie = { ...etat, contrats: [...etat.contrats, contrat] }
  return accepte(contratSurPlace(etat, offre, t) ? verifierTrophees(remplirContrats(e, offre.destination, t)) : e)
}

/** Abandonne un contrat en cours (sans pénalité). */
export function abandonnerContrat(etat: EtatPartie, id: string): Resultat {
  if (!etat.contrats.some((c) => c.id === id)) return refuse(etat, "Ce contrat n'est pas en cours.")
  return accepte({ ...etat, contrats: etat.contrats.filter((c) => c.id !== id) })
}

/** Destination d'un contrat, à donner à la fusée (bouton « Y aller »). */
export function destinationDuContrat(contrat: OffreContrat): Destination {
  return { type: 'astre', astre: lieuDArrivee(contrat.destination) }
}

// ---------------------------------------------------------------------------------------------------------------
// Arrivées et trophées

function ajouterTrophee(etat: EtatPartie, id: string): EtatPartie {
  return etat.trophees.includes(id) ? etat : { ...etat, trophees: [...etat.trophees, id] }
}

/** Arrivée sur une destination : contrats remplis s'ils vont là, trophées d'arrivée. */
export function traiterArrivee(etat: EtatPartie, arrivee: Destination, t: number): EtatPartie {
  let e = etat
  if (arrivee.type === 'astre') {
    e = remplirContrats(e, arrivee.astre, t)
    for (const id of tropheesDArrivee(arrivee.astre)) e = ajouterTrophee(e, id)
  }
  return verifierTrophees(e)
}

/** Records et trophées de palier et de collection (voir src/moteur/trophees.ts). */
export function verifierTrophees(etat: EtatPartie): EtatPartie {
  return verifierTropheesPaliers(etat)
}
