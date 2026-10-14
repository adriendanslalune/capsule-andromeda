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
    padding: 14px 8px 10px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 14px;
    background: var(--nuit);
    box-shadow: var(--ombre);
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
  /* Ampoule : lueur en aplat, filament. */
  .verre {
    position: relative;
    width: 56px;
    height: 98px;
    border: var(--trait) solid var(--couleur-papier);
    border-radius: 28px 28px 10px 10px;
    background: var(--g);
  }
  .verre::before {
    content: '';
    position: absolute;
    left: 9px;
    top: 12px;
    width: 9px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    transform: rotate(-30deg);
  }
  .eteinte .verre {
    background: #3b4654;
  }
  .fil {
    position: absolute;
    left: 50%;
    top: 26px;
    width: 14px;
    height: 46px;
    margin-left: -7px;
    border: 2.5px solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 7px 7px 0 0;
  }
  .culot {
    width: 44px;
    height: 18px;
    border: var(--trait) solid var(--couleur-papier);
    border-top: 0;
    border-radius: 0 0 6px 6px;
    background: var(--moutarde);
  }
  .tube small {
    margin-top: 7px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--couleur-papier);
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
