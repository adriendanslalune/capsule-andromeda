// Les Messages (étape 10 pour les vrais joueurs ; écrans d'abord : décision d'Adrien du 18/10/2026, « tout le fun est
// là »). En attendant le serveur, le système solaire est peuplé de bots : chacun a son pseudo, sa Maison, l'astre où il
// se trouve (ses messages arrivent avec le délai de la lumière depuis là-bas) et sa façon de parler.
// Dans les textes : {joueur} (le pseudo du joueur), {lieu} (où est le bot), {delai} (délai de la lumière entre le bot
// et la capsule), {marchandise} et {prix} (un vrai cours, sur le marché du bot), {marche} (« la Terre », « Mars »…).

import type { Maison } from './maisons'

export interface Bot {
  pseudo: string; maison: Maison; lieu: string
  /** Le marché du système où il se trouve. */
  marche: string
  /** Monolithes trouvés (son statut dans les Messages). */
  monolithes: number
  /**
   * Ses escales (décision d'Adrien du 19/10/2026 : les bots voyagent) : il va de l'une à l'autre, la première est son
   * port d'attache. Et la vitesse max de son moteur (km/s), selon les niveaux du jeu.
   */
  escales: string[]
  vitesse: number
  /**
   * Bavard : il parle dans le chat et on peut lui écrire. Les autres sont des figurants (décision d'Adrien du
   * 20/10/2026) : des PNJ qui habillent le monde, comme dans un MMORPG, sans qu'on puisse leur parler.
   */
  bavard: boolean
}

/** Les bavards : une douzaine de capitaines PNJ qui font vivre les Messages. */
const BAVARDS: readonly Omit<Bot, 'bavard'>[] = [
  { pseudo: 'Mme_Ferraille', maison: 'nettoyeurs', lieu: 'Lune', marche: 'Terre', monolithes: 64, escales: ['Lune', 'Terre', 'ISS'], vitesse: 240 },
  { pseudo: 'VEGA', maison: 'mercenaires', lieu: 'Lune', marche: 'Terre', monolithes: 8, escales: ['Lune', 'Terre', 'Mars', 'Phobos'], vitesse: 3840 },
  { pseudo: 'ORION_77', maison: 'ingenieurs', lieu: 'Phobos', marche: 'Mars', monolithes: 132, escales: ['Phobos', 'Deimos', 'Mars'], vitesse: 960 },
  { pseudo: 'Babouchka', maison: 'nettoyeurs', lieu: 'Vénus', marche: 'Vénus', monolithes: 271, escales: ['Vénus', 'Mercure', 'Terre'], vitesse: 1920 },
  { pseudo: 'Kepler9', maison: 'ingenieurs', lieu: 'Callisto', marche: 'Jupiter', monolithes: 23, escales: ['Callisto', 'Ganymède', 'Europe', 'Io'], vitesse: 3840 },
  { pseudo: 'Nemo_II', maison: 'mercenaires', lieu: 'Titan', marche: 'Saturne', monolithes: 517, escales: ['Titan', 'Encelade', 'Rhéa', 'Japet', 'Téthys'], vitesse: 7680 },
  { pseudo: 'Pipelette', maison: 'ingenieurs', lieu: 'Lune', marche: 'Terre', monolithes: 3, escales: ['Lune', 'ISS', 'Terre'], vitesse: 120 },
  { pseudo: 'Le_Vieux_Ras', maison: 'nettoyeurs', lieu: 'Neptune', marche: 'Neptune', monolithes: 1000, escales: ['Neptune', 'Triton', 'Néréide'], vitesse: 15360 },
  { pseudo: 'Lune_Rousse', maison: 'mercenaires', lieu: 'Mars', marche: 'Mars', monolithes: 41, escales: ['Mars', 'Phobos', 'Deimos', 'Lune'], vitesse: 3840 },
  { pseudo: 'Comète_Rieuse', maison: 'nettoyeurs', lieu: 'Mercure', marche: 'Mercure', monolithes: 12, escales: ['Mercure', 'Vénus'], vitesse: 960 },
  { pseudo: 'Zinzolin', maison: 'ingenieurs', lieu: 'Uranus', marche: 'Uranus', monolithes: 88, escales: ['Uranus', 'Titania', 'Obéron', 'Miranda'], vitesse: 7680 },
  { pseudo: 'Gaston_Vrac', maison: 'nettoyeurs', lieu: 'Europe', marche: 'Jupiter', monolithes: 0, escales: ['Europe', 'Io', 'Ganymède'], vitesse: 1920 },
]

