<script lang="ts">
  // LP-1 Lampes à vide : six lampes L-1 à L-6 et le ventilateur VT.
  import { basculerVentilateur, toucherLampe } from '../../moteur/modules/lp1'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const LUEURS = { orange: '#e8a07a', eteinte: '#b9bebd', bleue: '#7fb0e0', verte: '#8cd08a' } as const
  const lp1 = $derived(jeu.etat!.modules.lp1)
  const s = new Secousse()
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="lampes">
    {#each lp1.lampes as l, i}
      <button class="tube" style={`--g: ${LUEURS[l]}`} class:eteinte={l === 'eteinte'} aria-label={`Lampe L-${i + 1}`}
        onclick={() => geste(s, (m, c) => { const r = toucherLampe(m.lp1, i, c); return { modules: { ...m, lp1: r.etat }, evenements: r.evenements } })}>
        <span class="verre"><span class="fil"></span></span>
        <span class="culot"></span>
        <small>L-{i + 1}</small>
      </button>
    {/each}
  </div>
  <div class="mod-rang">
    <div class="mod-cellule">
      <button class="mod-bouton" class:enfonce={lp1.ventilateur} aria-pressed={lp1.ventilateur}
        onclick={() => geste(s, (m) => { const r = basculerVentilateur(m.lp1); return { modules: { ...m, lp1: r.etat }, evenements: r.evenements } })}>
        <span class="helice" class:tourne={lp1.ventilateur}>✣</span>
      </button>
      <span class="mod-plaque">VT</span>
    </div>
  </div>
</div>

<style>
  .lampes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    padding: 10px 0;
  }
  .tube {
    height: 150px;
    border: 0;
    background: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
  }
  .verre {
    position: relative;
    width: 56px;
    height: 96px;
    border-radius: 28px 28px 10px 10px;
    border: 3px solid var(--couleur-encre);
    background: radial-gradient(circle at 50% 60%, var(--g) 0 30%, #f6efdc 70%);
    box-shadow: 0 0 18px var(--g);
  }
  .eteinte .verre {
    box-shadow: none;
    background: #d8d4c8;
  }
  .fil {
    position: absolute;
    left: 50%;
    top: 30px;
    width: 3px;
    height: 40px;
    margin-left: -1.5px;
    background: var(--couleur-encre);
  }
  .culot {
    width: 44px;
    height: 18px;
    background: #8a8173;
    border: 3px solid var(--couleur-encre);
    border-top: 0;
  }
  .tube small {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 700;
  }
  .helice {
    display: inline-block;
    font-size: 26px;
  }
  .helice.tourne {
    animation: tourne 0.6s linear infinite;
  }
  @keyframes tourne {
    to { transform: rotate(360deg); }
  }
</style>
