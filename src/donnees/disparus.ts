// Les Disparus (idée validée par Adrien le 21/10/2026) : de vraies sondes perdues dans le système solaire, que le radar
// retrouve. Une collection de quarante, du plus facile (la Lune) au plus lointain (Pioneer 10, à plus de 140 UA).
// Leurs histoires sont vraies ; leurs emplacements aussi pour celles posées sur un astre (latitude, longitude
// approchées), approximatifs pour celles qui tournent autour du Soleil (on ne sait plus où elles sont).

/** Où est une sonde disparue. */
export type LieuDisparu =
  /** Posée (ou écrasée) sur un astre, à sa latitude et sa longitude (degrés). */
  | { genre: 'sol'; astre: string; lat: number; lon: number }
  /** En orbite autour d'un astre (rayon en km). */
  | { genre: 'orbite'; astre: string; rayon: number }
  /** En orbite autour du Soleil, à tant d'UA, partie de cette longitude (degrés) au 1er janvier 2000. */
  | { genre: 'soleil'; ua: number; longitude: number }
  /** Un engin que le jeu suit déjà sur sa vraie trajectoire (Pioneer 10 et 11, en route vers la sortie). */
  | { genre: 'engin' }

export interface Disparu {
  numero: number
  nom: string
  /** Qui l'a lancée, et quand. */
  qui: string
  annee: number
  /** Son histoire, vraie, en deux phrases. */
  histoire: string
  /** L'indice du classeur (sa case grise) : où chercher. */
  indice: string
  lieu: LieuDisparu
}

const D = (numero: number, nom: string, qui: string, annee: number, lieu: LieuDisparu, indice: string, histoire: string): Disparu =>
  ({ numero, nom, qui, annee, lieu, indice, histoire })

