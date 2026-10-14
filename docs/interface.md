# Interface — « piste A : la fenêtre d'abord » (validée)

Téléphone uniquement (390 × 844). Maquette cliquable : https://claude.ai/artifact/PrrqBmjCrTVS8Nf2TXCorz
La direction artistique n'est **pas** décidée : la maquette est volontairement neutre. Coder un style sobre et
isoler tout le visuel dans le thème.

Principe : **tu regardes la fenêtre, tu touches ce qui clignote, tu répares, tu reviens.**
L'écran principal répond à trois questions : où je vais, qu'est-ce qui ne va pas, quel est mon but.

## 1. Ouverture (première partie)
Lettre de l'Office au commissionnaire : la fusée est vieille et lente ; 1. réparez (chaque avarie réparée est payée,
le manuel est votre seul guide) ; 2. améliorez (les crédits rendent la fusée plus rapide) ; 3. ouvrez l'œil (quelque
chose rôde entre les planètes).
Puis « Prendre les commandes », et une première panne guidée.

## 2. Écran principal : le poste de pilotage
- Barre du haut, toujours fixe (bandeau bleu) : C-58, nom de la fusée, voyant TÉLÉGR. (s'allume quand un télégramme
  est arrivé ; ouvre le guichet des télégrammes), crédits (ouvre le portefeuille) et saison, son, manuel.
