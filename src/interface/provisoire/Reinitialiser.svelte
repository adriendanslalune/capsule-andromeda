<script lang="ts">
  // ⚠ PROVISOIRE — demandé par Adrien le 15/10/2026 pour essayer le jeu depuis le début.
  // À RETIRER DÈS QU'IL LE DEMANDE, avec le saut d'essai : supprimer ce dossier (src/interface/provisoire/) et les
  // lignes « PROVISOIRE » de src/interface/volets/Carte.svelte et de src/interface/jeu.svelte.ts.
  // Efface la partie de cet appareil (après confirmation) et revient à la lettre de l'Office.
  import { jeu } from '../jeu.svelte'

  let confirmer = $state(false)
</script>

<div class="testeur">
  <span class="titre">TESTEUR <small>provisoire</small></span>
  {#if !confirmer}
    <button class="principal" onclick={() => (confirmer = true)}>RÉINITIALISER LE JEU</button>
  {:else}
    <span class="question">Tout effacer et recommencer depuis le début ?</span>
    <button class="non" onclick={() => (confirmer = false)}>NON</button>
    <button class="principal" onclick={() => jeu.reinitialiser()}>OUI, EFFACER</button>
  {/if}
</div>

<style>
  .testeur {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 2px dashed var(--cerise);
    border-radius: 8px;
  }
  .titre {
    width: 100%;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--cerise);
  }
  .titre small {
    font-weight: 400;
    letter-spacing: 0;
  }
  .question {
    width: 100%;
    font-size: 14px;
    font-weight: 700;
  }
  button {
    flex: 1;
    min-height: 44px;
    padding: 0 12px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .principal {
    background: var(--cerise);
    color: var(--couleur-papier);
  }
  .non {
    background: var(--couleur-papier);
    color: var(--couleur-encre);
  }
</style>