/**
 * Les figurants (décision d'Adrien du 20/10/2026 : une centaine de bots en tout) : des capitaines PNJ tirés une fois
 * pour toutes (les mêmes pour tous), répartis dans le système (beaucoup autour de la Terre, de moins en moins loin du
 * Soleil), qui voyagent d'escale en escale et passent des ordres à la Bourse, mais ne parlent pas.
 */
const NOMS_FIGURANTS = ['Ardoise', 'Rouille', 'Nova', 'Brume', 'Zéphyr', 'Cobalt', 'Lichen', 'Orage', 'Sextant', 'Gravier', 'Mistral',
  'Albatros', 'Plancton', 'Saturnin', 'Boussole', 'Lanterne', 'Pollux', 'Castor', 'Sirocco', 'Basalte', 'Mirabelle', 'Écume', 'Tournesol',
  'Calypso', 'Figaro', 'Hublot', 'Quartz', 'Gargouille', 'Pistache', 'Balthazar', 'Marmotte', 'Céleste', 'Tonnerre', 'Ferblanc',
  'Opaline', 'Escarbille', 'Taupe', 'Chardon', 'Vermeil', 'Grelot', 'Anis', 'Cormoran', 'Fusain', 'Mandarine']
const SUFFIXES_FIGURANTS = ['_7', '_II', '42', '_Rouge', '_3000', '_Bleu', '_Jr', '99', '_X', '_Nord', '13', '_Sud']
/** Les régions où ils vivent : escales, comptoir, vitesse de moteur (min, max) et poids (part des figurants). */
const REGIONS_FIGURANTS: readonly { escales: string[]; marche: string; vitesses: [number, number]; poids: number }[] = [
  { escales: ['ISS', 'Lune', 'Terre', 'Tiangong', 'Hubble'], marche: 'Terre', vitesses: [60, 480], poids: 40 },
  { escales: ['Mars', 'Phobos', 'Deimos'], marche: 'Mars', vitesses: [960, 3840], poids: 20 },
  { escales: ['Io', 'Europe', 'Ganymède', 'Callisto'], marche: 'Jupiter', vitesses: [1920, 7680], poids: 14 },
  { escales: ['Titan', 'Encelade', 'Rhéa', 'Japet', 'Téthys'], marche: 'Saturne', vitesses: [3840, 15360], poids: 10 },
  { escales: ['Vénus', 'Mercure'], marche: 'Vénus', vitesses: [480, 1920], poids: 8 },
  { escales: ['Uranus', 'Titania', 'Obéron', 'Miranda'], marche: 'Uranus', vitesses: [7680, 15360], poids: 4 },
  { escales: ['Neptune', 'Triton', 'Néréide'], marche: 'Neptune', vitesses: [7680, 15360], poids: 4 },
]
const MAISONS_FIGURANTS: readonly Maison[] = ['nettoyeurs', 'ingenieurs', 'mercenaires']

function figurants(n: number): Bot[] {
  const hasard = (k: number, s: number) => { const x = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x) }
  const total = REGIONS_FIGURANTS.reduce((a, r) => a + r.poids, 0)
  const pris = new Set(BAVARDS.map((b) => b.pseudo))
  const l: Bot[] = []
  for (let k = 0; l.length < n; k++) {
    const pseudo = `${NOMS_FIGURANTS[Math.floor(hasard(k, 1) * NOMS_FIGURANTS.length)]}${SUFFIXES_FIGURANTS[Math.floor(hasard(k, 2) * SUFFIXES_FIGURANTS.length)]}`
    if (pris.has(pseudo)) continue
    pris.add(pseudo)
    let x = hasard(k, 3) * total, r = REGIONS_FIGURANTS[0]
    for (const region of REGIONS_FIGURANTS) { if (x < region.poids) { r = region; break } x -= region.poids }
    // Ses escales : deux à quatre lieux de sa région, la première est son port d'attache.
    const escales = r.escales.map((e, i) => ({ e, x: hasard(k, 20 + i) })).sort((a, b) => a.x - b.x).map((o) => o.e).slice(0, Math.min(r.escales.length, 2 + Math.floor(hasard(k, 4) * 3)))
    const niveaux = Math.round(Math.log2(r.vitesses[1] / r.vitesses[0]))
    l.push({
      pseudo, maison: MAISONS_FIGURANTS[Math.floor(hasard(k, 5) * 3)], lieu: escales[0], marche: r.marche,
      monolithes: Math.floor(Math.pow(hasard(k, 6), 2.5) * 400), escales, vitesse: r.vitesses[0] * 2 ** Math.floor(hasard(k, 7) * (niveaux + 1)), bavard: false,
    })
  }
  return l
}

