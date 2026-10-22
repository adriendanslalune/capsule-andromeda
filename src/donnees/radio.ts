// La radio de la capsule (décisions d'Adrien du 20/10/2026) : un vieux poste TSF, ouvert depuis la carte (sous le
// RADAR). Bande OC (ondes courtes) : les « Voix perdues », 150 balises laissées par des équipages pendant l'invasion,
// une autre collection que les monolithes. Chacune émet depuis un système, sur sa fréquence, une fois par jour à heure fixe (la même
// pour tous) : il faut être dans ce système au bon moment et rester calé sur elle pour l'enregistrer. Ce sont des
// textes (pas de voix enregistrées : le jeu sera traduit). Bande FM : les groupes de joueurs (avec le serveur).
// Fréquences, horaires et répartition PROVISOIRES ; textes : PREMIER JET, à corriger par Adrien (Terre et Lune,
// Mercure, Vénus, Mars, Jupiter, Saturne) ; les autres systèmes sont à écrire (leurs voix n'émettent pas encore). Le fil : `docs/voix-perdues.md`.

/** La bande OC (MHz) : où se cachent les voix perdues. */
export const BANDE_OC = { min: 3, max: 10 } as const
/** Une voix s'entend à moins de… (MHz) de sa fréquence ; elle est nette à moins de… */
export const LARGEUR_SIGNAL = 0.06
export const SIGNAL_NET = 0.006
/** Rester calé (signal net) pendant… (ms) pour enregistrer une voix. */
export const DUREE_ENREGISTREMENT = 10_000
/** Les horaires d'émission : chaque voix émet DUREE_EMISSION toutes les PERIODE_EMISSION, à son heure à elle. Une fois
 *  par jour (décision d'Adrien du 22/10/2026, au lieu de toutes les 6 heures) : le temps est ce qui fait chercher, il
 *  faut revenir à son heure, même en pleine nuit. */
export const PERIODE_EMISSION = 24 * 3_600_000
export const DUREE_EMISSION = 30 * 60_000

/** Combien de voix dans chaque système (150 en tout). */
export const VOIX_PAR_SYSTEME: Readonly<Record<string, number>> = {
  Mercure: 10, Vénus: 12, Terre: 15, Mars: 20, Jupiter: 22, Saturne: 22, Uranus: 17, Neptune: 18, Pluton: 14,
}
export const NOMBRE_VOIX = Object.values(VOIX_PAR_SYSTEME).reduce((a, b) => a + b, 0)

/** Le texte d'une voix : qui parle, d'où, quand (en jours depuis le début de l'invasion), et ce qu'il dit. */
export interface TexteVoix { auteur: string; lieu: string; jour: number; texte: string }

