# Avancement — prototype 1 : carte et navigation

État relevé dans le code le 17/10/2026 (40 tests verts, vérification des types et construction OK).
Légende : **fait** / **en cours** / **à faire**.

## 1. Carte, astres (planètes, lunes, satellites artificiels, sondes), zoom et déplacement — en cours

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

## 4. Les deux traits et le trajet — fait (refait le 17/10/2026), en attente de validation

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

## 6. Mode nuit — à faire

- Rien dans le code.
