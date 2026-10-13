# Interface — « piste A : la fenêtre d'abord » (validée)

Téléphone uniquement (390 × 844). Maquette cliquable : https://claude.ai/artifact/PrrqBmjCrTVS8Nf2TXCorz
La direction artistique n'est **pas** décidée : la maquette est volontairement neutre. Coder un style sobre et
isoler tout le visuel dans le thème.

Principe : **tu regardes la fenêtre, tu touches ce qui clignote, tu répares, tu reviens.**
L'écran principal répond à trois questions : où je vais, qu'est-ce qui ne va pas, quel est mon but.

## 1. Ouverture (première partie)
Lettre de l'Office au commissionnaire : la fusée est vieille et lente ; 1. réparez (chaque avarie réparée est payée,
le manuel est votre seul guide) ; 2. améliorez (les crédits rendent la fusée plus rapide) ; 3. ouvrez l'œil (quelque
chose rôde entre les planètes). P.-S. du grand-père : « Le manuel est annoté. Lis les marges. »
Puis « Prendre les commandes », et une première panne guidée.

## 2. Écran principal : la fenêtre
- Barre du haut : C-58, n° de commissionnaire, crédits, n° de saison.
- La vue sur l'espace (la fusée, le vrai ciel, la route vers la destination). Toucher ouvre la vue 3D complète.
- Carte « voyage » : destination, temps restant, distance, barre de progression, vitesse et effet des avaries.
  En orbite ou à l'arrêt : l'indiquer.
- **Tableau de voyants** : une tuile par module (grille 4 colonnes) — OK (discret), AVARIE (clignote), SCELLÉ (hachuré).
  Toucher une tuile en avarie ouvre le module.
- Ligne « chasse » : état du visiteur, dernier indice, jours restants dans la saison.
- Les deux derniers messages du téléscripteur.
- Trois gros boutons : CARTE, OFFICE, MANUEL.

## 3. Module en plein écran
- Un seul module à la fois, en grand, commandes à taille de pouce.
- En haut : retour « FENÊTRE », et « MANUEL · P. x » qui ouvre directement la bonne page.
- En bas : raccourci vers l'avarie suivante (« Autre avarie : TU-1 »).
- Les modules sans panne restent consultables depuis le tableau de voyants (pour vérifier un interrupteur, etc.).

## 4. Volets (montent du bas)
- **Carte** : zoom libre, positions réelles, grille et échelle, cadran de cap autour de la fusée, choix de destination,
  ping, tracés de chasse (cercle autour du dernier ping, droite depuis la dernière visée).
- **Office** : caisse et prochaine amélioration ; onglets Contrats, Atelier (améliorations, modules, instruments), Trophées.
- **Manuel** : lecteur page par page.

## 5. Vue 3D (dehors)
Fusée détaillée, vrai ciel, Soleil, planètes et satellites à leurs vraies directions et tailles apparentes,
Terre et Lune texturées (assets/textures), caméra orbitale au doigt, bouton « recentrer » derrière la fusée vers
la destination, petit cadran de position, repère de destination, visiteur si DET installé.

## 6. Retours et alertes
- Rapport de vol après une absence.
- Alarme sonore propre à chaque module ; bouton son.
- Plus tard : notifications du téléphone (avarie, écho reçu, arrivée).
