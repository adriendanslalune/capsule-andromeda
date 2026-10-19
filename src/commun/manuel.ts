// Le Manuel (dans « Plus », et depuis le panneau de réparation ; maquette validée par Adrien le 18/10/2026) : un manuel de maintenance façon NASA des
// années 60, sur vieux papier crème. Il lit les mêmes données que le panneau (src/donnees/manuel-*.ts) : ce qui y est
// écrit est exactement ce que le jeu attend. Une section par bloc du panneau ; pour l'instant : le sommaire, la
// section 1 (Communications) et la section 2 (Énergie).

import {
  COMBINAISONS, LEVIERS, SYMBOLES_SOUPAPE, TEINTES_INJECTEURS, TEXTES_INJECTEURS, ZONE_ROUGE, ZONES_PURGE,
} from '../donnees/manuel-moteur'
import { CABLAGE, CABLES, CHIFFRES_GYRO, DISJONCTEURS, LES_BUS, SYMBOLES_GYRO, VOYANTS } from '../donnees/depannage'
import {
  BORNES, CODES_ENERGIE, COULEURS_ACCUS, ORDRES_COUPLAGE, PREFIXE_R4_INVERSEE, REGLES, TEINTES_ACCUS, TEINTES_TEMOIN, TEMOINS,
  TEXTES_FUSIBLES, TEXTES_REGLES,
} from '../donnees/manuel-energie'
import {
  ANGLES_ANTENNE, BANDES, COLONNES_CHIFFREUR, MORSE, MOTS_TELEGRAPHE, STATIONS, texteFrequence,
} from '../donnees/manuel-communications'

/** Une feuille du manuel, avec son en-tête et son pied de page. */
function feuille(doc: string, titre: string, page: string, contenu: string, tampon = false): string {
  return `<div class="feuille">
    <div class="entete-doc">
      <div>CAPSULE ANDROMEDA — MANUEL DE MAINTENANCE</div><div>DOC. ${doc}</div>
      <div>${titre}</div><div>RÉV. C · 03/2026</div>
    </div>
    ${tampon ? '<span class="tampon">CONFIDENTIEL</span>' : ''}
    ${contenu}
    <div class="pied-doc"><span>${doc} RÉV. C</span><span>PAGE ${page}</span><span>NE PAS EMPORTER EN EVA</span></div>
  </div>`
}

/** Une procédure numérotée (« ☐ 1.1.1 »). */
function procedure(numero: string, etapes: string[]): string {
  return '<ol>' + etapes.map((e, k) => `<li><b>☐ ${numero}.${k + 1}</b><span>${e}</span></li>`).join('') + '</ol>'
}

function attention(texte: string): string {
  return `<div class="attention"><div class="bandeau-att">ATTENTION</div><div class="contenu-att">${texte}</div></div>`
}

/** Deux colonnes côte à côte dans un tableau (pour les longues listes). */
function enDeuxColonnes<T>(liste: readonly T[], cellules: (x?: T) => string): string {
  const moitie = Math.ceil(liste.length / 2)
  return Array.from({ length: moitie }, (_, k) => `<tr>${cellules(liste[k])}${cellules(liste[k + moitie])}</tr>`).join('')
}

