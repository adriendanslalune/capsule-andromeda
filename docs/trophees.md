# Les trophées

Adrien, 24/10/2026 : cadre validé (voir CLAUDE.md) ; les 150 premiers, validés par Adrien et codés le même jour
(`src/donnees/trophees.ts` en est tiré ; les conditions sont dans `src/moteur/trophees.ts`). Pour en ajouter : une ligne
ici, la même dans les données, sa condition dans le moteur. Chaque trophée : son nom, sa phrase (affichée une fois gagné), ce qui le déclenche, sa rareté (**B** bronze,
**A** argent, **O** or). Les secrets (**S**, 38 sur 150, environ un quart) restent grisés sans indice tant qu'on ne les
a pas ; les autres montrent leur condition comme indice. Aucune récompense : la gloire seulement.

## 1. Voyage (25)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 1 | Premier tour de manège | « Ça bouge ! Ça bouge vraiment ! » | Finir son premier trajet | B |
| 2 | Petit pas pour un capitaine | « Neil n'avait pas de capsule aussi belle. » | Se mettre en orbite autour de la Lune | B |
| 3 | Touriste rouge | « Les cartes postales de Mars sont surfaites. » | Se mettre en orbite autour de Mars | B |
| 4 | Il fait chaud ici, non ? | « 465 °C à l'ombre. Il n'y a pas d'ombre. » | Se mettre en orbite autour de Vénus | B |
| 5 | Coup de soleil | « Mercure : à consommer avec de la crème indice 5 000. » | Se mettre en orbite autour de Mercure | B |
| 6 | Le roi des planètes | « Jupiter vous salue. Jupiter salue tout le monde. » | Se mettre en orbite autour de Jupiter | A |
| 7 | Seigneur des anneaux | « Un anneau pour les gouverner tous. Enfin, sept. » | Se mettre en orbite autour de Saturne | A |
| 8 | Couché sur le côté | « Uranus roule. Personne ne sait pourquoi. » | Se mettre en orbite autour d'Uranus | A |
| 9 | Bleu de bleu | « Le vent y souffle à 2 000 km/h. Gardez votre chapeau. » | Se mettre en orbite autour de Neptune | A |
| 10 | Planète un jour, planète toujours | « Pour nous, Pluton reste une planète. Na. » | Se mettre en orbite autour de Pluton | O |
| 11 | Grand Tour | « Même les Voyager n'ont pas fait ça. » | Avoir été en orbite autour des 8 planètes | O |
| 12 | Collectionneur de lunes | « Une lune, deux lunes, trois lunes… zzz. » | Avoir été en orbite autour de 10 lunes différentes | A |
| 13 | Lunatique | « Il n'en reste plus une. » | Avoir été en orbite autour de toutes les grandes lunes (plus de 200 km) | O |
| 14 | Pantoufles orbitales (S) | « Pourquoi partir quand on est si bien ici ? » | Rester 7 jours en orbite au même endroit | B |
| 15 | Marathonien du vide | « Le plus long trajet du monde. Enfin, du système. » | Finir un trajet de plus de 24 h | A |
| 16 | Bougeotte | « Les pieds qui chauffent, le moteur aussi. » | Finir 100 trajets | A |
| 17 | Vagabond céleste | « On ne vous a pas vu depuis des semaines. » | Finir 1 000 trajets | O |
| 18 | Unité astronomique | « 150 millions de km. Et pas un seul péage. » | Parcourir 1 UA en tout | B |
| 19 | Banlieue de Neptune | « Au-delà, il n'y a plus que des glaçons et des rumeurs. » | Parcourir 100 UA en tout | O |
| 20 | Pied au plancher | « La vitesse max. Le seul vrai bonheur. » | Atteindre la vitesse max du moteur 10 | O |
| 21 | Mécanique d'abord | « Le moteur 2. Le début d'une grande histoire. » | Installer son premier nouveau moteur | B |
| 22 | Formule 1 spatiale | « Plus vite que la lumière ? Non. Mais pas loin. Non plus. » | Installer le moteur 10 | O |
| 23 | Aller-retour inutile (S) | « Vous avez oublié quelque chose ? » | Partir et revenir au même endroit en moins de 10 min | B |
| 24 | Changement de programme (S) | « En fait, non. » | Changer de destination en plein vol trois fois dans le même trajet | B |
| 25 | Retour au bercail (S) | « La Terre vous a manqué, avouez. » | Revenir en orbite terrestre après 30 jours sans y être allé | A |

