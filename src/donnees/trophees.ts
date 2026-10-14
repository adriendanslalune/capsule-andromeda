// Trophées (décision d'Adrien du 14/10/2026 : un trophée pour chaque astre et chaque engin, et beaucoup de paliers,
// pour donner envie de voyager). Ils ne rapportent rien : ce sont des souvenirs de baroudeur.
// Le catalogue complet (un trophée par astre et par engin) est construit dans src/moteur/trophees.ts.

/** Palier : un nombre à atteindre, avec le nom et la description du trophée. */
export interface Palier {
  seuil: number
  nom: string
  description: string
}

/** Route parcourue (km). */
export const PALIERS_ROUTE: readonly Palier[] = [
  { seuil: 100_000, nom: 'Premier bond', description: 'Parcourir 100 000 km' },
  { seuil: 1e6, nom: 'Un million de kilomètres', description: 'Parcourir 1 million de km' },
  { seuil: 1e7, nom: 'Dix millions', description: 'Parcourir 10 millions de km' },
  { seuil: 1e8, nom: 'Cent millions', description: 'Parcourir 100 millions de km' },
  { seuil: 1e9, nom: 'Un milliard de kilomètres', description: 'Parcourir 1 milliard de km' },
  { seuil: 1e10, nom: 'Dix milliards', description: 'Parcourir 10 milliards de km' },
  { seuil: 3e10, nom: 'Baroudeur des confins', description: 'Parcourir 30 milliards de km' },
]

/** Plus grand éloignement du Soleil (UA). Les identifiants kuiper, helio et voyager viennent des premières versions. */
export const PALIERS_ELOIGNEMENT: readonly (Palier & { id: string })[] = [
  { id: 'ceinture', seuil: 2.2, nom: 'Ceinture d’astéroïdes', description: 'S’éloigner à 2,2 UA du Soleil' },
  { id: 'geantes', seuil: 5.2, nom: 'Chez les géantes', description: 'S’éloigner à 5,2 UA, l’orbite de Jupiter' },
  { id: 'trans-neptune', seuil: 30, nom: 'Au-delà de Neptune', description: 'S’éloigner à 30 UA' },
  { id: 'kuiper', seuil: 40, nom: 'Ceinture de Kuiper', description: 'S’éloigner à 40 UA du Soleil' },
  { id: 'helio', seuil: 120, nom: 'Héliopause', description: 'S’éloigner à 120 UA' },
  { id: 'voyager', seuil: 170, nom: 'Plus loin que Voyager 1', description: 'Dépasser 170 UA' },
  { id: 'nuage', seuil: 1000, nom: 'Vers le nuage d’Oort', description: 'S’éloigner à 1 000 UA' },
]

/** Plus petite distance au Soleil (UA). */
export const PALIERS_PROXIMITE: readonly (Palier & { id: string })[] = [
  { id: 'interieur', seuil: 0.3, nom: 'Plus près que Mercure', description: 'Passer à moins de 0,3 UA du Soleil' },
  { id: 'icare', seuil: 0.05, nom: 'Icare', description: 'Passer à moins de 0,05 UA du Soleil' },
]

/** Avaries réparées. */
export const PALIERS_AVARIES: readonly Palier[] = [
  { seuil: 1, nom: 'Premier coup de clé', description: 'Réparer une avarie' },
  { seuil: 10, nom: 'Bricoleur', description: 'Réparer 10 avaries' },
  { seuil: 25, nom: 'Mécano', description: 'Réparer 25 avaries' },
  { seuil: 50, nom: 'Mécanicien de bord', description: 'Réparer 50 avaries' },
  { seuil: 100, nom: 'Chef mécanicien', description: 'Réparer 100 avaries' },
  { seuil: 250, nom: 'Mains dans le cambouis', description: 'Réparer 250 avaries' },
  { seuil: 500, nom: 'Le manuel par cœur', description: 'Réparer 500 avaries' },
  { seuil: 1000, nom: 'Légende de l’atelier', description: 'Réparer 1 000 avaries' },
]

/** Contrats remplis (le premier garde l'identifiant « premier » des premières versions). */
export const PALIERS_CONTRATS: readonly Palier[] = [
  { seuil: 1, nom: 'Premier contrat', description: 'Accomplir un contrat' },
  { seuil: 5, nom: 'Coursier', description: 'Accomplir 5 contrats' },
  { seuil: 10, nom: 'Commissionnaire', description: 'Accomplir 10 contrats' },
  { seuil: 25, nom: 'Commissionnaire confirmé', description: 'Accomplir 25 contrats' },
  { seuil: 50, nom: 'Pilier de l’Office', description: 'Accomplir 50 contrats' },
  { seuil: 100, nom: 'Médaille de l’Office', description: 'Accomplir 100 contrats' },
  { seuil: 250, nom: 'Grand commissionnaire', description: 'Accomplir 250 contrats' },
]

