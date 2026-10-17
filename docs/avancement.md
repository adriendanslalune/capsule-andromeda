# Avancement — prototype 1 : carte et navigation

État relevé dans le code le 17/10/2026 (40 tests verts, vérification des types et construction OK).
Légende : **fait** / **en cours** / **à faire**.

## 1. Carte, astres (planètes, lunes, satellites artificiels, sondes), zoom et déplacement — en cours

- Fait : carte 2D vue du dessus, vraies distances entre les planètes, zoom libre et déplacement au doigt
  (`src/carte/carte.ts`, `src/commun/gestes.ts`).
- Fait : Soleil, planètes (VSOP87), Pluton, 453 lunes, sondes lointaines (JPL), silhouettes d'engins
  (`src/moteur/corps.ts`, `src/carte/engins.ts`).
- Satellites artificiels (choix d'Adrien du 17/10/2026 : « le mélange ») :
  - fait : la **poussière**, tous les satellites actifs (≈ 15 900, CelesTrak) en fins points décoratifs autour de la
    Terre (`src/moteur/poussiere.ts`, `outils/poussiere-celestrak.mjs`). Pas de mise à jour régulière des orbites
    (décision d'Adrien : seules les orbites des planètes comptent) — en attente de validation ;
  - à faire : une **sélection** d'engins connus, touchables, avec silhouette et fiche (seuls l'ISS, Hubble et Tiangong
    existent).

## 2. Repères (crochet, étiquette, flèche hors champ) et capsule — fait

- Crochet, étiquette (nom, distance) et flèche hors champ (`src/commun/reperes.ts`), capsule sur la carte.

## 3. Choix de destination et cadran de navigation — fait

- Toucher un astre affiche sa fiche, Y ALLER en fait la destination ; cadran avec la liste des astres
  (`src/carte/cadran.ts`).

## 4. Les deux traits et la trajectoire orbitale (solveur de Lambert) — fait

- Pointillé vers la position actuelle, vraie trajectoire jusqu'au point de rencontre (`src/moteur/lambert.ts`,
  `src/moteur/mission.ts`), durée selon la puissance des moteurs, règle « rien ne traverse un astre ». Testé.

## 5. Le trajet en temps réel, accélération du temps pour les tests — fait

- Départ, voyage en temps réel, arrivée en orbite ; accélération du temps dans le panneau « Repères ».
- Limites connues : manœuvres instantanées (pas de poussée progressive), orbite d'attente trop basse.

## 6. Mode nuit — à faire

- Rien dans le code.