## 2. Contrats (30)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 26 | Bon pour le service | « Un contrat, c'est un contrat. » | Finir son premier contrat | B |
| 27 | Intérimaire galactique | « Toujours dispo, jamais payé assez. » | Finir 25 contrats | B |
| 28 | Employé du mois | « Votre photo est affichée dans toutes les stations. » | Finir 100 contrats | A |
| 29 | Stakhanoviste | « Vous dormez quand, au juste ? » | Finir 500 contrats | O |
| 30 | Fée du logis spatial | « Pas une miette dans l'orbite. » | Trier 1 000 objets (VIDER) | A |
| 31 | Marie Kondo de l'espace | « Cette ferraille vous apporte-t-elle de la joie ? » | Trier 10 000 objets | O |
| 32 | Série parfaite | « Pas une erreur. Pas une seule. » | Finir un tri sans une erreur | B |
| 33 | Ça, c'est pas recyclable (S) | « Si, si. Tout se recycle. Même vous. » | Rater 10 objets de suite dans un tri | B |
| 34 | Pêcheur d'épaves | « Elle était grosse comme ça. » | Harponner une épave du premier coup | B |
| 35 | Cow-boy du vide | « Yiiihaaa. Silencieux, parce que l'espace. » | Remorquer 25 épaves | A |
| 36 | Ricochet (S) | « Le grappin préfère jouer au billard. » | Rater le harponnage 5 fois sur la même épave | B |
| 37 | Livraison à domicile | « Signez ici. Et là. Et là. » | Finir un contrat AMARRER sans rebond | B |
| 38 | Chauffeur de cargos | « Attention à la marche. » | Finir 25 contrats AMARRER | A |
| 39 | Auto-tamponneuse (S) | « On ne vous a jamais appris à freiner ? » | Rebondir 5 fois dans le même amarrage | B |
| 40 | Tournevis cosmique | « Il suffisait de rebrancher le câble bleu. » | Finir un dépannage RÉPARER sans fausse manœuvre | B |
| 41 | Docteur ès satellites | « Les satellites vous envoient des cartes de vœux. » | Finir 25 contrats RÉPARER | A |
| 42 | Lecteur assidu (S) | « Le Manuel, c'est comme un roman. En moins drôle. » | Ouvrir le Manuel pendant 10 dépannages | B |
| 43 | Garde du corps | « Personne ne touche à mes cargos. » | Finir une escorte sans un coup reçu | B |
| 44 | Berger de l'espace | « Les cargos vous suivent comme des canetons. » | Finir 25 escortes | A |
| 45 | Chat en colère (S) | « Les cargos, ça ne se range pas comme ça. » | Faire retourner 5 cargos au hangar dans la même formation | B |
| 46 | Chasseur de primes | « Mort ou vif. Plutôt mort. » | Finir 25 contrats ABATTRE | A |
| 47 | Tout-terrain | « Je sais tout faire. Enfin, presque. » | Finir au moins un contrat de chacun des six genres | A |
| 48 | Tous les chemins mènent à Rome | « Neuf systèmes, neuf patrons. » | Finir un contrat dans chacun des 9 systèmes | O |
| 49 | Prime au premier coup | « Du premier coup ! » | Toucher 10 primes de 10 % | A |
| 50 | Perfectionniste | « Encore une prime. Les autres vous détestent. » | Toucher 100 primes de 10 % | O |
| 51 | Démission (S) | « Finalement, ce contrat n'était pas pour moi. » | Abandonner 10 contrats | B |
| 52 | Nettoyeur de cœur | « La ferraille, c'est une vocation. » | Rejoindre les Nettoyeurs | B |
| 53 | Ingénieur dans l'âme | « Le monde a besoin de gens qui serrent des boulons. » | Rejoindre les Ingénieurs | B |
| 54 | Mercenaire au grand cœur | « Ma loyauté s'achète. Mais pas cher. » | Rejoindre les Mercenaires | B |
| 55 | Girouette (S) | « Une Maison par saison. » | Changer de Maison 3 fois | B |

