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
- **Hublot** d'un bord à l'autre, plus haut (toucher : vue 3D extérieure ; boutons NOMS et FILTRE en haut).
- **1. Où je vais ?** L'écran de navigation est posé au pied du hublot, à demi transparent (destination et son
  dessin à côté du nom, temps restant à la seconde, jour et heure d'arrivée, frise) ; le hublot vise le milieu de
  la partie restée visible (15/10/2026). Panneau PILOTAGE : trois petits cadrans (vitesse, cap, heure d'arrivée), qui ouvrent le volet INSTRUMENTS
  (grands cadrans, loupe, relevés : route, Soleil, radio, croisière) ; interrupteur MOTEUR cerné de rayures jaunes et
  noires ; bande « danger ».
- **2. Qu'est-ce qui ne va pas ?** Panneau BLOCS DU BORD : phrase d'état (« Tout est en ordre. » / « 2 avaries :
  touchez un voyant rouge. »), les 12 voyants en grand (trait PROPULSION), plaque constructeur avec le numéro de série.
- **3. Quel est mon but ?** Carte MISSION (contrat en cours : destination, prime, distance ; ouvre CONTRATS) et carte
  VISITEUR (radar, jours de saison ; ouvre NAVIGATION).
- Réglette **POSTE RADIO** (fréquence, force du signal) : ouvre le volet POSTE RADIO.
- **4. Qui est autour ?** Écran TRANSMISSIONS (vert phosphore, comme COMMUNICATION) : les 3 derniers messages
  (télégrammes reçus et envoyés, bulletins), le nombre de nouveaux et de connectés ; le toucher ouvre COMMUNICATION.
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
Ciel (15/10/2026) : fond presque noir ; la Voie lactée est la vraie photographie du ciel entier (ESO/S. Brunier),
posée à sa vraie place (coordonnées galactiques, `src/astro/galaxie.ts`, `src/interface/vue3d/ciel.ts`) ; les étoiles
nettes sont dessinées par-dessus, plus nombreuses le long de la Voie lactée. Le filtre solaire éteint le tout.
Bouton SANS NOMS / AVEC NOMS (et NOMS sur le hublot) : retire toutes les étiquettes pour une vue naturelle ; le
choix est retenu sur l'appareil.
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
L'ISS est un engin comme les autres (losange sur la carte, approche à 100 m).

## 10. Page SOCIAL (14/10/2026)
L'onglet SOCIAL remplace CONTRATS ; trois sous-onglets :
- **CLASSEMENT** : vos points de la période (rang, écart avec le suivant, détail ligne par ligne du barème), le
  tableau aux points de la **semaine**, du **mois** ou **général**, puis la liste des connectés et où ils sont.
- **CONTRATS** : résumé (en cours, primes à toucher, caisse), puis des fiches identiques — genre de mission,
  destination en gros, prime en gros, distance et durée du voyage, un seul bouton (Y ALLER / ACCEPTER) ; proposés
  du plus proche au plus lointain ; accomplis repliés.
- **COMMUNICATION** (ouvert par défaut) : l'écran des transmissions, vert phosphore, une ligne par message
  (télégrammes reçus et envoyés, bulletins de la flotte en jaune ; le plus récent en bas), et le pupitre d'émission (touches SYSTÈME, UN
  JOUEUR, TOUS ; phrases toutes faites ; ligne de saisie ; ÉMETTRE ; timbres du quota).
Le voyant TÉLÉGR. ouvre COMMUNICATION ; la carte MISSION du cockpit ouvre CONTRATS ; la carte LIAISON, CLASSEMENT.
Les trophées gardent leur date d'obtention (`tropheesQuand`) pour les classements par période.

