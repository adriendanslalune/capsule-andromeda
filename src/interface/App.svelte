<script lang="ts">
  // Racine de l'interface : choisit l'écran à montrer.
  import { onMount } from 'svelte'
  import Fenetre from './ecrans/Fenetre.svelte'
  import Module from './ecrans/Module.svelte'
  import Ouverture from './ecrans/Ouverture.svelte'
  import Volet from './ecrans/Volet.svelte'
  import { jeu } from './jeu.svelte'

  onMount(() => jeu.demarrer())
</script>

{#if jeu.ecran.nom === 'ouverture' || !jeu.etat}
  <Ouverture />
{:else if jeu.ecran.nom === 'module'}
  <Module code={jeu.ecran.code} />
{:else if jeu.ecran.nom === 'dehors'}
  <!-- La vue 3D (et three.js) n'est chargée qu'à la première ouverture. -->
  {#await import('./ecrans/Dehors.svelte') then { default: Dehors }}
    <Dehors />
  {/await}
{:else}
  <Fenetre />
{/if}

{#if jeu.etat && jeu.volet}
  <Volet />
{/if}
