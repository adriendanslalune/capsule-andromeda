// La campagne de libération (décisions d'Adrien du 21/10/2026), après la Lune : les planètes intérieures (Mars, Vénus,
// Mercure, dans l'ordre qu'on veut : on n'est pas puni par la place des planètes dans l'année), puis un appel de
// Ganymède et la route des planètes extérieures, système par système, jusqu'à Triton (fin de l'acte 1) et aux Confins.
// Chaque zone a sa quête de libération : porter sa jauge de résistance à 100 %, l'assaut final contre son vaisseau
// amiral, puis le PNJ de son système. PREMIER JET (textes, PNJ, récompenses), à corriger par Adrien.

import type { Pnj, Quete } from './quetes'
import { ZONES_A_LIBERER } from './zones'

export const PNJS_CAMPAGNE: readonly Pnj[] = [
  {
    id: 'helene', nom: 'Hélène Castagne', role: 'Directrice de la colonie Bradbury', lieu: 'Mars', teinte: '#f3a08b', portrait: 'portraits/helene-medaillon.webp',
    repos: 'Bradbury tient. On a connu pire. Non, en fait, on n\'a pas connu pire. Mais on tient.',
  },
  {
    id: 'odile', nom: 'Odile Varenne', role: 'Maire de Cythère, la ville flottante', lieu: 'Cythère', teinte: '#f5d38a', portrait: 'portraits/odile-medaillon.webp',
    repos: 'Cythère flotte. Pour l\'instant, c\'est tout ce que je peux vous promettre. Et c\'est déjà beaucoup.',
  },
  {
    id: 'aurelio', nom: 'Aurelio Benedetti', role: 'Chef de quart au Phare de Mercure', lieu: 'Phare de Mercure', teinte: '#f7c59f', portrait: 'portraits/aurelio-medaillon.webp',
    repos: 'Le Phare reste allumé. Si vous voyez Gabin, ne lui parlez pas de tomates.',
  },
  {
    id: 'nadia', nom: 'Nadia Orlov', role: 'Capitaine de la flotte jovienne', lieu: 'Ganymède', teinte: '#e8c9a0', portrait: 'portraits/nadia-medaillon.webp',
    repos: 'Au-delà de la ceinture, on ne pardonne pas les erreurs. Prépare ta capsule, capitaine.',
  },
  {
    id: 'tomas', nom: 'Tomás Reyes', role: 'Pêcheur de méthane', lieu: 'Titan', teinte: '#f6e3b8', portrait: 'portraits/tomas-medaillon.webp',
    repos: 'Sur Titan, il pleut du gaz naturel et les lacs ne gèlent jamais. On s\'habitue à tout.',
  },
  {
    id: 'hana', nom: 'Hana Sato', role: 'Astronome en exil', lieu: 'Titania', teinte: '#bfe5e6', portrait: 'portraits/hana-medaillon.webp',
    repos: 'Uranus roule sur le côté depuis des milliards d\'années. Rien d\'étonnant qu\'Andromède s\'y sente chez lui.',
  },
  {
    id: 'aksel', nom: 'Le vieil Aksel', role: 'Gardien de phare', lieu: 'Station Le Verrier', teinte: '#a9c0ee', portrait: 'portraits/aksel-medaillon.webp',
    repos: 'J\'allume le phare tous les soirs. Personne ne passe. Mais un jour, quelqu\'un passera.',
  },
  {
    id: 'mira', nom: 'Mira Kovač', role: 'Exploratrice des Confins', lieu: 'Station Tombaugh', teinte: '#c9b8e8', portrait: null,
    repos: 'Au bout du système, le Soleil n\'est plus qu\'une étoile parmi d\'autres. Et pourtant on se sent observé.',
  },
]

