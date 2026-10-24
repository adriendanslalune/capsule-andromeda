// Les PNJ et les quêtes (décisions d'Adrien du 20/10/2026). Un PNJ a un lieu fixe (satellite, station, lune,
// planète) : on lui parle en orbite à son lieu. Une quête est principale (la campagne) ou secondaire ; elle a un
// donneur, des conditions (quêtes à finir avant), des étapes qui se cochent toutes seules, et une récompense.
// Le début (Adrien, 24/10/2026) et la Lune d'après docs/campagne-detail.md. Les portraits
// viendront d'Adrien (images générées) ; en attendant, un médaillon à l'initiale.

import { PNJS_CAMPAGNE, QUETES_CAMPAGNE } from './campagne'
import type { Instrument } from './instruments'
import type { NomModule } from './modules'

export interface Pnj {
  id: string
  nom: string
  /** Qui il est, en quelques mots (sous son nom). */
  role: string
  /** Où le trouver (un astre ou un engin de la carte) : on lui parle en orbite là. */
  lieu: string
  /** Couleur de son médaillon. */
  teinte: string
  /** Son médaillon (le visage, chemin de l'image dans public/), ou null en attendant ; ses portraits : commun/portraits.ts. */
  portrait: string | null
  /** Ce qu'il dit quand il n'a rien de particulier à dire. */
  repos: string
}

export const PNJS: readonly Pnj[] = [
  {
    id: 'elsa', nom: 'Elsa Varga', role: 'Commandante de la Résistance', lieu: 'ISS', teinte: '#f3c2b0', portrait: 'portraits/elsa-medaillon.webp',
    repos: 'L\'ISS tient encore debout, et nous aussi. Je t\'appelle à la radio dès que j\'ai du nouveau.',
  },
  {
    id: 'keita', nom: 'Dr Amadou Keïta', role: 'Sélénologue en exil', lieu: 'Lune', teinte: '#d7cdee', portrait: null,
    repos: 'La Lune a vu passer bien des envahisseurs. Enfin… des météores, surtout. Mais celui-là est coriace.',
  },
  {
    id: 'okafor', nom: 'Dr Samuel Okafor', role: 'Chef de la base Tycho', lieu: 'Station Tycho', teinte: '#c9d6ee', portrait: null,
    repos: 'Quarante-deux personnes sous un dôme. On tient. On tient toujours.',
  },
  {
    id: 'veilleur', nom: 'Le Veilleur', role: 'Ermite qui écoute le ciel', lieu: 'Hubble', teinte: '#bfe0e8', portrait: null,
    repos: 'Chut. J\'écoute. Le ciel parle à ceux qui se taisent.',
  },
  {
    id: 'rosa', nom: 'Rosa Mendès', role: 'Contrebandière', lieu: 'Tiangong', teinte: '#f5c6a0', portrait: null,
    repos: 'Pas de questions, pas de mensonges. Tu veux faire affaire ou tu admires la vue ?',
  },
  ...PNJS_CAMPAGNE,
]

/** Un message radio d'un PNJ (Adrien, 22/10/2026 : il répond par radio au lieu de faire revenir le joueur). */
export interface MessageRadio { pnj: string; texte: string[] }

/** Ce qui suit une étape franchie : sa part de la jauge d'une zone, la réponse radio d'un PNJ. */
export interface SuiteEtape {
  /** La part (en % du seuil) de la jauge de résistance d'une zone que remplit l'étape (décisions d'Adrien du 22/10/2026). */
  jauge?: { zone: string; part: number }
  /** La réponse radio d'un PNJ, l'étape franchie. */
  radio?: MessageRadio
}

