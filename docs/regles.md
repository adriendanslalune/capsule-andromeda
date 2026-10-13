# Règles du jeu et constantes (source de vérité du moteur)

Toutes les valeurs ci-dessous viennent du prototype `reference/prototype-v0.1.html`.
Ce sont des réglages : ils seront ajustés après tests, mais le portage doit d'abord les reproduire **à l'identique**.
UA = unité astronomique = 149 597 870,7 km.

## 1. Temps, positions, navigation

- **Temps réel.** Toutes les positions sont calculées à l'heure réelle (UTC).
- **Planètes** : éléments orbitaux J2000 et leurs dérivées séculaires (Standish, NASA/JPL), résolution de Kepler
  (6 itérations de Newton). Coordonnées écliptiques héliocentriques, en 2D (x, y en UA). Les 8 jeux d'éléments sont
  dans le prototype (tableau `EL`).
- **Lune** : position réelle (théorie lunaire de Meeus, termes principaux ; précision ≈ 0,01°, distance variant
  de 356 000 à 407 000 km). *Changement validé par Adrien le 13/10/2026 : le prototype utilisait un cercle de
  0,00257 UA, de période 27,321661 j et de phase arbitraire 2,1 rad à J2000.*
- **Satellites naturels** (vue 3D seulement) : **tous** les satellites connus des planètes (plus de 450, liste JPL),
  en position réelle. Orbites ajustées sur les positions de précision de JPL Horizons pour 2026–2030
  (outil `outils/satellites-jpl.mjs`, à relancer avant 2031) ; précision ≈ 1° vu de la planète.
  *Changement validé par Adrien le 13/10/2026 : le prototype n'avait que 9 satellites, en orbites circulaires
  de phase arbitraire.*
- **Coordonnées** : le moteur calcule aussi la hauteur z au-dessus de l'écliptique (vue 3D) ; la carte et la
  navigation n'utilisent que x et y, comme le prototype.
- **Départ** : nouvelle partie en orbite autour de la Terre.
- **Cap** : angle en degrés, 0° vers +x (point vernal), sens trigonométrique.
- **Virage** : la fusée tourne vers sa destination à **4° par seconde**.
- **Arrivée** : quand la distance restante ≤ max(pas, 0,002 UA) (Lune : 0,0002 UA).
  - Sur une planète ou la Lune : **mise en orbite**, la fusée suit l'astre.
  - Sur un point libre : arrêt moteur.
- **Sans destination**, la fusée ne bouge pas (vitesse affichée 0) et le compteur de route ne tourne pas.
- **Destination** : touche une planète (rayon de sélection 18 px), la Lune (si zoom suffisant) ou un point libre.
  Pendant un contrat, changer de destination est refusé.

## 2. Vitesse et économie

- Vitesse = 17,4 km/s × 1,1^(améliorations) × 0,2 si L-A abaissé × 0,45 si au moins une avarie × (1 + 0,5 × accélérations).
- Coût de l'amélioration n (n commence à 0) : arrondi(20 × 1,07^n) si n ≤ 45 ; sinon arrondi(20 × 1,07^45 × 1,12^(n−45)).
- Améliorations achetées dans l'ordre, une par une.
- **Primes de réparation** : CH-1 2, TU-1 2, AL-1 5, CO-1 8, PB-1 10, LP-1 8, HY-1 10, RE-1 6, MO-1 12,
  CR-1 8, AN-1 10, SX-1 12 crédits (CR).
- **Contrats** : 6 par jour, tirés au hasard avec une graine = la date du jour (AAAAMMJJ).
  Le premier va toujours vers la Lune, les 5 autres vers 5 planètes différentes parmi Mercure → Neptune.
  Types : livraison, relevé, remorquage, courrier (textes dans le prototype).
  Prime = max(6, arrondi(8 + 30 × √distance_UA)), figée à l'acceptation. Un contrat à la fois.
  Accepter fixe la destination ; la prime est versée à l'arrivée ; annuler la destination abandonne le contrat.
