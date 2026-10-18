# Capsule Andromeda

## À lire en premier
Au début de chaque session : lire ce fichier et docs/avancement.md. À la fin de chaque étape : mettre à jour docs/avancement.md. Ne jamais passer à l'étape suivante sans validation d'Adrien. Adrien teste sur son téléphone : chaque version est fusionnée sur `main`, ce qui la publie sur GitHub Pages (https://adriendanslalune.github.io/capsule-andromeda/) ; lui donner l'adresse.

## Le jeu
Monde ouvert semi-multijoueur pour téléphone uniquement (HTML, vertical), dans le vrai système solaire : positions réelles (éphémérides), vraies distances, vrai délai de la lumière, temps réel. Pas de game over, pas de compte à rebours.

Trame : des envahisseurs venus d'Andromède occupent le système solaire. Le joueur, aux commandes de sa « capsule », reconquiert les zones une à une (Lune, Mars, lunes de Jupiter, Saturne, Uranus) jusqu'à Triton, qui est en réalité leur vaisseau déguisé en lune (boss final de l'acte 1). N'importe quelle activité aide à libérer une zone. La campagne est facultative.

Direction artistique : vue 2D du dessus, style « Moebius » (validé par Adrien) : fond blanc cassé, encre brun-violet, astres illustrés en aplats pastel, face de nuit en aplat violet avec hachures fines le long du terminateur. Astres grossis mais proportionnés ; en dézoomant ils rétrécissent jusqu'au point. Les engins ont des silhouettes reconnaissables, visibles en zoom rapproché.

Navigation : toucher un astre ou ouvrir le cadran de navigation. Deux traits : un pointillé vers la position actuelle de la cible, un trait plein en ligne droite jusqu'au point de rencontre (là où sera la cible à l'arrivée), qui contourne un astre s'il est sur le chemin. La capsule y va à vitesse constante selon la puissance des moteurs, avec une courte accélération au départ et un freinage à l'arrivée (décision d'Adrien du 17/10/2026 : plus de vraies trajectoires orbitales, illisibles).

Progression : les crédits améliorent les moteurs pour aller plus vite et plus loin. Tutoriel : moteur lent, missions autour de la Terre jusqu'à pouvoir partir vers la Lune.

Maisons (attribuées selon les activités du joueur, profil en toile d'araignée, peut changer) :
- Nettoyeurs : vident les épaves (mini-jeu de tri rapide des matériaux). L'action NETTOYER d'une mission lance ce tri ; les matériaux triés vont dans la soute (décision d'Adrien du 18/10/2026).
- Commerçants : trading sur tous les systèmes, cours décalés selon le délai lumière, cours calculés par une formule du temps. Un marché par système (Mercure, Vénus, Terre, Mars, Jupiter, Saturne, Uranus, Neptune, Pluton), présenté en graphique de cours façon trading (décision d'Adrien du 18/10/2026).
- Mercenaires : escortes, chasse aux pirates et aliens (missions de chasse), dépannage d'engins (ISS, Pioneer…). Combat en vue tactique : énergie à répartir (boucliers, armes, moteurs), tir sur les modules ennemis, interception de missiles. Avis d'Adrien sur le prototype (18/10/2026) : beaucoup trop facile ; il imagine plutôt un combat au tour par tour (à reprendre plus tard).

Missions attachées aux lieux (décisions d'Adrien du 18/10/2026) : 6 missions par planète (Pluton compris), 4 par grande lune (Lune, Io, Europe, Ganymède, Callisto, Titan, Rhéa, Japet, Titania, Obéron, Triton) ; chaque mission se passe dans le système de son lieu ; elles se consultent toutes dans le volet Missions (filtre de lieu, par défaut celui de la capsule ; on voit les prix d'ailleurs). Le prix d'une mission est fixé à sa création, selon sa zone (éloignement depuis la Terre et danger), jamais selon la position de la capsule (barème validé le 18/10/2026, à ajuster plus tard). C'est la campagne qui fait voyager les joueurs. Chaque système a plusieurs stations, toutes en orbite (jamais immobiles). La chasse aux aliens passe par les missions des Mercenaires : le chasseur visé apparaît sur la carte ; le radar ne sert qu'à prévenir d'une menace (un chasseur qui tire). Un chasseur abattu disparaît ; Andromède envoie un renfort ailleurs (stock inépuisable ; plus de renforts dans une zone libérée).

Missions et Maisons (décision d'Adrien du 18/10/2026) : sur chaque planète, 2 missions par Maison. Quand un joueur a de l'affinité avec une Maison, le jeu lui propose d'y appartenir ; ce n'est jamais définitif (il peut redevenir neutre, ou choisir une autre Maison si son affinité le permet). Membre d'une Maison, il se voit proposer 4 missions de sa Maison et 1 de chacune des deux autres : plus de choix, et mieux payé (+25 % sur les missions de sa Maison). Plus tard : des avantages entre joueurs d'une même Maison.

Missions partout (décision d'Adrien du 17/10/2026) : des épaves à nettoyer partout dans le système solaire, tout le temps (un Nettoyeur doit toujours en trouver). Précisions du 18/10/2026 : des épaves dans tous les systèmes et en plein espace (pas seulement autour des planètes) ; une épave vidée ne disparaît pas ; on ne vide une épave qu'en mission ; sur la carte, on ne voit que l'épave que vise une mission (sinon trop de bazar) ; les livraisons et les dépannages (satellites, fusées) sont aussi des missions permanentes, dans tout le système solaire, pas seulement autour de la Terre.

Monolithes (idée d'Adrien du 18/10/2026) : 1000 monolithes cachés dans tout le système solaire, comme les Korogu de Zelda BOTW, fixes par rapport au Soleil (les planètes bougent, les cercles s'en éloignent). Le bouton PING de la carte (sous les Messages) envoie un ping (un par heure au plus) ; le monolithe pas encore trouvé le plus proche répond, sans limite de portée ; l'écho revient à la vitesse de la lumière, en temps réel (on n'affiche jamais quand : ça fait partie de l'inconnu), et trace un cercle sur la carte (masquable). On se déplace et on recommence 1 ou 2 fois : la triangulation débloque un point où aller le prendre ; ramassé, ses cercles disparaissent, mais son icône reste sur la carte, et il ne répond plus aux PING. La cale (Capsule › Soute) compte les monolithes trouvés et les liste avec leur numéro et leur emplacement (distance au Soleil, longitude), le même pour tous : les joueurs peuvent s'entraider. Leur intérêt (décision d'Adrien du 18/10/2026) : la collection et le côté social seulement, des paliers qui donnent un statut affiché à côté du pseudo dans les Messages et dans le Profil (validés par Adrien : Écouteur 10, Sourcier 50, Arpenteur 100, Cartographe 250, Gardien 500, Oracle 1000 ; les bots ont aussi le leur) ; pas d'autre avantage pour l'instant. Pas de saisie d'un emplacement pour localiser un monolithe (une liste publiée gâcherait tout). Un écho revenu reste signalé dans le bandeau tant que le joueur ne l'a pas regardé.

Pannes : système de modules à réparer avec un manuel. Les aliens tirent parfois des missiles (décompte visible sur la carte) ; un impact ralentit le trajet de 50 % jusqu'à réparation.
Précisions d'Adrien du 18/10/2026 (étape 4) :
- Modules de la capsule et effet de leur panne : Moteur (vitesse divisée par 2), Navigation (pas de nouveau trajet ; le trajet en cours continue), Communications (plus de nouvelles missions), Énergie (actions sur place deux fois plus longues), Coque (sans effet seule ; si elle est en panne, un impact touche deux modules).
- Pannes : usure au hasard (rare, environ une tous les 10 trajets) et missiles aliens.
- Réparation : un onglet Réparation dans le volet Capsule, un grand panneau plein de modules, cadrans, câbles, écrans, jauges, radios… C'est là qu'on répare, en suivant le Manuel, à la manière de « Keep Talking and Nobody Explodes », avec un côté vintage dans l'esprit de Jules Verne.
- Missiles : très rares près de la Terre (utile pour le tutoriel) ; plus on s'éloigne du Soleil, plus les aliens sont nombreux et plus les missiles sont fréquents. Les aliens sont visibles sur la carte dès qu'on s'en approche à une certaine distance (petite alerte : « le radar a repéré un alien »). Précisions du 18/10/2026 : les aliens sont très nombreux, partout dans le système solaire (un chasseur ne doit pas s'ennuyer) ; ils se déplacent au hasard, on ne peut pas prévoir leurs déplacements pour les attendre.

Manuel (précision d'Adrien du 18/10/2026) : à terme, le manuel devient un guide général d'utilisation du jeu, téléchargeable et vendu aussi au format papier. Ses tableaux doivent donc rester les mêmes pour tous les joueurs (rien de propre à une partie dans le texte), pour qu'un exemplaire imprimé serve à tout le monde.

Multijoueur : monde rempli de bots ; les autres joueurs n'apparaissent que via le chat et les échanges. Serveur plus tard (type Supabase). Les Messages sont un point essentiel : tout le fun est là, c'est l'interaction avec les autres joueurs ; ils doivent être accessibles et fun (Adrien, 18/10/2026). Les messages voyagent à la vitesse de la lumière.

## Règles de code
- Moteur (éphémérides, navigation, état du jeu) séparé de l'affichage. L'affichage demande les données au moteur, il ne calcule jamais lui-même.
- Tests pour le moteur.
- Rendu Canvas 2D, pas de 3D.

## Règles de travail
- Tout en français : interface, textes, commentaires du code, messages de commit.
- Téléphone uniquement : écran de référence 390 × 844, cibles tactiles d'au moins 44 px.
- Ne jamais publier avec des tests rouges (`npm test`, `npm run check`, `npm run build`).
- Petits pas : une fonctionnalité à la fois, testée, commitée, publiée ; Adrien la valide sur son téléphone avant la suivante.
- Pas de changement de règle, d'équilibrage ou d'interface sans l'accord d'Adrien.

## Interface
La carte en plein écran est l'interface principale du joueur : c'est le cockpit. Tout le reste vient par-dessus et se referme pour revenir à la carte.
- Commandes de la carte (demande d'Adrien du 18/10/2026) : de petits carrés à symbole, en deux colonnes. À gauche, se repérer : système intérieur (jusqu'à Mars), système extérieur (jusqu'à Pluton), capsule, +, −, et un bouton discret « calques » (orbites, noms, cercles des PING). À droite, communiquer : Messages et PING.
- Bandeau d'alertes en haut, toujours visible : missile en approche avec décompte, panne en cours, ralentissement, trajet en cours avec heure d'arrivée. Toucher une ligne ouvre le volet qui va avec (la mission ouvre Missions, la panne le panneau de réparation…).
- Volets qui montent du bas, ouverts depuis une barre de 5 onglets accessible au pouce : Navigation, Capsule (crédits, moteur, modules, armement, réparation), Missions (avec un filtre par Maison), Marché, et « Plus » (Messages, Profil, Manuel, Réglages). Barre validée par Adrien le 18/10/2026 d'après la maquette `maquette-interface.html` ; le Manuel s'ouvre aussi depuis le panneau de réparation.
- Les onglets pas encore développés sont visibles mais grisés.
- Un volet se referme en le glissant vers le bas, de n'importe où (quand son contenu est tout en haut).
- Même direction artistique que la carte : les tons Moebius de la carte (décision d'Adrien du 17/10/2026, qui remplace « noir et blanc, une seule couleur d'alerte »).
- Heures affichées à l'heure du lieu du joueur (fuseau du téléphone ; pour Adrien, Paris). Le moteur compte en temps universel (UTC).
Ces choix sont provisoires et seront ajustés après test sur téléphone.

## Feuille de route
On construit le vrai jeu par étapes. Chaque étape doit être jouable sur téléphone et validée par Adrien avant de passer à la suivante.

1. Carte et navigation — FAIT.
2. Cadre du cockpit et socle de jeu : bandeau d'alertes, barre d'onglets et volets (Navigation et Capsule fonctionnels, les autres grisés) ; état de la capsule (crédits, niveau du moteur, position) ; sauvegarde locale sur le téléphone.
3. Missions, crédits, moteur — FAIT : volet Missions ; missions simples (nettoyer des débris, livrer une cargaison, dépanner un satellite) qui rapportent des crédits ; amélioration du moteur. Le tutoriel est déplacé à la fin (décision d'Adrien du 18/10/2026 : d'abord toutes les mécaniques).
4. Pannes et manuel : volet Manuel, modules à réparer, missiles aliens avec décompte, ralentissement de 50 % jusqu'à réparation.
5. Nettoyeurs : épaves sur la carte, mini-jeu de tri des matériaux.
6. Combat : Armement (dans le volet Capsule), vue tactique, énergie, tir sur les modules, interception (d'abord un prototype à tester).
7. Commerçants : volet Marché, cours par formule du temps, décalés selon le délai lumière.
8. Maisons : volet Profil, toile d'araignée, appartenance qui change selon les activités.
9. Première zone à libérer : la Lune.
10. Serveur, comptes, volet Messages, échanges entre joueurs.
11. Tutoriel autour de la Terre : moteur lent, missions autour de la Terre jusqu'à pouvoir partir vers la Lune (une fois toutes les mécaniques en place).
12. Version installable (PWA), puis boutique.
