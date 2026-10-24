# Portraits et décors des PNJ : fiche de prompts pour ChatGPT

Adrien, 24/10/2026 : la mise en page du dialogue en case de BD est validée (`maquette-dialogue.html`), et les portraits
comme les décors seront faits par ChatGPT, d'après cette fiche. En attendant, le jeu montre les dessins SVG de Claude
(`src/commun/portraits.ts`) ; chaque image qui arrive remplace son dessin. Les descriptions des personnages sont des propositions de Claude,
tirées de leur rôle et de leurs répliques : à corriger librement.

## Comment s'y prendre

1. **Une seule conversation pour les treize**, pour que le style reste le même d'un portrait à l'autre.
2. Coller d'abord le **bloc de style** (ci-dessous), puis la fiche d'un personnage. Commencer par Elsa : une fois son
   portrait réussi, dire « garde exactement ce style pour tous les suivants ».
3. Pour chaque personnage, l'humeur **neutre** d'abord. Puis, sur la même image : « même personnage, même cadrage, même
   tenue, seule l'expression change : joyeuse » (puis « soucieuse »). Trois images par personnage.
4. **Fond** : transparent si ChatGPT y arrive (« fond transparent, PNG ») ; sinon un aplat uni d'une seule couleur, vert
   vif (#00FF00), sans ombre ni dégradé : Claude le découpera. Le décor du lieu est dessiné par le jeu, derrière.
5. Format carré, 1024 × 1024. Envoyer les images telles quelles : Claude les recadre, les allège et les range dans
   `public/portraits/`.

## Le bloc de style (à coller avant chaque fiche)

> Portrait en buste d'un personnage de bande dessinée de science-fiction, dans le style de Moebius (Jean Giraud) :
> ligne claire, trait d'encre fin et régulier brun-violet foncé, aplats de couleurs pastel sans dégradé, ombres posées
> en aplats d'une seule teinte plus foncée, lumière venant de la gauche. Palette douce : crème, pêche, vert d'eau, bleu
> pâle, lavande, moutarde, avec des touches d'orange vif. Ambiance rétro-futuriste des années 1970, un peu
> bande dessinée d'aventure. Cadrage : tête et épaules, de face ou de trois quarts, la tête dans la moitié haute de
> l'image, le buste coupé par le bas du cadre. Pas de texte, pas de cadre, pas de bulle. Aucun logo ni insigne
> existant (ni Star Wars, ni NASA, ni aucune marque) : l'écusson de la Résistance est une planète à anneau crème sur
> un disque orange. Fond transparent (sinon aplat
> vert vif uni #00FF00).

## Les treize personnages

### Elsa Varga · Commandante de la Résistance · ISS
Femme d'environ 47 ans, d'origine hongroise. Cheveux gris argent coupés court, une mèche balayée sur le côté. Visage
anguleux, mâchoire ferme, yeux bleu-gris, petite cicatrice sur la pommette droite. Combinaison de vol bleu pâle à col
montant, écusson orange de la Résistance sur la poitrine, casque radio avec micro. Chef calme et chaleureuse, qui ne
lâche rien. Neutre : regard droit, léger sourire. Joie : sourire franc. Souci : sourcils froncés, mâchoire serrée.

### Dr Amadou Keïta · Sélénologue en exil · Lune
Homme malien d'environ 64 ans, peau très foncée. Crâne dégarni, couronne de cheveux blancs, courte barbe blanche,
lunettes rondes cerclées. Gilet de laine lavande sur une chemise, longue écharpe moutarde. Savant doux, un peu
pince-sans-rire, qui a peur de devenir fou. Joie : rire derrière ses lunettes. Souci : regard par-dessus les lunettes.

### Dr Samuel Okafor · Chef de la base Tycho · Station Tycho
Homme nigérian d'environ 52 ans, peau foncée, carrure large. Cheveux ras, barbe de trois jours, cernes de fatigue.
Combinaison de travail moutarde tachée, casquette bleu pâle de la base. Il tient quarante-deux personnes en vie sous un
dôme qui fuit : épuisé mais debout. Joie : soulagement, sourire las. Souci : regard dans le vide.

### Le Veilleur · Ermite qui écoute le ciel · Hubble
Vieil homme sans âge, très longue barbe blanche et cheveux blancs sous une capuche de bure gris-bleu. Gros casque
d'écoute à l'ancienne, laiton et cuir, par-dessus la capuche. Yeux presque toujours fermés : il écoute. Mystique et
facétieux. Joie : sourire paisible, yeux fermés. Souci : un œil entrouvert, aux aguets.

### Rosa Mendès · Contrebandière · Tiangong
Femme d'environ 34 ans, peau mate, cheveux noirs très bouclés tenus par un bandana orange à pois. Créole dorée à
l'oreille, sourcil fendu d'une cicatrice, sourire en coin. Blouson de cuir brun sur un débardeur corail. Gouailleuse,
maligne, jamais un mot de trop. Joie : grand sourire canaille. Souci : moue méfiante.

### Hélène Castagne · Directrice de la colonie Bradbury · Mars
Femme d'environ 56 ans, peau claire hâlée, taches de rousseur, poussière rouge sur les joues. Carré gris, lunettes de
protection aux verres vert d'eau relevées sur le front. Combinaison corail usée. Pragmatique, humour sec. Joie :
sourire en coin, fatigué. Souci : sourcils froncés, lèvres pincées.

### Odile Varenne · Maire de Cythère, la ville flottante · Cythère
Femme d'environ 66 ans, élégante, cheveux blancs en chignon, boucles d'oreilles en perles. Chemisier lavande, écharpe
tricolore de maire en travers. Optimiste et digne, grande dame de la ville volante. Joie : rire chaleureux. Souci :
inquiétude contenue, regard vers le ciel.

### Aurelio Benedetti · Chef de quart au Phare de Mercure · Phare de Mercure
Homme italien d'environ 41 ans, peau dorée luisante de chaleur, cheveux bruns courts, grosse moustache. Lunettes de
soudeur aux verres noirs relevées sur le front, chemise blanche aux manches retroussées, bretelles. Truculent,
débrouillard, une goutte de sueur sur la tempe. Joie : grand sourire sous la moustache. Souci : sourcils en accent
circonflexe.

### Nadia Orlov · Capitaine de la flotte jovienne · Ganymède
Femme russe d'environ 42 ans, cheveux blond platine coupés court sur les côtés, sous un képi d'officier bleu marine.
Yeux bleus froids, pommettes hautes, petites perles aux oreilles. Uniforme bleu marine à boutons et épaulettes dorés.
Militaire exigeante, peu de sourires. Joie : un demi-sourire, rare. Souci : regard dur.

### Tomás Reyes · Pêcheur de méthane · Titan
Homme d'environ 53 ans, peau mate burinée, barbe de trois jours. Bonnet de laine vert-gris, grosse parka orange au col
de fourrure crème, une pipe au coin des lèvres. Bourru et bon vivant. Joie : rire la pipe à la main. Souci : regard
plissé vers l'horizon.

### Hana Sato · Astronome en exil · Titania
Femme japonaise d'environ 31 ans, cheveux noirs en carré à frange droite, grosses lunettes rondes. Col roulé bleu
nuit, petite broche en étoile. Brillante, timide, fascinée par ce qu'elle a vu. Joie : yeux qui brillent, sourire
émerveillé. Souci : regard effrayé.

### Le vieil Aksel · Gardien de phare · Station Le Verrier
Vieillard scandinave d'environ 81 ans, grande barbe blanche, sourcils broussailleux blancs, gros nez, rides profondes.
Casquette de marin bleu marine à galon doré, pull marin à col roulé, pipe. Taiseux, il sait des choses. Joie : sourire
dans la barbe. Souci : sourcils baissés, regard grave.

### Mira Kovač · Exploratrice des Confins · Station Tombaugh
Femme croate d'environ 36 ans, cheveux roux en longue tresse, taches de rousseur, yeux verts. Combinaison spatiale
blanc cassé avec l'anneau du col de casque, lunettes de protection aux verres lavande sur la tête. Aventurière
intrépide, un peu inquiète au bout du monde. Joie : sourire aventurier. Souci : regard par-dessus l'épaule.

## Les décors

Un décor par lieu de PNJ, derrière le portrait, dans la case du dialogue (environ 390 × 400 à l'écran).

1. Coller le **bloc de style des décors**, puis la fiche du lieu.
2. Format carré, 1024 × 1024 ; Claude recadre.
3. **Sans personnage** : le portrait se pose au centre, devant. Ce qui compte doit donc être sur les côtés et en haut ;
   le centre et le bas peuvent rester simples (le bas est caché par la plaque du nom, le coin en haut à gauche par
   l'encart « Par radio · depuis… »).

### Le bloc de style des décors

> Décor de bande dessinée de science-fiction, dans le style de Moebius (Jean Giraud) : ligne claire, trait d'encre fin
> et régulier brun-violet foncé, grands aplats de couleurs pastel sans dégradé, ombres en aplats. Ambiance
> rétro-futuriste des années 1970. Vue à hauteur d'homme, comme l'arrière-plan d'une case de BD derrière un
> personnage : aucun personnage, aucun texte, aucun cadre, aucun logo existant. Le centre de l'image reste dégagé (un personnage sera posé
> devant), l'intérêt est sur les côtés et en haut.

### Les treize lieux

- **ISS** (Elsa) : l'intérieur de la station, parois capitonnées crème et gris clair, panneaux à rivets, câbles
  colorés, rambardes moutarde ; un grand hublot rond sur la droite, la Terre bleue et verte avec ses nuages.
- **Lune** (Keïta) : plaine grise criblée de cratères sous un ciel noir étoilé, la Terre en croissant dans le ciel, un
  petit module d'atterrissage au loin avec un fanion orange.
- **Station Tycho** (Okafor) : une base sous un grand dôme transparent rapiécé, bâtiments éclairés de fenêtres
  moutarde, régolithe gris, ciel noir, la Terre petite au loin.
- **Hubble** (le Veilleur) : le télescope spatial dans le noir étoilé, ses panneaux solaires bleu marine, une
  nébuleuse lavande au loin, des ondes radio dessinées en traits fins.
- **Tiangong** (Rosa) : la station chinoise, modules blancs et panneaux solaires dorés, au-dessus de la courbe bleue
  de la Terre, ciel noir étoilé.
- **Mars** (Hélène) : ciel saumon poussiéreux, montagnes rouges, une colonie de dômes transparents et de modules, une
  antenne à fanion orange, une petite lune (Phobos) dans le ciel.
- **Cythère** (Odile) : une ville volante suspendue à un grand ballon blanc au-dessus d'une mer de nuages jaunes et
  orange (Vénus), maisons à toits pointus, autres aérostats plus petits au loin.
- **Phare de Mercure** (Aurelio) : un sol gris et rocheux sous un ciel noir, un Soleil énorme et aveuglant sur
  l'horizon, une tour de phare blanche à lanterne noire, plantée dans la roche.
- **Ganymède** (Nadia) : Jupiter immense dans le ciel noir, ses bandes moutarde, crème et corail, sa Grande Tache ;
  au sol, une plaine de glace bleu pâle, rayée.
- **Titan** (Tomás) : brume orange épaisse, un lac de méthane gris-bleu aux vagues lentes, un petit bateau de pêche
  orange à voile, Saturne à peine devinée à travers la brume.
- **Titania** (Hana) : sol de glace lavande et pics glacés, Uranus cyan dans le ciel avec ses anneaux fins presque à
  la verticale, un petit observatoire à coupole.
- **Station Le Verrier** (Aksel) : un phare rayé blanc et rouge sur un sol bleu sombre, son faisceau jaune qui balaie
  le noir, Neptune bleu profond dans le ciel.
- **Station Tombaugh** (Mira) : la plaine glacée beige et crème de Pluton, une grande zone claire en forme de cœur,
  un petit abri à coupole lavande, le Soleil réduit à une étoile brillante dans un ciel très étoilé.

## Reçus

- **Elsa Varga** (24/10/2026) : les trois humeurs. ChatGPT avait cousu sur sa poitrine le logo de l'Alliance rebelle de
  Star Wars : Claude l'a remplacé par l'écusson de la Résistance (la planète à anneau du jeu). D'où la consigne « aucun
  logo existant » dans les blocs de style.
- **Dr Amadou Keïta** (24/10/2026) : les trois humeurs, avec le bon écusson.
- **Dr Samuel Okafor** (24/10/2026) : les trois humeurs.
- **Le Veilleur** (24/10/2026) : les trois humeurs (le souci, un œil entrouvert, aux aguets).
- **Rosa Mendès** (24/10/2026) : les trois humeurs (le souci, une moue méfiante).
- **Hélène Castagne** (24/10/2026) : les trois humeurs.
- **Odile Varenne** (24/10/2026) : les trois humeurs.
- **Aurelio Benedetti** (24/10/2026) : les trois humeurs ; le neutre, arrivé dans un autre format, recalé sur les deux
  autres (même canevas, même échelle).
- **Nadia Orlov** (24/10/2026) : trois images presque identiques ; la plus fâchée sert au souci, la plus douce à la
  joie (aucune ne sourit vraiment : à refaire si la joie ne se voit pas).

## Ce qu'il faut envoyer à Claude

Pour chaque personnage, trois portraits (neutre, joie, souci) ; pour chaque lieu, un décor. Les noms de fichier
importent peu : dire à qui ou à quoi est chaque image.
