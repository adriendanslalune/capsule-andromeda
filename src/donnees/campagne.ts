// La campagne de libération (décisions d'Adrien du 21/10/2026), après la Lune : les planètes intérieures (Mars, Vénus,
// Mercure, dans l'ordre qu'on veut : on n'est pas puni par la place des planètes dans l'année), puis un appel de
// Ganymède et la route des planètes extérieures, système par système, jusqu'à Triton (fin de l'acte 1) et aux Confins.
// Chaque zone a sa quête de libération : porter sa jauge de résistance à 100 %, l'assaut final contre son vaisseau
// amiral, puis le PNJ de son système. PREMIER JET (textes, PNJ, récompenses), à corriger par Adrien.

import type { Pnj, Quete } from './quetes'
import { ZONES_A_LIBERER } from './zones'

export const PNJS_CAMPAGNE: readonly Pnj[] = [
  {
    id: 'idris', nom: 'Idris Belkacem', role: 'Chef de la résistance martienne', lieu: 'Station Arès', teinte: '#f3a08b', portrait: null,
    repos: 'La poussière rouge s\'infiltre partout, même dans les plans d\'Andromède. Patience, capitaine.',
  },
  {
    id: 'lior', nom: 'Lior Asante', role: 'Pilote d\'aérostat', lieu: 'Aérostat Ishtar', teinte: '#f5d38a', portrait: null,
    repos: 'À cinquante kilomètres au-dessus de Vénus, il fait vingt degrés. Juste en dessous, l\'enfer. On vit sur le fil.',
  },
  {
    id: 'marguerite', nom: 'Sœur Marguerite', role: 'Gardienne de la Forge Caloris', lieu: 'Forge Caloris', teinte: '#d9d2c2', portrait: null,
    repos: 'Ici, le Soleil cuit tout ce qu\'il touche. Il cuira aussi Andromède, avec un peu d\'aide.',
  },
  {
    id: 'nadia', nom: 'Nadia Orlov', role: 'Capitaine de la flotte jovienne', lieu: 'Ganymède', teinte: '#e8c9a0', portrait: null,
    repos: 'Au-delà de la ceinture, on ne pardonne pas les erreurs. Prépare ta capsule, capitaine.',
  },
  {
    id: 'tomas', nom: 'Tomás Reyes', role: 'Pêcheur de méthane', lieu: 'Titan', teinte: '#f6e3b8', portrait: null,
    repos: 'Sur Titan, il pleut du gaz naturel et les lacs ne gèlent jamais. On s\'habitue à tout.',
  },
  {
    id: 'hana', nom: 'Hana Sato', role: 'Astronome en exil', lieu: 'Titania', teinte: '#bfe5e6', portrait: null,
    repos: 'Uranus roule sur le côté depuis des milliards d\'années. Rien d\'étonnant qu\'Andromède s\'y sente chez lui.',
  },
  {
    id: 'aksel', nom: 'Le vieil Aksel', role: 'Gardien de phare', lieu: 'Station Le Verrier', teinte: '#a9c0ee', portrait: null,
    repos: 'J\'allume le phare tous les soirs. Personne ne passe. Mais un jour, quelqu\'un passera.',
  },
  {
    id: 'mira', nom: 'Mira Kovač', role: 'Exploratrice des Confins', lieu: 'Station Tombaugh', teinte: '#c9b8e8', portrait: null,
    repos: 'Au bout du système, le Soleil n\'est plus qu\'une étoile parmi d\'autres. Et pourtant on se sent observé.',
  },
]

