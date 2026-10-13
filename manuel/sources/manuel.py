import math, random
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A5
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import simpleSplit

F = '/home/claude/fonts/'
pdfmetrics.registerFont(TTFont('Elite', F + 'SpecialElite-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Cour', F + 'CourierPrime-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CourB', F + 'CourierPrime-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Main', F + 'Caveat.ttf'))

W, H = A5
M = 34
PAPIER = HexColor('#f1e8d2')
ENCRE = HexColor('#2b211c')
GRIS = HexColor('#6b5f55')
BIC = HexColor('#24448a')
TOLE = HexColor('#86ab9f')
TOLE_S = HexColor('#5f857a')
IVOIRE = HexColor('#efe6cf')
LAITON = HexColor('#b8893b')
BAKE = HexColor('#2b211c')
ORANGE = HexColor('#e98a1f')
ROUGE = HexColor('#d2372b')
VERT = HexColor('#4fb04c')
BLEU = HexColor('#3c6fa8')

random.seed(58)
c = canvas.Canvas('/mnt/user-data/outputs/manuel-de-vol-prototype.pdf', pagesize=A5)
c.setTitle('Manuel de vol — fusée de croisière C-58 (extrait prototype)')
c.setAuthor('Office national des vols interplanétaires')

page_no = [0]


def fond(numero=True):
    page_no[0] += 1
    c.setFillColor(PAPIER)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(Color(0.55, 0.45, 0.3, alpha=0.05))
    for _ in range(140):
        x, y, r = random.uniform(0, W), random.uniform(0, H), random.uniform(0.3, 1.4)
        c.circle(x, y, r, stroke=0, fill=1)
    if numero:
        c.setFillColor(GRIS)
        c.setFont('Cour', 8)
        c.drawCentredString(W / 2, 20, '— %d —' % page_no[0])
        c.drawString(M, 20, 'C-58')
        c.drawRightString(W - M, 20, 'O.N.V.I.')


def texte(x, y, s, font='Cour', size=9.5, width=None, lead=None, color=ENCRE):
    width = width or (W - 2 * M)
    lead = lead or size * 1.38
    c.setFont(font, size)
    c.setFillColor(color)
    for para in s.split('\n'):
        lines = simpleSplit(para, font, size, width) or ['']
        for ln in lines:
            c.drawString(x, y, ln)
            y -= lead
    return y


def titre(y, s, size=13):
    c.setFont('Elite', size)
    c.setFillColor(ENCRE)
    c.drawString(M, y, s)
    c.setStrokeColor(ENCRE)
    c.setLineWidth(0.8)
    c.line(M, y - 5, W - M, y - 5)
    return y - 22


def main(x, y, s, size=14, angle=-3, color=BIC, width=None, lead=None):
    c.saveState()
    c.translate(x, y)
    c.rotate(angle)
    c.setFont('Main', size)
    c.setFillColor(color)
    lead = lead or size * 1.05
    yy = 0
    for para in s.split('\n'):
        lines = simpleSplit(para, 'Main', size, width) if width else [para]
        for ln in lines:
            c.drawString(0, yy, ln)
            yy -= lead
    c.restoreState()


def fleche_main(x1, y1, x2, y2, color=BIC):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(0.9)
    p = c.beginPath()
    p.moveTo(x1, y1)
    p.curveTo(x1 + (x2 - x1) * 0.3, y1 + 12, x1 + (x2 - x1) * 0.7, y2 + 10, x2, y2)
    c.drawPath(p, stroke=1, fill=0)
    a = math.atan2(y2 - (y2 + 10), x2 - (x1 + (x2 - x1) * 0.7))
    for d in (0.5, -0.5):
        c.line(x2, y2, x2 - 6 * math.cos(a + d), y2 - 6 * math.sin(a + d))
    c.restoreState()


def tache_cafe(x, y, r):
    c.saveState()
    c.setStrokeColor(Color(0.45, 0.28, 0.12, alpha=0.22))
    for i in range(4):
        c.setLineWidth(2.2 - i * 0.4)
        c.circle(x + random.uniform(-1.5, 1.5), y + random.uniform(-1.5, 1.5), r - i * 1.2, stroke=1, fill=0)
    c.setFillColor(Color(0.45, 0.28, 0.12, alpha=0.05))
    c.circle(x, y, r - 2, stroke=0, fill=1)
    c.restoreState()


