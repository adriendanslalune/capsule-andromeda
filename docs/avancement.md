# Avancement du jeu

Feuille de route : voir `CLAUDE.md`. Légende : **fait** / **en cours** / **à faire**.

| Étape | État |
|---|---|
| 1. Carte et navigation | **fait**, validé le 17/10/2026 (détail ci-dessous) |
| 2. Cadre du cockpit et socle de jeu | **fait**, validé le 17/10/2026 (détail ci-dessous) |
| 3. Missions, crédits, moteur | **fait**, validé le 18/10/2026 (détail ci-dessous) |
| 4. Pannes et manuel | **en cours** (détail ci-dessous) |
| 5. Nettoyeurs | à faire |
| 6. Combat | à faire |
| 7. Commerçants | à faire |
| 8. Maisons | à faire |
| 9. Première zone à libérer : la Lune | à faire |
| 10. Serveur, comptes, messages, échanges | à faire |
| 11. Tutoriel autour de la Terre (déplacé à la fin : d'abord toutes les mécaniques, décision d'Adrien du 18/10/2026) | à faire |
| 12. Version installable (PWA), puis boutique | à faire |

---

# Étape 4 : pannes et manuel

Décisions d'Adrien du 18/10/2026 : voir `CLAUDE.md` (modules et effets, provenance des pannes, panneau de réparation
et manuel vintage façon Jules Verne, missiles et aliens visibles au radar).

- Fenêtre « Nouveau moteur » (demande d'Adrien, avant l'étape 4) — **fait**.
- 4.1 Modules et pannes — **fait, validé** : 5 modules (`src/donnees/modules.ts`) et leurs effets
  dans le moteur du jeu (`Jeu` : vitesse divisée par 2, navigation bloquée — plus de trajet ni d'enchaînement des
  étapes —, plus de nouvelles missions, actions deux fois plus longues ; la coque servira aux impacts) ; usure : une
  chance sur 10 à l'arrivée de chaque trajet, tirée une seule fois par trajet (testé) ; pannes sauvegardées (format 3).
  Ligne « PANNE » en tête du bandeau (triangle qui palpite) ; liste des modules dans le volet Capsule avec un bouton
  RÉPARER provisoire (en attendant le panneau du 4.2) ; essai « Provoquer une panne au hasard » dans Réglages.
- Maquette du panneau de réparation et du manuel (`maquette-reparation.html`) — **validée** (maquette 2 : panneau Moebius
  foisonnant, manuel façon NASA, réparations imprévisibles ; Adrien : utiliser plusieurs modules pour une même panne,
  sans trop de difficulté — les Mercenaires seront les spécialistes).
- 4.2 Panneau de réparation et réparation de l'Énergie — **fait, en attente de validation** : volet Capsule avec deux
  sous-onglets (ÉTAT, RÉPARATION) ; le panneau dessiné (`src/commun/panneau.ts`, propre à chaque numéro de série) ; le
  module Énergie jouable : écran DIAG, voyants de bus, bornier de 5 à 8 câbles étiquetés, ISOLER ; les gestes passent
  par des boutons COUPER (un par câble, sa couleur et son étiquette) et ISOLER, qui s'ouvrent en touchant le module
  sur le panneau (entouré d'un pointillé rouge) et se referment par ✕ (demandes d'Adrien : viser un câble fin était
  trop difficile, et les commandes ne doivent pas rester ouvertes) ; 2 ou 3 tours ; 6 règles dont une qui lit la pression du module Moteur et une qui dépend
  du numéro de série (et sa note manuscrite pour les capsules AN-7) ; erreur : étincelle et 30 s de blocage
  (`src/moteur/reparation.ts`, `src/donnees/manuel-energie.ts`, testés). Numéro de série tiré à chaque nouvelle partie.
  Les autres modules gardent la réparation provisoire en attendant leur mécanique.