/** Le PNJ de la Résistance de chaque système (il donne les quêtes de libération de ses zones). */
const PNJ_DU_SYSTEME: Record<string, string> = {
  Mars: 'helene', Vénus: 'odile', Mercure: 'aurelio', Jupiter: 'nadia', Saturne: 'tomas', Uranus: 'hana', Neptune: 'aksel', Pluton: 'mira',
}
/** La quête qui ouvre les quêtes de libération de chaque système. */
const OUVERTURE: Record<string, string> = {
  Mars: 'l3', Vénus: 'l3', Mercure: 'l3', Jupiter: 'interieures', Saturne: 'jupiter', Uranus: 'saturne', Neptune: 'uranus', Pluton: 'neptune',
}

/** Une phrase sur chaque zone, pour la quête de sa libération. */
const AMBIANCE: Record<string, string> = {
  Mars: 'Andromède a fait d\'Olympus Mons sa tour de guet. De là-haut, son amiral voit toute la planète rouge.',
  Vénus: 'Sous les nuages d\'acide, leur vaisseau amiral se croit à l\'abri. Personne n\'ose descendre si bas.',
  Mercure: 'Ils se cachent du côté de la nuit, là où le sol gèle, et attendent que le Soleil se lève sur nous.',
  Io: 'Les volcans d\'Io crachent du soufre jusqu\'à l\'espace. Leur amiral s\'en sert comme écran de fumée.',
  Europe: 'Sous la glace d\'Europe, il y a un océan. Andromède fore. Ce qu\'il cherche là-dessous, je préfère ne pas le savoir.',
  Ganymède: 'Ganymède, c\'est chez moi. Le Grand Veilleur tourne au-dessus de nos dômes jour et nuit.',
  Callisto: 'Callisto est criblée de cratères. Leur amiral saute de l\'un à l\'autre comme un rat de trou en trou.',
  Jupiter: 'Le Léviathan nage dans les nuages de Jupiter. Il est énorme. On ne le voit que quand il veut être vu.',
  Encelade: 'Les geysers d\'Encelade projettent de la glace dans l\'espace. Leur amiral s\'y cache comme dans la neige.',
  Téthys: 'Téthys porte une cicatrice immense, un canyon d\'un bout à l\'autre. Ils y ont garé leur vaisseau.',
  Dione: 'Dione traîne derrière elle des falaises de glace. Leur amiral glisse dans leur ombre.',
  Rhéa: 'Rhéa est froide et silencieuse. Trop silencieuse. Andromède y écoute tout ce qui passe.',
  Titan: 'Dans le brouillard orange de Titan, on ne voit pas à dix mètres. Eux, si.',
  Japet: 'Japet a une face blanche et une face noire. Leur amiral change de côté comme de visage.',
  Saturne: 'Le Couronné trône dans les anneaux de Saturne. Tant qu\'il est là, aucun cargo ne passe.',
  Ariel: 'Ariel est la plus brillante des lunes d\'Uranus. Leur amiral y brille aussi, d\'une lumière qui ne réchauffe pas.',
  Umbriel: 'Umbriel est sombre comme du charbon. Leur vaisseau y est invisible, sauf quand il tire.',
  Titania: 'Titania est ma maison d\'exil. Ses canyons sont pleins de réfugiés, et la Reine Pâle les compte.',
  Obéron: 'Obéron est la plus lointaine. Le Roi Sombre y tient sa cour, loin de tout.',
  Miranda: 'Miranda semble faite de morceaux recousus. Leur amiral s\'y fond comme une pièce de plus.',
  Uranus: 'Uranus roule sur le côté, et le Basculé avec elle. Il faut l\'attaquer à l\'envers.',
  Protée: 'Protée est un caillou sombre et cabossé. Ils s\'en servent de poste avancé contre nous.',
  Neptune: 'Les vents de Neptune soufflent à deux mille kilomètres-heure. Le Maelström y tourne sans jamais s\'arrêter.',
  Triton: 'Triton tourne à l\'envers autour de Neptune. Ce n\'est pas une lune, capitaine. C\'est leur vaisseau. Le vrai.',
  Charon: 'Charon et Pluton se tiennent par la main depuis toujours. Le Passeur se glisse entre eux.',
  Pluton: 'Le Gardien des Confins veille sur la porte du système. Derrière, c\'est le grand noir… et Andromède.',
}
/** Ce que dit le PNJ après la libération. */
const VICTOIRE: Record<string, string> = {
  Triton: 'Triton… s\'éteint. Leur vaisseau-mère est à terre, capitaine. L\'acte est fini. Mais j\'ai capté un signal, très loin, au-delà de Pluton. Ils n\'étaient pas seuls.',
}