def tampon(x, y, s, angle=12, color=ROUGE):
    c.saveState()
    c.translate(x, y)
    c.rotate(angle)
    c.setStrokeColor(Color(color.red, color.green, color.blue, alpha=0.7))
    c.setFillColor(Color(color.red, color.green, color.blue, alpha=0.7))
    c.setLineWidth(1.6)
    w = pdfmetrics.stringWidth(s, 'Elite', 11) + 16
    c.roundRect(-w / 2, -9, w, 22, 3, stroke=1, fill=0)
    c.setFont('Elite', 11)
    c.drawCentredString(0, -2, s)
    c.restoreState()


# ---------- éléments du cockpit (dessins) ----------

def polar(cx, cy, r, a):
    t = math.radians(a)
    return cx + r * math.sin(t), cy + r * math.cos(t)


def jauge(cx, cy, R, zones):
    c.setFillColor(LAITON)
    c.circle(cx, cy, R, stroke=0, fill=1)
    c.setFillColor(IVOIRE)
    c.circle(cx, cy, R * 0.9, stroke=0, fill=1)
    for v1, v2, col in zones:
        c.setStrokeColor(col)
        c.setLineWidth(R * 0.11)
        a1, a2 = -120 + 2.4 * v1, -120 + 2.4 * v2
        p = c.beginPath()
        steps = 20
        for i in range(steps + 1):
            a = a1 + (a2 - a1) * i / steps
            x, y = polar(cx, cy, R * 0.72, a)
            if i == 0:
                p.moveTo(x, y)
            else:
                p.lineTo(x, y)
        c.drawPath(p, stroke=1, fill=0)
    c.setStrokeColor(ENCRE)
    for v in range(0, 101, 10):
        a = -120 + 2.4 * v
        big = v % 20 == 0
        c.setLineWidth(1.2 if big else 0.6)
        x1, y1 = polar(cx, cy, R * (0.62 if big else 0.68), a)
        x2, y2 = polar(cx, cy, R * 0.8, a)
        c.line(x1, y1, x2, y2)
        if big:
            tx, ty = polar(cx, cy, R * 0.46, a)
            c.setFont('Cour', R * 0.15)
            c.setFillColor(ENCRE)
            c.drawCentredString(tx, ty - R * 0.05, str(v))
    x, y = polar(cx, cy, R * 0.72, -10)
    c.setLineWidth(1.6)
    c.line(cx, cy, x, y)
    c.setFillColor(LAITON)
    c.circle(cx, cy, R * 0.08, stroke=0, fill=1)


def voyant(cx, cy, s, forme, col):
    c.setFillColor(col)
    if forme == 'tri':
        p = c.beginPath()
        p.moveTo(cx, cy + s * 0.55)
        p.lineTo(cx + s * 0.55, cy - s * 0.45)
        p.lineTo(cx - s * 0.55, cy - s * 0.45)
        p.close()
        c.drawPath(p, stroke=0, fill=1)
    elif forme == 'rond':
        c.circle(cx, cy, s * 0.5, stroke=0, fill=1)
    else:
        c.roundRect(cx - s * 0.45, cy - s * 0.45, s * 0.9, s * 0.9, 2, stroke=0, fill=1)


def levier(cx, cy, h, haut=True):
    c.setFillColor(BAKE)
    c.roundRect(cx - 3.5, cy - h / 2, 7, h, 3.5, stroke=0, fill=1)
    ky = cy + h / 2 - 6 if haut else cy - h / 2 + 6
    c.circle(cx, ky, 10, stroke=0, fill=1)


