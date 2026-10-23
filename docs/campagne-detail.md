# La campagne en détail : le prologue et les planètes intérieures

Deuxième jet (22/10/2026, prologue refait le 23/10/2026 d'après les remarques d'Adrien : un vrai tutoriel), à lire et corriger par Adrien **avant d'écrire une ligne de code**. Il suit le plan
validé (`docs/campagne.md`) : l'option B pour la jauge, un arc par zone, jamais deux « parle à » d'affilée, les PNJ
répondent par radio, pas d'étape soumise à l'heure, les personnages des Voix perdues deviennent des PNJ.

Pour chaque étape : ce qu'il faut faire, où, la part de la jauge qu'elle remplit, et ce qui est dit. Les textes entre
guillemets sont ceux du jeu (une page par paragraphe dans la fenêtre de dialogue).

---

## 0. Ce qu'il faut ajouter au moteur (les mécaniques)

1. **La jauge.** Chaque étape de l'arc remplit sa part de la jauge de sa zone ; le reste (environ 20 %) se fait en
   jouant librement dans la zone, avec les points d'aujourd'hui (+3 un contrat, +6 un chasseur, +2 un monolithe ou une
   Voix perdue). Adrien, le 23/10/2026 : pas de jauge en pourcentage pour les contrats, ça va assez vite, on en fait
   toujours.
2. **Les contrats de quête.** Quand une étape demande une manœuvre (escorter, réparer, remorquer…), la quête pose son
   propre contrat, au bon endroit, avec le losange doré dans le Journal et sur la carte. Plus besoin de chercher sur le
   tableau des Maisons le contrat qui va bien. Il paie comme un contrat normal et compte pour sa Maison.
3. **Capter un signal.** La quête donne une fréquence (contrairement aux Voix perdues, où on la cherche) et un lieu :
   il faut être à moins de 100 000 km du lieu, radio allumée, calé net 10 secondes. Le signal émet tant que l'étape est
   en cours, à toute heure.
4. **Repérer au radar.** Une chose cachée dans l'espace (un engin, un amiral), près d'un lieu, qui n'apparaît qu'au
   passage du radar, comme un chasseur. Jamais au sol (Adrien, 23/10/2026 : on ne survole pas une planète).
5. **Retrouver un Disparu** précis. Déjà retrouvé avant la quête : l'étape se coche aussitôt.
6. **Le PNJ répond par radio.** Une étape finie : son message part de chez lui et arrive au vrai délai de la lumière
   (une seconde depuis la Lune, une dizaine de minutes depuis Mars quand on est à la Terre, quelques secondes dans le
   même système). Il s'allume dans le tableau de bord (onglet QUÊTE, avec son portrait) et reste dans les Messages,
   dans la conversation du PNJ. La quête suivante peut arriver de la même façon : on ne revient plus la chercher.
7. **Livrer** : les matériaux s'achètent au Comptoir de la Terre, ou se gagnent en vidant des épaves (VIDER). Une
   livraison ne force donc jamais un retour à la Terre.

**Deux lieux renommés** (validé par Adrien le 23/10/2026, pour coller aux Voix perdues) : l'Aérostat Ishtar devient **Cythère** (la ville flottante
d'Odile), l'Observatoire Messenger devient **le Phare de Mercure** (celui d'Aurelio, qui est aussi le siège de la
compagnie du même nom). Les sauvegardes suivent : un contrat qui visait l'ancien nom vise le nouveau.
Hélène, elle, vit au sol, à la colonie Bradbury : on lui parle en orbite autour de Mars (comme Keïta sur la Lune).

**Les PNJ** : Elsa Varga (ISS) et le Dr Keïta (Lune) restent ; le Dr Samuel Okafor (Base Tycho) parle à la radio, puis
en personne une fois la Lune libérée (Station Tycho) ; Hélène Castagne (Mars), Odile Varenne (Cythère) et Aurelio
Benedetti (Phare de Mercure) remplacent Idris Belkacem, Lior Asante et Sœur Marguerite.

---

## Prologue : la Terre et la Lune, où l'on apprend tout (moteurs 1 à 4)

Décisions d'Adrien du 23/10/2026 : les premières quêtes servent de tutoriel, comme dans un MMORPG ; on se laisse guider.
Elles demandent des choses simples, tout près, montrent une mécanique à la fois et racontent l'histoire. **La capsule
neuve n'a rien d'installé** : pas de radar, de PING, de radio, de Marché ni de communications. Chaque instrument
arrive par une quête. Le prologue est long, c'est normal : c'est là qu'on apprend tout.

### Les récompenses (Adrien, 23/10/2026 : trop élevées dans le jet précédent)

