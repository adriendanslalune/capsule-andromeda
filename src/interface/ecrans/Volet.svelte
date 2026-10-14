<script lang="ts">
  // Volets qui montent du bas : Carte, Office, Manuel.
  import { jeu } from '../jeu.svelte'
  import Carte from '../volets/Carte.svelte'
  import Manuel from '../volets/Manuel.svelte'
  import Office from '../volets/Office.svelte'

  const titres = { carte: 'CARTE', office: 'OFFICE', manuel: 'MANUEL' } as const
</script>

<div class="voile" role="presentation" onclick={() => (jeu.volet = null)}></div>
<section class="volet" aria-label={jeu.volet ? titres[jeu.volet] : ''}>
  <div class="poignee"></div>
  <header>
    <span class="titre">{jeu.volet ? titres[jeu.volet] : ''}</span>
    <button onclick={() => (jeu.volet = null)}>FERMER</button>
  </header>
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
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    border-radius: 22px 22px 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: monte 0.25s ease-out;
  }
  @keyframes monte {
    from { transform: translateY(100%); }
  }
  .poignee {
    width: 44px;
    height: 5px;
    border-radius: 3px;
    background: #c9bb98;
    margin: 8px auto 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px 0;
  }
  .titre {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  header button {
    height: 36px;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 2px solid var(--couleur-encre);
    background: none;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
</style>