/** Une étape de quête : ce qu'il faut faire (elle se coche toute seule). */
export type EtapeQuete = SuiteEtape & (
  /** Parler à un PNJ (en orbite à son lieu) ; texte : ce qu'il dit à ce moment. */
  | { genre: 'parler'; pnj: string; texte: string[] }
  /** Se mettre en orbite à un lieu. */
  | { genre: 'aller'; lieu: string }
  /** Finir des missions d'un genre (chasser, depanner…), éventuellement dans un système. */
  | { genre: 'mission'; mission: string; systeme?: string; nombre: number; texte: string }
  /** Apporter des marchandises en orbite à un lieu (elles quittent la soute à l'arrivée). */
  | { genre: 'livrer'; lieu: string; marchandises: Record<string, number> }
  /** Trouver des monolithes. */
  | { genre: 'monolithes'; nombre: number }
  /** Porter la jauge de résistance d'une zone à 100 % (décisions d'Adrien du 21/10/2026). */
  | { genre: 'jauge'; zone: string }
  /** L'assaut final contre le vaisseau amiral d'une zone (un combat de boss, en orbite autour d'elle). */
  | { genre: 'assaut'; zone: string }
  /** Libérer des zones, dans l'ordre qu'on veut. */
  | { genre: 'liberer'; zones: string[]; texte: string }
  /** Abattre des chasseurs (en contrat ou non), éventuellement dans un système. */
  | { genre: 'chasseurs'; nombre: number; systeme?: string; texte: string }
  /** Capter un signal à la radio (fréquence en MHz, donnée par la quête) dans un système ; il émet tant que l'étape dure. */
  | { genre: 'signal'; frequence: number; systeme: string; auteur: string; lieu: string; texte: string; enonce: string }
  /** Repérer au radar : un chasseur quelconque (sans lieu), ou ce qui se cache près d'un lieu (radar allumé à portée). */
  | { genre: 'radar'; lieu?: string; texte: string }
  /** Retrouver un Disparu (déjà retrouvé : l'étape se coche aussitôt). */
  | { genre: 'disparu'; nom: string }
  /** Installer un moteur d'au moins ce niveau. */
  | { genre: 'moteur'; niveau: number }
  /** Réparer un module de la capsule sur le panneau. */
  | { genre: 'reparer'; module: NomModule }
  /** Envoyer un PING et recevoir son écho. */
  | { genre: 'ping' })

export interface Quete {
  id: string
  titre: string
  type: 'principale' | 'secondaire'
  /** Le PNJ qui la propose. */
  donneur: string
  /** Quêtes à avoir finies avant qu'elle soit proposée. */
  conditions: string[]
  /** Ce que dit le donneur en la proposant. */
  intro: string[]
  etapes: EtapeQuete[]
  /** Crédits gagnés à la fin. */
  recompense: number
  /** Zone libérée à la fin (la campagne). */
  libere?: string
  /** Proposée par radio (Adrien, 22/10/2026 : plus d'allers-retours) : prise d'office, son intro arrive en message. */
  parRadio?: boolean
  /** Ce qu'elle installe sur la capsule en la prenant (décision d'Adrien du 23/10/2026 : la capsule neuve n'a rien). */
  installe?: Instrument[]
  /** Ce qu'elle met dans la soute en la prenant (un colis à livrer). */
  don?: Record<string, number>
  /** Ce qu'elle installe une fois finie. */
  ouvre?: Instrument[]
  /** La fenêtre de la zone libérée : le PNJ qui l'annonce et ses mots (sinon, un texte général). */
  liberation?: { pnj: string; texte: string[] }
  /** Un module qu'elle met en panne en la prenant (la seule panne voulue : apprendre à réparer ; validé le 23/10/2026). */
  panne?: NomModule
}

