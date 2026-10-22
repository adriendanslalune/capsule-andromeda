# La campagne en détail : le prologue et les planètes intérieures

Premier jet, écrit le 22/10/2026, à lire et corriger par Adrien **avant d'écrire une ligne de code**. Il suit le plan
validé (`docs/campagne.md`) : l'option B pour la jauge, un arc par zone, jamais deux « parle à » d'affilée, les PNJ
répondent par radio, pas d'étape soumise à l'heure, les personnages des Voix perdues deviennent des PNJ.

Pour chaque étape : ce qu'il faut faire, où, la part de la jauge qu'elle remplit, et ce qui est dit. Les textes entre
guillemets sont ceux du jeu (une page par paragraphe dans la fenêtre de dialogue).

---

## 0. Ce qu'il faut ajouter au moteur (les mécaniques)

1. **La jauge en pourcentages.** Chaque étape de l'arc remplit sa part de la jauge de sa zone. Le reste (environ 20 %)
   se fait en jouant librement dans la zone. Un problème de calcul, que je préfère te dire tout de suite : avec les
   points d'aujourd'hui (+3 un contrat, +6 un chasseur), ces 20 % valent 7 contrats pour la Lune, mais 13 pour Mars et
   jusqu'à 27 pour Pluton : on retomberait dans le remplissage. **Ma proposition** : compter aussi l'activité libre en
   pourcentage de la jauge, la même partout (contrat fini +3 %, chasseur abattu +6 %, monolithe ou Voix perdue +2 %).
   Il reste donc toujours environ 7 contrats ou 4 chasseurs à faire, quelle que soit la zone. « Plus loin, c'est plus
   dur » reste vrai, par les combats (plus d'escorteurs, des amiraux plus costauds), pas par le nombre.
2. **Les contrats de quête.** Quand une étape demande une manœuvre (escorter, réparer, remorquer…), la quête pose son
   propre contrat, au bon endroit, avec le losange doré dans le Journal et sur la carte. Plus besoin de chercher sur le
   tableau des Maisons le contrat qui va bien. Il paie comme un contrat normal et compte pour sa Maison.
3. **Capter un signal.** La quête donne une fréquence (contrairement aux Voix perdues, où on la cherche) et un lieu :
   il faut être à moins de 100 000 km du lieu, radio allumée, calé net 10 secondes. Le signal émet tant que l'étape est
   en cours, à toute heure.
4. **Repérer au radar.** Une chose cachée (un engin, un amiral) près d'un lieu, ou un point au sol (Olympus Mons), qui
   n'apparaît qu'au passage du radar, comme un chasseur. Au sol : il faut passer au-dessus, à moins de 20 000 km, comme
   pour une sonde posée.
5. **Retrouver un Disparu** précis. Déjà retrouvé avant la quête : l'étape se coche aussitôt.
6. **Le PNJ répond par radio.** Une étape finie : son message part de chez lui et arrive au vrai délai de la lumière
   (une seconde depuis la Lune, une dizaine de minutes depuis Mars quand on est à la Terre, quelques secondes dans le
   même système). Il s'allume dans le tableau de bord (onglet QUÊTE, avec son portrait) et reste dans les Messages,
   dans la conversation du PNJ. La quête suivante peut arriver de la même façon : on ne revient plus la chercher.
7. **Livrer** : les matériaux s'achètent au Comptoir de la Terre, ou se gagnent en vidant des épaves (VIDER). Une
   livraison ne force donc jamais un retour à la Terre.

**Trois lieux à renommer** (pour coller aux Voix perdues) : l'Aérostat Ishtar devient **Cythère** (la ville flottante
d'Odile), l'Observatoire Messenger devient **le Phare de Mercure** (celui d'Aurelio, qui est aussi le siège de la
compagnie du même nom). Les sauvegardes suivent : un contrat qui visait l'ancien nom vise le nouveau.
Hélène, elle, vit au sol, à la colonie Bradbury : on lui parle en orbite autour de Mars (comme Keïta sur la Lune).

**Les PNJ** : Elsa Varga (ISS) et le Dr Keïta (Lune) restent ; le Dr Samuel Okafor (Base Tycho) parle à la radio, puis
en personne une fois la Lune libérée (Station Tycho) ; Hélène Castagne (Mars), Odile Varenne (Cythère) et Aurelio
Benedetti (Phare de Mercure) remplacent Idris Belkacem, Lior Asante et Sœur Marguerite.

---

## Prologue : la Terre et la Lune (moteurs 1 à 4)

Jauge de la Lune : l'arc en fait 80 %. Les quêtes 2 et 3 peuvent se mener en même temps (l'une près de la Terre,
l'autre vers la Lune).

### Q1 · Un signal sous la Lune
Donneuse : Elsa Varga, à l'ISS (le joueur commence à côté). Récompense : 300 cr., 100 XP.

« Approche, capitaine. Je suis Elsa Varga. Ce qui reste de la Résistance tient dans cette vieille station, et on a
encore un peu de café. »
« Depuis trois nuits, un signal monte de la Lune. Pas un signal d'Andromède : il bégaie, il se répète, il est trop…
humain. »
« Va te mettre en orbite autour de la Lune, allume ta radio et cale-toi sur 4 712 kHz. Le Dr Keïta y est déjà, il
t'attend. »

1. **Capter le signal de Tycho** · radio, 4 712 kHz, près de la Lune · **+20 %**
   Le signal (texte du poste) : « … Tycho… quarante-deux… le dôme tient… si quelqu'un nous entend… Tycho… »
2. **Parler au Dr Keïta** · en orbite autour de la Lune
   « Tu l'as entendu toi aussi. Bien. Je l'enregistre depuis le premier soir, et je croyais devenir fou. »
   « C'est la base Tycho. Le Dr Okafor et quarante et une personnes, sous un dôme qui fuit. Vivants. Andromède les
   croit morts, et c'est ce qui les sauve. »
   « Elsa est au courant, je viens de l'appeler. Elle te dira la suite. Et toi, garde ta radio allumée : Tycho va
   vouloir te parler. »

Réponse radio d'Elsa (arrive une seconde plus tard) : « Des survivants à Tycho… Je n'osais plus l'espérer. Alors on se
bat pour la Lune. Tu en es, capitaine ? Bien sûr que tu en es. » → elle envoie les quêtes 2 et 3.

### Q2 · Les yeux d'Andromède
Donneuse : Elsa, par radio. Récompense : 600 cr., 150 XP.

« Andromède a posté des chasseurs tout autour de la Terre. Ce sont ses yeux : tant qu'ils guettent, rien ne monte vers
Tycho sans qu'il le sache. »
« Crève-leur deux yeux, capitaine. Les Mercenaires ont posé deux contrats tout près d'ici. Allume ton radar avant d'y
aller : un chasseur qu'on n'a pas vu venir tire plus vite. »

1. **Abattre 2 chasseurs dans le système de la Terre** · contrats de quête ABATTRE, à 3 à 5 rayons terrestres (un
   chasseur attaqué hors contrat compte aussi) · **+15 %**

Réponse radio d'Elsa : « Deux de moins. Ils vont en renvoyer, bien sûr. Mais pour quelques jours, ils sont aveugles,
et Tycho respire. Joli tir. »

### Q3 · De l'eau pour Tycho
Donneur : le Dr Okafor, par radio (sa première vraie parole). Récompense : 800 cr., 150 XP.

« Ici Samuel Okafor, base Tycho. Le docteur Keïta dit que vous êtes fiable. Je n'ai plus le luxe d'en douter. »
« Notre recycleur d'eau est à bout, et le dôme siffle par trois fissures. Il nous faudrait cinq tonnes d'eau et deux
tonnes de titane. »
« Le Comptoir de la Terre en vend. Déposez-les à la Station Tycho, en orbite au-dessus de nous : on les descendra de
nuit. Et merci. Pardon : merci d'avance. Ici on a perdu l'habitude. »

1. **Livrer 5 t d'eau et 2 t de titane à la Station Tycho** · **+20 %**

Réponse radio d'Okafor : « Les cuves sont pleines ! Quelqu'un s'est douché, contre toutes les règles. On ne l'a pas
puni. Le dôme ne siffle plus. Merci, capitaine. Cette fois, je le dis au présent. »

### Q4 · Le relais Apollo
Donneur : le Dr Keïta, par radio, une fois Q2 et Q3 faites. Récompense : 700 cr., 200 XP.

« Pour parler vraiment avec Tycho, il nous faut le relais Apollo, notre satellite au-dessus de la face cachée. Il est
en panne depuis le premier jour. »
« Les Ingénieurs ont posé un contrat : répare-le. Ensuite, profite d'être là-haut pour jeter un œil derrière la Lune,
radar allumé. Okafor croit qu'ils cachent quelque chose de gros. »

1. **Réparer le relais Apollo** · contrat de quête RÉPARER, au Relais Apollo · **+15 %**
2. **Repérer ce qui se cache derrière la face cachée** · radar, près de la Lune, côté opposé à la Terre · **+10 %**
   Le radar le révèle : un vaisseau énorme, immobile, ses feux à 4,7 secondes d'intervalle. Le Séléné.

Réponse radio de Keïta : « Le Séléné. Un vaisseau amiral, rien que ça, collé contre la Lune comme une tique. C'est lui
qui tient la Lune. Elsa veut te parler. »

### Q5 · Le Séléné
Donneuse : Elsa, par radio. Récompense : 1 500 cr., 500 XP. Libère la Lune.

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
Mercure. Certains, tu les as peut-être déjà entendus à la radio. » Récompense de l'ensemble : 3 000 cr.

Chaque planète a sa quête, qu'on prend en parlant au PNJ sur place (le lieu compte : c'est le premier voyage). Jauge :
quatre étapes à 20 % chacune, le reste en jouant libre, puis l'assaut. Récompense de chaque planète (provisoire) :
3 000 cr. et 500 XP, plus les contrats de quête.

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
   il y a des semaines. Sa balise de détresse ne répond plus, mais son rover a peut-être survécu. Passez au-dessus
   d'Olympus, radar allumé. »