/**
 * Les textes, par système, dans l'ordre de leurs voix. PREMIER JET : des voix de l'invasion qui, mises
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
  Vénus: [
    { auteur: 'Odile Varenne, maire', lieu: 'Cythère, ville flottante', jour: 2, texte: 'Ici Cythère, ville flottante, à cinquante-cinq kilomètres au-dessus de Vénus. Nous sommes trois mille. Nous flottons. Pour l\'instant, c\'est tout ce que je peux vous promettre.' },
    { auteur: 'Kenji Mori, météorologue', lieu: 'Cythère, ville flottante', jour: 3, texte: 'Leurs vaisseaux sont passés au-dessus de nous sans ralentir. Ils nous ont regardés comme on regarde un caillou au bord du chemin.' },
    { auteur: 'Tullio Ferraris, chef de chœur', lieu: 'Cythère, ville flottante', jour: 5, texte: 'La chorale de Cythère répète tous les soirs à vingt heures. Nous chantons fort, pour que la ville n\'entende pas grincer ses câbles. Les ténors manquent. Les ténors manquent toujours.' },
    { auteur: 'Bertrand Lagarde, contremaître', lieu: 'Chantiers Navals de Vénus', jour: 8, texte: 'Les Chantiers tournent à plein. On construit des navettes avec ce qu\'on a : des tôles, de la colle et beaucoup de jurons. Celle-ci s\'appelle Tant-Pis. Elle vole. Presque.' },
    { auteur: 'Message automatique', lieu: 'Cythère, ville flottante', jour: 10, texte: 'ALTITUDE 54,8 KM. BALLASTS NOMINAUX. PLUIE D\'ACIDE SULFURIQUE PRÉVUE À 14 H. PENSEZ À VOTRE PARAPLUIE. PENSEZ SURTOUT À NE PAS SORTIR.' },
    { auteur: 'Pia, 7 ans', lieu: 'Cythère, ville flottante', jour: 12, texte: 'Maman dit que les nuages sont jaunes à cause du soufre. Moi je dis qu\'ils sont jaunes parce qu\'ils ont peur. Aujourd\'hui, ils étaient presque blancs.' },
    { auteur: 'Kenji Mori, météorologue', lieu: 'Cythère, ville flottante', jour: 17, texte: 'Chaque fois qu\'un de leurs vaisseaux passe, les nuages s\'alignent sous lui en longues rangées parallèles. Des sillons, sur des milliers de kilomètres. Puis le vent les efface.' },
    { auteur: 'Tullio Ferraris, chef de chœur', lieu: 'Cythère, ville flottante', jour: 21, texte: 'Ce soir, nous avons chanté pendant qu\'ils passaient. Je ne sais pas pourquoi. Un vaisseau a ralenti, puis il est reparti. Je préfère croire qu\'il a aimé le deuxième couplet.' },
    { auteur: 'Kenji Mori, météorologue', lieu: 'Cythère, ville flottante', jour: 26, texte: 'J\'ai compris pourquoi ils nous laissent tranquilles. Ils sondent Vénus de haut en bas, puis passent leur chemin, comme on passe devant une parcelle où rien n\'a poussé. Ce qu\'ils cherchent ne vit pas ici.' },
    { auteur: 'Odile Varenne, maire', lieu: 'Cythère, ville flottante', jour: 33, texte: 'Le conseil a voté : Cythère ne descendra pas plus bas, ne montera pas plus haut et ne se rendra pas. C\'est la première fois en dix ans que le conseil vote à l\'unanimité.' },
    { auteur: 'Dr Sofia Ancel, géologue', lieu: 'sonde Ishtar, surface de Vénus', jour: 41, texte: 'Notre dernière sonde a tenu quatre minutes au sol, dans la fournaise. Assez pour voir, sous le basalte, une forme droite, lisse, intacte. Une balise. Même ici, ils avaient posé un œil.' },
    { auteur: 'Bertrand Lagarde, contremaître', lieu: 'Chantiers Navals de Vénus', jour: 58, texte: 'Tant-Pis a décollé vers la Terre avec douze passagers. Si vous la voyez passer, faites-lui signe. Et si elle tombe en morceaux, ce n\'est pas la faute des Chantiers. Enfin, pas entièrement.' },
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
  Mars: [
    { auteur: 'Hélène Castagne, directrice', lieu: 'colonie Bradbury, Mars', jour: 15, texte: 'Ici Bradbury, colonie d\'Arès Titane. Quatre cents colons, deux serres, une mine de titane et un moral à reconstruire. On a connu pire. Non, en fait, on n\'a pas connu pire.' },
    { auteur: 'Mateo Ruiz, mineur', lieu: 'mine de Bradbury', jour: 16, texte: 'On continue à creuser. Le titane ne va pas sortir tout seul, invasion ou pas. Et au fond de la mine, au moins, on ne les voit pas passer.' },
    { auteur: 'Message automatique', lieu: 'rover Curiosity, cratère Gale', jour: 17, texte: 'ANNIVERSAIRE DE L\'ATTERRISSAGE. JOYEUX ANNIVERSAIRE, CURIOSITY. JOYEUX ANNIVERSAIRE, CURIOSITY. PERSONNE N\'A RÉPONDU. JOYEUX ANNIVERSAIRE QUAND MÊME.' },
    { auteur: 'Les jumeaux Oyelaran, Radio Poussière', lieu: 'colonie Bradbury, Mars', jour: 19, texte: 'Ici Radio Poussière, la seule radio de Mars animée par des moins de seize ans ! Au programme : la météo (poussière), les infos (poussière) et la recette du jour : la poussière.' },
    { auteur: 'Cne Yusuf Demir, garde de la colonie', lieu: 'colonie Bradbury, Mars', jour: 22, texte: 'Ils ont posé un vaisseau au sommet d\'Olympus Mons. Vingt-deux kilomètres de haut : de là, ils voient toute la planète. Nous, on voit son feu clignoter toutes les 4,7 secondes.' },
    { auteur: 'Pr Anselme Roux, géologue', lieu: 'flanc d\'Olympus Mons', jour: 25, texte: 'Je connais ce vaisseau. Enfin, je connais ce qu\'il garde. Il y a deux ans, j\'ai trouvé quelque chose dans la caldeira d\'Olympus. Je n\'en ai parlé à personne : on m\'aurait ri au nez.' },
    { auteur: 'Hélène Castagne, directrice', lieu: 'colonie Bradbury, Mars', jour: 28, texte: 'Rationnement : une douche par semaine, un œuf par mois, une blague par jour. Ruiz a déjà épuisé son quota de l\'année.' },
    { auteur: 'Pr Anselme Roux, géologue', lieu: 'caldeira d\'Olympus Mons', jour: 31, texte: 'Une balise, dans la lave figée, plus vieille que le volcan. Elle était muette. Un matin, il y a deux ans, elle s\'est mise à chanter. J\'ai vérifié la date : c\'est le jour où Tycho a ouvert son premier puits, sur la Lune.' },
    { auteur: 'Mateo Ruiz, mineur', lieu: 'mine de Bradbury', jour: 34, texte: 'Dans la mine, on a trouvé un de leurs éclats. J\'ai collé l\'oreille dessus, comme dit le nettoyeur de la radio de la Terre. C\'est vrai, ça chante. Faux, mais ça chante.' },
    { auteur: 'Sœur Agathe', lieu: 'observatoire de Phobos', jour: 38, texte: 'D\'ici, Mars tourne sous nos pieds en moins de huit heures. Je prie à chaque tour. Ça fait beaucoup de prières. Le Seigneur doit commencer à reconnaître ma voix.' },
    { auteur: 'Les jumeaux Oyelaran, Radio Poussière', lieu: 'colonie Bradbury, Mars', jour: 41, texte: 'Flash spécial : un chasseur s\'est posé près des serres cette nuit. Il est reparti ce matin. Rien de cassé. Maman dit qu\'on n\'a pas le droit d\'aller voir. On y est allés quand même.' },
    { auteur: 'Hélène Castagne, directrice', lieu: 'colonie Bradbury, Mars', jour: 42, texte: 'Ils sont entrés dans les serres et n\'ont touché à rien d\'autre. Ils ont prélevé une feuille de chaque plante, une seule, proprement, comme un botaniste. Puis ils sont partis.' },
    { auteur: 'Cne Yusuf Demir, garde de la colonie', lieu: 'colonie Bradbury, Mars', jour: 47, texte: 'Mes gars veulent attaquer le vaisseau d\'Olympus. Avec quoi ? Deux foreuses et un camion-citerne. J\'ai dit non. Ils ont dit : on peut au moins le klaxonner. J\'ai dit d\'accord.' },
    { auteur: 'Pr Anselme Roux, géologue', lieu: 'bord de la caldeira d\'Olympus Mons', jour: 55, texte: 'Je suis monté au bord de la caldeira. Leur vaisseau ne garde pas la balise : il l\'écoute. Il reste posé contre elle des heures, comme on relève un pluviomètre, puis il repart.' },
    { auteur: 'Message automatique', lieu: 'colonie Bradbury, Mars', jour: 60, texte: 'TEMPÊTE DE POUSSIÈRE EN APPROCHE. DURÉE ESTIMÉE : TROIS MOIS. LES COLONS SONT PRIÉS DE RENTRER LE LINGE.' },
    { auteur: 'Sœur Agathe', lieu: 'observatoire de Phobos', jour: 66, texte: 'Les lumières de Deimos se sont éteintes cette nuit : la station relais ne répond plus. J\'ai allumé une bougie pour eux. Une vraie. La dernière de Phobos.' },
    { auteur: 'Les jumeaux Oyelaran, Radio Poussière', lieu: 'colonie Bradbury, Mars', jour: 74, texte: 'Ici Radio Poussière. Aujourd\'hui, pas de blague. Le professeur Roux est parti seul vers Olympus avec son marteau de géologue. Si quelqu\'un le croise, dites-lui que sa soupe refroidit.' },
    { auteur: 'Mateo Ruiz, mineur', lieu: 'mine de Bradbury', jour: 80, texte: 'Pendant la tempête, on ne voit plus le feu d\'Olympus. C\'est bizarre, il me manque. On s\'habitue à tout, même à être surveillé.' },
    { auteur: 'Pr Anselme Roux, géologue', lieu: 'caldeira d\'Olympus Mons', jour: 88, texte: 'Je suis à côté d\'elle, elle chante pour moi. Je crois comprendre : elle ne compte pas les années, elle compte ce qui pousse. Et nous avons poussé jusqu\'ici. Dites à la Terre que nous avons grandi trop vite.' },
    { auteur: 'Hélène Castagne, directrice', lieu: 'colonie Bradbury, Mars', jour: 120, texte: 'Bradbury tient. La tempête est passée, le titane sort de la mine, les serres repoussent. Roux n\'est pas revenu. Sa balise chante toujours. Moi, j\'ai arrêté d\'écouter.' },
  ],
  Jupiter: [
    { auteur: 'Lt Nadia Orlov, flotte jovienne', lieu: 'Ganymède', jour: 60, texte: 'Ici le lieutenant Orlov, flotte jovienne. Il nous reste trois navires sur onze. Je ne vais pas vous mentir : c\'est moi qui commande, maintenant. Personne d\'autre n\'était encore debout.' },
    { auteur: 'Raoul Desforges, Jovienne d\'Hélium', lieu: 'Ganymède', jour: 61, texte: 'La Jovienne d\'Hélium informe son aimable clientèle que les livraisons sont suspendues pour cause d\'invasion. Les tarifs, eux, restent inchangés. Merci de votre fidélité.' },
    { auteur: 'Dr Ingrid Solberg, cheffe de forage', lieu: 'station Conamara, Europe', jour: 63, texte: 'Station Conamara, sur Europe. Ils se sont posés à dix kilomètres de nous et ils ont commencé à forer. Pas vers le métal, pas vers la roche : tout droit vers l\'océan.' },
    { auteur: 'Lev Antonov, doyen des mineurs', lieu: 'Ganymède', jour: 66, texte: 'J\'ai quatre-vingt-onze ans. J\'ai vu la première base de Ganymède, la première naissance, le premier enterrement. Je croyais avoir tout vu. Je râle, donc je vis.' },
    { auteur: 'Message automatique', lieu: 'gazoduc de la Jovienne d\'Hélium', jour: 70, texte: 'DÉBIT D\'HÉLIUM 3 : NUL. PRESSION : NULLE. MORAL DE L\'OPÉRATEUR : NON MESURÉ. VEUILLEZ CONTACTER VOTRE OPÉRATEUR.' },
    { auteur: 'Tama Rangi, volcanologue', lieu: 'Io', jour: 72, texte: 'Sur Io, les volcans crachent du soufre à trois cents kilomètres de haut. Leur amiral se cache dans les panaches. Moi aussi. Nous sommes voisins. Nous ne nous saluons pas.' },
    { auteur: 'Kofi Mensah, foreur', lieu: 'station Conamara, Europe', jour: 77, texte: 'On a descendu une caméra dans leur puits pendant qu\'ils dormaient. S\'ils dorment. Vingt kilomètres de glace, et au fond, une eau noire, tiède, qui bouge.' },
    { auteur: 'Marius, gardien de phare', lieu: 'phare de Valhalla, Callisto', jour: 80, texte: 'Phare de Valhalla, sur Callisto. Rien à signaler, à part un chat qui refuse les croquettes lyophilisées. Lui non plus ne se rendra pas.' },
    { auteur: 'Dr Ingrid Solberg, cheffe de forage', lieu: 'station Conamara, Europe', jour: 84, texte: 'Les images de Kofi. Au fond de l\'océan, une balise, la même que celle de Tycho. Et autour d\'elle, de la vie. Minuscule. Des voiles de microbes, serrés contre elle comme des pousses contre leur tuteur.' },
    { auteur: 'Lt Nadia Orlov, flotte jovienne', lieu: 'Ganymède', jour: 88, texte: 'Le Léviathan est sorti des nuages de Jupiter ce matin. On a vu sa silhouette en entier. J\'ai ordonné à mes trois navires de ne pas tirer. Personne n\'a discuté. Personne ne pouvait parler.' },
    { auteur: 'Raoul Desforges, Jovienne d\'Hélium', lieu: 'Ganymède', jour: 93, texte: 'Offre spéciale de la Jovienne d\'Hélium : pour dix tonnes d\'hélium 3 achetées, la onzième est offerte. Offre valable jusqu\'à la fin de l\'invasion. Ou de la Jovienne.' },
    { auteur: 'Kofi Mensah, foreur', lieu: 'station Conamara, Europe', jour: 99, texte: 'Chaque jour, ils remontent de l\'eau de l\'océan dans des cuves, et un vaisseau les emporte. Pas vers leurs lignes : vers Neptune. Ils envoient des échantillons à quelqu\'un.' },
    { auteur: 'Lev Antonov, doyen des mineurs', lieu: 'Ganymède', jour: 104, texte: 'Les jeunes me demandent si on va gagner. Je leur réponds que j\'ai survécu à trois faillites de la Jovienne, deux épidémies de grippe et un mariage. On va gagner.' },
    { auteur: 'Tama Rangi, volcanologue', lieu: 'Io', jour: 110, texte: 'Un panache a explosé juste sous leur amiral. Il a fait un bond de deux kilomètres. J\'aurais voulu filmer. J\'ai ri, à la place. Ça faisait longtemps.' },
    { auteur: 'Dr Ingrid Solberg, cheffe de forage', lieu: 'station Conamara, Europe', jour: 116, texte: 'J\'ai daté les microbes d\'Europe : ils ont l\'âge des premières traces de vie sur Terre. Même âge, même balise. Quelqu\'un a semé deux jardins le même jour. Le nôtre a poussé. Celui-ci est resté dans le noir.' },
    { auteur: 'Message automatique', lieu: 'station Conamara, Europe', jour: 120, texte: 'CHUTE DE GLACE DANS LE PUITS 3. LE PERSONNEL EST PRIÉ DE NE PAS REGARDER EN BAS. LE PERSONNEL EST PRIÉ DE NE PAS ÉCOUTER CE QUI REMONTE.' },
    { auteur: 'Marius, gardien de phare', lieu: 'phare de Valhalla, Callisto', jour: 126, texte: 'Le chat a mangé les croquettes. C\'est la meilleure nouvelle depuis le début de l\'invasion. Phare de Valhalla, terminé.' },
    { auteur: 'Lt Nadia Orlov, flotte jovienne', lieu: 'Ganymède', jour: 133, texte: 'Nous avons perdu le Saint-Brendan au-dessus d\'Io. Équipage récupéré, navire perdu. Il me reste deux navires et une certitude : on ne recule plus.' },
    { auteur: 'Kofi Mensah, foreur', lieu: 'station Conamara, Europe', jour: 141, texte: 'Leur foreuse s\'est arrêtée juste au-dessus de la balise. Ils ne l\'ont pas touchée. Ils ont mesuré les microbes, longtemps, et noté quelque chose. On aurait dit un inspecteur qui compare deux parcelles.' },
    { auteur: 'Raoul Desforges, Jovienne d\'Hélium', lieu: 'Ganymède', jour: 150, texte: 'La direction de la Jovienne d\'Hélium a démissionné. Je suis désormais directeur commercial, directeur général et standardiste. Nos tarifs restent inchangés.' },
    { auteur: 'Lev Antonov, doyen des mineurs', lieu: 'Ganymède', jour: 162, texte: 'Je ne verrai pas la fin. Mais je l\'ai entendue arriver, dans la radio des jeunes. Gardez ma place au bistrot de Ganymède. Et payez ma tournée : je vous la dois.' },
    { auteur: 'Lt Nadia Orlov, flotte jovienne', lieu: 'Ganymède', jour: 180, texte: 'Si un capitaine de la Résistance m\'entend un jour : venez sur Ganymède, je vous attendrai. Je ne sais pas encore ce qu\'on fera, mais avec deux navires et un capitaine, on fera du bruit.' },
  ],
  Saturne: [
    { auteur: 'Tomás Reyes, pêcheur de méthane', lieu: 'Titan', jour: 150, texte: 'Ici Tomás, pêcheur de méthane, sur Titan. Les lacs sont calmes, le brouillard est orange, et il y a des envahisseurs dans le ciel. Deux de ces trois choses sont normales.' },
    { auteur: 'Inès Carvalho, gardienne de phare', lieu: 'phare de Cassini, anneaux de Saturne', jour: 151, texte: 'Phare de Cassini. Je guide les cargos à travers la division des anneaux depuis vingt ans. Ce matin, plus aucun cargo. Juste le Couronné, posé au milieu de la glace, comme un roi sur son trône.' },
    { auteur: 'Bo Lindqvist, chef de chantier', lieu: 'Glacières des Anneaux', jour: 153, texte: 'Les Glacières des Anneaux suspendent leurs livraisons de glace. Nos découpeurs refusent de sortir tant que le Couronné est là. Je les comprends. Je suis dans le placard.' },
    { auteur: 'Message automatique', lieu: 'sonde Huygens, surface de Titan', jour: 155, texte: 'HUYGENS. BATTERIE ÉPUISÉE DEPUIS 2005. CE MESSAGE NE PEUT PAS ÊTRE ÉMIS. CE MESSAGE EST ÉMIS QUAND MÊME. PRIÈRE DE NE PAS CHERCHER À COMPRENDRE.' },
    { auteur: 'Dr Amara Nwosu, planétologue', lieu: 'base des Geysers, Encelade', jour: 158, texte: 'Base des Geysers, sur Encelade. Les geysers crachent de l\'eau salée dans l\'espace, deux cents kilos par seconde. Leurs chasseurs passent dedans pour se laver. Je n\'invente rien.' },
    { auteur: 'Yann Le Goff, radioamateur', lieu: 'crête de Japet', jour: 160, texte: 'Ici F6YLG, sur la crête de Japet. Une face blanche, une face noire, et moi au milieu avec mon antenne. Je capte la Terre, Mars, Jupiter. Vous êtes nombreux à parler dans le noir.' },
    { auteur: 'Tomás Reyes, pêcheur de méthane', lieu: 'Titan', jour: 164, texte: 'Un chasseur s\'est posé sur mon lac. Il a trempé une sonde dans le méthane, il a attendu, il est reparti. Les poissons n\'existent pas, ici. Il a eu l\'air déçu.' },
    { auteur: 'Inès Carvalho, gardienne de phare', lieu: 'phare de Cassini, anneaux de Saturne', jour: 168, texte: 'Depuis mon phare, je vois la glace des anneaux frissonner. De toutes petites vagues, régulières : une toutes les 4,7 secondes. Le même battement que Neptune, celui dont parlent les voix de la Terre.' },
    { auteur: 'Bo Lindqvist, chef de chantier', lieu: 'Glacières des Anneaux', jour: 172, texte: 'Un de nos découpeurs est sorti malgré tout. Il a rapporté un bloc de glace des anneaux, et dedans, figée, une de leurs balises. Je ne l\'ai pas mise au congélateur. Elle y était déjà depuis toujours.' },
    { auteur: 'Yann Le Goff, radioamateur', lieu: 'crête de Japet', jour: 177, texte: 'Les jeunes de Radio Poussière, sur Mars, m\'ont demandé une chanson bretonne. Je leur ai chanté « Tri martolod ». À Japet, à un milliard de kilomètres, on chante encore faux. C\'est ça, la civilisation.' },
    { auteur: 'Dr Amara Nwosu, planétologue', lieu: 'base des Geysers, Encelade', jour: 182, texte: 'J\'ai cherché une balise dans l\'océan d\'Encelade, comme celle d\'Europe. Il n\'y en a pas. Rien n\'a été semé ici. De l\'eau, de la chaleur, du sel, et rien. Une jachère.' },
    { auteur: 'Tomás Reyes, pêcheur de méthane', lieu: 'Titan', jour: 186, texte: 'Ma femme dit que je parle trop à la radio. Je réponds qu\'à Titan, le brouillard est si épais qu\'on ne voit pas à qui on parle. Alors autant parler à tout le monde.' },
    { auteur: 'Inès Carvalho, gardienne de phare', lieu: 'phare de Cassini, anneaux de Saturne', jour: 191, texte: 'Les vagues des anneaux ont commencé il y a deux ans, le jour où, d\'après les archives, la balise de Tycho s\'est réveillée. Avant, la glace dormait. Quelque chose, là-bas vers Neptune, a ouvert un œil.' },
    { auteur: 'Message automatique', lieu: 'phare de Cassini, anneaux de Saturne', jour: 195, texte: 'FEU DU PHARE : ALLUMÉ. CARGOS EN APPROCHE : 0. CARGOS EN APPROCHE : 0. GARDIENNE : SOUS LA COUVERTURE AVEC UN THÉ.' },
    { auteur: 'Bo Lindqvist, chef de chantier', lieu: 'Glacières des Anneaux', jour: 201, texte: 'Bilan des Glacières : zéro tonne livrée, trois découpeurs en grève, un bloc de glace avec une balise dedans, et un cours en Bourse qui fait le grand huit. Jamais je ne me suis autant amusé.' },
    { auteur: 'Yann Le Goff, radioamateur', lieu: 'crête de Japet', jour: 206, texte: 'Pour ceux qui demandent : Mimas ressemble à une arme gigantesque, avec son cratère. Ce n\'en est pas une. Je suis allé vérifier. C\'est juste un caillou avec un gros trou. Dommage.' },
    { auteur: 'Dr Amara Nwosu, planétologue', lieu: 'base des Geysers, Encelade', jour: 212, texte: 'Europe, oui. La Terre, oui. Encelade, non. Mars, peut-être, il y a longtemps. Ils n\'ont pas semé au hasard : ils ont choisi les mondes où l\'eau dure. Un jardinier qui connaît son sol.' },
    { auteur: 'Tomás Reyes, pêcheur de méthane', lieu: 'Titan', jour: 219, texte: 'Le Couronné a envoyé un chasseur se poser près de chaque base de Titan, une à une, sans tirer. Ils comptent. Ils comptent combien nous sommes. Moi aussi, je compte mes poissons avant de les vendre.' },
    { auteur: 'Inès Carvalho, gardienne de phare', lieu: 'phare de Cassini, anneaux de Saturne', jour: 226, texte: 'J\'ai perdu le compte des jours. Mais le phare reste allumé. Si un cargo de la Résistance passe un jour par la division de Cassini, il trouvera la lumière.' },
    { auteur: 'Bo Lindqvist, chef de chantier', lieu: 'Glacières des Anneaux', jour: 234, texte: 'Nouvelle direction aux Glacières : moi. Premier ordre : on recommence à découper la glace des anneaux. Le Couronné peut regarder. On a des clients à Jupiter qui ont soif.' },
    { auteur: 'Yann Le Goff, radioamateur', lieu: 'crête de Japet', jour: 247, texte: 'Soixante-trois ans de radio, et je n\'ai jamais entendu autant de gens s\'écouter les uns les autres. Il a fallu une invasion pour ça. F6YLG, sur Japet, je vous dis à bientôt.' },
    { auteur: 'Tomás Reyes, pêcheur de méthane', lieu: 'Titan', jour: 260, texte: 'On dit qu\'ils sont venus voir ce qui a poussé. Moi, je pêche depuis quarante ans. Je sais ce qu\'on fait de ce qu\'on vient voir pousser. Quelqu\'un, là-haut, a déjà sorti son panier.' },
  ],
}
