// Le Manuel (onglet Manuel ; maquette validée par Adrien le 18/10/2026) : un manuel de maintenance façon NASA des
// années 60, sur vieux papier crème. Il lit les mêmes données que le panneau (src/donnees/manuel-energie.ts) : ce qui
// y est écrit est exactement ce que le jeu attend. Pour l'instant : le sommaire et la section 4 (Énergie).

import { CODES_ENERGIE, PREFIXE_R4_INVERSEE, REGLES, TEXTES_REGLES } from '../donnees/manuel-energie'

/** Le texte du manuel (HTML), avec un bouton pour revenir au panneau de réparation. */
export function htmlManuel(): string {
  const moitie = Math.ceil(CODES_ENERGIE.length / 2)
  const lignesCodes = Array.from({ length: moitie }, (_, k) => {
    const a = CODES_ENERGIE[k], b = CODES_ENERGIE[k + moitie]
    const cellules = (c?: typeof a) => (c ? `<td>${c.code}</td><td>${c.circuit}</td><td>${c.regle}</td>` : '<td></td><td></td><td></td>')
    return `<tr>${cellules(a)}${cellules(b)}</tr>`
  }).join('')
  const lignesRegles = REGLES.map((r) => `<tr><td>${r}</td><td class="gauche">${TEXTES_REGLES[r]}</td></tr>`).join('')
  return `
  <button type="button" class="vers-panneau" data-choix="panneau">⚙ PANNEAU DE RÉPARATION</button>
  <div class="feuille">
    <div class="entete-doc">
      <div>CAPSULE ANDROMEDA — MANUEL DE MAINTENANCE</div><div>DOC. CA-MM</div>
      <div>SOMMAIRE</div><div>RÉV. C · 03/2026</div>
    </div>
    <h3>Sommaire</h3>
    <table class="sommaire">
      <tr><td>1</td><td class="gauche">Moteur — leviers, pression, température</td><td>en rédaction</td></tr>
      <tr><td>2</td><td class="gauche">Navigation — constellations, cadrans</td><td>en rédaction</td></tr>
      <tr><td>3</td><td class="gauche">Communications — télégraphe, fréquences</td><td>en rédaction</td></tr>
      <tr><td>4</td><td class="gauche"><b>Énergie — bus électrique principal</b></td><td>p. 4-8</td></tr>
      <tr><td>5</td><td class="gauche">Coque — vannes, manomètres</td><td>en rédaction</td></tr>
    </table>
    <p class="petit">En attendant la rédaction des sections 1, 2, 3 et 5, ces modules se réparent depuis l'onglet ÉTAT du
      volet Capsule (procédure provisoire).</p>
    <div class="pied-doc"><span>CA-MM RÉV. C</span><span>PAGE 0-1</span><span>NE PAS EMPORTER EN EVA</span></div>
  </div>

  <div class="feuille">
    <div class="entete-doc">
      <div>CAPSULE ANDROMEDA — MANUEL DE MAINTENANCE</div><div>DOC. CA-MM-04</div>
      <div>SECTION 4 — SOUS-SYSTÈME ÉNERGIE</div><div>RÉV. C · 03/2026</div>
    </div>
    <span class="tampon">CONFIDENTIEL</span>
    <h3>4.3 Rétablissement du bus électrique principal</h3>
    <div class="attention"><div class="bandeau-att">ATTENTION</div><div class="contenu-att">Une seule coupure par tour.
      Toute erreur (mauvais câble, ISOLER trop tôt) déclenche la protection du bus : module bloqué 30 secondes, le tour
      recommence.</div></div>
    <ol>
      <li><span>Lire le <b>code de diagnostic</b> sur l'écran DIAG du module 2 (format E-xxx).</span></li>
      <li><span>Chercher ce code dans le <b>TABLEAU 4-1</b> : il donne le <b>circuit</b> en défaut (α, β, γ ou δ) et la
        <b>règle</b> (R1 à R6).</span></li>
      <li><span>Relever les quatre <b>voyants de bus</b> V1 à V4 (allumé : orange ; éteint : sombre).</span></li>
      <li><span>Appliquer la règle du <b>TABLEAU 4-2</b> aux seuls câbles du circuit indiqué (étiquette à gauche du
        bornier : lettre du circuit et chiffre), comptés de haut en bas.</span></li>
      <li><span>Basculer <b>ISOLER</b>. Un <b>nouveau code</b> s'affiche : reprendre en 4.3.1. Quand l'écran affiche
        <b>BUS OK</b>, la réparation est terminée (2 ou 3 tours).</span></li>
    </ol>
    <table>
      <caption>TABLEAU 4-1 — CODES DE DIAGNOSTIC</caption>
      <tr><th>CODE</th><th>CIRC.</th><th>RÈGLE</th><th>CODE</th><th>CIRC.</th><th>RÈGLE</th></tr>
      ${lignesCodes}
    </table>
    <table>
      <caption>TABLEAU 4-2 — RÈGLES DE COUPURE</caption>
      <tr><th>RÈGLE</th><th class="gauche">CÂBLE À COUPER (DANS LE CIRCUIT INDIQUÉ)</th></tr>
      ${lignesRegles}
    </table>
    <p class="manuscrit">→ attention : sur les capsules ${PREFIXE_R4_INVERSEE}…, la règle R4 est inversée (pair ↔ impair) ! — J.</p>
    <p class="petit">Le numéro de série est gravé sur la plaque de laiton, en haut du panneau. La pression se lit sur le
      grand cadran du module 1 (Moteur) : zone rouge à droite.</p>
    <div class="pied-doc"><span>CA-MM-04 RÉV. C</span><span>PAGE 4-8</span><span>NE PAS EMPORTER EN EVA</span></div>
  </div>`
}