function sectionCommunications(): string {
  const signes = (m: string) => [...m].map((s) => (s === '.' ? '•' : '▬')).join(' ')
  const lignesMorse = enDeuxColonnes(Object.entries(MORSE), (e) => (e ? `<td><b>${e[0]}</b></td><td class="morse">${signes(e[1])}</td>` : '<td></td><td></td>'))
  const lignesMots = enDeuxColonnes(MOTS_TELEGRAPHE, (m) => (m ? `<td>${m.mot}</td><td>${texteFrequence(m.frequence)}</td>` : '<td></td><td></td>'))
  const lignesStations = STATIONS.map((s, k) => `<tr><td class="symbole-manuel">${s.symbole}</td><td class="gauche">${s.nom}</td>${ANGLES_ANTENNE[k].map((a) => `<td>${a}°</td>`).join('')}</tr>`).join('')
  const lignesColonnes = Array.from({ length: 7 }, (_, i) => `<tr><td>${i + 1}</td>${COLONNES_CHIFFREUR.map((c) => `<td class="symbole-manuel">${c[i]}</td>`).join('')}</tr>`).join('')
  return feuille('CA-MM-01', 'SECTION 1 — BLOC COMMUNICATIONS', '1-2', `
    <h3>1.1 Module 1A — Télégraphe</h3>
    ${attention('Une émission sur une mauvaise fréquence brouille le poste : module bloqué 30 secondes.')}
    ${procedure('1.1', [
      'Observer la <b>lampe</b> du télégraphe : elle clignote un <b>mot</b> en morse, en boucle. Un éclat bref : un point ; un éclat long : un trait. Une pause longue sépare deux lettres ; une pause très longue, la fin du mot.',
      'Retrouver les lettres dans le <b>TABLEAU 1-1</b>. Quelques lettres suffisent souvent à reconnaître le mot.',
      'Chercher le mot dans le <b>TABLEAU 1-2</b> : il donne la <b>fréquence</b> de réponse.',
      'Tourner le <b>cadran</b> jusqu\'à cette fréquence (écran en MHz), puis appuyer sur <b>ÉMETTRE</b>.',
    ])}
    <table><caption>TABLEAU 1-1 — ALPHABET MORSE</caption>
      <tr><th>L.</th><th>SIGNES</th><th>L.</th><th>SIGNES</th></tr>${lignesMorse}</table>
    <table><caption>TABLEAU 1-2 — FRÉQUENCES DE RÉPONSE (MHz)</caption>
      <tr><th>MOT</th><th>FRÉQ.</th><th>MOT</th><th>FRÉQ.</th></tr>${lignesMots}</table>

    <h3>1.2 Module 1B — Antenne</h3>
    ${procedure('1.2', [
      'Lire le <b>symbole</b> de la station sur la plaque émaillée, et la <b>bande</b> (A, B ou C) sur l\'écran du module.',
      'Le <b>TABLEAU 1-3</b> donne l\'<b>angle</b> de l\'antenne pour cette station et cette bande (0° : vers le haut, sens des aiguilles d\'une montre).',
      'Tourner l\'antenne jusqu\'à cet angle, puis <b>VERROUILLER</b>. Une nouvelle station s\'affiche : recommencer (deux pointages).',
    ])}
    <table><caption>TABLEAU 1-3 — POINTAGE DE L'ANTENNE</caption>
      <tr><th>SYMB.</th><th class="gauche">STATION</th>${BANDES.map((b) => `<th>BANDE ${b}</th>`).join('')}</tr>${lignesStations}</table>

    <h3>1.3 Module 1C — Chiffreur</h3>
    ${procedure('1.3', [
      'Relever les <b>quatre symboles</b> des touches du chiffreur.',
      'Dans le <b>TABLEAU 1-4</b>, une seule colonne contient les quatre symboles.',
      'Enfoncer les touches dans l\'<b>ordre de cette colonne</b>, de haut en bas. Une touche dans le désordre : module bloqué 30 secondes, tout est à refaire.',
    ])}
    <table><caption>TABLEAU 1-4 — COLONNES DU CHIFFREUR</caption>
      <tr><th></th>${COLONNES_CHIFFREUR.map((_, k) => `<th>${['I', 'II', 'III', 'IV', 'V', 'VI'][k]}</th>`).join('')}</tr>${lignesColonnes}</table>
    <p class="manuscrit">→ le Ж et le Щ se ressemblent, regarder la queue ! — J.</p>`)
}