- Cinq onglets en intercalaires sous la barre : CARTE, CONTRATS, **COCKPIT** (au milieu, page d'accueil), ATELIER,
  TROPHÉES. COCKPIT est plus grand que les autres. L'onglet de la page affichée ressort ; une pastille rouge sur COCKPIT
  compte les avaries. On passe à la page voisine en glissant le doigt à gauche ou à
  droite (sauf sur la carte, qui se déplace au doigt). Le geste « retour » du téléphone ramène au cockpit.

### Page COCKPIT (refaite le 14/10/2026 : un seul écran, quatre questions)
- **Hublot** d'un bord à l'autre (toucher : vue 3D extérieure ; bouton FILTRE solaire).
- **1. Où je vais ?** Panneau PILOTAGE : écran de navigation (destination, temps restant à la seconde, jour et
  heure d'arrivée, frise) ; trois petits cadrans (vitesse, cap, heure d'arrivée), qui ouvrent le volet INSTRUMENTS
  (grands cadrans, loupe, relevés : route, Soleil, radio, croisière) ; interrupteur MOTEUR cerné de rayures jaunes et
  noires ; bande « danger ».
- **2. Qu'est-ce qui ne va pas ?** Panneau BLOCS DU BORD : phrase d'état (« Tout est en ordre. » / « 2 avaries :
  touchez un voyant rouge. »), les 12 voyants en grand (trait PROPULSION), plaque constructeur avec le numéro de série.
- **3. Quel est mon but ?** Carte MISSION (contrat en cours : destination, prime, distance ; ouvre CONTRATS) et carte
  VISITEUR (radar, jours de saison ; ouvre NAVIGATION).
- **4. Qui est autour ?** Carte LIAISON : commissionnaires en ligne, rang au classement, dernière annonce ; ouvre le
  volet LIAISON (télégrammes, en ligne, classement aux trophées, annonces des 48 dernières heures).
- En pied : la dernière ligne du journal de bord (toucher : tout le journal).

## 3. Module en plein écran
- Un seul module à la fois, en grand, commandes à taille de pouce.
- En haut : retour « FENÊTRE », et « MANUEL · P. x » qui ouvre directement la bonne page.
- En bas : raccourci vers l'avarie suivante (« Autre avarie : TU-1 »).
- Les modules sans panne restent consultables depuis le tableau de voyants (pour vérifier un interrupteur, etc.).

## 4. Pages du poste et volets
- **Carte** (page) : zoom libre, positions réelles, grille et échelle, cadran de cap autour de la fusée (avec la cible, le
  point de rencontre visé et la trajectoire de rencontre), choix de destination (planète, Lune, satellite, ISS,
  point libre) ; depuis une orbite, deux boutons : « Partir maintenant — arrivée le … » et, s'il y en a une,
  « Attendre la fenêtre de tir — départ le …, arrivée le … » ; en attente, afficher le compte à rebours du départ,
  ping, tracés de chasse (cercle autour du dernier ping, droite depuis la dernière visée).
- **Contrats, Atelier, Trophées** (pages) : caisse et prochaine amélioration ; Contrats (contrats de la semaine avec leur prime pour ce
  joueur, 3 contrats en cours au plus, boutons « Accepter », « Y aller », « Abandonner »), Atelier (améliorations,
  modules, instruments), Trophées.
- **Manuel** (volet qui monte du bas) : lecteur page par page. Le portefeuille est aussi un volet.

## 5. Vue 3D (dehors)
Fusée détaillée, vrai ciel, Soleil, planètes et satellites à leurs vraies directions et tailles apparentes,
Terre et Lune texturées (assets/textures), caméra orbitale au doigt, bouton « recentrer » derrière la fusée vers
la destination, petit cadran de position, repère de destination.
**Visiteur** : modèle 3D d'une soucoupe volante classique des années 50, visible à l'œil près de son astre (elle
clignote si DET est installé et qu'elle est à moins de 1,5 UA). On ne peut la toucher qu'à moins de 300 000 km ; la
toucher lance l'approche. Arrivé à environ 200 m, bouton « PHOTO » : la photo (capture de la vue 3D) valide la
trouvaille à moins de 300 m.

## 6. Retours et alertes
- Rapport de vol après une absence.
- Alarme sonore propre à chaque module ; bouton son.
- Plus tard : notifications du téléphone (avarie, écho reçu, arrivée).
- Annonce d'une trouvaille du visiteur à tous les joueurs (phase 4) : photo, nom de la fusée ; couronne et fusée en
  or pour le premier de la saison.

## 7. Les autres commissionnaires
- Chaque autre fusée est un point de sa couleur sur la carte (son nom peint quand les noms ne se chevauchent pas),
  et se voit par le hublot et dans la vue 3D : un point de couleur jusqu'à 3 millions de km, son nom jusqu'à
  300 000 km, le modèle de la C-58 à moins de 30 km.
- En attendant le serveur (phase 4), une **flotte simulée** de bots (`src/donnees/flotte.ts`, `src/moteur/flotte.ts`)
  tient leur place : chacun a ses escales habituelles et sa vitesse, et sa position ne dépend que de l'heure (tous les
  joueurs les voient au même endroit). L'instrument EN LIGNE l'indique (« FLOTTE SIMULÉE »). Quand le serveur
  existera, seul `src/interface/reseau.ts` changera ; `BOTS_ACTIFS` permet de couper les bots.

## 8. Télégrammes
Volet « TÉLÉGRAMMES » : formulaire (destinataires MON SYSTÈME / UN JOUEUR / TOUT LE SYSTÈME, phrases toutes faites,
texte libre, timbres du quota), puis le fil des télégrammes reçus et envoyés, le plus récent en haut ; chaque reçu
porte l'émetteur (fanion à sa couleur), le lieu d'émission et la durée du trajet de la lumière. Règles : regles.md §8.

## 9. Engins humains
Hubble (orbite basse), James Webb (halo autour de L2), Voyager 1 et 2 (aux confins), à leur place
(`src/donnees/engins.ts`, `src/astro/engins.ts`) : losanges blancs sur la carte ; dans la vue 3D, point lumineux jusqu'à
3 millions de km, nom jusqu'à 300 000 km, modèle fidèle à moins de 50 km (`src/interface/vue3d/engins.ts`, avec l'ISS).
Amarrée à l'ISS, la fusée se dessine au port avant (PMA-2), le nez contre la station.

## 10. Page SOCIAL (14/10/2026)
L'onglet SOCIAL remplace CONTRATS ; trois sous-onglets :
- **CLASSEMENT** : tableau des commissionnaires aux trophées obtenus dans la **semaine** (depuis lundi 00:00 UTC), le
  **mois** (depuis le 1er), ou en **général** ; puis la liste des connectés et où ils sont.
- **CONTRATS** : la caisse, les contrats en cours (sans limite de temps), proposés, accomplis.
- **COMMUNICATION** (ouvert par défaut) : l'écran des transmissions, vert phosphore, une ligne par message
  (télégrammes reçus et envoyés, bulletins de la flotte en jaune), et le pupitre d'émission (touches SYSTÈME, UN
  JOUEUR, TOUS ; phrases toutes faites ; ligne de saisie ; ÉMETTRE ; timbres du quota).
Le voyant TÉLÉGR. ouvre COMMUNICATION ; la carte MISSION du cockpit ouvre CONTRATS ; la carte LIAISON, CLASSEMENT.
Les trophées gardent leur date d'obtention (`tropheesQuand`) pour les classements par période.
