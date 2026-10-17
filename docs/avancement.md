# Avancement du jeu

Feuille de route : voir `CLAUDE.md`. Légende : **fait** / **en cours** / **à faire**.

| Étape | État |
|---|---|
| 1. Carte et navigation | **fait**, validé le 17/10/2026 (détail ci-dessous) |
| 2. Cadre du cockpit et socle de jeu | **fait**, validé le 17/10/2026 (détail ci-dessous) |
| 3. Tutoriel autour de la Terre | à faire |
| 4. Pannes et manuel | à faire |
| 5. Nettoyeurs | à faire |
| 6. Combat | à faire |
| 7. Commerçants | à faire |
| 8. Maisons | à faire |
| 9. Première zone à libérer : la Lune | à faire |
| 10. Serveur, comptes, messages, échanges | à faire |
| 11. Version installable (PWA), puis boutique | à faire |

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