function sectionEnergie(): string {
  const lignesCodes = enDeuxColonnes(CODES_ENERGIE, (c) => (c ? `<td>${c.code}</td><td>${c.circuit}</td><td>${c.regle}</td>` : '<td></td><td></td><td></td>'))
  const lignesRegles = REGLES.map((r) => `<tr><td>${r}</td><td class="gauche">${TEXTES_REGLES[r]}</td></tr>`).join('')
  const pastille = (teinte: string) => `<span class="pastille-voyant" style="background:${teinte}"></span>`
  const lignesFusibles = TEMOINS.map((t) => `<tr><td class="gauche">${pastille(TEINTES_TEMOIN[t])}${t.toUpperCase()}</td><td class="gauche">${TEXTES_FUSIBLES[t]}</td></tr>`).join('')
  const lignesCouplage = BORNES.map((b, k) => `<tr><td><b>${b}</b></td>${ORDRES_COUPLAGE[k].map((o) => `<td>${o.map((i) => BORNES[i]).join(' · ')}</td>`).join('')}</tr>`).join('')
  return feuille('CA-MM-02', 'SECTION 2 — BLOC ÉNERGIE', '2-8', `
    <h3>2.1 Module 2A — Bornier du bus principal</h3>
    ${attention(`Une seule coupure par tour. Toute erreur (mauvais câble, ISOLER trop tôt) déclenche la protection du bus :
      module bloqué 30 secondes, le tour recommence.`)}
    ${procedure('2.1', [
      'Lire le <b>code de diagnostic</b> sur l\'écran DIAG du module 2A (format E-xxx).',
      'Chercher ce code dans le <b>TABLEAU 2-1</b> : il donne le <b>circuit</b> en défaut (α, β, γ ou δ) et la <b>règle</b> (R1 à R6).',
      'Relever les quatre <b>voyants de bus</b> V1 à V4 (allumé : orange ; éteint : sombre).',
      'Appliquer la règle du <b>TABLEAU 2-2</b> aux seuls câbles du circuit indiqué (étiquette à gauche du bornier : lettre du circuit et chiffre), comptés de haut en bas.',
      'Basculer <b>ISOLER</b>. Un <b>nouveau code</b> s\'affiche : reprendre en 2.1.1. Quand l\'écran affiche <b>BUS OK</b>, la réparation est terminée (2 ou 3 tours).',
    ])}
    <table><caption>TABLEAU 2-1 — CODES DE DIAGNOSTIC</caption>
      <tr><th>CODE</th><th>CIRC.</th><th>RÈGLE</th><th>CODE</th><th>CIRC.</th><th>RÈGLE</th></tr>${lignesCodes}</table>
    <table><caption>TABLEAU 2-2 — RÈGLES DE COUPURE</caption>
      <tr><th>RÈGLE</th><th class="gauche">CÂBLE À COUPER (DANS LE CIRCUIT INDIQUÉ)</th></tr>${lignesRegles}</table>
    <p class="manuscrit">→ attention : sur les capsules ${PREFIXE_R4_INVERSEE}…, la règle R4 est inversée (pair ↔ impair) ! — J.</p>
    <p class="petit">Le numéro de série est gravé sur la plaque de laiton, en haut du panneau. La pression se lit sur le grand
      cadran du module 3B SOUPAPE (bloc Moteur, plus bas sur le panneau) : zone rouge à droite.</p>

    <h3>2.2 Module 2B — Fusibles</h3>
    ${attention('Un fusible du mauvais calibre saute aussitôt : module bloqué 30 secondes.')}
    ${procedure('2.2', [
      'Repérer le <b>fusible grillé</b> (verre noirci, fil rompu) et son calibre, gravé dessous.',
      'Lire la <b>CHARGE</b> sur l\'écran (en ampères) et la couleur du voyant <b>TÉMOIN</b>.',
      'Le <b>TABLEAU 2-3</b> donne le calibre du fusible de rechange. Calibres du porte-fusibles : 10, 15, 20, 25, 30, 35, 40 et 45 A.',
      'Prendre ce calibre dans le <b>tiroir de rechange</b>. Si un second fusible grille, recommencer.',
    ])}
    <table><caption>TABLEAU 2-3 — CALIBRE DE RECHANGE</caption>
      <tr><th class="gauche">TÉMOIN</th><th class="gauche">FUSIBLE À REMETTRE</th></tr>${lignesFusibles}</table>
    <p class="manuscrit">→ CHARGE 27 A, témoin vert : 30 A. Témoin jaune : 35 A. Pas compliqué ! — J.</p>

    <h3>2.3 Module 2C — Accumulateurs</h3>
    ${attention('Un accumulateur branché hors de son tour fait disjoncter le couplage : module bloqué 30 secondes, tout est à refaire.')}
    ${procedure('2.3', [
      'Repérer l\'accumulateur <b>le plus chargé</b> (sa jauge, et sa charge en % sous la borne).',
      'Noter la <b>couleur de la cuve</b> de l\'accumulateur du <b>milieu</b> (borne ±).',
      'Le <b>TABLEAU 2-4</b> donne l\'<b>ordre de couplage</b>. Brancher les trois accumulateurs dans cet ordre, puis <b>COUPLER</b>.',
      'Les charges changent : recommencer (deux couplages).',
    ])}
    <table><caption>TABLEAU 2-4 — ORDRE DE COUPLAGE</caption>
      <tr><th>LE PLUS<br>CHARGÉ</th>${COULEURS_ACCUS.map((c) => `<th>MILIEU ${pastille(TEINTES_ACCUS[c])}${c.toUpperCase()}</th>`).join('')}</tr>${lignesCouplage}</table>`, true)
}