## 3. Combat et pannes (22)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 56 | Premier sang (vert) | « Les aliens saignent vert. Qui l'eût cru ? » | Abattre son premier chasseur | B |
| 57 | As de l'espace | « Cinq victoires : vous êtes officiellement un as. » | Abattre 5 chasseurs | B |
| 58 | Terreur d'Andromède | « Là-bas, on raconte votre nom aux petits aliens. » | Abattre 100 chasseurs | A |
| 59 | Fléau des jardiniers | « Mille. Ils commencent à vous en vouloir. » | Abattre 1 000 chasseurs | O |
| 60 | Intouchable | « Pas une égratignure. » | Gagner un combat sans être touché | B |
| 61 | Boum boum boum (S) | « Pourquoi garder ses bombes pour plus tard ? » | Lancer toutes ses bombes dans la première minute d'un combat | B |
| 62 | Radin des bombes (S) | « On ne sait jamais. » | Gagner 20 combats sans lancer une bombe | A |
| 63 | Sur un fil (S) | « Il restait un point de coque. Un seul. » | Gagner un combat avec une seule case de coque | A |
| 64 | Retraite stratégique | « Ce n'est pas fuir, c'est mieux attaquer plus tard. » | Battre en retraite pour la première fois | B |
| 65 | Libérateur | « La Lune est libre ! Enfin, la Lune. » | Libérer sa première zone | A |
| 66 | Ménage intérieur | « Mars, Vénus, Mercure : propre. » | Libérer les trois planètes intérieures | A |
| 67 | Tombeur d'amiraux | « Ils sont grands, ils sont gros, ils sont tombés. » | Abattre 10 vaisseaux amiraux | A |
| 68 | Le jardin est fermé | « Triton n'était pas une lune. Triton n'est plus. » | Abattre TRITON | O |
| 69 | Libérateur du système | « Le système solaire vous doit une fière chandelle. » | Libérer les 26 zones occupées | O |
| 70 | Œil de lynx | « Je vous ai vu venir. » | Repérer 50 chasseurs au radar | A |
| 71 | Missile à la poubelle | « PAF ! » | Intercepter son premier missile | B |
| 72 | Le mur de Pong | « Rien ne passe. » | Intercepter 100 missiles | A |
| 73 | Aimant à missiles (S) | « Ils vous aiment, on dirait. » | Prendre 3 impacts en une journée | B |
| 74 | Garagiste de l'espace | « CLONK ! » | Réparer son premier module sur le panneau | B |
| 75 | Mécano en chef | « Le Manuel ? Je le connais par cœur. » | Réparer 100 modules | A |
| 76 | Tout casse (S) | « Il ne reste plus que l'autoradio. » | Avoir 4 modules en panne en même temps | A |
| 77 | Appeler un ami (S) | « Allô, le dépanneur ? » | Appeler le dépanneur pour la première fois | B |

## 4. Argent, Comptoir et Bourse (20)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 78 | Tirelire | « Les petits ruisseaux font les grandes rivières. » | Avoir 1 000 crédits | B |
| 79 | Picsou orbital | « Plonger dans ses crédits comme dans une piscine. » | Avoir 100 000 crédits | A |
| 80 | Crésus des Confins | « L'argent ne fait pas le bonheur. Mais il fait les moteurs. » | Avoir 1 000 000 de crédits | O |
| 81 | Fauché comme les blés (S) | « Zéro. Rien. Nada. » | Tomber à 0 crédit après en avoir eu au moins 1 000 | B |
| 82 | Marchand de ferraille | « Ferraille, vieux cuivre, j'achète tout ! » | Vendre 100 t de matériaux au Comptoir | A |
| 83 | Soute pleine | « Plus rien ne rentre. Même pas une cuillère. » | Remplir la soute (20 t) | B |
| 84 | Tour du Comptoir | « Les meilleurs prix sont toujours ailleurs. » | Commercer dans 5 comptoirs différents | A |
| 85 | Hélium en vrac | « Une tonne d'hélium 3. De quoi rire longtemps. » | Avoir 10 t d'hélium 3 dans la soute | A |
| 86 | Premier pas en Bourse | « Ding ! Votre ordre est parti. » | Passer son premier ordre en Bourse | B |
| 87 | Petit porteur | « Une action. Le début d'un empire. » | Posséder des actions de 3 compagnies en même temps | B |
| 88 | Diversification | « On ne met pas tous ses œufs dans le même panier. » | Posséder des actions des 9 compagnies en même temps | A |
| 89 | Loup de Wall Street lunaire | « 10 000 crédits de bénéfice. Ça mérite un costume. » | Gagner 10 000 crédits en revendant des actions | A |
| 90 | Acheter haut, vendre bas (S) | « La méthode infaillible pour s'appauvrir. » | Revendre une position à perte de plus de 50 % | B |
| 91 | Initié (S) | « Une rumeur ? Quelle rumeur ? » | Acheter après une rumeur des bots, et revendre plus haut | A |
| 92 | Ordre à la vitesse de la lumière (S) | « Votre ordre a mis 5 heures à arriver. Patience. » | Passer un ordre qui met plus d'une heure à arriver au siège | B |
| 93 | Tout sur le rouge (S) | « Tout. Absolument tout. » | Mettre TOUS ses crédits (plus de 5 000) dans une seule compagnie | A |
| 94 | Frais de courtage | « La banque vous remercie. » | Payer 1 000 crédits de frais en tout | A |
| 95 | Mécène | « L'armement, c'est un investissement. » | Acheter un niveau dans chacune des 4 lignes d'armement | A |
| 96 | Armé jusqu'aux dents | « Coque, canon, bombes, bouclier : tout au max. » | Toutes les lignes d'armement au niveau 6 | O |
| 97 | Écureuil (S) | « Garder, garder, garder. » | Garder 1 t de chacun des 7 matériaux en même temps | B |