/** Le PNJ de la Résistance de chaque système (il donne les quêtes de libération de ses zones). */
const PNJ_DU_SYSTEME: Record<string, string> = {
  Mars: 'idris', Vénus: 'lior', Mercure: 'marguerite', Jupiter: 'nadia', Saturne: 'tomas', Uranus: 'hana', Neptune: 'aksel', Pluton: 'mira',
}
/** La quête qui ouvre les quêtes de libération de chaque système. */
const OUVERTURE: Record<string, string> = {
  Mars: 'lune-5', Vénus: 'lune-5', Mercure: 'lune-5', Jupiter: 'interieures', Saturne: 'jupiter', Uranus: 'saturne', Neptune: 'uranus', Pluton: 'neptune',
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

/** Les quêtes de libération des zones (sauf la Lune, qui a la sienne). */
const LIBERATIONS: Quete[] = ZONES_A_LIBERER.filter((z) => z.nom !== 'Lune').map((z) => {
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
    id: 'interieures', titre: 'Les planètes intérieures', type: 'principale', donneur: 'elsa', conditions: ['lune-5'],
    intro: [
      'La Lune est libre, et ça se sait. Sur Mars, sur Vénus, sur Mercure, la Résistance relève la tête.',
      'Va les aider, dans l\'ordre que tu veux : Idris sur la Station Arès, Lior sur l\'Aérostat Ishtar, Sœur Marguerite à la Forge Caloris.',
      'Quand les trois seront libres, le système intérieur sera à nous.',
    ],
    etapes: [
      { genre: 'liberer', zones: ['Mars', 'Vénus', 'Mercure'], texte: 'Libère Mars, Vénus et Mercure (dans l\'ordre que tu veux)' },
      { genre: 'parler', pnj: 'elsa', texte: [
        'Le système intérieur est libre. Je n\'y croyais plus, capitaine.',
        'Un message est arrivé pour toi, de très loin : une certaine Nadia Orlov, capitaine de la flotte jovienne. Elle veut te voir, sur Ganymède.',
        'Au-delà de la ceinture, les choses se corsent. Va la voir quand ta capsule sera prête.',
      ] },
    ],
    recompense: 3000,
  },
  {
    id: 'jupiter', titre: 'L\'appel de Ganymède', type: 'principale', donneur: 'nadia', conditions: ['interieures'],
    intro: [
      'Te voilà enfin. On parle de toi jusqu\'ici, capitaine. Je suis Nadia Orlov.',
      'Ici, Andromède est chez lui : plus de chasseurs, plus de missiles, des amiraux plus coriaces. Le jeu devient sérieux.',
      'Libère les quatre grandes lunes de Jupiter, et Jupiter elle-même. Ensuite, on parlera de Saturne.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Jupiter'), texte: 'Libère Io, Europe, Ganymède, Callisto et Jupiter' },
      { genre: 'parler', pnj: 'nadia', texte: ['Jupiter est libre. Un pêcheur de Titan nous appelle à l\'aide : Tomás Reyes. Saturne t\'attend, capitaine.'] },
    ],
    recompense: 6000,
  },
  {
    id: 'saturne', titre: 'Les anneaux de Saturne', type: 'principale', donneur: 'tomas', conditions: ['jupiter'],
    intro: [
      'C\'est toi, la capitaine dont parle Nadia ? Bienvenue sur Titan. Ne respire pas l\'air, surtout.',
      'Saturne a six grandes lunes, et Andromède en tient chacune. Libère-les, puis attaque le Couronné dans les anneaux.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Saturne'), texte: 'Libère les lunes de Saturne et Saturne' },
      { genre: 'parler', pnj: 'tomas', texte: ['Les anneaux sont à nous. Une astronome t\'attend sur Titania, près d\'Uranus : Hana Sato. Elle a vu des choses… étranges.'] },
    ],
    recompense: 9000,
  },
  {
    id: 'uranus', titre: 'Le monde couché', type: 'principale', donneur: 'hana', conditions: ['saturne'],
    intro: [
      'Je t\'attendais. Depuis Titania, je regarde Neptune toutes les nuits. Triton ne tourne pas comme une lune devrait tourner.',
      'Mais d\'abord, Uranus. Libère ses cinq lunes et la planète. Après, je te montrerai ce que j\'ai vu.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Uranus'), texte: 'Libère les lunes d\'Uranus et Uranus' },
      { genre: 'parler', pnj: 'hana', texte: ['Uranus est libre. Maintenant, regarde Triton avec moi… Tu vois ? Il tourne à l\'envers. Va voir le vieil Aksel, à la Station Le Verrier. Il sait.'] },
    ],
    recompense: 12000,
  },
  {
    id: 'neptune', titre: 'Le secret de Triton', type: 'principale', donneur: 'aksel', conditions: ['uranus'],
    intro: [
      'Assieds-toi, capitaine. J\'ai passé quarante ans à regarder Triton. Ce n\'est pas une lune. C\'est un vaisseau, garé là depuis des siècles.',
      'Libère Protée et Neptune. Puis attaque Triton. Si tu l\'abats, Andromède perd son cœur.',
    ],
    etapes: [
      { genre: 'liberer', zones: libs('Neptune'), texte: 'Libère Protée, Neptune… et Triton' },
      { genre: 'parler', pnj: 'aksel', texte: [
        'C\'est fini. Le phare peut s\'éteindre : quelqu\'un est enfin passé.',
        'Mais avant de mourir, Triton a envoyé un message. Vers les Confins. Mira Kovač, à la Station Tombaugh, l\'a capté.',
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

export const QUETES_CAMPAGNE: readonly Quete[] = [...ACTES, ...LIBERATIONS]
