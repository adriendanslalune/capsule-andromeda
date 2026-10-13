import math, random
exec(open('/home/claude/manuel.py').read().split("# ================= PAGE 1")[0].replace("/mnt/user-data/outputs/manuel-de-vol-prototype.pdf","/mnt/user-data/outputs/manuel-de-vol-modules.pdf"))
c.setTitle('Manuel de vol — modules AL-1, CO-1, PB-1')
page_no[0] = 5

def tableau(x, y, cols, rows, widths, size=9, head=True):
    rh = size + 9
    for j, row in enumerate([cols] + rows if head else rows):
        xx = x
        for k, cell in enumerate(row):
            c.setStrokeColor(ENCRE); c.setLineWidth(.6)
            c.rect(xx, y - rh, widths[k], rh, stroke=1, fill=0)
            c.setFont('CourB' if (head and j == 0) else 'Cour', size)
            c.setFillColor(ENCRE)
            c.drawString(xx + 4, y - rh + 5, str(cell))
            xx += widths[k]
        y -= rh
    return y

# ---------- VI : plaque et repères ----------
fond()
y = titre(H - M - 6, 'VI. PLAQUE CONSTRUCTEUR ET REPÈRES')
y = texte(M, y, 'Plusieurs procédures dépendent de l’état du bord. Avant toute intervention, le pilote relève les repères suivants.', size=9)
y -= 6
c.setFont('CourB', 10); c.drawString(M, y, 'NUMÉRO DE SÉRIE'); y -= 14
y = texte(M, y, 'Gravé sur la plaque constructeur du panneau. Il est propre à chaque appareil. Exemple : KE4-71B.', size=9)
# plaque dessinée
c.setFillColor(HexColor('#b8893b')); c.setStrokeColor(ENCRE); c.setLineWidth(1)
c.roundRect(M + 40, y - 52, 240, 44, 4, stroke=1, fill=1)
c.setFillColor(ENCRE); c.setFont('Cour', 7.5); c.drawCentredString(M + 160, y - 22, 'O.N.V.I. — FUSÉE DE CROISIÈRE C-58')
c.setFont('CourB', 12); c.drawCentredString(M + 160, y - 40, 'N° SÉRIE  KE4-71B')
for sx, sy in ((M + 47, y - 15), (M + 273, y - 15), (M + 47, y - 45), (M + 273, y - 45)):
    c.setFillColor(PAPIER); c.circle(sx, sy, 2.2, stroke=1, fill=1)
y -= 66
y = texte(M, y, '« Dernier chiffre » : le dernier chiffre lu dans le numéro (ici 1, donc impair).\n« Commence par une voyelle » : A, E, I, O, U ou Y en première lettre.', size=9)
y -= 8
c.setFont('CourB', 10); c.drawString(M, y, 'INTERRUPTEURS S-1 À S-4 (BLOC AL-1)'); y -= 14
y = texte(M, y, 'Chaque interrupteur est en position HAUTE ou BASSE. S-4 commande l’alimentation des fusibles : en position basse, le circuit est coupé.', size=9)
y -= 8
c.setFont('CourB', 10); c.drawString(M, y, 'RÉCOMPENSES DE L’OFFICE'); y -= 14
y = texte(M, y, 'Toute réparation réussie est rémunérée : 2 CR (CH-1, TU-1), 5 CR (AL-1), 8 CR (CO-1), 10 CR (PB-1).', size=9)
main(M + 120, y - 26, 'Note-le quelque part, ce numéro.\nTu en auras besoin tout le temps.', size=14, angle=-3)
c.showPage()

# ---------- VII : AL-1 ----------
fond()
y = titre(H - M - 6, 'VII. AL-1 — FUSIBLES')
y = texte(M, y, 'Symptôme : un fusible grillé (fenêtre noire), bloc AL-1 en avarie. Chaque fusible porte une bague de couleur : BLEU, ROUGE, VERT ou JAUNE.', size=9)
y -= 4
steps = ['Couper l’alimentation : S-4 en position basse.',
         'Retirer le fusible grillé (le toucher).',
         'Choisir un fusible neuf dans la boîte de rechange, selon la règle ci-dessous, puis toucher l’emplacement vide pour l’insérer.',
         'Rétablir l’alimentation : S-4 en position haute.']
for i, st in enumerate(steps):
    c.setFont('CourB', 9.5); c.setFillColor(ENCRE); c.drawString(M + 4, y - 4, '%d.' % (i + 1))
    y = texte(M + 22, y - 4, st, size=9.2, width=W - 2 * M - 22) - 2
y -= 8
c.setFont('CourB', 10); c.drawString(M, y, 'COULEUR DU FUSIBLE NEUF'); y -= 14
y = texte(M, y, 'Dernier chiffre du n° de série PAIR : même couleur que le fusible grillé.\nDernier chiffre IMPAIR : couleur suivante dans l’ordre :', size=9)
y -= 4
xs = M + 2
for k, (nom, col) in enumerate((('BLEU', BLEU), ('ROUGE', ROUGE), ('VERT', VERT), ('JAUNE', HexColor('#d9a94a')))):
    c.setFillColor(col); c.setStrokeColor(ENCRE); c.rect(xs + k * 74, y - 22, 52, 18, stroke=1, fill=1)
    c.setFillColor(PAPIER); c.setFont('CourB', 8.5); c.drawCentredString(xs + k * 74 + 26, y - 16, nom)
    c.setFillColor(ENCRE); c.setFont('CourB', 12); c.setFont('CourB', 9); c.drawString(xs + k * 74 + 57, y - 17, '>' if k < 3 else '> BLEU')
