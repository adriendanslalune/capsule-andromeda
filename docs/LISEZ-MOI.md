# Capsule Andromeda — journal du prototype 1 : carte et navigation

Depuis le 17/10/2026, Capsule Andromeda est le jeu : l'ancien jeu (« Manuel de vol ») a été supprimé du dépôt, à la
demande d'Adrien (il reste dans l'historique Git). Ce document garde les décisions prises pendant le prototype 1.

En ligne : https://adriendanslalune.github.io/manuel-de-vol/

**Bilan du prototype : [BILAN.md](BILAN.md)** (ce qu'on garde, ce qu'on jette, ce qui manque).

- `npm run dev` : lance le jeu en local (accessible depuis le téléphone sur le même réseau).
- `npm test` : tests (positions comparées à JPL Horizons, caméra).
- `node outils/vsop87.mjs` : régénère les séries VSOP87B tronquées.

## Organisation

- `src/moteur/` — logique pure, sans affichage : temps, planètes (VSOP87B), Pluton (Meeus), catalogue des astres.
- `src/astro/` — la Lune (Meeus), les satellites naturels, l'ISS et les orbites TLE (SGP4), repris de l'ancien jeu.
- `src/donnees/` — données : séries VSOP87B, satellites naturels et trajectoires des sondes (JPL Horizons,
  `outils/satellites-jpl.mjs`, `outils/engins-jpl.mjs`), orbites TLE, planètes.
- Plus de vue 3D (décision d'Adrien du 17/10/2026 : « ce n'est que de la contemplation, focalisons-nous sur la 2D ») ;
  le code de la vue extérieure reste dans l'historique Git.
- Style retenu par Adrien : « Moebius », fond blanc cassé — couleurs pastel (`src/carte/couleurs.ts`), ombre en aplat
  violet, hachures fines le long du terminateur, encre brun-violet.
- `src/carte/` — la carte schématique (2D, distances écrasées, deux niveaux) et le cadran de navigation.
- `src/commun/` — gestes (glisser, pincer, double toucher) et repères de la destination.

## Décisions d'Adrien

- Direction artistique : style « Moebius » ; fond blanc cassé sur la carte (lisible), fond noir dans la vue extérieure
  (plus beau pour contempler).
- Carte de travail : carte schématique 2D (distances logarithmiques, deux niveaux) ; vue 3D en option (VUE EXTÉRIEURE).
- Puissance des moteurs (budget de delta-v) : 120 km/s dans le prototype, réglable de 5 à 5 000 km/s dans
  « Repères ». **Vrai jeu : départ à 30 km/s, puis améliorations sans limite.**

## À voir plus tard (demandes d'Adrien)

- Manœuvres : accélération progressive jusqu'à la vitesse de croisière (une poussée qui dure change la trajectoire :
  à intégrer au moteur, pas seulement au dessin). Le pivot de la capsule vers son nouveau cap est déjà fait.
- Distance de l'orbite d'attente : la capsule tourne trop près de la planète (400 km pour la Terre, 1,3 rayon à
  l'arrivée).

## Étapes

1. Carte, zoom, direction artistique (Moebius en couleurs sur fond blanc cassé) ; vue extérieure en 3D derrière la
   capsule — validée.
2. Carte schématique 2D (distances logarithmiques, niveaux : système solaire / système d'une planète), repères de la
   destination (crochet, étiquette, flèche hors champ), capsule, choix de la destination (toucher ou cadran) ;
   la vue 3D devient la VUE EXTÉRIEURE, optionnelle — validée.
3. Navigation : pointillé vers la destination, vrai trajet (Lambert, `src/moteur/lambert.ts`) jusqu'au point de
   rendez-vous, durée tirée de la puissance des moteurs (budget de delta-v, réglable), départ, voyage, arrivée en
   orbite ; accélération du temps pour les essais — terminée.
