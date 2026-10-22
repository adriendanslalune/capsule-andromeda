// La radio de la capsule (décisions d'Adrien du 20/10/2026) : un vieux poste TSF, ouvert depuis la carte (sous le
// RADAR). Bande OC (ondes courtes) : les « Voix perdues », 150 balises laissées par des équipages pendant l'invasion,
// une autre collection que les monolithes. Chacune émet depuis un système, sur sa fréquence, à heures fixes (les mêmes
// pour tous) : il faut être dans ce système au bon moment et rester calé sur elle pour l'enregistrer. Ce sont des
// textes (pas de voix enregistrées : le jeu sera traduit). Bande FM : les groupes de joueurs (avec le serveur).
// Fréquences, horaires et répartition PROVISOIRES ; textes : PREMIER JET (Terre et Lune, Mercure), à corriger par
// Adrien ; les autres systèmes sont à écrire (leurs voix n'émettent pas encore). Le fil : `docs/voix-perdues.md`.

/** La bande OC (MHz) : où se cachent les voix perdues. */
export const BANDE_OC = { min: 3, max: 10 } as const
/** Une voix s'entend à moins de… (MHz) de sa fréquence ; elle est nette à moins de… */
export const LARGEUR_SIGNAL = 0.06
export const SIGNAL_NET = 0.006
/** Rester calé (signal net) pendant… (ms) pour enregistrer une voix. */
export const DUREE_ENREGISTREMENT = 10_000
/** Les horaires d'émission : chaque voix émet DUREE_EMISSION toutes les PERIODE_EMISSION, à son heure à elle. */
export const PERIODE_EMISSION = 6 * 3_600_000
export const DUREE_EMISSION = 30 * 60_000

/** Combien de voix dans chaque système (150 en tout). */
export const VOIX_PAR_SYSTEME: Readonly<Record<string, number>> = {
  Mercure: 10, Vénus: 12, Terre: 15, Mars: 20, Jupiter: 22, Saturne: 22, Uranus: 17, Neptune: 18, Pluton: 14,
}
export const NOMBRE_VOIX = Object.values(VOIX_PAR_SYSTEME).reduce((a, b) => a + b, 0)

/** Le texte d'une voix : qui parle, d'où, quand (en jours depuis le début de l'invasion), et ce qu'il dit. */
export interface TexteVoix { auteur: string; lieu: string; jour: number; texte: string }

/**
 * Les textes, par système, dans l'ordre de leurs voix. PREMIER JET (Terre et Lune) : des voix de l'invasion qui, mises
 * bout à bout, mènent vers le secret de Triton.
 */
