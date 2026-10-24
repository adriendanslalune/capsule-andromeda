// Les bulles d'aide (demande d'Adrien du 24/10/2026) : la première fois qu'un joueur ouvre une fenêtre, des bulles
// successives lui expliquent ce que c'est et comment s'en servir. Chacune pointe un élément de l'écran (un sélecteur ;
// null : au milieu) ; une bulle dont l'élément n'est pas à l'écran est sautée. Les explications complètes sont dans le
// Manuel.

export interface Bulle { sel: string | null; texte: string }

export const AIDES: Record<string, Bulle[]> = {
  carte: [
    { sel: '#console .etat-capsule', texte: 'La console : où est ta capsule, ton niveau de capitaine et tes crédits.' },
    { sel: '#bandeau .voyants', texte: 'Le tableau de bord : les alertes, la quête en cours, ton contrat, les échos. La suite de l\'histoire est toujours sous QUÊTE.' },
    { sel: '#commandes-carte .groupe-vue', texte: 'La vue : changer de système, revenir à ta capsule, choisir ce que montre la carte. Pour zoomer, deux doigts.' },
    { sel: '#bouton-messages', texte: 'Les Messages : les autres capitaines. Ils voyagent à la vitesse de la lumière.' },
    { sel: '#instruments', texte: 'Tes capteurs : le RADAR révèle les chasseurs d\'Andromède, le PING cherche les monolithes, la RADIO capte les Voix perdues.' },
    { sel: '#onglets', texte: 'Ta Capsule, ton Journal, le Marché, tes Collections, et le reste dans Plus, dont le Manuel : tout y est expliqué.' },
    { sel: null, texte: 'Pour aller quelque part : touche un astre ou un engin sur la carte, puis DÉPART. Bon vent, capitaine !' },
  ],
  capsule: [
    { sel: '#capsule .bloc', texte: 'Ton moteur, le cœur de ta capsule : sa vitesse décide de la durée de tes trajets.' },
    { sel: '#capsule .achat', texte: 'Le moteur suivant va deux fois plus vite. Son prix se paie en crédits, gagnés avec les contrats et les quêtes.' },
    { sel: '#capsule .materiaux-moteur', texte: 'Il demande aussi des matériaux, pris dans ta soute. Ce qui manque est marqué d\'un point : les contrats VIDER en rapportent.' },
    { sel: '#capsule .tuiles-modules', texte: 'Tes cinq modules. En panne, ils se réparent sur le panneau, avec le Manuel.' },
    { sel: '[data-sous="soute"]', texte: 'La SOUTE : ce que tu transportes, 20 t au plus.' },
    { sel: '[data-sous="armement"]', texte: 'L\'ARMEMENT, pour les combats ; la RÉPARATION, le panneau où l\'on répare les pannes.' },
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
