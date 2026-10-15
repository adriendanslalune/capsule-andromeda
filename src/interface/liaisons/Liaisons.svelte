<script lang="ts">
  // Intercalaire LIAISONS (ex-SOCIAL) : le côté social du jeu, en trois sous-onglets — COMMUNICATION (télégrammes et
  // bulletins, ouvert par défaut), CLASSEMENT et TROPHÉES.
  import { jeu } from '../jeu.svelte'
  import { nonLus, telegrammesRecus } from '../reseau'
  import Classement from '../social/Classement.svelte'
  import Communication from '../social/Communication.svelte'
  import Trophees from '../volets/Trophees.svelte'

  const etat = $derived(jeu.etat!)
  const nouveaux = $derived(nonLus(etat, telegrammesRecus(etat, jeu.maintenant)))
  const ONGLETS = [
    { id: 'communication', nom: 'COMMUNICATION' },
    { id: 'classement', nom: 'CLASSEMENT' },
    { id: 'trophees', nom: 'TROPHÉES' },
  ] as const
</script>

<div class="page-onglets">
  <div class="sous-onglets" role="tablist">
    {#each ONGLETS as o}
      <button role="tab" aria-selected={jeu.ongletLiaisons === o.id} class:actif={jeu.ongletLiaisons === o.id} onclick={() => (jeu.ongletLiaisons = o.id)}>
        {o.nom}
        {#if o.id === 'communication' && nouveaux}<span class="pastille">{nouveaux}</span>{/if}
      </button>
    {/each}
  </div>
  <div class="contenu" class:plein={jeu.ongletLiaisons === 'communication'}>
    {#if jeu.ongletLiaisons === 'communication'}<Communication />
    {:else if jeu.ongletLiaisons === 'classement'}<Classement />
    {:else}<Trophees />{/if}
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
    grid-template-columns: 1.3fr 1fr 1fr;
    gap: 4px;
    border-bottom: 3px solid var(--couleur-encre);
  }
  .sous-onglets button {
    position: relative;
    min-height: 40px;
    border: 2px solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 9px 9px 0 0;
    background: var(--couleur-papier-fonce);
    font-family: var(--police-titre);
    font-size: 11px;
    letter-spacing: 0.3px;
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
    background: var(--moutarde);
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
  .contenu.plein {
    overflow: hidden;
  }
</style>