def molette(cx, cy, R, chiffre='5'):
    c.setFillColor(BAKE)
    c.circle(cx, cy, R, stroke=0, fill=1)
    c.setStrokeColor(HexColor('#5a4a40'))
    c.setLineWidth(2)
    c.setDash(1.2, 2)
    c.circle(cx, cy, R - 1.5, stroke=1, fill=0)
    c.setDash()
    c.setFillColor(HexColor('#3a2d26'))
    c.circle(cx, cy, R * 0.78, stroke=0, fill=1)
    for dx in (-0.28, 0.28):
        c.setFillColor(TOLE)
        c.circle(cx + dx * R, cy + 0.28 * R, R * 0.16, stroke=0, fill=1)
        c.setFillColor(BAKE)
        c.circle(cx + dx * R, cy + 0.28 * R, R * 0.07, stroke=0, fill=1)
    c.setFillColor(LAITON)
    p = c.beginPath()
    p.moveTo(cx - 3, cy)
    p.lineTo(cx + 3, cy)
    p.lineTo(cx, cy - 5)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.setFillColor(IVOIRE)
    c.setStrokeColor(BAKE)
    c.setLineWidth(1.5)
    c.rect(cx - 7, cy - R - 20, 14, 14, stroke=1, fill=1)
    c.setFillColor(ENCRE)
    c.setFont('Cour', 10)
    c.drawCentredString(cx, cy - R - 16.5, chiffre)


def bouton(cx, cy, R):
    c.setFillColor(LAITON)
    c.circle(cx, cy, R, stroke=0, fill=1)
    c.setFillColor(ROUGE)
    c.circle(cx, cy, R * 0.82, stroke=0, fill=1)


def compteur(cx, cy):
    w = 6 * 11 + 6
    c.setFillColor(BAKE)
    c.roundRect(cx - w / 2, cy - 8, w, 16, 2, stroke=0, fill=1)
    c.setFont('Cour', 9)
    for i in range(6):
        x = cx - w / 2 + 3 + i * 11
        c.setFillColor(IVOIRE)
        c.rect(x + 0.5, cy - 6, 9.5, 12, stroke=0, fill=1)
        c.setFillColor(ENCRE)
        c.drawCentredString(x + 5.2, cy - 3, '0')


def plaque(cx, cy, txt):
    w = pdfmetrics.stringWidth(txt, 'Cour', 7.5) + 8
    c.setFillColor(LAITON)
    c.rect(cx - w / 2, cy - 5, w, 10.5, stroke=0, fill=1)
    c.setFillColor(BAKE)
    c.setFont('Cour', 7.5)
    c.drawCentredString(cx, cy - 2.4, txt)


def repere(x, y, n, tx, ty):
    c.setStrokeColor(ENCRE)
    c.setLineWidth(0.5)
    c.line(x, y, tx, ty)
    c.setFillColor(PAPIER)
    c.circle(tx, ty, 7, stroke=1, fill=1)
    c.setFillColor(ENCRE)
    c.setFont('CourB', 8)
    c.drawCentredString(tx, ty - 2.8, str(n))


# ================= PAGE 1 : couverture =================
fond(numero=False)
c.setStrokeColor(ENCRE)
c.setLineWidth(1.2)
c.rect(M - 8, M - 8, W - 2 * M + 16, H - 2 * M + 16, stroke=1, fill=0)
c.setLineWidth(0.5)
c.rect(M - 4, M - 4, W - 2 * M + 8, H - 2 * M + 8, stroke=1, fill=0)
c.setFillColor(ENCRE)
c.setFont('Elite', 10)
c.drawCentredString(W / 2, H - 70, 'RÉPUBLIQUE FRANÇAISE')
c.drawCentredString(W / 2, H - 86, 'OFFICE NATIONAL DES VOLS INTERPLANÉTAIRES')
c.setLineWidth(0.8)
c.line(W / 2 - 60, H - 98, W / 2 + 60, H - 98)
c.setFont('Elite', 36)
c.drawCentredString(W / 2, H - 170, 'MANUEL')
c.drawCentredString(W / 2, H - 210, 'DE VOL')
c.setFont('Elite', 12)
c.drawCentredString(W / 2, H - 250, 'Fusée de croisière type C-58')
c.setFont('Cour', 9)
c.drawCentredString(W / 2, H - 268, 'Édition de 1961 — à l’usage des pilotes brevetés')
# petite fusée
cx, cy = W / 2, H - 345
c.setFillColor(ENCRE)
p = c.beginPath()
p.moveTo(cx, cy + 46)
p.curveTo(cx + 18, cy + 26, cx + 16, cy - 10, cx + 12, cy - 26)
p.lineTo(cx - 12, cy - 26)
p.curveTo(cx - 16, cy - 10, cx - 18, cy + 26, cx, cy + 46)
c.drawPath(p, stroke=0, fill=1)
for s in (-1, 1):
    p = c.beginPath()
    p.moveTo(cx + 12 * s, cy - 6)
    p.lineTo(cx + 26 * s, cy - 34)
    p.lineTo(cx + 12 * s, cy - 26)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
