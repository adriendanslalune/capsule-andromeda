// Les Messages (étape 10 pour les vrais joueurs ; écrans d'abord : décision d'Adrien du 18/10/2026, « tout le fun est
// là »). En attendant le serveur, le système solaire est peuplé de bots : chacun a son pseudo, sa Maison, l'astre où il
// se trouve (ses messages arrivent avec le délai de la lumière depuis là-bas) et sa façon de parler.
// Dans les textes : {joueur} (le pseudo du joueur), {lieu} (où est le bot), {delai} (délai de la lumière entre le bot
// et la capsule), {marchandise} et {prix} (un vrai cours, sur le marché du bot), {marche} (« la Terre », « Mars »…).

import type { Maison } from './maisons'

export interface Bot { pseudo: string; maison: Maison; lieu: string; /** Le marché du système où il se trouve. */ marche: string }

export const BOTS: readonly Bot[] = [
  { pseudo: 'Mme_Ferraille', maison: 'nettoyeurs', lieu: 'Lune', marche: 'Terre' },
  { pseudo: 'VEGA', maison: 'mercenaires', lieu: 'Lune', marche: 'Terre' },
  { pseudo: 'ORION_77', maison: 'commercants', lieu: 'Phobos', marche: 'Mars' },
  { pseudo: 'Babouchka', maison: 'nettoyeurs', lieu: 'Vénus', marche: 'Vénus' },
  { pseudo: 'Kepler9', maison: 'commercants', lieu: 'Callisto', marche: 'Jupiter' },
  { pseudo: 'Nemo_II', maison: 'mercenaires', lieu: 'Titan', marche: 'Saturne' },
  { pseudo: 'Pipelette', maison: 'commercants', lieu: 'Lune', marche: 'Terre' },
  { pseudo: 'Le_Vieux_Ras', maison: 'nettoyeurs', lieu: 'Neptune', marche: 'Neptune' },
  { pseudo: 'Lune_Rousse', maison: 'mercenaires', lieu: 'Mars', marche: 'Mars' },
  { pseudo: 'Comète_Rieuse', maison: 'nettoyeurs', lieu: 'Mercure', marche: 'Mercure' },
  { pseudo: 'Zinzolin', maison: 'commercants', lieu: 'Uranus', marche: 'Uranus' },
  { pseudo: 'Gaston_Vrac', maison: 'nettoyeurs', lieu: 'Europe', marche: 'Jupiter' },
]

/** Bavardages du canal général. */
export const BAVARDAGES: readonly string[] = [
  'Quelqu\'un a vu passer un chasseur près de {lieu} ? Mes boucliers grésillent encore.',
  '{marchandise} à {prix} cr. la tonne ici, au marché de {marche}. Qui dit mieux ?',
  'Bonjour de {lieu} ! Enfin… bonjour d\'il y a {delai}. 😄',
  'Encore une épave autour de Hubble. Personne ne range rien dans ce système !',
  'Astuce de vieux briscard : triez vite, la série monte et on récupère plus de matériaux.',
  'Qui a laissé une chaussette dans l\'épave de Vanguard 1 ?? 🧦',
  'Mon bloc Énergie a encore lâché. Le manuel dit de couper le câble β7… je tremble.',
  'Ici {lieu}. Tout est calme. Trop calme.',
  'Quelqu\'un sait pourquoi Triton a l\'air… bizarre ? 🤔',
  'Le {marchandise} s\'envole au marché de {marche} : {prix} cr. la tonne ! ▲',
  'Missile intercepté de justesse près de {lieu}. Vive les intercepteurs !',
  'Le délai de la lumière, c\'est l\'enfer pour le commerce : le temps que j\'apprenne un prix, il a changé.',
  'Bon appétit à tous. Ce soir : ration n° 12, goût « purée lunaire ». 🥄',
  'Je cherche une escorte pour un convoi depuis {lieu}. Bien payé !',
  'Quelqu\'un a des intercepteurs en trop ?',
  'La Lune résiste encore et toujours à l\'envahisseur. On lâche rien ! 💪',
  'Les aliens d\'Andromède ont encore pris une station. Ça devient sérieux.',
  '{joueur}, bienvenue dans le coin ! Si tu as besoin d\'un coup de main, demande.',
  'Rappel : un Mercenaire ne fuit jamais. Il fait un repli stratégique.',
  'Trié 40 objets sans une erreur, série ×5 tout du long. Qui fait mieux ? 😎',
  'Vu de {lieu}, le Soleil est tout petit. La Terre me manque.',
  'Cherche du cuivre, je paie bien. Je suis vers {lieu}.',
  'Ma radio capte des bruits étranges depuis Uranus…',
  'Petite pensée pour ceux qui réparent leur panneau à 3 h du matin avec le manuel sur les genoux.',
  'Il paraît que le marché de Pluton est vieux de presque cinq heures quand il arrive ici. Trader là-bas, c\'est du poker.',
  'J\'ai croisé {joueur} sur le radar tout à l\'heure. Salut à toi ! 👋',
  'Nouvelle épave repérée près de {lieu}, avis aux Nettoyeurs !',
  'Le cours du {marchandise} a chuté au marché de {marche} ({prix} cr.). C\'est le moment d\'acheter. ▼',
  'Quelqu\'un a déjà vu un alien de près ? Paraît qu\'ils sentent le chou.',
]

