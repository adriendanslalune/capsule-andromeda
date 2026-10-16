# Capsule Andromeda — prototype 1 : carte et navigation

Prototype jetable, à part de l'ancien jeu (rien n'est modifié dans `src/`). Seuls les éphémérides et la navigation
(`src/moteur/`) ont vocation à être réutilisés.

En ligne : https://adriendanslalune.github.io/manuel-de-vol/andromeda/

- `npm run andromeda` : lance le prototype en local (accessible depuis le téléphone sur le même réseau).
- `npm run test:andromeda` : tests (positions comparées à JPL Horizons, caméra).
- `node prototypes/andromeda/outils/vsop87.mjs` : régénère les séries VSOP87B tronquées.

## Organisation

- `src/moteur/` — logique pure, sans affichage : temps, planètes (VSOP87B), Pluton (Meeus), catalogue des astres.
  Réutilise en lecture seule les lunes, la Lune, les orbites TLE et les trajectoires de sondes du jeu.
- `src/donnees/` — séries VSOP87B générées.
- `src/affichage3d/` — la vue 3D (three.js) : caméra derrière la capsule, astres jour / nuit avec contours, modèles
  (capsule type Apollo, engins, cailloux), noms et flèches par-dessus. Ne calcule aucune position : les demande au moteur.
- Style retenu par Adrien : « Moebius » sur fond blanc cassé — couleurs pastel (palette dans
  `src/affichage3d/couleurs.ts`), ombre en aplat violet, hachures fines le long du terminateur, encre brun-violet.
  Les essais précédents (à plat, BD tramée, réaliste) restent dans le code mais ne sont plus proposés.
- `src/carte/` — la carte schématique (2D, distances écrasées, deux niveaux) et le cadran de navigation.
- `src/commun/` — gestes (glisser, pincer, double toucher) et triche d'affichage des satellites artificiels.

## Étapes

1. Carte, zoom, direction artistique (Moebius en couleurs sur fond blanc cassé) ; vue extérieure en 3D derrière la
   capsule — validée.
2. Carte schématique 2D (distances logarithmiques, niveaux : système solaire / système d'une planète), repères de la
   destination (crochet, étiquette, flèche hors champ), capsule, choix de la destination (toucher ou cadran) ;
   la vue 3D devient la VUE EXTÉRIEURE, optionnelle ← en cours
3. Navigation (deux traits, solveur de Lambert) et trajet, accélération du temps pour les essais.