c.setFillColor(PAPIER)
c.circle(cx, cy + 14, 6, stroke=0, fill=1)
c.setFont('Elite', 9)
c.setFillColor(ENCRE)
c.drawCentredString(W / 2, 128, 'EXEMPLAIRE DE BORD N° 0007')
c.setFont('Cour', 8)
c.drawCentredString(W / 2, 114, 'Ne pas retirer de l’appareil.')
c.drawCentredString(W / 2, 70, 'Extrait — prototype de jeu')
tache_cafe(W - 92, 170, 34)
tampon(W - 100, H - 128, 'PÉRIMÉ', angle=14)
main(M + 6, 158, 'Pour le petit,\ns’il lit ça un jour.', size=15, angle=-6)
c.showPage()

# ================= PAGE 2 : le tableau de bord =================
fond()
y = titre(H - M - 6, 'I. LE TABLEAU DE BORD')
y = texte(M, y, 'Vue de face, depuis le siège du pilote. Chaque commande porte son code sur une plaque de laiton. Sa fonction est décrite dans la nomenclature, page suivante.', size=9)

px, pw = M + 20, W - 2 * M - 40
ptop = y - 10
ph = 330
pby = ptop - ph
c.setFillColor(TOLE)
c.setStrokeColor(TOLE_S)
c.setLineWidth(2)
c.roundRect(px, pby, pw, ph, 12, stroke=1, fill=1)
for rx, ry in ((px + 8, pby + 8), (px + pw - 8, pby + 8), (px + 8, ptop - 8), (px + pw - 8, ptop - 8)):
    c.setFillColor(TOLE_S)
    c.circle(rx, ry, 2.5, stroke=0, fill=1)

g1 = (px + pw * 0.27, ptop - 62)
g2 = (px + pw * 0.73, ptop - 62)
jauge(g1[0], g1[1], 48, [(0, 15, BLEU), (90, 100, ROUGE)])
jauge(g2[0], g2[1], 48, [(80, 100, ROUGE)])
vy = ptop - 138
v1 = (px + pw * 0.3, vy)
v2 = (px + pw * 0.5, vy)
v3 = (px + pw * 0.7, vy)
voyant(v1[0], v1[1], 18, 'tri', ORANGE)
voyant(v2[0], v2[1], 18, 'rond', ROUGE)
voyant(v3[0], v3[1], 18, 'carre', VERT)
ly = ptop - 200
la = (px + pw * 0.17, ly)
lb = (px + pw * 0.83, ly)
mo = (px + pw * 0.5, ly + 4)
levier(la[0], la[1], 62, True)
levier(lb[0], lb[1], 62, True)
molette(mo[0], mo[1], 30)
bt = (px + pw * 0.5, pby + 62)
bouton(bt[0], bt[1], 22)
cp = (px + pw * 0.5, pby + 20)
compteur(cp[0], cp[1])
plaque(g1[0], g1[1] - 56, 'M-1')
plaque(g2[0], g2[1] - 56, 'T-2')
plaque(v1[0], v1[1] - 17, 'V-1')
plaque(v2[0], v2[1] - 17, 'V-2')
plaque(v3[0], v3[1] - 17, 'V-3')
plaque(la[0], la[1] - 42, 'L-A')
plaque(lb[0], lb[1] - 42, 'L-B')
plaque(mo[0] + 20, mo[1] - 30 - 13, 'R')
plaque(bt[0] + 34, bt[1], 'P')

L, R_ = px - 12, px + pw + 12
repere(g1[0] - 40, g1[1] + 20, 1, L, g1[1] + 30)
repere(g2[0] + 40, g2[1] + 20, 2, R_, g2[1] + 30)
repere(v1[0] - 10, v1[1], 3, L, v1[1])
repere(v2[0], v2[1] + 10, 4, v2[0], v2[1] + 22)
repere(v3[0] + 10, v3[1], 5, R_, v3[1])
repere(la[0] - 10, la[1] + 25, 6, L, la[1] + 25)
repere(mo[0] + 30, mo[1] + 10, 7, mo[0] + 46, mo[1] + 30)
repere(lb[0] + 10, lb[1] + 25, 8, R_, lb[1] + 25)
repere(bt[0] - 22, bt[1], 9, L, bt[1])
repere(cp[0] + 36, cp[1], 10, R_, cp[1])