/** Tous les bots : les bavards et les figurants, une centaine. */
export const BOTS: readonly Bot[] = [...BAVARDS.map((b) => ({ ...b, bavard: true })), ...figurants(88)]
/** Ceux qui parlent (chat, privés, rumeurs). */
export const BOTS_BAVARDS: readonly Bot[] = BOTS.filter((b) => b.bavard)

/** Bavardages du canal général. */
export const BAVARDAGES: readonly string[] = [
  'Quelqu\'un a vu passer un chasseur près de {lieu} ? Mes boucliers grésillent encore.',
  '{marchandise} à {prix} cr. la tonne ici, au comptoir de {marche}. Qui dit mieux ?',
  'Bonjour de {lieu} ! Enfin… bonjour d\'il y a {delai}. 😄',
  'Encore une épave autour de Hubble. Personne ne range rien dans ce système !',
  'Astuce de vieux briscard : triez vite, la série monte et on récupère plus de matériaux.',
  'Qui a laissé une chaussette dans l\'épave de Vanguard 1 ?? 🧦',
  'Mon bloc Énergie a encore lâché. Le manuel dit de couper le câble β7… je tremble.',
  'Ici {lieu}. Tout est calme. Trop calme.',
  'Quelqu\'un sait pourquoi Triton a l\'air… bizarre ? 🤔',
  'Besoin de {marchandise} pour monter mon moteur. Au comptoir de {marche}, c\'est {prix} cr. la tonne.',
  'Missile intercepté de justesse près de {lieu}. Vive les intercepteurs !',
  'Le délai de la lumière, c\'est l\'enfer : le temps qu\'un message arrive, le capitaine est déjà reparti.',
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
  'Il paraît que les nouvelles de Pluton ont presque cinq heures quand elles arrivent ici.',
  'J\'ai croisé {joueur} sur le radar tout à l\'heure. Salut à toi ! 👋',
  'Nouvelle épave repérée près de {lieu}, avis aux Nettoyeurs !',
  'Acheté du {marchandise} au comptoir de {marche} ({prix} cr. la tonne). Un moteur neuf, ça se mérite.',
  'Quelqu\'un a déjà vu un alien de près ? Paraît qu\'ils sentent le chou.',
]