## 5. Collections (20)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 98 | Eurêka ! | « Il était là, tout ce temps. » | Ramasser son premier monolithe | B |
| 99 | Écouteur | « Ping… ping… ping… » | Ramasser 10 monolithes | B |
| 100 | Sourcier | « La baguette tremble. » | Ramasser 50 monolithes | A |
| 101 | Arpenteur | « Vous connaissez le système comme votre poche. » | Ramasser 100 monolithes | A |
| 102 | Oracle | « Mille. Vous êtes fou. Vous êtes magnifique. » | Ramasser les 1 000 monolithes | O |
| 103 | Pinger compulsif (S) | « Ping. Ping. Ping. Ping. » | Envoyer 100 PING | B |
| 104 | Triangulation | « Trois cercles, un point. Les maths, c'est beau. » | Trouver un monolithe en trois PING ou moins | A |
| 105 | Allô, quelqu'un ? | « Une voix dans le vide. » | Enregistrer sa première Voix perdue | B |
| 106 | Radio-amateur | « Les ondes n'ont plus de secret pour vous. » | Enregistrer 25 Voix perdues | A |
| 107 | Insomniaque (S) | « Il était 4 h du matin. La voix aussi. » | Enregistrer une Voix perdue entre 2 h et 5 h du matin (heure du téléphone) | A |
| 108 | Les jardiniers | « Maintenant, vous savez. » | Enregistrer les 150 Voix perdues | O |
| 109 | Carnet d'un système | « Toutes les voix de Mars. Elles ne se taisent plus. » | Compléter le carnet d'un système | A |
| 110 | Archéologue de l'espace | « Une sonde ! Une vraie ! » | Retrouver son premier Disparu | B |
| 111 | Bureau des objets trouvés | « Dix sondes. Dix histoires. » | Retrouver 10 Disparus | A |
| 112 | La NASA vous remercie | « Toutes. Elles sont toutes rentrées à la maison. » | Retrouver les 40 Disparus | O |
| 113 | Dernier signal | « Pioneer 10 vous fait coucou. » | Retrouver Pioneer 10 | A |
| 114 | Rendez-vous sur 67P | « Philae dormait. Vous l'avez réveillé. » | Retrouver Philae | A |
| 115 | Lecteur de dossiers | « Toute la vérité, rien que la vérité. » | Lire 10 dossiers de Disparus | B |
| 116 | Grand collectionneur | « Votre classeur pèse trois tonnes. » | 100 monolithes, 50 voix et 20 Disparus | O |
| 117 | Au mauvais endroit (S) | « La voix était ailleurs. Comme toujours. » | Écouter 30 minutes la bande OC sans rien capter | B |

