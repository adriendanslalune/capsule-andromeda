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
- `src/affichage/` — caméra, gestes, dessin Canvas 2D. Ne calcule aucune position : les demande au moteur.

## Étapes

1. Carte seule, zoom (jusqu'à 1 m par pixel) et déplacement, repères de la vue d'ensemble (orbites, Soleil, noms,
   flèches), papier bouffant, silhouettes des engins et cailloux ← en cours
2. Repères (crochet, étiquette, flèche) et capsule
3. Navigation (deux traits, solveur de Lambert) et trajet ; mode nuit
