# Règles du jeu et constantes (source de vérité du moteur)

Toutes les valeurs ci-dessous viennent du prototype `reference/prototype-v0.1.html`.
Ce sont des réglages : ils seront ajustés après tests, mais le portage doit d'abord les reproduire **à l'identique**.
UA = unité astronomique = 149 597 870,7 km.

## 1. Temps, positions, navigation

- **Temps réel.** Toutes les positions sont calculées à l'heure réelle (UTC).
- **Planètes** : théorie VSOP87B (Bretagnon et Francou), séries tronquées (`src/donnees/vsop87.ts`, produites par
  `outils/vsop87.mjs`), en temps terrestre TT (UTC + 69,184 s). Écart avec le JPL de 2000 à 2050 : moins de 500 km
  de Mercure à Mars, quelques milliers de km pour Jupiter et Saturne. Coordonnées écliptiques héliocentriques
  (x, y en UA). *Changement validé par Adrien le 17/10/2026* : remplace les éléments de Standish du prototype
  (jusqu'à 3,8 millions de km d'erreur pour Saturne), qui ne servent plus qu'aux tailles d'orbite et aux périodes.
- **Lune** : position réelle (théorie lunaire de Meeus, termes principaux ; précision ≈ 0,01°, distance variant
  de 356 000 à 407 000 km). *Changement validé par Adrien le 13/10/2026 : le prototype utilisait un cercle de
  0,00257 UA, de période 27,321661 j et de phase arbitraire 2,1 rad à J2000.*
- **Satellites naturels** (vue 3D seulement) : **tous** les satellites connus des planètes (plus de 450, liste JPL),
  en position réelle. Orbites ajustées sur les positions de précision de JPL Horizons pour 2026–2030
  (outil `outils/satellites-jpl.mjs`, à relancer avant 2031) ; précision ≈ 1° vu de la planète.
  *Changement validé par Adrien le 13/10/2026 : le prototype n'avait que 9 satellites, en orbites circulaires
  de phase arbitraire.*
