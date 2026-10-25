# Les fenêtres illustrées : fiche de prompts pour ChatGPT

Adrien, 25/10/2026 : d'autres fenêtres méritent d'être refaites avec ChatGPT. Ordre validé le même jour :
1. les **trois blasons des Maisons** (lettre d'invitation, puis Profil et Messages) ;
2. les **trois vignettes des Collections** (monolithes, Voix perdues, Disparus) ;
3. **« Zone libérée ! »** : la Lune et les trois planètes intérieures d'abord (les seules zones jouables), les autres au
   fil de la campagne ;
4. **le rêve du Soleil**, en six cases peintes qui défilent comme une BD.

Laissés tels quels : la fenêtre du nouveau moteur (son cadran animé fait le spectacle), les 150 médailles des
trophées (en SVG, cohérentes entre elles), le poste radio (un instrument qu'on manipule), l'annonce d'assaut (elle
attend les amiraux de `docs/amiraux-prompts.md`).

## Comment s'y prendre

1. Dans une nouvelle conversation, **envoyer d'abord une image du jeu** (la couverture `public/couverture.webp`, ou un
   bandeau de `public/bandeaux/`) en disant : « voici le style du jeu ; garde exactement ce style de dessin ».
2. Coller le **bloc de style**, puis la fiche de l'image.
3. Envoyer les images telles quelles, en disant laquelle c'est : Claude les recadre, les allège et les range.

## Bloc de style

> Illustration pour un jeu spatial sur téléphone. Rétro-futurisme des années 50-60, esprit pulp. Style bande dessinée
> de Moebius (Jean Giraud) : ligne claire, trait d'encre brun-violet foncé (#2b2138) net, grands aplats de couleurs
> pastel, ombres en aplats, aucun dégradé photographique, aucun rendu 3D. Palette : bleu nuit, crème (#faf2dc), vert
> d'eau (#9fcfca), lavande (#cdbfe8), moutarde (#f2d58e), et l'orange sécurité (#e8682a) pour les touches qui
> comptent. **Aucun texte, aucune lettre, aucun chiffre, aucun logo, aucun cadre.**

## 1. Les blasons des Maisons (3 images)

Format **carré 1024 × 1024, fond transparent**. Un écusson rétro, comme un insigne brodé d'équipage des années 60
(un écu ou un médaillon, un bord cousu, un ruban vide en bas sans inscription), dans la couleur de la Maison, cerné
d'encre. **Lisible en tout petit** (il s'affichera aussi à 24 pixels à côté d'un pseudo) : une seule figure forte au
centre.

- **Nettoyeurs** — vert sauge **#7cc79a** (clair #c4e6cf, foncé #3f7a4c). Ils récupèrent les épaves : un grappin
  au bout d'un câble enroulé, accroché à une petite épave de satellite.
- **Mercenaires** — rose rouge **#e9828f** (clair #f5c6cc, foncé #a8384a). La sécurité, ils chassent les vaisseaux
  d'Andromède : deux canons de vaisseau croisés devant une étoile à cinq branches, une petite cible.
- **Ingénieurs** — bleu ciel **#82aee8** (clair #c9daf3, foncé #2f5d9a). La technique, les dépannages et les
  livraisons : une clé à molette croisée avec un tournevis devant un engrenage, un petit éclair.

## 2. Les vignettes des Collections (3 images)

Format **carré 1024 × 1024, fond transparent**. Un objet seul, de trois quarts, comme posé dans une vitrine de musée,
avec une petite ombre portée sous lui ; dessiné pour être vu à 90 pixels.

- **Monolithes** : un monolithe noir et lisse, très légèrement penché, un reflet lavande sur une arête, trois petits
  arcs d'onde violets qui en partent (l'écho du PING).
- **Voix perdues** : un poste de radio TSF des années 50 en bois verni, son cadran éclairé crème, deux boutons, une
  antenne télescopique, trois petites ondes qui en sortent.
- **Disparus** : une vieille sonde spatiale des années 60-70 (une parabole, des panneaux solaires, une perche), un
  peu cabossée, une petite onde de radar lavande autour d'elle.

## 3. « Zone libérée ! » (4 images d'abord)

Format **paysage 1536 × 1024**. La fenêtre de libération s'ouvre sur cette image (sous elle, le portrait du PNJ de la
Résistance, ses mots, ce qui s'ouvre). Ambiance de victoire : l'astre au centre ou de trois quarts, **un feu
d'artifice qui éclate dans le ciel** au-dessus de lui (gerbes orange, moutarde et vert d'eau), le **drapeau de la
Résistance** planté (un drapeau orange frappé de l'écusson de la Résistance, **une planète à anneau crème sur un
disque orange**, comme sur la poitrine des PNJ ; **pas d'étoile**, rien d'écrit), un vaisseau amiral d'Andromède (violet
et vert d'eau, organique) qui part en fumée au loin. **Laisser un ciel calme en haut à gauche** (un titre s'y posera).

- **La Lune** : la Lune grise et crème, ses cratères en aplats, la Terre bleue en arrière-plan ; une base lunaire
  (dômes, antennes) où l'on fête, le drapeau planté sur le bord d'un cratère.
- **Mars** : la planète rouge, un ciel de poussière rose qui se dissipe après la tempête, une station martienne,
  le drapeau sur une crête, Phobos en arrière-plan.
