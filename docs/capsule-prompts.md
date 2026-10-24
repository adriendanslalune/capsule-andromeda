# Les formes de la capsule : fiche de prompts pour ChatGPT

Adrien, 24/10/2026 : après les amiraux, les formes de la capsule du joueur. Le niveau du capitaine change la forme de
son engin tous les 20 niveaux (`src/donnees/niveaux.ts`) : Capsule (1), Navette (20), Corvette (40), Frégate (60),
Croiseur (80), Légende (100, dorée). La première existe déjà : c'est l'image du combat (`public/vaisseaux/capsule.webp`).
Il en reste cinq, qui doivent avoir l'air de la même famille, à chaque fois un cran plus grande, plus armée, plus fière.
Ce qui montre le niveau, c'est la silhouette, pas la taille : sur la carte, la Légende ne fait que 1,25 fois la capsule.

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

## Comment s'y prendre

1. Dans la conversation des amiraux (ou une nouvelle), **envoyer d'abord l'image de la capsule** (celle du combat), en
   disant : « voici le premier vaisseau de la série ; garde exactement ce style, cette livrée et cette vue de dessus pour
   les suivants ».
2. Coller le **bloc de style**, puis la fiche d'une forme, dans l'ordre (chacune s'appuie sur la précédente).
3. **Fond transparent**, format carré 1024 × 1024.
4. Envoyer les images telles quelles, en disant laquelle c'est : Claude les recadre, les allège et les range.

## Le bloc de style (à coller avant chaque fiche)

> Vaisseau spatial humain pour un jeu de tir spatial, vu **strictement du dessus** (vue zénithale, comme dans un
> shoot'em up), parfaitement **symétrique** gauche-droite, la **proue pointée vers le haut** de l'image. Même famille que
> la capsule jointe : rétro-futurisme des années 60-70, pulp, coque **crème** rivetée, **bandes orange vif**, panneaux
> vissés, tuyère grise à l'arrière. Style bande dessinée de Moebius (Jean Giraud) : ligne claire, trait d'encre
> brun-violet foncé net et assez épais, grands aplats de couleurs pastel, ombres en aplats. **Construit, pas poussé** :
> tôles, rivets, hublots, ailerons, réacteurs (tout le contraire des vaisseaux organiques d'Andromède). **Silhouette
> simple, forte et lisible même en tout petit**, différente des autres formes de la série. Le vaisseau seul, centré,
> qui remplit l'image. **Fond transparent**, aucun décor, aucun astre, aucun personnage, aucun texte, aucun cadre.
> Format carré, 1024 × 1024.

## Les cinq formes

**La Navette** (niveau 20). Le premier vrai grade. La capsule a grandi : un fuselage plus long, une grande aile delta
façon navette spatiale, un cockpit vitré à l'avant, deux tuyères. Toujours modeste : un engin de travail, pas de
guerre.

**La Corvette** (niveau 40). Un petit vaisseau de combat : fuselage effilé comme une flèche, deux ailerons en
flèche vers l'arrière, deux petits canons de part et d'autre du nez, trois tuyères. Vif, nerveux.

**La Frégate** (niveau 60). Un vaisseau d'escadre : un fuselage central et **deux nacelles moteur** parallèles,
reliées par des bras, comme un catamaran ; des antennes, une tourelle sur le dos. Plus large que long.

**Le Croiseur** (niveau 80). Un navire de ligne : long fuselage étagé comme un paquebot, plusieurs ponts, des
tourelles, de grandes ailes en flèche, quatre tuyères. Massif, imposant, mais toujours la livrée crème et orange.

**La Légende** (niveau 100). Le sommet, au bout d'un an de jeu : la même famille que le Croiseur, plus élancée, plus
noble, **toute la livrée en or** (coque crème et or, bandes dorées au lieu d'orange, rivets dorés), des ailes en
éventail, un emblème (une étoile à quatre branches) gravé sur le dos. Elle doit faire envie.

## Reçus

- **La Capsule** (24/10/2026) : déjà au combat.
- **La Navette** (24/10/2026).
- **La Corvette** (24/10/2026).