export const QUETES: readonly Quete[] = [
  // --- Le début (décisions d'Adrien du 24/10/2026, qui remplacent la chaîne du tutoriel, « imbuvable ») : une quête
  // qui apprend le cœur du jeu, le moteur ; puis la Lune. Tout est installé dès le départ ; des bulles expliquent
  // chaque fenêtre la première fois qu'on l'ouvre.
  {
    id: 'q1', titre: 'Le cœur de la capsule', type: 'principale', donneur: 'elsa', conditions: [], parRadio: true,
    intro: [
      'Capitaine ? Ici Elsa Varga, à bord de l\'ISS, juste devant toi. Bienvenue dans la Résistance. Il y a six mois, Andromède a encerclé toutes les planètes du système solaire. Nous, on se bat avec ce qu\'on a.',
      '(souci) Ce qu\'on a, c\'est ta capsule. Son cœur, c\'est son moteur, et 30 km/s, pour l\'espace, c\'est lent. Ouvre l\'onglet Capsule : tu y verras ton moteur, le prix du suivant, et ce qu\'il demande en matériaux.',
      '(joie) L\'argent se gagne avec des contrats (Journal › CONTRATS). Les contrats VIDER des Nettoyeurs rapportent aussi des matériaux : ce que tu tries dans les épaves file droit dans ta soute. Améliore ce moteur, et rappelle-moi.',
    ],
    etapes: [
      {
        genre: 'moteur', niveau: 2,
        radio: { pnj: 'elsa', texte: [
          '(joie) Deux fois plus vite ! Tu as compris le principe, capitaine : des contrats et des quêtes pour gagner de l\'argent, un meilleur moteur pour aller plus vite et plus loin. C\'est comme ça qu\'on traverse le système solaire.',
          'Et s\'il te manque des matériaux, pas de panique : au Comptoir du Marché, tu peux acheter et vendre ce que tu veux.',
        ] },
      },
    ],
    recompense: 100,
  },
  {
    id: 'q2', titre: 'Cap sur la Lune', type: 'principale', donneur: 'elsa', conditions: ['q1'], parRadio: true,
    intro: [
      '(souci) Capitaine, depuis trois nuits un signal monte de la Lune. Pas un des leurs : il bégaie, il se répète, il est trop humain. Le Dr Keïta est en orbite là-bas, il en sait plus. Va le voir.',
      'Avec ton moteur, il te faudra quelques heures de vol. Si tu es patient, pars tout de suite. Sinon, enchaîne les contrats et améliore encore ton moteur : au niveau 4, la Lune est à une demi-heure. À toi de juger.',
    ],
    etapes: [
      {
        genre: 'parler', pnj: 'keita', jauge: { zone: 'Lune', part: 25 }, texte: [
          'Elsa t\'envoie ? Bien. Ce signal, je l\'enregistre depuis le premier soir, et je croyais devenir fou.',
          '(joie) C\'est la base Tycho. Le Dr Okafor et quarante et une personnes, sous un dôme qui fuit. Vivants. Andromède les croit morts, et c\'est ce qui les sauve. Garde ta radio allumée : Tycho va vouloir te parler.',
        ],
      },
    ],
    recompense: 80,
  },
  // --- La Lune ---
  {
    id: 'l1', titre: 'De l\'eau pour Tycho', type: 'principale', donneur: 'okafor', conditions: ['q2'], parRadio: true,
    intro: [
      'Ici Samuel Okafor, base Tycho. Le docteur Keïta dit que vous êtes fiable. Je n\'ai plus le luxe d\'en douter.',
      'Notre recycleur d\'eau est à bout, et le dôme siffle par trois fissures. Il nous faudrait cinq tonnes d\'eau et deux tonnes de titane.',
      'Le Comptoir de la Terre en vend. Déposez-les à la Station Tycho, en orbite au-dessus de nous : on les descendra de nuit. Et merci. Pardon : merci d\'avance. Ici on a perdu l\'habitude.',
    ],
    etapes: [
      {
        genre: 'livrer', lieu: 'Station Tycho', marchandises: { Eau: 5, Titane: 2 }, jauge: { zone: 'Lune', part: 25 },
        radio: { pnj: 'okafor', texte: ['Les cuves sont pleines ! Quelqu\'un s\'est douché, contre toutes les règles. On ne l\'a pas puni. Le dôme ne siffle plus. Merci, capitaine. Cette fois, je le dis au présent.'] },
      },
    ],
    recompense: 150,
  },
  {
    id: 'l2', titre: 'Le relais Apollo', type: 'principale', donneur: 'keita', conditions: ['l1'], parRadio: true,
    intro: [
      'Pour parler vraiment avec Tycho, il nous faut un relais au-dessus de la face cachée. Le nôtre est en panne depuis le premier jour.',
      'Les Ingénieurs ont toujours un engin à remettre en état : prends un contrat RÉPARER. Ensuite, profite d\'être là-haut pour jeter un œil autour de la Lune, radar allumé. Okafor croit qu\'ils cachent quelque chose de gros.',
    ],
    etapes: [
      { genre: 'mission', mission: 'depanner', systeme: 'Terre', nombre: 1, texte: 'Répare un engin (contrat RÉPARER des Ingénieurs)', jauge: { zone: 'Lune', part: 15 } },
      {
        genre: 'radar', lieu: 'Lune', texte: 'Allume le radar près de la Lune : quelque chose s\'y cache', jauge: { zone: 'Lune', part: 15 },
        radio: { pnj: 'keita', texte: [
          'Un vaisseau énorme, immobile, ses feux à 4,7 secondes d\'intervalle… Le Séléné.',
          'Un vaisseau amiral, rien que ça, collé contre la Lune comme une tique. C\'est lui qui tient la Lune. Elsa veut te parler.',
        ] },
      },
    ],
    recompense: 150,
  },
  {
    id: 'l3', titre: 'Le Séléné', type: 'principale', donneur: 'elsa', conditions: ['l2'], parRadio: true,
    intro: [
      'Un amiral. Seul, tu n\'as aucune chance, et je le sais. Mais on ne sera pas seuls : toute la Résistance va se lever autour de la Lune.',
      'Il manque encore un peu de feu : des contrats, des chasseurs, tout ce que tu fais autour de la Lune compte. Quand la jauge sera pleine, tu lances l\'assaut. Pour Tycho. Pour nous tous.',
    ],
    etapes: [
      { genre: 'jauge', zone: 'Lune' },
      {
        genre: 'assaut', zone: 'Lune',
        radio: { pnj: 'elsa', texte: ['(joie) La Lune est libre. Et la Compagnie Lunaire de Tycho rouvre ses bureaux : son action entre en Bourse. Je t\'ouvre l\'accès, capitaine (Marché › BOURSE). Achète, vends, et ne mise jamais ce que tu n\'as pas.'] },
      },
    ],
    ouvre: ['bourse'],
    liberation: { pnj: 'okafor', texte: [
      'Ici Tycho. Nous sortons. Pour la première fois depuis des mois, nous voyons la Terre se lever sans personne entre elle et nous.',
      'Quarante-deux personnes vous disent merci. Et la balise sous nos pieds… elle s\'est tue. Je ne sais pas si c\'est une bonne nouvelle.',
    ] },
    recompense: 400, libere: 'Lune',
  },
  // --- Quêtes secondaires ---
  {
    id: 'veilleur', titre: 'L\'oreille du Veilleur', type: 'secondaire', donneur: 'veilleur', conditions: ['q1'],
    intro: [
      'Chut. Tu les entends ? Non, bien sûr. Mille monolithes, capitaine, cachés dans tout le système. Plus vieux que nous. Ils ne répondent qu\'à ceux qui appellent.',
      'Touche le bouton PING de ta carte, et le plus proche te répond. Son écho revient à la vitesse de la lumière : il trace un cercle, et le monolithe est quelque part dessus. Déplace-toi, appelle encore, et les cercles se croisent.',
    ],
    etapes: [
      { genre: 'ping', radio: { pnj: 'veilleur', texte: ['Tu l\'as entendu ? Alors tu es des nôtres. Il en reste mille. Ceux que tu trouves iront dans ton classeur, dans les Collections. Ça ne sert à rien. C\'est pour ça que c\'est beau.'] } },
    ],
    recompense: 30,
  },
  {
    id: 'rosa', titre: 'Circuits sous le manteau', type: 'secondaire', donneur: 'rosa', conditions: ['q1'],
    intro: [
      'Toi, tu as une tête à savoir te taire. J\'ai un client qui paie bien pour des circuits anciens. Trois tonnes.',
      'Le comptoir de la Terre en regorge. Apporte-les-moi ici, sur Tiangong, et on ne s\'est jamais vus.',
    ],
    etapes: [
      { genre: 'livrer', lieu: 'Tiangong', marchandises: { 'Circuits anciens': 3 } },
      { genre: 'parler', pnj: 'rosa', texte: ['Parfait. Voilà ta part. Et si on te demande : tu livrais de l\'eau.'] },
    ],
    recompense: 120,
  },
  // --- La campagne après la Lune (src/donnees/campagne.ts) ---
  ...QUETES_CAMPAGNE,
]
