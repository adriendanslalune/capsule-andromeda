<script lang="ts">
  // Levier (ou interrupteur) à deux positions : haut ou bas. Plaque à fente, pommeau rouge, à plat.
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
    width: 58px;
    height: 124px;
    border: var(--trait) solid var(--couleur-encre);
    padding: 0;
    border-radius: 12px;
    background: var(--couleur-papier-fonce);
    box-shadow: var(--ombre);
  }
  .levier.petit {
    width: 50px;
    height: 88px;
  }
  /* Vis de la plaque. */
  .levier::before,
  .levier::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    border-radius: 50%;
    background: var(--couleur-encre);
  }
  .levier::before {
    top: 4px;
  }
  .levier::after {
    bottom: 4px;
  }
  .fente {
    position: absolute;
    left: 50%;
    top: 15px;
    bottom: 15px;
    width: 12px;
    margin-left: -6px;
    border-radius: 6px;
    background: var(--couleur-encre);
  }
  .manche {
    position: absolute;
    left: 50%;
    top: 8px;
    width: 40px;
    height: 40px;
    margin-left: -20px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--cerise);
    transition: top 0.18s cubic-bezier(0.5, 1.6, 0.6, 1);
  }
  /* Petit éclat blanc. */
  .manche::after {
    content: '';
    position: absolute;
    left: 7px;
    top: 6px;
    width: 10px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    transform: rotate(-30deg);
  }
  .petit .manche {
    width: 32px;
    height: 32px;
    margin-left: -16px;
  }
  .manche.bas {
    top: calc(100% - 48px);
  }
  .petit .manche.bas {
    top: calc(100% - 40px);
  }
</style>
