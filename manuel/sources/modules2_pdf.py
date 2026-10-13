import math, random
exec(open('/home/claude/manuel.py').read().split("# ================= PAGE 1")[0].replace("/mnt/user-data/outputs/manuel-de-vol-prototype.pdf","/mnt/user-data/outputs/manuel-de-vol-modules-2.pdf"))
c.setTitle('Manuel de vol — modules LP-1, HY-1, RE-1, MO-1, pannes multiples')
page_no[0] = 9
def tableau(x, y, cols, rows, widths, size=9, head=True):
    rh = size + 9
    for j, row in enumerate([cols] + rows if head else rows):
        xx = x
        for k, cell in enumerate(row):
            c.setStrokeColor(ENCRE); c.setLineWidth(.6); c.rect(xx, y - rh, widths[k], rh, stroke=1, fill=0)
            c.setFont('CourB' if (head and j == 0) else 'Cour', size); c.setFillColor(ENCRE); c.drawString(xx + 4, y - rh + 5, str(cell)); xx += widths[k]
        y -= rh
    return y
def etapes(y, steps):
    for i, st in enumerate(steps):
        c.setFont('CourB', 9.5); c.setFillColor(ENCRE); c.drawString(M + 4, y - 4, '%d.' % (i + 1))
        y = texte(M + 22, y - 4, st, size=9.2, width=W - 2 * M - 22) - 2
    return y
def encadre(y, lignes):
    h = 13 * len(lignes) + 10
    c.setStrokeColor(ROUGE); c.setLineWidth(1.2); c.rect(M, y - h, W - 2 * M, h, stroke=1, fill=0)
    c.setFillColor(ROUGE); c.setFont('CourB', 9)
    for k, l in enumerate(lignes): c.drawString(M + 8, y - 15 - k * 13, l)
    return y - h - 12

# X : pannes multiples
fond()
y = titre(H - M - 6, 'X. PANNES MULTIPLES')
y = texte(M, y, 'Avec l’âge de l’appareil et l’éloignement, les avaries tendent à survenir en cascade : plusieurs blocs tombent en panne au même instant. Le téléscripteur l’annonce par « AVARIE EN CASCADE ».', size=9)
y -= 4
c.setFont('CourB', 10); c.drawString(M, y, 'ORDRE DE RÉPARATION'); y -= 14
y = texte(M, y, 'Les blocs d’une cascade se réparent dans l’ordre alphabétique de leur code (AL, CH, CO, HY, LP, MO, PB, TU).', size=9)
y = texte(M, y - 2, 'Si le dernier chiffre du n° de série est IMPAIR, dans l’ordre inverse.', size=9)
y -= 6
y = encadre(y, ['EXCEPTION : une surchauffe (TU-1) se traite', 'TOUJOURS en premier, quel que soit l’ordre.'])
y = texte(M, y, 'Un bloc réparé hors de son tour retombe aussitôt en panne. La prime d’une cascade est majorée : +50 % par bloc supplémentaire.', size=9)
y -= 4
y = texte(M, y, 'Le recycleur RE-1 ne participe jamais aux cascades.', size=8.5, color=GRIS)
main(M + 120, y - 26, 'Le jour où il y en a quatre d’un coup,\nprends un café d’abord.', size=14, angle=-3)
c.showPage()

# XI : LP-1
fond()
y = titre(H - M - 6, 'XI. LP-1 — LAMPES À VIDE')
y = texte(M, y, 'Six lampes L-1 à L-6. En service, leur filament brille ORANGE. Une lampe défectueuse est ÉTEINTE, BLEUE ou VERTE.', size=9)
y -= 4
y = etapes(y, ['Mettre le ventilateur VT en marche. Une lampe chaude ne se touche jamais ventilateur arrêté.',
               'Remplacer les lampes défectueuses (les toucher) dans l’ordre ci-dessous.',
               'Arrêter le ventilateur VT.'])
y -= 6
c.setFont('CourB', 10); c.drawString(M, y, 'ORDRE DE REMPLACEMENT'); y -= 14
y = texte(M, y, '1. D’abord les lampes ÉTEINTES, puis les BLEUES, puis les VERTES.\n2. À couleur égale : par numéro croissant si le dernier chiffre du n° de série est PAIR, décroissant s’il est IMPAIR.', size=9)
y -= 6
y = texte(M, y, 'Toucher une lampe hors de son tour : refus, et il faut recommencer à la bonne lampe.', size=8.5, color=GRIS)
main(M + 150, y - 26, 'Orange, c’est bien.\nTout le reste, c’est du travail.', size=14, angle=-2)
c.showPage()