/** Améliorations du moteur. */
export const PALIERS_MOTEUR: readonly Palier[] = [
  { seuil: 1, nom: 'Premier réglage', description: 'Améliorer le moteur' },
  { seuil: 5, nom: 'Moteur gonflé', description: '5 améliorations du moteur' },
  { seuil: 10, nom: 'Bolide', description: '10 améliorations' },
  { seuil: 20, nom: 'Turbo', description: '20 améliorations' },
  { seuil: 35, nom: 'Fusée de course', description: '35 améliorations' },
  { seuil: 50, nom: 'Hors catégorie', description: '50 améliorations' },
  { seuil: 75, nom: 'Mur de la lumière ?', description: '75 améliorations' },
  { seuil: 100, nom: 'Le moteur du siècle', description: '100 améliorations' },
]

/** Vitesse de croisière (km/s). */
export const PALIERS_VITESSE: readonly Palier[] = [
  { seuil: 100, nom: '100 km/s', description: 'Atteindre 100 km/s de croisière' },
  { seuil: 1000, nom: '1 000 km/s', description: 'Atteindre 1 000 km/s de croisière' },
  { seuil: 10_000, nom: '10 000 km/s', description: 'Atteindre 10 000 km/s de croisière' },
  { seuil: 100_000, nom: 'Un tiers de la lumière', description: 'Atteindre 100 000 km/s de croisière' },
]

/** Crédits en caisse. */
export const PALIERS_CREDITS: readonly Palier[] = [
  { seuil: 100, nom: 'Bas de laine', description: 'Avoir 100 CR en caisse' },
  { seuil: 1000, nom: 'Bon épargnant', description: 'Avoir 1 000 CR en caisse' },
  { seuil: 10_000, nom: 'Coffre-fort', description: 'Avoir 10 000 CR en caisse' },
  { seuil: 100_000, nom: 'Banquier de l’espace', description: 'Avoir 100 000 CR en caisse' },
]

/** Jours de service (depuis la mise en service de la fusée). */
export const PALIERS_SERVICE: readonly Palier[] = [
  { seuil: 1, nom: 'Premier jour', description: 'Un jour de service' },
  { seuil: 7, nom: 'Première semaine', description: '7 jours de service' },
  { seuil: 30, nom: 'Un mois de vol', description: '30 jours de service' },
  { seuil: 100, nom: 'Cent jours', description: '100 jours de service' },
  { seuil: 365, nom: 'Un an de vol', description: '365 jours de service' },
  { seuil: 1000, nom: 'Vieux loup de l’espace', description: '1 000 jours de service' },
]

/** Télégrammes envoyés. */
export const PALIERS_TELEGRAMMES: readonly Palier[] = [
  { seuil: 1, nom: 'Premier télégramme', description: 'Envoyer un télégramme' },
  { seuil: 10, nom: 'Correspondant', description: 'Envoyer 10 télégrammes' },
  { seuil: 50, nom: 'Plume du cosmos', description: 'Envoyer 50 télégrammes' },
]

/** Astres et engins visités (en tout). */
export const PALIERS_VISITES: readonly Palier[] = [
  { seuil: 5, nom: 'Touriste', description: 'Visiter 5 astres ou engins' },
  { seuil: 10, nom: 'Voyageur', description: 'Visiter 10 astres ou engins' },
  { seuil: 25, nom: 'Baroudeur', description: 'Visiter 25 astres ou engins' },
  { seuil: 50, nom: 'Explorateur', description: 'Visiter 50 astres ou engins' },
  { seuil: 100, nom: 'Grand explorateur', description: 'Visiter 100 astres ou engins' },
  { seuil: 250, nom: 'Cartographe du système', description: 'Visiter 250 astres ou engins' },
]

/** Visiteurs photographiés (saisons différentes). */
export const PALIERS_TROUVAILLES: readonly Palier[] = [
  { seuil: 3, nom: 'Chasseur de soucoupes', description: 'Photographier le visiteur 3 saisons' },
  { seuil: 10, nom: 'Ami des visiteurs', description: 'Photographier le visiteur 10 saisons' },
]
