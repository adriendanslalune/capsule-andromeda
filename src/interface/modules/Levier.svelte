<script lang="ts">
  // Levier (ou interrupteur) à deux positions : haut ou bas. Plaque chromée à fente, pommeau en bakélite rouge.
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
    border: 0;
    padding: 0;
    border-radius: 10px;
    background: linear-gradient(150deg, var(--chrome-clair), var(--chrome) 40%, var(--chrome-sombre) 70%, var(--chrome) 100%);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.5);
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
    width: 7px;
    height: 7px;
    margin-left: -3.5px;
    border-radius: 50%;
    background: linear-gradient(45deg, transparent 42%, #333 43% 57%, transparent 58%), radial-gradient(circle at 35% 35%, #fff, #8a959b);
  }
  .levier::before {
    top: 3px;
  }
  .levier::after {
    bottom: 3px;
  }
  .fente {
    position: absolute;
    left: 50%;
    top: 14px;
    bottom: 14px;
    width: 12px;
    margin-left: -6px;
    border-radius: 6px;
    background: #080808;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.8) inset, 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  .manche {
    position: absolute;
    left: 50%;
    top: 8px;
    width: 40px;
    height: 40px;
    margin-left: -20px;
    border-radius: 50%;
    background: radial-gradient(circle at 34% 30%, #ffd8c8 0 6%, #f05a44 22%, var(--cerise) 55%, #5a120c 100%);
    box-shadow: 0 5px 8px rgba(0, 0, 0, 0.55);
    transition: top 0.18s cubic-bezier(0.5, 1.6, 0.6, 1);
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
