# Bilan du prototype 1 — Capsule Andromeda : carte et navigation

17 octobre 2026. Prototype jetable, publié sur https://adriendanslalune.github.io/manuel-de-vol/andromeda/
(dossier `prototypes/andromeda/`, l'ancien jeu n'a pas été modifié). Environ 3 900 lignes de TypeScript,
40 tests automatiques, tous verts.

## Ce que le prototype devait prouver

| Critère du brief | Résultat |
|---|---|
| Trouver Mars et la choisir en moins de 10 s, sans aide | ✅ validé par Adrien sur téléphone |
| Zoom fluide, sans saccade ni tremblement | ✅ validé (carte 2D et vue 3D) |
| La différence entre les deux traits se comprend sans explication | ✅ validé |
| La capsule arrive bien sur la cible | ✅ testé automatiquement (Mars, Lune, ISS) et vu à l'écran |
| Positions des planètes conformes au JPL | ✅ testé : < 500 km de Mercure à Mars, < 3 000 km Jupiter, < 5 000 km Saturne |

La question de départ (« la vraie échelle est-elle lisible sur un téléphone ? ») a reçu une réponse claire :
**non, pas comme outil de travail.** À vraie échelle, le système solaire est une poussière de points. D'où les
décisions ci-dessous.

## Décisions d'Adrien

1. **Deux vues.** La CARTE (2D, schématique, distances écrasées par un logarithme, vraies directions), que le
   joueur utilise presque tout le temps ; la VUE EXTÉRIEURE (3D, vraie échelle, derrière la capsule), optionnelle,
   pour contempler.
2. **Navigation par niveaux** sur la carte : le système solaire, puis le système d'une planète.
3. **Style « Moebius »** : couleurs pastel, ombres en aplat violet, hachures fines le long du terminateur, encre
   brun-violet, contours. Fond **blanc cassé sur la carte** (lisible), **noir dans la vue extérieure** (plus beau).
4. **Repères de destination** : crochet discret, étiquette (nom, distance) posée à l'écart, flèche hors champ.
5. **Puissance des moteurs** : 120 km/s dans le prototype (réglable). **Vrai jeu : 30 km/s au départ, puis
   améliorations sans limite.**
6. Vue 3D : regard libre autour de la capsule, bouton RECENTRER qui revient derrière elle en zoomant ; lunes à
   taille réelle seulement (pas de points).

## Ce qu'on garde pour le vrai jeu

### Le moteur — à réutiliser tel quel (TypeScript pur, sans affichage, testé)

| Fichier | Rôle | Remarque |
|---|---|---|
| `moteur/vsop87.ts`, `donnees/vsop87.ts`, `outils/vsop87.mjs` | Positions des planètes (VSOP87B tronqué, 177 Ko) | **10 à 1 000 fois plus précis** que le module actuel du jeu (`src/astro/planetes.ts`, jusqu'à 3,8 millions de km d'erreur pour Saturne). À brancher dans le jeu. |
| `moteur/kepler.ts` | Mouvement sur une conique (ellipse, hyperbole), robuste même très rapide | |
| `moteur/lambert.ts` | Trajectoire entre deux points en un temps donné (+ correction par la méthode du tir) | Testé sur Hohmann Terre → Mars (259 j). Précis du petit saut (ISS) au long voyage. |
| `moteur/mission.ts` | Orbite → trajet → orbite d'arrivée ; trajet le plus rapide pour un budget de delta-v | Le cœur de la navigation du jeu. |
| `moteur/corps.ts` | Catalogue unique des astres (Soleil, planètes, Pluton, 453 lunes, satellites, sondes), positions, mémoire par image | Réutilise les données du jeu (lunes, sondes, orbites TLE). |
| `moteur/navigation.ts` | Distance capsule–astre, distances lisibles en français | |
| `moteur/capsule.ts`, `orbite.ts`, `pluton.ts`, `sondes.ts`, `temps.ts` | Orbites circulaires, tracés d'orbite, Pluton (Meeus), interpolation des sondes, échelles de temps (TT − UTC) | Pluton non vérifié contre le JPL (voir plus bas). |
| `carte/projection.ts` | Projection logarithmique de la carte | Testée (ordre des distances, réversibilité). |

