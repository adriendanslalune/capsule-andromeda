# Les formes de la capsule : fiche de prompts pour ChatGPT

Adrien, 24/10/2026 : après les amiraux, les formes de la capsule du joueur. Le niveau du capitaine change la forme de
son engin tous les 20 niveaux (`src/donnees/niveaux.ts`) : Capsule (1), Navette (20), Corvette (40), Frégate (60),
Croiseur (80), Légende (100, dorée). La première existe déjà : c'est l'image du combat (`public/vaisseaux/capsule.webp`).
Il en reste cinq, qui doivent avoir l'air de la même famille, à chaque fois un cran plus grande, plus armée, plus fière.
Sur la carte, la taille grandit aussi avec le niveau (Adrien, 24/10/2026) : la Légende fait cinq fois la capsule.

## Où on les voit (décisions d'Adrien du 24/10/2026)

- **La fenêtre de niveau** : la forme en grand.
- **Le combat** : la capsule du joueur prend sa forme (un peu plus large pour les grandes formes ; sa zone de touche ne
  change pas, ni la difficulté).
- **La carte** : les mêmes images pour tout le monde (choix B), le joueur, les bots et plus tard les autres joueurs ;
  **un anneau cerise sous la capsule du joueur seulement** (Adrien : ceux des Maisons gâchaient la lisibilité, tant pis
  pour l'appartenance). Loin, les autres sont un point crème, le même pour tous.
- **Le Profil** : la forme du capitaine, à côté de son tampon.

Une forme pas encore dessinée garde sa silhouette de Claude (`src/carte/vaisseaux.ts`) ; on inscrit chaque image
arrivée dans `FORMES_PRETES` (`public/vaisseaux/navette.webp`, `corvette`, `fregate`, `croiseur`, `legende`).

## Refonte : un clin d'œil à la SF par palier (Adrien, 25/10/2026)

Les quatre premières formes reçues se ressemblaient trop (« la même famille, un cran plus grande » : de loin, cinq fois
la même flèche crème et orange). Validé par Adrien le 25/10/2026 : chaque palier devient un clin d'œil à un vaisseau
culte de la science-fiction, avec une silhouette vue du dessus qu'on reconnaît d'un coup d'œil, même en tout petit
sur la carte (une poutre, un disque, une aiguille, une soucoupe, une roue). On refait les cinq (Navette, Corvette,
Frégate, Croiseur, Légende) ; la Capsule reste. **Un clin d'œil, pas une copie** : la silhouette rappelle l'original,
mais tout est habillé dans notre style (droits d'auteur : le jeu aura une boutique et un Manuel imprimé ; et ChatGPT
refuse souvent de recopier un vaisseau protégé). Les images reçues remplacent les anciennes au même nom de fichier ;
leurs flammes sont remesurées.

D'autres clins d'œil (le Nostromo, Serenity, le Thunderbird 3, la fusée de Tintin, un destroyer en triangle…)
pourront venir plus tard en **livrées de la boutique** (Adrien, 25/10/2026), sans rien faire gagner.

## Comment s'y prendre

1. Dans une nouvelle conversation, **envoyer d'abord l'image de la capsule** (celle du combat), en disant : « voici
   le style du jeu ; garde exactement ce style de dessin, ces couleurs et cette vue de dessus ».
2. Coller le **bloc de style**, puis la fiche d'une forme.
3. **Fond transparent**, format carré 1024 × 1024.
4. Envoyer les images telles quelles, en disant laquelle c'est : Claude les recadre, les allège et les range.

## Le bloc de style (à coller avant chaque fiche)

> Vaisseau spatial humain pour un jeu de tir spatial, vu **strictement du dessus** (vue zénithale, comme dans un
> shoot'em up), parfaitement **symétrique** gauche-droite, la **proue pointée vers le haut** de l'image. Dans le style
> de la capsule jointe : rétro-futurisme des années 60-70, pulp, coque **crème** rivetée, **bandes orange vif**,
> panneaux vissés, tuyères grises à l'arrière. Style bande dessinée de Moebius (Jean Giraud) : ligne claire, trait
> d'encre brun-violet foncé net et assez épais, grands aplats de couleurs pastel, ombres en aplats. **Un clin d'œil à
> un vaisseau célèbre de la science-fiction, pas une copie** : on reconnaît sa silhouette générale, mais les détails,
> les proportions et la livrée sont les nôtres ; aucun logo, aucune inscription, aucun numéro. **Silhouette simple,
> forte et lisible même en tout petit.** Le vaisseau seul, centré, qui remplit l'image. **Fond transparent**, aucun
> décor, aucun astre, aucun personnage, aucun texte, aucun cadre. Format carré, 1024 × 1024.

## Les cinq formes

**La Navette** (niveau 20), clin d'œil à l'Eagle de *Cosmos 1999*. Une longue poutre en treillis apparent qui
court de l'avant à l'arrière ; à l'avant, une petite cabine-cockpit au nez arrondi avec ses hublots ; au milieu, un
module de charge rectangulaire accroché sous la poutre ; quatre pieds d'atterrissage repliés aux coins, comme des
pattes d'araignée ; à l'arrière, un bloc de quatre tuyères. Un engin de travail, modeste et costaud.

**La Corvette** (niveau 40), clin d'œil au cargo rapide en forme de soucoupe (le Faucon Millenium). Un **disque
plat** large, avec à l'avant **deux mandibules** parallèles qui s'avancent en fourche ; le **cockpit** dans un petit
tube sur le côté droit du disque ; une parabole radar sur le dos ; au centre, des trappes et des tuyaux ; à
l'arrière du disque, une longue fente de propulsion lumineuse. Rapide, bricolé, attachant.

**La Frégate** (niveau 60), clin d'œil au Discovery One de *2001, l'Odyssée de l'espace*. Une silhouette en
**aiguille très longue et très fine** : à l'avant une **sphère** (le module de commande) avec ses hublots, puis une
longue épine faite de modules alignés et de réservoirs, de petites antennes ; à l'arrière, le bloc des moteurs plus
large, avec ses radiateurs en ailettes. Élégante, silencieuse, sérieuse.

**Le Croiseur** (niveau 80), clin d'œil au vaisseau de *Star Trek* (l'Enterprise). Une **grande soucoupe** ronde
à l'avant, reliée par un col à un **corps** fuselé ; à l'arrière, **deux longues nacelles** de propulsion parallèles,
portées par deux pylônes, de part et d'autre du corps ; la soucoupe striée de panneaux et de hublots, une coupole au
centre. Noble et rassurant : le vaisseau amiral de la Résistance.

**La Légende** (niveau 100), clin d'œil à l'Arcadia d'Albator (choisi par Adrien le 25/10/2026, au lieu du
vaisseau-anneau de *2001* : deux fois *2001*, et une roue n'impressionnait pas). Un **cuirassé corsaire de l'espace**,
long et majestueux : une coque de **navire de guerre** effilée, une **proue en éperon** pointue à l'avant, un pont
étagé au milieu avec ses **tourelles de canons en batterie** de part et d'autre, un haut **château arrière** à
plusieurs étages (la passerelle), de courts **ailerons** latéraux, et à l'arrière une grande tuyère principale
entourée de plus petites. **Aucune tête de mort, aucun drapeau, aucun emblème de pirate** (nos ennemis portent déjà le
drapeau pirate) : à la place, une étoile à quatre branches gravée sur la proue. **Toute la livrée en or** : coque
crème et or, bandes dorées au lieu d'orange, rivets dorés, liserés dorés le long des ponts. Il doit écraser tout le
reste : au bout d'un an de jeu, le vaisseau le plus mythique du ciel.

## Anciennes formes (avant la refonte)

La première série (« même famille que la capsule, un cran plus grande ») : la Navette à aile delta, la Corvette en
flèche, la Frégate en catamaran, le Croiseur étagé comme un paquebot ; puis, dans la refonte, une Légende en roue
(le vaisseau-anneau de *2001*), remplacée par l'Arcadia. Elles restent dans le jeu tant que leurs
remplaçantes ne sont pas arrivées.

## Reçus

- **La Capsule** (24/10/2026) : déjà au combat.
- **La Navette** (24/10/2026).
- **La Corvette** (24/10/2026).
- **La Frégate** (24/10/2026).
- **Le Croiseur** (24/10/2026).
- **La Navette, refonte** (25/10/2026) : l'Eagle de Cosmos 1999.
- **La Corvette, refonte** (25/10/2026) : le cargo-soucoupe à mandibules.
- **La Frégate, refonte** (25/10/2026) : le Discovery One de 2001.
- **Le Croiseur, refonte** (25/10/2026) : l'Enterprise, une lueur rouge au bout des nacelles.
- **La Légende, refonte** (25/10/2026) : le vaisseau-anneau de 2001 ; ses bandes orange passées en or par Claude, et elle reste dorée quelle que soit la Maison.
- **La Légende, l'Arcadia** (25/10/2026) : dorée d'origine, une lueur dorée à ses tuyères ; elle remplace la roue.