- **Installation des modules** (dans l'ordre) : CO-1 40, PB-1 70, LP-1 110, HY-1 160, RE-1 230, MO-1 320,
  CR-1 420, AN-1 540, SX-1 680. Instruments de chasse : TEL 250, puis DET 1 200 (DET exige TEL).
- **Trophées** : premier contrat, Mars, Jupiter, Neptune (arrivées), Kuiper (40 UA du Soleil), héliopause (120 UA),
  plus loin que Voyager 1 (170 UA), premier contact.

## 3. Pannes : déclenchement, cascades, fautes

- **Tutoriel** (pannes scénarisées) : n°0 surchauffe TU-1 ; n°1 pression CH-1 (sur ou sous au hasard) ;
  n°2 surchauffe + surpression ; n°3 fusible AL-1. La première arrive 18 s après le début ; pendant le tutoriel,
  la suivante arrive 18 s après la réparation.
- **Ensuite** : une nouvelle avarie 120 à 300 s après que tout est réparé.
- **Cascades** : nombre maximum de modules simultanés selon les améliorations : <8 → 1 ; <20 → 2 ; <35 → 3 ; sinon 4.
  Taille tirée = 1 + aléa × max, bornée par le nombre de modules installés, éligibles et pas déjà en panne.
- **Ordre de réparation d'une cascade** : ordre alphabétique des codes ; inversé si le dernier chiffre du n° de série
  est impair ; TU-1 toujours en premier. Un module réparé hors de son tour **retombe en panne** (sa panne est relancée).
  Prime de cascade = somme des primes × (1 + 0,5 × (n − 1)), versée à la fin.
- **Faute de pilotage** : une avarie provoquée par une fausse manœuvre (surpression ou sous-pression déclenchée
  par le joueur sur CH-1, asphyxie de RE-1 purge ouverte) doit être réparée mais **ne rapporte rien**.
- **Hors connexion** : à la reprise, simulation par pas de 600 s (avance de la fusée, usure de RE-1, avaries,
  contact). Plafond : au plus deux avaries accumulées pendant l'absence (à généraliser proprement).
  Puis un **rapport de vol** résume l'absence.
- Chaque module a sa propre **alarme sonore** (voir prototype, objet `ALARMES`).

## 4. Repères éparpillés

- **N° de série** : généré une fois par fusée, format LLC-CCL (L = lettre parmi ABCDEFGHJKLMNPRSTUVWXYZ, C = chiffre),
  ex. KE4-71B. « Dernier chiffre » = dernier chiffre lu dans le numéro. « Commence par une voyelle » = A, E, I, O, U, Y.
- **Interrupteurs S-1 à S-4** (bloc AL-1), position haute ou basse ; au départ : haut, haut, bas, haut.

## 5. Modules (règles exactes)

### CH-1 Chambre de combustion (de base)
- Pression P (0–100). Cible : surpression 96 ; sous-pression 6 ; sinon 50 + (R − 5) × 12 (+15 si L-B abaissé).
  Vitesse d'évolution 5/s (4/s si L-B abaissé).
- Surpression si P > 90 pendant 2 s ; sous-pression si P < 15 pendant 2 s (fautes de pilotage si non déclenchées par le jeu).
- Réparation : R sur 2 (surpression) ou 7 (sous-pression), puis presser P une fois.
- Presser P pendant une surchauffe → emballement (T = 100, erreur). Presser P sans panne → purge à vide (P − 20, erreur).
- Molette R : 0 à 9, chaque pression +1, après 9 vient 0.

### TU-1 Tuyère (de base)
- Température T. Cible : L-A abaissé 18 (−3,5/s) ; surchauffe 96 (+3/s) ; sinon 45 (2/s).
- Réparation : abaisser L-A, attendre, relever L-A. Relevé à T ≤ 40 : réparé. Entre 40 et 60 : faux réparé,
  la surchauffe revient 6 s plus tard. Au-dessus de 60 : rien.

### DV-1 Dérivation (accélération du grand-père, de base)
- Conditions : L-B abaissé, R sur 9, pas de panne de pression, P entre 72 et 90 → V-3 « chante ».
- Presser P exactement deux fois en moins de 0,9 s → armé. Puis relever L-B et remettre R sur 5 en moins de 15 s
  → accélération +1 (maximum 3). Une, ou trois pressions → erreur.

### AL-1 Fusibles (de base)
- 8 fusibles F-1 à F-8, bague de couleur (bleu, rouge, vert, jaune) tirée au hasard à la création.
- Panne : un fusible grille.
- Couleur du neuf : si S-1 bas → jaune ; sinon dernier chiffre pair → même couleur ; impair → couleur suivante
  (bleu → rouge → vert → jaune → bleu).
- Toute manipulation avec S-4 haut → étincelle (erreur). Couleur fausse → regrille aussitôt.
- Réparé quand le bon fusible est en place **et** S-4 remis en haut.

### CO-1 Codeur
- Panne : un mot s'affiche (20 mots, codes à 4 chiffres : table `MOTS` du prototype et page VIII du manuel).
- Corrections : n° de série commençant par une voyelle → inverser les chiffres ; puis S-3 bas → dernier chiffre +1 (9 → 0).
- Saisie au cadran à disque, EFFACER, ÉMETTRE.

### PB-1 Tableau de brassage
- Prises A-1…A-5 et B-1…B-5, trois câbles (rouge, bleu, jaune). Panne : un câble défectueux (témoin clignotant).
- Cible (pair / impair selon le dernier chiffre) : rouge A1→B4 / A2→B5 ; bleu A3→B1 / A5→B2 ; jaune A4→B3 / A1→B2.
- Prise occupée → prise suivante libre de la même rangée (après 5 : 1).
- Débrancher en touchant une fiche, rebrancher en touchant A puis B.

### LP-1 Lampes à vide
- 6 lampes ; panne : 1 + aléa × min(3, 1 + améliorations ÷ 10) lampes éteintes, bleues ou vertes.
- Ventilateur VT obligatoire pour toucher une lampe (sinon brûlure).
- Ordre : éteintes, puis bleues, puis vertes ; à couleur égale, numéro croissant (dernier chiffre pair) ou décroissant (impair).
- Réparé quand toutes sont orange et VT arrêté.

### HY-1 Circuit hydraulique
- Grille 4 × 3 de tuyaux pivotants (droit ou coude), source à gauche de la rangée du milieu, réservoirs R-1 à R-3 à droite.
- Génération : un chemin garanti vers le réservoir cible, tuiles mélangées.
- Réservoir : manomètre H < 35 → R-1 ; 35–70 → R-2 ; > 70 → R-3 ; S-2 bas → réservoir suivant (R-3 → R-1).
- VANNE : réparé si l'eau atteint ce réservoir et lui seul.

### RE-1 Recycleur d'air (entretien continu)
- O2 −1 toutes les 90 s, CO2 +1 toutes les 100 s (même hors ligne). Purge V-C ouverte : CO2 −4/s, O2 −0,5/s.
- Avarie si O2 < 25 ou CO2 > 75 (faute de pilotage si la purge est ouverte à ce moment).
- Réparé quand CO2 < 40, 60 ≤ O2 ≤ 90 et V-C fermée. POMPE : O2 +10 ; vanne ouverte → erreur ; au-delà de 90 → O2 = 70 et erreur.
- Ne participe jamais aux cascades.

### MO-1 Morse
- Panne : un indicatif répété en morse (point 0,22 s, trait 0,66 s). 10 stations : VEGA 3,47 ; ARES 5,12 ; IRIS 8,06 ;
  NOVA 2,89 ; LUNA 6,64 ; ECHO 9,31 ; ZETA 1,75 ; OMEGA 10,42 ; SOL 4,58 ; ATLAS 7,93. S-1 bas → +1,00.

### CR-1 Chronomètre de bord
- Heure attendue = heure UTC réelle (h:min) + dernier chiffre du n° de série en minutes. Panne : décalage de ±7 à ±240 min.
- Réglage H+ H− M+ M−, RECALER ; tolérance ±1 min.

### AN-1 Antenne orientable
- Orientation attendue = direction de la Terre vue de la fusée (+180° si S-3 bas), tolérance 5°.
- Jamais en panne à moins de 0,02 UA de la Terre.

### SX-1 Sextant
- 12 étoiles réelles, coordonnées écliptiques (azimut, hauteur) : Sirius 104/−40, Véga 285/+62, Bételgeuse 89/−16,
  Arcturus 204/+31, Antarès 250/−5, Régulus 150/0, Spica 204/−2, Aldébaran 70/−5, Altaïr 302/+29, Pollux 113/+7,
  Deneb 335/+60, Fomalhaut 334/−21.
- Dernier chiffre impair → viser l'étoile suivante du tableau. Tolérance 1,5° (écart d'azimut × cos(hauteur)).