const id = (nom: string) => `liberer-${nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}`
const deLa = (nom: string) => (/^[AEIOUÉÈYH]/i.test(nom) ? `d'${nom}` : `de ${nom}`)

/**
 * Les planètes intérieures, écrites à la main (docs/campagne-detail.md, validé par Adrien le 23/10/2026) : chaque
 * planète a son arc, quatre étapes à 20 % de la jauge, des réponses par radio, puis l'assaut.
 */
const ARCS: Quete[] = [
  {
    id: 'liberer-mars', titre: 'La tempête rouge', type: 'principale', donneur: 'helene', conditions: ['l3'],
    intro: [
      '(joie) Ici Bradbury. Vous êtes la capitaine de la Lune ? On vous entend à la radio jusqu\'ici, vous savez. Les gamins de Radio Poussière ont fait une chanson sur vous. Elle est mauvaise.',
      '(souci) Quatre cents colons, deux serres, une mine de titane. Et une tempête de trois mois qui nous coupe du ciel. Pire : Andromède attaque nos convois. Sans le titane, Arès Titane ne paie plus, et sans la paie, plus de vivres.',
      'Il y a autre chose, mais une chose à la fois. Le convoi d\'abord : les Mercenaires ont un contrat ESCORTER dans le système de Mars.',
    ],
    etapes: [
      {
        genre: 'mission', mission: 'escorter', systeme: 'Mars', nombre: 1, texte: 'Escorte un convoi dans le système de Mars (contrat ESCORTER des Mercenaires)',
        jauge: { zone: 'Mars', part: 20 },
        radio: { pnj: 'helene', texte: [
          '(joie) Le titane est à quai, la paie partira ce soir. Ruiz dit qu\'il vous doit une bière. Ruiz doit une bière à tout Mars.',
          '(souci) Bon. L\'autre chose, maintenant : le professeur Roux. Il est parti seul vers Olympus il y a des semaines, et sa balise de détresse ne répond plus. Les chasseurs qui tournent autour de Mars ont vu passer tout ce qui bouge. Abattez-en un, et rapportez-moi sa mémoire.',
        ] },
      },
      {
        genre: 'chasseurs', nombre: 1, systeme: 'Mars', texte: 'Abats un chasseur autour de Mars : sa mémoire a vu passer Roux',
        jauge: { zone: 'Mars', part: 20 },
        radio: { pnj: 'helene', texte: [
          'Dans sa mémoire : le rover de Roux, vu d\'en haut, arrêté au bord de la caldeira, l\'antenne tournée vers le sommet. Et une silhouette qui marche vers la balise.',
          '(souci) Il est monté à pied… Ce vieil entêté. Les jumeaux disent que son rover enregistrait tout ce qu\'il entendait, et qu\'il entendait sa balise sur 6,120 MHz. Écoutez-la, vous. Moi, j\'ai arrêté.',
        ] },
      },
      {
        genre: 'signal', frequence: 6.12, systeme: 'Mars', auteur: 'Balise d\'Olympus', lieu: 'caldeira d\'Olympus Mons',
        texte: '(un chant, et par-dessus, la voix de Roux) … elle compte ce qui pousse… le vaisseau vient la relever… toutes les nuits à la même heure… quand il est posé contre elle, il ne voit plus rien d\'autre…',
        enonce: 'Capte le chant de la balise d\'Olympus à la radio : 6,120 MHz, près de Mars',
        jauge: { zone: 'Mars', part: 20 },
        radio: { pnj: 'helene', texte: [
          'Quand le Phobétor écoute la balise, il est sourd et aveugle. Voilà notre fenêtre de tir.',
          'Il nous manque juste ses rondes : Beagle 2, la vieille sonde anglaise, est posée dans Isidis, en face d\'Olympus. Roux disait que sa caméra avait vu la balise avant tout le monde. Retrouvez-la.',
        ] },
      },
      {
        genre: 'disparu', nom: 'Beagle 2', jauge: { zone: 'Mars', part: 20 },
        radio: { pnj: 'helene', texte: ['(joie) Sa caméra a tenu, la vieille ! On a les rondes du Phobétor, minute par minute. Demir prépare ses foreuses. Il veut toujours klaxonner. Faites monter la Résistance autour de Mars, et on y va.'] },
      },
      { genre: 'jauge', zone: 'Mars' },
      { genre: 'assaut', zone: 'Mars' },
    ],
    liberation: { pnj: 'helene', texte: [
      'Le feu d\'Olympus s\'est éteint. Pour la première fois depuis des mois, je dors sans le compter.',
      'Radio Poussière émet une édition spéciale : la météo (dégagée), les infos (Mars est libre) et la recette du jour, du gâteau. Un vrai. On a gardé les œufs.',
      'Roux n\'est pas revenu. Mais sa balise chante encore, et cette fois, j\'écoute.',
    ] },
    recompense: 1000, libere: 'Mars',
  },
  {
    id: 'liberer-venus', titre: 'Le chant de Cythère', type: 'principale', donneur: 'odile', conditions: ['l3'],
    intro: [
      'Bienvenue à Cythère, capitaine. Trois mille âmes à cinquante-cinq kilomètres au-dessus de l\'enfer. Le conseil a voté : on ne descend pas, on ne monte pas, on ne se rend pas.',
      '(souci) Mais on ne tient qu\'à des câbles, et les câbles s\'usent. Ce qui nous relie au reste du monde, c\'est Tant-Pis, la navette des Chantiers. Elle est revenue de la Terre en morceaux. Enfin… en moins de morceaux que prévu.',
      'Si vous savez manier une clé, les Ingénieurs ont un contrat RÉPARER dans le système de Vénus.',
    ],
    etapes: [
      {
        genre: 'mission', mission: 'depanner', systeme: 'Vénus', nombre: 1, texte: 'Répare un engin dans le système de Vénus (contrat RÉPARER des Ingénieurs)',
        jauge: { zone: 'Vénus', part: 20 },
        radio: { pnj: 'odile', texte: ['(joie) Elle vole ! Presque. Les Chantiers disent qu\'il lui manque une coque digne de ce nom : quatre tonnes de verre et trois de cuivre. Le Comptoir de la Terre en vend. Ou videz les épaves qui tournent autour de Vénus : il en tombe assez du ciel en ce moment.'] },
      },
      {
        genre: 'livrer', lieu: 'Cythère', marchandises: { Verre: 4, Cuivre: 3 }, jauge: { zone: 'Vénus', part: 20 },
        radio: { pnj: 'odile', texte: [
          '(joie) Tant-Pis a une coque, et même une deuxième couche de peinture, ce qui n\'était pas nécessaire.',
          'Kenji vous a envoyé ses relevés : chaque fois qu\'un chasseur passe, les nuages dessinent la même figure, au-dessus de la Station Aphrodite. Il pense que le Brûle-Nuées est là-dessous. Allez voir, radar allumé. De loin.',
        ] },
      },
      {
        genre: 'radar', lieu: 'Station Aphrodite', texte: 'Allume le radar près de la Station Aphrodite : le Brûle-Nuées s\'y cache',
        jauge: { zone: 'Vénus', part: 20 },
        radio: { pnj: 'odile', texte: [
          '(souci) En orbite basse, au ras des nuages, une forme longue comme une ville… Il est là depuis le début, juste au-dessus de nous. Bien.',
          'Tullio a une idée, et pour une fois elle n\'est pas idiote : la chorale va chanter sur 5,330 MHz, pour que les autres villes flottantes nous entendent et se lèvent avec nous. Écoutez-les : si le chant passe jusqu\'à vous, il passe partout.',
        ] },
      },
      {
        genre: 'signal', frequence: 5.33, systeme: 'Vénus', auteur: 'Chorale de Cythère', lieu: 'Cythère, ville flottante',
        texte: '(la chorale, à pleine voix) … Il manque des ténors. Il manque toujours des ténors.',
        enonce: 'Capte le chant de la chorale à la radio : 5,330 MHz, près de Vénus',
        jauge: { zone: 'Vénus', part: 20 },
        radio: { pnj: 'odile', texte: ['(joie) Les aérostats Lakshmi et Venera répondent, et même deux villes qu\'on croyait tombées. Vénus se lève, capitaine. Il ne manque plus que vous.'] },
      },
      { genre: 'jauge', zone: 'Vénus' },
      { genre: 'assaut', zone: 'Vénus' },
    ],
    liberation: { pnj: 'odile', texte: [
      'Le Brûle-Nuées est tombé dans l\'acide, et les nuages se sont refermés sur lui sans un bruit.',
      'Ce soir, toutes les villes flottantes chantent en même temps. Pia dit qu\'on doit vous entendre jusqu\'à la Terre. Je lui ai dit que non. Je crois que je me trompe.',
    ] },
    recompense: 1000, libere: 'Vénus',
  },
  {
    id: 'liberer-mercure', titre: 'Le Phare', type: 'principale', donneur: 'aurelio', conditions: ['l3'],
    intro: [
      '(joie) Bienvenue au Phare, capitaine. Quart numéro quatre-vingt-quelque-chose. On a arrêté de compter précisément, ça portait malheur.',
      '(souci) Le Phare reste allumé, quoi qu\'il arrive. Mais le bouclier solaire tombe en lambeaux, et Gabin fait cuire ses œufs sur le hublot. Ce n\'est pas une blague, c\'est un problème de sécurité.',
      'Il me faudrait six tonnes de titane. Au Comptoir de la Terre, ou sur les épaves qui traînent autour de Mercure.',
    ],
    etapes: [
      {
        genre: 'livrer', lieu: 'Phare de Mercure', marchandises: { Titane: 6 }, jauge: { zone: 'Mercure', part: 20 },
        radio: { pnj: 'aurelio', texte: ['Le bouclier tient. Gabin est désolé pour ses œufs. Mais Noor a fait le calcul : il faudrait encore de l\'ombre devant le Phare, côté Soleil, pour tenir jusqu\'à l\'été. Une grosse épave ferait l\'affaire. Les Nettoyeurs ont un contrat REMORQUER.'] },
      },
      {
        genre: 'mission', mission: 'remorquer', systeme: 'Mercure', nombre: 1, texte: 'Remorque une épave dans le système de Mercure (contrat REMORQUER des Nettoyeurs)',
        jauge: { zone: 'Mercure', part: 20 },
        radio: { pnj: 'aurelio', texte: [
          '(joie) Une épave, en parasol. On aura tout vu.',
          '(souci) Maintenant, la vraie question : le Calcinateur. On ne le voit jamais, il ne sort que côté nuit. Stanek pense que MESSENGER, la sonde qui s\'est écrasée sur Mercure, a enregistré ses passages avant de mourir. Sa mémoire a peut-être survécu. Ne touchez pas à la balise du pôle, en passant.',
        ] },
      },
      {
        genre: 'disparu', nom: 'MESSENGER', jauge: { zone: 'Mercure', part: 20 },
        radio: { pnj: 'aurelio', texte: ['(joie) La vieille mémoire parle encore ! Le Calcinateur fait toujours le même tour, sur la face de nuit, en rasant la glace. Noor a l\'heure, à peu près. Allez le voir de vos yeux, radar allumé.'] },
      },
      {
        genre: 'radar', lieu: 'Mercure', texte: 'Allume le radar en orbite autour de Mercure : le Calcinateur fait sa ronde',
        jauge: { zone: 'Mercure', part: 20 },
        radio: { pnj: 'aurelio', texte: [
          '(souci) Noir sur noir, il fait le tour de la planète en orbite basse, lentement, comme quelqu\'un qui fait le tour de son potager.',
          '(joie) On le tient. Le Phare va le garder dans sa lumière : un phare, ça éclaire tout le monde, même ceux qu\'on n\'aime pas. Surtout ceux-là, ce soir.',
        ] },
      },
      { genre: 'jauge', zone: 'Mercure' },
      { genre: 'assaut', zone: 'Mercure' },
    ],
    liberation: { pnj: 'aurelio', texte: [
      'Le Calcinateur est tombé côté nuit. Il y a de la glace là-bas : il fondra dans quelques millénaires.',
      'Le Phare reste allumé. Gabin a fait des tomates farcies, avec les vraies tomates que quelqu\'un a fini par nous envoyer.',
      'Stanek dit que sa balise bourdonne plus fort depuis l\'assaut. Comme si elle prenait des notes.',
    ] },
    recompense: 1000, libere: 'Mercure',
  },
]