# XII : HY-1
fond()
y = titre(H - M - 6, 'XII. HY-1 — CIRCUIT HYDRAULIQUE')
y = texte(M, y, 'Une grille de tuyaux pivotants relie la source (à gauche) à trois réservoirs R-1, R-2, R-3 (à droite). Toucher un tuyau le fait pivoter d’un quart de tour.', size=9)
y -= 4
y = etapes(y, ['Lire le manomètre H.', 'Déterminer le réservoir à alimenter (tableau).', 'Orienter les tuyaux pour relier la source à ce réservoir, et à lui seul.', 'Ouvrir la VANNE.'])
y -= 6
y = tableau(M, y, ['MANOMÈTRE H', 'RÉSERVOIR'], [['moins de 35', 'R-1'], ['de 35 à 70', 'R-2'], ['plus de 70', 'R-3']], [150, 120], 9)
y -= 12
y = encadre(y, ['EXCEPTION : si S-2 est en position basse,', 'prendre le réservoir suivant (après R-3 : R-1).'])
y = texte(M, y, 'Si l’eau atteint un mauvais réservoir, ou n’arrive nulle part, l’ouverture de la vanne est refusée.', size=8.5, color=GRIS)
main(M + 150, y - 26, 'Comme le jeu du plombier,\nen moins drôle.', size=14, angle=-3)
c.showPage()

# XIII : RE-1
fond()
y = titre(H - M - 6, 'XIII. RE-1 — RECYCLEUR D’AIR')
y = texte(M, y, 'Le recycleur s’use en permanence, même en votre absence : l’oxygène (O2) baisse et le gaz carbonique (CO2) monte. Il entre en avarie quand O2 passe sous 25 ou CO2 au-dessus de 75. Un équipage mal oxygéné ralentit tout l’appareil.', size=9)
y -= 4
y = etapes(y, ['Ouvrir la vanne de purge V-C. Le CO2 baisse (et un peu d’O2 s’échappe).',
               'Attendre que le CO2 descende sous 40, puis refermer V-C.',
               'Pomper l’O2 avec POMPE (chaque coup : +10) jusqu’à la zone verte, entre 60 et 90.'])
y -= 6
y = encadre(y, ['Ne jamais pomper vanne ouverte.', 'Au-delà de 90, la soupape lâche et O2 retombe à 70.'])
y = texte(M, y, 'Conseil : un entretien régulier évite l’avarie. Le recycleur ne rapporte rien s’il n’est pas en panne.', size=8.5, color=GRIS)
main(M + 140, y - 26, 'Respire. Puis répare.', size=15, angle=-3)
c.showPage()

# XIV : MO-1
fond()
y = titre(H - M - 6, 'XIV. MO-1 — MORSE')
y = texte(M, y, 'Le bloc MO-1 capte un indicatif répété en morse (lampe et son). Le déchiffrer, trouver la station dans l’annuaire, régler la fréquence d’émission, puis presser ÉMETTRE.', size=9)
y -= 2
alpha = [('A','.-'),('B','-...'),('C','-.-.'),('D','-..'),('E','.'),('F','..-.'),('G','--.'),('H','....'),('I','..'),('J','.---'),('K','-.-'),('L','.-..'),('M','--'),
         ('N','-.'),('O','---'),('P','.--.'),('Q','--.-'),('R','.-.'),('S','...'),('T','-'),('U','..-'),('V','...-'),('W','.--'),('X','-..-'),('Y','-.--'),('Z','--..')]
yy = y
for k, (l, code) in enumerate(alpha):
    col, row = k // 9, k % 9
    x = M + col * 115; yl = yy - row * 15
    c.setFont('CourB', 10); c.setFillColor(ENCRE); c.drawString(x, yl - 10, l)
    xx = x + 16
    for sym in code:
        if sym == '.': c.circle(xx + 2, yl - 7, 2, stroke=0, fill=1); xx += 8
        else: c.rect(xx, yl - 9, 10, 4, stroke=0, fill=1); xx += 14
y = yy - 9 * 15 - 8
y = tableau(M, y, ['INDICATIF', 'FRÉQUENCE'], [['VEGA', '3,47'], ['ARES', '5,12'], ['IRIS', '8,06'], ['NOVA', '2,89'], ['LUNA', '6,64']], [80, 80], 9)
tableau(M + 180, y + 6 * 18, ['INDICATIF', 'FRÉQUENCE'], [['ECHO', '9,31'], ['ZETA', '1,75'], ['OMEGA', '10,42'], ['SOL', '4,58'], ['ATLAS', '7,93']], [80, 80], 9)
y -= 10
y = encadre(y, ['Si S-1 est en position basse : ajouter 1,00 à la fréquence.'])
c.showPage()
c.save(); print('ok')
