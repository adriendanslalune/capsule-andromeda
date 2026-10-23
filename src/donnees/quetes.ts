// Les PNJ et les quêtes (décisions d'Adrien du 20/10/2026). Un PNJ a un lieu fixe (satellite, station, lune,
// planète) : on lui parle en orbite à son lieu. Une quête est principale (la campagne) ou secondaire ; elle a un
// donneur, des conditions (quêtes à finir avant), des étapes qui se cochent toutes seules, et une récompense.
// Le tutoriel et la Lune d'après docs/campagne-detail.md (validé par Adrien le 23/10/2026). Les portraits
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
  /** Son portrait (chemin de l'image dans public/), ou null en attendant. */
  portrait: string | null
  /** Ce qu'il dit quand il n'a rien de particulier à dire. */
  repos: string
}

export const PNJS: readonly Pnj[] = [
  {
    id: 'elsa', nom: 'Elsa Varga', role: 'Commandante de la Résistance', lieu: 'ISS', teinte: '#f3c2b0', portrait: null,
    repos: 'L\'ISS tient encore debout, et nous aussi. Je t\'appelle à la radio dès que j\'ai du nouveau.',
  },
  {
    id: 'weilan', nom: 'Wei Lan', role: 'Ingénieure de la Résistance', lieu: 'Tiangong', teinte: '#bfe5d0', portrait: null,
    repos: 'Je note tout, pour celui qui viendra après. Aujourd\'hui, j\'ai noté que tu passais dire bonjour.',
  },
  {
    id: 'joe', nom: 'Joe Hennessy', role: 'Routier de l\'espace, cargo Marguerite', lieu: 'GOES-19', teinte: '#f5d38a', portrait: null,
    repos: 'Garé au géostationnaire, comme un camion sur une aire d\'autoroute. Le café est infect, mais la vue est belle.',
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
  // --- Le tutoriel autour de la Terre (décisions d'Adrien du 23/10/2026, docs/campagne-detail.md) : des choses simples
  // et proches, une mécanique à la fois ; chaque quête installe un instrument. Petites récompenses : le moteur se paie
  // avec les contrats.
  {
    id: 't1', titre: 'Bienvenue dans la Résistance', type: 'principale', donneur: 'elsa', conditions: [],
    intro: [
      'Te voilà, capitaine. Bien arrivé ? Ta capsule sort de l\'usine : un moteur, une coque, et c\'est à peu près tout. On va arranger ça.',
      'Il y a six mois, quelque chose a éteint les étoiles du côté de Neptune. Puis ils sont arrivés : les vaisseaux d\'Andromède. Ils n\'ont pas bombardé la Terre. Ils l\'ont encerclée, comme toutes les autres planètes, et ils attendent.',
      'Ce qui reste de la Résistance tient dans cette vieille station. Nous sommes peu, mal équipés, et têtus. Toi, tu as une capsule qui vole. C\'est déjà beaucoup.',
      'Je te branche sur notre fréquence : tu recevras nos messages où que tu sois. Voilà de quoi commencer. Et garde l\'oreille ouverte, je t\'appelle bientôt.',
    ],
    etapes: [], installe: ['communications'], recompense: 50,
  },
  {
    id: 't2', titre: 'Un colis pour Tiangong', type: 'principale', donneur: 'elsa', conditions: ['t1'], parRadio: true,
    intro: ['Premier service : Wei Lan, notre ingénieure, attend des pièces à Tiangong, tout près d\'ici. Je les ai mises dans ta soute. Elle t\'expliquera mieux que moi ce qu\'on sait d\'eux.'],
    don: { 'Pièces détachées': 1 },
    etapes: [
      {
        genre: 'livrer', lieu: 'Tiangong', marchandises: { 'Pièces détachées': 1 },
        radio: { pnj: 'weilan', texte: [
          'Mes pièces ! Merci, capitaine. Ici, on répare tout avec rien.',
          'Tu veux savoir ce que je sais d\'eux ? Pas grand-chose. Quand ils passent, pas un bruit, pas une lumière : juste nos aiguilles qui tremblent. Ils ne tirent presque jamais près de la Terre. Ils surveillent.',
          'Je note tout, pour celui qui viendra après. Peut-être que c\'est toi.',
        ] },
      },
    ],
    recompense: 40,
  },
  {
    id: 't3', titre: 'De la ferraille pour Wei Lan', type: 'principale', donneur: 'weilan', conditions: ['t2'], parRadio: true,
    intro: [
      'Pour remettre Tiangong d\'aplomb, il me faut de la ferraille, et l\'orbite de la Terre en est pleine : des épaves, par centaines. Les Nettoyeurs paient pour qu\'on les vide.',
      'Ouvre ton Journal, onglet CONTRATS : ce sont les missions des Maisons, chacune avec sa prime. Prends trois contrats VIDER, trie bien ce que tu trouves, et rapporte-moi une tonne de ferraille. Le reste est à toi : ça te servira.',
    ],
    installe: ['contrats'],
    etapes: [
      { genre: 'mission', mission: 'nettoyer', systeme: 'Terre', nombre: 3, texte: 'Finis 3 contrats VIDER des Nettoyeurs (Journal › CONTRATS)' },
      {
        genre: 'livrer', lieu: 'Tiangong', marchandises: { Ferraille: 1 },
        radio: { pnj: 'weilan', texte: [
          'Joli tri. Tu as la main, et les Nettoyeurs l\'ont remarqué.',
          'Il faut que tu saches : trois Maisons se partagent le travail. Les Nettoyeurs vident et remorquent les épaves. Les Mercenaires abattent les chasseurs et escortent les convois. Les Ingénieurs réparent et livrent.',
          'Plus tu travailles pour l\'une, plus elle s\'intéresse à toi. Un jour, elle t\'invitera à la rejoindre : de meilleurs contrats, mieux payés. Rien d\'obligé, et tu peux changer d\'avis. Ton Profil te montre où tu en es.',
          'Et maintenant, ce moteur. Joe Hennessy, un routier, est garé près de GOES-19. Personne ne connaît mieux les moteurs que lui. Va le voir de ma part.',
        ] },
      },
    ],
    recompense: 50,
  },
  {
    id: 't4', titre: 'Le garage de Joe', type: 'principale', donneur: 'joe', conditions: ['t3'],
    intro: [
      'Wei Lan t\'envoie ? Fais voir ta capsule. Oh là. Trente kilomètres-seconde. Ma grand-mère allait plus vite en charrette.',
      'Chaque niveau de moteur double ta vitesse. Pour le niveau 2 : deux cents crédits et trois tonnes de ferraille. Le reste de ton tri, plus ce qui te manque.',
      'Ce qui te manque, ça s\'achète au Comptoir : je t\'ouvre l\'accès au Marché de la Terre. Achète au cours, revends au cours, et ne te fais pas avoir sur la marge.',
    ],
    installe: ['marche'],
    etapes: [
      { genre: 'moteur', niveau: 2, radio: { pnj: 'joe', texte: ['Tu l\'entends ronronner ? Deux fois plus vite. Et quand tu voudras aller sur la Lune, il en faudra deux de plus. Reviens me voir, j\'aime bien les clients.'] } },
    ],
    recompense: 0,
  },
  {
    id: 't5', titre: 'Le panneau', type: 'principale', donneur: 'weilan', conditions: ['t4'], parRadio: true,
    intro: [
      'Capitaine, une chose que personne ne t\'a dite : une capsule, ça tombe en panne. L\'usure, ou un missile. Je vais te montrer, sans danger. Je coupe ton module d\'Énergie à distance. Oui, exprès.',
      'Ouvre le panneau de réparation (Capsule › RÉPARATION), glisse vers le Manuel, et suis la section qui va bien. Si tu es vraiment coincé, le dépanneur passera, mais il prend la moitié de ton argent.',
    ],
    installe: ['reparation'], panne: 'energie',
    etapes: [
      { genre: 'reparer', module: 'energie', radio: { pnj: 'weilan', texte: ['CLONK ! J\'ai entendu d\'ici. Bravo. Garde le Manuel sous la main : il te sauvera la vie plus souvent que ton canon.'] } },
    ],
    recompense: 30,
  },
  {
    id: 't6', titre: 'Les yeux d\'Andromède', type: 'principale', donneur: 'elsa', conditions: ['t5'], parRadio: true,
    intro: [
      'Il est temps de te battre, capitaine. Leurs chasseurs sont furtifs : sans radar, tu ne les vois pas. Je t\'en fais installer un, et de quoi tirer.',
      'Allume le radar avant chaque départ : un chasseur que tu n\'as pas vu venir tire deux fois plus vite. Puis prends deux contrats ABATTRE des Mercenaires : il y a deux chasseurs tout près de la Terre. Ce sont leurs yeux. Crève-les.',
    ],
    installe: ['radar', 'armement'],
    etapes: [
      { genre: 'radar', texte: 'Repère un chasseur au radar (bouton RADAR de la carte)' },
      {
        genre: 'chasseurs', nombre: 2, systeme: 'Terre', texte: 'Abats 2 chasseurs près de la Terre (contrats ABATTRE des Mercenaires)',
        jauge: { zone: 'Lune', part: 15 },
        radio: { pnj: 'elsa', texte: ['Deux de moins. Ils en renverront, mais pour quelques jours, ils sont aveugles. Le Veilleur de Hubble a demandé à te voir. C\'est un drôle de type. Écoute-le quand même.'] },
      },
    ],
    recompense: 60,
  },
  {
    id: 't7', titre: 'L\'oreille du Veilleur', type: 'principale', donneur: 'veilleur', conditions: ['t6'],
    intro: [
      'Chut. Tu les entends ? Non, bien sûr. Mille monolithes, capitaine, cachés dans tout le système. Plus vieux que nous. Ils ne répondent qu\'à ceux qui appellent.',
      'Je t\'ai bricolé un PING. Appuie, et le plus proche te répond. Son écho revient à la vitesse de la lumière : il trace un cercle, et le monolithe est quelque part dessus. Déplace-toi, appelle encore, et les cercles se croisent.',
      'Ceux que tu trouves vont dans ton classeur, dans les Collections. Ça ne sert à rien. C\'est pour ça que c\'est beau.',
    ],
    installe: ['ping', 'collections'],
    etapes: [
      { genre: 'ping', radio: { pnj: 'veilleur', texte: ['Tu l\'as entendu ? Alors tu es des nôtres. Il en reste mille. Prends ton temps.'] } },
    ],
    recompense: 30,
  },
  {
    id: 't8', titre: 'Un signal sous la Lune', type: 'principale', donneur: 'elsa', conditions: ['t7'], parRadio: true,
    intro: [
      'Capitaine, depuis trois nuits un signal monte de la Lune. Pas un des leurs : il bégaie, il se répète, il est trop humain.',
      'Wei Lan t\'a monté une radio (bouton RADIO de la carte). Tourne le bouton jusqu\'à 4,712 MHz et cale-toi bien net. Le signal est faible, mais on l\'entend de partout autour de la Terre.',
    ],
    installe: ['radio'],
    etapes: [
      {
        genre: 'signal', frequence: 4.712, systeme: 'Terre', auteur: 'Signal de détresse', lieu: 'Base Tycho, Lune',
        texte: '… Tycho… quarante-deux… le dôme tient… si quelqu\'un nous entend… Tycho…',
        enonce: 'Capte le signal de Tycho à la radio : 4,712 MHz, près de la Terre',
        jauge: { zone: 'Lune', part: 20 },
        radio: { pnj: 'elsa', texte: ['Des survivants, à Tycho… Le Dr Keïta est en orbite lunaire, il en saura plus. Il te faut un moteur de niveau 4 pour y aller sans y passer la journée : Joe t\'expliquera. Prends des contrats, gagne de quoi payer, et pars quand tu es prêt.'] },
      },
      { genre: 'moteur', niveau: 4, radio: { pnj: 'joe', texte: ['Deux cent quarante kilomètres-seconde ! La Lune en une demi-heure. Ma grand-mère ne te reconnaîtrait pas.'] } },
      {
        genre: 'parler', pnj: 'keita', texte: [
          'Elsa t\'envoie ? Bien. Je l\'enregistre depuis le premier soir, ce signal, et je croyais devenir fou.',
          'C\'est la base Tycho. Le Dr Okafor et quarante et une personnes, sous un dôme qui fuit. Vivants. Andromède les croit morts, et c\'est ce qui les sauve. Garde ta radio allumée : Tycho va vouloir te parler.',
        ],
      },
    ],
    recompense: 80,
  },
  // --- La Lune ---
  {
    id: 'l1', titre: 'De l\'eau pour Tycho', type: 'principale', donneur: 'okafor', conditions: ['t8'], parRadio: true,
    intro: [
      'Ici Samuel Okafor, base Tycho. Le docteur Keïta dit que vous êtes fiable. Je n\'ai plus le luxe d\'en douter.',
      'Notre recycleur d\'eau est à bout, et le dôme siffle par trois fissures. Il nous faudrait cinq tonnes d\'eau et deux tonnes de titane.',
      'Le Comptoir de la Terre en vend. Déposez-les à la Station Tycho, en orbite au-dessus de nous : on les descendra de nuit. Et merci. Pardon : merci d\'avance. Ici on a perdu l\'habitude.',
    ],
    etapes: [
      {
        genre: 'livrer', lieu: 'Station Tycho', marchandises: { Eau: 5, Titane: 2 }, jauge: { zone: 'Lune', part: 20 },
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
        genre: 'radar', lieu: 'Lune', texte: 'Allume le radar près de la Lune : quelque chose s\'y cache', jauge: { zone: 'Lune', part: 10 },
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
        radio: { pnj: 'elsa', texte: ['La Lune est libre. Et la Compagnie Lunaire de Tycho rouvre ses bureaux : son action entre en Bourse. Je t\'ouvre l\'accès, capitaine (Marché › BOURSE). Achète, vends, et ne mise jamais ce que tu n\'as pas.'] },
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
    id: 'rosa', titre: 'Circuits sous le manteau', type: 'secondaire', donneur: 'rosa', conditions: ['t4'],
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