### L'affichage — la logique est bonne, le code sera à reprendre dans l'interface Svelte du jeu

- **Carte 2D** (`carte/carte.ts`, `carte/cadran.ts`, `commun/reperes.ts`) : niveaux, toucher, cadran, repères,
  deux traits, rendez-vous. C'est la maquette fonctionnelle de l'écran de navigation du jeu.
- **Vue 3D** (`affichage3d/`) : techniques à conserver — **origine flottante** sur la capsule et **profondeur
  logarithmique** (de 1 cm à des milliards de km sans tremblement), **sphères calculées pixel par pixel** (rondes
  même au ras de la Terre), double contour, rendu Moebius, orientation réelle des planètes, capsule type Apollo.
- **Triche d'affichage** des satellites artificiels (`commun/triche.ts`) : vus de loin, écartés de la planète à leur
  vraie vitesse.

## Ce qu'on jette

- `main.ts` (l'assemblage du prototype), `style.css`, le panneau « Repères » et ses réglages d'essai.
- Les styles abandonnés (à plat, BD tramée, réaliste) : encore dans le code, à ne pas reprendre.
- La conversion automatique des photos NASA en « ligne claire » (`affichage3d/textures.ts`) : dépannage ; il
  faudra de vraies cartes dessinées.

## Ce qui manque ou reste faible

**Données (bloquées par le réseau de l'environnement : `celestrak.org` et `ssd.jpl.nasa.gov` refusés)**
- Les milliers de satellites artificiels : seuls l'ISS, Hubble et Tiangong sont présents.
- Pluton : vérifié seulement contre un autre modèle (écart ≈ 150 000 km, 1″), pas contre le JPL. Ses lunes (Charon…)
  manquent.
- Péremption : orbites des lunes valables jusqu'en 2031, trajectoires des sondes jusqu'en 2029 (en ligne droite
  après), orbites TLE à rafraîchir régulièrement.

**Physique simplifiée (choix du brief, à revoir pour le jeu)**
- Seul le Soleil attire la capsule : pas de gravité des planètes au départ ni à l'arrivée.
- Manœuvres instantanées : **l'accélération progressive** demandée par Adrien doit passer par le moteur (une
  poussée qui dure change la trajectoire), pas par un effet visuel. Le pivot de la capsule, lui, est fait.
- **Orbite d'attente trop basse** (400 km autour de la Terre, 1,3 rayon à l'arrivée) : à régler avec les règles.
- Lambert « chemin court » uniquement (pas de transferts à plusieurs tours).

**Affichage**
- Le trajet Terre → Mars est petit à l'échelle du système solaire : un zoom automatique sur le trajet aiderait.
- Carte de la Terre en basse définition de près ; lunes peintes « au hasard » ; anneaux de Saturne absents.
- Planètes et sondes gardent un point dans la vue 3D (sinon, vu de loin, plus rien n'est visible).

**Équilibrage (pour le vrai jeu)**
- À 30 km/s et en temps réel : Mars ≈ 4 mois, Jupiter ≈ 1 an, Saturne ≈ 12 ans, Neptune hors de portée. Le rythme
  des améliorations de moteur décidera si le jeu est jouable au-delà de Mars.

## Prochaines étapes proposées (à décider par Adrien)

1. **Brancher VSOP87 dans le jeu** à la place de `src/astro/planetes.ts` (gain de précision énorme, sans changer
   de règle — mais des tests du jeu dépendent des anciennes positions, à adapter).
2. **Ouvrir le réseau** de l'environnement à `celestrak.org` et `ssd.jpl.nasa.gov`, puis récupérer satellites,
   Pluton et Charon, et renouveler les données des sondes et des lunes.
3. **Intégrer la carte de navigation** dans l'interface du jeu (Svelte), avec le moteur de mission ; la vue
   extérieure en option.
4. **Règles à écrire** : poussée progressive, altitude des orbites d'attente, coût et progression des moteurs
   (30 km/s au départ).
