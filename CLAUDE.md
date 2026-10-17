# Capsule Andromeda

## À lire en premier
Capsule Andromeda est un jeu entièrement nouveau. Ce n'est pas une amélioration de l'ancien jeu « Manuel de vol », qui est dans un autre dépôt.

Au début de chaque session : lire ce fichier et docs/avancement.md. À la fin de chaque étape : mettre à jour docs/avancement.md. Ne jamais passer à l'étape suivante sans validation de Doudou. Doudou teste sur son téléphone : publier chaque version sur GitHub Pages et lui donner l'adresse.

## Le jeu
Monde ouvert semi-multijoueur pour téléphone uniquement (HTML, vertical), dans le vrai système solaire : positions réelles (éphémérides), vraies distances, vrai délai de la lumière, temps réel. Pas de game over, pas de compte à rebours.

Trame : des envahisseurs venus d'Andromède occupent le système solaire. Le joueur, aux commandes de sa « capsule », reconquiert les zones une à une (Lune, Mars, lunes de Jupiter, Saturne, Uranus) jusqu'à Triton, qui est en réalité leur vaisseau déguisé en lune (boss final de l'acte 1). N'importe quelle activité aide à libérer une zone. La campagne est facultative.

Direction artistique : vue 2D du dessus, fond blanc, astres en ronds noirs à taille réelle (un astre de moins d'un pixel devient un point, comme les étoiles). Les engins ont des silhouettes reconnaissables en noir, visibles en zoom rapproché.

Navigation : toucher un astre ou ouvrir le cadran de navigation. Deux traits : un pointillé vers la position actuelle de la cible, une courbe pour la vraie trajectoire orbitale jusqu'au point de rencontre. Durée du trajet selon la puissance des moteurs.

Progression : les crédits améliorent les moteurs pour aller plus vite et plus loin. Tutoriel : moteur lent, missions autour de la Terre jusqu'à pouvoir partir vers la Lune.

Maisons (attribuées selon les activités du joueur, profil en toile d'araignée, peut changer) :
- Nettoyeurs : vident les épaves (mini-jeu de tri rapide des matériaux).
- Commerçants : trading sur tous les systèmes, cours décalés selon le délai lumière, cours calculés par une formule du temps.
- Mercenaires : escortes, chasse aux pirates et aliens, dépannage d'engins (ISS, Pioneer…). Combat en vue tactique : énergie à répartir (boucliers, armes, moteurs), tir sur les modules ennemis, interception de missiles.

Pannes : système de modules à réparer avec un manuel. Les aliens tirent parfois des missiles (décompte visible sur la carte) ; un impact ralentit le trajet de 50 % jusqu'à réparation.

Multijoueur : monde rempli de bots ; les autres joueurs n'apparaissent que via le chat et les échanges. Serveur plus tard (type Supabase).

## Règles de code
- Moteur (éphémérides, navigation, état du jeu) séparé de l'affichage. L'affichage demande les données au moteur, il ne calcule jamais lui-même.
- Tests pour le moteur.
- Rendu Canvas 2D, pas de 3D.

## Feuille de route
1. Prototype 1 : carte et navigation (en cours).
2. Prototype 2 : combat (plus tard).
Le document de conception complet est chez Doudou. Ne rien inventer qui n'est pas ici : en cas de doute, demander.