- **Vénus** : la cité volante Cythère, un aérostat géant (ballon et nacelle Art déco) au-dessus des nuages jaunes de
  Vénus, le drapeau au sommet du ballon, le feu d'artifice dans le ciel orangé.
- **Mercure** : un phare spatial sur une falaise de Mercure, son faisceau qui balaie le ciel noir, le Soleil énorme
  à l'horizon, le drapeau en haut du phare.

### 3 bis. Zone libérée : à partir des décors des PNJ (Adrien, 25/10/2026)

Adrien : les scènes inventées sont incohérentes avec les décors des lieux déjà dans le jeu (`public/decors/`, ceux des
dialogues). On reprend donc **le décor du lieu du PNJ qui annonce la libération**, et ChatGPT y ajoute la fête :
la Lune → `tycho.webp` (Okafor), Mars → `mars.webp` (Hélène), Vénus → `cythere.webp` (Odile), Mercure → `mercure.webp`
(Aurelio). Adrien, 25/10/2026 : pour tous les systèmes, **une image par système**, que toutes ses zones partagent
(`illustrationLiberation` dans main.ts) : Jupiter → `ganymede.webp` (Nadia), Saturne → `titan.webp` (Tomás), Uranus →
`titania.webp` (Hana), Neptune → `leverrier.webp` (Aksel), Pluton → `tombaugh.webp` (Mira). Triton, le boss de l'acte 1
(le vaisseau démasqué), aura la sienne, plus tard. Envoyer le décor, puis :

> Reprends exactement ce décor (même lieu, mêmes bâtiments, même lumière, même style) et fais-en la scène de sa
> libération : un grand feu d'artifice qui éclate dans le ciel (gerbes orange, moutarde et vert d'eau), le drapeau de
> la Résistance planté bien en vue (un drapeau orange frappé d'une planète à anneau crème sur un disque orange, cernée
> d'encre ; aucune étoile), quelques silhouettes en scaphandre qui lèvent les bras, et au loin un vaisseau
> extraterrestre violet et vert d'eau, organique, qui part en fumée. Élargis le cadre en **paysage 1536 × 1024** en
> prolongeant le décor sur les côtés, sans rien couper de ce qui y est déjà. Aucun texte.

## 4. Le rêve du Soleil (6 cases)

Format **portrait 1024 × 1536**, plein écran. Un rêve façon Moebius qui délire : couleurs plus saturées, perspectives
qui se tordent, la ligne claire qui se met à onduler. Les six cases défileront l'une après l'autre (fondu, lent
zoom), puis la case du réveil (déjà dans le jeu) : « Capitaine ? Capitaine ! Vous avez encore fait le rêve du
Soleil… ». **Même capsule** (crème et orange) d'une case à l'autre.

1. **La chute** : la petite capsule plonge vers un Soleil immense, doré, dont la surface bouillonne ; ses boucliers
   rougissent et fondent en gouttes.
2. **L'effondrement** : le Soleil se replie sur lui-même et devient un trou noir, un disque d'accrétion orange et
   moutarde qui tourbillonne, la lumière tordue autour.
3. **L'aspiration** : les planètes du système solaire, étirées comme du caramel, sont aspirées en spirale vers le trou
   noir ; la capsule minuscule au milieu.
4. **L'indice** : dans la spirale, à la place de Neptune, la silhouette sombre d'un immense vaisseau extraterrestre,
   organique, à peine devinée (la case ne restera qu'un instant à l'écran).
5. **La traversée** : la capsule traverse un tunnel de lumière lavande et vert d'eau, des formes géométriques
   impossibles, des yeux de planètes qui la regardent.
6. **L'arrivée** : un « nouveau » système solaire bizarrement familier : un Soleil, des planètes… mais pas tout à
   fait les mêmes (une Terre à deux lunes, un Saturne aux anneaux verticaux), la capsule qui flotte, minuscule et
   paisible.

## Reçus

- **Les trois blasons** (25/10/2026) : `public/blasons/<maison>.webp` (une planche découpée), `commun/blasons.ts` ;
  en sceau sur la lettre d'invitation (à la place des emojis), et en petit devant le nom de la Maison dans le Profil
  et la fiche d'un capitaine, et devant le pseudo dans les Messages.
- **Zone libérée, premier jet** (25/10/2026, Lune, Mars, Vénus, Mercure, en une planche) : réussi, mais le drapeau porte
  une étoile au lieu de l'écusson de la Résistance (la planète à anneau des PNJ), la faute à la fiche, corrigée. À faire
  retoucher par ChatGPT avant de l'intégrer.
- **Zone libérée, retouchée** (25/10/2026) : le drapeau et le ballon de Cythère portent l'écusson de la Résistance.
  `public/liberations/<lune|mars|venus|mercure>.webp`, bord à bord en tête de la fenêtre « … libérée ! », au-dessus
  du titre (`ILLUSTRATIONS_LIBERATION` dans main.ts) ; les autres zones restent sans image jusqu'à la leur.
- **Les trois vignettes des Collections** (25/10/2026) : `public/collections/<monolithes|voix|disparus>.webp` (une planche
  découpée), dans le cadre de chaque couverture des Collections, à la place des petits dessins vectoriels.