/** Les quêtes de libération des autres zones (la Lune et les planètes intérieures ont la leur, écrite à la main). */
const LIBERATIONS: Quete[] = ZONES_A_LIBERER.filter((z) => !['Lune', 'Mars', 'Vénus', 'Mercure'].includes(z.nom)).map((z) => {
  const pnj = PNJ_DU_SYSTEME[z.systeme]
  return {
    id: id(z.nom), titre: `Libérer ${z.nom}`, type: 'principale', donneur: pnj, conditions: [OUVERTURE[z.systeme]],
    intro: [
      AMBIANCE[z.nom],
      `Il faut que la Résistance se lève autour ${deLa(z.nom)} : contrats, chasseurs, monolithes, tout ce que tu fais près d\'elle compte.`,
      `Quand la jauge sera pleine, attaque ${z.amiral}. ${z.planete ? 'Une planète, c\'est un gros morceau : prépare-toi.' : 'Je compte sur toi.'}`,
    ],
    etapes: [
      { genre: 'jauge', zone: z.nom },
      { genre: 'assaut', zone: z.nom },
      { genre: 'parler', pnj, texte: [VICTOIRE[z.nom] ?? `${z.nom} est libre, capitaine. ${z.amiral[0].toUpperCase()}${z.amiral.slice(1)} ne tient plus rien ici. On s'en souviendra.`] },
    ],
    recompense: z.seuil * 15, libere: z.nom,
  }
})