export const TEXTES_VOIX: Readonly<Record<string, readonly TexteVoix[]>> = {
  Mercure: [
    { auteur: 'Aurelio Benedetti, chef de quart', lieu: 'Phare de Mercure', jour: 1, texte: 'Ici le Phare de Mercure. Le Soleil vient de clignoter. Trois fois. En quarante ans de quart, je ne l\'avais jamais vu cligner des yeux.' },
    { auteur: 'Noor Haddad, technicienne', lieu: 'Phare de Mercure', jour: 2, texte: 'J\'ai compté les clignements : ce sont des vaisseaux qui passent devant le Soleil. Des centaines. Ils arrivent tous du même côté du ciel, celui de Neptune.' },
    { auteur: 'Gabin, cuisinier', lieu: 'Phare de Mercure', jour: 4, texte: 'Message pour la Terre : il nous reste de la semoule pour six mois et du piment pour six ans. Envoyez des tomates. Ou des renforts. Des tomates, de préférence.' },
    { auteur: 'Message automatique', lieu: 'Phare de Mercure', jour: 5, texte: 'ALERTE THERMIQUE. BOUCLIER SOLAIRE À 96 %. ÉQUIPAGE PRIÉ DE NE PAS OUVRIR LE HUBLOT CÔTÉ JOUR. ÉQUIPAGE PRIÉ DE NE PAS FAIRE CUIRE D\'ŒUFS SUR LE HUBLOT CÔTÉ JOUR.' },
    { auteur: 'Noor Haddad, technicienne', lieu: 'Phare de Mercure', jour: 9, texte: 'Ils ne tirent pas sur le Phare. Ils font le tour de chaque planète, lentement, en rangées bien droites, sans en oublier une. On dirait quelqu\'un qui fait le tour de son potager.' },
    { auteur: 'Aurelio Benedetti, chef de quart', lieu: 'Phare de Mercure', jour: 13, texte: 'Ici, une journée dure cent soixante-seize jours terrestres. Alors on ne compte plus les jours, on compte les quarts. Nous en sommes au trois cent douzième, et nous tenons.' },
    { auteur: 'Dr Ivo Stanek, glaciologue', lieu: 'cratère Prokofiev, pôle nord de Mercure', jour: 18, texte: 'Au fond des cratères du pôle, il y a de la glace, à l\'ombre depuis toujours. Et dans la glace, une balise. Froide, endormie. Personne ne l\'a jamais touchée. Je ne la toucherai pas.' },
    { auteur: 'Noor Haddad, technicienne', lieu: 'Phare de Mercure', jour: 21, texte: 'La balise de Stanek ne regarde pas le ciel. Elle est tournée vers la Terre, comme un épouvantail au bord d\'un champ. Et d\'après l\'usure de sa coque, elle la regarde depuis bien avant les dinosaures.' },
    { auteur: 'Gabin, cuisinier', lieu: 'Phare de Mercure', jour: 30, texte: 'Le chef dit qu\'on est les gardiens du phare le plus chaud du système. Moi je dis qu\'on est les sardines de la boîte la plus chaude du système. Il ne me laisse plus parler à la radio.' },
    { auteur: 'Aurelio Benedetti, chef de quart', lieu: 'Phare de Mercure', jour: 40, texte: 'Le Phare reste allumé. Si leurs vaisseaux se servent de notre lumière pour se guider, tant pis : un phare, ça éclaire tout le monde. Même ceux qu\'on n\'aime pas.' },
  ],
  Terre: [
    { auteur: 'Cdt Ilse Brandt', lieu: 'ISS', jour: 1, texte: 'Ici l\'ISS. Quelque chose a éteint les étoiles du côté de Neptune. Houston ne répond plus. Si quelqu\'un m\'entend : on reste en orbite, on ne lâche rien.' },
    { auteur: 'Wei Lan, ingénieure', lieu: 'Tiangong', jour: 1, texte: 'Les instruments deviennent fous chaque fois qu\'ils passent. Pas un bruit, pas une lumière : juste nos aiguilles qui tremblent. Je note tout, pour celui qui viendra après.' },
    { auteur: 'Message automatique', lieu: 'Hubble', jour: 2, texte: 'CIBLE TRITON. ANOMALIE DE LUMINOSITÉ : 340 %. OBSERVATION INTERROMPUE. OBSERVATION INTERROMPUE. OBSERVATION INTERROMPUE.' },
    { auteur: 'Dr Samuel Okafor', lieu: 'Base Tycho, Lune', jour: 3, texte: 'Le dôme tient. Nous sommes quarante-deux. De l\'eau pour trois semaines, si personne ne se lave. Personne ne se lave.' },
    { auteur: 'Joe Hennessy, cargo Marguerite', lieu: 'entre la Terre et la Lune', jour: 3, texte: 'Ils m\'ont dépassé sans me voir. Ou ils m\'ont vu, et je ne valais pas un missile. Je ne sais pas ce qui m\'humilie le plus.' },
    { auteur: 'Inès Duarte, opératrice', lieu: 'Relais Hermès', jour: 4, texte: 'Relais Hermès. Je relaie tout ce que j\'entends, même les cris. Surtout les cris. Il faut que quelqu\'un s\'en souvienne.' },
    { auteur: 'Paul Mercier, guide', lieu: 'Mer de la Tranquillité, Lune', jour: 5, texte: 'Les visiteurs sont partis par la dernière navette. Je suis resté avec le drapeau d\'Apollo 11. Il faut bien que quelqu\'un garde la boutique.' },
    { auteur: 'Dr Aiko Tanabe, astronome', lieu: 'James Webb', jour: 6, texte: 'Le spectre de Triton n\'est pas celui d\'une lune. C\'est du métal. Poli. On l\'observe depuis quarante ans sans avoir compris qu\'il nous regardait.' },
    { auteur: 'Enregistreur de bord', lieu: 'Chandra', jour: 7, texte: 'Émissions X depuis Neptune, périodiques : une toutes les 4,7 secondes. Ça ressemble à un battement de cœur. Ou à un moteur qui chauffe.' },
    { auteur: 'Cne Rhys Morgan, escadrille Orion', lieu: 'orbite haute', jour: 8, texte: 'Escadrille Orion. Il ne reste que moi. Leurs chasseurs ne tirent pas au hasard : ils gardent quelque chose, très loin, du côté de Neptune.' },
    { auteur: 'Léa, 9 ans', lieu: 'Tiangong', jour: 9, texte: 'Papa dit que les étoiles vont revenir. Je compte celles qu\'on voit encore par le hublot. Hier, deux cent douze. Aujourd\'hui, deux cent neuf.' },
    { auteur: 'Marcel, radioamateur F6ABC', lieu: 'Bretagne, Terre', jour: 10, texte: 'Ici F6ABC. Les ondes courtes sont pleines de voix venues d\'en haut. Je les écris toutes dans mon cahier. Si vous m\'entendez, dites-moi votre nom.' },
    { auteur: 'Dr Samuel Okafor', lieu: 'Base Tycho, Lune', jour: 12, texte: 'On a creusé. Sous Tycho, il y a une balise plus vieille que les roches qui l\'entourent. Le jour où on l\'a dégagée, elle s\'est mise à émettre. Sur la même fréquence que la chose de Neptune.' },
    { auteur: 'Gaspard « la Pince », nettoyeur', lieu: 'épave Envisat', jour: 20, texte: 'J\'ai récupéré un de leurs débris. Ça ne rouille pas, ça ne brûle pas, ça ne se coupe pas. Mais ça chante, quand on colle l\'oreille contre.' },
    { auteur: 'Cdt Ilse Brandt', lieu: 'ISS', jour: 30, texte: 'Nous avons appris à vivre avec eux, là-haut. Ce n\'est pas une occupation. C\'est une attente. Ils attendent que quelque chose se réveille.' },
  ],
}
