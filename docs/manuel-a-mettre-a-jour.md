# Manuel : changements à reporter

Le jeu et le manuel ne doivent jamais diverger (règle 5 de `CLAUDE.md`). Le manuel actuel (`manuel/pdf/`) date du
prototype ; les changements de règle décidés depuis sont listés ici, et seront faits lors de la régénération du
manuel (scripts `manuel/sources/`, qui demandent Python et reportlab). Cocher chaque ligne une fois reportée.

## Décisions du 13/10/2026 (Adrien)

### Plus de grand-père
- [ ] Supprimer **toutes** les annotations manuscrites (appels `main(...)` dans les 5 scripts, 24 au total).
- [ ] Supprimer la page 6 « carnet du grand-père » (`manuel.py`, « Pour faire cracher la bête ») et le renvoi
      « Ben voyons. → voir mon carnet, au dos. ».
- [ ] Recherche des visiteurs (`chasse_pdf.py`) : retirer « Ce que je sais d'eux », « 1958. Je l'ai entendu… »,
      « Pour le petit, s'il lit ça un jour. ».

### Règles cachées qui deviennent officielles
- [ ] TU-1 (`manuel.py`, procédure de surchauffe) : « Attendre que l'aiguille descende sous la graduation **40** »
      (au lieu de 60 ; la valeur 40 était donnée par l'annotation « 60 ?? Mon œil. Attends 40 »).

### AL-1 : précision sur la couleur
- [ ] Préciser : « même couleur que le fusible **qui a grillé en premier** » (si un fusible de mauvaise couleur
      grille à son tour, la règle part toujours de la couleur d'origine). *Décision d'Adrien du 13/10/2026.*

### CH-1 / TU-1 : emballement
- La phrase du manuel est conservée telle quelle : « Une purge (P) pendant une surchauffe provoque un emballement de
  tuyère. » (presser P tant que V-1 est allumé, même sans avarie de pression). *Décision d'Adrien du 13/10/2026.*

### DV-1 supprimé
- [ ] Planche CH-1 / TU-1 (`manuel.py`) : retirer le témoin **V-3** (repère 5, « Témoin de régime ») de la
      planche et de la légende.
- [ ] Le levier **L-B** reste : « Réservé à la maintenance au sol. Ne jamais manœuvrer en vol. »

### Navigation (à écrire si le manuel en parle un jour)
- Trajectoire de rencontre, repère du trajet (planète ou Soleil), fenêtre de tir au choix du joueur (voir `docs/regles.md`).
