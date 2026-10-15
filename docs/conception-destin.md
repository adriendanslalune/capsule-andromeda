# Maître de son destin — document de conception (proposition du 16/10/2026)

*Proposition de Claude, à valider ou corriger par Adrien avant tout code. Les chiffres sont des points de départ,
faciles à changer. Les décisions d'Adrien sont reportées au §10.*

## 1. L'idée

Le joueur n'a pas une seule route à suivre. Comme dans *No Man's Sky*, il choisit ce qu'il fait de sa fusée :
porter des commissions, rendre service, chercher des artefacts et des monolithes, faire du commerce, chasser le
visiteur… Chaque voie rapporte de l'argent (pour améliorer la fusée) et de la **réputation** auprès de quelqu'un.
Aucune n'est obligatoire ; on peut en suivre plusieurs à la fois et en changer quand on veut.

Ce qui ne change pas : le manuel reste indispensable (procédures, tables, codes), les pannes arrivent en voyage, la
radio et la carte sont les outils de tout le reste.

## 2. Les intercalaires (décision d'Adrien du 16/10/2026)

Cinq intercalaires. Ordre proposé, le cockpit au milieu :

| MISSIONS | LIAISONS | **COCKPIT** | COMMERCE | ATELIER |
|---|---|---|---|---|

