<script lang="ts">
  // Notes de bord : page réglée, à remplir à la main (version imprimée).
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
</script>

<Page {numero} titre="NOTES DE BORD">
  <div class="lignes"></div>
</Page>

<style>
  .lignes {
    flex: 1;
    background: repeating-linear-gradient(180deg, transparent 0 21px, #8c8378 21px 22px);
  }
</style>
