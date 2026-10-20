// Les PNJ et les quêtes (décisions d'Adrien du 20/10/2026). Un PNJ a un lieu fixe (satellite, station, lune,
// planète) : on lui parle en orbite à son lieu. Une quête est principale (la campagne) ou secondaire ; elle a un
// donneur, des conditions (quêtes à finir avant), des étapes qui se cochent toutes seules, et une récompense.
// PREMIER JET pour la Lune (à corriger par Adrien) : textes, PNJ et récompenses sont provisoires. Les portraits
// viendront d'Adrien (images générées) ; en attendant, un médaillon à l'initiale.

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
    id: 'elsa', nom: 'Elsa Varga', role: 'Commandante de la résistance', lieu: 'ISS', teinte: '#f3c2b0', portrait: null,
    repos: 'L\'ISS tient encore debout, et nous aussi. Reviens me voir quand tu auras du nouveau.',
  },
  {
    id: 'keita', nom: 'Dr Amadou Keïta', role: 'Sélénologue en exil', lieu: 'Lune', teinte: '#d7cdee', portrait: null,
    repos: 'La Lune a vu passer bien des envahisseurs. Enfin… des météores, surtout. Mais celui-là est coriace.',
  },
  {
    id: 'veilleur', nom: 'Le Veilleur', role: 'Ermite qui écoute le ciel', lieu: 'Hubble', teinte: '#bfe0e8', portrait: null,
    repos: 'Chut. J\'écoute. Le ciel parle à ceux qui se taisent.',
  },
  {
    id: 'rosa', nom: 'Rosa Mendès', role: 'Contrebandière', lieu: 'Tiangong', teinte: '#f5d38a', portrait: null,
    repos: 'Pas de questions, pas de mensonges. Tu veux faire affaire ou tu admires la vue ?',
  },
]

/** Une étape de quête : ce qu'il faut faire (elle se coche toute seule). */
export type EtapeQuete =
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
}

