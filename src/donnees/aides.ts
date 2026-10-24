// Les bulles d'aide (demande d'Adrien du 24/10/2026) : la première fois qu'un joueur ouvre une fenêtre, des bulles
// successives lui expliquent ce que c'est et comment s'en servir. Chacune pointe un élément de l'écran (un sélecteur ;
// null : au milieu) ; une bulle dont l'élément n'est pas à l'écran est sautée. Les explications complètes sont dans le
// Manuel.

/** Une bulle ; avec `attendre`, pas de bouton : elle passe quand le joueur fait le geste (Adrien, 24/10/2026). */
export interface Bulle { sel: string | null; texte: string; attendre?: 'glisser' | 'zoomer' | 'capsule' | 'quete' }

export const AIDES: Record<string, Bulle[]> = {
  // Au tout début, seulement la carte et comment s'y repérer (Adrien, 24/10/2026 : pas d'avalanche d'informations ;
  // l'histoire commence après).
  carte: [
    { sel: null, texte: 'Voici la carte : le vrai système solaire, en ce moment même. Les planètes, les lunes et les engins sont à leur vraie place, à la vraie échelle.' },
    { sel: null, texte: 'Glisse un doigt sur la carte pour te déplacer. Essaie !', attendre: 'glisser' },
    { sel: null, texte: 'Écarte deux doigts pour zoomer, pince-les pour voir plus loin. À toi !', attendre: 'zoomer' },
    { sel: '[data-vue="capsule"]', texte: 'Perdu ? Ce bouton te ramène à ta capsule, où que tu sois. Touche-le.', attendre: 'capsule' },
    { sel: null, texte: 'Touche un astre ou un engin pour le voir de près et t\'y rendre. Bon vent, capitaine !' },
  ],
  // Une fois l'histoire commencée : où la retrouver.
  tableau: [
    { sel: '#bandeau .afficheur', texte: 'Une nouvelle quête ! Elle s\'affiche ici, sur le tableau de bord : son losange doré clignote. Touche-la.', attendre: 'quete' },
  ],
  capsule: [
    { sel: '#capsule .bloc', texte: 'Ton moteur, le cœur de ta capsule : sa vitesse décide de la durée de tes trajets.' },
    { sel: '#capsule .achat', texte: 'Le moteur suivant va deux fois plus vite. Son prix se paie en crédits, gagnés avec les contrats et les quêtes.' },
    { sel: '#capsule .materiaux-moteur', texte: 'Il demande aussi des matériaux, pris dans ta soute. En face de chacun : ce que tu as, sur ce qu\'il faut (0 / 0,5 t : il t\'en manque une demi-tonne). Les contrats VIDER en rapportent.' },
    { sel: '#capsule .tuiles-modules', texte: 'Tes cinq modules. En panne, ils se réparent sur le panneau, avec le Manuel.' },
    { sel: '[data-sous="soute"]', texte: 'La SOUTE : ce que tu transportes, 20 t au plus.' },
    { sel: '[data-sous="armement"]', texte: 'L\'ARMEMENT : ta coque, ton canon, tes bombes et ton bouclier, pour les combats.' },
    { sel: '[data-sous="reparation"]', texte: 'La RÉPARATION : le panneau où l\'on répare les pannes, avec le Manuel.' },
  ],
  missions: [
    { sel: '[data-journal-onglet="quetes"]', texte: 'Tes quêtes : l\'histoire (le losange doré) et les quêtes secondaires, données par les personnages que tu croises.' },
    { sel: '[data-journal-onglet="contrats"]', texte: 'Les CONTRATS : les missions des trois Maisons, payées en crédits. C\'est là qu\'on gagne sa vie.' },
  ],
  contrats: [
    { sel: '#contrats .filtre-lieux', texte: 'Chaque système a ses contrats : choisis lequel regarder. Ceux d\'ailleurs paient plus, mais il faut y aller.' },
    { sel: '#contrats .contrat', texte: 'Un contrat : sa Maison (le liseré), le poste de la capsule où il se joue, sa durée, sa prime. ACCEPTER, puis suis la feuille de route en bas de l\'écran.' },
  ],
  marche: [
    { sel: '[data-marche-onglet="comptoir"]', texte: 'Le COMPTOIR : achète et vends des matériaux, au comptoir du système où tu es en orbite (une fois sa planète libre).' },
    { sel: '[data-marche-onglet="bourse"]', texte: 'La BOURSE : les actions des compagnies du système. Tes ordres voyagent à la vitesse de la lumière jusqu\'à leur siège.' },
  ],
  collections: [
    { sel: '#collections', texte: 'Tes collections : les monolithes (avec le PING), les Voix perdues (avec la RADIO), les Disparus (avec le RADAR). Pour la gloire, et pour la curiosité.' },
  ],
  plus: [
    { sel: '.page[data-contenu="plus"]', texte: 'Tout le reste : les Messages, ton Profil, le Manuel (tout y est expliqué, à commencer par « Bien commencer »), les Réglages.' },
  ],
  radio: [
    { sel: '#radio .cadran', texte: 'Le cadran : touche-le, ou fais glisser la molette, pour changer de fréquence. Une voix nette s\'enregistre au bout de 10 secondes.' },
  ],
}
