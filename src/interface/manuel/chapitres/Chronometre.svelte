<script lang="ts">
  // XIII. CR-1 Chronomètre de bord.
  import { CHRONOMETRE } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Bouton from '../schemas/Bouton.svelte'

  let { numero }: { numero: number } = $props()
  const fuseaux = [
    ['France, Belgique, Suisse (heure d’hiver)', 'retirer 1 h'],
    ['France, Belgique, Suisse (heure d’été)', 'retirer 2 h'],
    ['Royaume-Uni (hiver) · Portugal (hiver)', 'rien à changer'],
    ['La Réunion', 'retirer 4 h'],
    ['Martinique, Guadeloupe', 'ajouter 4 h'],
    ['Québec (heure d’hiver)', 'ajouter 5 h'],
    ['Québec (heure d’été)', 'ajouter 4 h'],
  ]
</script>

<Page {numero} chapitre="XIII." titre="CR-1 — CHRONOMÈTRE DE BORD">
  <svg class="planche" viewBox="0 0 344 100" aria-label="Planche du bloc CR-1">
    <rect x="102" y="4" width="140" height="44" rx="5" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" />
    <text x="172" y="35" text-anchor="middle" font-size="24" font-weight="700" font-family="Courier Prime, monospace">14:27</text>
    {#each ['H+', 'M+', 'H−', 'M−'] as b, i}<Bouton x={124 + (i % 2) * 96} y={62 + Math.floor(i / 2) * 22} r={9} largeur={70} texte={b} />{/each}
    <Bouton x={290} y={72} r={11} largeur={64} texte="RECALER" />
  </svg>
  <p>
    Le chronomètre de bord doit indiquer l’heure de l’Office : l’heure UTC (temps universel), corrigée selon l’appareil.
    Symptôme : il affiche une heure fausse, bloc CR-1 en avarie.
  </p>
  <ol>
    <li>Prendre l’heure locale sur une montre ou un téléphone.</li>
    <li>La convertir en heure UTC (tableau).</li>
    <li>Ajouter autant de minutes que le dernier chiffre du n° de série.</li>
    <li>Régler heures et minutes avec H+ H− M+ M−, puis presser RECALER. {CHRONOMETRE.tolerance} minute d’écart est tolérée.</li>
  </ol>
  <table>
    <thead><tr><th>LIEU</th><th>POUR OBTENIR L’HEURE UTC</th></tr></thead>
    <tbody>{#each fuseaux as [lieu, regle]}<tr><td>{lieu}</td><td>{regle}</td></tr>{/each}</tbody>
  </table>
  <p class="discret">Exemple : à Paris en hiver, il est 15 h 20. UTC : 14 h 20. N° de série terminé par 7 : régler 14 h 27.</p>
</Page>
