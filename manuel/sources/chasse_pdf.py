import math, random
exec(open('/home/claude/manuel.py').read().split("# ================= PAGE 1")[0].replace("/mnt/user-data/outputs/manuel-de-vol-prototype.pdf","/mnt/user-data/outputs/manuel-de-vol-chasse-v2.pdf"))
c.setTitle('Manuel de vol — recherche des visiteurs')
page_no[0] = 17
def tableau(x, y, cols, rows, widths, size=9, head=True):
    rh = size + 9
    for j, row in enumerate([cols] + rows if head else rows):
        xx = x
        for k, cell in enumerate(row):
            c.setStrokeColor(ENCRE); c.setLineWidth(.6); c.rect(xx, y - rh, widths[k], rh, stroke=1, fill=0)
            c.setFont('CourB' if (head and j == 0) else 'Cour', size); c.setFillColor(ENCRE); c.drawString(xx + 4, y - rh + 5, str(cell)); xx += widths[k]
        y -= rh
    return y
fond()
y = titre(H - M - 6, 'XVIII. RECHERCHE DES VISITEURS')
y = texte(M, y, 'Les visiteurs ne figurent sur aucune carte. Un seul croise le système solaire à la fois, pendant une SAISON de 14 jours ; puis un autre lui succède. Tous les pilotes chassent le même.', size=9)
y -= 4
c.setFont('CourB', 10); c.setFillColor(ENCRE); c.drawString(M, y, 'RADIO — LE PING (RAD-1)'); y -= 14
y = texte(M, y, 'Les visiteurs ne répondent que sur 7,13. Régler la radio, presser PING. L’écho revient au vrai rythme de la lumière : il faut parfois l’attendre longtemps. Le délai est un aller-retour, mesuré depuis la position de la fusée à l’émission.', size=9)
y -= 2
c.setFont('CourB', 9.5); c.drawString(M, y, 'Distance (UA) = délai de l’écho (minutes) ÷ 16,6'); y -= 6
y = tableau(M, y, ['ÉCHO', '8 min 18 s', '16 min 38 s', '33 min', '50 min', '1 h 23', '2 h 46'], [['DISTANCE', '0,5 UA', '1 UA', '2 UA', '3 UA', '5 UA', '10 UA']], [58, 52, 58, 42, 42, 42, 42], 7.5)
y -= 10
c.setFont('CourB', 10); c.drawString(M, y, 'TÉLESCOPE (TEL)'); y -= 14
y = texte(M, y, 'Portée : 3 UA. Donne une direction, jamais une distance, à 3° près, comptée comme le cap. Une visée toutes les 30 minutes.', size=9)
y -= 4
c.setFont('CourB', 10); c.drawString(M, y, 'OBSERVATOIRE ET TRANSMISSIONS'); y -= 14
y = texte(M, y, 'Toutes les 6 heures, l’Observatoire signale la planète dont les lunes sont perturbées. Le bulletin a 6 heures de retard. Les transmissions interceptées sont des témoignages non vérifiés.', size=9)
y -= 4
c.setFont('CourB', 10); c.drawString(M, y, 'TRAÇAGE ET CONTACT'); y -= 14
y = texte(M, y, 'Sous la carte, tracer un cercle autour du dernier ping (rayon en UA) et une droite depuis la dernière visée. Le contact est établi à moins de 0,01 UA (1,5 million de km). DET rend le visiteur visible à moins de 1,5 UA.', size=9)
c.showPage()

fond()
cx0, cy0 = W / 2, H / 2 + 6
c.saveState(); c.translate(cx0, cy0); c.rotate(-1.2)
nw, nh = W - 2 * M + 4, H - 2 * M - 30
c.setFillColor(Color(0, 0, 0, alpha=0.12)); c.rect(-nw / 2 + 4, -nh / 2 - 4, nw, nh, stroke=0, fill=1)
c.setFillColor(HexColor('#fbf6e9')); c.rect(-nw / 2, -nh / 2, nw, nh, stroke=0, fill=1)
c.setStrokeColor(HexColor('#a9c1d9')); c.setLineWidth(0.5)
for i in range(1, 30):
    yl = nh / 2 - 34 - i * 17
    if yl < -nh / 2 + 10: break
    c.line(-nw / 2 + 6, yl, nw / 2 - 6, yl)
c.setStrokeColor(HexColor('#e2a3a3')); c.line(-nw / 2 + 30, -nh / 2, -nw / 2 + 30, nh / 2)
c.restoreState()
x0 = M + 36; yt = H - M - 52
main(x0, yt, 'Ce que je sais d’eux', size=22, angle=-1.2, color=ENCRE)
corps = ['Ils ne tiennent pas en place. Une journée près d’une planète, à peu près, puis ils filent.',
         'Ils vont toujours à la planète la plus proche. Jamais vers l’une de leurs deux dernières escales.',
         'Ils ne vont jamais plus loin que Saturne. Trop froid, sans doute.',
         'Entre deux planètes, quelques jours au plus. Ils sont rapides. Toi, non.',
         'Quand l’Observatoire dit qu’une planète tremble, souviens-toi qu’il a six heures de retard.',
         'Ne le poursuis pas, tu n’as aucune chance. Devine où il va, et attends-le.']
yy = yt - 36
for para in corps:
    for ln in simpleSplit(para, 'Main', 14.5, W - 2 * M - 46):
        main(x0, yy, ln, size=14.5, angle=-1.2, color=BIC); yy -= 17
    yy -= 7
main(x0 + 120, yy - 10, '1958. Je l’ai entendu.\nPersonne ne m’a cru.', size=13.5, angle=-4, color=BIC)
c.showPage(); c.save(); print('ok')