main(v3[0] + 20, v3[1] + 22, 'elle chante,\ncelle-là', size=13, angle=8)
y = pby - 22
texte(M, y, 'Les numéros renvoient à la nomenclature, page suivante.', size=8.5, color=GRIS)
tache_cafe(M + 40, 70, 26)
c.showPage()

# ================= PAGE 3 : nomenclature =================
fond()
y = titre(H - M - 6, 'II. NOMENCLATURE')
items = [
    ('1', 'M-1  Manomètre de chambre', 'Pression dans la chambre de combustion. Zone bleue : sous-pression. Zone rouge : surpression.'),
    ('2', 'T-2  Thermomètre de tuyère', 'Température de la tuyère. Zone rouge : surchauffe.'),
    ('3', 'V-1  Témoin de surchauffe', 'Triangle orange. Allumé fixe : voir procédure 1.'),
    ('4', 'V-2  Témoin de pression', 'Rond rouge. Clignotant, avec alarme sonore : voir procédure 2.'),
    ('5', 'V-3  Témoin de régime', 'Carré vert. Sans usage en vol de croisière.'),
    ('6', 'L-A  Levier d’injection', 'Position haute : injection ouverte. Position basse : injection coupée.'),
    ('7', 'R  Molette de mélange', 'Dix crans, de 0 à 9, lus dans la fenêtre. Chaque pression avance d’un cran ; après 9 vient 0. La pression de chambre suit le cran : plus il est élevé, plus elle monte.'),
    ('8', 'L-B  Levier de dérivation auxiliaire', 'Réservé à la maintenance au sol. Ne jamais manœuvrer en vol.'),
    ('9', 'P  Bouton de purge', 'Libère la pression de chambre. À n’utiliser que dans le cadre d’une procédure.'),
    ('10', 'Compteur de route', 'Distance parcourue depuis le départ, en milliers de kilomètres.'),
]
y8 = None
for n, nom, desc in items:
    if n == '8':
        y8 = y
    c.setStrokeColor(ENCRE)
    c.setLineWidth(0.5)
    c.setFillColor(PAPIER)
    c.circle(M + 7, y + 3, 7, stroke=1, fill=1)
    c.setFillColor(ENCRE)
    c.setFont('CourB', 8)
    c.drawCentredString(M + 7, y + 0.3, n)
    c.setFont('CourB', 9.5)
    c.drawString(M + 22, y, nom)
    y = texte(M + 22, y - 12, desc, size=8.8, width=W - 2 * M - 22) - 6

y = titre(y - 6, 'POSITIONS NOMINALES EN CROISIÈRE', size=11)
y = texte(M, y, 'L-A haut.   L-B haut.   R sur 5.\nM-1 vers 50.   T-2 vers 45.   Tous témoins éteints.', size=9.5)

main(M + 120, y - 30, 'L-B « jamais » ? On en reparlera.', size=14, angle=-3)

c.showPage()

# ================= PAGE 4 : procédures 1 et 2 =================
fond()
y = titre(H - M - 6, 'III. PROCÉDURES D’URGENCE')
c.setFont('CourB', 10.5)
c.setFillColor(ENCRE)
c.drawString(M, y, 'PROCÉDURE 1 — SURCHAUFFE DE TUYÈRE')
y = texte(M, y - 14, 'Symptôme : V-1 allumé fixe. L’aiguille de T-2 monte en zone rouge.', size=9)
steps = [
    'Abaisser L-A. L’injection est coupée ; la vitesse chute fortement.',
    'Surveiller T-2. Attendre que l’aiguille descende sous la graduation 60.',
    'Relever L-A.',
]
for i, st in enumerate(steps):
    c.setFont('CourB', 9.5)
    c.drawString(M + 4, y - 4, '%d.' % (i + 1))
    y = texte(M + 22, y - 4, st, size=9.2, width=W - 2 * M - 22) - 2