const libs = (systeme: string) => ZONES_A_LIBERER.filter((z) => z.systeme === systeme).map((z) => z.nom)

/** Les grandes étapes de la campagne, après la Lune. */
const ACTES: Quete[] = [
  {
    id: 'interieures', titre: 'Les planètes intérieures', type: 'principale', donneur: 'elsa', conditions: ['l3'], parRadio: true,
    intro: [
      'La Lune est libre, et ça se sait. Sur Mars, sur Vénus, sur Mercure, des gens tiennent bon et commencent à relever la tête.',
      'Va les aider, dans l\'ordre que tu veux : Hélène Castagne à la colonie Bradbury, sur Mars ; Odile Varenne, la maire de Cythère, dans les nuages de Vénus ; Aurelio Benedetti, au Phare de Mercure. Certains, tu les as peut-être déjà entendus à la radio.',
    ],
    etapes: [
      {
        genre: 'liberer', zones: ['Mars', 'Vénus', 'Mercure'], texte: 'Libère Mars, Vénus et Mercure (dans l\'ordre que tu veux)',
        radio: { pnj: 'elsa', texte: [
          'Le système intérieur est libre. Je n\'y croyais plus, capitaine.',
          'Un message est arrivé pour toi, de très loin : quarante minutes de lumière. Une certaine Nadia Orlov, capitaine de la flotte jovienne. Elle veut te parler, sur Ganymède.',
          'Au-delà de la ceinture, les choses se corsent. Va la voir quand ta capsule sera prête.',
        ] },
      },
    ],
    recompense: 1000,
  },
  {
    id: 'jupiter', titre: 'L\'appel de Ganymède', type: 'principale', donneur: 'nadia', conditions: ['interieures'],
    intro: [
      'Te voilà enfin. On parle de toi jusqu\'ici, capitaine. Je suis Nadia Orlov.',
      '(souci) Ici, Andromède est chez lui : plus de chasseurs, plus de missiles, des amiraux plus coriaces. Le jeu devient sérieux.',
      'Libère les quatre grandes lunes de Jupiter, et Jupiter elle-même. Ensuite, on parlera de Saturne.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Jupiter'), texte: 'Libère Io, Europe, Ganymède, Callisto et Jupiter' },
      { genre: 'parler', pnj: 'nadia', texte: ['(joie) Jupiter est libre. Un pêcheur de Titan nous appelle à l\'aide : Tomás Reyes. Saturne t\'attend, capitaine.'] },
    ],
    recompense: 6000,
  },
  {
    id: 'saturne', titre: 'Les anneaux de Saturne', type: 'principale', donneur: 'tomas', conditions: ['jupiter'],
    intro: [
      '(joie) C\'est toi, la capitaine dont parle Nadia ? Bienvenue sur Titan. Ne respire pas l\'air, surtout.',
      '(souci) Saturne a six grandes lunes, et Andromède en tient chacune. Libère-les, puis attaque le Couronné dans les anneaux.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Saturne'), texte: 'Libère les lunes de Saturne et Saturne' },
      { genre: 'parler', pnj: 'tomas', texte: ['(joie) Les anneaux sont à nous. Une astronome t\'attend sur Titania, près d\'Uranus : Hana Sato. Elle a vu des choses… étranges.'] },
    ],
    recompense: 9000,
  },
  {
    id: 'uranus', titre: 'Le monde couché', type: 'principale', donneur: 'hana', conditions: ['saturne'],
    intro: [
      '(souci) Je t\'attendais. Depuis Titania, je regarde Neptune toutes les nuits. Triton ne tourne pas comme une lune devrait tourner.',
      'Mais d\'abord, Uranus. Libère ses cinq lunes et la planète. Après, je te montrerai ce que j\'ai vu.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Uranus'), texte: 'Libère les lunes d\'Uranus et Uranus' },
      { genre: 'parler', pnj: 'hana', texte: ['(souci) Uranus est libre. Maintenant, regarde Triton avec moi… Tu vois ? Il tourne à l\'envers. Va voir le vieil Aksel, à la Station Le Verrier. Il sait.'] },
    ],
    recompense: 12000,
  },
  {
    id: 'neptune', titre: 'Le secret de Triton', type: 'principale', donneur: 'aksel', conditions: ['uranus'],
    intro: [
      'Assieds-toi, capitaine. J\'ai passé quarante ans à regarder Triton. Ce n\'est pas une lune. C\'est un vaisseau, garé là depuis des siècles.',
      '(souci) Libère Protée et Neptune. Puis attaque Triton. Si tu l\'abats, Andromède perd son cœur.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Neptune'), texte: 'Libère Protée, Neptune… et Triton' },
      { genre: 'parler', pnj: 'aksel', texte: [
        '(joie) C\'est fini. Le phare peut s\'éteindre : quelqu\'un est enfin passé.',
        '(souci) Mais avant de mourir, Triton a envoyé un message. Vers les Confins. Mira Kovač, à la Station Tombaugh, l\'a capté.',
      ] },
    ],
    recompense: 20000,
  },
  {
    id: 'confins', titre: 'Aux Confins', type: 'principale', donneur: 'mira', conditions: ['neptune'],
    intro: [
      'Triton a appelé quelqu\'un, capitaine. Là-bas, au-delà de Pluton. Et quelqu\'un a répondu.',
      'Libère Charon et Pluton : il nous faut la porte du système avant que la suite n\'arrive.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Pluton'), texte: 'Libère Charon et Pluton' },
      { genre: 'parler', pnj: 'mira', texte: ['Le système solaire est libre. Entièrement. Profites-en, capitaine… La suite arrive. (Fin de l\'acte 1.)'] },
    ],
    recompense: 15000,
  },
]

export const QUETES_CAMPAGNE: readonly Quete[] = [...ACTES, ...ARCS, ...LIBERATIONS]