/** Le canal de chaque Maison (réservé à ses membres). */
export const BAVARDAGES_MAISON: Readonly<Record<Maison, readonly string[]>> = {
  nettoyeurs: [
    'Les gars, l\'épave de Kosmos 482 est pleine de titane. Je vous la laisse. 🎁',
    'Rappel entre nous : le hublot va dans le verre, pas dans les métaux !',
    'Soute pleine, je rentre vendre au comptoir de {marche}. Le verre est à {prix} cr.',
    'Qui veut faire une course de tri ? 30 secondes, le meilleur gagne une ration. 😂',
  ],
  ingenieurs: [
    'Amarrage à {lieu} : arrivez à moins de 0,1 m/s, sinon c\'est le pare-chocs qui prend. 🔧',
    'Le panneau du relais de {lieu} a encore grillé un fusible. Qui a le manuel sous la main ?',
    'Je cherche du cuivre pour rebobiner un moteur. Il est à {prix} cr. au comptoir de {marche}, ça va.',
    'Règle d\'or : on coupe le courant AVANT de toucher aux câbles. Je dis ça, je dis rien. ⚡',
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
  marche: ['Ici, au comptoir de {marche}, le {marchandise} est à {prix} cr. la tonne.', 'J\'en vends ! {prix} cr. la tonne, viens me voir vers {lieu}.', 'Le {marchandise} ? {prix} cr. au comptoir de {marche}. Ça ne bouge presque pas.'],
  aide: ['Tiens bon {joueur} ! Suis le manuel, et coupe le bon câble. 😅', 'J\'arrive… enfin, je suis vers {lieu}, ça va prendre un moment. 😬', 'Une panne ? Capsule › Réparation, et le manuel est ton meilleur ami.'],
  merci: ['De rien {joueur} !', 'Avec plaisir. 🙂', 'Pas de quoi, entre capitaines !'],
  alien: ['Fais gaffe, il y en a plein vers {lieu}.', 'Mets des crans dans les boucliers, et vise leur bouclier d\'abord.', 'Andromède n\'a qu\'à bien se tenir ! 💥'],
  question: ['Bonne question… je dirais oui ? 🤷', 'Demande aux Ingénieurs, ils savent tout.', 'Aucune idée. Mais je te dis ça dans {delai}. 😄'],
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

/**
 * Le parrain de chaque Maison (un de ses capitaines) : il signe la lettre d'invitation et écrit au joueur en privé
 * (décision d'Adrien du 19/10/2026 : appartenir à une Maison est un événement attendu).
 */
export const PARRAINS: Readonly<Record<Maison, string>> = { nettoyeurs: 'Le_Vieux_Ras', ingenieurs: 'ORION_77', mercenaires: 'Nemo_II' }

/** La lettre d'invitation de chaque Maison ({joueur} : le pseudo du joueur). */
export const LETTRES_INVITATION: Readonly<Record<Maison, string[]>> = {
  nettoyeurs: [
    'À l\'attention de {joueur},',
    'Depuis des semaines, on te voit passer d\'épave en épave, trier le titane du rebut sans faire de chichis. Ici, sur les franges de Neptune, ça se remarque.',
    'La Maison des Nettoyeurs ne court pas après les médailles : elle remet de l\'ordre dans le ciel, une carcasse après l\'autre. Il nous manque des mains comme les tiennes.',
    'Si le cœur t\'en dit, ta place est prête.',
  ],
  ingenieurs: [
    'À l\'attention de {joueur},',
    'Des satellites qui se rallument, des cargaisons amarrées au millimètre : ton travail ne passe pas inaperçu sur les relais de Mars.',
    'La Maison des Ingénieurs tient debout tout ce qui flotte dans le système solaire. Nous avons besoin de gens qui lisent le Manuel jusqu\'au bout.',
    'Rejoins-nous : on te gardera un fer à souder chaud.',
  ],
  mercenaires: [
    'À l\'attention de {joueur},',
    'Les chasseurs d\'Andromède commencent à connaître ta silhouette, et ils ne l\'aiment pas. Nous, si.',
    'La Maison des Mercenaires garde les convois et nettoie le ciel des intrus. On ne promet ni repos ni gloire, seulement de bons camarades et du travail bien payé.',
    'Une place t\'attend dans nos rangs.',
  ],
}

/** Le message privé du parrain, à l'invitation, puis à l'arrivée dans la Maison. */
export const MOTS_DU_PARRAIN: Readonly<Record<Maison, { invitation: string; bienvenue: string }>> = {
  nettoyeurs: {
    invitation: 'Salut {joueur}. La lettre de la Maison est partie, tu l\'as lue ? Prends ton temps, les épaves ne vont nulle part. 🧹',
    bienvenue: 'Bienvenue chez les Nettoyeurs, {joueur} ! Le canal de la Maison t\'est ouvert : passe dire bonjour aux autres.',
  },
  ingenieurs: {
    invitation: 'Hé {joueur} ! C\'est moi qui ai glissé ton nom pour la lettre. Réfléchis, et viens nous voir quand tu veux. 🔧',
    bienvenue: 'Te voilà Ingénieur, {joueur} ! Le canal de la Maison est ouvert : on y parle câbles, fusibles et amarrages ratés.',
  },
  mercenaires: {
    invitation: '{joueur}. Lettre reçue ? On ne la renverra pas deux fois. Mais la porte reste ouverte. ⚔️',
    bienvenue: 'Dans les rangs, {joueur}. Le canal de la Maison est ouvert : on y partage les chasseurs repérés.',
  },
}
