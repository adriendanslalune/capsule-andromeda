<script lang="ts">
  // X. HY-1 Circuit hydraulique.
  import { HYDRAULIQUE } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Bouton from '../schemas/Bouton.svelte'
  import Jauge from '../schemas/Jauge.svelte'
  import Motifs from '../schemas/Motifs.svelte'

  let { numero }: { numero: number } = $props()
  const H = HYDRAULIQUE
  const T = 40
  // Quelques tuyaux d'exemple (droits ou coudés).
  const exemples = ['h', 'cd', 'v', 'cg', 'v', 'h', 'h', 'cb', 'cd', 'v', 'cg', 'h']
</script>

<Page {numero} chapitre="X." titre="HY-1 — CIRCUIT HYDRAULIQUE">
  <svg class="planche" viewBox="0 0 344 160" aria-label="Planche du bloc HY-1">
    <Motifs />
    <Jauge x={50} y={56} r={34} nom="H" />
    <rect x="98" y="10" width="172" height="132" rx="5" fill="none" stroke="#1d1916" stroke-width="1.5" />
    <line x1="88" y1={16 + T * 1.5} x2="104" y2={16 + T * 1.5} stroke="#1d1916" stroke-width="7" />
    {#each exemples as e, k}
      {@const cx = 104 + (k % H.colonnes) * T + T / 2}
      {@const cy = 16 + Math.floor(k / H.colonnes) * T + T / 2}
      <rect x={cx - T / 2 + 1} y={cy - T / 2 + 1} width={T - 2} height={T - 2} rx="3" fill="#f8f5ec" stroke="#1d1916" stroke-width="0.6" />
      {#if e === 'h'}<line x1={cx - T / 2 + 2} y1={cy} x2={cx + T / 2 - 2} y2={cy} stroke="#1d1916" stroke-width="5" />
      {:else if e === 'v'}<line x1={cx} y1={cy - T / 2 + 2} x2={cx} y2={cy + T / 2 - 2} stroke="#1d1916" stroke-width="5" />
      {:else}
        {@const dx = e === 'cd' || e === 'cb' ? 1 : -1}
        {@const dy = e === 'cb' || e === 'cg' ? 1 : -1}
        <path d={`M ${cx + (dx * T) / 2 - dx * 2} ${cy} L ${cx} ${cy} L ${cx} ${cy + (dy * T) / 2 - dy * 2}`} fill="none" stroke="#1d1916" stroke-width="5" />
      {/if}
    {/each}
    {#each [0, 1, 2] as r}
      <rect x="276" y={22 + r * T} width="34" height="24" rx="3" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.2" />
      <text x="293" y={38 + r * T} text-anchor="middle" font-size="9" font-weight="700" font-family="Courier Prime, monospace">R-{r + 1}</text>
    {/each}
    <Bouton x={50} y={124} r={13} largeur={56} texte="VANNE" />
  </svg>
  <p>
    Une grille de tuyaux pivotants relie la source (à gauche) à trois réservoirs R-1, R-2, R-3 (à droite). Toucher un
    tuyau le fait pivoter d’un quart de tour. Symptôme : bloc HY-1 en avarie.
  </p>
  <ol>
    <li>Lire le manomètre H.</li>
    <li>Déterminer le réservoir à alimenter (tableau).</li>
    <li>Orienter les tuyaux pour relier la source à ce réservoir, et à lui seul.</li>
    <li>Ouvrir la VANNE.</li>
  </ol>
  <table>
    <thead><tr><th>MANOMÈTRE H</th><th>RÉSERVOIR</th></tr></thead>
    <tbody>
      <tr><td>sous {H.seuilR1}</td><td>R-1</td></tr>
      <tr><td>de {H.seuilR1} à {H.seuilR3}</td><td>R-2</td></tr>
      <tr><td>au-dessus de {H.seuilR3}</td><td>R-3</td></tr>
    </tbody>
  </table>
  <p class="exception">si S-2 est en position basse, alimenter le réservoir suivant (après R-3, revenir à R-1).</p>
  <p class="discret">Si l’eau atteint un mauvais réservoir, ou n’arrive nulle part, l’ouverture de la vanne est refusée.</p>
</Page>