Le principe : **une quête paie à peu près ce que paient un ou deux contrats de sa zone ; le moteur se paie avec les
contrats.** Autour de la Terre, un contrat rapporte de 50 à 150 cr. Au départ, on a 0 cr. Les huit quêtes du tutoriel
rapportent 340 cr. en tout ; avec leurs contrats (3 VIDER, 2 ABATTRE), on arrive au niveau 2 (200 cr.) à la fin de T4
sans pouvoir s'offrir le 3 (400 cr.). Les niveaux 3 et 4 (1 200 cr. de plus) se gagnent ensuite en jouant, une
quinzaine de contrats : c'est le moment où le joueur apprend à se débrouiller seul, avec un but clair (la Lune). La
Lune rapporte 700 cr. en tout, chaque planète intérieure 1 000 cr.

### Montrer où toucher

Tant qu'une mécanique n'a jamais servi, le jeu montre où toucher : **une main de pulp qui pointe** (le doigt tendu, la
manchette, un trait d'encre, comme dans les réclames des années 50), qui bat doucement, et **un contour orange en
pointillés qui tourne** autour de l'endroit à toucher. Le reste ne s'assombrit pas : on peut toujours faire autre chose.
Une seule main à la fois ; elle suit le geste suivant dès que le premier est fait, et disparaît pour de bon une fois la
manœuvre réussie (elle ne revient jamais : c'est mémorisé dans la sauvegarde). Une bulle de BD à côté de la main, deux
ou trois mots au plus (« Touche l'ISS », « DÉPART ! »).

| Quête | Ce que la main montre, dans l'ordre |
|---|---|
| T1 | l'ISS sur la carte (en zoomant dessus d'office) → DÉPART → à l'arrivée, PARLER sur la fiche → la page suivante du dialogue |
| T2 | l'onglet QUÊTE du tableau de bord (« la suite est là ») → Tiangong → DÉPART |
| T3 | Journal › CONTRATS → un contrat VIDER → son bouton → le premier geste du tri ; puis la soute (Capsule) pour voir la ferraille |
| T4 | le Marché › COMPTOIR → ACHETER ; puis Capsule › MOTEUR → AMÉLIORER |
| T5 | l'onglet ALERTE (la panne) → RÉPARER → le glissement vers le Manuel → le module à régler |
| T6 | le bouton RADAR → le chasseur révélé → Journal › CONTRATS → un ABATTRE ; puis Capsule › ARMEMENT, une fois, pour le montrer |
| T7 | le bouton PING → l'onde qui part (« attends l'écho ») → le cercle revenu → Collections |
| T8 | le bouton RADIO → le cadran de fréquence → l'aiguille calée net |

Les contrats et la quête suivie gardent ensuite leur repère habituel sur la carte (le losange), sans la main.

### Ce qui est installé, et quand

| Au départ | La carte, les trajets, le volet Capsule (moteur, modules), le Journal (QUÊTES), Plus (Profil, Manuel, Réglages) |
|---|---|
| T1 · Elsa | Les **communications** : les Messages et le chat, les réponses radio des PNJ |
| T3 · Wei Lan | Les **contrats** (Journal › CONTRATS) et les Maisons |
| T4 · Joe | Le **Marché** (le Comptoir de la Terre) |
| T5 · Wei Lan | Le **panneau de réparation** (et le dépanneur) |
| T6 · Elsa | Le **RADAR** et l'**ARMEMENT** |
| T7 · le Veilleur | Le **PING** et les **Collections** (monolithes ; les Disparus s'y ajoutent avec le radar, les Voix perdues avec la radio) |
| T8 · Wei Lan | La **RADIO** |
| Lune libérée | La **Bourse** (la Compagnie Lunaire de Tycho entre en cotation) |

Ce qui n'est pas encore installé reste visible, grisé, avec une ligne qui dit qui l'installe (« Radar : Elsa Varga, à
l'ISS, s'en occupe »). Une partie déjà commencée garde tout ce qu'elle a.

### Les personnages
- **Elsa Varga**, commandante de la Résistance, à l'ISS.
- **Wei Lan**, ingénieure, à Tiangong (une Voix perdue de la Terre : « je note tout, pour celui qui viendra après »).
- **Joe Hennessy**, routier de l'espace, son cargo Marguerite garé près du satellite GOES-19, à 36 000 km (une Voix
  perdue lui aussi : « je ne valais pas un missile »). Il connaît les moteurs.
- **Le Veilleur**, l'ermite de Hubble (déjà dans le jeu ; sa quête secondaire devient une étape du tutoriel).
- Puis, vers la Lune : le **Dr Keïta** (en orbite lunaire) et le **Dr Okafor** (Base Tycho, par radio).

### T1 · Bienvenue dans la Résistance
Au lancement, la fenêtre de bienvenue, puis le tableau de bord : « Parle à Elsa Varga (ISS) ». Récompense : 50 cr.,
100 XP. On apprend : toucher un lieu, DÉPART, l'arrivée en orbite, PARLER.

1. **Aller à l'ISS et parler à Elsa Varga**
   « Te voilà, capitaine. Bien arrivé ? Ta capsule sort de l'usine : un moteur, une coque, et c'est à peu près tout. On
   va arranger ça. »
   « Il y a six mois, quelque chose a éteint les étoiles du côté de Neptune. Puis ils sont arrivés : les vaisseaux
   d'Andromède. Ils n'ont pas bombardé la Terre. Ils l'ont encerclée, comme toutes les autres planètes, et ils
   attendent. »
   « Ce qui reste de la Résistance tient dans cette vieille station. Nous sommes peu, mal équipés, et têtus. Toi, tu
   as une capsule qui vole. C'est déjà beaucoup. »
   « Je te branche sur notre fréquence : tu recevras nos messages où que tu sois. Voilà de quoi commencer. Et garde
   l'oreille ouverte, je t'appelle bientôt. »
   → les communications sont installées.

### T2 · Un colis pour Tiangong
Elsa, par radio, aussitôt. Récompense : 40 cr., 100 XP. On apprend : la soute, livrer.

« Premier service : Wei Lan, notre ingénieure, attend des pièces à Tiangong, tout près d'ici. Je les ai mises dans ta
soute. Elle t'expliquera mieux que moi ce qu'on sait d'eux. »

1. **Livrer 1 t de pièces détachées à Tiangong** (chargées par Elsa)
   Wei Lan, à la livraison :
   « Mes pièces ! Merci, capitaine. Ici, on répare tout avec rien. »
   « Tu veux savoir ce que je sais d'eux ? Pas grand-chose. Quand ils passent, pas un bruit, pas une lumière : juste
   nos aiguilles qui tremblent. Ils ne tirent presque jamais près de la Terre. Ils surveillent. »
   « Je note tout, pour celui qui viendra après. Peut-être que c'est toi. »

### T3 · De la ferraille pour Wei Lan
Wei Lan, dans la foulée. Récompense : 50 cr., 150 XP. On apprend : les contrats, VIDER, les matériaux, les Maisons.

« Pour remettre Tiangong d'aplomb, il me faut de la ferraille, et l'orbite de la Terre en est pleine : des épaves,
par centaines. Les Nettoyeurs paient pour qu'on les vide. »
« Ouvre ton Journal, onglet CONTRATS : ce sont les missions des Maisons, chacune avec sa prime. Prends trois contrats
VIDER, trie bien ce que tu trouves, et rapporte-moi une tonne de ferraille. Le reste est à toi : ça te servira. »
→ les contrats sont installés.

1. **Finir 3 contrats VIDER** dans le système de la Terre
2. **Livrer 1 t de ferraille à Tiangong**
   Wei Lan : « Joli tri. Tu as la main, et les Nettoyeurs l'ont remarqué. »
   « Il faut que tu saches : trois Maisons se partagent le travail. Les Nettoyeurs vident et remorquent les épaves. Les
   Mercenaires abattent les chasseurs et escortent les convois. Les Ingénieurs réparent et livrent. »
   « Plus tu travailles pour l'une, plus elle s'intéresse à toi. Un jour, elle t'invitera à la rejoindre : de
   meilleurs contrats, mieux payés. Rien d'obligé, et tu peux changer d'avis. Ton Profil te montre où tu en es. »
   « Et maintenant, ce moteur. Joe Hennessy, un routier, est garé près de GOES-19. Personne ne connaît mieux les
   moteurs que lui. Va le voir de ma part. »

### T4 · Le garage de Joe
Récompense : aucune en crédits (Joe ne fait pas crédit), 200 XP. On apprend : le Marché, améliorer le moteur. Le premier « vrai » trajet : 36 000 km.

1. **Parler à Joe Hennessy** (près de GOES-19)
   « Wei Lan t'envoie ? Fais voir ta capsule. Oh là. Trente kilomètres-seconde. Ma grand-mère allait plus vite en
   charrette. »
   « Chaque niveau de moteur double ta vitesse. Pour le niveau 2 : deux cents crédits et trois tonnes de ferraille.
   Le reste de ton tri, plus ce qui te manque. »
   « Ce qui te manque, ça s'achète au Comptoir : je t'ouvre l'accès au Marché de la Terre. Achète au cours, revends au
   cours, et ne te fais pas avoir sur la marge. »
   → le Marché est installé.
2. **Installer le moteur de niveau 2** (Capsule › MOTEUR)
   Réponse radio de Joe : « Tu l'entends ronronner ? Deux fois plus vite. Et quand tu voudras aller sur la Lune, il en
   faudra deux de plus. Reviens me voir, j'aime bien les clients. »

### T5 · Le panneau
Wei Lan, par radio. Récompense : 30 cr., 150 XP. On apprend : les pannes, le panneau de réparation, le Manuel.

« Capitaine, une chose que personne ne t'a dite : une capsule, ça tombe en panne. L'usure, ou un missile. Je vais te
montrer, sans danger. Je coupe ton module d'Énergie à distance. Oui, exprès. »
« Ouvre le panneau de réparation (Capsule › RÉPARATION), glisse vers le Manuel, et suis la section qui va bien. Si tu
es vraiment coincé, le dépanneur passera, mais il prend la moitié de ton argent. »
→ le panneau est installé ; l'Énergie tombe en panne (la seule panne voulue du jeu).

1. **Réparer le module d'Énergie** sur le panneau
   Réponse radio de Wei Lan : « CLONK ! J'ai entendu d'ici. Bravo. Garde le Manuel sous la main : il te sauvera la vie
   plus souvent que ton canon. »

### T6 · Les yeux d'Andromède
Elsa, par radio. Récompense : 60 cr., 200 XP. On apprend : le radar, l'armement, ABATTRE.

« Il est temps de te battre, capitaine. Leurs chasseurs sont furtifs : sans radar, tu ne les vois pas. Je t'en fais
installer un, et de quoi tirer. »
« Allume le radar avant chaque départ : un chasseur que tu n'as pas vu venir tire deux fois plus vite. Puis prends deux
contrats ABATTRE des Mercenaires : il y a deux chasseurs tout près de la Terre. Ce sont leurs yeux. Crève-les. »
→ le RADAR et l'ARMEMENT sont installés.

1. **Repérer un chasseur au radar**
2. **Abattre 2 chasseurs** dans le système de la Terre (contrats ABATTRE, ou ATTAQUER hors contrat) · **jauge de la
   Lune +15 %** (ce sont eux qui gardent la route de la Lune)
   Réponse radio d'Elsa : « Deux de moins. Ils en renverront, mais pour quelques jours, ils sont aveugles. Le Veilleur
   de Hubble a demandé à te voir. C'est un drôle de type. Écoute-le quand même. »

### T7 · L'oreille du Veilleur
Récompense : 30 cr., 150 XP. On apprend : le PING, les monolithes, les Collections.

1. **Parler au Veilleur** (Hubble)
   « Chut. Tu les entends ? Non, bien sûr. Mille monolithes, capitaine, cachés dans tout le système. Plus vieux que nous.
   Ils ne répondent qu'à ceux qui appellent. »
   « Je t'ai bricolé un PING. Appuie, et le plus proche te répond. Son écho revient à la vitesse de la lumière : il
   trace un cercle, et le monolithe est quelque part dessus. Déplace-toi, appelle encore, et les cercles se croisent. »
   « Ceux que tu trouves vont dans ton classeur, dans les Collections. Ça ne sert à rien. C'est pour ça que c'est
   beau. »
   → le PING et les Collections sont installés.
2. **Envoyer un PING et recevoir son écho**
   Réponse radio du Veilleur : « Tu l'as entendu ? Alors tu es des nôtres. Il en reste mille. Prends ton temps. »
   (Trouver un monolithe n'est pas demandé : le plus proche peut être très loin.)

### T8 · Un signal sous la Lune
Elsa, par radio, une fois T6 et T7 faites. Récompense : 80 cr., 200 XP. On apprend : la radio. Puis le grand départ.

« Capitaine, depuis trois nuits un signal monte de la Lune. Pas un des leurs : il bégaie, il se répète, il est trop
humain. Wei Lan te monte une radio. »
→ la RADIO est installée.
Wei Lan, par radio : « Ton poste est branché. Tourne le bouton jusqu'à 4 712 kHz et cale-toi bien net. Le signal est
faible, mais on l'entend de partout autour de la Terre. »

1. **Capter le signal de Tycho** · radio, 4 712 kHz, dans le système de la Terre · **jauge de la Lune +20 %**
   Le signal : « … Tycho… quarante-deux… le dôme tient… si quelqu'un nous entend… Tycho… »
   Réponse radio d'Elsa : « Des survivants, à Tycho… Le Dr Keïta est en orbite lunaire, il en saura plus. Il te faut un
   moteur de niveau 4 pour y aller sans y passer la journée : Joe t'expliquera. Prends des contrats, gagne de quoi
   payer, et pars quand tu es prêt. »
2. **Installer le moteur de niveau 4** (3 : 400 cr. et 3 t de cuivre ; 4 : 800 cr., 5 t de cuivre et 2 t de verre)
   Réponse radio de Joe : « Deux cent quarante kilomètres-seconde ! La Lune en une demi-heure. Ma grand-mère ne te
   reconnaîtrait pas. »
3. **Aller sur la Lune et parler au Dr Keïta**
   « Elsa t'envoie ? Bien. Je l'enregistre depuis le premier soir, ce signal, et je croyais devenir fou. »
   « C'est la base Tycho. Le Dr Okafor et quarante et une personnes, sous un dôme qui fuit. Vivants. Andromède les
   croit morts, et c'est ce qui les sauve. Garde ta radio allumée : Tycho va vouloir te parler. »

La suite se passe autour de la Lune, comme dans le premier jet : **De l'eau pour Tycho** (Okafor, par radio : livrer 5 t
d'eau et 2 t de titane à la Station Tycho, achetées au Comptoir de la Terre ; +20 %), **Le relais Apollo** (Keïta :
réparer le relais, contrat RÉPARER des Ingénieurs, +15 % ; puis repérer au radar le Séléné, tapi en orbite derrière la
face cachée, +10 %), et **Le Séléné** (Elsa : remplir la jauge, il reste environ 20 % avec les contrats et les chasseurs
faits autour de la Lune, puis l'assaut). Leurs dialogues sont juste en dessous.

À la libération, Elsa : « La Lune est libre. Et la Compagnie Lunaire de Tycho rouvre ses bureaux : son action entre en
Bourse. Je t'ouvre l'accès, capitaine. Achète, vends, et ne mise jamais ce que tu n'as pas. » → la **Bourse** est
installée.

---

## La Lune : les quêtes qui suivent T8

Jauge de la Lune : l'arc en fait 80 % (T6 +15 %, T8 +20 %, puis les trois quêtes ci-dessous).

### L1 · De l'eau pour Tycho
Donneur : le Dr Okafor, par radio (sa première vraie parole). Récompense : 150 cr., 150 XP.

« Ici Samuel Okafor, base Tycho. Le docteur Keïta dit que vous êtes fiable. Je n'ai plus le luxe d'en douter. »
« Notre recycleur d'eau est à bout, et le dôme siffle par trois fissures. Il nous faudrait cinq tonnes d'eau et deux
tonnes de titane. »
« Le Comptoir de la Terre en vend. Déposez-les à la Station Tycho, en orbite au-dessus de nous : on les descendra de
nuit. Et merci. Pardon : merci d'avance. Ici on a perdu l'habitude. »

1. **Livrer 5 t d'eau et 2 t de titane à la Station Tycho** · **+20 %**

Réponse radio d'Okafor : « Les cuves sont pleines ! Quelqu'un s'est douché, contre toutes les règles. On ne l'a pas
puni. Le dôme ne siffle plus. Merci, capitaine. Cette fois, je le dis au présent. »

### L2 · Le relais Apollo
Donneur : le Dr Keïta, par radio, une fois L1 faite. Récompense : 150 cr., 200 XP.

« Pour parler vraiment avec Tycho, il nous faut le relais Apollo, notre satellite au-dessus de la face cachée. Il est
en panne depuis le premier jour. »
« Les Ingénieurs ont posé un contrat : répare-le. Ensuite, profite d'être là-haut pour jeter un œil derrière la Lune,
radar allumé. Okafor croit qu'ils cachent quelque chose de gros. »

1. **Réparer le relais Apollo** · contrat de quête RÉPARER, au Relais Apollo · **+15 %**
2. **Repérer ce qui se cache derrière la face cachée** · radar, près de la Lune, côté opposé à la Terre · **+10 %**
   Le radar le révèle : un vaisseau énorme, immobile, ses feux à 4,7 secondes d'intervalle. Le Séléné.

Réponse radio de Keïta : « Le Séléné. Un vaisseau amiral, rien que ça, collé contre la Lune comme une tique. C'est lui
qui tient la Lune. Elsa veut te parler. »

### L3 · Le Séléné
Donneuse : Elsa, par radio. Récompense : 400 cr., 500 XP. Libère la Lune.

« Un amiral. Seul, tu n'as aucune chance, et je le sais. Mais on ne sera pas seuls : toute la Résistance va se lever
autour de la Lune. »
« Il manque encore un peu de feu : des contrats, des chasseurs, tout ce que tu fais autour de la Lune compte. Quand la
jauge sera pleine, tu lances l'assaut. Pour Tycho. Pour nous tous. »

1. **Remplir la jauge de la Lune** · il reste environ 20 % : le tableau de bord le dit (« encore 7 contrats ou 4
   chasseurs autour de la Lune »)
2. **L'assaut contre le Séléné** · en orbite autour de la Lune

La fenêtre de libération (portrait d'Okafor) : « Ici Tycho. Nous sortons. Pour la première fois depuis des mois, nous
voyons la Terre se lever sans personne entre elle et nous. Quarante-deux personnes vous disent merci. Et la balise sous
nos pieds… elle s'est tue. Je ne sais pas si c'est une bonne nouvelle. »
Ce qui s'ouvre : les contrats et les PNJ de la Lune, la Station Tycho où l'on peut parler à Okafor.

---

## Les planètes intérieures (moteurs 5 à 8)

Elsa, par radio, juste après la libération : « La Lune est libre, et ça se sait. Sur Mars, sur Vénus, sur Mercure, des
gens tiennent bon et commencent à relever la tête. Va les aider, dans l'ordre que tu veux : Hélène Castagne à la colonie
Bradbury, sur Mars ; Odile Varenne, la maire de Cythère, dans les nuages de Vénus ; Aurelio Benedetti, au Phare de
Mercure. Certains, tu les as peut-être déjà entendus à la radio. » Récompense de l'ensemble : 1 000 cr.

Chaque planète a sa quête, qu'on prend en parlant au PNJ sur place (le lieu compte : c'est le premier voyage). Jauge :
quatre étapes à 20 % chacune, le reste en jouant libre, puis l'assaut. Récompense de chaque planète (provisoire) :
1 000 cr. et 500 XP, plus les contrats de quête.

### Mars · La tempête rouge
PNJ : Hélène Castagne, directrice de la colonie Bradbury (en orbite autour de Mars). Amiral : le Phobétor, posé au
sommet d'Olympus Mons. Autour : Radio Poussière (les jumeaux Oyelaran), le Pr Roux, disparu.

1. **Parler à Hélène Castagne** · en orbite autour de Mars
   « Ici Bradbury. Vous êtes la capitaine de la Lune ? On vous entend à la radio jusqu'ici, vous savez. Les gamins de
   Radio Poussière ont fait une chanson sur vous. Elle est mauvaise. »
   « Quatre cents colons, deux serres, une mine de titane. Et une tempête de trois mois qui nous coupe du ciel. Pire :
   Andromède attaque nos convois. Sans le titane, Arès Titane ne paie plus, et sans la paie, plus de vivres. »
   « Il y a autre chose, mais une chose à la fois. Le convoi d'abord. »
2. **Escorter le convoi de titane** · contrat de quête ESCORTER, de la Station Hellas à la Station Arès · **+20 %**
   Réponse radio d'Hélène : « Le titane est à quai, la paie partira ce soir. Ruiz dit qu'il vous doit une bière.
   Ruiz doit une bière à tout Mars. Bon. L'autre chose, maintenant : le professeur Roux. Il est parti seul vers Olympus
   il y a des semaines, et sa balise de détresse ne répond plus. Un chasseur monte la garde au-dessus d'Olympus : il a
   vu passer tout ce qui bouge. Abattez-le, et rapportez-moi sa mémoire. »
3. **Abattre le guetteur d'Olympus** · contrat de quête ABATTRE, en orbite au-dessus d'Olympus Mons · **+20 %**
   Dans l'épave, sa mémoire : le rover de Roux, vu d'en haut, arrêté au bord de la caldeira, l'antenne tournée vers le
   sommet, et une silhouette qui marche vers la balise.
   Réponse radio d'Hélène : « Il est monté à pied… Ce vieil entêté. Les jumeaux disent que son rover enregistrait tout
   ce qu'il entendait, et qu'il entendait sa balise sur 6 120 kHz. Écoutez-la, vous. Moi, j'ai arrêté. »
4. **Capter le chant de la balise d'Olympus** · radio, 6 120 kHz, près de Mars · **+20 %**
   Le signal : une sorte de chant, et par-dessus, la voix de Roux, enregistrée : « … elle compte ce qui pousse… le
   vaisseau vient la relever… toutes les nuits à la même heure… quand il est posé contre elle, il ne voit plus rien
   d'autre… »
   Réponse radio d'Hélène : « Quand le Phobétor écoute la balise, il est sourd et aveugle. Voilà notre fenêtre de tir.
   Il nous manque juste ses rondes : Beagle 2, la vieille sonde anglaise, est posée dans Isidis, en face d'Olympus.
   Roux disait que sa caméra avait vu la balise avant tout le monde. Retrouvez-la. »
5. **Retrouver Beagle 2** · le Disparu, à Isidis Planitia · **+20 %**
   Réponse radio d'Hélène : « Sa caméra a tenu, la vieille ! On a les rondes du Phobétor, minute par minute. Demir
   prépare ses foreuses. Il veut toujours klaxonner. Faites monter la Résistance autour de Mars, et on y va. »
6. **Remplir la jauge de Mars**, puis **l'assaut contre le Phobétor** · en orbite autour de Mars

Fenêtre de libération (portrait d'Hélène) : « Le feu d'Olympus s'est éteint. Pour la première fois depuis des mois, je
dors sans le compter. Radio Poussière émet une édition spéciale : la météo (dégagée), les infos (Mars est libre) et la
recette du jour, du gâteau. Un vrai. On a gardé les œufs. Roux n'est pas revenu. Mais sa balise chante encore, et
cette fois, j'écoute. »
Ce qui s'ouvre : le Comptoir de Mars (titane moins cher), Arès Titane en Bourse, les quêtes de Mars.

### Vénus · Le chant de Cythère
PNJ : Odile Varenne, maire de Cythère, la ville flottante (station Cythère). Amiral : le Brûle-Nuées, qui rôde sous la
couche de nuages. Autour : la chorale de Tullio Ferraris, la navette Tant-Pis des Chantiers navals, Kenji Mori, Pia.

1. **Parler à Odile Varenne** · en orbite à Cythère
   « Bienvenue à Cythère, capitaine. Trois mille âmes à cinquante-cinq kilomètres au-dessus de l'enfer. Le conseil a
   voté : on ne descend pas, on ne monte pas, on ne se rend pas. »
   « Mais on ne tient qu'à des câbles, et les câbles s'usent. Ce qui nous relie au reste du monde, c'est Tant-Pis, la
   navette des Chantiers. Elle est revenue de la Terre en morceaux. Enfin… en moins de morceaux que prévu. »
   « Si vous savez manier une clé, les Ingénieurs ont un contrat pour vous. »
2. **Réparer Tant-Pis** · contrat de quête RÉPARER, à Cythère · **+20 %**
   Réponse radio d'Odile : « Elle vole ! Presque. Les Chantiers disent qu'il lui manque une coque digne de ce nom :
   quatre tonnes de verre et trois de cuivre. Le Comptoir de la Terre en vend. Ou videz les épaves qui tournent autour
   de Vénus : il en tombe assez du ciel en ce moment. »
3. **Livrer 4 t de verre et 3 t de cuivre à Cythère** · **+20 %**
   Réponse radio d'Odile : « Tant-Pis a une coque, et même une deuxième couche de peinture, ce qui n'était pas
   nécessaire. Kenji vous a envoyé ses relevés : chaque fois qu'un chasseur passe, les nuages dessinent la même figure,
   au-dessus de la Station Aphrodite. Il pense que le Brûle-Nuées est là-dessous. Allez voir, radar allumé. De loin. »
4. **Repérer le Brûle-Nuées** · radar, près de la Station Aphrodite · **+20 %**
   Le radar le révèle : en orbite basse, au ras des nuages, une forme longue comme une ville, qui creuse un sillon dans la couche.
   Réponse radio d'Odile : « Il est là depuis le début, juste au-dessus des nuages. Bien. Tullio a une idée, et pour une fois elle
   n'est pas idiote : la chorale va chanter sur 5 330 kHz, pour que les autres villes flottantes nous entendent et se
   lèvent avec nous. Écoutez-les : si le chant passe jusqu'à vous, il passe partout. »
5. **Capter le chant de la chorale** · radio, 5 330 kHz, près de Vénus · **+20 %**
   Le signal : la chorale, à pleine voix. Il manque des ténors. Il manque toujours des ténors.
   Réponse radio d'Odile : « Les aérostats Lakshmi et Venera répondent, et même deux villes qu'on croyait tombées.
   Vénus se lève, capitaine. Il ne manque plus que vous. »
6. **Remplir la jauge de Vénus**, puis **l'assaut contre le Brûle-Nuées** · en orbite autour de Vénus

Fenêtre de libération (portrait d'Odile) : « Le Brûle-Nuées est tombé dans l'acide, et les nuages s'en sont refermés
sans un bruit. Ce soir, toutes les villes flottantes chantent en même temps. Pia dit qu'on doit vous entendre jusqu'à la
Terre. Je lui ai dit que non. Je crois que je me trompe. »
Ce qui s'ouvre : le Comptoir de Vénus, les Chantiers Navals de Vénus en Bourse, les quêtes de Vénus.

### Mercure · Le Phare
PNJ : Aurelio Benedetti, chef de quart au Phare de Mercure. Amiral : le Calcinateur, qui se cache côté nuit. Autour :
Noor Haddad, Gabin le cuisinier, le Dr Stanek et sa balise du pôle nord, qu'on ne touche pas.

1. **Parler à Aurelio Benedetti** · en orbite au Phare de Mercure
   « Bienvenue au Phare, capitaine. Quart numéro quatre-vingt-quelque-chose. On a arrêté de compter précisément, ça
   portait malheur. »
   « Le Phare reste allumé, quoi qu'il arrive. Mais le bouclier solaire tombe en lambeaux, et Gabin fait cuire ses œufs
   sur le hublot. Ce n'est pas une blague, c'est un problème de sécurité. »
   « Il me faudrait six tonnes de titane. Au Comptoir de la Terre, ou sur les épaves qui traînent autour de Mercure. »
2. **Livrer 6 t de titane au Phare de Mercure** · **+20 %**
   Réponse radio d'Aurelio : « Le bouclier tient. Gabin est désolé pour ses œufs. Mais Noor a fait le calcul : il
   faudrait encore de l'ombre devant le Phare, côté Soleil, pour tenir jusqu'à l'été. Une grosse épave ferait l'affaire.
   Les Nettoyeurs en ont une sur les bras. »
3. **Remorquer une épave jusqu'au Phare** · contrat de quête REMORQUER · **+20 %**
   Réponse radio d'Aurelio : « Une épave, en parasol. On aura tout vu. Maintenant, la vraie question : le Calcinateur.
   On ne le voit jamais, il ne sort que côté nuit. Stanek pense que MESSENGER, la sonde qui s'est écrasée près du pôle,
   a enregistré ses passages avant de mourir. Sa mémoire a peut-être survécu. Ne touchez pas à la balise, en passant. »
4. **Retrouver MESSENGER** · le Disparu, près du pôle nord de Mercure · **+20 %**
   Réponse radio d'Aurelio : « La vieille mémoire parle encore ! Le Calcinateur fait toujours le même tour, sur la face
   de nuit, en rasant la glace. Noor a l'heure, à peu près. Allez le voir de vos yeux, radar allumé. »
5. **Repérer le Calcinateur** · radar, en orbite autour de Mercure, côté nuit · **+20 %**
   Le radar le révèle : noir sur noir, il fait le tour de la planète en orbite basse, lentement, comme quelqu'un qui fait le tour de son potager.
   Réponse radio d'Aurelio : « On le tient. Le Phare va le garder dans sa lumière : un phare, ça éclaire tout le monde,
   même ceux qu'on n'aime pas. Surtout ceux-là, ce soir. »
6. **Remplir la jauge de Mercure**, puis **l'assaut contre le Calcinateur** · en orbite autour de Mercure

Fenêtre de libération (portrait d'Aurelio) : « Le Calcinateur est tombé côté nuit. Il y a de la glace là-bas : il
fondra dans quelques millénaires. Le Phare reste allumé. Gabin a fait des tomates farcies, avec les vraies tomates que
quelqu'un a fini par nous envoyer. Stanek dit que sa balise bourdonne plus fort depuis l'assaut. Comme si elle prenait
des notes. »
Ce qui s'ouvre : le Comptoir de Mercure, le Phare de Mercure en Bourse, les quêtes de Mercure.

### La suite : Ganymède appelle
Une fois les trois libres, Elsa, par radio : « Le système intérieur est libre. Je n'y croyais plus, capitaine. Un
message est arrivé pour toi, de très loin : quarante minutes de lumière. Une certaine Nadia Orlov, capitaine de la
flotte jovienne. Elle veut te parler, sur Ganymède. Au-delà de la ceinture, les choses se corsent. Va la voir quand ta
capsule sera prête. »
Le tableau de bord montre alors « Parle à Nadia Orlov (Ganymède) », jusqu'à ce qu'on y aille : c'est la route des
planètes extérieures, qu'on écrira système par système.

---

## Ce que je te demande

1. **Les récompenses** revues à la baisse (le principe ci-dessus) : ok ?
2. **La main qui montre où toucher** : ok pour le style (main de pulp, contour orange qui tourne, bulle de deux mots) ?
3. **La panne voulue** de T5 (Wei Lan coupe l'Énergie à distance pour apprendre à réparer) : ok ?
4. Une partie déjà commencée reprend à l'étape équivalente, garde tous ses instruments et ne voit pas les mains.