function sectionMoteur(): string {
  const pastille = (teinte: string) => `<span class="pastille-voyant" style="background:${teinte}"></span>`
  const lignesLeviers = SYMBOLES_SOUPAPE.map((sy, k) => `<tr><td class="symbole-manuel">${sy}</td>${COMBINAISONS[k].map((h) => `<td>${h ? '▲ H' : '▼ B'}</td>`).join('')}</tr>`).join('')
  const lignesPurge = ZONES_PURGE.map((z) => `<tr><td class="gauche">${z.titre}</td><td>entre ${z.bas} et ${z.haut}</td></tr>`).join('')
  const lignesInjecteurs = TEXTES_INJECTEURS.map((x) => `<tr><td>${x.orange}</td><td class="gauche">${x.couper}</td></tr>`).join('')
  return feuille('CA-MM-03', 'SECTION 3 — BLOC MOTEUR', '3-1', `
    <h3>3.1 Module 3A — Leviers</h3>
    ${procedure('3.1', [
      'Lire le <b>symbole</b> sur la plaque jaune du module <b>3B SOUPAPE</b>, à droite des leviers.',
      'Le <b>TABLEAU 3-1</b> donne la position de chacun des cinq leviers : en haut (H) ou en bas (B).',
      'Basculer les leviers, puis <b>ENCLENCHER</b>. Un nouveau symbole s\'affiche : recommencer (deux réglages).',
    ])}
    <table><caption>TABLEAU 3-1 — POSITION DES LEVIERS</caption>
      <tr><th>SYMB.</th>${LEVIERS.map((l) => `<th>${pastille(l.teinte)}${l.numero}</th>`).join('')}</tr>${lignesLeviers}</table>

    <h3>3.2 Module 3B — Soupape</h3>
    ${attention(`Soupape en défaut : surpression, l'aiguille de PRESSION reste dans la zone rouge (${ZONE_ROUGE} à 10).
      Relâcher la purge hors de la zone prescrite : module bloqué 30 secondes, la pression remonte.`)}
    ${procedure('3.2', [
      'Lire la <b>température</b> sur l\'écran TEMP du module.',
      'Le <b>TABLEAU 3-2</b> donne la zone où relâcher la purge, sur le cadran de PRESSION (graduations de 0 à 10).',
      'Tenir <b>PURGER</b> : l\'aiguille descend régulièrement. La <b>relâcher</b> quand elle est dans la zone.',
      'Une nouvelle température s\'affiche : recommencer (deux purges).',
    ])}
    <table><caption>TABLEAU 3-2 — ZONE DE PURGE</caption>
      <tr><th class="gauche">TEMPÉRATURE</th><th>RELÂCHER LA PURGE</th></tr>${lignesPurge}</table>
    <p class="manuscrit">→ l'aiguille va plus vite qu'on croit : lâcher en entrant dans la zone, pas au milieu ! — J.</p>

    <h3>3.3 Module 3C — Injecteurs</h3>
    ${procedure('3.3', [
      `Relever les voyants des six injecteurs J1 à J6 : ${pastille(TEINTES_INJECTEURS.vert)}vert, ${pastille(TEINTES_INJECTEURS.orange)}orange ou ${pastille(TEINTES_INJECTEURS.eteint)}éteint.`,
      'Compter les voyants <b>orange</b>. Le <b>TABLEAU 3-3</b> dit quels injecteurs couper.',
      'Couper ces injecteurs (et eux seuls), puis <b>AMORCER</b>. Les voyants changent : recommencer (deux amorçages).',
    ])}
    <table><caption>TABLEAU 3-3 — INJECTEURS À COUPER</caption>
      <tr><th>ORANGE</th><th class="gauche">COUPER</th></tr>${lignesInjecteurs}</table>`)
}

