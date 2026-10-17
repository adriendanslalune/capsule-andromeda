# Capsule Andromeda — instructions pour Claude Code

Ce fichier est lu à chaque session. Le porteur du projet (Adrien) n'est pas développeur : explique tes choix
simplement, en français, et demande son avis avant toute décision qui change le jeu (règles, équilibrage, interface).

## Le jeu

« Capsule Andromeda » est un jeu pour **téléphone** (et uniquement téléphone). Le joueur pilote une capsule dans le
**vrai** système solaire : vraies positions des planètes (VSOP87), de la Lune, des satellites naturels, de l'ISS et des
sondes, à l'heure réelle (UTC).

- En ligne : https://adriendanslalune.github.io/manuel-de-vol/ (publication automatique à chaque envoi sur `main`).
- L'ancien jeu (« Manuel de vol ») a été **supprimé** le 17/10/2026 à la demande d'Adrien. Il reste dans l'historique
  Git ; on n'y revient pas et on n'y prend rien sans qu'Adrien le demande.

## Documents à lire avant de coder

- `docs/LISEZ-MOI.md` — organisation du code et décisions d'Adrien prises pendant le prototype 1.
- `docs/BILAN.md` — bilan du prototype 1 (ce qu'on garde, ce qui manque, suites proposées).

## Organisation

```
src/
  moteur/     # logique pure, testée : temps, planètes (VSOP87), corps, orbites, Kepler, Lambert, mission, navigation
  astro/      # Lune, satellites naturels, ISS et orbites TLE (SGP4)
  donnees/    # tables générées ou saisies : VSOP87, satellites, sondes (JPL), TLE, planètes
  carte/      # la carte 2D et le cadran de navigation
  commun/     # gestes, repères de destination
  main.ts     # assemblage de la page
tests/        # Vitest (positions comparées à JPL Horizons : tests/references/)
outils/       # générateurs de données (vsop87.mjs, satellites-jpl.mjs, engins-jpl.mjs)
```

## Règles de travail

1. **Téléphone uniquement.** Écran de référence 390 × 844. Pas de mise en page PC. Cibles tactiles ≥ 44 px.
2. **Tout en français** : interface, textes, commentaires du code, messages de commit.
3. **Le moteur est séparé de l'affichage.** `src/moteur/` est du TypeScript pur, sans DOM, sans `Date.now()` direct :
   l'heure est toujours passée en paramètre.
4. **Les données sont séparées du code** (`src/donnees/`).
5. **Tests automatiques** (Vitest) pour tout le moteur. Ne jamais livrer avec des tests rouges (`npm test`,
   `npm run check`, `npm run build`).
6. **Pas de changement de règle, d'équilibrage ou d'interface sans accord d'Adrien.** En cas de doute, demander.
7. **Petits pas.** Une fonctionnalité à la fois, testée, commitée, publiée, avec un message clair ; Adrien la valide
   sur son téléphone avant la suivante.
8. **Direction artistique : style « Moebius »** (validé par Adrien) : fond blanc cassé, encre brun-violet, couleurs
   pastel, ombres en aplat violet, hachures fines le long du terminateur.
