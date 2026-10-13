import math, random
exec(open('/home/claude/manuel.py').read().split("# ================= PAGE 1")[0].replace("/mnt/user-data/outputs/manuel-de-vol-prototype.pdf","/mnt/user-data/outputs/manuel-de-vol-modules-3.pdf"))
c.setTitle('Manuel de vol — modules CR-1, SX-1, AN-1')
page_no[0] = 14
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

# XV : CR-1
fond()
y = titre(H - M - 6, 'XV. CR-1 — CHRONOMÈTRE DE BORD')
y = texte(M, y, 'Le chronomètre de bord doit indiquer l’heure de l’Office : l’heure UTC (temps universel), corrigée selon l’appareil. En cas de dérive, il affiche une heure fausse et le bloc passe en avarie.', size=9)
y -= 4
y = etapes(y, ['Prendre l’heure locale sur une montre ou un téléphone.', 'La convertir en heure UTC (tableau).', 'Ajouter autant de minutes que le dernier chiffre du n° de série.', 'Régler heures et minutes avec H+ H− M+ M−, puis presser RECALER. Une minute d’écart est tolérée.'])
y -= 6
y = tableau(M, y, ['LIEU', 'HEURE UTC ='], [['France (heure d’hiver)', 'heure locale − 1 h'], ['France (heure d’été)', 'heure locale − 2 h'], ['La Réunion', 'heure locale − 4 h'], ['Martinique, Guadeloupe', 'heure locale + 4 h'], ['Québec (heure d’hiver)', 'heure locale + 5 h'], ['Québec (heure d’été)', 'heure locale + 4 h']], [175, 160], 9)
y -= 12
y = texte(M, y, 'Exemple : à Paris en hiver, il est 15 h 20. UTC : 14 h 20. N° de série terminé par 7 : régler 14 h 27.', size=8.5, color=GRIS)
main(M + 150, y - 24, 'L’Office vit à l’heure de Greenwich.\nPas toi. Fais le calcul.', size=14, angle=-3)
c.showPage()

# XVI : SX-1
fond()
y = titre(H - M - 6, 'XVI. SX-1 — SEXTANT')
y = texte(M, y, 'En cas de dérive de navigation, le bloc SX-1 affiche le nom d’une étoile de référence. Le pilote vise cette étoile, puis presse RELEVÉ.', size=9)
y -= 4
y = etapes(y, ['Lire le nom de l’étoile affichée.', 'Si le dernier chiffre du n° de série est IMPAIR, viser plutôt l’étoile qui la suit dans le tableau (après FOMALHAUT : SIRIUS).', 'Régler l’azimut et la hauteur du sextant sur les coordonnées du tableau. L’étoile doit apparaître au centre du réticule.', 'Presser RELEVÉ.'])
y -= 6
etoiles = [('SIRIUS', '104', '−40'), ('VÉGA', '285', '+62'), ('BÉTELGEUSE', '89', '−16'), ('ARCTURUS', '204', '+31'), ('ANTARÈS', '250', '−5'), ('RÉGULUS', '150', '0'),
           ('SPICA', '204', '−2'), ('ALDÉBARAN', '70', '−5'), ('ALTAÏR', '302', '+29'), ('POLLUX', '113', '+7'), ('DENEB', '335', '+60'), ('FOMALHAUT', '334', '−21')]
y = tableau(M, y, ['ÉTOILE', 'AZIMUT (°)', 'HAUTEUR (°)'], [list(e) for e in etoiles], [120, 100, 100], 9)
y -= 8
y = texte(M, y, 'Coordonnées écliptiques réelles. Azimut compté comme le cap ; hauteur positive au-dessus du plan des planètes. Tolérance : 1,5°.', size=8.5, color=GRIS)
main(M + 180, y - 20, 'Les vraies étoiles.\nElles, au moins, ne bougent pas.', size=14, angle=-3)
c.showPage()

# XVII : AN-1
fond()
y = titre(H - M - 6, 'XVII. AN-1 — ANTENNE ORIENTABLE')
y = texte(M, y, 'L’antenne maintient la liaison avec la Terre. Quand elle décroche, le bloc AN-1 passe en avarie : il faut la réorienter vers la Terre, dont la direction change au fil du voyage.', size=9)
y -= 4
y = etapes(y, ['Trouver la direction de la Terre vue de la fusée : sur la carte de navigation, tracer mentalement la ligne de C-58 vers la Terre et la lire sur le cadran gradué autour de C-58.',
               'Si S-3 est en position basse, l’antenne est montée à l’envers : ajouter 180° (et retirer 360° si besoin).',
               'Régler l’orientation avec la molette de l’antenne, puis presser VERROUILLER. Tolérance : 5°.'])
y -= 8
y = encadre(y, ['La liaison ne décroche jamais près de la Terre', '(moins de 3 millions de km).'])
y = texte(M, y, 'Rappel : 0° vers la droite de la carte, les angles croissent dans le sens inverse des aiguilles d’une montre, comme pour le cap.', size=8.5, color=GRIS)
y -= 10
c.setFont('CourB', 10); c.setFillColor(ENCRE); c.drawString(M, y, 'PANNES MULTIPLES'); y -= 14
y = texte(M, y, 'L’ordre alphabétique des cascades inclut désormais AN, CR et SX : AL, AN, CH, CO, CR, HY, LP, MO, PB, SX, TU.', size=9)
main(M + 150, y - 26, 'Plus tu t’éloignes,\nplus ta mère te paraît petite.', size=14, angle=-3)
c.showPage()
c.save(); print('ok')