main(M + 160, y - 12, '60 ?? Mon œil. Attends 40,\nsinon elle te repart\ndans les dix secondes.', size=14, angle=-3)
y -= 70

c.setFont('CourB', 10.5)
c.setFillColor(ENCRE)
c.drawString(M, y, 'PROCÉDURE 2 — DÉFAUT DE PRESSION')
y = texte(M, y - 14, 'Symptôme : V-2 clignote, alarme sonore. Lire M-1, puis suivre la branche correspondante.', size=9)

top = y - 6
bw, bh = 132, 28
def boite(x, y0, s, w=bw, h=bh):
    c.setStrokeColor(ENCRE)
    c.setLineWidth(0.8)
    c.setFillColor(PAPIER)
    c.rect(x, y0, w, h, stroke=1, fill=1)
    lines = simpleSplit(s, 'Cour', 8.5, w - 8)
    c.setFillColor(ENCRE)
    c.setFont('Cour', 8.5)
    ty = y0 + h / 2 + (len(lines) - 1) * 5 - 3
    for ln in lines:
        c.drawCentredString(x + w / 2, ty, ln)
        ty -= 10
def trait(x1, y1, x2, y2):
    c.setStrokeColor(ENCRE)
    c.setLineWidth(0.8)
    c.line(x1, y1, x2, y2)
    c.line(x2, y2, x2 - 3, y2 + 5)
    c.line(x2, y2, x2 + 3, y2 + 5)

cx0 = W / 2
boite(cx0 - 60, top - bh, 'Aiguille de M-1 ?', w=120, h=22)
lx, rx = M + 4, W - M - bw - 4
yb = top - bh - 46
trait(cx0 - 30, top - bh, lx + bw / 2, yb + bh)
trait(cx0 + 30, top - bh, rx + bw / 2, yb + bh)
c.setFont('Cour', 8)
c.setFillColor(ROUGE)
c.drawString(lx, yb + bh + 6, 'zone rouge')
c.setFillColor(BLEU)
c.drawRightString(rx + bw, yb + bh + 6, 'zone bleue')
c.setFillColor(ENCRE)
seq_g = ['Surpression', 'Placer R sur 2', 'Presser P une fois', 'Replacer R sur 5']
seq_d = ['Sous-pression', 'Placer R sur 7', 'Presser P une fois', 'Replacer R sur 5']
for i in range(4):
    yy = yb - i * (bh + 10)
    boite(lx, yy, seq_g[i])
    boite(rx, yy, seq_d[i])
    if i < 3:
        trait(lx + bw / 2, yy, lx + bw / 2, yy - 10)
        trait(rx + bw / 2, yy, rx + bw / 2, yy - 10)
y = yb - 3 * (bh + 10) - 16
y = texte(M, y, 'Attention : toute pression sur P hors procédure provoque une purge à vide et une perte de pression.', size=8.5, color=GRIS)
main(M + 8, y - 8, 'Et remets la molette sur 5 sans traîner, sinon\ntu repars direct dans le bleu. Vécu.', size=13.5, angle=-1.5)
c.showPage()

# ================= PAGE 5 : procédure 3 =================
fond()
y = titre(H - M - 6, 'III. PROCÉDURES D’URGENCE (suite)')
c.setFont('CourB', 10.5)
c.setFillColor(ENCRE)
c.drawString(M, y, 'PROCÉDURE 3 — DÉFAUTS SIMULTANÉS')
y = texte(M, y - 14, 'Symptôme : V-1 et V-2 allumés en même temps.', size=9)
y = texte(M, y - 4, '1. Appliquer la procédure 1 en entier.\n2. Seulement ensuite, appliquer la procédure 2.', size=9.2)
y -= 6
c.setStrokeColor(ROUGE)
c.setLineWidth(1.2)
box_top = y + 4
lines = simpleSplit('Une purge (P) pendant une surchauffe provoque un emballement de tuyère. Le pilote ne doit en aucun cas presser P tant que V-1 est allumé.', 'CourB', 9, W - 2 * M - 20)
bh2 = len(lines) * 12.5 + 14
c.rect(M, box_top - bh2, W - 2 * M, bh2, stroke=1, fill=0)
c.setFillColor(ROUGE)
c.setFont('CourB', 9)
yy = box_top - 14
for ln in lines:
    c.drawString(M + 10, yy, ln)
    yy -= 12.5
