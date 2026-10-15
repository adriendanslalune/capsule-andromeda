<script lang="ts">
  // XX (suite). Poste radio : écouter, émettre, et la fréquence du visiteur mois par mois.
  import { FREQUENCES_VISITEUR } from '../../../donnees/radio'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const MOIS = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE']
  const f2 = (n: number) => n.toFixed(2).replace('.', ',')
</script>

<Page {numero} chapitre="XX." titre="POSTE RADIO (SUITE)">
  <h3>Écouter</h3>
  <p>
    <b>Observatoire et transmissions</b> répètent leur dernier message : il faut être réglé dessus pour le recevoir
    (il s’imprime alors au journal de bord). Radio laissée sur l’une d’elles : chaque nouveau message arrive, même en
    votre absence.
  </p>
  <p>
    <b>Radio-Terre</b> donne les nouvelles et un <b>top horaire</b> en temps universel (TU). Ce top a voyagé depuis
    la Terre à la vitesse de la lumière : son retard sur l’heure TU est le délai radio jusqu’à la Terre
    (distance en UA = retard en minutes ÷ 8,3).
  </p>
  <h3>Émettre</h3>
  <p>
    ÉMETTRE lance un ping sur la fréquence réglée (une émission toutes les 5 minutes). Seul le visiteur répond, et
    seulement sur sa fréquence du mois (ci-dessous).
  </p>
  <h3>Fréquence du visiteur</h3>
  <p>Elle change chaque mois (saison) ; elle ne s’entend pas.</p>
  <table class="mois">
    <tbody>
      {#each [0, 1, 2, 3, 4, 5] as k}
        <tr><td>{MOIS[k]}</td><td class="f">{f2(FREQUENCES_VISITEUR[k])}</td><td>{MOIS[k + 6]}</td><td class="f">{f2(FREQUENCES_VISITEUR[k + 6])}</td></tr>
      {/each}
    </tbody>
  </table>
</Page>

<style>
  .mois {
    width: 100%;
  }
  .f {
    font-family: 'Courier Prime', monospace;
    font-weight: 700;
    text-align: right;
  }
</style>