/**
 * Section 6 : le boîtier technique des engins à dépanner (satellites, stations ; missions RÉPARER des Ingénieurs).
 * Les tableaux sont lus dans donnees/depannage.ts : ce qui est écrit est exactement ce que le jeu attend.
 */
export function sectionEngins(): string {
  const lignesDisj = VOYANTS.map((v) => `<tr><td class="gauche"><span class="pastille-voyant" style="background:${v.teinte}"></span>${v.titre}</td>`
    + LES_BUS.map((b) => `<td>${DISJONCTEURS[v.voyant][b].join(' · ')}</td>`).join('') + '</tr>').join('')
  const lignesCablage = CABLES.map((c, k) => `<tr><td class="gauche"><span class="pastille-voyant" style="background:${c.teinte}"></span>${c.titre}</td>`
    + LES_BUS.map((b) => `<td>${CABLAGE[b][k]}</td>`).join('') + '</tr>').join('')
  const lignesGyro = enDeuxColonnes(SYMBOLES_GYRO.map((s, k) => ({ s, ab: CHIFFRES_GYRO.AB[k], cd: CHIFFRES_GYRO.CD[k] })),
    (x) => (x ? `<td class="symbole-manuel">${x.s}</td><td>${x.ab}</td><td>${x.cd}</td>` : '<td></td><td></td><td></td>'))
  return feuille('CA-MM-06', 'SECTION 6 — ENGINS À DÉPANNER', '6-1', `
    <h3>6.0 Le boîtier technique</h3>
    <p>Chaque satellite ou station porte un boîtier technique. Sa <b>plaque</b> indique la lettre de son <b>BUS</b> (A, B, C
      ou D) ; son <b>voyant de défaut</b> est allumé d'une couleur. Deux de ses trois modules sont en défaut : les régler
      selon les tableaux ci-dessous, puis appuyer sur <b>VÉRIFIER</b>. Une fausse manœuvre ne détruit rien, mais elle se
      voit dans le rapport d'intervention.</p>

    <h3>6.1 Module 6A — Disjoncteurs</h3>
    ${procedure('6.1', [
      'Lire la couleur du <b>voyant</b> et la lettre du <b>BUS</b> sur la plaque.',
      'Le <b>TABLEAU 6-1</b> donne les disjoncteurs à laisser <b>LEVÉS</b>. Tous les autres doivent être <b>BAISSÉS</b>.',
      'Basculer les leviers, puis appuyer sur <b>VÉRIFIER</b>.',
    ])}
    <table><caption>TABLEAU 6-1 — DISJONCTEURS LEVÉS</caption>
      <tr><th>VOYANT</th>${LES_BUS.map((b) => `<th>BUS ${b}</th>`).join('')}</tr>${lignesDisj}</table>

    <h3>6.2 Module 6B — Câblage</h3>
    ${attention('Voyant BLEU : les câbles destinés aux prises 1 et 4 sont ÉCHANGÉS.')}
    ${procedure('6.2', [
      'Lire la lettre du <b>BUS</b> sur la plaque.',
      'Le <b>TABLEAU 6-2</b> donne la prise de chaque câble. Toucher un câble, puis sa prise.',
      'Si le voyant est <b>BLEU</b>, échanger les prises 1 et 4 (le câble prévu pour la prise 1 va sur la 4, et inversement).',
      'Les quatre câbles branchés, appuyer sur <b>VÉRIFIER</b>.',
    ])}
    <table><caption>TABLEAU 6-2 — PRISES DES CÂBLES</caption>
      <tr><th>CÂBLE</th>${LES_BUS.map((b) => `<th>BUS ${b}</th>`).join('')}</tr>${lignesCablage}</table>

    <h3>6.3 Module 6C — Gyroscope</h3>
    ${procedure('6.3', [
      'L\'écran du gyroscope affiche <b>trois symboles</b>, de gauche à droite.',
      'Le <b>TABLEAU 6-3</b> donne le chiffre de chaque symbole : colonne <b>A·B</b> pour les bus A et B, colonne <b>C·D</b> pour les bus C et D.',
      'Régler les trois molettes sur ces chiffres, dans l\'ordre des symboles, puis appuyer sur <b>VÉRIFIER</b>.',
    ])}
    <table><caption>TABLEAU 6-3 — CALAGE DU GYROSCOPE</caption>
      <tr><th>SYMB.</th><th>A·B</th><th>C·D</th><th>SYMB.</th><th>A·B</th><th>C·D</th></tr>${lignesGyro}</table>`)
}

