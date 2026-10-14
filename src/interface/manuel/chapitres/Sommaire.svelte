<script lang="ts">
  // Avertissement et sommaire (les chapitres viennent de la liste des pages).
  import Page from '../Page.svelte'
  import { PAGES } from '../pages'

  let { numero }: { numero: number } = $props()
  const chapitres = PAGES.map((p, i) => ({ ...p, page: i + 1 })).filter((p) => p.chapitre && !p.suite)
</script>

<Page {numero} titre="AVERTISSEMENT ET SOMMAIRE">
  <p>
    Le présent manuel décrit le poste de pilotage de la fusée de croisière C-58 et les procédures de dépannage de
    chacun de ses blocs. Il est rédigé pour le commissionnaire en vol, qui ne dispose d’aucune autre aide.
  </p>
  <p>
    Les procédures doivent être suivies <b>à la lettre</b>, dans l’ordre indiqué. Plusieurs d’entre elles dépendent de
    l’état du bord (numéro de série, interrupteurs) : relever ces repères avant toute intervention (chapitre III).
  </p>
  <p class="discret">
    Sur les planches, les zones colorées des cadrans sont figurées par des motifs : hachures = zone ROUGE ;
    pointillés = zone BLEUE ; traits horizontaux = zone VERTE.
  </p>
  <h3>Sommaire</h3>
  <table class="sommaire">
    <tbody>
      {#each chapitres as c}
        <tr><td class="num">{c.chapitre}</td><td>{c.titre}</td><td class="page">{c.page}</td></tr>
      {/each}
    </tbody>
  </table>
</Page>

<style>
  .sommaire {
    width: 100%;
  }
  .sommaire td {
    border: 0;
    border-bottom: 1px dotted #1d1916;
    padding: 0 4px;
    line-height: 1.3;
  }
  .num {
    width: 40px;
    font-weight: 700;
  }
  .page {
    text-align: right;
    width: 30px;
  }
</style>