- **Monde plat** (décision d'Adrien du 17/10/2026) : tout le jeu se passe sur la carte (x, y) ; la vue extérieure 3D
  n'est que de la contemplation (vraies positions, en 3D). Soleil, planètes et engins lointains : leur vraie position
  vue de dessus. Ce qui tourne autour d'une planète (Lune, satellites naturels, ISS, Hubble, Tiangong, Juno, Webb…) :
  son orbite est **rabattue** dans le plan de la carte (rotation autour de la ligne des nœuds), à sa vraie distance
  de la planète et à sa vraie vitesse (`positionPlate`). Vus de dessus sans cela, l'ISS serait 91 % du temps dans le
  disque de la Terre, Hubble 69 %, Tiangong 100 %. Le visiteur et les autres fusées utilisent aussi ces positions.
- **Départ** : nouvelle partie en orbite autour de la Terre, à 400 km d'altitude, près de l'ISS (voir ci-dessous).
- **Cap** : angle en degrés, 0° vers +x (point vernal), sens trigonométrique.
- **Virage** : la fusée tourne vers son point de visée à **4° par seconde**.
- **Accélération et bouton MOTEUR** : la vitesse ne saute jamais ; elle change **linéairement**, en **20 s** de
  l'arrêt à la vitesse de croisière ou de la croisière à l'arrêt (au départ d'une orbite, la fusée part de 0). Quand la
  vitesse de croisière change (avarie, levier L-A, amélioration), la vitesse la rejoint au même rythme. Le bouton
  MOTEUR du cockpit coupe le moteur : la fusée ralentit jusqu'à l'arrêt en 20 s et reste où elle est (entraînée par la
  planète dans un repère de planète), sa destination est gardée ; rallumé, elle repart (20 s pour retrouver sa
  croisière). Le compteur du cockpit donne le temps restant **à la vitesse du moment** :
  il fond pendant une accélération et grimpe pendant un freinage (moteur coupé à l'arrêt : pas de temps restant).
  *Demande d'Adrien du 14/10/2026.* *Décisions d'Adrien du 14/10/2026.*
- **Contournement des astres** : la fusée ne traverse jamais un astre. En route, elle ne passe jamais à moins de
  **1,1 rayon** du centre du Soleil, d'une planète ou d'un satellite du système où elle se trouve (sa destination
  exceptée : elle s'y met en orbite avant ; marge réduite au disque de sécurité du §13 quand la cible tourne tout
  près de l'astre, comme l'ISS). Si la route directe coupe un astre, elle suit la tangente à cet astre,
  du côté le plus proche de la route, puis reprend la route directe dès qu'elle est libre. Au départ d'une orbite,
  elle part du bord de cette marge et s'oriente aussitôt (manœuvre de dégagement). Un long pas (rattrapage hors
  ligne) qui passe près d'un astre est découpé en petits pas. Le détour allonge un peu le voyage ; le temps
  restant affiché est recalculé à chaque pas. Pour la vue 3D, la fusée garde en route la hauteur de l'astre quitté,
  qui rejoint peu à peu celle de sa destination.
  *Demandé par Adrien le 14/10/2026 (la fusée traversait la Terre en allant vers la Lune).*
- **Systèmes** : chaque planète a son système (elle-même, ses satellites ; la Lune pour la Terre). La fusée est dans
  un système quand elle est en orbite autour d'un de ses corps, ou dans la sphère d'influence de la planète
  (rayon de Hill : a × (m / 3M)^(1/3) ; Terre ≈ 0,010 UA, Jupiter ≈ 0,35 UA, Neptune ≈ 0,78 UA).
- **Repère du trajet** : celui de la planète quand la fusée et sa destination sont dans le même système
  (Terre → Lune, Io → Europe) ; celui du Soleil sinon (Terre → Mars, Terre → Titan, point libre).
  Dans un repère de planète, la fusée est entraînée par le mouvement de la planète.
- **Trajectoire de rencontre** : dans ce repère, la fusée vole en ligne droite, à sa vitesse, vers le point où sera
  la cible au moment où elle l'atteindra (plus petite durée τ telle que la cible, à t + τ, soit à moins de v·τ).
  Le point est recalculé à chaque pas. Le temps restant affiché est cette durée τ (moins la distance d'arrivée).
  La durée d'un voyage dépend donc de la vraie position et du vrai mouvement de la cible
  (Terre → Mars à 17,4 km/s : 258 jours au départ du 13/10/2026, 65 jours au départ du 13/05/2027).
  *Règle validée par Adrien le 13/10/2026. Le prototype visait la position actuelle de la cible, la vitesse étant
  comptée par rapport au Soleil : une fusée neuve ne pouvait rattraper ni la Lune, ni Vénus, ni Mars.*
  Le point de rencontre est recalculé à chaque pas avec la vitesse du moment : une amélioration ou une avarie change
  aussitôt la trajectoire.
- **Fenêtre de tir** : en orbite, la fusée est emportée par son astre ; partir plus tard peut donc faire arriver plus
  tôt. Quand le joueur choisit une destination depuis une orbite, la machine propose **deux départs** :
  maintenant, ou à la fenêtre de tir (le départ qui fait arriver le plus tôt, cherché entre maintenant et la durée
  du vol direct). La fenêtre n'est proposée que si elle fait gagner au moins 1 heure et 1 % du voyage.
  **Le joueur choisit.** En attente de fenêtre, la fusée reste en orbite (vitesse affichée 0, compteur arrêté) ;
  si la vitesse change pendant l'attente, la fenêtre est recalculée (elle peut disparaître : départ immédiat).
  Exemple, à 17,4 km/s, le 13/10/2026 : Mars maintenant → arrivée le 28/06/2027 ; fenêtre le 21/03/2027 →
  arrivée le 31/05/2027. *Validé par Adrien le 13/10/2026.*
- **Arrivée** : quand la distance à la cible ≤ max(pas, distance d'arrivée) :
  - planète : 0,002 UA ;
  - point libre : 1 000 km. *Décision d'Adrien du 14/10/2026 (avec 0,002 UA, soit 300 000 km, un point choisi près
    de la Lune était « atteint » presque aussitôt).*
  - Lune et satellites : 0,0002 UA (≈ 30 000 km), sans dépasser le quart de la distance entre le satellite et sa
    planète (Phobos ≈ 2 300 km). *Validé par Adrien le 13/10/2026.*
  - Sur un astre : **mise en orbite**, la fusée suit l'astre, **à l'endroit où elle est arrivée** (à la distance
    d'arrivée, environ 30 000 km pour la Lune), et en repart de là. *Décision d'Adrien du 14/10/2026 : l'astre ne doit
    pas « sauter » à côté de la fusée à l'arrivée.* Sur un point libre : arrêt moteur.
- **Sans destination**, la fusée ne bouge pas (vitesse affichée 0) et le compteur de route ne tourne pas.
- **Destination** : une planète, la Lune, **n'importe quel satellite** (validé par Adrien le 13/10/2026) ou un point
  libre (ou l'ISS). La destination reste libre, même avec des contrats en cours.
- **ISS** : corps du système de la Terre (destination possible ; distance d'arrivée ≈ 1 700 km, le quart de son
  orbite). Position réelle par la méthode SGP4 à partir de son orbite publiée (TLE, CelesTrak), à télécharger quand
  le jeu est connecté. Une orbite de secours est enregistrée dans le jeu ; si l'orbite a plus de 3 jours, la position
  est une **simulation** et l'interface doit le signaler. La fusée neuve est en orbite à côté de l'ISS et la suit ;
  le modèle 3D de l'ISS sera visible à quelques dizaines de mètres (phase 2).
  *Validé par Adrien le 13/10/2026. À prévoir : CelesTrak n'autorise pas le téléchargement direct depuis une page
  web ; passer par le serveur du jeu (phase 4) ou une autre source. L'ISS doit être retirée du service vers 2030.*

## 2. Vitesse et économie

- Vitesse = **30 km/s** × 1,1^(améliorations) × 0,2 si L-A abaissé × 0,45 si au moins une avarie.
  *Vitesse de départ proposée par Adrien le 13/10/2026 (17,4 km/s dans le prototype).
  L'accélération DV-1 (× (1 + 0,5 × accélérations)) est supprimée, avec le grand-père.*
- Coût de l'amélioration n (n commence à 0) : arrondi(20 × 1,07^n) si n ≤ 45 ; sinon arrondi(20 × 1,07^45 × 1,12^(n−45)).
- Améliorations achetées dans l'ordre, une par une.
- **Les réparations ne rapportent plus rien** (décision d'Adrien du 15/10/2026 ; avant : CH-1 2, TU-1 2, AL-1 5,
  CO-1 8, PB-1 10, LP-1 8, HY-1 10, RE-1 6, MO-1 12, CR-1 8, AN-1 10, SX-1 12 CR). Une avarie est un obstacle : elle
  ralentit la fusée ; elle compte pour le classement. L'argent vient des commissions (et, à venir : missions
  variées, photos, signaux radio, commerce).
- **Départ** : en orbite autour de la Terre (trois rayons, côté du Soleil).
- **Contrats du tutoriel** (15/10/2026), proposés seuls et dans l'ordre, primes fixes : ISS (30 CR), Hubble (40),
  Tiangong (50 ; « écoutez Radio-Terre »), puis le **premier grand voyage**, la Lune (120), annoncé en plein écran
  (lettre de l'Office, fanfare ; bouton « CAP SUR LA LUNE » qui accepte le contrat et met le cap). Une partie qui
  avait fini l'ancien tutoriel (ISS → Lune → ISS) a fini le nouveau.
- **Contrats de la semaine** (après le tutoriel) : **12** par semaine (*renforcés à titre provisoire le 15/10/2026,
  6 auparavant*), renouvelés le **lundi à 00:00 UTC**, identiques
  pour tous les joueurs (graine = AAAAMMJJ du lundi). Pour chacun : un système tiré au hasard (une chance sur 8),
  puis un corps de ce système (la planète, un de ses satellites ; la Lune ou l'ISS pour la Terre), sans doublon
  dans la semaine. Tous les corps sont possibles, petits satellites compris. Un contrat rempli n'est plus proposé
  de la semaine. Types : livraison, relevé, remorquage, courrier (textes dans `src/donnees/economie.ts`).
- **Contrats en cours** : **3 au plus** en même temps. **Un contrat accepté n'expire jamais** : il reste valable
  après la fin de sa semaine, et se remplit quand le joueur le souhaite, à la prime figée à l'acceptation
  (décision d'Adrien du 14/10/2026). Accepter un contrat ne change pas la destination (bouton
  « Y aller » dans l'interface) ; la destination reste libre. Chaque contrat est rempli en arrivant à sa
  destination ; il reste valable après la fin de sa semaine ; on peut l'abandonner sans pénalité.
- **Prime** = arrondi(40 × cours + 20 × distance_UA), figée à l'acceptation (*provisoire depuis le 15/10/2026 ; 10 et
  10 auparavant*) : une **base** de 40 CR, la même pour tous (soumise au cours), et un **bonus** de 20 CR par UA entre la fusée du joueur et la destination au moment où
  il accepte. Chaque joueur voit donc un bonus différent ; la prime suit la longueur du voyage.
- **Contrat sur place** : si la fusée, qui ne vole pas, est déjà à destination (en orbite autour de l'astre, ou
  assez près pour y être arrivée : par exemple à côté de l'ISS pour un contrat vers la Terre), le contrat peut
  être accepté ; il est rempli aussitôt, avec la prime divisée par 10 (au moins 1 CR).
- **Cours des contrats** (phase 4, avec le serveur) : plus un contrat est choisi par les joueurs, moins il rapporte ;
  moins il est choisi, plus il rapporte. Le moteur accepte déjà un coefficient de cours sur la base (1 en attendant
  le serveur). *Formule à décider.*
- *Toutes les règles de contrats ci-dessus : décisions d'Adrien du 13/10/2026. Le prototype proposait 6 contrats par
  jour (la Lune puis 5 planètes), un seul à la fois, qui fixait la destination ; prime = max(6, arrondi(8 + 30 × √d)).*
- **Modules** (décision d'Adrien du 15/10/2026) : ils ne s'achètent plus ; chacun se débloque et s'installe tout seul quand
  le moteur atteint son palier, un toutes les 5 améliorations, dans l'ordre : CO-1 (5ᵉ), PB-1 (10ᵉ), LP-1 (15ᵉ),
  HY-1 (20ᵉ), RE-1 (25ᵉ), MO-1 (30ᵉ), CR-1 (35ᵉ), AN-1 (40ᵉ), SX-1 (45ᵉ). Une partie qui en avait acheté les garde.
  *Avant : achetés de 40 à 680 CR.* Instruments de chasse (achetés) : TEL 250, puis DET 1 200 (DET exige TEL).
- **Trophées** : premier contrat, Mars, Jupiter, Neptune (arrivées), Kuiper (40 UA du Soleil), héliopause (120 UA),
  plus loin que Voyager 1 (170 UA), premier contact.

## 3. Pannes : déclenchement, cascades, fautes

- **En voyage seulement** (décision d'Adrien du 15/10/2026) : jamais d'avarie en orbite, à l'arrêt, moteur coupé ou
  en attente d'une fenêtre de tir ; une avarie programmée est oubliée si le voyage s'arrête.
- **Tutoriel** (pannes scénarisées), une par voyage du tutoriel, 18 s après le départ : n°0 surchauffe TU-1 (vers
  l'ISS) ; n°1 pression CH-1, sur ou sous au hasard (vers Hubble) ; n°2 surchauffe + surpression (vers Tiangong) ;
  n°3 fusible AL-1 (vers la Lune).
- **Ensuite** : environ une par voyage. Quand tout est réparé, la prochaine est programmée entre 25 % et 85 % du
  trajet restant (compté sur 24 h au plus), au moins 60 s plus tard ; **3 au plus par 24 heures glissantes**.
  *Avant : une avarie 120 à 300 s après chaque réparation.*
- **Cascades** : nombre maximum de modules simultanés selon les améliorations : <8 → 1 ; <20 → 2 ; <35 → 3 ; sinon 4.
  Taille tirée = 1 + aléa × max, bornée par le nombre de modules installés, éligibles et pas déjà en panne.
- **Ordre de réparation d'une cascade** : ordre alphabétique des codes ; inversé si le dernier chiffre du n° de série
  est impair ; TU-1 toujours en premier. Un module réparé hors de son tour **retombe en panne** (sa panne est relancée).
  (Plus de prime de cascade.)
- **Faute de pilotage** : une avarie provoquée par une fausse manœuvre (surpression ou sous-pression déclenchée
  par le joueur sur CH-1, asphyxie de RE-1 purge ouverte) doit être réparée.
- **Retour après une absence** (application fermée ; le jeu lui-même exige une connexion) : simulation par pas de
  600 s (vol, usure de RE-1, avaries, arrivées, contrats, trophées). Une avarie bloque les suivantes, comme en jeu
  (donc une seule avarie pendant l'absence, sans compter l'usure de RE-1 ; la « seconde avarie » ajoutée d'office
  après 2 h a été supprimée le 15/10/2026). La chasse n'est mise à jour qu'au retour
  (bulletin et transmission les plus récents, échos revenus). Puis un **rapport de vol** résume l'absence : durée,
  distance, vitesse, avaries et leur heure, arrivées, contrats, crédits, trophées, messages, modules en panne.
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
- Presser P pendant une surchauffe (V-1 allumé), avec ou sans avarie de pression → emballement (T = 100, erreur),
  comme le dit le manuel. *Décision d'Adrien du 13/10/2026 ; le prototype exigeait aussi une avarie de pression.*
  Presser P sans avarie → purge à vide (P − 20, erreur). Après la réparation, replacer R sur 5 (sinon, avec R sur 2,
  la pression vise 14 et retombe en sous-pression : faute de pilotage).
- Molette R : 0 à 9, chaque pression +1, après 9 vient 0.

### TU-1 Tuyère (de base)
- Température T. Cible : L-A abaissé 18 (−3,5/s) ; surchauffe 96 (+3/s) ; sinon 45 (2/s).
- Réparation : abaisser L-A, attendre, relever L-A. Relevé à T ≤ 40 : réparé. Entre 40 et 60 : faux réparé,
  la surchauffe revient 6 s plus tard. Au-dessus de 60 : rien.

### ~~DV-1 Dérivation~~ — supprimé (décision d'Adrien du 13/10/2026)
- L'accélération secrète et le témoin V-3 disparaissent. Le levier L-B reste sur CH-1 : le manuel interdit d'y
  toucher, et l'abaisser fait monter la pression (risque de surpression, faute de pilotage).

### AL-1 Fusibles (de base)
- 8 fusibles F-1 à F-8, bague de couleur (bleu, rouge, vert, jaune) tirée au hasard à la création.
- Panne : un fusible grille.
- Couleur du neuf : si S-1 bas → jaune ; sinon dernier chiffre pair → même couleur ; impair → couleur suivante
  (bleu → rouge → vert → jaune → bleu). La couleur de référence est celle du **premier** fusible grillé, même si un
  fusible de mauvaise couleur a grillé à sa place depuis. *Confirmé par Adrien le 13/10/2026.*
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
- À l'avarie, le câble défectueux n'est jamais laissé sur son branchement du tableau (sa fiche A est déplacée sur
  la première prise A libre). *Correction du 13/10/2026 d'un oubli du prototype.*

### LP-1 Lampes à vide
- 6 lampes ; panne : 1 + aléa × min(3, 1 + améliorations ÷ 10) lampes éteintes, bleues ou vertes.
- Ventilateur VT obligatoire pour toucher une lampe (sinon brûlure).
- Ordre : éteintes, puis bleues, puis vertes ; à couleur égale, numéro croissant (dernier chiffre pair) ou décroissant (impair).
- Réparé quand toutes sont orange et VT arrêté.

### HY-1 Circuit hydraulique
- Grille 4 × 3 de tuyaux pivotants (droit ou coude), source à gauche de la rangée du milieu, réservoirs R-1 à R-3 à droite.
- Génération : grille au hasard, gardée seulement si la source peut être reliée à **chacun** des trois réservoirs
  (la panne reste réparable même si S-2 change) et si elle n'est pas déjà réparée. *Correction du 13/10/2026 : le
  prototype ne garantissait un chemin que vers un réservoir tiré au hasard, sans rapport avec le manomètre.*
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

*Règles de la chasse refondues avec Adrien le 13/10/2026 (le prototype faisait voyager le visiteur entre les planètes,
avec un contact à moins de 0,01 UA).*

- **Saisons** : une par mois, du 1er à 00:00 UTC au 1er du mois suivant ; janvier 2026 = saison 0
  (n° = mois écoulés depuis janvier 2026). Graine de la saison n : n × 7919 + 13 (mulberry32), la même pour tous.
- **Boucle d'escales.** Chaque saison, le visiteur fait une **boucle de 3 ou 4 escales** (astres différents, tirés
  comme les contrats : un système, puis un astre de ce système), une par jour (jour 0 = le 1er du mois = première
  escale de la boucle). À son escale, il se tient à côté de son astre, dans le plan de la carte, à une distance
  (30 000 à 150 000 km, *provisoire*) et dans une direction tirées pour ce jour, en suivant l'astre.
- **Voyage du matin.** Chaque jour à **00:00 UTC**, il quitte sa place de la veille et file **en ligne droite** vers sa
  place du jour, où il arrive à **06:00 UTC** ; sa vitesse dépend donc de la distance. Il reste ensuite à son escale
  jusqu'au minuit suivant. Pendant le voyage, on peut le repérer (ping, TEL, DET) mais pas l'approcher.
  *Décision d'Adrien du 14/10/2026.*
- **Ping** (bouton ÉMETTRE du poste radio, §16) sur la **fréquence du visiteur du mois** (± 0,05) : écho après
  2 × distance × 499,0048 s ; recharge 5 min ; hors fréquence : aucun écho.
- **Observatoire** (à écouter sur le poste radio, §16) toutes les 6 h : le **système** (la planète) où se trouvait le visiteur 6 h plus tôt
  (« PERTURBATIONS DANS LE SYSTÈME DE SATURNE »). L'astre exact n'est pas donné.
- **Transmissions** (à écouter, §16) toutes les 8 h (graine = index × 31 + 7) : une fois sur deux la planète la plus
  proche du visiteur (à l'instant d'émission), sinon une planète au hasard.
- **TEL** : direction ± 3° si le visiteur est à moins de 3 UA ; recharge 30 min.
- **DET** : visiteur signalé à moins de 1,5 UA (dans la vue 3D, la soucoupe clignote).
- **Trouvaille** :
  1. repérer la soucoupe (une soucoupe volante classique des années 50) à l'œil dans la vue 3D ; on ne peut la
     toucher qu'à moins de **300 000 km** (*provisoire*) : un joueur loin de là ne peut pas tomber dessus par hasard ;
  2. la toucher lance l'**approche** : la fusée la rejoint (à sa vitesse) et s'arrête à environ **200 m**
     (*provisoire*), puis reste à côté d'elle tant qu'elle ne change pas d'escale ; si le visiteur change d'escale
     pendant l'approche, celle-ci est abandonnée ;
  3. **prendre une photo** depuis la fusée : valable à moins de **300 m**.
  Chaque joueur peut trouver le visiteur une fois par saison : 250 CR et le trophée « Premier contact ».
- **Annonce** (phase 4, serveur) : chaque trouvaille est annoncée à tous les joueurs, avec la photo et le **nom de la
  fusée** (choisi par le joueur au début de la partie, 24 caractères au plus). Le **premier** à trouver le visiteur de
  la saison reçoit un statut particulier : une couronne à côté de son pseudo et une fusée entièrement en or, brillante.

## 7. Sauvegarde

- Tout l'état de la partie est sérialisable (JSON), avec un horodatage « vu » pour le rattrapage après une absence
  et un numéro de version de format (1). Quand la structure change, on augmente le numéro et on écrit une migration.
  Une sauvegarde abîmée, d'un autre jeu ou d'une version plus récente est refusée avec une explication.

## 8. Télégrammes (décisions d'Adrien du 14/10/2026)
- Texte libre (140 caractères au plus, espaces resserrés) ou phrases toutes faites (`src/donnees/telegrammes.ts`).
- **3 envois gratuits par 24 heures glissantes** : chaque envoi se libère 24 h après avoir été fait.
- Destinataires, au choix de l'émetteur : son système planétaire (impossible hors de tout système), un joueur
  (désigné par sa fusée), ou tout le système solaire. On ne reçoit jamais ses propres télégrammes.
- Réception au **vrai délai de la lumière** depuis le point d'émission : chacun le reçoit à son heure.
- Les télégrammes reçus restent affichés 3 jours. L'Office (depuis la Terre) envoie l'accueil, puis chaque lundi
  00:00 UTC l'annonce des nouveaux contrats.
- En attendant le serveur : les bots écrivent avec modération (au plus 3 par jour, phrases sans indice de chasse)
  et répondent aux télégrammes du joueur qui leur parviennent (toujours à un télégramme personnel, une fois sur
  deux à un télégramme collectif), quelques minutes après l'avoir reçu.
- Moteur : `src/moteur/telegrammes.ts` ; constantes : `TELEGRAMMES` dans `src/donnees/reglages.ts`.

## 9. La Terre et l'ISS (décision d'Adrien du 15/10/2026, remplace celle du 14/10)
- La Terre et l'ISS sont deux destinations. Arrivée sur Terre : orbite à trois rayons, comme les autres astres
  (l'amarrage systématique à l'ISS était pénible, et aurait entassé tous les joueurs au même endroit).
- L'ISS se visite comme un engin : arrivée à 1 km, puis la fusée se range à 100 m et la suit. Plus d'amarrage.
- Les contrats peuvent viser la Terre ou l'ISS.

## 10. Le Soleil, destination (décisions d'Adrien du 14/10/2026)
- Le Soleil se choisit sur la carte comme un astre ; arrivée à 0,02 UA (`SEUIL_ARRIVEE_SOLEIL`, ~3 millions de km).
  En orbite solaire, la fusée n'est dans aucun système planétaire. Pas de fenêtre de tir vers le Soleil.
- Contrats : à chaque tirage, une chance sur 9 pour le Soleil (sinon un des 8 systèmes).
- Hublot et vue 3D : éblouissement croissant à moins de 0,6 UA ; bouton FILTRE (filtre solaire) : l'image
  s'assombrit en douceur, le Soleil devient une boule blanche ; le retirer revient en douceur.

## 11. Engins humains, destinations (décision d'Adrien du 14/10/2026)
- 17 engins, à leur position réelle : Hubble et Tiangong (orbites publiées, SGP4), James Webb, Gaia, Parker Solar Probe,
  Solar Orbiter, BepiColombo, Europa Clipper, JUICE, Juno, Lucy, Psyche, New Horizons, Pioneer 10 et 11, Voyager 1 et 2
  (trajectoires de JPL Horizons, `outils/engins-jpl.mjs`, période 2026-2029 à rafraîchir).
- Chacun est une destination : arrivée à 1 km (`SEUIL_ARRIVEE_ENGIN_KM`), puis la fusée se range à 100 m
  (trois fois sa taille, de 25 à 100 m) et le suit.

## 12. Trophées (décision d'Adrien du 14/10/2026)
- Ils ne rapportent rien. Catalogue : `src/moteur/trophees.ts` (paliers dans `src/donnees/trophees.ts`), 555 trophées :
  un par astre (Soleil, 8 planètes, Lune, 452 satellites), un par engin (ISS et 17 autres), et des paliers : route
  parcourue, éloignement et proximité du Soleil, avaries réparées, améliorations du moteur, vitesse de croisière,
  modules et instruments au complet, contrats, crédits en caisse, jours de service, télégrammes, visites, collections
  (Grand Tour, chaque système complet, tous les engins), trouvailles du visiteur.
- Les lieux visités avant cette version (orbite actuelle, contrats remplis)
  sont rattrapés.

## 13. Règle d'or : rien ne traverse un astre (17/10/2026, remplace le contournement en 3D du 14/10)
- Sur la carte, la fusée ne passe jamais dans le disque de sécurité d'un astre (sa destination exceptée) : 2 % de plus
  que son rayon, ou son altitude de sécurité (400 km pour la Terre), abaissée à 5 km sous une destination plus basse
  (Tiangong). Elle contourne par le côté (tangente, voir §1) ; une garde la ramène au bord si elle y entrait.
- Plus de passage « au-dessus » d'un astre : la hauteur z ne sert qu'à la vue extérieure.
- Testé : de la nouvelle partie vers Hubble à toute heure, de la Lune vers l'ISS, Hubble ou Tiangong, jamais à moins de
  400 km du bord de la Terre sur la carte.

## 14. Classements (décision d'Adrien du 14/10/2026 ; barème proposé, à ajuster)
- Trois classements aux **points de commissionnaire** : de la **semaine** (depuis lundi 00:00 UTC), du **mois**
  (depuis le 1er, 00:00 UTC) et **général**.
- Barème (`src/donnees/classement.ts`) : contrat rempli 10 pts ; avarie réparée 2 ; astre ou engin visité pour la
  première fois 5 ; trophée 3 ; million de km parcourus 1 ; visiteur photographié 50. Les points ne s'échangent pas.
- Un relevé des compteurs par jour (UTC, 40 jours gardés) ; points d'une période = aujourd'hui − relevé du début.
- Chaque trophée garde aussi sa date d'obtention.

## 15. Distance d'orbite (décision d'Adrien du 14/10/2026)
- Planètes, Lune et satellites : arrivée et orbite à **trois rayons** de l'astre, depuis son centre (`ORBITE_RAYONS`) ;
  petits satellites au rayon inconnu : 5 km supposés. Remplace les distances du prototype (0,002 UA pour toute
  planète, 0,0002 UA pour la Lune, au plus le quart de l'orbite d'un satellite).
- Inchangés : le Soleil (0,02 UA), les engins et l'ISS (trois fois leur taille, de 25 à 100 m).
- Hublot : près d'un gros astre, le champ s'élargit en douceur (jusqu'à 40°) pour que l'astre reste lisible.

## 16. Poste radio R-12 (décisions d'Adrien du 15/10/2026 ; fréquences provisoires)
- Une radio réglée de 0,00 à 12,00 au centième (`src/donnees/radio.ts`, `src/moteur/radio.ts`) ; nouvelle partie : 6,00.
  Réception nette à ± 0,05 d'une station, brouillée (texte mangé, signal faible) jusqu'à ± 0,30, souffle au-delà.
- Stations : Radio-Terre 0,30 (nouvelles de l'Office, une toutes les 20 min, et top horaire en TU, reçus avec le retard
  de la lumière depuis la Terre) ; Observatoire 0,62 (dernier bulletin, depuis la Terre, avec le retard de la
  lumière) ; transmissions 11,68 (dernier signalement) ; les 10 stations morse du MO-1 sur leur fréquence de
  l'annuaire (indicatif en morse seulement).
- Les indices de chasse ne tombent plus tout seuls : Observatoire et transmissions ne sont reçus (journal de bord,
  indices) que si la radio est réglée nette dessus ; chacun une seule fois ; radio laissée dessus, les nouveaux
  arrivent, même hors ligne (le plus récent seulement au retour).
- Fréquence du visiteur, mois par mois (janvier → décembre) : 7,13 · 4,02 · 9,74 · 2,31 · 6,27 · 10,88 · 1,46 ·
  8,55 · 3,12 · 11,05 · 5,71 · 0,97. Elle ne s'entend pas : seule la table du manuel (XX) la donne.
- Canal de détresse 5,00 : à l'écoute, pour l'instant « aucun appel en cours » (sauvetages à venir). Signal des
  monolithes 7,50 : impulsions groupées par 2, 3, 5, 7 et 11, sans autre usage pour l'instant (10 monolithes à
  rassembler, à peaufiner). *Décision d'Adrien du 15/10/2026 : une seule fréquence pour les monolithes.*

## 17. Départs (décisions d'Adrien du 15/10/2026)
- **Nouvelle partie** : en orbite autour de la Terre, 1 500 km au-dessus de l'ISS, qu'elle suit tant qu'elle n'est pas
  partie (`DEPART_AU_DESSUS_ISS_KM`) : le premier contrat (l'ISS) se fait en 1 à 2 minutes, 4 au plus avec l'avarie
  du tutoriel.
- **Manœuvre de départ** d'une orbite (`MANOEUVRE_DEPART`) : la fusée recule 5 s à 20 m/s, tourne vers sa destination
  (8°/s, 40 s au plus), puis accélère en douceur : vitesse = croisière × (t / 30 s)², la croisière au bout de 30 s.
  Le temps restant l'inclut (estimation du virage : 10 s). En rattrapage hors ligne (pas de plus de 5 s), départ
  sans manœuvre, d'emblée à la croisière.
- *À corriger plus tard* : le temps annoncé ne compte pas le détour autour d'un astre ni le mouvement d'un engin
  proche (exemple : vers l'ISS depuis l'ancien départ, 4 min annoncées pour 12 réelles).
- **Avaries tous les X km** (15/10/2026, remplace « environ une par voyage ») : hors tutoriel, la prochaine avarie
  survient quand le compteur de route a fait 1,5 à 4,5 millions de km depuis la dernière réparation (moyenne
  3 millions ; valeurs proposées par Claude), en voyage seulement, 3 au plus par 24 h. Au moteur de départ
  (30 km/s), environ une par jour de vol ; un aller Terre-Lune n'en donne presque jamais.
- **Altitude de sécurité** : jamais à moins de 400 km de la Terre (`ALTITUDE_SECURITE_KM`), sauf pour rejoindre une
  destination plus basse (Tiangong, vers 385 km : jusqu'à 5 km sous elle).
- **Manœuvre de départ** (correction du 15/10/2026) : pendant toute la manœuvre (recul, virage, accélération de
  45 s), la fusée suit le mouvement du lieu quitté (l'ISS va à 7,7 km/s autour de la Terre) ; on la voit s'éloigner.
