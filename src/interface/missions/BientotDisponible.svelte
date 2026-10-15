<script lang="ts">
  // Fiche « bientôt » : une rubrique annoncée, pas encore construite (voir docs/conception-destin.md).
  let { titre, texte, detail = '' }: { titre: string; texte: string; detail?: string } = $props()
</script>

<div class="bientot">
  <span class="tampon" aria-hidden="true">BIENTÔT</span>
  <b>{titre}</b>
  <p>{texte}</p>
  {#if detail}<p class="detail">{detail}</p>{/if}
</div>

<style>
  .bientot {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border: 2px dashed var(--couleur-encre-discrete);
    border-radius: 8px;
    background: rgba(250, 242, 220, 0.5);
  }
  b {
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 16px;
  }
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.35;
  }
  .detail {
    font-size: 12.5px;
    color: var(--couleur-texte-discret);
  }
  .tampon {
    position: absolute;
    right: 10px;
    top: 8px;
    padding: 1px 6px;
    border: 2px solid var(--cerise);
    border-radius: 4px;
    color: var(--cerise);
    font-family: var(--police-titre);
    font-size: 11px;
    transform: rotate(6deg);
    opacity: 0.8;
  }
</style>