/** Le canal de chaque Maison (réservé à ses membres). */
export const BAVARDAGES_MAISON: Readonly<Record<Maison, readonly string[]>> = {
  nettoyeurs: [
    'Les gars, l\'épave de Kosmos 482 est pleine de titane. Je vous la laisse. 🎁',
    'Rappel entre nous : le hublot va dans le verre, pas dans les métaux !',
    'Soute pleine, je rentre vendre au marché de {marche}. Le verre est à {prix} cr.',
    'Qui veut faire une course de tri ? 30 secondes, le meilleur gagne une ration. 😂',
  ],
  commercants: [
    'Entre nous : le {marchandise} est à {prix} cr. au marché de {marche}. Achetez avant que ça se sache.',
    'N\'oubliez pas : un cours qui vient de loin est un cours du passé.',
    'Je monte un convoi vers {lieu}, qui s\'associe ?',
    'Les Nettoyeurs vendent leur ferraille trop bas. Profitons-en. 🤫',
  ],
  mercenaires: [
    'Chasseur repéré entre la Terre et la Lune. Qui est dispo ?',
    'Conseil du jour : cassez leur bouclier d\'abord, le reste suit.',
    'Escorte payée 300 cr. depuis {lieu}. Volontaires ?',
    'J\'ai encore abattu un missile avec mon dernier intercepteur. Mon cœur. 😮‍💨',
  ],
}

/** Messages privés qu'un bot envoie parfois au joueur. */
export const PRIVES_SPONTANES: readonly string[] = [
  'Salut {joueur} ! Tu aurais du {marchandise} à vendre ? Je te le prends à {prix} cr. la tonne.',
  'Hé {joueur}, tu passes près de {lieu} bientôt ? J\'aurais besoin d\'un coup de main.',
  '{joueur} ! Méfie-toi, un chasseur rôde dans ton secteur.',
  'Coucou {joueur}, ça te dit de faire équipe ? 🙂',
]

/** Les réponses des bots, selon ce que le joueur a écrit. */
export type Intention = 'salut' | 'marche' | 'aide' | 'merci' | 'alien' | 'question' | 'autre'
export const REPONSES: Readonly<Record<Intention, readonly string[]>> = {
  salut: ['Salut {joueur} ! 👋', 'Bienvenue {joueur} ! Ici {lieu}, tout va bien.', 'Coucou ! Ton message a mis {delai} pour arriver jusqu\'à {lieu}. 😄', 'Bonjour bonjour {joueur} !'],
  marche: ['Ici, au marché de {marche}, le {marchandise} est à {prix} cr. la tonne.', 'J\'en vends ! {prix} cr. la tonne, viens me voir vers {lieu}.', 'Le {marchandise} ? {prix} cr. au marché de {marche} en ce moment. Mais ça bouge vite !'],
  aide: ['Tiens bon {joueur} ! Suis le manuel, et coupe le bon câble. 😅', 'J\'arrive… enfin, je suis vers {lieu}, ça va prendre un moment. 😬', 'Une panne ? Capsule › Réparation, et le manuel est ton meilleur ami.'],
  merci: ['De rien {joueur} !', 'Avec plaisir. 🙂', 'Pas de quoi, entre capitaines !'],
  alien: ['Fais gaffe, il y en a plein vers {lieu}.', 'Mets des crans dans les boucliers, et vise leur bouclier d\'abord.', 'Andromède n\'a qu\'à bien se tenir ! 💥'],
  question: ['Bonne question… je dirais oui ? 🤷', 'Demande aux Commerçants, ils savent tout.', 'Aucune idée. Mais je te dis ça dans {delai}. 😄'],
  autre: ['Haha 😄', 'Bien reçu {joueur} !', 'Message reçu cinq sur cinq depuis {lieu}.', '👍', 'Ah, ça me rappelle ma première épave…'],
}

/** Les mots qui trahissent une intention (en minuscules, sans accents). */
export const MOTS_INTENTION: readonly [Intention, readonly string[]][] = [
  ['merci', ['merci', 'thx', 'cool', 'super']],
  ['aide', ['aide', 'sos', 'panne', 'help', 'besoin', 'au secours']],
  ['alien', ['alien', 'missile', 'chasseur', 'combat', 'andromede', 'pirate']],
  ['marche', ['vend', 'achet', 'prix', 'cours', 'marche', 'ferraille', 'cuivre', 'titane', 'circuit', ' eau', 'l\'eau', 'helium', 'verre']],
  ['salut', ['salut', 'bonjour', 'coucou', 'hello', 'bonsoir', 'hey']],
]

/** Les phrases rapides, à un toucher. */
export const PHRASES_RAPIDES: readonly string[] = [
  'Salut tout le monde ! 👋', 'Qui vend du cuivre ?', 'Besoin d\'aide !', 'Un chasseur dans le coin ?', 'Merci !', '😂', '👍',
]