export const DISPARUS: readonly Disparu[] = [
  // La Lune.
  D(1, 'Luna 2', 'URSS', 1959, { genre: 'sol', astre: 'Lune', lat: 29.1, lon: 0 }, 'Sur la Lune, au nord de sa face visible.',
    'Le premier objet humain à toucher un autre monde : elle s\'écrase sur la Lune le 14 septembre 1959, près du cratère Autolycus.'),
  D(2, 'Ranger 7', 'NASA', 1964, { genre: 'sol', astre: 'Lune', lat: -10.6, lon: -20.7 }, 'Sur la Lune, dans une mer de sa face visible.',
    'Elle photographie la Lune jusqu\'à l\'impact : plus de 4 000 images, les dernières prises à quelques centaines de mètres du sol.'),
  D(3, 'Luna 9', 'URSS', 1966, { genre: 'sol', astre: 'Lune', lat: 7.1, lon: -64.4 }, 'Sur la Lune, dans l\'océan des Tempêtes.',
    'Le premier atterrissage en douceur sur un autre monde, le 3 février 1966 ; elle envoie les premières photos prises depuis le sol.'),
  D(4, 'Surveyor 3', 'NASA', 1967, { genre: 'sol', astre: 'Lune', lat: -3, lon: -23.4 }, 'Sur la Lune, près de l\'équateur de sa face visible.',
    'Posée en 1967 ; deux ans et demi plus tard, les astronautes d\'Apollo 12 se posent à côté d\'elle et lui démontent sa caméra.'),
  D(5, 'Lunokhod 1', 'URSS', 1970, { genre: 'sol', astre: 'Lune', lat: 38.3, lon: -35 }, 'Sur la Lune, dans la mer des Pluies.',
    'Le premier robot à rouler sur un autre monde : plus de 10 km, piloté depuis la Terre, avant de se taire en 1971.'),
  D(6, 'Beresheet', 'SpaceIL (Israël)', 2019, { genre: 'sol', astre: 'Lune', lat: 32.6, lon: 19.3 }, 'Sur la Lune, dans la mer de la Sérénité.',
    'Une petite sonde privée : un moteur coupé au mauvais moment, et elle s\'écrase en avril 2019, à quelques kilomètres du but.'),
  D(7, 'Vikram', 'ISRO (Inde)', 2019, { genre: 'sol', astre: 'Lune', lat: -70.9, lon: 22.8 }, 'Sur la Lune, près de son pôle Sud.',
    'L\'atterrisseur de Chandrayaan-2 perd le contact à 2 km du sol et s\'écrase en septembre 2019.'),
  D(8, 'Hakuto-R', 'ispace (Japon)', 2023, { genre: 'sol', astre: 'Lune', lat: 47.5, lon: 44.1 }, 'Sur la Lune, au nord-est de sa face visible.',
    'Trompée par son altimètre au-dessus d\'un cratère, elle tombe à court de carburant et s\'écrase en avril 2023.'),
  // Vénus et Mercure.
  D(9, 'Venera 4', 'URSS', 1967, { genre: 'sol', astre: 'Vénus', lat: 19, lon: 38 }, 'Sur Vénus, sous ses nuages.',
    'La première sonde à mesurer l\'atmosphère d\'une autre planète, en octobre 1967 ; la pression l\'écrase bien avant le sol.'),
  D(10, 'Venera 9', 'URSS', 1975, { genre: 'sol', astre: 'Vénus', lat: 31, lon: -68.4 }, 'Sur Vénus, sous ses nuages.',
    'Elle envoie la toute première photo prise à la surface d\'une autre planète : des roches plates sous un ciel jaune.'),
  D(11, 'Venera 13', 'URSS', 1982, { genre: 'sol', astre: 'Vénus', lat: -7.5, lon: -57 }, 'Sur Vénus, sous ses nuages.',
    'Les premières photos en couleurs de Vénus, et 127 minutes de survie dans une fournaise de plus de 450 °C.'),
  D(12, 'MESSENGER', 'NASA', 2004, { genre: 'sol', astre: 'Mercure', lat: 54.4, lon: -149.9 }, 'Sur Mercure, dans son hémisphère Nord.',
    'Après quatre ans en orbite autour de Mercure, à court de carburant, elle s\'y écrase volontairement le 30 avril 2015.'),
  // Mars.
  D(13, 'Atterrisseur de Mars 2', 'URSS', 1971, { genre: 'sol', astre: 'Mars', lat: -45, lon: 47 }, 'Sur Mars, loin dans son hémisphère Sud.',
    'Le premier objet humain à toucher Mars : son atterrisseur s\'y écrase en novembre 1971, en pleine tempête de poussière.'),
  D(14, 'Atterrisseur de Mars 3', 'URSS', 1971, { genre: 'sol', astre: 'Mars', lat: -45, lon: -158 }, 'Sur Mars, loin dans son hémisphère Sud.',
    'Le premier atterrissage en douceur sur Mars, le 2 décembre 1971… puis une vingtaine de secondes de transmission, et plus rien.'),
  D(15, 'Mars 6', 'URSS', 1973, { genre: 'sol', astre: 'Mars', lat: -24, lon: -19.5 }, 'Sur Mars, au sud de l\'équateur.',
    'Elle transmet pendant toute sa descente, mais se tait à quelques secondes du sol, en mars 1974.'),
  D(16, 'Mars Polar Lander', 'NASA', 1999, { genre: 'sol', astre: 'Mars', lat: -76, lon: 165 }, 'Sur Mars, près de son pôle Sud.',
    'Perdue à l\'atterrissage en décembre 1999 : ses moteurs se sont sans doute coupés trop tôt.'),
  D(17, 'Beagle 2', 'ESA, Royaume-Uni', 2003, { genre: 'sol', astre: 'Mars', lat: 11.5, lon: 90.4 }, 'Sur Mars, dans une grande plaine au nord de l\'équateur.',
    'Silencieuse depuis Noël 2003, retrouvée sur des photos en 2015 : posée intacte, mais ses panneaux solaires ne s\'étaient pas tous ouverts.'),
  D(18, 'Schiaparelli', 'ESA', 2016, { genre: 'sol', astre: 'Mars', lat: -2.05, lon: -6.2 }, 'Sur Mars, près de l\'équateur.',
    'Un capteur affolé lui fait croire qu\'elle est déjà posée : elle largue son parachute trop haut et s\'écrase en octobre 2016.'),
  D(19, 'Spirit', 'NASA', 2003, { genre: 'sol', astre: 'Mars', lat: -14.6, lon: 175.5 }, 'Sur Mars, dans un grand cratère au sud de l\'équateur.',
    'Prévu pour 90 jours, il roule plus de six ans ; ensablé, il se tait en 2010.'),
  D(20, 'Opportunity', 'NASA', 2003, { genre: 'sol', astre: 'Mars', lat: -2.2, lon: -5.5 }, 'Sur Mars, près de l\'équateur.',
    'Plus de 45 km parcourus en quatorze ans ; en 2018, une tempête de poussière géante masque le Soleil, et il ne se réveille jamais.'),
  D(21, 'Phoenix', 'NASA', 2007, { genre: 'sol', astre: 'Mars', lat: 68.2, lon: -125.7 }, 'Sur Mars, près de son pôle Nord.',
    'Elle touche la glace du sous-sol martien en 2008 ; l\'hiver polaire l\'ensevelit sous le givre, et elle ne se réveille pas.'),
  D(22, 'Phobos 2', 'URSS', 1988, { genre: 'orbite', astre: 'Mars', rayon: 9700 }, 'En orbite autour de Mars, près de Phobos.',
    'En orbite autour de Mars en 1989, elle s\'approche de Phobos pour y poser deux atterrisseurs… et se tait quelques jours avant.'),
  // Perdues autour du Soleil.
  D(23, 'Luna 1', 'URSS', 1959, { genre: 'soleil', ua: 1.15, longitude: 41 }, 'Autour du Soleil, un peu au-delà de l\'orbite de la Terre.',
    'Elle devait frapper la Lune et la manque de 6 000 km : la voilà premier objet humain en orbite autour du Soleil.'),
  D(24, 'Venera 1', 'URSS', 1961, { genre: 'soleil', ua: 0.85, longitude: 133 }, 'Autour du Soleil, entre Vénus et la Terre.',
    'La première sonde envoyée vers Vénus ; le contact est perdu en route, à quelques millions de kilomètres de la Terre.'),
  D(25, 'Mars 1', 'URSS', 1962, { genre: 'soleil', ua: 1.24, longitude: 227 }, 'Autour du Soleil, entre la Terre et Mars.',
    'Partie pour survoler Mars, elle se tait en mars 1963, à plus de 100 millions de kilomètres de la Terre.'),
  D(26, 'Mariner 4', 'NASA', 1964, { genre: 'soleil', ua: 1.33, longitude: 312 }, 'Autour du Soleil, entre la Terre et Mars.',
    'Le premier survol réussi de Mars et ses 21 photos d\'un monde cratérisé ; elle tourne encore autour du Soleil.'),
  D(27, 'Phobos 1', 'URSS', 1988, { genre: 'soleil', ua: 1.28, longitude: 18 }, 'Autour du Soleil, entre la Terre et Mars.',
    'Une commande erronée lui fait éteindre son orientation : perdue en route vers Mars, en septembre 1988.'),
  D(28, 'Mars Observer', 'NASA', 1992, { genre: 'soleil', ua: 1.44, longitude: 95 }, 'Autour du Soleil, près de l\'orbite de Mars.',
    'Perdue le 21 août 1993, trois jours avant sa mise en orbite autour de Mars ; on soupçonne une fuite de carburant.'),
  D(29, 'Mars Climate Orbiter', 'NASA', 1998, { genre: 'soleil', ua: 1.42, longitude: 264 }, 'Autour du Soleil, près de l\'orbite de Mars.',
    'Une équipe calculait en livres-force, l\'autre en newtons : elle passe beaucoup trop bas sur Mars en septembre 1999 et disparaît.'),
  D(30, 'Nozomi', 'ISAS (Japon)', 1998, { genre: 'soleil', ua: 1.35, longitude: 178 }, 'Autour du Soleil, entre la Terre et Mars.',
    'Après cinq ans de voyage et mille ennuis, elle manque sa mise en orbite autour de Mars en décembre 2003.'),
  D(31, 'CONTOUR', 'NASA', 2002, { genre: 'soleil', ua: 1.02, longitude: 300 }, 'Autour du Soleil, près de l\'orbite de la Terre.',
    'Partie visiter deux comètes, elle se brise en morceaux à l\'allumage de son moteur, en août 2002.'),
  D(32, 'Deep Impact', 'NASA', 2005, { genre: 'soleil', ua: 0.98, longitude: 77 }, 'Autour du Soleil, près de l\'orbite de la Terre.',
    'Elle a bombardé la comète Tempel 1 pour voir ce qu\'il y a dedans ; perdue en 2013, son horloge ayant débordé.'),
  D(33, 'NEAR Shoemaker', 'NASA', 1996, { genre: 'soleil', ua: 1.46, longitude: 205 }, 'Autour du Soleil, posée sur l\'astéroïde Éros.',
    'La première sonde posée sur un astéroïde, Éros, le 12 février 2001, sans même avoir été conçue pour atterrir.'),
  D(34, 'Philae', 'ESA', 2004, { genre: 'soleil', ua: 3.46, longitude: 151 }, 'Autour du Soleil, sur une comète, au-delà de Mars.',
    'Posé sur la comète Tchourioumov-Guérassimenko en novembre 2014, il rebondit deux fois et se coince à l\'ombre d\'une falaise.'),
  D(35, 'Rosetta', 'ESA', 2004, { genre: 'soleil', ua: 3.46, longitude: 151.3 }, 'Autour du Soleil, sur une comète, au-delà de Mars.',
    'Après deux ans à accompagner sa comète, elle se pose doucement près de Philae le 30 septembre 2016, et se tait.'),
  // Les géantes.
  D(36, 'Sonde de Galileo', 'NASA', 1989, { genre: 'sol', astre: 'Jupiter', lat: 6.5, lon: 4.4 }, 'Dans les nuages de Jupiter, près de l\'équateur.',
    'Larguée par Galileo, elle plonge dans Jupiter en décembre 1995 et transmet près d\'une heure avant d\'être broyée.'),
  D(37, 'Cassini', 'NASA, ESA', 1997, { genre: 'sol', astre: 'Saturne', lat: 9.4, lon: 53 }, 'Dans les nuages de Saturne.',
    'Treize ans autour de Saturne ; pour ne pas contaminer ses lunes, elle plonge dans la planète le 15 septembre 2017.'),
  D(38, 'Huygens', 'ESA', 1997, { genre: 'sol', astre: 'Titan', lat: -10.6, lon: 167.7 }, 'Sur Titan, sous sa brume.',
    'Posée sur Titan le 14 janvier 2005 : l\'atterrissage le plus lointain jamais réussi, sur un sol de galets de glace.'),
  // Les confins : Pioneer 10 et 11 sur leurs vraies trajectoires (JPL), cachées jusqu'à ce qu'on les retrouve.
  D(39, 'Pioneer 11', 'NASA', 1973, { genre: 'engin' }, 'Aux confins, à plus de 115 UA, vers la constellation de l\'Aigle.',
    'La première à survoler Saturne, en 1979 ; son dernier signal date de 1995. Elle file vers l\'Aigle.'),
  D(40, 'Pioneer 10', 'NASA', 1972, { genre: 'engin' }, 'Aux confins, à plus de 135 UA, vers Aldébaran.',
    'La première à traverser la ceinture d\'astéroïdes et à survoler Jupiter ; dernier signal en 2003. Elle file vers Aldébaran, avec sa plaque gravée.'),
]

export const NOMBRE_DISPARUS = DISPARUS.length

/** Portée de l'écho d'une sonde posée ou en orbite (km) : un objet minuscule, il faut passer tout près (et au-dessus). */
export const ECHO_PROCHE = 20_000
/** Une sonde posée ne répond que si on passe au-dessus d'elle : à moins de tant de degrés de la verticale. */
export const ANGLE_AU_DESSUS = 70
/** Rayon de la zone de recherche (km) d'une sonde perdue autour du Soleil ou aux confins (son indice sur la carte). */
export const ZONE_RECHERCHE = 1_500_000

/** Le Disparu de ce nom, s'il en est un. */
export function disparu(nom: string): Disparu | undefined {
  return DISPARUS.find((d) => d.nom === nom)
}
