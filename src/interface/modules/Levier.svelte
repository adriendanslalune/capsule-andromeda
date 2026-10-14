<script lang="ts">
  // Levier (ou interrupteur) à deux positions : haut ou bas.
  let { haut, nom, onbascule, petit = false }: { haut: boolean; nom: string; onbascule: () => void; petit?: boolean } = $props()
</script>

<div class="mod-cellule">
  <button
    class="levier"
    class:petit
    aria-label={`${nom} ${haut ? 'en haut' : 'en bas'}`}
    aria-pressed={haut}
    onclick={onbascule}
  >
    <span class="fente"></span>
    <span class="manche" class:bas={!haut}></span>
  </button>
  <span class="mod-plaque">{nom}</span>
</div>

<style>
  .levier {
    position: relative;
    width: 56px;
    height: 120px;
    border: 0;
    background: none;
    padding: 0;
  }
  .levier.petit {
    width: 48px;
    height: 84px;
  }
  .fente {
    position: absolute;
    left: 50%;
    top: 8px;
    bottom: 8px;
    width: 14px;
    margin-left: -7px;
    border-radius: 7px;
    background: var(--couleur-encre);
  }
  .manche {
    position: absolute;
    left: 50%;
    top: 4px;
    width: 40px;
    height: 40px;
    margin-left: -20px;
    border-radius: 50%;
    background: var(--couleur-avarie);
    border: 2px solid var(--couleur-encre);
    transition: top 0.18s;
  }
  .petit .manche {
    width: 32px;
    height: 32px;
    margin-left: -16px;
  }
  .manche.bas {
    top: calc(100% - 44px);
  }
  .petit .manche.bas {
    top: calc(100% - 36px);
  }
</style>
