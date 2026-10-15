<script lang="ts">
  // Intercalaire MISSIONS : tout ce que le commissionnaire peut entreprendre, en quatre sous-onglets — CONTRATS (les
  // commissions de la semaine), SERVICES (les appels à l'aide du canal de détresse), DÉCOUVERTES (monolithes,
  // visiteur, artefacts, épaves) et HISTOIRES (les fils d'histoire au choix). Voir docs/conception-destin.md.
  import { jeu } from '../jeu.svelte'
  import Contrats from '../social/Contrats.svelte'
  import Decouvertes from './Decouvertes.svelte'
  import Histoires from './Histoires.svelte'
  import Services from './Services.svelte'

  const etat = $derived(jeu.etat!)
  const ONGLETS = [
    { id: 'contrats', nom: 'CONTRATS' },
    { id: 'services', nom: 'SERVICES' },
    { id: 'decouvertes', nom: 'DÉCOUVERTES' },
    { id: 'histoires', nom: 'HISTOIRES' },
  ] as const
</script>

<div class="page-onglets">
  <div class="sous-onglets" role="tablist">
    {#each ONGLETS as o}
      <button role="tab" aria-selected={jeu.ongletMissions === o.id} class:actif={jeu.ongletMissions === o.id} onclick={() => (jeu.ongletMissions = o.id)}>
        {o.nom}
        {#if o.id === 'contrats' && etat.contrats.length}<span class="pastille">{etat.contrats.length}</span>{/if}
      </button>
    {/each}
  </div>
  <div class="contenu">
    {#if jeu.ongletMissions === 'contrats'}<Contrats />
    {:else if jeu.ongletMissions === 'services'}<Services />
    {:else if jeu.ongletMissions === 'decouvertes'}<Decouvertes />
    {:else}<Histoires />{/if}
  </div>
</div>

<style>
  .page-onglets {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 8px var(--espace) 10px;
    gap: 8px;
  }
  .sous-onglets {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1fr 1.3fr 1fr;
    gap: 3px;
    border-bottom: 3px solid var(--couleur-encre);
  }
  .sous-onglets button {
    position: relative;
    min-height: 40px;
    padding: 0 2px;
    border: 2px solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 9px 9px 0 0;
    background: var(--couleur-papier-fonce);
    font-family: var(--police-titre);
    font-size: 10px;
    letter-spacing: 0.2px;
  }
  .sous-onglets button.actif {
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
  }
  .pastille {
    position: absolute;
    top: -7px;
    right: -3px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    border: 2px solid var(--couleur-encre);
    border-radius: 9px;
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-size: 10px;
  }
  .contenu {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
</style>
