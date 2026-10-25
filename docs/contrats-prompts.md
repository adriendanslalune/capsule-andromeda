# Les illustrations des contrats : fiche de prompts pour ChatGPT

Adrien, 25/10/2026 : « les mini-jeux sont sympas mais graphiquement c'est pas fou ». Les écrans des contrats (tri,
remorquage, largage, amarrage, convoi, escorte) sont aujourd'hui des schémas en traits simples sur du papier uni. On les
habille avec de **vrais objets** dessinés par ChatGPT, comme les vaisseaux (épaves, station, cargo, missile, débris du
tri) ; le décor, l'arc de l'astre, est dessiné par le jeu. La capsule du joueur y a déjà sa forme et sa Maison (fait le 25/10/2026). Le
dépannage, un panneau d'instruments, est refait par Claude à part.

Ce que le code garde : tout ce qui bouge et ce qui sert à jouer (l'anneau d'accroche rouge du remorquage, le câble,
les zones de dépôt, les places du convoi en pointillé, les trajectoires des missiles, les flammes). Les images ne sont
que le décor et les objets ; ne rien y dessiner de tout ça.

## Comment s'y prendre

1. Dans une nouvelle conversation, **envoyer d'abord une image du jeu** (la capsule, ou un vaisseau déjà reçu) en
   disant : « voici le style du jeu ; garde exactement ce style de dessin et ces couleurs ».
2. Coller le **bloc de style des objets**, puis la fiche.
3. Envoyer les images telles quelles, en disant laquelle c'est : Claude les recadre, les allège et les range.

## Bloc de style des objets (épaves, station, cargo, missile, débris)

> Objet pour un jeu spatial sur téléphone, vu **strictement du dessus** (vue zénithale). Rétro-futurisme des années
> 60-70, pulp. Style bande dessinée de Moebius (Jean Giraud) : ligne claire, trait d'encre brun-violet foncé net et
> assez épais, grands aplats de couleurs pastel, ombres en aplats. **Silhouette simple et lisible même en petit.**
> L'objet seul, centré, qui remplit l'image. **Fond transparent**, aucun décor, aucun astre, aucun personnage, aucun
> texte, aucun cadre. Format carré, 1024 × 1024.

## Les décors : faits par le jeu, pas par ChatGPT

Validé par Adrien le 25/10/2026 : des décors peints seraient incohérents selon le système du contrat. Le jeu dessine
lui-même, au pied de chaque écran, un grand arc de l'astre près duquel on travaille, avec le moteur des globes de la
carte (la vraie Terre et sa nuit autour de l'ISS, la Lune à Tycho, Saturne et ses anneaux…), grisé si la zone est
encore occupée ; rien en plein espace (`carte/decor-contrat.ts`). Aucune image de décor à générer.

## Les épaves (4, pour le tri, le remorquage et le largage)

Une par image, avec le bloc des objets. Des engins humains morts, abîmés, mais reconnaissables. **Pas d'anneau
d'accroche** : le jeu le dessine lui-même.

1. **Satellite mort** : un corps en boîte, un panneau solaire arraché, l'autre plié, une antenne tordue.
2. **Étage de fusée** : un gros cylindre blanc et orange, sa tuyère au bout, un réservoir éventré.
3. **Station en ruine** : un module habitable, un bout de coursive arraché, des panneaux pendants.
4. **Cargo abandonné** : une coque trapue, une soute ouverte, des conteneurs qui s'en échappent.

## La station (3 images)

- **Le quai d'amarrage** (amarrage, largage) : un **long quai horizontal** qui occupe la largeur de l'image, vu du
  dessus, avec au milieu un **port d'amarrage** (un anneau, deux feux de position) qui regarde vers le bas ; des
  panneaux solaires aux deux bouts. Format **paysage 1536 × 512**, fond transparent.
- **Le hangar** (convoi) : le bord d'une station avec un **grand hangar ouvert vers le haut**, ses portes coulissantes
  écartées, des feux de piste jaunes. Format paysage 1536 × 512, fond transparent.
- **La station entière** (pour plus tard, les fiches et la carte) : une station en roue ou en croix, avec ses modules,
  ses panneaux et son quai. Carré 1024 × 1024, fond transparent.

## Le cargo (1 image)

Un **cargo trapu** de la Résistance, vu du dessus, la proue vers le haut : une cabine à l'avant, des conteneurs en
rangées, deux tuyères. **Coque crème avec des bandes orange vif** (le jeu repeint l'orange en jaune, bleu ou lavande
pour distinguer les trois cargos du convoi). Fond transparent.

## Le missile d'Andromède (1 image)

Un missile alien, vu du dessus, **la pointe vers le haut**, dans le style des vaisseaux d'Andromède (organique, en
forme de dard ou de graine, violet et vert d'eau, une lueur verte au cœur). Fin et allongé. Fond transparent.

## Les débris du tri (1 planche)

Une **planche de 30 petits objets** isolés, bien séparés les uns des autres, rangés en **6 colonnes et 5 lignes**, sur
**fond transparent**, chacun vu de trois quarts dessus, dans le style des objets. Dans l'ordre, ligne par ligne :

1. plaque de titane, tuyère tordue, poignée de boulons, bobine de cuivre, clé à molette, gros ressort ;
2. tôle cabossée, fil de cuivre, carte de circuits, relais grillé, puce mémoire, lampe radio ;
3. transistor, condensateur, bande magnétique, microphone, hublot fêlé, cristal de quartz ;
4. lentille d'optique, fiole de laboratoire, miroir de télescope, ampoule, bocal à échantillons, mousse isolante ;
5. gant d'astronaute, emballage de ration, toile brûlée, chaussette perdue, sac de déchets, une boîte de conserve.

Format carré 1024 × 1024 (ou plus grand si possible). Claude découpe la planche objet par objet.

## Reçus

- **Les quatre épaves** (25/10/2026) : `public/contrats/epave-satellite|etage|station|cargo.webp`, branchées dans le
  remorquage (elle tourne, l'anneau d'accroche par-dessus), le largage et le tri (au-dessus du tapis). Le nom d'une épave
  dit sa sorte (`carte/objets-contrats.ts`) ; une épave célèbre en prend une d'après son nom.
- **La station** (25/10/2026) : `public/contrats/quai.webp` (amarrage et largage : la pointe de son port au point de
  contact), `hangar.webp` (convoi : les cargos sortent du milieu de sa baie), `station.webp` (la station entière, rangée
  pour plus tard : fiches et carte).
- **Le cargo** (25/10/2026) : ses bandes orange repeintes par Claude d'avance, hors de la soute (les conteneurs gardent
  leurs couleurs), en trois livrées, `cargo-0|1|2.webp` (jaune, bleu, lavande : `COULEURS_CARGOS`) ; au convoi et à
  l'escorte (gris quand il est hors d'usage, une flamme à chaque tuyère).
- Reste à venir : le missile, la planche des débris.
