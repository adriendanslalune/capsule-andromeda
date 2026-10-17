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

## 18. Cockpit allégé (15/10/2026, soir)
- En-tête : sous la ligne C-58 / crédits / son / manuel, une **barre de bord** (vitesse, cap, heure d'arrivée en
  petits cadrans — le toucher ouvre les instruments — et l'interrupteur MOTEUR avec son régime). Le panneau PILOTAGE
  du cockpit est supprimé.
- La carte VISITEUR est supprimée : le radar de navigation du pupitre, plus grand (136 px), a un balayage qui tourne
  et montre l'écho du visiteur quand DET le repère.
- Le volet POSTE RADIO est supprimé : la radio du pupitre est la seule radio du bord.

## 19. Écran de caméra et ciel (15/10/2026, nuit)
- Le hublot devient l'**écran de la caméra extérieure** : l'image d'un bord à l'autre (cadre d'encre, coins
  arrondis, légères lignes de balayage), les informations incrustées dessus sans bandeau (en haut la destination et
  son dessin, à droite le compte à rebours et la distance restante, dessous l'arrivée, la frise au bas de l'image) ;
  NOMS et FILTRE dans les coins du bas, « ● CAM. AVANT » au milieu.
- En-tête sur une seule ligne : C-58, barre de bord (vitesse, cap, arrivée empilés ; interrupteur MOTEUR vertical),
  crédits, manuel. L'interrupteur SON est retiré (les sons et alarmes ne se coupent plus depuis l'en-tête).
- Vue 3D et caméra : les astres et engins lointains sont des points ronds et doux (plus de carrés) ; leur nom est
  écrit à l'écart, relié par un trait fin.
- Voie lactée sans image : une lueur calculée en coordonnées galactiques (bande, bulbe du Sagittaire, Cygne, grande
  faille, nuages de bruit doux ; `vue3d/ciel.ts`) et 36 000 étoiles faibles réparties de même (`scene.ts`).

## 20. Caméras, intercalaires, testeur (16/10/2026)
- L'écran du cockpit bascule toutes les 10 s entre la caméra avant et la caméra arrière (regard opposé), avec un bref
  grésillement ; la légende « ● CAM. AVANT / ARRIÈRE » le dit.
- En-tête : l'heure d'arrivée (déjà sur l'écran de la caméra) laisse la place à deux mini cadrans, vitesse et cap.
- Onglets en intercalaires de vieux classeur : cartons en trapèze de couleur (SOCIAL rose, COCKPIT moutarde,
  ATELIER bleu, TROPHÉES vert), hauteurs décalées, étiquette de papier avec l'icône et le nom ; celui de la page
  affichée passe devant et se soude à la page.
- L'onglet NAVIGATION est supprimé : la carte s'ouvre depuis le radar du pupitre (bouton « ‹ COCKPIT » pour revenir ;
  l'intercalaire COCKPIT reste en avant pendant ce temps).
- Testeur (provisoire) : TOUT DÉBLOQUER installe les 9 modules, le télescope et le détecteur.
- Vue 3D : un nom d'astre qui en recouvrirait un autre ne s'écrit pas (sauf la destination).

## 21. Cinq intercalaires (16/10/2026, décision d'Adrien)
MISSIONS · LIAISONS · **COCKPIT** · COMMERCE · ATELIER (cartons rose, lavande, moutarde, vert, bleu ; étiquette avec
l'icône au-dessus du nom).
- **MISSIONS** : CONTRATS (les commissions de la semaine), SERVICES (canal de détresse, « bientôt »), DÉCOUVERTES (le
  visiteur de la saison avec son radar et un accès à la carte de chasse ; monolithes 0/10, artefacts, épaves
  « bientôt »), HISTOIRES (les quatre fils, « bientôt »). La carte MISSION du cockpit ouvre CONTRATS.
- **LIAISONS** (ex-SOCIAL) : COMMUNICATION (par défaut), CLASSEMENT, TROPHÉES. Les transmissions du cockpit l'ouvrent.
- **COMMERCE** : la cale (vide) et le marché, « bientôt ».
Voir docs/conception-destin.md.

## 22. Carte en style Moebius, vraie échelle (17/10/2026, décisions d'Adrien)
Après le prototype Andromeda (`prototypes/andromeda/BILAN.md`). Étapes (a) et (b) faites ; (c) point libre, chasse et départs
rebranchés, à venir.
- **Vraies distances**, échelle linéaire (la chasse en a besoin : cercles et droites justes). Seuls les astres sont
  grossis : rayon minimal à l'écran (Soleil 11 px, géantes 8, autres planètes 6, lunes 3,5), vraie taille de près.
- **Style Moebius** : fond blanc cassé, encre brun-violet, astres en pastel, face de nuit en aplat violet, hachures le
  long du terminateur (tournées vers le Soleil), orbites fines de la couleur de l'astre, trajet en rouge cerné d'encre.
- Une lune ou un engin trop près de sa planète pour s'en détacher à l'écran n'est pas dessiné ; il apparaît en zoomant
  (et reste dans la liste).
- **Systèmes** : toucher deux fois une planète (ou « VOIR SON SYSTÈME › ») cadre son système (jusqu'à la plus lointaine
  de ses lunes de plus de 200 km), la planète reste au centre en avançant ; « ‹ SYSTÈME SOLAIRE » revient.
- Noms sans chevauchement, par ordre d'importance (Soleil, planètes, lunes, engins), à l'une de quatre places autour
  de l'astre.
- **Toucher = fiche** (17/10/2026, demande d'Adrien) : toucher un astre, un engin ou un point affiche sa fiche (nom,
  distance, VOIR SON SYSTÈME, Y ALLER) sans rien changer à la route ; Y ALLER propose les départs (maintenant, fenêtre
  de tir) ; toucher encore une planète sélectionnée ouvre son système.
- **Repères** (étape b) sur l'astre visé (destination proposée, sinon sélection, sinon destination en cours) : crochet
  discret (quatre coins rouges liserés d'encre), étiquette nom + distance posée à l'écart (six places essayées, loin
  du point de rencontre, de la fusée, du cartouche et du bouton CADRAN), reliée par un trait ; hors champ, une flèche au
  bord de la carte avec le nom et la distance. Distances en km jusqu'à 0,1 UA, en UA au-delà.
- **Cadran** (bouton CADRAN en bas à gauche de la carte, remplace la liste déroulante) : feuille avec le Soleil, les
  planètes (dépliables : leurs lunes, les plus grosses d'abord) et les engins, chacun avec sa distance à la fusée ;
  toucher une ligne affiche la fiche (et cadre le système pour une lune ou l'ISS).
- Cadran de cap autour de la fusée réduit (26 px de rayon au lieu de 40).
- **Chemin prévu** (17/10/2026) : le trait vers le point de rencontre suit le chemin calculé par le moteur (une fois par
  seconde), qui contourne les astres ; le pointillé « destination, maintenant » est masqué quand il couperait un astre.
  Choisir dans le cadran un engin qui tourne autour d'une planète (ISS, Hubble…) cadre sa planète, assez près pour le
  voir.
