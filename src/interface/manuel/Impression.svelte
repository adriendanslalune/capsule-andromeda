<script lang="ts">
  // Impression du manuel : toutes les pages, au format A5, puis la fenêtre d'impression du navigateur (qui permet
  // aussi d'enregistrer en PDF). Invisible à l'écran.
  import { onMount, tick } from 'svelte'
  import { jeu } from '../jeu.svelte'
  import { PAGES } from './pages'

  onMount(() => {
    const fin = () => (jeu.impression = false)
    window.addEventListener('afterprint', fin, { once: true })
    // Laisser le temps aux polices et aux pages d'être prêtes.
    void tick().then(() => document.fonts.ready).then(() => window.print())
    return () => window.removeEventListener('afterprint', fin)
  })
</script>

<div class="impression">
  {#each PAGES as p, i}
    <div class="feuille"><p.composant numero={i + 1} /></div>
  {/each}
</div>

<style>
  @media screen {
    .impression {
      display: none;
    }
  }
  @media print {
    @page {
      size: A5;
      margin: 0;
    }
    :global(html),
    :global(body) {
      height: auto !important;
      background: #fff !important;
    }
    :global(#app) {
      height: auto !important;
      overflow: visible !important;
      padding: 0 !important;
    }
    :global(#app > :not(.impression)) {
      display: none !important;
    }
    .feuille {
      /* 400 px de maquette → 148 mm de papier. */
      zoom: 1.398;
      break-after: page;
    }
  }
</style>