- **COCKPIT** : comme aujourd'hui (caméra, radio, radar, blocs, mission en cours, transmissions, journal).
- **MISSIONS** : tout ce que le joueur peut entreprendre, en sous-onglets :
  - **CONTRATS** — les commissions de la semaine (comme aujourd'hui) ;
  - **SERVICES** — les appels à l'aide captés à la radio (voir §5) ;
  - **DÉCOUVERTES** — artefacts, monolithes, visiteur, épaves (voir §4) ;
  - **HISTOIRES** — les fils d'histoire choisis (voir §3).
- **LIAISONS** (le côté social) : la messagerie (télégrammes, bulletins), le **classement** et les **trophées**.
- **COMMERCE** : la cale (ce qu'on transporte) et le marché du lieu où l'on se trouve (voir §6).
- **ATELIER** : moteur, modules débloqués, instruments, et les nouveaux équipements (cale agrandie, scanner…).

## 3. Les histoires (fils au choix)

Un **fil d'histoire** est une suite de chapitres. On en découvre l'existence en jouant (un message radio, une
rencontre, une trouvaille) ; on choisit alors de le suivre ou non. Chaque chapitre donne un objectif concret (aller
quelque part, capter un signal, livrer un objet, photographier…), une récompense, et parfois **un choix** qui oriente
la suite et la réputation.

Quatre fils proposés pour commencer :

1. **Les Monolithes** (le grand mystère). Un signal sur 7,50 : des impulsions par 2, 3, 5, 7, 11. Dix monolithes
   sont cachés dans le système solaire, les mêmes pour tous. Chacun livre un fragment d'un message ; les dix réunis
   révèlent… (à écrire ensemble). Fil lent, récompense prestigieuse (trophée, fusée unique ?).
2. **La carrière à l'Office** (le fil « officiel »). Grades successifs ; missions de prestige (escorter un convoi,
   ravitailler une base, livrer un pli secret avant une heure fixe) ; accès à des contrats mieux payés.
3. **Les Indépendants** (le fil « hors-la-loi »). Des commerçants libres proposent des cargaisons douteuses, plus
   rentables mais risquées (contrôles de l'Office, réputation qui baisse d'un côté, monte de l'autre).
4. **Le Visiteur** (la chasse actuelle, racontée). Chaque saison ajoute un chapitre : qui est-il, d'où vient-il ?

**Réputation** : trois maisons — l'Office, l'Observatoire, les Indépendants — de « inconnu » à « allié ». Elle ouvre
des contrats, des prix, des chapitres.

## 4. Les découvertes

- **Monolithes** (10, fixes, secrets, les mêmes pour tous). On les trouve à la radio : sur 7,50, plus on approche,
  plus le signal est net et plus les impulsions sont rapides. Triangulation possible avec le télescope. À moins de
  300 000 km, visible dans la vue 3D ; on s'en approche, on le photographie : fragment du message + prime.
- **Artefacts** (objets perdus, sondes anciennes, curiosités). Semés chaque semaine près des astres (les mêmes pour
  tous). Le détecteur DET les signale à courte distance ; on va les chercher. Le **manuel** sert à les identifier
  (forme, signal) et donc à connaître leur valeur : on les vend au marché ou on les garde (collection, bonus).
- **Épaves** (cargos et sondes en perdition). Apparaissent au fil des semaines ; on y récupère une cargaison (à
  vendre), des pièces (moins chères à l'atelier) ou un indice pour une histoire.
- **Le visiteur** : comme aujourd'hui (ping, télescope, détecteur, photo).

## 5. Les services (canal de détresse, 5,00)

Sur 5,00, des appels à l'aide arrivent de temps en temps (les mêmes pour tous ; plus tard, de vrais joueurs).
Chaque appel donne un lieu, un besoin et un délai :

| Appel | À faire | Récompense |
|---|---|---|
| Panne | Apporter une pièce (achetée au marché) | crédits + réputation Office |
| Plus de carburant | Apporter de l'eau ou de l'hydrogène | crédits |
| Remorquage | Aller le chercher, le ramener à un port | crédits (selon la distance) |
| Évacuation | Ramener l'équipage à la Terre | réputation, trophée |

Le premier arrivé (ou tous ceux qui arrivent à temps, à décider) est récompensé. Un appel ignoré expire.

## 6. Le commerce

- **Marchandises** (une dizaine) : eau, glace, minerai de fer, hélium-3, vivres, pièces détachées, médicaments,
  instruments, courrier précieux, curiosités (artefacts).
- **Marchés** : chaque lieu habité (Terre, ISS, Lune, Mars, Cérès, satellites de Jupiter et de Saturne…) produit
  certaines marchandises (pas chères) et en consomme d'autres (chères). Les prix varient chaque jour, les mêmes pour
  tous (plus tard : ils réagiront à ce que vendent et achètent les joueurs).
- **Cale** : 10 unités au départ ; agrandie à l'atelier.
- **Le jeu reste « manuel »** : le marché donne les prix ; le manuel donne ce que chaque lieu produit et consomme
  (pour prévoir ses routes), et des règles cachées (une marchandise fragile s'abîme si le recycleur est en panne…).

## 7. L'argent et la progression

- Contrats : comme aujourd'hui (renforcés à titre provisoire).
- Services : 50 à 300 CR selon la distance et l'urgence.
- Commerce : bénéfice de 10 à 40 % par voyage bien choisi.
- Découvertes : artefact 30 à 500 CR selon sa rareté ; épave 50 à 200 CR ; monolithe 500 CR et un fragment.
- Le moteur reste la grande dépense ; la cale, le scanner et les instruments s'achètent à l'atelier.

## 8. Ce qu'il faudra au manuel

- Un chapitre **Commerce** : les marchandises, ce que produit et consomme chaque lieu.
- Un chapitre **Découvertes** : identifier un artefact (signal, forme) et sa valeur ; repérer un monolithe.
- Un chapitre **Services** : comment répondre à un appel.
- Les histoires restent dans le jeu (messages, télégrammes) : le manuel n'en raconte rien.

## 9. Questions pour Adrien

1. L'ordre des intercalaires : MISSIONS · COMMUNICATION · **COCKPIT** · COMMERCE · ATELIER ?
2. Les **trophées** et le **classement** : dans COMMUNICATION, ou un sous-onglet de MISSIONS (DÉCOUVERTES) ?
3. Les quatre fils d'histoire proposés te plaisent-ils ? D'autres idées ?
4. Les trois maisons (Office, Observatoire, Indépendants) : d'accord pour la réputation ?
5. Les monolithes : récompense finale ? (une fusée unique, un nouveau moteur, une révélation…)
6. Les services : récompense au premier arrivé seulement, ou à tous ceux qui arrivent à temps ?
7. Par quoi commencer ? Ma proposition : (a) les cinq intercalaires et les sous-onglets de MISSIONS, avec ce qui
   existe déjà rangé dedans ; (b) les monolithes (la radio est prête) ; (c) les services ; (d) le commerce ; (e) les
   histoires ; (f) artefacts et épaves.

## 10. Décisions d'Adrien (16/10/2026)

- Ordre des intercalaires : MISSIONS · LIAISONS · **COCKPIT** · COMMERCE · ATELIER (posés le 16/10/2026 ; services,
  histoires et commerce y sont annoncés « bientôt »). LIAISONS remplace COMMUNICATION et SOCIAL ; les trophées y sont.
- Les quatre fils d'histoire plaisent.
- **Monolithes** : les dix trouvés donnent accès à une technologie extraterrestre : se téléporter n'importe où dans le
  système solaire, une fois par jour.
- **Services** : tous ceux qui arrivent à temps sont récompensés.
- **Maisons** : chacune a une spécialité ; tout le monde peut faire toutes les missions, mais on appartient
  **automatiquement** à la maison dont on fait le plus les missions (affinité). Les avantages restent à voir ensemble.

## 11. Les maisons (décisions d'Adrien du 16/10/2026, chiffres proposés par Claude)

Trois maisons, une spécialité chacune. Tout le monde peut faire toutes les missions ; on appartient
**automatiquement** à la maison dont on fait le plus les missions.

| Maison | Spécialité | Missions qui comptent |
|---|---|---|
| **Les Explorateurs** | la recherche | monolithes, visiteur, artefacts, épaves, relevés |
| **Les Coursiers** | la livraison | contrats de livraison et de courrier, services (secours) |
| **Les Commerçants** | le commerce | achats, ventes, exploitation des ressources |

**Affinité** : chaque mission accomplie donne des points à sa maison (monolithe 50, secours 15, livraison 10,
artefact 10, épave 10, vente rentable 5…). On appartient à la maison qui a le plus de points sur les **30 derniers
jours**. Trois **rangs** selon ces points : membre (100), confirmé (400), maître (1 000).

**Avantages** (idées d'Adrien, en gras ; le reste, propositions de Claude), par rang membre / confirmé / maître :

- **Explorateurs** — *les transmissions* : **plus de télégrammes par jour** (+1 / +2 / +3) ; **signal radio plus
  précis** (on capte net de plus loin : tolérance 0,05 → 0,07 → 0,09 → 0,11 ; monolithes et visiteur audibles de plus
  loin) ; télescope plus précis (±3° → ±2° → ±1°) ; bulletins de l'Observatoire avec 2 h d'avance au rang maître.
- **Coursiers** — *la vitesse* : **déplacement plus rapide** (+5 % / +10 % / +15 % de vitesse de croisière) ; appels de
  détresse reçus avant les autres ; un 4e contrat en cours au rang confirmé.
- **Commerçants** — *l'argent* : **améliorations et instruments moins chers** (−10 % / −20 % / −30 % à l'atelier) ;
  meilleurs prix au marché (achat −5 %, vente +5 % par rang) ; cale plus grande ; le télégramme des cours (prix du
  lendemain) au rang maître.

**Inconvénients** (pour équilibrer ; chaque maison est faible là où une autre est forte) :

- **Explorateurs** : l'atelier leur coûte **10 % plus cher** (ils dépensent tout en expéditions).
- **Coursiers** : au marché, **5 % moins bons prix** (ils n'ont pas le temps de marchander).
- **Commerçants** : **5 % plus lents** (la cale chargée alourdit la fusée).

**Pour tous** : un insigne et une couleur de maison (classement, fusée vue par les autres), un classement des maisons
chaque semaine, des télégrammes de la maison (nouvelles, missions spéciales).

À confirmer par Adrien : les chiffres, et si l'on garde les inconvénients.

## 12. Les monolithes en détail (proposition du 16/10/2026)

### Où ils sont
Dix monolithes, aux mêmes endroits pour tous, chacun près d'un astre (il le suit sur son orbite), sauf le dernier,
perdu dans le vide. Du plus proche au plus lointain :

| N° | Près de | Pourquoi là |
|---|---|---|
| 1 | la Lune (face cachée) | le premier, à portée dès la fin du tutoriel |
| 2 | Phobos | |
| 3 | Vénus | |
| 4 | Mercure | au ras du Soleil, sous le filtre |
| 5 | Europe (Jupiter) | |
| 6 | Japet (Saturne) | |
| 7 | Miranda (Uranus) | |
| 8 | Triton (Neptune) | |
| 9 | Encelade (Saturne) | |
| 10 | le vide, à 45 UA du Soleil (ceinture de Kuiper) | le plus dur : aucun astre pour se repérer |

Chacun se tient à une distance de son astre (de 20 000 à 200 000 km, tirée une fois pour toutes). Aucun ordre
imposé ; mais chaque monolithe trouvé livre, avec son fragment, le **système** où dort le suivant (le plus proche
non trouvé).

### Comment on les cherche (la radio et le manuel)
- Sur **7,50**, la radio capte le monolithe **non trouvé le plus proche**. Au-delà de 6 UA, rien que du souffle.
- Plus on approche, plus les **impulsions sont rapides** : le manuel donne une table « impulsions par seconde →
  distance » (de 0,5 impulsion/s à 6 UA jusqu'à 8 impulsions/s à 1 million de km). On compte, on lit la table, on
  trace un **cercle** sur la carte autour de sa position (comme pour le ping du visiteur). Deux ou trois mesures prises
  à différents endroits, et les cercles se coupent près du monolithe. C'est le cœur du jeu : la radio, la carte, le
  manuel.
- Les Explorateurs captent de plus loin et plus net (voir §11).

### La trouvaille
- À moins de **300 000 km**, le monolithe se voit dans la vue 3D : une dalle noire aux proportions 1 × 4 × 9, mate,
  qui ne reflète rien. On le touche : la fusée s'en approche (elle s'arrête à 200 m).
- Là, on le **photographie** (comme le visiteur) : trouvaille enregistrée.
- Récompense : **500 CR**, un **fragment** du message (un court texte qui s'ajoute à HISTOIRES), le système du suivant,
  un trophée ; et 50 points d'affinité pour les Explorateurs.
- Le premier joueur à trouver chaque monolithe est annoncé à tous (bulletin dans LIAISONS).

### Les dix réunis
Le message complet se lit, et la fusée reçoit la **technologie extraterrestre** : un **saut** par jour, n'importe où
dans le système solaire (on choisit la destination, on arrive aussitôt en orbite). Un voyant « SAUT PRÊT » au cockpit ;
24 heures d'attente entre deux sauts.

### Le manuel
Un nouveau chapitre « Monolithes » : la table impulsions → distance, la façon de tracer les cercles, la forme du
monolithe (pour le reconnaître dans la vue 3D). Le manuel ne dit jamais où ils sont.

### À valider par Adrien
1. Les dix emplacements (on peut en changer).
2. La recherche par la radio : compter les impulsions, la table du manuel, les cercles sur la carte.
3. 500 CR par monolithe.
4. Le message des dix fragments : à écrire ensemble (Claude peut proposer un texte).
