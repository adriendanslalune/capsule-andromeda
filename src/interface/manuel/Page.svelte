<script lang="ts">
  // Une page du manuel d'entretien : format A5 (400 × 567 px à l'écran, 148 × 210 mm à l'impression), papier
  // blanc cassé, encre noire, en-tête de chapitre et pied de page. Aucune couleur : le manuel est imprimé en noir.
  import type { Snippet } from 'svelte'

  let { numero, chapitre = '', titre = '', children }: { numero: number | null; chapitre?: string; titre?: string; children: Snippet } = $props()
</script>

<article class="page-manuel">
  {#if titre}
    <header>
      <span class="chapitre">{chapitre}</span>
      <h2>{titre}</h2>
    </header>
  {/if}
  <div class="corps">{@render children()}</div>
  {#if numero !== null}
    <footer><span>C-58</span><span>— {numero} —</span><span>O.N.V.I.</span></footer>
  {/if}
</article>

<style>
  .page-manuel {
    position: relative;
    width: 400px;
    height: 567px;
    padding: 22px 24px 28px;
    background: #f8f5ec;
    color: #1d1916;
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 10.5px;
    line-height: 1.3;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    border-bottom: 1.5px solid #1d1916;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }
  .chapitre {
    font-family: 'Special Elite', 'Courier New', monospace;
    font-size: 16px;
  }
  h2 {
    margin: 0;
    font-family: 'Special Elite', 'Courier New', monospace;
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 0.5px;
  }
  .corps {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  footer {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #5f574f;
  }

  /* Éléments de texte communs à toutes les pages. */
  .corps :global(p) {
    margin: 0;
  }
  .corps :global(h3) {
    margin: 3px 0 0;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .corps :global(ol),
  .corps :global(ul) {
    margin: 0;
    padding-left: 22px;
  }
  .corps :global(li) {
    margin: 1px 0;
  }
  .corps :global(.discret) {
    font-size: 9.5px;
    color: #5f574f;
  }
  /* Encadré d'avertissement. */
  .corps :global(.attention) {
    border: 1.5px solid #1d1916;
    padding: 5px 8px;
    font-weight: 700;
  }
  .corps :global(.attention::before) {
    content: 'ATTENTION — ';
  }
  .corps :global(.exception) {
    border: 1.5px dashed #1d1916;
    padding: 5px 8px;
  }
  .corps :global(.exception::before) {
    content: 'EXCEPTION — ';
    font-weight: 700;
  }
  /* Tableaux. */
  .corps :global(table) {
    border-collapse: collapse;
    font-size: 9.5px;
  }
  .corps :global(th),
  .corps :global(td) {
    border: 1px solid #1d1916;
    padding: 1px 6px;
    text-align: left;
  }
  .corps :global(th) {
    background: #e7e1d1;
  }
  /* Planche (schéma). */
  .corps :global(.planche) {
    display: block;
    width: 100%;
  }
</style>
