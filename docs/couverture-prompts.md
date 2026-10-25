# La couverture et l'icône du jeu : fiche de prompts pour ChatGPT

Adrien, 25/10/2026 : l'icône du téléphone et l'écran de chargement (la couverture de pulp « CAPITAINES ! ») sont des
dessins vectoriels simples de Claude, faits avant les illustrations de ChatGPT : à côté des vaisseaux, des épaves et
des bandeaux, ils font clip-art. On les refait avec ChatGPT, dans le même style.

Ce que le code garde par-dessus la couverture : le bandeau orange « CAPITAINES ! Histoires étonnantes de l'espace »
(en haut, avec le numéro du jour et « 25 cents »), l'étoile de la une (qui change à chaque chargement), le titre
« CAPSULE ANDROMEDA » et son sous-titre. **Aucun texte dans les images** : le jeu les écrit lui-même, nets et à jour.

## Comment s'y prendre

1. Dans une nouvelle conversation, **envoyer d'abord deux images du jeu** : la capsule (`public/vaisseaux/capsule.webp`)
   et un chasseur d'Andromède (`public/vaisseaux/chasseur.webp`), en disant : « voici le style du jeu et ses
   vaisseaux ; garde exactement ce style de dessin, et ces deux vaisseaux tels quels ».
2. Coller le **bloc de style**, puis la fiche de l'image.
3. Envoyer les images telles quelles : Claude les recadre, les allège et les range.

## Bloc de style

> Illustration pour un jeu spatial sur téléphone. Rétro-futurisme des années 50-60, couverture de magazine pulp de
> science-fiction (« Astounding Stories », « Amazing Stories »). Style bande dessinée de Moebius (Jean Giraud) : ligne
> claire, trait d'encre brun-violet foncé (#2b2138) net, grands aplats de couleurs pastel, ombres en aplats, ciel en
> aplats, aucun dégradé photographique, aucun rendu 3D. Palette : bleu nuit, crème (#faf2dc), vert d'eau (#9fcfca),
> lavande (#cdbfe8), moutarde (#f2d58e), et l'orange sécurité (#e8682a) pour les touches qui comptent. **Aucun texte,
> aucune lettre, aucun chiffre, aucun logo, aucun cadre.**

## 1. La couverture (l'écran de chargement)

Format **portrait 1024 × 1536**.

> La scène : la petite capsule de la Résistance (crème et orange, celle de l'image fournie) fonce en diagonale, du bas à
> gauche vers le haut à droite, une longue flamme derrière elle. Devant elle, en haut à droite, **Triton**, une lune
> glacée rose et crème… mais à moitié fendue : on devine sous sa croûte les plaques et les lueurs vertes d'un immense
> vaisseau extraterrestre. **Neptune**, grosse planète bleu profond, en arrière-plan derrière Triton. Deux chasseurs
> d'Andromède (violets et vert d'eau, ceux de l'image fournie) surgissent de l'ombre pour lui couper la route, des
> traits de tirs verts. En bas, tout petit et très loin, le croissant bleu de la Terre. Un ciel bleu nuit plein
> d'étoiles, quelques traits de vitesse. Dramatique, plein d'aventure, comme une couverture de pulp.
>
> **Composition, très important** : le **sixième du haut** est un ciel étoilé calme, sans rien d'important (un bandeau
> titre s'y posera) ; **le tiers du bas** est aussi un ciel calme, presque vide (le titre du jeu s'y écrira) ; toute
> l'action est **au milieu**. Les bords gauche et droit peuvent être rognés sur les téléphones étroits : rien
> d'important à moins d'un dixième du bord.

## 2. L'icône (sur l'écran d'accueil du téléphone)

Format **carré 1024 × 1024**, **fond plein** (pas de transparence : l'iPhone met du noir derrière).

> Un gros plan sur la capsule de la Résistance (crème et orange, celle de l'image fournie), de trois quarts, le nez
> vers le haut à droite, une flamme orange derrière elle, qui passe devant une grosse planète à anneau vert d'eau
> (comme Saturne, en aplats Moebius). Fond bleu nuit uni avec quelques étoiles. **Une seule forme forte, lisible en
> tout petit** (l'icône fait 60 pixels sur un téléphone) : la capsule et la planète, rien d'autre, pas de détails fins.
>
> **Tout le dessin tient dans le cercle central** (les deux tiers du milieu de l'image) : Android découpe l'icône en
> rond. Le fond bleu nuit va jusqu'aux bords.

## 3. La couverture avec ses titres (Adrien, 25/10/2026)

Adrien : le gros « CAPITAINES ! » écrit par le jeu fait cheap ; ChatGPT écrit les titres, plus harmonieux. Le jeu ne
garde par-dessus que le petit numéro du jour (« N° 312 · 25 cents ») et l'étoile de la une, qui changent. Envoyer à
ChatGPT **la couverture déjà reçue** (`public/couverture.webp`), puis :

> Reprends exactement cette illustration (même scène, même cadrage, même style) et ajoute-lui ses titres, comme une
> vraie couverture de magazine pulp des années 50. **En haut**, le nom de la revue, « CAPITAINES ! », en très grosses
> lettres dessinées à la main, penchées, pleines de dynamisme, crème cernées d'encre avec une ombre portée orange,
> comme le logo d'« Astounding Stories » ; juste dessous, en petit et en italique, « Histoires étonnantes de
> l'espace ». **En bas**, le titre du jeu, « CAPSULE ANDROMEDA », sur deux lignes, dans un lettrage rétro-futuriste
> spectaculaire (lettres en relief, filets de vitesse), crème et orange cernés d'encre. **Aucun autre texte** : pas
> de prix, pas de numéro, pas de date, pas de slogan. Respecte exactement l'orthographe, les accents et la ponctuation
> (« CAPITAINES ! » avec l'espace avant le point d'exclamation, « étonnantes », « l'espace »). Laisse **le coin en
> haut à droite, sous le nom de la revue, sans rien d'important** (une petite étiquette s'y posera). Format portrait
> 1024 × 1536.

Vérifier chaque lettre avant de l'envoyer : ChatGPT écorche souvent les mots (lettres en double, accents perdus).

## Reçus

- **La couverture** (25/10/2026) : `public/couverture.webp`, en fond plein écran (cadrée au centre : les bords sont
  rognés sur un téléphone) ; le titre et la une descendent au pied, en crème, sur un voile de nuit ; le bandeau
  « CAPITAINES ! » et l'étoile de la une restent en haut.
- **L'icône** (25/10/2026) : `public/icones/` (512, 192, 180 pour l'iPhone, 32 pour l'onglet du navigateur) et une
  version masquable pour Android (le dessin réduit à 80 % sur le bleu nuit, pour que la découpe en rond ne mange pas
  la capsule) ; l'ancienne icône SVG est retirée.
