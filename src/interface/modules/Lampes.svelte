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
    padding: 14px 8px 8px;
    border-radius: 12px;
    background: linear-gradient(180deg, #2c2420, #120d0a);
    box-shadow: 0 0 0 3px var(--chrome-sombre), 0 4px 10px rgba(0, 0, 0, 0.5);
  }
  .tube {
    height: 156px;
    border: 0;
    background: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
  }
  /* Ampoule de verre, lueur intérieure, filament. */
  .verre {
    position: relative;
    width: 56px;
    height: 98px;
    border-radius: 28px 28px 10px 10px;
    background: radial-gradient(ellipse at 50% 62%, var(--g) 0 22%, rgba(255, 255, 255, 0.08) 60%),
      linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.35) 25%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.12) 85%);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35) inset, 0 0 24px 4px var(--g);
  }
  .eteinte .verre {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.25) 25%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.1) 85%), #3a3530;
  }
  .fil {
    position: absolute;
    left: 50%;
    top: 26px;
    width: 14px;
    height: 46px;
    margin-left: -7px;
    border: 2px solid #9a8f80;
    border-bottom: 0;
    border-radius: 7px 7px 0 0;
  }
  /* Culot en bakélite à broches. */
  .culot {
    width: 46px;
    height: 20px;
    border-radius: 0 0 6px 6px;
    background: linear-gradient(180deg, #c9a14a, #8e6c25 30%, var(--bakelite-clair) 31%, var(--bakelite));
    box-shadow: 0 3px 4px rgba(0, 0, 0, 0.5);
  }
  .tube small {
    margin-top: 7px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 1px 6px;
    background: #000;
    color: #f2f2f2;
    border-radius: 2px;
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
