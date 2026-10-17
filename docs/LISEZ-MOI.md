# Capsule Andromeda — journal du prototype 1 : carte et navigation

Depuis le 17/10/2026, Capsule Andromeda est le jeu : l'ancien jeu (« Manuel de vol ») a été supprimé du dépôt, à la
demande d'Adrien (il reste dans l'historique Git). Ce document garde les décisions prises pendant le prototype 1.

En ligne : https://adriendanslalune.github.io/capsule-andromeda/

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
- `src/carte/` — la carte (2D, vraies distances, loupe autour des astres : `loupe.ts`), silhouettes d'engins, cadran.
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

## Décisions d'Adrien du 17/10/2026 (après le prototype 1)

- **Capsule Andromeda devient le jeu** ; l'ancien jeu est supprimé. Adresse : https://adriendanslalune.github.io/capsule-andromeda/
- **Plus de 3D** : on se concentre sur la carte 2D.
- **Carte « plus simple »** (remplace l'échelle logarithmique et les deux niveaux) : à plat, vue du dessus ; vraies
  distances entre les planètes ; astres plus gros que nature mais proportionnés (50 fois leur taille, le Soleil 20 fois),
  avec une taille minimale en dézoomant ; zoom libre, directement vers un système (plus de double toucher) ; autour de
  chaque astre, une loupe écarte satellites et engins dans le bon ordre (ISS, Hubble, Lune, James Webb), sans saut au
  bord de la sphère d'influence ; orbites des satellites couchées dans le plan, à leur vraie vitesse ; engins dessinés
  par leur silhouette.
- **Toucher un astre affiche sa fiche** (nom, distance) ; seul **Y ALLER** calcule le trajet et propose le DÉPART.
- **Règle d'or : rien ne traverse un astre.** Le moteur refuse tout trajet qui passerait à moins de 2 % du rayon (au
  moins 100 km) de la surface du Soleil, de la planète de départ, de ses grandes lunes ou de l'astre autour duquel
  tourne la destination. Dans le système d'une planète (de l'ISS à Hubble, vers la Lune), le trajet se fait sous la
  gravité de la planète : il fait le tour comme une vraie orbite (vers Hubble : environ 25 minutes au lieu de 9 jours).
- **Astres illustrés** (planche `planche.html`, validée par Adrien) : d'après une gravure de soleil, sans visages, chaque
  astre avec ses détails réels (Soleil et ses flammes, mers de la Lune, continents de la Terre, Valles Marineris,
  Grande Tache rouge, anneaux et division de Cassini…), traits fins, aplats pastel, face de nuit en croissant violet
  (`src/carte/illustrations.ts`). Sur la carte : l'illustration dès 11 px de rayon à l'écran, le simple disque en dessous.
