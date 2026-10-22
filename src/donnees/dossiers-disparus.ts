// Les dossiers des Disparus (demande d'Adrien du 22/10/2026) : pour chaque sonde, ce qui s'est passé, quand et
// pourquoi on l'a perdue, d'après sa vraie histoire. Le même texte pour tous (le classeur pourra être imprimé).

export interface DossierDisparu {
  /** Le voyage : le départ et ce qu'elle a fait. */
  voyage: string
  /** Le jour où on l'a perdue (ou où elle s'est tue pour de bon). */
  perte: string
  /** Pourquoi. */
  cause: string
}

export const DOSSIERS: Readonly<Record<number, DossierDisparu>> = {
  1: {
    voyage: 'Partie de Baïkonour le 12 septembre 1959, elle file droit vers la Lune en emportant des fanions métalliques aux armes de l\'URSS.',
    perte: '14 septembre 1959',
    cause: 'C\'était le but : une mission d\'impact, sans aucun moyen de freiner. Elle frappe la Lune à plus de 3 km/s et devient le premier objet humain posé (brutalement) sur un autre monde.',
  },
  2: {
    voyage: 'Après six Ranger ratés, la NASA joue gros. Lancée le 28 juillet 1964, Ranger 7 vise la Lune et allume ses caméras dans les 17 dernières minutes : 4 308 photos, de plus en plus nettes.',
    perte: '31 juillet 1964',
    cause: 'Un impact voulu : elle filme jusqu\'au choc. La mer où elle tombe est rebaptisée Mare Cognitum, la « mer Connue ».',
  },
  3: {
    voyage: 'Lancée le 31 janvier 1966, elle se pose le 3 février dans l\'océan des Tempêtes, protégée par des coussins gonflables, et envoie les premières photos prises au sol d\'un autre monde.',
    perte: '6 février 1966',
    cause: 'Elle n\'avait pas de panneaux solaires : ses batteries s\'épuisent après trois jours de travail.',
  },
  4: {
    voyage: 'Lancée le 17 avril 1967. À l\'atterrissage, le 20 avril, son radar est trompé par des reflets : les moteurs ne coupent pas, elle rebondit trois fois avant de s\'arrêter. Sa pelle creuse ensuite le sol lunaire.',
    perte: '4 mai 1967',
    cause: 'La nuit lunaire (deux semaines à −150 °C) : elle ne se réveille pas. En novembre 1969, les astronautes d\'Apollo 12 se posent à 200 m d\'elle et rapportent sa caméra sur Terre.',
  },
  5: {
    voyage: 'Débarqué le 17 novembre 1970 par Luna 17 dans la mer des Pluies, le premier robot roulant sur un autre monde. Piloté depuis la Terre avec des secondes de retard, il parcourt 10,5 km en onze mois.',
    perte: '14 septembre 1971',
    cause: 'Sa source de chaleur au polonium s\'épuise : il ne passe pas une nuit lunaire de plus. On a retrouvé son réflecteur en 2010, et des lasers terrestres le touchent encore.',
  },
  6: {
    voyage: 'Une petite sonde privée israélienne (SpaceIL), lancée le 22 février 2019 sur une fusée partagée. Elle met sept semaines à rejoindre la Lune en spirales.',
    perte: '11 avril 2019',
    cause: 'Pendant la descente, une centrale de mesure tombe en panne ; la commande envoyée pour la relancer déclenche une réaction en chaîne qui coupe le moteur principal. Elle s\'écrase dans la mer de la Sérénité.',
  },
  7: {
    voyage: 'L\'atterrisseur indien de Chandrayaan-2, lancé le 22 juillet 2019, visait le pôle Sud de la Lune.',
    perte: '6 septembre 2019',
    cause: 'Pendant le freinage final, il freine trop fort puis dévie ; le contact est perdu à 2,1 km du sol. Un ingénieur amateur indien a retrouvé ses débris sur les photos de la NASA.',
  },
  8: {
    voyage: 'La sonde de la société japonaise ispace, lancée le 11 décembre 2022 : le premier atterrissage privé sur la Lune, visé dans le cratère Atlas.',
    perte: '25 avril 2023',
    cause: 'En passant le rebord d\'un cratère, son altimètre voit le sol « sauter » de plusieurs kilomètres ; le logiciel juge la mesure fausse et l\'ignore. Elle se croit au sol à 5 km d\'altitude, descend doucement jusqu\'à la panne sèche, puis tombe.',
  },
  9: {
    voyage: 'Lancée le 12 juin 1967, la première sonde à mesurer directement l\'atmosphère d\'une autre planète. Elle descend sous parachute pendant plus d\'une heure et demie.',
    perte: '18 octobre 1967',
    cause: 'On croyait l\'atmosphère de Vénus semblable à la nôtre : elle est 90 fois plus dense. Prévue pour bien moins, la sonde est écrasée vers 25 km d\'altitude, avant d\'atteindre le sol.',
  },
  10: {
    voyage: 'Lancée le 8 juin 1975, elle se pose le 22 octobre et envoie la première photo prise à la surface d\'une autre planète : des dalles de roche sous un ciel orange.',
    perte: '22 octobre 1975',
    cause: 'Au bout de 53 minutes, son orbiteur relais passe sous l\'horizon. De toute façon, à 485 °C, elle n\'aurait pas tenu longtemps.',
  },
  11: {
    voyage: 'Lancée le 30 octobre 1981, posée le 1er mars 1982 : les premières photos en couleur du sol de Vénus, et une foreuse qui analyse la roche.',
    perte: '1er mars 1982',
    cause: 'Prévue pour 32 minutes, elle en tient 127, sous 457 °C et une pression de 89 bars, avant de cuire.',
  },
  12: {
    voyage: 'Lancée le 3 août 2004, la première sonde en orbite autour de Mercure (2011). Elle cartographie toute la planète et y découvre de la glace au fond des cratères des pôles, à l\'ombre éternelle.',
    perte: '30 avril 2015',
    cause: 'Plus de carburant pour corriger son orbite : elle s\'écrase sur Mercure à près de 4 km/s, creusant un cratère d\'une quinzaine de mètres.',
  },
  13: {
    voyage: 'Lancé le 19 mai 1971 avec son orbiteur, il emporte un petit robot à skis. Le 27 novembre, il devient le premier objet humain à toucher Mars.',
    perte: '27 novembre 1971',
    cause: 'Il entre dans l\'atmosphère sous un angle trop raide ; le parachute ne s\'ouvre pas et il s\'écrase.',
  },
  14: {
    voyage: 'Lancé le 28 mai 1971, il réussit le 2 décembre le premier atterrissage en douceur sur Mars, en pleine tempête de poussière géante.',
    perte: '2 décembre 1971',
    cause: 'Environ vingt secondes après l\'atterrissage, la transmission s\'arrête net, sur une image grise et floue. On n\'a jamais su pourquoi : la tempête, peut-être.',
  },
  15: {
    voyage: 'Lancée le 5 août 1973, elle transmet pendant sa descente les premières mesures de l\'atmosphère martienne, mais une puce défaillante en rend la plupart illisibles.',
    perte: '12 mars 1974',
    cause: 'Le contact est perdu au moment où ses rétrofusées s\'allument, juste avant le sol. Écrasée, très probablement.',
  },
  16: {
    voyage: 'Lancé le 3 janvier 1999 pour se poser près du pôle Sud de Mars et y chercher de l\'eau.',
    perte: '3 décembre 1999',
    cause: 'La cause la plus probable : quand ses jambes se déplient, la secousse fait croire au logiciel qu\'il a touché le sol. Il coupe ses moteurs à une quarantaine de mètres et tombe.',
  },
  17: {
    voyage: 'Le petit atterrisseur britannique, rêve du savant Colin Pillinger, largué par Mars Express le 19 décembre 2003. Il devait se poser le jour de Noël.',
    perte: '25 décembre 2003',
    cause: 'Silence radio. Douze ans plus tard, en 2015, une photo prise en orbite le retrouve : il s\'était bien posé, mais ses panneaux solaires ne se sont pas tous dépliés et cachaient son antenne. Pillinger était mort l\'année d\'avant.',
  },
  18: {
    voyage: 'L\'atterrisseur d\'essai européen d\'ExoMars, lancé le 14 mars 2016, pour apprendre à se poser sur Mars.',
    perte: '19 octobre 2016',
    cause: 'À l\'ouverture du parachute, une centrale de mesure sature pendant une seconde ; le logiciel en déduit une altitude négative, largue le parachute et coupe ses rétrofusées à près de 4 km du sol. Chute libre.',
  },
  19: {
    voyage: 'Posé le 4 janvier 2004 dans le cratère Gusev pour une mission de 90 jours, il roule six ans et plus de 7 km, une roue bloquée traînée derrière lui.',
    perte: '22 mars 2010',
    cause: 'Ensablé depuis 2009, il ne peut plus tourner ses panneaux vers le Soleil. L\'hiver martien le prive d\'énergie : il ne répond plus.',
  },
  20: {
    voyage: 'Posé le 25 janvier 2004 pour 90 jours, il roule plus de 14 ans et 45 km, plus qu\'un marathon, sur la plaine de Meridiani.',
    perte: '10 juin 2018',
    cause: 'Une tempête de poussière couvre toute la planète et éteint le Soleil. Ses batteries se vident ; la NASA l\'appelle pendant huit mois, puis abandonne le 13 février 2019.',
  },
  21: {
    voyage: 'Lancé le 4 août 2007, posé le 25 mai 2008 dans les plaines arctiques de Mars. Il gratte le sol et confirme qu\'il y a de la glace d\'eau juste dessous.',
    perte: '2 novembre 2008',
    cause: 'L\'hiver arrive, le Soleil disparaît. Les photos de 2010 montrent ses panneaux solaires brisés par le poids de la glace carbonique.',
  },
  22: {
    voyage: 'Lancée le 12 juillet 1988, en orbite de Mars en janvier 1989, elle s\'approchait de la lune Phobos pour y larguer deux petits atterrisseurs, dont un qui sautait.',
    perte: '27 mars 1989',
    cause: 'Son ordinateur de bord tombe en panne pendant une manœuvre : elle perd son orientation, et le contact.',
  },
  23: {
    voyage: 'Lancée le 2 janvier 1959 pour frapper la Lune, elle relâche en route un nuage de sodium orange, visible depuis la Terre.',
    perte: '5 janvier 1959',
    cause: 'Une erreur de guidage : elle manque la Lune de 6 000 km et devient, par accident, le premier objet humain en orbite autour du Soleil. Ses batteries s\'épuisent deux jours plus tard.',
  },
  24: {
    voyage: 'Lancée le 12 février 1961, la toute première sonde envoyée vers une autre planète.',
    perte: '19 février 1961',
    cause: 'Un capteur d\'orientation surchauffe ; elle se tait à deux millions de kilomètres de la Terre et passe muette près de Vénus en mai.',
  },
  25: {
    voyage: 'Lancée le 1er novembre 1962, la première sonde partie vers Mars.',
    perte: '21 mars 1963',
    cause: 'Une fuite du gaz qui servait à l\'orienter : son antenne ne vise plus la Terre. Elle frôle Mars, muette, le 19 juin 1963.',
  },
  26: {
    voyage: 'Lancée le 28 novembre 1964, elle survole Mars le 14 juillet 1965 et envoie les premières photos d\'une autre planète vue de près : des cratères, un monde sec et mort.',
    perte: '21 décembre 1967',
    cause: 'Fin de mission : usée, presque à court de gaz, criblée de micrométéorites, la NASA coupe le contact.',
  },
  27: {
    voyage: 'Lancée le 7 juillet 1988 vers Mars et sa lune Phobos, avec sa jumelle Phobos 2.',
    perte: '2 septembre 1988',
    cause: 'Le 29 août, une commande envoyée depuis la Terre contient une erreur d\'un seul caractère ; elle désactive son orientation. Ses panneaux ne voient plus le Soleil, ses batteries se vident.',
  },
  28: {
    voyage: 'Lancée le 25 septembre 1992, la première sonde américaine vers Mars depuis Viking.',
    perte: '21 août 1993',
    cause: 'Trois jours avant l\'arrivée, on coupe sa radio pour pressuriser ses réservoirs. Elle ne revient jamais. La cause probable : une fuite de carburant qui rompt une conduite.',
  },
  29: {
    voyage: 'Lancée le 11 décembre 1998 pour étudier le climat de Mars.',
    perte: '23 septembre 1999',
    cause: 'Un logiciel compte en livres-force, l\'autre en newtons. L\'erreur d\'unités l\'amène à 57 km de Mars au lieu de 150 : elle se désintègre dans l\'atmosphère.',
  },
  30: {
    voyage: 'Lancée le 4 juillet 1998, la première sonde japonaise vers Mars. Une vanne défaillante lui fait brûler trop de carburant : il faut lui inventer une route plus longue, quatre ans de plus.',
    perte: '9 décembre 2003',
    cause: 'En 2002, une éruption solaire grille une partie de son électronique ; son carburant gèle. Elle passe à 1 000 km de Mars le 14 décembre 2003 sans pouvoir freiner.',
  },
  31: {
    voyage: 'Lancée le 3 juillet 2002 pour visiter deux noyaux de comètes.',
    perte: '15 août 2002',
    cause: 'En allumant son moteur à poudre pour quitter la Terre, elle se brise en plusieurs morceaux, sans doute surchauffée par son propre moteur.',
  },
  32: {
    voyage: 'Lancée le 12 janvier 2005, elle lance un projectile sur la comète Tempel 1 le 4 juillet 2005, pour voir ce qu\'il y a dedans, puis visite la comète Hartley 2 en 2010.',
    perte: '8 août 2013',
    cause: 'Son horloge comptait en dixièmes de seconde depuis l\'an 2000 : le compteur déborde, l\'ordinateur redémarre en boucle et elle perd son orientation. Déclarée perdue le 20 septembre 2013.',
  },
  33: {
    voyage: 'Lancée le 17 février 1996, la première sonde en orbite autour d\'un astéroïde : Éros, rejoint le 14 février 2000, jour de la Saint-Valentin.',
    perte: '28 février 2001',
    cause: 'Fin de mission. Le 12 février 2001, on tente de la poser sur Éros alors qu\'elle n\'était pas faite pour ça : elle réussit et parle encore deux semaines depuis le sol.',
  },
  34: {
    voyage: 'Le petit atterrisseur de Rosetta, posé le 12 novembre 2014 sur la comète Tchourioumov-Guérassimenko, à 500 millions de km de la Terre.',
    perte: '9 juillet 2015',
    cause: 'Ses harpons ne tirent pas : il rebondit deux fois et finit coincé à l\'ombre d\'une falaise. Il travaille 60 heures sur batteries, se réveille brièvement à l\'été 2015, puis se tait. Rosetta le photographie enfin le 2 septembre 2016.',
  },
  35: {
    voyage: 'Lancée le 2 mars 2004, elle met dix ans à rattraper sa comète et devient le 6 août 2014 la première sonde en orbite autour d\'une comète.',
    perte: '30 septembre 2016',
    cause: 'La comète s\'éloigne du Soleil, l\'énergie solaire faiblit. Plutôt que de la laisser s\'éteindre, on la pose doucement sur la comète, en photographiant jusqu\'au bout.',
  },
  36: {
    voyage: 'Larguée par Galileo en juillet 1995, elle plonge dans Jupiter le 7 décembre 1995 à 47 km/s, freinée par un bouclier qui fond.',
    perte: '7 décembre 1995',
    cause: 'Elle parle 58 minutes en descendant sous les nuages, jusqu\'à 22 bars, puis la chaleur et la pression ont raison d\'elle. Elle fond, puis se vaporise.',
  },
  37: {
    voyage: 'Lancée le 15 octobre 1997, en orbite autour de Saturne de 2004 à 2017 : des geysers sur Encelade, des mers sur Titan. Pour finir, 22 plongées entre la planète et ses anneaux.',
    perte: '15 septembre 2017',
    cause: 'Presque plus de carburant. Pour ne jamais risquer de contaminer Encelade ou Titan, où la vie est peut-être possible, on la jette dans Saturne ; elle transmet jusqu\'à la dernière seconde.',
  },
  38: {
    voyage: 'Larguée par Cassini le 25 décembre 2004, elle descend 2 h 30 dans la brume de Titan et se pose le 14 janvier 2005 sur un sol de galets de glace : l\'atterrissage le plus lointain jamais réussi.',
    perte: '14 janvier 2005',
    cause: 'Elle émet 72 minutes depuis le sol, jusqu\'à ce que Cassini, qui relayait ses messages, passe sous l\'horizon. Ses batteries s\'éteignent peu après.',
  },
  39: {
    voyage: 'Lancée le 6 avril 1973, elle frôle Jupiter en 1974, puis devient la première sonde à visiter Saturne, le 1er septembre 1979.',
    perte: '30 septembre 1995',
    cause: 'Son générateur nucléaire faiblit avec les années : elle ne peut plus tourner son antenne vers la Terre. Elle file toujours hors du système solaire.',
  },
  40: {
    voyage: 'Lancée le 2 mars 1972, la première à traverser la ceinture d\'astéroïdes et à survoler Jupiter (3 décembre 1973). Elle porte une plaque gravée : un homme, une femme, et l\'adresse de la Terre.',
    perte: '23 janvier 2003',
    cause: 'Son générateur nucléaire est trop faible : son dernier murmure arrive de 12 milliards de km. Elle file dans la direction de l\'étoile Aldébaran, qu\'elle approchera dans deux millions d\'années.',
  },
}