3. **Retrouver le rover de Roux** · radar, point au sol sur le flanc d'Olympus Mons (passer au-dessus) · **+20 %**
   Le radar le trouve : le rover, vide, arrêté au bord de la caldeira, l'antenne tournée vers le sommet.
   Réponse radio d'Hélène : « Vide… Il n'est pas dedans. Ce vieil entêté. Les jumeaux disent que son rover enregistrait
   tout ce qu'il entendait, et qu'il entendait sa balise sur 6 120 kHz. Écoutez-la, vous. Moi, j'ai arrêté. »
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
   Le radar le révèle : sous les nuages, une forme longue comme une ville, qui creuse un sillon dans la couche.
   Réponse radio d'Odile : « Il est là depuis le début, sous nos pieds. Bien. Tullio a une idée, et pour une fois elle
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
5. **Repérer le Calcinateur** · radar, près de Mercure, côté nuit · **+20 %**
   Le radar le révèle : noir sur noir, il glisse au ras du sol, comme quelqu'un qui fait le tour de son potager.
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

1. **La jauge** : d'accord pour compter l'activité libre en pourcentage (toujours environ 7 contrats ou 4 chasseurs
   par zone) ? Sinon les planètes lointaines redeviennent un mur.
2. **Les deux lieux renommés** (Cythère, Phare de Mercure) : ok ?
3. **Les textes** : corrige ce que tu veux, ton, noms, fréquences, récompenses.
4. Le reste (les quêtes de la Lune telles qu'elles sont aujourd'hui) disparaît au profit de celles-ci. Une partie
   commencée reprend à l'étape équivalente (je m'en charge).
