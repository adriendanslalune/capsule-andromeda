// Phrases toutes faites des télégrammes (elles évitent les problèmes de langue), et textes de l'Office.
// Les bots n'emploient que des phrases sans indice : ils ne doivent jamais égarer la chasse au visiteur.

export const PHRASES = [
  'BON VOL !',
  'BIEN REÇU.',
  'MERCI, COMMISSIONNAIRE.',
  'BESOIN D’AIDE.',
  'AVARIE À BORD, JE RALENTIS.',
  'PANNES EN CASCADE : PRUDENCE.',
  'QUI VA VERS MARS ?',
  'RENDEZ-VOUS AUTOUR DE LA LUNE.',
  'BELLE VUE SUR LA TERRE CE SOIR.',
  'MOTEUR AMÉLIORÉ, ÇA FILE !',
  'CONTRAT REMPLI, PRIME TOUCHÉE.',
  'VISITEUR EN VUE ?',
  'À BIENTÔT DANS LE CIEL.',
] as const

/** Phrases des bots (sans indice de chasse). */
export const PHRASES_BOTS = [
  'BON VOL À TOUS !',
  'BELLE VUE SUR LA TERRE CE SOIR.',
  'AVARIE À BORD, JE RALENTIS.',
  'CONTRAT REMPLI, PRIME TOUCHÉE.',
  'MOTEUR AMÉLIORÉ, ÇA FILE !',
  'QUELQU’UN VERS LA LUNE ?',
  'PANNES EN CASCADE : PRUDENCE.',
  'LE MANUEL, PAGE APRÈS PAGE. COURAGE !',
  'ARRIVÉE EN ORBITE. TOUT VA BIEN.',
  'QUI A VU LE VISITEUR CETTE SAISON ?',
] as const

/** Réponses des bots à un télégramme du joueur. */
export const REPONSES_BOTS = ['BIEN REÇU !', 'MERCI, BON VOL.', 'REÇU 5 SUR 5.', 'ENTENDU, COMMISSIONNAIRE.', 'HA HA ! BIEN REÇU.'] as const

export const OFFICE = {
  nom: 'O.N.V.I.',
  bienvenue: 'BIENVENUE À BORD DE LA C-58. LE MANUEL EST VOTRE SEUL GUIDE. BON VOL.',
  contrats: 'NOUVEAUX CONTRATS DE LA SEMAINE AFFICHÉS À L’OFFICE.',
} as const