- 4.3 Onglet Manuel — **commencé** : manuel de maintenance façon NASA (papier crème, machine à écrire), sommaire,
  section 1 (Communications) et section 2 (Énergie : 64 codes et 6 règles), lus dans les mêmes données que le jeu
  (`src/commun/manuel.ts`) ; boutons pour passer du panneau au manuel et retour. Sections 3, 4 et 5 à écrire avec
  leurs mécaniques.
- Panneau en 5 blocs de 3 modules (décision d'Adrien du 18/10/2026) — **fait, en attente de validation** : de haut en
  bas, 1 Communications (Télégraphe, Antenne, Chiffreur), 2 Énergie (Bornier, Fusibles, Accumulateurs), 3 Moteur
  (Leviers, Soupape, Injecteurs), 4 Navigation (Constellation, Gyroscope, Calculateur), 5 Coque (Vannes, Brèche, Sas)
  (`src/donnees/blocs.ts`). Une panne de bloc met 1 ou 2 de ses modules raccordés en défaut (voyant rouge) ; le bloc
  remarche quand ils sont tous réparés. Toucher un module en défaut ouvre ses commandes (`src/commun/commandes.ts`).
  Sauvegarde au format 5 (les anciennes parties sont reprises : l'Énergie en cours de réparation devient le Bornier).
  - Bloc Communications — **fait, en attente de validation** (`src/moteur/communications.ts`, testé) :
    Télégraphe (la lampe clignote un mot en morse, le manuel donne sa fréquence ; régler le cadran, ÉMETTRE ; 1 tour),
    Antenne (symbole de station et bande, le manuel donne l'angle ; tourner de ±15° ou ±45°, VERROUILLER ; 2 tours),
    Chiffreur (4 touches à symboles, toutes dans une seule des 6 colonnes du manuel ; les enfoncer dans l'ordre de la
    colonne ; 1 tour). Erreur : étincelle et 30 s de blocage du module.
  - Bloc Énergie : le Bornier marche ; Fusibles et Accumulateurs dessinés, pas encore raccordés — à faire.
  - Blocs Moteur, Navigation, Coque : dessinés, pas encore raccordés (réparation provisoire depuis ÉTAT) — à faire.
    La pression lue par la règle R6 du Bornier est maintenant sur le module 3B Soupape.
- Maquette de l'interface du jeu complet (`maquette-interface.html`, demande d'Adrien du 18/10/2026 : voir la
  cohérence et l'ergonomie une fois tout installé, avant de continuer les pannes) — **en attente de son avis** :
  carte avec radar, alien, missile et décompte, épaves, zone occupée ; bandeau à 4 lignes ; tous les volets remplis
  (Navigation avec « Repéré au radar », Capsule avec ÉTAT / SOUTE / RÉPARATION, Missions avec la campagne et les
  maisons, Manuel, Armement, Marché avec le délai lumière, Messages, Profil avec la toile) ; vues plein écran du
  combat et du tri. Données fictives. Avis d'Adrien : « vraiment top » ; le bandeau ne le gêne pas ; ajout d'un
  filtre des missions par Maison ; le Manuel n'a pas besoin d'un onglet (il deviendra le guide du jeu,
  téléchargeable et vendu en papier). Proposition en test dans la maquette : barre Navigation · Capsule · Missions ·
  Marché · Plus ; l'Armement en sous-onglet de Capsule ; le Manuel dans Plus (et depuis le panneau de réparation).
  **Barre validée par Adrien et mise dans le jeu** (Marché et Armement grisés en attendant leurs étapes).

## Mise en place des écrans de la maquette (décision d'Adrien du 18/10/2026)
D'abord tous les écrans de la maquette dans le jeu, ensuite les mécaniques derrière. Ordre proposé : filtre des
missions par Maison ; Soute et Marché ; Armement et combat ; tri d'épave ; Profil et Messages ; radar, aliens,
missiles et épaves sur la carte.
- Filtre des missions par Maison — **fait, en attente de validation** : chaque mission porte l'étiquette de sa
  Maison (nettoyage : Nettoyeurs ; livraison : Commerçants ; dépannage : Mercenaires — `src/donnees/maisons.ts`,
  testé) ; boutons TOUTES / NETTOYEURS / COMMERÇANTS / MERCENAIRES au-dessus des missions proposées ; le choix est
  retenu sur le téléphone.
- Remarques d'Adrien du 18/10/2026 — **faites, en attente de validation** :
  - 6 missions proposées, 2 par Maison (4 de sa Maison et 1 de chacune des autres quand le joueur en aura choisi
    une, à l'étape 8 ; déjà prévu dans le moteur et sauvegardé, testé). Missions de sa Maison payées +25 %
    (décision d'Adrien du 18/10/2026, testé).
  - Toucher une ligne du bandeau ouvre le volet qui va avec : panne → panneau de réparation (ou ÉTAT pour un bloc à
    réparation provisoire) ; mission → Missions ; trajet ou orbite → Navigation ; crédits et moteur → Capsule.
  - Glisser vers le bas ferme le volet de n'importe où (si son contenu est tout en haut ; le volet suit le doigt).
- Soute et Marché (écrans) — **faits, en attente de validation** :
  - Onglet Marché actif, présentation revue par Adrien le 18/10/2026 : un marché par système (les 8 planètes et
    Pluton), chacun avec l'âge de ses cours (vrai délai de la lumière depuis sa planète jusqu'à la capsule ; « ici · en
    direct » dans son propre système) ; graphique de cours façon trading (6 h, 24 h, 7 j) qui s'arrête au dernier
    cours connu, la fin hachurée « en route » ; lecture au doigt ; liste des 6 marchandises avec leur courbe sur 24 h et
    leur variation. Formule du temps PROVISOIRE (ondulations reproductibles, `src/moteur/marche.ts`, testé) : à régler
    à l'étape 7. ACHETER et VENDRE grisés.
  - Capsule › SOUTE : capacité 20 t (valeur de la maquette), la cargaison d'une livraison chargée, sinon « Soute
    vide » ; bouton vers le Marché. La soute s'affiche aussi au pied du bandeau.
- Armement et combat (prototype) — **faits, en attente de validation** :
  - Capsule › ARMEMENT : 6 crans d'énergie à répartir entre boucliers, armes et moteurs (4 au plus chacun ;
    sauvegardé), l'équipement (canon, 3 intercepteurs, coque 10 ; lance-missiles à venir), SIMULATEUR DE COMBAT.
  - Vue tactique plein écran contre un chasseur alien d'entraînement (`src/moteur/combat.ts`, testé ; valeurs
    PROVISOIRES dans `src/donnees/combat.ts`) : 4 modules ennemis à viser (missiles, canon, bouclier qui arrête un tir
    sur deux, réacteur : détruit, c'est gagné ; désarmé aussi) ; canon ennemi toutes les 4 s (boucliers : 20 % arrêtés
    par cran ; moteurs : 10 % d'esquive par cran) ; un missile toutes les 15 s, 10 s de vol avec décompte, 3 points de
    coque, INTERCEPTER ; TIRER se recharge plus vite avec plus d'armes ; FUIR (plus vite avec plus de moteurs). Pas
    de game over : coque à zéro, retraite. Sans conséquence pour la capsule (simulateur).
  - Avis d'Adrien (18/10/2026) : le combat est très facile ; il imagine un moteur au **tour par tour**. À reprendre
    plus tard (après la mise en place des écrans).
- Tri d'épave (prototype) — **fait, en attente de validation** : depuis Capsule › SOUTE, ENTRAÎNEMENT AU TRI
  D'ÉPAVE ; plein écran : 30 s, un objet à la fois (16 objets dessinés, `src/donnees/tri.ts`), quatre gros bacs
  (métaux, électronique, verre et cristaux, rebut) ; bien trié : 2 cr. × la série (jusqu'à ×5) ; erreur : la série
  retombe à 1, le bac tremble, le téléphone vibre ; bilan par bac à la fin (`src/moteur/tri.ts`, testé ; valeurs
  PROVISOIRES). Sans conséquence pour la capsule (entraînement).
  - Corrigé au passage : les onglets SOUTE et ARMEMENT se redessinaient à chaque image (un bouton pouvait
    disparaître sous le doigt).
  - Avis d'Adrien (18/10/2026) : gain trop important, interface moche (à revoir plus tard) ; il faut une trentaine
    d'objets (fait : 30, dont 14 nouveaux dessins).
  - Branché sur les missions (décision d'Adrien du 18/10/2026) : NETTOYER lance le tri de l'épave (plus d'attente de
    2 minutes) ; les objets triés donnent des matériaux (titane, cuivre, ferraille, circuits anciens, verre ; le rebut
    rien), 0,1 t × la série par objet, rangés dans la soute (20 t ; ce qui ne tient pas reste dans l'épave) ; le tri ne
    rapporte plus de crédits directement (la récompense de la mission, et plus tard la vente au Marché). Soute réelle
    (bandeau, Capsule › SOUTE, colonne « soute » du Marché), sauvegardée ; carnet de bord (missions par Maison,
    crédits gagnés, objets triés) pour le Profil.
- Profil (dans « Plus ») — **fait, en attente de validation** : pseudo modifiable (son nom dans les Messages ;
  3 à 16 lettres ou chiffres ; sauvegardé) ; toile d'araignée de l'affinité avec les trois Maisons (part de chaque
  Maison dans les missions finies, `src/moteur/profil.ts`, testé) ; Maison : neutre (l'appartenance viendra à
  l'étape 8) ; carnet de bord (missions par Maison, crédits gagnés, objets triés) ; zones à libérer (toutes occupées).
- Messages — **faits, en attente de validation** (décision d'Adrien : « tout le fun est là », accessible et fun) :
  - En attendant le serveur (étape 10), 12 bots peuplent le système (`src/donnees/messages.ts`) : pseudo, Maison,
    astre (de Mercure à Neptune). Ils bavardent (environ un message toutes les 3 minutes, les mêmes pour tous, avec de
    vrais cours de leur marché), écrivent dans le canal de leur Maison, et parfois en privé au joueur.
  - Tout voyage à la vitesse de la lumière : chaque message dit d'où il vient et combien la lumière a mis ; les
    siens disent s'ils sont encore en route ; les bots répondent selon ce qu'on écrit (bonjour, marché, aide, aliens,
    merci, question), après l'aller-retour de la lumière ; une réponse partie s'annonce (« ✍ a répondu… arrive
    dans… ») (`src/moteur/messages.ts`, testé).
  - Volet Messages (dans « Plus ») : canaux GÉNÉRAL, MAISON (réservé aux membres), PRIVÉS (conversations, annuaire
    des capitaines ; toucher un nom dans le général ouvre le privé) ; phrases rapides à un toucher ; saisie libre.
  - Sur la carte : le bouton des Messages (pictogramme Moebius dessiné : deux bulles de dialogue et une antenne qui
    émet ; demande d'Adrien du 18/10/2026, à la même place) avec les non-lus (aussi sur l'onglet Plus), et une bulle quand arrive un message qui
    nous est adressé (réponse, privé, mention) ; la toucher ouvre la conversation.
- La carte : épaves, radar, chasseurs aliens, missiles — **faits, en attente de validation** (valeurs PROVISOIRES
  dans `src/donnees/espace.ts` ; `src/moteur/espace.ts`, testé) :
  - Revu après les remarques d'Adrien du 18/10/2026 (`src/donnees/espace.ts`, tiré une fois pour toutes avec une
    graine fixe : le même monde pour tous) :
    - environ 150 épaves, dans tous les systèmes et en plein espace (entre les planètes, ceinture d'astéroïdes, ceinture
      de Kuiper) ; elles ne disparaissent jamais ; on ne les vide qu'en mission : les nettoyages proposés visent les 10
      épaves (ou débris de satellites) les plus proches de la capsule, où qu'elle soit ; sur la carte (et dans
      Navigation), seulement l'épave que vise une mission (en cours, regardée ou choisie) — décision d'Adrien du
      18/10/2026, sinon trop de bazar ;
    - environ 350 chasseurs aliens, partout (3 au bord du système de la Terre ; 12 à Mars ; 35 à 40 autour de chaque
      géante ; plus de 150 en plein espace) ; ils errent au hasard (trois ondulations sans rapport entre elles autour
      de leur orbite : imprévisible) ; radar : 60 % de la sphère d'influence du système, 50 millions de km en plein
      espace ; repéré : alerte, cerclé de cerise, en tête de Navigation ; COMBAT : vaincu, remplacé au bout de 12 h ;
      la retraite met la Coque en panne.
  - Missions attachées aux lieux (décisions d'Adrien du 18/10/2026) — **faites, en attente de validation** :
    20 tableaux (9 planètes × 6 missions, 11 grandes lunes × 4 ; `src/donnees/tableaux.ts`, `src/moteur/tableaux.ts`) ;
    chaque mission se passe dans le système de son lieu (épaves du système ; livraisons entre stations et lunes ;
    dépannages de stations ; chasses aux chasseurs du système) ; 40 stations dans les autres systèmes, 5 par système
    (Relais Hermès, Station Arès, Station Zeus…), toutes en orbite autour de leur planète (elles avancent, plus vite
    quand elles sont basses ; test dans `tests/espace.test.ts`) — plus de cibles, moins de missions répétées. Volet Missions : rangée des lieux (celui de la capsule marqué « ici », choisi
    d'office) + filtre par Maison. Prix fixés à la création selon la zone (validés par Adrien le 18/10/2026, à ajuster plus tard : Terre ×1, Lune ×2,
    Vénus ×4, Mars ×4, Mercure ×8, Jupiter ×12, Saturne ×20, Uranus ×30, Neptune ×45, Pluton ×60).
    Mercenaires : missions de chasse (« Abattre le Chasseur Ω-12 ») ; le chasseur visé apparaît sur la carte ; une fois
    à côté, COMBAT ; gagné, il disparaît et un renfort reprend sa place ailleurs au bout de 2 h. Le radar ne sert plus
    qu'à prévenir : un chasseur qui tire apparaît sur la carte (RIPOSTER), avec son missile.
  - Missiles : un chasseur repéré tire de temps en temps (2 % de chance par heure près de la Terre, jusqu'à 15 % par
    chasseur vers Neptune ; au plus 2 missiles en vol) ; 90 s de vol, décompte sur la carte (le missile avance vers la capsule) et en tête du bandeau (qui
    palpite) ; toucher la ligne l'intercepte (3 intercepteurs, un nouveau toutes les 30 min). Impact : le Moteur tombe
    en panne, le trajet en cours est ralenti de moitié jusqu'à réparation (puis repart à pleine vitesse) ; Coque en
    panne : un bloc de plus. Pas de tirs comptés pendant que l'application est fermée.
  - Ce qui fera voyager les joueurs : la campagne (décision d'Adrien du 18/10/2026).
  - Monolithes (idée d'Adrien du 18/10/2026) — **mécanique faite, en attente de validation** : 1000 monolithes
    (`src/donnees/monolithes.ts`), fixes par rapport au Soleil, répartis par bandes autour des orbites des planètes,
    dans les ceintures et entre elles (répartition PROVISOIRE). Volet Navigation : la radio, bouton PING (un par heure,
    jamais tant que l'écho n'est pas revenu) ; le plus proche pas encore trouvé répond, sans limite de portée ; l'écho
    revient au bout de l'aller-retour de la lumière (bandeau : « PING ENVOYÉ · ÉCHO DANS 1:09 »). Chaque écho trace sur
    la carte un cercle pointillé violet (numéro du monolithe) autour de la place d'où il est parti, qui reste fixe : les
    planètes s'en éloignent. Deux cercles d'un même monolithe : deux places « ? » ; un écho pris d'ailleurs (pas sur la
    même ligne ; écart d'au moins 0,3 % de la distance) tranche : le monolithe apparaît sur la carte et dans Navigation
    (« Monolithes localisés »). Y aller, RAMASSER : il passe dans la cale (Capsule › Soute : « 1 / 1000 ») et ses cercles
    s'effacent. Réglage « Cercles des PING ». Moteur : `src/moteur/monolithes.ts` (tests `tests/monolithes.test.ts`).
    Depuis la Terre, le plus proche est vers 10 millions de km (écho en 1 min 10 s) ; un tour par la Lune suffit à
    trancher. À quoi ils servent : piste d'Adrien, des paliers qui donnent un statut et des messages par jour en plus
    (à préciser avec la limite de 3 messages par jour).
- 4.4 Aliens sur la carte (plus nombreux loin du Soleil), repérés au radar à une certaine distance, avec une alerte — à faire.
- 4.5 Missiles : décompte (bandeau et carte), impact (panne du moteur : vitesse divisée par 2 jusqu'à réparation) — à faire.

---

# Étape 3 : missions, crédits, moteur (sans le tutoriel) — terminée

Décision d'Adrien du 17/10/2026 : d'abord les mécaniques (missions, crédits, moteur), le tutoriel (mise en scène) à la
fin. Règles validées : on accepte une mission, on va sur place, on appuie sur un bouton, l'action dure 2 minutes ; une
seule mission à la fois, 4 proposées, une nouvelle remplace chaque mission finie ; récompenses de 50 à 200 crédits
(plus loin paie plus, une livraison 40 % de plus) ; moteurs niveau 2 = 60 km/s pour 500, niveau 3 = 120 km/s pour
1 500, niveau 4 = 250 km/s pour 4 000 ; achat n'importe où ; pas de limite de portée pour l'instant.

- 3.1 Les missions dans le moteur — **fait** (rien de visible à l'écran) : trois genres — nettoyer (épaves : Envisat,
  Vanguard 1, débris autour des engins en orbite basse), livrer (charger à l'ISS ou à Tiangong, livrer à un satellite),
  dépanner (un satellite). Tirage au hasard reproductible, récompense selon la distance, action de 2 minutes,
  interrompue si la capsule repart ; abandon possible sans pénalité. Dans le code, « contrats »
  (`src/donnees/contrats.ts`, `src/moteur/contrats.ts`, `src/moteur/jeu.ts`, testés).
- 3.2 Volet Missions et ligne du bandeau — **fait, en attente de validation** : onglet Missions actif ; mission en
  cours (étapes, Y ALLER qui prépare le trajet, bouton de l'action sur place, abandonner) et 4 missions proposées
  (ACCEPTER) ; ligne « MISSION : GENRE · LIEU » dans le bandeau (quoi faire, ou temps restant de l'action) ; sur place,
  la fiche du bas propose l'action (NETTOYER, CHARGER, LIVRER, RÉPARER) ; messages brefs (mission terminée,
  cargaison chargée, action interrompue) (`src/commun/volet-missions.ts`, `src/commun/textes-missions.ts`).
  Demandes d'Adrien après essai : temps de trajet de chaque mission (depuis la capsule, les deux trajets d'une
  livraison), liste triée du plus court au plus long ; VOIR montre les trajets sur la carte avant d'accepter (aperçu,
  avec ACCEPTER dans la fiche ; toucher la carte le ferme); mission en plusieurs étapes : les étapes s'enchaînent (l'action
  finie, la capsule part d'elle-même vers l'étape suivante, même application fermée) ; étapes faites rayées et grisées
  dans le volet. Symbole animé du genre de mission devant sa ligne du bandeau (enveloppe qui flotte, balai qui balaie,
  clé qui tourne ; plus vif pendant l'action).
- Ergonomie (demandes d'Adrien du 17/10/2026) — **fait, en attente de validation** : à l'ouverture, la carte est cadrée
  sur la capsule (le système de l'astre où elle est) ; bouton « ◎ Capsule » en haut à droite pour y revenir ; ce qu'on
  choisit (astre, engin, capsule) reste au centre de l'écran, même pendant le zoom ; on peut quand même faire glisser
  la carte (la caméra le lâche, le choix reste ; le toucher de nouveau recentre) ; toucher un endroit vide retire le
  choix. Le bouton « Capsule » choisit la capsule Double toucher : zoom avant (×3), centré sur ce qui est choisi, sinon vers le
  point touché. Les déplacements de la caméra sont fluides (vol : on glisse
  puis on zoome, ou on recule puis on glisse ; de loin, la caméra prend du recul en chemin).
- 3.3 Acheter un meilleur moteur — **fait, validé** : volet Capsule (moteur actuel, moteur suivant
  avec sa vitesse et son prix, ACHETER après confirmation, ce qu'il manque sinon ; modules annoncés pour l'étape 4).
  Barème (lissé par Adrien après essai, au départ 500 / 1 500 / 4 000) : niveau 2 = 60 km/s pour 200, niveau 3 = 120 km/s pour 600, niveau 4 = 250 km/s pour 1 500
  (`src/donnees/capsule.ts`, `Jeu.acheterMoteur`, testés). Les trajets prévus et les temps des missions se
  recalculent à la nouvelle vitesse ; un trajet en cours garde sa vitesse.
- 3.4 Sauvegarde des missions — **fait avec le 3.2** (format de sauvegarde 2 ; les parties de format 1 sont encore
  lues).

---

# Étape 2 : cadre du cockpit et socle de jeu — terminée

Plan validé par Adrien le 17/10/2026 (interface dans les tons Moebius de la carte ; réglages rangés dans
« Plus › Réglages » ; moteur niveau 1 à 30 km/s, sans limite de portée pour l'instant ; heures à l'heure du lieu du
joueur).

- 2.1 Barre d'onglets et volets — **fait, validé** : barre de 5 onglets en bas (Missions et Manuel
  grisés), volets qui montent du bas (Navigation = l'ancien cadran ; Capsule à venir ; Plus : Armement, Marché,
  Messages, Profil grisés, et Réglages). Fermeture : onglet, Fermer, glisser vers le bas, toucher la carte
  (`src/commun/cockpit.ts`). Heures affichées à l'heure locale du téléphone.
- 2.2 Bandeau d'alertes en haut — **fait, validé** : toujours visible ; « EN ROUTE VERS … » avec
  l'heure d'arrivée (aujourd'hui, demain, ou la date) et le temps restant, sinon l'état calme « EN ORBITE AUTOUR DE … »
  (altitude, durée d'un tour). Le moteur dit quoi afficher (`src/moteur/bandeau.ts`, testé), prévu pour plusieurs
  lignes (missiles, pannes, ralentissements à l'étape 4). La fiche du bas ne parle plus que de la destination choisie.
- 2.3 État de la capsule — **fait, validé** : état du jeu dans le moteur (`src/moteur/jeu.ts`,
  testé) — crédits (0 au départ), niveau du moteur (1 : 30 km/s, `src/donnees/capsule.ts`), mission de la capsule.
  Les trajets se font à la vitesse du moteur ; l'ancien curseur devient un essai (« Forcer la vitesse » dans Réglages,
  désactivé par défaut). Demande d'Adrien : crédits et moteur toujours visibles, au pied du bandeau d'alertes ; le volet
  Capsule est vide, son contenu sera défini plus tard.
- 2.4 Sauvegarde locale — **fait, validé** : la partie (crédits, moteur, orbite, trajet en cours)
  est enregistrée dans la mémoire du navigateur au départ d'un trajet et quand on quitte l'application ; elle est
  reprise à l'ouverture. Le trajet lui-même est enregistré : il continue application fermée (la capsule est arrivée si
  l'heure est passée). « Recommencer à zéro… » dans Réglages, avec confirmation (`src/moteur/sauvegarde.ts`, testé ;
  une sauvegarde illisible ou d'un ancien format est ignorée). Limite : avec le temps accéléré (essais), un trajet
  enregistré « dans le futur » n'a pas encore commencé quand on rouvre à l'heure réelle.

---

# Étape 1 (ancien « prototype 1 ») : carte et navigation

**Terminée et validée par Adrien le 17/10/2026** (43 tests verts, vérification des types et construction OK).

## 1. Carte, astres (planètes, lunes, satellites artificiels, sondes), zoom et déplacement — fait

- Fait : carte 2D vue du dessus, vraies distances entre les planètes, zoom libre et déplacement au doigt
  (`src/carte/carte.ts`, `src/commun/gestes.ts`).
- Fait : Soleil, planètes (VSOP87), Pluton, 453 lunes, sondes lointaines (JPL), silhouettes d'engins
  (`src/moteur/corps.ts`, `src/carte/engins.ts`).
- Satellites artificiels (choix d'Adrien du 17/10/2026 : « le mélange ») :
  - fait et validé : la **poussière**, tous les satellites actifs (≈ 15 900, CelesTrak) en fins points décoratifs
    autour de la Terre (`src/moteur/poussiere.ts`, `outils/poussiere-celestrak.mjs`). Pas de mise à jour régulière des
    orbites (décision d'Adrien : seules les orbites des planètes comptent) ;
  - fait et validé : la **sélection** d'engins touchables (liste validée par Adrien) — ISS, Tiangong,
    Hubble, Chandra, Fermi, Swift, TESS, Terra, Landsat 9, Sentinel-2B, GOES-19, Meteosat-12, Himawari-9, GPS III-1,
    Galileo 101, Vanguard 1, Envisat (`src/donnees/engins.ts`) ; silhouettes communes « télescope » et « satellite ».

## 2. Repères (crochet, étiquette, flèche hors champ) et capsule — fait

- Crochet, étiquette (nom, distance) et flèche hors champ (`src/commun/reperes.ts`), capsule sur la carte.

## 3. Choix de destination et cadran de navigation — fait

- Toucher un astre affiche sa fiche, Y ALLER en fait la destination ; cadran avec la liste des astres
  (`src/carte/cadran.ts`).

## 4. Les deux traits et le trajet — fait (refait le 17/10/2026), validé

- Décision d'Adrien du 17/10/2026 : les vraies trajectoires orbitales (solveur de Lambert) étaient illisibles
  (courbes, accélérations, détours) ; remplacées par la **ligne droite** vers le point de rendez-vous, à vitesse
  constante (la puissance des moteurs, en km/s), avec une courte accélération et un freinage (10 % du trajet chacun).
- Pointillé vers la position actuelle de la cible ; trait plein jusqu'au point de rendez-vous. S'il passe trop près
  d'un astre (celui de départ, celui d'arrivée, le Soleil), il le contourne par un arc (`src/moteur/mission.ts`).
- Sur la carte, le trajet est dessiné en traits droits et la capsule y avance à vitesse régulière
  (`projeterTrajet` dans `src/carte/loupe.ts`) ; la loupe ne le tord plus. Le solveur de Lambert est supprimé
  (il reste dans l'historique Git).

## 5. Le trajet en temps réel, accélération du temps pour les tests — fait

- Départ, voyage en temps réel, arrivée en orbite ; accélération du temps dans le panneau « Repères ».
- Durées à 120 km/s (réglage du prototype) : ISS → Lune 1 h, → Mars ≈ 25 j, → Jupiter ≈ 83 j, → Neptune ≈ 1,3 an.
  À 30 km/s (départ prévu du vrai jeu) : Lune 5 h, Mars ≈ 97 j, Jupiter ≈ 1,1 an, Neptune ≈ 5 ans.
- Limite connue : orbite d'attente basse (1,3 rayon à l'arrivée).

## 6. Mode nuit — fait, validé

- Choix d'Adrien du 17/10/2026 : « Moebius de nuit », activé seulement par le bouton « Mode nuit » dans « Repères »
  (jour par défaut, réglage mémorisé). Fond bleu nuit, encre crème, astres pastel un peu assombris (sauf le Soleil),
  ombres portées sombres (`body.nuit` dans `src/style.css`, `THEMES` dans `src/main.ts`, `nuit` dans
  `src/carte/carte.ts`).
