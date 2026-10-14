<script lang="ts">
  // Volets qui montent du bas : le manuel et le portefeuille.
  import { glisserPourFermer } from '../glisser'
  import { jeu } from '../jeu.svelte'
  import Manuel from '../volets/Manuel.svelte'
  import Portefeuille from '../volets/Portefeuille.svelte'

  const titres = { manuel: 'MANUEL', portefeuille: 'PORTEFEUILLE' } as const
  let volet = $state<HTMLElement>()
</script>

<div class="voile" role="presentation" onclick={() => jeu.fermer()}></div>
<section class="volet papier" bind:this={volet} aria-label={jeu.volet ? titres[jeu.volet] : ''}>
  <!-- Tirer la poignée vers le bas ferme le volet. -->
  <div class="prise" use:glisserPourFermer={{ sens: 'bas', cible: () => volet, fermer: () => jeu.fermer() }}>
    <div class="poignee"></div>
    <header>
      <span class="titre titre-pulp">{jeu.volet ? titres[jeu.volet] : ''}</span>
      <button class="bouton" onclick={() => jeu.fermer()}>FERMER</button>
    </header>
  </div>
  {#if jeu.volet === 'manuel'}<Manuel />
  {:else if jeu.volet === 'portefeuille'}<Portefeuille />
  {/if}
</section>

<style>
  .voile {
    position: absolute;
    z-index: 20;
    inset: 0;
    background: var(--couleur-encre);
    opacity: 0.45;
  }
  .volet {
    position: absolute;
    z-index: 20;
    left: 0;
    right: 0;
    top: 40px;
    bottom: 0;
    border-radius: 22px 22px 0 0;
    border: 3px solid var(--couleur-encre);
    border-bottom: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: monte 0.25s ease-out;
  }
  @keyframes monte {
    from { transform: translateY(100%); }
  }
  .prise {
    padding-bottom: 6px;
  }
  .poignee {
    width: 56px;
    height: 6px;
    border-radius: 3px;
    background: var(--couleur-encre);
    margin: 10px auto 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px 0;
  }
  .titre {
    font-size: 26px;
    letter-spacing: 1px;
  }
  header button {
    min-height: 40px;
    padding: 0 14px;
    font-size: 14px;
  }
</style>
