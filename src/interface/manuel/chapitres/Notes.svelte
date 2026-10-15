<script lang="ts">
  // Notes de bord : page réglée, à remplir à la main (version imprimée).
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
</script>

<Page {numero} titre="NOTES DE BORD">
  <div class="lignes"></div>
  <p class="credits">Images des astres : Solar System Scope (solarsystemscope.com, licence CC BY 4.0) et NASA (Terre : Blue Marble et Black Marble, par three.js).</p>
</Page>

<style>
  .lignes {
    flex: 1;
    background: repeating-linear-gradient(180deg, transparent 0 21px, #8c8378 21px 22px);
  }
  .credits {
    margin: 6px 0 0;
    font-size: 7.5px;
    color: #6b645b;
  }
</style>