y -= 34
c.setStrokeColor(ROUGE); c.setLineWidth(1.2)
c.rect(M, y - 36, W - 2 * M, 36, stroke=1, fill=0)
c.setFillColor(ROUGE); c.setFont('CourB', 9)
c.drawString(M + 8, y - 15, 'EXCEPTION : si S-1 est en position basse,')
c.drawString(M + 8, y - 28, 'le fusible neuf est TOUJOURS JAUNE.')
y -= 50
y = texte(M, y, 'Toute manipulation de fusible sous tension (S-4 haut) provoque une décharge. Un fusible de mauvaise couleur grille aussitôt.', size=8.5, color=GRIS)
main(M + 140, y - 22, 'Une étincelle, ça réveille.\nDeux, ça énerve.', size=14, angle=-3)
c.showPage()

# ---------- VIII : CO-1 ----------
fond()
y = titre(H - M - 6, 'VIII. CO-1 — CODEUR')
y = texte(M, y, 'Symptôme : un mot de code apparaît sur la bande du codeur, bloc CO-1 en avarie. Le pilote compose la réponse sur le cadran, puis presse ÉMETTRE.', size=9)
y -= 4
mots = [('ORION', '4721'), ('VESTA', '3058'), ('ATLAS', '1946'), ('CERES', '8203'), ('TITAN', '6390'), ('ARGOS', '2584'), ('DELTA', '7162'), ('HYDRE', '9035'), ('CYGNE', '1478'), ('PERSE', '5609'),
        ('ALGOL', '3317'), ('RIGEL', '8842'), ('SIRIUS', '2205'), ('ALTAIR', '6671'), ('DENEB', '4096'), ('MIRA', '7350'), ('CASTOR', '1189'), ('POLLUX', '9512'), ('ANTARES', '3724'), ('CAPELLA', '5863')]
half = 10
y0 = y
tableau(M, y0, ['MOT', 'CODE'], [list(m) for m in mots[:half]], [80, 55], 9)
tableau(M + 175, y0, ['MOT', 'CODE'], [list(m) for m in mots[half:]], [80, 55], 9)
y = y0 - 11 * 18 - 12
c.setFont('CourB', 10); c.setFillColor(ENCRE); c.drawString(M, y, 'CORRECTIONS (dans cet ordre)'); y -= 14
y = texte(M, y, '1. Si le n° de série commence par une voyelle : inverser l’ordre des quatre chiffres.\n2. Si S-3 est en position basse : ajouter 1 au dernier chiffre (9 devient 0).', size=9)
y -= 4
y = texte(M, y, 'Le bouton EFFACER remet la saisie à zéro. Un code faux est refusé : recommencer.', size=8.5, color=GRIS)
main(M + 150, y - 22, 'Le téléphone de grand-mère,\nen plus pénible.', size=14, angle=-2)
c.showPage()

# ---------- IX : PB-1 ----------
fond()
y = titre(H - M - 6, 'IX. PB-1 — TABLEAU DE BRASSAGE')
y = texte(M, y, 'Le tableau compte cinq prises de départ (A-1 à A-5, en haut) et cinq prises d’arrivée (B-1 à B-5, en bas), reliées par trois câbles : ROUGE, BLEU et JAUNE.', size=9)
y = texte(M, y - 2, 'Symptôme : un témoin de couleur clignote. Le câble de cette couleur est défectueux et doit être déplacé.', size=9)
y -= 4
steps = ['Débrancher le câble défectueux (toucher l’une de ses fiches).', 'Le rebrancher : toucher d’abord la prise A, puis la prise B indiquées par le tableau.']
for i, st in enumerate(steps):
    c.setFont('CourB', 9.5); c.setFillColor(ENCRE); c.drawString(M + 4, y - 4, '%d.' % (i + 1))
    y = texte(M + 22, y - 4, st, size=9.2, width=W - 2 * M - 22) - 2
y -= 6
y = tableau(M, y, ['CÂBLE', 'DERNIER CHIFFRE PAIR', 'IMPAIR'], [['ROUGE', 'A-1 vers B-4', 'A-2 vers B-5'], ['BLEU', 'A-3 vers B-1', 'A-5 vers B-2'], ['JAUNE', 'A-4 vers B-3', 'A-1 vers B-2']], [70, 135, 130], 9)
y -= 12
c.setStrokeColor(ROUGE); c.setLineWidth(1.2)
c.rect(M, y - 50, W - 2 * M, 50, stroke=1, fill=0)
c.setFillColor(ROUGE); c.setFont('CourB', 9)
c.drawString(M + 8, y - 15, 'EXCEPTION : si une prise indiquée est déjà')
c.drawString(M + 8, y - 28, 'occupée, prendre la prise suivante libre de la')
c.drawString(M + 8, y - 41, 'même rangée (après 5, revenir à 1).')
y -= 64
# schéma des prises
for k in range(5):
    for row, yy, lab in ((0, y - 10, 'A'), (1, y - 70, 'B')):
        cx = M + 50 + k * 60
        c.setFillColor(ENCRE); c.circle(cx, yy, 8, stroke=0, fill=1); c.setFillColor(PAPIER); c.circle(cx, yy, 3.5, stroke=0, fill=1)
        c.setFillColor(ENCRE); c.setFont('CourB', 8); c.drawCentredString(cx, yy + (13 if row == 0 else -19), '%s-%d' % (lab, k + 1))
main(M + 160, y - 110, 'Ne tire pas sur le fil.\nTire sur la fiche.', size=14, angle=-3)
c.showPage()
c.save()
print('ok')