y = box_top - bh2 - 20
main(M + 150, y - 4, 'Pour une fois, ils ont raison.\nJ’ai encore la bosse.', size=14, angle=-2)
y -= 60

y = titre(y, 'IV. GÉNÉRALITÉS', size=11)
y = texte(M, y, 'Tant qu’un témoin reste allumé, la fusée perd de la vitesse. Une avarie non traitée ne met pas l’appareil en danger immédiat, mais retarde l’arrivée.\n\nLe pilote ramène les commandes en position nominale à la fin de chaque procédure.\n\nToute modification du régime moteur hors procédure officielle est formellement interdite et engage la responsabilité personnelle du pilote.', size=9)
main(M + 20, y - 22, 'Ben voyons.\n→ voir mon carnet, au dos.', size=15, angle=-5)
c.showPage()

# ================= PAGE 6 : carnet du grand-père =================
fond()
cx0, cy0 = W / 2, H / 2 + 6
c.saveState()
c.translate(cx0, cy0)
c.rotate(1.6)
nw, nh = W - 2 * M + 4, H - 2 * M - 30
c.setFillColor(Color(0, 0, 0, alpha=0.12))
c.rect(-nw / 2 + 4, -nh / 2 - 4, nw, nh, stroke=0, fill=1)
c.setFillColor(HexColor('#fbf6e9'))
c.rect(-nw / 2, -nh / 2, nw, nh, stroke=0, fill=1)
c.setStrokeColor(HexColor('#a9c1d9'))
c.setLineWidth(0.5)
for i in range(1, 30):
    yl = nh / 2 - 34 - i * 17
    if yl < -nh / 2 + 10:
        break
    c.line(-nw / 2 + 6, yl, nw / 2 - 6, yl)
c.setStrokeColor(HexColor('#e2a3a3'))
c.line(-nw / 2 + 30, -nh / 2, -nw / 2 + 30, nh / 2)
c.setFillColor(Color(0.85, 0.8, 0.6, alpha=0.6))
c.rect(-30, nh / 2 - 8, 60, 18, stroke=0, fill=1)
c.restoreState()

x0 = M + 36
yt = H - M - 52
main(x0, yt, 'Pour faire cracher la bête', size=22, angle=1.6, color=ENCRE)
corps = [
    'Les gars de l’Office diront que c’est interdit. Les gars de l’Office n’ont jamais quitté le plancher des vaches.',
    '1. Tourne le hibou jusqu’au bout. Pas un cran de plus : il repart à zéro, l’animal.',
    '2. Baisse la queue de casserole. Oui, celle-là. Celle qu’il ne faut jamais toucher.',
    '3. La marmite va chauffer. Laisse-la monter, ne panique pas.',
    '4. Quand la grenouille chante : deux pichenettes sur le nez de clown. Pas une. Pas trois. Deux.',
    '5. Et là, vite : remonte la queue de casserole et remets le hibou à sa place. Si la marmite déborde, tant pis pour toi.',
    'Ça pousse, hein ?',
]
yy = yt - 34
for para in corps:
    lines = simpleSplit(para, 'Main', 14.5, W - 2 * M - 46)
    c.saveState()
    c.translate(0, 0)
    for ln in lines:
        main(x0, yy, ln, size=14.5, angle=1.6, color=BIC)
        yy -= 17
    c.restoreState()
    yy -= 6
main(x0 + 10, yy - 10, '(Ça marche deux fois. La troisième,\nla vieille ne veut plus rien savoir.)', size=13.5, angle=1, color=BIC)
tache_cafe(W - M - 50, M + 58, 30)
c.showPage()

# ================= PAGE 7 : notes de bord =================
fond()
y = titre(H - M - 6, 'NOTES DE BORD')
c.setStrokeColor(Color(0.42, 0.37, 0.33, alpha=0.5))
c.setLineWidth(0.4)
yl = y - 6
while yl > M + 16:
    c.line(M, yl, W - M, yl)
    yl -= 19
c.showPage()
c.save()
print('ok')
