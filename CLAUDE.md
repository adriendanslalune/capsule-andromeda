# Manuel de vol — instructions pour Claude Code

Ce fichier est lu à chaque session. Il décrit le jeu, les règles de travail et la feuille de route.
Le porteur du projet (Adrien) n'est pas développeur : explique tes choix simplement, en français,
et demande son avis avant toute décision qui change le jeu (règles, équilibrage, interface).

## Le jeu en bref

« Manuel de vol » est un jeu pour **téléphone** (et uniquement téléphone) en temps réel.
Le joueur est un commissionnaire de l'Office national des vols interplanétaires (O.N.V.I.).
Il pilote une vieille fusée, la C-58, dans le **vrai** système solaire (positions réelles des planètes,
vraies distances, vrai délai de la lumière, vraie heure UTC).

Boucle de jeu : réparer des pannes → gagner des crédits → améliorer le moteur et installer des modules
→ voyager plus vite et plus loin → chasser le visiteur extraterrestre de la saison.

Principe central, hérité de *Keep Talking and Nobody Explodes* : **le jeu n'explique jamais rien**.
Toutes les procédures sont dans un manuel (PDF ou papier), indispensable pour jouer.
Les règles dépendent d'indices éparpillés (numéro de série de la fusée, interrupteurs, état des autres modules).

## Documents de référence (à lire avant de coder)

- `docs/regles.md` — **toutes les règles et constantes du jeu**, extraites du prototype. Source de vérité du moteur.
- `docs/interface.md` — la logique d'interface validée (« piste A : la fenêtre d'abord »).
- `docs/feuille-de-route.md` — les phases du projet, dans l'ordre.
- `reference/prototype-v0.1.html` — le prototype jouable (un seul fichier). **Référence de comportement**,
  pas de structure : ne pas recopier son organisation, seulement ses règles.
- `src/interface/manuel/` — **le manuel**, dessiné par le jeu à partir des données (`src/donnees/`) : pages A5 en
  noir et blanc (manuel d'entretien), lues dans le volet MANUEL, imprimables en PDF (bouton IMPRIMER).
  `manuel/pdf/` et `manuel/sources/` : ancien manuel du prototype, gardé pour archive.
- `assets/textures/` — cartes de la Terre et de la Lune converties en ligne claire.
- Maquette de l'interface (piste A) : https://claude.ai/artifact/PrrqBmjCrTVS8Nf2TXCorz

## Règles de travail

1. **Téléphone uniquement.** Écran de référence 390 × 844. Pas de mise en page PC. Cibles tactiles ≥ 44 px.
2. **Tout en français** : interface, textes, commentaires du code, messages de commit.
3. **Le moteur est séparé de l'interface.** Le moteur (`src/moteur/`) est du TypeScript pur, sans DOM,
   sans `Date.now()` direct : l'heure est toujours passée en paramètre (horloge injectable).
   Cela permet de tester, de simuler l'absence hors ligne, et plus tard de faire tourner le même moteur sur le serveur.
4. **Les données sont séparées du code** (`src/donnees/`) : modules, primes, prix, mots du codeur, stations morse,
   étoiles, contrats… Le manuel PDF sera à terme généré à partir de ces mêmes données.
5. **Le jeu et le manuel ne doivent jamais diverger.** Toute règle modifiée dans le moteur doit l'être dans le manuel.
   Des tests vérifient que chaque panne est réparable en suivant exactement les règles du manuel.
6. **Tests automatiques** (Vitest) pour tout le moteur : éphémérides, économie, chaque module, cascades,
   fautes de pilotage, visiteur, rattrapage hors ligne, sauvegarde. Ne jamais livrer un moteur sans tests verts.
7. **Pas de changement de règle ou d'équilibrage sans accord d'Adrien.** En cas de doute, demander.
8. **Petits pas.** Une fonctionnalité à la fois, testée, commitée, avec un message clair.
9. **Direction artistique : comics rétro, à plat** (pop culture des années 50-60 ; fun mais réaliste, un peu absurde ;
   sobre et sympathique ; vieux papier, traits d'encre, aplats, ombres dures ; pas de reflets métalliques ;
   choisie par Adrien le 14/10/2026). Couleurs, polices et matières sont dans `src/theme/`
   (`theme.css`, `matieres.css`) : on change de style sans toucher au reste.

## Technique retenue (à confirmer avec Adrien en phase 0)

- Vite + TypeScript ; interface en Svelte (léger, adapté à une interface riche) ; three.js pour la vue 3D.
- Vitest pour les tests.
- Application installable (PWA) avec notifications plus tard.
- Sauvegarde locale d'abord (avec version de format et migration), en ligne ensuite.
- Hébergement statique (GitHub Pages ou équivalent) ; serveur plus tard (phase 4).

## Structure attendue

```
src/
  moteur/        # logique pure, testée (temps, fusée, pannes, modules, économie, chasse, sauvegarde)
    modules/     # un fichier par module (ch1.ts, tu1.ts, al1.ts, co1.ts…)
  donnees/       # tables : modules, prix, mots, stations, étoiles, contrats, textes
  astro/         # éphémérides (positions réelles), Lune, satellites, étoiles
  interface/     # écrans Svelte : Ouverture, Fenetre, Module, Carte, Office, Manuel
  theme/         # variables de style (couleurs, polices, formes)
tests/
manuel/          # archive : ancien manuel du prototype (le manuel du jeu est dans src/interface/manuel/)
```

## Première session : ce qu'il faut faire

1. Lire ce fichier et les trois documents de `docs/`.
2. Proposer à Adrien un plan détaillé de la phase 0 et de la phase 1, et attendre son accord.
3. Phase 0 : initialiser le projet, Git, le premier commit, et le relier à son dépôt GitHub (le guider pas à pas).
