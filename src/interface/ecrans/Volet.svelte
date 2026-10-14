<script lang="ts">
  // Volets qui montent du bas : Carte, Office, Manuel.
  import { glisserPourFermer } from '../glisser'
  import { jeu } from '../jeu.svelte'
  import Carte from '../volets/Carte.svelte'
  import Manuel from '../volets/Manuel.svelte'
  import Office from '../volets/Office.svelte'

  const titres = { carte: 'CARTE', office: 'OFFICE', manuel: 'MANUEL' } as const
  let volet = $state<HTMLElement>()
</script>

<div class="voile" role="presentation" onclick={() => jeu.fermer()}></div>
<section class="volet papier-pulp" bind:this={volet} aria-label={jeu.volet ? titres[jeu.volet] : ''}>
  <!-- Tirer la poignée vers le bas ferme le volet. -->
  <div class="prise" use:glisserPourFermer={{ sens: 'bas', cible: () => volet, fermer: () => jeu.fermer() }}>
    <div class="poignee"></div>
    <header>
      <span class="titre titre-pulp">{jeu.volet ? titres[jeu.volet] : ''}</span>
      <button class="poussoir" onclick={() => jeu.fermer()}>FERMER</button>
    </header>
  </div>
  {#if jeu.volet === 'carte'}<Carte />
  {:else if jeu.volet === 'office'}<Office />
  {:else if jeu.volet === 'manuel'}<Manuel />
  {/if}
</section>

<style>
  .voile {
    position: absolute;
    inset: 0;
    background: var(--couleur-fond);
    opacity: 0.55;
  }
  .volet {
    position: absolute;
    left: 0;
    right: 0;
    top: 40px;
    bottom: 0;
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.5);
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
    background: rgba(34, 22, 15, 0.35);
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