export const QUETES: readonly Quete[] = [
  // --- La Lune (quêtes principales) ---
  {
    id: 'lune-1', titre: 'Un signal sous la Lune', type: 'principale', donneur: 'elsa', conditions: [],
    intro: [
      'Approche, capitaine. Je suis Elsa Varga. Ce qui reste de la résistance, c\'est ici, dans cette vieille station.',
      'Depuis trois nuits, un signal monte de la face cachée de la Lune. Pas un signal d\'Andromède : il est trop… humain.',
      'Le Dr Keïta est en orbite là-bas. Va le voir, écoute ce qu\'il en pense, et reviens me dire. Discrètement.',
    ],
    etapes: [
      { genre: 'aller', lieu: 'Lune' },
      {
        genre: 'parler', pnj: 'keita', texte: [
          'Elsa t\'envoie ? Bien. Ce signal, je l\'enregistre depuis le premier soir.',
          'C\'est la balise de la base Tycho. Il y a encore des gens en bas, capitaine. Vivants. Et Andromède ne le sait pas… pas encore.',
          'Retourne voir Elsa. Dis-lui que Tycho tient bon, mais pas pour longtemps.',
        ],
      },
      {
        genre: 'parler', pnj: 'elsa', texte: [
          'Des survivants à Tycho… Je n\'osais plus l\'espérer.',
          'Alors on se bat pour la Lune. Tu en es, capitaine ? Bien sûr que tu en es. Voilà pour ta peine.',
        ],
      },
    ],
    recompense: 300,
  },
  {
    id: 'lune-2', titre: 'Les guetteurs d\'Andromède', type: 'principale', donneur: 'elsa', conditions: ['lune-1'],
    intro: [
      'Andromède a posté des chasseurs tout autour de la Terre. Ce sont leurs yeux : tant qu\'ils guettent, personne ne descend sur la Lune.',
      'Les Mercenaires ont des contrats sur eux. Prends-en deux, abats-les, et la route de Tycho s\'ouvrira un peu.',
    ],
    etapes: [
      { genre: 'mission', mission: 'chasser', systeme: 'Terre', nombre: 2, texte: 'Abats 2 chasseurs dans le système de la Terre (missions ABATTRE des Mercenaires)' },
      { genre: 'parler', pnj: 'elsa', texte: ['Deux de moins. Ils vont envoyer des renforts, bien sûr. Mais pour quelques jours, ils sont aveugles. Merci, capitaine.'] },
    ],
    recompense: 600,
  },
  {
    id: 'lune-3', titre: 'Ravitailler Tycho', type: 'principale', donneur: 'keita', conditions: ['lune-1'],
    intro: [
      'Les gens de Tycho manquent de tout. D\'eau, surtout : le recycleur est à bout. Et de titane, pour colmater le dôme.',
      'Achète ce qu\'il faut au marché de la Terre et apporte-le-moi ici, en orbite. Je me charge de le faire descendre.',
    ],
    etapes: [
      { genre: 'livrer', lieu: 'Lune', marchandises: { Eau: 5, Titane: 2 } },
      { genre: 'parler', pnj: 'keita', texte: ['Cinq tonnes d\'eau et du titane : tu viens de sauver des vies, capitaine. Le dôme tiendra.'] },
    ],
    recompense: 800,
  },
  {
    id: 'lune-4', titre: 'Le relais de la face cachée', type: 'principale', donneur: 'keita', conditions: ['lune-3'],
    intro: [
      'Pour parler avec Tycho, il nous faut un relais : un engin en orbite qui renvoie le signal par-dessus la Lune.',
      'Un satellite en panne fera l\'affaire, une fois remis en état. Les Ingénieurs en ont toujours un sur les bras.',
    ],
    etapes: [
      { genre: 'mission', mission: 'depanner', systeme: 'Terre', nombre: 1, texte: 'Répare un engin dans le système de la Terre (mission RÉPARER des Ingénieurs)' },
      { genre: 'parler', pnj: 'keita', texte: ['J\'entends Tycho ! Clairement ! Ils te saluent, capitaine… et ils ont un plan. Va voir Elsa.'] },
    ],
    recompense: 700,
  },
  {
    id: 'lune-5', titre: 'La Lune libérée', type: 'principale', donneur: 'elsa', conditions: ['lune-2', 'lune-4'],
    intro: [
      'Tycho a repéré la flottille qui garde la Lune. Trois chasseurs, à tour de rôle. Si on les abat d\'un coup, Andromède perd la Lune.',
      'C\'est le moment, capitaine. Pour Tycho. Pour nous tous.',
    ],
    etapes: [
      { genre: 'mission', mission: 'chasser', systeme: 'Terre', nombre: 3, texte: 'Abats 3 chasseurs dans le système de la Terre' },
      {
        genre: 'parler', pnj: 'elsa', texte: [
          'Ils sont partis. La Lune est à nous, capitaine.',
          'Ce soir, Tycho rallume ses lumières. Mais Andromède ne s\'arrêtera pas là… et nous non plus. Prochaine étape : Mars.',
        ],
      },
    ],
    recompense: 1500, libere: 'Lune',
  },
  // --- Quêtes secondaires ---
  {
    id: 'veilleur', titre: 'L\'oreille du Veilleur', type: 'secondaire', donneur: 'veilleur', conditions: [],
    intro: [
      'Tu les entends, toi aussi ? Les monolithes. Mille voix dans le noir, qui ne répondent qu\'à ceux qui appellent.',
      'Appelle-les (le bouton PING de ta carte), suis leurs échos, et trouves-en un. Puis reviens me raconter.',
    ],
    etapes: [
      { genre: 'monolithes', nombre: 1 },
      { genre: 'parler', pnj: 'veilleur', texte: ['Tu l\'as touché ? Alors tu as compris. Il en reste neuf cent quatre-vingt-dix-neuf. Écoute bien.'] },
    ],
    recompense: 400,
  },
  {
    id: 'rosa', titre: 'Circuits sous le manteau', type: 'secondaire', donneur: 'rosa', conditions: [],
    intro: [
      'Toi, tu as une tête à savoir te taire. J\'ai un client qui paie bien pour des circuits anciens. Trois tonnes.',
      'Le marché de la Terre en regorge. Apporte-les-moi ici, sur Tiangong, et on ne s\'est jamais vus.',
    ],
    etapes: [
      { genre: 'livrer', lieu: 'Tiangong', marchandises: { 'Circuits anciens': 3 } },
      { genre: 'parler', pnj: 'rosa', texte: ['Parfait. Voilà ta part. Et si on te demande : tu livrais de l\'eau.'] },
    ],
    recompense: 500,
  },
]