/** Le texte du manuel (HTML), avec un bouton pour revenir au panneau de réparation. */
export function htmlManuel(): string {
  return `
  <button type="button" class="vers-panneau" data-choix="panneau">⚙ PANNEAU DE RÉPARATION</button>
  ${feuille('CA-MM', 'SOMMAIRE', '0-1', `
    <h3>Sommaire</h3>
    <table class="sommaire">
      <tr><td>1</td><td class="gauche"><b>Communications — télégraphe, antenne, chiffreur</b></td><td>p. 1-2</td></tr>
      <tr><td>2</td><td class="gauche"><b>Énergie — bornier, fusibles, accumulateurs</b></td><td>p. 2-8</td></tr>
      <tr><td>3</td><td class="gauche"><b>Moteur — leviers, soupape, injecteurs</b></td><td>p. 3-1</td></tr>
      <tr><td>4</td><td class="gauche">Navigation — constellation, gyroscope, calculateur</td><td>en rédaction</td></tr>
      <tr><td>5</td><td class="gauche">Coque — vannes, brèche, sas</td><td>en rédaction</td></tr>
      <tr><td>6</td><td class="gauche"><b>Engins à dépanner — disjoncteurs, câblage, gyroscope</b></td><td>p. 6-1</td></tr>
    </table>
    <p class="petit">Le panneau compte cinq blocs de trois modules. Quand un bloc tombe en panne, un ou deux de ses modules
      sont en défaut (voyant rouge) ; le bloc remarche quand ils sont tous réparés. Toucher un module en défaut ouvre ses
      commandes.</p>
    <p class="petit">En attendant la rédaction des sections 4 et 5, ces blocs se réparent depuis l'onglet ÉTAT du volet
      Capsule (procédure provisoire).</p>`)}
  ${sectionCommunications()}
  ${sectionEnergie()}
  ${sectionMoteur()}
  ${sectionEngins()}`
}