## 6. Chasse au visiteur

- **Saisons** de 14 jours depuis le 5 janvier 2026 à 00:00 UTC. N° de saison = partie entière((t − époque) ÷ 14 j).
- **Trajectoire déterministe** (identique pour tous les joueurs) : générateur pseudo-aléatoire mulberry32,
  graine = n × 7919 + 13. Première escale tirée parmi Mercure…Saturne. Escale de 16 à 30 h ; puis voyage vers la
  planète la plus proche (parmi Mercure…Saturne) hors de ses deux dernières escales ; durée = max(6 h, distance ÷ 0,06 UA/h).
  Pendant l'escale, petit cercle de 0,004 UA en 6 h autour de la planète.
- **Ping** sur 7,13 (± 0,05) : écho après 2 × distance × 499,0048 s ; recharge 5 min ; hors fréquence : aucun écho.
- **Observatoire** toutes les 6 h : la planète où se trouvait le visiteur 6 h plus tôt (ou « aucune perturbation »).
- **Transmissions** toutes les 8 h (graine = index × 31 + 7) : une fois sur deux la planète la plus proche du visiteur,
  sinon une planète au hasard.
- **TEL** : direction ± 3° si le visiteur est à moins de 3 UA ; recharge 30 min.
- **DET** : visiteur visible (carte, vue 3D, bloc) à moins de 1,5 UA.
- **Contact** à moins de 0,01 UA : 250 CR + trophée, une fois par saison. Couronne et classement : avec le serveur.

## 7. Sauvegarde

- Tout l'état de la partie est sérialisable (JSON), avec un horodatage « vu » pour le rattrapage hors ligne
  et un numéro de version de format.
