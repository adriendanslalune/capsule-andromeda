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
- Nettoyeurs : vident les épaves (mini-jeu de tri rapide des matériaux).
- Commerçants : trading sur tous les systèmes, cours décalés selon le délai lumière, cours calculés par une formule du temps.
- Mercenaires : escortes, chasse aux pirates et aliens, dépannage d'engins (ISS, Pioneer…). Combat en vue tactique : énergie à répartir (boucliers, armes, moteurs), tir sur les modules ennemis, interception de missiles.

Pannes : système de modules à réparer avec un manuel. Les aliens tirent parfois des missiles (décompte visible sur la carte) ; un impact ralentit le trajet de 50 % jusqu'à réparation.

Multijoueur : monde rempli de bots ; les autres joueurs n'apparaissent que via le chat et les échanges. Serveur plus tard (type Supabase).

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

## Feuille de route
1. Prototype 1 : carte et navigation (en cours).
2. Prototype 2 : combat (plus tard).
Le document de conception complet est chez Adrien. Ne rien inventer qui n'est pas ici : en cas de doute, demander.