## 11. Page ATELIER (14/10/2026)
Même présentation que les contrats : bandeau de résumé (caisse, vitesse du moteur, modules installés), puis des
fiches identiques — la pièce à gauche, son nom en gros, le prix en gros à droite, ce qu'elle change (vitesse avant →
après et durée d'un voyage d'exemple ; prime des avaries d'un module), et un seul bouton (AMÉLIORER, INSTALLER) ou ce
qui manque (« il manque 8 CR », « installer TEL d'abord »). Les modules à venir sont listés dans l'ordre ; les
installés en pastilles.

## 12. Ajouts du 14/10/2026 (soir)
- Hublot : en route, il regarde dans l'axe de la fusée (cap) à la hauteur de la cible ; pendant un virage, le paysage
  défile (25°/s au plus). En orbite, il regarde l'astre.
- Écran EN ROUTE VERS : petit dessin schématique de la destination, au milieu de la ligne du nom.
- Modules : on glisse le doigt pour passer au module voisin (ordre du tableau de bord) ; leurs noms sont sur les bords.
- Terre : images NASA (jour, lumières de nuit, océans, nuages), orientation réelle (temps sidéral, axe incliné).
- Chasse : calculateur de l'écho (durée de l'aller-retour → distance en UA, bouton TRACER).
- **PROVISOIRE** : saut d'essai (page NAVIGATION) vers n'importe quelle destination, à retirer sur ordre d'Adrien
  (`src/interface/provisoire/` et la ligne « PROVISOIRE » de Carte.svelte). Avec lui, le bouton du testeur
  RÉINITIALISER LE JEU (15/10/2026) : efface la partie de l’appareil, après confirmation, et revient à la lettre.

## 13. Poste radio (15/10/2026)
Volet POSTE RADIO (depuis la réglette du cockpit ou l'onglet CHASSE de NAVIGATION) : écran des ondes vert phosphore
(souffle ; onde chantante, bips, paroles hachées, morse selon la station ; salve au moment d'émettre), barres de
SIGNAL, bande de lecture (message en clair, ou mangé de signes quand c'est brouillé), cadran gradué 0–12 avec aiguille
rouge, bouton GROS (2,00 par tour) et FIN (0,10 par tour) à tourner au doigt, − / + au centième, gros bouton rouge
ÉMETTRE (compte à rebours de recharge). Le haut-parleur fait entendre le souffle et les signaux (si le son est actif).

## 14. Carte : deux traits (15/10/2026)
Depuis la fusée, un trait blanc pointillé fin vers la destination là où elle est maintenant, et le trait jaune vers
le point de rencontre (là où la fusée la rejoindra) ; légende au-dessus du cartouche.

## 15. Le premier grand voyage (15/10/2026)
À la fin du tutoriel (ISS, Hubble, Tiangong), une page plein écran : nuit étoilée, la Lune qui se lève, « EN ROUTE
VERS LA LUNE — LE PREMIER GRAND VOYAGE », lettre du Directeur des commissions (distance Terre-Lune du jour), tampon
« BON POUR LE DÉPART », prime du voyage, fanfare lente ; bouton CAP SUR LA LUNE (accepte le contrat et met le cap),
lien « plus tard » (l'annonce revient à la prochaine visite).

## 16. Approche et départ (15/10/2026)
- L'ISS se voit de loin comme les autres engins : point lumineux jusqu'à 3 millions de km, nom jusqu'à 300 000 km,
  modèle à moins de 2 000 km (le point s'efface à 3 km) ; le hublot la vise jusqu'au bout (avant, il visait la Terre
  et l'ISS apparaissait d'un coup).
- Départ d'une orbite : la fusée pivote vers sa destination à 12° par seconde pendant sa mise en vitesse (20 s), au
  lieu de s'orienter d'un coup (`TAUX_VIRAGE_DEPART`).

## 17. Pupitre central (15/10/2026)
Sous le hublot, le panneau RADIO · NAVIGATION, avant PILOTAGE :
- **Radio** (à gauche) : petit écran des ondes vivant (barres de signal, texte reçu sur une ligne), bouton d'accord à
  tourner sur place (1,00 par tour), fréquence, ÉMETTRE (compte à rebours de recharge). Toucher l'écran ouvre le poste
  complet (réglage fin, cadran, haut-parleur) ; le pupitre est muet.
- **Navigation** (à droite) : radar centré sur la fusée (flèche selon le cap), destination maintenant (trait blanc
  pointillé) et point de rencontre (trait jaune), distances en échelle logarithmique ; sans destination, le Soleil et
  la Terre. Le toucher ouvre la page NAVIGATION.
La réglette POSTE RADIO est supprimée. Modules : débloqués par le moteur, un toutes les 5 améliorations (regles.md §2).
- (15/10/2026, soir) Radio du pupitre complète : boutons GROS (2,00 par tour) et FIN (0,10 par tour), − et + au
  centième, ÉMETTRE, haut-parleur (allumé par défaut, retenu ; il ne parle que sur la page COCKPIT) ; le message reçu
  défile sur l'écran. Écran de navigation du hublot plus transparent. Carte : le plan garde ses proportions (plus de
  marges variables). Vue 3D : les étoiles passent derrière les astres.