## 6. Le monde (22)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 118 | Queue de comète | « Ne léchez pas la queue. » | Se mettre en orbite autour d'une comète | B |
| 119 | Rendez-vous en 2061 | « Halley ne repasse pas. Vous, si. » | Se mettre en orbite autour de la comète de Halley | A |
| 120 | Tête de bonhomme de neige | « Arrokoth : l'objet le plus lointain jamais visité. Par vous aussi. » | Se mettre en orbite autour d'Arrokoth | O |
| 121 | Adieu ʻOumuamua | « Il ne reviendra jamais. Vous l'avez vu. » | Se mettre en orbite autour de ʻOumuamua | O |
| 122 | Le 13 avril 2029 | « Apophis frôle la Terre. Vous aussi. » | Être en orbite autour d'Apophis le 13 avril 2029 | O |
| 123 | Ceinture bouclée | « Cérès, Vesta : la ceinture d'astéroïdes n'a plus de secrets. » | Se mettre en orbite autour de Cérès et de Vesta | A |
| 124 | Confins des confins | « Sedna. Il fait froid, il fait noir, il fait loin. » | Se mettre en orbite autour de Sedna | O |
| 125 | Voisin de l'ISS (S) | « Vous avez emprunté du sel aux astronautes. » | Passer 24 h en orbite près de l'ISS | B |
| 126 | Photographe | « Hubble vous a pris en photo. » | Se mettre en orbite autour de Hubble | B |
| 127 | Point de Lagrange | « James Webb vous voit en infrarouge. » | Se mettre en orbite autour de James Webb | A |
| 128 | Les deux Voyager | « Les plus lointaines ambassadrices de la Terre. » | Se mettre en orbite autour de Voyager 1 et de Voyager 2 | O |
| 129 | Icare (S) | « Vous avez encore fait le rêve du Soleil… » | Foncer dans le Soleil (le titre secret) | A |
| 130 | Volcan d'Io (S) | « Ça sent le soufre. » | Se mettre en orbite autour d'Io | B |
| 131 | Mordor (S) | « Un seul anneau… Ah non, c'est Charon. » | Se mettre en orbite autour de Charon | A |
| 132 | Lune à l'envers (S) | « Triton tourne à l'envers. C'est louche, non ? » | Se mettre en orbite autour de Triton avant de l'avoir libéré | A |
| 133 | Feu d'artifice (S) | « Oooh ! Aaaah ! » | Regarder un feu d'artifice de libération jusqu'au bout | B |
| 134 | Minuit à Paris (S) | « L'Europe dort. Pas vous. » | Jouer à minuit pile (heure du téléphone) | B |
| 135 | Nuit blanche (S) | « Il est 4 h. Allez vous coucher. » | Jouer entre 3 h et 4 h du matin | B |
| 136 | Fidèle au poste | « Une semaine de suite. » | Ouvrir le jeu 7 jours de suite | A |
| 137 | Pilier du cockpit | « Un mois de suite. Vous habitez là ? » | Ouvrir le jeu 30 jours de suite | O |
| 138 | Anniversaire (S) | « Un an déjà ! Joyeux anniversaire, capitaine. » | Jouer le jour anniversaire de sa capsule | O |
| 139 | Mode nuit (S) | « Les yeux vous remercient. » | Passer le jeu en thème sombre | B |

## 7. Capitaine et Messages (11)

| # | Nom | Phrase | Condition | |
|---|---|---|---|---|
| 140 | Capitaine breveté | « Vous avez un tampon. Vous êtes quelqu'un. » | Choisir son nom de capitaine | B |
| 141 | Navette ! | « Vingt niveaux, une navette. » | Atteindre le niveau 20 | A |
| 142 | Croiseur ! | « Quatre-vingts niveaux, un vrai navire. » | Atteindre le niveau 80 | O |
| 143 | Légende | « Niveau 100. On vous dédiera des statues. » | Atteindre le niveau 100 | O |
| 144 | Bavard | « Allô ? Vous m'entendez ? Avec le délai de la lumière ? » | Envoyer 10 messages | B |
| 145 | Pipelette | « Vous écrivez plus que vous ne pilotez. » | Envoyer 500 messages | A |
| 146 | Copains de comptoir | « On se connaît, non ? » | Écrire en privé à 5 capitaines différents | B |
| 147 | Bonjour, l'autre ! (S) | « Salut, voisin d'orbite ! » | Répondre à un capitaine croisé sur la même orbite | B |
| 148 | Changement d'identité (S) | « Ce n'est plus moi, c'est l'autre. » | Changer de nom de capitaine | B |
| 149 | Lecteur de pulps | « Une revue par niveau. » | Lire 10 fenêtres de niveau | B |
| 150 | Chasseur de trophées | « Ce trophée est pour avoir gagné des trophées. » | Gagner 100 trophées | O |

## Remarques

- Les trophées liés au serveur (attaquer un capitaine, Pirate, vol en formation, groupes FM) viendront avec lui.
- Certains demandent de nouveaux compteurs (distance parcourue, PING envoyés, messages envoyés, jours de suite…) :
  ils ne comptent qu'à partir du jour où les trophées arrivent (rien de rétroactif, sauf ce que la sauvegarde sait déjà).
